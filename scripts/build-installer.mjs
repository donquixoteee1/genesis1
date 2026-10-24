import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const {version}=JSON.parse(await fs.readFile('package.json','utf8'));
const stage=path.resolve('artifacts/installer-'+version),root=path.join(stage,'genesis');
if(!/^\d+\.\d+\.\d+$/.test(version))throw new Error('Invalid release version');
await fs.rm(stage,{recursive:true,force:true});
await fs.mkdir(root,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const zip=(cwd,out,files)=>{const p=spawnSync('zip',['-q','-r',out,...files],{cwd,encoding:'utf8'});if(p.status!==0)throw new Error(p.stderr||'zip failed')};
const theme=path.join(root,'GENESIS-theme.zip');
zip(path.resolve('integration/dream-skin'),theme,['theme.json','theme.css','background.png']);
const themeData=await fs.readFile(theme);
for(const file of ['scripts/create-launcher.mjs','scripts/patch-dream-skin.mjs','scripts/dream-skin-adapter.mjs','dist/dream-skin/genesis-extension.js','integration/dream-skin/native.css']){const to=path.join(root,file);await fs.mkdir(path.dirname(to),{recursive:true});await fs.copyFile(file,to)}
await fs.copyFile('scripts/templates/preflight.sh',path.join(root,'preflight.sh'));
await fs.writeFile(path.join(root,'GENESIS-VERSION'),version+'\n');
const activate=(await fs.readFile('scripts/templates/activate.sh','utf8')).replace('@@THEME_SHA256@@',()=>sha(themeData)).replace('@@THEME_BYTES@@',()=>String(themeData.length));
await fs.writeFile(path.join(root,'activate.sh'),activate,{mode:0o700});
const archive=path.join(stage,'genesis-macos.zip');
zip(stage,archive,['genesis']);
const bytes=await fs.readFile(archive);
let install=await fs.readFile('scripts/templates/install.sh','utf8');
for(const [key,value]of Object.entries({NETWORK:(await fs.readFile('scripts/templates/network.sh','utf8')).trim(),VERSION:version,ARCHIVE_BASE64:bytes.toString('base64').match(/.{1,76}/g).join('\n'),ARCHIVE_SHA256:sha(bytes)}))install=install.replaceAll('@@'+key+'@@',()=>value);
await fs.mkdir('distribution/payload',{recursive:true});
await fs.writeFile('distribution/payload/install.sh',install,{mode:0o700});
await fs.writeFile(path.join(stage,'release.json'),JSON.stringify({version,archiveSHA256:sha(bytes),installerSHA256:sha(install),platform:'macOS arm64',dreamSkinVersion:'1.5.21'},null,2)+'\n');
for(const file of ['distribution/payload/install.sh',path.join(root,'activate.sh'),path.join(root,'preflight.sh')]){const p=spawnSync('/bin/bash',['-n',file],{encoding:'utf8'});if(p.status!==0)throw new Error(p.stderr)}
console.log(JSON.stringify({version,installerBytes:Buffer.byteLength(install),sha256:sha(install)}));
