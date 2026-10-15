/**
 * anvil-countdown.js — <anvil-countdown ends-at="2026-12-31T23:59:00" timezone="America/Denver" expired="hide|text">
 *
 * Ticks once a second towards a real, absolute deadline. `ends-at` without an offset is read as wall-clock time in
 * `timezone` (IANA name; falls back to the browser zone when missing or invalid); with "Z" or an offset the
 * timezone attribute is ignored. Writes zero-padded values into [data-anvil-cd="days|hours|minutes|seconds"], adds
 * .is-under-day when fewer than 24 h remain, pauses while the tab is hidden and re-syncs on return.
 * Expiry: .is-expired; expired="hide" hides the whole element, otherwise [data-anvil-running] (or the number slots
 * when no wrapper exists) is hidden and [data-anvil-expired] is revealed. Emits anvil:countdown:expired
 * {element, endsAt} (bubbles). Without a parseable `ends-at` the element hides itself.
 * By design there is no duration, evergreen or per-visitor mode: the only input is an end time the merchant typed.
 */
const LOCAL = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

function deadline(iso, zone) {
  const m = LOCAL.exec(iso.trim());
  if (!m) return Date.parse(iso);
  const [y, mo, d, h, mi, s] = m.slice(1).map((v) => Number(v) || 0);
  const local = () => new Date(y, mo - 1, d, h, mi, s).getTime();
  if (!zone) return local();
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    const wall = (ms) => {
      const p = {};
      for (const { type, value } of fmt.formatToParts(ms)) p[type] = Number(value);
      return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
    };
    const guess = Date.UTC(y, mo - 1, d, h, mi, s);
    let utc = guess - (wall(guess) - guess);
    utc = guess - (wall(utc) - utc); // second pass settles DST transitions
    return utc;
  } catch {
    return local();
  }
}

class Countdown extends HTMLElement {
  #end = NaN;
  #timer = 0;
  #slots = {};
  #last = {};

  connectedCallback() {
    const at = this.getAttribute('ends-at');
    this.#end = at ? deadline(at, this.getAttribute('timezone')) : NaN;
    for (const el of this.querySelectorAll('[data-anvil-cd]')) this.#slots[el.dataset.anvilCd] = el;
    if (!this.hasAttribute('role')) this.setAttribute('role', 'timer');
    if (Number.isNaN(this.#end)) {
      this.hidden = true;
      return;
    }
    this.#tick();
    document.addEventListener('visibilitychange', this.#onVisibility);
    this.#start();
  }

  disconnectedCallback() {
    this.#stop();
    document.removeEventListener('visibilitychange', this.#onVisibility);
  }

  #start() {
    this.#stop();
    if (!document.hidden && !this.classList.contains('is-expired')) this.#timer = setInterval(this.#tick, 1000);
  }

  #stop() {
    clearInterval(this.#timer);
    this.#timer = 0;
  }

  #onVisibility = () => {
    if (document.hidden) {
      this.#stop();
    } else {
      this.#tick();
      this.#start();
    }
  };

  #tick = () => {
    const left = this.#end - Date.now();
    if (left <= 0) return this.#expire();
    const total = Math.floor(left / 1000);
    const parts = {
      days: Math.floor(total / 86400),
      hours: Math.floor(total / 3600) % 24,
      minutes: Math.floor(total / 60) % 60,
      seconds: total % 60,
    };
    for (const key in parts) {
      if (this.#slots[key] && this.#last[key] !== parts[key]) {
        this.#slots[key].textContent = String(parts[key]).padStart(2, '0');
      }
    }
    this.#last = parts;
    this.classList.toggle('is-under-day', parts.days === 0);
  };

  #expire() {
    this.#stop();
    if (this.classList.contains('is-expired')) return;
    this.classList.add('is-expired');
    if (this.getAttribute('expired') === 'hide') {
      this.hidden = true;
    } else {
      const running = this.querySelectorAll('[data-anvil-running]');
      for (const el of running.length ? running : Object.values(this.#slots)) el.hidden = true;
      for (const el of this.querySelectorAll('[data-anvil-expired]')) el.hidden = false;
    }
    this.dispatchEvent(
      new CustomEvent('anvil:countdown:expired', { bubbles: true, detail: { element: this, endsAt: this.#end } })
    );
  }
}

customElements.get('anvil-countdown') || customElements.define('anvil-countdown', Countdown);
