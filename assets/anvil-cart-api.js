/**
 * anvil-cart-api.js — Shopify Cart AJAX API wrapper (core module, imported by anvil-core.js).
 *
 * Exports
 *   cartAdd(items, opts)      POST routes.cart_add_url + '.js' {items}; the API returns only the added lines, so the
 *                             full cart is read afterwards. Resolves {cart, added, sections}; `cart` is null only when
 *                             that follow-up read failed.
 *   cartChange({id|line, quantity, properties, selling_plan}, opts)  → cart
 *   cartUpdate({updates, note, attributes, discount}, opts)          → cart
 *   cartGet()                 GET routes.cart_url + '.js' → cart (no event)
 *   applyDiscount(code, opts) → cart. `opts.codes` = codes already applied (kept; pass what the server rendered or
 *                             cart.discount_codes). `code` may be an array.
 *   removeDiscount(code, opts)→ cart. Without `code` every discount is removed; with one, `opts.codes` minus it are
 *                             re-sent (Shopify applies the full comma-separated list each time).
 *   cartClear(opts)           → empty cart (attributes and note survive, per Shopify)
 *   CartError                 {status, message, description, body}; status 0 = network/config error
 *
 * opts: { sections: string[] (≤ 5 section ids rendered in the same response), source: string, signal: AbortSignal,
 *         track: boolean (default true) }
 * Every mutation emits anvil:cart:updated {cart, sections, source} or anvil:cart:error {status, message,
 * description, source}. A response that lands after a newer mutation already finished is returned to its caller
 * but not emitted (monotonic sequence), so subscribers never render a stale cart. `track: false` keeps a quiet save
 * that re-renders nothing (order note, terms attribute) out of that sequence, so it can never make a line change's
 * response count as stale; such a save is always emitted.
 * Routes come from window.Anvil.routes, read by Liquid name (cart_add_url) or camelCase alias (cartAdd); no path is
 * hard-coded. The cart JSON's `discount_codes` ([{code, applicable}]) is used by callers to tell an applied code from
 * an ignored one.
 * No static imports: anvil-core.js loads the core modules from their versioned asset URLs, and events go through
 * window.Anvil.events (or a plain document event before the bus exists).
 */
function emit(topic, detail) {
  const bus = window.Anvil?.events;
  if (bus?.emit) return bus.emit(topic, detail);
  document.dispatchEvent(new CustomEvent(topic, { detail }));
  return detail;
}

export class CartError extends Error {
  constructor(status, message, description, body) {
    super(message || 'Cart request failed');
    this.name = 'CartError';
    this.status = status;
    this.description = description || '';
    this.body = body;
  }
}

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };
let sequence = 0;
let settled = 0;

// Liquid route name → the keys theme.liquid may use for it (snake_case Liquid name or camelCase alias).
const ROUTE_KEYS = {
  cart_url: ['cart_url', 'cart'],
  cart_add_url: ['cart_add_url', 'cartAdd'],
  cart_change_url: ['cart_change_url', 'cartChange'],
  cart_update_url: ['cart_update_url', 'cartUpdate'],
  cart_clear_url: ['cart_clear_url', 'cartClear'],
};

function route(name) {
  const routes = window.Anvil?.routes || {};
  const path = (ROUTE_KEYS[name] || [name]).map((key) => routes[key]).find(Boolean);
  if (!path) throw new CartError(0, 'Missing route', `window.Anvil.routes.${name} is not defined`);
  return `${path}.js`;
}

async function parse(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { description: text };
  }
}

async function request(url, init, source, tracked) {
  const mine = tracked ? ++sequence : 0;
  let res;
  let body;
  try {
    res = await fetch(url, init);
    body = await parse(res);
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    const error = new CartError(0, 'Network error', err.message);
    emit('anvil:cart:error', { status: 0, message: error.message, description: error.description, source });
    throw error;
  }
  if (!res.ok) {
    const error = new CartError(res.status, body.message, body.description, body);
    emit('anvil:cart:error', {
      status: error.status,
      message: error.message,
      description: error.description,
      source,
      body,
    });
    throw error;
  }
  const stale = tracked && mine < settled;
  if (tracked && !stale) settled = mine;
  return { body, stale };
}

function withSections(payload, sections) {
  if (Array.isArray(sections) && sections.length) {
    payload.sections = sections.slice(0, 5).join(',');
    payload.sections_url = window.location.pathname;
  }
  return payload;
}

function post(name, payload, opts, source) {
  return request(
    route(name),
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(withSections(payload, opts.sections)),
      signal: opts.signal,
    },
    source,
    opts.track !== false
  );
}

function publish(cart, sections, source, extra) {
  emit('anvil:cart:updated', { cart, sections: sections || {}, source, ...extra });
}

export async function cartGet() {
  const { body } = await request(route('cart_url'), { headers: { Accept: 'application/json' } }, 'get', false);
  return body;
}

export async function cartAdd(items, opts = {}) {
  const source = opts.source || 'add';
  const list = Array.isArray(items) ? items : [items];
  const { body, stale } = await post('cart_add_url', { items: list }, opts, source);
  let cart = null;
  try {
    cart = await cartGet();
  } catch {
    // The add itself succeeded; subscribers must tolerate a null cart.
  }
  const added = body.items || [];
  if (!stale) publish(cart, body.sections, source, { added });
  return { cart, added, sections: body.sections || {} };
}

export async function cartChange(change, opts = {}) {
  const source = opts.source || 'change';
  const { body, stale } = await post('cart_change_url', { ...change }, opts, source);
  if (!stale) publish(body, body.sections, source);
  return body;
}

export async function cartUpdate(payload, opts = {}) {
  const source = opts.source || 'update';
  const { body, stale } = await post('cart_update_url', { ...payload }, opts, source);
  if (!stale) publish(body, body.sections, source);
  return body;
}

export async function cartClear(opts = {}) {
  const source = opts.source || 'clear';
  const { body, stale } = await post('cart_clear_url', {}, opts, source);
  if (!stale) publish(body, body.sections, source);
  return body;
}

const clean = (code) => String(code).trim();

export function applyDiscount(code, opts = {}) {
  const codes = new Set((opts.codes || []).map(clean).filter(Boolean));
  for (const c of [].concat(code)) if (c) codes.add(clean(c));
  return cartUpdate({ discount: [...codes].join(',') }, { ...opts, source: opts.source || 'discount' });
}

export function removeDiscount(code, opts = {}) {
  const keep = code ? (opts.codes || []).map(clean).filter((c) => c && c !== clean(code)) : [];
  return cartUpdate({ discount: keep.join(',') }, { ...opts, source: opts.source || 'discount' });
}
