/* 安全桥：主进程能力按需暴露给渲染进程 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aether', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: cfg => ipcRenderer.invoke('config:set', cfg),
  launch: payload => ipcRenderer.invoke('agent:launch', payload),
  getLogin: () => ipcRenderer.invoke('login:get'),
  setLogin: on => ipcRenderer.invoke('login:set', on),
  setCloseToTray: on => ipcRenderer.send('tray:behavior', on),
  scanTargets: () => ipcRenderer.invoke('targets:scan'),
  pickTarget: () => ipcRenderer.invoke('targets:pick'),
  getAgentState: () => ipcRenderer.invoke('agents:state:get'),
  onAgentState: cb => ipcRenderer.on('agents:state', (_e, state) => cb(state)),
  // 主界面离开前台（最小化 / 退到托盘）时通知，用于复位大厅的聚焦详情
  onWinAway: cb => ipcRenderer.on('win:away', (_e, away) => cb(away)),
  win: {
    minimize: () => ipcRenderer.send('win:minimize'),
    toggleMaximize: () => ipcRenderer.send('win:maximize'),
    hide: () => ipcRenderer.send('win:hide'),
    close: () => ipcRenderer.send('win:close'),
  },
});
