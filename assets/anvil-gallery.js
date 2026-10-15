/* anvil-gallery.js — <anvil-gallery section-id zoom variant-first hide-others> (snippets/anvil-gallery.liquid has the
   markup and behaviour notes). Adds to the no-JS scroll-snap track: active dot/counter/thumbnail via
   IntersectionObserver, thumbnail and arrow navigation, anvil:variant:changed filtering and ordering, the hover
   magnifier, the <dialog> lightbox (swipe, pinch, double-tap, ctrl+wheel, +/- keys; arrows change image, or pan
   when zoomed) and play/pause for bare videos. */
const A = () => window.Anvil || {};
const t = (key, vars, fallback) =>
  A().dom?.t ? A().dom.t(key, vars, fallback) : fallback.replace(/\[(\w+)\]/g, (m, k) => vars[k]);
const still = () =>
  document.documentElement.dataset.animations === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;
const all = (root, sel) => [...root.querySelectorAll(sel)];
const ids = (el) => (el.dataset.anvilVariantIds || '').split(',').filter(Boolean);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const reveal = (box, el, mid, smooth) => {
  const b = box.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  box.scrollTo({
    left: box.scrollLeft + r.left - b.left - (mid ? (b.width - r.width) / 2 : 0),
    top: box.scrollTop + (mid ? r.top - b.top - (b.height - r.height) / 2 : 0),
    behavior: smooth && !still() ? 'smooth' : 'auto',
  });
};

class Gallery extends HTMLElement {
  connectedCallback() {
    const track = (this.track = this.querySelector('[data-anvil-gallery-track]'));
    if (!track) return;
    const ac = (this.ac = new AbortController());
    const on = (el, type, fn, opts) => el?.addEventListener(type, fn, { signal: ac.signal, ...opts });
    this.slides = all(track, '[data-anvil-gallery-slide]');
    this.pager = this.querySelector('[data-anvil-gallery-pager]');
    this.live = this.querySelector('[data-anvil-gallery-live]');
    this.dialog = this.querySelector('dialog');
    this.io = new IntersectionObserver(
      (list) => {
        if (this.scrolls()) for (const e of list) if (e.isIntersecting) this.activate(e.target);
      },
      { root: track, threshold: 0.6 }
    );
    this.slides.forEach((s) => this.io.observe(s));
    for (const v of all(this, 'video[data-anvil-bare]')) v.controls = false;
    on(this, 'click', this.onClick);
    on(this, 'play', this.onPlay, { capture: true });
    on(this, 'pause', this.onPlay, { capture: true });
    on(document, 'anvil:variant:changed', this.onVariant);
    if (this.getAttribute('zoom') === 'hover' && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      on(track, 'pointermove', this.onHover);
      on(track, 'pointerleave', this.onHover);
    }
    const stage = (this.stage = this.dialog?.querySelector('[data-anvil-gallery-stage]'));
    if (stage) {
      this.pts = new Map();
      this.s = 1;
      on(stage, 'pointerdown', this.onDown);
      on(stage, 'pointermove', this.onMove);
      on(stage, 'pointerup', this.onUp);
      on(stage, 'pointercancel', this.onUp);
      on(stage, 'wheel', this.onWheel, { passive: false });
      on(this.dialog, 'keydown', this.onKey);
      on(this.dialog, 'close', this.onClose);
    }
    this.sync();
  }

  disconnectedCallback() {
    this.ac?.abort();
    this.io?.disconnect();
    clearTimeout(this.timer);
  }

  scrolls() {
    return this.track.scrollWidth - this.track.clientWidth > 1;
  }

  thumb(s) {
    return this.querySelector(`.av-gallery__thumb[data-anvil-media-id="${s.dataset.anvilMediaId}"]`);
  }

  sync() {
    const vis = (this.vis = this.slides.filter((s) => !s.hidden));
    const n = vis.length;
    this.classList.toggle('av-is-single', n < 2);
    for (const s of this.slides) {
      const i = vis.indexOf(s) + 1;
      const b = this.thumb(s);
      if (b) b.hidden = !i;
      if (!i) continue;
      s.setAttribute('aria-label', t('slideOf', { index: i, total: n }, 'Slide [index] of [total]'));
      const label = b?.querySelector('.av-visually-hidden');
      if (label) label.textContent = t('goToSlide', { index: i }, 'Go to slide [index]');
    }
    const p = this.pager;
    if (p && !p.querySelector('[data-anvil-gallery-count]') && p.children.length !== n) {
      p.replaceChildren(...vis.map(() => Object.assign(document.createElement('span'), { className: 'av-gallery__dot' })));
    }
    this.activate(vis.includes(this.cur) ? this.cur : vis[0], true);
  }

