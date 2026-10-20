/* 已召唤小窗 —— 只负责渲染主进程推来的数据，以及长按拖拽 */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

let pinned = false;   // 固定后禁止拖动

/* ---------- 长按拖拽：按住小窗任意位置约 220ms，或按住后移动超过 6px，即进入拖拽 ---------- */
const LONG_PRESS_MS = 220;
const MOVE_THRESHOLD = 6;

let pressTimer = null;
let drag = null;          // { offsetX, offsetY } 光标相对窗口左上角的偏移
let suppressClick = false;

function beginDrag(e) {
  if (!drag) {
    drag = { offsetX: e.screenX - window.screenX, offsetY: e.screenY - window.screenY };
    document.body.classList.add("dragging");
  }
}

function endDrag() {
  clearTimeout(pressTimer);
  pressTimer = null;
  if (drag) {
    drag = null;
    document.body.classList.remove("dragging");
    // 拖完这一次点击不该再触发图标；留一点时间余量，避免 click 晚于定时器到达
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 300);
  }
}

document.addEventListener("mousedown", e => {
  if (pinned || e.button !== 0) return;
  const startX = e.screenX, startY = e.screenY;
  pressTimer = setTimeout(() => beginDrag(e), LONG_PRESS_MS);

  const onMove = ev => {
    if (!drag) {
      const moved = Math.abs(ev.screenX - startX) + Math.abs(ev.screenY - startY);
      if (moved > MOVE_THRESHOLD) beginDrag(ev);
      else return;
    }
    window.mini.move({
      x: Math.round(ev.screenX - drag.offsetX),
      y: Math.round(ev.screenY - drag.offsetY),
    });
  };
  const onUp = () => {
    endDrag();
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  };
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
});

// 拖拽结束的那次 click 直接丢弃
document.addEventListener("click", e => {
  if (suppressClick) {
    e.stopPropagation();
    e.preventDefault();
  }
}, true);

function avatarHTML(it) {
  const tip = `${esc(it.name)} · ${esc(it.agent)}${it.running ? "（运行中）" : "（已退出）"}`;
  const inner = it.icon
    ? `<img src="${esc(it.icon)}" alt="${esc(it.agent)}" draggable="false">`
    : `<span class="ph">${esc((it.agent || "?").slice(0, 1).toUpperCase())}</span>`;
  return `
    <button class="avatar${it.running ? "" : " off"}" type="button" data-key="${esc(it.key)}" title="${tip}">
      ${inner}
      <span class="dot"></span>
    </button>`;
}

function render(data) {
  const items = (data && data.items) || [];
  pinned = !!(data && data.pinned);

  const mini = $("#mini");
  mini.classList.toggle("horizontal", data && data.layout === "horizontal");
  mini.classList.toggle("empty", items.length === 0);
  mini.classList.toggle("pinned", pinned);
  $("#gap").title = pinned ? "已固定位置（设置里可取消）" : "按住这里或任意位置拖动小窗";

  const box = $("#avatars");
  box.innerHTML = items.map(avatarHTML).join("");
  box.querySelectorAll(".avatar").forEach(btn => {
    btn.addEventListener("click", () => {
      if (suppressClick) return;
      const hit = items.find(x => x.key === btn.dataset.key);
      if (hit) window.mini.launch({ charId: hit.charId, agentName: hit.agent });
    });
  });

  // 窗口尺寸跟着内容走：透明窗口多留一个像素都会挡住下层点击
  requestAnimationFrame(() => {
    const r = mini.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      window.mini.resize({ width: Math.ceil(r.width), height: Math.ceil(r.height) });
    }
  });
}

window.mini.onData(render);
$("#hub").addEventListener("click", () => {
  if (suppressClick) return;
  window.mini.openHub();
});
