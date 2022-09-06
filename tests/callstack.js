import assert from 'assert/strict';
import { expect } from 'chai';

import {CallStack} from '../js/callStack.js';

class Interpreter extends Object {
    constructor(){
        super();

        this.interpret = this.interpret.bind(this);
    }

    /* I am simple interpreter; i just return the command as is */
    interpret(data){
        const command = data[0];
        const arg = data[1];
        return function(){
            return command(arg);
        };
    }
}


describe('Callstack', function () {
    let whereAmI = null;
    const command = function(count){
        whereAmI = `I am at ${count}`;
        return 1;
    }
    const simple_interpreter = new Interpreter();
    const callstack = new CallStack(simple_interpreter);
    callstack.stack.push([command, 0]);
    callstack.stack.push([command, 1]);
    callstack.stack.push([command, "the end"]);
    describe('counter', function () {
        it('counter starts at -1', function () {
            assert.equal(callstack.COUNTER, -1);
        });
        it('counter increments with calling .step()', function () {
            callstack.step();
            assert.equal(callstack.COUNTER, 0);
        });
        it('.execute() calls the first item on the stack', function () {
            callstack.execute();
            assert.equal(whereAmI, "I am at 0");
        });
        it('counter increments with calling .step()', function () {
            callstack.step();
            assert.equal(callstack.COUNTER, 1);
        });
        it('.execute() calls the second item on the stack', function () {
            callstack.execute();
            assert.equal(whereAmI, "I am at 1");
        });
        it('counter resets with calling .step() at the end of the stack', function () {
            callstack.step();
            assert.equal(callstack.COUNTER, 2);
            callstack.execute();
            assert.equal(whereAmI, "I am at the end");
            callstack.step();
            assert.equal(callstack.COUNTER, -1);
        });
        it('.execute() throws error at the end of the stack', function () {
            expect(callstack.execute).to.throw();
        });
        it('.run() will execute from start to end', function () {
            whereAmI = "who knows";
            callstack.run();
            assert.equal(whereAmI, "I am at the end");
            assert.equal(callstack.COUNTER, -1);
        });
        it('.run() will execute from anywhere to end', function () {
            whereAmI = "who knows";
            callstack.COUNTER = 1;
            callstack.run();
            assert.equal(whereAmI, "I am at the end");
            assert.equal(callstack.COUNTER, -1);
        });
        it('.reset() will reset the counter to -1', function () {
            whereAmI = "who knows";
            callstack.reset();
            assert.equal(callstack.COUNTER, -1);
        });
        it('.jump() will jump the correct amount', function () {
            callstack.reset();
            callstack.jump(2);
            assert.equal(callstack.COUNTER, 1);
            callstack.jump(-1);
            assert.equal(callstack.COUNTER, 0);
        });
        it('.jump(n) will reset the counter if off stack', function () {
            callstack.reset();
            callstack.jump(20);
            assert.equal(callstack.COUNTER, -1);
        });
        it('.append() will append an instruction without moving the counter', function () {
            callstack.reset();
            callstack.jump(2);
            callstack.append([command, 0]);
            assert.equal(callstack.COUNTER, 1);
            assert.equal(callstack.stack.length, 4);
        });
        it('.append() will not append an empty instruction', function () {
            callstack.reset();
            callstack.jump(2);
            callstack.append();
            assert.equal(callstack.COUNTER, 1);
            assert.equal(callstack.stack.length, 4);
        });
        it('.remove() will remove an instruction without moving the counter', function () {
            callstack.reset();
            callstack.stack = [];
            callstack.append([command, 0]);
            callstack.append([command, 1]);
            callstack.append([command, 3]);
            callstack.jump(1);
            assert.equal(callstack.COUNTER, 0);
            assert.equal(callstack.stack.length, 3);
            callstack.remove(1);
            assert.equal(callstack.stack.length, 2);
            assert.equal(callstack.COUNTER, 0);
        });
        it('.remove() will reset the counter if the last intruction is removed', function () {
            callstack.reset();
            callstack.stack = [];
            callstack.append([command, 0]);
            callstack.append([command, 1]);
            callstack.append([command, 3]);
            callstack.jump(2);
            assert.equal(callstack.COUNTER, 1);
            assert.equal(callstack.stack.length, 3);
            callstack.remove(2);
            assert.equal(callstack.stack.length, 2);
            assert.equal(callstack.COUNTER, -1);
        });
        it('.load() will load a new set of instructions and reset the counter', function () {
            callstack.load([[command, 0], [command, 1]]);
            assert.equal(callstack.COUNTER, -1);
            assert.equal(callstack.stack.length, 2);
        });
    });
});
