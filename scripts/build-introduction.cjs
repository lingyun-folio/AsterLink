const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../docs/project-introduction');
const img = (file, caption, small=false) => ({img:file, caption, small});
const zh = {
 lang:'zh-CN', file:'项目介绍-中文', title:'星契项目介绍', subtitle:'AsterLink · 角色化 AI 桌面启动器', intro:'把常用的 AI 应用化作可以召唤的伙伴，在一个桌面入口里完成选择、启动与切换。星契结合二次元角色大厅、召唤演出和常驻小窗，让日常使用多个 AI 工具的过程更直观，也更有陪伴感。',
 blocks:[
 {note:'项目快照：2026 年 10 月 20 日 · 源码版本 0.3.7 · 当前面向 Windows。公开源码版使用星契 / AsterLink 品牌，附带 MiMo、Lumi 角色与小灵狐图标；旧内部安装标识及配置目录保留以兼容升级。Windows x64 安装版和便携版可从 GitHub Releases 下载。'},
 img('../images/roster.png','图 1 角色大厅。一个角色可以绑定多个 Agent，并以不同卡片展示。'),
 {h:'01 项目定位与用途'},
 {p:'星契适合日常同时使用编程助手、通用对话工具和其他 AI 桌面应用的用户。它把分散的启动入口集中起来，让用户通过角色识别常用工具，查看进程状态，并在主界面收起后继续通过悬浮小窗访问已召唤的应用。'},
 {p:'典型场景是：先为 Codex、Claude 等本机程序登记路径，再把它们分配给喜欢的角色；工作时从大厅召唤目标程序，之后通过小窗快速返回。角色与 Agent 是可配置的映射关系，角色名称本身并不代表模型接入。'},
 {p:'当前产品承担的是本地应用启动与唤醒层。仓库中未见模型 API 调用、统一聊天界面、会话汇总或多 Agent 自动协作实现。CC Switch 按钮用于启动外部供应商切换工具，供应商管理由该工具承担。'},
 {h:'02 已实现的核心体验'},
 {list:[
 '角色大厅：展示角色图片、角色台词与运行状态（公开版附带 MiMo、Lumi 角色，不内置第三方徽标）；单击查看详情，双击进入召唤流程。大厅按角色与 Agent 的组合生成卡片，并根据窗口尺寸适配布局。',
 '连接配置：一个角色可以绑定多个 Agent，分别选择主页展示、召唤动画和台词池。首次使用时主页阵容为空，需要自行添加。',
 '程序注册：设置页集中维护 Agent 名称与本机路径，支持扫描候选应用和手动浏览文件，避免在每个角色上重复配置路径。',
 '桌面启动适配：区分普通 GUI 程序、控制台程序、快捷方式、协议链接和 WindowsApps 路径；实际兼容性仍取决于目标应用。',
 '运行状态：主进程约每 5 秒读取一次 Windows 进程列表，变化时推送到界面。这里的“运行中”表示进程存在，不表示模型服务可用或窗口处于前台。',
 '桌面驻留：托盘菜单支持快速召唤、主界面恢复和退出；已召唤小窗支持横排、竖排、固定位置与拖动。唤醒依赖目标应用对重复启动的处理。',
 '常驻与偏好：可对选定应用进行最小化预热，支持开机自启、深浅主题、动画时长和关闭至托盘等设置。最小化行为受目标程序影响。'
 ]},
 img('../images/connections.png','图 2 连接配置。角色与启动程序分开管理，支持一个角色绑定多个 Agent。'),
 {h:'03 技术栈'},
 {table:[['层次','技术与实现','承担的职责'],['桌面运行时','Electron ^33.0.0','主窗口、透明小窗、托盘、系统对话框、单实例与开机自启'],['界面','原生 HTML、CSS、JavaScript','角色大厅、配置表单、主题、动画和自适应布局；未使用 React 或 Vue'],['系统能力','Electron 内置 Node.js 与 CommonJS','fs、path、child_process；进程启动、文件配置及系统命令调用'],['进程通信','contextBridge 与 IPC','通过 preload 暴露有限接口；主窗口与小窗使用不同能力集合'],['Windows 集成','tasklist.exe、cmd.exe、Electron shell','进程枚举、控制台启动、快捷方式解析、协议和商店应用打开'],['本地持久化','userData/config.json','保存角色、Agent 和偏好；配置版本升级前备份旧文件'],['构建分发','npm、electron-builder ^26.15.3、NSIS','配置 Windows x64 安装版与便携版；本轮未执行构建'],['视觉资源','PNG 立绘、Agent 图标、多尺寸 ICO','角色展示、应用标识、系统托盘及安装图标']]},
 {p:'以上依赖范围来自 app/package.json，不等同于本机实际安装版本。当前实现以本地文件与进程管理为主，不要求单独部署业务后端或数据库；目标 AI 应用自身的网络、账户和模型服务需求由各应用决定。'},
 {h:'04 架构与数据流'},
 {code:'用户点击角色\n  → renderer.js 读取角色与 Agent 映射并播放演出\n  → preload.js 通过 IPC 发出启动请求\n  → main.js 使用系统能力启动或再次打开目标程序\n  → 记录已召唤项，更新托盘与 mini 小窗\n  → tasklist 轮询状态并推送到界面\n\n设置变更 → IPC → config-store.js → userData/config.json'},
 {p:'app/main.js 管理窗口、系统集成、启动和进程状态；app/renderer.js 管理角色数据、交互和演出；两套 preload 脚本连接界面与主进程；config-store.js 负责配置读写和迁移备份。mini.html、mini.css 与 mini.js 构成独立小窗。'},
 {p:'两个窗口均启用了 contextIsolation，并关闭 nodeIntegration。主界面不会直接获得完整 Node.js 能力，但 IPC 入参校验、内容安全策略和启动目标约束仍有进一步完善空间。'},
 img('../images/settings.png','图 3 设置页。统一管理 Agent 路径、常驻预热及界面偏好。'),
 {h:'05 上手流程'},
 {list:['在 app 目录安装依赖并执行 npm start。已有依赖时直接启动即可。浏览器打开 index.html 只能预览界面和演出。','在设置页登记目标程序，使用“选择”扫描候选项，或浏览本机文件指定路径。','进入连接配置，为角色勾选 Agent，并开启“添加到主页”。','返回角色大厅，单击查看详情，或双击召唤。召唤成功后主窗口退到后台，可使用小窗返回目标应用。','按需启用常驻预热、开机自启和小窗固定；常驻预热会启动被选中的第三方程序。']},
 img('../images/mini.png','图 4 已召唤小窗。左侧小灵狐返回主界面，其余图标访问已召唤的 Agent。',true),
 {h:'06 未来优化方向'},
 {p:'以下为根据当前代码提出的建议，其中品牌统一和发布资源分离已完成，其他建议尚未实现，也不代表已经承诺的发布计划。优先让启动可靠、等待可解释，再扩展个性化和自动化能力。'},
 {table:[['优先级','优化方向','具体改进与收益'],['P0','启动可靠性','统一去除路径首尾引号并验证目标；当前入口只做 trim。补充快捷方式参数解析、GUI / 控制台 / 商店应用兼容用例，让失败信息可定位。'],['P0','配置与权限边界','配置写入改为临时文件加原子替换，校验数据结构并明确反馈失败；备份失败应可见。强化 IPC 校验、启动目标约束和 CSP。'],['P1','启动等待体验','当前演出约在 4100 × animScale 毫秒后才提交启动请求。可提供“完整演出 / 快速召唤”，经确认后再评估演出与启动并行，分别衡量请求耗时和窗口可用耗时。'],['P1','状态与唤醒准确度','从仅匹配 exe 文件名逐步增加路径、PID 或适配器信息；区分启动中、运行中和失败。为协议与商店应用建立专门检测策略。'],['P1','品牌与工程整理','将新名称同步到界面、托盘、包元数据和文档；迁移时保留原 userData 配置。确认根目录 main.js 与 app/main.js 的维护关系，将截图脚本、历史图片与发布资源分离。'],['P1','回归与运行诊断','围绕空阵容、多 Agent、配置迁移、引用路径、多显示器拖动和启动失败建立回归流程；增加可导出的本地诊断日志。'],['P2','个性化与可达性','角色包导入导出、配置备份恢复、搜索与快捷键、减少动态效果、键盘焦点和小尺寸图标优化；后续新增角色素材须核实发布授权。'],['P2','应用适配与平台扩展','建立目标应用适配层和统一启动能力描述，再评估 macOS / Linux。跨平台需要替换 tasklist、cmd、快捷方式及 Windows 登录集成。'],['探索','工作流能力','可研究工作区分组、一键打开工具组合和最近使用；若未来加入模型调用与 Agent 编排，应另行设计凭据、任务状态及权限模型。']]},
 {h:'07 当前边界与资料依据'},
 {p:'截图由当前 Electron 页面实际渲染，使用 scripts/_intro-shot.cjs 和 scripts/_intro-mini.cjs 的演示数据隔离生成；其中路径、运行状态与阵容是示例，并非本机安装成功或真实启动性能的证明。截图使用公开版 MiMo、Lumi 角色和星契新名称，不包含历史第三方角色立绘或标识。'},
 {p:'本文以 app/package.json、main.js、renderer.js、preload.js、preload-mini.js、config-store.js、mini.js、styles.css 及 README 为依据，本文按当前代码描述。进程启动成功与目标应用完成就绪是不同状态；当前没有提供可复现的启动性能基准。'}
 ]};
