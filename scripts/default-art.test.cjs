const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../app/renderer.js'),'utf8');
const defaults=vm.runInNewContext('const ART="art/";'+source.slice(source.indexOf('const DEFAULT_CHARACTERS'),source.indexOf('/* ================= 默认 Agent'))+';DEFAULT_CHARACTERS');
const start=source.indexOf('function charAgentList('),end=source.indexOf('/* ================= 配置持久化');
const normalize=vm.runInNewContext('const ART="art/";'+source.slice(start,end)+';normalizeCharacter');
test('factory artwork uses DeepSeek and MiMo, with mystery for every other character',()=>{
 for(const c of defaults){assert.equal(c.img,'art/'+(c.id==='deepseek'?'Deepseek.png':c.id==='mimo'?'MiMo.png':'mystery.png'));assert(fs.existsSync(path.join(__dirname,'../app',c.img)));}
});
test('old shared and placeholder defaults migrate without changing imported artwork',()=>{
 for(const id of ['deepseek','mimo','claude'])for(const img of ['art/lumi.png','art/mystery.png','art/companion.png']) assert.equal(normalize({id,img}).img,'art/'+(id==='deepseek'?'Deepseek.png':id==='mimo'?'MiMo.png':'mystery.png'));
 for(const img of ['file:///D:/my.png','data:image/png;base64,abc','art/lumi.png'])assert.equal(normalize({id:'custom-a',custom:true,img}).img,img);
 assert.equal(normalize({id:'deepseek',img:'file:///D:/personal.png'}).img,'file:///D:/personal.png');
});
