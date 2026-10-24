import {build} from 'esbuild';
import {mkdir,writeFile,copyFile,readFile} from 'node:fs/promises';
const {version}=JSON.parse(await readFile('package.json','utf8'));
await mkdir('dist/skin',{recursive:true});
await build({entryPoints:['src/skin.ts'],bundle:true,format:'esm',target:'es2022',minify:true,outfile:'dist/skin/genesis.js'});
await writeFile('dist/skin/manifest.json',JSON.stringify({name:'GENESIS',version,type:'web-background-module',entry:'genesis.js',nativeCodexInstallable:false,compatibility:'Requires a host integration. No official native Codex dynamic-background API has been verified.',networkAccess:false},null,2)+'\n');
await mkdir('dist/dream-skin',{recursive:true});
await build({entryPoints:['src/dream-skin.ts'],bundle:true,format:'iife',target:'es2022',minify:true,outfile:'dist/dream-skin/genesis-extension.js'});

for(const name of ["theme.json","theme.css","background.png"])await copyFile("integration/dream-skin/"+name,"dist/dream-skin/"+name);
