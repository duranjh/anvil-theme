/**
 * anvil-hero-slideshow.js — keeps keyboard focus inside a fade hero slideshow (sections/anvil-hero-slideshow.liquid,
 * loaded only when its transition is Fade and it has two or more slides).
 * In fade mode a slide that has left the stage is visibility:hidden, so a focused link or button in it would drop
 * focus to <body>, and <anvil-slider> would read that as focus leaving and resume autoplay. Two delegated listeners:
 * - keydown (capture, so it runs before the slider's own ArrowLeft/ArrowRight handler): focus inside a slide moves to
 *   the slider's track, which is focusable whenever it scrolls, so focus and the autoplay pause stay in the carousel;
 * - focusout: when a slide is hidden some other way (a swipe) and its focused element loses focus to nothing, focus
 *   goes back to the track.
 * Delegated on document, so sections the editor re-renders need no setup and there is nothing to clean up. Remove
 * this file once assets/anvil-slider.js moves focus to the track itself (docs/sections/hero-slideshow.md).
 */
const SLIDE = '.av-hero-slideshow--fade > [data-slider-track] > [data-slider-slide]';

const trackOf = (el) => el?.closest?.(SLIDE)?.parentElement;

const toTrack = (track) => {
  if (track?.isConnected && track.hasAttribute('tabindex')) track.focus({ preventScroll: true });
};

document.addEventListener(
  'keydown',
  (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
    toTrack(trackOf(e.target));
  },
  true
);

document.addEventListener('focusout', (e) => {
  if (e.relatedTarget || !e.target.isConnected) return;
  const track = trackOf(e.target);
  if (track && getComputedStyle(e.target).visibility !== 'visible') toTrack(track);
});
