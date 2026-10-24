import {clamp,hash,inside,type Point} from './math';
import {EnergyField} from './field';
const GLYPHS=" .,:;~+=ox*Ot%SX8#@/\\|'-_";
const PALETTES=[[46,139,202],[75,221,232],[207,249,249]];
const SAMPLES=[[.18,.25],[.5,.25],[.82,.25],[.18,.75],[.5,.75],[.82,.75]];
export type Vertex=[number,number,number,number,number,number];
export class AsciiRenderer {
  ctx:CanvasRenderingContext2D;w=1;h=1;cw=6;ch=9;cols=1;rows=1;
  glyph=new Uint8Array(1);light=new Float32Array(1);palette=new Uint8Array(1);
  private atlas:HTMLCanvasElement;private dpr=1;
  private surfaceDepth=new Float32Array(1);private surfaceLight=new Float32Array(1);
  private surfaceU=new Float32Array(1);private surfaceV=new Float32Array(1);
  constructor(public canvas:HTMLCanvasElement){this.ctx=canvas.getContext('2d',{alpha:false})!;this.atlas=document.createElement('canvas')}
  resize(w:number,h:number){this.w=w;this.h=h;this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);this.cols=Math.ceil(w/this.cw);this.rows=Math.ceil(h/this.ch);const n=this.cols*this.rows;this.glyph=new Uint8Array(n);this.light=new Float32Array(n);this.palette=new Uint8Array(n);this.surfaceDepth=new Float32Array(n*6);this.surfaceLight=new Float32Array(n*6);this.surfaceU=new Float32Array(n*6);this.surfaceV=new Float32Array(n*6);this.buildAtlas()}
  refreshGlyphs(){this.buildAtlas()}
  private buildAtlas(){const d=this.dpr;this.atlas.width=GLYPHS.length*this.cw*d;this.atlas.height=48*this.ch*d;const a=this.atlas.getContext('2d')!;a.scale(d,d);a.font='500 9px Menlo, Consolas, monospace';a.textAlign='center';a.textBaseline='middle';for(let p=0;p<3;p++)for(let l=0;l<16;l++){const rgb=PALETTES[p];a.fillStyle=`rgba(${rgb.join(',')},${(l+1)/16})`;for(let g=1;g<GLYPHS.length;g++)a.fillText(GLYPHS[g],g*this.cw+this.cw/2,(p*16+l)*this.ch+this.ch/2)}}
  clear(field:EnergyField,t:number){this.glyph.fill(0);this.light.fill(0);this.palette.fill(0);for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++){const i=y*this.cols+x,e=field.sample(x*this.cw,y*this.ch),n=hash(x,y);if(e>.025&&n<clamp(e*.63,.03,.88)){const lum=clamp(e*.8);this.glyph[i]=GLYPHS.indexOf(lum>.75?'*':lum>.36?'+':lum>.12?':':'.');this.light[i]=lum*.75+.04;this.palette[i]=e>1.3?2:1}else if(n>.973){this.glyph[i]=1;this.light[i]=.035+.035*(.5+.5*Math.sin(t*.25+n*30))}}}
  put(x:number,y:number,g:string,light:number,p=1){const c=Math.floor(x/this.cw),r=Math.floor(y/this.ch);if(c<0||r<0||c>=this.cols||r>=this.rows)return;const i=r*this.cols+c;if(light>=this.light[i]){this.glyph[i]=Math.max(0,GLYPHS.indexOf(g));this.light[i]=clamp(light);this.palette[i]=p}}
  line(a:Point,b:Point,g:string,lum:number,p=1){const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3));for(let i=0;i<=n;i++){const s=i/n;this.put(a[0]+(b[0]-a[0])*s,a[1]+(b[1]-a[1])*s,g,lum,p)}}
  polygon(points:Point[],lum:number,tint=0){let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const [x,y] of points){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}for(let r=Math.max(0,Math.floor(y0/this.ch));r<=Math.min(this.rows-1,Math.ceil(y1/this.ch));r++)for(let c=Math.max(0,Math.floor(x0/this.cw));c<=Math.min(this.cols-1,Math.ceil(x1/this.cw));c++){let n=0;for(const [dx,dy]of SAMPLES)if(inside((c+dx)*this.cw,(r+dy)*this.ch,points))n++;if(!n)continue;const cov=n/6,texture=hash(c,r,37),shade=lum*(.7+.3*texture);this.put((c+.5)*this.cw,(r+.5)*this.ch,cov<.5?':':':;t%SX8#@'[Math.floor(clamp(shade*.8+texture*.2)*8)],shade*(.6+.4*cov),tint)}}
  beginSurface(){this.surfaceDepth.fill(-Infinity)}
  /** Six independent depth samples, interpolated lighting and animal-space texture. */
  triangle(a:Vertex,b:Vertex,c:Vertex){const denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(denominator)<.01)return;
    const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0])/this.cw)),x1=Math.min(this.cols-1,Math.floor(Math.max(a[0],b[0],c[0])/this.cw));
    const y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1])/this.ch)),y1=Math.min(this.rows-1,Math.floor(Math.max(a[1],b[1],c[1])/this.ch));
    for(let row=y0;row<=y1;row++)for(let col=x0;col<=x1;col++)for(let k=0;k<6;k++){const x=(col+SAMPLES[k][0])*this.cw,y=(row+SAMPLES[k][1])*this.ch;const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/denominator,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/denominator,w=1-u-v;if(u<-.0001||v<-.0001||w<-.0001)continue;const index=(row*this.cols+col)*6+k,z=u*a[2]+v*b[2]+w*c[2];if(z<this.surfaceDepth[index])continue;this.surfaceDepth[index]=z;this.surfaceLight[index]=u*a[3]+v*b[3]+w*c[3];this.surfaceU[index]=u*a[4]+v*b[4]+w*c[4];this.surfaceV[index]=u*a[5]+v*b[5]+w*c[5]}
  }
  endSurface(){for(let i=0;i<this.glyph.length;i++){let hits=0,shade=0,u=0,v=0;for(let k=0;k<6;k++){const index=i*6+k;if(this.surfaceDepth[index]===-Infinity)continue;hits++;shade+=this.surfaceLight[index];u+=this.surfaceU[index];v+=this.surfaceV[index]}if(!hits)continue;shade/=hits;u/=hits;v/=hits;const noise=hash(Math.floor(u*150),Math.floor(v*80),43),coverage=hits/6;const ramp=':;t%SX8#@';const g=coverage<.35?'.':coverage<.65?':':ramp[clamp(Math.floor(shade*8+(noise-.5)*1.8),0,8)];this.glyph[i]=GLYPHS.indexOf(g);this.light[i]=clamp(shade*(.55+.45*coverage));this.palette[i]=shade>.73?1:0}}
  render(brightness=1){const c=this.ctx,d=this.dpr;c.setTransform(1,0,0,1,0,0);c.fillStyle='#040b15';c.fillRect(0,0,this.canvas.width,this.canvas.height);c.globalAlpha=brightness;for(let i=0;i<this.glyph.length;i++){const g=this.glyph[i];if(!g||this.light[i]<.025)continue;const l=clamp(Math.round(this.light[i]*15),0,15),p=this.palette[i];c.drawImage(this.atlas,g*this.cw*d,(p*16+l)*this.ch*d,this.cw*d,this.ch*d,(i%this.cols)*this.cw*d,Math.floor(i/this.cols)*this.ch*d,this.cw*d,this.ch*d)}c.globalAlpha=1}
}
