/**
   * Worksheet web component
   * -----------------------
   * The worksheep component is a sort of flexible container
   * which conains a sheet (or potentially something else tbd)
   * has a useable border and displays information about the work
   * being done.
   **/

import CallStack from './callStack.js';
import commandRegistry from './commandRegistry.js';
import icons from './utils/icons.js';
import createIconSVGFromString from './utils/helpers.js';

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
    width: 100%;
    padding-left: 3px;
    padding-right: 4px;
    padding-top: 5px;
    padding-bottom: 2px;
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

</style>
<div id="header-bar">
    <span id="header-left">
    </span>
    <span data-clickable=true id="title">
        <span>A worksheet</span>
        <input></input>
    </span>
    <span id="header-right">
        <span data-clickable=true id="run">
            ${icons.run}
        </span>
        <span data-clickable=true id="erase">
            ${icons.eraser}
        </span>
    </span>
</div>
<div id="sheet-container">
    <my-grid expands="both" columns=5 rows=10></my-grid>
</div>
<div id="footer-bar">
    <span id="footer-left">
    </span>
    <span id="footer-middle">
    </span>
    <span id="footer-right">
        <span data-clickable=true id="e-link">
            ${icons.link}
        </span>
    </span>
</div>
<div class="overlay hide">
    ${icons.link}
</div>

