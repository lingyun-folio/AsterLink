const fs = require('node:fs/promises');
const path = require('node:path');

const xmlValue = value => value.replace(/&(?:amp|quot|apos|lt|gt);/g, entity => ({ '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' })[entity]);
function attribute(text, name) {
  const match = new RegExp('\\b' + name + '\\s*=\\s*(["\'])(.*?)\\1', 'i').exec(text);
  return match ? xmlValue(match[2]) : '';
}

// MSIX executables often contain only a generic icon. The package manifest
// points to the real app-list artwork; only read resources inside that package.
async function findPackagedIcon(file) {
  if (!/[\\/]WindowsApps[\\/]/i.test(file)) return '';
  let dir = path.dirname(file);
  for (let depth = 0; depth < 6; depth++) {
    try {
      const manifest = await fs.readFile(path.join(dir, 'AppxManifest.xml'), 'utf8');
      for (const match of manifest.matchAll(/<Application\b([^>]*)>([\s\S]*?)<\/Application>/gi)) {
        const executable = attribute(match[1], 'Executable');
        if (!executable || path.resolve(dir, executable).toLowerCase() !== path.resolve(file).toLowerCase()) continue;
        const visual = /<(?:[\w.-]+:)?VisualElements\b[^>]*>/i.exec(match[2]);
        const logo = visual && (attribute(visual[0], 'Square44x44Logo') || attribute(visual[0], 'Square150x150Logo'));
        if (!logo) return '';
        const target = path.resolve(dir, logo);
        const relative = path.relative(dir, target);
        if (relative.startsWith('..') || path.isAbsolute(relative) || path.extname(target).toLowerCase() !== '.png') return '';
        try { if ((await fs.stat(target)).isFile()) return target; } catch (_) {}
        const stem = path.basename(target, '.png').toLowerCase();
        const variants = (await fs.readdir(path.dirname(target))).filter(name => name.toLowerCase().startsWith(stem + '.scale-') && name.toLowerCase().endsWith('.png')).sort();
        if (variants.length) return path.join(path.dirname(target), variants[0]);
      }
      return '';
    } catch (_) {}
    const parent = path.dirname(dir);
    if (parent === dir || path.basename(parent).toLowerCase() === 'windowsapps') break;
    dir = parent;
  }
  return '';
}

function createIconReader(getFileIcon, stat = fs.stat) {
  const cache = new Map();
  return async function readIcon(target) {
    let file = String(target || '').trim();
    if (file.startsWith('"') && file.endsWith('"')) file = file.slice(1, -1);
    if (!path.win32.isAbsolute(file) || /^[a-z][a-z0-9+.-]*:\/\//i.test(file)) return '';
    try {
      const info = await stat(file);
      if (!info.isFile()) return '';
      const key = path.win32.normalize(file).toLowerCase();
      const stamp = `${info.size}:${info.mtimeMs}`;
      const existing = cache.get(key);
      if (existing?.stamp === stamp) return await existing.promise;
      const entry = { stamp };
      entry.promise = Promise.resolve().then(() => getFileIcon(file, { size: 'normal' })).then(image => image.isEmpty() ? '' : image.toDataURL()).catch(() => '');
      cache.set(key, entry);
      if (cache.size > 128) cache.delete(cache.keys().next().value);
      const result = await entry.promise;
      if (!result && cache.get(key) === entry) cache.delete(key);
      return result;
    } catch (_) { return ''; }
  };
}

module.exports = { createIconReader, findPackagedIcon };
