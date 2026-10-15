/**
 * anvil-tabs.js — <anvil-tabs hash-sync>: WAI-ARIA tabs with roving focus.
 *
 * Markup: a [role="tablist"] (optionally aria-orientation="vertical") holding [role="tab"][aria-controls="panelId"]
 * buttons, and [role="tabpanel"][id] panels anywhere inside the element. The tab with aria-selected="true" (else the
 * first) starts open; the other panels get `hidden`. Click, Enter and Space select; ArrowLeft/ArrowRight (ArrowUp/
 * ArrowDown when vertical), Home and End move focus and select. With `hash-sync`, a URL hash matching a panel or tab
 * id selects it on load and later selections update the hash with replaceState. shopify:block:select on a tab or
 * panel block selects that tab. Emits anvil:tabs:change {index, tab, panel} (bubbles).
 * Method: select(indexOrTab, { focus = true, silent = false }). Property: index.
 * Without JS every panel stays visible (anvil-tabs.css un-hides panels under html.no-js).
 */
class Tabs extends HTMLElement {
  #list;
  #tabs = [];
  #index = -1;

  get index() {
    return this.#index;
  }

  connectedCallback() {
    this.#list = this.querySelector('[role="tablist"]');
    if (!this.#list) return;
    this.#tabs = [...this.#list.querySelectorAll('[role="tab"]')].filter((tab) => tab.closest('anvil-tabs') === this);
    if (!this.#tabs.length) return;
    let start = this.#tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    if (this.hasAttribute('hash-sync') && location.hash.length > 1) {
      const id = decodeURIComponent(location.hash.slice(1));
      const i = this.#tabs.findIndex((tab) => tab.id === id || tab.getAttribute('aria-controls') === id);
      if (i > -1) start = i;
    }
    this.#list.addEventListener('click', this.#onClick);
    this.#list.addEventListener('keydown', this.#onKey);
    this.addEventListener('shopify:block:select', this.#onBlock);
    this.select(Math.max(0, start), { focus: false, silent: true });
  }

  disconnectedCallback() {
    this.#list?.removeEventListener('click', this.#onClick);
    this.#list?.removeEventListener('keydown', this.#onKey);
    this.removeEventListener('shopify:block:select', this.#onBlock);
  }

  panelFor(tab) {
    const id = tab?.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  }

  select(target, { focus = true, silent = false } = {}) {
    const i = typeof target === 'number' ? target : this.#tabs.indexOf(target);
    const tab = this.#tabs[i];
    if (!tab) return;
    this.#index = i;
    this.#tabs.forEach((el, n) => {
      const on = n === i;
      el.setAttribute('aria-selected', String(on));
      el.tabIndex = on ? 0 : -1;
      const panel = this.panelFor(el);
      if (panel) {
        panel.hidden = !on;
        if (on && !panel.hasAttribute('tabindex')) panel.tabIndex = 0;
      }
    });
    if (focus) tab.focus();
    const panel = this.panelFor(tab);
    if (silent) return;
    if (this.hasAttribute('hash-sync')) {
      const id = panel?.id || tab.id;
      if (id) history.replaceState(null, '', `#${id}`);
    }
    this.dispatchEvent(new CustomEvent('anvil:tabs:change', { bubbles: true, detail: { index: i, tab, panel } }));
  }

  #onClick = (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (!tab || !this.#tabs.includes(tab)) return;
    e.preventDefault();
    this.select(tab);
  };

  #onKey = (e) => {
    const current = this.#tabs.indexOf(e.target.closest('[role="tab"]'));
    if (current < 0) return;
    const vertical = this.#list.getAttribute('aria-orientation') === 'vertical';
    const n = this.#tabs.length;
    let next = -1;
    if (e.key === (vertical ? 'ArrowDown' : 'ArrowRight')) next = (current + 1) % n;
    else if (e.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) next = (current - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    this.select(next);
  };

  #onBlock = (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab && this.#tabs.includes(tab)) return this.select(tab, { focus: false });
    const panel = e.target.closest('[role="tabpanel"]');
    const owner = panel && this.#tabs.find((el) => el.getAttribute('aria-controls') === panel.id);
    if (owner) this.select(owner, { focus: false });
  };
}

customElements.get('anvil-tabs') || customElements.define('anvil-tabs', Tabs);
