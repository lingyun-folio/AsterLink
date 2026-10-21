const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const name = process.argv[2] || 'AsterLink';
if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) throw new Error('Provide a folder name, not a path.');
const destination = path.join(root, '.local/github-upload', name);
// An explicit allowlist prevents archives, generated previews or credentials
// from entering the upload folder even before a Git repository is initialized.
const roots = ['.github', '.gitignore', '.gitattributes', 'LICENSE', 'README.md', 'README.en.md', 'CONTRIBUTING.md', 'SECURITY.md', 'THIRD_PARTY_NOTICES.md', 'CHANGELOG.md', 'LICENSES', 'app', 'docs', 'scripts'];
const blocked = new Set(['node_modules', 'dist', '.local', '.git']);
const files = [];
function collect(source) {
  const stat = fs.lstatSync(source);
  if (stat.isSymbolicLink()) throw new Error('Refusing to export a symbolic link: ' + source);
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(source)) if (!blocked.has(name)) collect(path.join(source, name));
    return;
  }
  if (/\.(exe|asar|zip|7z|blockmap|log|pem|pfx|p12|key)$/i.test(source) || /-qa-.*\.png$/.test(source)) return;
  if (source.endsWith('.html') && source.includes(path.join('docs', 'project-introduction'))) return;
  if (/^\.env(?:\.|$)/.test(path.basename(source)) || /^config(?:\.v\d+\.bak)?\.json$/.test(path.basename(source))) return;
  files.push(source);
}
for (const entry of roots) collect(path.join(root, entry));
if (fs.existsSync(destination)) throw new Error('Upload folder already exists. Review or rename it before exporting again: ' + destination);
for (const file of files) {
  const target = path.join(destination, path.relative(root, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
const manifest = files.map(file => ({ path: path.relative(root, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') }));
fs.writeFileSync(path.join(root, '.local/github-upload', name + '-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`Exported ${files.length} files (${(manifest.reduce((sum, f) => sum + f.bytes, 0) / 1024 / 1024).toFixed(2)} MiB) to ${destination}`);
