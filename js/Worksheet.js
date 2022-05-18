/**
   * Worksheet web component
   * -----------------------
   * The worksheep component is a sort of flexible container
   * which conains a sheet (or potentially something else tbd)
   * has a useable border and displays information about the work
   * being done.
   **/

import CallStack from './callStack.js'
import commandRegistry from './commandRegistry.js'
import icons from './utils/icons.js';

// Simple grid-based sheet component
const templateString = `
<style>
:host {
    position: absolute;
    padding: 3px;
    background-color: var(--palette-orange);
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 5px;
    z-index: 1;
    overflow: hidden; /* to make resize work */
    resize: both;
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
    padding: 3px;
    cursor: pointer;
    background-color: transparent;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

#header-bar > span.hide {
    display: none;
}

#header-bar > input {
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

#header-bar > input.show {
    display: inline-flex;
    align-items: center;
}

#footer-bar {
    width: 100%;
    padding-left: 3px;
    padding-right: 4px;
    padding-top: 5px;
    padding-bottom: 2px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
svg {
    width: 20px;
    height: 20px;
    cursor: pointer;
}

my-grid {
    background-color: var(--palette-beige);
    z-index: 3;
}

#sheet-container{
    width: 100%;
    height: 100%;
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

</style>
<div id="header-bar">
    ${icons.remove}
    <span>A worksheet</span>
    <input></input>
    <span>
        ${icons.run}
        ${icons.eraser}
    </span>
</div>
<div id="sheet-container">
    <my-grid expands=true columns=5 rows=10></my-grid>
</div>
<div id="footer-bar">
    <span id="sources">
    </span>
    <span id="targets">
        <span id="e-link">
            ${icons.externalLink}
        </span>
    </span>
</div>

`;

// a few palette combo options for the sheet + bar area
const paletteCombinations = [
    {this: 'var(--palette-orange)', sheet: 'var(--palette-beige)'},
    {this: 'var(--palette-lightblue)', sheet: 'var(--palette-cyan)'},
    {this: 'var(--palette-cyan)', sheet: 'var(--palette-lightblue)'},
]

class Worksheet extends HTMLElement {
    constructor(){
        super();
        this.template = document.createElement('template');
        this.template.innerHTML = templateString;
        this.attachShadow({mode: 'open', delegatesFocus: true});
        this.shadowRoot.appendChild(
            this.template.content.cloneNode(true)
        );

        // a randomly generated UUID
        this.id;

        // the current callStack and available commandis
        this.callStack;
        this.commandRegistry = commandRegistry;

        // source and target sheets
        this.sources = [];
        this.targets = [];

        // generate a random palette for the worksheet
        this.palette = paletteCombinations[Math.floor(Math.random() * paletteCombinations.length)];

        // name for the worksheet. Note: this is the name found in the header area
        // and also in the this.name attribute for querying and listening for changes
        this.name = "";
        this.isEditingName = false;

        // bind methods
        this.addASource = this.addASource.bind(this);
        this.removeASource = this.removeASource.bind(this);
        this.addATarget = this.addATarget.bind(this);
        this.removeATarget = this.removeATarget.bind(this);
        this.onMouseMoveInHeader = this.onMouseMoveInHeader.bind(this);
        this.onMouseDownInHeader = this.onMouseDownInHeader.bind(this);
        this.onMouseUpAfterDrag = this.onMouseUpAfterDrag.bind(this);
        this.onNameDblClick = this.onNameDblClick.bind(this);
        this.onNameKeydown = this.onNameKeydown.bind(this);
        this.updateName = this.updateName.bind(this);
        this.onErase = this.onErase.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onRun = this.onRun.bind(this);
        this.onExternalLinkDragStart = this.onExternalLinkDragStart.bind(this);
        this.onExternalLinkDragOver = this.onExternalLinkDragOver.bind(this);
        this.onExternalLinkDrop = this.onExternalLinkDrop.bind(this);
    }

    connectedCallback(){
        // set the id; NOTE: at the moment this is a random UUID
        this.setAttribute("id",  window.crypto.randomUUID());
        // for the moment every sheet has a CallStack which might or might not
        // make sense moving fwd
        // NOTE: it's the GridSheet in the shadow which (potentially) contains the commands
        // that is passed as the editor to CallStack
        this.callStack = new CallStack(this.shadowRoot.querySelector('my-grid'), this.commandRegistry);

        // set the palette
        this.style.backgroundColor = this.palette.this;
        this.shadowRoot.querySelector('my-grid').style.backgroundColor = this.palette.sheet;

        const header = this.shadowRoot.querySelector('#header-bar');
        const name = header.querySelector('span');
        const eraseButton = header.querySelector("#erase");
        const deleteButton = header.querySelector("#remove");
        const runButton = header.querySelector("#run");
        const footer = this.shadowRoot.querySelector('#footer-bar');
        // for drag & drop to work we need to select the span parent of the svg
        const externalLinkButton = footer.querySelector("#e-link");
        externalLinkButton.setAttribute("title", "drag and drop onto a sheet to link");

        // set the name to default
        this.updateName("The worksheet");

        // add event listeners
        header.addEventListener("mousedown", this.onMouseDownInHeader);
        name.addEventListener("dblclick", this.onNameDblClick);
        eraseButton.addEventListener("click", this.onErase);
        deleteButton.addEventListener("click", this.onDelete);
        runButton.addEventListener("click", this.onRun);
        externalLinkButton.setAttribute("draggable", true);
        externalLinkButton.addEventListener("dragstart", this.onExternalLinkDragStart);
        this.addEventListener("dragover", this.onExternalLinkDragOver);
        this.addEventListener("drop", this.onExternalLinkDrop);
    }

