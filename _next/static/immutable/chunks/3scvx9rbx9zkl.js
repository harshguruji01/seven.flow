(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,26884,e=>{"use strict";var t=e.i(43476),r=e.i(71645);function i(e){let{image:i,resolution:u=5,cursorSize:o=.5,cursorPower:a=.5,distortionPower:n=.4}=e,v=(0,r.useRef)(null),c=(0,r.useRef)(null),s=(0,r.useRef)(null);(0,r.useEffect)(()=>{var e;let t,r,l,m,_,f,p,x,g,h,d,E,T,y,R,D=v.current,U=c.current;if(!D||!U)return;let w=D.getContext("webgl",{alpha:!0});if(!w)return;w.getExtension("OES_texture_float"),w.getExtension("OES_texture_float_linear"),w.clearColor(0,0,0,0);let b={cursorSize:.5+(o-.1)*4.5/.9,cursorPower:5+(a-.1)*45/.9,distortionPower:n},A=5/6,L={x:.65*U.clientWidth,y:.5*U.clientHeight,dx:0,dy:0,moved:!1},F={w:0,h:0},B=null,S=1,P=!1,X=`
precision highp float;

varying vec2 vUv;
attribute vec2 a_position;

varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;
uniform vec2 u_texel;

void main () {
  vUv = .5 * (a_position + 1.);
  vL = vUv - vec2(u_texel.x, 0.);
  vR = vUv + vec2(u_texel.x, 0.);
  vT = vUv + vec2(0., u_texel.y);
  vB = vUv - vec2(0., u_texel.y);
  gl_Position = vec4(a_position, 0., 1.);
}
`,z=`
precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D u_velocity_texture;
uniform sampler2D u_input_texture;
uniform vec2 u_texel;
uniform vec2 u_output_textel;
uniform float u_dt;
uniform float u_dissipation;

vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
  vec2 st = uv / tsize - 0.5;
  vec2 iuv = floor(st);
  vec2 fuv = fract(st);
  vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
  vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
  vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
  vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
  return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
}

void main () {
  vec2 coord = vUv - u_dt * bilerp(u_velocity_texture, vUv, u_texel).xy * u_texel;
  vec4 velocity = bilerp(u_input_texture, coord, u_output_textel);
  gl_FragColor = u_dissipation * velocity;
}
`,I=`
precision highp float;
precision highp sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_velocity_texture;

void main () {
  float L = texture2D(u_velocity_texture, vL).x;
  float R = texture2D(u_velocity_texture, vR).x;
  float T = texture2D(u_velocity_texture, vT).y;
  float B = texture2D(u_velocity_texture, vB).y;
  float div = .25 * (R - L + T - B);
  gl_FragColor = vec4(div, 0., 0., 1.);
}
`,M=`
precision highp float;
precision highp sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_pressure_texture;
uniform sampler2D u_divergence_texture;

void main () {
  float L = texture2D(u_pressure_texture, vL).x;
  float R = texture2D(u_pressure_texture, vR).x;
  float T = texture2D(u_pressure_texture, vT).x;
  float B = texture2D(u_pressure_texture, vB).x;
  float divergence = texture2D(u_divergence_texture, vUv).x;
  float pressure = (L + R + B + T - divergence) * .25;
  gl_FragColor = vec4(pressure, 0., 0., 1.);
}
`,C=`
precision highp float;
precision highp sampler2D;

varying highp vec2 vUv;
varying highp vec2 vL;
varying highp vec2 vR;
varying highp vec2 vT;
varying highp vec2 vB;
uniform sampler2D u_pressure_texture;
uniform sampler2D u_velocity_texture;

void main () {
  float L = texture2D(u_pressure_texture, vL).x;
  float R = texture2D(u_pressure_texture, vR).x;
  float T = texture2D(u_pressure_texture, vT).x;
  float B = texture2D(u_pressure_texture, vB).x;
  vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0., 1.);
}
`,O=`
precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_disturb_power;
uniform sampler2D u_output_texture;
uniform sampler2D u_velocity_texture;
uniform sampler2D u_text_texture;
uniform vec2 u_point;
uniform float u_canvas_scale; // scale < 1.0 to render image smaller than canvas
uniform float u_inner_scale; // additional inner rectangle scale (e.g., 0.8333)

vec2 get_img_uv() {
  // Start from canvas UV and center
  vec2 uv = vUv - 0.5;

  // First shrink to container size inside overscanned canvas
  uv *= u_canvas_scale;

  // Map only the central inner rectangle to the image by expanding UVs
  // Dividing by the inner scale means only a center region of size u_inner_scale
  // in canvas space maps into [0,1]; outside becomes <0 or >1 and thus transparent
  uv /= u_inner_scale;

  // Apply object-fit: cover mapping (from reverse-fish-eye implementation)
  float containerAspect = u_ratio; // width / height of container (not canvas)
  float imageAspect = u_img_ratio; // image width / height
  vec2 scale = vec2(1.0);
  if (containerAspect > imageAspect) {
    // Container is wider than image: scale to fill height, crop left/right
    scale.y = imageAspect / containerAspect;
  } else {
    // Container is taller than image: scale to fill width, crop top/bottom
    scale.x = containerAspect / imageAspect;
  }
  uv *= scale;
  return uv + 0.5;
}

// Frame UVs define the inner rectangle region (no cover scaling)
vec2 get_frame_uv() {
  vec2 uv = vUv - 0.5;
  uv *= u_canvas_scale;
  uv /= u_inner_scale;
  return uv + 0.5;
}

float get_img_frame_alpha(vec2 uv, float img_frame_width) {
  float img_frame_alpha = smoothstep(0., img_frame_width, uv.x) * smoothstep(1., 1. - img_frame_width, uv.x);
  img_frame_alpha *= smoothstep(0., img_frame_width, uv.y) * smoothstep(1., 1. - img_frame_width, uv.y);
  return img_frame_alpha;
}

// Reduce striation when sampling outside the image bounds
vec3 sample_image_smooth(vec2 uv) {
  vec2 uvc = clamp(uv, 0.0, 1.0);
  vec3 base = texture2D(u_text_texture, vec2(uvc.x, 1.0 - uvc.y)).rgb;

  float yBelow = step(uv.y, 0.0);
  float yAbove = step(1.0, uv.y);
  float xLeft = step(uv.x, 0.0);
  float xRight = step(1.0, uv.x);
  float outOfBounds = max(max(yBelow, yAbove), max(xLeft, xRight));

  // If sampling outside bounds, blur to avoid repeating single edge pixels
  if (outOfBounds > 0.0) {
    float d = 0.002; // small kernel
    vec3 sum = vec3(0.0);
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x - d, 0.0, 1.0), 1.0 - clamp(uvc.y - d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x, 0.0, 1.0), 1.0 - clamp(uvc.y - d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x + d, 0.0, 1.0), 1.0 - clamp(uvc.y - d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x - d, 0.0, 1.0), 1.0 - clamp(uvc.y, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x, 0.0, 1.0), 1.0 - clamp(uvc.y, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x + d, 0.0, 1.0), 1.0 - clamp(uvc.y, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x - d, 0.0, 1.0), 1.0 - clamp(uvc.y + d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x, 0.0, 1.0), 1.0 - clamp(uvc.y + d, 0.0, 1.0))).rgb;
    sum += texture2D(u_text_texture, vec2(clamp(uvc.x + d, 0.0, 1.0), 1.0 - clamp(uvc.y + d, 0.0, 1.0))).rgb;
    base = sum / 9.0;
  }
  return base;
}

void main () {
  float offset = texture2D(u_output_texture, vUv).r;

  vec2 velocity = texture2D(u_velocity_texture, vUv).xy;
  velocity += .001;
//        velocity = normalize(velocity);

  vec2 img_uv = get_img_uv();
  img_uv -= u_disturb_power * normalize(velocity) * offset;
  img_uv -= u_disturb_power * normalize(velocity) * offset;

  // Use a disturbance on the frame UVs too so the border ripple propagates outward
  vec2 frame_uv = get_frame_uv();
  frame_uv -= u_disturb_power * normalize(velocity) * offset;

  vec3 img = sample_image_smooth(img_uv);
  // Use the disturbed image UVs to compute opacity so ripples affect the border
  float opacity = get_img_frame_alpha(frame_uv, .002);
  gl_FragColor = vec4(img * opacity, opacity);
}
`;function N(e,t){let r=w.createShader(t);if(w.shaderSource(r,e),w.compileShader(r),!w.getShaderParameter(r,w.COMPILE_STATUS)){let e=w.getShaderInfoLog(r)||"Shader compile error";throw w.deleteShader(r),Error(e)}return r}function G(e,t){let r=w.createProgram(),i=N(e,w.VERTEX_SHADER),u=N(t,w.FRAGMENT_SHADER);if(w.attachShader(r,i),w.attachShader(r,u),w.bindAttribLocation(r,0,"a_position"),w.linkProgram(r),!w.getProgramParameter(r,w.LINK_STATUS))throw Error(w.getProgramInfoLog(r)||"Program link error");let o={},a=w.getProgramParameter(r,w.ACTIVE_UNIFORMS);for(let e=0;e<a;e++){let t=w.getActiveUniform(r,e);t&&(o[t.name]=w.getUniformLocation(r,t.name))}return{program:r,uniforms:o}}function H(e=null){let t=w.createBuffer();w.bindBuffer(w.ARRAY_BUFFER,t),w.bufferData(w.ARRAY_BUFFER,new Float32Array([-1,-1,-1,1,1,1,1,-1]),w.STATIC_DRAW);let r=w.createBuffer();w.bindBuffer(w.ELEMENT_ARRAY_BUFFER,r),w.bufferData(w.ELEMENT_ARRAY_BUFFER,new Uint16Array([0,1,2,0,2,3]),w.STATIC_DRAW),w.vertexAttribPointer(0,2,w.FLOAT,!1,0,0),w.enableVertexAttribArray(0),null==e?(w.viewport(0,0,w.drawingBufferWidth,w.drawingBufferHeight),w.bindFramebuffer(w.FRAMEBUFFER,null)):(w.viewport(0,0,e.width,e.height),w.bindFramebuffer(w.FRAMEBUFFER,e.fbo)),w.drawElements(w.TRIANGLES,6,w.UNSIGNED_SHORT,0)}function W(e,t){w.activeTexture(w.TEXTURE0);let r=w.createTexture();w.bindTexture(w.TEXTURE_2D,r),w.texParameteri(w.TEXTURE_2D,w.TEXTURE_MIN_FILTER,w.LINEAR),w.texParameteri(w.TEXTURE_2D,w.TEXTURE_MAG_FILTER,w.LINEAR),w.texParameteri(w.TEXTURE_2D,w.TEXTURE_WRAP_S,w.CLAMP_TO_EDGE),w.texParameteri(w.TEXTURE_2D,w.TEXTURE_WRAP_T,w.CLAMP_TO_EDGE),w.texImage2D(w.TEXTURE_2D,0,w.RGB,e,t,0,w.RGB,w.FLOAT,null);let i=w.createFramebuffer();return w.bindFramebuffer(w.FRAMEBUFFER,i),w.framebufferTexture2D(w.FRAMEBUFFER,w.COLOR_ATTACHMENT0,w.TEXTURE_2D,r,0),w.viewport(0,0,e,t),w.clear(w.COLOR_BUFFER_BIT),{fbo:i,width:e,height:t,attach:e=>(w.activeTexture(w.TEXTURE0+e),w.bindTexture(w.TEXTURE_2D,r),e)}}function Y(e,t){let r=W(e,t),i=W(e,t);return{width:e,height:t,texelSizeX:1/e,texelSizeY:1/t,read:()=>r,write:()=>i,swap(){let e=r;r=i,i=e}}}let V=G(X,`
precision highp float;
precision highp sampler2D;

varying vec2 vUv;
uniform sampler2D u_input_texture;
uniform float u_ratio;
uniform float u_img_ratio;
uniform vec3 u_point_value;
uniform vec2 u_point;
uniform float u_point_size;

void main () {
  vec2 p = vUv - u_point.xy;
  p.x *= u_ratio;
  vec3 splat = .6 * pow(2., -dot(p, p) / u_point_size) * u_point_value;
  vec3 base = texture2D(u_input_texture, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.);
}
`),k=G(X,I),j=G(X,M),q=G(X,C),K=G(X,z),$=G(X,O),J=!1,Q=!0,Z=0;function ee(){ev(),Q&&performance.now()-Z<2e3?s.current=requestAnimationFrame(ee):(J=!1,s.current=0)}function et(){J||(s.current=requestAnimationFrame(()=>ev()))}ea(),eu();let er=(t=()=>{P=!0},r=()=>{P=!1,L.moved=!1},l=e=>{if(!P)return;let t=U.getBoundingClientRect();eo(e.clientX-t.left,e.clientY-t.top)},m=e=>{P=!0;let t=U.getBoundingClientRect();eo(e.clientX-t.left,e.clientY-t.top)},_=e=>{P=!0,e.preventDefault();let t=e.targetTouches[0],r=U.getBoundingClientRect();eo(t.clientX-r.left,t.clientY-r.top)},f=()=>{P=!0},p=()=>{P=!1,L.moved=!1},x=()=>{ea(),eu(),B&&w.bindTexture(w.TEXTURE_2D,B),et()},D.addEventListener("mouseenter",t),D.addEventListener("mouseleave",r),D.addEventListener("click",l),D.addEventListener("mousemove",m),D.addEventListener("touchstart",f,{passive:!0}),D.addEventListener("touchend",p,{passive:!0}),D.addEventListener("touchmove",_,{passive:!1}),window.addEventListener("resize",x),(g=new ResizeObserver(()=>{x()})).observe(U),(h=new IntersectionObserver(([e])=>{Q=e.isIntersecting})).observe(U),()=>{h.disconnect(),D.removeEventListener("mouseenter",t),D.removeEventListener("mouseleave",r),D.removeEventListener("click",l),D.removeEventListener("mousemove",m),D.removeEventListener("touchstart",f),D.removeEventListener("touchend",p),D.removeEventListener("touchmove",_),window.removeEventListener("resize",x),g.disconnect()});et();let ei=i?.src;function eu(){E=Y(F.w,F.h),T=Y(F.w,F.h),y=W(F.w,F.h),R=Y(F.w,F.h)}function eo(e,t){Z=performance.now(),!J&&Q&&(J=!0,s.current=requestAnimationFrame(ee)),L.moved=!0,L.dx=6*(e-L.x),L.dy=6*(t-L.y),L.x=e,L.y=t}function ea(){let e=U.clientWidth,t=U.clientHeight,r=Math.min(window.devicePixelRatio||1,2);D.width=Math.max(2,Math.round(1.2*e*r)),D.height=Math.max(2,Math.round(1.2*t*r));let i=1.2*e,o=1.2*t;D.style.width=`${i}px`,D.style.height=`${o}px`;let a=128+(u-1)*384/9;F.w=Math.round(i/o*a),F.h=Math.round(a)}function en(){let e=1.2*U.clientWidth,t=1.2*U.clientHeight,r=.5*(e-U.clientWidth),i=.5*(t-U.clientHeight);return{u:(L.x+r)/e,v:1-(L.y+i)/t}}function ev(){if(!B)return;let e=1/60;if(L.moved){L.moved=!1,w.useProgram(V.program),w.uniform1i(V.uniforms.u_input_texture,T.read().attach(1)),w.uniform1f(V.uniforms.u_ratio,U.clientWidth/Math.max(1,U.clientHeight));let e=en();w.uniform2f(V.uniforms.u_point,e.u,e.v),w.uniform3f(V.uniforms.u_point_value,L.dx,-L.dy,0),w.uniform1f(V.uniforms.u_point_size,.001*b.cursorSize),H(T.write()),T.swap(),w.uniform1i(V.uniforms.u_input_texture,E.read().attach(1)),w.uniform3f(V.uniforms.u_point_value,.001*b.cursorPower,0,0),H(E.write()),E.swap()}w.useProgram(k.program),w.uniform2f(k.uniforms.u_texel,T.texelSizeX,T.texelSizeY),w.uniform1i(k.uniforms.u_velocity_texture,T.read().attach(1)),H(y),w.useProgram(j.program),w.uniform2f(j.uniforms.u_texel,T.texelSizeX,T.texelSizeY),w.uniform1i(j.uniforms.u_divergence_texture,y.attach(1));for(let e=0;e<16;e++)w.uniform1i(j.uniforms.u_pressure_texture,R.read().attach(2)),H(R.write()),R.swap();w.useProgram(q.program),w.uniform2f(q.uniforms.u_texel,T.texelSizeX,T.texelSizeY),w.uniform1i(q.uniforms.u_pressure_texture,R.read().attach(1)),w.uniform1i(q.uniforms.u_velocity_texture,T.read().attach(2)),H(T.write()),T.swap(),w.useProgram(K.program),w.uniform2f(K.uniforms.u_texel,T.texelSizeX,T.texelSizeY),w.uniform2f(K.uniforms.u_output_textel,T.texelSizeX,T.texelSizeY),w.uniform1i(K.uniforms.u_velocity_texture,T.read().attach(1)),w.uniform1i(K.uniforms.u_input_texture,T.read().attach(1)),w.uniform1f(K.uniforms.u_dt,e),w.uniform1f(K.uniforms.u_dissipation,.97),H(T.write()),T.swap(),w.useProgram(K.program),w.uniform2f(K.uniforms.u_output_textel,E.texelSizeX,E.texelSizeY),w.uniform1i(K.uniforms.u_input_texture,E.read().attach(2)),w.uniform1f(K.uniforms.u_dt,8*e),w.uniform1f(K.uniforms.u_dissipation,.98),H(E.write()),E.swap(),w.useProgram($.program);let t=en();w.uniform2f($.uniforms.u_point,t.u,t.v),w.uniform1i($.uniforms.u_velocity_texture,T.read().attach(2)),w.uniform1f($.uniforms.u_ratio,U.clientWidth/Math.max(1,U.clientHeight)),w.uniform1f($.uniforms.u_img_ratio,S),w.uniform1f($.uniforms.u_disturb_power,b.distortionPower),w.uniform1i($.uniforms.u_output_texture,E.read().attach(1)),w.uniform1f($.uniforms.u_canvas_scale,1),w.uniform1f($.uniforms.u_inner_scale,A),B&&(w.activeTexture(w.TEXTURE0),w.bindTexture(w.TEXTURE_2D,B),w.uniform1i($.uniforms.u_text_texture,0)),H(),w.viewport(0,0,w.drawingBufferWidth,w.drawingBufferHeight),w.bindFramebuffer(w.FRAMEBUFFER,null),w.drawElements(w.TRIANGLES,6,w.UNSIGNED_SHORT,0),D.style.opacity="1"}return ei&&(e=ei,(d=new Image).crossOrigin="anonymous",d.src=e,d.onload=()=>{S=d.naturalWidth/Math.max(1,d.naturalHeight),B=w.createTexture(),w.bindTexture(w.TEXTURE_2D,B),w.texParameteri(w.TEXTURE_2D,w.TEXTURE_MIN_FILTER,w.LINEAR),w.texParameteri(w.TEXTURE_2D,w.TEXTURE_MAG_FILTER,w.LINEAR),w.texParameteri(w.TEXTURE_2D,w.TEXTURE_WRAP_S,w.CLAMP_TO_EDGE),w.texParameteri(w.TEXTURE_2D,w.TEXTURE_WRAP_T,w.CLAMP_TO_EDGE),w.activeTexture(w.TEXTURE0),w.bindTexture(w.TEXTURE_2D,B),w.texImage2D(w.TEXTURE_2D,0,w.RGBA,w.RGBA,w.UNSIGNED_BYTE,d),et()}),()=>{s.current&&cancelAnimationFrame(s.current),"function"==typeof er&&er()}},[i?.src,u,o,a,n]);let l=!!(i&&i.src);return(0,t.jsx)("div",{ref:c,style:{position:"relative",width:"100%",height:"100%",overflow:"visible",top:"0%",left:"0%"},children:l&&(0,t.jsx)("canvas",{ref:v,style:{position:"absolute",top:"-10%",left:"-10%",width:"120%",height:"120%",overflow:"hidden",opacity:0}})})}i.displayName="Liquid Hover",e.s(["default",0,i])}]);