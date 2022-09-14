/**
 * Worksheet web component
 * -----------------------
 * The worksheep component is a sort of flexible container
 * which conains a sheet (or potentially something else tbd)
 * has a useable border and displays information about the work
 * being done.
 **/

import { labelIndex } from "./interpreters.js";
import icons from "./utils/icons.js";
import createIconSVGFromString from "./utils/helpers.js";
import BasicInterpreter from "./interpreters.js";
import CSVParser from "papaparse";
import ContextMenuHandler from "./ContextMenuHandler.js";

// Simple grid-based sheet component
const templateString = `
<style>
:host {
    position: absolute;
    padding: 3px;
    display: flex;
    align-items: stretch;
    flex-direction: column;
    border-radius: 5px;
    z-index: 1;
    overflow: hidden; /* to make resize work */
    resize: both;
    --bg-color: var(--palette-lightblue);
    --sheet-bg-color: var(--palette-cyan);
}

#header-bar {
    cursor: grab;
    width: 100%;
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    padding-left: 4px;
    padding-right: 4px;
    padding-top: 2px;
    padding-bottom: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

#header-bar > span {
    display: flex;
}

#header-bar > * > * {
    padding: 3px;
    background-color: transparent;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.hide {
    display: none!important;
}

#header-bar > #title > input {
    display: none;
    border: inherit;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    text-align: inherit;
    background-color: transparent;
    color: inherit;
    padding-top: 3px;
    padding-bottom: 3px;
    padding-right: 5px;
    padding-left: 5px;
    outline: none !important;
}

#header-bar > #title > input.show {
    display: inline-flex;
    align-items: center;
}

#footer-bar {
    cursor: grab;
    width: 100%;
    padding-left: 3px;
    padding-right: 4px;
    padding-top: 5px;
    padding-bottom: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

#footer-bar > span {
    display: flex;
}

#footer-bar > * > * {
    padding: 3px;
    background-color: transparent;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

span[data-clickable="true"]{
    cursor: pointer;
}

svg {
    width: 20px;
    height: 20px;
    pointer-events: none;
}

input[type="file"]{
    display: none
}

my-grid {
    background-color: var(--palette-beige);
    z-index: 3;
    width: max-content; 
}

#sheet-container {
    flex: 1;
    overflow: hidden;
}


.overlay{
    position: absolute;
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-content: center;
    align-items: center;
    flex-direction: column;
    opacity: 1;
    background-color: var(--palette-blue);
    opacity: .3;
}

.overlay > svg{
    width: 20%;
    height: 20%;
    stroke-width: 2;
}
.spreadsheet.editing-cell .view-cell:not(.editing) {
    opacity: 0.2;
    transition: opacity 0.2s linear;
}

.view-cell.editing {
    transform: scale(1.5);
    box-shadow: 0px 0px 5px 10px rgba(200, 200, 200, 0.4);
    transition: transform 0.2s linear; box-shadow 0.2s linear;
}

.in-locked-row {
    background-color: rgba(150, 150, 150, 0.4);
}
.in-locked-column {
    background-color: rgba(150, 150, 150, 0.4);
}
.view-cell {
    background-color: transparent;
    color: var(--palette-black);
    border-right: 2px solid rgba(200, 200, 200, 0.5);
    border-bottom: 2px solid rgba(200, 200, 200, 0.5);
    border-top: 2px solid transparent;
    border-left: 2px solid transparent;
}

.view-cell:last-child {
    border: 2px solid transparent;
}

#button-area {
    margin-top: 30px;
}

.sheet-move-button {
    display: block;
    font-size: 3rem;
}

.selector-cursor {
    border: 2px solid red;
}

.selector-anchor {
    border: 2px solid orange;
}

.in-selection {
    background-color: rgba(255, 50, 50, 0.1);
}
.selection-top-border {
    border-top: 2px solid red;
}
.selection-bottom-border {
    border-bottom: 2px solid red;
}
.selection-left-border {
    border-left: 2px solid red;
}
.selection-right-border {
    border-right: 2px solid red;
}

.dragover {
    border: solid var(--palette-beige);
}
</style>
<div id="header-bar">
    <span id="header-left">
    </span>
    <span data-clickable=true id="title">
        <span>A worksheet</span>
        <input></input>
    </span>
    <span id="header-right">
    </span>
</div>
<div id="sheet-container">
    <my-grid id="ap-sheet" expands="both" columns=5 rows=10></my-grid>
</div>
<div id="footer-bar">
    <span id="footer-left">
    </span>
    <span id="footer-middle">
    </span>
    <span id="footer-right">
    </span>
</div>
<div class="overlay hide">
    ${icons.link}
</div>

`;

