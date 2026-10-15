/**
 * anvil-related-products.js — <anvil-related-products data-anvil-urls="url [fallback]">: near the viewport, fetches
 * each recommendations URL in turn, moves the first response's cards (one with a product link) into itself and
 * un-hides the section root. A phones-only or desktop-only section waits for its side of 750 px.
 */
customElements.get('anvil-related-products') ||
  customElements.define(
    'anvil-related-products',
    class extends HTMLElement {
      connectedCallback() {
        const urls = (this.dataset.anvilUrls || '').split(' ').filter(Boolean);
        const root = (this.root = this.closest('[data-anvil-section]') || this);
        if (!urls.length) return;
        const c = root.classList;
        const mq = matchMedia(c.contains('av-show--mobile') ? '(max-width:749px)' : c.contains('av-show--desktop') ? '(min-width:750px)' : 'all');
        this.ctrl = new AbortController();
        this.io = new IntersectionObserver(
          (entries) => {
            if (!entries.some((e) => e.isIntersecting)) return;
            this.io.disconnect();
            this.load(urls);
          },
          { rootMargin: '600px 0px' }
        );
        const watch = () => this.io.observe(root.hidden ? root.parentElement || root : root);
        if (mq.matches) watch();
        else mq.addEventListener('change', watch, { once: true, signal: this.ctrl.signal });
      }

      disconnectedCallback() {
        this.io?.disconnect();
        this.ctrl?.abort();
      }

      async load(urls) {
        try {
          for (const url of urls) {
            const res = await fetch(url, { signal: this.ctrl.signal });
            if (!res.ok) continue;
            const next = new DOMParser().parseFromString(await res.text(), 'text/html').querySelector(this.localName);
            if (!next?.querySelector('a[href]')) continue;
            this.replaceChildren(...next.childNodes);
            this.root.hidden = false;
            return;
          }
        } catch (err) {
          if (err.name !== 'AbortError') console.warn('[anvil] related products', err);
        }
      }
    }
  );
