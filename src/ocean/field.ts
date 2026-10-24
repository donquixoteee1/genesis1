import {clamp,current} from './math';
export class EnergyField {
  cols=1;rows=1;cell=12;data=new Float32Array(1);private next=new Float32Array(1);
  resize(w:number,h:number){const old=this.data,oc=this.cols,or=this.rows;this.cols=Math.ceil(w/this.cell);this.rows=Math.ceil(h/this.cell);this.data=new Float32Array(this.cols*this.rows);this.next=new Float32Array(this.data.length);for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++)this.data[y*this.cols+x]=old[Math.min(or-1,Math.floor(y/this.rows*or))*oc+Math.min(oc-1,Math.floor(x/this.cols*oc))]||0}
  inject(x:number,y:number,r:number,amount:number){const cx=x/this.cell,cy=y/this.cell,rr=r/this.cell;for(let j=Math.max(0,Math.floor(cy-rr));j<=Math.min(this.rows-1,Math.ceil(cy+rr));j++)for(let i=Math.max(0,Math.floor(cx-rr));i<=Math.min(this.cols-1,Math.ceil(cx+rr));i++){const d=Math.hypot(i-cx,j-cy);if(d<rr){const k=j*this.cols+i;this.data[k]=Math.min(2.5,this.data[k]+amount*(1-d/rr)**2)}}}
  step(dt:number,t=0){const {cols:c,rows:r,data:a,next:b}=this;const k=Math.min(.2,dt*6),decay=Math.exp(-dt*.46);
    for(let y=0;y<r;y++)for(let x=0;x<c;x++){const i=y*c+x,flow=current(x*this.cell,y*this.cell,t),sx=clamp(x-flow[0]*dt/this.cell,0,c-1),sy=clamp(y-flow[1]*dt/this.cell,0,r-1),ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
      const row0=iy*c,row1=Math.min(r-1,iy+1)*c,nx=Math.min(c-1,ix+1);
      const advected=(a[row0+ix]*(1-fx)+a[row0+nx]*fx)*(1-fy)+(a[row1+ix]*(1-fx)+a[row1+nx]*fx)*fy;
      const neighbours=a[y*c+Math.max(0,x-1)]+a[y*c+Math.min(c-1,x+1)]+a[Math.max(0,y-1)*c+x]+a[Math.min(r-1,y+1)*c+x];
      b[i]=Math.max(0,((1-4*k)*advected+k*neighbours)*decay)
    }this.data=b;this.next=a
  }
  sample(x:number,y:number){return this.data[clamp(Math.floor(y/this.cell),0,this.rows-1)*this.cols+clamp(Math.floor(x/this.cell),0,this.cols-1)]||0}
}
