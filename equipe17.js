/* equipe17.js — Painel Equipes (via Worker Proxy) */
/* Cole este arquivo no GitHub e use via RAW/Pages/Worker */

(function () {
  // =========================
  // 1) CONFIG (EDITAR AQUI)
  // =========================

  // ✅ URL do seu WORKER (proxy) — deve aceitar POST e repassar para o Bitrix
  // Ex.: https://cgd-proxy-bx.workers.dev/bx/
  const PROXY_BASE = "https://cgd-bx-proxy.cgdseguros.workers.dev/bx/"; // <- TROQUE

  // ✅ Logo
  const LOGO_URL =
    "https://bitrix24public.com/b24-6iyx5y.bitrix24.com.br/docs/pub/c77325321d1ad38e8012b995a5f4e8dd/showFile/?&token=q0zmo189kiw9";

  // ✅ Pipeline “principal” do painel (a que o painel lista)
  const CATEGORY_MAIN = 17;

  // ✅ Pipelines cadastradas (para mapear colunas por nome)
  const PIPELINES = [
    { name: "DELTA (Principal)", categoryId: 17, members: ["MANUELA", "MARIA CLARA", "BRUNA LUISA", "BEATRIZ"] },
    { name: "ALPHA", categoryId: 25, members: ["ALINE", "ADRIANA", "ANDREYNA", "MARIANA", "JOSIANE"] },
    { name: "BETA", categoryId: 13, members: ["LIVIA ALVES", "FERNANDA SILVA", "NICOLLE BELMONTE", "ANNA CLARA"] },
  ];

  // ✅ Assistentes (colunas que aparecem no grid)
  const ASSISTENTES = [
    { key: "MANUELA", name: "Manuela", userId: 813 },
    { key: "MARIA CLARA", name: "Maria Clara", userId: 841 },
    { key: "BRUNA LUISA", name: "Bruna Luisa", userId: 3081 },
    { key: "BEATRIZ", name: "Beatriz", userId: 3387 },
  ];

  // ✅ Campos UF
  const UF_URGENCIA = "UF_CRM_1768174982";
  const UF_TAREFA = "UF_CRM_1768185018696";
  const UF_ETAPA = "UF_CRM_1768179977089";
  const UF_COLAB = "UF_CRM_1770327799";
  const UF_PRAZO = "UF_CRM_1768175087";
  const UF_OBS_CANDIDATES = ["UF_CRM_691385BE7D33D", "UF_CRM_691385BE7D33DU"];

  const DONE_STAGE_NAME = "CONCLUÍDO";
  const REFRESH_MS = 60000;

  // =========================
  // 2) BOOTSTRAP / SENTINEL
  // =========================
  function ensureRoot() {
    let root = document.getElementById("eqd-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "eqd-root";
      document.body.appendChild(root);
    }
    return root;
  }

  function ensureSentinel() {
    let s = document.getElementById("eqd-sentinel");
    if (!s) {
      s = document.createElement("div");
      s.id = "eqd-sentinel";
      s.style.cssText =
        "padding:10px;border-radius:12px;background:#fff;border:1px solid rgba(0,0,0,.12);font:800 12px system-ui;display:inline-block;margin:10px";
      s.textContent = "JS iniciou ✅";
      document.body.insertBefore(s, document.body.firstChild);
    }
  }

  function injectCSS(cssText) {
    const id = "eqd-css-injected";
    if (document.getElementById(id)) return;
    const st = document.createElement("style");
    st.id = id;
    st.textContent = cssText;
    document.head.appendChild(st);
  }

  function showFatal(err) {
    try {
      const root = ensureRoot();
      root.innerHTML = `
        <div style="padding:14px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial">
          <div style="font-weight:950;font-size:14px;margin-bottom:8px">Falha ao carregar o painel</div>
          <pre style="white-space:pre-wrap;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:12px;padding:12px;max-width:1100px;overflow:auto">${String(
            err && (err.stack || err.message || err) || err
          )}</pre>
          <div style="font-size:12px;opacity:.7;margin-top:8px">Abra o console (F12) para mais detalhes.</div>
        </div>
      `;
    } catch (_) {}
  }

  window.addEventListener("error", (e) => showFatal(e.error || e.message || e));
  window.addEventListener("unhandledrejection", (e) => showFatal(e.reason || e));

  ensureRoot();
  ensureSentinel();

  // =========================
  // 3) CSS (injetado)
  // =========================
  injectCSS(`
    #eqd-app{
      --bgA:#f7f3ff; --bgB:#f3fbff; --bgC:#fff7fb;
      --border: rgba(30,40,70,.12);
      --text: rgba(18,26,40,.92);
      --muted: rgba(18,26,40,.60);
      --radius: 18px;
      min-height: 100vh;
      padding: 14px;
      font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial;
      color: var(--text);
      background:
        radial-gradient(900px 600px at 15% 20%, rgba(176,140,255,.25), transparent 55%),
        radial-gradient(900px 600px at 85% 20%, rgba(120,210,255,.25), transparent 55%),
        radial-gradient(900px 650px at 55% 95%, rgba(255,150,200,.18), transparent 60%),
        linear-gradient(135deg, var(--bgA), var(--bgB) 50%, var(--bgC));
    }
    #eqd-app.eqd-dark{
      --bgA:#23262b; --bgB:#1f2227; --bgC:#262a31;
      --border: rgba(255,255,255,.10);
      --text: rgba(245,247,252,.92);
      --muted: rgba(245,247,252,.62);
      background:
        radial-gradient(900px 600px at 15% 20%, rgba(120,120,120,.14), transparent 55%),
        radial-gradient(900px 600px at 85% 20%, rgba(100,130,160,.12), transparent 55%),
        radial-gradient(900px 650px at 55% 95%, rgba(160,120,140,.10), transparent 60%),
        linear-gradient(135deg, var(--bgA), var(--bgB) 50%, var(--bgC));
    }
    #eqd-app *{ box-sizing:border-box; }
    .eqd-topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap;}
    .eqd-titleWrap{display:flex;align-items:center;gap:10px;min-width:320px;}
    .eqd-logo{width:40px;height:40px;border-radius:14px;border:1px solid var(--border);background:rgba(255,255,255,.78);object-fit:contain;padding:7px;flex:0 0 auto;}
    #eqd-app.eqd-dark .eqd-logo{background:rgba(255,255,255,.10);}
    .eqd-titleBlock{display:flex;flex-direction:column;gap:2px;}
    .eqd-title{display:flex;align-items:center;gap:10px;font-weight:950;font-size:18px;}
    .eqd-dot{width:10px;height:10px;border-radius:999px;background:#16a34a;box-shadow:0 0 0 6px rgba(22,163,74,.12);}
    .eqd-meta{font-size:12px;color:var(--muted);font-weight:800;}
    .eqd-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;}
    .eqd-pill{font-size:12px;font-weight:900;padding:8px 10px;border-radius:999px;border:1px solid var(--border);background:rgba(255,255,255,.75);color:rgba(18,26,40,.85);white-space:nowrap;}
    #eqd-app.eqd-dark .eqd-pill{background:rgba(255,255,255,.08);color:var(--text);}
    .eqd-btn{border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.85);border-radius:999px;padding:8px 12px;font-size:12px;font-weight:950;cursor:pointer;white-space:nowrap;color:rgba(18,26,40,.92);}
    #eqd-app.eqd-dark .eqd-btn{background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.12);color:var(--text);}
    .eqd-btnPrimary{background:rgba(120,90,255,.18);border-color:rgba(120,90,255,.35);}
    .eqd-btnDanger{background:rgba(255,70,90,.14);border-color:rgba(255,70,90,.30);}
    .eqd-searchWrap{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end;}
    .eqd-searchInput{width:min(340px,54vw);border:1px solid var(--border);background:#fff;border-radius:999px;padding:9px 12px;font-size:12px;font-weight:900;outline:none;color:rgba(18,26,40,.92);}
    #eqd-app.eqd-dark .eqd-searchInput{background:rgba(255,255,255,.10);color:var(--text);}
    .eqd-searchSelect{border:1px solid var(--border);background:rgba(255,255,255,.85);border-radius:999px;padding:8px 10px;font-size:12px;font-weight:950;outline:none;min-width:160px;color:rgba(18,26,40,.92);}
    #eqd-app.eqd-dark .eqd-searchSelect{background:rgba(255,255,255,.10);color:var(--text);}
    .eqd-grid{display:grid;grid-template-columns:repeat(4,minmax(280px,1fr));gap:12px;}
    .eqd-assist{border:1px solid var(--border);border-radius:var(--radius);background:rgba(255,255,255,.45);backdrop-filter:blur(12px);overflow:hidden;min-width:0;display:flex;flex-direction:column;min-height:74vh;}
    #eqd-app.eqd-dark .eqd-assist{background:rgba(255,255,255,.06);}
    .eqd-head{padding:10px 12px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.62);display:flex;align-items:center;justify-content:space-between;gap:10px;}
    #eqd-app.eqd-dark .eqd-head{background:rgba(255,255,255,.08);}
    .eqd-headLeft{display:flex;align-items:center;gap:10px;min-width:0;cursor:pointer;user-select:none;}
    .eqd-avatar,.eqd-avatarFallback{width:45px;height:45px;border-radius:999px;border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.88);object-fit:cover;flex:0 0 auto;}
    .eqd-avatarFallback{display:flex;align-items:center;justify-content:center;}
    #eqd-app.eqd-dark .eqd-avatar,#eqd-app.eqd-dark .eqd-avatarFallback{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.12);}
    .eqd-headText{display:flex;flex-direction:column;gap:2px;min-width:0;}
    .eqd-name{font-size:16px;font-weight:950;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .eqd-sub{font-size:11px;color:var(--muted);font-weight:800;}
    .eqd-col{padding:10px;display:flex;flex-direction:column;gap:8px;overflow:auto;min-height:0;flex:1 1 auto;scrollbar-gutter:stable;-webkit-overflow-scrolling:touch;}
    .eqd-card{--accent-rgb:140,160,240;position:relative;border-radius:16px;border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.82);overflow:hidden;box-shadow:0 8px 18px rgba(20,25,35,.08),0 10px 26px rgba(var(--accent-rgb),.10);flex:0 0 auto;color:rgba(18,26,40,.92);}
    #eqd-app.eqd-dark .eqd-card{background:#f3f1eb;border-color:rgba(0,0,0,.12);color:rgba(18,26,40,.92);}
    .eqd-bar{height:6px;background:rgb(var(--accent-rgb));}
    .eqd-inner{padding:9px 10px;display:flex;flex-direction:column;gap:6px;}
    .eqd-task{font-size:13px;font-weight:950;line-height:1.15;}
    .eqd-tags{display:flex;gap:6px;flex-wrap:wrap;align-items:center;}
    .eqd-tag{font-size:10.5px;padding:2px 7px;border-radius:999px;border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.78);color:rgba(18,26,40,.72);white-space:nowrap;}
    .eqd-tagLate{border-color:rgba(255,80,120,.55);background:rgba(255,80,120,.22);font-weight:950;color:rgba(130,0,50,.95);animation:eqdBlink 1.6s ease-in-out infinite;}
    .eqd-tagUrg{border-color:rgba(255,45,70,.55);background:rgba(255,45,70,.18);font-weight:950;color:rgba(140,0,20,.98);animation:eqdBlinkUrg 1.05s ease-in-out infinite;}
    @keyframes eqdBlink{0%,100%{opacity:1}50%{opacity:.55}}
    @keyframes eqdBlinkUrg{0%,100%{opacity:1}50%{opacity:.35}}
    .eqd-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:2px;font-size:10.5px;color:rgba(18,26,40,.66);}
    .eqd-cardActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;}
    .eqd-smallBtn{cursor:pointer;border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.88);border-radius:999px;padding:6px 9px;font-size:11px;font-weight:950;color:rgba(18,26,40,.92);}
    .eqd-smallBtnPrimary{background:rgba(22,163,74,.14);border-color:rgba(22,163,74,.30);}
    .eqd-smallBtnDanger{background:rgba(255,70,90,.14);border-color:rgba(255,70,90,.30);}
    .eqd-empty{border:1px dashed rgba(30,40,70,.18);border-radius:16px;padding:12px;background:rgba(255,255,255,.55);color:rgba(18,26,40,.62);font-size:11px;font-weight:800;text-align:center;}
    @media (max-width:1200px){.eqd-grid{grid-template-columns:1fr}.eqd-assist{min-height:60vh}}
    .eqd-modalOverlay{position:fixed;inset:0;background:rgba(10,14,22,.35);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:16px;z-index:99999;}
    .eqd-modal{width:min(920px,96vw);max-height:86vh;border-radius:18px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.78);box-shadow:0 20px 60px rgba(10,14,22,.25);overflow:hidden;display:flex;flex-direction:column;}
    #eqd-app.eqd-dark .eqd-modal{background:rgba(25,28,34,.92);border-color:rgba(255,255,255,.10);color:var(--text);}
    .eqd-modalHead{padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px solid rgba(30,40,70,.12);background:rgba(255,255,255,.82);}
    #eqd-app.eqd-dark .eqd-modalHead{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.10);}
    .eqd-modalTitle{font-size:12px;font-weight:950;text-transform:uppercase;}
    .eqd-modalClose{border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.90);border-radius:999px;padding:6px 10px;font-size:12px;font-weight:900;cursor:pointer;}
    #eqd-app.eqd-dark .eqd-modalClose{background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.12);color:var(--text);}
    .eqd-modalBody{padding:12px 14px;overflow:auto;display:flex;flex-direction:column;gap:10px;}
    .eqd-warn{border:1px solid rgba(255,80,120,.28);background:rgba(255,220,235,.55);color:rgba(120,0,40,.92);padding:10px 12px;border-radius:14px;font-size:11px;font-weight:900;white-space:pre-wrap;display:none;}
  `);

  // =========================
  // 4) HELPERS / PROXY BX
  // =========================
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function toPairs(prefix, obj, out) {
    out = out || [];
    if (obj === null || obj === undefined) return out;
    if (typeof obj === "object" && !Array.isArray(obj)) {
      for (const k of Object.keys(obj)) {
        const key = prefix ? `${prefix}[${k}]` : k;
        toPairs(key, obj[k], out);
      }
      return out;
    }
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const key = prefix ? `${prefix}[${i}]` : String(i);
        toPairs(key, obj[i], out);
      }
      return out;
    }
    out.push([prefix, String(obj)]);
    return out;
  }

  async function fetchWithTimeout(url, options, timeoutMs) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: ctrl.signal });
    } finally {
      clearTimeout(t);
    }
  }

  // ✅ fila para não estourar rate limit
  let BX_QUEUE = Promise.resolve();
  let BX_INFLIGHT = 0;

  async function bxRaw(method, params = {}) {
    BX_QUEUE = BX_QUEUE.then(async () => {
      BX_INFLIGHT++;
      try {
        const pairs = toPairs("", params, []);
        const body = new URLSearchParams();
        for (const [k, v] of pairs) {
          if (!k) continue;
          body.append(k, v);
        }

        const maxTry = 4;
        let lastErr = null;

        for (let attempt = 1; attempt <= maxTry; attempt++) {
          try {
            if (attempt > 1) {
              const base = 350 * Math.pow(2, attempt - 2);
              const jitter = Math.floor(Math.random() * 180);
              await sleep(base + jitter);
            }

            // ✅ Chama o WORKER: POST PROXY_BASE + method
            const resp = await fetchWithTimeout(PROXY_BASE + method, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
              body,
            }, 15000);

            if (resp.status === 429 || resp.status === 502 || resp.status === 503 || resp.status === 504) {
              throw new Error(`HTTP ${resp.status} (temporário) em ${method}`);
            }

            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) throw new Error(`HTTP ${resp.status} em ${method}`);
            if (data.error) throw new Error(data.error_description || data.error);

            return data;
          } catch (e) {
            lastErr = e;
          }
        }

        throw lastErr;
      } finally {
        BX_INFLIGHT--;
      }
    });

    return BX_QUEUE;
  }

  async function bx(method, params = {}) {
    const data = await bxRaw(method, params);
    return data.result;
  }

  async function bxAll(method, params = {}) {
    let all = [];
    let start = 0;
    while (true) {
      const data = await bxRaw(method, { ...params, start });
      const chunk = data.result || [];
      all = all.concat(chunk);
      if (data.next === undefined || data.next === null) break;
      start = data.next;
    }
    return all;
  }

  // =========================
  // 5) UTILS
  // =========================
  function norm(s) {
    return String(s || "")
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }
  function trunc(s, max) {
    s = String(s || "").trim();
    if (!s) return "";
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
  }
  function escHtml(s) {
    s = s === null || s === undefined ? "" : String(s);
    return s
      .replace(/&/g, "&" + "amp;")
      .replace(/</g, "&" + "lt;")
      .replace(/>/g, "&" + "gt;")
      .replace(/"/g, "&" + "quot;")
      .replace(/'/g, "&#039;");
  }
  function fmt(dt) {
    if (!dt) return "—";
    const x = new Date(dt);
    if (Number.isNaN(x.getTime())) return String(dt);
    const dd = String(x.getDate()).padStart(2, "0");
    const mm = String(x.getMonth() + 1).padStart(2, "0");
    const hh = String(x.getHours()).padStart(2, "0");
    const mi = String(x.getMinutes()).padStart(2, "0");
    return `${dd}/${mm} ${hh}:${mi}`;
  }
  function fmtDateOnly(d) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }
  function dayStart(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0); }
  function dayEnd(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); }

  function localInputToIsoWithOffset(v) {
    v = String(v || "").trim();
    if (!v) return "";
    const dt = new Date(v);
    if (Number.isNaN(dt.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const y = dt.getFullYear();
    const m = pad(dt.getMonth() + 1);
    const d = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const mi = pad(dt.getMinutes());
    const offMin = -dt.getTimezoneOffset();
    const sign = offMin >= 0 ? "+" : "-";
    const abs = Math.abs(offMin);
    const oh = pad(Math.floor(abs / 60));
    const om = pad(abs % 60);
    return `${y}-${m}-${d}T${hh}:${mi}:00${sign}${oh}:${om}`;
  }

  function dateToIsoWithLocalOffset(dt) {
    const pad = (n) => String(n).padStart(2, "0");
    const y = dt.getFullYear();
    const m = pad(dt.getMonth() + 1);
    const d = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const mi = pad(dt.getMinutes());
    const offMin = -dt.getTimezoneOffset();
    const sign = offMin >= 0 ? "+" : "-";
    const abs = Math.abs(offMin);
    const oh = pad(Math.floor(abs / 60));
    const om = pad(abs % 60);
    return `${y}-${m}-${d}T${hh}:${mi}:00${sign}${oh}:${om}`;
  }

  // =========================
  // 6) STATE / ENUMS / STAGES
  // =========================
  const STATE = {
    dealsAll: [],
    dealsOpen: [],
    dealsByAssistKey: new Map(),
    stageCacheByCategory: new Map(),
    enumCache: new Map(),
    obsField: null,
    colabIsEnum: null,

    userPhotoById: new Map(),
    userNameById: new Map(),
  };

  async function enums(uf) {
    if (STATE.enumCache.has(uf)) return STATE.enumCache.get(uf);

    const list = await bx("crm.deal.userfield.list", { filter: { FIELD_NAME: uf } });
    const f = Array.isArray(list) ? list[0] : null;
    if (!f || !f.ID) {
      STATE.enumCache.set(uf, {});
      return {};
    }
    const d = await bx("crm.deal.userfield.get", { id: f.ID });
    const m = {};
    (d.LIST || []).forEach((e) => (m[String(e.ID)] = String(e.VALUE)));
    STATE.enumCache.set(uf, m);
    return m;
  }

  async function enumHasOptions(uf) {
    const m = await enums(uf);
    return m && Object.keys(m).length > 0;
  }

  async function detectObsField() {
    if (STATE.obsField) return STATE.obsField;
    const f = await bx("crm.deal.fields", {});
    for (const cand of UF_OBS_CANDIDATES) {
      if (f && Object.prototype.hasOwnProperty.call(f, cand)) {
        STATE.obsField = cand;
        return cand;
      }
    }
    STATE.obsField = UF_OBS_CANDIDATES[0];
    return STATE.obsField;
  }

  async function loadStagesForCategory(categoryId) {
    const cid = Number(categoryId);
    if (STATE.stageCacheByCategory.has(cid)) return STATE.stageCacheByCategory.get(cid);

    const stages = await bx("crm.dealcategory.stage.list", { id: cid });
    const stageMapByName = new Map();
    let doneStageId = null;

    (stages || []).forEach((s) => {
      stageMapByName.set(norm(s.NAME), String(s.STATUS_ID));
      if (norm(s.NAME).includes(norm(DONE_STAGE_NAME))) doneStageId = String(s.STATUS_ID);
    });

    // map stageId -> memberKey
    const stageIdToAssistKey = new Map();
    const pipe = PIPELINES.find((p) => Number(p.categoryId) === cid);
    const members = (pipe && Array.isArray(pipe.members)) ? pipe.members : [];

    for (const memberKey of members) {
      const nk = norm(memberKey);
      for (const [stageNameNorm, stageId] of stageMapByName.entries()) {
        if (stageNameNorm === nk || stageNameNorm.includes(nk) || nk.includes(stageNameNorm)) {
          stageIdToAssistKey.set(String(stageId), memberKey);
        }
      }
    }

    const cache = { stageMapByName, doneStageId, stageIdToAssistKey, members };
    STATE.stageCacheByCategory.set(cid, cache);
    return cache;
  }

  async function loadStagesAllPipelines() {
    for (const p of PIPELINES) await loadStagesForCategory(p.categoryId);
  }

  async function stageIdForMemberInCategory(memberKey, categoryId) {
    const cache = await loadStagesForCategory(categoryId);
    const exact = cache.stageMapByName.get(norm(memberKey));
    if (exact) return exact;
    for (const [k, v] of cache.stageMapByName.entries()) {
      if (k.includes(norm(memberKey))) return v;
    }
    return null;
  }

  async function ensureUserPhoto(userId, fallbackName) {
    const id = Number(userId);
    if (!id) return "";
    if (STATE.userPhotoById.has(id)) return STATE.userPhotoById.get(id) || "";

    let photoUrl = "";
    let name = String(fallbackName || "").trim();

    try {
      const res = await bx("user.get", { ID: id });
      const u = Array.isArray(res) ? res[0] : res;
      if (u) {
        const fn = [u.NAME, u.LAST_NAME].filter(Boolean).join(" ").trim();
        if (fn) name = fn;
        STATE.userNameById.set(id, name);
        const p = u.PERSONAL_PHOTO;
        if (p && typeof p === "string" && /^https?:\/\//i.test(p)) photoUrl = p;
      }
    } catch (_) {}

    STATE.userPhotoById.set(id, photoUrl || "");
    if (!STATE.userNameById.has(id)) STATE.userNameById.set(id, name);
    return photoUrl || "";
  }

  // =========================
  // 7) APP UI (HTML base)
  // =========================
  const root = ensureRoot();
  root.innerHTML = `
    <div id="eqd-app">
      <div class="eqd-topbar">
        <div class="eqd-titleWrap">
          <img class="eqd-logo" src="${LOGO_URL}" alt="CGD" referrerpolicy="no-referrer">
          <div class="eqd-titleBlock">
            <div class="eqd-title"><span class="eqd-dot"></span>Equipe Δ DELTA — Painel</div>
            <div class="eqd-meta" id="eqd-meta">Carregando…</div>
          </div>
        </div>

        <div class="eqd-actions">
          <div class="eqd-pill" id="eqd-dayPill">Dia: —</div>
          <div class="eqd-pill" id="eqd-status">JS: ok</div>

          <div class="eqd-searchWrap">
            <select class="eqd-searchSelect" id="eqd-viewAssist"></select>
            <input class="eqd-searchInput" id="eqd-searchInput" placeholder="Buscar por palavra (negócio/obs)..." />
            <button class="eqd-btn eqd-btnPrimary" id="eqd-searchBtn">Buscar</button>
          </div>

          <button class="eqd-btn" id="eqd-today">HOJE</button>
          <button class="eqd-btn" id="eqd-refresh">Atualizar</button>
          <button class="eqd-btn" id="eqd-darkToggle">Modo escuro</button>
        </div>
      </div>

      <div id="eqd-main"></div>

      <div class="eqd-modalOverlay" id="eqd-modalOverlay" aria-hidden="true">
        <div class="eqd-modal" role="dialog" aria-modal="true">
          <div class="eqd-modalHead">
            <div class="eqd-modalTitle" id="eqd-modalTitle">—</div>
            <button class="eqd-modalClose" id="eqd-modalClose">Fechar</button>
          </div>
          <div class="eqd-modalBody" id="eqd-modalBody"></div>
        </div>
      </div>
    </div>
  `;

  const el = {
    app: document.getElementById("eqd-app"),
    meta: document.getElementById("eqd-meta"),
    status: document.getElementById("eqd-status"),
    dayPill: document.getElementById("eqd-dayPill"),
    main: document.getElementById("eqd-main"),
    refresh: document.getElementById("eqd-refresh"),
    todayBtn: document.getElementById("eqd-today"),
    viewAssist: document.getElementById("eqd-viewAssist"),
    searchInput: document.getElementById("eqd-searchInput"),
    searchBtn: document.getElementById("eqd-searchBtn"),
    darkToggle: document.getElementById("eqd-darkToggle"),
    modalOverlay: document.getElementById("eqd-modalOverlay"),
    modalTitle: document.getElementById("eqd-modalTitle"),
    modalBody: document.getElementById("eqd-modalBody"),
    modalClose: document.getElementById("eqd-modalClose"),
  };

  // =========================
  // 8) DARK TOGGLE
  // =========================
  const DARK_KEY = "eqd_dark_gray_v2";
  function applyDark(on) {
    if (on) el.app.classList.add("eqd-dark");
    else el.app.classList.remove("eqd-dark");
    el.darkToggle.textContent = on ? "Modo claro" : "Modo escuro";
    try { localStorage.setItem(DARK_KEY, on ? "1" : "0"); } catch (_) {}
  }
  (function initDark() {
    let on = false;
    try { on = localStorage.getItem(DARK_KEY) === "1"; } catch (_) {}
    applyDark(on);
  })();
  el.darkToggle.addEventListener("click", () => applyDark(!el.app.classList.contains("eqd-dark")));

  // =========================
  // 9) MODAL
  // =========================
  function openModal(title, bodyHTML) {
    el.modalTitle.textContent = title || "—";
    el.modalBody.innerHTML = bodyHTML || "";
    el.modalOverlay.style.display = "flex";
    el.modalOverlay.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    el.modalOverlay.style.display = "none";
    el.modalOverlay.setAttribute("aria-hidden", "true");
    el.modalBody.onclick = null;
  }
  el.modalClose.addEventListener("click", closeModal);
  el.modalOverlay.addEventListener("click", (e) => { if (e.target === el.modalOverlay) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  function setSoftStatus(msg) { el.status.textContent = msg || "JS: ok"; }
  function setBusy(msg) { el.status.textContent = msg || "Executando…"; }
  function clearBusy() { el.status.textContent = "JS: ok"; }

  // =========================
  // 10) CORE (deals)
  // =========================
  let selectedDate = new Date();
  let viewAssistFilter = "__ALL__";
  let focusAssistKey = null;
  let SEARCH_LAST_IDS = [];

  function isUrgenteText(urgTxt) {
    const u = norm(urgTxt);
    if (!u) return false;
    if (u.includes("ATEN")) return false;
    return u.includes("URG");
  }
  function isAtencaoText(urgTxt) {
    const u = norm(urgTxt);
    return u.includes("ATEN");
  }
  function isEmAndamento(etapaTxt) {
    const e = norm(etapaTxt);
    return e.includes("EM ANDAMENTO");
  }

  function prazoMs(d) {
    const v = d && d._prazo;
    if (!v) return Number.POSITIVE_INFINITY;
    const x = new Date(v);
    const t = x.getTime();
    return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
  }
  function createdMs(d) {
    const x = d && d.DATE_CREATE ? new Date(d.DATE_CREATE) : null;
    const t = x ? x.getTime() : NaN;
    return Number.isFinite(t) ? t : 0;
  }
  function sortWithinGroup(list) {
    return (list || []).slice().sort((a, b) => {
      const ea = isEmAndamento(a._etapaTxt) ? 0 : 1;
      const eb = isEmAndamento(b._etapaTxt) ? 0 : 1;
      if (ea !== eb) return ea - eb;

      const ua = isUrgenteText(a._urgTxt) ? 0 : 1;
      const ub = isUrgenteText(b._urgTxt) ? 0 : 1;
      if (ua !== ub) return ua - ub;

      const pa = prazoMs(a), pb = prazoMs(b);
      if (pa !== pb) return pa - pb;

      return createdMs(a) - createdMs(b);
    });
  }

  function bestTitleFromText(txt) {
    const t = String(txt || "").trim();
    if (!t) return "Negócio";
    const first = t.split("\n")[0].trim();
    return trunc(first || "Negócio", 72);
  }

  function updateDealCache(dealId, patch) {
    const id = String(dealId);
    const apply = (d) => Object.assign(d, patch || {});
    for (const d of (STATE.dealsAll || [])) { if (String(d.ID) === id) { apply(d); break; } }
    for (const d of (STATE.dealsOpen || [])) { if (String(d.ID) === id) { apply(d); break; } }
    for (const arr of (STATE.dealsByAssistKey || new Map()).values()) {
      for (const d of (arr || [])) { if (String(d.ID) === id) { apply(d); break; } }
    }
  }

  function removeFromOpen(dealId) {
    const id = String(dealId);
    STATE.dealsOpen = (STATE.dealsOpen || []).filter((d) => String(d.ID) !== id);
    for (const [k, arr] of (STATE.dealsByAssistKey || new Map()).entries()) {
      STATE.dealsByAssistKey.set(k, (arr || []).filter((d) => String(d.ID) !== id));
    }
  }

  function parseDeal(deal, maps) {
    const { urgMap, tarefaMap, etapaMap, colabMapMaybe } = maps;

    const prazoRaw = deal[UF_PRAZO];
    const prazoDate = prazoRaw ? new Date(prazoRaw) : null;
    const prazoOk = prazoDate && !Number.isNaN(prazoDate.getTime());

    const now = new Date();
    const late = prazoOk ? prazoDate.getTime() < now.getTime() : false;

    const urgId = String(deal[UF_URGENCIA] || "").trim();
    const urgTxt = urgId ? String((urgMap || {})[urgId] || "").trim() : "";

    const tarefaId = String(deal[UF_TAREFA] || "").trim();
    const tarefaTxt = tarefaId ? String((tarefaMap || {})[tarefaId] || tarefaId || "").trim() : "";

    const etapaId = String(deal[UF_ETAPA] || "").trim();
    const etapaTxt = etapaId ? String((etapaMap || {})[etapaId] || etapaId || "").trim() : "";

    const colabRaw = deal[UF_COLAB];
    const colabId = String(colabRaw || "").trim();
    let colabTxt = "";
    if (colabId) {
      const mapped = colabMapMaybe && colabMapMaybe[colabId];
      colabTxt = String(mapped || colabId).trim();
    }

    const negocioTxt = String(deal.TITLE || "").trim();
    const obsField = STATE.obsField || UF_OBS_CANDIDATES[0];
    const obsTxt = String(deal[obsField] || "").trim();

    const cacheMain = STATE.stageCacheByCategory.get(Number(CATEGORY_MAIN));
    const assistKey = cacheMain ? cacheMain.stageIdToAssistKey.get(String(deal.STAGE_ID)) || "" : "";

    // accent
    const seed = String(deal.ID || deal.TITLE || "Tarefa");
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    const hue = (h >>> 0) % 360;
    const s = 0.45, l = 0.55;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (hue < 60) { r = c; g = x; }
    else if (hue < 120) { r = x; g = c; }
    else if (hue < 180) { g = c; b = x; }
    else if (hue < 240) { g = x; b = c; }
    else if (hue < 300) { r = x; b = c; }
    else { r = c; b = x; }
    const accent = `${Math.round((r + m) * 255)},${Math.round((g + m) * 255)},${Math.round((b + m) * 255)}`;

    return Object.assign(deal, {
      _negocio: negocioTxt,
      _obsExtra: obsTxt,
      _prazo: prazoOk ? prazoDate.toISOString() : "",
      _late: late,
      _urgId: urgId,
      _urgTxt: urgTxt,
      _assistKey: assistKey,
      _tarefaId: tarefaId,
      _tarefaTxt: tarefaTxt,
      _etapaId: etapaId,
      _etapaTxt: etapaTxt,
      _colabId: colabId,
      _colabTxt: colabTxt,
      _accent: accent,
    });
  }

  async function loadDeals() {
    const obsField = await detectObsField();

    const [urgMap, tarefaMap, etapaMap] = await Promise.all([
      enums(UF_URGENCIA),
      enums(UF_TAREFA),
      enums(UF_ETAPA),
    ]);

    if (STATE.colabIsEnum === null) {
      try { STATE.colabIsEnum = await enumHasOptions(UF_COLAB); } catch (_) { STATE.colabIsEnum = false; }
    }
    let colabMapMaybe = {};
    if (STATE.colabIsEnum) {
      try { colabMapMaybe = await enums(UF_COLAB); } catch (_) { colabMapMaybe = {}; }
    }

    const select = [
      "ID", "TITLE", "STAGE_ID", "DATE_CREATE", "DATE_MODIFY", "ASSIGNED_BY_ID",
      UF_TAREFA, obsField, UF_PRAZO, UF_URGENCIA, UF_ETAPA, UF_COLAB,
    ];

    const deals = await bxAll("crm.deal.list", {
      filter: { CATEGORY_ID: CATEGORY_MAIN },
      select,
      order: { ID: "DESC" },
    });

    const maps = { urgMap, tarefaMap, etapaMap, colabMapMaybe };
    const parsed = (deals || []).map((d) => parseDeal(d, maps));
    STATE.dealsAll = parsed;

    const cacheMain = await loadStagesForCategory(CATEGORY_MAIN);
    const doneStageId = cacheMain.doneStageId;

    const open = [];
    for (const d of parsed) {
      if (doneStageId && String(d.STAGE_ID) === String(doneStageId)) continue;
      open.push(d);
    }
    STATE.dealsOpen = open;

    STATE.dealsByAssistKey = new Map();
    for (const a of ASSISTENTES) STATE.dealsByAssistKey.set(a.key, []);
    for (const d of open) {
      const ak = d._assistKey;
      if (!ak) continue;
      if (!STATE.dealsByAssistKey.has(ak)) STATE.dealsByAssistKey.set(ak, []);
      STATE.dealsByAssistKey.get(ak).push(d);
    }

    await Promise.all(ASSISTENTES.map((a) => ensureUserPhoto(a.userId, a.name)));
  }

  // =========================
  // 11) RENDER
  // =========================
  function buildAssistSelect() {
    const opts = [`<option value="__ALL__">Todas</option>`].concat(
      ASSISTENTES.map((a) => `<option value="${a.key}">${a.name}</option>`)
    );
    el.viewAssist.innerHTML = opts.join("");
  }
  buildAssistSelect();

  function inSelectedDay(isoOrEmpty) {
    if (!isoOrEmpty) return false;
    const t = new Date(isoOrEmpty).getTime();
    if (!Number.isFinite(t)) return false;
    const ds = dayStart(selectedDate).getTime();
    const de = dayEnd(selectedDate).getTime();
    return t >= ds && t <= de;
  }

  function buildOrderedListForAssist(deals) {
    const ds = dayStart(selectedDate).getTime();
    const de = dayEnd(selectedDate).getTime();

    const urgentDay = deals.filter((d) => {
      if (!isUrgenteText(d._urgTxt)) return false;
      const p = d._prazo ? new Date(d._prazo) : null;
      if (!p || Number.isNaN(p.getTime())) return false;
      const t = p.getTime();
      return t >= ds && t <= de;
    });

    const overdue = deals.filter((d) => d._late);

    const dayTasks = deals.filter((d) => {
      const p = d._prazo ? new Date(d._prazo) : null;
      if (!p || Number.isNaN(p.getTime())) return false;
      const t = p.getTime();
      return t >= ds && t <= de;
    });

    const seen = new Set();
    const out = [];
    for (const d of sortWithinGroup(urgentDay)) { if (!seen.has(d.ID)) { out.push(d); seen.add(d.ID); } }
    for (const d of sortWithinGroup(overdue)) { if (!seen.has(d.ID)) { out.push(d); seen.add(d.ID); } }
    for (const d of sortWithinGroup(dayTasks)) { if (!seen.has(d.ID)) { out.push(d); seen.add(d.ID); } }

    out.sort((a, b) => {
      const ea = isEmAndamento(a._etapaTxt) ? 0 : 1;
      const eb = isEmAndamento(b._etapaTxt) ? 0 : 1;
      if (ea !== eb) return ea - eb;
      return 0;
    });

    return out;
  }

  function makeAvatarHTML(assist) {
    const url = STATE.userPhotoById.get(Number(assist.userId)) || "";
    if (!url) return `<div class="eqd-avatarFallback"></div>`;
    return `
      <img class="eqd-avatar"
           src="${url}"
           alt="${assist.name}"
           referrerpolicy="no-referrer"
           onerror="try{this.onerror=null;const d=document.createElement('div');d.className='eqd-avatarFallback';this.replaceWith(d);}catch(e){}">
    `;
  }

  function makeDealCard(deal) {
    const showWarn = isAtencaoText(deal._urgTxt);
    const title = (showWarn ? "⚠️ " : "") + bestTitleFromText(deal._negocio || "");

    const prazoTxt = deal._prazo ? fmt(deal._prazo) : "Sem prazo";
    const tags = [];

    if (isUrgenteText(deal._urgTxt)) tags.push(`<span class="eqd-tag eqd-tagUrg">URGENTE</span>`);
    if (deal._late) tags.push(`<span class="eqd-tag eqd-tagLate">ATRASADA</span>`);
    if (deal._tarefaTxt) tags.push(`<span class="eqd-tag">Tipo: ${trunc(deal._tarefaTxt, 26)}</span>`);
    if (deal._colabTxt) tags.push(`<span class="eqd-tag">COLAB: ${trunc(deal._colabTxt, 28)}</span>`);
    if (deal._etapaTxt) tags.push(`<span class="eqd-tag">ETAPA: ${trunc(deal._etapaTxt, 18)}</span>`);
    if (deal._urgTxt) tags.push(`<span class="eqd-tag">${trunc(deal._urgTxt, 22)}</span>`);

    return `
      <div class="eqd-card" style="--accent-rgb:${deal._accent}" data-deal="${deal.ID}">
        <div class="eqd-bar"></div>
        <div class="eqd-inner">
          <div class="eqd-task">${escHtml(title)}</div>
          ${tags.length ? `<div class="eqd-tags">${tags.join("")}</div>` : ``}
          <div class="eqd-foot">
            <span>Prazo: <strong>${escHtml(prazoTxt)}</strong></span>
            <span>ID: <strong>${escHtml(deal.ID)}</strong></span>
          </div>
          <div class="eqd-cardActions">
            <button class="eqd-smallBtn eqd-smallBtnPrimary" data-action="done" data-id="${deal.ID}">Concluir</button>
            <button class="eqd-smallBtn eqd-smallBtnDanger" data-action="delete" data-id="${deal.ID}">Excluir</button>
          </div>
        </div>
      </div>
    `;
  }

  function makeAssistCard(assist) {
    const id = assist.key.replace(/\s+/g, "_");
    return `
      <section class="eqd-assist" data-assist="${assist.key}">
        <header class="eqd-head">
          <div class="eqd-headLeft" data-action="openFocus" data-assist="${assist.key}">
            ${makeAvatarHTML(assist)}
            <div class="eqd-headText">
              <div class="eqd-name">${escHtml(assist.key)}</div>
              <div class="eqd-sub" id="sub_${id}">Carregando…</div>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:flex-end">
            <button class="eqd-btn" data-action="new" data-assist="${assist.key}">+ Nova tarefa</button>
          </div>
        </header>
        <div class="eqd-col" id="list_${id}">
          <div class="eqd-empty">Carregando…</div>
        </div>
      </section>
    `;
  }

  function setList(elList, htmlCards) {
    elList.innerHTML = "";
    if (!htmlCards || !htmlCards.length) {
      elList.innerHTML = `<div class="eqd-empty">Sem itens</div>`;
      return;
    }
    elList.insertAdjacentHTML("beforeend", htmlCards.join(""));
  }

  function renderAssist(assist) {
    const id = assist.key.replace(/\s+/g, "_");
    const listEl = document.getElementById("list_" + id);
    const subEl = document.getElementById("sub_" + id);

    const deals = STATE.dealsByAssistKey.get(assist.key) || [];
    const ordered = buildOrderedListForAssist(deals);

    setList(listEl, ordered.map(makeDealCard));
    subEl.textContent = `Itens: ${ordered.length} (na coluna: ${deals.length})`;
  }

  function renderGrid() {
    const isAll = viewAssistFilter === "__ALL__";
    const toShow = isAll ? ASSISTENTES : ASSISTENTES.filter((a) => a.key === viewAssistFilter);

    el.main.innerHTML = `<div class="eqd-grid" id="eqd-grid"></div>`;
    const grid = document.getElementById("eqd-grid");
    grid.style.gridTemplateColumns = isAll ? "repeat(4, minmax(280px, 1fr))" : "1fr";
    grid.innerHTML = toShow.map(makeAssistCard).join("");
    toShow.forEach(renderAssist);

    el.dayPill.textContent = `Dia: ${fmtDateOnly(selectedDate)}`;
  }

  let REFRESH_RUNNING = false;
  let REFRESH_PENDING = false;
  let REFRESH_TIMER = null;

  function scheduleRefresh(force, delayMs) {
    if (REFRESH_TIMER) clearTimeout(REFRESH_TIMER);
    REFRESH_TIMER = setTimeout(() => {
      renderAll(!!force).catch(() => {});
    }, Math.max(0, delayMs || 0));
  }

  async function actionSetDone(dealId) {
    const cacheMain = await loadStagesForCategory(CATEGORY_MAIN);
    if (!cacheMain.doneStageId) throw new Error("Não encontrei a coluna CONCLUÍDO na pipeline.");
    await bx("crm.deal.update", { id: String(dealId), fields: { STAGE_ID: cacheMain.doneStageId } });
  }
  async function actionDeleteDeal(dealId) {
    await bx("crm.deal.delete", { id: String(dealId) });
  }

  async function actionCreateDeal(assistKey, negocioTitle, prazoIso, uf) {
    const categoryId = Number(CATEGORY_MAIN);
    const stageId = await stageIdForMemberInCategory(assistKey, categoryId);
    if (!stageId) throw new Error(`Não encontrei a coluna ${assistKey} na pipeline.`);

    const assist = ASSISTENTES.find((x) => x.key === assistKey);
    const assignedId = assist ? assist.userId : undefined;
    const title = bestTitleFromText(negocioTitle);

    const fields = { CATEGORY_ID: categoryId, STAGE_ID: String(stageId), TITLE: title };
    if (assignedId) fields.ASSIGNED_BY_ID = assignedId;
    fields[UF_PRAZO] = prazoIso || "";

    if (uf) {
      if (uf.urgencia) fields[UF_URGENCIA] = uf.urgencia;
      if (uf.tarefa) fields[UF_TAREFA] = uf.tarefa;
      if (uf.etapa) fields[UF_ETAPA] = uf.etapa;
      if (uf.colab !== undefined) fields[UF_COLAB] = String(uf.colab || "");
      const obsField = await detectObsField();
      if (uf.obsExtra !== undefined) fields[obsField] = uf.obsExtra;
    }

    return await bx("crm.deal.add", { fields });
  }

  async function modalNewDeal(assistKey) {
    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + 60);
    const localDefault = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const [urgMap, tipoMap, etapaMap] = await Promise.all([
      enums(UF_URGENCIA),
      enums(UF_TAREFA),
      enums(UF_ETAPA),
    ]);

    function buildOptions(map, placeholder) {
      const entries = Object.entries(map || {});
      entries.sort((a, b) => String(a[1]).localeCompare(String(b[1]), "pt-BR", { sensitivity: "base" }));
      return [
        `<option value="">${placeholder}</option>`,
        ...entries.map(([id, label]) => `<option value="${id}">${escHtml(String(label))}</option>`),
      ].join("");
    }

    openModal(`Nova tarefa — ${assistKey}`, `
      <div class="eqd-warn" id="eqd-warn"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Nome do negócio</div>
          <input id="eqd-nwTitle" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" placeholder="Ex.: Retorno cliente / Enviar proposta..." />
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Prazo</div>
          <input id="eqd-nwPrazo" type="datetime-local" value="${localDefault}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Tipo</div>
          <select id="eqd-nwTipo" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${buildOptions(tipoMap, "— Selecione —")}</select>
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Urgência</div>
          <select id="eqd-nwUrg" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${buildOptions(urgMap, "— Sem urgência —")}</select>
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Etapa</div>
          <select id="eqd-nwEtapa" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${buildOptions(etapaMap, "— (opcional) —")}</select>
        </div>

        <div style="grid-column:1 / -1;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="eqd-nwSave">Criar</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("eqd-warn");
    document.getElementById("eqd-nwSave").onclick = async () => {
      try {
        warn.style.display = "none"; warn.textContent = "";
        setBusy("Criando…");

        const title = String(document.getElementById("eqd-nwTitle").value || "").trim();
        if (!title) throw new Error("Preencha o Nome do negócio.");

        const prazoLocal = String(document.getElementById("eqd-nwPrazo").value || "").trim();
        const prazoIso = prazoLocal ? localInputToIsoWithOffset(prazoLocal) : "";
        if (prazoLocal && !prazoIso) throw new Error("Prazo inválido.");

        const tipo = String(document.getElementById("eqd-nwTipo").value || "").trim();
        if (!tipo) throw new Error("Selecione o Tipo.");

        const urg = String(document.getElementById("eqd-nwUrg").value || "").trim();
        const etapa = String(document.getElementById("eqd-nwEtapa").value || "").trim();

        const uf = { tarefa: tipo, urgencia: urg, etapa: etapa };
        await actionCreateDeal(assistKey, title, prazoIso, uf);

        closeModal();
        scheduleRefresh(true, 0);
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha ao criar:\n" + (e.message || e);
      } finally {
        clearBusy();
      }
    };
  }

  function globalClickHandler(e) {
    const a = e.target.closest("[data-action]");
    if (!a) return;

    const act = a.getAttribute("data-action");
    const dealId = a.getAttribute("data-id");
    const assistKey = a.getAttribute("data-assist");

    if (act === "modalClose") { closeModal(); return; }

    if (act === "new") { modalNewDeal(assistKey).catch(showFatal); return; }

    if (act === "done") {
      (async () => {
        try {
          setBusy("Concluindo…");
          await actionSetDone(dealId);
          removeFromOpen(dealId);
          scheduleRefresh(false, 0);
        } catch (err) {
          openModal("Erro", `<div class="eqd-warn" style="display:block">${escHtml(String(err.message || err))}</div>`);
          scheduleRefresh(true, 2500);
        } finally {
          clearBusy();
        }
      })();
      return;
    }

    if (act === "delete") {
      openModal("Confirmar exclusão", `
        <div class="eqd-warn" style="display:block">Excluir este item?</div>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnDanger" id="eqd-confirmDel">Excluir</button>
        </div>
      `);
      document.getElementById("eqd-confirmDel").onclick = async () => {
        try {
          setBusy("Excluindo…");
          await actionDeleteDeal(dealId);
          removeFromOpen(dealId);
          closeModal();
          scheduleRefresh(false, 0);
        } catch (err) {
          openModal("Erro ao excluir", `<div class="eqd-warn" style="display:block">${escHtml(String(err.message || err))}</div>`);
          scheduleRefresh(true, 2500);
        } finally {
          clearBusy();
        }
      };
      return;
    }
  }

  el.main.addEventListener("click", globalClickHandler);
  el.modalBody.addEventListener("click", globalClickHandler);

  el.refresh.addEventListener("click", () => scheduleRefresh(true, 0));
  el.todayBtn.addEventListener("click", () => { selectedDate = new Date(); scheduleRefresh(false, 0); });

  el.viewAssist.addEventListener("change", () => {
    viewAssistFilter = String(el.viewAssist.value || "__ALL__");
    focusAssistKey = (viewAssistFilter !== "__ALL__") ? viewAssistFilter : null;
    scheduleRefresh(false, 0);
  });

  function runSearch() {
    const kwRaw = String(el.searchInput.value || "").trim();
    const kw = norm(kwRaw);
    if (!kw) {
      openModal("Busca de tarefas", `<div class="eqd-empty">Digite uma palavra-chave para buscar.</div>`);
      return;
    }
    const base = (STATE.dealsOpen || []).slice();
    const hits = base.filter((d) => {
      const blob = norm([d._negocio || d.TITLE || "", d._obsExtra || "", d._tarefaTxt || "", d._colabTxt || "", d._etapaTxt || "", d._urgTxt || ""].join(" "));
      return blob.includes(kw);
    });
    SEARCH_LAST_IDS = hits.map((d) => String(d.ID));
    const listHTML = hits.length
      ? hits.map((d) => {
          const prazoTxt = d._prazo ? fmt(d._prazo) : "Sem prazo";
          return `
            <div style="border:1px solid rgba(30,40,70,.12);border-radius:16px;background:rgba(255,255,255,.75);padding:10px;display:flex;flex-direction:column;gap:8px">
              <div style="font-size:13px;font-weight:950;line-height:1.15">${escHtml(bestTitleFromText(d._negocio || d.TITLE || ""))}</div>
              <div style="font-size:11px;font-weight:900;color:rgba(18,26,40,.70);display:flex;gap:10px;flex-wrap:wrap">
                <span>Prazo: <strong>${escHtml(prazoTxt)}</strong></span>
                <span>ID: <strong>${escHtml(d.ID)}</strong></span>
                ${d._late ? `<span style="color:#b00032;font-weight:950">ATRASADA</span>` : ``}
              </div>
            </div>
          `;
        }).join("")
      : `<div class="eqd-empty">Nenhum resultado para: <strong>${escHtml(kwRaw)}</strong></div>`;

    openModal(`Busca: “${escHtml(kwRaw)}” • ${hits.length} resultado(s)`, listHTML);
  }

  el.searchBtn.addEventListener("click", runSearch);
  el.searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); runSearch(); }
  });

  async function renderAll(force) {
    if (REFRESH_RUNNING) { REFRESH_PENDING = true; return; }
    REFRESH_RUNNING = true;

    try {
      setSoftStatus("Atualizando…");
      if (force) {
        await loadStagesAllPipelines();
        await loadDeals();
      }
      el.viewAssist.value = viewAssistFilter;
      renderGrid();

      el.dayPill.textContent = `Dia: ${fmtDateOnly(selectedDate)}`;
      el.meta.textContent = `Atualizado em ${fmt(new Date())}`;
      setSoftStatus("JS: ok");
    } catch (e) {
      setSoftStatus("Sem conexão / limite — tentando novamente…");
      scheduleRefresh(true, 2500);
    } finally {
      REFRESH_RUNNING = false;
      if (REFRESH_PENDING) {
        REFRESH_PENDING = false;
        scheduleRefresh(true, 300);
      }
    }
  }

  // =========================
  // 12) INIT
  // =========================
  (async () => {
    await detectObsField();
    await loadStagesAllPipelines();
    await loadDeals();
    await renderAll(false);

    setInterval(() => {
      if (!REFRESH_RUNNING && BX_INFLIGHT === 0) {
        renderAll(true).catch(() => {});
      }
    }, REFRESH_MS);
  })().catch(showFatal);

})();
