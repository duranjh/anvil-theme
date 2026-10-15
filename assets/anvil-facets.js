/**
 * anvil-facets.js — <anvil-facets section-id="…" class="av-enhance">: live filtering and sorting for the collection
 * and search pages (sections/main-collection.liquid, sections/main-search.liquid).
 *
 * Without JavaScript the wrapped GET form submits with its Apply button. Once defined, changing a filter, the sort
 * menu or a price field re-renders the results in place through the Section Rendering API
 * (`<form action>?<form fields>&section_id=<id>`); it never navigates on a select change. Swapped regions are the
 * elements marked [data-anvil-section="<id>-facets"] and [data-anvil-section="<id>-results"] (focus kept by
 * data-anvil-focus-key; open <details> kept by data-anvil-details-key). Links marked [data-anvil-facets-link]
 * (remove one filter, clear all) update the same way. The new result count (from [data-anvil-facets-count]) is read
 * out through the element's own [data-anvil-facets-live] region, and the URL is updated with history.pushState so
 * the page can be shared and Back restores the previous filters.
 */
const DEBOUNCE = { change: 250, input: 800 };

class Facets extends HTMLElement {
  #timer = 0;
  #ctrl = null;

  connectedCallback() {
    this.addEventListener('change', this.#onChange);
    this.addEventListener('input', this.#onInput);
    this.addEventListener('submit', this.#onSubmit);
    this.addEventListener('click', this.#onClick);
    window.addEventListener('popstate', this.#onPop);
  }

  disconnectedCallback() {
    this.removeEventListener('change', this.#onChange);
    this.removeEventListener('input', this.#onInput);
    this.removeEventListener('submit', this.#onSubmit);
    this.removeEventListener('click', this.#onClick);
    window.removeEventListener('popstate', this.#onPop);
    clearTimeout(this.#timer);
    this.#ctrl?.abort();
  }

  get form() {
    return this.querySelector('form[data-anvil-facets-form]');
  }

  #urlFromForm() {
    const form = this.form;
    if (!form) return null;
    const params = new URLSearchParams();
    for (const [name, value] of new FormData(form)) if (String(value).trim() !== '') params.append(name, value);
    const url = new URL(form.getAttribute('action') || location.pathname, location.origin);
    url.search = params.toString();
    return url;
  }

  #queue(wait) {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      const url = this.#urlFromForm();
      if (url) this.#render(url, true);
    }, wait);
  }

  #onChange = (e) => {
    if (!e.target.closest('form[data-anvil-facets-form]')) return;
    if (e.target.type === 'number' && !e.target.checkValidity()) return;
    this.#queue(DEBOUNCE.change);
  };

  #onInput = (e) => {
    if (e.target.type === 'number' && e.target.closest('form[data-anvil-facets-form]')) this.#queue(DEBOUNCE.input);
  };

  #onSubmit = (e) => {
    if (!e.target.matches('form[data-anvil-facets-form]')) return;
    e.preventDefault();
    this.#queue(0);
  };

  #onClick = (e) => {
    const link = e.target.closest('a[data-anvil-facets-link]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    this.#render(new URL(link.href, location.origin), true, true);
  };

  #onPop = () => {
    this.#render(new URL(location.href), false);
  };

  async #render(url, push, focusResults = false) {
    const id = this.getAttribute('section-id');
    if (!id) return;
    this.#ctrl?.abort();
    this.#ctrl = new AbortController();
    const fetchUrl = new URL(url);
    fetchUrl.searchParams.set('section_id', id);
    const results = this.querySelector(`[data-anvil-section="${CSS.escape(`${id}-results`)}"]`);
    results?.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch(fetchUrl, { signal: this.#ctrl.signal });
      if (!res.ok) throw new Error(String(res.status));
      const html = await res.text();
      const open = new Set([...this.querySelectorAll('details[data-anvil-details-key][open]')].map((d) => d.dataset.anvilDetailsKey));
      const swap = window.Anvil?.sections?.swapSection;
      if (!swap) throw new Error('sections module missing');
      swap(`${id}-facets`, html);
      swap(`${id}-results`, html);
      for (const d of this.querySelectorAll('details[data-anvil-details-key]')) {
        if (open.has(d.dataset.anvilDetailsKey)) d.open = true;
      }
      if (push) history.pushState({ anvilFacets: true }, '', url.pathname + url.search);
      const count = this.querySelector('[data-anvil-facets-count]');
      const live = this.querySelector('[data-anvil-facets-live]');
      if (live && count) {
        live.textContent = '';
        setTimeout(() => { live.textContent = count.textContent.trim(); }, 60);
      }
      if (focusResults) this.querySelector('[data-anvil-facets-count]')?.focus({ preventScroll: true });
    } catch (err) {
      if (err?.name === 'AbortError') return;
      location.assign(url.pathname + url.search);
    } finally {
      this.querySelector(`[data-anvil-section="${CSS.escape(`${id}-results`)}"]`)?.removeAttribute('aria-busy');
    }
  }
}

customElements.get('anvil-facets') || customElements.define('anvil-facets', Facets);
