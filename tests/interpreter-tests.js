import * as chai from 'chai';
const assert = chai.assert;
const should = chai.should;
const expect = chai.expect;

import crypto from 'crypto';

// NOTE: we need the following two imports for the worksheet and sheet
// to be available
import Worksheet from '../js/Worksheet.js';
import '../ap-sheet/src/GridSheet.js';


describe("Interpreter Tests", () => {
    let sourceWS;
    let targetWS;
    let mapperWS;
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
        // sourceWS.onErase();
        targetWS = document.createElement('work-sheet');
        // targetWS.onErase();
        mapperWS = document.createElement('work-sheet');
        // mapperWS.onErase();
        document.body.append(sourceWS);
        document.body.append(targetWS);
        document.body.append(mapperWS);
        // NOTE: bc of some Node nonsense we need to generate
        // the ids manually, otherwise they are not guaranteed to be
        // standard UUID format
        sourceWS.id = crypto.randomUUID();
        targetWS.id = crypto.randomUUID();
        mapperWS.id = crypto.randomUUID();
    });
    describe("Running basic commands test", () => {
        it("Worksheet elements exist and have an ap-sheet ref", () => {
            assert.exists(sourceWS);
            assert.exists(sourceWS.sheet);
            assert.exists(sourceWS.sheet.dataFrame);
            assert.exists(targetWS);
            assert.exists(targetWS.sheet);
            assert.exists(targetWS.sheet.dataFrame);
            assert.exists(mapperWS);
            assert.exists(mapperWS.sheet);
            assert.exists(mapperWS.sheet.dataFrame);
        });
        it("Can clear all Worksheet data", () => {
            sourceWS.onErase();
            expect(sourceWS.sheet.dataFrame.store).to.eql({});
            targetWS.onErase();
            expect(targetWS.sheet.dataFrame.store).to.eql({});
            mapperWS.onErase();
            expect(mapperWS.sheet.dataFrame.store).to.eql({});
            mapperWS.addSource(sourceWS.id, "source");
            assert.equal(mapperWS.getAttribute("sources"), sourceWS.id);
            mapperWS.addTarget(targetWS.id, "target");
            assert.equal(mapperWS.getAttribute("targets"), targetWS.id);
        });
        it("Can setup source, mapper Worksheets", () => {
            sourceWS.sheet.dataFrame.loadFromArray(dataArray);
            expect(sourceWS.sheet.dataFrame.store).to.eql(dataDict);
            mapperWS.sheet.dataFrame.putAt([0, 0], "A1:C2");
            mapperWS.sheet.dataFrame.putAt([1, 0], "A1:A1");
            mapperWS.sheet.dataFrame.putAt([2, 0], "copy()");
            expect(mapperWS.sheet.dataFrame.store).to.eql(
                {"0,0": "A1:C2", "1,0": "A1:A1", "2,0": "copy()"}
            );
        });
        it("Running the copy command populates target Worksheet", () => {
            mapperWS.onRun();
            expect(targetWS.sheet.dataFrame.store).to.eql(dataDict);
            targetWS.onErase();
            expect(targetWS.sheet.dataFrame.store).to.eql({});
        });
        it("Running the replace command populates target Worksheet", () => {
            mapperWS.sheet.dataFrame.putAt([2, 0], "replace({'a': 'AAA'})");
            mapperWS.onRun();
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
            mapperWS.sheet.dataFrame.putAt([0, 0], "A1:C2");
            mapperWS.sheet.dataFrame.putAt([1, 0], "A1:A1");
            mapperWS.sheet.dataFrame.putAt([2, 0], "copy()");
            mapperWS.sheet.dataFrame.putAt([0, 1], "A1:C2");
            mapperWS.sheet.dataFrame.putAt([1, 1], "D1:D1");
            mapperWS.sheet.dataFrame.putAt([2, 1], "replace({'a': 'AAA'})");
            mapperWS.onRun();
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
            mapperWS.sheet.dataFrame.putAt([0, 0], "A1:C2");
            mapperWS.sheet.dataFrame.putAt([1, 0], "A1:A1");
            mapperWS.sheet.dataFrame.putAt([2, 0], "copy()");
            mapperWS.sheet.dataFrame.putAt([0, 1], "A1:C2");
            mapperWS.sheet.dataFrame.putAt([1, 1], "D1:D1");
            mapperWS.sheet.dataFrame.putAt([2, 1], "replace({'a': 'AAA'})");
            mapperWS.onStep();
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
            mapperWS.onStep();
            expect(targetWS.sheet.dataFrame.store).to.eql(result);
            targetWS.onErase();
            expect(targetWS.sheet.dataFrame.store).to.eql({});
        });
    });

    after(() => {
        sourceWS.remove();
        targetWS.remove();
        mapperWS.remove();
    });
});
