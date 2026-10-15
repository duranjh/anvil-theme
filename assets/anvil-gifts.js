/**
 * anvil-gifts.js — the gift engine (WAVE1-CONTRACTS §5), shared by the product page's quantity_gifts block and the
 * cart drawer's gift_threshold block. Each renders one <script type="application/json" data-anvil-gift-rule>:
 *   { "key": "qty:<trigger product id>:<min>", "trigger": "quantity", "productId": 1, "min": 3, "giftVariantId": 2 }
 *   { "key": "spend:<threshold cents>", "trigger": "spend", "threshold": 5000, "giftVariantId": 2, "excludeGifts": true }
 * After every anvil:cart:updated whose source is not 'gift' (and once on load) the engine reads every rule on the
 * page and, through Anvil.cart with source 'gift':
 *   - adds {id: giftVariantId, quantity: 1, properties: {_anvil_gift: key}} when the condition holds and no line
 *     carries that key;
 *   - sets the line to 0 when the condition stops holding;
 *   - clamps a gift line to quantity 1 and removes duplicate lines of one key.
 * Quantity counts only non-gift lines of the trigger product; spend uses cart.total_price, minus every line carrying
 * _anvil_gift when excludeGifts. Keys encode their own condition, so a gift line whose rule is not on this page is
 * still removed once that condition fails (a "spend" key read this way excludes gift lines).
 * A shopper removing a gift line while its condition still holds stores sessionStorage['anvil_gift_dismissed:' + key]
 * and the key is skipped for the rest of the session. Cart errors (422 sold out) are swallowed and logged once per key;
 * a refused add is not retried during the page view.
 * The theme only adds the line; the price comes from the merchant's Buy X Get Y automatic discount, and the drawer
 * prints "FREE" only when Shopify priced the line at zero.
 * Every change re-renders the sections the page names with [data-anvil-cart-render] (drawer, bubble, the cart page's
 * own sections; ≤ 5), so the cart page never keeps a removed gift row or stale totals. The first run on load is
 * skipped when every rule says the cart is empty (data-anvil-cart-count="0") and no gift line is rendered
 * ([data-anvil-gift-key]); the first cart event still runs the engine. window.Anvil.gifts.settled() resolves once
 * the current run (and any rerun it queued) is done: the product form waits for it before opening a cart page.
 *
 * Exports (pure; tests/gifts.test.mjs):
 *   planGiftChanges(cart, rules, dismissed) → [{action: 'add', key, id, quantity: 1, properties}
 *                                              | {action: 'remove', key, line, quantity: 0}
 *                                              | {action: 'clamp', key, line, quantity: 1}]   (line = line item key)
 *   detectDismissed(previousCart, cart, rules) → keys whose gift line the shopper removed while the rule still holds
 */
const PROP = '_anvil_gift';
const DISMISSED = 'anvil_gift_dismissed:';
const giftOf = (item) => (item && item.properties && item.properties[PROP]) || '';

function valid(rule) {
  if (!rule || !rule.key) return false;
  if (rule.trigger === 'quantity') return Number(rule.productId) > 0;
  return rule.trigger === 'spend' && Number(rule.threshold) > 0;
}

// A rule rebuilt from a key alone ("qty:<id>:<min>" or "spend:<cents>"), used only to remove orphaned gift lines.
function fromKey(key) {
  const [kind, a, b] = String(key).split(':');
  if (kind === 'qty') return { key, trigger: 'quantity', productId: Number(a), min: Number(b) };
  if (kind === 'spend') return { key, trigger: 'spend', threshold: Number(a), excludeGifts: true };
  return null;
}

function holds(cart, rule) {
  const items = (cart && cart.items) || [];
  const paid = items.filter((item) => !giftOf(item));
  if (rule.trigger === 'quantity') {
    const qty = paid.reduce((n, i) => n + (Number(i.product_id) === Number(rule.productId) ? Number(i.quantity) : 0), 0);
    return qty >= Math.max(1, Number(rule.min) || 1);
  }
  if (!paid.length) return false;
  const gifts = rule.excludeGifts ? items.reduce((n, i) => n + (giftOf(i) ? Number(i.final_line_price) || 0 : 0), 0) : 0;
  return (Number(cart.total_price) || 0) - gifts >= Number(rule.threshold);
}

function unique(rules) {
  const seen = new Map();
  for (const rule of rules || []) if (valid(rule) && !seen.has(rule.key)) seen.set(rule.key, rule);
  return seen;
}

