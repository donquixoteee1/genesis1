#!/bin/bash
set -euo pipefail
# GENESIS @@VERSION@@ — macOS arm64, official Dream Skin 1.5.21 external engine.
# No GitHub credential is needed by recipients. This script contains only the install package.
[ "$(uname -s)" = Darwin ] && [ "$(uname -m)" = arm64 ] || { echo 'GENESIS currently supports macOS Apple Silicon only.' >&2; exit 1; }
GENESIS_PREPARE_ONLY=false
case "${1:-}" in ''|--approved-cdp-restart) ;; --prepare-only) GENESIS_PREPARE_ONLY=true ;; *) echo 'Unknown GENESIS installer option.' >&2; exit 2 ;; esac
@@NETWORK@@
GENESIS_VERSION='@@VERSION@@'
GENESIS_ROOT="$HOME/.codex/genesis/releases/$GENESIS_VERSION"
GENESIS_TEMP="$(mktemp -d "${TMPDIR:-/tmp}/genesis.XXXXXX")"
GENESIS_MOUNT="$GENESIS_TEMP/mount"
cleanup(){ if [ -d "$GENESIS_MOUNT" ]; then /usr/bin/hdiutil detach "$GENESIS_MOUNT" -quiet 2>/dev/null || true; fi; /bin/rm -rf "$GENESIS_TEMP"; }
trap cleanup EXIT
/usr/bin/base64 -D > "$GENESIS_TEMP/genesis.zip" <<'GENESIS_ARCHIVE'
@@ARCHIVE_BASE64@@
GENESIS_ARCHIVE
[ "$(/usr/bin/shasum -a 256 "$GENESIS_TEMP/genesis.zip" | /usr/bin/awk '{print $1}')" = '@@ARCHIVE_SHA256@@' ] || { echo 'GENESIS package checksum failed; nothing installed.' >&2; exit 1; }
/usr/bin/unzip -q "$GENESIS_TEMP/genesis.zip" -d "$GENESIS_TEMP/unpacked"
if [ -e "$GENESIS_ROOT" ]; then
  [ -f "$GENESIS_ROOT/GENESIS-VERSION" ] && [ "$(cat "$GENESIS_ROOT/GENESIS-VERSION")" = "$GENESIS_VERSION" ] || { echo 'Refusing to overwrite an unrelated directory.' >&2; exit 1; }
  for entry in activate.sh preflight.sh GENESIS-VERSION GENESIS-theme.zip scripts/create-launcher.mjs scripts/patch-dream-skin.mjs scripts/dream-skin-adapter.mjs dist/dream-skin/genesis-extension.js integration/dream-skin/native.css integration/dream-skin/Genesis.icns; do
    /usr/bin/cmp -s "$GENESIS_TEMP/unpacked/genesis/$entry" "$GENESIS_ROOT/$entry" || { echo "Existing GENESIS files are incomplete or modified: $entry" >&2; exit 1; }
  done
else
  /bin/mkdir -p "$(dirname "$GENESIS_ROOT")"
  /bin/chmod 700 "$(dirname "$GENESIS_ROOT")"
  /bin/mv "$GENESIS_TEMP/unpacked/genesis" "$GENESIS_ROOT"
fi
GENESIS_ENGINE="$HOME/.codex/codex-dream-skin-studio"
if [ -f "$GENESIS_ENGINE/VERSION" ]; then
  [ "$(cat "$GENESIS_ENGINE/VERSION")" = 1.5.21 ] || { echo 'Installed Dream Skin version is unsupported; no downgrade attempted.' >&2; exit 1; }
elif [ ! -f "$GENESIS_ROOT/vendor-engine/VERSION" ]; then
  /usr/bin/curl --fail --location --connect-timeout 15 --retry 2 --retry-delay 1 --proto '=https' --tlsv1.2 --max-time 300 -o "$GENESIS_TEMP/dream-skin.dmg" 'https://github.com/Fei-Away/Codex-Dream-Skin/releases/download/v1.5.21/CodexDreamSkin-v1.5.21.dmg'
  [ "$(/usr/bin/shasum -a 256 "$GENESIS_TEMP/dream-skin.dmg" | /usr/bin/awk '{print $1}')" = '41041647dec0e9a98d059031ec0e0c1cc1ecdcaf8ef5c949d5630e9a4e8ffde6' ] || { echo 'Official Dream Skin checksum mismatch.' >&2; exit 1; }
  /bin/mkdir "$GENESIS_MOUNT"
  /usr/bin/hdiutil attach "$GENESIS_TEMP/dream-skin.dmg" -nobrowse -readonly -mountpoint "$GENESIS_MOUNT" -quiet
  [ -d "$GENESIS_MOUNT/Codex Dream Skin.app/Contents/Resources/engine" ] || { echo 'Official engine not found in the verified disk image.' >&2; exit 1; }
  /usr/bin/ditto "$GENESIS_MOUNT/Codex Dream Skin.app/Contents/Resources/engine" "$GENESIS_TEMP/vendor-engine"
  [ "$(cat "$GENESIS_TEMP/vendor-engine/VERSION")" = 1.5.21 ] || { echo 'Invalid official engine version.' >&2; exit 1; }
  /bin/mv "$GENESIS_TEMP/vendor-engine" "$GENESIS_ROOT/vendor-engine"
fi
/bin/bash "$GENESIS_ROOT/preflight.sh"
printf '\nGENESIS files are prepared at %s\n' "$GENESIS_ROOT"
printf 'Activation enables an UNAUTHENTICATED CDP listener on 127.0.0.1 and restarts Codex after you quit it normally. Other local programs may read/control Codex through that port.\n'
printf '启用后会新增 Genesis 皮肤启动图标；请将它拖入 Dock。以后需从 Genesis 启动，原 Codex 图标打开的是不带皮肤的普通模式。\n'
GENESIS_APPROVED=false
if [ "$GENESIS_PREPARE_ONLY" = true ]; then :
elif [ "${1:-}" = --approved-cdp-restart ]; then GENESIS_APPROVED=true
elif ( : < /dev/tty > /dev/tty ) 2>/dev/null; then
  printf 'Type ENABLE GENESIS to approve, or press Enter to leave files prepared: ' > /dev/tty
  IFS= read -r GENESIS_REPLY < /dev/tty || true
  [ "${GENESIS_REPLY:-}" != 'ENABLE GENESIS' ] || GENESIS_APPROVED=true
fi
if [ "$GENESIS_APPROVED" != true ]; then
  printf 'Not activated. After explicit approval, run: bash "%s/activate.sh" --approved-cdp-restart\n' "$GENESIS_ROOT"
  exit 0
fi
/usr/bin/nohup /bin/bash "$GENESIS_ROOT/activate.sh" --approved-cdp-restart > "$GENESIS_ROOT/activation.log" 2>&1 < /dev/null &
printf 'Activation is waiting. Quit Codex normally once; it will reopen with GENESIS. Log: %s/activation.log\n' "$GENESIS_ROOT"
