<p align="center"><img src="app/icons/app-1024.png" width="112" alt="星契小灵狐"></p>

# 星契 AsterLink

把常用的 AI 应用，变成随时可以召唤的桌面伙伴。

[English](README.en.md) · [项目介绍](docs/project-introduction/项目介绍-中文.md) · [开发路线](docs/ROADMAP.md) · [发布指南](docs/PUBLISHING.md)

**Windows 桌面 AI 应用启动器**，基于 Electron 和原生 JavaScript。通过角色大厅启动本机应用，配合召唤动画、运行状态和悬浮小窗，让多个 AI 工具的日常切换更直观。

**适合喜欢原生 Agent 应用操作习惯、希望继续直接使用各家桌面客户端，又不想额外折腾 Agent Server 配置的用户。** 登记已安装程序的路径即可使用，保留原生应用自己的界面、账户和工作流程。

![角色大厅](docs/images/roster.png)

> 默认角色使用 DeepSeek、MiMo 立绘，其他角色使用神秘剪影占位形象；DeepSeek 素材采用独立的 CC BY-NC-SA 4.0 许可，署名及来源见 [形象说明](docs/ARTWORK.md)。截图使用演示配置与模拟状态，不代表已接入对应模型服务。

> 因版权与授权范围限制，项目未完整提供全部 AI 娘形象。需要其他 AI 娘形象的用户，可前往 B 站作者 [ZipZipPipe](https://space.bilibili.com/4168597) 处自行获取，并遵守作者对具体素材的使用说明与许可要求。

## 能做什么

- **角色大厅**：单击查看详情，双击召唤；一个角色可绑定多个应用。
- **自定义形象**：导入透明 PNG，新增伙伴或替换内置立绘；可修改名称、主题色，并绑定 Agent。
- **连接配置**：管理主页阵容、Agent 映射、台词和动画。
- **程序注册**：扫描候选应用，或选择本机可执行文件与快捷方式。
- **应用图标**：可在设置中为每个 Agent 自选 PNG 图标，大厅与小窗同步使用；未设置时尝试本机读取，失败则显示首字母。
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

## 自定义立绘

在「连接配置 → 新增形象」中选择透明 PNG。文件不超过 **10 MB**，宽、高均为 **256–4096 像素**；推荐约 **800 × 1600** 的居中全身立绘。白底和棋盘格截图不属于透明背景，应用不会自动抠图。

导入时会自动推荐光晕主色，支持手动调色；更换图片时保留已选的手动颜色，也可以一键使用新推荐色。保存后可在大厅使用，并在连接配置中勾选 Agent。图片会复制到本机应用数据目录，移动原文件不会影响已导入形象。完整步骤见 [自定义形象说明](docs/CUSTOM_CHARACTERS.md)。

## 本次更新 · 0.3.9

- Agent 支持自定义 PNG 图标，大厅与小窗同步，重启保留。
- 自定义立绘可推荐主题色；小窗按启动目标合并重复入口。
- 默认使用 DeepSeek、MiMo 立绘，其余角色使用 mystery。
- 修复 Windows 开机自启开关的状态回读，以及安装产物权限标签引起的安装问题。
- 更新浅色主题界面截图。完整记录见 [CHANGELOG](CHANGELOG.md)。

![浅色主题设置与 Agent 图标](docs/images/settings.png)

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
npm run test:art
npm run test:icons
npm run test:login
npm run dist
```

产物默认输出到工作区旁的 `AsterLink-build/` 普通目录。当前未配置代码签名证书。

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

