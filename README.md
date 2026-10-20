<p align="center"><img src="app/icons/app-1024.png" width="112" alt="星契小灵狐"></p>

# 星契 AsterLink

把常用的 AI 应用，变成随时可以召唤的桌面伙伴。

[English](README.en.md) · [项目介绍](docs/project-introduction/项目介绍-中文.md) · [开发路线](docs/ROADMAP.md) · [发布指南](docs/PUBLISHING.md)

**Windows 桌面 AI 应用启动器**，基于 Electron 和原生 JavaScript。通过角色大厅启动本机应用，配合召唤动画、运行状态和悬浮小窗，让多个 AI 工具的日常切换更直观。

![角色大厅](docs/images/roster.png)

> 公开源码版 0.3.6 附带 AI 辅助制作的 MiMo、Lumi 角色及小灵狐图标，不附带授权未确认的第三方角色立绘或品牌图标。截图使用演示配置与模拟状态，不代表已接入对应模型服务。

## 能做什么

- **角色大厅**：单击查看详情，双击召唤；一个角色可绑定多个应用。
- **连接配置**：管理主页阵容、Agent 映射、台词和动画。
- **程序注册**：扫描候选应用，或选择本机可执行文件与快捷方式。
- **运行状态**：约每 5 秒检查一次进程，展示已运行的应用。
- **悬浮小窗**：横排或竖排访问已召唤应用，支持拖动和固定。
- **桌面常驻**：托盘、登录自启、常驻预热、深浅主题和动画时长。

星契管理的是本机应用的启动与重新打开。当前不包含统一聊天、模型 API 接入或多 Agent 自动编排；使用目标工具仍需自行安装并完成账户配置。CC Switch 是可选外部工具，未随项目分发。

## 安装

从 [GitHub Releases](https://github.com/lingyun-folio/AsterLink/releases/latest) 下载 Windows x64 安装版或便携版。

## 快速开始

开发环境：Windows 10/11、Node.js 22 或更新版本、npm。

```powershell
cd app
npm ci
npm start
```

1. 在“设置”中为 Agent 选择实际程序路径；默认路径为空。
2. 在“连接配置”中勾选 Agent，开启“添加到主页”。
3. 返回大厅双击角色召唤。首次打开时主页为空，这是正常状态。

无需模型 API Key 即可运行启动器。第三方应用的网络、模型和登录需求由各应用决定。直接用浏览器打开 `app/index.html` 只能预览界面，不能启动本机程序。

![连接配置](docs/images/connections.png)

## 技术栈

| 层次 | 技术 |
| --- | --- |
| 桌面运行时 | Electron 33 |
| 界面 | HTML、CSS、原生 JavaScript |
| 系统能力 | Node.js、child_process、Electron shell |
| 通信 | contextBridge、IPC；启用 contextIsolation，关闭 nodeIntegration |
| 持久化 | 本地 JSON 配置、版本迁移备份 |
| Windows 集成 | tasklist、控制台启动、快捷方式、托盘、开机自启 |
| 打包 | electron-builder、NSIS、Windows x64 安装版和便携版 |

## 开发与构建

以下命令均在 `app/` 目录执行：

```powershell
npm run check
npm run test:config
npm run dist
```

产物输出到 `app/dist/`。当前未配置代码签名证书。

项目附带 Windows CI，检查源码与资源引用、运行配置持久化测试。它不等同于完整的图形界面和第三方应用兼容性测试。

## 目录结构

```text
.github/       CI、Issue 模板、PR 模板
app/           Electron 应用源码、运行资源和依赖锁文件
docs/          截图、架构、路线与发布说明
scripts/       源码检查、配置测试、截图与文档生成
LICENSE        MIT 许可证
README.en.md   English documentation
```

## 已知边界

- 当前系统集成面向 Windows，尚未支持 macOS / Linux。
- “运行中”只代表匹配到进程，不保证窗口可见或模型服务就绪。
- 唤醒依赖目标应用的单实例行为；部分应用可能打开新窗口。
- 当前完整演出在约 `4100 × animScale` 毫秒后才提交启动请求。
- 路径首尾引号、快捷方式参数解析和保存失败反馈仍待完善。

## 参与与许可

欢迎通过 Issue 反馈复现步骤或讨论改进方向，提交 PR 前请阅读 [贡献指南](CONTRIBUTING.md)。安全问题见 [SECURITY.md](SECURITY.md)。

代码与本仓库自有文档采用 [MIT](LICENSE)。角色和图标的生成来源及授权范围见 [形象说明](docs/ARTWORK.md) 与 [资源说明](THIRD_PARTY_NOTICES.md)。第三方软件名称仅用于标识可配置的目标应用，本项目不代表相关厂商，也不包含其软件。依赖组件各自保留其许可证。

