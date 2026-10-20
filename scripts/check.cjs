const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const excluded = new Set(['node_modules', 'dist', '.local', '.git']);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (excluded.has(e.name)) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}
const files = walk(root);
for (const file of files.filter(p => /\.(c?js)$/.test(p))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'app/package.json')));
const lock = JSON.parse(fs.readFileSync(path.join(root, 'app/package-lock.json')));
assert.equal(pkg.name, lock.name);
assert.equal(pkg.version, lock.version);
assert.equal(pkg.version, lock.packages[''].version);
assert.equal(pkg.license, 'MIT');
for (const name of pkg.build.files.filter(x => !x.includes('*'))) {
  assert(fs.existsSync(path.join(root, 'app', name)), 'Missing packaged file: ' + name);
}
const renderer = fs.readFileSync(path.join(root, 'app/renderer.js'), 'utf8');
for (const [, name] of renderer.matchAll(/img:ART\+"([^"]+)"/g)) {
  assert(fs.existsSync(path.join(root, 'app/art', name)), 'Missing default character: ' + name);
}
assert(!/C:\\\\Users\\\\/.test(renderer), 'Personal default path detected');
for (const name of ['index.html', 'mini.html']) {
  const text = fs.readFileSync(path.join(root, 'app', name), 'utf8');
  assert(!text.includes('星灵枢纽') && !text.includes('AetherLink'), 'Old visible branding');
  for (const [, ref] of text.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (!/^(https?:|data:)/.test(ref)) assert(fs.existsSync(path.join(root, 'app', ref)), 'Missing HTML resource: ' + ref);
  }
}
for (const file of files.filter(p => p.endsWith('.md'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const [, link] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(link)) continue;
    assert(fs.existsSync(path.resolve(path.dirname(file), decodeURIComponent(link.split('#')[0]))), `${path.relative(root, file)}: broken link ${link}`);
  }
}
const ico = fs.readFileSync(path.join(root, 'app/icons/app.ico'));
assert.equal(ico.readUInt16LE(2), 1);
assert.equal(ico.readUInt16LE(4), 7);
for (let i = 0; i < 7; i++) {
  const pos = 6 + i * 16;
  assert(ico.readUInt32LE(pos + 12) + ico.readUInt32LE(pos + 8) <= ico.length, 'Truncated ICO frame');
}
console.log('PASS: JavaScript syntax, package lock, runtime resources, default paths, branding, Markdown links and seven ICO frames.');

