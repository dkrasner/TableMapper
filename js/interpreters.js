/* Various interpreter to use with worksheet */
import {referenceGrammar as refG} from './ohm/reference.js';
import {referenceSemantics as refS} from './ohm/reference.js';
import {commandGrammar as comG} from './ohm/command.js';
import {commandSemantics as comS} from './ohm/command.js';

class BasicInterpreter extends Object {
    constructor(){
        super();

        this.interpret = this.interpret.bind(this);
    }

    interpret(instruction){
        // NOTE: [source, target, command] convention
        let [source, target, command] = instruction;
        return function(){
            console.log(command);
        };
    }
}

export {
    BasicInterpreter,
    BasicInterpreter as default
}
