/**
 * anvil-cart-drawer.js — <anvil-cart-drawer>: the cart drawer around a native modal <dialog>
 * (sections/anvil-cart-drawer.liquid, loaded with <script type="module"> from that section).
 *
 * open(opener) → showModal + scroll lock; close() → dialog.close(); focus returns to the opener (or to the element
 * focused when the drawer opened itself; when that is hidden by now, to the [aria-controls] control of its container). aria-expanded is written only on an explicit opener that declares
 * aria-haspopup (the header cart link), never on an Add to cart button the drawer happened to open after. Closes with Esc (native), the close button ([data-anvil-close], handled by anvil-core.js) and a click on
 * the backdrop. Opens after an add-to-cart (anvil:cart:updated with source "add") when
 * window.Anvil.settings.openCartOnAdd is true. Re-renders swap only the children of the inner
 * [data-anvil-section="anvil-cart-drawer"] frame (anvil-core.js), so the dialog stays open; a cart change that did not
 * carry the drawer's markup (a gift added by anvil-gifts.js, for example) re-fetches it. Steppers, removal, the note
 * and the discount field belong to <anvil-cart-form> (assets/anvil-cart.js); this element adds the block behaviour:
 *   - policies checkbox [data-anvil-terms]: while unticked every [data-anvil-checkout] gets aria-disabled="true" and
 *     aria-describedby pointing at the shown [data-anvil-terms-hint], and a click focuses the box instead of
 *     submitting; the answer is saved to the cart attribute anvil_terms_accepted as an untracked save (it re-renders
 *     nothing, so it never hides a line change's response); the box is `required`, so the plain form enforces it
 *   - progress bars [data-anvil-progress="<key>"] (inline --av-progress): after a swap the new fill starts from the
 *     previous value so the CSS transition shows the change (none under reduced motion)
 *   - focus: when a swap removed the focused control (a removed line, an upsell card now in the cart), focus moves to
 *     the same control on the line now in that position, else to another upsell's Add button (once the
 *     recommendations have refilled), else to the heading ([data-anvil-focus-fallback])
 *   - recommendations [data-anvil-drawer-recs data-anvil-url] (section anvil-upsell-row): fetched once the drawer is
 *     open, cached per URL; the list items ([data-anvil-upsell-row] > [data-anvil-product-id]) not listed in
 *     data-anvil-exclude fill the [data-anvil-recs-list] <ul>, at most data-anvil-limit, and the block is shown
 * Editor: selecting the section or one of its blocks opens the drawer and deselecting the section closes it, unless
 * data-anvil-preview-open ("Keep open while editing") is set.
 * If the element is removed while open, the scroll lock it took is released.
 */
const api = () => window.Anvil || {};
const ID = 'anvil-cart-drawer';
const QUIET = ['note', 'terms', 'get'];
const EDITOR = ['shopify:section:select', 'shopify:section:deselect', 'shopify:block:select'];
const cache = new Map();

class CartDrawer extends HTMLElement {
  #opener = null;
  #locked = false;
  #prog = new Map();
  #focus = null;
  #terms = null;
  #seq = 0;
  #expands = false;
  #miniWait = false;

  get dialog() {
    return this.querySelector('dialog');
  }

  get frame() {
    return this.querySelector(`[data-anvil-section="${ID}"]`);
  }

  get isOpen() {
    return Boolean(this.dialog?.open);
  }

