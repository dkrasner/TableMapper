import { expect, assert } from 'chai';
import ohm from 'ohm-js';

import {referenceGrammar as g} from '../js/ohm/reference.js';


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


describe('Reference Grammer and Semantics', function () {
    describe('Grammar', function () {
        it('Coordinates match "ALPHA+NUM+"', function () {
            semanticMatchTest("A1", "coordinate");
            semanticMatchTest("A123423", "coordinate");
            semanticMatchTest("ABB1", "coordinate");
            semanticMatchTest("AAA100", "coordinate");
        });
        it('Coordinates match fail "ALPHA+:NUM+"', function () {
            semanticMatchFailTest("AAA:100", "coordinate");
        });
    })
    describe('Semantics', function () {
    })
});
