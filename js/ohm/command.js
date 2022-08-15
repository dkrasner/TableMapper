
/** OHM JS implementation of sheet cell command
    grammar and semantics.
    **/

import ohm from 'ohm-js';


const commandGrammarSource = String.raw`
Command {
    Command = Copy | Replace | Join

    Copy = "copy" "()"

    Replace = "replace" + "(" + Dict + ")"

    Join = "join" + "(" + stringLiteral + ")"

    Dict = "{" + NonemptyListOf<KeyVal, ","> + "}"

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

    Dict(leftBracket, kvList, rightBracket){
        let d = leftBracket.sourceString + kvList.sourceString + rightBracket.sourceString;
        // NOTE: JSON.parse doesn't like single quotes; we could prob parse/build the dict ourselves
        d = d.replaceAll("'", '"');
        return JSON.parse(d);
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
