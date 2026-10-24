# GENESIS 安装与兼容性

## 当前交付状态

GENESIS 是双手 ASCII 动态背景及 Codex 风格界面预览。新增的 Codex Dream Skin 1.5.21 本地适配见 [DREAM-SKIN.md](DREAM-SKIN.md)，需要明确授权 CDP 并重启；它不是普通主题 ZIP 的能力。**官方动态皮肤 API 尚未确认；原生接入使用第三方 Dream Skin 本地适配。** 不要将 `manifest.json` 当作 Codex 插件格式导入。

截至 2026-10-21，核查的官方外观文档列出配色、背景色、前景色和字体主题设置，未说明执行自定义动画模块的安装方式：
https://learn.chatgpt.com/docs/reference/settings#appearance

网页模块与第三方适配分别交付：`dist/skin/` 用于自有网页，Dream Skin 接入使用 `dist/dream-skin/` 和单独的本地适配脚本。普通主题 ZIP 不执行 JavaScript，不能单独加载动画。

## 网页预览

要求 Node.js 22.12 或更新版本。在源代码目录运行：

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:5178/ 。界面中的消息仅在当前网页演示，不连接 Codex 任务服务。

生产构建：

```sh
npm run build
npm run preview
```

打开 http://127.0.0.1:5179/ 。`dist/` 可以发布到静态网站服务器；资源使用相对路径，可放在 GitHub Pages 子路径。

## 网页宿主适配模块

`dist/skin/genesis.js` 是无运行时依赖的 ES 模块。它供拥有自身 DOM 的网页或经验证的加载器适配，不能直接安装进原生 Codex。

```js
import {mountGenesis} from './skin/genesis.js';
const skin=mountGenesis({
  host:document.querySelector('#owned-background-slot'),
  composer:document.querySelector('#real-composer')
});
// 页面或组件卸载时，必须调用：
skin.destroy();
```

宿主应给背景槽设置 `position: relative`、确定的宽高和 `overflow: hidden`，并将实际聊天 UI 放在其上方。模块仅添加自己的 Canvas，不扫描聊天内容、不调用网络、不修改原生应用。可由宿主调用 `pause()` / `resume()`，模块本身不添加壁纸控件。

## 尚未验证的环境

适配目标为 macOS + Dream Skin 1.5.21。原生布局依据实际安装后的用户截图校正；2.0.1 已完成浏览器构图验收、离线完整性验证和安装文件更新，原生热更新显示验收需以加载器验证结果为准。未验证其他 Dream Skin 版本、Safari/Firefox、Windows 实机和低配设备性能。