class Worksheet extends HTMLElement {
    constructor() {
        super();
        this.template = document.createElement("template");
        this.template.innerHTML = templateString;
        this.attachShadow({ mode: "open", delegatesFocus: true });
        this.shadowRoot.appendChild(this.template.content.cloneNode(true));

        // a randomly generated UUID
        this.id;

        // generate a random palette for the worksheet

        // name for the worksheet. Note: this is the name found in the header area
        // and also in the this.name attribute for querying and listening for changes
        this.name = "";
        this.isEditingName = false;

        // bind methods
        this.addToFooter = this.addToFooter.bind(this);
        this.addToHeader = this.addToHeader.bind(this);
        this.addSource = this.addSource.bind(this);
        this.removeSource = this.removeSource.bind(this);
        this.addTarget = this.addTarget.bind(this);
        this.removeTarget = this.removeTarget.bind(this);
        this.removeLink = this.removeLink.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDownInHeaderFooter =
            this.onMouseDownInHeaderFooter.bind(this);
        this.onMouseUpAfterDrag = this.onMouseUpAfterDrag.bind(this);
        this.onNameDblClick = this.onNameDblClick.bind(this);
        this.onNameKeydown = this.onNameKeydown.bind(this);
        this.updateName = this.updateName.bind(this);
        this.onErase = this.onErase.bind(this);
        this.onUpload = this.onUpload.bind(this);
        this.onDownload = this.onDownload.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onStackInspect = this.onStackInspect.bind(this);
        this.onRun = this.onRun.bind(this);
        this.onStep = this.onStep.bind(this);
        this.onRecordToggle = this.onRecordToggle.bind(this);
        this.onExternalLinkDragStart = this.onExternalLinkDragStart.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this._removeDragDropStyling = this._removeDragDropStyling.bind(this);

        // Bound serialization methods
        this.toCSV = this.toCSV.bind(this);
        this.fromCSV = this.fromCSV.bind(this);
    }

    connectedCallback() {
        // set the id; NOTE: at the moment this is a random UUID
        this.setAttribute("id", window.crypto.randomUUID());

        // Setup a ContextMenu handler for this sheet
        this.contextMenuHandler = new ContextMenuHandler(this);
        this.contextMenuHandler.setupListeners();

        this.addToHeader(this.trashButton(), "left");
        this.addToHeader(this.uploadButton(), "left");
        this.addToHeader(this.downloadButton(), "left");
        this.addToHeader(this.eraseButton(), "right");
        this.addToFooter(this.linkButton(), "right");
        const header = this.shadowRoot.querySelector("#header-bar");
        const footer = this.shadowRoot.querySelector("#footer-bar");
        const name = header.querySelector("#title");

        // set the name to default
        this.updateName("The worksheet");

        // add event listeners
        // using the same callback function for multiple DOM elements can fail to add the listener to
        // all elements!
        header.addEventListener("mousedown", (event) => {
            this.onMouseDownInHeaderFooter(event);
        });
        footer.addEventListener("mousedown", (event) => {
            this.onMouseDownInHeaderFooter(event);
        });
        name.addEventListener("dblclick", this.onNameDblClick);
        this.addEventListener("dragstart", this.onDragStart); 
        this.addEventListener("dragend", this.onDragEnd); 
        this.addEventListener("dragover", this.onDragOver);
        this.addEventListener("dragleave", this.onDragLeave);
        this.addEventListener("drop", this.onDrop);

        // Stash a reference to the underlying ap-sheet
        this.sheet = this.shadowRoot.getElementById("ap-sheet");

        // set the palette
        this.style.backgroundColor = "var(--bg-color)";
        this.sheet.style.backgroundColor = "var(--sheet-bg-color)";
    }

