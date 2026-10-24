import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('Genesis app launches the skin entry and never force restarts Codex',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'genesis-app-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const p=spawnSync(process.execPath,['scripts/create-launcher.mjs',dir],{encoding:'utf8'});assert.equal(p.status,0,p.stderr);
 const script=await fs.readFile(path.join(dir,'Genesis.app/Contents/MacOS/Genesis'),'utf8');assert.match(script,/start-dream-skin-macos.sh/);assert.ok(!/restart-existing|kill|launchctl/.test(script));
 const plist=await fs.readFile(path.join(dir,'Genesis.app/Contents/Info.plist'),'utf8');assert.match(plist,/CFBundleIconFile/);
 const icon=await fs.readFile(path.join(dir,'Genesis.app/Contents/Resources/Genesis.icns'));assert.deepEqual(icon,await fs.readFile('integration/dream-skin/Genesis.icns'));assert.match(p.stdout,/新增 Genesis/);
 assert.equal(spawnSync('/bin/bash',['-n'],{input:script}).status,0);
});

test('Rosetta native architecture query matches the arm64 runtime',{skip:process.platform!=='darwin'||process.arch!=='arm64'},()=>{
 const result=spawnSync('/usr/bin/arch',['-x86_64','/bin/bash','-c','/usr/bin/arch -arm64 /usr/bin/uname -m'],{encoding:'utf8',timeout:5000});
 assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'arm64');
});
