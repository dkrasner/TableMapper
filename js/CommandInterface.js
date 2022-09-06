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
        border: solid var(--palette-orange) 1.5px;
        left: 50%;
        top: 30%;
    }

    div.wrapper {
        margin: 8px;
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
        margin-bottom: 4px;
        margin-top: 4px;
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
        this.interpreter = null;

        // Setup template and shadow root
        const template = document.createElement("template");
        template.innerHTML = templateString;
        this._shadowRoot = this.attachShadow({ mode: "open" });
        this._shadowRoot.appendChild(template.content.cloneNode(true));

        // Bound component methods
        this.onMouseDownInHeaderFooter = this.onMouseDownInHeaderFooter.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUpAfterDrag = this.onMouseUpAfterDrag.bind(this);
        this.onComamndSelection = this.onComamndSelection.bind(this);
    }

    connectedCallback() {
        if (this.isConnected) {
            const header = this.shadowRoot.querySelector("#header");
            const footer = this.shadowRoot.querySelector("#footer");
            const editor = this.shadowRoot.querySelector("#editor");
            const selection = header.querySelector("#available-commands");
            // event listeners
            header.addEventListener("mousedown", this.onMouseDownInHeaderFooter);
            footer.addEventListener("mousedown", this.onMouseDownInHeaderFooter);
            selection.addEventListener("change", this.onComamndSelection);
            // TODO: this might need to be set by WSConnection
            this.interpreter = new BasicInterpreter();
            const command_registry = this.interpreter.command_registry;
            // add the options to the dropdown
            Object.keys(command_registry).forEach((name) => {
                const option = document.createElement("option");
                option.innerText = name;
                option.setAttribute("value", name);
                if(name == "copy"){
                    option.toggleAttribute("selected");
                    // copy takes no args
                    editor.toggleAttribute("disabled");
                    editor.setAttribute("Placeholder", command_registry[name].description)
                }
                selection.appendChild(option);
            });
        }
    }

    disconnectedCallback() {
        header.removeEventListener("mousedown", this.onMouseDownInHeaderFooter);
        footer.removeEventListener("mousedown", this.onMouseDownInHeaderFooter);
        selection.removeEventListener("change", this.onComamndSelection);
    }


    onComamndSelection(event){
        const name = event.target.value;
        const editor = this.shadowRoot.querySelector("#editor");
        const command_info = this.interpreter.command_registry[name];
        editor.value = "";
        if(command_info.args){
            editor.removeAttribute("disabled");
        } else {
            editor.setAttribute("disabled", true);
        }
        editor.setAttribute("Placeholder", this.interpreter.command_registry[name].description)
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
