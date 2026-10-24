import {armBlend,armSample,armSourceBounds} from './arm';
import {renderBudget} from './budget';
import {sceneAt,EXPLOSION_SECONDS} from './timeline';
import {HAND_FIELDS} from './reference';
import {composeHands,fingerOffset,sceneAnchor,type SceneRect} from './composition';
import {starPosition} from './stars';
import {clamp,hash} from '../ocean/math';
const GLYPHS=" .,:;t%SX8#@*+-";
const SAMPLES=[[.2,.25],[.5,.25],[.8,.25],[.2,.75],[.5,.75],[.8,.75]];
const RGB=[[164,166,169],[215,214,207],[113,128,151]];
export class HandsRenderer {
  w=1;h=1;cw=7;ch=10;cols=1;rows=1;glyph=new Uint8Array(1);light=new Float32Array(1);
  private burstCycle=-1;private burstCount=0;private burstData=new Float32Array(0);private burstGlyph=new Uint8Array(0);private burstPalette=new Uint8Array(0);composer?:SceneRect;private layer=document.createElement('canvas');private palette=new Uint8Array(1);private atlas=document.createElement('canvas');private ctx:CanvasRenderingContext2D;private dpr=1;
  constructor(public canvas:HTMLCanvasElement){this.ctx=canvas.getContext('2d',{alpha:false})!}
  resize(w:number,h:number){const b=renderBudget(w,h,devicePixelRatio||1);if(this.w===w&&this.h===h&&this.canvas.width===b.pixelWidth&&this.canvas.height===b.pixelHeight)return;this.w=w;this.h=h;this.dpr=b.dpr;this.cw=b.cw;this.ch=b.ch;this.canvas.width=b.pixelWidth;this.canvas.height=b.pixelHeight;this.layer.width=b.pixelWidth;this.layer.height=b.pixelHeight;this.cols=b.cols;this.rows=b.rows;const n=this.cols*this.rows;this.glyph=new Uint8Array(n);this.light=new Float32Array(n);this.palette=new Uint8Array(n);this.burstData=new Float32Array(n*5);this.burstGlyph=new Uint8Array(n);this.burstPalette=new Uint8Array(n);this.burstCycle=-1;this.refreshGlyphs()}
  destroy(){this.glyph=new Uint8Array(0);this.light=new Float32Array(0);this.palette=new Uint8Array(0);this.burstData=new Float32Array(0);this.burstGlyph=new Uint8Array(0);this.burstPalette=new Uint8Array(0);this.burstCount=0;for(const canvas of [this.canvas,this.layer,this.atlas]){canvas.width=1;canvas.height=1}}
  refreshGlyphs(){const d=Math.max(1,this.dpr);this.atlas.width=Math.ceil(GLYPHS.length*7*d);this.atlas.height=Math.ceil(48*10*d);const a=this.atlas.getContext('2d')!;a.scale(d,d);a.font='500 10px Menlo, Consolas, monospace';a.textAlign='center';a.textBaseline='middle';for(let p=0;p<3;p++)for(let l=0;l<16;l++){a.fillStyle=`rgba(${RGB[p].join(',')},${(l+1)/16})`;for(let g=1;g<GLYPHS.length;g++)a.fillText(GLYPHS[g],(g+.5)*7,(p*16+l+.5)*10)}}
  private sample(side:number,x:number,y:number){const f=HAND_FIELDS[side];if(x<0||y<0||x>=f.w-1||y>=f.h-1)return 0;const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,i=iy*f.w+ix;return ((f.data[i]*(1-fx)+f.data[i+1]*fx)*(1-fy)+(f.data[i+f.w]*(1-fx)+f.data[i+f.w+1]*fx)*fy)/255}
  private sampleDeformed(side:number,u:number,v:number,phase:number){
    const blend=armBlend(side,u);
    if(blend>=1)return armSample(side,u,v);
    // The reference wrist is stable. Deformation is needed only near the fingers.
    let value:number;
    if(side===0?u<100:u>110)value=this.sample(side,u,v);
    else{const [dx,dy]=fingerOffset(side,u,v,phase);value=this.sample(side,u-dx,v-dy)}
    return blend>0?value*(1-blend)+armSample(side,u,v)*blend:value;
  }
  rasterize(time:number,phase:number){this.glyph.fill(0);this.light.fill(0);this.palette.fill(0);
    // Stars travel between independent random waypoints as they twinkle.
    const count=Math.max(75,Math.min(350,Math.floor(this.w*this.h/3300)));
    for(let n=0;n<count;n++){const star=starPosition(n,time,this.w,this.h),col=Math.floor(star.x/this.cw),row=Math.floor(star.y/this.ch),i=row*this.cols+col;if(i<0||i>=this.glyph.length)continue;this.glyph[i]=GLYPHS.indexOf(n%17===0?'+':n%5===0?':':'.');this.light[i]=star.light;this.palette[i]=n%19===0?1:0}

    for(const pose of composeHands(this.w,this.h,phase,this.composer)){const f=HAND_FIELDS[pose.side],ca=Math.cos(pose.angle),sa=Math.sin(pose.angle);const [l,t,r,b]=armSourceBounds(pose.side,Math.hypot(this.w,this.h)/pose.scale+48);const corners=[[l,t],[r,t],[r,b],[l,b]].map(([x,y])=>{const u=(x-f.tip[0])*pose.scale,v=(y-f.tip[1])*pose.scale;return [pose.x+u*ca-v*sa,pose.y+u*sa+v*ca]});const x0=Math.max(0,Math.floor(Math.min(...corners.map(p=>p[0]))/this.cw)),x1=Math.min(this.cols-1,Math.ceil(Math.max(...corners.map(p=>p[0]))/this.cw)),y0=Math.max(0,Math.floor(Math.min(...corners.map(p=>p[1]))/this.ch)),y1=Math.min(this.rows-1,Math.ceil(Math.max(...corners.map(p=>p[1]))/this.ch));
      for(let row=y0;row<=y1;row++)for(let col=x0;col<=x1;col++){let value=0,coverage=0;for(const [dx,dy]of SAMPLES){const px=(col+dx)*this.cw-pose.x,py=(row+dy)*this.ch-pose.y,u=(px*ca+py*sa)/pose.scale+f.tip[0],v=(-px*sa+py*ca)/pose.scale+f.tip[1],s=this.sampleDeformed(pose.side,u,v,phase);value+=s;if(s>.075)coverage++}value/=6;if(coverage===0||value<.035)continue;const px=(col+.5)*this.cw-pose.x,py=(row+.5)*this.ch-pose.y,u=(px*ca+py*sa)/pose.scale+f.tip[0],v=(-px*sa+py*ca)/pose.scale+f.tip[1];const texture=hash(Math.floor(u),Math.floor(v),pose.side+51);const ramp='.:;t%SX8#@';const level=clamp(value*.85+texture*.15);const g=coverage<3?'.':ramp[clamp(Math.floor(level*9),0,9)];const i=row*this.cols+col;this.glyph[i]=GLYPHS.indexOf(g);this.light[i]=clamp((.12+value*.83)*(.72+texture*.28));this.palette[i]=texture>.985?2:value>.73?1:0}
    }
  }
  rasterizeScene(time:number){const state=sceneAt(time);
    if(state.phase==='dark'){this.glyph.fill(0);this.light.fill(0);return}
    if(state.phase!=='explode'){this.rasterize(time,Math.PI*state.reach);if(state.opacity<1)for(let i=0;i<this.light.length;i++)this.light[i]*=state.opacity;return}
    if(this.burstCycle!==state.cycle){
      this.rasterize(state.contactTime,Math.PI);this.burstCycle=state.cycle;this.burstCount=0;
      const {x:cx,y:cy}=sceneAnchor(this.w,this.h);
      for(let i=0;i<this.glyph.length;i++){if(!this.glyph[i]||this.light[i]<.025)continue;const n=this.burstCount++,k=n*5,x=(i%this.cols+.5)*this.cw,y=(Math.floor(i/this.cols)+.5)*this.ch,dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)||1,seed=hash(i,state.cycle,329),speed=150+seed*290+100*Math.exp(-d/170),curl=(hash(i,17)-.5)*120;this.burstData[k]=x;this.burstData[k+1]=y;this.burstData[k+2]=dx/d*speed-dy/d*curl;this.burstData[k+3]=dy/d*speed+dx/d*curl;this.burstData[k+4]=this.light[i];this.burstGlyph[n]=this.glyph[i];this.burstPalette[n]=this.palette[i]}
    }
    this.glyph.fill(0);this.light.fill(0);const t=state.progress*EXPLOSION_SECONDS,travel=(1-Math.exp(-t*.55))/.55;
    for(let n=0;n<this.burstCount;n++){const k=n*5,x=this.burstData[k]+this.burstData[k+2]*travel,y=this.burstData[k+1]+this.burstData[k+3]*travel+Math.sin(t*2+n)*t*7,col=Math.floor(x/this.cw),row=Math.floor(y/this.ch);if(col<0||row<0||col>=this.cols||row>=this.rows)continue;const i=row*this.cols+col,light=this.burstData[k+4]*state.opacity;if(light>this.light[i]){this.glyph[i]=this.burstGlyph[n];this.light[i]=light;this.palette[i]=this.burstPalette[n]}}
  }
  render(brightness=1){const output=this.ctx,c=this.layer.getContext('2d')!,d=this.dpr,ad=Math.max(1,d);c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,this.layer.width,this.layer.height);c.globalAlpha=brightness;
    for(let i=0;i<this.glyph.length;i++){const g=this.glyph[i];if(!g||this.light[i]<.014)continue;const level=clamp(Math.round(this.light[i]*15),0,15);c.drawImage(this.atlas,g*7*ad,(this.palette[i]*16+level)*10*ad,7*ad,10*ad,(i%this.cols)*this.cw*d,Math.floor(i/this.cols)*this.ch*d,this.cw*d,this.ch*d)}c.globalAlpha=1;
    output.setTransform(1,0,0,1,0,0);output.fillStyle='#030303';output.fillRect(0,0,this.canvas.width,this.canvas.height);output.drawImage(this.layer,0,0);
    // Only the world beneath the input panel is defocused; DOM text stays sharp.
    if(this.composer){const r=this.composer;output.save();output.beginPath();output.roundRect((r.x+1)*d,(r.y+1)*d,Math.max(0,(r.width-2)*d),Math.max(0,(r.height-2)*d),Math.max(0,Math.min(15,(r.width-2)/2,(r.height-2)/2))*d);output.clip();output.fillStyle='#030303';output.fillRect(r.x*d,r.y*d,r.width*d,r.height*d);output.filter=`blur(${5*d}px)`;output.globalAlpha=.9;output.drawImage(this.layer,0,0);output.restore()}
  }
}
