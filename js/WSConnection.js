/**
 * WSConnection Component
 * -------------------------------------------
 * Custom Element describing connections between worksheets
 */
import LeaderLine from "leader-line";
import BasicInterpreter from "./interpreters.js";
import CommandInterface from './CommandInterface.js';
import { EndOfStackError, CallStack } from "./callStack.js";

class WSConnection extends HTMLElement {
    constructor() {
        super();

        this.id;

        this.interpreter = null;
        this.callStack = null;
        this.leaderLines = [];

        // Bound component methods
        this.updateLeaderLine = this.updateLeaderLine.bind(this);
        this.updateLinkedSheet = this.updateLinkedSheet.bind(this);
        this.renderLines = this.renderLines.bind(this);
        this.onWorksheetMoved = this.onWorksheetMoved.bind(this);
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
        }
    }

    disconnectedCallback() {
        this.updateLinkedSheet(this.getAttribute("sources"), "");
        this.updateLinkedSheet(this.getAttribute("target"), "");
        // remove all the leaderlines
        this.leaderLines.forEach((line) => {
            line.start.removeTarget(line.end.id);
            line.end.removeSource(line.start.id);
            line.remove();
        });
    }

    updateLeaderLine() {
        this.leaderLines.forEach((line, index) => {
            // when we remove the lines tell the corresponding worksheets to
            // remove the link icons
            line.start.removeTarget(line.end.id);
            line.end.removeSource(line.start.id);
            line.remove();
        });
        this.leaderLines = [];
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
                this.leaderLines.push(new LeaderLine(sourceElement, destElement));
                sourceElement.addTarget(destElement.id, destElement.name);
                destElement.addSource(sourceElement.id, sourceElement.name);
            }
        });
    }

    renderLines() {
        this.leaderLines.forEach((line) => {
            line.position().show();
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
                }
            });
            newVal.forEach((id) => {
                const newLinkedEl = document.getElementById(id);
                if (newLinkedEl) {
                    newLinkedEl.addEventListener(
                        "worksheet-moved",
                        this.onWorksheetMoved
                    );
                }
            });
        }
    }

    onWorksheetMoved(event) {
        // When the worksheet moves, we need to redraw the leaderLine
        const lines = this.leaderLines.filter((l) => {
            return l.start.id == event.detail.id || l.end.id == event.detail.id;
        });
        lines.forEach((l) => {
            l.position().show();
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
