import {HandsEngine} from './hands/engine';

export interface GenesisOptions {
  /** An owned, positioned background slot; foreground UI must sit above this slot. */
  host:HTMLElement;
  /** The host's real input panel, used only for geometry and focus dimming. */
  composer?:HTMLElement;
}
/** Portable web adapter. This is not a native Codex extension or an app patch. */
export function mountGenesis({host,composer}:GenesisOptions){
  if(!host.isConnected)throw new Error('GENESIS requires a connected background host.');
  const controller=new AbortController(),canvas=document.createElement('canvas');
  canvas.setAttribute('aria-hidden','true');canvas.dataset.genesis='';
  Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',userSelect:'none'});
  host.append(canvas);
  let engine:HandsEngine;
  try{engine=new HandsEngine(canvas,composer?()=>{const c=canvas.getBoundingClientRect(),r=composer.getBoundingClientRect();return {x:r.left-c.left,y:r.top-c.top,width:r.width,height:r.height}}:undefined)}catch(error){canvas.remove();throw error}
  const focus=()=>{engine.typing=!!composer?.contains(document.activeElement);engine.draw()};
  composer?.addEventListener('focusin',focus,{signal:controller.signal});
  composer?.addEventListener('focusout',()=>queueMicrotask(focus),{signal:controller.signal});
  const show=()=>engine.schedule();
  const hide=(event:PageTransitionEvent)=>{if(event.persisted)engine.suspend();else destroy()};
  window.addEventListener('pageshow',show,{signal:controller.signal});
  window.addEventListener('pagehide',hide,{signal:controller.signal});
  let destroyed=false;
  function destroy(){if(destroyed)return;destroyed=true;controller.abort();engine.destroy();canvas.remove()}
  return {destroy,pause(){engine.paused=true;engine.suspend()},resume(){if(destroyed)return;engine.paused=false;engine.schedule()}};
}
