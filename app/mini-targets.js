const path = require('node:path');

function targetKey(target, agentName) {
  const value = String(target || '').trim();
  // Unconfigured agents must not all collapse into one empty-path entry.
  if (!value) return 'agent:' + agentName;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[a-z]:[\\/]/i.test(value)) {
    try { return 'uri:' + new URL(value).href; } catch (_) { return 'uri:' + value; }
  }
  // Windows executable/shortcut paths are case-insensitive. Keep the full
  // path so two unrelated programs named Codex.exe remain separate targets.
  return 'file:' + path.win32.normalize(value).toLowerCase();
}

function dedupeMiniItems(items, resolveTarget) {
  const targets = new Map();
  for (const item of items) {
    const key = targetKey(resolveTarget(item.agent), item.agent);
    const existing = targets.get(key);
    if (!existing) {
      targets.set(key, { ...item, names: [item.name] });
    } else {
      existing.running = existing.running || item.running;
      if (!existing.names.includes(item.name)) existing.names.push(item.name);
    }
  }
  return [...targets.values()];
}

module.exports = { dedupeMiniItems };
