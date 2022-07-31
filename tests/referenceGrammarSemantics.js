import { expect, assert } from 'chai';
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

const generateRandomReference = () => {
    const id = crypto.randomUUID();
    const anchor = [generateRandomUpperCase(), Math.round(Math.random()*1000).toString()]
    const corner = [generateRandomUpperCase(), Math.round(Math.random()*1000).toString()]
    const s = `${id}!${anchor.join("")}:${corner.join("")}`;
    return {ref: s, id: id, anchor: anchor, corner: corner};
};

const generateRandomNamedReference = () => {
    const ref = generateRandomReference();
    const name = generateRandomUpperCase(); // this will do for a name
    ref.name = name;
    ref.ref = `<${name}>` + ref.ref;
    return ref;
    
};

const generateRandomUpperCase = () => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numLetters = Math.max(Math.round(Math.random())*10, 1);
    let result = "";
    let i = 0;
    while(i < numLetters){
        result += letters[Math.round(Math.random()*(letters.length - 1))];
        i += 1;
    }
    return result;
};


describe('Reference Grammar and Semantics', function () {
    describe('Grammar', function () {
        it('(unnamed) Reference match', function () {
            const r = generateRandomReference();
            const s = r.ref;
            matchTest(s);
        });
        it('(unnamed) Reference match multiple reference list', function () {
            const r1 = generateRandomReference();
            const r2 = generateRandomReference();
            const r3 = generateRandomReference();
            matchTest([r1.ref, r2.ref, r3.ref].join(','));
        });
        it('(named) Reference match', function () {
            const r = generateRandomReference();
            const s = "<thisismyname>" + r.ref;
            matchTest(s);
        });
        it('(named) Reference match multiple reference list', function () {
            const r1 = generateRandomNamedReference();
            const r2 = generateRandomNamedReference();
            const r3 = generateRandomNamedReference();
            matchTest([r1.ref, r2.ref, r3.ref].join(','));
        });
        it('Will not match empty string', function () {
            const match = g.match("");
            assert.isFalse(match.succeeded());
        });
        it('Sheet ID is a UUID', function () {
            for(let i = 0; i <= 10; i++){
                semanticMatchTest(crypto.randomUUID(), "sheetId");
            }
        });
        it('Named references can include alnum and _,- in the name', function () {
            let name = "<thisisaname>";
            semanticMatchTest(name, "name");
            name = "<thisisaname_1-2_a>";
            semanticMatchTest(name, "name");
        });
        it('Named references must be wrapped in <>', function () {
            let name = "thisisaname";
            semanticMatchFailTest(name, "name");
            name = "thisisaname_1-2_a>";
            semanticMatchFailTest(name, "name");
        });
        it('Named references cannot be empty strings', function () {
            const name = "<>";
            semanticMatchFailTest(name, "name");
        })
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
        it('(unnamed)Reference match', function () {
            const r = generateRandomReference();
            const m = g.match(r.ref);
            let result = semantics(m).interpret();
            result = result[0];
            expect(result[0]).to.eql(null);
            expect(result[1]).to.eql(r.id);
            expect(result[2][0]).to.eql(r.anchor);
            expect(result[2][1]).to.eql(r.corner);
        });
        it('(unnamed)Reference match list', function () {
            const r1 = generateRandomReference();
            const r2 = generateRandomReference();
            const r3 = generateRandomReference();
            const s = [r1.ref, r2.ref, r3.ref].join(',');
            const m = g.match(s);
            const result = semantics(m).interpret();
            for(let i=0; i<3; i++){
                const r = result[i];
                const expected = [r1, r2, r3][i];
                expect(r[0]).to.eql(null);
                expect(r[1]).to.eql(expected.id);
                expect(r[2][0]).to.eql(expected.anchor);
                expect(r[2][1]).to.eql(expected.corner);
            }
        });
        it('(named)Reference match', function () {
            const r = generateRandomNamedReference();
            const m = g.match(r.ref);
            let result = semantics(m).interpret();
            result = result[0];
            expect(result[0]).to.eql(r.name);
            expect(result[1]).to.eql(r.id);
            expect(result[2][0]).to.eql(r.anchor);
            expect(result[2][1]).to.eql(r.corner);
        });
        it('(named)Reference match list', function () {
            const r1 = generateRandomNamedReference();
            const r2 = generateRandomNamedReference();
            const r3 = generateRandomNamedReference();
            const s = [r1.ref, r2.ref, r3.ref].join(',');
            const m = g.match(s);
            const result = semantics(m).interpret();
            for(let i=0; i<3; i++){
                const r = result[i];
                const expected = [r1, r2, r3][i];
                expect(r[0]).to.eql(expected.name);
                expect(r[1]).to.eql(expected.id);
                expect(r[2][0]).to.eql(expected.anchor);
                expect(r[2][1]).to.eql(expected.corner);
            }
        });
    })
});
