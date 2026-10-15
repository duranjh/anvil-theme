/**
 * anvil-pb-content.js — the three small elements of the content product blocks, loaded with
 * <script type="module" src> by each block that uses one (the URL dedupes, so a page with several blocks runs it
 * once). Each definition is guarded by customElements.get.
 *   <anvil-share data-anvil-url data-anvil-title data-anvil-copied>  (snippets/anvil-pb-share.liquid) the device's
 *     share sheet (navigator.share), else the link copied and confirmed in its [role="status"] region, else the link
 *     itself shown there to copy by hand. The shared link is the product's clean URL plus the selected ?variant=,
 *     never the visitor's ad or tracking parameters.
 *   <anvil-scroll-links>  (snippets/anvil-pb-scroll-buttons.liquid) same-page anchor links scroll below the sticky
 *     header (--av-header-offset), instantly under reduced motion or html[data-animations="off"], and move focus to
 *     the target.
 *   <anvil-complementary data-anvil-url>  (snippets/anvil-pb-complementary.liquid) fetches Shopify's complementary
 *     recommendations (section anvil-upsell-row) once the block comes within 400 px of the viewport and moves the
 *     list into [data-anvil-slot]; a response without a product link counts as empty, and the block stays hidden
 *     when there is nothing to show.
 */
const define = (name, cls) => customElements.get(name) || customElements.define(name, cls);
const plain = (e) => !e.defaultPrevented && !e.button && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

define(
  'anvil-share',
  class extends HTMLElement {
    connectedCallback() {
      this.addEventListener('click', this.onShare);
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.onShare);
      clearTimeout(this.timer);
    }

    onShare = async (e) => {
      if (!e.target.closest('button')) return;
      const url = new URL(this.dataset.anvilUrl, location.href);
      const variant = new URLSearchParams(location.search).get('variant');
      if (variant) url.searchParams.set('variant', variant);
      const data = { title: this.dataset.anvilTitle, url: url.href };
      if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
        try {
          await navigator.share(data);
          return;
        } catch (err) {
          if (err.name === 'AbortError') return;
        }
      }
      let message = url.href;
      try {
        await navigator.clipboard.writeText(url.href);
        message = this.dataset.anvilCopied;
      } catch {
        // clipboard refused: the link itself is shown
      }
      const status = this.querySelector('[role="status"]');
      status.textContent = message;
      clearTimeout(this.timer);
      if (message !== url.href) this.timer = setTimeout(() => (status.textContent = ''), 4000);
    };
  }
);

define(
  'anvil-scroll-links',
  class extends HTMLElement {
    connectedCallback() {
      this.addEventListener('click', this.onJump);
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.onJump);
    }

    onJump = (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link || !plain(e)) return;
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      const root = document.documentElement;
      const still = root.dataset.animations === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;
      const offset = parseFloat(getComputedStyle(root).getPropertyValue('--av-header-offset')) || 0;
      scrollTo({ top: target.getBoundingClientRect().top + scrollY - offset, behavior: still ? 'auto' : 'smooth' });
      if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
  }
);

define(
  'anvil-complementary',
  class extends HTMLElement {
    connectedCallback() {
      this.io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          this.io.disconnect();
          this.load();
        },
        { rootMargin: '400px 0px' }
      );
      this.io.observe(this.hidden ? this.parentElement || this : this);
    }

    disconnectedCallback() {
      this.io?.disconnect();
      this.ctrl?.abort();
    }

    async load() {
      const slot = this.querySelector('[data-anvil-slot]');
      this.ctrl = new AbortController();
      try {
        const res = await fetch(this.dataset.anvilUrl, { signal: this.ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        const list = doc.querySelector('[data-anvil-upsell-row]');
        if (!list?.querySelector('a[href]')) return;
        slot.replaceChildren(list);
        this.hidden = false;
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('[anvil] complementary products', err);
      } finally {
        slot.removeAttribute('aria-busy');
      }
    }
  }
);
