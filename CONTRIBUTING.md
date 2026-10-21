# 贡献指南

感谢你帮助改进星契。提交较大的功能改动前，请先开 Issue 说明使用场景与方案。

## 本地开发

使用 Windows 和 Node.js 22 或更新版本。在 `app/` 执行 `npm ci`、`npm start`。提交前执行 `npm run check`、`npm run test:config` 与 `npm run test:art`，涉及界面时附截图并检查深浅主题、空阵容及多 Agent 场景。

## Issue 和 Pull Request

报告问题时附应用版本、Windows 版本、复现步骤、预期和实际行为。请隐藏用户名、完整个人路径、令牌及聊天内容。PR 说明改动目的、验证方法和已知限制；保持改动范围清晰。

只提交源码、必要资源与文档。不要提交 `node_modules`、构建产物、用户配置或本地归档。新增图片必须说明来源和可再分发许可；不要将网络搜索到的角色图直接加入仓库。

贡献代码采用本项目 MIT 许可。第三方资源应独立说明其许可，不因放入仓库而自动变成 MIT。

## English

Discuss substantial features in an issue first. Use Windows and Node.js 22+, run `npm ci` in `app/`, and run `npm run check`, `npm run test:config`, and `npm run test:art` before submitting. Include reproduction steps or validation notes, remove personal data from reports, and document provenance and redistribution permissions for new assets. Do not commit dependencies, binaries, local archives, or user configuration. Code contributions use the project's MIT license.


## Windows 安装包构建

沿用标准 electron-builder / NSIS，在 `app/` 执行 `npm run dist`。默认输出到工作区旁的 `AsterLink-build/` 普通目录，避免新文件继承工作区的低完整性标签。需要放回工作区时，同一磁盘内使用移动保留文件安全属性，不要重新创建或覆盖成继承低完整性的新文件。产物应以普通用户的中完整性运行；发布前检查完整性标签，并验证覆盖安装时能关闭托盘中的旧进程。不要额外封装安装器，也不要通过关闭系统防护处理安装错误。
