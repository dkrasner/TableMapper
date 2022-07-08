/**
  * TableMapper System class
  * ------------------------
  * The System runs the application
  * UI, auth, events, etc
  */

import icons from './utils/icons.js';
import * as worksheet from './worksheet.js';

class System extends Object {
    constructor(){
        super();

        // bind methods
        this.setup = this.setup.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.addNewWorksheet = this.addNewWorksheet.bind(this);
        this.onNewSheetFocus = this.onNewSheetFocus.bind(this);
    }

    /* setup interface and services */
    setup(){
        const template = document.createElement("template");
        template.innerHTML = icons.sheet;
        const addSheetButton = template.content.childNodes[1];
        document.body.appendChild(addSheetButton);

        // event listeners
        addSheetButton.addEventListener("click", this.addNewWorksheet);
        document.addEventListener("newSheetFocus", this.onNewSheetFocus);
    }

    addNewWorksheet(){
        const newSheet = document.createElement("work-sheet");
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


