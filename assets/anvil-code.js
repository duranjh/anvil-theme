/**
 * anvil-code.js — discount-code helpers for any section that shows a code (announcement bar today; product and
 * drawer blocks later). Delegated on `document`, so it works for markup added after load.
 *
 *   <button data-anvil-copy="CODE" data-anvil-copied="Copied">  copies CODE (Clipboard API), adds .av-is-copied for
 *     two seconds and writes the confirmation into the nearest [data-anvil-code-status] (polite live region).
 *   <a href="…/discount/CODE?redirect=…" data-anvil-apply="CODE" data-anvil-applied="Applied">  without JavaScript the
 *     link applies the code through Shopify's discount URL and comes back; with it the code is added to the cart
 *     through Anvil.cart.applyDiscount, keeping codes already on the cart (read from cart.discount_codes), and the
 *     drawer and bubble re-render. A code the cart cannot use reports `codeInvalid` instead of claiming success.
 */
const api = () => window.Anvil || {};
const tr = (keys, vars, fallback) => (api().dom?.t ? api().dom.t(keys, vars, fallback) : fallback);

function status(el, text) {
  const box = el.closest('[data-anvil-code-scope]')?.querySelector('[data-anvil-code-status]') ||
    el.parentElement?.querySelector('[data-anvil-code-status]');
  if (!box) return;
  box.textContent = '';
  setTimeout(() => { box.textContent = text; }, 60);
}

async function copy(btn) {
  if (!navigator.clipboard) return;
  try {
    await navigator.clipboard.writeText(btn.dataset.anvilCopy);
    btn.classList.add('av-is-copied');
    status(btn, btn.dataset.anvilCopied || tr(['copied'], null, 'Copied'));
    setTimeout(() => btn.classList.remove('av-is-copied'), 2000);
  } catch {
    // clipboard refused; the code stays visible to copy by hand
  }
}

async function apply(link) {
  const cart = api().cart;
  if (!cart?.applyDiscount || !cart.cartGet) {
    location.assign(link.href);
    return;
  }
  const code = link.dataset.anvilApply;
  const ids = [...document.querySelectorAll('[data-anvil-cart-render]')].map((el) => el.dataset.anvilCartRender);
  try {
    const current = await cart.cartGet();
    const codes = (current?.discount_codes || []).filter((d) => d.applicable !== false).map((d) => d.code);
    const result = await cart.applyDiscount(code, { codes, sections: [...new Set(ids)].slice(0, 5), source: 'discount' });
    const hit = (result?.discount_codes || []).find((d) => String(d.code).toLowerCase() === code.toLowerCase());
    if (hit && hit.applicable === false) status(link, tr(['codeInvalid'], null, 'That code is not valid for this cart.'));
    else {
      link.classList.add('av-is-copied');
      status(link, link.dataset.anvilApplied || tr(['codeApplied'], null, 'Code applied'));
    }
  } catch (err) {
    status(link, err?.description || tr(['codeInvalid'], null, 'That code is not valid for this cart.'));
  }
}

// A module URL evaluates once per page, so this listener is registered once however many sections load it.
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const copyBtn = e.target.closest('[data-anvil-copy]');
  const applyLink = e.target.closest('[data-anvil-apply]');
  if (copyBtn) {
    e.preventDefault();
    copy(copyBtn);
  } else if (applyLink) {
    e.preventDefault();
    apply(applyLink);
  }
});
