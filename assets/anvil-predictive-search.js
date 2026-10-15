/**
 * anvil-predictive-search.js — <anvil-predictive-search class="av-enhance">: results under the header search field
 * while the shopper types (sections/anvil-header.liquid renders it when Theme settings > Search > predictive search
 * is on). Without JavaScript the wrapped form still submits to the search page.
 *
 * Reads: [data-anvil-predictive-input] (the search input), [data-anvil-predictive-results] (where results go),
 * [data-anvil-predictive-live] (polite status), and the `section-url` attribute (routes.predictive_search_url).
 * Typing 2+ characters fetches `section-url?q=…&section_id=anvil-predictive-search&resources[…]` (debounced, older
 * requests aborted, answers cached per query) and inserts the section's [data-anvil-predictive-results] content;
 * the result count is announced. ArrowDown moves from the field into the result links, ArrowUp/ArrowDown move
 * between them and ArrowUp on the first returns to the field. Clearing the field hides the results.
 */
const MIN = 2;

class PredictiveSearch extends HTMLElement {
  #timer = 0;
  #ctrl = null;
  #cache = new Map();

  get input() {
    return this.querySelector('[data-anvil-predictive-input]');
  }

  get results() {
    return this.querySelector('[data-anvil-predictive-results]');
  }

  connectedCallback() {
    this.addEventListener('input', this.#onInput);
    this.addEventListener('keydown', this.#onKey);
  }

  disconnectedCallback() {
    this.removeEventListener('input', this.#onInput);
    this.removeEventListener('keydown', this.#onKey);
    clearTimeout(this.#timer);
    this.#ctrl?.abort();
  }

  #onInput = (e) => {
    if (e.target !== this.input) return;
    clearTimeout(this.#timer);
    const q = this.input.value.trim();
    if (q.length < MIN) {
      this.#ctrl?.abort();
      this.#show('');
      return;
    }
    this.#timer = setTimeout(() => this.#search(q), 250);
  };

  async #search(q) {
    const base = this.getAttribute('section-url');
    if (!base) return;
    if (this.#cache.has(q)) return this.#show(this.#cache.get(q));
    this.#ctrl?.abort();
    this.#ctrl = new AbortController();
    const url = new URL(base, location.origin);
    url.searchParams.set('q', q);
    url.searchParams.set('section_id', 'anvil-predictive-search');
    url.searchParams.set('resources[type]', 'query,product,collection,page,article');
    url.searchParams.set('resources[limit]', '4');
    url.searchParams.set('resources[limit_scope]', 'each');
    this.setAttribute('aria-busy', 'true');
    try {
      const res = await fetch(url, { signal: this.#ctrl.signal });
      if (!res.ok) throw new Error(String(res.status));
      const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
      const html = doc.querySelector('[data-anvil-predictive-results]')?.innerHTML || '';
      this.#cache.set(q, html);
      if (this.input.value.trim() === q) this.#show(html);
    } catch (err) {
      if (err?.name !== 'AbortError') this.#show('');
    } finally {
      this.removeAttribute('aria-busy');
    }
  }

  #show(html) {
    const box = this.results;
    if (!box) return;
    box.innerHTML = html;
    box.hidden = !html;
    this.input?.setAttribute('aria-expanded', String(Boolean(html)));
    const live = this.querySelector('[data-anvil-predictive-live]');
    const count = box.querySelector('[data-anvil-predictive-count]');
    if (live) {
      live.textContent = '';
      if (count) setTimeout(() => { live.textContent = count.textContent.trim(); }, 60);
    }
  }

  #onKey = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const box = this.results;
    if (!box || box.hidden) return;
    const links = [...box.querySelectorAll('a[href]')];
    if (!links.length) return;
    const i = links.indexOf(document.activeElement);
    if (e.target === this.input) {
      if (e.key !== 'ArrowDown') return;
      e.preventDefault();
      links[0].focus();
    } else if (i >= 0) {
      e.preventDefault();
      if (e.key === 'ArrowDown') links[Math.min(links.length - 1, i + 1)].focus();
      else if (i === 0) this.input?.focus();
      else links[i - 1].focus();
    }
  };
}

customElements.get('anvil-predictive-search') || customElements.define('anvil-predictive-search', PredictiveSearch);
