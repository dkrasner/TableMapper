import { expect, assert } from 'chai';

import {commandGrammar as g} from '../js/ohm/command.js';
import {commandSemantics as semantics} from '../js/ohm/command.js';


const matchTest = (str) => {
    const match = g.match(str);
    assert.isTrue(match.succeeded());
};
const semanticMatchTest = (str, semanticType) => {
    const typeMatch = g.match(str, semanticType);
    assert.isTrue(typeMatch.succeeded());
};
const semanticMatchFailTest = (str, semanticType) => {
    const typeMatch = g.match(str, semanticType);
    assert.isFalse(typeMatch.succeeded());
};

describe('Reference Grammar and Semantics', function () {
    describe('Grammar', function () {
        it('Copy', function () {
            const s = "copy()";
            matchTest(s);
            semanticMatchTest(s, "Copy");
            semanticMatchFailTest("copy", "Copy");
        });
        it('Replace', function () {
            const s = "replace('a': 1\n 'b': 2)";
            matchTest(s);
            semanticMatchTest(s, "Replace");
        });
        it('Replace must have an argument', function () {
            const s = "replace()";
            semanticMatchFailTest(s, "Replace");
        });
        it('Join', function () {
            const s = "join(',')";
            matchTest(s);
            // semanticMatchTest(s, "Join");
        });
        it('Join must have an argument', function () {
            const s = "join()";
            semanticMatchFailTest(s, "Join");
        });
        it('Replace Arg', function () {
            const s = "'a':1\n'b':2\n";
            semanticMatchTest(s, "ReplaceArg");
        });
        it('Replace Arg (spaces)', function () {
            const s = "'a':1\n' b':2\n";
            semanticMatchTest(s, "ReplaceArg");
        });
        it('String literal return proper literal', function () {
            const s = "'this is a literal'";
            semanticMatchTest(s, "stringLiteral");
        });
    })
    describe('Semantics', function () {
        it('Copy', function () {
            const s= "copy()";
            const m = g.match(s);
            const result = semantics(m).interpret();
            expect(result).to.eql(["copy", ""]);
        });
        it('Replace', function () {
            const s= "replace('a': 'AAAA'\n'b': 'BBBB')";
            const m = g.match(s);
            const result = semantics(m).interpret();
            expect(result).to.eql(["replace", [["a", "AAAA"], ["b", "BBBB"]]]);
        });
        it('Replace (digits)', function () {
            const s= "replace('a': 1\n'b': 2)";
            const m = g.match(s);
            const result = semantics(m).interpret();
            expect(result).to.eql(["replace", [["a", "1"], ["b", "2"]]]);
        });
        it('Join', function () {
            const s= "join(',')";
            const m = g.match(s);
            const result = semantics(m).interpret();
            expect(result).to.eql(["join", ","]);
        });
        it('String literal return proper literal (w/out quotes)', function () {
            const s = "'this is a literal'";
            const m = g.match(s, "stringLiteral");
            const result = semantics(m).interpret();
            expect(result).to.eql("this is a literal");
        });
    })
});
