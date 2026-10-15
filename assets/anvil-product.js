/**
 * anvil-product.js — product form, variant state, quantity and sticky bar (WAVE1-CONTRACTS §3, §4 and §10,
 * DESIGN-money-path §B–§D). May run before anvil-core.js: reads window.Anvil at call time, listens on document and
 * imports anvil-dom.js from its versioned URL before writing money.
 * <anvil-variant-picker section-id form-id hide-sold-out data-anvil-save-tpl>  reads [data-anvil-product-json];
 *   enables its controls (they ship disabled, so a dead picker shows only what the form posts); on change resolves
 *   the variant (an option without a checked control keeps the form's value), writes the form's id input, refreshes
 *   values, legends and cards, updates every [data-anvil-bind] in the section (fields in WAVE1-CONTRACTS §10) and
 *   emits anvil:variant:changed {sectionId, variant, product}. On the product's own page only: ?variant= via
 *   replaceState (other parameters kept) and a swap of [data-anvil-server-truth] nodes from the current URL with
 *   section_id and variant. The first pass on load leaves the server's money text alone.
 * <anvil-product-form form-id>  submit → cartAdd(items, {sections: drawer + bubble, source: 'add'}) after the
 *   browser's own validation; success is announced in the open drawer's live region, else in the status region
 *   with the button reading "Added" for 2 s; cart type "page" waits (≤ 3 s) for the gift engine, then opens the
 *   cart; a 4xx shows Shopify's description, anything else posts natively.
 * <anvil-quantity form-id section-id cap mirror>  stepper clamped to the variant's quantity_rule (and cap); the
 *   buttons take aria-disabled at the limits (focus stays); tier radios outside the rule are disabled. Emits
 *   anvil:quantity:changed {sectionId, formId, quantity, mirror}; editor only: tier promise vs cart line check
 *   ([data-anvil-tier-warn], anvil:quantity:tier-check).
 * <anvil-sticky-bar form-id>  shown once the form's submit button is above the viewport (or selected in the
 *   editor), never hiding focus; mirrors the stepper; sets html.av-is-sticky-shown and --av-sticky-bar-h.
 */
const A = (window.Anvil ||= {});
const all = (root, sel) => [...root.querySelectorAll(sel)];
let dom = A.dom;
const ready = () =>
  (dom ||= A.dom) || (A.modules?.dom ? import(A.modules.dom).then((m) => (dom = m), () => null) : null);
const fmt = (cents) => ((dom ||= A.dom) ? dom.formatMoney(cents) : (cents / 100).toFixed(2));
const say = (key, fallback) => ((dom ||= A.dom) ? dom.t(key, null, fallback) : fallback);
const emit = (topic, detail) =>
  A.events ? A.events.emit(topic, detail) : document.dispatchEvent(new CustomEvent(topic, { detail }));
const listen = (topic, fn) => {
  const handler = (e) => fn(e.detail || {});
  document.addEventListener(topic, handler);
  return () => document.removeEventListener(topic, handler);
};
const idInput = (form) => form?.querySelector('[data-anvil-variant-input]');
const saving = (v) => (v && v.compare_at_price > v.price ? v.compare_at_price - v.price : 0);
// Same product when the path after /products/ matches the product URL's (translated handles and /collections/… too).
const tail = (path) => decodeURIComponent(path).split('/products/')[1];
const onPage = (url) => {
  const own = url && tail(new URL(url, location.href).pathname);
  return !!own && own === tail(location.pathname);
};

function image(el, v) {
  const img = el?.tagName === 'IMG' ? el : el?.querySelector('img');
  const src = v?.featured_image?.src;
  if (!img || !src) return;
  img.removeAttribute('srcset');
  img.src = src;
}

function avail(v, data, el) {
  if (!v?.available) return 'sold_out';
  const inv = data?.inventory?.[v.id];
  return inv?.managed && inv.qty > 0 && inv.qty <= +(el.dataset.anvilThreshold || 0) ? 'low_stock' : 'in_stock';
}