const en = {
 lang:'en',file:'Project-Introduction-English',title:'AsterLink Project Overview',subtitle:'A character-based desktop launcher for AI companions',intro:'AsterLink turns frequently used AI applications into companions you can summon from a shared desktop hub. An anime character roster, summoning animations, and a compact floating launcher bring a more personal experience to opening and switching between AI tools.',
 blocks:[
 {note:'Project snapshot: October 20, 2026 · Source version 0.3.7 · Currently targets Windows. The public source edition uses AsterLink / 星契 branding, MiMo and Lumi characters, and a fox app icon. Legacy internal installation identifiers and the configuration path remain for upgrade compatibility. Windows x64 installer and portable editions are available from GitHub Releases.'},
 img('../images/roster.png','Figure 1. The character roster. One character can appear on multiple cards when assigned to different agents.'),
 {h:'01 Purpose and use cases'},
 {p:'AsterLink is designed for people who regularly use several AI desktop tools, such as coding assistants and general-purpose chat applications. It brings their launch points together, associates tools with recognizable characters, displays process status, and keeps summoned tools accessible after the main window is hidden.'},
 {p:'A typical workflow starts by registering local application paths for tools such as Codex and Claude, then assigning them to characters. The user summons a tool from the roster and later returns to it through the floating launcher. Characters are configurable launch mappings; a character name does not establish a model integration.'},
 {p:'The current product provides local application launching and reopening. The reviewed repository does not implement model API calls, a unified chat interface, conversation aggregation, or automated multi-agent orchestration. Its CC Switch button launches an external provider-switching utility; provider configuration belongs to that utility.'},
 {h:'02 Implemented experience'},
 {list:[
 'Character roster: character artwork, quotes, and process indicators (the public edition includes MiMo and Lumi and does not bundle third-party badges). A single click opens details; a double click starts the summoning flow. Cards represent character–agent pairs and resize with the window.',
 'Connection configuration: assign multiple agents to one character, select which characters appear on the home roster, and configure animation styles and quote pools. The initial home roster is empty until the user adds characters.',
 'Application registry: maintain agent names and local paths in one settings page. A candidate scanner and file picker help locate applications without repeating paths in every character configuration.',
 'Windows launch handling: separate paths cover GUI applications, console programs, shortcuts, protocol URLs, and WindowsApps targets. Compatibility still depends on each target application.',
 'Process status: the main process polls the Windows process list approximately every five seconds and pushes changes to the interface. “Running” means a matching process exists; it does not confirm service readiness or foreground visibility.',
 'Desktop presence: a tray menu provides quick launch, restore, and exit actions. The floating launcher supports horizontal and vertical layouts, dragging, and a position lock. Reopening behavior relies on how the target handles another launch request.',
 'Preferences and prewarming: selected applications can be launched in a minimized state in advance. Login startup, light and dark themes, animation duration, and close-to-tray behavior are configurable. Targets may ignore minimized startup.'
 ]},
 img('../images/connections.png','Figure 2. Connection settings separate character presentation from application registration and allow multiple agents per character.'),
 {h:'03 Technology stack'},
 {table:[['Layer','Technology and implementation','Responsibility'],['Desktop runtime','Electron ^33.0.0','Main window, transparent floating window, tray, dialogs, single-instance behavior, and login startup'],['Interface','Vanilla HTML, CSS, and JavaScript','Roster, forms, themes, animations, and responsive layout; no React or Vue framework'],['System layer','Electron’s Node.js runtime and CommonJS','fs, path, and child_process for configuration files, process launches, and system commands'],['Process communication','contextBridge and IPC','Limited preload APIs, with different capability sets for the main and floating windows'],['Windows integration','tasklist.exe, cmd.exe, and Electron shell','Process enumeration, console launch, shortcut resolution, protocols, and store application opening'],['Persistence','userData/config.json','Characters, agent registry, and preferences; backup before configuration schema upgrades'],['Build and distribution','npm, electron-builder ^26.15.3, and NSIS','Configured Windows x64 installer and portable outputs; no build executed for this report'],['Visual assets','PNG artwork, agent icons, and a multi-size ICO','Character presentation, app identity, system tray, and installer icons']]},
 {p:'Dependency ranges above come from app/package.json and are not a statement of the exact installed versions. The launcher centers on local files and process management, without requiring a separate application backend or database. Network access, accounts, and model services used by launched tools remain those tools’ responsibility.'},
 {h:'04 Architecture and data flow'},
 {code:'User selects a character\n  → renderer.js resolves its agent mapping and plays the animation\n  → preload.js sends a launch request through IPC\n  → main.js launches or reopens the target using Windows facilities\n  → summoned entries update the tray and floating launcher\n  → tasklist polling pushes process status back to the interface\n\nSettings change → IPC → config-store.js → userData/config.json'},
 {p:'app/main.js owns windows, system integration, launching, and process status. app/renderer.js owns character presentation, interaction, and summoning effects. The two preload scripts bridge their respective windows to the main process. config-store.js reads and writes configuration and backs up older schemas. mini.html, mini.css, and mini.js implement the floating launcher.'},
 {p:'Both windows enable contextIsolation and disable nodeIntegration. The interface therefore does not receive unrestricted Node.js access. IPC payload validation, content security policy, and launch-target constraints remain areas for improvement.'},
 img('../images/settings.png','Figure 3. Settings centralize agent paths, resident prewarming, and interface preferences.'),
 {h:'05 Getting started'},
 {list:['Install dependencies in the app directory and run npm start. If dependencies are already installed, start the application directly. Opening index.html in a browser provides a visual demonstration only.','Register each target application in Settings. Use the candidate selector or browse for a local executable.','Open Connection Settings, assign agents to characters, and enable their home-roster visibility.','Return to the roster to inspect or summon a character. After a successful summon, the main window hides and the floating launcher provides access to summoned tools.','Enable resident prewarming, login startup, or the floating-window position lock as needed. Prewarming starts the selected third-party applications.']},
 img('../images/mini.png','Figure 4. The floating launcher. The fox restores the hub; the remaining icons reopen summoned agents.',true),
 {h:'06 Future optimization directions'},
 {p:'The following are proposals based on the current implementation, not a committed release schedule; brand alignment and release-asset separation are now complete. Reliable launching and understandable waiting states should precede broader customization and automation.'},
 {table:[['Priority','Direction','Proposed change and benefit'],['P0','Launch reliability','Normalize surrounding quotes and validate targets; the current entry point only trims whitespace. Improve shortcut argument parsing and cover GUI, console, and store-app cases with actionable errors.'],['P0','Configuration and trust boundaries','Use temporary files and atomic replacement for configuration, validate its structure, and surface save and backup failures. Strengthen IPC validation, launch-target constraints, and CSP.'],['P1','Waiting experience','The current animation submits the launch request after roughly 4100 × animScale milliseconds. Offer full-animation and quick-launch modes; evaluate concurrent animation and launching after a product decision. Measure request dispatch separately from target readiness.'],['P1','Status and wake accuracy','Supplement executable-name matching with paths, PIDs, or application adapters. Distinguish starting, running, and failed states, with dedicated detection strategies for protocols and store apps.'],['P1','Brand and repository consistency','Apply AsterLink across UI, tray, package metadata, and documentation while preserving existing userData during migration. Clarify the maintenance relationship between root main.js and app/main.js; separate capture scripts, historical images, and release assets.'],['P1','Regression coverage and diagnostics','Cover empty rosters, multiple agents, configuration migration, quoted paths, multi-monitor dragging, and launch failures. Add exportable local diagnostic logs.'],['P2','Customization and accessibility','Consider character-pack import/export, configuration backup and restore, search, keyboard shortcuts, reduced motion, focus navigation, and smaller icon variants. Verify artwork and trademark permissions before distribution.'],['P2','Adapters and additional platforms','Define an application adapter layer and launch-capability model before evaluating macOS or Linux. Cross-platform support requires replacements for tasklist, cmd, Windows shortcuts, and login integration.'],['Explore','Workflow features','Investigate workspace groups, opening tool sets, and recent items. Future model calls or agent orchestration would need separate credential, task-state, and permission designs.']]},
 {h:'07 Scope and evidence'},
 {p:'Screenshots were freshly rendered from the current Electron pages with isolated demonstration data from scripts/_intro-shot.cjs and scripts/_intro-mini.cjs. Paths, process states, and roster contents are examples, not proof of installed applications or measured launch performance. Screenshots use the public edition’s MiMo and Lumi artwork and updated brand; historical third-party illustrations and logos are not included.'},
 {p:'This overview is based on app/package.json, main.js, renderer.js, preload.js, preload-mini.js, config-store.js, mini.js, styles.css, and README. Descriptions follow the current source. Successful process creation and full target readiness are different states, and no reproducible launch-performance benchmark is provided.'}
 ]};
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const dataImage = file => 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
const css = `*{box-sizing:border-box}body{margin:0;background:#f6f5ef;color:#283b36;font:16px/1.85 'Segoe UI','Microsoft YaHei',sans-serif}main{max-width:1060px;margin:48px auto;background:#fffefa;padding:64px 76px;border:1px solid #e2e6dc;border-radius:24px}header{display:flex;gap:28px;align-items:center;margin-bottom:30px}header img{width:106px;height:106px;object-fit:contain}h1{font-size:36px;line-height:1.25;margin:0 0 12px;letter-spacing:-.025em}header p{margin:0;color:#6a8073;font-size:17px}.lead{font-size:19px;line-height:1.9}.note{background:#eef3e8;border-left:4px solid #a2b69c;padding:18px 22px;border-radius:0 10px 10px 0;font-size:14px;color:#53614f}h2{font-size:24px;margin:46px 0 18px;line-height:1.4;color:#304e41}p{margin:16px 0}li{margin:12px 0}ul{padding-left:24px}figure{margin:30px 0}figure img{display:block;width:100%;border-radius:12px;border:1px solid #dde3da}figure.small{padding:24px;background:#eef1e9;border-radius:12px}figure.small img{width:350px;max-width:100%;margin:0 auto;border:0;border-radius:0}figcaption{font-size:13px;line-height:1.65;color:#718073;margin-top:12px}table{border-collapse:collapse;width:100%;font-size:14px;line-height:1.65;margin:22px 0}th,td{padding:13px 14px;text-align:left;border-bottom:1px solid #e0e5da;vertical-align:top}th{background:#eaf0e4;color:#334d3b;font-weight:600}td:first-child{width:15%;font-weight:600}td:nth-child(2){width:29%}tr:nth-child(even) td{background:#fafbf6}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#eff2e9;border-radius:12px;padding:24px;font:14px/1.85 Consolas,'Microsoft YaHei',monospace}footer{margin-top:45px;padding-top:20px;border-top:1px solid #dfe5d9;color:#7c897b;font-size:12px}@media(max-width:760px){main{margin:0;border:0;border-radius:0;padding:32px 22px}header{gap:16px}header img{width:72px;height:72px}h1{font-size:28px}table{font-size:12px}th,td{padding:9px 7px}}@media print{body{background:white}main{margin:0;padding:0;border:0;max-width:none}h2{break-after:avoid}figure,pre,tr{break-inside:avoid}figure img{max-height:390px;object-fit:contain}header img{width:80px;height:80px}body{font-size:11pt}table{font-size:9pt}@page{size:A4;margin:18mm}}`;
for(const doc of [zh,en]){
 let md=`# ${doc.title}\n\n${doc.subtitle}\n\n${doc.intro}\n\n`;
 let html='';
 for(const b of doc.blocks){
  if(b.note){md+=`> ${b.note}\n\n`;html+=`<aside class="note">${esc(b.note)}</aside>`;}
  if(b.h){md+=`## ${b.h}\n\n`;html+=`<h2>${esc(b.h)}</h2>`;}
  if(b.p){md+=b.p+'\n\n';html+=`<p>${esc(b.p)}</p>`;}
  if(b.list){md+=b.list.map(x=>'- '+x).join('\n\n')+'\n\n';html+='<ul>'+b.list.map(x=>`<li>${esc(x)}</li>`).join('')+'</ul>';}
  if(b.code){md+='```text\n'+b.code+'\n```\n\n';html+='<pre>'+esc(b.code)+'</pre>';}
  if(b.table){md+=b.table.map((r,i)=>'| '+r.join(' | ')+' |'+(i===0?'\n| '+r.map(()=>'---').join(' | ')+' |':'')).join('\n')+'\n\n';html+='<table><thead><tr>'+b.table[0].map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+b.table.slice(1).map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';}
  if(b.img){md+=`![${b.caption}](${b.img})\n\n`;html+=`<figure${b.small?' class="small"':''}><img src="${dataImage(path.join(dir,b.img))}" alt="${esc(b.caption)}"><figcaption>${esc(b.caption)}</figcaption></figure>`;}
 }
 const icon=dataImage(path.join(dir,'../../app/icons/app-1024.png'));
 fs.writeFileSync(path.join(dir,doc.file+'.md'),md);
 fs.writeFileSync(path.join(dir,doc.file+'.html'),`<!doctype html><html lang="${doc.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${doc.title}</title><style>${css}</style></head><body><main><header><img src="${icon}" alt="AsterLink fox mascot"><div><h1>${doc.title}</h1><p>${doc.subtitle}</p></div></header><p class="lead">${doc.intro}</p>${html}<footer>AsterLink · Project overview · 2026-10-20 · Source snapshot 0.3.7</footer></main></body></html>`);
 console.log(doc.file,doc.blocks.filter(b=>b.img).length+' figures');
}
