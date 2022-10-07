/**
 * WSConnection Component
 * -------------------------------------------
 * Custom Element describing connections between worksheets
 */
import LeaderLine from "leader-line";
import BasicInterpreter from "./interpreters.js";
import CommandInterface from './CommandInterface.js';
import createIconSVGFromString from "./utils/helpers.js";
import { EndOfStackError, CallStack } from "./callStack.js";
import ContextMenuHandler from "./ContextMenuHandler.js";
import { CONTEXT_MENU_EL_NAME } from "./ContextMenu.js";
import icons from "./utils/icons.js";

const templateString = `
<style>
:host {
    position: absolute;
    z-index: 1000;
    cursor: grab;
}

span[data-clickable="true"]{
    cursor: pointer;
    padding-top: 5px;
    padding-bottom: 5px;
    padding-left: 7px;
    padding-right: 7px;
}

span[data-clickable="true"] svg{
    width: 20px;
    height: 20px;
    pointer-events: none;
}

.row {
    display: flex;
    justify-content: space-between;
}

.middle-row{
    justify-content: center;
}


</style>
<div>
    <div class="row top-row">
    </div>
    <div class="row middle-row">
    </div>
    <div class="row bottom-row">
    </div>

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
        this.leaderLines = [];

        this.resizeObserver;

        // Bound component methods
        this.hide = this.hide.bind(this);
        this.unhide = this.unhide.bind(this);
        this.updateLeaderLine = this.updateLeaderLine.bind(this);
        this.updateLinkedSheet = this.updateLinkedSheet.bind(this);
        this.renderLines = this.renderLines.bind(this);
        // moving and resizing
        this.onMousedown = this.onMousedown.bind(this);
        this.onMousemove = this.onMousemove.bind(this);
        this.onMouseupAfterDrag = this.onMouseupAfterDrag.bind(this);
        this.onWorksheetMoved = this.onWorksheetMoved.bind(this);
        this.onWorksheetResized = this.onWorksheetResized.bind(this);
        // callstack related methods
        this.openCommandInterface = this.openCommandInterface.bind(this);
        this.onStep = this.onStep.bind(this);
        this.onRun = this.onRun.bind(this);
        this.onInspectCallstack = this.onInspectCallstack.bind(this);
        this.onRecordToggle = this.onRecordToggle.bind(this);
        this.onAffiliateMouseover = this.onAffiliateMouseover.bind(this);
        this.onAffiliateMouseleave = this.onAffiliateMouseleave.bind(this);
        this.loadInspector = this.loadInspector.bind(this);
        // icons and buttons
        this.affiliateIcon = this.affiliateIcon.bind(this);
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
            // TODO: maybe this move-events should be only on the affiliate icon
            this.addEventListener("mousedown", this.onMousedown);
            // add the buttons
            const topRow = this.shadowRoot.querySelector("div.top-row");
            const middleRow = this.shadowRoot.querySelector("div.middle-row");
            const bottomRow = this.shadowRoot.querySelector("div.bottom-row");
            topRow.append(this.stackButton());
            topRow.append(this.hideButton());
            middleRow.append(this.affiliateIcon());
            bottomRow.append(this.recordButton());
            bottomRow.append(this.stepButton());
            bottomRow.append(this.runButton());
            this.hide();
        }
    }

    disconnectedCallback() {
        this.updateLinkedSheet(this.getAttribute("sources"), "");
        this.updateLinkedSheet(this.getAttribute("target"), "");
        // remove all the leaderlines
        this.leaderLines.forEach((line) => {
            line.remove();
        });
        this.removeEventListener("mousedown", this.onMousedown);
    }

    hide() {
        this.style.setProperty("display", "none");
    }

    unhide(event) {
        // we use the click event to set the position of
        // of connection but don't move it if it is already
        // visible
        if(this.style.getPropertyValue("display") =="none"){
            const rect = event.target.getBoundingClientRect();
            this.style.setProperty("top", `${rect.y}px`);
            this.style.setProperty("left", `${rect.x}px`);
            this.style.setProperty("display", "initial");
        }
    }

    updateLeaderLine() {
        this.leaderLines.forEach((line, index) => {
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
    }

    onWorksheetMoved(event) {
        // When the worksheet moves, we need to redraw the leaderLine
        const lines = this.leaderLines.filter((l) => {
            return l.start.id == event.detail.id || l.end.id == event.detail.id;
        });
        this.updateLines(lines);
    }

    onWorksheetResized(entries) {
        // When worksheets resize, we need to redraw the leaderLines
        const ids = entries.map((e) => {return e.target.id});
        const lines = this.leaderLines.filter((l) => {
            return ids.indexOf(l.start.id) > -1 || ids.indexOf(l.end.id) > -1;
        });
        this.updateLines(lines);
    }

    updateLines(lines){
        lines.forEach((l) => {
            l.position().show();
        });
    }

    openCommandInterface(sources, target){
        const ci = new CommandInterface(this.interpreter, this.callStack, sources, target);
        // TODO: deal with proper placement of the interface
        ci.afterSave = () => {
            // reload the callstack instruction so that they appear in the open
            // inspector
            const inspector = document.querySelector(`work-sheet[ws-connector-id='${this.id}']`);
            if(inspector){
                this.loadInspector(inspector);
            }
        }
        document.body.append(ci);
    }

    // TODO: callStack interface should probably be moved to commandInterface element
    // only here atm due to the UI step/run icons being on the target worksheet
    onStep(event){
        event.stopPropagation();
        event.preventDefault();
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

    onRun(event){
        event.stopPropagation();
        event.preventDefault();
        this.callStack.reset();
        this.callStack.run();
    }

    onInspectCallstack(event){
        event.stopPropagation();
        event.preventDefault();
        let inspector = document.querySelector(`work-sheet[ws-connector-id='${this.id}']`);
        if(!inspector){
            inspector = document.createElement("work-sheet");
            // add a custom ContextMenuHandler to the viewer
            inspector.setupContextMenu = (event) => {
                this.setupInspectorContextMenu(event, inspector);
            };
            document.body.append(inspector);
            inspector.updateName("The Commands");
            inspector.setAttribute("ws-connector-id", this.id);
            inspector.sheet.dataFrame.clear();
            this.loadInspector(inspector);
        }
    }

    onRecordToggle(event){
        event.stopPropagation();
        event.preventDefault();
        this.toggleAttribute("recording");
        const record_button = this.shadowRoot.querySelector("#record");
        const record_icon = this.shadowRoot.querySelector("#record > svg");
        if(this.hasAttribute("recording")){
            record_icon.style.stroke = "red"; // TODO set to palette color
            record_button.setAttribute("title", "stop");
        } else {
            record_icon.style.stroke = "green"; // TODO set to palette color
            record_button.setAttribute("title", "start adding commands");
        }
    }

    onAffiliateMouseover(event){
        // outline all connected sheets
        let sheetIds = [this.getAttribute("target")];
        const sources = this.getAttribute("sources");
        if(sources){
            sheetIds = sheetIds.concat(sources.split(","));
        }
        sheetIds.forEach((id) => {
            const sheet = document.getElementById(id);
            sheet.style.outline = "solid var(--palette-orange)";
        });
        event.target.addEventListener("mouseleave", this.onAffiliateMouseleave);
    }

    onAffiliateMouseleave(){
        let sheetIds = [this.getAttribute("target")];
        const sources = this.getAttribute("sources");
        if(sources){
            sheetIds = sheetIds.concat(sources.split(","));
        }
        sheetIds.forEach((id) => {
            const sheet = document.getElementById(id);
            sheet.style.outline = "initial";
        });
    }

    // main icon
    affiliateIcon() {
        const svg = createIconSVGFromString(icons.affiliate);
        const icon = document.createElement("span");
        icon.appendChild(svg);
        icon.addEventListener("mouseover", this.onAffiliateMouseover);
        return icon;
    }

    // the buttons
    runButton() {
        const svg = createIconSVGFromString(icons.run);
        svg.style.stroke = "var(--palette-orange)";
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.onRun);
        button.setAttribute("title", "run commands");
        button.setAttribute("data-clickable", true);
        return button;
    }

    stackButton() {
        const svg = createIconSVGFromString(icons.stack);
        svg.style.stroke = "var(--palette-orange)";
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.onInspectCallstack);
        button.setAttribute("title", "inspect the current commands");
        button.setAttribute("data-clickable", true);
        return button;
    }

    stepButton() {
        const svg = createIconSVGFromString(icons.walk);
        svg.style.stroke = "var(--palette-orange)";
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.onStep);
        button.setAttribute("title", "step to next command");
        button.setAttribute("data-clickable", true);
        return button;
    }

    recordButton() {
        const svg = createIconSVGFromString(icons.command);
        const button = document.createElement("span");
        svg.style.stroke = "green"; // TODO set to palette color
        button.appendChild(svg);
        button.addEventListener("click", this.onRecordToggle);
        button.setAttribute("title", "start adding commands");
        button.setAttribute("data-clickable", true);
        button.setAttribute("id", "record");
        return button;
    }

    hideButton() {
        const svg = createIconSVGFromString(icons.circleX);
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.hide);
        button.setAttribute("title", "hide the connection");
        button.setAttribute("data-clickable", true);
        return button;
    }

    loadInspector(inspector){
        inspector.sheet.dataFrame.clear();
        // add columns names and lock the name row
        let data = [
            ["Sources", "Target", "Command"]
        ];
        inspector.sheet.setAttribute("lockedrows", 1);
        inspector.sheet.setAttribute("read-only-view", "");
        if(this.callStack.stack.length > 0){
            data = data.concat(this.callStack.stack);
        }
        inspector.sheet.dataFrame.loadFromArray(data);
    }

    setupInspectorContextMenu(event, inspector){
        inspector.contextMenuHandler = new ContextMenuHandler(inspector);
        inspector.contextMenuHandler.innerSheetContextMenu = (event) => {
            event.preventDefault();
            switch (event.originalTarget.tagName) {
                case "ROW-TAB":
                this.inspectorContextMenu(event, inspector);
                break;
            }
        }
        inspector.contextMenuHandler.worksheetContextMenu = () => {};
        inspector.contextMenuHandler.setupListeners();
    }

    inspectorContextMenu(event, inspector){
        //NOTE: only row tab context menu for now 
        const tab = event.originalTarget;
        const y = parseInt(tab.dataset.relativeY);
        // make sure there is a command there to do something with
        // and we are not clicking on the name row
        if(y > 0 && inspector.sheet.dataFrame.getAt([0,y])){
            // NOTE: the inspectorhas a fixed column name row, and the callstack
            // commands count from 0, so the corresponding command is tabIndexName - 1
            const commandIndex = y - 1;
            const menuText = `Delete this command`;
            const menu = document.createElement(CONTEXT_MENU_EL_NAME);
            menu.addListItem(menuText, (clickEvent) => {
                console.log(`delete command: ${commandIndex}`);
                this.callStack.remove(commandIndex);
                this.loadInspector(inspector);
            });
            menu.openAtMouseEvent(event);
            event.stopPropagation();
        }
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === "sources" || name === "target") {
            this.updateLeaderLine();
            this.updateLinkedSheet(oldVal, newVal);
            // if there are no sources nor target then remove the connection
            // but first tell the target (if exists) to remove the connection
            // button
            if(newVal === ""){
                if(name === "sources"){
                    // TODO: this could be an event that worksheet listens to
                    const targetElement = document.getElementById(
                        this.getAttribute("target")
                    );
                    targetElement.removeButton("connection-button");
                }
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
