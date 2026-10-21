const { test } = require('node:test');
const assert = require('node:assert/strict');
const { dedupeMiniItems } = require('../app/mini-targets');

function item(charId, agent = 'Codex', running = true) {
  return { key: charId + '::' + agent, charId, name: charId, agent, running };
}

test('multiple characters bound to Codex share one clickable launcher entry', () => {
  const items = dedupeMiniItems([item('GPT'), item('MiMo')], () => 'C:\\Apps\\Codex.exe');
  assert.equal(items.length, 1);
  assert.equal(items[0].charId, 'GPT');
  assert.equal(items[0].agent, 'Codex');
  assert.equal(items[0].key, 'GPT::Codex');
  assert.deepEqual(items[0].names, ['GPT', 'MiMo']);
});
test('aliases and Windows path spelling variations resolve to the same target', () => {
  const inputs = [item('GPT', 'Codex', false), item('MiMo', 'My Codex')];
  const items = dedupeMiniItems(inputs, name => name === 'Codex' ? ' C:\\Apps\\Codex.exe ' : 'c:/apps/codex.exe');
  assert.equal(items.length, 1);
  assert.equal(items[0].running, true);
  assert.equal(inputs[0].running, false, 'do not mutate source state');
});
test('same executable filename in different locations remains distinct', () => {
  const items = dedupeMiniItems([item('GPT', 'Codex'), item('MiMo', 'Codex Dev')], name => name === 'Codex' ? 'C:\\Apps\\Codex.exe' : 'D:\\Dev\\Codex.exe');
  assert.equal(items.length, 2);
});
test('missing paths deduplicate by agent identity without merging unrelated agents', () => {
  const items = dedupeMiniItems([item('GPT'), item('MiMo'), item('Claude', 'Claude')], () => '');
  assert.equal(items.length, 2);
  assert.deepEqual(items.map(x => x.agent), ['Codex', 'Claude']);
});
test('protocol targets keep distinct paths and query parameters', () => {
  const targets = { one: 'codex://launch/Profile?mode=a', same: 'codex://launch/Profile?mode=a', two: 'codex://launch/profile?mode=a', three: 'codex://launch/Profile?mode=b' };
  assert.equal(dedupeMiniItems(Object.keys(targets).map(name => item(name, name)), name => targets[name]).length, 3);
});
test('empty candidates stay empty and a removed representative can be replaced', () => {
  assert.deepEqual(dedupeMiniItems([], () => ''), []);
  const items = dedupeMiniItems([item('MiMo')], () => 'C:\\Apps\\Codex.exe');
  assert.equal(items[0].charId, 'MiMo');
  assert.equal(items[0].key, 'MiMo::Codex');
});
