/* anvil-review-wall.js — <anvil-review-wall class="av-enhance" data-anvil-step="6"> for sections/anvil-review-wall.liquid.
   Liquid renders every review, in full, in one list; this module only adds two things, and the section CSS keys both
   on :defined, so a page without it (no JavaScript, or a failed load) shows every review in full and hides nothing.
   - Read more: review text is cut to the merchant's line count (CSS line-clamp). Once the clamp applies, each
     [data-anvil-read] button stays only where its text is actually cut (measured now, on grid resize and after
     web fonts load). A click copies that card into the section's shared <anvil-dialog> (anvil-core.js) and opens
     it; focus returns to the button on close. Before anvil-core defines it, the native modal opens instead.
   - Show more: cards marked .av-review-wall__card--extra stay hidden until [data-anvil-more] reveals the next
     data-anvil-step of them; focus moves to the first card revealed. Selecting a hidden review in the theme editor
     reveals them all so the merchant sees the card being edited. */
const CARD = '.av-review-wall__card';

class ReviewWall extends HTMLElement {
  #ac;
  #ro;
  #raf = 0;

  connectedCallback() {
    this.#ac = new AbortController();
    const opt = { signal: this.#ac.signal };
    this.addEventListener('click', this.#onClick, opt);
    this.addEventListener(
      'shopify:block:select',
      (e) => {
        const card = e.target.closest?.(`${CARD}--extra`);
        if (card && !card.classList.contains('av-is-shown')) this.#reveal(Infinity, false);
      },
      opt
    );
    const grid = this.querySelector('[data-anvil-grid]');
    if (grid && this.querySelector('[data-anvil-read]')) {
      this.#ro = new ResizeObserver(() => {
        cancelAnimationFrame(this.#raf);
        this.#raf = requestAnimationFrame(() => this.#measure());
      });
      this.#ro.observe(grid);
    }
    this.#measure();
    // A web font can need one more line without resizing the grid.
    document.fonts?.ready.then(() => this.isConnected && this.#measure());
  }

  disconnectedCallback() {
    this.#ac?.abort();
    this.#ro?.disconnect();
    cancelAnimationFrame(this.#raf);
  }

  // All reads, then only the writes that change something: one layout. A hidden card measures 0 × 0, so its button
  // stays hidden until #reveal measures again.
  #measure() {
    const btns = [...this.querySelectorAll('[data-anvil-grid] [data-anvil-read]')];
    const cut = btns.map((btn) => {
      const text = btn.closest(CARD)?.querySelector('.av-review-wall__text');
      return !!text && text.scrollHeight > text.clientHeight + 1;
    });
    btns.forEach((btn, i) => {
      if (btn.hidden === cut[i]) btn.hidden = !cut[i];
    });
  }

  #onClick = (e) => {
    const read = e.target.closest('[data-anvil-read]');
    if (read && this.contains(read)) {
      this.#open(read);
      return;
    }
    if (e.target.closest('[data-anvil-more]')) this.#reveal(parseInt(this.dataset.anvilStep, 10) || 6, true);
  };

  #open(btn) {
    const host = this.querySelector('anvil-dialog');
    const dialog = host?.querySelector('dialog');
    const body = host?.querySelector('[data-anvil-body]');
    const review = btn.closest(CARD)?.querySelector('figure');
    if (!dialog || !body || !review) return;
    const copy = review.cloneNode(true);
    copy.querySelectorAll('[data-anvil-read]').forEach((n) => n.remove());
    copy.querySelectorAll('img').forEach((img) => {
      img.sizes = '(min-width: 640px) 560px, 100vw';
      img.loading = 'eager';
    });
    body.replaceChildren(copy);
    if (typeof host.open === 'function') return host.open(btn);
    // anvil-core (and its [data-anvil-close] handler) not ready or failed: native modal, wired here.
    if (dialog.open) return;
    dialog.showModal();
    btn.setAttribute('aria-expanded', 'true');
    const ac = new AbortController();
    const opt = { signal: ac.signal };
    host.querySelector('[data-anvil-close]')?.addEventListener('click', () => dialog.close(), opt);
    dialog.addEventListener(
      'close',
      () => {
        ac.abort();
        btn.setAttribute('aria-expanded', 'false');
        btn.focus({ preventScroll: true });
      },
      opt
    );
  }

  #reveal(count, focus) {
    const waiting = [...this.querySelectorAll(`${CARD}--extra:not(.av-is-shown)`)];
    const batch = waiting.slice(0, count);
    for (const card of batch) card.classList.add('av-is-shown');
    if (waiting.length <= count) this.querySelector('[data-anvil-foot]')?.remove();
    this.#measure();
    if (focus) batch[0]?.focus();
  }
}

if (!customElements.get('anvil-review-wall')) customElements.define('anvil-review-wall', ReviewWall);