const STATES = { Out: 'sold_out', Back: 'backorder', Low: 'low_stock', In: 'in_stock' };

// Inventory / urgency line from tracked stock only; qty is null above every stock block's threshold.
function stock(el, v, data) {
  const inv = data?.inventory?.[v.id];
  const qty = inv?.qty;
  const key = !inv?.managed
    ? ''
    : !v.available
      ? 'Out'
      : qty != null && qty <= 0
        ? 'Back'
        : qty != null && qty <= +el.dataset.anvilThreshold
          ? 'Low'
          : 'In';
  const tpl = (key && el.dataset[`anvilTpl${key}`]) || '';
  const box = el.closest('[data-anvil-bind-box]') || el;
  box.hidden = !tpl;
  box.dataset.state = STATES[key] || '';
  const [head, ...rest] = tpl.split('[count]');
  const nodes = [head];
  for (const part of rest) {
    const n = document.createElement(el.hasAttribute('data-anvil-strong') ? 'strong' : 'span');
    n.textContent = qty;
    nodes.push(n, part);
  }
  el.replaceChildren(...nodes);
}

// Updates every [data-anvil-bind] under root; labelsOnly limits it to the button label and availability.
function bind(root, v, data, labelsOnly) {
  const save = saving(v);
  const texts = v && {
    price: fmt(v.price),
    compare: save && fmt(v.compare_at_price),
    savings: save && fmt(save),
    savings_percent: save && String(Math.floor((save * 100) / v.compare_at_price)),
    sku: v.sku,
    unit: v.unit_price != null && fmt(v.unit_price),
    unit_ref: v.unit_ref,
  };
  for (const el of all(root, '[data-anvil-bind]')) {
    const field = el.dataset.anvilBind;
    if (field === 'add_label') {
      const ok = !!v?.available;
      el.textContent = !v
        ? say('unavailable', 'Unavailable')
        : ok
          ? el.dataset.anvilLabelAdd || say('addToCart', 'Add to cart')
          : el.dataset.anvilLabelSoldOut || say('soldOut', 'Sold out');
      const button = el.closest('button');
      if (button) button.disabled = !ok;
    } else if (field === 'availability') {
      el.dataset.state = avail(v, data, el);
    } else if (!v || labelsOnly) {
      continue;
    } else if (field === 'image') {
      image(el, v);
    } else if (field === 'stock') {
      stock(el, v, data);
    } else if (field === 'sale' || field === 'regular') {
      el.hidden = !save === (field === 'sale');
    } else if (field === 'price_state') {
      el.classList.toggle('av-price--sale', !!save);
      el.classList.toggle('av-price--sold-out', !v.available);
    } else if (field in texts) {
      const text = texts[field];
      (el.closest('[data-anvil-bind-box]') || el).hidden = !text;
      if (text) el.textContent = (el.dataset.anvilFormat || '[value]').replace('[value]', text);
    }
  }
}

class VariantPicker extends HTMLElement {
  connectedCallback() {
    try {
      this.data = JSON.parse(this.querySelector('[data-anvil-product-json]').textContent);
    } catch {
      return;
    }
    this.sid = this.getAttribute('section-id');
    this.form = document.getElementById(this.getAttribute('form-id'));
    this.root = this.closest('.shopify-section') || document.body;
    this.addEventListener('change', this.onChange);
    for (const el of all(this, '[data-anvil-option]')) el.disabled = false;
    if (!this.querySelector('[data-anvil-option]')) return;
    const v = this.refresh(true);
    const input = idInput(this.form);
    if (v && input && input.value !== String(v.id)) Promise.resolve(ready()).then(() => this.apply(this.refresh(), false));
    else bind(this.root, v, this.data, true);
  }

  disconnectedCallback() {
    this.removeEventListener('change', this.onChange);
    this.ctrl?.abort();
  }

