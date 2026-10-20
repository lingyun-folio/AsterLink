# 首次发布到 GitHub

## 常见开源仓库内容

| 内容 | 本项目位置 | 作用 |
| --- | --- | --- |
| 项目首页 | README.md、README.en.md | 用途、截图、安装、限制、许可 |
| 源码与依赖锁 | app/ | 可运行与可复现安装 |
| 许可证 | LICENSE | MIT 权利授予与保留声明 |
| 忽略和文本规则 | .gitignore、.gitattributes | 排除本地数据、统一文本换行 |
| 项目文档 | docs/ | 架构、路线、使用介绍和截图 |
| 贡献与安全 | CONTRIBUTING.md、SECURITY.md | 反馈、贡献、私密漏洞报告说明 |
| 协作模板 | .github/ | Issue、PR、自动检查 |
| 更新记录 | CHANGELOG.md | 公开版与历史本地版区分 |
| 资源来源 | THIRD_PARTY_NOTICES.md | 图片生成来源、依赖与品牌边界 |

不需要为了看起来完整而添加与项目无关的 Docker、服务端、空测试框架或赞助配置。

## 建议的仓库信息

- 仓库名：`AsterLink`
- 描述：`A character-based Windows desktop launcher for AI applications, built with Electron.`
- Topics：`electron`、`windows`、`desktop`、`launcher`、`ai-tools`、`javascript`
- 默认分支：`main`
- 公开源码许可证：MIT

这些是发布建议，尚未创建任何 GitHub 仓库。

## 上传前验证

在 `app/` 执行：

```powershell
npm ci
npm run check
npm run test:config
npm start
```

人工检查空阵容、选择真实程序、召唤和小窗切换。示例截图与配置测试不证明所有外部应用都能兼容。

## 方式一 使用已整理的上传文件夹

在项目根目录执行 `node scripts/export-source.cjs`，会生成 `.local/github-upload/AsterLink/`。它只复制公开源码、必要资源和文档，不包括本地归档、依赖或安装包。可将这个文件夹作为 GitHub Desktop 中的新本地仓库，再发布到自己的 GitHub 账户。

如果默认上传目录已经存在，可执行 `node scripts/export-source.cjs AsterLink-ready` 导出到一个新目录，保留旧副本。文件大小和 SHA-256 清单位于 `.local/github-upload/<目录名>-manifest.json`，可用于核对上传内容。导出会拒绝符号链接，并排除配置、凭据与构建产物。

建议使用 GitHub Desktop 或 Git 命令行；不要把项目根目录直接拖到网页上传，以免忽略规则未生效时带入私有文件。

## 方式二 从当前工作区提交

在当前项目根目录操作，先检查暂存内容再提交：

```powershell
git init -b main
git add .
git status --short
git diff --cached --stat
git commit -m "Initial public source release"
```

确认暂存中没有 `.local/`、`node_modules/`、`dist/`、用户配置和未知素材。在 GitHub 创建空仓库，不自动生成 README 或许可证，再使用新仓库页面给出的 remote 和 push 命令。本文没有填入虚构的账户或仓库地址。

## 首次 Release

1. 在 Windows 从公开源码 0.3.6 执行 `cd app`、`npm ci`、`npm run dist`。
2. 运行新构建，检查安装与便携版名称、图标、配置与启动行为。
3. 只为真正准备发布的提交打版本标签，例如 `v0.3.6`。
4. 在 GitHub Releases 上传 `AsterLink-0.3.6-setup.exe`、`AsterLink-0.3.6-portable.exe` 和校验值，并附更新说明。

**不要上传本地 0.3.5 安装包**：它们包含授权待确认的历史素材，不是公开源码版的发行产物。

在仓库设置中启用 Private vulnerability reporting。GitHub Actions 的 CI 文件已准备好，只有上传后才会在 GitHub 上执行；本地检查通过不能保证网络安装或托管 CI 一定成功。

## 官方资料

- [GitHub 仓库最佳实践](https://docs.github.com/en/repositories/creating-and-managing-repositories/best-practices-for-repositories)
- [README 说明](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [大文件与 Releases](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
- [移除敏感信息](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

