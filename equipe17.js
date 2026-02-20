/* equipe17.js — UI “original” (Equipe A — Pipeline 17)
   - Colunas por assistente
   - Cards simples: título, ID, etapa, select mover, copiar ID
   - Topbar: buscar, atualizar, testar conexão, pills contagem
   - Log inferior
*/
(function () {
  const CFG = (window.EQUIPE17_CFG || window.FINANCEIRO_CFG || {});
  const DEFAULT = {
    TITLE: "Equipe A — Pipeline 17 (colunas por assistente)",
    SUBTITLE: "Bitrix Sites — Cloudflare Worker (sem CORS)",
    CATEGORY: 17,
    REFRESH_MS: 60000,
    DONE_STAGE_NAME: "CONCLUÍDO",
    LOGO_URL: "",

    // Se você não usa Worker, pode pôr WEBHOOK_URL aqui (com / no final)
    WEBHOOK_URL: "",

    // Se você usa Worker (recomendado)
    WORKER_BASE: "",   // ex.: https://seu-worker.pages.dev
    PASS: "",

    // Assistentes (no seu loader/CFG você já define)
    ASSISTENTES: [
      // { key:"MANUELA", name:"MANUELA", userId:813 },
    ],
  };

  const C = Object.assign({}, DEFAULT, CFG);

  // Helpers
  const norm = (s) =>
    String(s || "")
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");

  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const nowHHMMSS = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };

  function ensureRoot() {
    let root = document.getElementById("eqd-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "eqd-root";
      document.body.prepend(root);
    }
    return root;
  }

  // ===== Transport (Worker OU Webhook direto) =====
  // Worker endpoint esperado: POST { pass, method, params } => { ok:true, result, next? } (ou {result,next})
  // Se seu Worker for diferente, me diga o payload que ele espera que eu ajusto.
  async function callWorker(method, params) {
    const base = String(C.WORKER_BASE || "").replace(/\/+$/, "");
    if (!base) throw new Error("WORKER_BASE não definido em window.EQUIPE17_CFG.");

    const url = base + "/bx"; // padrão
    const resp = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pass: C.PASS || "", method, params: params || {} }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(`Worker HTTP ${resp.status}`);
    if (data && data.error) throw new Error(data.error_description || data.error);

    // aceita {result,next} ou {ok,result,next} ou {data:{...}}
    if (Object.prototype.hasOwnProperty.call(data, "result")) return data;
    if (data && data.data && Object.prototype.hasOwnProperty.call(data.data, "result")) return data.data;
    return data;
  }

  async function callWebhook(method, params) {
    const hook = String(C.WEBHOOK_URL || C.WEBHOOK || "").trim();
    if (!hook) throw new Error("WEBHOOK_URL não definido em window.EQUIPE17_CFG.");
    const url = hook.replace(/\/?$/, "/") + method;

    const body = new URLSearchParams();
    const appendPairs = (prefix, obj) => {
      if (obj == null) return;
      if (Array.isArray(obj)) {
        obj.forEach((v, i) => appendPairs(`${prefix}[${i}]`, v));
        return;
      }
      if (typeof obj === "object") {
        Object.keys(obj).forEach((k) => appendPairs(prefix ? `${prefix}[${k}]` : k, obj[k]));
        return;
      }
      if (prefix) body.append(prefix, String(obj));
    };
    appendPairs("", params || {});

    const resp = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body,
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(`Webhook HTTP ${resp.status}`);
    if (data && data.error) throw new Error(data.error_description || data.error);
    return data;
  }

  async function bxRaw(method, params) {
    // prioridade: Worker -> Webhook
    if (C.WORKER_BASE) return await callWorker(method, params);
    return await callWebhook(method, params);
  }

  async function bx(method, params) {
    const data = await bxRaw(method, params);
    return data.result;
  }

  async function bxAll(method, params) {
    const out = [];
    let start = 0;
    while (true) {
      const data = await bxRaw(method, Object.assign({}, params || {}, { start }));
      const chunk = data.result || [];
      out.push(...chunk);
      if (data.next == null) break;
      start = data.next;
    }
    return out;
  }

  // ===== UI =====
  const root = ensureRoot();

  root.innerHTML = `
    <style>
      #eqo-app{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#111827; background:#f6f7fb; min-height:100vh; padding:14px;}
      #eqo-app *{box-sizing:border-box;}
      .eqo-shell{max-width:1400px;margin:0 auto;}
      .eqo-top{
        display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
        background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:12px 14px;
      }
      .eqo-left{display:flex;align-items:center;gap:10px;min-width:280px;}
      .eqo-logo{width:34px;height:34px;border-radius:10px;border:1px solid rgba(0,0,0,.10);background:#fff;object-fit:contain;padding:6px;display:${C.LOGO_URL ? "block" : "none"};}
      .eqo-title{font-weight:950;font-size:16px;line-height:1.1}
      .eqo-sub{font-size:12px;color:rgba(17,24,39,.65);font-weight:800;margin-top:2px}
      .eqo-right{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;}
      .eqo-search{width:min(340px, 70vw); padding:10px 12px; border-radius:999px; border:1px solid rgba(0,0,0,.10); background:#fff; font-size:13px; font-weight:800; outline:none;}
      .eqo-btn{
        padding:9px 12px;border-radius:999px;border:1px solid rgba(0,0,0,.12);
        background:#fff;font-weight:950;font-size:12px;cursor:pointer;
      }
      .eqo-btn:active{transform:scale(.99)}
      .eqo-pill{
        padding:9px 12px;border-radius:999px;border:1px solid rgba(0,0,0,.10);
        background:#fff;font-weight:950;font-size:12px;white-space:nowrap;
      }
      .eqo-grid{
        margin-top:12px;
        display:grid;grid-template-columns:repeat(4, minmax(280px, 1fr));
        gap:12px;
      }
      @media(max-width:1200px){ .eqo-grid{grid-template-columns:1fr;} }
      .eqo-col{
        background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:16px;overflow:hidden;
        min-height:72vh;display:flex;flex-direction:column;
      }
      .eqo-colHead{
        padding:10px 12px;border-bottom:1px solid rgba(0,0,0,.08);
        display:flex;align-items:center;justify-content:space-between;gap:10px;
        font-weight:950;
      }
      .eqo-colName{font-size:14px}
      .eqo-colCount{font-size:12px;color:rgba(17,24,39,.55);font-weight:900}
      .eqo-list{padding:10px;display:flex;flex-direction:column;gap:10px;overflow:auto;min-height:0;flex:1}
      .eqo-card{
        border:1px solid rgba(0,0,0,.10);border-radius:14px;padding:10px;background:#fff;
      }
      .eqo-task{font-weight:950;font-size:13px;line-height:1.15}
      .eqo-meta{margin-top:6px;color:rgba(17,24,39,.60);font-size:12px;font-weight:850}
      .eqo-row{margin-top:8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
      .eqo-select{
        border:1px solid rgba(0,0,0,.12);border-radius:999px;padding:8px 10px;
        font-weight:950;font-size:12px;background:#fff;min-width:160px;
      }
      .eqo-copy{
        border:1px solid rgba(0,0,0,.12);border-radius:999px;padding:8px 10px;
        font-weight:950;font-size:12px;background:#fff;cursor:pointer;
      }
      .eqo-empty{
        border:1px dashed rgba(0,0,0,.18);border-radius:14px;padding:12px;
        background:#fafafa;color:rgba(17,24,39,.55);font-weight:900;font-size:12px;text-align:center;
      }
      .eqo-log{
        margin-top:12px;
        background:#0b1220;border-radius:14px;border:1px solid rgba(255,255,255,.06);
        color:#dbeafe;padding:12px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
        font-size:12px;min-height:110px;
      }
      .eqo-logLine{opacity:.92;margin:2px 0}
      .eqo-ok{color:#86efac;font-weight:900}
      .eqo-bad{color:#fca5a5;font-weight:900}
    </style>

    <div id="eqo-app">
      <div class="eqo-shell">
        <div class="eqo-top">
          <div class="eqo-left">
            <img class="eqo-logo" src="${esc(C.LOGO_URL)}" alt="logo" referrerpolicy="no-referrer">
            <div>
              <div class="eqo-title">${esc(C.TITLE)}</div>
              <div class="eqo-sub">${esc(C.SUBTITLE)}</div>
            </div>
          </div>

          <div class="eqo-right">
            <input id="eqo-q" class="eqo-search" placeholder="Buscar por título ou ID..." />
            <button id="eqo-refresh" class="eqo-btn">Atualizar</button>
            <button id="eqo-test" class="eqo-btn">Testar conexão</button>
            <div id="eqo-pillDeals" class="eqo-pill">Negócios: —</div>
            <div id="eqo-pillStages" class="eqo-pill">Etapas: —</div>
          </div>
        </div>

        <div id="eqo-grid" class="eqo-grid"></div>

        <div id="eqo-log" class="eqo-log"></div>
      </div>
    </div>
  `;

  const $ = (id) => document.getElementById(id);
  const grid = $("eqo-grid");
  const logEl = $("eqo-log");
  const pillDeals = $("eqo-pillDeals");
  const pillStages = $("eqo-pillStages");
  const qInput = $("eqo-q");

  function log(msg, kind) {
    const line = document.createElement("div");
    line.className = "eqo-logLine";
    const tag =
      kind === "ok" ? `<span class="eqo-ok">OK</span>` :
      kind === "bad" ? `<span class="eqo-bad">ERRO</span>` : "(log)";
    line.innerHTML = `${tag} ${esc(nowHHMMSS())} — ${esc(msg)}`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function copy(text) {
    const t = String(text || "");
    if (!t) return;
    navigator.clipboard?.writeText(t).catch(() => {});
  }

  // ===== Data caches =====
  let stageList = [];
  let stageById = new Map();
  let doneStageId = null;
  let stageIdToAssistKey = new Map(); // stageId -> assistKey
  let dealsAll = [];

  async function loadStages() {
    log("Carregando etapas…");
    stageList = await bx("crm.dealcategory.stage.list", { id: Number(C.CATEGORY) });
    stageById = new Map((stageList || []).map((s) => [String(s.STATUS_ID), s]));
    doneStageId = null;

    for (const s of stageList || []) {
      if (norm(s.NAME).includes(norm(C.DONE_STAGE_NAME))) doneStageId = String(s.STATUS_ID);
    }

    // mapear stage -> assistente pelo nome da coluna
    stageIdToAssistKey = new Map();
    const members = (C.ASSISTENTES || []).map((a) => String(a.key || a.name || "").trim()).filter(Boolean);

    for (const s of stageList || []) {
      const sn = norm(s.NAME);
      for (const m of members) {
        const mn = norm(m);
        if (!mn) continue;
        if (sn === mn || sn.includes(mn) || mn.includes(sn)) {
          stageIdToAssistKey.set(String(s.STATUS_ID), m);
        }
      }
    }

    pillStages.textContent = `Etapas: ${(stageList || []).length}`;
    log("Etapas carregadas.", "ok");
  }

  async function loadDeals() {
    log("Carregando negócios…");

    const select = ["ID", "TITLE", "STAGE_ID"];
    dealsAll = await bxAll("crm.deal.list", {
      filter: { CATEGORY_ID: Number(C.CATEGORY) },
      select,
      order: { ID: "DESC" },
    });

    // remove concluído da visão (como no print)
    if (doneStageId) {
      dealsAll = dealsAll.filter((d) => String(d.STAGE_ID) !== String(doneStageId));
    }

    pillDeals.textContent = `Negócios: ${dealsAll.length}`;
    log("Negócios carregados.", "ok");
  }

  function buildMoveOptions(curStageId) {
    const opts = [];

    // Assistentes (por coluna)
    for (const a of C.ASSISTENTES || []) {
      const key = String(a.key || a.name || "").trim();
      if (!key) continue;

      // achar o STAGE_ID que corresponde à coluna desse assistente
      const stage = (stageList || []).find((s) => norm(s.NAME) === norm(key) || norm(s.NAME).includes(norm(key)));
      if (!stage) continue;

      const sid = String(stage.STATUS_ID);
      opts.push(`<option value="${esc(sid)}" ${sid === String(curStageId) ? "selected" : ""}>${esc(key)}</option>`);
    }

    // Concluído
    if (doneStageId) {
      opts.push(`<option value="${esc(doneStageId)}">${esc(C.DONE_STAGE_NAME)}</option>`);
    }

    return opts.join("");
  }

  function dealMatchesQuery(d, q) {
    if (!q) return true;
    const id = String(d.ID || "");
    const title = String(d.TITLE || "");
    const nq = norm(q);
    return norm(id).includes(nq) || norm(title).includes(nq);
  }

  function render() {
    const q = String(qInput.value || "").trim();

    const byAssist = new Map();
    for (const a of C.ASSISTENTES || []) {
      const key = String(a.key || a.name || "").trim();
      if (key) byAssist.set(key, []);
    }

    for (const d of dealsAll || []) {
      if (!dealMatchesQuery(d, q)) continue;
      const ak = stageIdToAssistKey.get(String(d.STAGE_ID)) || null;
      if (ak && byAssist.has(ak)) byAssist.get(ak).push(d);
    }

    grid.innerHTML = "";

    for (const a of C.ASSISTENTES || []) {
      const key = String(a.key || a.name || "").trim();
      if (!key) continue;

      const list = byAssist.get(key) || [];
      const col = document.createElement("section");
      col.className = "eqo-col";
      col.innerHTML = `
        <div class="eqo-colHead">
          <div class="eqo-colName">${esc(key)} (${esc(a.userId || "")})</div>
          <div class="eqo-colCount">${list.length}</div>
        </div>
        <div class="eqo-list" data-col="${esc(key)}"></div>
      `;
      const listEl = col.querySelector(".eqo-list");

      if (!list.length) {
        listEl.innerHTML = `<div class="eqo-empty">Sem itens</div>`;
      } else {
        for (const d of list) {
          const st = stageById.get(String(d.STAGE_ID));
          const stName = st ? String(st.NAME || "") : "";

          const card = document.createElement("div");
          card.className = "eqo-card";
          card.innerHTML = `
            <div class="eqo-task">${esc(d.TITLE || "")}</div>
            <div class="eqo-meta">ID ${esc(d.ID)} • Etapa: ${esc(stName || key)}</div>

            <div class="eqo-row">
              <select class="eqo-select" data-act="move" data-id="${esc(d.ID)}">
                ${buildMoveOptions(d.STAGE_ID)}
              </select>
              <button class="eqo-copy" data-act="copy" data-id="${esc(d.ID)}">Copiar ID</button>
            </div>
          `;
          listEl.appendChild(card);
        }
      }

      grid.appendChild(col);
    }
  }

  async function moveDeal(dealId, newStageId) {
    await bx("crm.deal.update", { id: String(dealId), fields: { STAGE_ID: String(newStageId) } });

    // Atualiza local sem repuxar tudo
    const d = (dealsAll || []).find((x) => String(x.ID) === String(dealId));
    if (d) d.STAGE_ID = String(newStageId);

    // se foi pra concluído, remove da visão
    if (doneStageId && String(newStageId) === String(doneStageId)) {
      dealsAll = dealsAll.filter((x) => String(x.ID) !== String(dealId));
      pillDeals.textContent = `Negócios: ${dealsAll.length}`;
    }
  }

  // Delegation
  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.getAttribute("data-act");
    const id = btn.getAttribute("data-id");

    if (act === "copy") {
      copy(id);
      log(`ID copiado: ${id}`, "ok");
    }
  });

  root.addEventListener("change", (e) => {
    const sel = e.target.closest('select[data-act="move"]');
    if (!sel) return;
    const id = sel.getAttribute("data-id");
    const to = sel.value;

    (async () => {
      try {
        log(`Movendo ID ${id}…`);
        await moveDeal(id, to);
        log(`Movido ID ${id}.`, "ok");
        render();
      } catch (err) {
        log(`Falha ao mover ID ${id}: ${err?.message || err}`, "bad");
      }
    })();
  });

  // Topbar
  $("eqo-refresh").addEventListener("click", async () => {
    try {
      log("Atualizando…");
      await loadStages();
      await loadDeals();
      render();
      log("Renderizando…", "ok");
    } catch (err) {
      log(`Falha ao atualizar: ${err?.message || err}`, "bad");
    }
  });

  $("eqo-test").addEventListener("click", async () => {
    try {
      log("Testando conexão…");
      // chamada leve
      await bx("profile", {});
      log("Conexão OK.", "ok");
    } catch (err) {
      log(`Falha na conexão: ${err?.message || err}`, "bad");
    }
  });

  qInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      render();
    }
  });
  qInput.addEventListener("input", () => {
    // filtra ao digitar (leve)
    render();
  });

  // Init
  (async () => {
    log("Iniciando…");
    // sanity
    if (!C.CATEGORY) throw new Error("CATEGORY não definido.");
    if (!Array.isArray(C.ASSISTENTES) || !C.ASSISTENTES.length) {
      throw new Error("ASSISTENTES vazio. Defina em window.EQUIPE17_CFG.ASSISTENTES.");
    }

    await loadStages();
    await loadDeals();
    render();

    log("OK", "ok");

    setInterval(async () => {
      try {
        await loadDeals();
        render();
      } catch (_) {}
    }, Math.max(15000, Number(C.REFRESH_MS || 60000)));
  })().catch((err) => {
    log(`Falha fatal: ${err?.message || err}`, "bad");
  });
})();
