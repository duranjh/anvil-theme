/**
 * anvil-dom.js — DOM helpers shared by every Anvil module (core module, imported by anvil-core.js).
 *
 * Exports
 *   confineFocus(container, { initial, restore }) → release()
 *       Keeps Tab / Shift+Tab inside `container`, pulls focus back if it escapes (except into an open <dialog>),
 *       focuses `initial` (selector or element), else [autofocus], else the first tabbable, else the container.
 *       `restore` is the element focus returns to on release (default: the element focused when called).
 *   releaseFocus(container, { restore = true })     undo confineFocus and return focus to the opener
 *   focusables(root)                                tabbable elements inside root, in DOM order
 *   lockScroll() / unlockScroll()                   counted; toggles html.av-scroll-locked and sets --av-scrollbar-w
 *   debounce(fn, ms) → debounced function with .cancel()
 *   formatMoney(cents, format?)                     Shopify money formats; default format follows the
 *                                                   show-currency-code setting (window.Anvil.settings.showCurrencyCode)
 *   onReady(fn)                                     run now or on DOMContentLoaded
 *   t(key | keys[], vars?, fallback?)               window.Anvil.strings lookup (first key found wins) with
 *                                                   {{ var }} or [var] interpolation
 *   motionOff()                                     true under prefers-reduced-motion or html[data-animations="off"]
 *
 * Function names are chosen to stay clear of the identifiers listed in docs/FORBIDDEN.md.
 */

const TABBABLE =
  'a[href], area[href], button, input, select, textarea, summary, iframe, audio[controls], video[controls], ' +
  '[tabindex], [contenteditable=""], [contenteditable="true"]';

export function focusables(root) {
  return [...root.querySelectorAll(TABBABLE)].filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      el.tabIndex >= 0 &&
      !el.closest('[hidden], [inert]') &&
      (el.offsetWidth || el.offsetHeight || el.getClientRects().length)
  );
}

const traps = new WeakMap();

export function confineFocus(container, { initial, restore } = {}) {
  releaseFocus(container, { restore: false });
  const opener = restore === undefined ? document.activeElement : restore;
  const onKey = (e) => {
    if (e.key !== 'Tab') return;
    const list = focusables(container);
    if (!list.length) {
      e.preventDefault();
      container.focus();
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;
    const inside = container.contains(active);
    if (e.shiftKey && (active === first || !inside)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !inside)) {
      e.preventDefault();
      first.focus();
    }
  };
  const onFocusIn = (e) => {
    if (container.contains(e.target) || e.target.closest?.('dialog[open]')) return;
    (focusables(container)[0] || container).focus();
  };
  container.addEventListener('keydown', onKey);
  document.addEventListener('focusin', onFocusIn);
  traps.set(container, { onKey, onFocusIn, opener });
  const target =
    (typeof initial === 'string' ? container.querySelector(initial) : initial) ||
    container.querySelector('[autofocus]') ||
    focusables(container)[0] ||
    container;
  target.focus({ preventScroll: true });
  return () => releaseFocus(container);
}

export function releaseFocus(container, { restore = true } = {}) {
  const trap = traps.get(container);
  if (!trap) return;
  container.removeEventListener('keydown', trap.onKey);
  document.removeEventListener('focusin', trap.onFocusIn);
  traps.delete(container);
  const { opener } = trap;
  if (restore && opener && opener.isConnected && typeof opener.focus === 'function') {
    opener.focus({ preventScroll: true });
  }
}

let locks = 0;

export function lockScroll() {
  if (locks++ > 0) return;
  const html = document.documentElement;
  html.style.setProperty('--av-scrollbar-w', `${window.innerWidth - html.clientWidth}px`);
  html.classList.add('av-scroll-locked');
}

export function unlockScroll() {
  if (locks === 0) return;
  if (--locks === 0) document.documentElement.classList.remove('av-scroll-locked');
}

export function debounce(fn, ms = 200) {
  let id;
  const debounced = (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => clearTimeout(id);
  return debounced;
}

// Shopify money placeholders → [decimals, thousands separator, decimal separator]
const MONEY = {
  amount: [2, ',', '.'],
  amount_no_decimals: [0, ',', '.'],
  amount_with_comma_separator: [2, '.', ','],
  amount_no_decimals_with_comma_separator: [0, '.', ','],
  amount_with_apostrophe_separator: [2, "'", '.'],
  amount_with_space_separator: [2, ' ', ','],
  amount_no_decimals_with_space_separator: [0, ' ', ','],
  amount_with_period_and_space_separator: [2, ' ', '.'],
};

export function formatMoney(cents, format) {
  const A = window.Anvil || {};
  const withCode = !!A.settings?.showCurrencyCode;
  if (format == null) format = (withCode && A.moneyWithCurrencyFormat) || A.moneyFormat || '${{amount}}';
  let n = typeof cents === 'string' ? Number(cents.replace(/[^\d.-]/g, '')) : Number(cents);
  if (!Number.isFinite(n)) n = 0;
  let out = String(format).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const [decimals, thousands, point] = MONEY[key] || MONEY.amount;
    const [whole, fraction] = Math.abs(n / 100).toFixed(decimals).split('.');
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + (fraction ? point + fraction : '');
  });
  if (n < 0) out = `-${out}`;
  const code = A.currency || window.Shopify?.currency?.active;
  return withCode && code && !A.moneyWithCurrencyFormat && !out.includes(code) ? `${out} ${code}` : out;
}

export function onReady(fn) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
  else fn();
}

export function t(key, vars, fallback) {
  const strings = window.Anvil?.strings || {};
  const keys = [].concat(key);
  const found = keys.map((k) => strings[k]).find((v) => v != null);
  const str = found ?? fallback ?? keys[0];
  return String(str).replace(/\{\{\s*(\w+)\s*\}\}|\[(\w+)\]/g, (m, a, b) => {
    const name = a || b;
    return vars && name in vars ? vars[name] : '';
  });
}

export function motionOff() {
  return (
    document.documentElement.dataset.animations === 'off' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
