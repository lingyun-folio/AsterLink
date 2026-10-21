/* 星契 · AsterLink — 主进程 */
const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execFile } = require('child_process');
const store = require('./config-store');
const { createLoginItems } = require('./login-items');
const { importArtwork } = require('./character-art');
const { dedupeMiniItems } = require('./mini-targets');
const { createIconReader, findPackagedIcon } = require('./agent-icons');
const { importAgentIcon, readAgentIcon: readCustomAgentIcon } = require('./custom-agent-icons');
const readAgentIcon = createIconReader(async (file, options) => {
  const packagedIcon = await findPackagedIcon(file);
  if (packagedIcon) {
    const image = nativeImage.createFromPath(packagedIcon);
    if (!image.isEmpty()) return image;
  }
  return app.getFileIcon(file, options);
});
let agentIcons = {};
let iconRequest = 0;

async function refreshAgentIcons(cfg) {
  const request = ++iconRequest;
  const icons = Object.fromEntries(await Promise.all((cfg?.agents || []).filter(a => a?.name).map(async a => [a.name, readCustomAgentIcon(a.customIcon, app.getPath('userData')) || await readAgentIcon(a.path)])));
  if (request !== iconRequest) return agentIcons;
  if (JSON.stringify(icons) !== JSON.stringify(agentIcons)) {
    agentIcons = icons;
    broadcast('agents:icons', icons);
    pushMiniData();
  }
  return agentIcons;
}

// 延用旧配置目录与安装标识，品牌升级后保留阵容、路径和单实例行为。
app.setName('星契 AsterLink');
app.setPath('userData', path.join(app.getPath('appData'), '星灵枢纽 AetherLink'));
app.setAppUserModelId('com.lingy.aetherlink');

const START_HIDDEN_ARG = '--hidden';
const startHidden = process.argv.includes(START_HIDDEN_ARG);
const loginItems = createLoginItems(app);

let win = null;
let tray = null;
let isQuitting = false;
let closeToTray = true;

/* ===== 真实启动 Agent =====
   协议地址（如 your-app://new）交给系统打开；
   快捷方式（.lnk）先解析成目标程序；
   商店（MSIX，WindowsApps 下）应用缺包身份不能直接 spawn，走 ShellExecute（同双击）；
   控制台程序（PE 子系统 3=CUI，如 claude.exe）必须开可见终端窗口才能跑 TUI，
   否则 detached+windowsHide 静默拉起等于隐形——经 cmd 的 start 开新控制台再跑；
   其余 GUI 程序按可执行文件直接拉起（不经 shell，参数数组传递，避免注入）。 */
function isConsoleExe(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(1024);
    fs.readSync(fd, buf, 0, 1024, 0);
    fs.closeSync(fd);
    if (buf.readUInt16LE(0) !== 0x5A4D) return false;              // 非 MZ
    const lfanew = buf.readUInt32LE(0x3C);
    if (lfanew < 0x40 || lfanew + 94 > buf.length) return false;
    if (buf.readUInt32LE(lfanew) !== 0x00004550) return false;     // 非 PE\0\0
    return buf.readUInt16LE(lfanew + 92) === 3;                    // Subsystem: 3=CUI 2=GUI
  } catch (_) { return false; }
}

function spawnDetached(cmd, argv) {
  return new Promise(resolve => {
    let settled = false;
    const done = r => { if (!settled) { settled = true; resolve(r); } };
    try {
      const child = spawn(cmd, argv, { detached: true, stdio: 'ignore', windowsHide: true });
      child.once('error', err => done({ ok: false, error: String(err.message || err) }));
      child.once('spawn', () => {
        child.unref();
        done({ ok: true });
      });
    } catch (err) {
      done({ ok: false, error: String(err.message || err) });
    }
  });
}