`;


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
        this.onMouseMoveInHeader = this.onMouseMoveInHeader.bind(this);
        this.onMouseDownInHeader = this.onMouseDownInHeader.bind(this);
        this.onMouseUpAfterDrag = this.onMouseUpAfterDrag.bind(this);
        this.onNameDblClick = this.onNameDblClick.bind(this);
        this.onNameKeydown = this.onNameKeydown.bind(this);
        this.updateName = this.updateName.bind(this);
        this.onErase = this.onErase.bind(this);
        this.onUpload = this.onUpload.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onRun = this.onRun.bind(this);
        this.onExternalLinkDragStart = this.onExternalLinkDragStart.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDragLeave = this.onDragLeave.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    connectedCallback(){
        // set the id; NOTE: at the moment this is a random UUID
        this.setAttribute("id",  window.crypto.randomUUID());
        // for the moment every sheet has a CallStack which might or might not
        // make sense moving fwd
        // NOTE: it's the GridSheet in the shadow which (potentially) contains the commands
        // that is passed as the editor to CallStack
        this.callStack = new CallStack(this.shadowRoot.querySelector('my-grid'), this.commandRegistry);

        // set the sources and targets to ""
        this.setAttribute("sources", "");
        this.setAttribute("targets", "");

        // set the palette
        this.style.backgroundColor = "var(--bg-color)";
        this.shadowRoot.querySelector('my-grid').style.backgroundColor = "var(--sheet-bg-color)";

        this.addToHeader(this.trashButton(), "left");
        this.addToHeader(this.uploadButton(), "left");
        const header = this.shadowRoot.querySelector('#header-bar');
        const name = header.querySelector('#title');
        const eraseButton = header.querySelector("#erase");
        const runButton = header.querySelector("#run");
        const footer = this.shadowRoot.querySelector('#footer-bar');
        // for drag & drop to work we need to select the span parent of the svg
        const externalLinkButton = footer.querySelector("#e-link");

        // set icon titles for hover over
        eraseButton.setAttribute("title", "clear sheet values");
        runButton.setAttribute("title", "run the commands");
        externalLinkButton.setAttribute("title", "drag and drop onto a sheet to link");
        uploadButton.setAttribute("title", "upload a sheet");

        // set the name to default
        this.updateName("The worksheet");

        // add event listeners
        header.addEventListener("mousedown", this.onMouseDownInHeader);
        name.addEventListener("dblclick", this.onNameDblClick);
        eraseButton.addEventListener("click", this.onErase);
        runButton.addEventListener("click", this.onRun);
        externalLinkButton.setAttribute("draggable", true);
        externalLinkButton.addEventListener("dragstart", this.onExternalLinkDragStart);
        this.addEventListener("dragover", this.onDragOver);
        this.addEventListener("dragleave", this.onDragLeave);
        this.addEventListener("drop", this.onDrop);
    }

    disconnectedCallback(){
        // remove event listeners
        const header = this.shadowRoot.querySelector('#header-bar');
        const name = header.querySelector('span');
        const eraseButton = header.querySelector("#erase");
        const runButton = header.querySelector("#run");
        const footer = this.shadowRoot.querySelector('#footer-bar');
        // for drag & drop to work we need to select the span parent of the svg
        const externalLinkButton = footer.querySelector("#e-link");
        header.addEventListener("mousedown", this.onMouseDownInHeader);
        name.addEventListener("dblclick", this.onNameDblClick);
        eraseButton.addEventListener("click", this.onErase);
        runButton.addEventListener("click", this.onRun);
        externalLinkButton.addEventListener("dragstart", this.onExternalLinkDragStart);
        this.removeEventListener("dragover", this.onDragOver);
        this.addEventListener("dragleave", this.onDragLeave);
        this.removeEventListener("drop", this.onDrop);
    }

    /* I add an element to the header.
       element: DOM element
       location: str (one of "left", "right")
    */
    addToHeader(element, location){
        const header = this.shadowRoot.querySelector('#header-bar');
        const parent = header.querySelector(`#header-${location}`);
        parent.appendChild(element);
    }

    /* I add an element to the footer.
       element: DOM element
       location: str (one of "left", "right", "middle")
       */
    addToFooter(element, location){
        const footer = this.shadowRoot.querySelector('#footer-bar');
        const parent = footer.querySelector(`#footer-${location}`);
        parent.appendChild(element);
    }

    /* default header buttons */
    trashButton(){
        const svg = createIconSVGFromString(icons.trash);
        const button = document.createElement("span");
        button.appendChild(svg);
        button.addEventListener("click", this.onDelete);
        button.setAttribute("title", "delete this sheet");
        button.setAttribute("data-clickable", true);
        return button;
    }

    uploadButton(){
        const label = document.createElement("label");
        label.setAttribute("id", "upload");
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", ".csv,.xlsx,.xls");
        const svg = createIconSVGFromString(icons.fileUpload);
        label.appendChild(input);
        label.appendChild(svg);
        label.addEventListener("change", this.onUpload);
        return label;
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
        const nameSpan = header.querySelector('#title > span');

        this.name = name;
        this.setAttribute("name", name);
        nameSpan.textContent = this.name;
    }

    startEditingName(){
        this.isEditingName = true;
        const header = this.shadowRoot.querySelector('#header-bar');
        const nameSpan = header.querySelector('#title > span');
        nameSpan.classList.add("hide");
        const input = header.querySelector('#title > input');
        input.classList.add('show');
        input.value = this.name;
        input.addEventListener('keydown', this.onNameKeydown);
        // input.addEventListener('blur', this.handleInputBlur);
        input.focus();
    }

    stopEditingName(){
        this.isEditingName = false;
        const header = this.shadowRoot.querySelector('#header-bar');
        const input = header.querySelector('#title > input');
        const nameSpan = header.querySelector('#title > span');
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

    onUpload(event){
        const fileList = event.target.files; 
        if(fileList.length > 1){
            alert("Please select one file for upload");
            return;
        }
        const file = fileList[0];
        if(file.type != "text/csv"){
            alert("I can only handle csv files at the moment - sorry");
            return;
        }
        const reader = new FileReader();
        reader.addEventListener("error", (e) => {
            console.error(e);
            alert("An error occurred reading this file");
            return;
        })
        reader.addEventListener("load", () => {
            const text = reader.result;
            // first clear the sheet then fill with new values
            const sheet = this.shadowRoot.querySelector("my-grid");
            sheet.dataFrame.clear();
            let rowCounter = 0;
            let columnCounter = 0;
            text.split("\r\n").forEach((row) => {
                row.split(",").forEach((value) => {
                    sheet.dataFrame.putAt([columnCounter, rowCounter], value, false);
                    columnCounter += 1;
                })
                rowCounter += 1;
                columnCounter = 0;
            });
            sheet.render(); // render values at the end
        })
        reader.readAsText(file);
        // set the name of the sheet to the file name; TODO: do we want this?
        this.updateName(file.name);
    }

    onRun(){
        if(!this.getAttribute("sources") || !this.getAttribute("targets")){
            alert("You must have both sources and targets set to run!");
        }
        this.callStack.runAll(
            this.getAttribute("sources").split(","),
            this.getAttribute("targets").split(",")
        );
    }

    onExternalLinkDragStart(event){
        event.dataTransfer.setData("id", this.id);
        event.dataTransfer.setData("name", this.name);
        event.dataTransfer.setData("worksheet-link", true);
        event.dataTransfer.effectAllowed = "all";
    }

    onDragOver(event){
        event.stopPropagation();
        event.preventDefault();
        const overlay = this.shadowRoot.querySelector(".overlay");
        // NOTE: dataTransfer payload can disappear in the debugger - fun!
        // Also detecting whether a drop event is file drop is not consistent across browsers
        // and is touchy in general
        if(event.dataTransfer.types.indexOf("Files") != -1 || event.dataTransfer.getData("worksheet-link")){
            overlay.classList.remove("hide");
            event.dataTransfer.dropEffect = "link";
            let iconString = icons.link;
            if(event.dataTransfer.types.indexOf("Files") != -1 ){
                event.dataTransfer.dropEffect = "copy";
                iconString = icons.fileUpload;
            }
            const template = document.createElement("template");
            template.innerHTML = iconString;
            const iconSVG = template.content.childNodes[0];
            overlay.replaceChildren(iconSVG);
        }
    }

    onDragLeave(event){
        event.stopPropagation();
        event.preventDefault();
        const overlay = this.shadowRoot.querySelector(".overlay");
        overlay.classList.add("hide");
    }

    onDrop(event){
        event.stopPropagation();
        event.preventDefault();
        const overlay = this.shadowRoot.querySelector(".overlay");
        overlay.classList.add("hide");
        if(event.dataTransfer.getData("worksheet-link")){
            // add the source
            const sourceId = event.dataTransfer.getData("id")
            const sourceName = event.dataTransfer.getData("name")
            this.addSource(sourceId, sourceName);
            // now tell the source to add me as a target
            // TODO: maybe all of this source/target adding/removing should be
            // handled with custom events...?
            const sourceSheet = document.getElementById(sourceId);
            sourceSheet.addTarget(this.id, this.name);
        } else if(event.dataTransfer.files){
            // set the event.target.files to the dataTransfer.files
            // since that is what this.onUpload() expects
            event.target.files = event.dataTransfer.files;
            this.onUpload(event);
        }
    }

    addSource(id, name){
        const sources = this._attributeToList("sources");
        if(sources.indexOf(id) != -1){
            alert(`${id} already added`);
            return;
        }
        sources.push(id);
        this.setAttribute("sources", sources);
        // add an icon with data about the source to the footer
        const sourceSpan = this._createSourceTargetIconSpan("source", id, name);
        const footer = this.shadowRoot.querySelector('#footer-bar');
        const sourcesArea = footer.querySelector('#footer-left');
        sourcesArea.appendChild(sourceSpan);
        return id;
    }

    removeSource(id){
        let sources = this._attributeToList("sources");
        sources = sources.filter((item) => {return item != id});
        this.setAttribute("sources", sources);
        // remove the source link
        const footer = this.shadowRoot.querySelector("#footer-bar");
        const linkContainer = footer.querySelector('#footer-left');
        linkContainer.querySelectorAll(`[data-id='${id}']`).forEach((item) => {item.remove()});
    }

    addTarget(id, name){
        const targets = this._attributeToList("targets");
        if(targets.indexOf(id) != -1){
            alert(`${id} already added`);
            return;
        }
        targets.push(id);
        this.setAttribute("targets", targets);
        // add an icon with data about the target to the footer
        const targetSpan = this._createSourceTargetIconSpan("target", id, name);
        const footer = this.shadowRoot.querySelector('#footer-bar');
        const targetsArea = footer.querySelector('#footer-right');
        const externalLinkButton = footer.querySelector("#e-link");
        targetsArea.insertBefore(targetSpan, externalLinkButton);
        return id;
    }

    removeTarget(id){
        let targets = this._attributeToList("targets");
        targets = targets.filter((item) => {return item != id});
        this.setAttribute("targets", targets);
        // remove the target link
        const footer = this.shadowRoot.querySelector("#footer-bar");
        const linkContainer = footer.querySelector('#footer-right');
        linkContainer.querySelectorAll(`[data-id='${id}']`).forEach((item) => {item.remove()});
    }

    removeLink(event){
        event.stopPropagation();
        event.preventDefault();
        console.log(event.target);
        // remove the link and
        // tell the corresponding target worksheets to remove the link
        // TODO: maybe this should all be handled with custom events
        const id = event.target.getAttribute("data-id");
        const worksheet = document.getElementById(id);
        // NOTE: it's possible that the worksheet is null (for example it was
        // deleted earlier). In this case we should ignore, although TODO this should
        // all be better handled in a uniform model
        if(event.target.getAttribute("data-type") == "source"){
            this.removeSource(id);
            if(worksheet){
                worksheet.removeTarget(this.id);
            }
        } else {
            this.removeTarget(id);
            if(worksheet){
                worksheet.removeSource(this.id);
            }
        }
    }

    /**
      * Convert a DOM element attribute to a list
      */
    _attributeToList(name){
        let attr = this.getAttribute(name);
        if(!attr){
            attr = [];
        } else {
            attr = attr.split(",");
        }
        return attr;
    }

    /**
      * Create a DOM element from an SVG string
      * for both the source/target icon as well as the
      * unlink icon. Adds event listeners for mousenter and
      * mouseleave.
      */
    _createSourceTargetIconSpan(type, id, name){
        // make a reference to the source/target sheet
        // to update css on hover
        const sheet = document.getElementById(id);
        let iconString;
        if(type == "source"){
            iconString = icons.sheetImport;
        } else {
            iconString = icons.sheetExport;
        }
        const icon = createIconSVGFromString(iconString);
        const iconSpan = document.createElement("span");
        iconSpan.appendChild(icon);
        iconSpan.setAttribute("data-type", type);
        iconSpan.setAttribute("data-id", id);
        iconSpan.setAttribute("title", `${type}: ${name} (${id})`);
        // overlay the unlink icon
        const unlinkIcon = createIconSVGFromString(icons.unlink);
        unlinkIcon.setAttribute("data-type", type);
        unlinkIcon.setAttribute("data-id", id);
        unlinkIcon.style.display = 'none';
        iconSpan.addEventListener("click", this.removeLink);
        iconSpan.appendChild(unlinkIcon);
        iconSpan.addEventListener("mouseover", () => {
            unlinkIcon.style.display = "inherit";
            icon.style.display = "none";
            sheet.style.outline = "solid var(--palette-blue)";
        })
        iconSpan.addEventListener("mouseleave", () => {
            unlinkIcon.style.display = "none";
            icon.style.display = "inherit";
            sheet.style.outline = "initial";
        })
        return iconSpan;
    }

}

window.customElements.define("work-sheet", Worksheet);
