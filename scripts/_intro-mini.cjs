/* 小窗渲染验证：直接加载 mini.html，推入模拟数据，按回报尺寸调整窗口并截图。
   Run from app/: npm run capture:mini */
const { app, BrowserWindow, ipcMain, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();
app.setPath('userData', path.join(__dirname, '../.local/mini-capture-profile'));
const APP_DIR = path.join(__dirname, '../app');
const OUT_DIR = path.join(__dirname, '../docs/images');
fs.mkdirSync(OUT_DIR, { recursive: true });

const ITEMS = [
  { key: 'mimo::Codex', charId: 'mimo', name: '炽羽 · MiMo', agent: 'Codex', icon: '', running: true },
  { key: 'deepseek::DeepSeek Harness', charId: 'deepseek', name: '深语 · DeepSeek', agent: 'DeepSeek Harness', icon: '', running: false },
];

app.whenReady().then(async () => {
  ITEMS[0].icon = nativeImage.createFromPath(path.join(APP_DIR, 'icons/app.png')).resize({width:128,height:128}).toDataURL();
  let win = null;
  ipcMain.on('mini:resize', (_e, size) => {
    if (!win || win.isDestroyed() || !size) return;
    const w = Math.round(size.width), h = Math.round(size.height);
    const b = win.getBounds();
    if (w > 0 && h > 0 && (b.width !== w || b.height !== h)) {
      win.setBounds({ x: b.x, y: b.y, width: w, height: h });
    }
  });
  ipcMain.on('mini:open-hub', () => console.log('[mini] open-hub'));
  ipcMain.handle('mini:launch', (_e, p) => { console.log('[mini] launch', JSON.stringify(p)); return { ok: true }; });

  win = new BrowserWindow({
    width: 90, height: 300, show: false, frame: false, transparent: true, skipTaskbar: true,
    webPreferences: {
      preload: path.join(APP_DIR, 'preload-mini.js'),
      contextIsolation: true, nodeIntegration: false, backgroundThrottling: false,
    },
  });
  win.showInactive();
  win.setOpacity(0);
  await win.loadFile(path.join(APP_DIR, 'mini.html'));
  await new Promise(r => setTimeout(r, 400));

  const shoot = async (name) => {
    if (name !== '截图-小窗-横向.png') return;
    name = 'mini.png';
    await new Promise(r => setTimeout(r, 500));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(OUT_DIR, name), img.toPNG());
    const b = win.getBounds();
    console.log('saved', name, `${b.width}x${b.height}`);
  };

  // 竖向
  win.webContents.send('mini:data', { items: ITEMS, layout: 'vertical', pinned: false });
  await shoot('截图-小窗-竖向.png');

  // 竖向 · 固定状态（分隔线变金色）
  win.webContents.send('mini:data', { items: ITEMS, layout: 'vertical', pinned: true });
  await shoot('截图-小窗-固定.png');

  // 横向
  win.webContents.send('mini:data', { items: ITEMS, layout: 'horizontal', pinned: false });
  await shoot('截图-小窗-横向.png');

  // 空状态（还没召唤过）
  win.webContents.send('mini:data', { items: [], layout: 'vertical', pinned: false });
  await shoot('截图-小窗-空.png');

  app.quit();
}).catch(e => { console.error(e); app.quit(); });