function launchAgent(target, args, opts) {
  target = String(target || '').trim();
  args = Array.isArray(args) ? args.map(String) : [];
  const minimized = !!(opts && opts.minimized); // 常驻预热：尽量以最小化方式拉起，不抢焦点
  if (!target) return Promise.resolve({ ok: false, error: '启动路径为空，请在连接配置中填写' });

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(target)) {
    return shell.openExternal(target)
      .then(() => ({ ok: true }))
      .catch(err => ({ ok: false, error: String(err.message || err) }));
  }

  if (/\.lnk$/i.test(target)) {
    try {
      const d = shell.readShortcutLink(target);
      if (d && d.target) {
        target = d.target;
        args = [...String(d.args || '').trim().split(/\s+/).filter(Boolean), ...args];
      }
    } catch (_) { /* 解析失败就按原路径启动，让错误提示可见 */ }
  }

  // 商店（MSIX）应用：直接 spawn 缺包身份会静默失败——走 ShellExecute，与双击一致
  if (/\\WindowsApps\\/i.test(target)) {
    if (args.length) {
      return Promise.resolve({ ok: false, error: '商店应用暂不支持启动参数，请清空启动参数后再试' });
    }
    return shell.openPath(target)
      .then(err => (err ? { ok: false, error: String(err) } : { ok: true }))
      .catch(err => ({ ok: false, error: String(err.message || err) }));
  }

  if (isConsoleExe(target)) {
    if (!fs.existsSync(target)) {
      return Promise.resolve({ ok: false, error: `启动路径不存在：${target}` });
    }
    // start 的第一个引号参数是窗口标题，传空串占位；中间 cmd 隐藏，目标开新控制台
    return spawnDetached('cmd.exe', ['/c', 'start', ...(minimized ? ['/min'] : []), '', target, ...args]);
  }

  // 常驻预热走 start /min：GUI 程序也会以最小化状态开局，尽量不打断用户
  if (minimized) return spawnDetached('cmd.exe', ['/c', 'start', '/min', '', target, ...args]);

  return spawnDetached(target, args);
}

/* ===== 常驻预热 =====
   打开第三方应用慢，慢在目标自己的冷启动（Chromium/Node 初始化、登录态校验），
   启动器无法加速它，只能「避免冷启动」：标了常驻的 agent 在星契启动时先拉起一次，
   之后召唤就是唤醒已有实例（单实例应用几百毫秒返回），省掉 1–3 秒等待。
   逐个错开启动，避免同时抢磁盘和 CPU；同一次运行内不重复预热同一路径。 */
const PREWARM_GAP = 1200;
const warmedPaths = new Set();

function residentAgents(cfg) {
  const agents = (cfg && Array.isArray(cfg.agents)) ? cfg.agents : [];
  return agents.filter(a => a && a.resident && String(a.path || '').trim());
}

async function prewarmResidents(cfg) {
  for (const a of residentAgents(cfg)) {
    const p = String(a.path || '').trim();
    const key = p.toLowerCase();
    if (warmedPaths.has(key)) continue;
    warmedPaths.add(key);
    const r = await launchAgent(p, [], { minimized: true });
    if (!r.ok) console.warn('[prewarm] 预热失败：', a.name, r.error);
    await new Promise(resolve => setTimeout(resolve, PREWARM_GAP));
  }
}

/* ===== agent 路径解析（注册表在配置里，按名称取程序路径） ===== */
function resolveAgentPath(cfg, name) {
  const agents = (cfg && Array.isArray(cfg.agents)) ? cfg.agents : [];
  const hit = agents.find(a => a && a.name === name);
  return hit ? String(hit.path || '').trim() : '';
}

/* ===== 运行状态检测 =====
   用 tasklist 按映像名判断 Agent 进程是否在跑。
   只做「进程存在」这一层：窗口是否可见 / 是否缩到托盘在 Windows 上无法可靠得知
   （打包应用、Electron 多进程都会让 MainWindowHandle 失效），所以「运行中」= 进程在。 */
