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
        source = this.matchAndInterpretReference(source);
        target = this.matchAndInterpretReference(target)[0].slice(1);
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
        return result;
    }
}

const copy = (sources, target) => {
    // NOTE: sources is a list
    replace(sources, target);
}


/**
 * I take source data a and b (of the form [worksheetId, worksheetSelection])
 * join them pairwise, ie. perform [a, b].join(s) for every entry in a and b,
 * respectively and copy the result to the target.
 */
const join = (sources, target, s) => {
    const a = sources[0].slice(1);
    const b = sources[1].slice(1);
    const [aWS, aOrigin, aCorner] = getOriginCornerElement(a);
    const [bWS, bOrigin, bCorner] = getOriginCornerElement(b);
    const [targetWS, targetOrigin, _] = getOriginCornerElement(target);
    const aDF = aWS.sheet.dataFrame.getDataSubFrame(aOrigin, aCorner);
    const bDF = bWS.sheet.dataFrame.getDataSubFrame(bOrigin, bCorner);
    bDF.apply((entry) => {
        if(entry){
            entry = s + entry;
        } else {
            entry = s;
        }
        return entry;
    });
    aDF.add(bDF);
    targetWS.sheet.dataFrame.copyFrom(aDF, targetOrigin);
}

const replace = (sources, target, d) => {
    // NOTE: sources is a list but replace assume there is a unique source
    // and the first entry is the name which we ignore for now TODO!
    const source = sources[0].slice(1);
    const [sourceWS, sourceOrigin, sourceCorner] = getOriginCornerElement(source);
    const [targetWS, targetOrigin, _] = getOriginCornerElement(target);
    const sourceDF = sourceWS.sheet.dataFrame.getDataSubFrame(sourceOrigin, sourceCorner);
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
    targetWS.sheet.dataFrame.copyFrom(sourceDF, targetOrigin);
}

const commandRegistry = {
    "copy": copy,
    "replace": replace,
    "join": join
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


/**
 * I take data of the form [worksheetID, worksheetSelection]
 * and return a list [worksheetElement, origin, corner] where
 * origin and corner are proper sheet coordinates [x, y]. 
 */
const getOriginCornerElement = (data) => {
    const [id, selection] = data;
    const [origin, corner] = selection;
    const ws = document.getElementById(id);
    // todo: sheet should really be able to handle tab references
    origin[0] = labelIndex(origin[0]);
    origin[1] = parseInt(origin[1]) - 1;
    corner[0] = labelIndex(corner[0]);
    corner[1] = parseInt(corner[1]) - 1;
    return [ws, origin, corner];
}

export {
    BasicInterpreter,
    labelIndex,
    BasicInterpreter as default
}
