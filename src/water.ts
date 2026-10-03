import { emitArtShader } from "./game-scenes";

export const waterPresets = [
  {
    name: "Moonlit lagoon",
    story: "Lanterns, a little ferry, and an island settlement reflect across deep moonlit water.",
    defaults: [0.65, 0.83, 0.4, 0.65, 0.64],
  },
  {
    name: "Tropical shallows",
    story: "Clear turquoise water reveals rocks, fish, sand, and moving caustics below a foamy beach.",
    defaults: [0.92, 0.35, 0.65, 0.65, 0.35],
  },
  {
    name: "Storm coast",
    story: "A sailboat crosses rolling water beneath storm clouds, whitecaps, and an illuminated lighthouse.",
    defaults: [0.4, 0.7, 0.82, 0.36, 0.9],
  },
  {
    name: "Cavern spring",
    story: "A waterfall spills into a luminous underground pool with submerged rocks and a wooden crossing.",
    defaults: [0.76, 0.68, 0.66, 0.48, 0.52],
  },
];
export const waterControls = ["Water clarity", "Reflection", "Foam", "Surface sparkle", "Depth absorption"];
export const waterDefault = [...waterPresets[0].defaults];

const environment = `
fn waterMode() -> i32 { if(_EFFECT_==11){return 4;} if(_EFFECT_==41){return 3;} return i32(_WATERB_.y); }
fn waterLevel(mode: i32) -> f32 { if(mode==3){return 0.42;}if(mode==2){return 0.46;}return 0.44; }
fn waterWaves(uv: vec2f, mode: i32) -> vec3f {
  var t:f32=_TIME_; var scale:f32=0.7+_PARAMS_.y*1.6; var strength:f32=0.004+_PARAMS_.x*0.022;
  if(mode==2){strength*=1.65;}
  var x:f32=uv.x*scale; var y:f32=uv.y*scale;
  var a:f32=x*21.0+y*5.0-t*1.1; var b:f32=x*37.0-y*13.0+t*1.5;var d:f32=x*61.0+y*23.0-t*0.7;
  var h:f32=(sin(a)*0.6+sin(b)*0.26+sin(d)*0.14)*strength;
  var dx:f32=(cos(a)*12.6+cos(b)*9.62+cos(d)*8.54)*strength*scale;
  var dy:f32=(cos(a)*3.0-cos(b)*3.38+cos(d)*3.22)*strength*scale;
  var r:vec2f=uv-_ORIGIN_; var dist:f32=length(r); var age:f32=_TIME_-_IMPACT_;
  if(age>=0.0 && age<5.0){var ring:f32=exp(-pow((dist-age*0.15)/0.035,2.0))*exp(-age*0.7);var ripple:f32=sin(dist*130.0-age*7.0)*ring*_PARAMS_.x;h+=ripple*0.012;dx+=r.x/max(dist,0.001)*ripple*0.3;dy+=r.y/max(dist,0.001)*ripple*0.3;}
  return vec3f(h,dx,dy);
}
fn waterFish(c0: vec3f,p: vec2f,center: vec2f,size:f32,ink:vec3f) -> vec3f {var q:vec2f=(p-center)/size;var c:vec3f=artPaint(c0,artEllipse(q,vec2f(0.16,0.066)),ink);c=artPaint(c,artTriangle(vec2f(q.y,q.x)+vec2f(0,0.2),0.07,0.14),ink*0.7);return artPaint(c,circle(q-vec2f(0.10,0.016),0.012),vec3f(0.04,0.09,0.14));}
fn waterEnvironment(p: vec2f,mode:i32) -> vec3f {
  var uv:vec2f=vec2f(p.x/1.64,p.y)*0.5+vec2f(0.5);var c:vec3f=mix(vec3f(0.15,0.30,0.36),vec3f(0.015,0.045,0.12),clamp(p.y*0.5+0.5,0.0,1.0));
  if(mode==0){
    c=artStars(c,p,0.58);c+=vec3f(0.13,0.26,0.30)*exp(-dot(p-vec2f(0.92,0.62),p-vec2f(0.92,0.62))*4.0);
    c=artPaint(c,circle(p-vec2f(0.92,0.62),0.102),vec3f(0.91,0.96,0.82));
    c=artPaint(c,p.y-(-0.10+sin(p.x*2.0)*0.075),vec3f(0.045,0.16,0.19));
    c=artPaint(c,p.y-(-0.20+sin(p.x*2.8+2.0)*0.035),vec3f(0.065,0.23,0.24));
    for(var i:i32=0;i<8;i++){var k:f32=f32(i);var x:f32=-1.72+k*0.50;c=artPine(c,p,vec2f(x,0.16+sin(k*2.0)*0.06),0.55+hash(vec2f(k,0))*0.35,vec3f(0.055,0.23,0.24));}
    c=artRock(c,p,vec2f(-0.65,-0.08),vec2f(0.64,0.10),vec3f(0.10,0.25,0.22));
    c=artHouse(c,p,vec2f(-0.94,0.08),0.52,vec3f(0.38,0.49,0.42),vec3f(0.26,0.23,0.29),1.3);
    c=artHouse(c,p,vec2f(-0.55,0.04),0.45,vec3f(0.39,0.44,0.45),vec3f(0.34,0.23,0.30),1.5);
    c=artHouse(c,p,vec2f(-0.21,0.12),0.56,vec3f(0.28,0.44,0.45),vec3f(0.24,0.26,0.32),1.2);
    c=artPaint(c,box(p-vec2f(-0.60,-0.11),vec2f(0.52,0.018)),vec3f(0.52,0.40,0.28));
    for(var i:i32=0;i<4;i++){var x:f32=-1.03+f32(i)*0.28;c=artPaint(c,box(p-vec2f(x,-0.19),vec2f(0.010,0.09)),vec3f(0.25,0.23,0.20));c+=vec3f(1.3,0.77,0.24)*exp(-dot(p-vec2f(x,-0.06),p-vec2f(x,-0.06))*700.0);}
  }
  if(mode==2){
    c=mix(vec3f(0.20,0.30,0.35),vec3f(0.06,0.11,0.18),clamp(p.y*0.5+0.5,0.0,1.0));
    var cloud:f32=fbm(p*vec2f(2.2,3.1)+vec2f(_TIME_*0.04,0));c+=vec3f(0.15,0.17,0.18)*smoothstep(0.30,0.70,cloud);
    c=artPaint(c,p.y-(-0.16+sin(p.x*2.0+1.3)*0.05),vec3f(0.065,0.11,0.15));
    c=artRock(c,p,vec2f(1.08,-0.12),vec2f(0.61,0.19),vec3f(0.18,0.24,0.26));
    c=artPaint(c,box(p-vec2f(1.08,0.20),vec2f(0.075,0.27)),vec3f(0.76,0.75,0.66));
    c=artPaint(c,box(p-vec2f(1.08,0.33),vec2f(0.075,0.055)),vec3f(0.53,0.19,0.19));
    c=artPaint(c,box(p-vec2f(1.08,0.51),vec2f(0.105,0.035)),vec3f(0.13,0.21,0.27));
    c=artPaint(c,box(p-vec2f(1.08,0.46),vec2f(0.042,0.023)),vec3f(1.8,1.55,0.82));
    c+=vec3f(0.36,0.31,0.19)*exp(-abs(p.y-(0.44+(1.08-p.x)*0.12))*85.0)*(1.0-smoothstep(0.2,1.2,p.x));
  }
  if(mode==3){
    c=mix(vec3f(0.035,0.16,0.20),vec3f(0.015,0.035,0.075),clamp(p.y*0.5+0.5,0.0,1.0));
    for(var i:i32=0;i<7;i++){var k:f32=f32(i);var x:f32=-1.7+k*0.57;var h:f32=0.45+hash(vec2f(k,1))*0.5;c=artPaint(c,artTriangle(vec2f(p.x-x,-p.y+0.77),0.28,h),vec3f(0.07,0.14,0.19));}
    c=artRock(c,p,vec2f(-1.14,0.16),vec2f(0.46,0.73),vec3f(0.12,0.26,0.28));c=artRock(c,p,vec2f(1.17,0.06),vec2f(0.43,0.69),vec3f(0.09,0.21,0.26));
    var fall:f32=mask(box(p-vec2f(-0.60,0.24),vec2f(0.105,0.57)));var streak:f32=0.5+0.5*sin(p.x*130.0+fbm(vec2f(p.x*14.0,p.y*5.0+_TIME_*1.2))*5.0);
    c=mix(c,vec3f(0.38,0.77,0.83)+vec3f(streak*0.27),fall*0.9);
    c+=vec3f(0.08,0.26,0.29)*exp(-dot((p-vec2f(-0.6,-0.17))/vec2f(0.22,0.17),(p-vec2f(-0.6,-0.17))/vec2f(0.22,0.17)));
    for(var i:i32=0;i<5;i++){var x:f32=-1.38+f32(i)*0.70;c=artPaint(c,circle(p-vec2f(x,0.1+sin(f32(i))*0.2),0.028),vec3f(0.38,1.2,1.3));}
  }
  if(mode==0 || mode==2 || mode==3){
    c=artPaint(c,p.y+0.17,mix(vec3f(0.24,0.38,0.33),vec3f(0.06,0.16,0.21),clamp(-p.y,0.0,1.0))*(0.75+noise(p*35.0)*0.25));
    for(var i:i32=0;i<9;i++){var k:f32=f32(i);var x:f32=-1.7+k*0.42;c=artRock(c,p,vec2f(x,-0.60+sin(k*2.0)*0.18),vec2f(0.16,0.075),vec3f(0.32,0.40,0.31));}
    c=waterFish(c,p,vec2f(sin(_TIME_*0.25)*0.8,-0.55+cos(_TIME_*0.3)*0.05),0.55,vec3f(0.68,0.62,0.30));
  }
  if(mode==1){
    var coast:f32=0.66+sin(p.x*1.7)*0.17+sin(p.x*5.0)*0.035;
    c=mix(vec3f(0.035,0.31,0.43),vec3f(0.26,0.64,0.58),clamp(p.y*0.5+0.5,0.0,1.0));
    c+=vec3f(noise(p*40.0)*0.07);c=artPaint(c,coast-p.y,vec3f(0.90,0.81,0.57)*(0.88+noise(p*66.0)*0.1));
    for(var i:i32=0;i<12;i++){var k:f32=f32(i);var x:f32=-1.7+k*0.31;c=artRock(c,p,vec2f(x,-0.35+sin(k*3.2)*0.23),vec2f(0.12+hash(vec2f(k,0))*0.05,0.08),vec3f(0.43,0.46,0.34));}
    c=waterFish(c,p,vec2f(sin(_TIME_*0.2+1.0)*0.7,-0.18),0.65,vec3f(0.87,0.64,0.23));c=waterFish(c,p,vec2f(sin(_TIME_*0.25)*0.7,-0.61),0.55,vec3f(0.31,0.48,0.50));
    c=artRock(c,p,vec2f(0.79,0.5),vec2f(0.19,0.13),vec3f(0.52,0.52,0.36));
  }
  return c;
}
fn waterForeground(c0:vec3f,p:vec2f,mode:i32,level:f32) -> vec3f {
  var c:vec3f=c0;
  if(_CONTEXT_==0){return c;}
  if(_CONTEXT_==2){var q:vec2f=p-vec2f(0.15,level*2.0-1.0+0.03);c=artPaint(c,artEllipse(q,vec2f(0.10,0.04)),vec3f(0.82,0.40,0.24));c=artPaint(c,artLine(q,vec2f(0,0),vec2f(0,0.12),0.007),vec3f(0.78,0.67,0.46));return c;}
  if(mode==0 || mode==2){
    var center:vec2f=vec2f(0.38+sin(_TIME_*0.14)*0.20,level*2.0-1.0+0.034+sin(_TIME_*0.8)*0.012);var q:vec2f=p-center;
    c=artPaint(c,max(artEllipse(q,vec2f(0.27,0.067)),q.y),vec3f(0.48,0.25,0.16));c=artPaint(c,box(q-vec2f(0,0.010),vec2f(0.27,0.011)),vec3f(0.80,0.58,0.35));
    c=artPaint(c,artLine(q,vec2f(-0.02,0),vec2f(-0.02,0.42),0.009),vec3f(0.61,0.47,0.32));c=artPaint(c,artTriangle(q-vec2f(0.075,0.225),0.09,0.33),vec3f(0.87,0.83,0.68));
    c=artPaint(c,circle(q-vec2f(-0.16,0.06),0.027),vec3f(1.5,0.95,0.40));
  }
  if(mode==3){c=artPaint(c,artLine(p,vec2f(-0.40,-0.14),vec2f(0.90,-0.11),0.014),vec3f(0.49,0.37,0.24));for(var i:i32=0;i<5;i++){var x:f32=-0.33+f32(i)*0.28;c=artPaint(c,box(p-vec2f(x,-0.23),vec2f(0.010,0.11)),vec3f(0.33,0.30,0.21));}}
  return c;
}
`;

