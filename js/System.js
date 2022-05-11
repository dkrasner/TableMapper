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
        this.setupEditor = this.setupEditor.bind(this);
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

        setupSheet(source, "source", false, 5, 50);
        setupSheet(target, "target", true, 5, 50);

        this.setupEditor(main);

        document.addEventListener("keydown", this.keydownHandler);
    }

    setupEditor(parent){
        // TODO: I think editor should really sublcass the sheet
        const editor = document.createElement("div");
        editor.setAttribute("id", "editor-area");
        const editorBar = document.createElement("div");
        editorBar.classList.add("bar");
        editorBar.textContent = "Editor";
        editor.appendChild(editorBar);
        // setup initial editor location
        // setup mouse move for the editor
        editorBar.addEventListener("mousedown", (event) => {
            event.stopPropagation();
            const shiftX = event.clientX - editor.getBoundingClientRect().left;
            const shiftY = event.clientY - editor.getBoundingClientRect().top;
            function move(event){
                editor.style.setProperty("left", event.pageX - shiftX + 'px');
                editor.style.setProperty("top", event.pageY - shiftY + 'px');
            }
            document.addEventListener("mousemove", move);
            editorBar.addEventListener("mouseup", () => {
                document.removeEventListener("mousemove", move);
            });
        });
        const editorSheet = setupSheet(editor, "editor", true, 5, 10);
        // TODO: take this out later
        prepopulateEditor(editorSheet);
        parent.appendChild(editor);
        // first row is named and locked
        editorSheet.dataFrame.putAt([0, 0], "source");
        editorSheet.dataFrame.putAt([1, 0], "target");
        editorSheet.dataFrame.putAt([2, 0], "function");
        editorSheet.setAttribute("lockedrows", 1);
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

function setupSheet(parent, type, clear, numCols, numRows){
    const sheet = document.createElement("my-grid");
    sheet.setAttribute("id", type);
    sheet.setAttribute("columns", numCols);
    sheet.setAttribute("rows", numRows);
    sheet.setAttribute("expands", true);
    if(clear){
        sheet.dataFrame.clear();
    }
    parent.appendChild(sheet);
    return sheet;
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


