/** OHM JS implementation of sheet cell reference
    grammar and semantics.
    **/

import ohm from 'ohm-js';


const referenceGrammarSource = String.raw`
Reference {
    RefList = NonemptyListOf<Ref, ",">

    Ref = name ? sheetId + "!" + Frame

    name = "<" namechar+ ">"

    namechar = alnum | "_" | "-"

    sheetId = uuid

    uuid = hexDigit+ "-" hexDigit+ "-" hexDigit+ "-" hexDigit+ "-" hexDigit+

    Frame = coordinate + ":" + coordinate

    coordinate = alnumCoord | cartesianCoord 

    alnumCoord = upper+ digit*

    cartesianCoord = "(" digit* space* "," space* digit* ")"
}
`;

const g = ohm.grammar(referenceGrammarSource);

const referenceSemantics = g.createSemantics().addOperation('interpret', {

    RefList(items){
        return items.asIteration().children.map(child => {
            return child.interpret();
        })
    },

    Ref(name, id, exclamationLiteral, frame){
        if(name.sourceString){
            name = name.interpret()[0];
        } else {
            name = null;
        }
        return [name, id.interpret()[0], frame.interpret()];
    },

    name(leftAngle, name, rightAngle){
        return name.sourceString;
    },

    sheetId(s) {
        return s.sourceString;
    },

    coordinate(c) {
        return c.interpret();
    },

    alnumCoord(column, row) {
        return [column.sourceString, row.sourceString];
    },

    cartesianCoord(leftParenthesis, x, space1, comma, space2, y, rightParenthesis){
        return [x.sourceString, y.sourceString];
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
