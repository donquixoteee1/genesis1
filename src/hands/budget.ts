/** Two RGBA surfaces: at most 19.2 MB of raw pixel storage, excluding browser overhead. */
export const MAX_SURFACE_PIXELS=2_400_000;
export const MAX_GRID_CELLS=28_000;
export function renderBudget(width:number,height:number,pixelRatio:number){
  const finite=(n:number,fallback:number)=>Number.isFinite(n)&&n>0?n:fallback;
  const w=finite(width,1),h=finite(height,1);
  const dpr=Math.min(finite(pixelRatio,1),1.5,Math.sqrt(MAX_SURFACE_PIXELS/(w*h)),8192/w,8192/h);
  const pixelWidth=Math.max(1,Math.floor(w*dpr)),pixelHeight=Math.max(1,Math.floor(h*dpr));
  let scale=Math.max(1,Math.sqrt(w*h/(70*MAX_GRID_CELLS)));
  let cw=7*scale,ch=10*scale,cols=Math.ceil(w/cw),rows=Math.ceil(h/ch);
  while(cols*rows>MAX_GRID_CELLS){scale*=1.01;cw=7*scale;ch=10*scale;cols=Math.ceil(w/cw);rows=Math.ceil(h/ch)}
  return {dpr,pixelWidth,pixelHeight,cw,ch,cols,rows};
}
