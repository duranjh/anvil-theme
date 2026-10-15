/**
 * anvil-slider.js — <anvil-slider>: a scroll-snap carousel that is a plain scrolling row without JS.
 *
 * Markup: <anvil-slider per-view="1" per-view-desktop="3" peek="16" autoplay="0" loop dots arrows aria-label="…">
 *   <div data-slider-track> <div data-slider-slide>…</div> … </div>  + optional [data-slider-prev] [data-slider-next]
 *   [data-slider-dots] [data-slider-pause] [data-slider-live] (created when the attributes ask for them).
 * Attributes: per-view / per-view-desktop (slides visible, ≥ 990 px; fractions allowed), peek (px of the next slide),
 * autoplay (seconds, 0 = off; implies wrap-around), loop, dots, arrows. Liquid must write --av-slider-per-view /
 * --av-slider-per-view-desktop / --av-slider-peek inline and render an empty <div class="av-slider__dots"
 * data-slider-dots></div> when dots are on, so nothing moves when this script runs (CONVENTIONS §6); the script only
 * fills those values in when they are missing.
 * Behaviour: arrows move one page (per-view slides); one dot per page; ArrowLeft/ArrowRight inside the element;
 * autoplay pauses on hover, focus within, hidden tab, off-screen and while a block is selected in the editor; under
 * reduced motion (html[data-animations="off"] too) it starts paused and the pause/play button offers Play. A11y:
 * role=region + aria-roledescription carousel, slides role=group "N of M", a named dots group, the track is
 * keyboard-focusable whenever it scrolls, a polite live region (off while auto-rotating).
 * Strings (window.Anvil.strings, first key found wins): slider_label|carousel, slide_of|slideOf ({{ index }}/{{ total }}
 * or [index]/[total]), slider_prev|previous, slider_next|next, slider_goto, slider_dots|chooseSlide,
 * slider_pause|pause, slider_play|play, slider_moved. Events: anvil:slider:change {index, total, element} (bubbles). shopify:block:select jumps to that
 * slide. Methods: goTo(index, smooth?), next(), prev(), play(), pause(). Property: index.
 */
const anvil = () => window.Anvil || {};
const t = (keys, vars, fallback) => {
  if (anvil().dom?.t) return anvil().dom.t(keys, vars, fallback);
  const strings = anvil().strings || {};
  const str = [].concat(keys).map((k) => strings[k]).find((v) => v != null) ?? fallback;
  return String(str).replace(/\{\{\s*(\w+)\s*\}\}|\[(\w+)\]/g, (m, a, b) => vars?.[a || b] ?? '');
};
const motionOff = () =>
  anvil().dom?.motionOff?.() ??
  (document.documentElement.dataset.animations === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches);

const SVG = (d) =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ARROW = SVG('<path d="m9 6 6 6-6 6"/>');
const PAUSE_PLAY =
  SVG('<path class="av-slider__ico-pause" d="M8 5v14M16 5v14"/><path class="av-slider__ico-play" d="m8 5 10 7-10 7z"/>');

class Slider extends HTMLElement {
  #track;
  #slides = [];
  #dots = [];
  #dotsWrap;
  #live;
  #prev;
  #next;
  #pauseBtn;
  #step = 1;
  #gap = 0;
  #pages = 1;
  #index = 0;
  #interval = 0;
  #timer = 0;
  #raf = 0;
  #idle = 0;
  #hover = false;
  #focus = false;
  #visible = true;
  #editing = false;
  #userPaused = false;
  #ownTabindex = false;
  #ro;
  #io;

  get index() {
    return this.#index;
  }

  connectedCallback() {
    this.#track = this.querySelector('[data-slider-track]');
    this.#slides = this.#track ? [...this.#track.querySelectorAll(':scope > [data-slider-slide]')] : [];
    if (!this.#slides.length) return;

    const props = [
      ['per-view', '--av-slider-per-view', ''],
      ['per-view-desktop', '--av-slider-per-view-desktop', ''],
      ['peek', '--av-slider-peek', 'px'],
    ];
    for (const [attr, prop, unit] of props) {
      const value = this.getAttribute(attr);
      if (value && !this.style.getPropertyValue(prop)) this.style.setProperty(prop, `${parseFloat(value) || 0}${unit}`);
    }

    if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
    this.setAttribute('aria-roledescription', t(['slider_role'], null, 'carousel'));
    if (!this.hasAttribute('aria-label') && !this.hasAttribute('aria-labelledby')) {
      this.setAttribute('aria-label', t(['slider_label', 'carousel'], null, 'Carousel'));
    }
    const total = this.#slides.length;
    this.#slides.forEach((slide, i) => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', t('slide_role', null, 'slide'));
      slide.setAttribute('aria-label', t(['slide_of', 'slideOf'], { index: i + 1, total }, '{{ index }} of {{ total }}'));
    });

