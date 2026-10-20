/* 截图用的一次性 Electron 入口：隐藏窗口渲染真实界面，然后截图退出。
   不启动托盘/小窗/真实进程，也不碰用户的真实配置（userData 指到临时目录）。 */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_DIR = path.join(__dirname, '../app');
const OUT_DIR = path.join(__dirname, '../docs/images');
const USER_DATA = path.join(__dirname, '../.local/screenshot-profile');
fs.mkdirSync(OUT_DIR, { recursive: true });

app.disableHardwareAcceleration();
fs.mkdirSync(USER_DATA, { recursive: true });
app.setPath('userData', USER_DATA);

const cfg = {
  version: 2,
  agents: [
    { name: 'Codex', path: 'C:\\ExampleApps\\Codex\\Codex.exe', resident: false },
    { name: 'Claude', path: 'C:\\ExampleApps\\Claude\\Claude.exe', resident: false },
    { name: 'DeepSeek Harness', path: 'C:\\ExampleApps\\DeepSeek Harness\\DeepSeek Harness.exe', resident: true },
    { name: 'WorkBuddy', path: 'C:\\ExampleApps\\WorkBuddy\\WorkBuddy.exe', resident: false },
  ],
  characters: [
    {
      id: 'mimo', name: '炽羽 · MiMo', color: '#FF7A3D', img: 'art/MiMo.png',
      anim: 'warp', home: true, agents: ['Codex', 'Claude'],
      quotes: ['全息面板已展开，开工吧！'],
    },
    {
      id: 'deepseek', name: '深语 · DeepSeek', color: '#4E86D8', img: 'art/lumi.png',
      anim: 'circle', home: true, agents: ['DeepSeek Harness'],
      quotes: ['深海的数据，已为你调齐。'],
    },
    {
      id: 'kimi', name: '月见 · Kimi', color: '#8FA8D8', img: 'art/lumi.png',
      anim: 'streak', home: true, agents: [],
      quotes: ['月色安静，思路清晰。'],
    },
  ],
  settings: { theme: 'dark', animScale: 1, closeToTray: true, ccSwitchPath: '' },
};

app.whenReady().then(async () => {
  ipcMain.handle('config:get', () => cfg);
  ipcMain.handle('config:set', () => true);
  ipcMain.handle('agents:state:get', () => ({ 'Codex': true, 'Claude': false }));
  ipcMain.handle('login:get', () => ({ openAtLogin: false }));
  ipcMain.handle('login:set', () => ({ openAtLogin: false }));
  ipcMain.handle('targets:scan', () => []);
  ipcMain.handle('targets:pick', () => null);
  ipcMain.handle('agent:launch', () => ({ ok: true }));
  ipcMain.on('tray:behavior', () => {});

  const win = new BrowserWindow({
    width: 1240, height: 800, show: false, frame: false, backgroundColor: '#0E1030',
    opacity: 0,          // 窗口真实存在但不透明度为 0：能正常重绘，又看不见
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(APP_DIR, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,   // 隐藏窗口也要正常重绘，否则切视图后截图是旧帧
    },
  });
  win.setOpacity(0);

  win.webContents.on('console-message', (_e, level, message) => {
    console.log('[renderer]', message);
  });

  await win.loadFile(path.join(APP_DIR, 'index.html'));
  win.showInactive();
  win.setOpacity(0);
  await new Promise(r => setTimeout(r, 2000));   // 等立绘解码 + 入场动画结束

  const shot = async (name) => {
    const names = {"截图-角色大厅.png":"roster.png","截图-连接配置.png":"connections.png","截图-设置页.png":"settings.png","截图-小窗-横向.png":"mini.png"};
    if (!names[name]) return;
    name = names[name];
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(OUT_DIR, name), img.toPNG());
    console.log('saved', name, img.getSize());
  };

  await shot('截图-角色大厅.png');

  // 单击卡片进入聚焦详情 → 模拟「主界面离开前台」→ 应该复位回多角色大厅
  await win.webContents.executeJavaScript(`
    (function(){ document.querySelector('#roster-cards .char-card').click(); return true; })()
  `);
  await new Promise(r => setTimeout(r, 700));
  const focusedBefore = await win.webContents.executeJavaScript(
    '!document.getElementById("stage-focus").hidden');
  await win.webContents.executeJavaScript(`
    (function(){ document.querySelector('[data-view="stage"]'); return true; })()
  `);
  win.webContents.send('win:away', true);
  await new Promise(r => setTimeout(r, 500));
  const focusedAfter = await win.webContents.executeJavaScript(
    '!document.getElementById("stage-focus").hidden');
  console.log('聚焦复位: 离开前展开=' + focusedBefore + ' 回来后展开=' + focusedAfter);
  await shot('截图-角色大厅-复位后.png');

  // 连接配置页：展开第一个角色，顺便看多选 UI
  await win.webContents.executeJavaScript(`
    (function(){
      document.querySelector('[data-view="config"]').click();
      var row = document.querySelector('#link-list .link-row');
      if (row) row.querySelector('.link-summary').click();
      return row ? row.classList.contains('expanded') : 'no-row';
    })()
  `).then(r => console.log('展开状态:', r));
  await new Promise(r => setTimeout(r, 1200));
  await shot('截图-连接配置.png');

  // 切到设置再切回连接配置：验证详情会自动收起
  const stillExpanded = await win.webContents.executeJavaScript(`
    (function(){
      document.querySelector('[data-view="settings"]').click();
      document.querySelector('[data-view="config"]').click();
      var body = document.querySelector('#link-list .link-body');
      var row = document.querySelector('#link-list .link-row');
      return { bodyHidden: body ? body.hidden : null, rowExpanded: row ? row.classList.contains('expanded') : null };
    })()
  `);
  console.log('切回后状态:', JSON.stringify(stillExpanded));
  await new Promise(r => setTimeout(r, 900));
  await shot('截图-连接配置-切回后.png');

  // 设置页：看一眼小窗方向开关等新增项
  await win.webContents.executeJavaScript(`
    (function(){
      document.querySelector('[data-view="settings"]').click();
      var list = document.getElementById('agent-list');
      if (list && list.hidden) document.getElementById('agent-toggle').click();
      return true;
    })()
  `);
  await new Promise(r => setTimeout(r, 700));
  await shot('截图-设置页.png');

  app.quit();
}).catch(err => {
  console.error('截图失败:', err);
  app.quit();
});



