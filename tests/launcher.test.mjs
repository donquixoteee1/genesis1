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
 assert.equal(spawnSync('/bin/bash',['-n'],{input:script}).status,0);
});
