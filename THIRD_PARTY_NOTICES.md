# 资源与第三方说明

## 本仓库包含的视觉资源

`app/icons/app-1024.png`、`app/icons/app.png`、`app/icons/app.ico`、`app/icons/app.svg`、`app/icons/tray.png` 和 `app/art/companion.png` 均来自使用 OpenAI image_gen 生成的“抱星星的小灵狐”，或其缩放与格式转换。它们不是第三方厂商的官方标识。本项目维护者将这些随仓库分发的资源按 MIT 许可提供，不作独占性声明。

`docs/images/` 中的截图使用本发行版附带的角色和图标，以演示配置展示应用界面。

`app/art/MiMo.png` 为维护者使用豆包与 GPT 辅助制作的角色；`app/art/lumi.png` 为本项目使用 OpenAI image_gen 生成的独立角色。具体来源和授权范围见 [角色形象与授权说明](docs/ARTWORK.md)；这些形象并非第三方厂商官方角色。

本发行版仅包含本文来源说明覆盖的角色、图标及截图。

## 第三方名称与依赖

Codex、Claude、DeepSeek Harness、WorkBuddy 等文字名称用于说明可配置的应用或演示配置，不表示授权、合作或官方关联。第三方软件及模型服务不随本仓库分发。

Electron、electron-builder 及其间接依赖各自适用原有许可证。发布应用时保留构建工具生成的 Electron 和 Chromium 许可文件。依赖信息由 `app/package-lock.json` 固定，不把依赖统一重许可为 MIT。

