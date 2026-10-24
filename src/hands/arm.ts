import {HAND_FIELDS} from './reference';
import {clamp,smooth} from '../ocean/math';

// Continue each reference forearm as an open tube. Its far end has no cap;
// only the viewport clips it. A short overlap hides the source image's cut plane.
const PROFILES=HAND_FIELDS.map((field,side)=>{
  const profile=new Float32Array(field.h),start=side?183:1;
  for(let y=0;y<field.h;y++){
    let sum=0,weight=0;
    for(let x=start;x<start+7;x++)for(let dy=-2;dy<=2;dy++){
      const yy=y+dy;if(yy<0||yy>=field.h)continue;
      const w=3-Math.abs(dy);sum+=field.data[yy*field.w+x]*w;weight+=w;
    }
    profile[y]=sum/(weight*255);
  }
  let top=0,bottom=profile.length-1;
  while(top<bottom&&profile[top]<.06)top++;
  while(bottom>top&&profile[bottom]<.06)bottom--;
  return {profile,center:(top+bottom)*.5};
});
export function armBlend(side:number,u:number){return smooth(side?(u-173)/14:(18-u)/14)}
export function armSample(side:number,u:number,v:number){
  const {profile,center}=PROFILES[side];
  const outward=Math.max(0,side?u-187:4-u);
  const widen=1+.13*(1-Math.exp(-outward/85));
  // The left arm follows the reference's diagonal taper; the right stays nearly level.
  const bend=(side?.035:.36)*outward;
  const y=(v-center-bend)/widen+center;
  if(y<0||y>=profile.length-1)return 0;
  const row=Math.floor(y),f=y-row;
  return (profile[row]*(1-f)+profile[row+1]*f)*(.97+.03*Math.cos(outward*.055));
}
/** Bounds of the open extension long enough to cross any visible viewport edge. */
export function armSourceBounds(side:number,extent:number):[number,number,number,number]{
  return side?[0,0,192+extent,115+extent*.035]:[-extent,0,192,104+extent*.36];
}
