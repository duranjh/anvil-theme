/**
 * anvil-palette-preview.js — <anvil-palette-preview> for sections/anvil-palette-preview.liquid (theme editor only).
 * Liquid's color_contrast filter prints one decimal, so a ratio shown as 4.5 may really be 4.46. This element
 * recomputes every [data-anvil-pair] row with the WCAG 2 relative-luminance formula, prints the ratio rounded down
 * to two decimals and swaps in the verdict <template> for the unrounded value, so a pass is never overstated.
 * Rows carry data-anvil-pair (text | edge | icon), data-anvil-fg and data-anvil-bg ("rgb(r, g, b)" or
 * "rgba(r, g, b, a)"), and on scheme cards data-anvil-base (the scheme background the pair is painted on).
 * Transparency: a see-through background is composited over a solid base, then a see-through foreground over that
 * result (c = a * top + (1 - a) * under, in 0-255 sRGB, rounded to whole channel values as a browser paints them).
 * With no solid base (badge rows, or a see-through scheme background) the server's "check by eye" verdict stays.
 * No listeners: a re-render in the editor connects a fresh element, which computes again.
 */
const parse = (value = '') => {
  const n = (value.match(/\d*\.?\d+/g) || []).map(Number);
  return n.length < 3 ? null : { c: n.slice(0, 3), a: n.length > 3 ? Math.min(Math.max(n[3], 0), 1) : 1 };
};

const over = (top, under) => ({ c: top.c.map((v, i) => Math.round(top.a * v + (1 - top.a) * under.c[i])), a: 1 });

const channel = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = ({ c: [r, g, b] }) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

const level = (ratio, kind) => {
  if (kind !== 'text') return ratio >= 3 ? 'ui' : 'ui_fail';
  if (ratio >= 7) return 'aaa';
  if (ratio >= 4.5) return 'aa';
  return ratio >= 3 ? 'large' : 'fail';
};

class PalettePreview extends HTMLElement {
  connectedCallback() {
    for (const row of this.querySelectorAll('[data-anvil-pair]')) {
      let fg = parse(row.dataset.anvilFg);
      let bg = parse(row.dataset.anvilBg);
      const base = parse(row.dataset.anvilBase);
      if (!fg || !bg) continue;
      if (bg.a < 1) {
        if (!base || base.a < 1) continue;
        bg = over(bg, base);
      }
      if (fg.a < 1) fg = over(fg, bg);
      const a = luminance(fg);
      const b = luminance(bg);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const tpl = this.querySelector(`template[data-anvil-level="${level(ratio, row.dataset.anvilPair)}"]`);
      const out = row.querySelector('[data-anvil-ratio]');
      if (out) out.textContent = `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
      if (tpl) row.querySelector('[data-anvil-verdict]')?.replaceChildren(tpl.content.cloneNode(true));
    }
  }
}

if (!customElements.get('anvil-palette-preview')) customElements.define('anvil-palette-preview', PalettePreview);
