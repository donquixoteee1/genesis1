import fs from 'node:fs/promises';
import path from 'node:path';
import {homedir} from 'node:os';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {adaptTemplate} from './dream-skin-adapter.mjs';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),restoring=args.includes('--restore'),index=args.indexOf('--engine-root');
const root=path.resolve(index>=0?args[index+1]:path.join(homedir(),'.codex/codex-dream-skin-studio'));
if(root.includes('.app/Contents')||root.startsWith('/Applications/'))throw new Error('Refusing to modify an application bundle');
const version=(await fs.readFile(path.join(root,'VERSION'),'utf8')).trim();
if(version!=='1.5.21')throw new Error('GENESIS adapter supports Dream Skin 1.5.21 only');
const target=path.join(root,'assets/renderer-inject.js'),backup=target+'.genesis-original';
const expected='576c52af236d251e815c3398a8a8da419287e1281ebf2e05718ddd9fadb248cc';
const hash=value=>createHash('sha256').update(value).digest('hex');
if(!(await fs.lstat(target)).isFile())throw new Error('Renderer is not a regular file');
let original;
try{original=await fs.readFile(backup,'utf8')}catch(error){if(error.code!=='ENOENT')throw error;original=await fs.readFile(target,'utf8')}
if(hash(original)!==expected)throw new Error('Renderer does not match the reviewed official release; no files changed');
const extension=await fs.readFile(path.join(project,'dist/dream-skin/genesis-extension.js'),'utf8');
const css=await fs.readFile(path.join(project,'integration/dream-skin/native.css'),'utf8');
const patched=adaptTemplate(original,extension,css),current=await fs.readFile(target,'utf8');
// Exact hashes of previously reviewed GENESIS adapters. Unknown edits still fail closed.
const previousGenesis=new Set(['e4f6ac4636dd5c545c237fb88b4aa1985aee4dc20dd10e9b6cbdd9d0d9cf2cc2','b2d2d5c484ebf5a5e026cc457488692e1e09366aae8ff87a6d8797f1747a53bb','51cf245a8a9d8b6f4c2423a8ec9be605d702deaa5c673700077ecb9a33512061','4a64bc79892ce9658557982be9dfa7ecb0e97010afaa04c31b83b25d71723990']);
if(current!==original&&current!==patched&&!previousGenesis.has(hash(current)))throw new Error('Renderer was modified by another installation; no files changed');
if(args.includes('--check')){console.log(JSON.stringify({action:'preflight',compatible:true,filesChanged:false}));process.exit(0)}
if(!restoring){try{await fs.writeFile(backup,original,{flag:'wx',mode:0o600})}catch(error){if(error.code!=='EEXIST')throw error}}
const next=restoring?original:patched,temporary=target+'.genesis-'+process.pid;
await fs.writeFile(temporary,next,{flag:'wx',mode:0o600});await fs.rename(temporary,target);
console.log(JSON.stringify({action:restoring?'restore':'prepare-local-extension',engine:root,sha256:hash(next),backup,debugPortOpened:false,appRestarted:false},null,2));
