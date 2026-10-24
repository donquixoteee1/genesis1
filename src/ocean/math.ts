export const TAU = Math.PI * 2;
export const clamp = (x:number,a=0,b=1) => Math.max(a,Math.min(b,x));
export const mix = (a:number,b:number,t:number) => a+(b-a)*t;
export const smooth = (t:number) => {t=clamp(t);return t*t*(3-2*t)};
export function hash(x:number,y:number=0,s:number=7){let h=Math.imul(x|0,1597334677)^Math.imul(y|0,3812015801)^s;h=Math.imul(h^(h>>>16),2246822519);return ((h^(h>>>13))>>>0)/4294967296}
export function current(x:number,y:number,t:number){return [Math.cos(y*.008-t*.055)*5+Math.sin((x+y)*.004+t*.06)*3,-Math.cos(x*.006+t*.04)*3-Math.sin((x+y)*.004+t*.06)*3]}
export function catmull(a:number,b:number,c:number,d:number,t:number){return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)}
export type Point = [number,number];
export function inside(x:number,y:number,p:Point[]){let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit}return hit}
