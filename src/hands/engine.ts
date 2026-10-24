import {type SceneRect} from './composition';
import {sceneAt,EMERGE_SECONDS,LOOP_SECONDS} from './timeline';
import {HandsRenderer} from './renderer';

/** Fixed simulation with a 30 fps presentation budget and no work during darkness. */
export class HandsEngine {
  renderer:HandsRenderer;
  frameCost=0;time=0;phase=0;paused=false;enabled=true;brightness=.95;typing=false;mode='ambient';
  reduced=matchMedia('(prefers-reduced-motion: reduce)');
  private raf=0;private last=0;private acc=0;private lastDraw=-Infinity;
  private idle:ReturnType<typeof setTimeout>|undefined;
  private visible=true;private disposed=false;private sizeReady=false;
  private resizeObserver:ResizeObserver;private intersection:IntersectionObserver;
  constructor(canvas:HTMLCanvasElement,private getComposer?:()=>SceneRect|undefined){
    this.renderer=new HandsRenderer(canvas);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
    this.intersection=new IntersectionObserver(([entry])=>{this.visible=entry?.isIntersecting??false;this.schedule()});this.intersection.observe(canvas);
    this.reduced.addEventListener('change',this.schedule);document.addEventListener('visibilitychange',this.schedule);
    this.resize();
    document.fonts?.ready.then(()=>{if(!this.disposed){this.renderer.refreshGlyphs();this.draw()}});
  }
  private resize(){if(this.disposed)return;const r=this.renderer.canvas.getBoundingClientRect();this.sizeReady=r.width>=1&&r.height>=1;if(!this.sizeReady){this.suspend();return}this.renderer.resize(r.width,r.height);this.schedule()}
  step(dt:number){this.time+=dt;this.phase=sceneAt(this.time).reach*Math.PI}
  draw(){if(this.disposed||!this.sizeReady)return;if(this.getComposer)this.renderer.composer=this.getComposer();this.renderer.rasterizeScene(this.reduced.matches?EMERGE_SECONDS+1:this.time);this.renderer.render(this.brightness*(this.typing?.35:1)*(this.mode==='focus'?.35:1))}
  private running(){return !this.disposed&&this.sizeReady&&!this.paused&&this.enabled&&this.visible&&!this.reduced.matches&&!document.hidden}
  private next(){
    if(!this.running())return;
    if(sceneAt(this.time).phase==='dark'){
      const remaining=LOOP_SECONDS-(this.time%LOOP_SECONDS);
      this.idle=setTimeout(()=>{this.idle=undefined;if(!this.running())return;this.step(remaining+1e-7);this.last=performance.now();this.acc=0;this.draw();this.raf=requestAnimationFrame(this.frame)},remaining*1000);
    }else this.raf=requestAnimationFrame(this.frame);
  }
  private frame=(now:number)=>{
    if(!this.running())return;
    this.acc+=Math.max(0,Math.min(.1,(now-this.last)/1000));this.last=now;
    let steps=0;while(this.acc>=1/60&&steps<4){this.step(1/60);this.acc-=1/60;steps++}if(steps===4)this.acc=0;
    const interval=1000/(this.typing?20:30);
    if(now-this.lastDraw>=interval-.5||sceneAt(this.time).phase==='dark'){
      const began=performance.now();this.draw();this.frameCost=performance.now()-began;this.lastDraw=now;
    }
    this.next();
  };
  schedule=()=>{this.suspend();if(this.disposed)return;this.draw();this.last=performance.now();this.lastDraw=-Infinity;this.next()};
  suspend(){cancelAnimationFrame(this.raf);this.raf=0;clearTimeout(this.idle);this.idle=undefined;this.acc=0}
  destroy(){if(this.disposed)return;this.disposed=true;this.suspend();this.resizeObserver.disconnect();this.intersection.disconnect();this.reduced.removeEventListener('change',this.schedule);document.removeEventListener('visibilitychange',this.schedule);this.getComposer=undefined;this.renderer.destroy()}
}
