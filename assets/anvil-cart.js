/**
 * anvil-cart.js — <anvil-cart-form cart-id="drawer|page" class="av-enhance">: enhances a plain cart <form> (the cart
 * drawer and the cart page) that already works without JavaScript (updates[] inputs, remove links, checkout button).
 *
 * Markup it reads (all inside the element):
 *   [data-anvil-line="<line key>"]           one cart line; holds [data-anvil-quantity] (number input),
 *                                            [data-anvil-step="-1|1"] buttons and an [data-anvil-remove] link
 *   [data-anvil-note]                        order note textarea (saved on change, no re-render)
 *   [data-anvil-discount-input] + [data-anvil-discount-apply]   discount field; [data-anvil-code="CODE"] lists the
 *                                            applied codes and [data-anvil-remove-code="CODE"] removes one
 *   [data-anvil-cart-error]                  visible error line (hidden until needed)
 * Page-wide: every element with [data-anvil-cart-render="<section id>"] names a section that is re-rendered after a
 * change (at most 5; the swap itself happens in anvil-core.js from the anvil:cart:updated event). Live messages go
 * to the nearest dialog's [data-anvil-live], else to a page-level polite region.
 * CSS hides `.av-fallback-only` (the Update button) and shows `.av-enhanced-only` (steppers, discount field) once
 * this element is defined, so the plain form stays usable if this module never loads.
 * Quantities: steppers and typing are debounced per line; a newer change aborts the older request; a rejected
 * change (422, e.g. not enough stock) rolls the input back and shows Shopify's message.
 */
const api = () => window.Anvil || {};
const tr = (keys, vars, fallback) => (api().dom?.t ? api().dom.t(keys, vars, fallback) : fallback);

