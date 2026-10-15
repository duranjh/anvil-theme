/**
 * anvil-commerce.js — commerce product blocks (snippets/anvil-pb-*.liquid) and the mini card.
 *   <anvil-bundle>  ticked rows + variant selects → live total of real prices (server text stands until a change);
 *     one cartAdd at a time for the ticked items; the data-anvil-bundle-current row follows anvil:variant:changed.
 *   <anvil-discount>  copy (Clipboard API → textarea → select) or apply via applyDiscount keeping the cart's codes
 *     (JS off: /discount/CODE?redirect=); toggles .av-is-applied; on an empty cart a kept code reads "saved".
 *   <anvil-upsells>  `url` (section anvil-upsell-row) fills [data-anvil-upsell-list]; with hide-in-cart, cart
 *     products are dropped before the limit and hidden after cart changes; the block hides when none is left.
 *   <anvil-mini-card>  [data-anvil-mini-add="<variant id>"] adds one unit.
 *   Custom fields  a product-form submit stops while a required [data-anvil-field] is blank (the browser's own
 *     check marks it the same way); empty optional fields sit out the submit so no blank property posts.
 * Adds: cartAdd(items, {sections: drawer + bubble, source: 'add'}); messages go to the open drawer's live region
 * (what opened it is inert or re-rendered), else to the element's [data-anvil-status].
 */
const A = () => window.Anvil || {};
const api = async () => A().cart || import(A().modules['cart-api']);
const SECTIONS = ['anvil-cart-drawer', 'anvil-cart-bubble'];
const t = (key, fallback) => (A().dom?.t ? A().dom.t([key], null, fallback) : fallback);
const money = (cents) => (A().dom?.formatMoney ? A().dom.formatMoney(cents) : (cents / 100).toFixed(2));
const define = (name, cls) => customElements.get(name) || customElements.define(name, cls);
const plain = (e) => !e.defaultPrevented && !e.button && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

function say(root, text) {
  const box = document.querySelector('dialog[open] [data-anvil-live]') || root.querySelector('[data-anvil-status]');
  if (!box) return;
  box.textContent = '';
  setTimeout(() => (box.textContent = text || ''), 60);
}

// cart.discount_codes when present, else code-type discount applications (title = code): codes are never dropped.
function codesOn(cart) {
  if (Array.isArray(cart?.discount_codes)) return cart.discount_codes;
  const apps = [...(cart?.cart_level_discount_applications || [])];
  for (const item of cart?.items || []) {
    for (const a of item.line_level_discount_allocations || []) apps.push(a.discount_application);
  }
  const titles = apps.filter((a) => a?.type === 'discount_code').map((a) => a.title);
  return [...new Set(titles)].map((code) => ({ code, applicable: true }));
}

async function add(root, items, btn) {
  btn?.setAttribute('aria-busy', 'true');
  try {
    await (await api()).cartAdd(items, { sections: SECTIONS, source: 'add' });
    say(root, t('added', 'Added to cart'));
  } catch (err) {
    say(root, err?.description || err?.message || t('cartError', 'Could not update your cart.'));
  } finally {
    btn?.removeAttribute('aria-busy');
  }
}

class Bundle extends HTMLElement {
  connectedCallback() {
    this.addEventListener('change', this.update);
    this.addEventListener('click', this.onClick);
    document.addEventListener('anvil:variant:changed', this.onVariant);
    this.update(false);
  }

  disconnectedCallback() {
    this.removeEventListener('change', this.update);
    this.removeEventListener('click', this.onClick);
    document.removeEventListener('anvil:variant:changed', this.onVariant);
  }

  boxes() {
    return [...this.querySelectorAll('[data-anvil-bundle-row] input[type="checkbox"]')];
  }

