/** anvil-popup.js: <anvil-popup> decides when the popup opens. Rules and reasons: docs/sections/popup.md. */
const FLOOR = 3000;
let shown = false;
let t0 = 0;
const since = () => performance.now() - t0;
const box = (el) => !!el?.getClientRects().length;
const read = (area, key) => {
  try {
    return JSON.parse(window[area].getItem(key));
  } catch {
    return null;
  }
};
const write = (area, key, value) => {
  try {
    window[area].setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

class Popup extends HTMLElement {
  #off = [];
  #timer = 0;
  #fired = false;
  #back = null;

  get #key() { return `anvil-popup:${this.getAttribute('key')}`; }
  get #dialog() { return this.querySelector('dialog'); }

  connectedCallback() {
    if (window.Shopify?.designMode || window.Anvil?.designMode) return;
    const go = () => customElements.whenDefined('anvil-dialog').then(() => this.isConnected && this.#start());
    if (document.prerendering) this.#on(document, 'prerenderingchange', go, { once: true });
    else go();
  }

  disconnectedCallback() {
    clearTimeout(this.#timer);
    for (const off of this.#off.splice(0)) off();
  }

  #on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    this.#off.push(() => target.removeEventListener(type, fn, opts));
  }

  #start() {
    const dialog = this.#dialog;
    if (!dialog) return;
    t0 = performance.getEntriesByType('navigation')[0]?.activationStart || 0;
    const id = this.getAttribute('form-id');
    const hash = location.hash === `#${id}`;
    const flag = `${this.#key}:posted`;
    const form = document.getElementById(id);
    const result = form?.querySelector('[data-anvil-result]');
    const visible = box(this.closest('.av-section'));
    this.#on(dialog, 'close', this.#onClose);
    if (form) this.#on(form, 'submit', () => write('sessionStorage', flag, Date.now()));
    if (result) {
      const posted = Date.now() - read('sessionStorage', flag) < 6e5;
      write('sessionStorage', flag, 0);
      if (!posted && !hash) return;
      if (result.dataset.anvilResult === 'success') this.#save(1);
      if (hash) history.replaceState(history.state, '', location.pathname + location.search);
      if (visible) this.#open(result);
      return;
    }
    if (this.#seen()) return;
    const trigger = this.getAttribute('trigger');
    if (trigger === 'scroll') {
      this.#on(window, 'scroll', this.#onScroll, { passive: true });
      this.#onScroll();
    } else if (trigger === 'exit' && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      this.#on(document, 'mouseout', this.#onExit);
    } else {
      this.#later(+this.getAttribute('delay') * 1000 || 0);
    }
    const img = dialog.querySelector('img[loading="lazy"]');
    if (img && visible && (this.classList.contains('av-popup--img-m') || matchMedia('(min-width: 750px)').matches)) {
      img.loading = 'eager';
    }
  }
  #seen() {
    const rec = read('localStorage', this.#key);
    if (rec?.s) return true;
    const days = +this.getAttribute('days');
    if (rec?.c !== this.getAttribute('campaign') || Date.now() - rec.t >= (days * 864e5 || 18e5)) return false;
    if (!days) write('localStorage', this.#key, { ...rec, t: Date.now() });
    return true;
  }

  #save(s) {
    return write('localStorage', this.#key, { t: Date.now(), s, c: this.getAttribute('campaign') });
  }

  #later(at) {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(this.#try, Math.max(FLOOR, at) - since());
  }

  #onScroll = () => {
    if (this.#fired) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (max > 0 && (scrollY / max) * 100 < (+this.getAttribute('scroll') || 50)) return;
    this.#fired = true;
    this.#later(0);
  };

  #onExit = (e) => {
    if (!e.relatedTarget && e.clientY <= 0 && since() >= FLOOR) this.#try();
  };

  #try = () => {
    if (shown || this.#dialog.open || this.#seen()) return;
    const busy =
      document.hidden ||
      document.querySelector('dialog[open], anvil-drawer[open]') ||
      document.activeElement?.matches('input, textarea, select, iframe, [contenteditable]:not([contenteditable=false])') ||
      [...document.querySelectorAll('[aria-modal=true]')].some((el) => box(el) && getComputedStyle(el).visibility != 'hidden');
    if (busy) return this.#later(since() + 2000);
    if (box(this.closest('.av-section')) && this.#save(0)) this.#open();
  };

  #open(target) {
    const dialog = this.#dialog;
    const host = this.querySelector('anvil-dialog');
    shown = true;
    this.#back = document.activeElement;
    const heading = dialog.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      heading.id ||= `${host.id}-title`;
      dialog.setAttribute('aria-labelledby', heading.id);
    }
    host.open(document.createElement('span'));
    target?.focus();
  }

  #onClose = () => {
    const back = this.#back;
    const active = document.activeElement;
    this.#back = null;
    if (back?.isConnected && (!active || active === document.body || this.contains(active))) {
      back.focus({ preventScroll: true });
    }
  };
}

if (!customElements.get('anvil-popup')) customElements.define('anvil-popup', Popup);