const material = `
fn waterCaustic(uv:vec2f,t:f32) -> f32 {
  var q:vec2f=uv*vec2f(27.0,35.0);q+=vec2f(sin(q.y*0.4+t*0.7),cos(q.x*0.36-t*0.6))*1.4;
  var a:f32=abs(sin(q.x+sin(q.y*0.7))*sin(q.y+cos(q.x*0.63)));
  var b:f32=abs(sin(q.x*0.77+q.y*0.4-t*0.3)*sin(q.y*0.85-q.x*0.2+t*0.5));
  return pow(1.0-smoothstep(0.02,0.19,min(a,b)),2.0);
}
fn waterMaterial(uv:vec2f,waves:vec3f) -> vec3f {
  var mode:i32=waterMode();var p:vec2f=coords(uv);var a:vec4f=_WATERA_;var depthControl:f32=_WATERB_.x;var level:f32=waterLevel(mode);
  var c:vec3f=sampleScene(uv);var shore:f32=0.66+sin(p.x*1.7)*0.17+sin(p.x*5.0)*0.035;
  var depth:f32=max(0.0,(level-uv.y)*2.8);var wet:f32=1.0-smoothstep(level+waves.x-0.004,level+waves.x+0.004,uv.y);
  if(mode==1){depth=max(0.0,(shore-p.y)*0.65);wet=1.0-smoothstep(-0.015,0.015,p.y-shore-waves.x);}
  if(mode==4){depth=0.25+noise(p*3.0)*0.15;wet=1.0;}
  var displacement:vec2f=waves.yz*(0.003+_PARAMS_.x*0.013);var refracted:vec3f=sampleScene(uv+displacement);
  var absorption:f32=1.0-exp(-depth*(1.0+depthControl*4.0)*(1.25-a.x));
  var deep:vec3f=vec3f(0.013,0.095,0.15);if(mode==1){deep=vec3f(0.018,0.35,0.43);}if(mode==2){deep=vec3f(0.055,0.14,0.19);}if(mode==3){deep=vec3f(0.018,0.14,0.19);}if(mode==4){deep=vec3f(0.10,0.33,0.29);}
  var tint:vec3f=mix(vec3f(0.17,0.45,0.43),deep,clamp(depth,0.0,1.0));if(mode==1){tint=mix(vec3f(0.32,0.74,0.59),deep,clamp(depth*1.3,0.0,1.0));}
  var transmitted:vec3f=mix(refracted*vec3f(0.72,0.90,0.78),tint,absorption);
  var caustic:f32=waterCaustic(uv+displacement,_TIME_)*exp(-depth*1.1)*_PARAMS_.w*a.x;
  transmitted+=vec3f(0.24,0.59,0.39)*caustic*(0.15+absorption*0.4);
  var reflectionUV:vec2f=vec2f(uv.x+waves.y*0.035,level+(level-uv.y)*1.55+waves.z*0.014);
  var reflected:vec3f=mix(sampleScene(reflectionUV),sampleBlur(reflectionUV),clamp(length(waves.yz)*0.15,0.0,0.38));
  if(mode==1 || mode==4){reflected=vec3f(0.56,0.74,0.74)+vec3f(noise(uv*8.0+vec2f(_TIME_*0.02))*0.12);}
  var viewCos:f32=clamp(0.16+depth*0.69-waves.z*0.14,0.10,0.95);var fresnel:f32=0.035+0.965*pow(1.0-viewCos,5.0);
  var water:vec3f=mix(transmitted,reflected*vec3f(0.62,0.85,0.94),clamp((0.15+fresnel)*a.y,0.0,0.84));
  var normal:vec3f=normalize(vec3f(-waves.y*0.8,-waves.z*0.8,1.0));var light:vec3f=normalize(vec3f(0.2,0.38,0.92));var view:vec3f=normalize(vec3f(0,0.25,1));
  var spec:f32=pow(max(dot(reflect(-light,normal),view),0.0),80.0);
  var path:f32=exp(-pow((uv.x-0.78)/(0.025+depth*0.25),2.0));
  var sparkle:f32=spec*(0.2+path*1.8)*a.w;water+=vec3f(0.84,1.03,0.89)*sparkle;
  var foam:f32=exp(-depth*(55.0-a.z*24.0))*(0.55+waterCaustic(uv*0.87,_TIME_*0.7)*0.45);
  var crest:f32=pow(max(0.0,waves.x/(0.005+_PARAMS_.x*0.025)),5.0)*noise(uv*vec2f(160,80)-vec2f(_TIME_*0.3,0));
  if(mode==2){foam+=crest*0.75;}if(mode==3){foam+=exp(-dot((p-vec2f(-0.6,-0.18))/vec2f(0.15,0.08),(p-vec2f(-0.6,-0.18))/vec2f(0.15,0.08)))*(0.5+noise(uv*80.0+vec2f(_TIME_))*0.5);}
  water=mix(water,vec3f(0.91,1.07,1.01),clamp(foam*a.z*1.25,0.0,0.85));
  c=mix(c,water,wet);
  if(mode==2){var cell:vec2f=fract(uv*vec2f(65,20)+vec2f(_TIME_*0.08,-_TIME_*0.9));var rain:f32=exp(-abs(cell.x-0.5)*170.0)*smoothstep(0.1,0.9,cell.y);c+=vec3f(0.10,0.15,0.20)*rain;}
  return waterForeground(c,p,mode,level+waves.x);
}
`;

export function waterShader(wgsl: boolean, includeMaterial = false): string {
  return emitArtShader(environment + (includeMaterial ? material : ""), wgsl);
}
