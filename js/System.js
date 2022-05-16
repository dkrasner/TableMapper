/**
  * TableMapper System class
  * ------------------------
  * The System runs the application
  * UI, auth, events, etc
  */

//import CallStack from './callStack.js'
import commandRegistry from './commandRegistry.js'


// adding a sheet button (NOTE: should be moved to an app wide icon store)

const sheetIcon = `
<svg xmlns="http://www.w3.org/2000/svg" id="sheet" class="icon icon-tabler icon-tabler-table" width="44" height="44" viewBox="0 0 24 24" stroke-width="1.5" stroke="#2c3e50" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
  <rect x="4" y="4" width="16" height="16" rx="2" />
  <line x1="4" y1="10" x2="20" y2="10" />
  <line x1="10" y1="4" x2="10" y2="20" />
</svg>`;

class System extends Object {
    constructor(){
        super();
        this.allSheets = [];
        this.callStack;
        this.commandRegistry = commandRegistry;

        // bind methods
        this.setup = this.setup.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.addNewWorksheet = this.addNewWorksheet.bind(this);
        this.onNewSheetFocus = this.onNewSheetFocus.bind(this);
    }

    /* setup interface and services */
    setup(){
        const template = document.createElement("template");
        template.innerHTML = sheetIcon;
        const addSheetButton = template.content.childNodes[1];
        document.body.appendChild(addSheetButton);
        // this.callStack = new CallStack(editor, this.commandRegistry);

        // event listeners
        addSheetButton.addEventListener("click", this.addNewWorksheet);
        document.addEventListener("newSheetFocus", this.onNewSheetFocus);
    }

    addNewWorksheet(){
        const newSheet = document.createElement("work-sheet");
        this.allSheets.push(sheet);
        document.body.appendChild(newSheet);
    }

    onNewSheetFocus(event){
        // set the z-index to 1 for all sheets
        // and set z-index to 2 for the target sheet
        // TODO: we'll have to do this better
        document.querySelectorAll("work-sheet").forEach((sheet) => {
            sheet.style.setProperty("z-index", 1);
        })
        event.target.style.setProperty("z-index", 2);
    }

    keydownHandler(event){
        if(event.ctrlKey && event.key == "Enter"){
            if(event.shiftKey){
                this.callStack.runNext();
            } else {
                this.callStack.runAll();
            }
        }
    }
}


// helper so I don't have to populate the editor sheet by hand each time
function prepopulateEditor(editor){
    editor.dataFrame.store["0,1"] = "(2,0):(2,10)";
    editor.dataFrame.store["1,1"] = "(3,0)";
    editor.dataFrame.store["2,1"] = "replace";
    editor.dataFrame.store["3,1"] = "1:ONE; 2:TWO";
    editor.dataFrame.store["0,2"] = "(0,2):(3,4)";
    editor.dataFrame.store["1,2"] = "(0,3)";
}

export {
    System,
    System as default
}


