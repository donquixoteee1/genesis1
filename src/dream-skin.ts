import {HandsEngine} from './hands/engine';

type DreamState={themeId?:string;cleanup:()=>unknown};
type GenesisHandle={destroy:()=>void;diagnostics:()=>{active:boolean;time:number;frameMs:number;cells:number;error:string}};
type SkinWindow=Window&{__CODEX_DREAM_SKIN_STATE__?:DreamState;__GENESIS_DREAM_SKIN__?:GenesisHandle};

/** The input itself is the only defocus surface; surrounding utility UI stays sharp. */
export function composerRegion(composer:HTMLElement|undefined,canvas:HTMLCanvasElement,_scope:HTMLElement){
  if(!composer?.isConnected)return undefined;
  const c=canvas.getBoundingClientRect(),r=composer.getBoundingClientRect();
  return {x:r.left-c.left,y:r.top-c.top,width:r.width,height:r.height};
}

/** Local trusted extension; never executed from a downloaded theme ZIP. */
export function attachToDreamSkin(state:DreamState|undefined){
  if(state?.themeId!=='genesis')return;
  const target=window as SkinWindow;
  target.__GENESIS_DREAM_SKIN__?.destroy();
  const originalCleanup=state.cleanup;
  const lifetime=new AbortController();
  let engine:HandsEngine|undefined,host:HTMLDivElement|undefined,main:HTMLElement|undefined,composer:HTMLElement|undefined;
  let disposed=false,error='',timer:ReturnType<typeof setTimeout>|undefined;
  let savedPosition='',changedPosition=false;
  const mainSelector='main[data-app-shell-main-surface],main[data-ds-part="main"],main.main-surface,main[class*="_MainContentSurface_"]';
  const composerSelector='[data-ds-part="composer"],.composer-surface-chrome,[class*="_ComposerLayoutRoot_"],[data-composer-surface-variant][data-composer-radius-variant]';
  function unmount(){
    engine?.destroy();engine=undefined;host?.remove();host=undefined;
    if(changedPosition&&main?.style.position==='relative')main.style.position=savedPosition;
    changedPosition=false;main=undefined;composer=undefined;
  }
  function sync(){
    timer=undefined;if(disposed||error)return;
    // Use structural markers only; no chat text, file names, or editor values are read.
    const home=document.querySelector('[data-testid="home-icon"]');
    const next=home?.closest<HTMLElement>('main')??(home?document.querySelector<HTMLElement>(mainSelector):null);
    if(!next){unmount();return}
    composer=next.querySelector<HTMLElement>(composerSelector)??undefined;
    if(main===next&&host?.isConnected)return;
    unmount();main=next;composer=main.querySelector<HTMLElement>(composerSelector)??undefined;
    savedPosition=main.style.position;
    if(getComputedStyle(main).position==='static'){main.style.position='relative';changedPosition=true}
    host=document.createElement('div');host.id='genesis-dream-background';host.setAttribute('aria-hidden','true');
    Object.assign(host.style,{position:'absolute',inset:'0',overflow:'hidden',pointerEvents:'none',zIndex:'-1'});
    const canvas=document.createElement('canvas');Object.assign(canvas.style,{display:'block',width:'100%',height:'100%',pointerEvents:'none'});
    host.append(canvas);main.prepend(host);
    try{
      engine=new HandsEngine(canvas,()=>composerRegion(composer,canvas,main!));
      focus();
    }catch(caught){error=caught instanceof Error?caught.message:String(caught);unmount();console.error('GENESIS background could not start:',error)}
  }
  function queue(){if(!disposed&&!timer)timer=setTimeout(sync,120)}
  function focus(){if(!engine)return;engine.typing=!!composer?.contains(document.activeElement);engine.draw()}
  const observer=new MutationObserver(records=>{
    if(records.some(record=>record.type==='childList'||record.oldValue!==(record.target as Element).getAttribute(record.attributeName!)))queue();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeOldValue:true,attributeFilter:['data-ds-part']});
  document.addEventListener('focusin',focus,{signal:lifetime.signal});
  document.addEventListener('focusout',()=>queueMicrotask(focus),{signal:lifetime.signal});
  document.addEventListener('DOMContentLoaded',queue,{signal:lifetime.signal});
  window.addEventListener('pageshow',()=>engine?.schedule(),{signal:lifetime.signal});
  window.addEventListener('pagehide',(event)=>{if(event.persisted)engine?.suspend();else destroy()},{signal:lifetime.signal});
  function destroy(){if(disposed)return;disposed=true;clearTimeout(timer);observer.disconnect();lifetime.abort();unmount();if(state!.cleanup===cleanup)state!.cleanup=originalCleanup;if(target.__GENESIS_DREAM_SKIN__===handle)delete target.__GENESIS_DREAM_SKIN__}
  function cleanup(){destroy();return originalCleanup()}
  const handle:GenesisHandle={destroy,diagnostics:()=>({active:!!engine,time:engine?.time??0,frameMs:engine?.frameCost??0,cells:engine?.renderer.glyph.length??0,error})};
  target.__GENESIS_DREAM_SKIN__=handle;state.cleanup=cleanup;sync();return handle;
}
if(typeof window!=='undefined')attachToDreamSkin((window as SkinWindow).__CODEX_DREAM_SKIN_STATE__);
