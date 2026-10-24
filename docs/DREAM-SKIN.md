# GENESIS × Codex Dream Skin

Target: Codex Dream Skin **1.5.21**, macOS. This is a local animation extension for the external Dream Skin engine, not a standard theme-only ZIP or an official OpenAI plugin.

The official theme import contract admits images and Safe CSS. It does not accept JavaScript in downloaded themes. `GENESIS-theme.zip` therefore contains only the validated theme metadata, Safe CSS and a plain black placeholder image. The visible hands are still drawn entirely as ASCII by the separate, locally installed animation module.

## Boundaries

- The Dream Skin application comes from the project's official v1.5.21 release. The downloaded DMG SHA-256 is `41041647dec0e9a98d059031ec0e0c1cc1ecdcaf8ef5c949d5630e9a4e8ffde6`.
- The adapter changes only the external user-installed engine's `assets/renderer-inject.js`. It refuses app-bundle paths, unknown versions, and any renderer differing from the reviewed official hash.
- The official Codex / ChatGPT `.app`, `app.asar` and signatures are not modified.
- A local extension gates on `themeId === "genesis"`. Other themes retain the official Dream Skin renderer. Switching away calls the extension's cleanup.
- Only structural DOM markers are used. Chat text, editor values, file names and credentials are not read. No network requests are made by GENESIS.
- Animation mounts only on a structurally identified new-chat page, stops when that page is removed, and follows visibility and reduced-motion settings. Native UI remains native.

## Security authorization

Dream Skin enables an unauthenticated CDP listener bound to `127.0.0.1`. Other processes on the same computer can potentially inspect or control the Codex renderer. Pausing a skin does not close that port. To close it, fully quit Codex and reopen normally, or use Dream Skin's full Restore/restart.

Installing on any machine requires its user's explicit approval for the local extension, CDP listener and restart.

When first activating the theme, quit Codex normally before using the official Dream Skin installation and launch scripts. Do not force-quit an active task or override native quit dialogs.

## Installation components

1. Install the official Dream Skin app.
2. With Codex closed, run its bundled `install-dream-skin-macos.sh --no-launchers --no-launch`.
3. Build this project, then run `node scripts/patch-dream-skin.mjs` against the external installed engine.
4. Import the validated three-file theme ZIP through Dream Skin, select `genesis`, and start the official Dream Skin launcher.

A targeted installer must obtain the machine user's explicit CDP/restart approval before step 4. Do not silently open a debug port in a distributed installer.

## Restore

`node scripts/patch-dream-skin.mjs --restore` restores the reviewed renderer from its byte-identical backup. The script refuses to overwrite unrelated modifications. After restoring, choose Dream Skin's Restore/restart or quit and reopen the official Codex normally to close CDP. Reinstalling or upgrading the Dream Skin engine can replace the local adapter; this release intentionally refuses versions other than 1.5.21 until reviewed and tested.

## Verification status

35 project tests, strict TypeScript and both builds pass. The official Safe CSS validator, official package validator and offline payload integrity check accept GENESIS. The adapter's repeat-install and byte-identical restore checks pass on a private engine copy. These checks do not establish native rendering on every Codex build. Actual native rendering must be checked after activation, especially when Codex changes its DOM.

## 2.0.1 composition fix

The hand and explosion centers now share the reference viewport anchor (50% width, 47% height). A bottom-docked native composer no longer moves the artwork down or out of view. Its measured rectangle is used only for defocus and typing focus. Two regression tests cover this independently of the native UI. Existing scale, edge-continuous forearms and the animation cycle are preserved.

The user confirmed that 2.0.1 restored the intended native hand positions. The engine reported verification timeouts for some renderer sessions during refresh, so a refresh log alone is not treated as proof of the native visual result.

## 2.0.2 composer defocus fix

The native ComposerLayoutBody retained an opaque background that hid the already blurred canvas, while the outer tint was 80% opaque. The local home-page CSS now clears only that nested paint and uses a 38% tint. The separate home utility cap uses the same tint with a 5px backdrop blur. Text, controls, hand placement and simulation buffers are unchanged.

The fixture at `/tests/fixtures/native-composer.html` reproduces the documented native nested-body structure with an initially opaque inner surface. Before the fix it reports FAIL; after the fix it reports PASS, with transparent inner paint and the expected outer tint. Browser visual verification confirms defocused background and sharp text. All 30 project tests, the production build and offline Dream Skin payload integrity check pass. Native 2.0.2 display confirmation remains separate from these checks.

## 2.0.3 complete composer surface

The native screenshot showed a separately painted Home utility cap still opaque above the already defocused input. The 2.0.2 cap selector required placement/position attributes absent from the CSS Module-only variant. This update also matches the documented `_homeUtilityBar_` and `_ComposerHomeUtilityBar_` prefixes and unions only an adjacent, visible cap into the canvas defocus rectangle. Hidden retained routes and remote panels are excluded. The fixture now omits those optional attributes and calls the production region resolver; it failed before this change and passes afterward. All 32 tests, strict TypeScript, production build and offline payload integrity checks pass. The user confirmed native hand position in 2.0.1; native 2.0.3 cap appearance still needs visual confirmation.

## 2.0.4 input-only blur and recording

The latest composition requires defocus strictly inside the bordered input. The native region resolver no longer unions the utility bar into that area; its previous 2.0.3 behavior is superseded. Canvas clipping is inset one CSS pixel so fractional DPR antialiasing does not affect the border or exterior. A browser pixel comparison found zero changed pixels outside the rectangle.

The prior recording also changed viewport between seeking the frame and capturing it: the composer reflowed by about 28 CSS pixels while the canvas retained the earlier mask. The capture fixture now fixes the reference stage and typography independently of the viewport, synchronously aligns renderer size on frame selection, and captures with a viewport large enough for the output. The replacement recording is 765 frames at 30 fps (25.5 seconds / 1.5 cycles).

## 2.0.5 installer audit

Distribution now checks signed Codex/runtime and reviewed engine compatibility before approval; failed downloads do not execute and system HTTPS proxies are honored. First-download preparation and official offline theme import passed in isolation on the existing Mac, with no native restart or UI control. Details and remaining compatibility limits are in [DISTRIBUTION.md](DISTRIBUTION.md).
