# GENESIS · ASCII touch-and-scatter background

A Codex-style new-chat mockup with oversized hands in the diagonal composition supplied by the user. The wallpaper adds no controls or branding to the native chat shell.

```sh
npm ci
npm run dev
```

Preview: http://127.0.0.1:5178/

```sh
npm test
npm run build
```

The automatic loop is 17 seconds: 1.8s emerge at the starting positions, 8s slow approach, 2.2s outward ASCII scatter and fade, then exactly 5s of darkness. At near-contact every visible canvas glyph, including the stars, becomes a pooled ballistic character. The chat UI remains sharp and stationary. Hands and stars return from darkness at their original positions.

The current reference explicitly restores the large hands/edge-entering forearms. Elbows and upper arms are not rendered. Forearms continue beyond the viewport with a blended open extension, so their cut ends never enter the intact-hand animation. Glyphs behind the composer are locally blurred. Normal startup ignores retired pause settings and does not freeze. OS reduced motion shows a still hand composition.

The composer demonstrates local interactions and does not execute real Codex tasks. `artifacts/cycle-review.html?t=10.3` is a local visual-QA harness excluded from the production entry; normal `/` always runs live.

GENESIS 的网页背景模块位于构建产物 `dist/skin/`。**这不是可直接安装进原生 Codex 的皮肤包**：官方动态背景导入 API 尚未确认；第三方 Dream Skin 适配另行交付。安装状态、模块接入方法和未验证环境见 [安装说明](docs/INSTALLATION.md)，性能边界见 [发布审查](docs/RELEASE-AUDIT.md)。

依赖由 `package-lock.json` 锁定，Node.js 最低版本为 22.12。GitHub Actions 会在独立环境执行类型检查、测试与构建。

手部数据来自用户提供的视觉参考；其公开传播授权尚未确认。未经权利人确认，不应将该素材作为开放授权素材再发布。项目不代表 OpenAI 官方产品或官方皮肤。架构研究参考 [stackedlol/ascii-sharks](https://github.com/stackedlol/ascii-sharks)；保留的 `src/ocean/` 是早期研究实现，不参与当前手部背景构建。

已新增面向 Codex Dream Skin 1.5.21 的本地动画适配，接入边界、重启要求与恢复方式见 [Dream Skin 适配](docs/DREAM-SKIN.md)。

私密分享的下载服务、密钥撤销和接收端安装流程见 [分发说明](docs/DISTRIBUTION.md)。仅当前通过验收的 macOS Apple Silicon + Dream Skin 1.5.21 组合会启用安装。

## 2.0.6 重新打开时保留皮肤

首次启用会创建 `~/Applications/Genesis.app`。将它拖到 Dock，以后退出 Codex 后点击 Genesis，直接通过皮肤启动流程打开。原 Codex 入口保留，用于普通模式。没有新增常驻监控，也不会强制关闭已打开的应用；若普通 Codex 已打开，请先保存任务并正常退出，再点击 Genesis。

## 2.0.7 图标与安装提示

安装包内置暗色 ASCII Codex 图标，圆角外侧为透明背景。启用前会提示新增 Genesis 图标；启用时创建应用并再次提示拖入 Dock。官方 Codex 图标仍启动普通模式。
