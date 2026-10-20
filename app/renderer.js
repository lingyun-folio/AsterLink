/* 星契 · AsterLink — 渲染进程 */
const ART = "art/"; // Public edition uses project-generated artwork.
// Older local configurations may refer to artwork omitted from the public edition.
document.addEventListener("error", event => {
  const img = event.target;
  if (img instanceof HTMLImageElement && /^(art\/|file:)/.test(img.getAttribute("src") || "")
      && img.getAttribute("src") !== ART + "lumi.png") {
    img.src = ART + "lumi.png";
  }
}, true);
const isDesktop = !!(window.aether && window.aether.launch);

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ================= 默认角色数据（连接配置的出厂值） ================= */
const DEFAULT_CHARACTERS = [
  {
    id:"deepseek", name:"深语 · DeepSeek",
    color:"#4E86D8", img:ART+"lumi.png",
    agent:"DeepSeek Harness",
    anim:"circle", home:false,
    quotes:["深海的数据，已为你调齐。","出发吧，DeepSeek Harness 已经在等了。","今天想从哪里开始？"]
  },
  {
    id:"claude", name:"暖昼 · Claude",
    color:"#D97A52", img:ART+"lumi.png",
    agent:"Claude",
    anim:"streak", home:false,
    quotes:["阳光正好，来干活吧。","别急，我先把思路理一理。","交给我，慢慢来比较快。"]
  },
  {
    id:"chatgpt", name:"星璇 · ChatGPT",
    color:"#A08CE8", img:ART+"lumi.png",
    agent:"",
    anim:"warp", home:false,
    quotes:["星璇就位，随时可以开始。","把问题给我，答案很快就来。","今天也一起创造点什么吧。"]
  },
  {
    id:"gemini", name:"双子 · Gemini",
    color:"#7C5CE0", img:ART+"lumi.png",
    agent:"",
    anim:"circle", home:false,
    quotes:["两颗星，一起想。","灵感这种东西，我这里有备份。","让我们并行处理吧。"]
  },
  {
    id:"kimi", name:"月见 · Kimi",
    color:"#8FA8D8", img:ART+"lumi.png",
    agent:"",
    anim:"streak", home:false,
    quotes:["月色安静，思路清晰。","长文档就放心交给我。","夜里也随时在。"]
  },
  {
    id:"qwen", name:"云绮 · Qwen",
    color:"#5C5CBE", img:ART+"lumi.png",
    agent:"",
    anim:"warp", home:false,
    quotes:["云端的算力，随叫随到。","文档、翻译、代码，我都可以。","要一起上云看看吗？"]
  },
  {
    id:"glm", name:"青函 · GLM",
    color:"#6B72A8", img:ART+"lumi.png",
    agent:"",
    anim:"circle", home:false,
    quotes:["知识之书，已经翻开了。","需要我念一段咒语吗？","文献和代码都在掌握中。"]
  },
  {
    id:"grok", name:"赤刃 · Grok",
    color:"#C0555C", img:ART+"lumi.png",
    agent:"",
    anim:"streak", home:false,
    quotes:["宇宙级难题？正合我意。","幽默感和算力，我都有。","放马过来吧。"]
  },
  {
    id:"mistral", name:"焰风 · Mistral",
    color:"#E07048", img:ART+"lumi.png",
    agent:"",
    anim:"warp", home:false,
    quotes:["法式效率，现在出发。","灵感像南风一样到了。","来杯咖啡的功夫就能搞定。"]
  },
  {
    id:"muse", name:"白绒 · Muse",
    color:"#8FB4E8", img:ART+"lumi.png",
    agent:"",
    anim:"circle", home:false,
    quotes:["……困困的，但可以陪你。","想象力无限，借你一点。","软软的，也能想很深的问题。"]
  },
  {
    id:"seed", name:"种子 · Seed",
    color:"#6E7BE8", img:ART+"lumi.png",
    agent:"",
    anim:"streak", home:false,
    quotes:["灵感发芽啦！","今天想种下什么想法？","好奇心是种子，我来浇水。"]
  },
  {
    id:"minimax", name:"海螺 · MiniMax",
    color:"#E8896A", img:ART+"lumi.png",
    agent:"",
    anim:"warp", home:false,
    quotes:["出发！今天也要元气满满！","小小的身体，大大的算力。","海螺虽小，声音很响哦。"]
  },
  {
    id:"ernie", name:"文心 · ERNIE",
    color:"#4A55B8", img:ART+"lumi.png",
    agent:"",
    anim:"circle", home:false,
    quotes:["文献都整理好了……咳，一起看吧。","知识的点滴，我来汇聚。","慢慢来，答案都在书里。"]
  },
  {
    id:"hunyuan", name:"元宝 · Hunyuan",
    color:"#C94F45", img:ART+"lumi.png",
    agent:"",
    anim:"streak", home:false,
    quotes:["账算得清，活也办得妥。","有什么要办的，尽管说。","家大业大，办事利落。"]
  },
  {
    id:"mimo", name:"炽羽 · MiMo",
    color:"#FF7A3D", img:ART+"MiMo.png",
    agent:"",
    anim:"warp", home:false,
    quotes:["全息面板已展开，开工吧！","放心交给我，跑得又快又稳～","今天想做点什么？我随时待命！"]
  }
];

/* ================= 默认 Agent 注册表（设置 · agent 路径的出厂值） ================= */
const DEFAULT_AGENTS = [
  { name:"Codex", path:"", resident:false },
  { name:"Claude", path:"", resident:false },
  { name:"DeepSeek Harness", path:"", resident:false },
  { name:"WorkBuddy", path:"", resident:false },
];

/* ================= 状态 ================= */
const DEFAULT_CC_SWITCH_PATH = ""; // Optional external utility; users choose its path.
let agents = [];       // agent 注册表：[{ name, path, resident }]，设置页维护
let characters = [];
let selected = null;   // 聚焦查看的卡片：{ c, agent }
let agentState = {};   // 各 Agent 进程是否在跑：{ [name]: boolean }，由主进程轮询推送
let launching = false;
let animScale = 1;
let closeToTray = true; // 关闭窗口后驻留系统托盘（主进程也读配置里的同名项）
let ccSwitchPath = DEFAULT_CC_SWITCH_PATH; // 全局 CC Switch 路径（设置页配置）
let miniLayout = "vertical"; // 已召唤小窗方向：vertical / horizontal
let miniPinned = false;      // 已召唤小窗位置固定（不可拖动）
let agentListOpen = false; // 设置页 agent 配置列表展开状态
let expandedConfigId = null; // 连接配置中当前展开的星灵详情

/* ================= 角色 ↔ Agent：一个角色可挂多个 Agent ================= */
// 统一取法，兼容老存档里的单个 agent 字符串字段。
function charAgentList(c){
  if(Array.isArray(c && c.agents)) return c.agents.filter(Boolean);
  return (c && typeof c.agent === "string" && c.agent) ? [c.agent] : [];
}
// 迁移成新结构：删掉老的 agent 字段，统一成 agents 数组。
function normalizeCharacter(c){
  const { agent, ...rest } = c || {};
  // Migrate bundled historical artwork and the temporary shared fox image.
  // Preserve unrelated custom paths; missing images fall back through the handler above.
  const previousArtwork = /^art\/(?:companion|ChatGPT|Claude|Deepseek|Gemini|GLM|Grok|Hunyuan|Kimi|MiMo|minimax|Mistral|Muse|Qwen|Seed|文心一言)\.png$/i;
  if(previousArtwork.test(String(rest.img || ""))) {
    rest.img = ART + (rest.id === "mimo" ? "MiMo.png" : "lumi.png");
  }
  return { ...rest, agents: charAgentList(c) };
}