  activate(s, quiet) {
    if (!s || (s === this.cur && !quiet)) return;
    this.cur = s;
    const i = this.vis.indexOf(s);
    const count = this.pager?.querySelector('[data-anvil-gallery-count]');
    if (count) count.textContent = `${i + 1} / ${this.vis.length}`;
    else [...(this.pager?.children || [])].forEach((d, k) => d.classList.toggle('av-is-active', k === i));
    for (const b of all(this, '.av-gallery__thumb')) {
      const hit = b.dataset.anvilMediaId === s.dataset.anvilMediaId;
      if (hit) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
      if (hit && b.offsetParent) reveal(b.parentElement, b, true, true);
    }
    if (this.scrolls()) for (const v of all(this.track, 'video')) if (!s.contains(v)) v.pause();
    if (quiet) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.live && (this.live.textContent = s.getAttribute('aria-label')), 500);
  }

  goTo(i, smooth) {
    const s = this.vis[i];
    if (!s) return;
    reveal(this.track, s, false, smooth);
    this.activate(s);
  }

  onClick = (e) => {
    const q = (sel) => e.target.closest(sel);
    let el;
    if ((el = q('.av-gallery__thumb'))) {
      this.goTo(this.vis.findIndex((s) => s.dataset.anvilMediaId === el.dataset.anvilMediaId), true);
    } else if ((el = q('[data-anvil-gallery-step]'))) {
      const n = this.vis.length;
      this.goTo((this.vis.indexOf(this.cur) + +el.dataset.anvilGalleryStep + n) % n, true);
    } else if ((el = q('[data-anvil-gallery-zoom]'))) {
      this.open(el.closest('[data-anvil-gallery-slide]'));
    } else if ((el = q('[data-anvil-gallery-play], video[data-anvil-bare]'))) {
      const v = el.closest('[data-anvil-gallery-slide]').querySelector('video');
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    } else if ((el = q('[data-anvil-gallery-lb]'))) {
      const act = el.dataset.anvilGalleryLb;
      if (act === 'close') this.dialog.close();
      else if (act === 'zoom') this.zoom(this.s > 1 ? 1 : 2.5);
      else this.show(+act);
    }
  };

  onPlay = (e) => {
    const b = e.target.closest?.('[data-anvil-gallery-slide]')?.querySelector('[data-anvil-gallery-play]');
    if (!b) return;
    const playing = e.type === 'play';
    b.classList.toggle('av-is-playing', playing);
    b.setAttribute('aria-label', playing ? t('pause', {}, 'Pause') : t('play', {}, 'Play'));
  };

  onVariant = ({ detail: d }) => {
    if (!d?.variant || String(d.sectionId) !== this.getAttribute('section-id')) return;
    const id = String(d.variant.id);
    const own = this.slides.find((s) => ids(s).includes(id));
    if (this.hasAttribute('hide-others')) {
      for (const s of this.slides) s.hidden = ids(s).length > 0 && s !== own;
      if (this.slides.every((s) => s.hidden)) for (const s of this.slides) s.hidden = false;
    }
    if (own && this.hasAttribute('variant-first') && this.slides[0] !== own) {
      const pos = (s) => (s === own ? -1 : +s.dataset.anvilPos);
      this.slides.sort((a, b) => pos(a) - pos(b));
      this.track.append(...this.slides);
      const thumbs = this.slides.map((s) => this.thumb(s)).filter(Boolean);
      thumbs[0]?.parentElement.append(...thumbs);
    }
    this.sync();
    this.goTo(this.vis.indexOf(own || this.cur), true);
  };

  onHover = (e) => {
    const s = e.type === 'pointermove' && e.pointerType === 'mouse' ? e.target.closest('[data-anvil-zoomable]') : null;
    if (this.hz && this.hz !== s) this.hz.classList.remove('av-is-zoomed');
    this.hz = s;
    if (!s) return;
    const r = s.getBoundingClientRect();
    s.style.setProperty('--av-zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    s.style.setProperty('--av-zy', `${((e.clientY - r.top) / r.height) * 100}%`);
    s.classList.add('av-is-zoomed');
  };

  open(slide) {
    this.zl = this.vis.filter((s) => s.hasAttribute('data-anvil-zoomable'));
    this.zi = Math.max(0, this.zl.indexOf(slide));
    this.dialog.showModal();
    this.show(0);
  }

  show(step) {
    const n = this.zl.length;
    this.zi = (this.zi + step + n) % n;
    const slide = this.zl[this.zi];
    const src = slide.querySelector('img');
    const img = (this.img ||= this.stage.appendChild(document.createElement('img')));
    img.alt = src?.alt || '';
    img.sizes = '100vw';
    img.srcset = [src?.getAttribute('srcset'), slide.dataset.anvilZoomSrc].filter(Boolean).join(', ');
    img.src = src?.currentSrc || src?.src || '';
    this.zoom(1);
    this.dialog.querySelector('[data-anvil-gallery-lb-count]').textContent = `${this.zi + 1} / ${n}`;
    for (const b of all(this.dialog, '[data-anvil-gallery-lb="1"], [data-anvil-gallery-lb="-1"]')) b.hidden = n < 2;
  }

  zoom(scale, x = 0, y = 0) {
    const img = this.img;
    const s = (this.s = clamp(scale || 1, 1, 4));
    const mx = ((s - 1) * img.offsetWidth) / 2;
    const my = ((s - 1) * img.offsetHeight) / 2;
    this.x = clamp(x, -mx, mx);
    this.y = clamp(y, -my, my);
    img.style.transform = s > 1 ? `translate(${this.x}px, ${this.y}px) scale(${s})` : '';
    this.stage.classList.toggle('av-is-zoomed', s > 1);
    this.dialog.querySelector('[data-anvil-gallery-lb="zoom"]')?.setAttribute('aria-pressed', String(s > 1));
  }

  mark(e) {
    this.p0 = { x: e.clientX, y: e.clientY, tx: this.x, ty: this.y, s: this.s, d: this.dist() };
  }

  dist() {
    const [a, b] = this.pts.values();
    return b ? Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) : 0;
  }

  onDown = (e) => {
    this.stage.setPointerCapture(e.pointerId);
    this.pts.set(e.pointerId, e);
    if (this.pts.size > 1) this.pinch = true;
    this.mark(e);
    this.stage.classList.add('av-is-panning');
  };

  onMove = (e) => {
    if (!this.pts.has(e.pointerId)) return;
    this.pts.set(e.pointerId, e);
    const p = this.p0;
    if (this.pts.size > 1) this.zoom((p.s * this.dist()) / (p.d || 1), p.tx, p.ty);
    else if (this.s > 1) this.zoom(this.s, p.tx + e.clientX - p.x, p.ty + e.clientY - p.y);
  };

  onUp = (e) => {
    if (!this.pts.delete(e.pointerId)) return;
    const [rest] = this.pts.values();
    if (rest) return this.mark(rest);
    this.stage.classList.remove('av-is-panning');
    const p = this.p0;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (this.pinch || e.type === 'pointercancel') return (this.pinch = false);
    if (this.s === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) return this.show(dx < 0 ? 1 : -1);
    if (Math.hypot(dx, dy) > 10) return;
    if (e.timeStamp - this.tap < 300) {
      const r = this.img.getBoundingClientRect();
      this.tap = 0;
      if (this.s > 1) this.zoom(1);
      else this.zoom(2.5, (r.left + r.width / 2 - e.clientX) * 1.5, (r.top + r.height / 2 - e.clientY) * 1.5);
    } else this.tap = e.timeStamp;
  };

  onWheel = (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    this.zoom(this.s * (1 - e.deltaY / 100), this.x, this.y);
  };

  onKey = (e) => {
    const d = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }[e.key];
    const z = { '+': 0.5, '=': 0.5, '-': -0.5 }[e.key];
    if (d && this.s > 1) this.zoom(this.s, this.x + d[0], this.y + d[1]);
    else if (d?.[0]) this.show(d[0] < 0 ? 1 : -1);
    else if (z) this.zoom(this.s + z, this.x, this.y);
    else return;
    e.preventDefault();
  };

  onClose = () => {
    const s = this.zl?.[this.zi];
    this.zoom(1);
    if (!s) return;
    this.goTo(this.vis.indexOf(s));
    s.querySelector('[data-anvil-gallery-zoom]')?.focus({ preventScroll: true });
  };
}

customElements.get('anvil-gallery') || customElements.define('anvil-gallery', Gallery);
