/**
  * TableMapper System class
  * ------------------------
  * The System runs the application
  * UI, auth, events, etc
  */

import CallStack from './callStack.js'
import commandRegistry from './commandRegistry.js'


class System extends Object {
    constructor(){
        super();
        this.callStack;
        this.commandRegistry = commandRegistry;

        // bind methods
        this.setup = this.setup.bind(this);
        this.setupInterface = this.setupInterface.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
    }

    /* setup interface and services */
    setup(){
        this.setupInterface();
        const editor = document.getElementById("editor");
        this.callStack = new CallStack(editor, this.commandRegistry);
    }

    setupInterface(){
        const main = document.getElementById("main");
        const sourceAndTarget = document.createElement("div");
        sourceAndTarget.setAttribute("id", "source-target-area");

        main.appendChild(sourceAndTarget);

        const source = document.createElement("div");
        const target = document.createElement("div");
        sourceAndTarget.appendChild(source);
        sourceAndTarget.appendChild(target);

        setupSheet(source, "source");
        setupSheet(target, "target", true);
        const editor = document.createElement("div");
        editor.setAttribute("id", "editor-area");
        const editorSheet = setupSheet(editor, "editor", true);
        // TODO: take this out later
        prepopulateEditor(editorSheet);
        main.appendChild(editor);

        document.addEventListener("keydown", this.keydownHandler);
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

function setupSheet(parent, type, clear){
    const sheet = document.createElement("my-grid");
    sheet.setAttribute("id", type);
    sheet.setAttribute("columns", 5);
    sheet.setAttribute("rows", 20);
    if(clear){
        sheet.dataFrame.clear();
    }
    parent.appendChild(sheet);
    return sheet;
}

// helper so I don't have to populate the editor sheet by hand each time
function prepopulateEditor(editor){
    editor.dataFrame.store["0,0"] = "copy";
    editor.dataFrame.store["1,0"] = "(2,0):(2,10)";
    editor.dataFrame.store["2,0"] = "(3,0)";
    editor.dataFrame.store["0,1"] = "copy";
    editor.dataFrame.store["1,1"] = "(0,2):(3,4)";
    editor.dataFrame.store["2,1"] = "(0,3)";
}

export {
    System,
    System as default
}


