import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const parent=path.resolve(process.argv[2]||path.join(os.homedir(),'Applications'));
const app=path.join(parent,'Genesis.app');
try{const old=await fs.readFile(path.join(app,'Contents/Info.plist'),'utf8');if(!old.includes('local.genesis.codex.launcher'))throw new Error('Refusing to overwrite unrelated app')}catch(e){if(e.code!=='ENOENT')throw e}
await fs.mkdir(path.join(app,'Contents/MacOS'),{recursive:true});
await fs.writeFile(path.join(app,'Contents/Info.plist'),`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>local.genesis.codex.launcher</string><key>CFBundleName</key><string>Genesis</string><key>CFBundleDisplayName</key><string>Genesis</string><key>CFBundleExecutable</key><string>Genesis</string><key>CFBundlePackageType</key><string>APPL</string><key>LSUIElement</key><true/></dict></plist>`);
await fs.writeFile(path.join(app,'Contents/MacOS/Genesis'),`#!/bin/bash
set -euo pipefail
engine="$HOME/.codex/codex-dream-skin-studio"
log="$HOME/.codex/genesis-launcher.log"
if /bin/bash "$engine/scripts/start-dream-skin-macos.sh" >> "$log" 2>&1; then exit 0; fi
/usr/bin/osascript -e 'display alert "Genesis" message "无法加载皮肤。如果 Codex 已打开，请先保存工作并按 Command Q 正常退出，再点击 Genesis。详情见 ~/.codex/genesis-launcher.log。"'
exit 1
`,{mode:0o700});
console.log(app);
