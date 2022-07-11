import { expect, assert } from 'chai';
import ohm from 'ohm-js';
import crypto from 'crypto';

import {referenceGrammar as g} from '../js/ohm/reference.js';
import {referenceSemantics as semantics} from '../js/ohm/reference.js';


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
        it('Reference match', function () {
            let s = `${crypto.randomUUID()}!A10:DD100`;
            matchTest(s);
            s = `${crypto.randomUUID()}!A:DD100`;
            matchTest(s);
        });
        it('Sheet ID is a UUID', function () {
            for(let i = 0; i <= 10; i++){
                semanticMatchTest(crypto.randomUUID(), "sheetId");
            }
        });
        it('Sheet ID fails with non-hex digit chars', function () {
            semanticMatchFailTest("123e45!67-e89b-12d3-a456-426614174000", "sheetId");
            semanticMatchFailTest("123e4567-e89b-12d3-a456-426614174000!", "sheetId");
        });
        it('Coordinates match "ALPHA+NUM+"', function () {
            semanticMatchTest("A1", "coordinate");
            semanticMatchTest("A123423", "coordinate");
            semanticMatchTest("ABB1", "coordinate");
            semanticMatchTest("AAA100", "coordinate");
        });
        it('Coordinates can have only capital letters, no num', function () {
            semanticMatchTest("A", "coordinate");
            semanticMatchTest("ABB", "coordinate");
        });
        it('Coordinates match fail "ALPHA+:NUM+"', function () {
            semanticMatchFailTest("AAA:100", "coordinate");
        });
        it('Frame is a ":" separated pair of coordinates', function () {
            semanticMatchTest("A100:BB10", "Frame");
            semanticMatchTest("A:BB", "Frame");
        });
        it('Sheet ID is a UUID', function () {
            for(let i = 0; i <= 10; i++){
                semanticMatchTest(crypto.randomUUID(), "sheetId");
            }
        });
        it('Sheet ID fails with non-hex digit chars', function () {
            semanticMatchFailTest("123e45!67-e89b-12d3-a456-426614174000", "sheetId");
            semanticMatchFailTest("123e4567-e89b-12d3-a456-426614174000!", "sheetId");
        });
    })
    describe('Semantics', function () {
        it('Reference match 1', function () {
            const id = crypto.randomUUID();
            const anchor = "A10";
            const corner = "DD100";
            const s = `${id}!${anchor}:${corner}`;
            const m = g.match(s);
            const result = semantics(m).interpret();
            expect(result[1][0]).to.eql(["A", "10"]);
            expect(result[1][1]).to.eql(["DD", "100"]);
        });
        it('Reference match 2', function () {
            const id = crypto.randomUUID();
            const anchor = "A";
            const corner = "DD";
            const s = `${id}!${anchor}:${corner}`;
            const m = g.match(s);
            const result = semantics(m).interpret();
            expect(result[1][0]).to.eql(["A", ""]);
            expect(result[1][1]).to.eql(["DD", ""]);
        });
    })
});
