/* Copyright 2026 QSOL-IMC. Apache-2.0. Original procedural WebGL 2 room. */
const vertexSource = `#version 300 es
in vec3 aPosition;
in vec3 aColor;
uniform mat4 uProjection;
uniform mat4 uView;
out vec3 vColor;
void main() {
  vColor = aColor;
  gl_Position = uProjection * uView * vec4(aPosition, 1.0);
}`;
const fragmentSource = `#version 300 es
precision mediump float;
in vec3 vColor;
out vec4 outColor;
void main() { outColor = vec4(vColor, 1.0); }
`;
function shader(gl, type, source) {
  const s = gl.createShader(type);
  gl.shaderSource(s, source);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}
function program(gl) {
  const p = gl.createProgram();
  const vs = shader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = shader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return p;
}
function perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0,
    0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}
function lookAt(eye, dir) {
  const fl = Math.hypot(...dir);
  const f = dir.map(v => v / fl);
  const s0 = [-f[2], 0, f[0]];
  const sl = Math.hypot(...s0);
  const s = s0.map(v => v / sl);
  const u = [s[1] * f[2] - s[2] * f[1],
    s[2] * f[0] - s[0] * f[2], s[0] * f[1] - s[1] * f[0]];
  const dot = (a, b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  return new Float32Array([
    s[0], u[0], -f[0], 0,
    s[1], u[1], -f[1], 0,
    s[2], u[2], -f[2], 0,
    -dot(s, eye), -dot(u, eye), dot(f, eye), 1
  ]);
}
function createGeometry() {
  const data = [];
  const tri = (a, b, c, col) => {for (const v of [a,b,c]) data.push(...v,...col);};
  const quad = (a,b,c,d,col) => {tri(a,b,c,col);tri(a,c,d,col);};
  const box = (x0,y0,z0,x1,y1,z1,color) => {
    const shade = n => color.map(c => Math.min(1,c*n));
    quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],shade(.83));
    quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],shade(.72));
    quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],shade(.64));
    quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],shade(.89));
    quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],shade(1.1));
    quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],shade(.5));
  };
  for (let x=-6; x<7; x++) for (let z=-6; z<7; z++) {
    const light = ((x + z) & 1) ? .105 : .125;
    quad([x,0,z],[x,0,z+1],[x+1,0,z+1],[x+1,0,z],[light,light*1.22,light*1.58]);
  }
  box(-6.7,-.25,-6.7,6.7,-.1,6.7,[.23,.4,.48]);
  box(-6.7,4.2,-6.7,6.7,4.32,6.7,[.11,.16,.22]);
  box(-6.7,0,-6.7,-6.52,4.2,6.7,[.16,.24,.35]);
  box(6.52,0,-6.7,6.7,4.2,6.7,[.16,.24,.35]);
  box(-6.7,0,-6.7,6.7,4.2,-6.52,[.15,.22,.33]);
  box(-6.7,0,6.52,6.7,4.2,6.7,[.11,.16,.23]);
  box(1,0,-2,2.5,2.2,1,[.37,.35,.52]);
  box(-5.4,0,-2,-4.9,3.3,-1.5,[.19,.39,.51]);
  box(4.9,0,2.6,5.4,3.3,3.1,[.19,.39,.51]);
  for (const x of [-5.95,5.95]) box(x-.05,.02,-6.2,x+.05,.07,6.2,[.05,.72,.85]);
  for (const z of [-5.9,5.9]) box(-5.9,.02,z-.05,5.9,.07,z+.05,[.05,.66,.77]);
  for (const y of [0.55,3.4]) box(-6.5,y,-6.45,6.5,y+.07,-6.4,[.06,.75,.88]);
  box(-.7,.35,-4.6,.7,2.55,-4.45,[.09,.55,.7]);
  const staticCount = data.length / 6;
  box(-.42,1.1,-4.05,.42,1.9,-3.95,[.98,.32,.36]);
  return {data:new Float32Array(data),staticCount,targetCount:data.length/6-staticCount};
}
export function createRenderer(canvas) {
  const gl = canvas.getContext('webgl2', {alpha:false, antialias:true});
  if (!gl) throw new Error('WebGL 2 unavailable: a compatible browser/GPU is required');
  const p = program(gl);
  const geometry = createGeometry();
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.data, gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(p, 'aPosition');
  const color = gl.getAttribLocation(p, 'aColor');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos,3,gl.FLOAT,false,24,0);
  gl.enableVertexAttribArray(color);
  gl.vertexAttribPointer(color,3,gl.FLOAT,false,24,12);
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  const vp = gl.getUniformLocation(p, 'uProjection');
  const vv = gl.getUniformLocation(p, 'uView');
  let contextLost = false;
  canvas.addEventListener('webglcontextlost', event => {event.preventDefault(); contextLost=true;});
  canvas.addEventListener('webglcontextrestored', () => {contextLost=false; location.reload();});
  return {
    get contextLost() {return contextLost;},
    render(state) {
      if (contextLost) throw new Error('WebGL context lost');
      const width = Math.max(1,Math.round(canvas.clientWidth*devicePixelRatio));
      const height = Math.max(1,Math.round(canvas.clientHeight*devicePixelRatio));
      if (canvas.width !== width || canvas.height !== height) {canvas.width=width;canvas.height=height;}
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clearColor(.017,.028,.058,1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const yaw=state.yaw*Math.PI/1800;
      const pitch=state.pitch*Math.PI/1800;
      const dir=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];
      gl.useProgram(p);
      gl.uniformMatrix4fv(vp,false,perspective(Math.PI/2.7,canvas.width/canvas.height,.05,45));
      gl.uniformMatrix4fv(vv,false,lookAt([state.x/1000,1.65,state.z/1000],dir));
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES,0,geometry.staticCount);
      if (state.target_alive) gl.drawArrays(gl.TRIANGLES,geometry.staticCount,geometry.targetCount);
    }
  };
}
