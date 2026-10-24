# Private GENESIS distribution

Source repository: `donquixoteee1/codex-genesis-skin`, **private**. Recipients do not need repository access or a GitHub token. The dedicated distribution service returns a self-contained installer only after verifying a separate bearer download key. The service stores SHA-256 key hashes in the server-only `GENESIS_DOWNLOAD_KEY_HASHES` environment variable; plaintext keys must never be committed.

Build the animation and installer:

```sh
npm ci
npm test
npm run build
npm run build:installer
```

Deploy only `distribution/` to the chosen Vercel project. Its route allowlist exposes `/api/install` and `robots.txt`; every other path returns 404. The installer payload is included only in the Node function, not published as a static asset. `distribution/payload/install.sh` is generated and ignored by Git.

Production service: `https://genesis-private-installer.vercel.app/api/install`. The owner issues the dedicated download key privately; it must never be included in this repository. The owner generates the checked one-line command with `makeInstallCommand` from `scripts/install-command.mjs`. It downloads completely to a temporary file before execution, stops on HTTP/network failures, and cleans up. Do not keep forwarding the retired raw `curl | bash` pipeline. Its authenticated HTTP request has this structure:

```sh
curl -fsSL -H 'Authorization: Bearer <dedicated-download-key>' -o installer.sh 'https://genesis-private-installer.vercel.app/api/install'
# Review the complete download, then execute with bash. Actual shared command wraps these steps safely.
```

The command may be forwarded to Codex for review and installation. It must not contain the owner's GitHub token. Possession grants download access, so recipients can forward it. The service accepts requests only on `GENESIS_CANONICAL_HOST`, its stable production hostname; direct old deployment URLs return 404. Removing a hash and redeploying at that stable hostname revokes future downloads without leaving an old immutable URL usable. Already installed offline copies continue to work.

The installer currently supports macOS Apple Silicon. It validates the embedded package and pins the official Dream Skin 1.5.21 DMG checksum. It uses Codex's signed bundled Node runtime, leaves the `.app` untouched, and prepares a local external-engine adapter. First activation requires explicit consent for an unauthenticated loopback CDP listener and a normal Codex quit. A detached activation job then uses the official installer and launcher; it never force-quits a running task. If no interactive approval is available, it stops with a prepared path and a separate activation command for the agent to run after obtaining consent.

Validate production with all of these checks: no key / incorrect key -> 404; correct key -> installer with `no-store` and `noindex`; `/payload/install.sh`, `/api/install.mjs` and arbitrary paths -> 404; embedded archive checksum and shell syntax -> pass. Do not claim a clean-machine installation has been tested until it actually has.

## Verification — 2026-10-21, version 2.0.4

Production checks passed through an unauthenticated client: missing/wrong keys 404; authorized GET 200 with exact local payload bytes; authorized HEAD 200 with no body; POST, root, unknown paths, `/payload/install.sh`, and `/api/install.mjs` all 404 even with a valid key. The handler also validates the original request path because Vercel automatically maps function filenames. All 36 automated tests pass. The downloaded production script passes `bash -n` and its noninteractive prepare-only run on the existing macOS arm64 installation. A clean-machine first activation remains untested.

Recipients need network access to Vercel and GitHub. macOS Terminal curl may require `HTTPS_PROXY` when a system proxy is used; Codex should use the recipient's existing proxy configuration if a direct download times out. Never share a personal GitHub/Vercel access token to resolve network or download access.

## Installer audit — 2.0.5

The original short pipeline could report success when curl failed, and did not automatically honor the macOS system HTTPS proxy. The generated command now downloads before executing, uses the existing environment proxy or an enabled system HTTPS proxy, retries transient downloads, and preserves failures. The payload uses the same proxy handling for its pinned official dependency.

Foreground preflight validates the official Codex signature, signed bundled Node, initialized config, required engine files, version and reviewed renderer hash before asking for CDP/restart consent. Activation checks again after a normal quit, has a 30-minute wait limit, and records `activation-status.txt` beside its log. No approval is inferred when running under a noninteractive agent.

On macOS 15.6 arm64 with official Codex 26.1016.51333, a fresh isolated destination exercised the actual GitHub DMG download, pinned checksum, mount/extraction and repeat prepare; no HOME override was used. Offline tests on that unmodified engine validated/imported the actual three-file theme, verified payload integrity, and applied/restored the adapter byte-for-byte. The real installed renderer remained unchanged and no native UI activation was attempted. This is not a clean-machine native activation test. New regression tests also reject execution of partial/failed downloads, preserve explicit proxies, exclude stale build-stage members, and surface activation preflight failures. All 41 tests and production builds pass.

The launcher supports enabled HTTP(S) system proxies and existing curl proxy environment variables. PAC-only configurations, blocked endpoints, unsupported Codex builds, or a different installed Dream Skin version may still prevent installation; these are reported rather than bypassed. Minimum user prerequisites: official initialized Codex desktop on macOS Apple Silicon, network access to Vercel/GitHub, and explicit first-activation consent. No separate Node, npm, Git or developer toolchain is required by recipients.
