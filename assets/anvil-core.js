/**
 * anvil-core.js — Anvil runtime (every page, from layout/theme.liquid). Adds events, cart, sections, dom and
 * reveal {scan} to window.Anvil without overwriting what theme.liquid set, and registers:
 *   <anvil-drawer side close-at="990">  open(opener)/close()/toggle(); `open` attribute; panel = [data-anvil-panel] |
 *     .av-drawer__panel | <details> content (the <details> child is the JS-off fallback); adds .av-drawer__overlay;
 *     role=dialog, aria-modal, focus confined, page inert, scroll locked, Esc/overlay close; `close-at` closes it when
 *     the viewport reaches that width (the panel is hidden there by CSS). Emits anvil:drawer:opened|closed.
 *   <anvil-dialog no-light-dismiss>  native <dialog>: open(opener) → showModal + scroll lock; backdrop click closes;
 *     focus returns to the opener. Emits anvil:dialog:opened|closed.
 *   <anvil-collapsible single>  <details> group with animated height (the one height animation Anvil allows,
 *     CONVENTIONS §8; off under reduced motion and html[data-animations="off"]).
 *   <anvil-header sticky="always|scroll-up|never" transparent>  :root --av-header-height/--av-header-offset;
 *     .av-is-stuck / .av-is-hidden / .av-is-transparent; never hidden while focus is inside; desktop dropdowns
 *     (details.av-header__dropdown) close each other, on outside click and on Escape.
 *   <anvil-cart-bubble show-zero>  anvil:cart:updated → item_count into [data-anvil-count] and the hidden label.
 * Page-wide: [data-anvil-open="id"] → target.open(opener) (or showModal on a <dialog>), only when the target exists;
 * [data-anvil-close] → nearest ancestor's close(). Every anvil:cart:updated that carries `sections` swaps them in.
 * Reveal: .av-reveal / .av-reveal--* get .av-is-in in view; html.av-reveal-ready is set once the observer runs, and
 * the CSS only hides reveal targets under that class, so a failed load never leaves content invisible.
 * Videos inside [data-anvil-autoplay] play (muted, controls visible) while in view and only when motion is allowed.
 * Editor: section:load/unload → anvil:section:load|unload; section/block select force .av-is-in, open <details>,
 * scroll into view.
 *
 * The four core modules are loaded with dynamic import() from the versioned URLs theme.liquid puts in
 * window.Anvil.modules (and preloads with <link rel="modulepreload">), so a theme update never mixes a new core with
 * a cached older module.
 */
const Anvil = (window.Anvil ||= {});
Anvil.routes ||= {};
Anvil.strings ||= {};
Anvil.settings ||= {};
const urls = Anvil.modules || {};
const load = (name) => import(urls[name] || new URL(`./anvil-${name}.js`, import.meta.url).href);

const events = await load('events');
Anvil.events ||= events;
const [cart, sections, dom] = await Promise.all([load('cart-api'), load('sections'), load('dom')]);
for (const [key, value] of Object.entries({ cart, sections, dom })) Anvil[key] ||= value;

const { on, emit } = events;
const { confineFocus, releaseFocus, lockScroll, unlockScroll, motionOff, onReady, t } = dom;
const inerted = new WeakMap();

function inertOutside(el) {
  const touched = [];
  for (const node of document.body.children) {
    if (node.contains(el) || node.inert || node.tagName === 'SCRIPT') continue;
    node.inert = true;
    touched.push(node);
  }
  inerted.set(el, touched);
}

function restoreInert(el) {
  for (const node of inerted.get(el) || []) node.inert = false;
  inerted.delete(el);
}

class Drawer extends HTMLElement {
  #opener = null;
  #details = null;
  #active = false;
  #mq = null;

