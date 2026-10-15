/* anvil-collage.js — video tiles of sections/anvil-collage.liquid. Each tile's button opens its own
 * <anvil-dialog data-anvil-collage-video> (anvil-core.js: showModal, scroll lock, focus back to the button). This
 * module only ties playback to that dialog. An uploaded video waits in an inert <template data-anvil-collage-player>
 * (a <video> in the page fetches its poster and metadata even in a closed dialog); the first open swaps it in for the
 * template and its fallback link. Opening starts the video, because the shopper asked for it with the click (an
 * uploaded video plays; a YouTube/Vimeo facade is pressed, or its player reloaded); closing pauses the uploaded
 * video and unloads the YouTube/Vimeo player, so no sound keeps playing from a closed dialog (WCAG 1.4.2). Listens
 * on document, so section re-renders in the editor need no clean-up. */
const HOST = '[data-anvil-collage-video]';
const host = (e) => {
  const el = e.detail?.element;
  return el instanceof Element && el.matches(HOST) ? el : null;
};

document.addEventListener('anvil:dialog:opened', (e) => {
  const el = host(e);
  if (!el) return;
  const tpl = el.querySelector('template[data-anvil-collage-player]');
  if (tpl) {
    el.querySelector('[data-anvil-collage-fallback]')?.remove();
    tpl.replaceWith(document.importNode(tpl.content, true));
  }
  const video = el.querySelector('dialog video');
  if (video) {
    video.play()?.catch(() => {});
    return;
  }
  const frame = el.querySelector('dialog iframe[data-anvil-src]');
  if (frame) {
    frame.src = frame.dataset.anvilSrc;
    delete frame.dataset.anvilSrc;
    return;
  }
  if (customElements.get('anvil-video-facade')) el.querySelector('dialog [data-anvil-play]')?.click();
});

document.addEventListener('anvil:dialog:closed', (e) => {
  const el = host(e);
  if (!el) return;
  el.querySelector('dialog video')?.pause();
  for (const frame of el.querySelectorAll('dialog iframe')) {
    if (frame.dataset.anvilSrc) continue;
    frame.dataset.anvilSrc = frame.src;
    frame.src = 'about:blank';
  }
});
