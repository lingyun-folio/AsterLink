const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { nativeImage } = require('electron');

const FALLBACK_COLOR = '#7c5ce0';
function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  const light = (max + min) / 2;
  if (!delta) return [0, 0, light];
  const hue = (max === r ? (g - b) / delta + (g < b ? 6 : 0) : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60;
  return [hue, delta / (1 - Math.abs(2 * light - 1)), light];
}

// Electron's Windows bitmap is premultiplied BGRA. Only the small thumbnail
// is analyzed; transparent edges, neutral highlights and shadows do not vote.
function recommendColor(bitmap) {
  const bins = Array.from({ length: 24 }, () => ({ weight: 0, count: 0, r: 0, g: 0, b: 0 }));
  let visiblePixels = 0;
  for (let i = 0; i + 3 < bitmap.length; i += 4) {
    const alpha = bitmap[i + 3] / 255;
    if (alpha < 0.78) continue;
    visiblePixels++;
    const r = Math.min(1, bitmap[i + 2] / 255 / alpha);
    const g = Math.min(1, bitmap[i + 1] / 255 / alpha);
    const b = Math.min(1, bitmap[i] / 255 / alpha);
    const [hue, saturation, light] = rgbToHsl(r, g, b);
    if (saturation < 0.18 || light < 0.12 || light > 0.9) continue;
    const weight = alpha * saturation ** 1.3;
    const bin = bins[Math.floor((hue + 7.5) / 15) % 24];
    bin.count++; bin.weight += weight; bin.r += r * weight; bin.g += g * weight; bin.b += b * weight;
  }
  const winner = bins.reduce((best, bin) => bin.weight > best.weight ? bin : best);
  if (!winner.weight || winner.count < Math.max(2, visiblePixels * 0.02)) return FALLBACK_COLOR;
  let [hue, saturation, light] = rgbToHsl(winner.r / winner.weight, winner.g / winner.weight, winner.b / winner.weight);
  saturation = Math.max(0.5, Math.min(0.8, saturation));
  light = Math.max(0.52, Math.min(0.62, light));
  const chroma = (1 - Math.abs(2 * light - 1)) * saturation;
  const x = chroma * (1 - Math.abs(hue / 60 % 2 - 1)), m = light - chroma / 2;
  const channels = hue < 60 ? [chroma, x, 0] : hue < 120 ? [x, chroma, 0] : hue < 180 ? [0, chroma, x] : hue < 240 ? [0, x, chroma] : hue < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return '#' + channels.map(c => Math.round((c + m) * 255).toString(16).padStart(2, '0')).join('');
}

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
  const scale = Math.min(64 / width, 64 / height);
  const thumbnail = image.resize({ width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) });
  const suggestedColor = recommendColor(thumbnail.toBitmap());
  if (Math.max(width, height) > 2048) {
    image = image.resize({ width: Math.round(width * 2048 / Math.max(width, height)), height: Math.round(height * 2048 / Math.max(width, height)) });
  }
  const dir = path.join(userData, 'character-art');
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, randomUUID() + '.png');
  fs.writeFileSync(target, image.toPNG(), { flag: 'wx' });
  return { img: pathToFileURL(target).href, width, height, suggestedColor };
}

module.exports = { importArtwork, recommendColor };