  connectedCallback() {
    this.#details = this.querySelector(':scope > details');
    if (!this.querySelector(':scope > .av-drawer__overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'av-drawer__overlay';
      overlay.setAttribute('data-anvil-close', '');
      this.prepend(overlay);
    }
    const at = parseInt(this.getAttribute('close-at'), 10);
    if (at > 0) {
      this.#mq = matchMedia(`(min-width: ${at}px)`);
      this.#mq.addEventListener('change', this.#onMedia);
    }
    if (this.#details) {
      this.#details.addEventListener('toggle', this.#onToggle);
      if (this.#details.open) this.#enter();
    } else if (this.hasAttribute('open')) this.#enter();
  }

  disconnectedCallback() {
    this.#details?.removeEventListener('toggle', this.#onToggle);
    this.#mq?.removeEventListener('change', this.#onMedia);
    if (this.#active) this.#leave(false);
  }

  get panel() {
    return (
      this.querySelector('[data-anvil-panel], .av-drawer__panel') ||
      this.#details?.querySelector(':scope > :not(summary)') || this.#details || this
    );
  }

  get isOpen() { return this.#details ? this.#details.open : this.hasAttribute('open'); }

  open(opener) {
    if (this.isOpen) return;
    this.#opener = opener instanceof Element ? opener : document.activeElement;
    if (this.#details) { this.#details.open = true; return; }
    this.setAttribute('open', '');
    this.#enter();
  }

  close() {
    if (!this.isOpen) return;
    if (this.#details) { this.#details.open = false; return; }
    this.removeAttribute('open');
    this.#leave(true);
  }

  toggle(opener) { this.isOpen ? this.close() : this.open(opener); }

  #onMedia = (e) => { if (e.matches) this.close(); };

  #onToggle = () => {
    if (this.#details.open) { this.setAttribute('open', ''); this.#enter(); }
    else { this.removeAttribute('open'); this.#leave(true); }
  };

  #enter() {
    if (this.#active) return;
    this.#active = true;
    const panel = this.panel;
    if (!panel.hasAttribute('role')) panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    if (!panel.hasAttribute('tabindex')) panel.tabIndex = -1;
    lockScroll();
    inertOutside(this);
    confineFocus(panel, { restore: this.#opener || undefined });
    document.addEventListener('keydown', this.#onKey);
    this.#opener?.setAttribute('aria-expanded', 'true');
    emit('anvil:drawer:opened', { id: this.id, element: this, opener: this.#opener });
  }

  #leave(restore) {
    if (!this.#active) return;
    this.#active = false;
    document.removeEventListener('keydown', this.#onKey);
    restoreInert(this);
    unlockScroll();
    releaseFocus(this.panel, { restore });
    this.#opener?.setAttribute('aria-expanded', 'false');
    emit('anvil:drawer:closed', { id: this.id, element: this, opener: this.#opener });
    this.#opener = null;
  }

  #onKey = (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented || e.target.closest?.('dialog[open]')) return;
    e.preventDefault();
    this.close();
  };
}

class Dialog extends HTMLElement {
  #opener = null;
  #locked = false;

  get dialog() { return this.querySelector('dialog'); }
  get isOpen() { return !!this.dialog?.open; }

  connectedCallback() {
    this.dialog?.addEventListener('close', this.#onClose);
    this.dialog?.addEventListener('click', this.#onClick);
  }

  disconnectedCallback() {
    this.dialog?.removeEventListener('close', this.#onClose);
    this.dialog?.removeEventListener('click', this.#onClick);
    this.#unlock();
  }

  #unlock() {
    if (!this.#locked) return;
    this.#locked = false;
    unlockScroll();
  }

  open(opener) {
    const dialog = this.dialog;
    if (!dialog || dialog.open) return;
    this.#opener = opener instanceof Element ? opener : document.activeElement;
    dialog.showModal();
    lockScroll();
    this.#locked = true;
    this.#opener?.setAttribute?.('aria-expanded', 'true');
    emit('anvil:dialog:opened', { id: this.id, element: this, opener: this.#opener });
  }

  close() { this.dialog?.close(); }
  toggle(opener) { this.isOpen ? this.close() : this.open(opener); }

  #onClose = () => {
    this.#unlock();
    const opener = this.#opener;
    this.#opener = null;
    opener?.setAttribute?.('aria-expanded', 'false');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    emit('anvil:dialog:closed', { id: this.id, element: this, opener });
  };

  #onClick = (e) => {
    const dialog = this.dialog;
    if (e.target !== dialog || this.hasAttribute('no-light-dismiss')) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) this.close();
  };
}

function durationMs(el) {
  const raw = getComputedStyle(el).getPropertyValue('--av-dur').trim();
  const n = parseFloat(raw);
  if (!raw || !Number.isFinite(n)) return 250;
  return raw.endsWith('ms') ? n : n * 1000;
}

class Collapsible extends HTMLElement {
  connectedCallback() { this.addEventListener('click', this.#onClick); }
  disconnectedCallback() { this.removeEventListener('click', this.#onClick); }

  #onClick = (e) => {
    const summary = e.target.closest('summary');
    if (!summary || summary.closest('anvil-collapsible') !== this || e.defaultPrevented) return;
    const details = summary.parentElement;
    if (!(details instanceof HTMLDetailsElement)) return;
    e.preventDefault();
    if (details.classList.contains('av-is-animating')) return;
    const open = !details.open;
    if (open && this.hasAttribute('single')) {
      for (const other of this.querySelectorAll('details[open]')) {
        if (other !== details && other.closest('anvil-collapsible') === this) this.set(other, false);
      }
    }
    this.set(details, open);
  };

  set(details, open) {
    if (details.open === open) return;
    const body = details.querySelector(':scope > :not(summary)');
    const ms = durationMs(this);
    if (!body || !body.animate || !ms || motionOff()) {
      details.open = open;
    } else {
      const easing = getComputedStyle(this).getPropertyValue('--av-ease').trim() || 'ease';
      details.classList.add('av-is-animating');
      if (open) details.open = true;
      else details.classList.add('av-is-closing');
      const h = body.getBoundingClientRect().height;
      const frames = [
        { height: '0px', opacity: 0, overflow: 'hidden' },
        { height: `${h}px`, opacity: 1, overflow: 'hidden' },
      ];
      body
        .animate(frames, { duration: ms, easing, direction: open ? 'normal' : 'reverse' })
        .finished.then(() => { if (!open) details.open = false; }, () => {})
        .finally(() => details.classList.remove('av-is-animating', 'av-is-closing'));
    }
    this.dispatchEvent(new CustomEvent('anvil:collapsible:toggle', { bubbles: true, detail: { details, open } }));
  }
}

const DROPDOWN = 'details.av-header__dropdown';

class Header extends HTMLElement {
  #ro;
  #raf = 0;
  #lastY = 0;
  #off;

  connectedCallback() {
    this.#ro = new ResizeObserver(() => this.#measure());
    this.#ro.observe(this);
    window.addEventListener('scroll', this.#onScroll, { passive: true });
    this.addEventListener('focusin', this.#reveal);
    this.addEventListener('toggle', this.#onToggle, true);
    this.addEventListener('keydown', this.#onKey);
    document.addEventListener('click', this.#onDocClick);
    this.#off = on('anvil:drawer:opened', this.#reveal);
    this.#measure();
    this.#update();
  }

  disconnectedCallback() {
    this.#ro?.disconnect();
    window.removeEventListener('scroll', this.#onScroll);
    this.removeEventListener('focusin', this.#reveal);
    this.removeEventListener('toggle', this.#onToggle, true);
    this.removeEventListener('keydown', this.#onKey);
    document.removeEventListener('click', this.#onDocClick);
    cancelAnimationFrame(this.#raf);
    this.#off?.();
  }

  get mode() { return (this.dataset.anvilSticky || this.getAttribute('sticky') || 'always').replace('_', '-'); }

  #reveal = () => this.classList.remove('av-is-hidden');

  #onToggle = (e) => {
    const opened = e.target;
    if (!opened.matches?.(DROPDOWN) || !opened.open) return;
    for (const other of this.querySelectorAll(`${DROPDOWN}[open]`)) if (other !== opened) other.open = false;
  };

  #onDocClick = (e) => {
    for (const open of this.querySelectorAll(`${DROPDOWN}[open]`)) if (!open.contains(e.target)) open.open = false;
  };

  #onKey = (e) => {
    if (e.key !== 'Escape') return;
    const open = e.target.closest?.(`${DROPDOWN}[open]`);
    if (!open) return;
    open.open = false;
    open.querySelector('summary')?.focus();
  };

  #measure() {
    const h = Math.round(this.getBoundingClientRect().height);
    const root = document.documentElement.style;
    root.setProperty('--av-header-height', `${h}px`);
    root.setProperty('--av-header-offset', this.mode === 'never' ? '0px' : `${h}px`);
  }

  #onScroll = () => {
    if (this.#raf) return;
    this.#raf = requestAnimationFrame(() => { this.#raf = 0; this.#update(); });
  };

  #update() {
    const y = Math.max(0, window.scrollY);
    const h = this.offsetHeight || 1;
    const mode = this.mode;
    this.classList.toggle('av-is-stuck', mode !== 'never' && y > h);
    if (mode !== 'scroll-up' || this.contains(document.activeElement)) this.classList.remove('av-is-hidden');
    else if (y > this.#lastY + 4 && y > h * 2) this.classList.add('av-is-hidden');
    else if (y < this.#lastY - 4 || y <= h) this.classList.remove('av-is-hidden');
    const transparent = this.hasAttribute('data-anvil-transparent') || this.hasAttribute('transparent');
    this.classList.toggle('av-is-transparent', transparent && y <= 8);
    this.#lastY = y;
  }
}

class CartBubble extends HTMLElement {
  #off;
  connectedCallback() { this.#off = on('anvil:cart:updated', this.#onCart); }
  disconnectedCallback() { this.#off?.(); }

  #onCart = ({ cart }) => {
    if (cart && typeof cart.item_count === 'number') this.render(cart.item_count);
  };

  render(count) {
    const slot = this.querySelector('[data-anvil-count]');
    (slot || this).textContent = String(count);
    slot?.setAttribute('data-anvil-count', String(count));
    this.hidden = count === 0 && !this.hasAttribute('show-zero');
    const label = count === 1
      ? t(['cart_count_one', 'cartCountOne'], { count }, '[count] item')
      : t(['cart_count_other', 'cartCount'], { count }, '[count] items');
    const text = this.querySelector('.av-visually-hidden');
    if (text) text.textContent = label;
  }
}

const REVEAL = '.av-reveal, [class*="av-reveal--"]';
let observer;
const markIn = (el) => el.classList.add('av-is-in');

function revealTargets(root) {
  const list = [...root.querySelectorAll(REVEAL)];
  if (root instanceof Element && root.matches(REVEAL)) list.unshift(root);
  return list.filter((el) => !el.classList.contains('av-reveal--none'));
}

function scan(root = document) {
  for (const el of revealTargets(root)) {
    if (el.classList.contains('av-is-in')) continue;
    if (motionOff()) { markIn(el); continue; }
    observer ||= new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        markIn(entry.target);
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    observer.observe(el);
  }
  document.documentElement.classList.add('av-reveal-ready');
}

let videoIO;
function autoplay(root = document) {
  const list = root.querySelectorAll('[data-anvil-autoplay] video');
  if (!list.length) return;
  videoIO ||= new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting && !motionOff()) {
        target.muted = true;
        target.play()?.catch(() => {});
      } else target.pause();
    }
  }, { threshold: 0.25 });
  for (const video of list) videoIO.observe(video);
}

function onTriggerClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const opener = e.target.closest('[data-anvil-open]');
  if (opener) {
    const target = document.getElementById(opener.dataset.anvilOpen);
    if (!target) return;
    if (target instanceof HTMLDialogElement) {
      e.preventDefault();
      target.open ? target.close() : target.showModal();
    } else if (typeof target.open === 'function') {
      e.preventDefault();
      if (opener.getAttribute('aria-expanded') === 'true' && typeof target.close === 'function') target.close();
      else target.open(opener);
    }
    return;
  }
  const closer = e.target.closest('[data-anvil-close]');
  if (!closer) return;
  let node = closer.parentElement;
  while (node && typeof node.close !== 'function') node = node.parentElement;
  if (node) { e.preventDefault(); node.close(); }
}

function onEditorEvent(e) {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const sectionId = e.detail?.sectionId;
  if (e.type === 'shopify:section:load') {
    scan(target);
    autoplay(target);
    emit('anvil:section:load', { sectionId, element: target });
    return;
  }
  if (e.type === 'shopify:section:unload') {
    emit('anvil:section:unload', { sectionId, element: target });
    return;
  }
  const block = e.type === 'shopify:block:select';
  revealTargets(target.closest('.shopify-section') || target).forEach(markIn);
  const details = target.closest('details') || (block ? target.querySelector('details') : null);
  if (details) details.open = true;
  if (block && !e.detail?.load) target.scrollIntoView({ block: 'center', behavior: motionOff() ? 'auto' : 'smooth' });
}

Anvil.reveal ||= { scan };

const define = (name, cls) => customElements.get(name) || customElements.define(name, cls);
define('anvil-drawer', Drawer);
define('anvil-dialog', Dialog);
define('anvil-collapsible', Collapsible);
define('anvil-header', Header);
define('anvil-cart-bubble', CartBubble);

document.addEventListener('click', onTriggerClick);
for (const type of ['shopify:section:load', 'shopify:section:unload', 'shopify:section:select', 'shopify:block:select']) {
  document.addEventListener(type, onEditorEvent);
}
on('anvil:cart:updated', ({ sections: html }) => {
  for (const id in html || {}) if (html[id] != null) sections.swapSection(id, html[id]);
});
on('anvil:section:swapped', ({ element }) => { scan(element); autoplay(element); });
if (window.Shopify?.designMode) document.documentElement.classList.add('av-design-mode');
onReady(() => { scan(); autoplay(); });
