# ctfileparse

城通网盘直连解析器 — Vue 3 版，**无广告**、无 Google AdSense / 自定义推广位。

基于 [ctfileGet](https://github.com/qinlili23333/ctfileGet) 的核心解析逻辑，使用 Vue 3 + Vite 构建。

## 功能

- 本地解析（官方 API）
- **Altcha 人机验证**：城通 `423 / captcha_required` 时自动展示官方验证组件，通过后带 `altcha_token` 重试
- 链接 / Asaki 口令 / 小通口令 / URL 自动识别
- Token 登录、节点优选
- 复制链接、CDN 直连、页内保存、音视频在线播放
- 解析历史（与原项目共用 `localStorage` 键 `store`）

## URL 一键解析

```
http://localhost:5173/?file=8067059-687855402-65ca36&pass=547873715
```

## 开发

```bash
npm install
npm run dev
```

开发模式下 API 经 Vite 代理到 `webapi.ctfile.com`（见 `vite.config.js`）。

## 构建

```bash
npm run build
npm run preview
```

## GitHub Pages

仓库名需为 **`ctfileparse`**（若改名，请同步修改 `package.json` 里 `build:pages` / `preview:pages` 的 `BASE_PATH=/你的仓库名/`）。

1. 推送到 GitHub，在 **Settings → Pages → Build and deployment** 选 **GitHub Actions**
2. 推送 `main`/`master` 后由 `.github/workflows/deploy-pages.yml` 自动构建部署
3. 访问：`https://<用户名>.github.io/ctfileparse/`

本地模拟 Pages 路径：

```bash
npm run build:pages
npm run preview:pages
```

## 与原版的差异

- 移除广告、隐私弹窗中的广告相关逻辑、PWA/Service Worker 推广模块
- UI 用 Vue 组件化，历史页为独立路由 `/history`
- 保留与原站兼容的偏好存储键 `pref` 与历史键 `store`
