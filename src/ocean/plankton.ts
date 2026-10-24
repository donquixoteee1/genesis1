import {hash,current,clamp} from './math';
import type {AsciiRenderer} from './renderer';
import type {WhaleSystem} from './whale';
const COUNT=260,STRIDE=5;
/** Sparse organisms carried by the same current as bells and luminous wakes. */
export class PlanktonSystem {
  data=new Float32Array(COUNT*STRIDE);w=1;h=1;seeded=false;
  resize(w:number,h:number){for(let i=0;i<COUNT;i++){const k=i*STRIDE;if(!this.seeded){this.data[k]=hash(i,53)*w;this.data[k+1]=hash(i,57)*h;this.data[k+2]=hash(i,61)*6.28;this.data[k+3]=.07+hash(i,62)*.12}else{this.data[k]*=w/this.w;this.data[k+1]*=h/this.h}}this.w=w;this.h=h;this.seeded=true}
  step(dt:number,t:number,whale:WhaleSystem){for(let i=0;i<COUNT;i++){const k=i*STRIDE,x=this.data[k],y=this.data[k+1],flow=current(x,y,t);this.data[k]=((x+flow[0]*dt+this.w)%this.w);this.data[k+1]=((y+flow[1]*dt+this.h)%this.h);this.data[k+2]+=dt*(.2+hash(i,8)*.5);const d=Math.hypot(x-whale.x,y-whale.y),target=clamp(1-d/(whale.length*.25))*whale.depth;this.data[k+4]+=(target-this.data[k+4])*Math.min(1,dt*2)}}
  draw(r:AsciiRenderer){for(let i=0;i<COUNT;i++){const k=i*STRIDE,light=this.data[k+3]*(.4+.6*Math.sin(this.data[k+2])**2)+this.data[k+4]*.4;r.put(this.data[k],this.data[k+1],light>.38?'+':'.',light,light>.5?2:1)}}
}
