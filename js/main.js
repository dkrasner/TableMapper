/* Main */
//import {Point} from '../ap-sheet/src/Point.js'


// call stack counter
var COUNTER = 0;

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
        if(event.shiftKey){
            runNext();
        } else {
            runAll();
        }
    }
}

function runCommand(commandData){
    const name = commandData[0];
    const source = commandData[1];
    const target = commandData[2];
    const arg = commandData[3];

    const command = commandRegistry[name];
    if(command){
        command(source, target, arg);
    } else {
        alert(`"${name}" is not a known command`);
    }
}

function runAll(){
    const callStack = buildCallStack();
    callStack.forEach((commandData) => {
        runCommand(commandData);
    })
}

function runNext(){
    const callStack = buildCallStack();
    if(COUNTER < callStack.length){
        const commandData = callStack[COUNTER];
        runCommand(commandData);
        COUNTER += 1;
    } else {
        COUNTER = 0;
    }
}

function buildCallStack(){
    // get all the rows with script data
    const editor = document.getElementById("editor");
    const callStack = [];
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
            callStack.push(row);
            rowIndex += 1;
        }
    }
    return callStack;
}


const commandRegistry = {
    "copy" : _onCopyCommand,
}

function _onCopyCommand(source, target, arg){
    console.log(`going to copy ${source} to ${target}`);
    const sourceSheet = document.getElementById("source");
    const targetSheet = document.getElementById("target");
    const [sourceOrigin, sourceCorner] = source.split(":");
    const [sourceOriginX, sourceOriginY] = parseCoordinates(sourceOrigin);
    const [sourceCornerX, sourceCornerY] = parseCoordinates(sourceCorner);
    const [targetOriginX, targetOriginY] = parseCoordinates(target);
    // iterate over the coordinates and fill in target sheet data values
    let currentX = sourceOriginX;
    let currentY = sourceOriginY;
    let targetX = targetOriginX;
    let targetY = targetOriginY;
    while (currentX <= sourceCornerX){
        while(currentY <= sourceCornerY){
            let value = sourceSheet.dataFrame.getAt([currentX, currentY]);
            // the presence of an arg tell us that we should apply it to the string
            // in the JS way
            if(arg){
                value = eval(`'${value}'.${arg}`);
            }
            targetSheet.dataFrame.putAt([targetX, targetY], value);
            currentY += 1;
            targetY += 1;
        }
        currentX += 1;
        currentY = sourceOriginY;
        targetX += 1;
        targetY = targetOriginY;
    }
}

/*
  I parse the coordinates string and
  set the sheet.selector.selectionFrame to the corresponding
  selection.
  */
function selectCells(sheet, coordinates){
    let [origin, corner] = coordinates.split(":");
    origin = parseCoordinates(origin);
    if(corner !== undefined){
        corner = parseCoordinates(corner);
        sheet.selector.set(origin, corner);
    } else {
        sheet.selector.setAnchorToElement(origin, origin);
    }
}

/*
  I parse a coordinate in the form "(A,B)"
  and return a [a,b] int list.
  */
function parseCoordinates(coordinates){
    let [x, y] = coordinates.replace(/[()]/g,"").split(",");
    x = parseInt(x);
    y = parseInt(y);
    return [x, y];
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
