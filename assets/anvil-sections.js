/**
 * anvil-sections.js — Section Rendering API helpers (core module, imported by anvil-core.js).
 *
 * Exports
 *   fetchSections(ids, url?) → Promise<{ [id]: html }>
 *       GET `url?sections=a,b` (default: current path + query), at most 5 ids; sections the server returned as
 *       null are left out of the result.
 *   swapSection(id, html) → Element | null
 *       Parses `html` with DOMParser and replaces the children of `#shopify-section-<id>` (or
 *       `[data-anvil-section="<id>"]`) with the matching wrapper's children from the parsed document (or the parsed
 *       body when the html has no wrapper). Keeps the focused control by `data-anvil-focus-key` (with its text
 *       selection), keeps the window scroll offset and the scroll offsets of descendants marked
 *       `data-anvil-scroll="<key>"`. Emits anvil:section:swapped {id, element}. Returns null when the target is
 *       not on the page.
 */
import { emit } from './anvil-events.js';

function wrapper(root, id) {
  return (
    root.querySelector(`#${CSS.escape(`shopify-section-${id}`)}`) ||
    root.querySelector(`[data-anvil-section="${CSS.escape(id)}"]`)
  );
}

export async function fetchSections(ids, url) {
  const list = [].concat(ids).filter(Boolean).slice(0, 5);
  if (!list.length) return {};
  const target = new URL(url || window.location.pathname + window.location.search, window.location.origin);
  target.searchParams.set('sections', list.join(','));
  const res = await fetch(target, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`[anvil] section render failed (${res.status})`);
  const json = await res.json();
  const out = {};
  for (const id of list) if (json[id] != null) out[id] = json[id];
  return out;
}

export function swapSection(id, html) {
  const target = wrapper(document, id);
  if (!target || typeof html !== 'string') return null;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const source = wrapper(doc, id) || doc.body;

  const active = document.activeElement;
  const focusKey = target.contains(active) ? active.getAttribute('data-anvil-focus-key') : null;
  let selection = null;
  if (focusKey) {
    try {
      selection = [active.selectionStart, active.selectionEnd];
    } catch {
      selection = null;
    }
  }
  const scrolls = [...target.querySelectorAll('[data-anvil-scroll]')].map((el) => [
    el.dataset.anvilScroll,
    el.scrollTop,
    el.scrollLeft,
  ]);
  const { scrollX, scrollY } = window;

  target.replaceChildren(...source.childNodes);

  for (const [key, top, left] of scrolls) {
    const el = target.querySelector(`[data-anvil-scroll="${CSS.escape(key)}"]`);
    if (el) {
      el.scrollTop = top;
      el.scrollLeft = left;
    }
  }
  window.scrollTo(scrollX, scrollY);
  if (focusKey) {
    const next = target.querySelector(`[data-anvil-focus-key="${CSS.escape(focusKey)}"]`);
    if (next) {
      next.focus({ preventScroll: true });
      if (selection && selection[0] != null) {
        try {
          next.setSelectionRange(selection[0], selection[1]);
        } catch {
          // not a text control
        }
      }
    }
  }
  emit('anvil:section:swapped', { id, element: target });
  return target;
}
