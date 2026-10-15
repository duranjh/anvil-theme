/**
 * anvil-cart.js — <anvil-cart-form cart-id="drawer|page" class="av-enhance">: enhances a plain cart <form> (drawer,
 * cart page) that works without JavaScript (updates[<line key>] inputs, remove links, checkout button).
 * Reads, inside the element: [data-anvil-line="<line key>"] (holds [data-anvil-quantity], [data-anvil-step="-1|1"],
 * [data-anvil-remove], optional [data-anvil-line-error]); [data-anvil-gift-key] on gift lines (clamped to 0–1;
 * removal stores sessionStorage['anvil_gift_dismissed:' + key], WAVE1-CONTRACTS §5); [data-anvil-note] (saved on
 * change as an untracked save, no re-render); [data-anvil-cart-terms] (the cart page's policies box, saved the same
 * way to the cart attribute anvil_terms_accepted); [data-anvil-discount-input] + [data-anvil-discount-apply],
 * [data-anvil-code] / [data-anvil-remove-code]; [data-anvil-cart-error]. Sections to re-render: every
 * [data-anvil-cart-render] on the page (≤ 5; anvil-core.js swaps them). Messages: the dialog's [data-anvil-live],
 * else a page-level polite region. .av-fallback-only / .av-enhanced-only switch on :defined.
 * Quantities are debounced per line; a newer change aborts the older one; a 422 rolls the input back with
 * Shopify's message on the line. Pending changes live outside the element (cart id + line key → the quantity asked
 * for), because each re-render replaces it: a waiting change is still sent and its number is written back into the
 * new input. The cart API is imported from its versioned URL when core is not ready, so no early tap is dropped.
 * A code counts as applied only when the cart lists it as applicable (discount_codes, else code applications).
 */
const api = () => window.Anvil || {};
const tr = (keys, vars, fallback) => (api().dom?.t ? api().dom.t(keys, vars, fallback) : fallback);
const cartApi = async () => api().cart || import(api().modules['cart-api']);
const pending = new Map(); // `${cart id}:${line key}` → {timer, qty}
const aborts = new Map();

