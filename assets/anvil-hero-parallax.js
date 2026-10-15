/* anvil-hero-parallax.js — <anvil-hero-parallax strength="0-50"> (sections/anvil-hero-parallax.liquid).
   Browsers with CSS scroll-driven animations move the layer from the section stylesheet alone, so the element does
   nothing there. Elsewhere it writes the same movement as a transform on [data-anvil-parallax]: from -shift (hero
   entering at the bottom of the window) to +shift (leaving at the top), shift = strength x hero height, which the
   layer's extra height (CSS) covers. It listens to scroll only while the hero is near the window, only on a device
   that hovers with a fine pointer, and only when motion is allowed (prefers-reduced-motion, html[data-animations]);
   the media query is watched, so changing the system setting stops or starts it at once. */
const NATIVE = !!window.CSS?.supports?.('animation-timeline: view()');
const QUERY = '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)';

class HeroParallax extends HTMLElement {
  #layer = null;
  #mq = null;
  #io = null;
  #near = false;
  #on = false;
  #raf = 0;

  connectedCallback() {
    this.#layer = this.querySelector('[data-anvil-parallax]');
    if (NATIVE || !this.#layer || !('IntersectionObserver' in window)) return;
    this.#mq = matchMedia(QUERY);
    this.#mq.addEventListener('change', this.#sync);
    this.#io = new IntersectionObserver((entries) => {
      this.#near = entries[entries.length - 1].isIntersecting;
      this.#sync();
    }, { rootMargin: '25% 0px' });
    this.#io.observe(this);
  }

  disconnectedCallback() {
    this.#io?.disconnect();
    this.#mq?.removeEventListener('change', this.#sync);
    this.#near = false;
    this.#sync();
  }

  get strength() {
    return Math.min(0.5, Math.max(0, parseFloat(this.getAttribute('strength')) / 100 || 0));
  }

  #sync = () => {
    const on = this.#near && !!this.#mq?.matches && document.documentElement.dataset.animations !== 'off' && this.strength > 0;
    if (on === this.#on) return;
    this.#on = on;
    const method = on ? 'addEventListener' : 'removeEventListener';
    window[method]('scroll', this.#queue, { passive: true });
    window[method]('resize', this.#queue);
    if (on) return this.#queue();
    cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    this.#layer.style.transform = '';
  };

  #queue = () => {
    this.#raf ||= requestAnimationFrame(this.#draw);
  };

  #draw = () => {
    this.#raf = 0;
    const { top, height } = this.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.max(-1, Math.min(1, (2 * top + height - vh) / (vh + height)));
    this.#layer.style.transform = `translate3d(0, ${(-p * height * this.strength).toFixed(1)}px, 0)`;
  };
}

customElements.get('anvil-hero-parallax') || customElements.define('anvil-hero-parallax', HeroParallax);
