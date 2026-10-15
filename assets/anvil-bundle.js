/** <anvil-bundle>, the pick-N box of sections/anvil-bundle.liquid; contract in docs/sections/bundle.md. */
const A = () => window.Anvil || {};
let dom = A().dom;
// Money waits for anvil-dom (CONVENTIONS §7).
let ready = !dom && A().modules?.dom ? import(A().modules.dom).then((m) => (dom = m), () => (ready = null)) : null;
const D = () => (dom ||= A().dom);
const money = (cents) => D()?.formatMoney(cents) ?? (cents / 100).toFixed(2);
const t = (key, fallback) => D()?.t([key], null, fallback) ?? fallback;
const num = (value) => +value || 0;
const $ = (root, sel) => root.querySelector(sel);

class BundleDeal extends HTMLElement {
  connectedCallback() {
    this.need = num(this.dataset.anvilPick) || 1;
    this.exact = this.hasAttribute('data-anvil-exact');
    this.addEventListener('change', this.update);
    this.addEventListener('click', this.onClick);
    const dirty = this.slots().some(
      ({ box, select }) => box.checked !== box.defaultChecked || (select && !select.selectedOptions[0]?.defaultSelected)
    );
    this.update(dirty);
  }

  disconnectedCallback() {
    this.removeEventListener('change', this.update);
    this.removeEventListener('click', this.onClick);
  }

  slots() {
    return [...this.querySelectorAll('[data-anvil-bundle-slot]')].map((el) => ({
      el,
      box: $(el, '[data-anvil-bundle-pick]'),
      select: $(el, 'select'),
    }));
  }

  put(root, sel, cents, show) {
    const el = $(root, sel);
    if (!el) return;
    ($(el, '[data-anvil-bundle-amount]') || el).textContent = money(cents);
    if (show !== undefined) el.hidden = !show;
  }

  update = (write = true) => {
    if (write && !D() && ready) return ready.then(() => this.update());
    const slots = this.slots();
    let n = 0;
    let total = 0;
    let was = 0;
    for (const { el, box, select } of slots) {
      const option = select?.selectedOptions[0];
      if (option) {
        box.value = option.value;
        box.dataset.anvilPrice = option.dataset.anvilPrice;
        box.dataset.anvilCompare = option.dataset.anvilCompare;
      }
      const price = num(box.dataset.anvilPrice);
      const compare = Math.max(num(box.dataset.anvilCompare), price);
      if (write && !box.disabled) {
        this.put(el, '[data-anvil-bundle-price]', price);
        this.put(el, '[data-anvil-bundle-compare]', compare, compare > price);
        $(el, '.av-price')?.classList.toggle('av-price--sale', compare > price);
        el.querySelectorAll('[data-anvil-bundle-unit]').forEach((u) => (u.hidden = u.dataset.anvilBundleUnit != box.value));
      }
      if (box.checked && this.exact && n >= this.need) box.checked = false;
      const on = box.checked && !box.disabled;
      const thumb = $(this, `[data-anvil-bundle-thumb="${el.dataset.anvilBundleSlot}"]`);
      if (thumb) thumb.hidden = !on;
      if (on) {
        n += 1;
        total += price;
        was += compare;
      }
    }
    const full = this.exact && n >= this.need;
    for (const { box } of slots) {
      if (full && !box.checked && !box.disabled) box.setAttribute('aria-disabled', 'true');
      else box.removeAttribute('aria-disabled');
    }
    this.querySelectorAll('[data-anvil-bundle-empty]').forEach((el, i) => (el.hidden = i < n));
    const btn = $(this, '[data-anvil-bundle-add]');
    if (btn) btn.disabled = n < this.need;
    this.count = n;
    if (!write) return;
    this.put(this, '[data-anvil-bundle-total]', total);
    this.put(this, '[data-anvil-bundle-was]', was, was > total);
    this.progress(this.exact || n <= this.need ? this.dataset.anvilProgress : this.dataset.anvilPicked);
  };

  // New words only; force (limit) clears first so a repeat is read.
  progress(tpl, force) {
    const box = $(this, '[data-anvil-bundle-progress]');
    const text = (tpl || '').replace('[picked]', this.count).replace('[total]', this.need);
    if (force) this.say(text, box);
    else if (box.textContent !== text) box.textContent = text;
  }

  onClick = (e) => {
    const box = e.target.closest('[data-anvil-bundle-pick]');
    if (box?.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      this.progress(this.dataset.anvilLimit, true);
      return;
    }
    const btn = e.target.closest('[data-anvil-bundle-add]');
    if (btn && !btn.disabled && !btn.hasAttribute('aria-busy')) this.add(btn);
  };

  async add(btn) {
    const items = this.slots()
      .filter(({ box }) => box.checked && !box.disabled)
      .map(({ box }) => ({ id: num(box.value), quantity: 1 }));
    if (!items.length) return;
    btn.setAttribute('aria-busy', 'true');
    try {
      const api = A().cart || (await import(A().modules['cart-api']));
      await api.cartAdd(items, { sections: ['anvil-cart-drawer', 'anvil-cart-bubble'], source: 'add' });
      this.say(t('added', 'Added to cart'));
      if (A().settings?.cartType === 'page' && A().routes?.cart) {
        await Promise.race([A().gifts?.settled?.(), new Promise((done) => setTimeout(done, 3000))]);
        location.assign(A().routes.cart);
      }
    } catch (err) {
      this.say((err?.status && err.description) || t('cartError', 'Could not update your cart. Please try again.'));
    } finally {
      btn.removeAttribute('aria-busy');
    }
  }

  say(text, box = $(document, 'dialog[open] [data-anvil-live]') || $(this, '[data-anvil-status]')) {
    if (!box) return;
    box.textContent = '';
    setTimeout(() => (box.textContent = text || ''), 60);
  }
}

customElements.get('anvil-bundle') || customElements.define('anvil-bundle', BundleDeal);
