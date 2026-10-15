/**
 * anvil-shoppable-image.js — sections/anvil-shoppable-image.liquid, on top of <anvil-hotspots> (assets/anvil-hotspots.js,
 * which opens one card at a time, closes it on Esc and returns focus to the dot).
 * Each dot has aria-haspopup="dialog"; its card is a non-modal role="dialog" (tabindex -1) in the same spot wrapper.
 * - A card opened from a focused dot takes focus, so keyboard and screen reader users land in it; the block select of
 *   the theme editor leaves focus where it is.
 * - A card set to open above its dot (--up) whose top would sit above the header at the top of the page (a low dot on
 *   a short phone image in the first section) opens below the dot instead, until it closes.
 * - Focus reaching another dot closes the open card, so a card never covers the focused dot (WCAG 2.4.11).
 * - A card closed because focus moved into a modal <dialog> (the cart drawer after an add) hands focus back to its dot
 *   when that dialog closes: the drawer's opener, the card's button, is hidden by then.
 * - [data-anvil-spot-close] closes its card and returns focus to the dot.
 * A click on the image away from every dot and card closes the open card in the component itself.
 * Listeners sit on document, so editor re-renders (shopify:section:load) need no re-binding.
 */
const SCOPE = '.av-shoppable-image';
const UP = 'av-shoppable-image__spot--up';
const FLIP = 'av-shoppable-image__spot--flip';
let back = null;

document.addEventListener('anvil:hotspot:toggle', (e) => {
  const { spot, open } = e.detail || {};
  if (!spot?.closest(SCOPE)) return;
  const wrap = spot.parentElement;
  if (!open) {
    wrap.classList.replace(FLIP, UP);
    if (document.activeElement?.closest('dialog[open]')) back = spot;
    return;
  }
  const pop = e.target.popFor?.(spot);
  if (!pop) return;
  if (wrap.classList.contains(UP)) {
    const head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--av-header-height')) || 0;
    if (pop.getBoundingClientRect().top + scrollY < head) wrap.classList.replace(UP, FLIP);
  }
  if (document.activeElement !== spot) return;
  pop.focus({ preventScroll: true });
  pop.scrollIntoView({ block: 'nearest' });
});

document.addEventListener('focusin', (e) => {
  const spot = e.target.closest?.(`${SCOPE} [data-spot]`);
  if (spot && spot.getAttribute('aria-expanded') !== 'true') spot.closest('anvil-hotspots')?.closeAll?.();
});

// Capture: runs before the dialog's own close listeners, after its failed focus restore.
document.addEventListener('close', (e) => {
  const a = document.activeElement;
  if (back?.isConnected && (!a || a === document.body || e.target.contains?.(a))) back.focus({ preventScroll: true });
  back = null;
}, true);

document.addEventListener('click', (e) => {
  const host = e.target.closest?.(`${SCOPE} anvil-hotspots`);
  if (!host?.closeAll) return;
  const close = e.target.closest('[data-anvil-spot-close]');
  if (!close) return;
  const pop = close.closest('[role="dialog"]');
  const spot = host.spots.find((s) => s.getAttribute('aria-controls') === pop?.id);
  if (spot) host.close(spot, true);
});
