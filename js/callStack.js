/**
  * Worksheet CallStack class
  * --------------------------------
  * Implementation of the call stack object, which handles
  * creating the stack, running commands and related.
  * The call stack is built from an 'editor' sheet.
  */

const EndOfStackError = new Error("End Of Stack");

class CallStack extends Object {
    constructor(interpreter){
        super();

        // an ap-sheet 'editor' element
        // this.editor = editor;

        // this.commandRegistry = commandRegistry;

        this.interpreter = interpreter;
        this.stack = [];
        this.COUNTER = -1;

        // bind methods
        this.step = this.step.bind(this);
        this.execute = this.execute.bind(this);
        this.run = this.run.bind(this);
        this.jump = this.jump.bind(this);
        this.reset = this.reset.bind(this);
        this.load = this.load.bind(this);
        this.append = this.append.bind(this);
        // OLD TODO: remove?
        this.runNext = this.runNext.bind(this);
        this.runAll = this.runAll.bind(this);
        this.runCommand = this.runCommand.bind(this);
        this.buildCallStack = this.buildCallStack.bind(this);
    }

    /* I increment the counter and reset it (to -1) if the end of the
       stack is reached. */
    step(){
        if(this.COUNTER == this.stack.length - 1){
            this.reset();
        } else {
            this.COUNTER += 1;
        }
    }

    /* I execute the next command on the callstack
       if there is a next command */
    execute(){
        if(this.COUNTER == -1){
            throw EndOfStackError;
        }
        const entry = this.stack[this.COUNTER]
        const executable = this.interpreter.interpret(entry)
        return executable();
    }

    /* I run commands from this.COUNTER to the end of the stack */
    run(){
        if(this.COUNTER == -1){
            this.step();
        }
        while(this.COUNTER != -1){
            this.execute();
            this.step();
        }
    }

    /* I reset the counter */
    reset(){
        this.COUNTER = -1;
    }

    /* I jump to by specified number of steps
       either incrementing or decrementing */
    jump(n){
        this.COUNTER  += n;
        // reset the counter if out of range
        if(this.COUNTER < 0 || this.COUNTER > this.stack.length - 1 ){
            this.reset();
        }
    }i

    /* I load a new set of instruction and reset the counter */
    load(instructions){
        this.reset();
        this.stack = [];
        instructions.forEach((item) => {
            // TODO: might want to have better checks here
            // TODO: throw warning or error here if check fails?
            if(item){
                this.stack.push(item);
            }
        })
    }

    append(instruction){
        // TODO: throw warning or error here if check fails?
        if(instruction){
            this.stack.push(instruction);
        }
    }

    runCommand(commandData){
        // assume commandData[0] is source coordinates
        // assume commandData[1] is target coordinates
        // assume commandData[2] is option pre-copy process function
        // the rest are additional optional function args
        const command = this.commandRegistry[commandData[2]]; // name
        if(command){
            // note the spread operator for args stars with index=3, since
            // index=2 is the command name
            command(commandData[0], commandData[1], ...commandData.slice(3));
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

    runNext(sources, targets){
        if(sources.length > 1){
            alert("I don't know how to run commands with multiple sources!");
            return;
        }
        this.buildCallStack(sources, targets);
        if(this.COUNTER < this.callStack.length){
            const commandData = this.callStack[this.COUNTER];
            this.runCommand(commandData);
            this.COUNTER += 1;
        } else {
            this.COUNTER = 0;
        }
    }

    runAll(sources, targets){
        if(sources.length > 1){
            alert("I don't know how to run commands with multiple sources!");
            return;
        }
        this.buildCallStack(sources, targets);
        this.callStack.forEach((commandData) => {
            this.runCommand(commandData);
        })
    }

    buildCallStack(sources, targets){
        // get all the rows with script data
        // NOTE: we assume that data in column 0 is the source
        // and data in column 1 is the targets
        // we use the google sheets convention to signal a sheet reference:
        // Sheet_ref!CELL_DATA
        // if not reference is present we add the sources and targets reference provided
        // TODO: for now assume that there is only one source and target
        const source = sources[0];
        this.callStack = [];
        let rowNotEmpty = true;
        let rowIndex = 0;
        while(rowNotEmpty){
            let colNotEmpty = true;
            let colIndex = 0;
            const row = [];
            while(colNotEmpty){
                if(this.editor.dataFrame.store[`${colIndex},${rowIndex}`]){
                    let value = this.editor.dataFrame.store[`${colIndex},${rowIndex}`];
                    // check to see if we need to add source and target data
                    if(colIndex == 0){
                        if(!value.match("!")){
                            value = `${source}!${value}`;
                        }
                    }
                    if(colIndex == 1){
                        if(!value.match("!")){
                            value = targets.map((item) => {
                                return `${item}!${value}`
                            }).join("|");
                        }
                    }
                    row.push(value);
                    colIndex += 1;
                    // put in a safety escape in case this is run on a non editor sheet
                    if(colIndex > 10){
                        alert("There are no commands to run in this sheet");
                        return;
                    }
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
    EndOfStackError,
    CallStack,
    CallStack as default
}
