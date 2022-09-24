/**
 * WSConnection Component
 * -------------------------------------------
 * Custom Element describing connections between worksheets
 */
import LeaderLine from "leader-line";
import BasicInterpreter from "./interpreters.js";
import CommandInterface from './CommandInterface.js';
import { EndOfStackError, CallStack } from "./callStack.js";
import icons from "./utils/icons.js";

const templateString = `
<style>
:host {
    position: absolute;
    z-index: 1000;
}
</style>
<div>
    ${icons.affiliate}
</div>
`;

class WSConnection extends HTMLElement {
    constructor() {
        super();

        this.template = document.createElement("template");
        this.template.innerHTML = templateString;
        this.attachShadow({ mode: "open", delegatesFocus: true });
        this.shadowRoot.appendChild(this.template.content.cloneNode(true));

        this.id;

        this.interpreter = null;
        this.callStack = null;
        // leaderline are pairs (source-connection, connection-target)
        this.leaderLinePairs = [];

        this.resizeObserver;

        // Bound component methods
        this.updateLeaderLine = this.updateLeaderLine.bind(this);
        this.updateLinkedSheet = this.updateLinkedSheet.bind(this);
        this.setInitialPosition = this.setInitialPosition.bind(this);
        this.removeLines = this.removeLines.bind(this);
        this.renderLines = this.renderLines.bind(this);
        this.onMousedown = this.onMousedown.bind(this);
        this.onMousemove = this.onMousemove.bind(this);
        this.onMouseupAfterDrag = this.onMouseupAfterDrag.bind(this);
        this.onWorksheetMoved = this.onWorksheetMoved.bind(this);
        this.onWorksheetResized = this.onWorksheetResized.bind(this);
        this.openCommandInterface = this.openCommandInterface.bind(this);
        this.step = this.step.bind(this);
        this.run = this.run.bind(this);
        this.inspectCallstack = this.inspectCallstack.bind(this);
    }

    connectedCallback() {
        if (this.isConnected) {
            this.setAttribute("id", window.crypto.randomUUID());
            this.updateLinkedSheet("", this.getAttribute("sources"));
            this.updateLinkedSheet("", this.getAttribute("target"));
            // TODO: maybe this should be passed as a constructor arg
            this.interpreter = new BasicInterpreter();
            this.callStack = new CallStack(this.interpreter);
            this.resizeObserver = new ResizeObserver(this.onWorksheetResized);
            this.addEventListener("mousedown", this.onMousedown);
        }
    }

    disconnectedCallback() {
        this.updateLinkedSheet(this.getAttribute("sources"), "");
        this.updateLinkedSheet(this.getAttribute("target"), "");
        this.removeLines();
        this.removeEventListener("mousedown", this.onMousedown);
    }

    setInitialPosition(){
        // if a target is not present for whatever reason, then just set default position
        // set the initial position to the middle of the target ws - TODO?
        const targetElement = document.getElementById(
            this.getAttribute("target")
        );
        if(targetElement){
            const rect = targetElement.getBoundingClientRect();
            const x = rect.left + rect.width/2 ;
            const y = rect.top + rect.height/2 
            this.style.setProperty("top", `${y}px`);
            this.style.setProperty("left", `${x}px`);
        }
    }

    updateLeaderLine() {
        this.removeLines();
        // update the leader line for each source
        let sources = this.getAttribute("sources");
        if (!sources) {
            return;
        }
        sources = sources.split(",");
        // for now we remove all the lines and put them back as needed
        sources.forEach((id) => {
            const sourceElement = document.getElementById(id);
            const destElement = document.getElementById(
                this.getAttribute("target")
            );
            if (sourceElement && destElement) {
                this.leaderLinePairs.push(
                    [
                        new LeaderLine(sourceElement, this),
                        new LeaderLine(this, destElement)
                    ]
                );
                sourceElement.addTarget(destElement.id, destElement.name);
                destElement.addSource(sourceElement.id, sourceElement.name);
            }
        });
    }

    renderLines() {
        this.leaderLinePairs.forEach((pair) => {
            for(const line of pair){
                line.position().show();
            }
        });
    }

    removeLines(){
        this.leaderLinePairs.forEach((p) => {
            // when we remove the lines tell the corresponding worksheets to
            // remove the link icons
            // source
            p[0].start.removeTarget(p[1].end.id);
            // target
            p[1].end.removeSource(p[0].start.id);
            p[0].remove();
            p[1].remove();
            this.leaderLinePairs = [];
        });
    }

