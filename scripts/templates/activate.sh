#!/bin/bash
set -euo pipefail
[ "${1:-}" = --approved-cdp-restart ] || { echo 'Explicit local CDP/restart approval is required.' >&2; exit 2; }
GENESIS_ROOT="$(cd "$(dirname "$0")" && pwd -P)"
GENESIS_STATUS="$GENESIS_ROOT/activation-status.txt"
trap 'genesis_code=$?; if [ "$genesis_code" -ne 0 ]; then printf "failed:%s\n" "$genesis_code" > "$GENESIS_STATUS"; printf "GENESIS activation failed (%s). See activation.log.\n" "$genesis_code" >&2; fi' EXIT
printf 'checking\n' > "$GENESIS_STATUS"
/bin/bash "$GENESIS_ROOT/preflight.sh"
GENESIS_INSTALLED="$HOME/.codex/codex-dream-skin-studio"
GENESIS_ENGINE="$GENESIS_INSTALLED"
[ -f "$GENESIS_ENGINE/VERSION" ] || GENESIS_ENGINE="$GENESIS_ROOT/vendor-engine"
. "$GENESIS_ENGINE/scripts/common-macos.sh"
discover_codex_app
require_signed_node_runtime
printf 'waiting-for-quit\n' > "$GENESIS_STATUS"
printf 'Waiting for a normal Codex quit. No force quit will be issued.\n'
GENESIS_DEADLINE=$((SECONDS + 1800))
while codex_is_running; do
  [ "$SECONDS" -lt "$GENESIS_DEADLINE" ] || { echo 'No normal Codex quit observed within 30 minutes; run activate.sh again when ready.' >&2; exit 1; }
  /bin/sleep 1
done
/bin/bash "$GENESIS_ROOT/preflight.sh"
printf 'activating\n' > "$GENESIS_STATUS"
if [ ! -f "$GENESIS_INSTALLED/VERSION" ]; then
  /bin/bash "$GENESIS_ENGINE/scripts/install-dream-skin-macos.sh" --no-launchers --no-launch
fi
"$NODE" "$GENESIS_ROOT/scripts/patch-dream-skin.mjs" --engine-root "$GENESIS_INSTALLED"
/bin/bash "$GENESIS_INSTALLED/scripts/import-theme-zip-macos.sh" --file "$GENESIS_ROOT/GENESIS-theme.zip" --expected-sha256 '@@THEME_SHA256@@' --expected-bytes '@@THEME_BYTES@@'
/bin/bash "$GENESIS_INSTALLED/scripts/switch-theme-macos.sh" --id genesis --no-apply
"$NODE" "$GENESIS_ROOT/scripts/create-launcher.mjs"
/bin/bash "$GENESIS_INSTALLED/scripts/start-dream-skin-macos.sh"
printf 'active\n' > "$GENESIS_STATUS"
printf 'GENESIS activated. Check the native new-chat page visually.\n'
