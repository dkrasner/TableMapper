import * as chai from 'chai';
const assert = chai.assert;
const should = chai.should;
const expect = chai.expect;

import crypto from 'crypto';

// NOTE: we need the following two imports for the worksheet and sheet
// to be available
import Worksheet from '../js/Worksheet.js';
import BasicInterpreter from "../js/interpreters.js";
import { EndOfStackError, CallStack } from "../js/callStack.js";
import '../ap-sheet/src/GridSheet.js';

describe("Interpreter Tests", () => {
    let sourceWS;
    let anotherSourceWS;
    let targetWS;
    let callstack;
    const dataDict = {
        "0,0": "a0",
        "1,0": "b0",
        "2,0": "c0",
        "0,1": "a1",
        "1,1": "b1",
        "2,1": "c1",
    };
    const dataArray = [
        ["a0", "b0", "c0"],
        ["a1", "b1", "c1"]
    ];
    before(() => {
        sourceWS = document.createElement('work-sheet');
        anotherSourceWS = document.createElement('work-sheet');
        // sourceWS.onErase();
        targetWS = document.createElement('work-sheet');
        // targetWS.onErase();
        // mapperWS.onErase();
        document.body.append(sourceWS);
        document.body.append(anotherSourceWS);
        document.body.append(targetWS);
        // NOTE: bc of some Node nonsense we need to generate
        // the ids manually, otherwise they are not guaranteed to be
        // standard UUID format
        sourceWS.id = crypto.randomUUID();
        anotherSourceWS.id = crypto.randomUUID();
        targetWS.id = crypto.randomUUID();
        const interpreter = new BasicInterpreter();
        callstack = new CallStack(interpreter);
    });
    describe("Running basic commands test", () => {
        it("Worksheet elements exist and have an ap-sheet ref", () => {
            assert.exists(sourceWS);
            assert.exists(sourceWS.sheet);
            assert.exists(sourceWS.sheet.dataFrame);
            assert.exists(targetWS);
            assert.exists(targetWS.sheet);
            assert.exists(targetWS.sheet.dataFrame);
            assert.exists(callstack);

        });
        it("Can clear all Worksheet data", () => {
            sourceWS.onErase();
            expect(sourceWS.sheet.dataFrame.store).to.eql({});
            targetWS.onErase();
            expect(targetWS.sheet.dataFrame.store).to.eql({});
        });
        it("Can setup source and callstack", () => {
            sourceWS.sheet.dataFrame.loadFromArray(dataArray);
            expect(sourceWS.sheet.dataFrame.store).to.eql(dataDict);
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,2)`, `${targetWS.id}!(0,0):(0,0)`, "copy()"]
            ]
            callstack.load(instructions);
            expect(callstack.stack).to.eql(instructions);
        });
        it("Running the copy command populates target Worksheet", () => {
            callstack.run();
            expect(targetWS.sheet.dataFrame.store).to.eql(dataDict);
            targetWS.onErase();
            expect(targetWS.sheet.dataFrame.store).to.eql({});
        });
        it("Running the replace command populates target Worksheet", () => {
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,2)`, `${targetWS.id}!(0,0):(0,0)`, "replace('a': 'AAA')"],
            ]
            callstack.load(instructions);
            callstack.run();
            const result = {
                "0,0": "AAA0",
                "1,0": "b0",
                "2,0": "c0",
                "0,1": "AAA1",
                "1,1": "b1",
                "2,1": "c1",
            };
            expect(targetWS.sheet.dataFrame.store).to.eql(result);
            targetWS.onErase();
            expect(targetWS.sheet.dataFrame.store).to.eql({});
        });
        it("Running copy and replace commands populates target Worksheet", () => {
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,2)`, `${targetWS.id}!(0,0):(0,0)`, "copy()"],
                [`${sourceWS.id}!(0,0):(2,2)`, `${targetWS.id}!(3,0):(3,0)`, "replace('a': 'AAA')"],
            ]
            callstack.load(instructions);
            callstack.run();
            const result = {
                "0,0": "a0",
                "1,0": "b0",
                "2,0": "c0",
                "0,1": "a1",
                "1,1": "b1",
                "2,1": "c1",
                "3,0": "AAA0",
                "4,0": "b0",
                "5,0": "c0",
                "3,1": "AAA1",
                "4,1": "b1",
                "5,1": "c1",
            };
            expect(targetWS.sheet.dataFrame.store).to.eql(result);
            targetWS.onErase();
            expect(targetWS.sheet.dataFrame.store).to.eql({});
        });
        it("Stepping through copy and replace commands populates target Worksheet", () => {
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,2)`, `${targetWS.id}!(0,0):(0,0)`, "copy()"],
                [`${sourceWS.id}!(0,0):(2,2)`, `${targetWS.id}!(3,0):(3,0)`, "replace('a': 'AAA')"],
            ]
            callstack.load(instructions);
            callstack.step();
            callstack.execute();
            expect(targetWS.sheet.dataFrame.store).to.eql(dataDict);
            const result = {
                "0,0": "a0",
                "1,0": "b0",
                "2,0": "c0",
                "0,1": "a1",
                "1,1": "b1",
                "2,1": "c1",
                "3,0": "AAA0",
                "4,0": "b0",
                "5,0": "c0",
                "3,1": "AAA1",
                "4,1": "b1",
                "5,1": "c1",
            };
            callstack.step();
            callstack.execute();
            expect(targetWS.sheet.dataFrame.store).to.eql(result);
            targetWS.onErase();
            expect(targetWS.sheet.dataFrame.store).to.eql({});
        });
        it("Running the join command populates target Worksheet", () => {
            // add another source and make sure it exists
            assert.exists(anotherSourceWS);
            assert.exists(anotherSourceWS.sheet);
            assert.exists(anotherSourceWS.sheet.dataFrame);
            anotherSourceWS.onErase();
            expect(anotherSourceWS.sheet.dataFrame.store).to.eql({});
            anotherSourceWS.sheet.dataFrame.loadFromArray(dataArray);
            expect(anotherSourceWS.sheet.dataFrame.store).to.eql(dataDict);
            sourceWS.onErase();
            sourceWS.sheet.dataFrame.loadFromArray(dataArray);
            expect(sourceWS.sheet.dataFrame.store).to.eql(dataDict);
            targetWS.onErase();

            const instructions = [
                [`${sourceWS.id}!(0,0):(2,1),${anotherSourceWS.id}!(0,0):(2,1)`, `${targetWS.id}!(0,0):(0,0)`, "join(',')"],
            ]
            callstack.load(instructions);
            callstack.run();
            const result = {
                "0,0": "a0,a0",
                "1,0": "b0,b0",
                "2,0": "c0,c0",
                "0,1": "a1,a1",
                "1,1": "b1,b1",
                "2,1": "c1,c1",
            };
            expect(targetWS.sheet.dataFrame.store).to.eql(result);
            targetWS.onErase();
            expect(targetWS.sheet.dataFrame.store).to.eql({});
        });
    });

    after(() => {
        sourceWS.remove();
        targetWS.remove();
    });
});