    this.#live =
      this.querySelector('[data-slider-live]') ||
      this.#make('div', 'av-slider__live', { 'data-slider-live': '', 'aria-live': 'polite', 'aria-atomic': 'true' });
    this.#prev = this.querySelector('[data-slider-prev]');
    this.#next = this.querySelector('[data-slider-next]');
    if (this.hasAttribute('arrows')) {
      this.#prev ||= this.#make('button', 'av-slider__arrow av-slider__arrow--prev', {
        type: 'button',
        'data-slider-prev': '',
        'aria-label': t(['slider_prev', 'previous'], null, 'Previous slide'),
      }, ARROW);
      this.#next ||= this.#make('button', 'av-slider__arrow av-slider__arrow--next', {
        type: 'button',
        'data-slider-next': '',
        'aria-label': t(['slider_next', 'next'], null, 'Next slide'),
      }, ARROW);
    }
    this.#dotsWrap =
      this.querySelector('[data-slider-dots]') ||
      (this.hasAttribute('dots') ? this.#make('div', 'av-slider__dots', { 'data-slider-dots': '' }) : null);
    if (this.#dotsWrap) {
      this.#dotsWrap.setAttribute('role', 'group');
      if (!this.#dotsWrap.hasAttribute('aria-label')) {
        this.#dotsWrap.setAttribute('aria-label', t(['slider_dots', 'chooseSlide'], null, 'Choose slide'));
      }
    }
    this.#ownTabindex = !this.#track.hasAttribute('tabindex');

    this.#interval = Math.max(0, parseFloat(this.getAttribute('autoplay')) || 0) * 1000;
    if (this.#interval) {
      this.#userPaused = motionOff();
      this.#pauseBtn =
        this.querySelector('[data-slider-pause]') ||
        this.#make('button', 'av-slider__pause', { type: 'button', 'data-slider-pause': '' }, PAUSE_PLAY);
      this.#pauseBtn.addEventListener('click', this.#onPauseClick);
      this.addEventListener('pointerenter', this.#onEnter);
      this.addEventListener('pointerleave', this.#onLeave);
      this.addEventListener('focusin', this.#onFocusIn);
      this.addEventListener('focusout', this.#onFocusOut);
      document.addEventListener('visibilitychange', this.#sync);
      this.#io = new IntersectionObserver(([entry]) => {
        this.#visible = entry.isIntersecting;
        this.#sync();
      }, { threshold: 0.25 });
      this.#io.observe(this);
      this.#pauseLabel();
    }

    this.#prev?.addEventListener('click', this.#onPrev);
    this.#next?.addEventListener('click', this.#onNext);
    this.#dotsWrap?.addEventListener('click', this.#onDot);
    this.#track.addEventListener('scroll', this.#onScroll, { passive: true });
    this.addEventListener('keydown', this.#onKey);
    this.addEventListener('shopify:block:select', this.#onBlockSelect);
    this.addEventListener('shopify:block:deselect', this.#onBlockDeselect);
    this.#ro = new ResizeObserver(() => this.#layout());
    this.#ro.observe(this.#track);
    this.#layout();
    this.#sync();
  }

  disconnectedCallback() {
    clearInterval(this.#timer);
    this.#timer = 0;
    cancelAnimationFrame(this.#raf);
    clearTimeout(this.#idle);
    this.#ro?.disconnect();
    this.#io?.disconnect();
    document.removeEventListener('visibilitychange', this.#sync);
    this.#track?.removeEventListener('scroll', this.#onScroll);
    this.#prev?.removeEventListener('click', this.#onPrev);
    this.#next?.removeEventListener('click', this.#onNext);
    this.#dotsWrap?.removeEventListener('click', this.#onDot);
    this.#pauseBtn?.removeEventListener('click', this.#onPauseClick);
    this.removeEventListener('pointerenter', this.#onEnter);
    this.removeEventListener('pointerleave', this.#onLeave);
    this.removeEventListener('focusin', this.#onFocusIn);
    this.removeEventListener('focusout', this.#onFocusOut);
    this.removeEventListener('keydown', this.#onKey);
    this.removeEventListener('shopify:block:select', this.#onBlockSelect);
    this.removeEventListener('shopify:block:deselect', this.#onBlockDeselect);
  }

  #make(tag, className, attrs, html = '') {
    const el = document.createElement(tag);
    el.className = className;
    for (const name in attrs) el.setAttribute(name, attrs[name]);
    el.innerHTML = html;
    this.append(el);
    return el;
  }

  get #perView() {
    return Math.max(1, Math.floor((this.#track.clientWidth + this.#gap) / this.#step + 0.01));
  }

  get #maxScroll() {
    return this.#track.scrollWidth - this.#track.clientWidth;
  }

  get #wraps() {
    return this.hasAttribute('loop') || this.#interval > 0;
  }

  #layout() {
    const [first, second] = this.#slides;
    const width = first.offsetWidth || 1;
    this.#step = second && second.offsetLeft > first.offsetLeft ? second.offsetLeft - first.offsetLeft : width;
    this.#gap = Math.max(0, this.#step - width);
    this.#pages = Math.max(1, Math.ceil(this.#slides.length / this.#perView));
    this.style.setProperty('--av-slider-track-h', `${this.#track.offsetHeight}px`);
    if (this.#dotsWrap && this.#dots.length !== this.#pages) {
      this.#dotsWrap.replaceChildren(
        ...Array.from({ length: this.#pages }, (_, i) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'av-slider__dot';
          dot.dataset.anvilPage = i;
          dot.setAttribute('aria-label', t(['slider_goto', 'goToSlide'], { index: i + 1 }, 'Go to slide {{ index }}'));
          return dot;
        })
      );
      this.#dots = [...this.#dotsWrap.children];
    }
    const scrolls = this.#maxScroll > 1;
    this.classList.toggle('av-is-static', !scrolls);
    if (this.#ownTabindex) {
      if (scrolls) this.#track.tabIndex = 0;
      else this.#track.removeAttribute('tabindex');
    }
    this.#update(true);
  }

  #onScroll = () => {
    if (this.#raf) return;
    this.#raf = requestAnimationFrame(() => {
      this.#raf = 0;
      this.#update();
    });
  };

  #update(silent) {
    const total = this.#slides.length;
    const atEnd = this.#track.scrollLeft >= this.#maxScroll - 1;
    const i = Math.min(total - 1, Math.max(0, Math.round(Math.abs(this.#track.scrollLeft) / this.#step)));
    if (this.#prev) this.#prev.disabled = !this.#wraps && i === 0;
    if (this.#next) this.#next.disabled = !this.#wraps && atEnd;
    const page = atEnd ? this.#pages - 1 : Math.floor(i / this.#perView);
    this.#dots.forEach((dot, n) => {
      if (n === page) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    if (i === this.#index && !silent) return;
    this.#index = i;
    if (silent) return;
    clearTimeout(this.#idle);
    this.#idle = setTimeout(() => {
      this.#live.textContent = t(['slider_moved', 'slide_of', 'slideOf'], { index: i + 1, total }, 'Slide {{ index }} of {{ total }}');
    }, 250);
    this.dispatchEvent(
      new CustomEvent('anvil:slider:change', { bubbles: true, detail: { index: i, total, element: this } })
    );
  }

  goTo(index, smooth = !motionOff()) {
    const total = this.#slides.length;
    if (!total) return;
    const i = ((index % total) + total) % total;
    const left = this.#slides[i].offsetLeft - this.#slides[0].offsetLeft;
    this.#track.scrollTo({ left, behavior: smooth ? 'smooth' : 'instant' });
  }

  next() {
    if (this.#track.scrollLeft >= this.#maxScroll - 1) {
      if (this.#wraps) this.goTo(0);
    } else {
      this.goTo(Math.min(this.#slides.length - 1, this.#index + this.#perView));
    }
  }

  prev() {
    if (this.#index === 0) {
      if (this.#wraps) this.goTo(this.#slides.length - 1);
    } else {
      this.goTo(Math.max(0, this.#index - this.#perView));
    }
  }

  play() {
    this.#userPaused = false;
    this.#pauseLabel();
    this.#sync();
  }

  pause() {
    this.#userPaused = true;
    this.#pauseLabel();
    this.#sync();
  }

  #sync = () => {
    const run =
      this.#interval > 0 &&
      !this.#userPaused &&
      !this.#hover &&
      !this.#focus &&
      !this.#editing &&
      this.#visible &&
      !document.hidden;
    if (run && !this.#timer) this.#timer = setInterval(() => this.next(), this.#interval);
    if (!run && this.#timer) {
      clearInterval(this.#timer);
      this.#timer = 0;
    }
    this.#live?.setAttribute('aria-live', this.#timer ? 'off' : 'polite');
    this.classList.toggle('av-is-playing', !!this.#timer);
  };

  #pauseLabel() {
    const btn = this.#pauseBtn;
    if (!btn) return;
    const paused = this.#userPaused;
    btn.setAttribute('aria-pressed', String(paused));
    btn.setAttribute('aria-label', paused ? t(['slider_play', 'play'], null, 'Play slideshow') : t(['slider_pause', 'pause'], null, 'Pause slideshow'));
    btn.classList.toggle('av-is-paused', paused);
  }

  #onPauseClick = () => (this.#userPaused ? this.play() : this.pause());
  #onPrev = () => this.prev();
  #onNext = () => this.next();
  #onEnter = () => {
    this.#hover = true;
    this.#sync();
  };
  #onLeave = () => {
    this.#hover = false;
    this.#sync();
  };
  #onFocusIn = () => {
    this.#focus = true;
    this.#sync();
  };
  #onFocusOut = (e) => {
    if (this.contains(e.relatedTarget)) return;
    this.#focus = false;
    this.#sync();
  };
  #onDot = (e) => {
    const dot = e.target.closest('[data-anvil-page]');
    if (dot) this.goTo(Math.min(this.#slides.length - 1, Number(dot.dataset.anvilPage) * this.#perView));
  };
  #onKey = (e) => {
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prev();
    }
  };
  #onBlockSelect = (e) => {
    const i = this.#slides.findIndex((slide) => slide.contains(e.target));
    if (i < 0) return;
    this.#editing = true;
    this.#sync();
    this.goTo(i, false);
  };
  #onBlockDeselect = () => {
    this.#editing = false;
    this.#sync();
  };
}

customElements.get('anvil-slider') || customElements.define('anvil-slider', Slider);
