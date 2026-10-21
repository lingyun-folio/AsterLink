const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
function fixture(t, alpha = 255) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'asterlink-custom-icon-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const bytes = Buffer.alloc(33); Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes); bytes.writeUInt32BE(256,16); bytes.writeUInt32BE(256,20);
  const source = path.join(dir,'source.png'); fs.writeFileSync(source, bytes);
  const image = { isEmpty:()=>false, toBitmap:()=>Buffer.from([10,20,30,alpha]), toPNG:()=>bytes, resize:()=>image };
  const module = { exports:{} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app/custom-agent-icons.js'),'utf8'), { module, Buffer, require:name=>name==='electron'?{nativeImage:{createFromBuffer:()=>image}}:require(name) });
  return { dir, source, ...module.exports };
}
test('custom icon is copied locally and can be read after the original is removed', t=>{
  const f=fixture(t), result=f.importAgentIcon(f.source,f.dir); fs.unlinkSync(f.source);
  assert.match(result.customIcon,/^[0-9a-f-]{36}\.png$/);
  assert.equal(f.readAgentIcon(result.customIcon,f.dir),result.icon);
});
test('custom icon handles invalid, oversized and invisible images', t=>{
  const f=fixture(t); fs.writeFileSync(f.source,'not png'); assert.throws(()=>f.importAgentIcon(f.source,f.dir),/PNG/);
  fs.writeFileSync(f.source,Buffer.alloc(2*1024*1024+1));assert.throws(()=>f.importAgentIcon(f.source,f.dir),/2 MB/);
  const invisible=fixture(t,0);assert.throws(()=>invisible.importAgentIcon(invisible.source,invisible.dir),/完全透明/);
});
test('custom icon rejects out-of-range dimensions and arbitrary filesystem references', t=>{
  const f=fixture(t);const b=fs.readFileSync(f.source);b.writeUInt32BE(4096,16);fs.writeFileSync(f.source,b);
  assert.throws(()=>f.importAgentIcon(f.source,f.dir),/16–2048/);
  for(const ref of ['../../secret.png','C:\\private.png','file:///private.png','',null])assert.equal(f.readAgentIcon(ref,f.dir),'');
});
test('deleted custom icon falls back without throwing', t=>{
  const f=fixture(t),result=f.importAgentIcon(f.source,f.dir);fs.unlinkSync(path.join(f.dir,'agent-icons',result.customIcon));
  assert.equal(f.readAgentIcon(result.customIcon,f.dir),'');
});
