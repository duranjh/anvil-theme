/**
 * anvil-sections.js — Section Rendering API helpers (core module, loaded by anvil-core.js).
 *
 * Exports
 *   fetchSections(ids, url?) → Promise<{ [id]: html }>
 *       GET `url?sections=a,b` (default: current path + query), at most 5 ids; sections the server returned as
 *       null are left out of the result.
 *   swapSection(id, html) → Element | null
 *       The swap root is the element marked `data-anvil-section="<id>"`; only its children are replaced, so an open
 *       <dialog>, a custom element's state or a live region that sits outside the root survives. When no such marker
 *       exists the `#shopify-section-<id>` wrapper is used instead. The same lookup runs on the parsed response
 *       (falling back to its body). Keeps the focused control by `data-anvil-focus-key` (with its text selection),
 *       the window scroll offset and the scroll offsets of descendants marked `data-anvil-scroll="<key>"`.
 *       Section CSS lives in assets/anvil-sec-<name>.css, loaded by a <link> at the top of the section (Shopify
 *       ships every {% stylesheet %} on every page, DECISIONS 3). Only the root's children are copied, so every
 *       stylesheet <link> in the response is appended to <head> once (by href), and any
 *       <style data-section-stylesheet> once (by text), before the swap.
 *       Emits anvil:section:swapped {id, element}. Returns null when the target is not on the page.
 *
 * This module has no static imports: anvil-core.js loads every core module from its versioned asset URL, and
 * events go through window.Anvil.events (or a plain document event before the bus exists).
 */
function emit(topic, detail) {
  const bus = window.Anvil?.events;
  if (bus?.emit) return bus.emit(topic, detail);
  document.dispatchEvent(new CustomEvent(topic, { detail }));
  return detail;
}

const styles = new Set();

function wrapper(root, id) {
  return (
    root.querySelector(`[data-anvil-section="${CSS.escape(id)}"]`) ||
    root.querySelector(`#${CSS.escape(`shopify-section-${id}`)}`)
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
  for (const style of doc.querySelectorAll('style[data-section-stylesheet]')) {
    const css = style.textContent;
    if (css.trim() && !styles.has(css)) {
      styles.add(css);
      document.head.append(style);
    }
  }
  for (const link of doc.querySelectorAll('link[rel="stylesheet"][href]')) {
    const href = link.getAttribute('href');
    if (![...document.querySelectorAll('link[rel="stylesheet"]')].some((l) => l.getAttribute('href') === href)) {
      document.head.append(link);
    }
  }

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
