import {TAU,hash,current,clamp} from './math';
import type {EnergyField} from './field';
import type {AsciiRenderer} from './renderer';
export interface Jellyfish {x:number;y:number;vx:number;vy:number;size:number;depth:number;phase:number;frequency:number;opacity:number;drift:number;angle:number}
export class JellyfishSystem {
  animals:Jellyfish[]=[];w=1;h=1;
  resize(w:number,h:number){if(!this.animals.length){for(let i=0;i<32;i++){const depth=.35+hash(i,2)*.65;this.animals.push({x:(.04+hash(i,4)*.92)*w,y:(.08+hash(i,5)*.85)*h,vx:0,vy:0,size:(13+hash(i,8)*24)*(.6+depth*.5),depth,phase:hash(i,6)*TAU,frequency:.6+hash(i,9)*.65,opacity:.45+depth*.5,drift:.4+hash(i,11),angle:hash(i,12)*TAU})}}else{for(const a of this.animals){a.x*=w/this.w;a.y*=h/this.h}}if(this.w===1){const anchors=[[.13,.72],[.86,.21],[.32,.91],[.91,.65]];for(let i=0;i<4;i++){const a=this.animals[i];a.x=anchors[i][0]*w;a.y=anchors[i][1]*h;a.size=Math.min(w<600?35:58,42+i*5);a.depth=.92;a.opacity=.95}}for(let i=0;i<4;i++)this.animals[i].size=Math.min(w<600?35:58,42+i*5);this.w=w;this.h=h}
  step(dt:number,t:number,field:EnergyField){for(let i=0;i<this.animals.length;i++){const a=this.animals[i];const flow=current(a.x,a.y,t);let ax=flow[0]*a.drift,ay=flow[1]*a.drift;for(let j=0;j<this.animals.length;j++){if(i===j)continue;const b=this.animals[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy),rr=(a.size+b.size)*1.25;if(d>0&&d<rr){ax+=dx/d*(1-d/rr)*7;ay+=dy/d*(1-d/rr)*7}}const margin=a.size+18;ax+=Math.max(0,margin-a.x)*.12-Math.max(0,a.x-(this.w-margin))*.12;ay+=Math.max(0,margin-a.y)*.12-Math.max(0,a.y-(this.h-margin))*.12;a.vx+=(ax-a.vx)*dt*.45;a.vy+=(ay-a.vy)*dt*.45;a.x+=a.vx*dt;a.y+=a.vy*dt;a.phase+=a.frequency*dt;const pulse=.5+.5*Math.sin(a.phase);field.inject(a.x,a.y,a.size*2.2,dt*(.1+pulse*.23)*a.depth)}}
  draw(r:AsciiRenderer,t:number){for(const a of this.animals){const pulse=.5+.5*Math.sin(a.phase),rad=a.size*(.86+.14*pulse),lum=(.6+.4*pulse)*a.opacity;
    const angle=a.angle+Math.sin(t*.08+a.phase)*.15,ca=Math.cos(angle),sa=Math.sin(angle);
    const point=(x:number,y:number):[number,number]=>[a.x+x*ca-y*sa,a.y+x*sa+y*ca];
    // Translucent bell: bright folded rim, radial canals and four inner gonads.
    const bound=rad*1.04;
    for(let y=-bound;y<=bound;y+=r.ch)for(let x=-bound;x<=bound;x+=r.cw){const nx=x/rad,ny=y/(rad*.78),d=Math.hypot(nx,ny);if(d>1)continue;
      const theta=Math.atan2(ny,nx),edge=Math.exp(-Math.pow((d-.88)/.085,2));
      const canal=Math.pow(Math.max(0,Math.cos(theta*12+a.phase*.1)),14)*d;
      const fold=.7+.3*Math.cos(theta*16+a.phase*.2),membrane=.07+.08*(1-d);
      let lobes=0;for(let k=0;k<4;k++){const q=k/4*TAU+.5;lobes+=Math.exp(-((nx-Math.cos(q)*.29)**2+(ny-Math.sin(q)*.29)**2)/.015)}
      const light=lum*(membrane+edge*.56*fold+canal*.15+lobes*.52);const p=point(x,y);
      r.put(...p,edge>.55?(fold>.8?'o':'O'):lobes>.4?'*':canal>.35?':':'.',light,lobes>.5||edge>.78?2:1);
    }
    // A continuous silhouette and slow-folding oral arms make small bells legible.
    for(let k=0;k<110;k++){const theta=k/110*TAU,rim=rad*(.94+.035*Math.sin(theta*12+a.phase)),p=point(Math.cos(theta)*rim,Math.sin(theta)*rim*.78);r.put(...p,k%5?'o':':',lum*(.38+.17*Math.sin(theta+1)),1)}
    const heading=Math.atan2(-a.vy||.5,-a.vx||.4),hx=Math.cos(heading),hy=Math.sin(heading);
    for(let k=0;k<9;k++){const spread=(k-4)*.17,length=rad*(1.3+hash(k,Math.floor(a.size))*1.7);
      for(let j=0;j<26;j++){if((j+k)%6===0)continue;const u=j/25,trail=length*u,curve=Math.sin(u*5-t*.34+k*.65)*rad*.11*(.3+u);
        const px=a.x+hx*(rad*.4+trail)-hy*(spread*rad+curve+Math.sin(u*2+k)*u*rad*.23),py=a.y+hy*(rad*.4+trail)+hx*(spread*rad+curve+Math.sin(u*2+k)*u*rad*.23);
        r.put(px,py,j>17?'.':k%3===0?':':'.',lum*(1-u)*(.23+(k%3)*.035),1);
      }
    }
    for(let k=0;k<22;k++){const theta=hash(k,Math.floor(a.size))*TAU,dist=rad*(1.3+hash(k,8)*1.8),p=point(Math.cos(theta)*dist,Math.sin(theta)*dist);r.put(...p,k%8?'.':'+',lum*.23*(.5+.5*Math.sin(t*.5+k)),1)}
  }}
}