    disconnectedCallback(){
        // remove event listeners
        const header = this.shadowRoot.querySelector('#header-bar');
        header.removeEventListener("mousedown", this.onMouseDownInHeader);
    }

    onMouseDownInHeader(){
        // dispatch an event to put the sheet in focus
        const event = new CustomEvent(
            'newSheetFocus',
            {
                bubbles: true,
                detail: {target: this}
            }
        );
        this.dispatchEvent(event);
        document.addEventListener('mousemove', this.onMouseMoveInHeader);
        document.addEventListener('mouseup', this.onMouseUpAfterDrag);
    }

    onMouseUpAfterDrag(){
        document.removeEventListener('mouseup', this.onMouseUpAfterDrag);
        document.removeEventListener('mousemove', this.onMouseMoveInHeader);
    }

    onMouseMoveInHeader(event){
        const currentLeft = this.getBoundingClientRect().left;
        const currentTop = this.getBoundingClientRect().top;
        const newTop = currentTop + event.movementY;
        const newLeft = currentLeft + event.movementX;
        this.style.setProperty("top", newTop + 'px');
        this.style.setProperty("left", newLeft + 'px');
    }

    onNameDblClick(){
        if(!this.isEditingName){
            this.startEditingName();
        }
    }

    onNameKeydown(event){
        if(event.key == "Enter"){
            event.preventDefault();
            event.stopPropagation();
            this.stopEditingName();
        }
    }

    updateName(name){
        const header = this.shadowRoot.querySelector('#header-bar');
        const nameSpan = header.querySelector('span');

        this.name = name;
        this.setAttribute("name", name);
        nameSpan.textContent = this.name;
    }

    startEditingName(){
        this.isEditingName = true;
        const header = this.shadowRoot.querySelector('#header-bar');
        const nameSpan = header.querySelector('span');
        nameSpan.classList.add("hide");
        const input = header.querySelector('input');
        input.classList.add('show');
        input.value = this.name;
        input.addEventListener('keydown', this.onNameKeydown);
        // input.addEventListener('blur', this.handleInputBlur);
        input.focus();
    }

    stopEditingName(){
        this.isEditingName = false;
        const header = this.shadowRoot.querySelector('#header-bar');
        const input = header.querySelector('input');
        const nameSpan = header.querySelector('span');
        nameSpan.classList.remove("hide");
        input.removeEventListener('keydown', this.onNameKeydown);
        input.classList.remove('show');
        let newName = input.value;
        if(!newName){
            newName = "A worksheet";
        }
        this.updateName(newName);
        //input.removeEventListener('blur', this.handleInputBlur);
        // input.blur();
    }

    onDelete(){
        const msg = `Are you sure you want to delete ${this.name}?`;
        if(window.confirm(msg)){
            this.remove();
        }
    }

    onErase(){
        this.shadowRoot.querySelector("my-grid").dataFrame.clear();
    }

    onRun(){
        this.callStack.runAll(this.sources, this.targets);
    }

    onExternalLinkDragStart(event){
        event.dataTransfer.setData("id", this.id);
        event.dataTransfer.setData("name", this.name);
        event.dataTransfer.effectAllowed = "link";
    }

    onExternalLinkDragOver(event){
        event.preventDefault();
        event.dataTransfer.dropEffect = "link";
        console.log("drag over");
    }

    onExternalLinkDrop(event){
        event.preventDefault();
        // add the source
        const sourceId = event.dataTransfer.getData("id")
        const sourceName = event.dataTransfer.getData("name")
        this.addASource(sourceId, sourceName);
        // now tell the source to add me as a target
        // TODO: maybe all of this source/target adding/removing should be
        // handled with custom events...?
        const sourceSheet = document.getElementById(sourceId);
        sourceSheet.addATarget(this.id, this.name);
    }

    addASource(id, name){
        if(this.sources.indexOf(id) != -1){
            alert(`${id} already added`);
            return;
        }
        this.sources.push(id);
        // add an icon with data about the source to the footer
        const template = document.createElement("template");
        template.innerHTML = icons.sheetImport;
        const sourceIcon = template.content.childNodes[0];
        const sourceSpan = document.createElement("span");
        sourceSpan.appendChild(sourceIcon);
        const footer = this.shadowRoot.querySelector('#footer-bar');
        const sources = footer.querySelector('#sources');
        sourceSpan.setAttribute("data-source-id", id);
        sourceSpan.setAttribute("title", `source: ${name} (${id})`);
        sources.appendChild(sourceSpan);
        return id;
    }

    removeASource(id){
        this.sources.filter((item) => {return item != id});
    }

    addATarget(id, name){
        if(this.targets.indexOf(id) != -1){
            alert(`${id} already added`);
            return;
        }
        this.targets.push(id);
        // add an icon with data about the target to the footer
        const template = document.createElement("template");
        template.innerHTML = icons.sheetExport;
        const targetIcon = template.content.childNodes[0];
        const targetSpan = document.createElement("span");
        targetSpan.appendChild(targetIcon);
        const footer = this.shadowRoot.querySelector('#footer-bar');
        const targets = footer.querySelector('#targets');
        targetSpan.setAttribute("data-target-id", id);
        targetSpan.setAttribute("title", `target: ${name} (${id})`);
        const externalLinkButton = footer.querySelector("#e-link");
        targets.insertBefore(targetSpan, externalLinkButton);
        return id;
    }

    removeATarget(id){
        this.targets.filter((item) => {return item != id});
    }
}

window.customElements.define("work-sheet", Worksheet);
