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
import * as XLSX from "xlsx";
import CSVParser from "papaparse";
import Papa from "papaparse";
import ContextMenuHandler from "./ContextMenuHandler.js";
import PlotInterface from "./PlotInterface.js";

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
    --header-bar-display: flex;
    --footer-bar-display: flex;
}

:host([minimized]) > div:not(#header-bar){
    display: none;
}

:host(.hide-header){
  --header-bar-display: none;
}

:host(.hide-footer){
  --footer-bar-display: none;
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
    display: var(--header-bar-display);
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
    display: var(--footer-bar-display);
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
    height: 20px;
}

svg {
    width: 20px;
    height: 20px;
    pointer-events: none;
}

input[type="file"]{
    display: none
}

.selected {
    border: 1px solid var(--palette-orange);
}

ap-sheet {
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
    <ap-sheet id="ap-sheet" expands="both" columns=5 rows=10></ap-sheet>
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
        this.setupContextMenu = this.setupContextMenu.bind(this);
        this.addToFooter = this.addToFooter.bind(this);
        this.addToHeader = this.addToHeader.bind(this);
        this.removeButton = this.removeButton.bind(this);
        this.onOpenPlotInterface = this.onOpenPlotInterface.bind(this);
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
        this.downloadCSV = this.downloadCSV.bind(this);
        this.downloadExcel = this.downloadExcel.bind(this);
        this.openDownloadDialog = this.openDownloadDialog.bind(this);
        this.openExcelUploadDialog = this.openExcelUploadDialog.bind(this);
        this._basicDialog = this._basicDialog.bind(this);
        this.closeDialog = this.closeDialog.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onExternalLinkDragStart = this.onExternalLinkDragStart.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this._removeDragDropStyling = this._removeDragDropStyling.bind(this);
        this.handleSelectionChanged = this.handleSelectionChanged.bind(this);

        // Bound serialization methods
        this.toCSV = this.toCSV.bind(this);
        this.fromCSV = this.fromCSV.bind(this);
        this.fromExcel = this.fromExcel.bind(this);
        this.toExcel = this.toExcel.bind(this);
    }

    connectedCallback() {
        // set the id; NOTE: at the moment this is a random UUID
        this.setAttribute("id", window.crypto.randomUUID());

        // Setup a ContextMenu handler for this sheet
        this.setupContextMenu();

        this.addToHeader(this.trashButton(), "left");
        this.addToHeader(this.uploadButton(), "left");
        this.addToHeader(this.downloadButton(), "left");
        this.addToHeader(this.eraseButton(), "right");
        this.addToHeader(this.maximizeMinimizeButton(), "right");
        this.addToFooter(this.linkButton(), "right");
        this.addToFooter(this.plotButton(), "left");
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

        this.addEventListener("selection-changed", this.handleSelectionChanged);
        // Stash a reference to the underlying ap-sheet
        this.sheet = this.shadowRoot.getElementById("ap-sheet");

        // set the palette
        this.style.backgroundColor = "var(--bg-color)";
        this.sheet.style.backgroundColor = "var(--sheet-bg-color)";
    }

    disconnectedCallback() {
        // remove event listeners
        const header = this.shadowRoot.querySelector("#header-bar");
        // const footer = this.shadowRoot.querySelector("#footer-bar");
        const name = header.querySelector("span");
        name.removeEventListener("dblclick", this.onNameDblClick);
        this.removeEventListener("dragstart", this.onDragStart);
        this.removeEventListener("dragend", this.onDragEnd);
        this.removeEventListener("dragover", this.onDragOver);
        this.removeEventListener("dragleave", this.onDragLeave);
        this.removeEventListener("drop", this.onDrop);

        this.removeEventListener(
            "selection-changed",
            this.handleSelectionChanged
        );
        this.contextMenuHandler.removeListeners();
    }

    /**
     * Setup the context meny handler. Can be overwritten
     * by others who want a custom handler
     **/
    setupContextMenu() {
        this.contextMenuHandler = new ContextMenuHandler(this);
        this.contextMenuHandler.setupListeners();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === "minimized") {
            Array.from(document.querySelectorAll("ws-connection")).forEach(
                (connectionElement) => {
                    connectionElement.renderLines();
                }
            );
            const header = this.shadowRoot.querySelector("#header-bar");
            const button = header.querySelector("#min-max");
            let title = "minimize this worksheet";
            let svg = createIconSVGFromString(icons.minimize);
            if (this.hasAttribute("minimized")) {
                title = "maximize this worksheet";
                svg = createIconSVGFromString(icons.maximize);
            }
            button.setAttribute("title", title);
            button.querySelector("svg").replaceWith(svg);
        }
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

    removeButton(id) {
        // recall our buttons are not necessary DOM <button> elements
        const button = this.shadowRoot.querySelector(`[id="${id}"]`);
        if (button) {
            button.remove();
        }
    }

    /* default header/footer buttons */
    plotButton() {
        const svg = createIconSVGFromString(icons.desktopAnalytics);
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.onOpenPlotInterface);
        button.setAttribute("title", "open the reporting interface");
        button.setAttribute("data-clickable", true);
        return button;
    }

    maximizeMinimizeButton() {
        const svg = createIconSVGFromString(icons.minimize);
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", () => {
            this.toggleAttribute("minimized");
        });
        button.setAttribute("title", "minimize the worksheet");
        button.setAttribute("data-clickable", true);
        button.setAttribute("id", "min-max");
        return button;
    }

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

    connectionButton() {
        const svg = createIconSVGFromString(icons.affiliate);
        svg.style.setProperty("stroke", "var(--palette-orange)");
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", (event) => {
            const connection = this._getConnection(this.id);
            connection.unhide(event);
        });
        button.setAttribute("title", "open connector");
        button.setAttribute("data-clickable", true);
        button.setAttribute("id", "connection-button");
        return button;
    }

    // the callbacks
    onOpenPlotInterface() {
        const pi = new PlotInterface(this);
        document.body.append(pi);
    }

    onMouseDownInHeaderFooter(event) {
        // drag event propagation can be touchy so make sure we are not clicking or dragging
        // any children of header/footer
        // only left click for the move here
        if (event.button == 0) {
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
        const moveEvent = new CustomEvent("worksheet-moved", {
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
        // tell any connections that I am no longer there
        document.querySelectorAll("ws-connection").forEach((wsc) => {
            if (wsc.getAttribute("target") == this.id) {
                wsc.setAttribute("target", "");
            }
            let sources = wsc.getAttribute("sources");
            if (sources) {
                sources = sources.split(",");
                if (sources.indexOf(this.id) > -1) {
                    sources.splice(sources.indexOf(this.id), 1);
                    wsc.setAttribute("sources", sources);
                }
            }
        });
    }

    onErase() {
        this.sheet.dataFrame.clear();
    }

    onUpload(event) {
        // supported file formats
        const formats = ["csv", "xlsx", "xls"];
        const rexp = new RegExp(`(?:${formats.join("|")})$`);
        const file = event.target.files[0];
        const fileName = file.name;
        if (rexp.test(fileName)) {
            const ftype = rexp.exec(fileName)[0];
            if (ftype == "csv") {
                this.fromCSV(file);
            } else {
                const reader = new FileReader();
                const rABS = !!reader.readAsBinaryString;
                reader.addEventListener("load", (loadEv) => {
                    this.fromExcel(loadEv.target.result, rABS, fileName, ftype);
                });
                reader.addEventListener("error", (e) => {
                    console.error(e);
                    alert(
                        "An error occurred reading the xlsx file; try converting to csv first!"
                    );
                    return;
                });
                if (rABS) {
                    reader.readAsBinaryString(file);
                } else {
                    reader.readAsArrayBuffer(file);
                }
            }
        } else {
            alert(`I only support ${formats.join(", ")} type files!`);
            // TODO perhaps we should throw an error here
        }
    }

    onDownload() {
        this.openDownloadDialog();
    }

    downloadCSV() {
        this.closeDialog();
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

    downloadExcel() {
        this.closeDialog();
        const [wb, fileName] = this.toExcel();
        XLSX.writeFile(wb, `${fileName}.xlsx`);
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

    onDragStart(event) {
        // selection drags are handled by ap-sheet but we still need
        // to know which worksheet is the source
        event.dataTransfer.setData("sourceId", this.id);
    }

    onDragEnd(event) {
        // TODO: there must be a better way to highlight dragged over cells
        // without having to remove the class from each one
        this.shadowRoot.querySelectorAll("sheet-cell").forEach((cell) => {
            cell.classList.remove("dragover");
        });
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
        } else if (event.dataTransfer.getData("worksheet-link")) {
            event.dataTransfer.dropEffect = "link";
            this._overlay(icons.link);
        } else if (event.dataTransfer.getData("selection-drag")) {
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
            if (connection && connection.hasAttribute("recording")) {
                if (target.nodeName == "SHEET-CELL") {
                    target.classList.add("dragover");
                    target.addEventListener(
                        "dragleave",
                        this._removeDragDropStyling
                    );
                    target.addEventListener(
                        "drop",
                        this._removeDragDropStyling
                    );
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
            if (connection) {
                const sources = connection.getAttribute("sources").split(",");
                if (sources.indexOf(sourceId) == -1) {
                    sources.push(sourceId);
                    connection.setAttribute("sources", sources);
                }
            } else {
                connection = document.createElement("ws-connection");
                document.body.append(connection);
                connection.setAttribute("target", this.id);
                connection.setAttribute("sources", [sourceId]);
                // add callstack and command related buttons
                this.addToFooter(this.connectionButton(), "left", true);
            }
        } else if (event.dataTransfer.getData("selection-drag")) {
            // we need to make sure that three conditions hold for a valid
            // selection drag
            // 1. the sheets are linked, ie a ws-connection element exists
            //    with corresponding source and target
            // 2. the target sheet is in record mode
            // 3. the target element of the drop is a sheet-cell element
            const cell_target = event.originalTarget;
            const source_id = event.dataTransfer.getData("sourceId");
            const target_id = event.target.id;
            const connection = this._getConnection(target_id, source_id);
            // we need to define the recording bool here otherwise event can
            // loose reference to target inside a condition - wtf?!
            if (connection && connection.hasAttribute("recording")) {
                if (cell_target.nodeName == "SHEET-CELL") {
                    const drop_data = JSON.parse(
                        event.dataTransfer.getData("text/json")
                    );
                    const source_origin = [
                        drop_data.relativeFrameOrigin.x,
                        drop_data.relativeFrameOrigin.y,
                    ];
                    const source_corner = [
                        drop_data.relativeFrameCorner.x,
                        drop_data.relativeFrameCorner.y,
                    ];
                    const target_origin = [
                        parseInt(cell_target.getAttribute("data-relative-x")),
                        parseInt(cell_target.getAttribute("data-relative-y")),
                    ];
                    // TODO: note we handling only one source at a time here
                    // but note source_info is an array so can be multuple sources in the future
                    const source_info = [
                        {
                            id: source_id,
                            origin: source_origin,
                            corner: source_corner,
                        },
                    ];
                    // NOTE: for target origin and corner are the same, ie a 1x1 frame, for the moment
                    const target_info = {
                        id: target_id,
                        origin: target_origin,
                        corner: target_origin,
                    };
                    connection.openCommandInterface(source_info, target_info);
                }
            }
        } else if (event.dataTransfer.files) {
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
    _removeDragDropStyling(event) {
        event.target.classList.remove("dragover");
        event.target.removeEventListener(
            "dragleave",
            this._removeDragDropStyling
        );
        event.target.removeEventListener("drop", this._removeDragDropStyling);
    }

    /**
     * I unhide the worksheet overlay to display provided svg icon string.
     */
    _overlay(iconString) {
        const overlay = this.shadowRoot.querySelector(".overlay");
        overlay.classList.remove("hide");
        const template = document.createElement("template");
        template.innerHTML = iconString.trim();
        const iconSVG = template.content.childNodes[0];
        overlay.replaceChildren(iconSVG);
    }

    /**
     * I find the connection which corresponds to the target and source (if provided).
     * The assumption is that each sheet can be the source of multiple sheets.
     * However, there can be **only one** connection between two sheets and each sheet
     * can be the target of **only one** connection.
     **/
    _getConnection(targetId, sourceId) {
        const connections = document.querySelectorAll(
            `ws-connection[target="${targetId}"]`
        );
        if (connections.length == 0) {
            return;
        }
        if (connections.length > 1) {
            throw `Multiple connections found for the target ${targetId}`;
        }
        const wc = connections[0];
        if (sourceId) {
            if (wc.getAttribute("sources").split(",").indexOf(sourceId) > -1) {
                return wc;
            }
        } else {
            return wc;
        }
    }

    /*
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
            iconSpan.setAttribute(
                "title",
                `${type}: ${sheet.name} (${sheet.id})`
            );
        });
        iconSpan.addEventListener("mouseleave", () => {
            unlinkIcon.style.display = "none";
            icon.style.display = "inherit";
            sheet.style.outline = "initial";
        });
        return iconSpan;
    }

    /**
     * I handle the 'selection-changed' event
     * dispatched from sheet. At the moment I simply
     * pass it onto other handlers if defined
     **/
    handleSelectionChanged(event) {
        if (this.plotHandleSelectionChanged) {
            this.plotHandleSelectionChanged(event);
        }
    }
    /**
     * I hadle csv files. This is done by iterating over
     * chunks (default size 10MB) and updating the sheet.DataFrame
     * accordigly. This is a bit slower, on small files, than loading in one go
     * but it allows for dealing with all files uniformly (the different for small
     * files is unnoticeable).
     **/
    fromCSV(file) {
        let rowsProcessed = 0;
        // we are not binding the parse callbacks here
        const self = this;
        let icon = icons.loader;
        const parseConfig = {
            worker: true, // run the upload on a Worker not to block things up
            chunk: function (chunk) {
                self._overlay(icon);
                self.sheet.dataFrame.loadFromArray(
                    chunk.data,
                    [0, rowsProcessed],
                    false
                );
                rowsProcessed += chunk.data.length;
                if (icon == icons.loader) {
                    icon = icons.loaderQuarter;
                } else {
                    icon = icons.loader;
                }
                console.log("processed:", rowsProcessed);
            },
            complete: function () {
                self.sheet.render();
                console.log("total rows:", rowsProcessed);
                self.updateName(file.name);
                const overlay = self.shadowRoot.querySelector(".overlay");
                overlay.classList.add("hide");
            },
        };
        try {
            Papa.parse(file, parseConfig);
        } catch (e) {
            console.log(e);
            alert("I couldn't process the csv; please try again");
        }
    }

    toCSV() {
        const data = this.sheet.dataFrame.getDataArrayForFrame(
            this.sheet.dataFrame
        );
        return CSVParser.unparse(data);
    }

    fromExcel(aString, rABS, fileName, ftype) {
        // TODO: if the field is an excel date field xlsx converts it
        // automatically, to either a numerical value or a date string
        // I can't see a way around this and it might be a by-product of how
        // excel data is actually stored tbd...
        const wb = XLSX.read(aString, {
            type: rABS ? "binary" : "array",
            cellText: false,
            cellDates: true,
        });
        // ask which sheet to load since we only do one
        this.openExcelUploadDialog(wb, (event) => {
            const ws = wb.Sheets[event.target.value];
            if (ws) {
                this._overlay(icons.loader);
                const wsArray = XLSX.utils.sheet_to_json(
                    ws,
                    { header: 1 } // this will give us an nd-array
                );
                this.onErase();
                this.sheet.dataFrame.loadFromArray(wsArray);
                // update the file name to include the sheet/tab
                fileName = fileName.replace(
                    `.${ftype}`,
                    `[${event.target.value}]`
                );
                fileName = fileName.replace(
                    /\[.+\]$/,
                    `[${event.target.value}]`
                );
                // set the name of the sheet to the file name; TODO: do we want this?
                this.updateName(fileName);
                const overlay = this.shadowRoot.querySelector(".overlay");
                overlay.classList.add("hide");
            }
        });
    }

    openExcelUploadDialog(workbook, callback) {
        const dialog = this._basicDialog(`${this.id}_excel_dialog`);
        const form = document.createElement("form");
        const select = document.createElement("select");
        const option = document.createElement("option");
        option.textContent = "Choose a sheet...";
        option.setAttribute("disabled", "");
        option.setAttribute("selected", "");
        select.append(option);
        workbook.SheetNames.forEach((name) => {
            const option = document.createElement("option");
            option.textContent = name;
            select.append(option);
        });
        form.append(select);
        dialog.firstChild.append(form);
        select.addEventListener("change", callback);
        dialog.showModal();
    }

    openDownloadDialog() {
        const dialog = this._basicDialog(`${this.id}_download_dialog`);
        const csvButton = document.createElement("button");
        csvButton.textContent = "CSV";
        const excelButton = document.createElement("button");
        excelButton.textContent = "XLSX";
        dialog.firstChild.append(csvButton);
        dialog.firstChild.append(excelButton);
        csvButton.addEventListener("click", this.downloadCSV);
        excelButton.addEventListener("click", this.downloadExcel);
        dialog.showModal();
    }

    _basicDialog(id) {
        const dialog = document.createElement("dialog");
        const div = document.createElement("div");
        dialog.append(div);
        dialog.setAttribute("id", id);
        document.body.append(dialog);
        // create a close/remove icon
        const svg = createIconSVGFromString(icons.remove);
        const removeButton = document.createElement("span");
        removeButton.appendChild(svg);
        removeButton.setAttribute("title", "cancel");
        removeButton.setAttribute("data-clickable", true);
        removeButton.setAttribute("id", "remove");
        dialog.append(removeButton);
        removeButton.addEventListener("click", () => this.closeDialog(id));
        return dialog;
    }

    closeDialog(id) {
        const dialog = document.getElementById(id);
        if (dialog) {
            dialog.remove();
        }
    }

    toExcel() {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(
            this.sheet.dataFrame.getDataArrayForFrame(this.sheet.dataFrame)
        );
        // TODO get proper name here for the sheet
        let sheetName = "Sheet1";
        const sheetRE = /\[(.*)\]$/;
        const m = this.name.match(sheetRE);
        let fileName = this.name;
        if (m) {
            sheetName = m[1];
            fileName = fileName.replace(sheetRE, "");
        }
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        return [wb, fileName];
    }

    get isMinimized() {
        return this.hasAttribute("minimized");
    }

    static get observedAttributes() {
        return ["minimized"];
    }
}

window.customElements.define("work-sheet", Worksheet);

export { Worksheet, Worksheet as default };
