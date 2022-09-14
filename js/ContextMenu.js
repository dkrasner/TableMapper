export const CONTEXT_MENU_EL_NAME = "context-menu";
const CONTEXT_ITEM_EL_NAME = "context-menu-item";

const templateString = `
<style>
    :host {
        display: flex;
        flex-direction: column;
        position: absolute;
        z-index: 10000;
        padding-bottom: 8px;
        min-width: 200px;
    }

    :host-context(li) {
        display: none;
        position: absolute;
        left: 100%;
        top: 0px;
    }

    :host-context(li):hover {
        display: flex;
    }

    header {
        position: relative;
        display: flex;
        border-bottom: 1px solid rgba(150, 150, 150, 0.5);
        padding-right: 16px;
        padding-left: 16px;
        padding-top: 8px;
        padding-bottom: 8px;
    }

    header > h4 {
        padding: 0;
        margin:0;
    }

    ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }

</style>
<ul id="list-items">
<slot></slot>
</ul>
`;

class ContextMenu extends HTMLElement {
    constructor() {
        super();

        // Setup template and shadow root
        const template = document.createElement("template");
        template.innerHTML = templateString;
        this._shadowRoot = this.attachShadow({ mode: "open" });
        this._shadowRoot.appendChild(template.content.cloneNode(true));

        // Bound component methods
        this.addListItem = this.addListItem.bind(this);
        this.addSpacer = this.addSpacer.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleEscapeKey = this.handleEscapeKey.bind(this);
    }

    connectedCallback() {
        if (this.isConnected) {
            // Add event listeners
            document.addEventListener("click", this.handleOutsideClick);
            document.addEventListener("contextmenu", this.handleOutsideClick);
            document.addEventListener("keydown", this.handleEscapeKey);
        }

        // Remove any existing context menus in the document
        Array.from(document.querySelectorAll(CONTEXT_MENU_EL_NAME))
            .filter((element) => {
                return element !== this;
            })
            .forEach((element) => element.remove());
    }

    disconnectedCallback() {
        // Remove event listeners
        document.removeEventListener("click", this.handleOutsideClick);
        document.removeEventListener("contextmenu", this.handleOutsideClick);
        document.removeEventListener("keydown", this.handleEscapeKey);
    }

    addListItem(label, callback, submenu = null) {
        const itemEl = document.createElement(CONTEXT_ITEM_EL_NAME);
        itemEl.textContent = label;
        itemEl.addEventListener("click", callback);
        itemEl.addEventListener("click", this.handleOutsideClick);
        if (submenu) {
            submenu.classList.add("context-submenu", "submenu-hidden");
            submenu.setAttribute("slot", "submenu");
            itemEl.append(submenu);
            itemEl.showCaret();
        }
        this.append(itemEl);
        return this;
    }

    addListItemWithSubmenu(label, callback, submenuCallback) {
        const submenu = document.createElement(CONTEXT_MENU_EL_NAME);
        submenuCallback(submenu);
        return this.addListItem(label, callback, submenu);
    }

    addSpacer() {
        const item = document.createElement("hr");
        item.classList.add("context-menu-spacer");
        this.append(item);
        return this;
    }

    handleOutsideClick() {
        this.remove();
    }

    handleEscapeKey(event) {
        if (event.key == "Escape") {
            this.remove();
        }
    }

    openAtMouseEvent(event) {
        this.style.top = `${event.pageY}px`;
        this.style.left = `${event.pageX}px`;
        document.body.append(this);
    }
}

const itemTemplateString = `
<style>
    :host {
        display: flex;
        position: relative;
    }
    .submenu-area {
        display: none;
        position: absolute;
        left: 100%;
        top: 0px;
    }

    :host(:hover) .submenu-area {
        display: flex;
    }

    .label-area {
        display: flex;
        align-items: center;
        width: 100%;
    }

    .caret.hidden {
        display: none;
    }
    .caret {
        display: block;
        margin-left: auto;
    }
</style>
<div class="label-area">
    <span class="label"><slot></slot></span>
    <div class="caret hidden">→</div>
</div>
<div class="submenu-area">
    <slot name="submenu"></slot>
</div>
`;

class ContextMenuItem extends HTMLElement {
    constructor() {
        super();

        // Setup shadow dom and template
        this.template = document.createElement("template");
        this.template.innerHTML = itemTemplateString;
        this._shadowRoot = this.attachShadow({ mode: "open" });
        this._shadowRoot.append(this.template.content.cloneNode(true));

        // Bound methods
        this.showCaret = this.showCaret.bind(this);
    }

    showCaret() {
        const caretEl = this.shadowRoot.querySelector(".caret");
        caretEl.classList.remove("hidden");
    }
}

window.customElements.define(CONTEXT_MENU_EL_NAME, ContextMenu);
window.customElements.define(CONTEXT_ITEM_EL_NAME, ContextMenuItem);

export {
    ContextMenu as default,
    ContextMenu,
    ContextMenuItem,
    CONTEXT_ITEM_EL_NAME,
};
