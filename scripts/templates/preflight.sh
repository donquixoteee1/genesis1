#!/bin/bash
set -euo pipefail
GENESIS_ROOT="$(cd "$(dirname "$0")" && pwd -P)"
GENESIS_ENGINE="$HOME/.codex/codex-dream-skin-studio"
[ -f "$GENESIS_ENGINE/VERSION" ] || GENESIS_ENGINE="$GENESIS_ROOT/vendor-engine"
[ -f "$GENESIS_ENGINE/VERSION" ] && [ "$(cat "$GENESIS_ENGINE/VERSION")" = 1.5.21 ] || { echo 'GENESIS requires the verified Dream Skin 1.5.21 engine.' >&2; exit 1; }
for entry in scripts/common-macos.sh scripts/install-dream-skin-macos.sh scripts/import-theme-zip-macos.sh scripts/switch-theme-macos.sh scripts/start-dream-skin-macos.sh assets/renderer-inject.js; do
  [ -f "$GENESIS_ENGINE/$entry" ] || { echo "Dream Skin is incomplete: $entry" >&2; exit 1; }
done
. "$GENESIS_ENGINE/scripts/common-macos.sh"
discover_codex_app
require_macos_runtime
[ -f "$CONFIG_PATH" ] || { echo 'Open the official Codex desktop app once, finish setup, then rerun this command.' >&2; exit 1; }
"$NODE" "$GENESIS_ROOT/scripts/patch-dream-skin.mjs" --engine-root "$GENESIS_ENGINE" --check
printf 'GENESIS preflight passed: macOS arm64, official signed Codex/runtime, existing config, and compatible engine.\n'
