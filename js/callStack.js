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
    }

    // to be implemented
    onStep(){
        return;
    }

    /* I increment the counter and reset it (to -1) if the end of the
       stack is reached. */
    step(){
        if(this.COUNTER == this.stack.length - 1){
            this.reset();
        } else {
            this.COUNTER += 1;
        }
        this.onStep();
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
}


export {
    EndOfStackError,
    CallStack,
    CallStack as default
}