const POLL_MS = 5000;
let cfgCache = null;       // 最近一次读到的配置，供托盘 / 小窗 / 状态检测共用
let agentState = {};       // { [agentName]: true | false }
let runningImages = new Set();   // 最近一次 tasklist 快照里的映像名（小写）
let pollTimer = null;

function exeNameOf(p) {
  const m = /([^\\/]+\.exe)\s*$/i.exec(String(p || '').trim());
  return m ? m[1].toLowerCase() : '';
}

function listImages() {
  return new Promise(resolve => {
    execFile('tasklist.exe', ['/FO', 'CSV', '/NH'],
      { windowsHide: true, maxBuffer: 8 * 1024 * 1024 },
      (err, stdout) => {
        if (err || !stdout) return resolve(null);
        const set = new Set();
        for (const line of stdout.split(/\r?\n/)) {
          const m = /^"([^"]+)"/.exec(line.trim());
          if (m) set.add(m[1].toLowerCase());
        }
        resolve(set);
      });
  });
}

function broadcast(channel, payload) {
  for (const w of [win, miniWin]) {
    if (w && !w.isDestroyed()) w.webContents.send(channel, payload);
  }
}

async function refreshAgentState() {
  const cfg = cfgCache || store.load();
  if (!cfg) return false;
  const images = await listImages();
  if (!images) return false;   // 取不到进程列表就保持原状，避免误判成「未运行」
  runningImages = images;
  const next = {};
  for (const a of (cfg.agents || [])) {
    if (!a || !a.name) continue;
    const exe = exeNameOf(a.path);
    next[a.name] = exe ? images.has(exe) : false;
  }
  const changed = JSON.stringify(next) !== JSON.stringify(agentState);
  agentState = next;
  if (changed) {
    broadcast('agents:state', agentState);
    syncMini();
  }
  return changed;
}

/* 唤醒目标。
   试过用 Win32（ShowWindow + SetForegroundWindow / AppActivate）直接激活已有窗口，
   但 Windows 的前台锁只认「收到用户输入的那个进程」，从子进程调用实测抢不到前台；
   更糟的是 SW_RESTORE 会把最大化窗口还原成普通大小（用户看到「应用变成小窗」）。
   所以这里退回「再启动一次」：目标应用自己处理单实例时会 show+focus 已有窗口，
   既保持最大化状态，也不需要额外权限。 */
async function wakeTarget(target, args) {
  return launchAgent(target, args);
}

/* ===== 已召唤小窗 =====
   主界面最小化/退回托盘后浮在桌面最上层：星契图标 + 已召唤的 Agent 图标。
   图标用的是 Agent 图标而不是角色立绘——同一个角色挂两个 Agent 时才能区分。
   点枢纽图标回主界面，点 Agent 图标把对应应用唤到前台；中间留一段专门的
   拖拽区，避免想拖动窗口时误点到图标。 */
const MINI_W = 68;
const summoned = new Set();  // 卡片键：`${charId}::${agentName}`
let miniWin = null;
let miniX = null, miniY = null;   // 拖动后的位置，仅本次运行内记住
let miniSize = { width: MINI_W, height: 150 };

function cardKey(charId, agentName) { return `${charId}::${agentName || ''}`; }

function charAgents(c) {
  if (Array.isArray(c && c.agents)) return c.agents.filter(Boolean);
  return (c && typeof c.agent === 'string' && c.agent) ? [c.agent] : [];
}

/* 本机程序图标的内存缓存；读取失败由界面显示首字母。 */
function agentIconOf(name) {
  return agentIcons[name] || '';
}

function miniLayout() {
  const cfg = cfgCache || store.load() || {};
  return (cfg.settings && cfg.settings.miniLayout === 'horizontal') ? 'horizontal' : 'vertical';
}

