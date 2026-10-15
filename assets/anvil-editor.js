/**
 * anvil-editor.js — helpers that run only inside the Shopify theme editor
 * (layout/theme.liquid loads this module when request.design_mode is true).
 *
 * Keeps edited content visible:
 *   shopify:section:select  → opens the drawer / dialog inside that section marked data-anvil-editor-open
 *                             (anvil-drawer, anvil-dialog, a native <dialog>, or any element exposing open()).
 *   shopify:block:select    → opens the nearest drawer / dialog that contains the block (anvil-drawer, anvil-dialog,
 *                             anvil-cart-drawer, <dialog>, [data-anvil-editor-open]).
 *   deselect events         → close what this module opened, after a short grace period so moving between blocks
 *                             inside the same drawer does not flicker. data-anvil-editor-open="keep" opts out.
 * No exports; nothing here runs on the live storefront.
 */
const HOSTS = 'anvil-drawer, anvil-dialog, anvil-cart-drawer, dialog, [data-anvil-editor-open]';
const opened = new Set();
let closeTimer = 0;

function openHost(el) {
  if (!el || opened.has(el)) return;
  if (el instanceof HTMLDialogElement) {
    if (!el.open) el.showModal();
  } else if (typeof el.open === 'function') {
    if (!el.isOpen) el.open();
  } else {
    return;
  }
  opened.add(el);
}

function closeOpened() {
  for (const el of opened) {
    opened.delete(el);
    if (el.getAttribute('data-anvil-editor-open') === 'keep') continue;
    try {
      el.close?.();
    } catch {
      // already gone
    }
  }
}

function onSelect(e) {
  clearTimeout(closeTimer);
  const target = e.target;
  if (!(target instanceof Element)) return;
  const host =
    e.type === 'shopify:block:select' ? target.closest(HOSTS) : target.querySelector('[data-anvil-editor-open]');
  if (host) openHost(host);
}

function onDeselect() {
  clearTimeout(closeTimer);
  closeTimer = setTimeout(closeOpened, 250);
}

document.addEventListener('shopify:section:select', onSelect);
document.addEventListener('shopify:block:select', onSelect);
document.addEventListener('shopify:section:deselect', onDeselect);
document.addEventListener('shopify:block:deselect', onDeselect);
document.documentElement.classList.add('av-design-mode');