/* ================= 配置持久化 ================= */
function currentConfig(){
  return {
    version: 2,   // v2：characters[].agent（单个）→ characters[].agents（多选）
    agents,
    characters,
    settings: {
      theme: document.body.dataset.theme === "light" ? "light" : "dark",
      animScale,
      closeToTray,
      ccSwitchPath,
      miniLayout,
      miniPinned,
    },
  };
}
async function persist(){
  if(!isDesktop) return;
  try {
    if(!await window.aether.setConfig(currentConfig())) toast("配置保存失败，请检查磁盘空间和目录权限。");
  } catch (_) { toast("配置保存失败，请稍后重试。"); }
}
let persistTimer;
const persistSoon = ()=>{ clearTimeout(persistTimer); persistTimer = setTimeout(persist, 250); };

/* ================= 角色大厅渲染（按数量自适应单排/双排） ================= */
// 一张卡 = 一个 (角色, Agent) 组合：同一个角色挂两个 Agent 时在大厅占两张卡
function rosterCards(){
  const out = [];
  for(const c of characters){
    if(!c.home) continue;
    const list = charAgentList(c);
    if(!list.length){ out.push({ c, agent:"" }); continue; }
    for(const a of list) out.push({ c, agent:a });
  }
  return out;
}

/* Agent 名称 → 图标文件名：小写、空格换连字符（DeepSeek Harness → deepseek-harness.png） */
function agentIcon(name){
  const slug = String(name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug ? `agent-icons/${slug}.png` : "";
}

function cardHTML(c, agent, i){
  const running = !!agentState[agent];
  const icon = agent ? agentIcon(agent) : "";
  return `
    <button class="char-card${running?" running":""}" style="--i:${i};--c:${c.color}"
            data-id="${c.id}" data-agent="${esc(agent)}"
            aria-label="召唤 ${esc(c.name)}${agent?" · "+esc(agent):""}">
      <div class="art-holder">
        ${icon ? `<span class="agent-badge" title="${esc(agent)}">
          <img src="${icon}" alt="${esc(agent)}" draggable="false">
        </span>` : ""}
        <div class="art-wrap"><img src="${esc(c.img)}" alt="${esc(c.name)}" draggable="false"></div>
      </div>
      <div class="char-name">${esc(c.name)}</div>
      <div class="char-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14l-2.5 2.5a3.2 3.2 0 01-4.5-4.5L6 8"/><path d="M15 10l2.5-2.5a3.2 3.2 0 014.5 4.5L18 16"/></svg>
        ${esc(agent || "未指定 Agent")}
        ${running ? `<i class="run-dot" title="运行中"></i>` : ""}
      </div>
    </button>`;
}

/* 徽标贴住立绘的右上角：立绘宽度由图片自身比例决定（卡片比图宽），只能量出来再定位 */
function positionBadges(){
  const box = $("#roster-cards");
  if(!box) return;
  box.querySelectorAll(".char-card").forEach(card=>{
    const badge = card.querySelector(".agent-badge");
    if(!badge) return;
    const holder = card.querySelector(".art-holder");
    const img = card.querySelector(".art-wrap img");
    if(!holder || !img || !img.naturalWidth || !holder.offsetWidth){
      badge.style.visibility = "hidden";   // 图还没加载完 / 视图隐藏时先不显示
      return;
    }
    const h = holder.getBoundingClientRect();
    const i = img.getBoundingClientRect();
    const bw = badge.offsetWidth || 32;
    badge.style.right = "auto";
    badge.style.left = Math.round(i.right - h.left - bw - 1) + "px";
    badge.style.top  = Math.round(i.top - h.top + 2) + "px";
    badge.style.visibility = "";
  });
}

function renderRoster(){
  const cards = rosterCards();
  const box = $("#roster-cards"), empty = $("#roster-empty");
  if(selected && !cards.some(v=>v.c===selected.c && v.agent===selected.agent)) closeFocus(true);
  if(!cards.length){
    box.innerHTML = "";
    empty.hidden = false;
    $("#roster").style.removeProperty("--cw");
    box.style.removeProperty("width");
    return;
  }
  empty.hidden = true;
  box.innerHTML = cards.map((v,i)=>cardHTML(v.c, v.agent, i)).join("");
  // 没配图标的 Agent（新加的、或图标文件名对不上）直接不显示徽标，不留裂图
  box.querySelectorAll(".agent-badge img").forEach(img=>{
    img.addEventListener("error", ()=>{ const b = img.closest(".agent-badge"); if(b) b.remove(); });
    if(img.complete && img.naturalWidth === 0){ const b = img.closest(".agent-badge"); if(b) b.remove(); }
  });
  box.querySelectorAll(".char-card").forEach(btn=>{
    const c = characters.find(x=>x.id===btn.dataset.id);
    const agent = btn.dataset.agent || "";
    let clickTimer = null;
    // 单击 → 聚焦详情；双击 → 直接召唤（单击延时 220ms 等待双击判定）
    btn.addEventListener("click",()=>{
      if(launching) return;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(()=>openFocus(c, agent), 220);
    });
    btn.addEventListener("dblclick",()=>{
      clearTimeout(clickTimer);
      if(launching) return;
      summon(c, agent);
    });
  });
  layoutRoster();
  positionBadges();
  // 立绘是异步加载的，加载完成后再贴一次
  box.querySelectorAll(".art-wrap img").forEach(img=>{
    if(!img.complete) img.addEventListener("load", positionBadges, { once:true });
  });
}

/* 只更新卡片上的运行小点，不整块重排（聚焦态/动画期间重排会闪） */
function refreshCardDots(){
  $$("#roster-cards .char-card").forEach(btn=>{
    const on = !!agentState[btn.dataset.agent || ""];
    btn.classList.toggle("running", on);
    const link = btn.querySelector(".char-link");
    if(!link) return;
    let dot = link.querySelector(".run-dot");
    if(on && !dot){
      dot = document.createElement("i");
      dot.className = "run-dot";
      dot.title = "运行中";
      link.appendChild(dot);
    } else if(!on && dot){
      dot.remove();
    }
  });
}

/* 行列：每行最多 6 张，一页最多两排，再多就纵向滚动。
   行列只由卡片数量决定，窗口大小只影响缩放——最小化到最大化是整体等比放大。
   卡宽取整数，保证每行恰好放满：带小数时四张卡会因 0.2px 溢出被挤到下一行，
   连锁产生多余行和纵向越界。 */
const CARDS_PER_ROW_MAX = 6;
const VISIBLE_ROWS_MAX = 2;
function planLayout(n, usable, availableH, labelH){
  const GAPX = 10, GAPY = 12;
  const MAXW = 360;   // 单卡上限，避免超宽屏上大得离谱
  const rows = n <= CARDS_PER_ROW_MAX ? 1 : Math.ceil(n / CARDS_PER_ROW_MAX);
  const perRow = Math.ceil(n / rows);
  // 卡尺寸按「一页能看到几排」算，多出来的排数靠滚动
  const visibleRows = Math.min(rows, VISIBLE_ROWS_MAX);
  const widthCap = (usable - GAPX * (perRow - 1)) / perRow;
  // 0.97 是给测量误差留的余量，避免刚好顶到边界
  const heightCap = ((availableH * 0.97 - GAPY * (visibleRows - 1)) / visibleRows - labelH) * 3 / 4;
  return { perRow, rows, visibleRows, cw: Math.max(40, Math.floor(Math.min(MAXW, widthCap, heightCap))) };
}

/* 数量自适应：根据实际数量、可用宽度和高度决定行列数，并把卡片放大到合适尺寸。 */
function layoutRoster(){
  const roster = $("#roster"), box = $("#roster-cards");
  const cards = box.querySelectorAll(".char-card");
  const n = cards.length;

  // 先还原到默认卡宽，避免被上一次布局的尺寸影响测量
  roster.style.removeProperty("--cw");
  if(!n){
    box.style.removeProperty("width");
    return;
  }

  const firstArtH = cards[0].querySelector(".art-wrap")?.offsetHeight || 0;
  const measuredLabelH = cards[0].offsetHeight - firstArtH;
  const labelH = measuredLabelH > 20 ? measuredLabelH : 48;

  // 滚动条槽位是常驻的（CSS scrollbar-gutter:stable both-edges），所以这里量到的值稳定；
  // 可用宽度要扣掉槽位，再留 2px 亚像素余量，否则 4 张卡差 0.4px 就会挤到下一行
  const gutter = Math.max(0, box.offsetWidth - box.clientWidth);
  const usable = roster.clientWidth - 44 - gutter - 2;
  const availableH = roster.clientHeight - 8;
  if(usable <= 0 || availableH <= 0) return;

  const plan = planLayout(n, usable, availableH, labelH);
  roster.style.setProperty("--cw", plan.cw + "px");
  box.style.width = (plan.perRow * plan.cw + (plan.perRow - 1) * 10 + gutter + 2) + "px";
  // 需要滚动时从顶部开始排：居中对齐会把上面几排顶到可滚动区域之外（offsetTop 变负数）
  box.style.alignContent = plan.rows > plan.visibleRows ? "start" : "center";
}
/* ================= 聚焦详情（单击星灵：其他角色消失、角色左移放大、详情从右滑入） ================= */
function agentByName(name){ return agents.find(a=>a.name===name) || null; }

function fillFocus(c, agent){
  $("#focus-char").innerHTML = `
    <div class="focus-art"><img src="${esc(c.img)}" alt="${esc(c.name)}" draggable="false"></div>
    <div class="focus-char-name">${esc(c.name)}</div>`;
  $("#focus-char").style.setProperty("--c", c.color);
  $("#focus-char").title = "单击推回，恢复阵容";
  $("#focus-name").textContent = c.name;
  $("#focus-quote").textContent = `「${c.quotes[0] || ""}」`;
  // 只列这个角色自己配置的 Agent；一个都没配时回退到全量名单，方便临时换
  const own = charAgentList(c);
  const list = own.length ? agents.filter(a=>own.includes(a.name)) : agents;
  const sel = $("#focus-agent");
  sel.innerHTML = (own.length ? "" : `<option value="">选择 Agent…</option>`) +
    list.map(a=>`<option value="${esc(a.name)}"${agent===a.name?" selected":""}>${esc(a.name)}</option>`).join("");
  $("#focus-summon").style.setProperty("--c", c.color);
  updateFocusSummon();
}

/* 详情页召唤按钮：Agent 已在运行 → 灰显并显示「运行中」 */
function updateFocusSummon(){
  const btn = $("#focus-summon");
  if(!btn) return;
  const name = selected ? selected.agent : "";
  const running = !!(name && agentState[name]);
  btn.disabled = running;
  btn.classList.toggle("running", running);
  $("#focus-summon-app").textContent = running ? "运行中" : (name || "Agent");
  btn.title = running ? `${name} 已在运行` : (name ? `召唤 ${name}` : "请先选择 Agent");
}

function openFocus(c, agent){
  if(!c || launching) return;
  selected = { c, agent: agent || "" };
  const overlay = $("#stage-focus");
  const fchar = $("#focus-char");
  fillFocus(c, agent || "");
  overlay.hidden = false;
  $("#roster").classList.add("focusing");

  // FLIP：从卡片当前位置过渡到「左侧 1/3 大小」的最终位
  const card = $(`#roster-cards .char-card[data-id="${c.id}"][data-agent="${CSS.escape(agent || "")}"]`);
  const to = fchar.getBoundingClientRect();
  if(card && to.width > 0){
    const from = card.getBoundingClientRect();
    const scale = from.width / to.width;
    const dx = (from.left + from.width/2) - (to.left + to.width/2);
    const dy = (from.top + from.height/2) - (to.top + to.height/2);
    fchar.style.transition = "none";
    fchar.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    void fchar.offsetHeight; // reflow 锁定起点
    fchar.style.transition = "transform .52s cubic-bezier(.22,.8,.26,1)";
  }
  fchar.style.transform = "translate(0,0) scale(1)";
  requestAnimationFrame(()=>overlay.classList.add("go"));
}

function closeFocus(immediate){
  const overlay = $("#stage-focus");
  if(!overlay || overlay.hidden) return;
  const prev = selected;
  selected = null;
  const fchar = $("#focus-char");
  overlay.classList.remove("go");
  $("#roster").classList.remove("focusing");
  const card = (prev && !immediate)
    ? $(`#roster-cards .char-card[data-id="${prev.c.id}"][data-agent="${CSS.escape(prev.agent || "")}"]`)
    : null;
  if(card && fchar.getBoundingClientRect().width > 0){
    const to = fchar.getBoundingClientRect();
    const from = card.getBoundingClientRect();
    const scale = from.width / to.width;
    const dx = (from.left + from.width/2) - (to.left + to.width/2);
    const dy = (from.top + from.height/2) - (to.top + to.height/2);
    fchar.style.transition = "transform .42s cubic-bezier(.4,0,.2,1)";
    fchar.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
  }
  setTimeout(()=>{
    overlay.hidden = true;
    fchar.style.transition = "";
    fchar.style.transform = "";
    fchar.innerHTML = "";
  }, immediate ? 0 : 430);
}

/* ================= 小工具：HTML 转义 ================= */
const esc = s => String(s).replace(/[&<>"]/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));

/* ================= 连接配置渲染 ================= */
const ANIM_LABELS = {
  circle: "魔法阵召唤",
  streak: "光速传送",
  warp: "星际跃迁",
};

function configOrder(){
  // 主页阵容优先；同一分组内保持原始顺序，避免每次渲染跳动。
  return characters
    .map((c, index) => ({ c, index }))
    .sort((a, b) => Number(!!b.c.home) - Number(!!a.c.home) || a.index - b.index)
    .map(item => item.c);
}

function closeConfigDetails(){
  $$("#link-list .link-body").forEach(body => { body.hidden = true; });
  $$("#link-list .link-summary").forEach(btn => btn.setAttribute("aria-expanded", "false"));
  $$("#link-list .link-row").forEach(row => row.classList.remove("expanded"));
}

function renderConfig(){
  $("#link-list").innerHTML = configOrder().map(c=>{
    const expanded = expandedConfigId === c.id;
    return `
    <div class="link-row${c.home?" home-on":""}${expanded?" expanded":""}" style="--c:${c.color}" data-id="${c.id}">
      <div class="link-summary-row">
        <button class="link-summary" type="button" data-act="expand" aria-expanded="${expanded}" aria-controls="link-detail-${c.id}">
          <span class="link-chip"><img src="${esc(c.img)}" alt=""></span>
          <span class="link-identity">
            <b>${esc(c.name)}</b>
          </span>
          <span class="link-brief">
            <b>${esc(charAgentList(c).join(" / ") || "未指定 Agent")}</b>
            <span>召唤 Agent</span>
          </span>
          <svg class="link-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>
        </button>
        <div class="link-head-actions">
          <button class="switch${c.home?" on":""}" data-home aria-pressed="${!!c.home}" title="是否加入主页阵容"></button>
          <em>主页</em>
        </div>
      </div>

      <div class="link-body" id="link-detail-${c.id}"${expanded?"":" hidden"}>
        <div class="field field-wide">
          <label>召唤 Agent（可多选 · 来自设置 · agent 配置）</label>
          <div class="agent-checks">
            ${agents.length ? agents.map(a=>{
              const on = charAgentList(c).includes(a.name);
              return `
              <label class="agent-chk${on?" on":""}">
                <input type="checkbox" value="${esc(a.name)}" data-agent-chk${on?" checked":""}>
                <span>${esc(a.name)}</span>
              </label>`;
            }).join("") : `<span class="hint">还没有配置任何 Agent，去「设置 · agent 配置」新增。</span>`}
          </div>
          <div class="hint">勾选多个时，角色大厅会为每个 Agent 各摆一张卡；名单与程序路径在「设置 · agent 配置」集中维护。</div>
        </div>

        <div class="field">
          <label>召唤动画</label>
          <select data-k="anim">
            <option value="circle"${c.anim==="circle"?" selected":""}>魔法阵召唤</option>
            <option value="streak"${c.anim==="streak"?" selected":""}>光速传送</option>
            <option value="warp"${c.anim==="warp"?" selected":""}>星际跃迁</option>
          </select>
        </div>

        <div class="field field-wide">
          <label>台词池（每行一句，召唤时随机）</label>
          <textarea data-k="quotes" rows="3">${c.quotes.map(esc).join("\n")}</textarea>
        </div>

        <div class="link-actions">
          <button class="btn-mini" data-act="art">编辑形象</button>
          ${c.custom ? '<button class="btn-mini" data-act="delete">删除形象</button>' : '<button class="btn-mini" data-act="reset">恢复默认</button>'}
          <button class="btn-mini primary" data-act="test">测试召唤</button>
        </div>
      </div>
    </div>`;
  }).join("");

  $$("#link-list .link-row").forEach(row=>{
    const c = characters.find(x=>x.id===row.dataset.id);
    const summary = row.querySelector(".link-summary");
    const body = row.querySelector(".link-body");

    summary.addEventListener("click", ()=>{
      const willOpen = body.hidden;
      closeConfigDetails();
      body.hidden = !willOpen;
      summary.setAttribute("aria-expanded", String(willOpen));
      row.classList.toggle("expanded", willOpen);
      expandedConfigId = willOpen ? c.id : null;
    });

    row.querySelectorAll("[data-k]").forEach(inp=>{
      inp.addEventListener("change",()=>{
        const k = inp.dataset.k;
        if(k==="quotes") c.quotes = inp.value.split("\n").map(s=>s.trim()).filter(Boolean);
        else c[k] = inp.value;
        persistSoon();
        toast(`已更新 ${c.name} 的${{anim:"召唤动画",quotes:"台词池"}[k] || ""}`);
      });
    });

    // 召唤 Agent 多选：勾上几个，大厅里就有几张卡
    row.querySelectorAll("input[data-agent-chk]").forEach(cb=>{
      cb.addEventListener("change", ()=>{
        c.agents = [...row.querySelectorAll("input[data-agent-chk]")]
          .filter(x=>x.checked).map(x=>x.value);
        row.querySelectorAll(".agent-chk").forEach(l=>{
          l.classList.toggle("on", l.querySelector("input").checked);
        });
        row.querySelector(".link-brief b").textContent = c.agents.join(" / ") || "未指定 Agent";
        // 聚焦面板正看着这个角色时，跟着切到仍然有效的 Agent
        if(selected && selected.c.id === c.id && !c.agents.includes(selected.agent)){
          selected.agent = c.agents[0] || "";
          if(selected.agent) fillFocus(c, selected.agent);
        }
        renderRoster();
        persistSoon();
        toast(c.agents.length
          ? `已更新 ${c.name} 的召唤 Agent：${c.agents.join(" / ")}`
          : `已清空 ${c.name} 的召唤 Agent`);
      });
    });

    row.querySelector("[data-home]").addEventListener("click",()=>{
      c.home = !c.home;
      expandedConfigId = body.hidden ? null : c.id;
      renderRoster();
      renderConfig(); // 切换主页状态后立即按新优先级重排
      persistSoon();
      toast(c.home ? `已把 ${c.name} 加入主页阵容` : `已将 ${c.name} 移出主页阵容`);
    });

    row.querySelector('[data-act="test"]').addEventListener("click",()=>{
      const first = charAgentList(c)[0] || "";
      switchView("stage"); setTimeout(()=>summon(c, first), 120);
    });

    row.querySelector('[data-act="art"]').addEventListener("click",()=>openCharacterEditor(c));
    row.querySelector('[data-act="delete"]')?.addEventListener("click",async ()=>{
      if(!window.confirm(`删除「${c.name}」？会同时从大厅移除，不会删除 Agent 或原始图片。`)) return;
      if(!await saveCharacters(characters.filter(x=>x.id!==c.id))) return;
      if(selected?.c.id === c.id) closeFocus(true);
      expandedConfigId = null;
      renderRoster(); renderConfig(); toast("已删除形象");
    });
    row.querySelector('[data-act="reset"]')?.addEventListener("click",()=>{
      const d = DEFAULT_CHARACTERS.find(x=>x.id===c.id);
      if(!d) return;
      const idx = characters.indexOf(c);
      // 恢复出厂模板，但保留用户的主页开关
      characters[idx] = {...normalizeCharacter(d), home:c.home, quotes:[...d.quotes]};
      expandedConfigId = body.hidden ? null : d.id;
      persistSoon();
      renderRoster();
      renderConfig();
      if(selected && selected.c.id === d.id){
        selected.c = characters[idx];
        if(selected.agent) fillFocus(selected.c, selected.agent); else closeFocus(true);
      }
      toast(`已恢复 ${d.name} 的默认配置`);
    });
  });
}
/* ================= 自定义形象 ================= */
let characterDraft = null;
async function saveCharacters(next){
  clearTimeout(persistTimer);
  try {
    if(!isDesktop || !await window.aether.setConfig({...currentConfig(), characters:next})) {
      toast("形象保存失败，请检查磁盘空间和目录权限。"); return false;
    }
    characters = next;
    return true;
  } catch (_) { toast("形象保存失败，请稍后重试。"); return false; }
}
function openCharacterEditor(c){
  if(!isDesktop || !window.aether.importCharacterArt) { toast("请在桌面应用中导入自定义形象。"); return; }
  characterDraft = c ? {...c} : {id:'custom-'+crypto.randomUUID(), custom:true, img:'', color:'#7c5ce0', name:'', home:true, agents:[], anim:'circle', quotes:[]};
  $("#character-editor-title").textContent = c ? "编辑形象" : "新增形象";
  $("#character-name").value = characterDraft.name;
  $("#character-color").value = characterDraft.color;
  $("#character-editor-error").textContent = "";
  $("#character-preview").hidden = !characterDraft.img;
  $("#character-preview-empty").hidden = !!characterDraft.img;
  if(characterDraft.img) $("#character-preview").src = characterDraft.img;
  else $("#character-preview").removeAttribute('src');
  $("#character-editor").showModal();
  $("#character-name").focus();
}
function bindCharacterEditor(){
  $("#character-add").addEventListener('click',()=>openCharacterEditor());
  $("#character-cancel").addEventListener('click',()=>$("#character-editor").close());
  $("#character-pick").addEventListener('click',async ()=>{
    const btn = $("#character-pick");
    btn.disabled = true; $("#character-save").disabled = true;
    $("#character-editor-error").textContent = "";
    try {
      const result = await window.aether.importCharacterArt();
      if(result.canceled || !$("#character-editor").open) return;
      if(!result.ok) { $("#character-editor-error").textContent = result.error; return; }
      characterDraft.img = result.img;
      $("#character-preview").src = result.img;
      $("#character-preview").hidden = false;
      $("#character-preview-empty").hidden = true;
    } catch (_) { $("#character-editor-error").textContent = "图片导入失败，请重新选择。"; }
    finally { btn.disabled = false; $("#character-save").disabled = false; }
  });
  $("#character-form").addEventListener('submit',async event=>{
    event.preventDefault();
    const name = $("#character-name").value.trim();
    if(!name || !characterDraft.img) { $("#character-editor-error").textContent = "请填写名称并选择透明 PNG 立绘。"; return; }
    const next = {...characterDraft, name, color:$("#character-color").value};
    const index = characters.findIndex(c=>c.id===next.id);
    const list = [...characters];
    if(index < 0) list.push(next); else list[index] = next;
    $("#character-save").disabled = true;
    $("#character-cancel").disabled = true;
    try {
      if(!await saveCharacters(list)) { $("#character-editor-error").textContent = "保存失败，尚未应用更改，请重试。"; return; }
      if(selected?.c.id === next.id) { closeFocus(true); }
      expandedConfigId = next.id;
      renderRoster(); renderConfig();
      $("#character-editor").close();
      toast(index < 0 ? "形象已添加，可在连接配置中勾选 Agent。" : "形象已更新");
      document.querySelector(`[data-id="${next.id}"]`)?.scrollIntoView({block:'nearest'});
    } finally { $("#character-save").disabled = false; $("#character-cancel").disabled = false; }
  });
}
/* ================= 召唤演出 + 真实启动 ================= */
function summon(c, agentName){
  if(launching) return;
  const name = String(agentName || "").trim();
  const agent = agentByName(name);
  const target = agent ? String(agent.path || "").trim() : "";
  const label = name || "Agent";
  if(!target){
    toast(`请先为 ${c.name} 选择召唤 Agent（详情页或连接配置，名单在「设置 · agent 配置」）`);
    return;
  }
  launching = true;
  const launch = $("#launch");
  launch.className = "launch playing anim-" + c.anim;
  launch.style.setProperty("--c", c.color);

  const quote = c.quotes[Math.floor(Math.random()*c.quotes.length)] || "";
  $("#launch-quote").textContent = `「${quote}」`;
  $("#launch-quote").style.setProperty("--c", c.color);
  $("#launch-char").innerHTML = `<img src="${esc(c.img)}" alt="${esc(c.name)}">`;
  $("#launch-char").style.setProperty("--c", c.color);
  $("#s-app").textContent = label;
  $("#s-path").textContent = target;
  $("#s-status").textContent = "正在通过软连接唤醒目标进程…";

  const t = animScale;
  let result = null;
  let animDone = false;
  let settled = false;
  // 确认目标成功打开后收尾：成功退至托盘后台；失败留在前台方便排查
  const settle = () => {
    if(!animDone || !result || settled) return;
    settled = true;
    if(result.ok){
      if(isDesktop && window.aether.win && window.aether.win.hide){
        toast(`${label} 已启动，窗口退至后台待命`);
        setTimeout(()=>window.aether.win.hide(), 520);
      } else {
        toast(`${label} 已启动，去和 TA 一起作战吧`);
      }
    } else {
      toast(`启动失败：${result.error}`);
    }
  };
  setTimeout(async ()=>{
    $("#flash").classList.add("go");
    $("#s-status").textContent = `握手成功 · 正在打开 ${label}`;
    try {
      result = isDesktop
        ? await window.aether.launch({ path: target, args: [], charId: c.id, agentName: name })
        : await demoLaunch(c);
    } catch(err){
      result = { ok:false, error:String(err && err.message || err) };
    }
    if(!result.ok){
      $("#s-status").textContent = `启动失败 · ${result.error}`;
    } else {
      agentState[name] = true; // 先按成功点亮，主进程稍后会推真实进程状态
      refreshCardDots();
      if(selected && selected.c.id === c.id && selected.agent === name) updateFocusSummon();
    }
    settle();
  }, 4100 * t);
  setTimeout(()=>{
    $("#flash").classList.remove("go");
    $("#launch").className = "launch";
    launching = false;
    animDone = true;
    if(!result){ toast(`${label} 启动请求已发出`); return; } // 结果还没回来：回来后由 settle 收尾
    settle();
  }, 5000 * t);
}

/* 浏览器预览模式：只做演出，不起真实进程 */
function demoLaunch(c){
  return new Promise(resolve=>setTimeout(()=>resolve({ ok:true }), 400));
}

/* ================= 视图切换 ================= */
function switchView(name){
  closeFocus(true); // 切换界面即恢复阵容，不把聚焦态带到其他页
  // 离开连接配置页时收起已展开的角色详情，下次进来是收起状态
  if(name !== "config"){
    closeConfigDetails();
    expandedConfigId = null;
  }
  $$(".nav-btn").forEach(b=>b.classList.toggle("active", b.dataset.view===name));
  $$(".view").forEach(v=>v.classList.toggle("active", v.id==="view-"+name));
  if(name === "stage"){ layoutRoster(); positionBadges(); } // 大厅显示后按实际宽度重排阵容
}

/* ================= 小工具 ================= */
let toastTimer;
function toast(msg){
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove("show"), 2600);
}

function tickClock(){
  const now = new Date();
  const week = ["周日","周一","周二","周三","周四","周五","周六"][now.getDay()];
  $("#clock-date").textContent = `${now.getMonth()+1}月${now.getDate()}日 ${week}`;
  $("#clock-time").textContent = now.toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"});
}

function buildDecor(){
  const stars = $("#stars"), streaks = $("#streaks"), dust = $("#dust");
  for(let i=0;i<16;i++){
    const d = document.createElement("i");
    d.style.left = (4 + Math.random()*92) + "%";
    d.style.top = (25 + Math.random()*65) + "%";
    d.style.animationDuration = (5 + Math.random()*7).toFixed(1) + "s";
    d.style.animationDelay = (Math.random()*6).toFixed(1) + "s";
    dust.appendChild(d);
  }
  for(let i=0;i<46;i++){
    const s = document.createElement("div");
    s.className = "star";
    s.style.left = Math.random()*100 + "%";
    s.style.top = Math.random()*100 + "%";
    s.style.setProperty("--sd", (Math.random()*1.1).toFixed(2) + "s");
    s.style.opacity = (0.25 + Math.random()*0.6).toFixed(2);
    stars.appendChild(s);
  }
  for(let i=0;i<12;i++){
    const s = document.createElement("div");
    s.className = "streak";
    s.style.top = (8 + Math.random()*84) + "%";
    s.style.setProperty("--sd", (Math.random()*1.2).toFixed(2) + "s");
    streaks.appendChild(s);
  }
  const launch = $("#launch");
  for(let i=0;i<16;i++){
    const s = document.createElement("div");
    s.className = "spark";
    s.style.setProperty("--sa", (i*22.5) + "deg");
    s.style.setProperty("--sd", (i*0.12).toFixed(2) + "s");
    launch.querySelector(".magic-rings").appendChild(s);
  }
}

/* ================= 主题 ================= */
function setTheme(name, silent){
  document.body.dataset.theme = name;
  $$("#theme-switch .seg-btn").forEach(b=>b.classList.toggle("active", b.dataset.theme===name));
  if(!silent) persistSoon();
}

/* ================= 静态事件绑定 ================= */
/* ================= agent 管理器渲染（设置页 · 窄条下拉展开行内编辑列表） ================= */
function renderAgentMgr(){
  if(!agents.length) agents.push({ name:"新 Agent", path:"", resident:false });
  closePickPop(); // 重绘会销毁锚点，下拉面板必须先收起
  const list = $("#agent-list");
  list.innerHTML = agents.map((a,i)=>`
    <div class="agent-row" data-idx="${i}">
      <input class="ar-name" value="${esc(a.name)}" spellcheck="false" placeholder="Agent 名称">
      <span class="ar-path-label">路径</span>
      <input class="ar-path" value="${esc(a.path)}" spellcheck="false" placeholder="程序路径（.exe / 快捷方式 / 协议地址）">
      <button class="ar-pick" type="button" title="从本机已装程序中挑选启动目标">
        选择
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <button class="ar-resident${a.resident?" on":""}" type="button" aria-pressed="${!!a.resident}"
              title="常驻：启动星契时预先拉起，召唤时直接唤醒已有实例">常驻</button>
      <button class="btn-mini primary ar-save" type="button">保存</button>
      <button class="btn-mini ar-del" type="button">删除</button>
    </div>`).join("");
  list.querySelectorAll(".agent-row").forEach(row=>{
    const i = Number(row.dataset.idx);
    const nameInp = row.querySelector(".ar-name");
    const pathInp = row.querySelector(".ar-path");
    // 提交该行：校验名称，改名自动同步到引用它的星灵
    const commit = ()=>{
      const a = agents[i]; if(!a) return;
      const name = nameInp.value.trim();
      const path = pathInp.value.trim();
      if(!name){ toast("名称不能为空"); nameInp.value = a.name; return; }
      if(agents.some((x,j)=>j!==i && x.name===name)){ toast(`名称「${name}」已存在，请换一个`); nameInp.value = a.name; return; }
      const oldName = a.name;
      const changed = oldName !== name || a.path !== path;
      a.name = name;
      a.path = path;
      nameInp.value = name;
      pathInp.value = path;
      if(oldName !== name){
        // 改名同步到所有引用它的角色（一个角色可能同时挂了多个 Agent）
        characters.forEach(c=>{
          if(Array.isArray(c.agents) && c.agents.includes(oldName)){
            c.agents = c.agents.map(x=>x===oldName ? name : x);
          }
        });
        if(selected && selected.agent === oldName) selected.agent = name;
        renderRoster();
        renderConfig();
        if(selected) fillFocus(selected.c, selected.agent);
      }
      persistSoon();
      toast(changed ? `已保存「${name}」${oldName !== name ? "，引用它的星灵已同步" : ""}` : `「${name}」没有改动`);
    };
    row.querySelector(".ar-save").addEventListener("click", commit);
    // 输入框内回车 = 保存
    [nameInp, pathInp].forEach(inp=>{
      inp.addEventListener("keydown", e=>{
        if(e.key === "Enter"){ e.preventDefault(); commit(); inp.blur(); }
      });
    });
    // 可视化挑选启动目标：扫描本机已装程序 + 手动浏览
    row.querySelector(".ar-pick").addEventListener("click", e=>{
      e.stopPropagation();
      openTargetPicker(e.currentTarget, picked=>{
        pathInp.value = picked;
        commit(); // 选完即存，省一次点击
      });
    });
    // 常驻开关：即时保存，主进程收到配置后会立刻预热这个 agent
    row.querySelector(".ar-resident").addEventListener("click", e=>{
      const btn = e.currentTarget;
      const a = agents[i]; if(!a) return;
      if(!a.resident && !String(a.path || "").trim()){
        toast("请先为这个 agent 选择启动路径，再开启常驻");
        return;
      }
      a.resident = !a.resident;
      btn.classList.toggle("on", a.resident);
      btn.setAttribute("aria-pressed", String(a.resident));
      persistSoon();
      toast(a.resident
        ? `「${a.name}」已设为常驻，正在后台预热；之后召唤直接唤醒`
        : `「${a.name}」已取消常驻，召唤时会冷启动`);
    });

    row.querySelector(".ar-del").addEventListener("click", ()=>{
      if(agents.length<=1){ toast("至少保留一个 Agent"); return; }
      const [gone] = agents.splice(i, 1);
      // 从所有角色的多选里摘掉这个 Agent
      characters.forEach(c=>{
        if(Array.isArray(c.agents)) c.agents = c.agents.filter(x=>x!==gone.name);
      });
      if(selected && selected.agent === gone.name){
        selected.agent = charAgentList(selected.c)[0] || "";
        if(selected.agent) fillFocus(selected.c, selected.agent); else closeFocus(true);
      }
      renderAgentMgr();
      renderRoster();
      renderConfig();
      persistSoon();
      toast(`已删除「${gone.name}」，引用它的星灵已同步移除`);
    });
  });
}

/* ================= 启动目标可视化选择（下拉面板） =================
   数据来自主进程 scanTargets（开始菜单/桌面/应用目录里的 AI 程序），
   底部永远保留「浏览本机文件…」兜底。扫描结果在本次运行内缓存。 */
let scanCache = null;   // null=未扫描；[]=扫过了但没有
let pickPop = null;     // 当前打开的面板

function closePickPop(){
  if(!pickPop) return;
  pickPop.remove();
  pickPop = null;
  document.removeEventListener("mousedown", pickOutside, true);
  document.removeEventListener("keydown", pickEsc, true);
  window.removeEventListener("resize", closePickPop);
}
function pickOutside(e){
  if(!pickPop) return;
  if(pickPop.contains(e.target)) return;
  if(pickPop.__anchor && pickPop.__anchor.contains(e.target)) return; // 点同一颗按钮交给它自己 toggle
  closePickPop();
}
function pickEsc(e){
  if(e.key !== "Escape") return;
  e.stopPropagation(); // 别让 Esc 顺带收起聚焦面板
  closePickPop();
}
function placePickPop(pop, anchor){
  const r = anchor.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight;
  let left = r.left;
  if(left + w > window.innerWidth - 12) left = Math.max(12, window.innerWidth - w - 12);
  let top = r.bottom + 6;
  if(top + h > window.innerHeight - 12) top = Math.max(12, r.top - h - 6);
  pop.style.left = left + "px";
  pop.style.top = top + "px";
}

async function openTargetPicker(anchor, onPick){
  closePickPop();
  if(!isDesktop || !window.aether.scanTargets){
    toast("浏览器预览模式下不可挑选本机程序");
    return;
  }
  const pop = document.createElement("div");
  pop.className = "pick-pop";
  pop.__anchor = anchor;
  pop.innerHTML = `
    <div class="pp-head">本机已装的 AI 应用</div>
    <div class="pp-body"><div class="pp-empty">正在扫描本机…</div></div>
    <div class="pp-foot">
      <button class="pick-item pp-browse" type="button">
        <span class="pi-name">浏览本机文件…</span>
        <span class="pi-path">任意 .exe 或快捷方式</span>
      </button>
    </div>`;
  pop.style.visibility = "hidden";
  document.body.appendChild(pop);
  pickPop = pop;
  placePickPop(pop, anchor);
  pop.style.visibility = "";
  document.addEventListener("mousedown", pickOutside, true);
  document.addEventListener("keydown", pickEsc, true);
  window.addEventListener("resize", closePickPop);

  pop.querySelector(".pp-browse").addEventListener("click", async ()=>{
    closePickPop();
    const picked = await window.aether.pickTarget();
    if(picked) onPick(picked);
  });

  let items = [];
  try {
    if(!scanCache) scanCache = await window.aether.scanTargets();
    items = Array.isArray(scanCache) ? scanCache : [];
  } catch(_){ items = []; }
  if(pickPop !== pop) return; // 扫描期间面板已被关掉

  const body = pop.querySelector(".pp-body");
  body.innerHTML = items.length
    ? items.map(t=>`
        <button class="pick-item" type="button" data-path="${esc(t.path)}" title="${esc(t.path)}">
          <span class="pi-name">${esc(t.name)}</span>
          <span class="pi-path">${esc(t.path)}</span>
          <span class="pi-from">${esc(t.from || "")}</span>
        </button>`).join("")
    : `<div class="pp-empty">没扫描到 AI 应用，用下面「浏览本机文件…」手动挑一个</div>`;

  body.querySelectorAll(".pick-item[data-path]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const picked = btn.dataset.path;
      closePickPop();
      if(picked) onPick(picked);
    });
  });
  placePickPop(pop, anchor);
}

