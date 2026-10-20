const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { nativeImage } = require('electron');

function importArtwork(source, userData) {
  if (fs.statSync(source).size > 10 * 1024 * 1024) throw new Error('图片不能超过 10 MB。');
  const data = fs.readFileSync(source);
  if (data.length < 33 || !data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error('请选择真正的 PNG 图片，不能只修改文件扩展名。');
  }
  const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
  if (width < 256 || height < 256 || width > 4096 || height > 4096) {
    throw new Error('图片宽、高都需在 256–4096 像素之间。');
  }
  let image = nativeImage.createFromBuffer(data);
  if (image.isEmpty()) throw new Error('图片损坏或无法解码，请重新导出 PNG。');
  const bitmap = image.toBitmap();
  let transparent = false, visible = false;
  for (let i = 3; i < bitmap.length; i += 4) {
    if (bitmap[i] < 255) transparent = true;
    if (bitmap[i] > 0) visible = true;
  }
  if (!transparent) throw new Error('图片没有透明背景，请先抠图；白底或棋盘格截图不属于透明立绘。');
  if (!visible) throw new Error('图片完全透明，请选择包含可见角色的立绘。');
  if (Math.max(width, height) > 2048) {
    image = image.resize({ width: Math.round(width * 2048 / Math.max(width, height)), height: Math.round(height * 2048 / Math.max(width, height)) });
  }
  const dir = path.join(userData, 'character-art');
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, randomUUID() + '.png');
  fs.writeFileSync(target, image.toPNG(), { flag: 'wx' });
  return { img: pathToFileURL(target).href, width, height };
}

module.exports = { importArtwork };
