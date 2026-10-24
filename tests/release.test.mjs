import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),esbuild=createRequire(require.resolve('vite'))('esbuild');
const {outputFiles}=await esbuild.build({stdin:{contents:`export * from './src/hands/budget.ts';`,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const {renderBudget,MAX_SURFACE_PIXELS,MAX_GRID_CELLS}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
test('4K/8K and Retina surfaces stay inside the explicit memory and work budget',()=>{for(const [w,h,d] of [[1194,900,2],[3840,2160,3],[7680,4320,2],[320,780,4],[100000,50000,8]]){const b=renderBudget(w,h,d);assert.ok(b.pixelWidth*b.pixelHeight<=MAX_SURFACE_PIXELS);assert.ok(b.cols*b.rows<=MAX_GRID_CELLS);assert.ok(b.dpr>0&&b.dpr<=1.5)}});
test('invalid and zero dimensions become a finite minimum surface',()=>{for(const n of [0,-1,NaN,Infinity]){const b=renderBudget(n,n,n);for(const v of Object.values(b))assert.ok(Number.isFinite(v)&&v>0)}});