function setAgentListOpen(open){
  agentListOpen = open;
  $("#agent-list").hidden = !open;
  $("#agent-toggle").classList.toggle("open", open);
}

function bindStatic(){
  let layoutTimer;
  window.addEventListener("resize",()=>{ clearTimeout(layoutTimer); layoutTimer = setTimeout(()=>{ layoutRoster(); positionBadges(); }, 120); });

  $$(".nav-btn").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));

  /* 聚焦详情面板 */
  $("#focus-back").addEventListener("click",()=>closeFocus());
  $("#focus-char").addEventListener("click",()=>closeFocus()); // 单击聚焦立绘 → 推回恢复阵容
  $("#focus-summon").addEventListener("click",()=>{ if(selected) summon(selected.c, selected.agent); });
  $("#focus-edit").addEventListener("click",()=>{
    if(!selected) return;
    const id = selected.c.id;
    expandedConfigId = id;
    renderConfig();
    switchView("config"); // 会顺带推回恢复阵容
    requestAnimationFrame(()=>{
      const row = $(`#link-list .link-row[data-id="${id}"]`);
      if(!row) return;
      row.scrollIntoView({ behavior:"smooth", block:"center" });
      row.querySelector(".link-summary")?.focus({ preventScroll:true });
    });
  });
  // 详情页切换 Agent：只影响这一次聚焦的召唤目标，不改连接配置里的多选
  $("#focus-agent").addEventListener("change",e=>{
    if(!selected) return;
    selected.agent = e.target.value;
    fillFocus(selected.c, selected.agent);
  });

  /* 主页 CC Switch 按钮：一键启动供应商切换 */
  $("#btn-ccswitch").addEventListener("click", async ()=>{
    const p = String(ccSwitchPath || "").trim() || DEFAULT_CC_SWITCH_PATH;
    if(!p){
      toast("请先在设置中选择 CC Switch 的程序路径");
      return;
    }
    if(!isDesktop || !window.aether.launch){
      toast("浏览器预览模式下不可启动 CC Switch");
      return;
    }
    toast("正在启动 CC Switch…");
    try {
      const r = await window.aether.launch({ path: p, args: [] });
      if(r.ok) toast("CC Switch 已启动");
      else toast(`CC Switch 启动失败：${r.error}`);
    } catch(err){
      toast(`CC Switch 启动失败：${String(err && err.message || err)}`);
    }
  });

  $("#btn-go-config").addEventListener("click",()=>switchView("config"));

  /* 窗口控制 */
  const winAct = fn => isDesktop ? fn() : toast("浏览器预览模式下窗口按钮不可用");
  $("#btn-min").addEventListener("click",()=>winAct(()=>window.aether.win.minimize()));
  $("#btn-max").addEventListener("click",()=>winAct(()=>window.aether.win.toggleMaximize()));
  $("#btn-close").addEventListener("click",()=>winAct(()=>window.aether.win.close()));

  /* 主题切换 */
  $$("#theme-switch .seg-btn").forEach(b=>b.addEventListener("click",()=>{
    setTheme(b.dataset.theme);
    toast(b.dataset.theme==="light" ? "已切换到浅色主题 · 晨光" : "已切换到深色主题 · 星夜");
  }));

  /* 已召唤小窗方向 */
  $$("#mini-layout-switch .seg-btn").forEach(b=>b.addEventListener("click",()=>{
    miniLayout = b.dataset.layout === "horizontal" ? "horizontal" : "vertical";
    $$("#mini-layout-switch .seg-btn").forEach(x=>x.classList.toggle("active", x===b));
    persistSoon();
    toast(miniLayout === "horizontal" ? "小窗已改为横向" : "小窗已改为竖向");
  }));

  /* 固定小窗位置 */
  $("#sw-mini-pin").addEventListener("click", ()=>{
    miniPinned = !miniPinned;
    $("#sw-mini-pin").classList.toggle("on", miniPinned);
    persistSoon();
    toast(miniPinned ? "小窗位置已固定，不能再拖动" : "小窗已解锁，可长按任意位置拖动");
  });

  /* 召唤动画时长 */
  $("#anim-speed").addEventListener("input",e=>{
    animScale = Number(e.target.value)/4;
    $("#anim-sec").textContent = Number(e.target.value).toFixed(1);
    persistSoon();
  });

  /* CC Switch 路径（全局，留空回退默认） */
  $("#ccswitch-path").addEventListener("change",()=>{
    const v = $("#ccswitch-path").value.trim() || DEFAULT_CC_SWITCH_PATH;
    ccSwitchPath = v;
    $("#ccswitch-path").value = v;
    persistSoon();
    renderConfig(); // 刷新连接配置里的路径提示
    toast("已更新 CC Switch 路径");
  });
  $("#ccswitch-pick").addEventListener("click", async ()=>{
    if(!isDesktop || !window.aether.pickTarget){
      toast("浏览器预览模式下不可浏览本机文件");
      return;
    }
    const p = await window.aether.pickTarget();
    if(p){
      ccSwitchPath = p;
      $("#ccswitch-path").value = p;
      persistSoon();
      renderConfig();
      toast("已更新 CC Switch 路径");
    }
  });

  /* agent 配置（设置页）：窄条 + 下拉展开编辑列表，每行名称/路径行内编辑、可删除 */
  $("#agent-toggle").addEventListener("click", ()=>{
    setAgentListOpen(!agentListOpen);
  });
  $("#agent-add").addEventListener("click",()=>{
    let n = agents.length + 1;
    let name = `新 Agent ${n}`;
    while(agents.some(a=>a.name===name)) name = `新 Agent ${++n}`;
    agents.push({ name, path:"" });
    renderAgentMgr();
    if(!agentListOpen) setAgentListOpen(true);
    persistSoon();
    requestAnimationFrame(()=>{
      const rows = $$("#agent-list .agent-row");
      const inp = rows[rows.length-1] && rows[rows.length-1].querySelector(".ar-name");
      if(inp){ inp.focus(); inp.select(); }
    });
  });

  /* 开机自启（真实开关：桌面版对接系统登录项；预览模式仅演示） */
  $("#sw-autostart").addEventListener("click", async ()=>{
    const sw = $("#sw-autostart");
    const on = !sw.classList.contains("on");
    if(!isDesktop){
      sw.classList.toggle("on", on);
      toast("浏览器预览模式：开机自启仅在桌面版生效");
      return;
    }
    try{
      const st = await window.aether.setLogin(on);
      sw.classList.toggle("on", !!st.openAtLogin);
      toast(st.openAtLogin ? "已开启开机自启 · 登录后从托盘静默启动" : "已关闭开机自启");
    }catch(err){
      toast("设置开机自启失败：" + String(err && err.message || err));
    }
  });

  /* 关闭窗口后驻留托盘（真实开关：状态随配置持久化） */
  $("#sw-tray").addEventListener("click", ()=>{
    const sw = $("#sw-tray");
    closeToTray = !sw.classList.contains("on");
    sw.classList.toggle("on", closeToTray);
    if(isDesktop) window.aether.setCloseToTray(closeToTray);
    persistSoon();
    toast(closeToTray ? "关闭窗口后将驻留系统托盘" : "关闭窗口将直接退出星契");
  });

  $$("[data-switch]").forEach(sw=>sw.addEventListener("click",()=>{
    sw.classList.toggle("on");
    persistSoon();
  }));

  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){
      if(!$("#stage-focus").hidden) closeFocus();
      return;
    }
    if(e.key==="Enter" && selected && !e.target.closest("button,select,input,textarea")
       && $("#view-stage").classList.contains("active") && !launching) summon(selected.c, selected.agent);
  });
}

