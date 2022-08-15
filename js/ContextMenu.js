const rightCaretIcon = `
<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-caret-right" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <path d="M18 15l-6 -6l-6 6h12" transform="rotate(90 12 12)"></path>
</svg>
`;

class ContextMenu extends HTMLElement {
  constructor() {
    super();

    this.listContainer = document.createElement("ul");
    this.listContainer.classList.add("context-menu-items");

    // Bound component methods
    this.clear = this.clear.bind(this);
    this.close = this.close.bind(this);
    this.addMenuItem = this.addMenuItem.bind(this);
    this.addNestedMenuItem = this.addNestedMenuItem.bind(this);
    this.handleOtherClick = this.handleOtherClick.bind(this);
    this.handleNestedItemMouseEnter =
      this.handleNestedItemMouseEnter.bind(this);
    this.handleNestedItemMouseLeave =
      this.handleNestedItemMouseLeave.bind(this);
  }

  connectedCallback() {
    if (this.isConnected) {
      this.setAttribute("open", false);
      this.append(this.listContainer);

      // Event listeners
      document.addEventListener("click", this.handleOtherClick);
      document.addEventListener("contextmenu", this.handleOtherClick);
    }
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.handleOtherClick);
    document.removeEventListener("contextmenu", this.handleOtherClick);
  }

  clear() {
    this.listContainer.innerHTML = "";
  }

  addMenuItem(labelString, icon, callback) {
    const itemEl = document.createElement("li");
    const itemLabel = document.createElement("span");
    itemEl.classList.add("context-menu-item");
    itemLabel.classList.add("context-menu-item-label");
    itemLabel.textContent = labelString;
    itemEl.append(itemLabel);
    if (icon) {
      const iconEl = document.createElement("div");
      iconEl.classList.add("context-menu-item-icon");
      iconEl.innerHTML = icon;
      itemEl.append(iconEl);
    }
    itemEl.addEventListener("click", callback);
    this.listContainer.append(itemEl);
    return this;
  }

  addNestedMenuItem(labelString, onOpenCallback, builderCallback) {
    const itemEl = this.addMenuItem(
      labelString,
      rightCaretIcon,
      onOpenCallback
    );
    const submenu = document.createElement("context-menu");
    this.append(submenu);
    if (builderCallback) {
      builderCallback(submenu);
    }
    itemEl.addEventListener("mouseenter", this.handleNestedItemMouseEnter);
    itemEl.addEventListener("mouseleave", this.handleNestedItemMouseLeave);
    return this;
  }

  handleOtherClick(event) {
    this.close();
  }

  handleNestedItemMouseEnter(event) {}

  handleNestedItemMouseLeave(event) {}

  close() {
    const parentElement = this.parentElement;
    if (parentElement) {
      this.remove();
    }
  }
}

window.customElements.define("context-menu", ContextMenu);

export { ContextMenu as default, ContextMenu };
