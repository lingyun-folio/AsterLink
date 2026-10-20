# 贡献指南

感谢你帮助改进星契。提交较大的功能改动前，请先开 Issue 说明使用场景与方案。

## 本地开发

使用 Windows 和 Node.js 22 或更新版本。在 `app/` 执行 `npm ci`、`npm start`。提交前执行 `npm run check` 与 `npm run test:config`，涉及界面时附截图并检查深浅主题、空阵容及多 Agent 场景。

## Issue 和 Pull Request

报告问题时附应用版本、Windows 版本、复现步骤、预期和实际行为。请隐藏用户名、完整个人路径、令牌及聊天内容。PR 说明改动目的、验证方法和已知限制；保持改动范围清晰。

只提交源码、必要资源与文档。不要提交 `node_modules`、构建产物、用户配置或本地归档。新增图片必须说明来源和可再分发许可；不要将网络搜索到的角色图直接加入仓库。

贡献代码采用本项目 MIT 许可。第三方资源应独立说明其许可，不因放入仓库而自动变成 MIT。

## English

Discuss substantial features in an issue first. Use Windows and Node.js 22+, run `npm ci` in `app/`, and run both `npm run check` and `npm run test:config` before submitting. Include reproduction steps or validation notes, remove personal data from reports, and document provenance and redistribution permissions for new assets. Do not commit dependencies, binaries, local archives, or user configuration. Code contributions use the project's MIT license.

