/* anvil-stats.js — <anvil-stats> (sections/anvil-stats.liquid): each [data-anvil-count] figure counts up from 0
   once, in 2 s, when it scrolls into view. The merchant's exact text (.av-stats__final) keeps its place, size and
   spot in the accessibility tree; the counting copy is an aria-hidden clone laid over it (.av-stats__tick), so
   nothing shifts. Skipped under reduced motion or html[data-animations="off"], for a figure already on screen when
   the module runs (no flash back to 0; in the editor too, so the preview matches the storefront) and, in the editor,
   after a re-render; block select shows the final number.
   Under 5 s, so WCAG 2.2.2 does not apply. */
const motionOff = () =>
  window.Anvil?.dom?.motionOff?.() ??
  (document.documentElement.dataset.animations === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches);
const NUM = /^\d+(?:[.,' ]\d+)*$/;
const DUR = 2000;
const counted = new Set();

/* Writes n into the digit slots of the text from the right (4312 in "12,500" → "4,312"); a last group of 1–2
   digits after "." or "," is decimal and stays filled with the digit before it ("4.8" starts at "0.0"); a figure
   that starts with 0 keeps every slot filled ("0.125" counts 0.000 → 0.125). */
const formatter = (text) => {
  const tail = /[.,](\d{1,2})$/.exec(text);
  const keep = tail ? tail[1].length + 1 : text[0] === '0' ? text.replace(/\D/g, '').length : 1;
  return (n) => {
    const d = String(n).padStart(keep, '0');
    let out = '';
    for (let k = text.length - 1, i = d.length - 1; k >= 0 && i >= 0; k--) {
      out = (text[k] >= '0' && text[k] <= '9' ? d[i--] : text[k]) + out;
    }
    return out;
  };
};

class Stats extends HTMLElement {
  #figs = [];
  #live = new Set();
  #raf = 0;
  #io;
  #ac;

  connectedCallback() {
    if (motionOff() || !('IntersectionObserver' in window)) return;
    const id = this.closest('[data-section-id]')?.dataset.sectionId;
    const editor = window.Shopify?.designMode;
    if (editor && counted.has(id)) return;
    for (const el of this.querySelectorAll('[data-anvil-count]')) {
      const final = el.querySelector('.av-stats__final');
      const text = final?.querySelector('.av-stats__num')?.textContent.trim() || '';
      const digits = text.replace(/\D/g, '');
      if (!NUM.test(text) || digits.length > 15 || !+digits) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) continue;
      const tick = final.cloneNode(true);
      tick.className = 'av-stats__tick';
      tick.setAttribute('aria-hidden', 'true');
      const fig = { el, tick, out: tick.querySelector('.av-stats__num'), fmt: formatter(text), total: +digits };
      fig.out.textContent = fig.fmt(0);
      el.append(tick);
      el.classList.add('av-is-counting');
      this.#figs.push(fig);
    }
    if (!this.#figs.length) return;
    if (editor) counted.add(id);
    this.#io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        this.#io.unobserve(e.target);
        const fig = this.#figs.find((f) => f.el === e.target);
        if (fig) {
          fig.t0 = performance.now();
          this.#live.add(fig);
          this.#raf ||= requestAnimationFrame(this.#frame);
        }
      }
    });
    for (const f of this.#figs) this.#io.observe(f.el);
    this.#ac = new AbortController();
    this.addEventListener(
      'shopify:block:select',
      (e) => {
        for (const f of this.#figs) if (e.target.contains(f.el)) this.#end(f);
      },
      { signal: this.#ac.signal }
    );
  }

  disconnectedCallback() {
    this.#io?.disconnect();
    this.#ac?.abort();
    cancelAnimationFrame(this.#raf);
    this.#raf = 0;
    for (const f of this.#figs) this.#end(f);
    this.#figs = [];
  }

  #frame = (now) => {
    for (const f of this.#live) {
      const p = Math.min(1, Math.max(0, (now - f.t0) / DUR));
      if (p < 1) f.out.textContent = f.fmt(Math.round(f.total * (1 - (1 - p) ** 3)));
      else this.#end(f);
    }
    this.#raf = this.#live.size ? requestAnimationFrame(this.#frame) : 0;
  };

  #end(f) {
    this.#live.delete(f);
    this.#io?.unobserve(f.el);
    f.tick.remove();
    f.el.classList.remove('av-is-counting');
  }
}

customElements.get('anvil-stats') || customElements.define('anvil-stats', Stats);
