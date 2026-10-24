import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {adaptTemplate} from '../scripts/dream-skin-adapter.mjs';
const anchor='  const THEME = themeConfig && typeof themeConfig === "object" ? themeConfig : {};';
const fixture=`((cssText,themeConfig)=>{\n${anchor}\nglobalThis.css=cssText;globalThis.id=THEME.id;\n})("native",__DREAM_SKIN_THEME_JSON__)`;
test('GENESIS local extension changes only its own theme and preserves other themes',()=>{const patched=adaptTemplate(fixture,'if(globalThis.id==="genesis")globalThis.animation=true;','genesis-only');for(const id of ['genesis','other-theme']){const context={};vm.runInNewContext(patched.replace('__DREAM_SKIN_THEME_JSON__',JSON.stringify({id})),context);assert.equal(context.css,id==='genesis'?'genesis-only':'native');assert.equal(!!context.animation,id==='genesis')}});
test('adapter refuses an unknown renderer layout or repeated installation',()=>{assert.throws(()=>adaptTemplate('unknown','',''),/renderer/);const patched=adaptTemplate(fixture,'','');assert.throws(()=>adaptTemplate(patched,'',''),/already/)});
const {build}=await import('esbuild');
const compiled=await build({stdin:{contents:"export {attachToDreamSkin,composerRegion} from './src/dream-skin.ts'",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const {attachToDreamSkin,composerRegion}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
test('theme cleanup removes the local extension and restores the original cleanup function',()=>{let disconnected=0,cleaned=0;globalThis.window={addEventListener(){}};globalThis.document={documentElement:{},querySelector:()=>null,addEventListener(){}};globalThis.MutationObserver=class{observe(){}disconnect(){disconnected++}};const original=()=>++cleaned,state={themeId:'genesis',cleanup:original};const handle=attachToDreamSkin(state);assert.equal(handle.diagnostics().active,false);assert.notEqual(state.cleanup,original);state.cleanup();handle.destroy();assert.equal(cleaned,1);assert.equal(disconnected,1);assert.equal(state.cleanup,original);assert.equal(window.__GENESIS_DREAM_SKIN__,undefined);assert.equal(attachToDreamSkin({themeId:'other',cleanup:original}),undefined)});

const rect=(left,top,width,height)=>({left,top,right:left+width,bottom:top+height,width,height});
const surface=(bounds,hidden=false)=>({isConnected:true,getBoundingClientRect:()=>bounds,closest:()=>hidden?{}:null});
test('native composer defocus stays inside the input even beside a utility cap',()=>{
 const canvas=surface(rect(246,0,1194,900)),input=surface(rect(493,600,700,132)),cap=surface(rect(493,545,700,48));
 const scope={querySelectorAll:()=>[cap]};
 assert.deepEqual(composerRegion(input,canvas,scope),{x:247,y:600,width:700,height:132});
});
test('defocus excludes retained hidden routes and unrelated floating panels',()=>{
 const canvas=surface(rect(246,0,1194,900)),input=surface(rect(493,600,700,132));
 const scope={querySelectorAll:()=>[surface(rect(493,545,700,48),true),surface(rect(250,20,180,48)),surface(rect(493,100,700,48))]};
 assert.deepEqual(composerRegion(input,canvas,scope),{x:247,y:600,width:700,height:132});
});
