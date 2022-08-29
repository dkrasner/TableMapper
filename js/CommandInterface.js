/**
 * CommandInterface Component
 * -------------------------------------------
 * Custom Element allowing for the selection and configuraiton of commands
 */
import BasicInterpreter from "./interpreters.js";

const templateString = `
<style>
    :host {
        display: flex;
        flex-direction: column;
        position: absolute;
        z-index: 10000;
        background-color: var(--palette-lightblue);
        border: solid var(--palette-orange);
        left: 50%;
        top: 30%;
    }

    #header {
        cursor: grab;
        width: 100%;
        text-align: center;
        font-size: 20px;
        font-weight: bold;
        display: flex;
        justify-content: flex-start;
        align-items: center;
    }

    textarea {
        outline: none;
    }

    textarea:focus {
        outline: solid var(--palette-cyan) 1px;
    }

    #footer {
        cursor: grab;
        width: 100%;
        text-align: center;
        font-size: 20px;
        font-weight: bold;
        display: flex;
        justify-content: flex-end;
        align-items: center;
    }
</style>
<div class="wrapper">
    <div id="header">
        <select name="commands" id="available-commands">
        </select>
    </div>
    <textarea id="editor" rows="5" cols="33"></textarea>
    <div id="footer">
        <button id="preview">Preview</button>
        <button id="save">Save</button>
    </div>
</div>
`;

class CommandInterface extends HTMLElement {
    constructor() {
        super();

        // Setup template and shadow root
        const template = document.createElement("template");
        template.innerHTML = templateString;
        this._shadowRoot = this.attachShadow({ mode: "open" });
        this._shadowRoot.appendChild(template.content.cloneNode(true));

        // Bound component methods
        this.onMouseDownInHeaderFooter = this.onMouseDownInHeaderFooter.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUpAfterDrag = this.onMouseUpAfterDrag.bind(this);
    }

    connectedCallback() {
        if (this.isConnected) {
            const header = this.shadowRoot.querySelector("#header");
            const footer = this.shadowRoot.querySelector("#footer");
            header.addEventListener("mousedown", (event) => {
                this.onMouseDownInHeaderFooter(event);
            });
            footer.addEventListener("mousedown", (event) => {
                this.onMouseDownInHeaderFooter(event);
            });
            // TODO: this might need to be set by WSConnection
            const interpreter = new BasicInterpreter();
            const command_registry = interpreter.command_registry;
            // add the options to the dropdown
            const selection = header.querySelector("#available-commands");
            Object.keys(command_registry).forEach((name) => {
                const option = document.createElement("option");
                option.innerText = name;
                option.setAttribute("value", name);
                if(name == "copy"){
                    option.toggleAttribute("selected");
                }
                selection.appendChild(option);
            });
        }
    }

    disconnectedCallback() {
    }


    onMouseDownInHeaderFooter(event) {
        // drag event propagation can be touchy so make sure we are not clicking or dragging
        // any children of header/footer
        if (
            event.target.id == "footer" ||
                event.target.id == "header"
        ) {
            document.addEventListener("mousemove", this.onMouseMove);
            document.addEventListener("mouseup", this.onMouseUpAfterDrag);
        }
    }

    onMouseUpAfterDrag() {
        document.removeEventListener("mouseup", this.onMouseUpAfterDrag);
        document.removeEventListener("mousemove", this.onMouseMove);
    }

    onMouseMove(event) {
        const currentLeft = this.getBoundingClientRect().left;
        const currentTop = this.getBoundingClientRect().top;
        const newTop = currentTop + event.movementY;
        const newLeft = currentLeft + event.movementX;
        this.style.setProperty("top", newTop + "px");
        this.style.setProperty("left", newLeft + "px");
    }


    attributeChangedCallback(name, oldVal, newVal) {
    }

    static get observedAttributes() {
        return [];
    }
}

window.customElements.define("command-interface", CommandInterface);

export { CommandInterface as default };
