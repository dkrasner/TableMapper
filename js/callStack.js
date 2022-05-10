/**
  * TableMapper CallStack class
  * --------------------------------
  * Implementation of the call stack object, which handles
  * creating the stack, running commands and related.
  * The call stack is built from an 'editor' sheet.
  */


class CallStack extends Object {
    constructor(editor, commandRegistry){
        super();

        // an ap-sheet 'editor' element
        this.editor = editor;

        this.commandRegistry = commandRegistry;

        this.classStack = [];
        this.COUNTER = 0;

        // bind methods
        this.runNext = this.runNext.bind(this);
        this.runAll = this.runAll.bind(this);
        this.runCommand = this.runCommand.bind(this);
        this.buildCallStack = this.buildCallStack.bind(this);
    }

    runCommand(commandData){
        // assume commandData[0] is source coordinates
        // assume commandData[1] is target coordinates
        // assume commandData[2] is option pre-copy process function
        // the rest are additional optional function args
        const command = this.commandRegistry[commandData[0]]; // name
        if(command){
            command(commandData[0], commandData[1], ...commandData.slice(2));
        } else {
            // commands always copy data from one place to another
            // if the command is not present in the commandRegistry
            // we assume it's a 'raw' JS string method to be evaluted
            // TODO: this is insanely dangerous
            // NOTE: we are assuming that there no additional args passed to the
            // JS string method
            this.commandRegistry["default"](
                commandData[0], commandData[1], commandData[2]
            );
        }
    }

    runNext(){
        this.buildCallStack();
        if(this.COUNTER < this.callStack.length){
            const commandData = this.callStack[this.COUNTER];
            this.runCommand(commandData);
            this.COUNTER += 1;
        } else {
            this.COUNTER = 0;
        }
    }

    runAll(){
        this.buildCallStack();
        this.callStack.forEach((commandData) => {
            this.runCommand(commandData);
        })
    }

    buildCallStack(){
        // get all the rows with script data
        const editor = document.getElementById("editor");
        this.callStack = [];
        let rowNotEmpty = true;
        let rowIndex = 1; // first row is labels
        while(rowNotEmpty){
            let colNotEmpty = true;
            let colIndex = 0;
            const row = [];
            while(colNotEmpty){
                if(editor.dataFrame.store[`${colIndex},${rowIndex}`]){
                    const value = editor.dataFrame.store[`${colIndex},${rowIndex}`];
                    row.push(value);
                    colIndex += 1;
                } else {
                    colNotEmpty = false;
                    if(colIndex == 0){
                        rowNotEmpty = false;
                    }
                }
            }
            if(rowNotEmpty){
                this.callStack.push(row);
                rowIndex += 1;
            }
        }
    }

}

export {
    CallStack,
    CallStack as default
}
