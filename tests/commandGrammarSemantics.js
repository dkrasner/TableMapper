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
            const s = "replace({'a': 1, 'b': 2})";
            matchTest(s);
            semanticMatchTest(s, "Replace");
        });
        it('Replace must have an argument', function () {
            const s = "replace()";
            semanticMatchFailTest(s, "Replace");
        });
        it('Dict (single quotes)', function () {
            const s = "{'a': '1', 'b': '2'}";
            semanticMatchTest(s, "Dict");
        });
        it('Dict (double quotes)', function () {
            const s = '{"a": "a", "b": "b"}';
            semanticMatchTest(s, "Dict");
        });
        it('Dict (empty key or value)', function () {
            let s = "{'': '1', 'b': 2}";
            semanticMatchTest(s, "Dict");
            s = "{'a': '', 'b': 2}";
            semanticMatchTest(s, "Dict");
        });
        it('Dict (some values digits)', function () {
            const s = "{'a': '1', 'b': 2}";
            semanticMatchTest(s, "Dict");
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
            const s= "replace({'a': 1, 'b': 2})";
            const m = g.match(s);
            const result = semantics(m).interpret();
            expect(result).to.eql(["replace", {'a': 1, 'b': 2}]);
        });
    })
});
