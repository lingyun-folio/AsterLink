/* Use exactly the same Windows command when reading and writing login state. */
function createLoginItems(app, options = {}) {
  const name = options.name || 'com.lingy.aetherlink';
  const portable = options.portableExecutable ?? process.env.PORTABLE_EXECUTABLE_FILE;
  const path = portable || options.execPath || process.execPath;
  const args = app.isPackaged ? ['--hidden'] : ['"' + app.getAppPath() + '"', '--hidden'];
  const command = { path, args };
  function get() {
    const state = app.getLoginItemSettings(command);
    const entry = state.launchItems?.find(item => item.name === name);
    return { openAtLogin: !!state.openAtLogin && entry?.enabled !== false };
  }
  function set(on) {
    try {
      app.setLoginItemSettings({ ...command, name, openAtLogin: !!on, enabled: !!on });
      const state = get();
      if(state.openAtLogin !== !!on) state.error = '开机自启设置未生效，请检查 Windows 启动应用设置。';
      return state;
    } catch(error) {
      return { ...get(), error: '设置开机自启失败：' + error.message };
    }
  }
  return { get, set };
}
module.exports = { createLoginItems };
