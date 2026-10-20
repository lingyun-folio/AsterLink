# 构建与发布

源码仓库：[lingyun-folio/AsterLink](https://github.com/lingyun-folio/AsterLink)

正式下载：[GitHub Releases](https://github.com/lingyun-folio/AsterLink/releases/latest)

## 本地构建

使用 Windows x64、Node.js 22 或更新版本与 npm，在 `app/` 执行：

```powershell
npm ci
npm run check
npm run test:config
npm run dist -- --publish never
```

默认输出目录为 `app/dist/`，包含安装版和便携版。若构建工具无法执行辅助程序，可通过 `--config.directories.output=C:/Temp/AsterLink-dist` 指定较短的英文输出路径。

## 发布版本

验证构建产物及配置迁移后，为对应提交创建版本标签。在 GitHub Releases 附上安装版、便携版、SHA-256 校验文件及更新说明。发布应用时保留 Electron 与 Chromium 的许可文件。当前未配置代码签名证书。
