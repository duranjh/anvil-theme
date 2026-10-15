/**
 * anvil-events.js — Anvil's pub/sub bus (core module, imported by anvil-core.js).
 *
 * Exports
 *   on(topic, handler)   → unsubscribe function
 *   off(topic, handler)
 *   emit(topic, detail)  → detail; also dispatches `new CustomEvent(topic, { detail })` on `document`
 *
 * Topics used across the theme (all prefixed `anvil:`):
 *   anvil:cart:updated {cart, sections, source}      anvil:cart:error {status, message, description, source}
 *   anvil:variant:changed {variant, product, sectionId} anvil:quantity:changed
 *   anvil:drawer:opened|closed {id, element, opener}  anvil:dialog:opened|closed {id, element, opener}
 *   anvil:section:swapped {id, element}               anvil:section:load|unload {sectionId, element}
 *
 * A handler registered with on() receives the detail object directly; a `document` listener receives it as
 * event.detail. Every emit reaches both, so subscribe one way, not both. Handler errors are logged, not thrown,
 * so one broken subscriber never blocks the others.
 */
const topics = new Map();

export function on(topic, handler) {
  let set = topics.get(topic);
  if (!set) topics.set(topic, (set = new Set()));
  set.add(handler);
  return () => off(topic, handler);
}

export function off(topic, handler) {
  const set = topics.get(topic);
  if (!set) return;
  set.delete(handler);
  if (!set.size) topics.delete(topic);
}

export function emit(topic, detail = {}) {
  const set = topics.get(topic);
  if (set) {
    for (const handler of [...set]) {
      try {
        handler(detail);
      } catch (err) {
        console.error(`[anvil] ${topic} handler failed`, err);
      }
    }
  }
  document.dispatchEvent(new CustomEvent(topic, { detail }));
  return detail;
}
