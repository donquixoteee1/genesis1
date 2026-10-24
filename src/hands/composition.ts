export interface HandPose {x:number;y:number;scale:number;angle:number;side:0|1}
export interface SceneRect {x:number;y:number;width:number;height:number}
export const CYCLE_SECONDS=8;
/** Reference composition is anchored to the background, never to native UI layout. */
export function sceneAnchor(width:number,height:number){return {x:width*.5,y:height*.47}}
export const HAND_GEOMETRY=[{w:192,h:104,tip:[187.62,75.18],bounds:[0,0,192,104]},{w:192,h:115,tip:[3.31,42.3],bounds:[0,0,192,115]}];
export function handBounds(p:HandPose){const f=HAND_GEOMETRY[p.side],c=Math.cos(p.angle),s=Math.sin(p.angle);const [l,t,r,b]=f.bounds;const corners=[[l,t],[r,t],[r,b],[l,b]].map(([x,y])=>{const u=(x-f.tip[0])*p.scale,v=(y-f.tip[1])*p.scale;return [p.x+u*c-v*s,p.y+u*s+v*c]});return {left:Math.min(...corners.map(p=>p[0])),right:Math.max(...corners.map(p=>p[0])),top:Math.min(...corners.map(p=>p[1])),bottom:Math.max(...corners.map(p=>p[1]))}}
/** The supplied reference: oversized hands entering from opposing diagonal edges. */
export function composeHands(width:number,height:number,phase:number,_composer?:SceneRect):HandPose[]{
  const reach=.5-.5*Math.cos(phase),mobile=width<760;
  const {x:cx,y:cy}=sceneAnchor(width,height);
  const scale=Math.min(660,width*(mobile?.7:.51))/192;
  const gapX=width*(mobile?.24:.14)*(1-reach)+10,gapY=height*(mobile?.2:.115)*(1-reach)+5;
  return [{x:cx-gapX,y:cy-gapY,scale,angle:.34-.06*reach+.012*Math.sin(phase),side:0},{x:cx+gapX,y:cy+gapY,scale,angle:.30-.04*reach-.012*Math.sin(phase),side:1}];
}
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t)};
/** Small joint-weighted displacements: stable wrist/palm, separately phased fingers. */
export function fingerOffset(side:number,u:number,v:number,phase:number):[number,number]{let dx=0,dy=0;if(side===0){for(let i=0;i<4;i++){const base=130+i*17,weight=Math.exp(-Math.pow((u-base)/12,2))*smooth((v-(47+i*2))/35);dx+=Math.sin(phase+i*.46)*weight*3.1;dy+=(Math.sin(phase+i*.46+.35)-Math.sin(i*.46+.35))*weight*2.7}}else{const index=Math.exp(-Math.pow((v-41)/12,2))*smooth((90-u)/70);dy+=Math.sin(phase+.45)*index*4.3;for(let i=0;i<3;i++){const weight=Math.exp(-Math.pow((u-(55+i*16))/12,2))*smooth((v-59)/43);dx+=Math.sin(phase+i*.5+.2)*weight*2.7;dy+=Math.sin(phase+i*.5+.7)*weight*3.7}}return [dx,dy]}