  onChange = async (e) => {
    if (!e.target.matches('[data-anvil-option]')) return;
    await ready();
    this.apply(this.refresh(), true);
  };

  // An option with no checked control (a value without a card) keeps the value of the variant the form holds.
  selection() {
    const held = this.data.variants.find((v) => String(v.id) === idInput(this.form)?.value);
    return this.data.options.map((_, i) => {
      const n = i + 1;
      const el = this.querySelector(`input[data-anvil-option="${n}"]:checked, select[data-anvil-option="${n}"]`);
      return el ? el.value : held?.options[i];
    });
  }

  find(sel) {
    return this.data.variants.find((v) => v.options.every((value, i) => value === sel[i]));
  }

  // Marks every value against the current selection, refreshes legends and cards; returns the selected variant.
  // `initial` (first pass on load) keeps the server's money text on the cards.
  refresh(initial) {
    const sel = this.selection();
    const hide = this.hasAttribute('hide-sold-out');
    for (const el of all(this, '[data-anvil-value]')) {
      const i = el.dataset.anvilPos - 1;
      const value = el.dataset.anvilValue;
      const v = this.find(sel.map((s, j) => (j === i ? value : s)));
      const ok = !!v?.available;
      const note = ok ? '' : v ? say('soldOut', 'Sold out') : say('unavailable', 'Unavailable');
      el.classList.toggle('av-is-unavailable', !ok);
      if (hide) el.hidden = !ok && sel[i] !== value;
      if (el.tagName === 'OPTION') {
        el.textContent = note ? `${value} — ${note}` : value;
        continue;
      }
      const oos = el.querySelector('[data-anvil-oos]');
      if (oos) {
        oos.hidden = ok;
        oos.textContent = note;
      }
      if (el.hasAttribute('data-anvil-card')) this.card(el, v, initial);
    }
    for (const el of all(this, '[data-anvil-selected]')) el.textContent = sel[el.dataset.anvilSelected - 1] || '';
    return this.find(sel);
  }

  // A card whose combination does not exist shows no price or saving, only its status.
  card(el, v, initial) {
    el.querySelector('input').setAttribute('aria-disabled', String(!v));
    if (initial) return;
    const save = saving(v);
    const price = el.querySelector('[data-anvil-card-price]');
    const compare = el.querySelector('[data-anvil-card-compare]');
    const label = el.querySelector('[data-anvil-card-save]');
    if (price) price.textContent = v ? fmt(v.price) : '';
    if (compare) {
      compare.hidden = !save;
      compare.lastElementChild.textContent = save ? fmt(v.compare_at_price) : '';
    }
    if (label) {
      label.hidden = !save;
      label.textContent = save
        ? (this.dataset.anvilSaveTpl || '')
            .replace('[amount]', fmt(save))
            .replace('[percent]', Math.floor((save * 100) / v.compare_at_price))
        : '';
    }
    image(el.querySelector('[data-anvil-card-media]'), v);
  }

  apply(v, fromShopper) {
    const input = idInput(this.form);
    if (v && input) input.value = v.id;
    bind(this.root, v, this.data);
    if (!v) return;
    const { id, handle, url } = this.data;
    emit('anvil:variant:changed', { sectionId: this.sid, variant: v, product: { id, handle } });
    if (!onPage(url)) return;
    if (fromShopper) {
      const next = new URL(location.href);
      next.searchParams.set('variant', v.id);
      history.replaceState(history.state, '', next);
    }
    this.truth(v.id);
  }