    updateLinkedSheet(oldVal, newVal) {
        if (oldVal) {
            oldVal = oldVal.split(",");
        } else {
            oldVal = [];
        }
        if (newVal) {
            newVal = newVal.split(",");
        } else {
            newVal = [];
        }
        // check if the arrays are equal
        const temp = oldVal.filter((item) => {
            return newVal.indexOf(item) > -1;
        });
        const areEqual =
            temp.length == oldVal.length && temp.length == newVal.length;
        console.log("updating linked sheet", oldVal, newVal);
        if (!areEqual) {
            oldVal.forEach((id) => {
                const oldLinkedEl = document.getElementById(id);
                if (oldLinkedEl) {
                    oldLinkedEl.removeEventListener(
                        "worksheet-moved",
                        this.onWorksheetMoved
                    );
                    this.resizeObserver.unobserve(oldLinkedEl);
                }
            });
            newVal.forEach((id) => {
                const newLinkedEl = document.getElementById(id);
                if (newLinkedEl) {
                    newLinkedEl.addEventListener(
                        "worksheet-moved",
                        this.onWorksheetMoved
                    );
                    this.resizeObserver.observe(newLinkedEl);
                }
            });
        }
    }

    // the callbacks

    onMousedown(event) {
        // only left click for the move here
        if(event.button == 0){
            document.addEventListener("mousemove", this.onMousemove);
            document.addEventListener("mouseup", this.onMouseupAfterDrag);
        }
    }

    onMouseupAfterDrag() {
        document.removeEventListener("mouseup", this.onmouseupAfterDrag);
        document.removeEventListener("mousemove", this.onMousemove);
    }

    onMousemove(event) {
        const currentLeft = this.getBoundingClientRect().left;
        const currentTop = this.getBoundingClientRect().top;
        const newTop = currentTop + event.movementY;
        const newLeft = currentLeft + event.movementX;
        this.style.setProperty("top", newTop + "px");
        this.style.setProperty("left", newLeft + "px");
        this.updateLeaderLine();
    }

    onWorksheetMoved(event) {
        // When the worksheet moves, we need to redraw the leaderLine
        const lines = this.leaderLinePairs.filter((p) => {
            const isSourceLine = p[0].start.id == event.detail.id || p[1].end.id == event.detail.id;
            const isTargetLine = p[1].start.id == event.detail.id || p[1].end.id == event.detail.id;
            return isSourceLine || isTargetLine;
        });
        this.updateLinePairs(lines);
    }

    onWorksheetResized(entries) {
        // When worksheets resize, we need to redraw the leaderLines
        const ids = entries.map((e) => {return e.target.id});
        const pairs = this.leaderLinePairs.filter((p) => {
            const isSourceLine = ids.indexOf(p[0].start.id) > -1 || ids.indexOf(p[0].end.id) > -1;
            const isTargetLine = ids.indexOf(p[1].start.id) > -1 || ids.indexOf(p[1].end.id) > -1;
            return isSourceLine || isTargetLine;
        });
        this.updateLinePairs(pairs);
    }

    updateLinePairs(pairs){
        pairs.forEach((p) => {
            p.forEach((l) => {
                l.position().show();
            })
        });
    }

    openCommandInterface(sources, target){
        const ci = new CommandInterface(this.interpreter, this.callStack, sources, target);
        // TODO: deal with proper placement of the interface
        ci.afterSave = () => {
            // reload the callstacl instruction so that they appear in the open
            // inspector
            const inspector = document.querySelector(`work-sheet[ws-connector-id='${this.id}']`);
            if(inspector){
                inspector.sheet.dataFrame.clear();
                inspector.sheet.dataFrame.loadFromArray(this.callStack.stack);
            }
        }
        document.body.append(ci);
    }

    // TODO: callStack interface should probably be moved to commandInterface element
    // only here atm due to the UI step/run icons being on the target worksheet
    step(){
        try {
            this.callStack.step();
            this.callStack.execute();
        } catch (e) {
            if (e instanceof EndOfStackError) {
                console.log(EndOfStackError);
                this.callStack.reset();
            } else throw e;
        }
    }

    run(){
        this.callStack.reset();
        this.callStack.run();
    }

    inspectCallstack(){
        let inspector = document.querySelector(`work-sheet[ws-connector-id='${this.id}']`);
        if(!inspector){
            inspector = document.createElement("work-sheet");
            document.body.append(inspector);
            inspector.updateName("The Commands");
            inspector.setAttribute("ws-connector-id", this.id);
            inspector.sheet.dataFrame.clear();
            if(this.callStack.stack.length > 0){
                inspector.sheet.dataFrame.loadFromArray(this.callStack.stack);
            }
        }
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === "target"){
            // a new target means a new connection, set its position
            this.setInitialPosition();
        }
        if (name === "sources" || name === "target") {
            this.updateLeaderLine();
            this.updateLinkedSheet(oldVal, newVal);
            // if there are no sources nor target then remove the connection
            if(newVal === ""){
                this.remove();
            }
        }
    }

    static get observedAttributes() {
        return ["sources", "target"];
    }
}

window.customElements.define("ws-connection", WSConnection);

export { WSConnection as default };
