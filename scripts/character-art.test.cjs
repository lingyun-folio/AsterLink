const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { fileURLToPath } = require('node:url');

function fixture(t, { alpha = [0, 255], width = 800, height = 1600, empty = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'asterlink-art-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const bytes = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20);
  const source = path.join(dir, 'input.png'); fs.writeFileSync(source, bytes);
  const bitmap = Buffer.alloc(alpha.length * 4);
  alpha.forEach((value, i) => bitmap[i * 4 + 3] = value);
  let resized = null;
  const image = { isEmpty: () => empty, toBitmap: () => bitmap, toPNG: () => bytes, resize: size => { resized = size; return image; } };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../app/character-art.js'), 'utf8'), {
    module, Buffer, require: name => name === 'electron' ? { nativeImage: { createFromBuffer: () => image } } : require(name),
  });
  return { dir, source, import: () => module.exports.importArtwork(source, path.join(dir, 'profile')), resized: () => resized, recommend: module.exports.recommendColor };
}
test('import copies artwork to a managed local URL that survives moving the source', t => {
  const f = fixture(t), result = f.import();
  fs.unlinkSync(f.source);
  assert(fs.existsSync(fileURLToPath(result.img)));
  assert.equal(result.width, 800); assert.equal(result.height, 1600);
  assert.match(result.suggestedColor, /^#[0-9a-f]{6}$/);
});

function pixels(groups) {
  return Buffer.from(groups.flatMap(([count, rgba]) => Array.from({ length: count }, () => [rgba[2], rgba[1], rgba[0], rgba[3] ?? 255]).flat()));
}
test('recommend the dominant chromatic family while ignoring transparent, white and black pixels', t => {
  const { recommend } = fixture(t);
  const color = recommend(pixels([[100, [255, 0, 0, 0]], [100, [255, 255, 255]], [100, [0, 0, 0]], [30, [20, 80, 220]], [5, [230, 30, 20]]]));
  const rgb = color.slice(1).match(/../g).map(v => parseInt(v, 16));
  assert(rgb[2] > rgb[0] * 2 && rgb[2] > rgb[1]);
  assert(rgb[2] >= 180, 'glow should remain visible');
});
test('neutral and almost-transparent artwork falls back to purple', t => {
  const { recommend } = fixture(t);
  assert.equal(recommend(pixels([[20, [128, 128, 128]], [20, [255, 0, 0, 20]]])), '#7c5ce0');
  assert.equal(recommend(Buffer.alloc(0)), '#7c5ce0');
  assert.equal(recommend(pixels([[2000, [128, 128, 128]], [1, [255, 0, 0]]])), '#7c5ce0');
});
test('neighboring red shades combine across the hue boundary instead of producing a muddy average', t => {
  const { recommend } = fixture(t);
  const color = recommend(pixels([[20, [230, 10, 15]], [20, [230, 15, 10]], [30, [20, 190, 40]]]));
  const rgb = color.slice(1).match(/../g).map(v => parseInt(v, 16));
  assert(rgb[0] > rgb[1] * 2 && rgb[0] > rgb[2] * 2);
});
test('reject opaque backgrounds and completely invisible artwork', t => {
  assert.throws(fixture(t, { alpha: [255, 255] }).import, /透明背景/);
  assert.throws(fixture(t, { alpha: [0, 0] }).import, /完全透明/);
});
test('reject oversized dimensions before decoding and downscale large accepted images', t => {
  assert.throws(fixture(t, { width: 5000 }).import, /256–4096/);
  assert.throws(fixture(t, { height: 100 }).import, /256–4096/);
  const f = fixture(t, { width: 1600, height: 3200 }); f.import();
  assert.equal(f.resized().width, 1024); assert.equal(f.resized().height, 2048);
});
test('reject disguised, corrupt and excessive-size files', t => {
  const f = fixture(t); fs.writeFileSync(f.source, 'not a png'); assert.throws(f.import, /真正的 PNG/);
  assert.throws(fixture(t, { empty: true }).import, /损坏/);
  fs.writeFileSync(f.source, Buffer.alloc(10 * 1024 * 1024 + 1)); assert.throws(f.import, /10 MB/);
});