/* ================= 初始化 ================= */
async function boot(){
  let saved = null;
  if(isDesktop){
    try { saved = await window.aether.getConfig(); } catch(_){}
  }
  // agent 注册表：老存档没有 → 出厂默认；有则沿用（空表兜底出厂）
  agents = (saved && Array.isArray(saved.agents) && saved.agents.length)
    ? saved.agents.map(a=>({
        name:String(a && a.name || ""),
        path:String(a && a.path || ""),
        resident:!!(a && a.resident),   // 常驻：启动时预热，召唤时直接唤醒
      })).filter(a=>a.name)
    : [];
  if(!agents.length) agents = DEFAULT_AGENTS.map(a=>({...a}));

  if(saved && Array.isArray(saved.characters) && saved.characters.length){
    const deepseekDefault = DEFAULT_CHARACTERS.find(x=>x.id==="deepseek");
    characters = saved.characters.map(c=>{
      const legacyDeepseek = c && c.id==="deepseek" && (
        c.app === "WorkBuddy Agent" ||
        String(c.path || "").toLowerCase().includes("\\workbuddy\\")
      );
      // 老存档的单个 agent 字段在这里统一升级成 agents 数组
      const base = normalizeCharacter(legacyDeepseek ? {
        ...c,
        agent: deepseekDefault.agent,
        quotes: [...deepseekDefault.quotes],
      } : c);
      // 更老的存档：连 agent 字段都没有，用旧启动路径去注册表里匹配
      if(!base.agents.length && !Array.isArray(c.agents) && typeof c.agent !== "string"){
        const oldPath = String(c.path || "").toLowerCase();
        const hit = oldPath ? agents.find(a=>String(a.path || "").toLowerCase() === oldPath) : null;
        if(hit) base.agents = [hit.name];
      }
      delete base.path;
      delete base.ccSwitch;
      delete base.app;   // 显示名称 / 目标软件名已下线
      delete base.args;  // 启动参数已下线
      delete base.model; // AI 模型名展示已下线
      return base;
    });
    // 注入新增的出厂星灵（如炽羽 · MiMo）：旧存档里没有的新角色自动补上，用户已有配置不受影响
    const savedIds = new Set(characters.map(c=>c.id));
    for(const d of DEFAULT_CHARACTERS){
      if(!savedIds.has(d.id)) characters.push({...normalizeCharacter(d), quotes:[...d.quotes]});
    }
  } else {
    characters = DEFAULT_CHARACTERS.map(c=>({...normalizeCharacter(c), quotes:[...c.quotes]}));
  }
  const st = (saved && saved.settings) || {};
  setTheme(st.theme === "light" ? "light" : "dark", true);
  if(typeof st.animScale === "number" && st.animScale > 0){
    animScale = st.animScale;
    $("#anim-speed").value = String(Math.round(animScale * 4));
    $("#anim-sec").textContent = (animScale * 4).toFixed(1);
  }
  /* 托盘驻留 & 开机自启：真实开关的初始状态 */
  closeToTray = st.closeToTray !== false;
  $("#sw-tray").classList.toggle("on", closeToTray);
  miniLayout = st.miniLayout === "horizontal" ? "horizontal" : "vertical";
  $$("#mini-layout-switch .seg-btn").forEach(b=>b.classList.toggle("active", b.dataset.layout===miniLayout));
  miniPinned = st.miniPinned === true;
  $("#sw-mini-pin").classList.toggle("on", miniPinned);
  ccSwitchPath = String(st.ccSwitchPath || "").trim() || DEFAULT_CC_SWITCH_PATH;
  $("#ccswitch-path").value = ccSwitchPath;
  if(isDesktop){
    window.aether.setCloseToTray(closeToTray);
    try{
      const login = await window.aether.getLogin();
      $("#sw-autostart").classList.toggle("on", !!login.openAtLogin);
    }catch(_){}
  }
  renderRoster();
  renderConfig();
  renderAgentMgr();
  buildDecor();
  tickClock();
  setInterval(tickClock, 20000);
  bindStatic();
  bindCharacterEditor();

  // 老配置（v1）读完就落盘成 v2：config-store 会先备份旧文件再写
  if(saved && (Number(saved.version) || 1) < 2) persistSoon();

  /* 运行状态：主进程轮询 tasklist，变化时推送过来 */
  if(isDesktop && window.aether.onAgentState){
    window.aether.onAgentState(state=>{
      agentState = state || {};
      refreshCardDots();            // 卡片上的运行小点
      if(selected) updateFocusSummon();
    });
    try { agentState = (await window.aether.getAgentState()) || {}; } catch(_){}
    refreshCardDots();
    if(selected) updateFocusSummon();
  }

  /* 最小化 / 退到托盘后再回来，要回到「多角色大厅」，而不是停在某个角色的详情 */
  if(isDesktop && window.aether.onWinAway){
    window.aether.onWinAway(away=>{ if(away) closeFocus(true); });
  }
}

boot();













