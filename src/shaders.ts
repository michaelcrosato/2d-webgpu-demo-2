import { gameSceneShader } from "./game-scenes";
import { waterShader } from "./water";
export const fullscreenVertex = `#version 300 es
precision highp float;
precision highp int;
out vec2 v_uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const common = `
precision highp float;
precision highp int;
in vec2 v_uv;
out vec4 outColor;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_time;
uniform float u_impact;
uniform vec2 u_origin;
uniform vec4 u_params;
uniform vec4 u_waterA;
uniform vec4 u_waterB;
uniform vec4 u_waterBody;
uniform vec4 u_waterMotion;
uniform vec4 u_waterTrail[8];
uniform int u_effect;
uniform int u_context;
uniform sampler2D u_atlas;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.0),f.x),f.y);
}
float fbm(vec2 p) { float v=0.0, a=0.5; for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+3.7;a*=0.5;}return v; }
float box(vec2 p, vec2 size) { vec2 q=abs(p)-size;return length(max(q,0.0))+min(max(q.x,q.y),0.0); }
float circle(vec2 p,float radius) { return length(p)-radius; }
float mask(float d) { return 1.0-smoothstep(-0.003,0.003,d); }
float luma(vec3 c) { return dot(c,vec3(0.2126,0.7152,0.0722)); }
vec2 coords(vec2 uv) { vec2 p=uv*2.0-1.0;p.x*=u_resolution.x/u_resolution.y;return p; }
vec3 hue(float t) { return 0.55+0.45*cos(6.28318*(vec3(0.0,0.33,0.67)+t)); }
vec4 sprite(vec2 local, int frame) {
  if(any(lessThan(local,vec2(0)))||any(greaterThanEqual(local,vec2(1))))return vec4(0);
  return texture(u_atlas,vec2((local.x+float(frame))/8.0,local.y));
}
`;

export const sceneFragment = `#version 300 es
${common}
uniform int u_enabled;
${gameSceneShader(false)}
${waterShader(false)}
float shapeField(vec2 p) {
  if(u_context==0) {
    float a=circle(p-vec2(-0.64,0.20),0.28);
    float b=box(p-vec2(0.55,-0.12),vec2(0.24,0.24))-0.03;
    float c=circle(p-vec2(0.05,0.55),0.19);
    return min(a,min(b,c));
  }
  if(u_context==1) {
    return gameObstacles(p,u_effect);
  }
  vec2 q=p; q.x=mod(q.x+0.23,0.46)-0.23;
  return box(q-vec2(0,-0.37),vec2(0.17,0.26));
}
float softShadow(vec2 p,vec2 light,float softness) {
  vec2 delta=light-p;float maxDist=length(delta);vec2 direction=delta/max(maxDist,0.001);
  float result=1.0,t=0.02;
  for(int i=0;i<32;i++){
    float d=shapeField(p+direction*t);
    if(d<0.001)return 0.0;
    result=min(result,softness*d/t);
    t+=clamp(d,0.009,0.15);if(t>maxDist)break;
  }
  return clamp(result,0.0,1.0);
}
float relief(vec2 p){if(u_context==1 && u_effect==1)return max(0.0,-gameSubject(p,1))*2.0+noise(p*(12.0+u_params.y*32.0))*0.06;return 0.12*sin(p.x*(5.0+u_params.y*22.0))*cos(p.y*11.0)+0.35*exp(-dot(p,p)*5.0);}
vec3 abstractScene(vec2 p,int e) {
  vec3 color=vec3(0.025,0.065,0.08)+vec3(0.012,0.022,0.025)*p.y;
  vec2 grid=abs(fract(p*5.0)-0.5);
  color+=vec3(0.023)*(1.0-smoothstep(0.012,0.028,min(grid.x,grid.y)));
  if(e==5||e==6||e==7||e==9||e==39)return color*0.6;
  float d=circle(p-vec2(-0.64,0.20),0.28);
  color=mix(color,vec3(1.0,0.35,0.26)*(0.65+0.35*smoothstep(-0.28,0.0,d)),mask(d));
  vec2 q=p-vec2(0.55,-0.12);float b=box(q,vec2(0.24))-0.03;
  color=mix(color,vec3(0.46,0.36,0.85)*(0.65+0.4*(q.y+0.24)),mask(b));
  float c=circle(p-vec2(0.05,0.55),0.19);
  color=mix(color,vec3(1.0,0.82,0.28),mask(c));
  float torus=abs(length(p-vec2(-0.08,-0.40))-0.20)-0.018;
  color+=vec3(0.25,1.3,1.0)*mask(torus);
  for(int i=0;i<7;i++) {
    float k=float(i);vec2 center=vec2(-0.85+k*0.28,-0.76+sin(k*1.4+u_time)*0.04);
    color+=hue(k/7.0)*mask(circle(p-center,0.025))*1.4;
  }
  return color;
}
vec3 landscape(vec2 p,int e) {
  float daylight=e==21?0.5+0.5*sin(u_params.x*6.28318+u_time*0.12):0.25;
  vec3 sky=mix(vec3(0.022,0.075,0.11),vec3(0.36,0.66,0.72),daylight);
  vec3 color=sky+vec3(0.07,0.11,0.09)*(1.0-p.y)*0.35;
  if(e==21)color=(color-0.25)*(0.6+u_params.y*1.2)+0.25;
  float camera=e==16?(u_time*0.18+(u_pointer.x-0.5)*2.0)*u_params.x:0.0;
  for(int i=0;i<4;i++) {
    float layer=float(i);float x=p.x+camera*(0.12+layer*(0.12+u_params.w*0.12));
    float landscapeScale=e==16?0.6+u_params.y*1.4:1.0;
    float h=-0.12-layer*0.13+sin(x*(2.0+layer)*landscapeScale+layer*2.1)*0.15+sin(x*7.0*landscapeScale)*0.04;
    vec3 mountain=mix(sky,vec3(0.02,0.11+layer*0.027,0.12),0.35+layer*0.17);
    color=mix(color,mountain,mask(p.y-h));
  }
  vec2 moon=vec2(0.9,0.65); if(e==21)moon=vec2(cos(u_params.x*6.28318+u_time*0.12),0.40+sin(u_params.x*6.28318+u_time*0.12)*0.35);
  color+=vec3(0.9,0.98,0.78)*mask(circle(p-moon,0.095))*(0.7+daylight);
  vec2 starCell=floor(p*55.0);float star=step(0.996,hash(starCell))*exp(-length(fract(p*55.0)-0.5)*12.0);
  color+=star*(1.0-daylight)*(e==21?u_params.w*2.0:0.7);
  for(int i=0;i<8;i++) {
    float k=float(i),x=-1.8+k*0.49+sin(k*8.0)*0.1-camera*0.5;
    float sway=e==17?sin(u_time+k)*u_params.x*0.09:0.0;
    vec2 q=p-vec2(x,-0.15);
    float trunk=box(q-vec2(0,-0.28),vec2(0.025,0.38));
    color=mix(color,vec3(0.08,0.14,0.12),mask(trunk));
    for(int j=0;j<3;j++) {
      float z=float(j), yy=q.y+0.02-z*0.15;
      float tree=max(abs(q.x-sway*max(q.y+0.5,0.0))-(0.31-z*0.05-yy*0.43),max(-yy-0.03,yy-0.43));
      color=mix(color,vec3(0.04,0.20+z*0.025,0.18),mask(tree));
    }
  }
  float ground=-0.69+sin(p.x*3.0)*0.035;
  color=mix(color,vec3(0.035,0.09,0.095)+fbm(p*22.0)*0.065,mask(p.y-ground));
  color+=vec3(0.09,0.40,0.22)*exp(-abs(p.y-ground)*120.0);
  for(int i=0;i<3;i++) {
    float k=float(i);vec2 q=p-vec2(-0.66+k*0.65,-0.43+k*0.10);
    float rock=box(q,vec2(0.23,0.047))-0.014;
    color=mix(color,vec3(0.10,0.24,0.22)+noise(p*34.0)*0.05,mask(rock));
    color+=vec3(0.12,0.45,0.26)*mask(rock)*smoothstep(0.018,0.047,q.y);
    vec2 gem=q-vec2(0,0.18+sin(u_time*1.4+k)*0.027);
    float diamond=abs(gem.x)+abs(gem.y)-0.055;
    color+=vec3(0.4,1.5,0.95)*mask(diamond);
  }
  vec2 heroUV=(p-vec2(-0.12,-0.62))/vec2(0.13,0.19)+0.5;
  vec4 hero=sprite(heroUV,int(mod(floor(u_time*6.0),4.0)));
  color=mix(color,hero.rgb,hero.a);
  return color;
}
vec3 city(vec2 p,int e) {
  float day=e==21?0.5+0.5*sin(u_params.x*6.28318+u_time*0.12):0.12;
  vec3 color=mix(vec3(0.035,0.055,0.12),vec3(0.56,0.61,0.67),day)+vec3(0.09,0.07,0.11)*(1.0-p.y)*0.3;
  if(e==21)color=(color-0.25)*(0.6+u_params.y*1.2)+0.25;
  for(int layer=0;layer<3;layer++) {
    float l=float(layer),cam=e==16?u_time*0.12*u_params.x*(0.2+l*0.3)+(u_pointer.x-0.5)*l:0.0;
    float column=floor((p.x+cam)*(3.0+l));float h=hash(vec2(column,l))*0.6+0.15-l*0.15;
    vec2 cell=vec2(fract((p.x+cam)*(3.0+l))-0.5,p.y);
    float building=max(abs(cell.x)-0.44,p.y-h);
    vec3 walls=vec3(0.045+l*0.014,0.075+l*0.018,0.12+l*0.02);
    color=mix(color,walls,mask(building));
    vec2 win=fract(vec2((p.x+cam)*(18.0+l*4.0),p.y*20.0));
    float lit=step(0.50,hash(floor(vec2((p.x+cam)*(18.0+l*4.0),p.y*20.0))));
    float windows=step(0.25,win.x)*step(win.x,0.70)*step(0.2,win.y)*step(win.y,0.65)*lit*mask(building)*step(-0.58,p.y);
    color+=vec3(1.1,0.68,0.27)*windows*(1.0-day*0.75);
  }
  float floorMask=mask(p.y+0.63);
  vec2 tiles=abs(fract(p*vec2(6.0,9.0))-0.5);
  vec3 floorColor=vec3(0.13,0.17,0.21)*(0.7+noise(p*30.0)*0.3);
  floorColor*=smoothstep(0.01,0.025,min(tiles.x,tiles.y));
  color=mix(color,floorColor,floorMask);
  color+=vec3(0.15,0.85,1.6)*mask(box(p-vec2(0.45,0.10),vec2(0.14,0.035)));
  return color;
}
void main() {
  vec2 p=coords(v_uv);int e=u_enabled==1?u_effect:-1;
  vec3 color=u_context==0?abstractScene(p,u_effect):u_context==1?gameScene(p,u_effect,u_enabled):city(p,e);
  if(u_effect==16||u_effect==17||u_effect==18||u_effect==21) {if(u_context==0)color=landscape(p,e);}
  if(u_effect==10)color=waterEnvironment(p,waterMode());
  if(e==0) {
    vec2 light=coords(u_pointer);float dist=length(p-light);
    float shade=softShadow(p,light,mix(35.0,3.0,u_params.w));
    float illumination=exp(-dist*dist/(0.18+u_params.y*2.5))*u_params.x*2.5;
    color*=0.24+shade*illumination;
    color+=vec3(1.0,0.82,0.47)*exp(-dist*dist*80.0)*0.12*u_params.x;
    color+=vec3(2.0,1.5,0.8)*mask(circle(p-light,0.016));
  }
  if(e==1) {
    float eps=0.003;float dx=relief(p+vec2(eps,0))-relief(p-vec2(eps,0));
    float dy=relief(p+vec2(0,eps))-relief(p-vec2(0,eps));
    vec3 n=normalize(vec3(-dx/(2.0*eps)*u_params.w,-dy/(2.0*eps)*u_params.w,1.0));
    vec3 light=normalize(vec3(coords(u_pointer)-p,0.55));
    float diffuse=max(dot(n,light),0.0), spec=pow(max(dot(reflect(-light,n),vec3(0,0,1)),0.0),24.0);
    color=color*(0.25+diffuse*u_params.x*2.2)+vec3(0.8,0.9,1)*spec*u_params.x;
  }
  if(e==3) {
    vec2 q=p-coords(u_pointer);float a=atan(q.y,q.x);
    float beams=pow(max(sin(a*(12.0+u_params.y*50.0)+u_time*0.05),0.0),8.0);
    float mist=0.3+fbm(p*4.0+u_time*0.10)*u_params.w;
    color+=vec3(0.80,0.72,0.39)*beams*mist*exp(-length(q)*0.7)*u_params.x;
  }
  if(e==4) {
    float d=shapeField(p), radius=0.02+u_params.y*0.18;
    float ao=exp(-abs(d)/radius*(0.5+u_params.w*2.0))*step(0.0,d);
    color*=1.0-ao*u_params.x*(0.4+u_params.w*0.6);
  }
  if(e==8) {
    vec2 q=p-vec2(0,-0.66);float h=0.25+u_params.x*1.15;
    float smokeNoise=fbm(vec2(q.x*5.0,q.y*4.0-u_time*0.6));
    float smoke=exp(-pow((q.x-sin(q.y*3.0+u_time)*0.11)/(0.08+max(q.y,0.0)*0.25),2.0))*smoothstep(h*0.4,h,q.y)*(1.0-smoothstep(h,h+0.65,q.y));
    color=mix(color,vec3(0.26,0.28,0.29),smoke*smokeNoise*u_params.w*0.7);
    float n=fbm(vec2(q.x*(6.0+u_params.y*14.0),q.y*6.0-u_time*2.0));
    float envelope=(1.0-q.y/h)-abs(q.x)/(0.09+max(0.0,h-q.y)*0.17);
    float flame=smoothstep(n*0.62,n*0.62+0.16,envelope)*step(0.0,q.y)*step(q.y,h);
    vec3 heat=mix(vec3(1.2,0.08,0.005),vec3(2.3,1.5,0.12),clamp(envelope-n,0.0,1.0));
    color+=heat*flame;
  }
  if(e==17) {
    float bladeId=floor(p.x*(20.0+u_params.y*55.0));
    float root=bladeId/(20.0+u_params.y*55.0),height=0.10+hash(vec2(bladeId,0))*u_params.w*0.30;
    float y=p.y+0.69, bend=sin(u_time*1.5+root*(2.0+u_params.y*5.0))*u_params.x*y*y*4.0;
    float blade=abs(p.x-root-bend)-(1.0-y/height)*0.008;
    float grass=mask(blade)*step(0.0,y)*step(y,height);
    color=mix(color,vec3(0.32,0.64,0.27),grass);
  }
  if(e==18) {
    float h=-0.45+sin(p.x*(2.0+u_params.y*7.0)+u_time*0.2)*u_params.x*0.23+fbm(vec2(p.x*(2.0+u_params.y*5.0),u_time*0.1))*0.26;
    float d=p.y-h;float layers=sin((p.y+fbm(p*3.0)*0.15)*(15.0+u_params.w*40.0));
    vec3 rock=mix(vec3(0.16,0.12,0.15),vec3(0.36,0.25,0.22),layers*0.5+0.5);
    color=mix(color,rock+noise(p*80.0)*0.08,mask(d));
    color+=vec3(0.40,0.82,0.46)*exp(-abs(d)*150.0);
  }
  if(e==19) {
    float density=4.0+u_params.y*20.0;vec2 tile=floor((p+vec2(u_time*0.05,0))*density);
    int frame=4+int(mod(tile.x+tile.y+floor(hash(tile)*u_params.w*5.0),4.0));
    vec4 texel=sprite(fract((p+vec2(u_time*0.05,0))*density),frame);
    float coverage=u_context==0?1.0:1.0-smoothstep(-0.55,-0.55+u_params.x*0.6,p.y);
    color=mix(color,texel.rgb,coverage*u_params.x);
  }
  if(e==20) {
    float size=0.16+u_params.y*0.45;vec2 local=(p-vec2(0,-0.15))/vec2(size,size*1.25)+0.5;
    int frame=int(mod(floor(u_time*(2.0+u_params.w*10.0)),4.0));vec4 hero=sprite(local,frame);
    color=mix(color,hero.rgb,hero.a*u_params.x);
    for(int i=0;i<4;i++) {vec2 q=(p-vec2(-0.55+float(i)*0.36,0.55))/vec2(0.18,0.22)+0.5;vec4 f=sprite(q,i);color=mix(color,f.rgb,f.a);}
  }
  if(e==36) {
    float field=0.0;
    for(int i=0;i<5;i++){float k=float(i);vec2 center=vec2(sin(u_time*0.5+k*1.8),cos(u_time*0.4+k*2.1))*vec2(0.20+u_params.y*0.6,0.34);vec2 d=p-center;field+=(0.015+u_params.x*0.055)/max(dot(d,d),0.002);}
    vec2 mouse=p-coords(u_pointer);field+=0.024/max(dot(mouse,mouse),0.002);
    float blob=smoothstep(1.1,1.15+u_params.w*0.25,field);
    vec3 slime=mix(vec3(0.09,0.40,0.20),vec3(0.68,0.97,0.32),smoothstep(1.1,2.5,field));
    color=mix(color,slime,blob);color+=vec3(0.65,1.0,0.5)*exp(-abs(field-1.25)*14.0)*0.3;
  }
  outColor=vec4(color,1.0);
}`;

export const blurFragment = `#version 300 es
precision highp float;
precision highp int;
in vec2 v_uv;out vec4 outColor;
uniform sampler2D u_input;
uniform vec2 u_direction;
uniform float u_threshold;
vec3 readColor(vec2 uv){return max(texture(u_input,uv).rgb-vec3(u_threshold),vec3(0));}
void main(){
  vec3 c=readColor(v_uv)*0.227027;
  c+=(readColor(v_uv+u_direction*1.384615)+readColor(v_uv-u_direction*1.384615))*0.316216;
  c+=(readColor(v_uv+u_direction*3.230769)+readColor(v_uv-u_direction*3.230769))*0.070270;
  outColor=vec4(c,1.0);
}`;

export const feedbackFragment = `#version 300 es
precision highp float;
precision highp int;
in vec2 v_uv;out vec4 outColor;
uniform sampler2D u_current;uniform sampler2D u_previous;uniform float u_decay;
void main(){vec3 c=texture(u_current,v_uv).rgb;vec3 old=texture(u_previous,v_uv).rgb;outColor=vec4(max(c,old*u_decay),1);}
`;

export const postFragment = `#version 300 es
${common}
${gameSceneShader(false)}
uniform sampler2D u_scene;
uniform sampler2D u_blur;
uniform sampler2D u_baseline;
uniform sampler2D u_backdrop;
uniform float u_compare;
uniform int u_style;
uniform int u_styleOnly;
uniform int u_finish;
vec3 sampleScene(vec2 uv){return texture(u_scene,clamp(uv,vec2(0.001),vec2(0.999))).rgb;}
vec3 sampleBlur(vec2 uv){return texture(u_blur,uv).rgb;}
vec3 sampleBackdrop(vec2 uv){return texture(u_backdrop,uv).rgb;}
float edgeAt(vec2 uv,float width){
  vec2 d=vec2(width)/u_resolution;
  return length(sampleScene(uv+vec2(d.x,0))-sampleScene(uv-vec2(d.x,0)))+length(sampleScene(uv+vec2(0,d.y))-sampleScene(uv-vec2(0,d.y)));
}
vec3 style(vec3 c,vec2 uv,int s,float amount,float scale,float detail){
  vec3 original=c;float lum=clamp(luma(c),0.0,1.0);
  if(s==1){float pixel=2.0+scale*14.0;vec2 grid=u_resolution/pixel;vec2 q=(floor(uv*grid)+0.5)/grid;c=sampleScene(q);float levels=3.0+(1.0-detail)*9.0;c=floor(c*levels+0.5)/levels;}
  if(s==2){float bands=2.0+floor(scale*7.0);c=floor(c*bands+0.5)/bands;c*=1.0-clamp(edgeAt(uv,1.0+detail*2.0)*detail,0.0,0.85);}
  if(s==3){vec2 offset=vec2(noise(uv*150.0),noise(uv*150.0+17.0))-0.5;c=mix(sampleScene(uv+offset*0.006),texture(u_blur,uv).rgb,0.2+scale*0.5);float grain=fbm(uv*u_resolution*0.2);c=mix(c,vec3(0.91,0.89,0.78),0.20);c*=0.90+grain*detail*0.3;}
  if(s==4){float edge=edgeAt(uv,1.0+detail*2.0);float hatch=step(0.65,fract((uv.x+uv.y)*(70.0+scale*220.0)))*(1.0-lum)*0.5;hatch+=step(0.76,fract((uv.x-uv.y)*(90.0+scale*220.0)))*max(0.0,0.5-lum);c=mix(vec3(0.94,0.91,0.80),vec3(0.08,0.12,0.13),clamp(edge*2.0+hatch+(1.0-lum)*0.28,0.0,1.0));}
  if(s==5){c=floor(c*5.0+0.5)/5.0;vec3 behind=sampleScene(uv+vec2(0.003+scale*0.018,-0.003-scale*0.012));float shadow=max(luma(behind)-lum,0.0);c-=shadow*0.7;c*=0.92+noise(uv*u_resolution)*detail*0.15;}
  if(s==6){vec2 p=uv-0.5;vec2 q=0.5+p*(1.0+detail*0.35*dot(p,p));c=sampleScene(q);float scan=0.82+0.18*sin(uv.y*u_resolution.y*(0.6+scale*2.0));int col=int(mod(floor(uv.x*u_resolution.x),3.0));vec3 phosphor=vec3(0.78);phosphor[col]=1.15;c*=scan*phosphor;if(any(lessThan(q,vec2(0)))||any(greaterThan(q,vec2(1))))c=vec3(0.003);c+=texture(u_blur,uv).rgb*0.2;}
  if(s==7){vec2 cell=fract(uv*u_resolution/(3.0+scale*12.0))-0.5;float radius=sqrt(1.0-lum)*(0.35+detail*0.35);float dotMask=1.0-smoothstep(radius-0.045,radius+0.045,length(cell));c=mix(vec3(0.96,0.91,0.76),vec3(0.08,0.12,0.16),dotMask);}
  if(s==8){float edge=edgeAt(uv,1.0+scale*3.0);c=vec3(0.012,0.025,0.045)+hue(uv.x*0.3+uv.y*0.4+u_time*0.08)*edge*3.0+texture(u_blur,uv).rgb*detail*0.32;}
  if(s==9){
    int bayer[16]=int[16](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);
    ivec2 cell=ivec2(floor(uv*u_resolution/(1.0+scale*4.0)))%4;
    float threshold=float(bayer[cell.y*4+cell.x])/16.0;
    float value=clamp(lum*(0.6+detail*1.5),0.0,1.0);int level=int(clamp(floor(value*3.0+threshold),0.0,3.0));
    vec3 palette[4]=vec3[4](vec3(0.07,0.10,0.22),vec3(0.36,0.24,0.49),vec3(0.91,0.43,0.43),vec3(0.98,0.91,0.73));c=palette[level];
  }
  return mix(original,c,amount);
}
${waterShader(false, true)}
void main(){
  vec2 uv=v_uv;int e=u_styleOnly==1?-1:u_effect;vec4 a=u_params;vec3 c=sampleScene(uv);
  if(e==10){
    c=waterMaterial(uv,waterWaves(uv,waterMode()));
  }
  if(e==11 && u_context==1)c=waterMaterial(uv,waterWaves(uv,waterMode()));
  if((e==11 && u_context!=1)||e==22){
    vec2 delta=(uv-u_origin)*vec2(u_resolution.x/u_resolution.y,1);float dist=length(delta);vec2 dir=normalize(delta+0.0001);
    float age=u_time-u_impact;float activity=step(0.0,age)*exp(-age*0.7);float radius=age*0.35;
    float ring=exp(-pow((dist-radius)/(0.018+(e==22?a.y:a.w)*0.07),2.0))*activity;
    if(e==11)ring=sin(dist*(25.0+a.y*90.0)-u_time*4.0)*exp(-dist*2.0)*0.25+ring*sin(dist*80.0-age*8.0);
    vec2 offset=dir*ring*a.x*(e==22?0.05:0.025);offset.x*=u_resolution.y/u_resolution.x;
    c=sampleScene(uv+offset);if(e==22)c+=vec3(0.2,0.7,0.7)*ring*a.w;
  }
  if(e==12){float heat=1.0-smoothstep(0.1,0.35+a.w*0.5,uv.y);vec2 n=vec2(fbm(uv*(5.0+a.y*25.0)+vec2(0,-u_time)),noise(uv*35.0-u_time))-0.5;c=sampleScene(uv+n*heat*a.x*0.07);}
  if(e==13){vec2 p=coords(uv)-coords(u_pointer);float d=u_context==1?circle(p,0.38):box(p,vec2(0.35,0.26))-0.045;float m=mask(d);vec2 q=uv+normalize(p+0.001)*a.w*0.025;vec3 glass=texture(u_blur,q).rgb*0.85+vec3(0.12,0.17,0.19)+noise(uv*u_resolution)*0.025;glass+=vec3(0.4,0.7,0.8)*exp(-abs(d)*150.0);c=mix(c,glass,m*a.x);}
  if(e==14){vec3 original=c;float n=fbm(uv*(4.0+a.y*15.0)+u_time*0.035);float threshold=a.x*1.1-0.05;float d=n-threshold;float m=smoothstep(0.0,0.018,d);c=mix(u_context==1?sampleBackdrop(uv):vec3(0.018,0.033,0.044),c,m);float rim=(1.0-smoothstep(0.0,0.015+a.w*0.08,d))*m;c+=vec3(1.7,0.56,0.06)*rim;if(u_context==1)c=mix(original,c,mask(gameSubject(coords(uv),e)));}
  if(e==15){float band=floor(uv.y*50.0);float interference=step(0.95,hash(vec2(band,floor(u_time*8.0))));vec2 q=uv+vec2(interference*a.w*0.04,0);float scan=0.6+0.4*sin(uv.y*(150.0+a.y*600.0)-u_time*3.0);vec3 hologram=vec3(0.10,0.95,1.4)*luma(sampleScene(q))*scan*(0.9+0.1*sin(u_time*12.0));float region=u_context==1?mask(gameSubject(coords(uv),e)):1.0;c=mix(c,hologram,a.x*region)+texture(u_blur,uv).rgb*0.2*region;}
  if(e==23){vec2 d=uv-0.5;float pulse=1.0+sin(u_time*2.0)*a.w;vec2 offset=d*pow(length(d),0.5+a.y*2.0)*a.x*0.08*pulse;c=vec3(sampleScene(uv+offset).r,c.g,sampleScene(uv-offset).b);}
  if(e==24){float focus=abs(uv.y-u_pointer.y);float width=0.02+a.w*0.25;float m=smoothstep(width,width*2.0+0.01,focus);c=mix(c,texture(u_blur,uv).rgb,m*a.x);}
  if(e==25){float lum=luma(c);vec3 grade=mix(vec3(lum),c,a.y*2.0);grade=(grade-0.5)*(0.7+a.w*1.4)+0.5;grade+=mix(vec3(-0.03,0.03,0.08),vec3(0.1,0.04,-0.05),clamp(lum,0.0,1.0));c=mix(c,grade,a.x);}
  if(e==26){float radius=length((uv-0.5)*vec2(1.1,1.0));float vignette=smoothstep(0.12+a.y*0.4,0.8,radius);c*=1.0-vignette*a.x;c+=(hash(uv*u_resolution+mod(u_time*31.0,100.0))-0.5)*a.w*0.10;}
  if(e==27){float band=floor(uv.y*(10.0+a.y*120.0));float random=hash(vec2(band,floor(u_time*8.0)));float shift=(random-0.5)*a.x*0.24*step(0.82-a.x*0.3,random);vec2 q=uv+vec2(shift,0);c=sampleScene(q);c.r=sampleScene(q+vec2(a.w*0.016,0)).r;c.b=sampleScene(q-vec2(a.w*0.016,0)).b;c*=0.9+0.1*sin(uv.y*600.0);}
  if(e==37){vec2 d=coords(uv)-coords(u_pointer);float radius=0.15+a.y*0.65;float m=1.0-smoothstep(radius,radius+0.005+a.w*0.12,length(d));vec3 inside=sampleScene(vec2(1.0-uv.x,uv.y))*vec3(0.5,1.1,1.3);c=mix(c,inside,m*a.x);c+=vec3(0.20,0.95,1.2)*exp(-abs(length(d)-radius)*180.0)*a.x;}
  if(e==2)c+=texture(u_blur,uv).rgb*a.x*2.5;
  int selectedStyle=0;
  if(e>=28&&e<=35)selectedStyle=e-27;
  if(e==38)selectedStyle=9;
  if(selectedStyle>0)c=style(c,uv,selectedStyle,a.x,a.y,a.w);
  if(u_style>0)c=style(c,uv,u_style,0.90,0.45,0.55);
  if(u_finish==1){c=max(c,vec3(0));c=c/(1.0+c*0.35);c=pow(c,vec3(0.90));}
  if(u_compare>=0.0&&uv.x<u_compare){c=texture(u_baseline,uv).rgb;c=max(c,vec3(0));c=c/(1.0+c*0.35);c=pow(c,vec3(0.90));}
  outColor=vec4(c,1.0);
}`;

export const particleUpdateVertex = `#version 300 es
precision highp float;
precision highp int;
layout(location=0)in vec4 a_state;
layout(location=1)in vec4 a_extra;
out vec4 nextState;out vec4 nextExtra;
uniform float u_dt;uniform float u_time;uniform vec2 u_pointer;uniform vec4 u_params;uniform int u_effect;uniform int u_context;uniform float u_aspect;
void main(){
  vec2 pos=a_state.xy,vel=a_state.zw;float seed=a_extra.y,age=a_extra.x+u_dt;
  if(u_effect==9){vel=vec2((u_params.w-0.5)*0.6,-0.25-seed*0.45);}
  else if(u_effect==6 && u_context==1){vec2 origin=vec2(sin(u_time*0.8)*0.78-0.18,-0.29);pos=origin+vec2(-seed*0.15,sin(seed*35.0)*0.025);vel=vec2(-0.25,0);}
  else if(u_effect==5 && u_context==1){vec2 mouse=(u_pointer*2.0-1.0)*vec2(u_aspect,1.0);float radius=0.15+seed*0.4;float angle=u_time*(0.3+seed*0.25)+seed*37.0;vec2 target=mouse*0.65+vec2(cos(angle)*radius,sin(angle)*radius*0.75);vel=(target-pos)*1.5;}
  else{
    vec2 mouse=(u_pointer*2.0-1.0)*vec2(u_aspect,1.0);vec2 d=mouse-pos;
    float scale=2.0+u_params.y*5.0;
    vec2 field=vec2(sin(pos.y*scale+u_time*0.5+seed*2.0),cos(pos.x*scale-u_time*0.3));
    vec2 vortex=vec2(-d.y,d.x)/(0.25+dot(d,d));
    vec2 force=field*0.22+vortex*(0.12+u_params.w*0.45)+d*0.09;
    if(u_effect==7)force=field*0.5+vortex*u_params.w*0.45;
    vel=mix(vel,force,min(u_dt*2.0,1.0));
  }
  pos+=vel*u_dt;pos.x=mod(pos.x+u_aspect,2.0*u_aspect)-u_aspect;pos.y=mod(pos.y+1.0,2.0)-1.0;
  nextState=vec4(pos,vel);nextExtra=vec4(age,seed,a_extra.zw);gl_Position=vec4(0);
}`;

export const particleUpdateFragment = `#version 300 es
precision highp float;
precision highp int;out vec4 outColor;void main(){outColor=vec4(0);}`;

export const particleVertex = `#version 300 es
precision highp float;
precision highp int;
layout(location=0)in vec4 a_state;layout(location=1)in vec4 a_extra;
out vec2 v_local;out float v_seed;
uniform float u_aspect;uniform vec4 u_params;uniform int u_effect;uniform int u_context;
void main(){
  vec2 corners[4]=vec2[4](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(1,1));vec2 corner=corners[gl_VertexID];
  float size=u_effect==39?0.018+u_params.y*0.045:0.0018+u_params.y*0.012;
  vec2 dims=vec2(size);if(u_effect==9&&u_context>=1)dims*=vec2(0.3,4.0);
  vec2 p=a_state.xy+corner*dims;gl_Position=vec4(p.x/u_aspect,p.y,0,1);v_local=corner;v_seed=a_extra.y;
}`;

export const particleFragment = `#version 300 es
precision highp float;
precision highp int;in vec2 v_local;in float v_seed;out vec4 outColor;
uniform sampler2D u_atlas;uniform int u_effect;uniform float u_time;uniform int u_context;
void main(){
  if(u_effect==39){int frame=int(mod(floor(u_time*6.0+v_seed*4.0),4.0));vec2 local=v_local*0.5+0.5;outColor=texture(u_atlas,vec2((local.x+float(frame))/8.0,local.y));return;}
  float radial=length(v_local);float alpha=exp(-radial*radial*3.5)*(1.0-smoothstep(0.7,1.0,radial));
  vec3 color=0.55+0.45*cos(6.28318*(vec3(0,0.33,0.67)+v_seed*0.45+u_time*0.02));
  if(u_effect==9)color=u_context==2?vec3(0.25,0.45,0.62):vec3(0.80,0.90,1.0);
  outColor=vec4(color*0.7,alpha*0.55);
}`;
