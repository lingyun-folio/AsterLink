const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../app/config-store.js'), 'utf8');
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'asterlink-config-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    require: name => name === 'electron' ? { app: { getPath: () => dir } } : require(name),
  }, { filename: 'config-store.js' });
  return { store: module.exports, dir, file: path.join(dir, 'config.json') };
}
test('first run and damaged configuration fall back without touching real user data', t => {
  const { store, file } = fixture(t);
  assert.equal(store.load(), null);
  fs.writeFileSync(file, '{broken');
  assert.equal(store.load(), null);
});
test('configuration survives a save and reload', t => {
  const { store } = fixture(t);
  const cfg = { version: 2, characters: [{ id: 'fox', agents: ['Example'] }], agents: [{ name: 'Example', path: '' }] };
  assert.equal(store.save(cfg), true);
  assert.equal(JSON.stringify(store.load()), JSON.stringify(cfg));
});
test('schema upgrade preserves the exact previous file', t => {
  const { store, file, dir } = fixture(t);
  const old = '{"version":1,"characters":[{"id":"fox","agent":"Example"}]}';
  fs.writeFileSync(file, old);
  assert.equal(store.save({ version: 2, characters: [] }), true);
  assert.equal(fs.readFileSync(path.join(dir, 'config.v1.bak.json'), 'utf8'), old);
  assert.equal(store.save({ version: 2, characters: [{ id: 'fox' }] }), true);
  assert.equal(fs.readFileSync(path.join(dir, 'config.v1.bak.json'), 'utf8'), old);
});
test('write failure is reported to the caller', t => {
  const { store, file } = fixture(t);
  fs.mkdirSync(file);
  assert.equal(store.save({ version: 2, characters: [] }), false);
});

