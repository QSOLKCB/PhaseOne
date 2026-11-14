/* Copyright 2026 QSOL-IMC. Apache-2.0. Browser host; simulation stays in C99/WASM. */
import {createRenderer} from './renderer.js';
import {createInputQueue, resetSession} from './input.mjs';
const $ = id => document.getElementById(id);
const status = $('status');
const canvas = $('viewport');
const start = $('start');
const reset = $('reset');
const input = createInputQueue();
let simulation, renderer;
const fixedStepMs = 1000/60;
const clock = {prev:0, accumulator:0};
let active=false;

async function loadSimulation() {
  const response = await fetch('./phaseone.wasm');
  if (!response.ok) throw new Error(`WASM request failed: HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  const {instance} = await WebAssembly.instantiate(bytes, {});
  const e = instance.exports;
  if (e.phaseone_abi_version()!==1 || e.phaseone_state_size()!==32 ||
      e.phaseone_require_abi(1)!==0 || !(e.memory instanceof WebAssembly.Memory)) {
    throw new Error('PhaseOne WASM ABI mismatch');
  }
  const inputPtr=e.phaseone_input_ptr(), statePtr=e.phaseone_state_ptr();
  if (!inputPtr || !statePtr || inputPtr+8>e.memory.buffer.byteLength || statePtr+32>e.memory.buffer.byteLength) {
    throw new Error('Invalid WASM host buffers');
  }
  return {
    e, inputPtr, statePtr,
    reset() {if (e.phaseone_reset(0)!==0) throw new Error('WASM reset failed');},
    step(flags, yaw, pitch) {
      const v = new DataView(e.memory.buffer);
      v.setUint8(inputPtr, flags);
      v.setInt16(inputPtr+1,yaw,true);
      v.setInt16(inputPtr+3,pitch,true);
      v.setUint8(inputPtr+5,0);v.setUint8(inputPtr+6,0);v.setUint8(inputPtr+7,0);
      const code=e.phaseone_step(inputPtr,8);
      if (code!==0) throw new Error(`WASM step failed: ${code}`);
    },
    snapshotBytes() {
      if(e.phaseone_serialize_state(statePtr,32)!==0) throw new Error('WASM snapshot failed');
      return new Uint8Array(e.memory.buffer.slice(statePtr,statePtr+32));
    },
    state() {
      const b=this.snapshotBytes();
      const v=new DataView(b.buffer);
      if (String.fromCharCode(...b.slice(0,4))!=='P1S1') throw new Error('Invalid snapshot magic');
      return {tick:v.getUint32(4,true), x:v.getInt32(8,true), z:v.getInt32(12,true),
        yaw:v.getInt32(16,true),pitch:v.getInt32(20,true),
        target_alive:v.getUint32(24,true),score:v.getUint32(28,true)};
    }
  };
}
function hud(s) {
  $('tick').textContent=s.tick;
  $('location').textContent=`${(s.x/1000).toFixed(2)}, ${(s.z/1000).toFixed(2)}`;
  $('score').textContent=s.score;
  $('target').textContent=s.target_alive?'ACTIVE':'DISABLED';
  $('target').className=s.target_alive?'live':'cleared';
}
function frame(now) {
  if (!simulation || !renderer) return;
  if (!clock.prev) clock.prev=now;
  const elapsed=Math.max(0,Math.min(250,now-clock.prev));clock.prev=now;
  if (active) {
    clock.accumulator+=elapsed;
    let steps=0;
    try {
      while(clock.accumulator>=fixedStepMs && steps<5) {
        const {flags,yaw,pitch}=input.consume();
        simulation.step(flags,yaw,pitch);
        clock.accumulator-=fixedStepMs; steps++;
      }
      if (clock.accumulator>=fixedStepMs) {
        clock.accumulator=0; status.textContent='Simulation catch-up capped (frame stall)';
      }
    } catch(error) {active=false;status.textContent=error.message;}
  } else {clock.accumulator=0;}
  try {
    const state=simulation.state();
    renderer.render(state);hud(state);
  } catch(error) {active=false;status.textContent=error.message;return;}
  requestAnimationFrame(frame);
}
function stop() {active=false;input.clear();clock.prev=0;clock.accumulator=0;}
function resetSimulation() {
  resetSession(simulation,input,clock);
  status.textContent='Simulation reset';
}
function setupControls() {
  start.addEventListener('click',()=>{
    if (!canvas.requestPointerLock) {status.textContent='Pointer lock unsupported';return;}
    canvas.requestPointerLock().catch(e=>{status.textContent=`Pointer lock denied: ${e.message}`;});
  });
  reset.addEventListener('click',resetSimulation);
  document.addEventListener('pointerlockchange',()=>{
    active=document.pointerLockElement===canvas;
    start.textContent=active?'PLAYING · ESC TO RELEASE':'ENTER SIMULATION';
    status.textContent=active?'LIVE · WASM/C99 SIMULATION':'PAUSED · CLICK ENTER';
    if (!active)stop();
  });
  document.addEventListener('pointerlockerror',()=>{status.textContent='Pointer lock denied';stop();});
  document.addEventListener('keydown',event=>{
    if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','Space'].includes(event.code))event.preventDefault();
    if (event.code==='KeyR'&&!event.repeat) {resetSimulation();return;}
    input.press(event.code);
  });
  document.addEventListener('keyup',event=>input.release(event.code));
  window.addEventListener('blur',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  canvas.addEventListener('mousemove',event=>{
    if (!active)return;
    input.move(event.movementX,event.movementY);
  });
  canvas.addEventListener('mousedown',event=>{if(active&&event.button===0)input.fire();});
}
function asHex(bytes) {return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
async function selftest() {
  const report=$('test-report');
  try {
    simulation=await loadSimulation();
    renderer=createRenderer(canvas);
    const response=await fetch('./phaseone-001.bin');
    if (!response.ok) throw new Error(`Trace request failed: HTTP ${response.status}`);
    const trace=new Uint8Array(await response.arrayBuffer());
    if (String.fromCharCode(...trace.slice(0,4))!=='P1T1')throw new Error('Invalid trace magic');
    const view=new DataView(trace.buffer),count=view.getUint32(4,true);
    if (trace.length!==8+count*8)throw new Error('Invalid trace length');
    const e=simulation.e;
    if (e.phaseone_step(0,8)!==-1 || e.phaseone_step(simulation.inputPtr,0)!==-2 ||
        e.phaseone_serialize_state(simulation.statePtr,31)!==-4 || e.phaseone_require_abi(2)!==-5) {
      throw new Error('Negative ABI test failed');
    }
    new Uint8Array(e.memory.buffer)[simulation.inputPtr+5]=1;
    if(e.phaseone_step(simulation.inputPtr,8)!==-3)throw new Error('Malformed record accepted');
    simulation.reset();
    const snapshots=[];
    snapshots.push(asHex(simulation.snapshotBytes()));
    for (let tick=0;tick<count;tick++) {
      const off=8+tick*8;
      const payload=trace.subarray(off,off+8);
      new Uint8Array(e.memory.buffer).set(payload,simulation.inputPtr);
      if(e.phaseone_step(simulation.inputPtr,8)!==0)throw new Error(`Replay step ${tick+1} failed`);
      snapshots.push(asHex(simulation.snapshotBytes()));
    }
    const state=simulation.state();
    renderer.render(state);
    report.textContent=JSON.stringify({status:'PASS',browserWebGL2:true,count,
      final:state,snapshotsHex:snapshots.join('')});
  } catch(error) {report.textContent=JSON.stringify({status:'FAIL',error:String(error)});}
}
async function main() {
  if (new URL(location.href).searchParams.has('selftest')) {await selftest();return;}
  try {
    simulation=await loadSimulation();
    simulation.reset();
    renderer=createRenderer(canvas);
    setupControls();
    status.textContent='READY · CLICK ENTER TO PLAY';
    requestAnimationFrame(frame);
  } catch(error) {status.textContent=`ERROR · ${error.message}`;start.disabled=true;}
}
main();
