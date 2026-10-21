/* Render light-theme documentation screenshots with isolated demonstration data.
   No real agent is launched and the user's configuration is never loaded. */
const { app, BrowserWindow, ipcMain, nativeImage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const APP_DIR = path.join(__dirname, '../app');
const OUT_DIR = path.join(__dirname, '../docs/images');
const PROFILE = path.join(__dirname, '../.local/screenshot-profile-light');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(PROFILE, { recursive: true });
app.setPath('userData', PROFILE);
app.disableHardwareAcceleration();
const customIcon = '11111111-1111-4111-8111-111111111111.png';
let cfg = {
  version: 2,
  agents: [
    { name: 'Codex', path: 'C:/ExampleApps/Codex/Codex.exe', resident: false, customIcon },
    { name: 'DeepSeek Harness', path: 'C:/ExampleApps/DeepSeek Harness/DeepSeek Harness.exe', resident: true },
  ],
  characters: [
    { id: 'mimo', name: '炽羽 · MiMo', color: '#FF7A3D', img: 'art/MiMo.png', anim: 'warp', home: true, agents: ['Codex'], quotes: ['全息面板已展开，开工吧！'] },
    { id: 'deepseek', name: '深语 · DeepSeek', color: '#4E86D8', img: 'art/Deepseek.png', anim: 'circle', home: true, agents: ['DeepSeek Harness'], quotes: ['深海的数据，已为你调齐。'] },
  ],
  settings: { theme: 'light', animScale: 1, closeToTray: true, ccSwitchPath: '', miniLayout: 'horizontal' },
};
app.whenReady().then(async () => {
  // Project-owned fox artwork demonstrates a user-selected application icon.
  const icon = nativeImage.createFromPath(path.join(APP_DIR, 'icons/app.png')).resize({width:128,height:128}).toDataURL();
  const icons = () => ({ Codex: icon });
  ipcMain.handle('config:get', () => cfg);
  ipcMain.handle('config:set', (_event, next) => { cfg = next; return true; });
  ipcMain.handle('agents:state:get', () => ({ Codex: true, 'DeepSeek Harness': false }));
  ipcMain.handle('agents:icons:get', icons);
  ipcMain.handle('agents:icon:pick', () => ({ ok: true, customIcon, icon }));
  ipcMain.handle('character:import-art', () => ({ ok: true, img: 'art/MiMo.png', suggestedColor: '#ff7a3d' }));
  ipcMain.handle('login:get', () => ({ openAtLogin: false }));
  ipcMain.handle('login:set', (_event, on) => ({ openAtLogin: !!on }));
  ipcMain.handle('targets:scan', () => []);
  ipcMain.handle('targets:pick', () => null);
  ipcMain.handle('agent:launch', () => ({ ok: true }));
  ipcMain.on('tray:behavior', () => {});
  const win = new BrowserWindow({
    width: 1240, height: 940, show: false, frame: false, backgroundColor: '#f6f5ef', opacity: 0, skipTaskbar: true,
    webPreferences: { preload: path.join(APP_DIR, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
  });
  const errors = [];
  win.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message); });
  const js = code => win.webContents.executeJavaScript(code);
  const pause = () => new Promise(resolve => setTimeout(resolve, 450));
  const shoot = async name => {
    await pause();
    assert.equal(await js('document.body.dataset.theme'), 'light');
    fs.writeFileSync(path.join(OUT_DIR, name), (await win.webContents.capturePage()).toPNG());
    console.log('saved', name);
  };
  await win.loadFile(path.join(APP_DIR, 'index.html'));
  win.showInactive(); win.setOpacity(0);
  await new Promise(resolve => setTimeout(resolve, 1600));
  assert(await js('Promise.all([...document.images].filter(img=>img.src.includes("art/")).map(img=>img.decode().then(()=>true))).then(items=>items.every(Boolean))'));
  await shoot('roster.png');
  await js('document.querySelector("[data-view=config]").click(); document.querySelector("#link-list .link-summary").click()');
  await shoot('connections.png');
  await js('openCharacterEditor(characters.find(c=>c.id==="mimo"));document.querySelector("#character-pick").click()');
  await shoot('custom-character.png');
  await js('document.querySelector("#character-cancel").click(); document.querySelector("[data-view=settings]").click(); if(document.querySelector("#agent-list").hidden) document.querySelector("#agent-toggle").click()');
  await shoot('settings.png');
  await js('document.querySelector(".ar-icon-controls").scrollIntoView({block:"center"})');
  await shoot('custom-agent-icon.png');
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(PROFILE, 'capture-result.json'), JSON.stringify({pass:true,theme:'light',characters:['MiMo','DeepSeek'],files:['roster.png','connections.png','custom-character.png','settings.png','custom-agent-icon.png']}, null, 2));
  app.exit(0);
}).catch(error => { console.error(error); app.exit(1); });
