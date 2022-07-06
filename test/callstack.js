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
    console.log(simple_interpreter.interpret([command, 4])())
    const callstack = new CallStack(null, null, simple_interpreter);
    callstack.stack.push([command, 0]);
    callstack.stack.push([command, 1]);
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
            assert.equal(callstack.COUNTER, -1);
        });
        it('.execute() throws error', function () {
            expect(callstack.execute).to.throw();
        });
    });
});