  // Replaces server-truth nodes (inventory text, unit price, pickup, market prices) with the server's render.
  async truth(variantId) {
    this.ctrl?.abort();
    const ctrl = (this.ctrl = new AbortController());
    const url = new URL(location.href);
    url.searchParams.set('section_id', this.sid);
    url.searchParams.set('variant', variantId);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) return;
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      for (const node of all(this.root, '[data-anvil-server-truth]')) {
        const key = CSS.escape(node.dataset.anvilServerTruth);
        const fresh = doc.querySelector(`[data-anvil-server-truth="${key}"]`);
        if (fresh) node.replaceWith(fresh);
      }
    } catch {
      // Aborted by a newer change, or offline: the client-side values stand.
    }
  }
}

// FormData → cart items: the main line (id, quantity, selling_plan, properties[…]) plus items[n][…] rows.
function toItems(data) {
  const main = { quantity: 1, properties: {} };
  const rows = {};
  const numeric = /^(id|quantity|selling_plan)$/;
  for (const [key, value] of data) {
    let m;
    if (numeric.test(key)) {
      if (value) main[key] = +value;
    } else if ((m = key.match(/^properties\[(.+)\]$/))) {
      if (value) main.properties[m[1]] = value;
    } else if ((m = key.match(/^items\[(\d+)\]\[(\w+)\](?:\[(.+)\])?$/))) {
      const row = (rows[m[1]] ||= { properties: {} });
      if (m[3]) {
        if (value) row.properties[m[3]] = value;
      } else row[m[2]] = numeric.test(m[2]) ? +value : value;
    }
  }
  return [main, ...Object.values(rows)]
    .filter((item) => item.id)
    .map((item) => {
      if (!Object.keys(item.properties).length) delete item.properties;
      return item;
    });
}

const nativeSubmit = (form) => HTMLFormElement.prototype.submit.call(form);

class ProductForm extends HTMLElement {
  connectedCallback() {
    this.form = this.closest('form') || document.getElementById(this.getAttribute('form-id'));
    this.form?.addEventListener('submit', this.onSubmit);
  }

  disconnectedCallback() {
    this.form?.removeEventListener('submit', this.onSubmit);
  }

  message(error, status = '') {
    const box = this.querySelector('[data-anvil-form-error]');
    const live = this.querySelector('[data-anvil-form-status]');
    if (box) box.textContent = error;
    if (live) live.textContent = status;
  }

  // The drawer (a modal) opens on add: announce there. Otherwise the status region speaks and the button shows it.
  added(text) {
    const live = document.querySelector('dialog[open] [data-anvil-live]');
    if (live) {
      live.textContent = '';
      setTimeout(() => (live.textContent = text), 60);
      return;
    }
    this.message('', text);
    const label = this.querySelector('[data-anvil-bind="add_label"]');
    if (!label) return;
    const before = label.textContent;
    label.textContent = text;
    setTimeout(() => label.textContent === text && (label.textContent = before), 2000);
  }

  onSubmit = async (e) => {
    const form = this.form;
    if (e.defaultPrevented) return;
    e.preventDefault();
    if (this.busy) return;
    const controls = [...form.elements];
    const invalid = controls.find((el) => el.willValidate && !el.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    const data = new FormData(form);
    if ([...data.values()].some((value) => value instanceof File && value.size)) return nativeSubmit(form);
    const buttons = controls.filter((el) => el.type === 'submit');
    this.busy = true;
    this.message('');
    for (const b of buttons) b.setAttribute('aria-busy', 'true');
    try {
      const api = A.cart || (await import(A.modules['cart-api']));
      await api.cartAdd(toItems(data), { sections: ['anvil-cart-drawer', 'anvil-cart-bubble'], source: 'add' });
      this.added(say('added', 'Added to cart'));
      if (A.settings?.cartType === 'page' && A.routes?.cart) {
        await Promise.race([A.gifts?.settled?.(), new Promise((done) => setTimeout(done, 3000))]);
        location.assign(A.routes.cart);
      }
    } catch (err) {
      if (err?.status >= 400 && err.status < 500) {
        this.message(err.description || err.message || say('cartError', 'Could not update your cart. Please try again.'));
      } else nativeSubmit(form);
    } finally {
      this.busy = false;
      for (const b of buttons) b.removeAttribute('aria-busy');
    }
  };
}

class Quantity extends HTMLElement {
  connectedCallback() {
    this.sid = this.getAttribute('section-id');
    this.input = this.querySelector('input[type="number"]');
    this.addEventListener('click', this.onClick);
    this.addEventListener('change', this.onChange);
    this.offs = [listen('anvil:variant:changed', this.onVariant)];
    if (A.designMode && this.querySelector('[data-anvil-tier-warn]')) this.offs.push(listen('anvil:cart:updated', this.onCart));
    this.sync();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('change', this.onChange);
    for (const off of this.offs || []) off();
  }