    disconnectedCallback() {
        // remove event listeners
        const header = this.shadowRoot.querySelector("#header-bar");
        const footer = this.shadowRoot.querySelector("#footer-bar");
        const name = header.querySelector("span");
        name.removeEventListener("dblclick", this.onNameDblClick);
        this.removeEventListener("dragstart", this.onDragStart);
        this.removeEventListener("dragend", this.onDragEnd);
        this.removeEventListener("dragover", this.onDragOver);
        this.removeEventListener("dragleave", this.onDragLeave);
        this.removeEventListener("drop", this.onDrop);
        this.contextMenuHandler.removeListeners();
    }

    /* I add an element to the header.
       element: DOM element
       location: str (one of "left", "right")
    */
    addToHeader(element, location, prepend = false) {
        const header = this.shadowRoot.querySelector("#header-bar");
        const parent = header.querySelector(`#header-${location}`);
        if (prepend) {
            parent.prepend(element);
        } else {
            parent.append(element);
        }
    }

    /* I add an element to the footer.
       element: DOM element
       location: str (one of "left", "right", "middle")
       */
    addToFooter(element, location, prepend = false) {
        const footer = this.shadowRoot.querySelector("#footer-bar");
        const parent = footer.querySelector(`#footer-${location}`);
        if (prepend) {
            parent.prepend(element);
        } else {
            parent.append(element);
        }
    }

