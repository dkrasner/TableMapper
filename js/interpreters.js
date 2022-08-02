/* Various interpreter to use with worksheet */
import {referenceGrammar} from './ohm/reference.js';
import {referenceSemantics} from './ohm/reference.js';
import {commandGrammar} from './ohm/command.js';
import {commandSemantics} from './ohm/command.js';

class BasicInterpreter extends Object {
    constructor(){
        super();

        this.interpret = this.interpret.bind(this);
        this.matchAndInterpretCommand = this.matchAndInterpretCommand.bind(this);
        this.matchAndInterpretReference = this.matchAndInterpretReference.bind(this);
    }

    interpret(instruction){
        // NOTE: [source, target, command] convention
        let [source, target, command] = instruction;
        command = this.matchAndInterpretCommand(command);
        const [name, args] = command;
        // TODO: we are ignoring the name of the ref here!
        source = this.matchAndInterpretReference(source).slice(1);
        target = this.matchAndInterpretReference(target).slice(1);
        return function(){
            const exec = commandRegistry[name];
            return exec(source, target, args);
        };
    }

    matchAndInterpretCommand(s){
        const m = commandGrammar.match(s);
        if(m.failed()){
            alert(`I cannot parse ${s}`);
            // throw new Error(`NotUnderstood ${s}`);
            return;
        }
        const result = commandSemantics(m).interpret();
        if(!result){
            alert(`I cannot interpret ${s}`);
            // throw new Error(`NotKnown ${s}`);
            return;
        }
        return result;
    }

    matchAndInterpretReference(s){
        const m = referenceGrammar.match(s);
        if(m.failed()){
            alert(`I cannot parse ${s}`);
            // throw new Error(`NotUnderstood ${s}`);
            return;
        }
        const result = referenceSemantics(m).interpret();
        if(!result){
            alert(`I cannot interpret ${s}`);
            // throw new Error(`NotKnown ${s}`);
            return;
        }
        return result[0];
    }
}

const copy = (source, target) => {
    replace(source, target);
}

const replace = (source, target, d) => {
    const [sourceWSId, sourceWSSelection] = source;
    const [sourceWSOrigin, sourceWSCorner] = sourceWSSelection;
    const sourceWS = document.getElementById(sourceWSId);
    const [ targetWSId, targetWSSelection] = target;
    const [targetWSOrigin, _] = targetWSSelection;
    const targetWS = document.getElementById(targetWSId);

    sourceWSOrigin[0] = labelIndex(sourceWSOrigin[0]);
    sourceWSOrigin[1] = parseInt(sourceWSOrigin[1]) - 1;
    sourceWSCorner[0] = labelIndex(sourceWSCorner[0]);
    sourceWSCorner[1] = parseInt(sourceWSCorner[1]) - 1;

    targetWSOrigin[0] = labelIndex(targetWSOrigin[0]);
    targetWSOrigin[1] = parseInt(targetWSOrigin[1]) - 1;

    const sourceDF = sourceWS.sheet.dataFrame.getDataSubFrame(sourceWSOrigin, sourceWSCorner);
    if(d){
        sourceDF.apply((entry) => {
            if(entry){
                for(const key in d){
                    entry = entry.replaceAll(key, d[key]);
                }
            }
            return entry;
        })
    }

    // NOTE: this renders right away which we might want to deal with later for
    // performance reasons
    targetWS.sheet.dataFrame.copyFrom(sourceDF, targetWSOrigin);
}

const commandRegistry = {
    "copy": copy,
    "replace": replace
}


// Utils
/* I take a string like s="AA" and return its 'true'
   column index */
const labelIndex = (s) => {
    const index = letters.indexOf(s[0]) + (letters.length * (s.length - 1));
    if(!isNaN(index)){
        return index;
    }
    return s;
};

const letters = [
    "A","B","C","D","E","F","G","H",
    "I","J","K","L","M","N","O","P",
    "Q","R","S","T","U","V","W","X",
    "Y","Z"
];


export {
    BasicInterpreter,
    labelIndex,
    BasicInterpreter as default
}
