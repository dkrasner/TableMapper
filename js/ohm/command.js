
/** OHM JS implementation of sheet cell command
    grammar and semantics.
    **/

import ohm from 'ohm-js';


const commandGrammarSource = String.raw`
Command {
    Command = Copy | Replace | Join | Average | Median | Sum | Max | Min

    Copy = "copy" "()"

    Replace = "replace" + "(" + ReplaceArg + ")"

    Join = "join" + "(" + stringLiteral + ")"

    Sum = "sum" "()"

    Max = "max" "()"

    Min = "min" "()"

    Median = "median" "()"

    Average = "average" "()"

    ReplaceArg = nonemptyListOf<KeyVal, lineTerminator>

    KeyVal = stringLiteral + ":" + (stringLiteral | digit+)

    stringLiteral = quoteMark (~lineTerminator ~quoteMark any)* quoteMark

    lineTerminator = "\n" | "\r" | "\u2028" | "\u2029" | "\r\n"

    quoteMark = "\"" | "\'"
}
`;

const g = ohm.grammar(commandGrammarSource);

const commandSemantics = g.createSemantics().addOperation('interpret', {

    Command(item){
        return item.interpret();
    },

    Copy(copyLiteral, brackets){
        return [copyLiteral.sourceString, ""]; // NOTE: current convention of [name, args]
    },

    Replace(replaceLiteral, leftBracket, d, rightBracket){
        return [replaceLiteral.sourceString, d.interpret()[0]];
    },

    Join(joinLiteral, leftBracket, s, rightBracket){
        return [joinLiteral.sourceString, s.interpret()[0]];
    },

    Sum(sumLiteral, brackets){
        return [sumLiteral.sourceString, ""];
    },

    Max(maxLiteral, brackets){
        return [maxLiteral.sourceString, ""];
    },

    Min(minLiteral, brackets){
        return [minLiteral.sourceString, ""];
    },

    Sum(sumLiteral, brackets){
        return [sumLiteral.sourceString, ""];
    },

    Median(medianLiteral, brackets){
        return [medianLiteral.sourceString, ""];
    },

    Average(averageLiteral, brackets){
        return [averageLiteral.sourceString, ""];
    },

    ReplaceArg(kvList){
        return kvList.asIteration().children.map(item => item.interpret());
    },

    KeyVal(firstStringLiteral, colonLiteral, stringLiteralOrDigit){
        let [first, second] = [firstStringLiteral.interpret(), stringLiteralOrDigit.interpret()];
        if (first instanceof Array){
            first = first[0];
        }
        if (second instanceof Array){
            second = second[0];
        }
        return [first, second];
    },

    digit(d){
        return d.sourceString;
    },

    stringLiteral(quoteLeftLiteral, s, quoteRightLiteral){
        return s.sourceString;
    },

    _iter(...children) {
        return children.map(c => c.interpret());
    }

});

export {
    commandSemantics,
    g as commandGrammar,
    commandSemantics as default
}
