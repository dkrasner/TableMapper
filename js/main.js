/* Main */


document.addEventListener('DOMContentLoaded', () => {
    // add event listeners
    document.addEventListener("keydown", handleKeydown);
    // setup the sheets
    const main = document.getElementById("main");

    const sourceAndTarget = document.createElement("div");
    sourceAndTarget.setAttribute("id", "source-target-area");

    main.appendChild(sourceAndTarget);

    const source = document.createElement("div");
    const target = document.createElement("div");

    sourceAndTarget.appendChild(source);
    sourceAndTarget.appendChild(target);

    const sourceSheet = setupSheet(source, "source");
    const targetSheet = setupSheet(target, "target", true);

    const editor = document.createElement("div");
    editor.setAttribute("id", "editor-area");
    const editorSheet = setupSheet(editor, "editor", true);
    prepopulateEditor(editorSheet);

    main.appendChild(editor);
});


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


function handleKeydown(event){
    if(event.ctrlKey && event.key == "Enter"){
        // run the current scrip
        runScript();
    }
}

function runScript(){
    // get all the rows with script data
    const editor = document.getElementById("editor");
    const executionStack = [];
    let rowNotEmpty = true;
    let rowIndex = 0;
    while(rowNotEmpty){
        let colNotEmpty = true;
        let colIndex = 0;
        const row = [];
        while(colNotEmpty){
            if(editor.dataFrame.store[`${colIndex},${rowIndex}`]){
                row.push(editor.dataFrame.store[`${colIndex},${rowIndex}`]);
                colIndex += 1;
            } else {
                colNotEmpty = false;
                if(colIndex == 0){
                    rowNotEmpty = false;
                }
            }
        }
        if(rowNotEmpty){
            executionStack.push(row);
            rowIndex += 1;
        }
    }
    console.log(executionStack);
    // run the commands
    executionStack.forEach((commandData) => {
        const name = commandData[0];
        const source = commandData[1];
        const target = commandData[2];

        const command = commandRegistry[name];
        if(command){
            command(source, target);
        } else {
            alert(`"${name}" is not a known command`);
        }
    })
}

const commandRegistry = {
    "copy" : _onCopyCommand,
}

function _onCopyCommand(source, target){
    console.log(`going to copy ${source} to ${target}`);
}



// helper so I don't have to populate the editor sheet by hand each time
function prepopulateEditor(editor){
    editor.dataFrame.store["0,0"] = "copy";
    editor.dataFrame.store["1,0"] = "A";
    editor.dataFrame.store["2,0"] = "B";
    editor.dataFrame.store["0,1"] = "copy";
    editor.dataFrame.store["1,1"] = "A:2;C:4";
    editor.dataFrame.store["2,1"] = "C:3";
}
