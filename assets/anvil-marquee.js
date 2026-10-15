/* anvil-marquee.js — <anvil-marquee speed direction pause-on-hover paused>: endless strip with a pause/play
   button (WCAG 2.2.2). Clones [data-marquee-track] (.av-marquee__clone, aria-hidden, untabbable); reduced motion
   and data-animations="off" stay static (.av-is-static, no clones, no button). Contract: CONVENTIONS §6. */
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const say = (k, f) => window.Anvil?.dom?.t?.(k, null, f) ?? f;

class Marquee extends HTMLElement {
  static observedAttributes = ['paused'];
  #track;
  #clones = [];
  #btn;
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
    this.addEventListener('shopify:block:select', this.#hold);
    this.addEventListener('shopify:block:deselect', this.#hold);
    this.#layout();
  }

  disconnectedCallback() {
    this.#ro?.disconnect();
    reduce.removeEventListener('change', this.#layout);
    this.removeEventListener('shopify:block:select', this.#hold);
    this.removeEventListener('shopify:block:deselect', this.#hold);
    this.#clear(true);
  }

  attributeChangedCallback() {
    this.#label();
  }

  #hold = (e) => this.classList.toggle('av-is-held', e.type === 'shopify:block:select');

  #label() {
    const p = this.hasAttribute('paused');
    this.#btn?.setAttribute('aria-pressed', String(p));
    this.#btn?.setAttribute('aria-label', p ? say(['play'], 'Play') : say(['pause'], 'Pause'));
  }

  #clear(all) {
    for (const c of this.#clones) c.remove();
    this.#clones = [];
    if (all) {
      this.#btn?.remove();
      this.#btn = null;
    }
  }

  #layout = () => {
    const off = reduce.matches || document.documentElement.dataset.animations === 'off';
    this.classList.toggle('av-is-static', off);
    if (off) return this.#clear(true);
    const w = this.#track.getBoundingClientRect().width;
    if (!w) return;
    this.style.setProperty('--av-marquee-duration', `${(w / Math.max(1, parseFloat(this.getAttribute('speed')) || 40)).toFixed(2)}s`);
    if (!this.#btn) {
      const b = (this.#btn = document.createElement('button'));
      b.type = 'button';
      b.className = 'av-marquee__pause';
      b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path class="av-marquee__ico-pause" d="M8 5v14M16 5v14"/><path class="av-marquee__ico-play" d="m8 5 10 7-10 7z"/></svg>';
      b.onclick = () => this.toggleAttribute('paused');
      this.append(b);
      this.#label();
    }
    const n = Math.max(1, Math.ceil(this.clientWidth / w));
    if (this.#clones.length === n) return;
    this.#clear();
    for (let i = 0; i < n; i++) {
      const c = this.#track.cloneNode(true);
      c.removeAttribute('data-marquee-track');
      c.classList.add('av-marquee__clone');
      c.setAttribute('aria-hidden', 'true');
      for (const el of c.querySelectorAll('[id]')) el.removeAttribute('id');
      for (const el of c.querySelectorAll('a, button, input, select, textarea, [tabindex]')) el.tabIndex = -1;
      this.#clones.push(c);
    }
    this.#track.after(...this.#clones);
  };
}

customElements.get('anvil-marquee') || customElements.define('anvil-marquee', Marquee);
