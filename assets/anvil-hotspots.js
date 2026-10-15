/**
 * anvil-hotspots.js — <anvil-hotspots>: numbered spots over an image, each toggling a popover.
 *
 * Markup: for each spot a wrapper .av-hotspots__spot-wrap (style="--av-spot-x: 40%; --av-spot-y: 60%") holding
 * <button data-spot aria-expanded="false" aria-controls="popId"> and <div class="av-hotspots__pop" id="popId" hidden>.
 * The popover may also simply follow the button as its next sibling. Click / Enter / Space toggles; one popover is
 * open at a time; Esc closes and returns focus to the spot; clicking or focusing outside closes. Popovers get
 * .av-is-flip-y / .av-is-left / .av-is-right so they stay inside the element. Emits anvil:hotspot:toggle {spot, open}
 * (bubbles). shopify:block:select on a spot block opens it; deselect closes.
 * Methods: open(spot), close(spot, refocus?), closeAll(except?). Property: spots.
 */
class Hotspots extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKey);
    this.addEventListener('shopify:block:select', this.#onBlock);
    this.addEventListener('shopify:block:deselect', this.#onBlockOff);
    document.addEventListener('pointerdown', this.#onOutside);
    document.addEventListener('focusin', this.#onOutside);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKey);
    this.removeEventListener('shopify:block:select', this.#onBlock);
    this.removeEventListener('shopify:block:deselect', this.#onBlockOff);
    document.removeEventListener('pointerdown', this.#onOutside);
    document.removeEventListener('focusin', this.#onOutside);
  }

  get spots() {
    return [...this.querySelectorAll('[data-spot]')];
  }

  popFor(spot) {
    const id = spot.getAttribute('aria-controls');
    return (id && document.getElementById(id)) || spot.nextElementSibling;
  }

  open(spot) {
    this.closeAll(spot);
    const pop = this.popFor(spot);
    if (!pop || !pop.hidden) return;
    const host = this.getBoundingClientRect();
    const dot = spot.getBoundingClientRect();
    const x = (dot.left + dot.width / 2 - host.left) / (host.width || 1);
    const y = (dot.top + dot.height / 2 - host.top) / (host.height || 1);
    pop.classList.toggle('av-is-flip-y', y > 0.6);
    pop.classList.toggle('av-is-left', x < 0.3);
    pop.classList.toggle('av-is-right', x > 0.7);
    pop.hidden = false;
    spot.setAttribute('aria-expanded', 'true');
    spot.classList.add('av-is-open');
    this.#emit(spot, true);
  }

  close(spot, refocus = false) {
    const pop = this.popFor(spot);
    if (!pop || pop.hidden) return;
    pop.hidden = true;
    spot.setAttribute('aria-expanded', 'false');
    spot.classList.remove('av-is-open');
    if (refocus) spot.focus();
    this.#emit(spot, false);
  }

  closeAll(except) {
    for (const spot of this.spots) if (spot !== except) this.close(spot);
  }

  #emit(spot, open) {
    this.dispatchEvent(new CustomEvent('anvil:hotspot:toggle', { bubbles: true, detail: { spot, open } }));
  }

  #onClick = (e) => {
    const spot = e.target.closest('[data-spot]');
    if (!spot || !this.contains(spot)) return;
    e.preventDefault();
    if (spot.getAttribute('aria-expanded') === 'true') this.close(spot);
    else this.open(spot);
  };

  #onKey = (e) => {
    if (e.key !== 'Escape') return;
    const open = this.spots.find((spot) => spot.getAttribute('aria-expanded') === 'true');
    if (!open) return;
    e.preventDefault();
    e.stopPropagation();
    this.close(open, true);
  };

  #onOutside = (e) => {
    if (!this.contains(e.target)) this.closeAll();
  };

  #onBlock = (e) => {
    const spot = e.target.closest('[data-spot]') || e.target.querySelector?.('[data-spot]');
    if (spot) this.open(spot);
  };

  #onBlockOff = () => this.closeAll();
}

customElements.get('anvil-hotspots') || customElements.define('anvil-hotspots', Hotspots);
