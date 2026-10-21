const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { nativeImage } = require('electron');
const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function importAgentIcon(source, userData) {
  if (fs.statSync(source).size > 2 * 1024 * 1024) throw new Error('图标不能超过 2 MB。');
  const bytes = fs.readFileSync(source);
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(SIGNATURE)) throw new Error('请选择 PNG 图标；其他格式请先导出为 PNG。');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width < 16 || height < 16 || width > 2048 || height > 2048) throw new Error('图标宽、高需在 16–2048 像素之间，推荐 256 × 256。');
  let image = nativeImage.createFromBuffer(bytes);
  if (image.isEmpty()) throw new Error('无法读取图标，请重新导出 PNG。');
  if (!image.toBitmap().some((value, i) => i % 4 === 3 && value > 0)) throw new Error('图标完全透明，请选择包含可见内容的图片。');
  const scale = Math.min(128 / width, 128 / height, 1);
  if (scale < 1) image = image.resize({ width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) });
  const customIcon = randomUUID() + '.png';
  const dir = path.join(userData, 'agent-icons');
  fs.mkdirSync(dir, { recursive: true });
  const data = image.toPNG();
  fs.writeFileSync(path.join(dir, customIcon), data, { flag: 'wx' });
  return { customIcon, icon: 'data:image/png;base64,' + data.toString('base64') };
}

function readAgentIcon(customIcon, userData) {
  if (typeof customIcon !== 'string' || !/^[0-9a-f-]{36}\.png$/i.test(customIcon)) return '';
  try {
    const file = path.join(userData, 'agent-icons', customIcon);
    if (fs.statSync(file).size > 2 * 1024 * 1024) return '';
    const bytes = fs.readFileSync(file);
    if (bytes.length < 33 || !bytes.subarray(0, 8).equals(SIGNATURE)) return '';
    const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
    if (width < 16 || height < 16 || width > 2048 || height > 2048 || nativeImage.createFromBuffer(bytes).isEmpty()) return '';
    return 'data:image/png;base64,' + bytes.toString('base64');
  } catch (_) { return ''; }
}

module.exports = { importAgentIcon, readAgentIcon };
