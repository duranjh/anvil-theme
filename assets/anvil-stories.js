/** <anvil-stories auto>: viewer of sections/anvil-stories.liquid; contract, focus and loading in docs/sections/stories.md. */
const motionOff = () =>
  window.Anvil?.dom?.motionOff?.() ??
  (document.documentElement.dataset.animations === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches);

class Stories extends HTMLElement {
  #dlg;
  #links;
  #slides;
  #bars;
  #play;
  #mute;
  #close;
  #stage;
  #i = 0;
  #on = false;
  #muted = true;
  #anim = null;
  #video = null;
  #timer = 0;

  connectedCallback() {
    this.#dlg = this.querySelector('dialog');
    if (!this.#dlg) return;
    const all = (sel) => [...this.querySelectorAll(sel)];
    this.#links = all('[data-anvil-story]');
    this.#slides = all('[data-anvil-slide]');
    this.#bars = all('[data-anvil-bar]');
    [this.#play, this.#mute, this.#close, this.#stage] = all(
      '[data-anvil-toggle], [data-anvil-mute], [data-anvil-close], [data-anvil-stage]'
    );
    for (const a of this.#links) a.setAttribute('aria-haspopup', 'dialog');
    this.#wire('addEventListener');
  }

  disconnectedCallback() {
    clearTimeout(this.#timer);
    this.#stop();
    this.#wire('removeEventListener');
  }

  #wire(m) {
    for (const type of ['click', 'keydown', 'close', 'timeupdate', 'ended']) this[m](type, this, true);
    for (const type of ['select', 'deselect']) document[m](`shopify:block:${type}`, this);
  }

  get #auto() {
    return this.hasAttribute('auto');
  }

  open(index, opener, paused) {
    const host = this.#dlg.parentElement;
    this.#on = !paused && !motionOff();
    this.go(index);
    if (host.open) host.open(opener);
    else if (!this.#dlg.open) this.#dlg.showModal();
  }

  go(index) {
    if (index >= this.#slides.length) return this.#dlg.close();
    const i = Math.max(index, 0);
    const a = document.activeElement;
    this.#stop();
    this.#i = i;
    this.#slides.forEach((slide, k) => {
      slide.hidden = k !== i;
      if (k !== i && k !== i + 1) return;
      const img = slide.querySelector('img');
      const video = slide.querySelector('video');
      if (img) img.loading = 'eager';
      if (video?.preload === 'none') {
        video.preload = 'metadata';
        video.poster = video.dataset.anvilPoster || '';
      }
    });
    const v = (this.#video = this.#slides[i].querySelector('video'));
    const full = !v && !this.#auto;
    this.#bars.forEach((bar, k) => {
      bar.style.transform = `scaleX(${k < i || (k === i && full) ? 1 : 0})`;
    });
    this.#mute.hidden = !v;
    this.#play.hidden = full;
    if (this.#dlg.contains(a) && !a.offsetParent) (full ? this.#close : this.#play).focus();
    if (v) {
      v.muted = this.#muted;
      v.loop = !this.#auto;
    }
    this.#run();
  }

  #run() {
    const v = this.#video;
    const on = this.#on;
    this.#play.setAttribute('aria-pressed', !on);
    this.#stage.setAttribute('aria-live', on && this.#auto ? 'off' : 'polite');
    if (v) {
      if (!on) v.pause();
      else
        v.play()?.catch((e) => {
          if (e.name === 'AbortError' || v !== this.#video) return;
          if (v.muted) this.#on = false;
          else this.#sound(true);
          this.#run();
        });
    } else if (this.#auto) {
      this.#anim ||= this.#bars[this.#i].animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
        duration: (Number(this.#slides[this.#i].dataset.anvilSeconds) || 6) * 1000,
        fill: 'forwards',
      });
      this.#anim.onfinish = () => this.go(this.#i + 1);
      if (on) this.#anim.play();
      else this.#anim.pause();
    }
  }

  #sound(muted) {
    this.#muted = muted;
    this.#mute.setAttribute('aria-pressed', muted);
    if (this.#video) this.#video.muted = muted;
  }

  #stop() {
    this.#anim?.cancel();
    this.#anim = null;
    if (this.#video) {
      this.#video.pause();
      this.#video.currentTime = 0;
    }
  }

  handleEvent(e) {
    const t = e.target;
    const v = this.#video;
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    switch (e.type) {
      case 'click': {
        if (t === this.#dlg) return this.#dlg.close();
        const el = t.closest('[data-anvil-story], [data-anvil-go], [data-anvil-toggle], [data-anvil-mute], [data-anvil-close]');
        const data = el?.dataset;
        if (!el) return;
        if (data.anvilStory) {
          if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          this.open(Number(data.anvilStory), el);
        } else if (data.anvilGo) this.go(this.#i + Number(data.anvilGo));
        else if (el === this.#play) {
          this.#on = !this.#on;
          this.#run();
        } else if (el === this.#mute) this.#sound(!this.#muted);
        else this.#dlg.close();
        return;
      }
      case 'keydown':
        if (!step || !this.#dlg.open || e.altKey || e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        return this.go(this.#i + (this.matches(':dir(rtl)') ? -step : step));
      case 'close':
        if (t !== this.#dlg) return;
        this.#stop();
        return requestAnimationFrame(() => document.hasFocus() && this.#links[this.#i]?.focus());
      case 'timeupdate':
        if (t === v && v.duration) this.#bars[this.#i].style.transform = `scaleX(${v.currentTime / v.duration})`;
        return;
      case 'ended':
        if (t === v) this.go(this.#i + 1);
        return;
      case 'shopify:block:select': {
        const link = this.contains(t) && t.querySelector('[data-anvil-story]');
        if (!link) return;
        clearTimeout(this.#timer);
        return this.open(Number(link.dataset.anvilStory), null, true);
      }
      default:
        if (this.contains(t)) this.#timer = setTimeout(() => this.#dlg.close(), 250);
    }
  }
}

if (!customElements.get('anvil-stories')) customElements.define('anvil-stories', Stories);
