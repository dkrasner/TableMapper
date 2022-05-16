/**
   * Worksheet web component
   * -----------------------
   * The worksheep component is a sort of flexible container
   * which conains a sheet (or potentially something else tbd)
   * has a useable border and displays information about the work
   * being done.
   **/


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
    padding: 2px;

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
<div id="header-bar">THE BAR</div>
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

        // bind methods
        this.onMouseMoveInBar = this.onMouseMoveInBar.bind(this);
        this.onMouseDownInBar = this.onMouseDownInBar.bind(this);
        this.onMouseUpAfterDrag = this.onMouseUpAfterDrag.bind(this);
    }

    connectedCallback(){
        // set the palette
        this.style.backgroundColor = this.palette.this;
        this.shadowRoot.querySelector('my-grid').style.backgroundColor = this.palette.sheet;
        // add event listeners
        const bar = this.shadowRoot.querySelector('#header-bar');
        bar.addEventListener("mousedown", this.onMouseDownInBar);
    }

    disconnectedCallback(){
        // remove event listeners
        const bar = this.shadowRoot.querySelector('#header-bar');
        bar.removeEventListener("mousedown", this.onMouseDownInBar);
    }

    onMouseDownInBar(){
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


}

window.customElements.define("work-sheet", Worksheet);