  get value() {
    return +(this.input || this.querySelector('input:checked'))?.value || 1;
  }

  onClick = (e) => {
    const step = e.target.closest('[data-anvil-step]');
    if (step && this.input && step.getAttribute('aria-disabled') !== 'true') {
      this.set(+this.input.value + (+this.input.step || 1) * step.dataset.anvilStep);
    }
  };

  onChange = (e) => {
    if (e.target === this.input) this.set(+this.input.value);
    else this.changed();
  };

  set(n) {
    const input = this.input;
    const min = +input.min || 1;
    const step = +input.step || 1;
    const max = +input.max || Infinity;
    input.value = Math.min(max, Math.max(min, min + Math.round(((n || min) - min) / step) * step));
    this.sync();
    this.changed();
  }

  sync() {
    const input = this.input;
    if (!input) return;
    for (const b of all(this, '[data-anvil-step]')) {
      const end = b.dataset.anvilStep < 0 ? +input.value <= (+input.min || 1) : !!input.max && +input.value >= +input.max;
      b.setAttribute('aria-disabled', String(end));
    }
  }

  changed() {
    const formId = this.getAttribute('form-id');
    emit('anvil:quantity:changed', { sectionId: this.sid, formId, quantity: this.value, mirror: this.hasAttribute('mirror') });
  }

  onVariant = ({ sectionId, variant: v }) => {
    if (sectionId !== this.sid || !v || this.hasAttribute('mirror')) return;
    const rule = v.quantity_rule || {};
    const min = rule.min || 1;
    const inc = rule.increment || 1;
    const max = Math.max(min, Math.min(rule.max || Infinity, +this.getAttribute('cap') || Infinity));
    if (this.input) {
      this.input.min = min;
      this.input.step = inc;
      if (max < Infinity) this.input.max = max;
      else this.input.removeAttribute('max');
      this.set(+this.input.value);
    }
    const tpl = this.dataset.anvilUnitTpl || '[price]';
    const tiers = all(this, 'input[data-anvil-tier]');
    for (const radio of tiers) {
      const q = +radio.value;
      const card = radio.parentElement;
      const unit = card.querySelector('[data-anvil-tier-unit]');
      const regular = card.querySelector('[data-anvil-tier-reg]');
      radio.disabled = q < min || q > max || q % inc > 0;
      if (unit) unit.textContent = tpl.replace('[price]', fmt(v.price - Math.round((v.price * (+radio.dataset.anvilPct || 0)) / 100)));
      if (regular) regular.lastElementChild.textContent = fmt(v.price);
    }
    if (tiers.length && !tiers.some((r) => r.checked && !r.disabled)) {
      const first = tiers.find((r) => !r.disabled);
      if (first) first.checked = true;
    }
  };