function pageLive() {
  let el = document.getElementById('anvil-live');
  if (!el) {
    el = document.createElement('div');
    el.id = 'anvil-live';
    el.className = 'av-visually-hidden';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  return el;
}

class CartForm extends HTMLElement {
  #timers = new Map();
  #aborts = new Map();
  #noteTimer = 0;

  connectedCallback() {
    this.addEventListener('click', this.#onClick);
    this.addEventListener('input', this.#onInput);
    this.addEventListener('change', this.#onChange);
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('submit', this.#onSubmit);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('input', this.#onInput);
    this.removeEventListener('change', this.#onChange);
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('submit', this.#onSubmit);
    for (const id of this.#timers.values()) clearTimeout(id);
    clearTimeout(this.#noteTimer);
  }

  get sections() {
    const ids = [...document.querySelectorAll('[data-anvil-cart-render]')].map((el) => el.dataset.anvilCartRender);
    return [...new Set(ids.filter(Boolean))].slice(0, 5);
  }

  get #selector() {
    return `anvil-cart-form[cart-id="${CSS.escape(this.getAttribute('cart-id') || '')}"]`;
  }

  // After a re-render this element may be replaced; look the live copy up again.
  #current() {
    return this.isConnected ? this : document.querySelector(this.#selector) || this;
  }

  #live() {
    return this.closest('dialog')?.querySelector('[data-anvil-live]') || pageLive();
  }

  #announce(text, live = this.#live()) {
    live.textContent = '';
    if (text) setTimeout(() => { live.textContent = text; }, 60);
  }

  #error(text, live) {
    const box = this.#current().querySelector('[data-anvil-cart-error]');
    if (box) {
      box.textContent = text || '';
      box.hidden = !text;
    }
    if (text) this.#announce(text, live);
  }

  #keepFocus(scope) {
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    const target = (scope || document).querySelector('[data-anvil-focus-fallback]');
    target?.focus({ preventScroll: true });
  }

  #onClick = (e) => {
    const step = e.target.closest('[data-anvil-step]');
    const remove = e.target.closest('[data-anvil-remove]');
    const apply = e.target.closest('[data-anvil-discount-apply]');
    const drop = e.target.closest('[data-anvil-remove-code]');
    if (step) {
      const line = step.closest('[data-anvil-line]');
      const input = line?.querySelector('[data-anvil-quantity]');
      if (!input) return;
      e.preventDefault();
      input.value = Math.max(0, (parseInt(input.value, 10) || 0) + Number(step.dataset.anvilStep || 0));
      this.#schedule(line, 350);
    } else if (remove) {
      const line = remove.closest('[data-anvil-line]');
      const input = line?.querySelector('[data-anvil-quantity]');
      if (!line || !input) return;
      e.preventDefault();
      input.value = 0;
      this.#schedule(line, 0);
    } else if (apply) {
      e.preventDefault();
      this.#apply();
    } else if (drop) {
      e.preventDefault();
      this.#dropCode(drop.dataset.anvilRemoveCode);
    }
  };

  #onInput = (e) => {
    if (!e.target.matches('[data-anvil-quantity]')) return;
    const line = e.target.closest('[data-anvil-line]');
    if (line) this.#schedule(line, 600);
  };

  #onChange = (e) => {
    if (!e.target.matches('[data-anvil-note]')) return;
    clearTimeout(this.#noteTimer);
    const note = e.target.value;
    this.#noteTimer = setTimeout(() => {
      api().cart?.cartUpdate({ note }, { source: 'note' }).catch(() => this.#error(tr(['cartError'], null, 'Could not update your cart. Please try again.')));
    }, 300);
  };

  #onKeydown = (e) => {
    if (e.key !== 'Enter') return;
    if (e.target.matches('[data-anvil-discount-input]')) {
      e.preventDefault();
      this.#apply();
    } else if (e.target.matches('[data-anvil-quantity]')) {
      const line = e.target.closest('[data-anvil-line]');
      if (!line) return;
      e.preventDefault();
      this.#schedule(line, 0);
    }
  };

  #onSubmit = (e) => {
    // Checkout posts the form as usual (Shopify saves updates[] first); any other submit is handled here.
    if (e.submitter?.name === 'checkout') return;
    e.preventDefault();
    for (const line of this.querySelectorAll('[data-anvil-line]')) {
      const input = line.querySelector('[data-anvil-quantity]');
      if (input && input.value !== input.defaultValue) this.#schedule(line, 0);
    }
  };

  #schedule(line, wait) {
    const key = line.dataset.anvilLine;
    clearTimeout(this.#timers.get(key));
    this.#timers.set(key, setTimeout(() => this.#send(line), wait));
  }

  async #send(line) {
    const key = line.dataset.anvilLine;
    const input = line.querySelector('[data-anvil-quantity]');
    const cart = api().cart;
    if (!input || !cart?.cartChange) return;
    const quantity = Math.max(0, parseInt(input.value, 10) || 0);
    this.#aborts.get(key)?.abort();
    const ctrl = new AbortController();
    this.#aborts.set(key, ctrl);
    // Captured before the request: a successful change re-renders (and replaces) this element.
    const scope = this.closest('dialog') || document;
    const live = this.#live();
    line.setAttribute('aria-busy', 'true');
    this.#error('');
    this.#announce(tr(['cartUpdating'], null, 'Updating cart…'), live);
    try {
      await cart.cartChange({ id: key, quantity }, { sections: this.sections, source: 'cart', signal: ctrl.signal });
      this.#announce(tr(['cartUpdated'], null, 'Cart updated'), live);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      input.value = input.defaultValue;
      this.#error(err?.description || tr(['cartError'], null, 'Could not update your cart. Please try again.'), live);
    } finally {
      line.removeAttribute('aria-busy');
      if (this.#aborts.get(key) === ctrl) this.#aborts.delete(key);
      this.#keepFocus(scope);
    }
  }

  #codes() {
    return [...this.querySelectorAll('[data-anvil-code]')].map((el) => el.dataset.anvilCode).filter(Boolean);
  }

  async #apply() {
    const input = this.querySelector('[data-anvil-discount-input]');
    const code = input?.value.trim();
    const cart = api().cart;
    if (!code || !cart?.applyDiscount) return;
    const invalid = tr(['codeInvalid'], null, 'That code is not valid for this cart.');
    const live = this.#live();
    this.#error('');
    try {
      const result = await cart.applyDiscount(code, { codes: this.#codes(), sections: this.sections });
      const hit = (result?.discount_codes || []).find((d) => String(d.code).toLowerCase() === code.toLowerCase());
      if (hit && hit.applicable === false) this.#error(invalid, live);
      else this.#announce(tr(['codeApplied'], null, 'Code applied'), live);
    } catch (err) {
      this.#error(err?.description || invalid, live);
    }
  }

  async #dropCode(code) {
    const cart = api().cart;
    if (!code || !cart?.removeDiscount) return;
    const scope = this.closest('dialog') || document;
    const live = this.#live();
    try {
      await cart.removeDiscount(code, { codes: this.#codes(), sections: this.sections });
      this.#announce(tr(['cartUpdated'], null, 'Cart updated'), live);
    } catch (err) {
      this.#error(err?.description || tr(['cartError'], null, 'Could not update your cart. Please try again.'), live);
    } finally {
      this.#keepFocus(scope);
    }
  }
}

customElements.get('anvil-cart-form') || customElements.define('anvil-cart-form', CartForm);