// cart.discount_codes when present, else code-type discount applications (title = code).
function codesOn(cart) {
  if (Array.isArray(cart?.discount_codes)) return cart.discount_codes;
  const apps = [...(cart?.cart_level_discount_applications || [])];
  for (const item of cart?.items || []) for (const a of item.line_level_discount_allocations || []) apps.push(a.discount_application);
  return apps.filter((a) => a?.type === 'discount_code').map((a) => ({ code: a.title, applicable: true }));
}

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
  #noteTimer = 0;

  connectedCallback() {
    this.addEventListener('click', this.#onClick);
    this.addEventListener('input', this.#onInput);
    this.addEventListener('change', this.#onChange);
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('submit', this.#onSubmit);
    // A re-render brought the server's old number for a line whose change is still waiting: show the shopper's.
    for (const [key, job] of pending) {
      const line = key.startsWith(this.#prefix) && this.#line(key.slice(this.#prefix.length));
      const input = line && line.querySelector('[data-anvil-quantity]');
      if (input) input.value = job.qty;
    }
  }

  // Pending quantity changes are left running: the element is replaced by every re-render (see the header).
  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('input', this.#onInput);
    this.removeEventListener('change', this.#onChange);
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('submit', this.#onSubmit);
  }

  get #prefix() {
    return `${this.getAttribute('cart-id') || ''}:`;
  }

  #line(key, root = this) {
    return key ? root.querySelector(`[data-anvil-line="${CSS.escape(key)}"]`) : null;
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

  #error(text, live, line) {
    const root = this.#current();
    const own = line?.isConnected ? line.querySelector('[data-anvil-line-error]') : null;
    const boxes = text ? [own || root.querySelector('[data-anvil-cart-error]')] : root.querySelectorAll('[data-anvil-cart-error], [data-anvil-line-error]');
    for (const box of boxes) {
      if (!box) continue;
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
      const gift = line.dataset.anvilGiftKey;
      if (gift) {
        try {
          sessionStorage.setItem(`anvil_gift_dismissed:${gift}`, '1');
        } catch {
          // storage blocked: the gift may come back on the next cart change
        }
      }
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
    if (e.target.matches('[data-anvil-cart-terms]')) {
      // Cart page policies box: saved now (untracked, no re-render), so a later re-render keeps the tick.
      const attributes = { anvil_terms_accepted: e.target.checked ? 'yes' : '' };
      cartApi().then((c) => c.cartUpdate({ attributes }, { source: 'terms', track: false })).catch(() => {});
      return;
    }
    if (!e.target.matches('[data-anvil-note]')) return;
    clearTimeout(this.#noteTimer);
    const note = e.target.value;
    this.#noteTimer = setTimeout(async () => {
      try {
        await (await cartApi()).cartUpdate({ note }, { source: 'note', track: false });
      } catch {
        this.#error(tr(['cartError'], null, 'Could not update your cart. Please try again.'));
      }
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
    // Checkout posts the form as usual (Shopify saves the updates first); any other submit is handled here.
    if (e.submitter?.name === 'checkout') return;
    e.preventDefault();
    for (const line of this.querySelectorAll('[data-anvil-line]')) {
      const input = line.querySelector('[data-anvil-quantity]');
      if (input && input.value !== input.defaultValue) this.#schedule(line, 0);
    }
  };

  // Stores the quantity the shopper asked for now, so the request never reads an input a re-render replaced.
  #schedule(line, wait) {
    const input = line.querySelector('[data-anvil-quantity]');
    if (!input) return;
    let qty = Math.max(0, parseInt(input.value, 10) || 0);
    if (line.dataset.anvilGiftKey) qty = Math.min(qty, 1);
    const key = this.#prefix + line.dataset.anvilLine;
    clearTimeout(pending.get(key)?.timer);
    pending.set(key, { qty, timer: setTimeout(() => this.#send(key), wait) });
  }

  async #send(key) {
    const job = pending.get(key);
    pending.delete(key);
    if (!job) return;
    const id = key.slice(this.#prefix.length);
    const root = this.#current();
    const live = root.#live();
    // Captured before the request: a successful change re-renders (and replaces) the form.
    const scope = root.closest('dialog') || document;
    const line = this.#line(id, root);
    aborts.get(key)?.abort();
    const ctrl = new AbortController();
    aborts.set(key, ctrl);
    line?.setAttribute('aria-busy', 'true');
    root.#error('');
    root.#announce(tr(['cartUpdating'], null, 'Updating cart…'), live);
    try {
      const cart = await cartApi();
      await cart.cartChange({ id, quantity: job.qty }, { sections: this.sections, source: 'cart', signal: ctrl.signal });
      root.#announce(tr(['cartUpdated'], null, 'Cart updated'), live);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      const now = this.#current();
      const shown = this.#line(id, now);
      const input = shown?.querySelector('[data-anvil-quantity]');
      if (input && !pending.has(key)) input.value = input.defaultValue;
      now.#error(err?.description || tr(['cartError'], null, 'Could not update your cart. Please try again.'), live, shown);
    } finally {
      line?.removeAttribute('aria-busy');
      if (aborts.get(key) === ctrl) aborts.delete(key);
      root.#keepFocus(scope);
    }
  }

  #codes() {
    return [...this.querySelectorAll('[data-anvil-code]')].map((el) => el.dataset.anvilCode).filter(Boolean);
  }

  async #apply() {
    const input = this.querySelector('[data-anvil-discount-input]');
    const code = input?.value.trim();
    if (!code) return;
    const invalid = tr(['codeInvalid'], null, 'That code is not valid for this cart.');
    const live = this.#live();
    this.#error('');
    try {
      const result = await (await cartApi()).applyDiscount(code, { codes: this.#codes(), sections: this.sections });
      const hit = codesOn(result).find((d) => String(d.code).toLowerCase() === code.toLowerCase());
      if (!hit || hit.applicable === false) this.#error(invalid, live);
      else this.#announce(tr(['codeApplied'], null, 'Code applied'), live);
    } catch (err) {
      this.#error(err?.description || invalid, live);
    }
  }

  async #dropCode(code) {
    if (!code) return;
    const scope = this.closest('dialog') || document;
    const live = this.#live();
    try {
      await (await cartApi()).removeDiscount(code, { codes: this.#codes(), sections: this.sections });
      this.#announce(tr(['cartUpdated'], null, 'Cart updated'), live);
    } catch (err) {
      this.#error(err?.description || tr(['cartError'], null, 'Could not update your cart. Please try again.'), live);
    } finally {
      this.#keepFocus(scope);
    }
  }
}

customElements.get('anvil-cart-form') || customElements.define('anvil-cart-form', CartForm);
