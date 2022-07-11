/** OHM JS implementation of sheet cell reference
    grammer and semantics.
    **/

import ohm from 'ohm-js';


const referenceGrammarSource = String.raw`
Reference {

    Ref = sheetId + "!" + Frame

    sheetId = idChar+

    idChar = ~"!" (letter | digit)

    Frame = coordinate + ":" + coordinate

    coordinate = upper+ digit+
}
`;

const g = ohm.grammar(referenceGrammarSource);

const referenceSemantics = g.createSemantics().addOperation('interpret', {
    Ref(id, exclamationLiteral, frame){
        return [id, frame];
    },

    sheetId(s) {
        return s;
    },

    coordinate(column, row) {
        return [column, row];
    },

    Frame(anchor, semiColonLIteral, corner){
        return [anchor, corner];
    },


});

export {
    referenceSemantics,
    g as referenceGrammar,
    referenceSemantics as default
}
