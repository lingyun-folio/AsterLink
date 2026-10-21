const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createIconReader, findPackagedIcon } = require('../app/agent-icons');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const info = (mtimeMs = 1) => ({ size: 100, mtimeMs, isFile: () => true });
const image = { isEmpty: () => false, toDataURL: () => 'data:image/png;base64,local' };

test('same Windows target shares extraction across aliases and concurrent requests', async () => {
  let reads = 0;
  const read = createIconReader(async () => { reads++; return image; }, async () => info());
  const icons = await Promise.all([read('C:\\Apps\\Codex.exe'), read('c:/apps/codex.exe')]);
  assert.equal(reads, 1); assert.deepEqual(icons, [image.toDataURL(), image.toDataURL()]);
});
test('changed executable metadata invalidates the in-memory cache', async () => {
  let reads = 0, mtime = 1;
  const read = createIconReader(async () => { reads++; return image; }, async () => info(mtime));
  await read('C:\\App.exe'); await read('C:\\App.exe'); mtime++;
  await read('C:\\App.exe'); assert.equal(reads, 2);
});
test('missing files, directories, extraction failures and empty images use fallback', async () => {
  assert.equal(await createIconReader(async () => image, async () => { throw Error('missing'); })('C:\\missing.exe'), '');
  assert.equal(await createIconReader(async () => image, async () => ({ isFile: () => false }))('C:\\folder'), '');
  let attempts = 0;
  const read = createIconReader(async () => { if (++attempts === 1) throw Error('unavailable'); return image; }, async () => info());
  assert.equal(await read('C:\\App.exe'), ''); assert.equal(await read('C:\\App.exe'), image.toDataURL());
  assert.equal(await createIconReader(async () => ({ isEmpty: () => true }), async () => info())('C:\\empty.exe'), '');
});
test('protocols, empty paths and relative commands are not treated as local icon files', async () => {
  const read = createIconReader(async () => { throw Error('must not read'); }, async () => { assert.fail('must not stat'); });
  for (const target of ['', 'codex', 'https://example.com/app.exe', 'codex://launch']) assert.equal(await read(target), '');
});
test('quoted executable and shortcut paths are handed to the system icon reader', async () => {
  const seen = [];
  const read = createIconReader(async file => { seen.push(file); return image; }, async () => info());
  await read('"C:\\Apps\\Codex.exe"'); await read('C:\\Apps\\Claude.lnk');
  assert.deepEqual(seen, ['C:\\Apps\\Codex.exe', 'C:\\Apps\\Claude.lnk']);
});

test('MSIX artwork comes from the matching Application, including scale-qualified assets', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'asterlink-msix-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const pkg = path.join(dir, 'WindowsApps', 'Example.App');
  await fs.mkdir(path.join(pkg, 'app'), { recursive: true }); await fs.mkdir(path.join(pkg, 'assets'));
  await fs.writeFile(path.join(pkg, 'AppxManifest.xml'), '<Package><Applications><Application Executable="other.exe"><uap:VisualElements Square44x44Logo="assets/wrong.png"/></Application><Application Executable="app/Test.exe"><uap:VisualElements Square44x44Logo="assets/icon.png"/></Application></Applications></Package>');
  const asset = path.join(pkg, 'assets/icon.scale-200.png'); await fs.writeFile(asset, 'fixture');
  assert.equal(await findPackagedIcon(path.join(pkg, 'app/Test.exe')), asset);
  assert.equal(await findPackagedIcon(path.join(pkg, 'app/Missing.exe')), '');
});
test('MSIX icon paths cannot escape the owning package directory', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'asterlink-msix-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const pkg = path.join(dir, 'WindowsApps', 'Example.App'); await fs.mkdir(pkg, { recursive: true });
  await fs.writeFile(path.join(pkg, 'AppxManifest.xml'), '<Application Executable="Test.exe"><uap:VisualElements Square44x44Logo="../../outside.png"/></Application>');
  assert.equal(await findPackagedIcon(path.join(pkg, 'Test.exe')), '');
});
