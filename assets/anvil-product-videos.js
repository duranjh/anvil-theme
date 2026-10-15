/**
 * anvil-product-videos.js — <anvil-product-videos> for sections/anvil-product-videos.liquid.
 * Uploaded (Shopify-hosted) videos only. YouTube and Vimeo stay click-to-load facades (snippets/anvil-media.liquid);
 * once tapped they are cross-origin players this module cannot see, pause or mute.
 * Muted play while in view is anvil-core's, like every other autoplaying video in the theme (snippets/anvil-media
 * `autoplay`, data-anvil-autoplay; DECISIONS 94): it starts only when motion is allowed and data is not being saved,
 * keeps the controls, and a shopper's pause sticks. This module adds what is specific to a wall of videos:
 * - Deferred cards ([data-pv-defer], below the first row): Liquid renders a lazy poster image and keeps the video
 *   markup in a <noscript>. Within 200 px of the view the video replaces the poster and reuses the poster image the
 *   browser already chose, so cards the shopper never reaches load no metadata and no full-size poster; the new video
 *   is handed to anvil-core's autoplay. Without JavaScript the noscript copy shows the video itself.
 * - Pause out of view: a video with sound that the shopper started pauses once it is fully out of view (also when
 *   swiped out of the slider). Muted autoplay videos are paused and resumed by anvil-core.
 * - One sound at a time: a video that plays with sound, started or unmuted, pauses every other video here with sound.
 * Cleans up in disconnectedCallback.
 */
const isVideo = (el) => el instanceof HTMLVideoElement;

class ProductVideos extends HTMLElement {
  #io = null;
  #near = null;

  connectedCallback() {
    this.addEventListener('play', this.#onSound, true);
    this.addEventListener('volumechange', this.#onSound, true);
    this.#io = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) if (!isIntersecting && !target.muted && !target.paused) target.pause();
    });
    for (const video of this.querySelectorAll('video')) this.#io.observe(video);
    const later = this.querySelectorAll('[data-pv-defer]');
    if (!later.length) return;
    this.#near = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) if (isIntersecting) this.#mount(target);
      },
      { rootMargin: '200px' }
    );
    for (const box of later) this.#near.observe(box);
  }

  disconnectedCallback() {
    this.removeEventListener('play', this.#onSound, true);
    this.removeEventListener('volumechange', this.#onSound, true);
    this.#io?.disconnect();
    this.#near?.disconnect();
    this.#io = this.#near = null;
  }

  #mount(box) {
    this.#near?.unobserve(box);
    const tpl = document.createElement('template');
    tpl.innerHTML = box.querySelector('noscript')?.textContent || '';
    const media = tpl.content.firstElementChild;
    const video = tpl.content.querySelector('video');
    if (!media || !video) return;
    const poster = box.querySelector('img')?.currentSrc;
    if (poster) {
      video.poster = poster;
      video.querySelector('img')?.remove();
    }
    box.replaceWith(tpl.content);
    this.#io?.observe(video);
    window.Anvil?.media?.autoplay?.(media.parentElement || this);
  }

  #onSound = (e) => {
    const video = e.target;
    if (!isVideo(video) || video.muted || video.paused) return;
    for (const other of this.querySelectorAll('video')) if (other !== video && !other.muted && !other.paused) other.pause();
  };
}

if (!customElements.get('anvil-product-videos')) customElements.define('anvil-product-videos', ProductVideos);