function miniPayload() {
  const cfg = cfgCache || store.load() || {};
  const chars = Array.isArray(cfg.characters) ? cfg.characters : [];
  const items = [];
  for (const c of chars) {
    for (const a of charAgents(c)) {
      const key = cardKey(c.id, a);
      const running = !!agentState[a];
      // 只要「召唤过」或「现在正在运行」就进小窗：
      // 应用本来就在跑时，不用先双击召唤一次才能在小窗里看到它
      if (!summoned.has(key) && !running) continue;
      items.push({
        key, charId: c.id, name: c.name, color: c.color,
        agent: a, icon: agentIconOf(a), running,
      });
    }
  }
  const pinned = !!(cfg.settings && cfg.settings.miniPinned);
  return { items: dedupeMiniItems(items, name => resolveAgentPath(cfg, name)), layout: miniLayout(), pinned };
}

/* 位置默认可选：竖向贴右侧居中，横向贴底部居中 */
function miniDefaultPos(w, h) {
  const wa = screen.getPrimaryDisplay().workArea;
  if (miniLayout() === 'horizontal') {
    return { x: Math.round(wa.x + (wa.width - w) / 2), y: Math.max(wa.y + 8, wa.y + wa.height - h - 64) };
  }
  return { x: Math.max(wa.x + 8, wa.x + wa.width - w - 16), y: Math.round(wa.y + (wa.height - h) / 2) };
}

/* 钳到「窗口中心所在那块显示器」的可用区域（workArea 已排除任务栏），
   多屏 / 分辨率变化 / 拖到屏幕外都不会越界。 */
function clampToWorkArea(x, y, w, h) {
  const d = screen.getDisplayNearestPoint({
    x: Math.round(x + w / 2),
    y: Math.round(y + h / 2),
  });
  const wa = d.workArea;
  // 窗口比工作区还大时（理论上不会，但别算出负坐标）退化成贴左上
  const maxX = Math.max(wa.x, wa.x + wa.width - w);
  const maxY = Math.max(wa.y, wa.y + wa.height - h);
  return {
    x: Math.round(Math.min(Math.max(x, wa.x), maxX)),
    y: Math.round(Math.min(Math.max(y, wa.y), maxY)),
  };
}

/* 尺寸以渲染层量到的内容为准：透明窗口多留一个像素都会挡住下层点击。
   位置用「锚点」表示：
   - 固定（miniPinned）：锚点是左上角，尺寸变化完全不动；
   - 未固定：锚点是窗口中心，尺寸变化时左右上下对称增减。
   锚点只记录一次，之后每次都从锚点推导——避免内容尺寸 ±1px 抖动时逐步累积漂移。 */
let miniCenter = null;
function applyMiniBounds() {
  if (!miniWin || miniWin.isDestroyed()) return;
  const work = screen.getPrimaryDisplay().workArea;
  const w = Math.max(40, Math.min(Math.round(miniSize.width), work.width));
  const h = Math.max(40, Math.min(Math.round(miniSize.height), work.height));

  if (miniX == null || miniY == null) {
    const def = miniDefaultPos(w, h);
    miniX = def.x;
    miniY = def.y;
    miniCenter = { x: def.x + w / 2, y: def.y + h / 2 };
  }
  const pinned = !!(cfgCache && cfgCache.settings && cfgCache.settings.miniPinned);
  let x, y;
  if (pinned) {
    x = miniX;
    y = miniY;
  } else {
    x = miniCenter.x - w / 2;
    y = miniCenter.y - h / 2;
  }
  const c = clampToWorkArea(x, y, w, h);
  miniX = c.x;
  miniY = c.y;
  miniCenter = { x: c.x + w / 2, y: c.y + h / 2 };

  const b = miniWin.getBounds();
  if (b.x !== c.x || b.y !== c.y || b.width !== w || b.height !== h) {
    miniWin.setBounds({ x: c.x, y: c.y, width: w, height: h });
  }
}

/* 拖动小窗：位置由渲染层的长按拖拽驱动，主进程负责钳到屏幕内 */
function moveMiniTo(x, y) {
  if (!miniWin || miniWin.isDestroyed()) return;
  const b = miniWin.getBounds();
  const c = clampToWorkArea(Number(x) || 0, Number(y) || 0, b.width, b.height);
  miniX = c.x;
  miniY = c.y;
  miniCenter = { x: c.x + b.width / 2, y: c.y + b.height / 2 };
  if (b.x !== c.x || b.y !== c.y) {
    miniWin.setBounds({ x: c.x, y: c.y, width: b.width, height: b.height });
  }
}

