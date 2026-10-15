/* anvil-marquee.js — <anvil-marquee speed direction pause-on-hover paused> (CONVENTIONS §6): clones the track in
   phase (aria-hidden, untabbable), pause toggle (WCAG 2.2.2), static under reduced motion or animations off;
   keyboard focus and editor block select scroll the item into view. */
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

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
    this.addEventListener('focusout', this.#home);
    this.#layout();
  }

  disconnectedCallback() {
    this.#ro?.disconnect();
    reduce.removeEventListener('change', this.#layout);
    this.#clear(true);
  }

  attributeChangedCallback() {
    this.#btn?.setAttribute('aria-pressed', this.hasAttribute('paused'));
  }

  #home = () => (this.scrollLeft = 0);

  #hold = (e) => {
    const on = e.type === 'shopify:block:select';
    this.classList.toggle('av-is-held', on);
    on ? e.target.scrollIntoView({ block: 'nearest', inline: 'nearest' }) : this.#home();
  };

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
      b.setAttribute('aria-label', window.Anvil?.dom?.t?.('pause', null, 'Pause') ?? 'Pause');
      b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path class="av-marquee__ico-pause" d="M8 5v14M16 5v14"/><path class="av-marquee__ico-play" d="m8 5 10 7-10 7z"/></svg>';
      b.onclick = () => this.toggleAttribute('paused');
      this.append(b);
      this.attributeChangedCallback();
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
      for (const el of c.querySelectorAll('[data-shopify-editor-block]')) el.removeAttribute('data-shopify-editor-block');
      for (const el of c.querySelectorAll('a, button, input, select, textarea, [tabindex]')) el.tabIndex = -1;
      this.#clones.push(c);
    }
    this.#track.after(...this.#clones);
    const t = this.#track.getAnimations()[0]?.currentTime;
    if (t != null) for (const c of this.#clones) for (const a of c.getAnimations()) a.currentTime = t;
  };
}

customElements.get('anvil-marquee') || customElements.define('anvil-marquee', Marquee);
