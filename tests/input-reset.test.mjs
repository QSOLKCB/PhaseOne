import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createInputQueue, resetSession} from '../src/web/input.mjs';

test('keyboard reset path clears fire, mouse and held movement before next tick',()=>{
  const input=createInputQueue();
  const clock={prev:1000,accumulator:100};
  let resets=0;
  input.press('KeyW');input.fire();input.move(200,-30);
  resetSession({reset(){resets++;}},input,clock);
  assert.equal(resets,1);
  assert.deepEqual(input.consume(),{flags:0,yaw:0,pitch:0});
  assert.deepEqual(clock,{prev:0,accumulator:0});
});
test('button reset uses same resetSession and discards partially consumed yaw',()=>{
  const input=createInputQueue();
  const clock={prev:2000,accumulator:48};
  input.move(500,500);
  assert.equal(input.consume().yaw,300);
  input.fire();
  resetSession({reset(){}},input,clock);
  assert.deepEqual(input.consume(),{flags:0,yaw:0,pitch:0});
  assert.deepEqual(clock,{prev:0,accumulator:0});
});
test('new input after reset is processed normally',()=>{
  const input=createInputQueue(),clock={prev:0,accumulator:0};
  input.fire();input.press('KeyD');input.move(30,-5);
  resetSession({reset(){}},input,clock);
  input.press('KeyW');input.fire();input.move(10,4);
  assert.deepEqual(input.consume(),{flags:17,yaw:30,pitch:-12});
  assert.deepEqual(input.consume(),{flags:1,yaw:0,pitch:0});
});
