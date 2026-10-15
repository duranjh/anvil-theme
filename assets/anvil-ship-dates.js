/**
 * anvil-ship-dates.js — <anvil-ship-dates> (snippets/anvil-ship-dates.liquid). Liquid prints the estimated dates from
 * 'now' in the store's time zone; a cached page can carry an earlier day's dates, so this element recomputes them
 * from the shopper's clock and rewrites the [data-anvil-ship="ordered|ship|delivery|from|to"] slots only when they
 * differ from what the server printed.
 * Config: the JSON in the element's [data-anvil-ship-dates] child:
 *   { now: epoch seconds at render, local: "YYYY-MM-DDTHH:MM:SS" store wall clock at the same moment, pmin, pmax,
 *     dmin, dmax, skip, cutoff, format: short|long|weekday|weekday_long, iso: {ordered, shipFrom, shipTo, from, to} }
 *   The store's UTC offset is local − now, so no time zone database is needed.
 * Variant changes: every [data-anvil-ship-variant="<section id>"] wrapper is hidden while the selected variant of that
 * section is sold out or does not ship (an "arrives by" line for something that cannot ship would mislead).
 *
 * Export: computeShipDates(nowMs, {offset (minutes), pmin, pmax, dmin, dmax, skip, cutoff})
 *   → {ordered, shipFrom, shipTo, from, to} as YYYY-MM-DD in store time, or null when pmax + dmax is 0.
 *   Day 0 is today, or tomorrow at or after the cut-off hour (1–23; 0 = none). With `skip`, Saturdays and Sundays
 *   are not counted and a weekend day 0 moves to Monday. Ship = day 0 + processing days; delivery = day 0 +
 *   processing + transit days. Pure; tested in tests/ship-dates.test.mjs.
 */
const DAY = 864e5;
const int = (v) => Math.max(0, Math.floor(Number(v) || 0));
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const weekend = (t) => new Date(t).getUTCDay() % 6 === 0;

export function computeShipDates(now, cfg = {}) {
  const pmin = int(cfg.pmin);
  const pmax = Math.max(pmin, int(cfg.pmax));
  const dmin = int(cfg.dmin);
  const dmax = Math.max(dmin, int(cfg.dmax));
  if (pmax + dmax === 0) return null;
  const local = Number(now) + (Number(cfg.offset) || 0) * 6e4;
  const noon = Math.floor(local / DAY) * DAY + DAY / 2;
  const cutoff = int(cfg.cutoff);
  let start = noon + (cutoff > 0 && new Date(local).getUTCHours() >= cutoff ? DAY : 0);
  while (cfg.skip && weekend(start)) start += DAY;
  const goals = [pmin, pmax, pmin + dmin, pmax + dmax];
  const out = goals.map(() => start);
  for (let n = 0, t = start; n < goals[3]; ) {
    t += DAY;
    if (cfg.skip && weekend(t)) continue;
    n += 1;
    goals.forEach((goal, i) => {
      if (goal === n) out[i] = t;
    });
  }
  const [shipFrom, shipTo, from, to] = out.map(iso);
  return { ordered: iso(noon), shipFrom, shipTo, from, to };
}

const FORMATS = {
  short: { month: 'short', day: 'numeric' },
  long: { month: 'long', day: 'numeric' },
  weekday: { weekday: 'short', month: 'short', day: 'numeric' },
  weekday_long: { weekday: 'long', month: 'long', day: 'numeric' },
};

if (typeof customElements !== 'undefined' && !customElements.get('anvil-ship-dates')) {
  customElements.define(
    'anvil-ship-dates',
    class extends HTMLElement {
      connectedCallback() {
        let cfg;
        try {
          cfg = JSON.parse(this.querySelector('[data-anvil-ship-dates]').textContent);
        } catch {
          return;
        }
        const offset = Math.round((Date.parse(`${cfg.local}Z`) / 1e3 - cfg.now) / 60);
        if (!Number.isFinite(offset)) return;
        const next = computeShipDates(Date.now(), { ...cfg, offset });
        const old = cfg.iso || {};
        if (!next || Object.keys(next).every((k) => next[k] === old[k])) return;
        const fmt = new Intl.DateTimeFormat(document.documentElement.lang || undefined, {
          ...(FORMATS[cfg.format] || FORMATS.weekday),
          timeZone: 'UTC',
        });
        const time = (d) => {
          const el = document.createElement('time');
          el.dateTime = d;
          el.textContent = fmt.format(new Date(`${d}T12:00:00Z`));
          return el;
        };
        const slots = {
          ordered: [next.ordered],
          ship: [next.shipFrom, next.shipTo],
          delivery: [next.from, next.to],
          from: [next.from],
          to: [next.to],
        };
        for (const slot of this.querySelectorAll('[data-anvil-ship]')) {
          const [a, b] = slots[slot.dataset.anvilShip] || [];
          if (a) slot.replaceChildren(time(a), ...(b && b !== a ? [' – ', time(b)] : []));
        }
      }
    }
  );

  // One module-level listener (the module evaluates once per page), so nothing needs tearing down.
  document.addEventListener('anvil:variant:changed', (e) => {
    const { sectionId, variant } = e.detail || {};
    if (!variant || sectionId == null) return;
    for (const el of document.querySelectorAll(`[data-anvil-ship-variant="${CSS.escape(String(sectionId))}"]`)) {
      el.hidden = !variant.available || variant.requires_shipping === false;
    }
  });
}
