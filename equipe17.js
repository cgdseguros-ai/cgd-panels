/* eqd.js — GET • CGD CORRETORA (Painel Geral + Individual + Multi Seleção)
   ✅ Usa Worker Proxy (/bx/<method>) para Bitrix REST
   ✅ Senha por usuário (USER_ID) ou master PINs (4455/8123/6677/4627)
   ✅ Painel geral com cards de 17 users (4 colunas)
   ✅ Painel individual (3 colunas) + busca só da user + lote reagendar
   ✅ Cards de tarefas (NÃO muda estética/cores dos cards de tarefa)
   ✅ Ações no card: concluir / concluir+reagendar / editar prazo / editar título / trocar colaboradora
   ✅ Sinal piscante de OBS quando UF_CRM_691385BE7D33D preenchido
   ✅ Nova Tarefa: inclui COLAB + OBS (opcionais) + recorrência (diária útil / semanal / mensal)
   ✅ Follow-up: modal simplificado + lote + lista de follow-ups agendados + busca
*/

(function () {
  // =========================
  // 1) CONFIG (EDITAR AQUI)
  // =========================

  // ✅ Worker proxy base (/bx/<method>)
  const PROXY_BASE = "https://cgd-bx-proxy.cgdseguros.workers.dev/bx/";

  // ✅ Logo (maior 50%)
  const LOGO_URL =
    "https://bitrix24public.com/b24-6iyx5y.bitrix24.com.br/docs/pub/c77325321d1ad38e8012b995a5f4e8dd/showFile/?&token=q0zmo189kiw9";

  // ✅ Refresh
  const REFRESH_MS = 20000;

  // ✅ Senhas admin
  const ADMIN_PINS = new Set(["4455", "8123", "6677", "4627"]);

  // ✅ Pipeline principal (todos aqui)
  const CATEGORY_MAIN = 17;

  // ✅ Users (Pipeline 17)
  const USERS = [
    { name: "Manuela", userId: 813, team: "DELTA" },
    { name: "Maria Clara", userId: 841, team: "DELTA" },
    { name: "Beatriz", userId: 3387, team: "DELTA" },
    { name: "Bruna Luisa", userId: 3081, team: "DELTA" },

    { name: "Aline", userId: 15, team: "ALPHA" },
    { name: "Adriana", userId: 19, team: "ALPHA" },
    { name: "Andreyna", userId: 17, team: "ALPHA" },
    { name: "Mariana", userId: 23, team: "ALPHA" },
    { name: "Josiane", userId: 811, team: "ALPHA" },

    { name: "Livia Alves", userId: 3079, team: "BETA" },
    { name: "Fernanda Silva", userId: 3083, team: "BETA" },
    { name: "Nicolle Belmonte", userId: 3085, team: "BETA" },
    { name: "Anna Clara", userId: 3389, team: "BETA" },

    // ✅ também na 17
    { name: "Gabriel", userId: 815, team: "BETA" },
    { name: "Amanda", userId: 269, team: "BETA" },
    { name: "Talita", userId: 29, team: "BETA" },
    { name: "Vivian", userId: 3101, team: "BETA" },
  ];

  // ✅ Campos UF
  const UF_URGENCIA = "UF_CRM_1768174982";
  const UF_TAREFA = "UF_CRM_1768185018696";
  const UF_ETAPA = "UF_CRM_1768179977089";
  const UF_COLAB = "UF_CRM_1770327799";
  const UF_PRAZO = "UF_CRM_1768175087";
  const UF_OBS = "UF_CRM_691385BE7D33D"; // sinal piscante quando preenchido
  const DONE_STAGE_NAME = "CONCLUÍDO";   // coluna final

  // =========================
  // 2) BOOTSTRAP
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
  // 3) CSS (cards de tarefas = MESMO VISUAL)
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

    /* TOPBAR moderna (sem mexer nos cards de tarefa) */
    .eqd-topbar{
      display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
      margin-bottom:12px;
      background:#14161a;border:1px solid rgba(255,255,255,.08);
      padding:12px;border-radius:18px;
    }
    .eqd-titleWrap{display:flex;align-items:center;gap:12px;min-width:320px;}
    .eqd-logo{width:60px;height:60px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.92);object-fit:contain;padding:8px;flex:0 0 auto;}
    .eqd-titleBlock{display:flex;flex-direction:column;gap:2px;}
    .eqd-title{display:flex;align-items:center;gap:10px;font-weight:950;font-size:18px;color:#fff;}
    .eqd-dot{width:10px;height:10px;border-radius:999px;background:#16a34a;box-shadow:0 0 0 6px rgba(22,163,74,.12);}
    .eqd-meta{font-size:12px;color:rgba(255,255,255,.75);font-weight:800;}
    .eqd-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;}
    .eqd-pill{font-size:12px;font-weight:900;padding:8px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.12);color:#fff;white-space:nowrap;}
    .eqd-btn{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.12);border-radius:999px;padding:8px 12px;font-size:12px;font-weight:950;cursor:pointer;white-space:nowrap;color:#fff;}
    .eqd-btnPrimary{background:rgba(120,90,255,.22);border-color:rgba(120,90,255,.40);}
    .eqd-btnDanger{background:rgba(255,70,90,.18);border-color:rgba(255,70,90,.32);}
    .eqd-searchWrap{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end;}
    .eqd-searchInput{width:min(340px,54vw);border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.10);border-radius:999px;padding:9px 12px;font-size:12px;font-weight:900;outline:none;color:#fff;}
    .eqd-searchSelect{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.10);border-radius:999px;padding:8px 10px;font-size:12px;font-weight:950;outline:none;min-width:170px;color:#fff;}

    /* dark toggle: contraste alto */
    #eqd-app.eqd-dark{
      --bgA:#14161a; --bgB:#0f1115; --bgC:#14161a;
      --border: rgba(255,255,255,.10);
      --text: #fff;
      --muted: rgba(255,255,255,.78);
      background: linear-gradient(135deg, #0f1115, #14161a);
    }

    /* PAINEL GERAL: grid de users */
    .userGrid{display:grid;grid-template-columns:repeat(4,minmax(220px,1fr));gap:12px;}
    @media (max-width:1200px){.userGrid{grid-template-columns:repeat(2,minmax(220px,1fr));}}
    @media (max-width:720px){.userGrid{grid-template-columns:1fr;}}
    .userCard{
      border:1px solid rgba(30,40,70,.12);
      border-radius:18px;
      background:rgba(255,255,255,.52);
      backdrop-filter: blur(12px);
      padding:12px;
      display:flex;flex-direction:column;gap:10px;
      cursor:pointer;
      transition: transform .08s ease, box-shadow .08s ease;
    }
    #eqd-app.eqd-dark .userCard{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);}
    .userCard:hover{transform:translateY(-1px);box-shadow:0 10px 22px rgba(20,25,35,.10);}
    .userPhoto{
      width:52px;height:52px;border-radius:999px;
      border:1px solid rgba(30,40,70,.14);
      background:rgba(255,255,255,.92);
      object-fit:cover;
      display:block;margin:0 auto; /* ✅ centralizada */
    }
    #eqd-app.eqd-dark .userPhoto{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.14);}
    .userName{font-weight:950;font-size:14px;text-align:center;text-transform:uppercase;}
    .userTeam{font-size:11px;font-weight:900;text-align:center;opacity:.70;margin-top:-6px;}
    .userStats{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:11px;font-weight:900;opacity:.85;}
    .userEmoji{font-size:18px;text-align:center;margin-top:2px;}

    /* PAINEL INDIVIDUAL */
    .panelHead{
      display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
      margin-bottom:10px;
      padding:12px;border-radius:18px;border:1px solid var(--border);
      background:rgba(255,255,255,.55);backdrop-filter:blur(10px);
    }
    #eqd-app.eqd-dark .panelHead{background:rgba(255,255,255,.06);}
    .panelUserInfo{display:flex;align-items:center;gap:10px;}
    .panelUserPhoto{width:72px;height:72px;border-radius:999px;border:1px solid rgba(30,40,70,.14);object-fit:cover;background:rgba(255,255,255,.9);}
    #eqd-app.eqd-dark .panelUserPhoto{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.14);}
    .panelUserName{font-weight:950;font-size:16px;text-transform:uppercase;}
    .panelUserTeam{font-size:12px;font-weight:900;opacity:.70;margin-top:2px;}

    .panelCols{display:grid;grid-template-columns:repeat(3,minmax(260px,1fr));gap:12px;}
    @media (max-width:1100px){.panelCols{grid-template-columns:1fr;}}
    .panelCol{
      border:1px solid var(--border);
      border-radius:18px;
      background:rgba(255,255,255,.45);
      backdrop-filter:blur(12px);
      overflow:hidden;
      min-height:64vh;
      display:flex;flex-direction:column;
    }
    #eqd-app.eqd-dark .panelCol{background:rgba(255,255,255,.06);}
    .panelColHead{padding:10px 12px;border-bottom:1px solid var(--border);font-weight:950;font-size:12px;opacity:.85;}
    .panelColBody{padding:10px;display:flex;flex-direction:column;gap:8px;overflow:auto;}

    /* MODAL (reuso) */
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

    /* === CARDS DE TAREFA: MESMO VISUAL QUE VOCÊ DISSE QUE ESTÁ PERFEITO === */
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
    .eqd-tagObs{border-color:rgba(255,180,0,.55);background:rgba(255,200,0,.22);font-weight:950;color:rgba(120,70,0,.95);animation:eqdBlinkObs .95s ease-in-out infinite;}
    @keyframes eqdBlinkObs{0%,100%{opacity:1}50%{opacity:.35}}
    .eqd-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:2px;font-size:10.5px;color:rgba(18,26,40,.66);}
    .eqd-cardActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;}
    .eqd-smallBtn{cursor:pointer;border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.88);border-radius:999px;padding:6px 9px;font-size:11px;font-weight:950;color:rgba(18,26,40,.92);}
    .eqd-smallBtnPrimary{background:rgba(22,163,74,.14);border-color:rgba(22,163,74,.30);}
    .eqd-smallBtnDanger{background:rgba(255,70,90,.14);border-color:rgba(255,70,90,.30);}
    .eqd-empty{border:1px dashed rgba(30,40,70,.18);border-radius:16px;padding:12px;background:rgba(255,255,255,.55);color:rgba(18,26,40,.62);font-size:11px;font-weight:800;text-align:center;}
  `);

  // =========================
  // 4) HELPERS / PROXY BX
  // =========================
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

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
    try { return await fetch(url, { ...options, signal: ctrl.signal }); }
    finally { clearTimeout(t); }
  }

  // ✅ fila / retry
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

            const resp = await fetchWithTimeout(PROXY_BASE + method, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
              body,
            }, 15000);

            if ([429, 502, 503, 504].includes(resp.status)) {
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
      .replace(/[\u0300-\u036f]/g, "");
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
    // aceita "YYYY-MM-DDTHH:MM" ou "YYYY-MM-DD HH:MM"
    v = v.replace(" ", "T");
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

  function isWeekend(d) {
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  function addMonthsKeepDay(baseDate, dayOfMonth) {
    const d = new Date(baseDate);
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(dayOfMonth, maxDay));
    return d;
  }

  // =========================
  // 6) SENHA
  // =========================
  function canOpenUserPanel(userId) {
    const pin = String(prompt("Senha para abrir o painel:") || "").trim();
    if (!pin) return false;
    if (ADMIN_PINS.has(pin)) return true;
    return pin === String(userId);
  }

  // =========================
  // 7) STATE / ENUMS / STAGES / USERS
  // =========================
  const STATE = {
    dealsAll: [],
    dealsOpen: [],
    doneStageId: null,
    stageMapByName: new Map(),
    enumCache: new Map(),

    userPhotoById: new Map(),
    userNameById: new Map(),

    lastOkAt: null,
    offline: false,
  };

  async function enums(uf) {
    if (STATE.enumCache.has(uf)) return STATE.enumCache.get(uf);
    const list = await bx("crm.deal.userfield.list", { filter: { FIELD_NAME: uf } });
    const f = Array.isArray(list) ? list[0] : null;
    if (!f || !f.ID) { STATE.enumCache.set(uf, {}); return {}; }
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

  function findEnumIdByLabel(map, wantedLabelNorm) {
    const entries = Object.entries(map || {});
    for (const [id, label] of entries) {
      if (norm(label) === wantedLabelNorm) return id;
    }
    // fallback: contém
    for (const [id, label] of entries) {
      if (norm(label).includes(wantedLabelNorm)) return id;
    }
    return "";
  }

  async function loadStagesForCategory(categoryId) {
    const cid = Number(categoryId);
    const stages = await bx("crm.dealcategory.stage.list", { id: cid });
    const stageMapByName = new Map();
    let doneStageId = null;

    (stages || []).forEach((s) => {
      stageMapByName.set(norm(s.NAME), String(s.STATUS_ID));
      if (norm(s.NAME).includes(norm(DONE_STAGE_NAME))) doneStageId = String(s.STATUS_ID);
    });

    STATE.stageMapByName = stageMapByName;
    STATE.doneStageId = doneStageId;
  }

  async function stageIdForUserName(userName) {
    // nomes das colunas são os nomes dos users
    const exact = STATE.stageMapByName.get(norm(userName));
    if (exact) return exact;
    for (const [k, v] of STATE.stageMapByName.entries()) {
      if (k.includes(norm(userName)) || norm(userName).includes(k)) return v;
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
  // 8) PARSE / SORT
  // =========================
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

  function bestTitleFromText(txt) {
    const t = String(txt || "").trim();
    if (!t) return "Negócio";
    const first = t.split("\n")[0].trim();
    return trunc(first || "Negócio", 72);
  }

  function createdMs(d) {
    const x = d && d.DATE_CREATE ? new Date(d.DATE_CREATE) : null;
    const t = x ? x.getTime() : NaN;
    return Number.isFinite(t) ? t : 0;
  }

  function prazoMs(d) {
    const v = d && d._prazo;
    if (!v) return Number.POSITIVE_INFINITY;
    const x = new Date(v);
    const t = x.getTime();
    return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
  }

  function sortDeals(deals) {
    return (deals || []).slice().sort((a, b) => {
      const ua = isUrgenteText(a._urgTxt) ? 0 : 1;
      const ub = isUrgenteText(b._urgTxt) ? 0 : 1;
      if (ua !== ub) return ua - ub;

      const la = a._late ? 0 : 1;
      const lb = b._late ? 0 : 1;
      if (la !== lb) return la - lb;

      const pa = prazoMs(a), pb = prazoMs(b);
      if (pa !== pb) return pa - pb;

      return createdMs(a) - createdMs(b);
    });
  }

  function dealAccent(deal) {
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
    return `${Math.round((r + m) * 255)},${Math.round((g + m) * 255)},${Math.round((b + m) * 255)}`;
  }

  function parseDeal(deal, maps) {
    const { urgMap, tarefaMap, etapaMap, colabMap, colabIsEnum } = maps;

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
      if (colabIsEnum) colabTxt = String((colabMap || {})[colabId] || colabId).trim();
      else colabTxt = colabId; // texto livre
    }

    const obsTxt = String(deal[UF_OBS] || "").trim();
    const hasObs = !!obsTxt;

    // assistKey = user por ASSIGNED_BY_ID (mais confiável no seu cenário)
    const assignedId = String(deal.ASSIGNED_BY_ID || "").trim();

    return Object.assign(deal, {
      _prazo: prazoOk ? prazoDate.toISOString() : "",
      _late: late,
      _urgId: urgId,
      _urgTxt: urgTxt,
      _tarefaId: tarefaId,
      _tarefaTxt: tarefaTxt,
      _etapaId: etapaId,
      _etapaTxt: etapaTxt,
      _colabId: colabId,
      _colabTxt: colabTxt,
      _obs: obsTxt,
      _hasObs: hasObs,
      _assigned: assignedId,
      _accent: dealAccent(deal),
    });
  }

  // =========================
  // 9) LOAD DEALS (com cache local para “não travar” se cair)
  // =========================
  const CACHE_KEY = "EQD_CACHE_V1";

  function saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        at: Date.now(),
        dealsAll: STATE.dealsAll,
      }));
    } catch (_) {}
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const j = JSON.parse(raw);
      if (!j || !Array.isArray(j.dealsAll)) return false;
      STATE.dealsAll = j.dealsAll;
      return true;
    } catch (_) {
      return false;
    }
  }

  async function loadDeals() {
    const [urgMap, tarefaMap, etapaMap] = await Promise.all([
      enums(UF_URGENCIA),
      enums(UF_TAREFA),
      enums(UF_ETAPA),
    ]);

    let colabIsEnum = false;
    let colabMap = {};
    try {
      colabIsEnum = await enumHasOptions(UF_COLAB);
      if (colabIsEnum) colabMap = await enums(UF_COLAB);
    } catch (_) {}

    const select = [
      "ID", "TITLE", "STAGE_ID", "DATE_CREATE", "DATE_MODIFY", "ASSIGNED_BY_ID",
      UF_TAREFA, UF_PRAZO, UF_URGENCIA, UF_ETAPA, UF_COLAB, UF_OBS,
    ];

    const deals = await bxAll("crm.deal.list", {
      filter: { CATEGORY_ID: CATEGORY_MAIN },
      select,
      order: { ID: "DESC" },
    });

    const maps = { urgMap, tarefaMap, etapaMap, colabMap, colabIsEnum };
    const parsed = (deals || []).map((d) => parseDeal(d, maps));
    STATE.dealsAll = parsed;

    // open = tudo menos CONCLUÍDO
    const open = [];
    for (const d of parsed) {
      if (STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId)) continue;
      open.push(d);
    }
    STATE.dealsOpen = open;

    await Promise.all(USERS.map((u) => ensureUserPhoto(u.userId, u.name)));

    STATE.lastOkAt = new Date();
    STATE.offline = false;
    saveCache();
  }

  // =========================
  // 10) UI BASE
  // =========================
  const root = ensureRoot();
  root.innerHTML = `
    <div id="eqd-app">
      <div class="eqd-topbar">
        <div class="eqd-titleWrap">
          <img class="eqd-logo" src="${LOGO_URL}" alt="CGD" referrerpolicy="no-referrer">
          <div class="eqd-titleBlock">
            <div class="eqd-title"><span class="eqd-dot"></span>GET - CGD CORRETORA</div>
            <div class="eqd-meta" id="eqd-meta">Carregando…</div>
          </div>
        </div>

        <div class="eqd-actions">
          <div class="eqd-pill" id="eqd-now">—</div>
          <div class="eqd-pill" id="eqd-status">JS: ok</div>

          <div class="eqd-searchWrap">
            <select class="eqd-searchSelect" id="eqd-searchScope"></select>
            <input class="eqd-searchInput" id="eqd-searchInput" placeholder="Buscar por palavra..." />
            <button class="eqd-btn eqd-btnPrimary" id="eqd-searchBtn">Buscar</button>
          </div>

          <button class="eqd-btn" id="eqd-today">HOJE</button>
          <button class="eqd-btn" id="eqd-calendar">CALENDÁRIO</button>
          <button class="eqd-btn" id="eqd-multi">PAINEL MULTI SELEÇÃO</button>
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
    now: document.getElementById("eqd-now"),

    main: document.getElementById("eqd-main"),

    refresh: document.getElementById("eqd-refresh"),
    today: document.getElementById("eqd-today"),
    calendar: document.getElementById("eqd-calendar"),
    multi: document.getElementById("eqd-multi"),

    searchScope: document.getElementById("eqd-searchScope"),
    searchInput: document.getElementById("eqd-searchInput"),
    searchBtn: document.getElementById("eqd-searchBtn"),

    darkToggle: document.getElementById("eqd-darkToggle"),

    modalOverlay: document.getElementById("eqd-modalOverlay"),
    modalTitle: document.getElementById("eqd-modalTitle"),
    modalBody: document.getElementById("eqd-modalBody"),
    modalClose: document.getElementById("eqd-modalClose"),
  };

  // =========================
  // 11) DARK TOGGLE
  // =========================
  const DARK_KEY = "eqd_dark_v3";
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
  // 12) MODAL
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
  // 13) TOP CLOCK
  // =========================
  function tickClock() {
    const d = new Date();
    el.now.textContent = `${fmtDateOnly(d)} • ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
  }
  setInterval(tickClock, 1000);
  tickClock();

  // =========================
  // 14) BUSCA (geral ou por USER)
  // =========================
  function fillSearchScope() {
    el.searchScope.innerHTML =
      `<option value="__ALL__">Busca geral</option>` +
      USERS.map((u) => `<option value="${u.userId}">${escHtml(u.name)}</option>`).join("");
  }
  fillSearchScope();

  function runSearch() {
    const kwRaw = String(el.searchInput.value || "").trim();
    const kw = norm(kwRaw);
    const scope = String(el.searchScope.value || "__ALL__");

    if (!kw) {
      openModal("Busca", `<div class="eqd-empty">Digite uma palavra-chave.</div>`);
      return;
    }

    let base = (STATE.dealsOpen || []).slice();
    if (scope !== "__ALL__") {
      base = base.filter((d) => String(d.ASSIGNED_BY_ID || d._assigned || "") === String(scope));
    }

    const hits = base.filter((d) => {
      const blob = norm([d.TITLE || "", d._obs || "", d._tarefaTxt || "", d._colabTxt || "", d._etapaTxt || "", d._urgTxt || ""].join(" "));
      return blob.includes(kw);
    });

    const listHTML = hits.length
      ? hits.map((d) => `
          <div style="border:1px solid rgba(30,40,70,.12);border-radius:16px;background:rgba(255,255,255,.75);padding:10px;display:flex;flex-direction:column;gap:8px">
            <div style="font-size:13px;font-weight:950;line-height:1.15">${escHtml(bestTitleFromText(d.TITLE || ""))}</div>
            <div style="font-size:11px;font-weight:900;color:rgba(18,26,40,.70);display:flex;gap:10px;flex-wrap:wrap">
              <span>Prazo: <strong>${escHtml(d._prazo ? fmt(d._prazo) : "Sem prazo")}</strong></span>
              <span>ID: <strong>${escHtml(d.ID)}</strong></span>
              ${d._late ? `<span style="color:#b00032;font-weight:950">ATRASADA</span>` : ``}
            </div>
          </div>
        `).join("")
      : `<div class="eqd-empty">Nenhum resultado para: <strong>${escHtml(kwRaw)}</strong></div>`;

    openModal(`Busca: “${escHtml(kwRaw)}” • ${hits.length} resultado(s)`, listHTML);
  }

  el.searchBtn.addEventListener("click", runSearch);
  el.searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); runSearch(); } });

  // =========================
  // 15) CALENDÁRIO (modal no mesmo estilo)
  // =========================
  let selectedDate = new Date();

  function openCalendarModal() {
    const base = new Date(selectedDate);
    const localIso = new Date(base.getTime() - base.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    openModal("Calendário", `
      <div class="eqd-warn" id="eqd-warn"></div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input id="calDate" type="date" value="${localIso}" style="padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" />
        <button class="eqd-btn eqd-btnPrimary" id="calOk">Aplicar</button>
        <button class="eqd-btn" id="calToday">Hoje</button>
      </div>
      <div class="eqd-empty" style="margin-top:10px">Escolha um dia para filtrar o “Dia” do painel.</div>
    `);

    document.getElementById("calOk").onclick = () => {
      const v = String(document.getElementById("calDate").value || "").trim();
      if (!v) return;
      const d = new Date(v + "T00:00:00");
      if (Number.isNaN(d.getTime())) return;
      selectedDate = d;
      closeModal();
      renderCurrentView();
    };

    document.getElementById("calToday").onclick = () => {
      selectedDate = new Date();
      closeModal();
      renderCurrentView();
    };
  }

  // =========================
  // 16) CARD DE TAREFA + AÇÕES
  // =========================
  function makeDealCard(deal, context) {
    const showWarn = isAtencaoText(deal._urgTxt);
    const title = (showWarn ? "⚠️ " : "") + bestTitleFromText(deal.TITLE || "");

    const prazoTxt = deal._prazo ? fmt(deal._prazo) : "Sem prazo";
    const tags = [];

    if (isUrgenteText(deal._urgTxt)) tags.push(`<span class="eqd-tag eqd-tagUrg">URGENTE</span>`);
    if (deal._late) tags.push(`<span class="eqd-tag eqd-tagLate">ATRASADA</span>`);
    if (deal._hasObs) tags.push(`<span class="eqd-tag eqd-tagObs">OBS</span>`);
    if (deal._tarefaTxt) tags.push(`<span class="eqd-tag">Tipo: ${trunc(deal._tarefaTxt, 26)}</span>`);
    if (deal._colabTxt) tags.push(`<span class="eqd-tag">COLAB: ${trunc(deal._colabTxt, 28)}</span>`);
    if (deal._etapaTxt) tags.push(`<span class="eqd-tag">ETAPA: ${trunc(deal._etapaTxt, 18)}</span>`);
    if (deal._urgTxt) tags.push(`<span class="eqd-tag">${trunc(deal._urgTxt, 22)}</span>`);

    const batchBox = (context && context.allowBatch)
      ? `<label style="display:flex;gap:6px;align-items:center;font-size:11px;font-weight:900;margin-left:auto">
           <input type="checkbox" class="eqd-batch" data-id="${deal.ID}"> Lote
         </label>`
      : ``;

    return `
      <div class="eqd-card" style="--accent-rgb:${deal._accent}" data-deal="${deal.ID}">
        <div class="eqd-bar"></div>
        <div class="eqd-inner">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div class="eqd-task" style="flex:1 1 auto">${escHtml(title)}</div>
            ${batchBox}
          </div>
          ${tags.length ? `<div class="eqd-tags">${tags.join("")}</div>` : ``}
          <div class="eqd-foot">
            <span>Prazo: <strong>${escHtml(prazoTxt)}</strong></span>
            <span>ID: <strong>${escHtml(deal.ID)}</strong></span>
          </div>
          <div class="eqd-cardActions">
            <button class="eqd-smallBtn eqd-smallBtnPrimary" data-action="doneMenu" data-id="${deal.ID}">Concluir</button>
            <button class="eqd-smallBtn" data-action="editPrazo" data-id="${deal.ID}">Editar prazo</button>
            <button class="eqd-smallBtn" data-action="editTitle" data-id="${deal.ID}">Editar negócio</button>
            <button class="eqd-smallBtn" data-action="changeColab" data-id="${deal.ID}">Trocar colaboradora</button>
            <button class="eqd-smallBtn eqd-smallBtnDanger" data-action="delete" data-id="${deal.ID}">Excluir</button>
          </div>
        </div>
      </div>
    `;
  }

  function updateDealCache(dealId, patch) {
    const id = String(dealId);
    const apply = (d) => Object.assign(d, patch || {});
    for (const d of (STATE.dealsAll || [])) if (String(d.ID) === id) { apply(d); break; }
    for (const d of (STATE.dealsOpen || [])) if (String(d.ID) === id) { apply(d); break; }
  }

  function removeFromOpen(dealId) {
    const id = String(dealId);
    STATE.dealsOpen = (STATE.dealsOpen || []).filter((d) => String(d.ID) !== id);
  }

  async function actionSetDone(dealId) {
    if (!STATE.doneStageId) throw new Error("Não encontrei a coluna CONCLUÍDO na pipeline.");
    await bx("crm.deal.update", { id: String(dealId), fields: { STAGE_ID: String(STATE.doneStageId) } });
  }

  async function actionDeleteDeal(dealId) {
    await bx("crm.deal.delete", { id: String(dealId) });
  }

  async function actionUpdateFields(dealId, fields) {
    await bx("crm.deal.update", { id: String(dealId), fields: fields || {} });
  }

  // =========================
  // 17) NOVA TAREFA + RECORRÊNCIA
  // =========================
  function buildOptions(map, placeholder) {
    const entries = Object.entries(map || {});
    entries.sort((a, b) => String(a[1]).localeCompare(String(b[1]), "pt-BR", { sensitivity: "base" }));
    return [
      `<option value="">${placeholder}</option>`,
      ...entries.map(([id, label]) => `<option value="${id}">${escHtml(String(label))}</option>`),
    ].join("");
  }

  async function modalNewDeal(user) {
    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + 60);
    const localDefault = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const [urgMap, tipoMap, etapaMap] = await Promise.all([
      enums(UF_URGENCIA),
      enums(UF_TAREFA),
      enums(UF_ETAPA),
    ]);

    let colabIsEnum = false;
    let colabMap = {};
    try { colabIsEnum = await enumHasOptions(UF_COLAB); if (colabIsEnum) colabMap = await enums(UF_COLAB); } catch (_) {}

    const colabFieldHtml = colabIsEnum
      ? `<select id="nwColab" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${buildOptions(colabMap, "— (opcional) —")}</select>`
      : `<input id="nwColab" placeholder="(opcional)" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />`;

    openModal(`Nova tarefa — ${user.name}`, `
      <div class="eqd-warn" id="eqd-warn"></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Nome do negócio</div>
          <input id="nwTitle" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" placeholder="Ex.: Retorno cliente / Enviar proposta..." />
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Prazo</div>
          <input id="nwPrazo" type="datetime-local" value="${localDefault}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Tipo</div>
          <select id="nwTipo" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${buildOptions(tipoMap, "— Selecione —")}</select>
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Urgência</div>
          <select id="nwUrg" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${buildOptions(urgMap, "— Sem urgência —")}</select>
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Etapa</div>
          <select id="nwEtapa" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${buildOptions(etapaMap, "— (opcional) —")}</select>
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">COLAB (opcional)</div>
          ${colabFieldHtml}
        </div>

        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Observações (opcional)</div>
          <textarea id="nwObs" rows="3" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)"></textarea>
        </div>

        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Recorrência</div>
          <select id="nwRec" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">
            <option value="NONE">Sem recorrência</option>
            <option value="DAILY">Diária (dias úteis)</option>
            <option value="WEEKLY">Semanal</option>
            <option value="MONTHLY">Mensal</option>
          </select>
          <div id="nwRecExtra" style="margin-top:8px;display:none"></div>
        </div>

        <div style="grid-column:1 / -1;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="nwSave">Criar</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("eqd-warn");
    const recSel = document.getElementById("nwRec");
    const recExtra = document.getElementById("nwRecExtra");

    function renderRecExtra() {
      const v = String(recSel.value || "NONE");
      if (v === "WEEKLY") {
        recExtra.style.display = "block";
        recExtra.innerHTML = `
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Dia da semana</div>
          <select id="nwWeekDay" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">
            <option value="1">Segunda</option>
            <option value="2">Terça</option>
            <option value="3">Quarta</option>
            <option value="4">Quinta</option>
            <option value="5">Sexta</option>
          </select>
        `;
      } else if (v === "MONTHLY") {
        recExtra.style.display = "block";
        recExtra.innerHTML = `
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Dia do mês (1-28)</div>
          <input id="nwMonthDay" type="number" min="1" max="28" value="10"
                 style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" />
        `;
      } else {
        recExtra.style.display = "none";
        recExtra.innerHTML = "";
      }
    }
    recSel.onchange = renderRecExtra;
    renderRecExtra();

    async function createOne(prazoIso, fieldsExtra) {
      const stageId = await stageIdForUserName(user.name);
      if (!stageId) throw new Error(`Não encontrei a coluna ${user.name} na pipeline.`);
      const title = bestTitleFromText(String(document.getElementById("nwTitle").value || "").trim());

      const fields = {
        CATEGORY_ID: Number(CATEGORY_MAIN),
        STAGE_ID: String(stageId),
        TITLE: title,
        ASSIGNED_BY_ID: Number(user.userId),
      };

      if (prazoIso) fields[UF_PRAZO] = prazoIso;

      const tipo = String(document.getElementById("nwTipo").value || "").trim();
      if (!tipo) throw new Error("Selecione o Tipo.");
      fields[UF_TAREFA] = tipo;

      const urg = String(document.getElementById("nwUrg").value || "").trim();
      if (urg) fields[UF_URGENCIA] = urg;

      const etapa = String(document.getElementById("nwEtapa").value || "").trim();
      if (etapa) fields[UF_ETAPA] = etapa;

      if (colabIsEnum) {
        const colab = String(document.getElementById("nwColab").value || "").trim();
        if (colab) fields[UF_COLAB] = colab;
      } else {
        const colab = String(document.getElementById("nwColab").value || "").trim();
        if (colab) fields[UF_COLAB] = colab;
      }

      const obs = String(document.getElementById("nwObs").value || "").trim();
      if (obs) fields[UF_OBS] = obs;

      if (fieldsExtra) Object.assign(fields, fieldsExtra);

      await bx("crm.deal.add", { fields });
    }

    document.getElementById("nwSave").onclick = async () => {
      try {
        warn.style.display = "none"; warn.textContent = "";
        setBusy("Criando…");

        const rawTitle = String(document.getElementById("nwTitle").value || "").trim();
        if (!rawTitle) throw new Error("Preencha o Nome do negócio.");

        const prazoLocal = String(document.getElementById("nwPrazo").value || "").trim();
        const baseIso = prazoLocal ? localInputToIsoWithOffset(prazoLocal) : "";
        if (prazoLocal && !baseIso) throw new Error("Prazo inválido.");

        const rec = String(recSel.value || "NONE");

        if (rec === "NONE") {
          await createOne(baseIso, null);
        } else if (rec === "DAILY") {
          // cria próximos 10 dias úteis a partir da data base
          const base = new Date(baseIso || new Date().toISOString());
          let count = 0;
          let created = 0;
          let d = new Date(base);
          while (created < 10 && count < 30) {
            count++;
            if (!isWeekend(d)) {
              const iso = localInputToIsoWithOffset(new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16));
              await createOne(iso, null);
              created++;
            }
            d.setDate(d.getDate() + 1);
          }
        } else if (rec === "WEEKLY") {
          const wanted = Number(document.getElementById("nwWeekDay").value || "1"); // 1..5
          const base = new Date(baseIso || new Date().toISOString());
          let d = new Date(base);
          // ajusta para o próximo dia da semana escolhido
          while (d.getDay() !== wanted) d.setDate(d.getDate() + 1);
          // cria 8 semanas
          for (let i = 0; i < 8; i++) {
            const iso = localInputToIsoWithOffset(new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16));
            await createOne(iso, null);
            d.setDate(d.getDate() + 7);
          }
        } else if (rec === "MONTHLY") {
          const day = Math.max(1, Math.min(28, Number(document.getElementById("nwMonthDay").value || 10)));
          const base = new Date(baseIso || new Date().toISOString());
          let d = new Date(base);
          d.setDate(day);
          // cria 6 meses
          for (let i = 0; i < 6; i++) {
            const iso = localInputToIsoWithOffset(new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,16));
            await createOne(iso, null);
            d = addMonthsKeepDay(d, day);
          }
        }

        closeModal();
        await refreshData(true);
        renderCurrentView();
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha ao criar:\n" + (e.message || e);
      } finally {
        clearBusy();
      }
    };
  }

  // =========================
  // 18) FOLLOW-UP (lote + lista)
  // =========================
  async function modalFollowUp(user) {
    const [urgMap, tipoMap, etapaMap] = await Promise.all([
      enums(UF_URGENCIA),
      enums(UF_TAREFA),
      enums(UF_ETAPA),
    ]);

    let colabIsEnum = false;
    let colabMap = {};
    try { colabIsEnum = await enumHasOptions(UF_COLAB); if (colabIsEnum) colabMap = await enums(UF_COLAB); } catch (_) {}

    const followTipoId = findEnumIdByLabel(tipoMap, norm("FOLLOW-UP"));
    const aguardEtapaId = findEnumIdByLabel(etapaMap, norm("AGUARDANDO"));
    const semUrgId = findEnumIdByLabel(urgMap, norm("SEM URGENCIA")) || findEnumIdByLabel(urgMap, norm("SEM"));
    const naoColabId = colabIsEnum ? (findEnumIdByLabel(colabMap, norm("NAO")) || findEnumIdByLabel(colabMap, norm("NÃO"))) : "";

    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + 60);
    const localDefault = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    openModal(`FOLLOW-UP — ${user.name}`, `
      <div class="eqd-warn" id="eqd-warn"></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:end">
        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Nomes (1 por linha)</div>
          <textarea id="fuNames" rows="4" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" placeholder="João&#10;Maria&#10;Empresa X"></textarea>
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Prazo (base)</div>
          <input id="fuPrazo" type="datetime-local" value="${localDefault}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="fuCreate">Criar em lote</button>
        </div>
      </div>

      <div style="margin-top:14px;border-top:1px solid rgba(30,40,70,.12);padding-top:12px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <input id="fuSearch" class="eqd-searchInput" style="background:rgba(0,0,0,.06);color:rgba(18,26,40,.92)" placeholder="Buscar follow-ups agendados..." />
          <button class="eqd-btn" id="fuRefresh">Atualizar lista</button>
        </div>
        <div id="fuList" style="margin-top:10px"></div>
      </div>
    `);

    const warn = document.getElementById("eqd-warn");

    async function createFollow(title, prazoIso) {
      const stageId = await stageIdForUserName(user.name);
      if (!stageId) throw new Error(`Não encontrei a coluna ${user.name} na pipeline.`);

      const fields = {
        CATEGORY_ID: Number(CATEGORY_MAIN),
        STAGE_ID: String(stageId),
        TITLE: `FOLLOW-UP de ${title}`,
        ASSIGNED_BY_ID: Number(user.userId),
      };

      if (prazoIso) fields[UF_PRAZO] = prazoIso;

      // ocultos:
      if (semUrgId) fields[UF_URGENCIA] = semUrgId;
      if (followTipoId) fields[UF_TAREFA] = followTipoId;
      if (aguardEtapaId) fields[UF_ETAPA] = aguardEtapaId;
      if (colabIsEnum && naoColabId) fields[UF_COLAB] = naoColabId;
      // obs = não

      await bx("crm.deal.add", { fields });
    }

    async function loadFollowList() {
      const kw = norm(String(document.getElementById("fuSearch").value || "").trim());
      const base = (STATE.dealsOpen || []).filter(d => String(d.ASSIGNED_BY_ID || d._assigned || "") === String(user.userId));
      let hits = base.filter(d => norm(String(d._tarefaTxt || "")).includes(norm("FOLLOW")) || norm(String(d.TITLE || "")).includes(norm("FOLLOW-UP")));
      if (kw) {
        hits = hits.filter(d => norm([d.TITLE||"", d._obs||""].join(" ")).includes(kw));
      }
      hits = sortDeals(hits);

      const box = document.getElementById("fuList");
      if (!hits.length) {
        box.innerHTML = `<div class="eqd-empty">Nenhum follow-up encontrado.</div>`;
        return;
      }
      box.innerHTML = hits.map(d => `
        <div style="border:1px solid rgba(30,40,70,.12);border-radius:16px;background:rgba(255,255,255,.75);padding:10px;display:flex;flex-direction:column;gap:6px">
          <div style="font-size:13px;font-weight:950">${escHtml(bestTitleFromText(d.TITLE||""))}</div>
          <div style="font-size:11px;font-weight:900;opacity:.75">Prazo: ${escHtml(d._prazo ? fmt(d._prazo) : "Sem prazo")} • ID ${escHtml(d.ID)}</div>
        </div>
      `).join("");
    }

    document.getElementById("fuRefresh").onclick = loadFollowList;
    document.getElementById("fuSearch").onkeydown = (e) => { if (e.key === "Enter") loadFollowList(); };

    document.getElementById("fuCreate").onclick = async () => {
      try {
        warn.style.display = "none"; warn.textContent = "";
        setBusy("Criando follow-ups…");

        const namesRaw = String(document.getElementById("fuNames").value || "").trim();
        const lines = namesRaw.split("\n").map(s => s.trim()).filter(Boolean);
        if (!lines.length) throw new Error("Preencha ao menos 1 nome (1 por linha).");

        const prazoLocal = String(document.getElementById("fuPrazo").value || "").trim();
        const prazoIso = prazoLocal ? localInputToIsoWithOffset(prazoLocal) : "";
        if (prazoLocal && !prazoIso) throw new Error("Prazo inválido.");

        for (const name of lines) {
          await createFollow(name, prazoIso);
        }

        await refreshData(true);
        await loadFollowList();
        alert("Follow-ups criados.");
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally {
        clearBusy();
      }
    };

    loadFollowList().catch(() => {});
  }

  // =========================
  // 19) CONCLUÍDAS (por user)
  // =========================
  async function modalConcluidas(user) {
    const kw = "";
    openModal(`Concluídas — ${user.name}`, `
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input id="cdKw" class="eqd-searchInput" style="background:rgba(0,0,0,.06);color:rgba(18,26,40,.92)" placeholder="Buscar..." />
        <button class="eqd-btn" id="cdGo">Buscar</button>
      </div>
      <div id="cdList" style="margin-top:10px"></div>
    `);

    function render(kwNorm) {
      const all = (STATE.dealsAll || []).filter(d => String(d.ASSIGNED_BY_ID || d._assigned || "") === String(user.userId));
      const done = all.filter(d => STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId));
      let hits = done;
      if (kwNorm) hits = done.filter(d => norm([d.TITLE||"", d._obs||""].join(" ")).includes(kwNorm));
      hits = hits.slice().sort((a,b)=> (createdMs(b)-createdMs(a)));

      const box = document.getElementById("cdList");
      if (!hits.length) { box.innerHTML = `<div class="eqd-empty">Nenhum item.</div>`; return; }
      box.innerHTML = hits.map(d => `
        <div style="border:1px solid rgba(30,40,70,.12);border-radius:16px;background:rgba(255,255,255,.75);padding:10px;display:flex;flex-direction:column;gap:6px">
          <div style="font-size:13px;font-weight:950">${escHtml(bestTitleFromText(d.TITLE||""))}</div>
          <div style="font-size:11px;font-weight:900;opacity:.75">Prazo: ${escHtml(d._prazo ? fmt(d._prazo) : "Sem prazo")} • ID ${escHtml(d.ID)}</div>
        </div>
      `).join("");
    }

    document.getElementById("cdGo").onclick = () => render(norm(String(document.getElementById("cdKw").value||"").trim()));
    document.getElementById("cdKw").onkeydown = (e) => { if (e.key === "Enter") render(norm(String(document.getElementById("cdKw").value||"").trim())); };

    render("");
  }

  // =========================
  // 20) PAINEL GERAL (cards dos users)
  // =========================
  function overdueEmoji(overdueCount) {
    if (overdueCount <= 0) return "🟢";
    if (overdueCount === 2) return "🟠";
    if (overdueCount === 3) return "🟣";
    if (overdueCount >= 4) return "🔴";
    // 1 atraso => 🟠 (mantém seu padrão de “duas” como 🟠, mas 1 também fica alerta)
    return "🟠";
  }

  function countUserStats(userId) {
    const id = String(userId);
    const all = (STATE.dealsAll || []).filter(d => String(d.ASSIGNED_BY_ID || d._assigned || "") === id);
    const done = all.filter(d => STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId));
    const open = all.filter(d => !(STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId)));

    const ds = dayStart(selectedDate).getTime();
    const de = dayEnd(selectedDate).getTime();

    const dayOpen = open.filter(d => {
      if (!d._prazo) return false;
      const t = new Date(d._prazo).getTime();
      return Number.isFinite(t) && t >= ds && t <= de;
    });

    const overdue = open.filter(d => d._late);
    return {
      day: dayOpen.length,
      done: done.length,
      overdue: overdue.length,
    };
  }

  function makeUserCard(u) {
    const photo = STATE.userPhotoById.get(Number(u.userId)) || "";
    const stats = countUserStats(u.userId);
    const emoji = overdueEmoji(stats.overdue);

    return `
      <div class="userCard" data-action="openUser" data-userid="${u.userId}">
        <img class="userPhoto" src="${photo || ""}" alt="${escHtml(u.name)}" referrerpolicy="no-referrer"
          onerror="try{this.onerror=null;this.src='';this.style.display='none'}catch(e){}" />
        <div class="userName">${escHtml(u.name)}</div>
        <div class="userTeam">Equipe ${escHtml(u.team || "")}</div>

        <div class="userEmoji">${emoji}</div>

        <div class="userStats">
          <span>Hoje: <strong>${stats.day}</strong></span>
          <span>Concluídas: <strong>${stats.done}</strong></span>
          <span>Atrasadas: <strong>${stats.overdue}</strong></span>
        </div>
      </div>
    `;
  }

  function renderGeneral() {
    el.main.innerHTML = `
      <div style="margin-bottom:10px;font-weight:950;opacity:.75">Dia selecionado: ${fmtDateOnly(selectedDate)}</div>
      <div class="userGrid">
        ${USERS.map(makeUserCard).join("")}
      </div>
    `;
  }

  // =========================
  // 21) PAINEL INDIVIDUAL (3 colunas, ordenação: urg, atrasada, horário)
  // =========================
  let currentView = { kind: "general", userId: null, multi: null };

  function distributeInto3Cols(sortedDeals) {
    const cols = [[], [], []];
    for (let i = 0; i < sortedDeals.length; i++) {
      cols[i % 3].push(sortedDeals[i]);
    }
    return cols;
  }

  function renderUserPanel(userId) {
    const user = USERS.find(u => Number(u.userId) === Number(userId));
    if (!user) { renderGeneral(); return; }

    const photo = STATE.userPhotoById.get(Number(user.userId)) || "";
    const deals = (STATE.dealsOpen || []).filter(d => String(d.ASSIGNED_BY_ID || d._assigned || "") === String(user.userId));
    const ordered = sortDeals(deals);
    const cols = distributeInto3Cols(ordered);

    el.main.innerHTML = `
      <div class="panelHead">
        <div class="panelUserInfo">
          <img class="panelUserPhoto" src="${photo || ""}" referrerpolicy="no-referrer"
               onerror="try{this.onerror=null;this.src='';this.style.display='none'}catch(e){}" />
          <div>
            <div class="panelUserName">${escHtml(user.name)}</div>
            <div class="panelUserTeam">Equipe ${escHtml(user.team || "")}</div>
          </div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
          <button class="eqd-btn" data-action="backGeneral">VOLTAR</button>
          <button class="eqd-btn eqd-btnPrimary" data-action="newTask" data-userid="${user.userId}">NOVA TAREFA</button>
          <button class="eqd-btn" data-action="followUp" data-userid="${user.userId}">FOLLOW-UP</button>
          <button class="eqd-btn" data-action="concluidas" data-userid="${user.userId}">CONCLUÍDAS</button>
          <button class="eqd-btn" id="batchResched">REAGENDAR EM LOTE</button>
        </div>

        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;width:100%;justify-content:flex-end">
          <input class="eqd-searchInput" id="userSearch" placeholder="Buscar só desta usuária..." style="max-width:380px" />
          <button class="eqd-btn" id="userSearchBtn">Buscar</button>
        </div>
      </div>

      <div class="panelCols">
        ${[0,1,2].map(i => `
          <div class="panelCol">
            <div class="panelColHead">Coluna ${i+1}</div>
            <div class="panelColBody" id="col_${i}">${
              cols[i].length
                ? cols[i].map(d => makeDealCard(d, {allowBatch:true})).join("")
                : `<div class="eqd-empty">Sem itens</div>`
            }</div>
          </div>
        `).join("")}
      </div>
    `;

    // busca só da user
    const doUserSearch = () => {
      const kw = norm(String(document.getElementById("userSearch").value || "").trim());
      if (!kw) { alert("Digite uma palavra."); return; }
      const hits = ordered.filter(d => norm([d.TITLE||"", d._obs||"", d._tarefaTxt||"", d._colabTxt||"", d._etapaTxt||"", d._urgTxt||""].join(" ")).includes(kw));
      openModal(`Busca — ${user.name} • ${hits.length}`, hits.length ? hits.map(d => makeDealCard(d, {allowBatch:false})).join("") : `<div class="eqd-empty">Nada encontrado.</div>`);
    };
    document.getElementById("userSearchBtn").onclick = doUserSearch;
    document.getElementById("userSearch").onkeydown = (e) => { if (e.key === "Enter") doUserSearch(); };

    // reagendar em lote
    document.getElementById("batchResched").onclick = async () => {
      const ids = [...document.querySelectorAll(".eqd-batch:checked")].map(x => x.getAttribute("data-id"));
      if (!ids.length) { alert("Selecione tarefas marcando 'Lote' nos cards."); return; }
      const whenLocal = String(prompt("Novo prazo (ex.: 2026-02-21 14:30)") || "").trim();
      if (!whenLocal) return;
      const prazoIso = localInputToIsoWithOffset(whenLocal);
      if (!prazoIso) { alert("Data inválida."); return; }

      try {
        setBusy("Reagendando…");
        for (const id of ids) {
          await actionUpdateFields(id, { [UF_PRAZO]: prazoIso });
          updateDealCache(id, { [UF_PRAZO]: prazoIso, _prazo: new Date(prazoIso).toISOString(), _late: false });
        }
        await refreshData(false);
        renderUserPanel(user.userId);
        alert("Reagendado.");
      } catch (e) {
        alert("Falha ao reagendar: " + (e.message || e));
      } finally {
        clearBusy();
      }
    };
  }

  // =========================
  // 22) MULTI SELEÇÃO (até 5)
  // =========================
  function openMultiSelect() {
    const pin = String(prompt("Senha administradora:") || "").trim();
    if (!ADMIN_PINS.has(pin)) return;

    openModal("Painel Multi Seleção", `
      <div style="font-size:12px;font-weight:950">Selecione até 5 usuários</div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px">
        ${USERS.map(u => `
          <label style="display:flex;gap:8px;align-items:center;border:1px solid rgba(0,0,0,.12);border-radius:12px;padding:8px;background:rgba(255,255,255,.65)">
            <input type="checkbox" class="ms-u" value="${u.userId}">
            <span style="font-weight:950">${escHtml(u.name)}</span>
          </label>
        `).join("")}
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
        <button class="eqd-btn" data-action="modalClose">Cancelar</button>
        <button class="eqd-btn eqd-btnPrimary" id="ms-ok">Abrir</button>
      </div>
    `);

    document.getElementById("ms-ok").onclick = () => {
      const sel = [...document.querySelectorAll(".ms-u:checked")].map(x => x.value);
      if (sel.length < 1) return alert("Selecione ao menos 1.");
      if (sel.length > 5) return alert("Máximo 5.");
      closeModal();
      currentView = { kind: "multi", userId: null, multi: sel.map(Number) };
      renderMultiColumns(sel.map(Number));
    };
  }

  function renderMultiColumns(userIds) {
    const cols = userIds.length;
    el.main.innerHTML = `
      <div class="panelHead">
        <div style="font-weight:950">PAINEL MULTI • Dia ${fmtDateOnly(selectedDate)}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
          <button class="eqd-btn" data-action="backGeneral">VOLTAR</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(${cols},minmax(280px,1fr));gap:12px">
        ${userIds.map(uid => {
          const u = USERS.find(x => Number(x.userId) === Number(uid)) || { name: `User ${uid}`, userId: uid };
          const photo = STATE.userPhotoById.get(Number(uid)) || "";
          return `
            <section class="panelCol">
              <div class="panelColHead" style="display:flex;gap:10px;align-items:center">
                <img src="${photo||""}" style="width:34px;height:34px;border-radius:999px;object-fit:cover;border:1px solid rgba(0,0,0,.12)" referrerpolicy="no-referrer"
                     onerror="try{this.onerror=null;this.style.display='none'}catch(e){}" />
                <span style="font-weight:950">${escHtml(u.name)}</span>
              </div>
              <div class="panelColBody" id="ms_${uid}"></div>
            </section>
          `;
        }).join("")}
      </div>
    `;

    userIds.forEach(uid => {
      const box = document.getElementById(`ms_${uid}`);
      const deals = (STATE.dealsOpen || []).filter(d => String(d.ASSIGNED_BY_ID || d._assigned || "") === String(uid));
      const ordered = sortDeals(deals);
      box.innerHTML = ordered.length ? ordered.map(d => makeDealCard(d, {allowBatch:false})).join("") : `<div class="eqd-empty">Sem itens</div>`;
    });
  }

  // =========================
  // 23) DONE MENU (Concluir ou Concluir+Reagendar)
  // =========================
  function openDoneMenu(dealId) {
    openModal("Concluir", `
      <div class="eqd-empty">O que você quer fazer?</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
        <button class="eqd-btn" data-action="modalClose">Cancelar</button>
        <button class="eqd-btn eqd-btnPrimary" data-action="doneOnly" data-id="${dealId}">Só concluir</button>
        <button class="eqd-btn" data-action="doneResched" data-id="${dealId}">Concluir e reagendar</button>
      </div>
    `);
  }

  async function doneOnly(dealId) {
    setBusy("Concluindo…");
    await actionSetDone(dealId);
    removeFromOpen(dealId);
    await refreshData(false);
    clearBusy();
    renderCurrentView();
  }

  async function doneResched(dealId) {
    // mantém dados ou edita
    const opt = String(prompt("Reagendar: 1) Manter dados  2) Editar (digite 1 ou 2)") || "").trim();
    const keep = (opt !== "2");

    const prazoLocal = String(prompt("Novo prazo (ex.: 2026-02-21 14:30)") || "").trim();
    const prazoIso = localInputToIsoWithOffset(prazoLocal);
    if (!prazoIso) { alert("Prazo inválido."); return; }

    setBusy("Concluindo e reagendando…");

    // conclui atual
    await actionSetDone(dealId);
    removeFromOpen(dealId);

    // pega deal atual pra duplicar
    const old = (STATE.dealsAll || []).find(d => String(d.ID) === String(dealId));
    if (!old) { clearBusy(); renderCurrentView(); return; }

    const fields = {
      CATEGORY_ID: Number(CATEGORY_MAIN),
      STAGE_ID: String(old.STAGE_ID),
      TITLE: String(old.TITLE || "Negócio"),
      ASSIGNED_BY_ID: Number(old.ASSIGNED_BY_ID || old._assigned || 0) || undefined,
      [UF_PRAZO]: prazoIso,
    };

    if (keep) {
      if (old[UF_URGENCIA]) fields[UF_URGENCIA] = old[UF_URGENCIA];
      if (old[UF_TAREFA]) fields[UF_TAREFA] = old[UF_TAREFA];
      if (old[UF_ETAPA]) fields[UF_ETAPA] = old[UF_ETAPA];
      if (old[UF_COLAB]) fields[UF_COLAB] = old[UF_COLAB];
      if (old[UF_OBS]) fields[UF_OBS] = old[UF_OBS];
    } else {
      // edição simples
      const newTitle = String(prompt("Editar nome do negócio (enter para manter):") || "").trim();
      if (newTitle) fields.TITLE = newTitle;
    }

    await bx("crm.deal.add", { fields });

    await refreshData(true);
    clearBusy();
    renderCurrentView();
  }

  // =========================
  // 24) EDIT PRAZO / EDIT TITLE / TROCAR COLAB
  // =========================
  async function editPrazo(dealId) {
    const prazoLocal = String(prompt("Novo prazo (ex.: 2026-02-21 14:30)") || "").trim();
    const prazoIso = localInputToIsoWithOffset(prazoLocal);
    if (!prazoIso) { alert("Prazo inválido."); return; }
    try {
      setBusy("Salvando prazo…");
      await actionUpdateFields(dealId, { [UF_PRAZO]: prazoIso });
      await refreshData(false);
      clearBusy();
      renderCurrentView();
    } catch (e) {
      clearBusy();
      alert("Falha: " + (e.message || e));
    }
  }

  async function editTitle(dealId) {
    const newTitle = String(prompt("Novo nome do negócio:") || "").trim();
    if (!newTitle) return;
    try {
      setBusy("Salvando…");
      await actionUpdateFields(dealId, { TITLE: newTitle });
      await refreshData(false);
      clearBusy();
      renderCurrentView();
    } catch (e) {
      clearBusy();
      alert("Falha: " + (e.message || e));
    }
  }

  async function changeColab(dealId) {
    // “transferir para outra user” = trocar responsável (ASSIGNED_BY_ID) dentro da mesma pipeline
    const list = USERS.map(u => `${u.userId} - ${u.name}`).join("\n");
    const pick = String(prompt("Digite o ID do novo responsável:\n" + list) || "").trim();
    if (!pick) return;
    const uid = Number(pick);
    if (!uid) { alert("ID inválido."); return; }

    try {
      setBusy("Transferindo…");
      await actionUpdateFields(dealId, { ASSIGNED_BY_ID: uid });
      await refreshData(true);
      clearBusy();
      renderCurrentView();
    } catch (e) {
      clearBusy();
      alert("Falha: " + (e.message || e));
    }
  }

  // =========================
  // 25) CLICK HANDLER
  // =========================
  function globalClickHandler(e) {
    const a = e.target.closest("[data-action]");
    if (!a) return;

    const act = a.getAttribute("data-action");
    const dealId = a.getAttribute("data-id");
    const uid = a.getAttribute("data-userid");

    if (act === "modalClose") { closeModal(); return; }

    if (act === "openUser") {
      const userId = Number(uid);
      if (!canOpenUserPanel(userId)) return;
      currentView = { kind: "user", userId, multi: null };
      renderUserPanel(userId);
      return;
    }

    if (act === "backGeneral") {
      currentView = { kind: "general", userId: null, multi: null };
      renderGeneral();
      return;
    }

    if (act === "newTask") {
      const user = USERS.find(u => Number(u.userId) === Number(uid));
      if (!user) return;
      modalNewDeal(user).catch(showFatal);
      return;
    }

    if (act === "followUp") {
      const user = USERS.find(u => Number(u.userId) === Number(uid));
      if (!user) return;
      modalFollowUp(user).catch(showFatal);
      return;
    }

    if (act === "concluidas") {
      const user = USERS.find(u => Number(u.userId) === Number(uid));
      if (!user) return;
      modalConcluidas(user).catch(showFatal);
      return;
    }

    if (act === "doneMenu") { openDoneMenu(dealId); return; }
    if (act === "doneOnly") { closeModal(); doneOnly(dealId).catch(err => alert(err.message||err)); return; }
    if (act === "doneResched") { closeModal(); doneResched(dealId).catch(err => alert(err.message||err)); return; }

    if (act === "editPrazo") { editPrazo(dealId).catch(()=>{}); return; }
    if (act === "editTitle") { editTitle(dealId).catch(()=>{}); return; }
    if (act === "changeColab") { changeColab(dealId).catch(()=>{}); return; }

    if (act === "delete") {
      openModal("Confirmar exclusão", `
        <div class="eqd-warn" style="display:block">Excluir este item?</div>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnDanger" id="confirmDel">Excluir</button>
        </div>
      `);
      document.getElementById("confirmDel").onclick = async () => {
        try {
          setBusy("Excluindo…");
          await actionDeleteDeal(dealId);
          removeFromOpen(dealId);
          closeModal();
          await refreshData(false);
          renderCurrentView();
        } catch (err) {
          alert("Falha ao excluir: " + (err.message || err));
        } finally {
          clearBusy();
        }
      };
      return;
    }
  }

  el.main.addEventListener("click", globalClickHandler);
  el.modalBody.addEventListener("click", globalClickHandler);

  // =========================
  // 26) TOP BUTTONS
  // =========================
  el.refresh.addEventListener("click", () => { refreshData(true).then(renderCurrentView).catch(()=>{}); });
  el.today.addEventListener("click", () => { selectedDate = new Date(); renderCurrentView(); });
  el.calendar.addEventListener("click", openCalendarModal);
  el.multi.addEventListener("click", openMultiSelect);

  // =========================
  // 27) RENDER CURRENT VIEW
  // =========================
  function renderCurrentView() {
    const now = new Date();
    el.meta.textContent = STATE.lastOkAt
      ? `Atualizado em ${fmt(STATE.lastOkAt)}${STATE.offline ? " • (offline)" : ""}`
      : `Carregando…`;

    if (currentView.kind === "user" && currentView.userId) {
      renderUserPanel(currentView.userId);
    } else if (currentView.kind === "multi" && currentView.multi) {
      renderMultiColumns(currentView.multi);
    } else {
      renderGeneral();
    }
  }

  // =========================
  // 28) REFRESH (se cair: mantém cache e não trava)
  // =========================
  let REFRESH_RUNNING = false;

  async function refreshData(force) {
    if (REFRESH_RUNNING) return;
    REFRESH_RUNNING = true;

    try {
      setSoftStatus("Atualizando…");
      if (force) {
        await loadStagesForCategory(CATEGORY_MAIN);
        await loadDeals();
      } else {
        // refresh leve: tenta só deals; se falhar, fica com cache
        await loadDeals();
      }
      setSoftStatus("JS: ok");
    } catch (e) {
      // offline mode (mantém o que já tem)
      STATE.offline = true;
      setSoftStatus("Sem conexão / limite — mantendo painel estável…");
      if (!STATE.dealsAll.length) loadCache();
    } finally {
      REFRESH_RUNNING = false;
    }
  }

  // =========================
  // 29) INIT
  // =========================
  (async () => {
    // tenta cache já
    loadCache();

    // stages + deals
    await loadStagesForCategory(CATEGORY_MAIN);

    // primeira carga real
    await refreshData(true);

    // painel geral
    currentView = { kind: "general", userId: null, multi: null };
    renderCurrentView();

    // refresh loop
    setInterval(() => {
      if (!REFRESH_RUNNING && BX_INFLIGHT === 0) {
        refreshData(false).then(() => {
          // só re-render se não estiver no meio de modal (não interfere)
          renderCurrentView();
        }).catch(() => {});
      }
    }, REFRESH_MS);
  })().catch(showFatal);

})();
