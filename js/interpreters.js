/* Various interpreter to use with worksheet */
import {referenceGrammar} from './ohm/reference.js';
import {referenceSemantics} from './ohm/reference.js';
import {commandGrammar} from './ohm/command.js';
import {commandSemantics} from './ohm/command.js';

class BasicInterpreter extends Object {
    constructor(command_registry=commandRegistry){
        super();

        this.command_registry = command_registry;

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
            const exec = this.command_registry[name].command;
            return exec(source, target, args);
        }.bind(this);
    }

    matchAndInterpretCommand(s){
        const m = commandGrammar.match(s);
        if(m.failed()){
            console.log(s)
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
/**
const join = (sources, target, s) => {
    const a = sources[0].slice(1);
    const b = sources[1].slice(1);
    const [aWS, aOrigin, aCorner] = getOriginCornerElement(a);
    const [bWS, bOrigin, bCorner] = getOriginCornerElement(b);
    const [targetWS, targetOrigin, _] = getOriginCornerElement(target);
    // TODO!
    const aDF = aWS.sheet.dataStore.getDataSubFrame(aOrigin, aCorner);
    const bDF = bWS.sheet.dataStore.getDataSubFrame(bOrigin, bCorner);
    bDF.apply((entry) => {
        if(entry){
            entry = s + entry;
        } else {
            entry = s;
        }
        return entry;
    });
    aDF.add(bDF);
    targetWS.sheet.dataStore.copyFrom(aDF, targetOrigin);
}
**/

const replace = (sources, target, d) => {
    // NOTE: sources is a list but replace assume there is a unique source
    // and the first entry is the name which we ignore for now TODO!
    const source = sources[0].slice(1);
    const [sourceWS, sourceOrigin, sourceCorner] = getOriginCornerElement(source);
    const [targetWS, targetOrigin, _] = getOriginCornerElement(target);
    sourceWS.sheet.dataStore.getDataArray(
        sourceOrigin,
        sourceCorner
    ).then(
        (resultDataArray) => {
            resultDataArray.forEach((row, xIndex) => {
                row.forEach((entry, yIndex) => {
                    if(entry){
                        if(d){
                            d.forEach((item) => {
                                entry = entry.replaceAll(item[0], item[1]);
                            })
                        }
                        row[yIndex] = entry;
                    }
                })
                resultDataArray[xIndex] = row;
            })
            // NOTE: this renders right away which we might want to deal with later for
            // performance reasons
            targetWS.sheet.dataStore.loadFromArray(resultDataArray, targetOrigin);
        }
    );
}

const sum = (sources, target) => {
    const source = sources[0].slice(1);
    const [sourceWS, sourceOrigin, sourceCorner] = getOriginCornerElement(source);
    const [targetWS, targetOrigin, _] = getOriginCornerElement(target);
    sourceWS.sheet.dataStore.getDataArray(
        sourceOrigin,
        sourceCorner
    ).then(
        (resultDataArray) => {
            const sum = _sum(resultDataArray);
            targetWS.sheet.dataStore.putAt(targetOrigin, sum);
        }
    );
}

const average = (sources, target) => {
    const source = sources[0].slice(1);
    const [sourceWS, sourceOrigin, sourceCorner] = getOriginCornerElement(source);
    const sourceSize = (sourceCorner[0] - sourceOrigin[0] + 1) * (sourceCorner[1] - sourceOrigin[1] + 1);
    const [targetWS, targetOrigin, _] = getOriginCornerElement(target);
    sourceWS.sheet.dataStore.getDataArray(
        sourceOrigin,
        sourceCorner
    ).then(
        (resultDataArray) => {
            const sum = _sum(resultDataArray);
            const ave = sum / sourceSize;
            targetWS.sheet.dataStore.putAt(targetOrigin, ave);
        }
    );
}

const max = (sources, target) => {
    const source = sources[0].slice(1);
    const [sourceWS, sourceOrigin, sourceCorner] = getOriginCornerElement(source);
    const [targetWS, targetOrigin, _] = getOriginCornerElement(target);
    sourceWS.sheet.dataStore.getDataArray(
        sourceOrigin,
        sourceCorner
    ).then(
        (resultDataArray) => {
            targetWS.sheet.dataStore.putAt(targetOrigin, _max_min(resultDataArray, ">"));
        }
    );
}

const min = (sources, target) => {
    const source = sources[0].slice(1);
    const [sourceWS, sourceOrigin, sourceCorner] = getOriginCornerElement(source);
    const [targetWS, targetOrigin, _] = getOriginCornerElement(target);
    sourceWS.sheet.dataStore.getDataArray(
        sourceOrigin,
        sourceCorner
    ).then(
        (resultDataArray) => {
            targetWS.sheet.dataStore.putAt(targetOrigin, _max_min(resultDataArray, "<"));
        }
    );
}

const median = (sources, target) => {
    const source = sources[0].slice(1);
    const [sourceWS, sourceOrigin, sourceCorner] = getOriginCornerElement(source);
    const [targetWS, targetOrigin, _] = getOriginCornerElement(target);
    const numRows = sourceCorner[1] - sourceOrigin[1] + 1;
    const numColumns = sourceCorner[0] - sourceOrigin[0] + 1;
    sourceWS.sheet.dataStore.getDataArray(
        sourceOrigin,
        sourceCorner
    ).then(
        (resultDataArray) => {
            targetWS.sheet.dataStore.putAt(
                targetOrigin,
                _median(resultDataArray, numRows, numColumns)
            );
        }
    );
}

const commandRegistry = {
    "copy": {
        command: copy,
        description: "Copy the contents\n(This command takes no arguments)",
        args: false
    },
    "replace": {
        command: replace,
        description: 'Replace content with new\n' +
            'Use a ":" where the keys and values specify\n' +
            'what and with-what to replace, respectively.\n' +
            '(Example:\n' +
            '"1": "ONE"\n' +
            '"2": "TWO"\n' +
            'will replace 1 with ONE and 2 with TWO)\n'
        ,
        args: true
    },
    /**
    "join": {
        command: join,
        description: "Join multiple sources using provided string",
        args: true
    },
    **/
    "sum": {
        command: sum,
        description: "Sum the selected values",
        args: false
    },
    "average": {
        command: average,
        description: "Get the average of the selected values",
        args: false
    },
    "median": {
        command: median,
        description: "Get the median of the selected values",
        args: false
    },
    "max": {
        command: max,
        description: "Get the maximum of the selected values",
        args: false
    },
    "min": {
        command: min,
        description: "Get the minimum of the selected values",
        args: false
    },
}


// Utils
// Basic arithmetic utils
const _sum = (ndarray) => {
    let ret = 0;
    ndarray.forEach((row) => {
        row.forEach((entry) => {
            if (isNaN(entry)) {
                ret = NaN;
            }
            ret += parseFloat(entry);
        })
    })
    return ret;
}

const _max_min = (ndarray, which=">") => {
    let ret = ndarray[0][0];
    ndarray.forEach((row) => {
        row.forEach((entry) => {
            if (isNaN(entry)) {
                ret = NaN;
            }
            entry = parseFloat(entry);
            if (eval(`${entry} ${which} ${ret}`)) {
                ret = entry;
            }
        })
    })
    return ret;
}

/**
  * I returned the median of the flatted sheet.
  **/
const _median = (ndarray, numRows, numColumns) => {
    // if the numbers of rows is odd, ie df.size.y % 2 == 0
    // then take the middle row
    let m;
    let anyNaN = 0;
    ndarray.forEach((row) => {
        row.forEach((entry) => {
            if(isNaN(entry)){
                anyNaN = NaN;
            }
        })
    })
    if (isNaN(anyNaN)) {
        return NaN;
    }
    if (numRows % 2 == 1) {
        const y = (numRows - 1) / 2;
        if(numColumns % 2 == 1) {
            const x = (numColumns - 1) / 2;
            m = ndarray[y][x];
        } else {
            const x1 = numColumns / 2;
            const x2 = x1 - 1;
            m = (ndarray[y][x1] + ndarray[y][x2]) / 2;
        }
    } else {
        const y1 = numRows / 2;
        const y2 = y1 - 1;
        m = (ndarray[y1][0] + ndarray[y2][numColumns - 1]) / 2;
    }
    return parseFloat(m);
}

/**
  * I take a string like s="AA" and return its 'true'
  * column index. Otherwise I try to parse the string to an int.
  * If all fails I return the original.
  **/
const labelIndex = (s) => {
    const index = letters.indexOf(s[0]) + (letters.length * (s.length - 1));
    if(!isNaN(index) && index > -1){
        return index - 1;
    } else if(!isNaN(parseInt(s))){
        return parseInt(s);
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
    origin[1] = parseInt(origin[1]);
    corner[0] = labelIndex(corner[0]);
    corner[1] = parseInt(corner[1]);
    return [ws, origin, corner];
}

export {
    BasicInterpreter,
    labelIndex,
    BasicInterpreter as default
}
