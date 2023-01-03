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
import '../ap-sheet/src/APSheet.js';

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
    const numericDataArray = [
        [1, 2, 3],
        [4, 5, 6]
    ];
    const numericDataDict = {
        "0,0": 1,
        "1,0": 2,
        "2,0": 3,
        "0,1": 4,
        "1,1": 5,
        "2,1": 6,
    };
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
            assert.exists(sourceWS.sheet.dataStore);
            assert.exists(targetWS);
            assert.exists(targetWS.sheet);
            assert.exists(targetWS.sheet.dataStore);
            assert.exists(callstack);

        });
        it("Can clear all Worksheet data", () => {
            sourceWS.onErase();
            expect(sourceWS.sheet.dataStore._cache).to.eql({});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it("Can setup source and callstack", () => {
            sourceWS.sheet.dataStore.loadFromArray(dataArray);
            expect(sourceWS.sheet.dataStore._cache).to.eql(dataDict);
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,1)`, `${targetWS.id}!(0,0):(0,0)`, "copy()"]
            ]
            callstack.load(instructions);
            expect(callstack.stack).to.eql(instructions);
        });
        it("Running the copy command populates target Worksheet", async () => {
            await callstack.run();
            expect(targetWS.sheet.dataStore._cache).to.eql(dataDict);
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it("Running the replace command populates target Worksheet", async () => {
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,1)`, `${targetWS.id}!(0,0):(0,0)`, "replace('a': 'AAA')"],
            ]
            callstack.load(instructions);
            await callstack.run();
            const result = {
                "0,0": "AAA0",
                "1,0": "b0",
                "2,0": "c0",
                "0,1": "AAA1",
                "1,1": "b1",
                "2,1": "c1",
            };
            expect(targetWS.sheet.dataStore._cache).to.eql(result);
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it("Running copy and replace commands populates target Worksheet", async () => {
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,1)`, `${targetWS.id}!(0,0):(0,0)`, "copy()"],
                [`${sourceWS.id}!(0,0):(2,1)`, `${targetWS.id}!(3,0):(3,0)`, "replace('a': 'AAA')"],
            ]
            callstack.load(instructions);
            await callstack.run();
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
            expect(targetWS.sheet.dataStore._cache).to.eql(result);
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it("Stepping through copy and replace commands populates target Worksheet", async () => {
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,1)`, `${targetWS.id}!(0,0):(0,0)`, "copy()"],
                [`${sourceWS.id}!(0,0):(2,1)`, `${targetWS.id}!(3,0):(3,0)`, "replace('a': 'AAA')"],
            ]
            callstack.load(instructions);
            callstack.step();
            await callstack.execute();
            expect(targetWS.sheet.dataStore._cache).to.eql(dataDict);
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
            await callstack.execute();
            expect(targetWS.sheet.dataStore._cache).to.eql(result);
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it.skip("Running the join command populates target Worksheet", () => {
            // add another source and make sure it exists
            assert.exists(anotherSourceWS);
            assert.exists(anotherSourceWS.sheet);
            assert.exists(anotherSourceWS.sheet.dataStore);
            anotherSourceWS.onErase();
            expect(anotherSourceWS.sheet.dataStore._cache).to.eql({});
            anotherSourceWS.sheet.dataStore.loadFromArray(dataArray);
            expect(anotherSourceWS.sheet.dataStore._cache).to.eql(dataDict);
            sourceWS.onErase();
            sourceWS.sheet.dataStore.loadFromArray(dataArray);
            expect(sourceWS.sheet.dataStore._cache).to.eql(dataDict);
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
            expect(targetWS.sheet.dataStore._cache).to.eql(result);
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
    });

    describe("Running arithmetic commands test", () => {
        it("Can clear all Worksheet data", () => {
            sourceWS.onErase();
            expect(sourceWS.sheet.dataStore._cache).to.eql({});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it("Can setup source and callstack", () => {
            sourceWS.sheet.dataStore.loadFromArray(numericDataArray);
            expect(sourceWS.sheet.dataStore._cache).to.eql(numericDataDict);
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,1)`, `${targetWS.id}!(0,0):(0,0)`, "sum()"]
            ]
            callstack.load(instructions);
            expect(callstack.stack).to.eql(instructions);
        });
        it("Sum", async () => {
            await callstack.run();
            let sum = 0;
            numericDataArray.forEach((row) => {
                sum += row.reduce((a, b) => a + b);
            });
            expect(targetWS.sheet.dataStore._cache).to.eql({"0,0": sum});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it("Sum can be NaN", async () => {
            sourceWS.sheet.dataStore.loadFromArray(dataArray);
            await callstack.run();
            expect(targetWS.sheet.dataStore._cache).to.eql({"0,0": NaN});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
            sourceWS.sheet.dataStore.loadFromArray(numericDataArray);
            expect(sourceWS.sheet.dataStore._cache).to.eql(numericDataDict);
        });
        it("Average", async () => {
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,1)`, `${targetWS.id}!(0,0):(0,0)`, "average()"]
            ]
            callstack.load(instructions);
            await callstack.run();
            let ave = 0;
            let counter = 0;
            numericDataArray.forEach((row) => {
                ave += row.reduce((a, b) => a + b);
                counter += row.length;
            });
            ave = ave / counter;
            expect(targetWS.sheet.dataStore._cache).to.eql({"0,0": ave});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it("Average can be NaN", async () => {
            sourceWS.sheet.dataStore.loadFromArray(dataArray);
            await callstack.run();
            expect(targetWS.sheet.dataStore._cache).to.eql({"0,0": NaN});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
            sourceWS.sheet.dataStore.loadFromArray(numericDataArray);
            expect(sourceWS.sheet.dataStore._cache).to.eql(numericDataDict);
        });
        it("Max", async () => {
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,1)`, `${targetWS.id}!(0,0):(0,0)`, "max()"]
            ]
            callstack.load(instructions);
            await callstack.run();
            let max = numericDataArray[0][0];
            numericDataArray.forEach((row) => {
                row.forEach((v) => {
                    if (v > max){
                        max = v;
                    }
                })
            });
            expect(targetWS.sheet.dataStore._cache).to.eql({"0,0": max});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it("Max can be NaN", async () => {
            sourceWS.sheet.dataStore.loadFromArray(dataArray);
            await callstack.run();
            expect(targetWS.sheet.dataStore._cache).to.eql({"0,0": NaN});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
            sourceWS.sheet.dataStore.loadFromArray(numericDataArray);
            expect(sourceWS.sheet.dataStore._cache).to.eql(numericDataDict);
        });
        it("Min", async () => {
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,1)`, `${targetWS.id}!(0,0):(0,0)`, "min()"]
            ]
            callstack.load(instructions);
            await callstack.run();
            let min = numericDataArray[0][0];
            numericDataArray.forEach((row) => {
                row.forEach((v) => {
                    if (v < min){
                        min = v;
                    }
                })
            });
            expect(targetWS.sheet.dataStore._cache).to.eql({"0,0": min});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it("Min can be NaN", async () => {
            sourceWS.sheet.dataStore.loadFromArray(dataArray);
            await callstack.run();
            expect(targetWS.sheet.dataStore._cache).to.eql({"0,0": NaN});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
            sourceWS.sheet.dataStore.loadFromArray(numericDataArray);
            expect(sourceWS.sheet.dataStore._cache).to.eql(numericDataDict);
        });
        it("Median 1", async () => {
            const numericDataArray = [
                [1, 2, 3],
                [4, 5, 6]
            ];
            sourceWS.sheet.dataStore.loadFromArray(numericDataArray);
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,1)`, `${targetWS.id}!(0,0):(0,0)`, "median()"]
            ]
            callstack.load(instructions);
            await callstack.run();
            expect(targetWS.sheet.dataStore._cache).to.eql({"0,0": 3.5});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it("Median 2", async () => {
            const numericDataArray2 = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ];
            sourceWS.sheet.dataStore.loadFromArray(numericDataArray2);
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,2)`, `${targetWS.id}!(0,0):(0,0)`, "median()"]
            ]
            callstack.load(instructions);
            await callstack.run();
            expect(targetWS.sheet.dataStore._cache).to.eql({"0,0": 5});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it("Median 3", async () => {
            const numericDataArray2 = [
                [1, 2, 3, 4],
                [5, 6, 7, 8],
                [9, 10, 11, 12]
            ];
            sourceWS.sheet.dataStore.loadFromArray(numericDataArray2);
            const instructions = [
                [`${sourceWS.id}!(0,0):(3,2)`, `${targetWS.id}!(0,0):(0,0)`, "median()"]
            ]
            callstack.load(instructions);
            await callstack.run();
            expect(targetWS.sheet.dataStore._cache).to.eql({"0,0":  13 / 2});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it("Median 4", async () => {
            const numericDataArray2 = [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ];
            sourceWS.sheet.dataStore.loadFromArray(numericDataArray2);
            // NOTE: we are starting at (1, 1) here
            const instructions = [
                [`${sourceWS.id}!(1,1):(2,2)`, `${targetWS.id}!(0,0):(0,0)`, "median()"]
            ]
            callstack.load(instructions);
            await callstack.run();
            expect(targetWS.sheet.dataStore._cache).to.eql({"0,0": 7});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
        it("Median can be NaN", async () => {
            const numericDataArray2 = [
                [1, 2, 3],
                [4, 5, 6],
                [7, "aaaa", 9]
            ];
            sourceWS.sheet.dataStore.loadFromArray(numericDataArray2);
            const instructions = [
                [`${sourceWS.id}!(0,0):(2,2)`, `${targetWS.id}!(0,0):(0,0)`, "median()"]
            ]
            callstack.load(instructions);
            await callstack.run();
            expect(targetWS.sheet.dataStore._cache).to.eql({"0,0": NaN});
            targetWS.onErase();
            expect(targetWS.sheet.dataStore._cache).to.eql({});
        });
    });
    after(() => {
        sourceWS.remove();
        targetWS.remove();
    });
});