  // Editor only: does the cart line carry the discount the selected tier promises?
  onCart = ({ cart, source }) => {
    const warn = this.querySelector('[data-anvil-tier-warn]');
    const tier = this.querySelector('input[data-anvil-pct]:checked');
    const id = +idInput(document.getElementById(this.getAttribute('form-id')))?.value;
    const line = source === 'add' && cart?.items?.find((l) => l.variant_id === id && !l.properties?._anvil_gift);
    if (!tier || !line || line.quantity < +tier.value) return;
    const expected = Math.round((line.original_price * tier.dataset.anvilPct) / 100);
    const actual = Math.round((line.line_level_total_discount || 0) / line.quantity);
    const ok = Math.abs(expected - actual) <= 1;
    const title = tier.dataset.anvilTitle;
    warn.hidden = ok;
    warn.textContent = ok
      ? ''
      : warn.dataset.anvilTpl.replace('[title]', title).replace('[expected]', fmt(expected)).replace('[actual]', fmt(actual));
    emit('anvil:quantity:tier-check', { sectionId: this.sid, ok, expected, actual, title });
  };
}

class StickyBar extends HTMLElement {
  connectedCallback() {
    const formId = this.getAttribute('form-id');
    const button = document.getElementById(formId)?.querySelector('[type="submit"]');
    this.mirror = this.querySelector('anvil-quantity');
    this.main = document.querySelector(`anvil-quantity[form-id="${CSS.escape(formId)}"]:not([mirror])`);
    const source = this.main?.querySelector('input[type="number"]');
    if (this.mirror) {
      if (source) this.copy(source);
      else this.mirror.hidden = true;
    }
    this.off = listen('anvil:quantity:changed', this.onQuantity);
    for (const type of ['shopify:block:select', 'shopify:block:deselect']) this.addEventListener(type, this.onEditor);
    this.addEventListener('focusout', this.onFocusOut);
    this.ro = new ResizeObserver(() => this.pad());
    this.ro.observe(this);
    if (!button) return;
    // The root reaches far below the viewport, so its only edge is the viewport top: a jump from below the fold
    // straight past the button (anchor link, restored scroll) still crosses it.
    this.io = new IntersectionObserver(
      ([entry]) => {
        this.past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        this.toggle();
      },
      { rootMargin: '0px 0px 100000px 0px' }
    );
    this.io.observe(button);
  }

  disconnectedCallback() {
    this.io?.disconnect();
    this.ro?.disconnect();
    this.off?.();
    for (const type of ['shopify:block:select', 'shopify:block:deselect']) this.removeEventListener(type, this.onEditor);
    this.removeEventListener('focusout', this.onFocusOut);
    this.pad();
  }

  copy(source) {
    const input = this.mirror.querySelector('input');
    for (const name of ['min', 'max', 'step']) {
      if (source.hasAttribute(name)) input.setAttribute(name, source.getAttribute(name));
      else input.removeAttribute(name);
    }
    input.value = source.value;
    this.mirror.sync?.();
  }

  onQuantity = ({ formId, mirror, quantity }) => {
    const source = this.main?.querySelector('input[type="number"]');
    if (formId !== this.getAttribute('form-id') || !source) return;
    if (mirror) {
      if (this.main.set) this.main.set(quantity);
      else source.value = quantity;
    } else if (this.mirror) this.copy(source);
  };

  onEditor = (e) => {
    this.forced = e.type === 'shopify:block:select';
    this.toggle();
  };

  onFocusOut = () => setTimeout(this.toggle);

  toggle = () => {
    const show = !!(this.past || this.forced);
    if (!this.isConnected || (!show && this.contains(document.activeElement))) return;
    this.hidden = !show;
  };

  pad() {
    const height = this.isConnected && !this.hidden ? this.offsetHeight : 0;
    const root = document.documentElement;
    root.classList.toggle('av-is-sticky-shown', height > 0);
    root.style.setProperty('--av-sticky-bar-h', `${height}px`);
  }
}

// Quantity first: the picker may emit anvil:variant:changed while it connects (preselect sync).
for (const [name, cls] of [
  ['anvil-quantity', Quantity],
  ['anvil-sticky-bar', StickyBar],
  ['anvil-product-form', ProductForm],
  ['anvil-variant-picker', VariantPicker],
]) {
  if (!customElements.get(name)) customElements.define(name, cls);
}
