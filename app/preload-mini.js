/* 安全桥：小窗专用，能力比主界面更小 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mini', {
  onData: cb => ipcRenderer.on('mini:data', (_e, data) => cb(data)),
  openHub: () => ipcRenderer.send('mini:open-hub'),
  launch: payload => ipcRenderer.invoke('mini:launch', payload),
  // 内容渲染后把实际尺寸报给主进程：透明窗口多留一点都会挡住下层点击
  resize: size => ipcRenderer.send('mini:resize', size),
  // 拖动时把目标位置交给主进程，由主进程钳到显示器可用区域内
  move: pos => ipcRenderer.send('mini:move', pos),
});
