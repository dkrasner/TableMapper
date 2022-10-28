/**
 * PlotInterface Component
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
        <span> Select the type of chart </span>
    </div>
    <div id="plots"></div>
    <div id="footer">
        <button id="do-it">Plot it</button>
        <button id="save-it">Save It</button>
    </div>
</div>
`;

class PlotInterface extends HTMLElement {
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
        this.addChartButton = this.addChartButton.bind(this);
        this.onMouseDownInHeaderFooter = this.onMouseDownInHeaderFooter.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUpAfterDrag = this.onMouseUpAfterDrag.bind(this);
        this.onClose = this.onClose.bind(this);
    }

    connectedCallback() {
        if (this.isConnected) {
            const header = this.shadowRoot.querySelector("#header");
            const footer = this.shadowRoot.querySelector("#footer");
            // event listeners
            header.addEventListener("mousedown", this.onMouseDownInHeaderFooter);
            footer.addEventListener("mousedown", this.onMouseDownInHeaderFooter);
            // add a close button
            const svg = createIconSVGFromString(icons.circleX);
            const button = document.createElement("span");
            button.id = "close";
            button.appendChild(svg);
            button.addEventListener("click", this.onClose);
            header.appendChild(button);
            // add the charts
            const plots = this.shadowRoot.querySelector("#plots");
            ["line", "bar", "pie"].forEach((name) => {
                plots.append(this.addChartButton(name));
            })
        }
    }

    disconnectedCallback() {
        const header = this.shadowRoot.querySelector("#header");
        const footer = this.shadowRoot.querySelector("#footer");
        header.removeEventListener("mousedown", this.onMouseDownInHeaderFooter);
        footer.removeEventListener("mousedown", this.onMouseDownInHeaderFooter);
    }

    addChartButton(name){
        const svg = createIconSVGFromString(icons[`${name}Chart`]);
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.onOpenPlotInterface);
        button.setAttribute("title", "open the reporting interface");
        button.setAttribute("data-clickable", true);
        return button;
    }

    onClose(){
        this.remove();
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

window.customElements.define("plot-interface", PlotInterface);


export { PlotInterface as default };
