/**
 * anvil-cart-drawer.js — <anvil-cart-drawer>: the cart drawer around a native modal <dialog>
 * (sections/anvil-cart-drawer.liquid, loaded with <script type="module"> from that section).
 *
 * open(opener) → showModal + scroll lock, aria-expanded on the opener; close() → dialog.close(); focus returns to the
 * opener. Closes with Esc (native), the close button ([data-anvil-close], handled by anvil-core.js) and a click on
 * the backdrop. Opens after an add-to-cart (anvil:cart:updated with source "add") when
 * window.Anvil.settings.openCartOnAdd is true; it listens on `document` for that event, so it works whatever order
 * the scripts ran in. Re-renders swap only the children of the inner [data-anvil-section="anvil-cart-drawer"]
 * element, so the dialog stays open. If the element is removed while open (editor reload), the scroll lock it took
 * is released. data-anvil-preview-open (editor only) opens it on connect.
 */
const api = () => window.Anvil || {};

class CartDrawer extends HTMLElement {
  #opener = null;
  #locked = false;

  get dialog() {
    return this.querySelector('dialog');
  }

  get isOpen() {
    return Boolean(this.dialog?.open);
  }

  connectedCallback() {
    const dialog = this.dialog;
    if (!dialog) return;
    dialog.addEventListener('close', this.#onClose);
    dialog.addEventListener('click', this.#onBackdrop);
    document.addEventListener('anvil:cart:updated', this.#onCart);
    if (this.hasAttribute('data-anvil-preview-open')) this.open();
  }

  disconnectedCallback() {
    this.dialog?.removeEventListener('close', this.#onClose);
    this.dialog?.removeEventListener('click', this.#onBackdrop);
    document.removeEventListener('anvil:cart:updated', this.#onCart);
    this.#unlock();
  }

  #lock() {
    if (this.#locked) return;
    this.#locked = true;
    api().dom?.lockScroll?.();
  }

  #unlock() {
    if (!this.#locked) return;
    this.#locked = false;
    api().dom?.unlockScroll?.();
  }

  open(opener) {
    const dialog = this.dialog;
    if (!dialog || dialog.open) return;
    this.#opener = opener instanceof Element ? opener : document.activeElement;
    dialog.showModal();
    this.#lock();
    this.#opener?.setAttribute?.('aria-expanded', 'true');
  }

  close() {
    if (this.dialog?.open) this.dialog.close();
  }

  toggle(opener) {
    this.isOpen ? this.close() : this.open(opener);
  }

  #onCart = (e) => {
    const detail = e.detail || {};
    if (detail.source === 'add' && api().settings?.openCartOnAdd) this.open();
  };

  #onBackdrop = (e) => {
    const dialog = this.dialog;
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) this.close();
  };

  #onClose = () => {
    this.#unlock();
    const opener = this.#opener;
    this.#opener = null;
    opener?.setAttribute?.('aria-expanded', 'false');
    if (opener?.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
  };
}

customElements.get('anvil-cart-drawer') || customElements.define('anvil-cart-drawer', CartDrawer);
