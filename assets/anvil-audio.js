/**
 * anvil-audio.js — <anvil-audio> for sections/anvil-audio.liquid; behaviour and reasons: docs/sections/audio.md.
 * Never calls play() except from the Play button's click.
 */
const KEY = 'anvil-audio:';
const SPACE = '--av-audio-space';

class AnvilAudio extends HTMLElement {
  #ac;
  #ro;
  #resume = 0;

  connectedCallback() {
    const $ = (sel) => this.querySelector(sel);
    const a = (this.audio = $('audio'));
    this.panel = $('[data-anvil-panel]');
    this.foldBtn = $('[data-anvil-toggle]');
    this.playBtn = $('[data-anvil-play]');
    this.muteBtn = $('[data-anvil-mute]');
    this.status = $('[data-anvil-status]');
    this.editor = !!(window.Anvil?.designMode || window.Shopify?.designMode);
    this.#ac = new AbortController();
    const on = { signal: this.#ac.signal };
    this.foldBtn?.addEventListener('click', () => this.#show(!this.isOpen), on);
    (this.#ro = new ResizeObserver(this.#layout)).observe(this);
    addEventListener('resize', this.#layout, on);
    if (!a) return;

    this.key = KEY + a.getAttribute('src');
    a.volume = Math.min(1, (parseInt(this.getAttribute('volume'), 10) || 100) / 100);
    if (!this.editor) {
      let saved = {};
      try {
        saved = JSON.parse(sessionStorage.getItem(this.key)) || {};
      } catch {
        // storage blocked or empty: start fresh
      }
      if (typeof saved.m === 'boolean') a.muted = saved.m;
      if (typeof saved.c === 'boolean') this.#show(!saved.c);
      this.#resume = saved.t > 0 ? saved.t : 0;
      addEventListener('pagehide', this.#save, on);
    }
    this.playBtn?.addEventListener('click', () => (a.paused ? this.#play() : a.pause()), on);
    this.muteBtn?.addEventListener('click', () => (a.muted = !a.muted), on);
    for (const type of ['play', 'pause', 'ended', 'volumechange']) a.addEventListener(type, this.#sync, on);
    a.addEventListener('error', this.#fail, on);
    a.addEventListener(
      'loadedmetadata',
      () => {
        if (this.#resume && this.#resume < a.duration) a.currentTime = this.#resume;
        this.#resume = 0;
      },
      on
    );
    this.#sync();
  }

  disconnectedCallback() {
    this.#ac?.abort();
    this.#ro?.disconnect();
    this.audio?.pause();
    if (!document.querySelector('anvil-audio')) document.documentElement.style.removeProperty(SPACE);
  }

  get isOpen() {
    return !!this.panel && !this.panel.hidden;
  }

  open() {
    this.#show(true);
  }

  close() {
    this.#show(false);
    if (this.editor) this.audio?.pause();
  }

  #show(open) {
    if (!this.panel) return;
    this.panel.hidden = !open;
    this.foldBtn?.setAttribute('aria-expanded', String(open));
  }

  #play() {
    const a = this.audio;
    // After a failed load play() alone never fetches again (the error stays); load() clears it and refetches.
    if (a.error) {
      this.#resume ||= a.currentTime;
      a.load();
    }
    a.play()?.catch((e) => e?.name === 'AbortError' || this.#fail());
  }

  // Page room: player height + bottom offset, without the sticky bar (the CSS adds it).
  #layout = () => {
    const root = document.documentElement;
    let space = 0;
    if (this.getClientRects().length) {
      const bar = parseFloat(getComputedStyle(root).getPropertyValue('--av-sticky-bar-h')) || 0;
      space = Math.ceil(this.offsetHeight + (parseFloat(getComputedStyle(this).bottom) || 0) - bar);
    } else this.audio?.pause();
    root.style.setProperty(SPACE, `${Math.max(0, space)}px`);
  };

  #sync = () => {
    const a = this.audio;
    const playing = !a.paused;
    if (playing && this.status) this.status.textContent = '';
    this.classList.toggle('av-is-playing', playing);
    this.playBtn?.setAttribute('aria-pressed', String(playing));
    this.muteBtn?.setAttribute('aria-pressed', String(a.muted));
  };

  #fail = () => {
    // A failed source can leave paused false: pause, then open the panel so the status line is seen and announced.
    this.audio.pause();
    this.#sync();
    this.#show(true);
    if (this.status) this.status.textContent = this.status.dataset.anvilError || '';
  };

  #save = () => {
    const a = this.audio;
    const t = a.ended ? 0 : a.currentTime || this.#resume;
    try {
      sessionStorage.setItem(this.key, JSON.stringify({ t, m: a.muted, c: !this.isOpen }));
    } catch {
      // storage blocked: the next page starts fresh
    }
  };
}

if (!customElements.get('anvil-audio')) customElements.define('anvil-audio', AnvilAudio);

// A settings change in the editor re-renders the section; open the new player so the merchant keeps seeing it.
document.addEventListener('shopify:section:load', (e) => e.target.querySelector?.('anvil-audio')?.open());
