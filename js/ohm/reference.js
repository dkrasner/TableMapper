/** OHM JS implementation of sheet cell reference
    grammer and semantics.
    **/

import ohm from 'ohm-js';


const referenceGrammarSource = String.raw`
Reference {
    RefList = NonemptyListOf<Ref, ",">

    Ref = sheetId + "!" + Frame

    sheetId = uuid

    uuid = hexDigit+ "-" hexDigit+ "-" hexDigit+ "-" hexDigit+ "-" hexDigit+

    Frame = coordinate + ":" + coordinate

    coordinate = upper+ digit*
}
`;

const g = ohm.grammar(referenceGrammarSource);

const referenceSemantics = g.createSemantics().addOperation('interpret', {

    RefList(items){
        return items.asIteration().children.map(child => {
            return child.interpret();
        })
    },

    Ref(id, exclamationLiteral, frame){
        return [id.interpret()[0], frame.interpret()];
    },

    sheetId(s) {
        return s.sourceString;
    },

    coordinate(column, row) {
        return [column.sourceString, row.sourceString];
    },

    Frame(anchor, semiColonLIteral, corner){
        // TODO sort out why anchor is wrapped in an extra []'s'
        return [anchor.interpret()[0], corner.interpret()];
    },

    _iter(...children) {
        return children.map(c => c.interpret());
    }

});

export {
    referenceSemantics,
    g as referenceGrammar,
    referenceSemantics as default
}
