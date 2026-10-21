const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createLoginItems } = require('../app/login-items');
function fixture(packaged = true) {
  let stored, blocked = false, fail = false;
  const app = {
    isPackaged: packaged, getAppPath: () => 'D:\\Apps with spaces\\星契',
    setLoginItemSettings(settings) { if(fail) throw Error('access denied'); stored = settings; blocked = false; },
    getLoginItemSettings(options) {
      const matches = stored && options?.path === stored.path && JSON.stringify(options?.args) === JSON.stringify(stored.args);
      return { openAtLogin: !!(matches && stored.openAtLogin), launchItems: stored ? [{ name: stored.name, enabled: !blocked }] : [] };
    }
  };
  const login = createLoginItems(app, { execPath: 'D:\\Apps with spaces\\星契.exe', portableExecutable: '' });
  return { app, login, stored:()=>stored, block:()=>{blocked=true}, fail:()=>{fail=true} };
}
test('enable, fresh read, disable and another read agree for the hidden launch command',()=>{
  const f=fixture(); assert.equal(f.login.get().openAtLogin,false);
  assert.deepEqual(f.login.set(true),{openAtLogin:true}); assert.equal(f.login.get().openAtLogin,true);
  assert.equal(f.app.getLoginItemSettings().openAtLogin,false); // Reproduces the old missing-args bug.
  assert.deepEqual(f.stored().args,['--hidden']);
  assert.deepEqual(f.login.set(false),{openAtLogin:false}); assert.equal(f.login.get().openAtLogin,false);
});
test('development paths with spaces are quoted and survive readback',()=>{
  const f=fixture(false); assert.equal(f.login.set(true).openAtLogin,true);
  assert.equal(f.stored().args[0],'"'+f.app.getAppPath()+'"');
});
test('Windows-disabled entry reads as off and can be enabled again',()=>{
  const f=fixture();f.login.set(true);f.block();assert.equal(f.login.get().openAtLogin,false);
  assert.equal(f.login.set(true).openAtLogin,true);
});
test('write failures preserve the actual state and report an error',()=>{
  const f=fixture();f.fail();const result=f.login.set(true);assert.equal(result.openAtLogin,false);assert.match(result.error,/access denied/);
});
test('portable startup points at the persistent executable instead of the extracted temp executable',()=>{
  const f=fixture(); const login=createLoginItems(f.app,{portableExecutable:'D:\\Tools\\AsterLink-portable.exe'});
  assert.equal(login.set(true).openAtLogin,true);assert.equal(f.stored().path,'D:\\Tools\\AsterLink-portable.exe');
});
