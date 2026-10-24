import {clamp,mix,smooth,catmull,type Point,TAU} from './math';
import type {AsciiRenderer,Vertex} from './renderer';
import type {EnergyField} from './field';
export const WHALE_NODES=28;
const RINGS=42,SIDES=20;
export function halfWidth(s:number){if(s<.13)return .115*Math.sqrt(Math.max(0,1-((s-.13)/.13)**2));if(s<.3)return .115+.007*Math.sin((s-.13)/.17*Math.PI);if(s<.91)return .012+.103*(1-(s-.3)/.61)**1.3;return .012*(1-(s-.91)/.09)+.007}
export class WhaleSystem {
  nodes=new Float32Array(WHALE_NODES*3);w=1;h=1;length=420;x=0;y=0;heading=-.3;pitch=0;roll=0;z=-28;depth=.65;phase=0;eventBlend=0;eventX=0;eventY=0;eventZ=0;eventPitch=0;eventRoll=0;
  private seeded=false;private vertices:Vertex[]=Array.from({length:(RINGS+1)*SIDES},()=>[0,0,0,0,0,0]);
  resize(w:number,h:number){const oldW=this.w,oldH=this.h,oldL=this.length;this.w=w;this.h=h;this.length=Math.min(640,Math.max(250,w*.55));if(!this.seeded)this.update(0,0);else{this.x*=w/oldW;this.y*=h/oldH;this.eventX*=w/oldW;this.eventY*=h/oldH;for(let i=0;i<this.nodes.length;i++)this.nodes[i]*=this.length/oldL;}}
  update(dt:number,t:number){const b=this.eventBlend,a=t*.036;const cruiseX=this.w*(.52+.18*Math.sin(a+.3))+Math.cos(this.heading)*this.length*.4,cruiseY=this.h*(.61+.1*Math.sin(a*1.3+2.3))+Math.sin(this.heading)*this.length*.36;const tx=mix(cruiseX,this.eventX,b),ty=mix(cruiseY,this.eventY,b);const inertia=dt===0?1:1-Math.exp(-dt*.6);this.x=mix(this.x,tx,inertia);this.y=mix(this.y,ty,inertia);const desiredHeading=Math.atan2(this.h*.12*1.3*Math.cos(a*1.3+2.3),this.w*.24*Math.cos(a+.3));let delta=(desiredHeading-this.heading+Math.PI*3)%TAU-Math.PI;this.heading+=clamp(delta,-dt*.13,dt*.13);this.pitch=mix(.035*Math.sin(t*.24),this.eventPitch,b);this.roll=mix(.12*Math.sin(t*.14),this.eventRoll,b);this.z=mix(-30+Math.sin(t*.11)*13,this.eventZ,b);this.depth=clamp(.72+this.z*.004,.25,1);this.phase+=dt*.9;
    for(let i=0;i<WHALE_NODES;i++){const s=i/(WHALE_NODES-1),k=i*3;const tx=-s*this.length,ty=Math.sin(this.phase-s*4.4)*this.length*.019*s*s,tz=Math.sin(this.phase-s*5)*this.length*.046*s*s;const follow=this.seeded?1-Math.exp(-dt*(4-2*s)):1;this.nodes[k]=mix(this.nodes[k],tx,follow);this.nodes[k+1]=mix(this.nodes[k+1],ty,follow);this.nodes[k+2]=mix(this.nodes[k+2],tz,follow)}this.seeded=true;
  }
  private rotate(xx:number,yy:number,zz:number){const ry=yy*Math.cos(this.roll)-zz*Math.sin(this.roll),rz=yy*Math.sin(this.roll)+zz*Math.cos(this.roll);const px=xx*Math.cos(this.pitch)+rz*Math.sin(this.pitch),pz=-xx*Math.sin(this.pitch)+rz*Math.cos(this.pitch);return [px*Math.cos(this.heading)-ry*Math.sin(this.heading),px*Math.sin(this.heading)+ry*Math.cos(this.heading),pz]}
  private project(s:number,across:number,vertical=0):[number,number,number] {const u=clamp(s)*(WHALE_NODES-1),i=Math.min(WHALE_NODES-2,Math.floor(u)),f=u-i;const sample=(axis:number)=>{const at=(n:number)=>this.nodes[clamp(n,0,WHALE_NODES-1)*3+axis];return catmull(at(i-1),at(i),at(i+1),at(i+2),f)};const xx=sample(0)-(s>1?(s-1)*this.length:0),yy=sample(1)+across,zz=sample(2)+vertical;const [rx,ry,rz]=this.rotate(xx,yy,zz),scale=1+Math.max(-100,this.z)*.0008;return [this.x+rx*scale,this.y+ry*.88*scale-(rz+this.z)*.7,ry*.6+rz*.85]}
  private local(s:number,across:number,z=0):Point{const p=this.project(s,across,z);return [p[0],p[1]]}
  tailPoint(){return this.local(.96,0)}
  step(dt:number,t:number,field:EnergyField){this.update(dt,t);const tail=this.tailPoint();field.inject(...tail,this.length*.12,dt*.85);for(const side of [-1,1]){const p=this.local(.5,side*this.length*.19);field.inject(...p,30,dt*.15)}}
  draw(r:AsciiRenderer){const L=this.length,exposure=.6+this.depth*.46+Math.max(0,this.z)*.0008;
    r.beginSurface();
    const fin=(coordinates:number[][],lum:number)=>{const points:Vertex[]=coordinates.map(([s,y,z=0])=>{const p=this.project(s,y*L,z*L);return [p[0],p[1],p[2],lum,s,y+1]});for(let i=1;i<points.length-1;i++)r.triangle(points[0],points[i],points[i+1])};
    for(const side of [-1,1])fin([[.27,side*.075],[.35,side*.13],[.5,side*.29,-.01],[.57,side*.34,-.018],[.6,side*.31,-.02],[.54,side*.21],[.43,side*.07]],exposure*(side<0?.56:.35));
    const beat=Math.sin(this.phase-4)*.025;
    for(const side of [-1,1])fin([[.9,0,beat],[.98,side*.12,beat],[1.075,side*.205,beat-.01],[1.12,side*.19,beat-.018],[1.105,side*.105,beat],[1.035,0,beat]],exposure*.55);
    for(let i=0;i<=RINGS;i++){const s=i/RINGS,width=halfWidth(s)*L;for(let j=0;j<SIDES;j++){const theta=j/SIDES*TAU,across=Math.cos(theta)*width,height=Math.sin(theta)*width*.66;const p=this.project(s,across,height);const ns=this.rotate((halfWidth(clamp(s+.01))-halfWidth(clamp(s-.01)))*5,Math.cos(theta)*.66,Math.sin(theta));const norm=Math.hypot(...ns)||1,diffuse=clamp((-ns[0]*.35-ns[1]*.4+ns[2]*.85)/norm);let shade=(.22+.68*diffuse)*exposure;
      // Longitudinal ventral pleats, a lit rostrum and subtle attached skin mottling.
      if(s<.42){const pleat=Math.pow(Math.max(0,Math.cos(theta*17+s*4)),12);shade*=1-.23*pleat*(1-s/.42)}
      shade+=.08*Math.exp(-Math.pow((s-.12)/.15,2))*Math.max(0,Math.sin(theta));const v=this.vertices[i*SIDES+j];v[0]=p[0];v[1]=p[1];v[2]=p[2];v[3]=clamp(shade,.08,.98);v[4]=s;v[5]=j/SIDES;
    }}
    for(let i=0;i<RINGS;i++)for(let j=0;j<SIDES;j++){const a=this.vertices[i*SIDES+j],b=this.vertices[(i+1)*SIDES+j],c=this.vertices[(i+1)*SIDES+(j+1)%SIDES],d=this.vertices[i*SIDES+(j+1)%SIDES];r.triangle(a,b,c);r.triangle(a,c,d)}r.endSurface();
    // Dorsal ridge, paired blowholes, and the eye remain separate character details.
    for(let i=11;i<70;i++){const s=i/85,pt=this.local(s,-halfWidth(s)*L*.12,halfWidth(s)*L*.65);r.put(...pt,i%4?':':';',exposure*.64,1)}
    const eye=this.local(.12,-halfWidth(.12)*L*.93,halfWidth(.12)*L*.1);r.put(...eye,'o',.91*exposure,2);for(const side of [-1,1]){const blow=this.local(.18,side*L*.008,halfWidth(.18)*L*.67);r.put(...blow,':',exposure*.7,2)}
  }
}
