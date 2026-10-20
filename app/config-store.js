/* 连接配置持久化：存放在系统 userData/config.json */
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

const file = () => path.join(app.getPath('userData'), 'config.json');

let checkedVersion = -1;

/* 版本升级前先把旧文件原样存一份：userData/config.v<旧版本>.bak.json。
   v1 → v2 是「单个 agent → agents 多选」的结构性迁移，出问题可以直接覆盖回去。
   同一次运行里只检查一次；备份失败不阻断保存。 */
function backupBeforeUpgrade(nextVersion) {
  const v = Number(nextVersion) || 1;
  if (v === checkedVersion) return;
  checkedVersion = v;
  try {
    const f = file();
    if (!fs.existsSync(f)) return;          // 首次运行，没有旧配置可备份
    const old = JSON.parse(fs.readFileSync(f, 'utf-8'));
    const oldV = Number(old && old.version) || 1;
    if (oldV >= v) return;                  // 版本没变或更高，不备份
    fs.copyFileSync(f, path.join(app.getPath('userData'), `config.v${oldV}.bak.json`));
  } catch (_) { /* 备份失败不该挡住保存 */ }
}

function load() {
  try {
    const data = JSON.parse(fs.readFileSync(file(), 'utf-8'));
    if (data && Array.isArray(data.characters)) return data;
  } catch (_) { /* 首次运行或配置损坏 → 返回 null 使用默认 */ }
  return null;
}

function save(cfg) {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    backupBeforeUpgrade(cfg && cfg.version);
    fs.writeFileSync(file(), JSON.stringify(cfg, null, 2), 'utf-8');
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = { load, save };
