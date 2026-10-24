import {PlanktonSystem} from './plankton';
import {SplashSystem} from './splash';
import {CinematicDirector} from './director';
import {WhaleSystem} from './whale';
import {JellyfishSystem} from './jellyfish';
import {EnergyField} from './field';
import {AsciiRenderer} from './renderer';
export class OceanEngine {
  plankton=new PlanktonSystem();splash=new SplashSystem();director=new CinematicDirector();whale=new WhaleSystem();jellyfish=new JellyfishSystem();field=new EnergyField();renderer:AsciiRenderer;time=0;paused=false;enabled=true;brightness=.85;typing=false;mode='ambient';private raf=0;private last=0;private acc=0;private visible=true;private disposed=false;private resizeObserver:ResizeObserver;private intersection:IntersectionObserver;reduced=matchMedia('(prefers-reduced-motion: reduce)');
  constructor(canvas:HTMLCanvasElement){this.renderer=new AsciiRenderer(canvas);this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);this.intersection=new IntersectionObserver(([e])=>{this.visible=e.isIntersecting;this.schedule()});this.intersection.observe(canvas);this.reduced.addEventListener('change',this.schedule);document.addEventListener('visibilitychange',this.schedule);this.resize();this.schedule();document.fonts?.ready.then(()=>{if(!this.disposed){this.renderer.refreshGlyphs();this.draw()}})}
  private resize(){const r=this.renderer.canvas.getBoundingClientRect();if(r.width<1||r.height<1)return;this.renderer.resize(r.width,r.height);this.field.resize(r.width,r.height);this.jellyfish.resize(r.width,r.height);this.whale.resize(r.width,r.height);this.plankton.resize(r.width,r.height);this.draw()}
  step(dt:number){this.time+=dt;this.jellyfish.step(dt,this.time,this.field);this.director.automatic=this.mode==='cinematic'&&!this.typing;this.director.step(dt,this.whale,this.splash,this.field);this.whale.step(dt,this.time,this.field);this.splash.step(dt,this.time,this.field);this.plankton.step(dt,this.time,this.whale);for(let i=0;i<4;i++)this.field.inject(this.renderer.w*(.2+i*.2)+Math.sin(this.time*.1+i)*30,this.renderer.h*(.7+Math.sin(this.time*.14+i)*.12),35,.03*dt);this.field.step(dt,this.time)}
  draw(){this.renderer.clear(this.field,this.time);this.plankton.draw(this.renderer);this.whale.draw(this.renderer);this.jellyfish.draw(this.renderer,this.time);this.splash.draw(this.renderer);this.renderer.render(this.brightness*(this.typing?.28:1)*(this.mode==='focus'?.25:1))}
  private frame=(now:number)=>{this.acc+=Math.min(.1,(now-this.last)/1000);this.last=now;let n=0;while(this.acc>=1/60&&n<4){this.step(1/60);this.acc-=1/60;n++}if(n===4)this.acc=0;this.draw();this.raf=requestAnimationFrame(this.frame)};
  schedule=()=>{cancelAnimationFrame(this.raf);this.acc=0;this.draw();if(this.disposed||this.paused||!this.enabled||!this.visible||this.reduced.matches||document.hidden)return;this.last=performance.now();this.raf=requestAnimationFrame(this.frame)};
  trigger(){if(this.reduced.matches||!this.enabled||this.paused||this.mode==='focus')return false;return this.director.trigger(this.whale)}
  destroy(){this.disposed=true;cancelAnimationFrame(this.raf);this.resizeObserver.disconnect();this.intersection.disconnect();this.reduced.removeEventListener('change',this.schedule);document.removeEventListener('visibilitychange',this.schedule)}
}
