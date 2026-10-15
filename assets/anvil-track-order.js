/**
 * anvil-track-order.js — <anvil-track-order url-template="https://…{number}…" new-tab> (sections/anvil-track-order).
 * On submit it trims the shopper's tracking number, drops inner spaces, puts it URL-encoded in place of every
 * {number} and opens the carrier's page (a new tab with new-tab). Only https addresses are followed. A number of only
 * spaces is cleared and the browser's own "fill out this field" message is shown. A form without an action (path
 * templates) never submits natively, so it cannot reload the store page. It also enables the submit button, which
 * Liquid renders disabled when the template cannot work as a plain GET form. Nothing is fetched: the carrier is
 * contacted only by the shopper's own navigation.
 */
class AnvilTrackOrder extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    if (!this.form) return;
    this.onSubmit = (e) => {
      if (!this.form.hasAttribute('action')) e.preventDefault();
      const input = this.form.querySelector('[data-anvil-track-input]');
      const number = (input?.value || '').replace(/\s+/g, '');
      const tpl = this.getAttribute('url-template') || '';
      if (!number) {
        e.preventDefault();
        if (input) {
          input.value = '';
          input.focus();
          input.reportValidity();
        }
        return;
      }
      let url;
      try {
        url = new URL(tpl.split('{number}').join(encodeURIComponent(number)));
      } catch {
        return;
      }
      if (url.protocol !== 'https:') return;
      e.preventDefault();
      if (this.hasAttribute('new-tab')) window.open(url.href, '_blank', 'noopener');
      else window.location.assign(url.href);
    };
    this.form.addEventListener('submit', this.onSubmit);
    this.form.querySelectorAll('[data-anvil-track-submit]').forEach((btn) => { btn.disabled = false; });
  }

  disconnectedCallback() {
    this.form?.removeEventListener('submit', this.onSubmit);
  }
}

if (!customElements.get('anvil-track-order')) customElements.define('anvil-track-order', AnvilTrackOrder);
