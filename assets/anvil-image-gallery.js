/**
 * anvil-image-gallery.js — <anvil-image-gallery>, the lightbox of sections/anvil-image-gallery.liquid.
 * Links [data-anvil-lb-open] (href = image, data-anvil-w = its width) open the image without JS; with JS a plain click
 * opens <anvil-dialog data-anvil-lb-host> on it. Slides (role=group "N of M", roledescription [data-anvil-slide]) are
 * built on first open; only the current one and its neighbours load. Swipe, [data-anvil-lb-prev|next], arrows
 * (wrapping), Home, End. On close, focus goes to the link of the last image shown. [data-anvil-lb-count] is live.
 */
const WIDTHS = [750, 1100, 1500, 2200];
const make = (tag, props) => Object.assign(document.createElement(tag), props);

class ImageGallery extends HTMLElement {
  #links = [];
  #host;
  #dlg;
  #track;
  #count;
  #i = 0;
  #timer = 0;

  connectedCallback() {
    this.#host = this.querySelector('[data-anvil-lb-host]');
    this.#dlg = this.#host?.querySelector('dialog');
    if (!this.#dlg) return;
    this.#track = this.#dlg.querySelector('[data-anvil-lb-track]');
    this.#count = this.#dlg.querySelector('[data-anvil-lb-count]');
    this.#links = [...this.querySelectorAll('[data-anvil-lb-open]')];
    for (const a of this.#links) a.setAttribute('aria-haspopup', 'dialog');
    for (const b of this.#dlg.querySelectorAll('[data-anvil-lb-prev], [data-anvil-lb-next]')) b.hidden = this.#links.length < 2;
    this.addEventListener('click', this.#onClick);
    this.#dlg.addEventListener('keydown', this.#onKey);
    this.#dlg.addEventListener('close', this.#onClose);
    this.#track.addEventListener('scroll', this.#onScroll, { passive: true });
  }

  disconnectedCallback() {
    clearTimeout(this.#timer);
    this.removeEventListener('click', this.#onClick);
    this.#dlg?.removeEventListener('keydown', this.#onKey);
    this.#dlg?.removeEventListener('close', this.#onClose);
    this.#track?.removeEventListener('scroll', this.#onScroll);
  }

  get #dir() {
    return getComputedStyle(this.#track).direction === 'rtl' ? -1 : 1;
  }

  open(index, opener) {
    if (!this.#links.length) return;
    if (!this.#track.children.length) this.#build();
    if (typeof this.#host.open === 'function') this.#host.open(opener);
    else if (!this.#dlg.open) this.#dlg.showModal();
    this.go(index);
  }

  go(index) {
    const n = this.#links.length;
    const i = ((index % n) + n) % n;
    // Buttons and keys jump: nothing to gate for reduced motion, and no smooth scroll for a re-snap to cut short.
    this.#track.scrollTo({ left: this.#dir * i * this.#track.clientWidth, behavior: 'instant' });
    this.#show(i);
  }

  #label(i) {
    return this.#count.dataset.anvilText.replace('[index]', i + 1).replace('[total]', this.#links.length);
  }

  #build() {
    this.#track.replaceChildren(
      ...this.#links.map((a, k) => {
        const fig = make('figure', { className: 'av-image-gallery__lb-slide', role: 'group', ariaLabel: this.#label(k) });
        fig.setAttribute('aria-roledescription', this.#track.dataset.anvilSlide);
        fig.append(make('img', { alt: a.querySelector('img')?.alt || '', sizes: '100vw' }));
        const text = a.closest('figure')?.querySelector('figcaption')?.textContent.trim();
        if (text) fig.append(make('figcaption', { className: 'av-image-gallery__lb-cap', textContent: text }));
        return fig;
      })
    );
  }

  #load(i) {
    const img = this.#track.children[i]?.querySelector('img');
    if (!img || img.srcset) return;
    const a = this.#links[i];
    const max = Math.min(Number(a.dataset.anvilW) || 2200, 2200);
    img.srcset = WIDTHS.filter((w) => w < max)
      .concat(max)
      .map((w) => `${a.href.replace(/([?&]width=)\d+/, `$1${w}`)} ${w}w`)
      .join(', ');
    img.src = a.href;
  }

  #show(i) {
    const n = this.#links.length;
    this.#i = i;
    [...this.#track.children].forEach((fig, k) => fig.setAttribute('aria-hidden', k !== i));
    for (const k of [i, i + 1, i - 1]) this.#load((k + n) % n);
    this.#count.textContent = this.#label(i);
  }

  #onClick = (e) => {
    const a = e.target.closest('[data-anvil-lb-open]');
    if (a) {
      const i = this.#links.indexOf(a);
      if (i < 0 || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      this.open(i, a);
    } else if (e.target.closest('[data-anvil-lb-prev]')) this.go(this.#i - 1);
    else if (e.target.closest('[data-anvil-lb-next]')) this.go(this.#i + 1);
  };

  #onKey = (e) => {
    const n = this.#links.length;
    let to = -1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') to = this.#i + (e.key === 'ArrowRight' ? 1 : -1) * this.#dir;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = n - 1;
    else return;
    if (n < 2) return;
    e.preventDefault();
    this.go(to);
  };

  #onScroll = () => {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      const w = this.#track.clientWidth;
      if (!w || !this.#dlg.open) return;
      const i = Math.min(this.#links.length - 1, Math.round(Math.abs(this.#track.scrollLeft) / w));
      if (i !== this.#i) this.#show(i);
    }, 120);
  };

  // runs after anvil-dialog has focused the opener
  #onClose = () => {
    clearTimeout(this.#timer);
    const a = this.#links[this.#i];
    setTimeout(() => a?.isConnected && a.focus(), 0);
  };
}

customElements.get('anvil-image-gallery') || customElements.define('anvil-image-gallery', ImageGallery);
