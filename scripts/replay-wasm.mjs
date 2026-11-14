// Copyright 2026 QSOL-IMC. Apache-2.0. No npm packages required.
import {readFileSync, writeFileSync} from 'node:fs';
if (process.argv.length !== 5) {
  console.error('usage: node scripts/replay-wasm.mjs MODULE.wasm TRACE.bin OUTPUT.states');
  process.exit(2);
}
const [, , wasmPath, tracePath, outputPath] = process.argv;
const trace = readFileSync(tracePath);
if (trace.length < 8 || trace.toString('ascii',0,4) !== 'P1T1') throw new Error('Invalid trace magic');
const count = trace.readUInt32LE(4);
if (count > 100000 || trace.length !== 8 + count*8) throw new Error('Invalid trace length');
const {instance} = await WebAssembly.instantiate(readFileSync(wasmPath),{});
const e = instance.exports;
if (e.phaseone_abi_version() !== 1 || e.phaseone_state_size() !== 32 || e.phaseone_require_abi(1) !== 0) {
  throw new Error('Invalid WASM ABI');
}
const ip = e.phaseone_input_ptr(), op = e.phaseone_state_ptr(), memory = e.memory;
if (!ip || !op || ip+8>memory.buffer.byteLength || op+32>memory.buffer.byteLength) throw new Error('Out-of-bounds WASM host buffers');
if (e.phaseone_step(0,8)!==-1 || e.phaseone_step(ip,0)!==-2 || e.phaseone_serialize_state(op,31)!==-4 ||
    e.phaseone_require_abi(2)!==-5) throw new Error('Negative ABI checks failed');
const buf = new Uint8Array(memory.buffer);
buf.fill(0,ip,ip+8);buf[ip+5]=1;
if(e.phaseone_step(ip,8)!==-3) throw new Error('Invalid reserved field accepted');
e.phaseone_reset(0);
const output=Buffer.alloc((count+1)*32);
function snapshot(at) {
  if(e.phaseone_serialize_state(op,32)!==0)throw new Error('Failed to serialize state');
  Buffer.from(memory.buffer,op,32).copy(output,at*32);
}
snapshot(0);
for(let tick=0;tick<count;tick++) {
  buf.set(trace.subarray(8+tick*8,16+tick*8),ip);
  const rc=e.phaseone_step(ip,8);
  if(rc!==0)throw new Error(`WASM replay step ${tick+1}: ${rc}`);
  snapshot(tick+1);
}
writeFileSync(outputPath,output);
console.error(`WASM replay: PASS (${count} ticks, ${count+1} snapshots)`);
