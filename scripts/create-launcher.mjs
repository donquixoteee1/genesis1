import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const parent=path.resolve(process.argv[2]||path.join(os.homedir(),'Applications'));
const app=path.join(parent,'Genesis.app');
try{const old=await fs.readFile(path.join(app,'Contents/Info.plist'),'utf8');if(!old.includes('local.genesis.codex.launcher'))throw new Error('Refusing to overwrite unrelated app')}catch(e){if(e.code!=='ENOENT')throw e}
await fs.mkdir(path.join(app,'Contents/MacOS'),{recursive:true});
await fs.writeFile(path.join(app,'Contents/Info.plist'),`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>local.genesis.codex.launcher</string><key>CFBundleName</key><string>Genesis</string><key>CFBundleDisplayName</key><string>Genesis</string><key>CFBundleExecutable</key><string>Genesis</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleIconFile</key><string>Genesis.icns</string><key>LSArchitecturePriority</key><array><string>arm64</string></array><key>LSRequiresNativeExecution</key><true/><key>LSUIElement</key><true/></dict></plist>`);
await fs.writeFile(path.join(app,'Contents/MacOS/Genesis'),`#!/bin/bash
set -euo pipefail
engine="$HOME/.codex/codex-dream-skin-studio"
log="$HOME/.codex/genesis-launcher.log"
if [ "\${1:-}" = "--check" ]; then
  /bin/bash -c 'source "$1/scripts/common-macos.sh"; discover_codex_app; require_macos_runtime; /usr/bin/arch -arm64 /usr/bin/uname -m' _ "$engine"
  exit $?
fi
if /bin/bash "$engine/scripts/start-dream-skin-macos.sh" > "$log" 2>&1; then exit 0; fi
detail="$(/usr/bin/tail -n 6 "$log")"
/usr/bin/osascript - "$detail" <<'APPLESCRIPT'
on run argv
  display alert "Genesis" message ("无法加载皮肤。此次启动的错误：" & return & item 1 of argv & return & "完整日志：~/.codex/genesis-launcher.log")
end run
APPLESCRIPT
exit 1
`,{mode:0o700});
await fs.mkdir(path.join(app,'Contents/Resources'),{recursive:true});
await fs.copyFile(path.join(project,'integration/dream-skin/Genesis.icns'),path.join(app,'Contents/Resources/Genesis.icns'));
console.log('已新增 Genesis 皮肤启动图标：'+app+'。请将它拖入 Dock，以后退出 Codex 后从 Genesis 启动。原 Codex 图标以普通模式启动，不加载皮肤。');
