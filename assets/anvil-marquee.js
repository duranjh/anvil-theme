/**
 * anvil-marquee.js — <anvil-marquee speed="40" direction="left|right" pause-on-hover>: an endless strip.
 *
 * Wraps one [data-marquee-track]. The element clones the track (aria-hidden, ids stripped, controls untabbable) as
 * many times as needed to cover the width, and sets --av-marquee-duration (track width ÷ speed, speed in px per
 * second, default 40) and --av-marquee-direction for the CSS keyframes in anvil-marquee.css. Under reduced motion or
 * html[data-animations="off"] no clones are made and .is-static shows one wrapping row. Pauses on hover (with the
 * attribute), on focus within, and while a block inside is selected in the editor (.is-paused).
 * No events, no methods; everything is attribute driven.
 */
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

class Marquee extends HTMLElement {
  #track;
  #clones = [];
  #ro;

  connectedCallback() {
    this.#track = this.querySelector('[data-marquee-track]');
    if (!this.#track) return;
    this.classList.toggle('av-marquee--hover', this.hasAttribute('pause-on-hover'));
    this.style.setProperty('--av-marquee-direction', this.getAttribute('direction') === 'right' ? 'reverse' : 'normal');
    this.#ro = new ResizeObserver(this.#layout);
    this.#ro.observe(this);
    this.#ro.observe(this.#track);
    reduce.addEventListener('change', this.#layout);
    this.addEventListener('shopify:block:select', this.#pause);
    this.addEventListener('shopify:block:deselect', this.#resume);
    this.#layout();
  }

  disconnectedCallback() {
    this.#ro?.disconnect();
    reduce.removeEventListener('change', this.#layout);
    this.removeEventListener('shopify:block:select', this.#pause);
    this.removeEventListener('shopify:block:deselect', this.#resume);
    this.#clear();
  }

  #pause = () => this.classList.add('is-paused');
  #resume = () => this.classList.remove('is-paused');

  #clear() {
    for (const clone of this.#clones) clone.remove();
    this.#clones = [];
  }

  #layout = () => {
    const off = reduce.matches || document.documentElement.dataset.animations === 'off';
    this.classList.toggle('is-static', off);
    if (off) return this.#clear();
    const width = this.#track.getBoundingClientRect().width;
    if (!width) return;
    const speed = Math.max(1, parseFloat(this.getAttribute('speed')) || 40);
    this.style.setProperty('--av-marquee-duration', `${(width / speed).toFixed(2)}s`);
    const needed = Math.max(1, Math.ceil(this.clientWidth / width));
    if (this.#clones.length === needed) return;
    this.#clear();
    for (let i = 0; i < needed; i++) {
      const clone = this.#track.cloneNode(true);
      clone.removeAttribute('data-marquee-track');
      clone.setAttribute('data-marquee-clone', '');
      clone.setAttribute('aria-hidden', 'true');
      for (const el of clone.querySelectorAll('[id]')) el.removeAttribute('id');
      for (const el of clone.querySelectorAll('a, button, input, select, textarea, [tabindex]')) el.tabIndex = -1;
      this.#clones.push(clone);
    }
    this.#track.after(...this.#clones);
  };
}

customElements.get('anvil-marquee') || customElements.define('anvil-marquee', Marquee);
