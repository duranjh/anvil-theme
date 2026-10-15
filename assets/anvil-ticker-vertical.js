/* anvil-ticker-vertical.js — <anvil-ticker-vertical interval="4">: one [data-anvil-line] at a time, the next one
   every `interval` seconds. Liquid marks the first line .av-is-current and the section CSS draws the fade or slide,
   so nothing moves before (or without) this script. WCAG 2.2.2: the [data-anvil-toggle] button pauses and plays;
   rotation also waits on hover, keyboard focus (not on the button itself), a hidden tab, off-screen and a block
   selected in the editor. Reduced motion or html[data-animations="off"]: starts paused on the first line and the
   button offers Play. Every line stays in the accessibility tree, so rotation announces nothing; the viewport's
   aria-live is inert today and is only kept "off" while rotating. Focusing a link in a hidden line brings that
   line forward. */
const motionOff = () =>
  window.Anvil?.dom?.motionOff?.() ??
  (document.documentElement.dataset.animations === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches);

class TickerVertical extends HTMLElement {
  #lines = [];
  #i = 0;
  #timer = 0;
  #wait = {};
  #stopped = false;
  #ac;
  #io;
  #view;
  #btn;

  connectedCallback() {
    this.#lines = [...this.querySelectorAll('[data-anvil-line]')];
    if (this.#lines.length < 2) return;
    this.#view = this.querySelector('[data-anvil-viewport]');
    this.#btn = this.querySelector('[data-anvil-toggle]');
    this.#i = Math.max(0, this.#lines.findIndex((l) => l.classList.contains('av-is-current')));
    this.#wait = {};
    this.#stopped = motionOff();
    this.#ac = new AbortController();
    const on = (el, type, fn) => el.addEventListener(type, fn, { signal: this.#ac.signal });
    on(this, 'pointerenter', () => this.#hold('hover', true));
    on(this, 'pointerleave', () => this.#hold('hover', false));
    on(this, 'focusin', (e) => {
      const line = e.target.closest('[data-anvil-line]');
      if (line) this.#show(this.#lines.indexOf(line));
      this.#hold('focus', e.target !== this.#btn);
    });
    on(this, 'focusout', (e) => this.#hold('focus', this.contains(e.relatedTarget) && e.relatedTarget !== this.#btn));
    on(this, 'shopify:block:select', (e) => {
      const n = this.#lines.indexOf(e.target);
      if (n > -1) this.#show(n);
      this.#hold('editor', true);
    });
    on(this, 'shopify:block:deselect', () => this.#hold('editor', false));
    on(document, 'visibilitychange', this.#sync);
    this.#btn?.addEventListener(
      'click',
      () => {
        this.#stopped = !this.#stopped;
        this.#label();
        this.#sync();
      },
      { signal: this.#ac.signal }
    );
    this.#io = new IntersectionObserver((es) => this.#hold('away', !es[es.length - 1].isIntersecting));
    this.#io.observe(this);
    this.#label();
    this.#sync();
  }

  disconnectedCallback() {
    clearInterval(this.#timer);
    this.#timer = 0;
    this.#ac?.abort();
    this.#io?.disconnect();
  }

  #hold(why, on) {
    this.#wait[why] = on;
    this.#sync();
  }

  #label() {
    this.classList.toggle('av-is-paused', this.#stopped);
    const b = this.#btn;
    b?.setAttribute('aria-label', this.#stopped ? b.dataset.anvilPlay || 'Play' : b.dataset.anvilPause || 'Pause');
  }

  #sync = () => {
    const run = !this.#stopped && !document.hidden && !Object.values(this.#wait).some(Boolean);
    this.#view?.setAttribute('aria-live', run ? 'off' : 'polite');
    if (run === Boolean(this.#timer)) return;
    clearInterval(this.#timer);
    const ms = Math.max(1.5, parseFloat(this.getAttribute('interval')) || 4) * 1000;
    this.#timer = run ? setInterval(() => this.#show(this.#i + 1), ms) : 0;
  };

  /* A line parked above (it left last time) first jumps back below without a transition (.av-is-instant, then a
     reflow), so in slide mode the incoming line always enters from below, even with two lines. The old line
     changes class before that reflow, so it never keeps .av-is-current (and the fade delay) next to the new one. */
  #show(n) {
    const count = this.#lines.length;
    n = (n + count) % count;
    if (n === this.#i) return;
    const from = this.#lines[this.#i];
    const to = this.#lines[n];
    const reset = to.classList.contains('av-is-leaving');
    if (reset) to.classList.add('av-is-instant');
    for (const line of this.#lines) line.classList.remove('av-is-leaving');
    from.classList.replace('av-is-current', 'av-is-leaving');
    if (reset) {
      void to.offsetWidth;
      to.classList.remove('av-is-instant');
    }
    to.classList.add('av-is-current');
    this.#i = n;
  }
}

customElements.get('anvil-ticker-vertical') || customElements.define('anvil-ticker-vertical', TickerVertical);
