import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const commandModule=await import('../scripts/install-command.mjs').catch(()=>({}));
const key='K'.repeat(43);
async function exercise(t,{exit=0,proxy='1',existingProxy}={}){
  assert.equal(typeof commandModule.makeInstallCommand,'function','a checked, download-before-execute command is required');
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'genesis launcher '));
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  await fs.writeFile(path.join(root,'scutil'),`#!/bin/bash\nprintf 'HTTPSEnable : ${proxy}\\nHTTPSProxy : 127.0.0.1\\nHTTPSPort : 7897\\n'\n`,{mode:0o700});
  await fs.writeFile(path.join(root,'curl'),`#!/bin/bash\nwhile [ "$#" -gt 0 ]; do if [ "$1" = -o ]; then shift; target="$1"; fi; shift; done\nprintf '%s' "\u0024{HTTPS_PROXY:-}" > "$GENESIS_TEST_PROXY"\nprintf 'touch "%s"\\n' "$GENESIS_TEST_MARKER" > "$target"\nprintf '%s' "$target" > "$GENESIS_TEST_TEMPFILE"\nexit ${exit}\n`,{mode:0o700});
  const env={...process.env,PATH:root+':'+process.env.PATH,GENESIS_TEST_MARKER:path.join(root,'executed'),GENESIS_TEST_PROXY:path.join(root,'proxy'),GENESIS_TEST_TEMPFILE:path.join(root,'tempfile')};
  for(const k of ['HTTPS_PROXY','https_proxy','ALL_PROXY','all_proxy'])delete env[k];
  if(existingProxy)env.HTTPS_PROXY=existingProxy;
  const command=commandModule.makeInstallCommand({url:'https://genesis.example.test/api/install',key});
  assert.ok(!command.includes('\n'),'share command must be one line');
  const run=spawnSync('/bin/bash',['-c',command],{env,encoding:'utf8'});
  const executed=await fs.access(env.GENESIS_TEST_MARKER).then(()=>true,()=>false);
  const temp=await fs.readFile(env.GENESIS_TEST_TEMPFILE,'utf8');
  assert.equal(await fs.access(temp).then(()=>true,()=>false),false,'download tempfile cleaned');
  return {run,executed,proxy:await fs.readFile(env.GENESIS_TEST_PROXY,'utf8')};
}
test('a failed or partial download never executes and returns a nonzero status',async t=>{const r=await exercise(t,{exit:22});assert.notEqual(r.run.status,0);assert.equal(r.executed,false)});
test('a complete download executes and picks up an enabled macOS system HTTPS proxy',async t=>{const r=await exercise(t);assert.equal(r.run.status,0,r.run.stderr);assert.equal(r.executed,true);assert.equal(r.proxy,'http://127.0.0.1:7897')});
test('launcher preserves an explicit proxy and ignores disabled system proxies',async t=>{assert.equal((await exercise(t,{existingProxy:'http://127.0.0.1:7777'})).proxy,'http://127.0.0.1:7777');assert.equal((await exercise(t,{proxy:'0'})).proxy,'')});
test('installer builds cannot include leftover vendor engines or stale archive members',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'genesis-package-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const {version}=JSON.parse(await fs.readFile('package.json','utf8'));
 for(const file of ['package.json','scripts/build-installer.mjs','scripts/create-launcher.mjs','scripts/patch-dream-skin.mjs','scripts/dream-skin-adapter.mjs','integration/dream-skin/native.css','integration/dream-skin/theme.json','integration/dream-skin/theme.css','integration/dream-skin/background.png']){await fs.mkdir(path.dirname(path.join(root,file)),{recursive:true});await fs.copyFile(file,path.join(root,file))}
 await fs.mkdir(path.join(root,'dist/dream-skin'),{recursive:true});await fs.writeFile(path.join(root,'dist/dream-skin/genesis-extension.js'),'// packaging-only fixture\n');
 await fs.cp('scripts/templates',path.join(root,'scripts/templates'),{recursive:true});
 const stage=path.join(root,'artifacts/installer-'+version);await fs.mkdir(path.join(stage,'genesis/vendor-engine'),{recursive:true});await fs.writeFile(path.join(stage,'genesis/vendor-engine/STALE'),'never ship');
 const run=spawnSync(process.execPath,['scripts/build-installer.mjs'],{cwd:root,encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 const archive=spawnSync('unzip',['-Z1',path.join(stage,'genesis-macos.zip')],{encoding:'utf8'});assert.equal(archive.status,0,archive.stderr);assert.ok(!archive.stdout.includes('STALE'),'old stage leaked into new installer');
});
test('activation stops at a failed foreground preflight and records the failure',async t=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'genesis-activation-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const engine=path.join(root,'engine');await fs.mkdir(path.join(engine,'scripts'),{recursive:true});
 await fs.writeFile(path.join(engine,'VERSION'),'1.5.21');await fs.writeFile(path.join(engine,'scripts/common-macos.sh'),'discover_codex_app(){ exit 99; }\n');
 await fs.writeFile(path.join(root,'preflight.sh'),'#!/bin/bash\nexit 19\n');
 const template=(await fs.readFile('scripts/templates/activate.sh','utf8')).replace('GENESIS_INSTALLED="$HOME/.codex/codex-dream-skin-studio"','GENESIS_INSTALLED='+JSON.stringify(engine));await fs.writeFile(path.join(root,'activate.sh'),template);
 const result=spawnSync('/bin/bash',[path.join(root,'activate.sh'),'--approved-cdp-restart'],{encoding:'utf8',timeout:2000});
 assert.equal(result.status,19,'preflight must stop activation before touching the engine');
 assert.match(await fs.readFile(path.join(root,'activation-status.txt'),'utf8'),/failed:19/);
});