export function planGiftChanges(cart, rules = [], dismissed = []) {
  const skip = new Set(dismissed);
  const byKey = unique(rules);
  const items = (cart && cart.items) || [];
  for (const item of items) {
    const key = giftOf(item);
    const derived = key && !byKey.has(key) ? fromKey(key) : null;
    if (derived && valid(derived)) byKey.set(key, { ...derived, orphan: true });
  }
  const plan = [];
  for (const rule of byKey.values()) {
    const lines = items.filter((item) => giftOf(item) === rule.key);
    if (!holds(cart, rule)) {
      for (const line of lines) plan.push({ action: 'remove', key: rule.key, line: line.key, quantity: 0 });
    } else if (!lines.length) {
      if (!rule.orphan && !skip.has(rule.key) && Number(rule.giftVariantId) > 0) {
        plan.push({ action: 'add', key: rule.key, id: Number(rule.giftVariantId), quantity: 1, properties: { [PROP]: rule.key } });
      }
    } else {
      for (const line of lines.slice(1)) plan.push({ action: 'remove', key: rule.key, line: line.key, quantity: 0 });
      if (Number(lines[0].quantity) > 1) plan.push({ action: 'clamp', key: rule.key, line: lines[0].key, quantity: 1 });
    }
  }
  return plan;
}

export function detectDismissed(previous, cart, rules = []) {
  if (!previous || !cart) return [];
  const had = new Set(((previous.items) || []).map(giftOf).filter(Boolean));
  const has = new Set(((cart.items) || []).map(giftOf).filter(Boolean));
  return [...unique(rules).values()].filter((r) => had.has(r.key) && !has.has(r.key) && holds(cart, r)).map((r) => r.key);
}

if (typeof document !== 'undefined') {
  const FALLBACK = ['anvil-cart-drawer', 'anvil-cart-bubble'];
  const logged = new Set();
  const failed = new Set(); // gift adds Shopify refused (sold out): not retried during this page view
  let last = null;
  let active = null;
  let again = false;

  const api = async () => window.Anvil?.cart || import(window.Anvil.modules['cart-api']);
  const sections = () => {
    const ids = [...document.querySelectorAll('[data-anvil-cart-render]')].map((el) => el.dataset.anvilCartRender);
    const list = [...new Set(ids.filter(Boolean))].slice(0, 5);
    return list.length ? list : FALLBACK;
  };
  const session = (key, set) => {
    try {
      if (set) sessionStorage.setItem(DISMISSED + key, '1');
      return sessionStorage.getItem(DISMISSED + key) === '1';
    } catch {
      return false;
    }
  };
  const readRules = () =>
    [...document.querySelectorAll('[data-anvil-gift-rule]')].flatMap((el) => {
      try {
        return [JSON.parse(el.textContent)];
      } catch {
        return [];
      }
    });

  const once = async (cart) => {
    try {
      const cartApi = await api();
      const current = cart || (await cartApi.cartGet());
      const rules = readRules();
      for (const key of detectDismissed(last, current, rules)) session(key, true);
      last = current;
      const keys = rules.map((r) => r && r.key).filter((k) => k && (session(k) || failed.has(k)));
      for (const step of planGiftChanges(current, rules, keys)) {
        try {
          const opts = { sections: sections(), source: 'gift' };
          if (step.action === 'add') await cartApi.cartAdd([{ id: step.id, quantity: 1, properties: step.properties }], opts);
          else await cartApi.cartChange({ id: step.line, quantity: step.quantity }, opts);
        } catch (err) {
          if (step.action === 'add') failed.add(step.key);
          if (!logged.has(step.key)) console.warn('[anvil] gift line not changed', step.key, err?.description || err);
          logged.add(step.key);
        }
      }
    } catch {
      // no cart API or cart read failed; the next cart event retries
    }
  };

  // One run at a time; a cart event during a run queues one more run with a fresh cart read.
  const run = (cart) => {
    if (active) {
      again = true;
      return active;
    }
    active = (async () => {
      let next = cart;
      do {
        again = false;
        await once(next);
        next = null;
      } while (again);
    })().finally(() => (active = null));
    return active;
  };

  const anvil = (window.Anvil ||= {});
  anvil.gifts = { settled: () => active || Promise.resolve() };

  document.addEventListener('anvil:cart:updated', (e) => {
    const { cart, source } = e.detail || {};
    if (source === 'gift') {
      if (cart) last = cart;
    } else run(cart || null);
  });
  const boot = () => {
    const rules = [...document.querySelectorAll('[data-anvil-gift-rule]')];
    if (document.querySelector('[data-anvil-gift-key]') || rules.some((el) => el.dataset.anvilCartCount !== '0')) run(null);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}