function pushMiniData() {
  if (!miniWin || miniWin.isDestroyed()) return;
  miniWin.webContents.send('mini:data', miniPayload());
}

/* 主界面不在前台时强制显示（即使还没召唤过任何东西，也留一个回主界面的入口） */
function showMini() {
  if (!miniWin || miniWin.isDestroyed()) { createMiniWindow(); return; }
  pushMiniData();
  applyMiniBounds();
  if (!miniWin.isVisible()) miniWin.showInactive();   // 不抢焦点
}

function hideMini() {
  if (miniWin && !miniWin.isDestroyed() && miniWin.isVisible()) miniWin.hide();
}

/* 与主界面互斥：最小化 / 隐藏 / 关到托盘 → 小窗出现；回到前台 → 收起 */
function syncMini() {
  const away = !win || win.isDestroyed() || win.isMinimized() || !win.isVisible();
  if (away) showMini(); else hideMini();
  // 顺带通知渲染层：离开前台就把大厅的聚焦详情复位
  if (win && !win.isDestroyed()) win.webContents.send('win:away', away);
}

function createMiniWindow() {
  const def = miniDefaultPos(miniSize.width, miniSize.height);
  miniWin = new BrowserWindow({
    width: miniSize.width,
    height: miniSize.height,
    x: miniX == null ? def.x : miniX,
    y: miniY == null ? def.y : miniY,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'icons', 'app.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload-mini.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  // screen-saver 层级：普通窗口、其他非置顶窗口都盖不住它
  miniWin.setAlwaysOnTop(true, 'screen-saver');
  miniWin.loadFile(path.join(__dirname, 'mini.html'));
  miniWin.on('moved', () => {
    if (!miniWin || miniWin.isDestroyed()) return;
    const b = miniWin.getBounds();
    miniX = b.x;
    miniY = b.y;
  });
  miniWin.on('closed', () => { miniWin = null; });
  miniWin.webContents.on('did-finish-load', () => {
    if (!miniWin || miniWin.isDestroyed()) return;
    pushMiniData();
    // 建窗时主界面已经不在前台 → 数据到位后再显示，避免闪一个空窗
    const away = !win || win.isDestroyed() || win.isMinimized() || !win.isVisible();
    if (away) miniWin.showInactive();
  });
}

/* ===== 窗口 ===== */
function createWindow() {
  win = new BrowserWindow({
    width: 1240,
    height: 800,
    minWidth: 980,
    minHeight: 640,
    frame: false,               // 使用界面自带的标题栏
    backgroundColor: '#0E1030',
    icon: path.join(__dirname, 'icons', 'app.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => { if (!startHidden) win.show(); });
  win.on('hide', () => syncMini());       // 退回托盘 → 浮出小窗
  win.on('show', () => syncMini());       // 回到大厅 → 收起小窗
  win.on('minimize', () => syncMini());   // 最小化也算「不在前台」
  win.on('restore', () => syncMini());
  win.on('close', e => {
    if (!isQuitting && closeToTray) {
      e.preventDefault();
      win.hide();
      hintTrayOnce();
    }
  });
}

function showWindow() {
  if (!win || win.isDestroyed()) createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

/* 关窗首次进托盘时，气泡提示一次操作方式 */
function hintTrayOnce() {
  const flag = path.join(app.getPath('userData'), '.tray-hinted');
  try {
    if (fs.existsSync(flag)) return;
    fs.writeFileSync(flag, '1');
  } catch (_) { /* 写不动就不再打扰 */ }
  if (tray) {
    tray.displayBalloon({
      iconType: 'info',
      title: '星契 · AsterLink',
      content: '已驻留系统托盘。双击托盘图标回到大厅，右键可快速召唤或退出。',
    });
  }
}

/* ===== 系统托盘 ===== */
function buildTrayMenu() {
  const cfg = cfgCache || store.load();
  if (cfg) cfgCache = cfg;
  const roster = ((cfg && cfg.characters) || []).filter(c => c.home);

  // 一个角色可能挂了多个 Agent：每个 (角色, Agent) 组合单独一条
  const quick = [];
  for (const c of roster) {
    for (const name of charAgents(c)) {
      quick.push({
        label: `召唤 · ${c.name} → ${name}`,
        click: async () => {
          const r = await launchAgent(resolveAgentPath(cfg, name), []);
          if (r.ok) {
            summoned.add(cardKey(c.id, name));
            setTimeout(() => { refreshAgentState(); syncMini(); }, 1500);
          }
          if (!tray) return;
          if (r.ok) {
            tray.displayBalloon({ iconType: 'info', title: '星契', content: `已召唤 · ${c.name}（${name}）` });
          } else {
            tray.displayBalloon({ iconType: 'error', title: '召唤失败', content: String(r.error || '') });
          }
        },
      });
    }
  }
  const quickSub = quick.length ? quick : [{ label: '（主页还没有星灵）', enabled: false }];

  return Menu.buildFromTemplate([
    { label: '显示主界面', click: () => showWindow() },
    { type: 'separator' },
    { label: '快速召唤', submenu: quickSub },
    { type: 'separator' },
    {
      label: '开机自启',
      type: 'checkbox',
      checked: loginItems.get().openAtLogin,
      click: mi => setLoginItem(mi.checked),
    },
    { type: 'separator' },
    { label: '退出星契', click: () => { isQuitting = true; app.quit(); } },
  ]);
}

function refreshTrayMenu() {
  if (tray) tray.setContextMenu(buildTrayMenu());
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'icons', 'tray.png')));
  tray.setToolTip('星契 · AsterLink');
  refreshTrayMenu();
  tray.on('click', () => showWindow());
  tray.on('double-click', () => showWindow());
}

/* ===== 开机自启 ===== */
function setLoginItem(on) {
  const state = loginItems.set(on);
  refreshTrayMenu();
  broadcast('login:state', state);
  return state;
}

/* ===== 单实例（托盘驻留时避免开出第二个） ===== */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());

  app.whenReady().then(() => {
    const cfg = store.load();
    cfgCache = cfg;
    if (cfg && cfg.settings && typeof cfg.settings.closeToTray === 'boolean') {
      closeToTray = cfg.settings.closeToTray;
    }
    Menu.setApplicationMenu(null); // 无边框界面自带标题栏，去掉默认菜单栏
    createTray();
    createWindow();
    refreshAgentIcons(cfg).catch(() => {});
    app.on('activate', () => showWindow());
    // 窗口先出来，再静默预热常驻 agent（开机自启时同样生效）
    setTimeout(() => prewarmResidents(store.load()), 900);
    // 运行状态轮询：驱动详情页「运行中」和小窗图标的在线标记
    setTimeout(refreshAgentState, 1200);
    pollTimer = setInterval(refreshAgentState, POLL_MS);
    // 静默启动（开机自启 / --hidden）时主界面本就不显示，直接把小窗拉起来
    setTimeout(syncMini, 1400);
  });
}

app.on('before-quit', () => {
  isQuitting = true;
  if (pollTimer) clearInterval(pollTimer);
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* F12 开发者工具（菜单栏已隐藏，保留调试入口） */
app.on('web-contents-created', (_e, contents) => {
  contents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') {
      contents.toggleDevTools();
      event.preventDefault();
    }
  });
});

