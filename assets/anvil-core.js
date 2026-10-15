/**
 * anvil-core.js — Anvil runtime (every page, from layout/theme.liquid). Adds events, cart, sections, dom and
 * reveal {scan} to window.Anvil without overwriting what theme.liquid set, and registers:
 *   <anvil-drawer side>  open(opener)/close()/toggle(); `open` attribute; panel = [data-anvil-panel] | .av-drawer__panel
 *     | <details> content (the <details> child is the JS-off fallback); adds .av-drawer__overlay; role=dialog, aria-modal,
 *     focus confined, page inert, scroll locked, Esc/overlay close. Emits anvil:drawer:opened|closed {id, element, opener}.
 *   <anvil-dialog no-light-dismiss>  native <dialog>: open(opener) → showModal + scroll lock; backdrop click closes;
 *     focus returns to the opener. Emits anvil:dialog:opened|closed.
 *   <anvil-collapsible single>  <details> group with animated height (off under reduced motion / data-animations="off").
 *   <anvil-header sticky="always|scroll-up|never" transparent>  :root --av-header-height/--av-header-offset;
 *     .is-stuck / .is-hidden / .is-transparent (data-anvil-* attribute forms also read).
 *   <anvil-cart-bubble show-zero>  anvil:cart:updated → item_count into [data-anvil-count]; hidden at 0.
 * Page-wide: [data-anvil-open="id"] → target.open(opener) (or showModal on a <dialog>), only when the target exists;
 * [data-anvil-close] → nearest ancestor's close(). Reveal: .av-reveal / .av-reveal--* get .is-in in view. Editor:
 * section:load/unload → anvil:section:load|unload; section/block select force .is-in, open <details>, scroll into view.
 */
import * as events from './anvil-events.js';
import * as cart from './anvil-cart-api.js';
import * as sections from './anvil-sections.js';
import * as dom from './anvil-dom.js';

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

  connectedCallback() {
    this.#details = this.querySelector(':scope > details');
    if (!this.querySelector(':scope > .av-drawer__overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'av-drawer__overlay';
      overlay.setAttribute('data-anvil-close', '');
      this.prepend(overlay);
    }
    if (this.#details) {
      this.#details.addEventListener('toggle', this.#onToggle);
      if (this.#details.open) this.#enter();
    } else if (this.hasAttribute('open')) this.#enter();
  }

  disconnectedCallback() {
    this.#details?.removeEventListener('toggle', this.#onToggle);
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
    emit('anvil:dialog:opened', { id: this.id, element: this, opener: this.#opener });
  }

  close() { this.dialog?.close(); }
  toggle(opener) { this.isOpen ? this.close() : this.open(opener); }

  #onClose = () => {
    this.#unlock();
    const opener = this.#opener;
    this.#opener = null;
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
    if (details.classList.contains('is-animating')) return;
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
      details.classList.add('is-animating');
      if (open) details.open = true;
      else details.classList.add('is-closing');
      const h = body.getBoundingClientRect().height;
      const frames = [
        { height: '0px', opacity: 0, overflow: 'hidden' },
        { height: `${h}px`, opacity: 1, overflow: 'hidden' },
      ];
      body
        .animate(frames, { duration: ms, easing, direction: open ? 'normal' : 'reverse' })
        .finished.then(() => { if (!open) details.open = false; }, () => {})
        .finally(() => details.classList.remove('is-animating', 'is-closing'));
    }
    this.dispatchEvent(new CustomEvent('anvil:collapsible:toggle', { bubbles: true, detail: { details, open } }));
  }
}

class Header extends HTMLElement {
  #ro;
  #raf = 0;
  #lastY = 0;
  #off;

  connectedCallback() {
    this.#ro = new ResizeObserver(() => this.#measure());
    this.#ro.observe(this);
    window.addEventListener('scroll', this.#onScroll, { passive: true });
    this.#off = on('anvil:drawer:opened', () => this.classList.remove('is-hidden'));
    this.#measure();
    this.#update();
  }

  disconnectedCallback() {
    this.#ro?.disconnect();
    window.removeEventListener('scroll', this.#onScroll);
    cancelAnimationFrame(this.#raf);
    this.#off?.();
  }

  get mode() { return (this.dataset.anvilSticky || this.getAttribute('sticky') || 'always').replace('_', '-'); }

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
    this.classList.toggle('is-stuck', mode !== 'never' && y > h);
    if (mode !== 'scroll-up') this.classList.remove('is-hidden');
    else if (y > this.#lastY + 4 && y > h * 2) this.classList.add('is-hidden');
    else if (y < this.#lastY - 4 || y <= h) this.classList.remove('is-hidden');
    const transparent = this.hasAttribute('data-anvil-transparent') || this.hasAttribute('transparent');
    this.classList.toggle('is-transparent', transparent && y <= 8);
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
    this.dataset.count = count;
    const label = t(count === 1 ? ['cart_count_one', 'cartCountOne'] : ['cart_count_other', 'cartCount'], { count }, '');
    const text = this.querySelector('.av-visually-hidden');
    if (label) {
      this.setAttribute('aria-label', label);
      if (text) text.textContent = label;
    } else if (text) text.textContent = text.textContent.replace(/\d+/, String(count));
  }
}

const REVEAL = '.av-reveal, [class*="av-reveal--"]';
let observer;
const markIn = (el) => el.classList.add('is-in');

function revealTargets(root) {
  const list = [...root.querySelectorAll(REVEAL)];
  if (root instanceof Element && root.matches(REVEAL)) list.unshift(root);
  return list.filter((el) => !el.classList.contains('av-reveal--none'));
}

function scan(root = document) {
  for (const el of revealTargets(root)) {
    if (el.classList.contains('is-in')) continue;
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

const Anvil = (window.Anvil ||= {});
Anvil.routes ||= {};
Anvil.strings ||= {};
Anvil.settings ||= {};
for (const [key, value] of Object.entries({ events, cart, sections, dom, reveal: { scan } })) Anvil[key] ||= value;

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
on('anvil:section:swapped', ({ element }) => scan(element));
if (window.Shopify?.designMode) document.documentElement.classList.add('av-design-mode');
onReady(() => scan());
