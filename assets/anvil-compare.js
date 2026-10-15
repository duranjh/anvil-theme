/**
 * anvil-compare.js — <anvil-compare start="50" vertical>: a before/after image slider.
 *
 * Markup: two .av-compare__media children (before first, after second), an <input type="range" min="0" max="100"
 * data-compare-range aria-label="…"> and optional .av-compare__handle / .av-compare__label elements. The range value
 * drives --av-compare-pos (a percentage) on the element; anvil-compare.css clips the "after" layer with clip-path and
 * positions the handle. A mouse or pen press anywhere on the element moves the divider (pointer capture); a touch
 * waits until it moves more than 8 px along the split axis, so a page swipe that starts on the slider scrolls instead.
 * Arrow, Home and End keys work through the native range, which stays focusable but visually hidden. `vertical`
 * splits top/bottom, and there ArrowUp moves the divider up (the native range would move it down).
 * `start` seeds the range when its markup has no value attribute. Emits anvil:compare:change {value} (bubbles).
 * Property: value (0–100).
 */
class Compare extends HTMLElement {
  #range;
  #dragging = false;
  #start = null;

  get value() {
    return Number(this.#range?.value) || 0;
  }

  connectedCallback() {
    this.#range = this.querySelector('[data-compare-range], input[type="range"]');
    if (!this.#range) return;
    if (this.hasAttribute('start') && !this.#range.hasAttribute('value')) {
      this.#range.value = parseFloat(this.getAttribute('start')) || 0;
    }
    this.#range.addEventListener('input', this.#apply);
    this.#range.addEventListener('keydown', this.#onKey);
    this.addEventListener('pointerdown', this.#onDown);
    this.#apply();
  }

  disconnectedCallback() {
    this.#range?.removeEventListener('input', this.#apply);
    this.#range?.removeEventListener('keydown', this.#onKey);
    this.removeEventListener('pointerdown', this.#onDown);
    this.#release();
  }

  #apply = () => {
    const v = Math.min(100, Math.max(0, parseFloat(this.#range.value) || 0));
    this.style.setProperty('--av-compare-pos', `${v}%`);
    this.#range.setAttribute('aria-valuetext', `${Math.round(v)}%`);
    this.dispatchEvent(new CustomEvent('anvil:compare:change', { bubbles: true, detail: { value: v } }));
  };

  #onKey = (e) => {
    if (!this.hasAttribute('vertical') || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const step = parseFloat(this.#range.step) || 1;
    this.#range.value = Math.min(100, Math.max(0, this.value + (e.key === 'ArrowUp' ? -step : step)));
    this.#apply();
  };

  #onDown = (e) => {
    if (e.button !== 0 || e.target.closest('a, button')) return;
    this.addEventListener('pointermove', this.#onMove);
    this.addEventListener('pointerup', this.#onUp);
    this.addEventListener('pointercancel', this.#onCancel);
    if (e.pointerType === 'touch') {
      this.#start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      return;
    }
    this.#grab(e);
    e.preventDefault();
  };

  #grab(e) {
    this.#start = null;
    this.#dragging = true;
    try {
      this.setPointerCapture(e.pointerId);
    } catch {
      // synthetic pointer without an active id
    }
    this.#onMove(e);
  }

  #onMove = (e) => {
    if (this.#start) {
      const along = Math.abs(this.hasAttribute('vertical') ? e.clientY - this.#start.y : e.clientX - this.#start.x);
      const across = Math.abs(this.hasAttribute('vertical') ? e.clientX - this.#start.x : e.clientY - this.#start.y);
      if (along > 8 && along > across) this.#grab(e);
      return;
    }
    if (!this.#dragging) return;
    const r = this.getBoundingClientRect();
    const ratio = this.hasAttribute('vertical') ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
    this.#range.value = Math.min(100, Math.max(0, ratio * 100));
    this.#apply();
  };

  #onUp = () => {
    const moved = this.#dragging;
    this.#release();
    if (moved) this.#range.focus({ preventScroll: true });
  };

  #onCancel = () => this.#release();

  #release() {
    this.#dragging = false;
    this.#start = null;
    this.removeEventListener('pointermove', this.#onMove);
    this.removeEventListener('pointerup', this.#onUp);
    this.removeEventListener('pointercancel', this.#onCancel);
  }
}

customElements.get('anvil-compare') || customElements.define('anvil-compare', Compare);