  // `write` is false on connect: the server's prices stand until something changes.
  update = (write = true) => {
    let total = 0;
    let count = 0;
    for (const box of this.boxes()) {
      const row = box.closest('[data-anvil-bundle-row]');
      const option = row.querySelector('select')?.selectedOptions[0];
      if (option) {
        box.value = option.value;
        row.dataset.anvilPrice = option.dataset.anvilPrice;
      }
      const price = Number(row.dataset.anvilPrice) || 0;
      const label = row.querySelector('[data-anvil-bundle-price]');
      if (label && write) label.textContent = money(price);
      if (box.checked && !box.disabled) {
        total += price;
        count += 1;
      }
    }
    const sum = this.querySelector('[data-anvil-bundle-total]');
    if (sum && write) sum.textContent = money(total);
    const btn = this.querySelector('[data-anvil-bundle-add]');
    if (btn) btn.disabled = !count;
  };

  onClick = (e) => {
    const btn = e.target.closest('[data-anvil-bundle-add]');
    if (!btn || btn.disabled || btn.hasAttribute('aria-busy')) return;
    const items = this.boxes()
      .filter((box) => box.checked && !box.disabled)
      .map((box) => ({ id: Number(box.value), quantity: 1 }));
    if (items.length) add(this, items, btn);
  };

  onVariant = (e) => {
    const { sectionId, variant } = e.detail || {};
    const row = this.querySelector('[data-anvil-bundle-current]');
    if (!row || !variant || String(sectionId) !== row.dataset.anvilBundleCurrent) return;
    const box = row.querySelector('input[type="checkbox"]');
    box.value = variant.id;
    box.disabled = !variant.available;
    if (box.disabled) box.checked = false;
    row.dataset.anvilPrice = variant.price;
    const name = row.querySelector('[data-anvil-bundle-variant-title]');
    if (name) name.textContent = variant.title;
    this.update();
  };
}

class Discount extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', this.onClick);
    document.addEventListener('anvil:cart:updated', this.onCart);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    document.removeEventListener('anvil:cart:updated', this.onCart);
  }

  get code() {
    return this.getAttribute('code') || '';
  }

  onClick = (e) => {
    const trigger = e.target.closest('[data-anvil-discount]');
    if (!trigger || !plain(e)) return;
    e.preventDefault();
    if (trigger.dataset.anvilDiscount === 'apply') this.apply(trigger);
    else this.copy();
  };

  async copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(this.code);
      ok = true;
    } catch {
      const area = document.createElement('textarea');
      area.value = this.code;
      area.setAttribute('readonly', '');
      area.className = 'av-visually-hidden';
      this.append(area);
      area.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      area.remove();
    }
    if (ok) {
      this.classList.add('av-is-copied');
      say(this, this.dataset.anvilCopied);
      setTimeout(() => this.classList.remove('av-is-copied'), 2000);
    } else {
      const code = this.querySelector('[data-anvil-discount-code]');
      if (code) getSelection().selectAllChildren(code);
    }
  }

  async apply(link) {
    let cart;
    try {
      cart = await api();
    } catch {
      location.assign(link.href);
      return;
    }
    link.setAttribute('aria-busy', 'true');
    try {
      const now = await cart.cartGet();
      const codes = codesOn(now).filter((d) => d.applicable !== false).map((d) => d.code);
      const result = await cart.applyDiscount(this.code, { codes, sections: SECTIONS, source: 'discount' });
      const kept = !result?.item_count && result?.discount_codes?.some((d) => this.is(d.code));
      say(
        this,
        this.state(result)
          ? t('codeApplied', 'Code applied')
          : kept
            ? t('codeSaved', 'Code saved. It applies when you add items.')
            : t('codeInvalid', 'That code is not valid for this cart.')
      );
    } catch (err) {
      say(this, err?.description || t('codeInvalid', 'That code is not valid for this cart.'));
    } finally {
      link.removeAttribute('aria-busy');
    }
  }

  is(code) {
    return String(code).toLowerCase() === this.code.toLowerCase();
  }

  state(cart) {
    const hit = codesOn(cart).find((d) => this.is(d.code));
    const ok = !!hit && hit.applicable !== false;
    this.classList.toggle('av-is-applied', ok);
    return ok;
  }

  onCart = (e) => {
    if (e.detail?.cart) this.state(e.detail.cart);
  };
}