/* ===== 扫描本机已装的 AI Agent（可视化选择启动目标） =====
   来源：开始菜单 / 桌面快捷方式 / 当前用户 Programs 目录；
   .lnk 一律解析成目标 exe；按名称名单筛出 AI 相关，去重排序。 */
const AI_NAME = /claude|anthropic|chatgpt|openai|gpt|gemini|copilot|kimi|moonshot|qwen|tongyi|豆包|doubao|元宝|yuanbao|hunyuan|混元|deepseek|glm|chatglm|zhipu|智谱|grok|x\.?ai|mistral|le.?chat|hailuo|海螺|minimax|文心|ernie|wenxin|poe|perplexity|ollama|lm.?studio|cursor|windsurf|trae|comet|dify/i;

function walkFiles(root, depth = 5, out = []) {
  let entries;
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch (_) { return out; }
  for (const e of entries) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) {
      if (depth > 0) walkFiles(p, depth - 1, out);
    } else {
      out.push(p);
    }
  }
  return out;
}

function scanAiTargets() {
  const roots = [
    { dir: path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs'), from: '开始菜单' },
    { dir: path.join(process.env.ProgramData || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs'), from: '开始菜单' },
    { dir: path.join(process.env.USERPROFILE || '', 'Desktop'), from: '桌面' },
    { dir: path.join(process.env.PUBLIC || '', 'Desktop'), from: '桌面' },
    { dir: path.join(process.env.LOCALAPPDATA || '', 'Programs'), from: '应用目录' },
  ];
  const found = new Map(); // 目标 exe（小写）→ 条目
  for (const { dir, from } of roots) {
    if (!dir || dir.length < 4) continue;
    for (const f of walkFiles(dir)) {
      const base = path.basename(f);
      const isLnk = /\.lnk$/i.test(base);
      if (!isLnk && !/\.exe$/i.test(base)) continue;
      if (/^unins|^uninstall/i.test(base)) continue;
      let target = f;
      if (isLnk) {
        try {
          const d = shell.readShortcutLink(f);
          if (!d || !d.target || !/\.exe$/i.test(d.target)) continue;
          target = d.target;
        } catch (_) { continue; }
      }
      const name = isLnk ? base.replace(/\.lnk$/i, '') : base.replace(/\.exe$/i, '');
      if (!AI_NAME.test(name + ' ' + path.basename(target))) continue;
      const key = target.toLowerCase();
      if (!found.has(key)) found.set(key, { name, path: target, from });
    }
  }
  return [...found.values()]
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
    .slice(0, 40);
}

/* 浏览本机文件选目标：.lnk 解析成目标 exe 一并回填 */
async function pickTargetFile() {
  const opts = {
    title: '选择启动目标',
    properties: ['openFile'],
    filters: [
      { name: '程序 / 快捷方式', extensions: ['exe', 'lnk'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  };
  const r = (win && !win.isDestroyed())
    ? await dialog.showOpenDialog(win, opts)
    : await dialog.showOpenDialog(opts);
  if (r.canceled || !r.filePaths.length) return null;
  let p = r.filePaths[0];
  if (/\.lnk$/i.test(p)) {
    try {
      const d = shell.readShortcutLink(p);
      if (d && d.target) p = d.target;
    } catch (_) { /* 解析不了就原样返回 */ }
  }
  return p;
}

/* ===== 配置 ===== */
ipcMain.handle('agents:icon:pick', async () => {
  try {
    const result = await dialog.showOpenDialog(win, { title: '选择应用图标（PNG，最大 2 MB）', properties: ['openFile'], filters: [{ name: 'PNG 图标', extensions: ['png'] }] });
    if (result.canceled || !result.filePaths.length) return { canceled: true };
    return { ok: true, ...importAgentIcon(result.filePaths[0], app.getPath('userData')) };
  } catch (error) { return { ok: false, error: error.message }; }
});
ipcMain.handle('character:import-art', async () => {
  try {
    const result = await dialog.showOpenDialog(win, {
      title: '选择透明 PNG 立绘（最大 10 MB）',
      properties: ['openFile'], filters: [{ name: '透明 PNG 立绘', extensions: ['png'] }],
    });
    if (result.canceled || !result.filePaths.length) return { canceled: true };
    return { ok: true, ...importArtwork(result.filePaths[0], app.getPath('userData')) };
  } catch (error) { return { ok: false, error: error.message }; }
});
ipcMain.handle('config:get', () => {
  cfgCache = store.load();
  return cfgCache;
});
ipcMain.handle('config:set', (_e, cfg) => {
  const prevLayout = miniLayout();
  const ok = store.save(cfg);
  if (!ok) return false;
  cfgCache = cfg;
  refreshAgentIcons(cfg).catch(() => {});
  // 竖向/横向切换后回到该方向的默认位置，否则窗口会停在上一个方向的位置
  if (miniLayout() !== prevLayout) { miniX = null; miniY = null; }
  refreshTrayMenu(); // 主页阵容可能变化，刷新「快速召唤」
  prewarmResidents(cfg); // 新勾选「常驻」的 agent 立即预热，不必等下次启动
  setTimeout(refreshAgentState, 600); // 名字/路径可能变了，重算运行状态
  pushMiniData(); // 小窗方向 / 召唤记录可能变了
  return ok;
});

/* ===== 窗口控制 ===== */
ipcMain.on('win:minimize', () => win && win.minimize());
ipcMain.on('win:maximize', () => {
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.on('win:hide', () => win && win.hide()); // 召唤成功后退至托盘后台
ipcMain.on('win:close', () => win && win.close()); // close 事件里按 closeToTray 决定隐藏或退出

/* ===== 托盘驻留 / 开机自启 ===== */
ipcMain.on('tray:behavior', (_e, on) => { closeToTray = !!on; });
ipcMain.handle('login:get', () => loginItems.get());
ipcMain.handle('login:set', (_e, on) => setLoginItem(on));

/* ===== 运行状态 ===== */
ipcMain.handle('agents:icons:get', () => refreshAgentIcons(cfgCache || store.load()));
ipcMain.handle('agents:state:get', async () => {
  if (!Object.keys(agentState).length) await refreshAgentState();
  return agentState;
});

/* ===== 真实启动 Agent（渲染进程入口） ===== */
ipcMain.handle('agent:launch', async (_e, payload) => {
  const args = Array.isArray(payload && payload.args) ? payload.args.map(String) : [];
  const r = await wakeTarget(payload && payload.path, args);
  // 召唤成功才记进小窗；进程起来需要时间，稍后再刷新一次状态
  if (r && r.ok && payload && payload.charId) {
    summoned.add(cardKey(payload.charId, payload.agentName));
    setTimeout(() => { refreshAgentState(); syncMini(); }, 1500);
  }
  return r;
});

/* ===== 已召唤小窗 ===== */
ipcMain.on('mini:open-hub', () => showWindow());
ipcMain.handle('mini:launch', async (_e, payload) => {
  const cfg = cfgCache || store.load() || {};
  const c = ((cfg.characters) || []).find(x => x && x.id === payload.charId);
  if (!c) return { ok: false, error: '角色已不存在' };
  const name = String(payload.agentName || '');
  if (!charAgents(c).includes(name)) return { ok: false, error: '该星灵没有配置这个 Agent' };
  const r = await wakeTarget(resolveAgentPath(cfg, name), []);
  if (r.ok) setTimeout(() => { refreshAgentState(); syncMini(); }, 1200);
  return r;
});
ipcMain.on('mini:resize', (_e, size) => {
  if (!size) return;
  const w = Math.round(Number(size.width) || 0);
  const h = Math.round(Number(size.height) || 0);
  if (!w || !h) return;
  miniSize = { width: w, height: h };
  applyMiniBounds();
});

ipcMain.on('mini:move', (_e, pos) => {
  if (!pos) return;
  moveMiniTo(pos.x, pos.y);
});

/* ===== 启动目标：扫描 / 浏览 ===== */
ipcMain.handle('targets:scan', () => scanAiTargets());
ipcMain.handle('targets:pick', () => pickTargetFile());