    /* default header/footer buttons */
    trashButton() {
        const svg = createIconSVGFromString(icons.trash);
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.onDelete);
        button.setAttribute("title", "delete this sheet");
        button.setAttribute("data-clickable", true);
        return button;
    }

    uploadButton() {
        const label = document.createElement("label");
        label.setAttribute("id", "upload");
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", ".csv,.xlsx,.xls");
        input.setAttribute("title", "upload a sheet");
        const svg = createIconSVGFromString(icons.fileUpload);
        label.appendChild(input);
        label.appendChild(svg);
        label.addEventListener("change", this.onUpload);
        return label;
    }

    downloadButton() {
        const svg = createIconSVGFromString(icons.fileDownload);
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.onDownload);
        button.setAttribute("title", "Download locally as CSV");
        button.setAttribute("data-clickable", true);
        return button;
    }

    eraseButton() {
        const svg = createIconSVGFromString(icons.eraser);
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.onErase);
        button.setAttribute("title", "clear values");
        button.setAttribute("data-clickable", true);
        return button;
    }

    runButton() {
        const svg = createIconSVGFromString(icons.run);
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.onRun);
        button.setAttribute("title", "run commands");
        button.setAttribute("data-clickable", true);
        return button;
    }

    stackButton() {
        const svg = createIconSVGFromString(icons.stack);
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.onStackInspect);
        button.setAttribute("title", "inspect the current commands");
        button.setAttribute("data-clickable", true);
        return button;
    }

    stepButton() {
        const svg = createIconSVGFromString(icons.walk);
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.onStep);
        button.setAttribute("title", "step to next command");
        button.setAttribute("data-clickable", true);
        return button;
    }

    recordButton() {
        const svg = createIconSVGFromString(icons.record);
        const button = document.createElement("span");
        svg.style.stroke = "green"; // TODO set to palette color
        button.appendChild(svg);
        button.addEventListener("click", this.onRecordToggle);
        button.setAttribute("title", "start recording");
        button.setAttribute("data-clickable", true);
        button.setAttribute("id", "record");
        return button;
    }

    linkButton() {
        const svg = createIconSVGFromString(icons.link);
        const button = document.createElement("span");
        button.appendChild(svg);
        button.setAttribute("title", "drag and drop onto a sheet to link");
        button.setAttribute("id", "e-link");
        button.setAttribute("data-clickable", true);
        button.setAttribute("draggable", true);
        button.addEventListener("dragstart", this.onExternalLinkDragStart);
        button.addEventListener("dragend", (event) => {
            event.stopPropagation();
        });
        return button;
    }

    onMouseDownInHeaderFooter(event) {
        // drag event propagation can be touchy so make sure we are not clicking or dragging
        // any children of header/footer
        if (
            event.target.id == "footer-bar" ||
            event.target.id == "header-bar"
        ) {
            // dispatch an event to put the sheet in focus
            const focusEvent = new CustomEvent("newSheetFocus", {
                bubbles: true,
                detail: { target: this },
            });
            this.dispatchEvent(focusEvent);
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

        // Trigger a custom move event so that
        // implementors of the Worksheet can react
        let moveEvent = new CustomEvent("worksheet-moved", {
            bubbles: true,
            detail: {
                id: this.id,
                movementX: event.movementX,
                movementY: event.movementY,
            },
        });
        this.dispatchEvent(moveEvent);
    }

    onNameDblClick() {
        if (!this.isEditingName) {
            this.startEditingName();
        }
    }

    onNameKeydown(event) {
        if (event.key == "Enter") {
            event.preventDefault();
            event.stopPropagation();
            this.stopEditingName();
        }
    }

    updateName(name) {
        const header = this.shadowRoot.querySelector("#header-bar");
        const nameSpan = header.querySelector("#title > span");

        this.name = name;
        this.setAttribute("name", name);
        nameSpan.textContent = this.name;
    }

    startEditingName() {
        this.isEditingName = true;
        const header = this.shadowRoot.querySelector("#header-bar");
        const nameSpan = header.querySelector("#title > span");
        nameSpan.classList.add("hide");
        const input = header.querySelector("#title > input");
        input.classList.add("show");
        input.value = this.name;
        input.addEventListener("keydown", this.onNameKeydown);
        // input.addEventListener('blur', this.handleInputBlur);
        input.focus();
    }

    stopEditingName() {
        this.isEditingName = false;
        const header = this.shadowRoot.querySelector("#header-bar");
        const input = header.querySelector("#title > input");
        const nameSpan = header.querySelector("#title > span");
        nameSpan.classList.remove("hide");
        input.removeEventListener("keydown", this.onNameKeydown);
        input.classList.remove("show");
        let newName = input.value;
        if (!newName) {
            newName = "A worksheet";
        }
        this.updateName(newName);
        //input.removeEventListener('blur', this.handleInputBlur);
        // input.blur();
    }

    onDelete() {
        const msg = `Are you sure you want to delete ${this.name}?`;
        if (window.confirm(msg)) {
            this.remove();
        }
    }

    onErase() {
        this.sheet.dataFrame.clear();
    }

    onRecordToggle(){
        this.toggleAttribute("recording");
        const record_button = this.shadowRoot.querySelector("#record");
        const record_icon = this.shadowRoot.querySelector("#record > svg");
        if(this.hasAttribute("recording")){
            record_icon.style.stroke = "red"; // TODO set to palette color
            record_button.setAttribute("title", "stop recording");
        } else {
            record_icon.style.stroke = "green"; // TODO set to palette color
            record_button.setAttribute("title", "start recording");
        }
    }

    onUpload(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.addEventListener("load", (loadEv) => {
            this.fromCSV(loadEv.target.result);
        });
        reader.addEventListener("error", (e) => {
            console.error(e);
            alert("An error occurred reading this file");
            return;
        });

        // Will trigger the reader.load event
        reader.readAsText(file);
        // set the name of the sheet to the file name; TODO: do we want this?
        this.updateName(file.name);
    }

    onDownload() {
        const csv = this.toCSV();
        const anchor = document.createElement("a");
        anchor.style.display = "none";
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        anchor.href = url;
        anchor.download = `${this.name}.csv`;
        document.body.append(anchor);
        anchor.click();
        window.URL.revokeObjectURL(url);
    }

    // TODO: these callstack calls, and corresponding button icons, should be
    // removed and eventually live in a connection or commandInterface element UI
    onRun() {
        const ws = this._getConnection(this.id);
        ws.run();
    }

    onStep() {
        const ws = this._getConnection(this.id);
        ws.step();
    }

    onStackInspect(){
        const ws = this._getConnection(this.id);
        ws.inspectCallstack();
    }

    //TODO: sort out what to do with this
    onCallStackStep() {
        if (this.callStack.COUNTER > -1) {
            // hide the current selection since it might interfere with the tab/row highlight
            this.hideSelection();
            // NOTE: this is hard-coded to the 3rd column (x=2) which should change in the future
            const row = [
                [0, this.callStack.COUNTER + 1],
                [2, this.callStack.COUNTER + 1],
            ];
            this.select(null, row);
            // get data on the source and target and show selected frames
            const interpreter = this.callStack.interpreter;
            let [sources, targets, _] =
                this.callStack.stack[this.callStack.COUNTER];
            sources = interpreter.matchAndInterpretReference(sources);
            targets = interpreter.matchAndInterpretReference(targets);
            sources.forEach((entry) => {
                const [__, sourceWSId, sourceWSSelection] = entry;
                this.select(sourceWSId, sourceWSSelection);
            });
            targets.forEach((entry) => {
                const [___, targetWSId, targetWSSelection] = entry;
                this.select(targetWSId, targetWSSelection);
            });
            // if the tab is not found then it is out of the view and we need to shift accordingly
            /* TODO this is a big buggy and not clear we want it
            if(!tab){
                const shift = this.callStack.COUNTER - tabs.length + 1;
                this.sheet.primaryFrame.shiftDownBy(shift);
                tab = this.sheet.shadowRoot.querySelector(`row-tab[data-relative-y='${this.callStack.COUNTER}']`);
            }
            */
        }
    }

    /* I hide the sheet.selection for a worksheet */
    hideSelection(worksheet) {
        if (!worksheet) {
            worksheet = this;
        }
        const sel = worksheet.sheet.shadowRoot.getElementById("main-selection");
        sel.hide();
    }

    /* I set the sheet.selection for a worksheet */
    select(id, coordinates) {
        const [origin, corner] = coordinates;
        let ws;
        if (id) {
            ws = document.getElementById(id);
        } else {
            ws = this;
        }
        // TODO we shouldn't need to deal with labels/names for columns here
        const originX = labelIndex(origin[0]);
        const cornerX = labelIndex(corner[0]);
        const originY = parseInt(origin[1]) - 1;
        const cornerY = parseInt(corner[1]) - 1;
        // hide the current selection to make sure that it doesn't linger for the next step
        this.hideSelection(ws);
        const sel = ws.sheet.shadowRoot.getElementById("main-selection");
        sel.updateFromRelativeCoordinates(
            [originX, originY],
            [cornerX, cornerY]
        );
    }

    onExternalLinkDragStart(event) {
        event.dataTransfer.setData("id", this.id);
        event.dataTransfer.setData("name", this.name);
        event.dataTransfer.setData("worksheet-link", true);
        event.dataTransfer.effectAllowed = "all";
    }

    onDragStart(event){
        // selection drags are handled by ap-sheet but we still need
        // to know which worksheet is the source
        event.dataTransfer.setData("sourceId", this.id);
    }

    onDragEnd(event){
        // TODO: there must be a better way to highlight dragged over cells
        // without having to remove the class from each one
        this.shadowRoot.querySelectorAll("sheet-cell").forEach((cell) => {
            cell.classList.remove("dragover");
        })
    }

    onDragOver(event) {
        event.stopPropagation();
        event.preventDefault();
        // NOTE: dataTransfer payload can disappear in the debugger - fun!
        // Also detecting whether a drop event is file drop is not consistent across browsers
        // and is touchy in general
        if (event.dataTransfer.types.indexOf("Files") != -1) {
            event.dataTransfer.dropEffect = "copy";
            this._overlay(icons.fileUpload);
        } else if(event.dataTransfer.getData("worksheet-link")){
            event.dataTransfer.dropEffect = "link";
            this._overlay(icons.link);
        } else if(event.dataTransfer.getData("selection-drag")){
            // we need to make sure that three conditions hold for a valid
            // selection drag
            // 1. the sheets are linked, ie a ws-connection element exists
            //    with corresponding source and target
            // 2. the target sheet is in record mode
            // 3. the target element of the dragover is a sheet-cell element
            const target = event.originalTarget;
            const connection = this._getConnection(
                event.target.id,
                event.dataTransfer.getData("sourceId")
            );
            // we need to define the recording bool here otherwise event can
            // loose reference to target inside a condition - wtf?!
            const recording = event.target.hasAttribute("recording");
            if(connection && recording){
                if(target.nodeName == "SHEET-CELL"){
                    target.classList.add("dragover");
                    target.addEventListener("dragleave", this._removeDragDropStyling);
                    target.addEventListener("drop", this._removeDragDropStyling);
                }
            } else {
                this._overlay(icons.ban);
            }
        }
    }

    onDragLeave(event) {
        event.stopPropagation();
        event.preventDefault();
        const overlay = this.shadowRoot.querySelector(".overlay");
        overlay.classList.add("hide");
    }

    onDrop(event) {
        event.stopPropagation();
        event.preventDefault();
        const overlay = this.shadowRoot.querySelector(".overlay");
        overlay.classList.add("hide");
        if (event.dataTransfer.getData("worksheet-link")) {
            // add the source
            const sourceId = event.dataTransfer.getData("id");
            // now create a new WSConnection element if it doesn't exist
            // if it does exist for this target then add the source to it
            let connection = this._getConnection(this.id); 
            if(connection){
                const sources = connection.getAttribute("sources").split(",");
                if(sources.indexOf(sourceId) == -1){
                    sources.push(sourceId);
                    connection.setAttribute("sources", sources);
                }
            } else {
                connection = document.createElement("ws-connection");
                document.body.append(connection);
                connection.setAttribute("target", this.id);
                connection.setAttribute("sources", [sourceId]);
                // add callstack and command related buttons
                this.addToHeader(this.stackButton(), "right");
                this.addToHeader(this.stepButton(), "right");
                this.addToHeader(this.runButton(), "right");
                this.addToHeader(this.recordButton(), "right");
            }

        } else if(event.dataTransfer.getData("selection-drag")){
            // we need to make sure that three conditions hold for a valid
            // selection drag
            // 1. the sheets are linked, ie a ws-connection element exists
            //    with corresponding source and target
            // 2. the target sheet is in record mode
            // 3. the target element of the drop is a sheet-cell element
            const cell_target = event.originalTarget;
            const source_id = event.dataTransfer.getData("sourceId")
            const target_id= event.target.id
            const connection = this._getConnection(
                target_id,
                source_id
            );
            // we need to define the recording bool here otherwise event can
            // loose reference to target inside a condition - wtf?!
            const recording = event.target.hasAttribute("recording");
            if(connection && recording){
                if(cell_target.nodeName == "SHEET-CELL"){
                    const drop_data = JSON.parse(event.dataTransfer.getData("text/json"));
                    const source_origin = [
                        drop_data.relativeFrameOrigin.x,
                        drop_data.relativeFrameOrigin.y
                    ]
                    const source_corner = [
                        drop_data.relativeFrameCorner.x,
                        drop_data.relativeFrameCorner.y,
                    ]
                    const target_origin = [
                        parseInt(cell_target.getAttribute("data-relative-x")),
                        parseInt(cell_target.getAttribute("data-relative-y"))
                    ]
                    // TODO: note we handling only one source at a time here
                    // but note source_info is an array so can be multuple sources in the future
                    const source_info = [
                        {id: source_id, origin: source_origin, corner: source_corner}
                    ];
                    // NOTE: for target origin and corner are the same, ie a 1x1 frame, for the moment
                    const target_info = {id: target_id, origin: target_origin, corner: target_origin};
                    connection.openCommandInterface(source_info, target_info);
                }
            }
        } else if(event.dataTransfer.files) {
            // set the event.target.files to the dataTransfer.files
            // since that is what this.onUpload() expects
            event.target.files = event.dataTransfer.files;
            this.onUpload(event);
        }
    }

    /**
     * I handle adding and removing drag&drop styling for `sheet-cell` elements
     * makign sure to remove the "dragover" css class and event handlers.
     */
    _removeDragDropStyling(event){
        event.target.classList.remove("dragover");
        event.target.removeEventListener("dragleave", this._removeDragDropStyling);
        event.target.removeEventListener("drop", this._removeDragDropStyling);
    }

    /**
      * I unhide the worksheet overlay to display provided svg icon string.
      */
    _overlay(iconString){
        const overlay = this.shadowRoot.querySelector(".overlay");
        overlay.classList.remove("hide");
        const template = document.createElement("template");
        template.innerHTML = iconString.trim();
        const iconSVG = template.content.childNodes[0];
        overlay.replaceChildren(iconSVG);
    }

    /** Handling source and target related icons **/

    addSource(id) {
        if(!this.shadowRoot.querySelector(`#footer-left > [data-source-id='${id}']`)){
            // add an icon with data about the source to the footer
            const sourceSpan = this._createSourceTargetIconSpan("source", id, this.id);
            this.addToFooter(sourceSpan, "left");
            return id;
        }
    }

    removeSource(id) {
        // remove the source link
        this.shadowRoot.querySelectorAll(`#footer-left > [data-source-id='${id}']`).forEach((item) => {
            item.remove();
        });
        // make sure no outline styles linger
        this.style.outline = "initial";
    }

    addTarget(id) {
        if(!this.shadowRoot.querySelector(`#footer-right > [data-target-id='${id}']`)){
            // add an icon with data about the target to the footer
            const targetSpan = this._createSourceTargetIconSpan("target", this.id, id);
            this.addToFooter(targetSpan, "right", true);
            return id;
        }
    }

    removeTarget(id) {
        // remove the target link
        this.shadowRoot.querySelectorAll(`#footer-right > [data-target-id='${id}']`).forEach((item) => {
            item.remove();
        });
        // make sure no outline styles linger
        this.style.outline = "initial";
    }

    removeLink(event) {
        event.stopPropagation();
        event.preventDefault();
        const sourceId = event.target.getAttribute("data-source-id");
        const targetId = event.target.getAttribute("data-target-id");
        const connection = this._getConnection(targetId, sourceId);
        const sources = connection.getAttribute("sources").split(",");
        if(sources.indexOf(sourceId) > -1){
            sources.splice(sources.indexOf(sourceId), 1);
            connection.setAttribute("sources", sources);
        }
        if (event.target.getAttribute("data-type") == "source") {
            this.removeSource(sourceId);
        } else {
            this.removeTarget(targetId);
        }
    }

    /**
      * I find the connection which corresponds to the target and source (if provided).
      * The assumption is that each sheet can be the source of multiple sheets.
      * However, there can be **only one** connection between two sheets and each sheet
      * can be the target of **only one** connection.
      **/
    _getConnection(targetId, sourceId){
        const connections = document.querySelectorAll(`ws-connection[target="${targetId}"]`);
        if(connections.length == 0){
            return;
        }
        if(connections.length > 1){
            throw `Multiple connections found for the target ${targetId}`;
        }
        const wc = connections[0];
        if(sourceId){
            if(wc.getAttribute("sources").split(",").indexOf(sourceId) > -1){
                return wc;
            }
        } else {
            return wc;
        }
    }

    /**
     * Create a DOM element from an SVG string
     * for both the source/target icon as well as the
     * unlink icon. Adds event listeners for mousenter and
     * mouseleave.
     */
    _createSourceTargetIconSpan(type, sourceId, targetId) {
        // make a reference to the source/target sheet
        // to update css on hover
        let iconString;
        let sheet;
        if (type == "source") {
            iconString = icons.sheetImport;
            sheet = document.getElementById(sourceId);
        } else {
            iconString = icons.sheetExport;
            sheet = document.getElementById(targetId);
        }
        const icon = createIconSVGFromString(iconString);
        const iconSpan = document.createElement("span");
        iconSpan.appendChild(icon);
        iconSpan.setAttribute("data-type", type);
        iconSpan.setAttribute("data-source-id", sourceId);
        iconSpan.setAttribute("data-target-id", targetId);
        // overlay the unlink icon
        const unlinkIcon = createIconSVGFromString(icons.unlink);
        unlinkIcon.setAttribute("data-type", type);
        unlinkIcon.setAttribute("data-source-id", sourceId);
        unlinkIcon.setAttribute("data-target-id", targetId);
        unlinkIcon.style.display = "none";
        iconSpan.addEventListener("click", this.removeLink);
        iconSpan.appendChild(unlinkIcon);
        iconSpan.addEventListener("mouseover", () => {
            unlinkIcon.style.display = "inherit";
            icon.style.display = "none";
            sheet.style.outline = "solid var(--palette-blue)";
            iconSpan.setAttribute("title", `${type}: ${sheet.name} (${sheet.id})`);
        });
        iconSpan.addEventListener("mouseleave", () => {
            unlinkIcon.style.display = "none";
            icon.style.display = "inherit";
            sheet.style.outline = "initial";
        });
        return iconSpan;
    }

    fromCSV(aString) {
        const data = CSVParser.parse(aString).data;
        if (data) {
            this.sheet.dataFrame.clear();
            this.sheet.dataFrame.corner.x = data[0].length - 1;
            this.sheet.dataFrame.corner.y = data.length - 1;
            this.sheet.dataFrame.loadFromArray(data);
            this.sheet.render();
        }
    }

    toCSV() {
        const data = this.sheet.dataFrame.getDataArrayForFrame(
            this.sheet.dataFrame
        );
        return CSVParser.unparse(data);
    }
}

window.customElements.define("work-sheet", Worksheet);

export { Worksheet, Worksheet as default };
