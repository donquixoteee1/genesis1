import {clamp,smooth,mix} from './math';
import type {WhaleSystem} from './whale';
import type {SplashSystem} from './splash';
import type {EnergyField} from './field';
export const PHASES=[['shadow',4],['disturbance',3],['ascent',3],['breach',1],['flight',3.4],['impact',.15],['column',1.1],['afterglow',9]] as const;
export class CinematicDirector {
  active=false;elapsed=0;phase='calm';nextIn=90+Math.random()*90;automatic=false;private broke=false;private landed=false;private x=0;private y=0;
  trigger(whale:WhaleSystem){if(this.active)return false;this.active=true;this.elapsed=0;this.broke=false;this.landed=false;this.x=whale.x;this.y=whale.y;return true}
  step(dt:number,whale:WhaleSystem,splash:SplashSystem,field:EnergyField){if(!this.active){if(this.automatic){this.nextIn-=dt;if(this.nextIn<=0)this.trigger(whale)}if(!this.active)return}this.elapsed+=dt;let local=this.elapsed,phase:string='calm',duration=1;for(const [name,d]of PHASES){if(local<d){phase=name;duration=d;break}local-=d}this.phase=phase;const u=clamp(local/duration);whale.eventX=this.x;whale.eventY=this.y;whale.eventBlend=smooth(this.elapsed/3);whale.eventZ=-34;whale.eventPitch=0;whale.eventRoll=0;
    if(phase==='shadow'){whale.eventZ=mix(-34,-12,smooth(u))}
    if(phase==='disturbance'){whale.eventZ=-12;field.inject(this.x,this.y,90,dt*.7)}
    if(phase==='ascent'){whale.eventZ=mix(-12,30,smooth(u));whale.eventPitch=-.75*smooth(u);field.inject(this.x,this.y,110,dt*1.1)}
    if(phase==='breach'){whale.eventZ=mix(30,105,u);whale.eventPitch=-.75-u*.3;if(!this.broke){splash.emit(this.x,this.y,1);field.inject(this.x,this.y,130,1.5);this.broke=true}}
    if(phase==='flight'){whale.eventZ=105+125*Math.sin(u*Math.PI)-130*u*u;whale.eventPitch=mix(-1.05,.8,smooth(u));whale.eventRoll=Math.sin(u*Math.PI)*.95;whale.eventX=this.x+u*65;whale.eventY=this.y-u*12}
    if(phase==='impact'||phase==='column'){whale.eventZ=-25;whale.eventX=this.x+65;whale.eventY=this.y-12;whale.eventPitch=.8*(1-smooth((this.elapsed-14.4)/1.25));if(!this.landed){splash.emit(this.x+65,this.y-12,3.3);field.inject(this.x+65,this.y-12,220,2.2);this.landed=true}}
    if(phase==='afterglow'){whale.eventZ=mix(-25,-65,smooth(u));whale.eventBlend=1-smooth(u);field.inject(this.x+65,this.y-12,155,dt*.15*(1-u))}
    if(phase==='calm'){this.active=false;whale.eventBlend=0;this.nextIn=90+Math.random()*90}
  }
}