class Upsells extends HTMLElement {
  connectedCallback() {
    document.addEventListener('anvil:cart:updated', this.onCart);
    const url = this.getAttribute('url');
    if (url) this.load(url);
    else this.hide(this.dataset.anvilInCart);
  }

  disconnectedCallback() {
    document.removeEventListener('anvil:cart:updated', this.onCart);
  }

  async load(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const skip = new Set(this.hasAttribute('hide-in-cart') ? String(this.dataset.anvilInCart).split(',') : []);
      skip.add(this.dataset.anvilProduct);
      const cards = [...doc.querySelectorAll('[data-anvil-upsell-row] > [data-anvil-product-id]')]
        .filter((card) => !skip.has(card.dataset.anvilProductId))
        .slice(0, Number(this.getAttribute('limit')) || 4);
      this.querySelector('[data-anvil-upsell-list]')?.replaceChildren(...cards);
    } catch {
      // no recommendations: the block stays hidden
    }
    this.hide(this.dataset.anvilInCart);
  }

  hide(ids) {
    const inCart = new Set(String(ids || '').split(',').filter(Boolean));
    let shown = 0;
    for (const card of this.querySelectorAll('[data-anvil-upsell-list] > [data-anvil-product-id]')) {
      card.hidden = this.hasAttribute('hide-in-cart') && inCart.has(card.dataset.anvilProductId);
      if (!card.hidden) shown += 1;
    }
    this.hidden = !shown;
  }

  onCart = (e) => {
    const items = e.detail?.cart?.items;
    if (!items) return;
    this.dataset.anvilInCart = items.map((item) => item.product_id).join(',');
    this.hide(this.dataset.anvilInCart);
  };
}

class MiniCard extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', this.onClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
  }

  onClick = (e) => {
    const btn = e.target.closest('[data-anvil-mini-add]');
    if (btn && !btn.hasAttribute('aria-busy')) add(this, [{ id: Number(btn.dataset.anvilMiniAdd), quantity: 1 }], btn);
  };
}

define('anvil-bundle', Bundle);
define('anvil-discount', Discount);
define('anvil-upsells', Upsells);
define('anvil-mini-card', MiniCard);

const fieldsOf = (form) => [...form.elements].filter((el) => el.hasAttribute('data-anvil-field'));
const isEmpty = (el) => (el.type === 'checkbox' ? !el.checked : !el.value.trim());

function mark(el, bad) {
  if (bad) el.setAttribute('aria-invalid', 'true');
  else el.removeAttribute('aria-invalid');
  const box = el.closest('[data-anvil-field-wrap]');
  box?.classList.toggle('av-is-invalid', bad);
  const msg = box?.querySelector('[data-anvil-field-error]');
  if (msg) msg.textContent = bad ? el.getAttribute('data-anvil-field') : '';
}

// Capture phase on document: runs before the product form's own submit handler.
document.addEventListener(
  'submit',
  (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('[data-anvil-product-form]')) return;
    let first = null;
    const skip = [];
    for (const el of fieldsOf(form)) {
      if (el.disabled) continue;
      const bad = el.required && isEmpty(el);
      mark(el, bad);
      if (bad) first ||= el;
      else if (isEmpty(el)) skip.push(el);
    }
    if (first) {
      e.preventDefault();
      e.stopImmediatePropagation();
      first.focus();
      return;
    }
    for (const el of skip) el.disabled = true;
    setTimeout(() => skip.forEach((el) => (el.disabled = false)));
  },
  true
);

// The browser's own required check (no-JS path and before submit): mark the field the same way.
document.addEventListener(
  'invalid',
  (e) => e.target instanceof Element && e.target.hasAttribute('data-anvil-field') && mark(e.target, true),
  true
);

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el instanceof Element && el.hasAttribute('data-anvil-field') && el.hasAttribute('aria-invalid') && !isEmpty(el)) {
    mark(el, false);
  }
});