  connectedCallback() {
    const dialog = this.dialog;
    if (!dialog) return;
    dialog.addEventListener('close', this.#onClose);
    dialog.addEventListener('click', this.#onClick);
    this.addEventListener('change', this.#onChange);
    this.addEventListener('focusin', this.#onFocusIn);
    document.addEventListener('anvil:cart:updated', this.#onCart);
    document.addEventListener('anvil:section:swapped', this.#onSwap);
    for (const type of EDITOR) document.addEventListener(type, this.#onEditor);
    this.#refresh(false);
    if (this.hasAttribute('data-anvil-preview-open')) this.open();
  }

  disconnectedCallback() {
    this.dialog?.removeEventListener('close', this.#onClose);
    this.dialog?.removeEventListener('click', this.#onClick);
    this.removeEventListener('change', this.#onChange);
    this.removeEventListener('focusin', this.#onFocusIn);
    document.removeEventListener('anvil:cart:updated', this.#onCart);
    document.removeEventListener('anvil:section:swapped', this.#onSwap);
    for (const type of EDITOR) document.removeEventListener(type, this.#onEditor);
    this.#unlock();
  }

  #lock() {
    if (this.#locked) return;
    this.#locked = true;
    api().dom?.lockScroll?.();
  }

  #unlock() {
    if (!this.#locked) return;
    this.#locked = false;
    api().dom?.unlockScroll?.();
  }

  open(opener) {
    const dialog = this.dialog;
    if (!dialog || dialog.open) return;
    const given = opener instanceof Element;
    this.#opener = given ? opener : document.activeElement;
    this.#expands = given && opener.hasAttribute('aria-haspopup');
    dialog.showModal();
    this.#lock();
    if (this.#expands) opener.setAttribute('aria-expanded', 'true');
    this.#recs();
  }

  close() {
    if (this.dialog?.open) this.dialog.close();
  }

  toggle(opener) {
    this.isOpen ? this.close() : this.open(opener);
  }

  // Bars, terms gate and recommendations after the first render and after every swap.
  #refresh(animate) {
    const frame = this.frame;
    if (!frame) return;
    const still = !animate || api().dom?.motionOff?.();
    const seen = new Set();
    for (const fill of frame.querySelectorAll('[data-anvil-progress]')) {
      const key = fill.dataset.anvilProgress;
      const to = fill.style.getPropertyValue('--av-progress');
      const from = this.#prog.get(key);
      seen.add(key);
      this.#prog.set(key, to);
      if (still || from == null || from === to) continue;
      fill.style.setProperty('--av-progress', from);
      fill.getBoundingClientRect();
      requestAnimationFrame(() => fill.style.setProperty('--av-progress', to));
    }
    for (const key of this.#prog.keys()) if (!seen.has(key)) this.#prog.delete(key);
    const box = this.#box();
    if (box && this.#terms != null) box.checked = this.#terms;
    this.#gate();
    if (this.isOpen) this.#recs();
  }

  #box() {
    return this.frame?.querySelector('[data-anvil-terms]');
  }

  #gate() {
    const frame = this.frame;
    const box = this.#box();
    const locked = Boolean(box && !box.checked);
    const hint = frame?.querySelector('[data-anvil-terms-hint]');
    for (const btn of frame?.querySelectorAll('[data-anvil-checkout]') || []) {
      if (locked) btn.setAttribute('aria-disabled', 'true');
      else btn.removeAttribute('aria-disabled');
      if (locked && hint) btn.setAttribute('aria-describedby', hint.id);
      else btn.removeAttribute('aria-describedby');
    }
    if (hint) hint.hidden = !locked;
  }

  #onChange = (e) => {
    const box = e.target.closest?.('[data-anvil-terms]');
    if (!box) return;
    this.#terms = box.checked;
    this.#gate();
    const attributes = { anvil_terms_accepted: box.checked ? 'yes' : '' };
    api().cart?.cartUpdate?.({ attributes }, { source: 'terms', track: false }).catch(() => {});
  };

  #onClick = (e) => {
    const dialog = this.dialog;
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) this.close();
      return;
    }
    if (!e.target.closest?.('[data-anvil-checkout][aria-disabled="true"]')) return;
    e.preventDefault();
    const box = this.#box();
    box?.focus();
    box?.reportValidity?.();
  };

  #onFocusIn = (e) => {
    const frame = this.frame;
    const el = e.target.closest?.('[data-anvil-focus-key]');
    if (!el || !frame?.contains(el)) {
      this.#focus = null;
      return;
    }
    const key = el.dataset.anvilFocusKey;
    const line = el.closest('[data-anvil-line]');
    const index = line ? [...frame.querySelectorAll('[data-anvil-line]')].indexOf(line) : -1;
    this.#focus = { key, kind: key.split('-')[0], index };
  };

  #restoreFocus() {
    const active = document.activeElement;
    if (!this.isOpen || (active && active !== document.body && this.contains(active))) return;
    const frame = this.frame;
    const f = this.#focus;
    let target = f && frame.querySelector(`[data-anvil-focus-key="${CSS.escape(f.key)}"]`);
    if (!target && f && f.index >= 0) {
      const lines = frame.querySelectorAll('[data-anvil-line]');
      const line = lines[Math.min(f.index, lines.length - 1)];
      target = line?.querySelector(`[data-anvil-focus-key^="${f.kind}-"]`) || line?.querySelector('[data-anvil-remove]');
    }
    if (!target && f?.kind === 'mini') {
      target = frame.querySelector('[data-anvil-focus-key^="mini-"]');
      // Recommendation cards arrive after the swap: #fill moves focus to them from the heading.
      this.#miniWait = !target;
    }
    (target || frame.querySelector('[data-anvil-focus-fallback]'))?.focus({ preventScroll: true });
  }

  #onSwap = (e) => {
    if (e.detail?.id !== ID) return;
    this.#refresh(true);
    this.#restoreFocus();
  };

  #onCart = (e) => {
    const detail = e.detail || {};
    if (detail.source === 'add' && api().settings?.openCartOnAdd) this.open();
    if (detail.sections?.[ID] != null) {
      this.#seq += 1;
      return;
    }
    if (QUIET.includes(detail.source)) return;
    const mine = ++this.#seq;
    api().sections?.fetchSections?.([ID]).then((html) => {
      if (mine === this.#seq && html[ID] != null) api().sections.swapSection(ID, html[ID]);
    }, () => {});
  };

  #onEditor = (e) => {
    const target = e.target;
    if (!(target instanceof Node) || !(target.contains(this) || this.contains(target))) return;
    if (e.type.endsWith(':select')) this.open();
    else if (e.type === 'shopify:section:deselect' && !this.hasAttribute('data-anvil-preview-open')) this.close();
  };

  #onClose = () => {
    this.#unlock();
    const opener = this.#opener;
    this.#opener = null;
    if (this.#expands) opener?.setAttribute('aria-expanded', 'false');
    let to = opener;
    // An opener that is hidden by now (an Add button in a popover that closed) hands focus to the control that
    // opens its container ([aria-controls] naming an ancestor's id), so focus never drops to <body>.
    for (let p = to?.parentElement; p && to.checkVisibility && !to.checkVisibility(); p = p.parentElement) {
      if (p.id) to = document.querySelector(`[aria-controls="${CSS.escape(p.id)}"]`) || to;
    }
    if (to?.isConnected && typeof to.focus === 'function') to.focus({ preventScroll: true });
  };

  #recs() {
    for (const slot of this.frame?.querySelectorAll('[data-anvil-drawer-recs]') || []) {
      const url = slot.dataset.anvilUrl;
      if (!url) continue;
      if (!cache.has(url)) cache.set(url, fetch(url).then((res) => (res.ok ? res.text() : '')).catch(() => ''));
      cache.get(url).then((html) => {
        const live = slot.isConnected ? slot : this.frame?.querySelector(`[data-anvil-url="${CSS.escape(url)}"]`);
        if (live) this.#fill(live, html);
      });
    }
  }

  #fill(slot, html) {
    const list = slot.querySelector('[data-anvil-recs-list]');
    if (!html || !list || !slot.hidden) return;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const skip = new Set((slot.dataset.anvilExclude || '').split(',').filter(Boolean));
    const cards = [...doc.querySelectorAll('[data-anvil-upsell-row] > [data-anvil-product-id]')]
      .filter((card) => !skip.has(card.dataset.anvilProductId))
      .slice(0, Number(slot.dataset.anvilLimit) || 4);
    if (!cards.length) return;
    list.replaceChildren(...cards);
    slot.hidden = false;
    if (this.#miniWait && document.activeElement?.hasAttribute('data-anvil-focus-fallback')) {
      list.querySelector('[data-anvil-focus-key^="mini-"]')?.focus({ preventScroll: true });
    }
    this.#miniWait = false;
  }
}

customElements.get('anvil-cart-drawer') || customElements.define('anvil-cart-drawer', CartDrawer);
