/**
 * anvil-scroll-top.js — <anvil-scroll-top threshold="400" data-anvil-editor-open> for sections/anvil-scroll-top.liquid.
 * Adds .av-is-in (the CSS shows the button) once the page has scrolled past `threshold` pixels, and keeps it while the
 * button holds focus so focus is never left on a hidden control. A click moves focus, when the button had it, to the
 * first focusable element of the page (the skip link) and scrolls to the top, smoothly only when motion is allowed.
 * Theme editor: nothing shows on load; selecting the section calls open() and deselecting calls close()
 * (assets/anvil-editor.js), so the merchant can see the button while editing it.
 */
class ScrollTop extends HTMLElement {
  #raf = 0;
  #pinned = false;
  #limit = 0;
  #btn = null;

  connectedCallback() {
    this.#limit = parseInt(this.getAttribute('threshold'), 10) || 0;
    this.#btn = this.querySelector('button');
    this.#btn?.addEventListener('click', this.#go);
    this.addEventListener('focusout', this.#queue);
    window.addEventListener('scroll', this.#queue, { passive: true });
    this.#update();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    this.#btn?.removeEventListener('click', this.#go);
    this.removeEventListener('focusout', this.#queue);
    window.removeEventListener('scroll', this.#queue);
  }

  get isOpen() {
    return this.#pinned;
  }

  open() {
    this.#pinned = true;
    this.#update();
  }

  close() {
    this.#pinned = false;
    this.#update();
  }

  #queue = () => {
    this.#raf ||= requestAnimationFrame(this.#update);
  };

  #update = () => {
    this.#raf = 0;
    const show = this.#pinned || window.scrollY > this.#limit || this.contains(document.activeElement);
    this.classList.toggle('av-is-in', show);
  };

  #go = () => {
    const dom = window.Anvil?.dom;
    if (this.contains(document.activeElement)) {
      const target = dom?.focusables?.(document.body)[0] || document.querySelector('.av-skip-link, #main');
      target?.focus({ preventScroll: true });
    }
    const still =
      dom?.motionOff?.() ??
      (document.documentElement.dataset.animations === 'off' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
  };
}

if (!customElements.get('anvil-scroll-top')) customElements.define('anvil-scroll-top', ScrollTop);
