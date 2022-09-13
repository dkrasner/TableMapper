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
        border-radius: 5px;
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

    button {
        margin-right: 1px;
        margin-left: 1px;
    }

    #close {
        display: flex;
        cursor: default;
    }

    #see-it {
        background-color: var(--palette-beige);
    }

    #do-it {
        background-color: var(--palette-orange);
        cursor: not-allowed;
    }

    #save-it {
        background-color: var(--palette-cyan);
    }

    .unlock {
        background-color: var(--palette-beige) !important;
        cursor: default !important;
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
        this.cache = null;

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
        this.onSawIt = this.onSawIt.bind(this);
        this.onDoIt = this.onDoIt.bind(this);
        this.onSaveIt = this.onSaveIt.bind(this);
        this.getInstruction = this.getInstruction.bind(this);
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
            // TODO these should be proper tooltips not titles
            seeit_button.addEventListener("mousedown", this.onSeeIt);
            seeit_button.addEventListener("mouseup", this.onSawIt);
            seeit_button.setAttribute("title", "See what will happen before you commit!");
            doit_button.addEventListener("click", this.onDoIt);
            doit_button.setAttribute("title", "Save it before you do it!");
            saveit_button.addEventListener("click", this.onSaveIt);
            saveit_button.setAttribute("title", "Save it to the program");
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
        seeit_button.removeEventListener("mousedown", this.onSeeIt);
        seeit_button.removeEventListener("mouseup", this.onSawIt);
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

    /**
      * I append the instruction to the call stack and run. But I also cache
      * the original data in the target sub-frame. This cache is then used by
      * onSawIt() to revert the isntruction result.
      */
    onSeeIt(event){
        const instruction = this.getInstruction();

        // TODO!!!
        const targetWS = document.getElementById(this.target.id);
        // the target sub-frame is defined by target corner and the size the source sub-frame
        // even if there are multiple sources, ex a join, all of theym have to have the same size
        // so we can use the first one - TODO: is thia a bad assumption?
        const size = {
            x: parseInt(this.sources[0].corner[0]) - parseInt(this.sources[0].origin[0]),
            y: parseInt(this.sources[0].corner[1]) - parseInt(this.sources[0].origin[1])
        };
        const origin = [
            this.target.origin[0],
            this.target.origin[1]
        ]
        const corner = [
            origin[0] + size.x,
            origin[1] + size.y
        ];
        this.cache = targetWS.sheet.dataFrame.getDataSubFrame(
            this.target.origin, corner
        );
        this.callStack.append(instruction);
        this.callStack.jumpLast();
        this.callStack.run();
    }

    /**
      * I remove the last instruction (NOTE: the assumption is that I follow
      * onSeeit() directly, which might be a bad assumption...). Then I reset
      * the target sub-frame to the cached data.
      **/
    onSawIt(event){
        this.callStack.remove(this.callStack.length - 1);
        const targetWS = document.getElementById(this.target.id);
        const origin = [
            this.target.origin[0],
            this.target.origin[1]
        ]
        targetWS.sheet.dataFrame.copyFrom(this.cache, origin);
    }

    onSaveIt(event){
        // TODO: we don't check the validity of references or commands and allow saving
        // nonsense to the callstack!
        const instruction = this.getInstruction();
        this.callStack.append(instruction);
        // unlock the do-it button since after we save we can do
        const doit_button = this.shadowRoot.querySelector("button#do-it");
        doit_button.classList.add("unlock");
        doit_button.setAttribute("title", "run the command");
        console.log(this.callStack);
    }

    onDoIt(event){
        // jump to the last instruction which is the one that was just saved
        this.callStack.jumpLast();
        this.callStack.run();
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

    /**
      * I handle any pre-processing necessary before the instruction
      * is added to the callstack. Potentiall I should also check its
      * validity: TODO
      */
    getInstruction(){
        let command = this.shadowRoot.querySelector("select#available-commands").value;
        const args = this.shadowRoot.querySelector("textarea#editor").value;
        // TODO: this is a bit absurd! we are joining the source and target data
        // into a string only to parse it all out later. I am leaving this in for now
        // so that our 'view' on the callstack __is__ the callstack
        const sources = this.sources.map((s) => {
            return `${s.id}!(${s.origin[0]},${s.origin[1]}):(${s.corner[0]},${s.corner[1]})`;
        }).join(",");
        const target = `${this.target.id}!(${this.target.origin[0]},${this.target.origin[1]}):(${this.target.corner[0]},${this.target.corner[1]})`;
        // TODO: do we really need command(args) or can we seperate them out command, args for ex 
        command = `${command}(${args})`;
        return [sources, target, command];
    }

    attributeChangedCallback(name, oldVal, newVal) {
    }

    static get observedAttributes() {
        return [];
    }
}

window.customElements.define("command-interface", CommandInterface);

export { CommandInterface as default };
