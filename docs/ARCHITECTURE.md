# 架构说明

## 主要文件

| 文件 | 职责 |
| --- | --- |
| app/main.js | 窗口、托盘、启动目标、进程轮询、小窗与 Windows 集成 |
| app/renderer.js | 默认角色、Agent 注册、配置表单、角色布局与召唤演出 |
| app/preload.js | 主界面的有限 IPC 接口 |
| app/preload-mini.js | 小窗的有限 IPC 接口 |
| app/config-store.js | userData 配置读写与旧版本备份 |
| app/mini.js | 小窗渲染、点击与拖动 |
| app/styles.css | 双主题、布局和动画 |

## 启动流程

角色与 Agent 名称映射 → 根据注册表解析路径 → 召唤演出 → preload IPC → 主进程启动目标 → 更新已召唤集合与进程状态。

GUI 程序通过独立进程启动；控制台程序通过 Windows 控制台打开；快捷方式、协议和 WindowsApps 路径分别适配。进程检测使用 tasklist，约每 5 秒一次。

## 配置兼容

沿用 `%APPDATA%/星灵枢纽 AetherLink/config.json` 和内部 appId `com.lingy.aetherlink`，保持旧版配置与安装升级连续性。旧配置中的缺失立绘回退到 `art/companion.png`，不向仓库加入用户配置。

## 资源

公开版仅附小灵狐默认形象。自定义角色资源须自行验证可再分发权限；小窗无 Agent 图标时使用首字母，不依赖第三方品牌图标。


## 自定义立绘

`character-art.js` 验证 PNG 文件、尺寸和透明像素，将图片复制到应用数据目录并返回本地文件 URL；通过专用 IPC 和 preload 提供给形象编辑器。角色名称、主题色、图片 URL、主页状态与 Agent 绑定使用现有配置持久化。
