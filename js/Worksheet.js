/**
   * Worksheet web component
   * -----------------------
   * The worksheep component is a sort of flexible container
   * which conains a sheet (or potentially something else tbd)
   * has a useable border and displays information about the work
   * being done.
   **/


// icons
const eraserIcon = `
<svg xmlns="http://www.w3.org/2000/svg" id="erase" class="icon icon-tabler icon-tabler-eraser" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <path d="M19 19h-11l-4 -4a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9 9" />
  <line x1="18" y1="12.3" x2="11.7" y2="6" />
</svg>`;

const deleteIcon = `
<svg xmlns="http://www.w3.org/2000/svg" id="delete" class="icon icon-tabler icon-tabler-square-x" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <rect x="4" y="4" width="16" height="16" rx="2" />
  <path d="M10 10l4 4m0 -4l-4 4" />
</svg>`;

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
    padding: 3px;
    outline: none !important;
}

#header-bar > input.show {
    display: inline-flex;
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
    ${deleteIcon}
    <span>A worksheet</span>
    <input></input>
    ${eraserIcon}
</div>
<div id="sheet-container">
    <my-grid expands=true columns=5 rows=10></my-grid>
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

        // generate a random palette for the worksheet
        this.palette = paletteCombinations[Math.floor(Math.random() * paletteCombinations.length)];

        // name for the worksheet. Note: this is the name found in the bar area
        // and also in the this.name attribute for querying and listening for changes
        this.name = "";
        this.isEditingName = false;

        // bind methods
        this.onMouseMoveInBar = this.onMouseMoveInBar.bind(this);
        this.onMouseDownInBar = this.onMouseDownInBar.bind(this);
        this.onMouseUpAfterDrag = this.onMouseUpAfterDrag.bind(this);
        this.onNameDblClick = this.onNameDblClick.bind(this);
        this.onNameKeydown = this.onNameKeydown.bind(this);
        this.updateName = this.updateName.bind(this);
        this.onErase = this.onErase.bind(this);
        this.onDelete = this.onDelete.bind(this);
    }

    connectedCallback(){
        // set the palette
        this.style.backgroundColor = this.palette.this;
        this.shadowRoot.querySelector('my-grid').style.backgroundColor = this.palette.sheet;

        const bar = this.shadowRoot.querySelector('#header-bar');
        const name = bar.querySelector('span');
        const eraseButton = bar.querySelector("#erase");
        const deleteButton = bar.querySelector("#delete");

        // set the name to default
        this.updateName("The worksheet");

        // add event listeners
        bar.addEventListener("mousedown", this.onMouseDownInBar);
        name.addEventListener("dblclick", this.onNameDblClick);
        eraseButton.addEventListener("click", this.onErase);
        deleteButton.addEventListener("click", this.onDelete);
    }

    disconnectedCallback(){
        // remove event listeners
        const bar = this.shadowRoot.querySelector('#header-bar');
        bar.removeEventListener("mousedown", this.onMouseDownInBar);
    }

    onMouseDownInBar(){
        // dispatch an event to put the sheet in focus
        const event = new CustomEvent(
            'newSheetFocus',
            {
                bubbles: true,
                detail: {target: this}
            }
        );
        this.dispatchEvent(event);
        document.addEventListener('mousemove', this.onMouseMoveInBar);
        document.addEventListener('mouseup', this.onMouseUpAfterDrag);
    }

    onMouseUpAfterDrag(){
        document.removeEventListener('mouseup', this.onMouseUpAfterDrag);
        document.removeEventListener('mousemove', this.onMouseMoveInBar);
    }

    onMouseMoveInBar(event){
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
        const bar = this.shadowRoot.querySelector('#header-bar');
        const nameSpan = bar.querySelector('span');

        this.name = name;
        this.setAttribute("name", name);
        nameSpan.textContent = this.name;
    }

    startEditingName(){
        this.isEditingName = true;
        const bar = this.shadowRoot.querySelector('#header-bar');
        const nameSpan = bar.querySelector('span');
        nameSpan.classList.add("hide");
        const input = bar.querySelector('input');
        input.classList.add('show');
        input.value = this.name;
        input.addEventListener('keydown', this.onNameKeydown);
        // input.addEventListener('blur', this.handleInputBlur);
        input.focus();
    }

    stopEditingName(){
        this.isEditingName = false;
        const bar = this.shadowRoot.querySelector('#header-bar');
        const input = bar.querySelector('input');
        const nameSpan = bar.querySelector('span');
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
}

window.customElements.define("work-sheet", Worksheet);
