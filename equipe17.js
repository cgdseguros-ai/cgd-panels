/* equipe17.js — Painel Equipe Δ (Pipeline 17) via Cloudflare Worker */

(() => {
  "use strict";

  // ====== CONFIG (ajuste só aqui) ======
  const CFG = {
    TITLE: "Equipe Δ — Pipeline 17 (colunas por assistente)",
    WORKER_BASE: "https://cgd-bx-proxy.cgdseguros.workers.dev",
    PASS: "4627",

    CATEGORY_ID: 17, // Pipeline 17
    USERS: [
      { id: 813, name: "MANUELA" },
      { id: 841, name: "MARIA CLARA" },
      { id: 3387, name: "BEATRIZ" },
      { id: 3081, name: "BRUNA LUISA" },
    ],

    // paginação / limite
    PAGE_SIZE: 50,
    MAX_TOTAL: 500, // evita carregar 1104 de uma vez; pode aumentar depois
  };

  // ====== Helpers ======
  const el = (tag, attrs = {}, children = []) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") n.className = v;
      else if (k === "style") Object.assign(n.style, v);
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const c of [].concat(children || [])) {
      if (c == null) continue;
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return n;
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function bx(method, params = {}) {
    const url = `${CFG.WORKER_BASE.replace(/\/$/, "")}/bx?method=${encodeURIComponent(method)}&pass=${encodeURIComponent(CFG.PASS)}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params || {}),
    });
    const txt = await resp.text();
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} :: ${txt}`);
    }
    try {
      return JSON.parse(txt);
    } catch {
      return txt;
    }
  }

  // ====== UI ======
  function injectStyles() {
    const css = `
      :root{
        --bg:#f5f7fb;
        --card:#fff;
        --border:rgba(25,30,45,.14);
        --text:#121a28;
        --muted:rgba(18,26,40,.60);
        --radius:16px;
      }
      body{background:var(--bg); font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; color:var(--text);}
      #eq17-wrap{max-width:1400px;margin:18px auto;padding:0 14px;}
      #eq17-top{
        background:var(--card);
        border:1px solid var(--border);
        border-radius:18px;
        padding:14px 14px;
        display:flex;align-items:center;justify-content:space-between;gap:12px;
      }
      #eq17-title{font-weight:900}
      #eq17-sub{font-size:12px;color:var(--muted);margin-top:2px}
      #eq17-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
      .btn{
        border:1px solid var(--border);
        background:#fff;
        border-radius:999px;
        padding:8px 12px;
        font-weight:800;
        cursor:pointer;
      }
      .btn:hover{filter:brightness(.98)}
      .pill{
        border:1px solid var(--border);
        background:#fff;
        border-radius:999px;
        padding:8px 12px;
        font-weight:800;
        font-size:12px;
      }
      #eq17-search{
        border:1px solid var(--border);
        border-radius:999px;
        padding:8px 12px;
        outline:none;
        min-width:240px;
        font-weight:700;
      }
      #eq17-grid{
        margin-top:12px;
        display:grid;
        grid-template-columns: repeat(4, 1fr);
        gap:12px;
      }
      @media (max-width: 1200px){ #eq17-grid{grid-template-columns: repeat(2, 1fr);} }
      @media (max-width: 720px){ #eq17-grid{grid-template-columns: 1fr;} #eq17-search{min-width:160px;} }
      .col{
        background:var(--card);
        border:1px solid var(--border);
        border-radius:18px;
        overflow:hidden;
        min-height:60vh;
        display:flex;flex-direction:column;
      }
      .colhead{
        padding:10px 12px;
        display:flex;align-items:center;justify-content:space-between;gap:8px;
        border-bottom:1px solid rgba(25,30,45,.08);
        font-weight:900;
      }
      .colcount{font-size:12px;color:var(--muted);font-weight:900}
      .colbody{
        padding:10px;
        overflow:auto;
        max-height:72vh;
      }
      .card{
        background:#fff;
        border:1px solid rgba(25,30,45,.12);
        border-radius:16px;
        padding:10px;
        margin-bottom:10px;
        box-shadow:0 1px 0 rgba(0,0,0,.02);
      }
      .ctitle{font-weight:900;font-size:13px;margin-bottom:6px;line-height:1.25}
      .cmeta{font-size:12px;color:var(--muted);font-weight:800}
      .row{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}
      select{
        border:1px solid rgba(25,30,45,.16);
        border-radius:999px;
        padding:6px 10px;
        font-weight:800;
        background:#fff;
      }
      .smallbtn{
        border:1px solid rgba(25,30,45,.16);
        background:#fff;
        border-radius:999px;
        padding:6px 10px;
        font-weight:900;
        cursor:pointer;
      }
      .smallbtn:hover{filter:brightness(.98)}
      #eq17-log{
        margin-top:10px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size:12px;
        background:#0b1020;
        color:#e7ecff;
        border-radius:14px;
        padding:10px 12px;
        border:1px solid rgba(255,255,255,.12);
        white-space:pre-wrap;
      }
    `;
    document.head.appendChild(el("style", {}, [css]));
  }

  function mountRoot() {
    document.body.innerHTML = "";
    injectStyles();

    const wrap = el("div", { id: "eq17-wrap" });

    const left = el("div", {}, [
      el("div", { id: "eq17-title" }, [CFG.TITLE]),
      el("div", { id: "eq17-sub" }, ["Bitrix Sites — Cloudflare Worker (sem CORS)"]),
    ]);

    const search = el("input", {
      id: "eq17-search",
      placeholder: "Buscar por título ou ID...",
      value: "",
    });

    const btnRefresh = el("button", { class: "btn", onclick: () => loadAll() }, ["Atualizar"]);
    const btnTest = el("button", { class: "btn", onclick: () => testConn() }, ["Testar conexão"]);

    const pillDeals = el("div", { class: "pill", id: "pillDeals" }, ["Negócios: ..."]);
    const pillStages = el("div", { class: "pill", id: "pillStages" }, ["Etapas: ..."]);

    const actions = el("div", { id: "eq17-actions" }, [search, btnRefresh, btnTest, pillDeals, pillStages]);

    const top = el("div", { id: "eq17-top" }, [left, actions]);

    const grid = el("div", { id: "eq17-grid" });

    const log = el("div", { id: "eq17-log" }, ["(log)\n"]);

    wrap.appendChild(top);
    wrap.appendChild(grid);
    wrap.appendChild(log);
    document.body.appendChild(wrap);

    return { grid, search, log, pillDeals, pillStages };
  }

  // ====== Data ======
  let UI;
  let STAGES = []; // [{STATUS_ID, NAME}]
  let STAGE_NAME = new Map(); // STATUS_ID -> NAME
  let DEALS = []; // [{ID,TITLE,STAGE_ID,ASSIGNED_BY_ID}]

  function logLine(s) {
    UI.log.textContent = `${UI.log.textContent}${s}\n`;
    UI.log.scrollTop = UI.log.scrollHeight;
  }

  async function testConn() {
    try {
      UI.log.textContent = "(log)\n";
      logLine("Testando Worker + Bitrix...");
      const r = await bx("user.get", { order: { ID: "ASC" }, filter: { ACTIVE: true }, select: ["ID", "NAME"] });
      logLine(`OK: user.get retornou ${Array.isArray(r.result) ? r.result.length : "?"} usuários`);
    } catch (e) {
      logLine(`ERRO: ${e.message}`);
      alert("Falha no teste. Veja o log.");
    }
  }

  async function loadStages() {
    // Bitrix: crm.dealcategory.stage.list
    const r = await bx("crm.dealcategory.stage.list", {
      id: CFG.CATEGORY_ID,
    });

    const list = (r && r.result) || [];
    STAGES = list.map((x) => ({
      STATUS_ID: x.STATUS_ID || x.ID || x.statusId || x.StatusId,
      NAME: x.NAME || x.name || "",
      SORT: Number(x.SORT || 0),
    })).filter(x => x.STATUS_ID);

    STAGES.sort((a, b) => (a.SORT - b.SORT));
    STAGE_NAME = new Map(STAGES.map(s => [s.STATUS_ID, s.NAME]));
    UI.pillStages.textContent = `Etapas: ${STAGES.length}`;
  }

  async function loadDealsPaged() {
    DEALS = [];
    let start = 0;

    while (DEALS.length < CFG.MAX_TOTAL) {
      const r = await bx("crm.deal.list", {
        order: { ID: "DESC" },                 // <- tem que ser OBJETO (array no erro anterior vinha do proxy)
        filter: { CATEGORY_ID: CFG.CATEGORY_ID },
        select: ["ID", "TITLE", "STAGE_ID", "ASSIGNED_BY_ID"],
        start,
      });

      const chunk = (r && r.result) || [];
      DEALS.push(...chunk);

      // Bitrix costuma retornar "next" para paginação
      const next = (r && (r.next ?? (r.result && r.result.next))) || r.next;
      if (!chunk.length || next == null) break;

      start = next;
      if (chunk.length < CFG.PAGE_SIZE) break;

      await sleep(100); // pequena folga
    }

    UI.pillDeals.textContent = `Negócios: ${DEALS.length}`;
  }

  function render() {
    UI.grid.innerHTML = "";

    const q = (UI.search.value || "").trim().toLowerCase();

    const filtered = q
      ? DEALS.filter(d => String(d.ID).includes(q) || String(d.TITLE || "").toLowerCase().includes(q))
      : DEALS;

    // agrupa por ASSIGNED_BY_ID
    const byUser = new Map();
    for (const u of CFG.USERS) byUser.set(String(u.id), []);
    for (const d of filtered) {
      const k = String(d.ASSIGNED_BY_ID || "");
      if (byUser.has(k)) byUser.get(k).push(d);
    }

    for (const u of CFG.USERS) {
      const items = byUser.get(String(u.id)) || [];
      const col = el("div", { class: "col" });
      const head = el("div", { class: "colhead" }, [
        el("div", {}, [`${u.name} (${u.id})`]),
        el("div", { class: "colcount" }, [String(items.length)]),
      ]);
      const body = el("div", { class: "colbody" });

      for (const d of items.slice(0, 200)) {
        const stageName = STAGE_NAME.get(d.STAGE_ID) || d.STAGE_ID;

        const sel = el("select");
        for (const s of STAGES) {
          const opt = el("option", { value: s.STATUS_ID }, [s.NAME || s.STATUS_ID]);
          if (s.STATUS_ID === d.STAGE_ID) opt.selected = true;
          sel.appendChild(opt);
        }

        sel.addEventListener("change", async () => {
          const newStage = sel.value;
          const old = d.STAGE_ID;
          sel.disabled = true;
          try {
            await bx("crm.deal.update", {
              id: Number(d.ID),
              fields: { STAGE_ID: newStage },
            });
            d.STAGE_ID = newStage;
          } catch (e) {
            sel.value = old;
            alert(`Erro ao mover etapa: ${e.message}`);
          } finally {
            sel.disabled = false;
          }
        });

        const btnCopy = el("button", {
          class: "smallbtn",
          onclick: async () => {
            try {
              await navigator.clipboard.writeText(String(d.ID));
            } catch (_) {
              // fallback
              const ta = el("textarea", { style: { position: "fixed", left: "-9999px" } }, [String(d.ID)]);
              document.body.appendChild(ta);
              ta.select();
              document.execCommand("copy");
              ta.remove();
            }
          }
        }, ["Copiar ID"]);

        const card = el("div", { class: "card" }, [
          el("div", { class: "ctitle" }, [String(d.TITLE || "(sem título)")]),
          el("div", { class: "cmeta" }, [`ID ${d.ID} • Etapa: ${stageName}`]),
          el("div", { class: "row" }, [sel, btnCopy]),
        ]);
        body.appendChild(card);
      }

      col.appendChild(head);
      col.appendChild(body);
      UI.grid.appendChild(col);
    }
  }

  async function loadAll() {
    try {
      UI.log.textContent = "(log)\n";
      logLine("Carregando etapas...");
      await loadStages();
      logLine("Carregando negócios...");
      await loadDealsPaged();
      logLine("Renderizando...");
      render();
      logLine("OK ✅");
    } catch (e) {
      logLine(`ERRO: ${e.message}`);
      alert("Falha ao carregar o painel. Veja o log.");
    }
  }

  // ====== Boot ======
  UI = mountRoot();
  UI.search.addEventListener("input", () => render());
  loadAll();
})();
