/**
 * CommandInterface Component
 * -------------------------------------------
 * Custom Element allowing for the selection and configuraiton of commands
 */
import icons from "./utils/icons.js";
import createIconSVGFromString from "./utils/helpers.js";

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
        justify-content: space-between;
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

    #save {
        margin-left: 2px;
    }

    svg {
        width: 20px;
        height: 20px;
        pointer-events: none;
    }

    #close {
        display: flex;
        cursor: pointer;
    }
</style>
<div class="wrapper">
    <div id="header">
        <select name="commands" id="available-commands">
        </select>

    </div>
    <textarea id="editor" rows="5" cols="33"></textarea>
    <div id="footer">
        <button id="see-it">See It</button>
        <button id="do-it">Do It</button>
        <button id="save-it">Save It</button>
    </div>
</div>
`;

class CommandInterface extends HTMLElement {
    constructor(interpreter, callStack, sources, target) {
        super();
        this.interpreter = interpreter;
        this.callStack = callStack;
        this.sources = sources;
        this.target = target;

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
        this.onClose = this.onClose.bind(this);
        this.onSeeIt = this.onSeeIt.bind(this);
        this.onDoIt = this.onDoIt.bind(this);
        this.onSaveIt = this.onSaveIt.bind(this);
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
            // add a close button
            const svg = createIconSVGFromString(icons.circleX);
            const button = document.createElement("span");
            button.id = "close";
            button.appendChild(svg);
            button.addEventListener("click", this.onClose);
            header.appendChild(button);
            // add events listeners for the buttons
            const seeit_button = this.shadowRoot.querySelector("button#see-it");
            const doit_button = this.shadowRoot.querySelector("button#do-it");
            const saveit_button = this.shadowRoot.querySelector("button#save-it");
            seeit_button.addEventListener("click", this.onSeeIt);
            doit_button.addEventListener("click", this.onDoIt);
            saveit_button.addEventListener("click", this.onSaveIt);
        }
    }

    disconnectedCallback() {
        const header = this.shadowRoot.querySelector("#header");
        const footer = this.shadowRoot.querySelector("#footer");
        const selection = header.querySelector("#available-commands");
        header.removeEventListener("mousedown", this.onMouseDownInHeaderFooter);
        footer.removeEventListener("mousedown", this.onMouseDownInHeaderFooter);
        selection.removeEventListener("change", this.onComamndSelection);
        const seeit_button = this.shadowRoot.querySelector("button#see-it");
        seeit_button.removeEventListener("click", this.onSeeIt);
        const doit_button = this.shadowRoot.querySelector("button#do-it");
        doit_button.removeEventListener("click", this.onDoIt);
        const saveit_button = this.shadowRoot.querySelector("button#save-it");
        saveit_button.removeEventListener("click", this.onSaveIt);
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

    onClose(){
        this.remove();
    }

    /* onSeeIt() and onSave are set by elements which utilise CommandInterface */

    onSeeIt(event){
        alert("SeeIt has not been set");
    }

    onSaveIt(event){
        const command = this.shadowRoot.querySelector("select#available-commands").value;
        const args = this.shadowRoot.querySelector("textarea#editor").value;
        this.callStack.append([this.sources, this.target, command, args]);
        console.log(this.callStack);
    }

    onDoIt(event){
        alert("DoIt has not been set");
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
