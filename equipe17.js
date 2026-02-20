/* eqd.js — GET • CGD CORRETORA (via Worker Proxy) */
/* NÃO altera estética/cores dos cards de tarefas existentes. */

(function () {
  // =========================
  // 1) CONFIG (EDITAR AQUI)
  // =========================
  const PROXY_BASE = "https://cgd-bx-proxy.cgdseguros.workers.dev/bx/"; // /bx/<method>
  const LOGO_URL =
    "https://bitrix24public.com/b24-6iyx5y.bitrix24.com.br/docs/pub/c77325321d1ad38e8012b995a5f4e8dd/showFile/?&token=q0zmo189kiw9";

  // Refresh
  const REFRESH_USER_MS = 20000; // painel individual (tempo real)
  const REFRESH_MAIN_MS = 30000; // painel principal (leve)

  // ADMIN PINS (simples, interno)
  const ADMIN_PINS = new Set(["4455", "8123", "6677", "4627"]);

  // ==============
  // CAMPOS UF (fixos)
  // ==============
  const UF_URGENCIA = "UF_CRM_1768174982";
  const UF_TAREFA = "UF_CRM_1768185018696";
  const UF_ETAPA = "UF_CRM_1768179977089";
  const UF_COLAB = "UF_CRM_1770327799";
  const UF_PRAZO = "UF_CRM_1768175087";

  // OBS (você fixou este)
  const UF_OBS = "UF_CRM_691385BE7D33D";

  const DONE_STAGE_NAME = "CONCLUÍDO";

  // =========================
  // 2) USERS / PIPELINES / TIMES (ordem que você passou)
  // =========================
  const PIPELINES = [
    {
      categoryId: 17,
      name: "Pipeline 17",
      teams: {
        DELTA: { label: "EQUIPE DELTA", greek: "Δ" },
        ALPHA: { label: "EQUIPE ALPHA", greek: "Α" },
        BETA: { label: "EQUIPE BETA", greek: "Β" },
      },
      users: [
        { id: 813, name: "MANUELA", team: "DELTA" },
        { id: 841, name: "MARIA CLARA", team: "DELTA" },
        { id: 3387, name: "BEATRIZ", team: "DELTA" },
        { id: 3081, name: "BRUNA LUISA", team: "DELTA" },

        { id: 15, name: "ALINE", team: "ALPHA" },
        { id: 19, name: "ADRIANA", team: "ALPHA" },
        { id: 17, name: "ANDREYNA", team: "ALPHA" },
        { id: 23, name: "MARIANA", team: "ALPHA" },
        { id: 811, name: "JOSIANE", team: "ALPHA" },

        { id: 3079, name: "LIVIA ALVES", team: "BETA" },
        { id: 3083, name: "FERNANDA SILVA", team: "BETA" },
        { id: 3085, name: "NICOLLE BELMONTE", team: "BETA" },
        { id: 3389, name: "ANNA CLARA", team: "BETA" },
      ],
    },
    {
      categoryId: 19,
      name: "Pipeline 19",
      teams: {
        GAMMA: { label: "PIPELINE 19", greek: "Γ" }, // se quiser trocar o símbolo/nome, é aqui
      },
      users: [
        { id: 815, name: "GABRIEL", team: "GAMMA" },
        { id: 269, name: "AMANDA", team: "GAMMA" },
        { id: 29, name: "TALITA", team: "GAMMA" },
        { id: 3101, name: "VIVIAN", team: "GAMMA" },
      ],
    },
  ];

  // Grid do painel principal: 4 colunas
  const MAIN_GRID_COLS = 4;
  const MULTI_MAX = 5;

  // Recorrência (horizonte: ajustável)
  const REC_DAILY_DAYS = 60;   // diária em dias úteis (próximos 60 dias)
  const REC_WEEKLY_WEEKS = 12; // semanal (próximas 12 semanas)
  const REC_MONTHLY_MONTHS = 6; // mensal (próximos 6 meses)

  // =========================
  // 3) BOOTSTRAP
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
  function injectCSS(cssText) {
    const id = "eqd-css-injected-v3";
    if (document.getElementById(id)) return;
    const st = document.createElement("style");
    st.id = id;
    st.textContent = cssText;
    document.head.appendChild(st);
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

  // =========================
  // 4) BX PROXY CLIENT (fila + retry)
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
    try {
      return await fetch(url, { ...options, signal: ctrl.signal });
    } finally {
      clearTimeout(t);
    }
  }

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
  async function bx(method, params = {}) { const data = await bxRaw(method, params); return data.result; }
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
  // 5) STATE / CACHES (front)
  // =========================
  const STATE = {
    // caches “quase estáveis”
    enumCache: new Map(), // uf -> map id->label
    stageCacheByCategory: new Map(), // category -> { doneStageId, stageMapByName, stageIdToUserId }
    userPhotoById: new Map(),
    userNameById: new Map(),

    // dados “tempo real”
    dealsByCategory: new Map(), // categoryId -> parsed deals (abertas + concluídas)
    lastOkAt: null,
  };

  async function enums(uf) {
    if (STATE.enumCache.has(uf)) return STATE.enumCache.get(uf);

    // (mantém como estava) — mas no Worker você vai cachear forte isso.
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

  async function enumIdByLabel(uf, label) {
    const m = await enums(uf);
    const target = norm(label);
    for (const [id, v] of Object.entries(m || {})) {
      if (norm(v) === target) return String(id);
    }
    return "";
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

    // map stageId -> userId (coluna tem o NOME do usuário)
    const stageIdToUserId = new Map();
    const p = PIPELINES.find((x) => Number(x.categoryId) === cid);
    const users = (p && p.users) ? p.users : [];

    for (const u of users) {
      const uname = norm(u.name);
      for (const [stageNameNorm, stageId] of stageMapByName.entries()) {
        if (stageNameNorm === uname || stageNameNorm.includes(uname) || uname.includes(stageNameNorm)) {
          stageIdToUserId.set(String(stageId), Number(u.id));
        }
      }
    }

    const cache = { doneStageId, stageMapByName, stageIdToUserId };
    STATE.stageCacheByCategory.set(cid, cache);
    return cache;
  }

  async function ensureUserProfile(userId, fallbackName) {
    const id = Number(userId);
    if (!id) return;
    if (STATE.userNameById.has(id) && STATE.userPhotoById.has(id)) return;

    let photoUrl = STATE.userPhotoById.get(id) || "";
    let name = STATE.userNameById.get(id) || String(fallbackName || "").trim();

    try {
      const res = await bx("user.get", { ID: id });
      const u = Array.isArray(res) ? res[0] : res;
      if (u) {
        const fn = [u.NAME, u.LAST_NAME].filter(Boolean).join(" ").trim();
        if (fn) name = fn;
        const p = u.PERSONAL_PHOTO;
        if (p && typeof p === "string" && /^https?:\/\//i.test(p)) photoUrl = p;
      }
    } catch (_) {}

    STATE.userNameById.set(id, name);
    STATE.userPhotoById.set(id, photoUrl || "");
  }

  function isUrgenteText(txt) {
    const u = norm(txt);
    if (!u) return false;
    if (u.includes("ATEN")) return false;
    return u.includes("URG");
  }
  function isAtencaoText(txt) {
    return norm(txt).includes("ATEN");
  }

  function parseDeal(deal, maps, categoryId) {
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
    const obsTxt = String(deal[UF_OBS] || "").trim();

    const stageCache = STATE.stageCacheByCategory.get(Number(categoryId));
    const ownerUserId = stageCache ? (stageCache.stageIdToUserId.get(String(deal.STAGE_ID)) || null) : null;

    // accent (mantém seu padrão atual)
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
      _categoryId: Number(categoryId),
      _negocio: negocioTxt,
      _obs: obsTxt,
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
      _ownerUserId: ownerUserId,
      _accent: accent,
    });
  }

  async function loadDealsByCategory(categoryId) {
    const cid = Number(categoryId);
    await loadStagesForCategory(cid);

    const [urgMap, tarefaMap, etapaMap] = await Promise.all([
      enums(UF_URGENCIA),
      enums(UF_TAREFA),
      enums(UF_ETAPA),
    ]);

    // UF_COLAB pode ser lista; se não for, mantém vazio
    let colabMapMaybe = {};
    try {
      colabMapMaybe = await enums(UF_COLAB);
    } catch (_) { colabMapMaybe = {}; }

    const select = [
      "ID", "TITLE", "STAGE_ID", "DATE_CREATE", "DATE_MODIFY", "ASSIGNED_BY_ID",
      UF_TAREFA, UF_OBS, UF_PRAZO, UF_URGENCIA, UF_ETAPA, UF_COLAB,
    ];

    const deals = await bxAll("crm.deal.list", {
      filter: { CATEGORY_ID: cid },
      select,
      order: { ID: "DESC" },
    });

    const parsed = (deals || []).map((d) => parseDeal(d, { urgMap, tarefaMap, etapaMap, colabMapMaybe }, cid));
    STATE.dealsByCategory.set(cid, parsed);
    STATE.lastOkAt = new Date();
    return parsed;
  }

  function getDoneStageId(categoryId) {
    const cache = STATE.stageCacheByCategory.get(Number(categoryId));
    return cache ? cache.doneStageId : null;
  }

  function dealsForUser(categoryId, userId, includeDone) {
    const cid = Number(categoryId);
    const uid = Number(userId);
    const all = STATE.dealsByCategory.get(cid) || [];
    const doneId = getDoneStageId(cid);

    return all.filter((d) => {
      if (d._ownerUserId !== uid) return false;
      if (!includeDone && doneId && String(d.STAGE_ID) === String(doneId)) return false;
      return true;
    });
  }

  function sortDealsForDisplay(list) {
    // Regra: urgência, atrasada, horário
    return (list || []).slice().sort((a, b) => {
      const ua = isUrgenteText(a._urgTxt) ? 0 : 1;
      const ub = isUrgenteText(b._urgTxt) ? 0 : 1;
      if (ua !== ub) return ua - ub;

      const la = a._late ? 0 : 1;
      const lb = b._late ? 0 : 1;
      if (la !== lb) return la - lb;

      const ta = a._prazo ? new Date(a._prazo).getTime() : Number.POSITIVE_INFINITY;
      const tb = b._prazo ? new Date(b._prazo).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb;
    });
  }

  function bestTitleFromText(txt) {
    const t = String(txt || "").trim();
    if (!t) return "Negócio";
    const first = t.split("\n")[0].trim();
    return trunc(first || "Negócio", 72);
  }

  // =========================
  // 6) ACTIONS (Bitrix)
  // =========================
  async function actionSetDone(categoryId, dealId) {
    const doneStageId = getDoneStageId(categoryId);
    if (!doneStageId) throw new Error("Não encontrei a coluna CONCLUÍDO na pipeline.");
    await bx("crm.deal.update", { id: String(dealId), fields: { STAGE_ID: String(doneStageId) } });
  }

  async function actionUpdateDeal(dealId, fields) {
    await bx("crm.deal.update", { id: String(dealId), fields: fields || {} });
  }

  async function actionDeleteDeal(dealId) {
    await bx("crm.deal.delete", { id: String(dealId) });
  }

  async function stageIdForUserInCategory(categoryId, userName) {
    const cache = await loadStagesForCategory(categoryId);
    const exact = cache.stageMapByName.get(norm(userName));
    if (exact) return exact;
    for (const [k, v] of cache.stageMapByName.entries()) {
      if (k.includes(norm(userName))) return v;
    }
    return null;
  }

  async function actionTransferToUser(categoryId, dealId, targetUserId) {
    const pipe = PIPELINES.find((p) => Number(p.categoryId) === Number(categoryId));
    const u = pipe ? pipe.users.find((x) => Number(x.id) === Number(targetUserId)) : null;
    if (!u) throw new Error("Usuária destino não encontrada nesta pipeline.");

    const stageId = await stageIdForUserInCategory(categoryId, u.name);
    if (!stageId) throw new Error(`Não encontrei a coluna ${u.name} na pipeline.`);

    await bx("crm.deal.update", {
      id: String(dealId),
      fields: {
        STAGE_ID: String(stageId),
        ASSIGNED_BY_ID: Number(u.id),
      },
    });
  }

  async function actionCreateDeal(categoryId, targetUserId, title, prazoIso, uf) {
    const pipe = PIPELINES.find((p) => Number(p.categoryId) === Number(categoryId));
    const u = pipe ? pipe.users.find((x) => Number(x.id) === Number(targetUserId)) : null;
    if (!u) throw new Error("Usuária destino inválida.");

    const stageId = await stageIdForUserInCategory(categoryId, u.name);
    if (!stageId) throw new Error(`Não encontrei a coluna ${u.name} na pipeline.`);

    const fields = {
      CATEGORY_ID: Number(categoryId),
      STAGE_ID: String(stageId),
      TITLE: bestTitleFromText(title),
      ASSIGNED_BY_ID: Number(targetUserId),
    };

    fields[UF_PRAZO] = prazoIso || "";
    if (uf) {
      if (uf.urgencia) fields[UF_URGENCIA] = uf.urgencia;
      if (uf.tarefa) fields[UF_TAREFA] = uf.tarefa;
      if (uf.etapa) fields[UF_ETAPA] = uf.etapa;
      if (uf.colab) fields[UF_COLAB] = uf.colab;
      if (uf.obs) fields[UF_OBS] = uf.obs;
    }

    return await bx("crm.deal.add", { fields });
  }

  // =========================
  // 7) UI (base + estilos — cards de tarefa ficam intactos)
  // =========================
  const root = ensureRoot();

  injectCSS(`
    /* layout geral novo */
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

    .topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap;}
    .titleWrap{display:flex;align-items:center;gap:10px;min-width:320px;}
    .logo{width:40px;height:40px;border-radius:14px;border:1px solid var(--border);background:rgba(255,255,255,.78);object-fit:contain;padding:7px;flex:0 0 auto;}
    #eqd-app.eqd-dark .logo{background:rgba(255,255,255,.10);}
    .titleBlock{display:flex;flex-direction:column;gap:2px;}
    .title{display:flex;align-items:center;gap:10px;font-weight:950;font-size:18px;}
    .dot{width:10px;height:10px;border-radius:999px;background:#16a34a;box-shadow:0 0 0 6px rgba(22,163,74,.12);}
    .meta{font-size:12px;color:var(--muted);font-weight:800;}
    .actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;}
    .pill{font-size:12px;font-weight:900;padding:8px 10px;border-radius:999px;border:1px solid var(--border);background:rgba(255,255,255,.75);color:rgba(18,26,40,.85);white-space:nowrap;}
    #eqd-app.eqd-dark .pill{background:rgba(255,255,255,.08);color:var(--text);}
    .btn{border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.85);border-radius:999px;padding:8px 12px;font-size:12px;font-weight:950;cursor:pointer;white-space:nowrap;color:rgba(18,26,40,.92);}
    #eqd-app.eqd-dark .btn{background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.12);color:var(--text);}
    .btnPrimary{background:rgba(120,90,255,.18);border-color:rgba(120,90,255,.35);}
    .btnDanger{background:rgba(255,70,90,.14);border-color:rgba(255,70,90,.30);}

    .searchWrap{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end;}
    .searchInput{width:min(320px,54vw);border:1px solid var(--border);background:#fff;border-radius:999px;padding:9px 12px;font-size:12px;font-weight:900;outline:none;color:rgba(18,26,40,.92);}
    #eqd-app.eqd-dark .searchInput{background:rgba(255,255,255,.10);color:var(--text);}
    .select{border:1px solid var(--border);background:rgba(255,255,255,.85);border-radius:999px;padding:8px 10px;font-size:12px;font-weight:950;outline:none;min-width:170px;color:rgba(18,26,40,.92);}
    #eqd-app.eqd-dark .select{background:rgba(255,255,255,.10);color:var(--text);}

    .view{border:1px solid var(--border);border-radius:var(--radius);background:rgba(255,255,255,.45);backdrop-filter:blur(12px);overflow:hidden;min-width:0;}
    #eqd-app.eqd-dark .view{background:rgba(255,255,255,.06);}

    /* principal: cards de usuário */
    .uGrid{display:grid;grid-template-columns:repeat(${MAIN_GRID_COLS}, minmax(240px, 1fr));gap:12px;padding:12px;}
    @media (max-width:1200px){.uGrid{grid-template-columns:1fr}}

    .uCard{border:1px solid var(--border);border-radius:18px;background:rgba(255,255,255,.70);padding:12px;display:flex;flex-direction:column;gap:10px;cursor:pointer;user-select:none;}
    #eqd-app.eqd-dark .uCard{background:rgba(255,255,255,.08);}
    .uTop{display:flex;align-items:center;justify-content:space-between;gap:10px;}
    .uPic{width:76px;height:76px;border-radius:999px;border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.88);object-fit:cover;}
    #eqd-app.eqd-dark .uPic{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.12);}
    .uName{font-weight:950;font-size:14px;display:flex;gap:8px;align-items:center;}
    .uSub{font-size:12px;font-weight:900;color:var(--muted);}
    .uRow{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;font-weight:900;}
    .uBadge{padding:6px 10px;border-radius:999px;border:1px solid var(--border);background:rgba(255,255,255,.72);}
    #eqd-app.eqd-dark .uBadge{background:rgba(255,255,255,.10);}

    /* individual / multi: colunas */
    .columns{display:grid;gap:12px;padding:12px;}
    .colWrap{border:1px solid var(--border);border-radius:18px;background:rgba(255,255,255,.55);backdrop-filter:blur(10px);overflow:hidden;min-height:70vh;display:flex;flex-direction:column;}
    #eqd-app.eqd-dark .colWrap{background:rgba(255,255,255,.06);}
    .colHead{padding:10px 12px;border-bottom:1px solid var(--border);background:rgba(255,255,255,.62);display:flex;align-items:center;justify-content:space-between;gap:10px;}
    #eqd-app.eqd-dark .colHead{background:rgba(255,255,255,.08);}
    .colTitle{display:flex;align-items:center;gap:10px;min-width:0;}
    .colPic{width:56px;height:56px;border-radius:999px;border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.88);object-fit:cover;flex:0 0 auto;}
    .colName{font-weight:950;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .colMeta{font-size:11px;font-weight:900;color:var(--muted);}
    .colBody{padding:10px;overflow:auto;display:flex;flex-direction:column;gap:8px;flex:1 1 auto;min-height:0;}
    .empty{border:1px dashed rgba(30,40,70,.18);border-radius:16px;padding:12px;background:rgba(255,255,255,.55);color:rgba(18,26,40,.62);font-size:11px;font-weight:800;text-align:center;}

    /* modal */
    .modalOverlay{position:fixed;inset:0;background:rgba(10,14,22,.35);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:16px;z-index:99999;}
    .modal{width:min(960px,96vw);max-height:86vh;border-radius:18px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.78);box-shadow:0 20px 60px rgba(10,14,22,.25);overflow:hidden;display:flex;flex-direction:column;}
    #eqd-app.eqd-dark .modal{background:rgba(25,28,34,.92);border-color:rgba(255,255,255,.10);color:var(--text);}
    .modalHead{padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px solid rgba(30,40,70,.12);background:rgba(255,255,255,.82);}
    #eqd-app.eqd-dark .modalHead{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.10);}
    .modalTitle{font-size:12px;font-weight:950;text-transform:uppercase;}
    .modalClose{border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.90);border-radius:999px;padding:6px 10px;font-size:12px;font-weight:900;cursor:pointer;}
    #eqd-app.eqd-dark .modalClose{background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.12);color:var(--text);}
    .modalBody{padding:12px 14px;overflow:auto;display:flex;flex-direction:column;gap:10px;}
    .warn{border:1px solid rgba(255,80,120,.28);background:rgba(255,220,235,.55);color:rgba(120,0,40,.92);padding:10px 12px;border-radius:14px;font-size:11px;font-weight:900;white-space:pre-wrap;display:none;}

    /* OBS piscante (sem mexer no card padrão: só um chip) */
    .obsBlink{animation:obsBlink 1.25s ease-in-out infinite;}
    @keyframes obsBlink{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.06);opacity:.6}}
  `);

  root.innerHTML = `
    <div id="eqd-app">
      <div class="topbar">
        <div class="titleWrap">
          <img class="logo" src="${LOGO_URL}" alt="CGD" referrerpolicy="no-referrer">
          <div class="titleBlock">
            <div class="title"><span class="dot"></span>GET - CGD CORRETORA</div>
            <div class="meta" id="eqd-meta">Carregando…</div>
          </div>
        </div>

        <div class="actions">
          <div class="pill" id="eqd-now">—</div>
          <div class="pill" id="eqd-status">JS: ok</div>

          <div class="searchWrap">
            <select class="select" id="eqd-searchScope"></select>
            <input class="searchInput" id="eqd-searchInput" placeholder="Buscar por palavra (geral ou por user)..." />
            <button class="btn btnPrimary" id="eqd-searchBtn">Buscar</button>
          </div>

          <button class="btn" id="eqd-today">HOJE</button>
          <button class="btn" id="eqd-calendar">Calendário</button>
          <button class="btn" id="eqd-refresh">Atualizar</button>
          <button class="btn" id="eqd-multi">PAINEL MULTI SELEÇÃO</button>
          <button class="btn" id="eqd-darkToggle">Modo escuro</button>
        </div>
      </div>

      <div class="view" id="eqd-view"></div>

      <div class="modalOverlay" id="eqd-modalOverlay" aria-hidden="true">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modalHead">
            <div class="modalTitle" id="eqd-modalTitle">—</div>
            <button class="modalClose" id="eqd-modalClose">Fechar</button>
          </div>
          <div class="modalBody" id="eqd-modalBody"></div>
        </div>
      </div>
    </div>
  `;

  const el = {
    app: document.getElementById("eqd-app"),
    meta: document.getElementById("eqd-meta"),
    now: document.getElementById("eqd-now"),
    status: document.getElementById("eqd-status"),
    view: document.getElementById("eqd-view"),
    refresh: document.getElementById("eqd-refresh"),
    today: document.getElementById("eqd-today"),
    calendar: document.getElementById("eqd-calendar"),
    multi: document.getElementById("eqd-multi"),
    darkToggle: document.getElementById("eqd-darkToggle"),
    searchScope: document.getElementById("eqd-searchScope"),
    searchInput: document.getElementById("eqd-searchInput"),
    searchBtn: document.getElementById("eqd-searchBtn"),
    modalOverlay: document.getElementById("eqd-modalOverlay"),
    modalTitle: document.getElementById("eqd-modalTitle"),
    modalBody: document.getElementById("eqd-modalBody"),
    modalClose: document.getElementById("eqd-modalClose"),
  };

  // =========================
  // 8) DARK TOGGLE
  // =========================
  const DARK_KEY = "eqd_dark_get_v1";
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
  // 10) AUTH (PIN simples)
  // =========================
  function userPin(userId) {
    return String(userId) + "0";
  }
  function promptPin(title) {
    const pin = prompt(title || "Digite a senha:");
    return String(pin || "").trim();
  }
  function isAdminPin(pin) {
    return ADMIN_PINS.has(String(pin || "").trim());
  }
  function checkUserPin(userId, pin) {
    return String(pin || "").trim() === userPin(userId);
  }

  // =========================
  // 11) CALENDÁRIO (mesmo modelo: modal com input date)
  // =========================
  let selectedDate = new Date();
  function openCalendar() {
    const d = new Date(selectedDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    openModal("Calendário", `
      <div class="warn" id="eqd-warn"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
        <div style="flex:0 0 auto">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Selecione o dia</div>
          <input id="eqd-calDate" type="date" value="${yyyy}-${mm}-${dd}" style="padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
        </div>
        <button class="btn btnPrimary" id="eqd-calApply">Aplicar</button>
      </div>
    `);
    document.getElementById("eqd-calApply").onclick = () => {
      const v = String(document.getElementById("eqd-calDate").value || "").trim();
      if (v) {
        const x = new Date(v + "T00:00:00");
        if (!Number.isNaN(x.getTime())) selectedDate = x;
      }
      closeModal();
      routeRender(true);
    };
  }

  // =========================
  // 12) ROUTER / VIEWS
  // =========================
  const ROUTE = { kind: "main" }; // main | user | multi
  let TIMER_MAIN = null;
  let TIMER_USER = null;

  function stopTimers() {
    if (TIMER_MAIN) clearInterval(TIMER_MAIN);
    if (TIMER_USER) clearInterval(TIMER_USER);
    TIMER_MAIN = null;
    TIMER_USER = null;
  }

  function setRoute(r) {
    stopTimers();
    ROUTE.kind = r.kind;
    ROUTE.categoryId = r.categoryId;
    ROUTE.userId = r.userId;
    ROUTE.multiIds = r.multiIds || [];
    routeRender(true);
  }

  // =========================
  // 13) SEARCH SCOPE (geral ou por user)
  // =========================
  function buildSearchScope() {
    const opts = [];
    opts.push(`<option value="__ALL__">Busca geral</option>`);
    for (const p of PIPELINES) {
      for (const u of p.users) {
        const t = p.teams[u.team] || { greek: "•", label: "" };
        opts.push(`<option value="${p.categoryId}:${u.id}">${t.greek} ${u.name}</option>`);
      }
    }
    el.searchScope.innerHTML = opts.join("");
  }

  function searchDeals(keyword, scopeValue) {
    const kw = norm(keyword);
    if (!kw) return [];

    let cat = null, uid = null;
    if (scopeValue && scopeValue !== "__ALL__") {
      const [c, u] = String(scopeValue).split(":");
      cat = Number(c); uid = Number(u);
    }

    const hits = [];
    for (const p of PIPELINES) {
      const cid = Number(p.categoryId);
      if (cat && cid !== cat) continue;

      const all = STATE.dealsByCategory.get(cid) || [];
      const doneId = getDoneStageId(cid);

      for (const d of all) {
        // busca em abertas e concluídas; mas você usa mais as abertas no dia-a-dia
        const blob = norm([
          d.TITLE || "",
          d._obs || "",
          d._tarefaTxt || "",
          d._colabTxt || "",
          d._etapaTxt || "",
          d._urgTxt || "",
        ].join(" "));
        if (!blob.includes(kw)) continue;

        if (uid && d._ownerUserId !== uid) continue;

        // ok
        hits.push({
          categoryId: cid,
          id: d.ID,
          title: d.TITLE,
          prazo: d._prazo,
          done: doneId ? String(d.STAGE_ID) === String(doneId) : false,
          userId: d._ownerUserId,
          obs: !!String(d._obs || "").trim(),
          late: !!d._late,
        });
      }
    }
    return hits.slice(0, 200);
  }

  function runSearch() {
    const kwRaw = String(el.searchInput.value || "").trim();
    if (!kwRaw) {
      openModal("Busca", `<div class="empty">Digite uma palavra-chave.</div>`);
      return;
    }
    const scope = String(el.searchScope.value || "__ALL__");
    const hits = searchDeals(kwRaw, scope);

    const listHTML = hits.length ? hits.map((h) => {
      const prazoTxt = h.prazo ? fmt(h.prazo) : "Sem prazo";
      const obs = h.obs ? `<span class="pill" style="padding:4px 8px" title="Tem OBS">OBS</span>` : ``;
      const late = h.late ? `<span class="pill" style="padding:4px 8px;border-color:rgba(255,70,90,.30);background:rgba(255,70,90,.12)">ATRASADA</span>` : ``;

      return `
        <div style="border:1px solid rgba(30,40,70,.12);border-radius:16px;background:rgba(255,255,255,.75);padding:10px;display:flex;flex-direction:column;gap:8px">
          <div style="font-size:13px;font-weight:950;line-height:1.15">${escHtml(bestTitleFromText(h.title))}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <span style="font-size:11px;font-weight:900;color:rgba(18,26,40,.70)">Prazo: <strong>${escHtml(prazoTxt)}</strong></span>
            <span style="font-size:11px;font-weight:900;color:rgba(18,26,40,.70)">ID: <strong>${escHtml(h.id)}</strong></span>
            ${obs}${late}
          </div>
        </div>
      `;
    }).join("") : `<div class="empty">Nenhum resultado para: <strong>${escHtml(kwRaw)}</strong></div>`;

    openModal(`Busca • ${hits.length} resultado(s)`, listHTML);
  }

  el.searchBtn.addEventListener("click", runSearch);
  el.searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); runSearch(); }
  });

  // =========================
  // 14) USER CARD METRICS (principal)
  // =========================
  function emojiOverdue(n) {
    if (n <= 0) return "🟢";
    if (n === 2) return "🟠";
    if (n === 3) return "🟣";
    if (n >= 4) return "🔴";
    // n==1 (não foi especificado): usa 🟠 para alertar leve
    return "🟠";
  }
  function emojiDailyLoad(n) {
    if (n <= 5) return "🆗";
    if (n <= 10) return "👏🏻";
    return "⭐";
  }

  function inSelectedDay(isoOrEmpty) {
    if (!isoOrEmpty) return false;
    const t = new Date(isoOrEmpty).getTime();
    if (!Number.isFinite(t)) return false;
    const ds = dayStart(selectedDate).getTime();
    const de = dayEnd(selectedDate).getTime();
    return t >= ds && t <= de;
  }

  // =========================
  // 15) TASK CARD (mantém estética atual; só acrescenta botões/fluxos)
  // =========================
  function makeTaskCard(deal, allowActions, context) {
    const showWarn = isAtencaoText(deal._urgTxt);
    const title = (showWarn ? "⚠️ " : "") + bestTitleFromText(deal._negocio || "");

    const prazoTxt = deal._prazo ? fmt(deal._prazo) : "Sem prazo";
    const tags = [];

    if (isUrgenteText(deal._urgTxt)) tags.push(`<span class="pill" style="padding:4px 8px;border-color:rgba(255,45,70,.30);background:rgba(255,45,70,.12)">URGENTE</span>`);
    if (deal._late) tags.push(`<span class="pill" style="padding:4px 8px;border-color:rgba(255,80,120,.40);background:rgba(255,80,120,.12)">ATRASADA</span>`);
    if (deal._tarefaTxt) tags.push(`<span class="pill" style="padding:4px 8px">Tipo: ${escHtml(trunc(deal._tarefaTxt, 26))}</span>`);
    if (deal._colabTxt) tags.push(`<span class="pill" style="padding:4px 8px">COLAB: ${escHtml(trunc(deal._colabTxt, 28))}</span>`);
    if (deal._etapaTxt) tags.push(`<span class="pill" style="padding:4px 8px">ETAPA: ${escHtml(trunc(deal._etapaTxt, 18))}</span>`);
    if (deal._urgTxt) tags.push(`<span class="pill" style="padding:4px 8px">${escHtml(trunc(deal._urgTxt, 22))}</span>`);

    // OBS piscante (chip)
    const hasObs = !!String(deal._obs || "").trim();
    const obsChip = hasObs
      ? `<span class="pill obsBlink" style="padding:4px 8px;border-color:rgba(245,158,11,.38);background:rgba(245,158,11,.14)" title="Tem OBS">OBS</span>`
      : ``;

    // Botões (não mexe no “visual” base; mantém compacto)
    const actions = allowActions ? `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
        <button class="btn" data-action="task_conclude" data-id="${deal.ID}" data-cat="${deal._categoryId}">Concluir</button>
        <button class="btn" data-action="task_edit_due" data-id="${deal.ID}" data-cat="${deal._categoryId}">Editar prazo</button>
        <button class="btn" data-action="task_edit_title" data-id="${deal.ID}" data-cat="${deal._categoryId}">Editar negócio</button>
        <button class="btn" data-action="task_transfer" data-id="${deal.ID}" data-cat="${deal._categoryId}">Trocar colaboradora</button>
        <button class="btn btnDanger" data-action="task_delete" data-id="${deal.ID}" data-cat="${deal._categoryId}">Excluir</button>
      </div>
    ` : ``;

    // Card “igual ao seu” em estrutura (barra + corpo) — não muda paleta
    return `
      <div class="eqd-card" style="--accent-rgb:${deal._accent};border-radius:16px;border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.82);overflow:hidden;box-shadow:0 8px 18px rgba(20,25,35,.08),0 10px 26px rgba(${deal._accent},.10);flex:0 0 auto;color:rgba(18,26,40,.92);">
        <div style="height:6px;background:rgb(${deal._accent});"></div>
        <div style="padding:9px 10px;display:flex;flex-direction:column;gap:6px;">
          <div style="font-size:13px;font-weight:950;line-height:1.15;">${escHtml(title)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
            ${obsChip}
            ${tags.join("")}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:2px;font-size:10.5px;color:rgba(18,26,40,.66);">
            <span>Prazo: <strong>${escHtml(prazoTxt)}</strong></span>
            <span>ID: <strong>${escHtml(deal.ID)}</strong></span>
          </div>
          ${actions}
        </div>
      </div>
    `;
  }

  // =========================
  // 16) MODAIS DE AÇÃO NO CARD
  // =========================
  function findDeal(categoryId, dealId) {
    const all = STATE.dealsByCategory.get(Number(categoryId)) || [];
    return all.find((d) => String(d.ID) === String(dealId)) || null;
  }

  async function modalConcludeFlow(categoryId, dealId) {
    const d = findDeal(categoryId, dealId);
    if (!d) throw new Error("Tarefa não encontrada.");

    openModal("Concluir", `
      <div class="warn" id="eqd-warn"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:12px;font-weight:950">${escHtml(bestTitleFromText(d.TITLE))}</div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
          <button class="btn" data-action="modalClose">Cancelar</button>
          <button class="btn btnPrimary" id="eqd-onlyDone">Só concluir</button>
          <button class="btn btnPrimary" id="eqd-doneResched">Concluir e reagendar</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("eqd-warn");

    document.getElementById("eqd-onlyDone").onclick = async () => {
      try {
        warn.style.display = "none"; warn.textContent = "";
        setBusy("Concluindo…");
        await actionSetDone(categoryId, dealId);
        closeModal();
        routeRender(true);
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally { clearBusy(); }
    };

    document.getElementById("eqd-doneResched").onclick = async () => {
      // opção: manter dados ou editar
      const keep = confirm("Reagendar mantendo os mesmos dados do negócio?\nOK = manter / Cancelar = editar antes.");
      if (keep) {
        try {
          warn.style.display = "none"; warn.textContent = "";
          setBusy("Concluindo e reagendando…");
          await actionSetDone(categoryId, dealId);

          // cria cópia com mesmo título, mesmo tipo/urg/etapa/colab/obs, novo prazo
          const next = prompt("Novo prazo (AAAA-MM-DD HH:MM) — use 24h:", "");
          if (!next) throw new Error("Prazo não informado.");
          const v = next.replace(" ", "T");
          const dt = new Date(v);
          if (Number.isNaN(dt.getTime())) throw new Error("Prazo inválido.");
          const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          const prazoIso = localInputToIsoWithOffset(local);

          await actionCreateDeal(categoryId, d._ownerUserId, d.TITLE || "FOLLOW-UP", prazoIso, {
            urgencia: d._urgId || "",
            tarefa: d._tarefaId || "",
            etapa: d._etapaId || "",
            colab: d._colabId || "",
            obs: d._obs || "",
          });

          closeModal();
          routeRender(true);
        } catch (e) {
          warn.style.display = "block";
          warn.textContent = "Falha:\n" + (e.message || e);
        } finally { clearBusy(); }
      } else {
        closeModal();
        // abre modal de nova tarefa pré-preenchido com dados atuais
        await modalNewTask(categoryId, d._ownerUserId, {
          title: d.TITLE || "",
          prazo: d._prazo || "",
          tarefa: d._tarefaId || "",
          urgencia: d._urgId || "",
          etapa: d._etapaId || "",
          colab: d._colabId || "",
          obs: d._obs || "",
        }, { afterCreate: async () => {
          // depois de criar, conclui o original
          await actionSetDone(categoryId, dealId);
        }});
      }
    };
  }

  async function modalEditDue(categoryId, dealId) {
    const d = findDeal(categoryId, dealId);
    if (!d) throw new Error("Tarefa não encontrada.");

    const dt = d._prazo ? new Date(d._prazo) : new Date();
    const localDefault = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    openModal("Editar prazo", `
      <div class="warn" id="eqd-warn"></div>
      <div style="display:grid;grid-template-columns:1fr;gap:10px">
        <div style="font-size:12px;font-weight:950">${escHtml(bestTitleFromText(d.TITLE))}</div>
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Novo prazo</div>
          <input id="eqd-edDue" type="datetime-local" value="${localDefault}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="btn" data-action="modalClose">Cancelar</button>
          <button class="btn btnPrimary" id="eqd-saveDue">Salvar</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("eqd-warn");
    document.getElementById("eqd-saveDue").onclick = async () => {
      try {
        warn.style.display = "none"; warn.textContent = "";
        setBusy("Salvando…");
        const v = String(document.getElementById("eqd-edDue").value || "").trim();
        const iso = v ? localInputToIsoWithOffset(v) : "";
        if (!iso) throw new Error("Prazo inválido.");
        const fields = {}; fields[UF_PRAZO] = iso;
        await actionUpdateDeal(dealId, fields);
        closeModal();
        routeRender(true);
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally { clearBusy(); }
    };
  }

  async function modalEditTitle(categoryId, dealId) {
    const d = findDeal(categoryId, dealId);
    if (!d) throw new Error("Tarefa não encontrada.");

    openModal("Editar negócio", `
      <div class="warn" id="eqd-warn"></div>
      <div style="display:grid;grid-template-columns:1fr;gap:10px">
        <div style="font-size:11px;font-weight:900">Novo nome do negócio</div>
        <input id="eqd-edTitle" value="${escHtml(String(d.TITLE || ""))}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="btn" data-action="modalClose">Cancelar</button>
          <button class="btn btnPrimary" id="eqd-saveTitle">Salvar</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("eqd-warn");
    document.getElementById("eqd-saveTitle").onclick = async () => {
      try {
        warn.style.display = "none"; warn.textContent = "";
        setBusy("Salvando…");
        const t = String(document.getElementById("eqd-edTitle").value || "").trim();
        if (!t) throw new Error("Nome inválido.");
        await actionUpdateDeal(dealId, { TITLE: bestTitleFromText(t) });
        closeModal();
        routeRender(true);
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally { clearBusy(); }
    };
  }

  async function modalTransfer(categoryId, dealId) {
    const d = findDeal(categoryId, dealId);
    if (!d) throw new Error("Tarefa não encontrada.");

    const pipe = PIPELINES.find((p) => Number(p.categoryId) === Number(categoryId));
    const users = pipe ? pipe.users : [];
    const opts = users.map((u) => `<option value="${u.id}" ${Number(u.id)===Number(d._ownerUserId)?"selected":""}>${u.name}</option>`).join("");

    openModal("Trocar colaboradora", `
      <div class="warn" id="eqd-warn"></div>
      <div style="display:grid;grid-template-columns:1fr;gap:10px">
        <div style="font-size:12px;font-weight:950">${escHtml(bestTitleFromText(d.TITLE))}</div>
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Transferir para</div>
          <select id="eqd-xferTo" class="select" style="width:100%;min-width:auto">${opts}</select>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="btn" data-action="modalClose">Cancelar</button>
          <button class="btn btnPrimary" id="eqd-doXfer">Transferir</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("eqd-warn");
    document.getElementById("eqd-doXfer").onclick = async () => {
      try {
        warn.style.display = "none"; warn.textContent = "";
        setBusy("Transferindo…");
        const toId = Number(document.getElementById("eqd-xferTo").value || 0);
        if (!toId) throw new Error("Usuária inválida.");
        await actionTransferToUser(categoryId, dealId, toId);
        closeModal();
        routeRender(true);
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally { clearBusy(); }
    };
  }

  async function modalDelete(categoryId, dealId) {
    const d = findDeal(categoryId, dealId);
    if (!d) throw new Error("Tarefa não encontrada.");

    openModal("Confirmar exclusão", `
      <div class="warn" style="display:block">Excluir este item?</div>
      <div style="font-size:12px;font-weight:950">${escHtml(bestTitleFromText(d.TITLE))}</div>
      <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
        <button class="btn" data-action="modalClose">Cancelar</button>
        <button class="btn btnDanger" id="eqd-confirmDel">Excluir</button>
      </div>
    `);
    document.getElementById("eqd-confirmDel").onclick = async () => {
      try {
        setBusy("Excluindo…");
        await actionDeleteDeal(dealId);
        closeModal();
        routeRender(true);
      } finally { clearBusy(); }
    };
  }

  // =========================
  // 17) NOVA TAREFA (com COLAB + OBS + recorrência)
  // =========================
  function buildOptions(map, placeholder) {
    const entries = Object.entries(map || {});
    entries.sort((a, b) => String(a[1]).localeCompare(String(b[1]), "pt-BR", { sensitivity: "base" }));
    return [
      `<option value="">${placeholder}</option>`,
      ...entries.map(([id, label]) => `<option value="${id}">${escHtml(String(label))}</option>`),
    ].join("");
  }

  function nextOccurrences(baseDate, recurrence, weeklyDow, monthlyDay) {
    // baseDate: Date
    const out = [];
    const d0 = new Date(baseDate.getTime());

    if (recurrence === "none") {
      out.push(new Date(d0.getTime()));
      return out;
    }

    if (recurrence === "daily") {
      // próximos REC_DAILY_DAYS dias úteis
      let d = new Date(d0.getTime());
      for (let i = 0; i < REC_DAILY_DAYS; i++) {
        const dow = d.getDay(); // 0=dom
        if (dow !== 0 && dow !== 6) out.push(new Date(d.getTime()));
        d.setDate(d.getDate() + 1);
      }
      return out;
    }

    if (recurrence === "weekly") {
      const targetDow = Number(weeklyDow);
      // alinha para o próximo targetDow (inclui hoje se bater)
      let d = new Date(d0.getTime());
      for (let w = 0; w < REC_WEEKLY_WEEKS; w++) {
        while (d.getDay() !== targetDow) d.setDate(d.getDate() + 1);
        out.push(new Date(d.getTime()));
        d.setDate(d.getDate() + 7);
      }
      return out;
    }

    if (recurrence === "monthly") {
      const day = Math.max(1, Math.min(28, Number(monthlyDay || 1))); // evita meses curtos
      const base = new Date(d0.getTime());
      for (let m = 0; m < REC_MONTHLY_MONTHS; m++) {
        const x = new Date(base.getFullYear(), base.getMonth() + m, day, base.getHours(), base.getMinutes(), 0, 0);
        out.push(x);
      }
      return out;
    }

    out.push(new Date(d0.getTime()));
    return out;
  }

  async function modalNewTask(categoryId, userId, preset, opts) {
    preset = preset || {};
    opts = opts || {};

    const dt = preset.prazo ? new Date(preset.prazo) : new Date(Date.now() + 60 * 60000);
    const localDefault = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const [urgMap, tipoMap, etapaMap, colabMap] = await Promise.all([
      enums(UF_URGENCIA),
      enums(UF_TAREFA),
      enums(UF_ETAPA),
      enums(UF_COLAB).catch(() => ({})),
    ]);

    openModal("Nova tarefa", `
      <div class="warn" id="eqd-warn"></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Nome do negócio</div>
          <input id="eqd-nwTitle" value="${escHtml(String(preset.title||""))}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" placeholder="Ex.: Retorno cliente / Enviar proposta..." />
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

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Colab</div>
          <select id="eqd-nwColab" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${buildOptions(colabMap, "— (opcional) —")}</select>
        </div>

        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Observações</div>
          <textarea id="eqd-nwObs" rows="3" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${escHtml(String(preset.obs||""))}</textarea>
        </div>

        <div style="grid-column:1 / -1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div>
            <div style="font-size:11px;font-weight:900;margin-bottom:6px">Recorrência</div>
            <select id="eqd-rec" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">
              <option value="none">Sem recorrência</option>
              <option value="daily">Diária (dias úteis)</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>
          <div>
            <div style="font-size:11px;font-weight:900;margin-bottom:6px">Dia da semana (semanal)</div>
            <select id="eqd-weekdow" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">
              <option value="1">Segunda</option>
              <option value="2">Terça</option>
              <option value="3">Quarta</option>
              <option value="4">Quinta</option>
              <option value="5">Sexta</option>
            </select>
          </div>
          <div>
            <div style="font-size:11px;font-weight:900;margin-bottom:6px">Dia do mês (mensal)</div>
            <input id="eqd-monthday" type="number" min="1" max="28" value="1" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
          </div>
        </div>

        <div style="grid-column:1 / -1;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px">
          <button class="btn" data-action="modalClose">Cancelar</button>
          <button class="btn btnPrimary" id="eqd-nwSave">Criar</button>
        </div>
      </div>
    `);

    // presets (se houver)
    const setIf = (id, v) => { try { if (v) document.getElementById(id).value = String(v); } catch(_){} };
    setIf("eqd-nwTipo", preset.tarefa);
    setIf("eqd-nwUrg", preset.urgencia);
    setIf("eqd-nwEtapa", preset.etapa);
    setIf("eqd-nwColab", preset.colab);

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
        const colab = String(document.getElementById("eqd-nwColab").value || "").trim();
        const obs = String(document.getElementById("eqd-nwObs").value || "").trim();

        const rec = String(document.getElementById("eqd-rec").value || "none");
        const dow = Number(document.getElementById("eqd-weekdow").value || 1);
        const mday = Number(document.getElementById("eqd-monthday").value || 1);

        const baseDt = new Date(prazoIso || new Date().toISOString());
        const dates = nextOccurrences(baseDt, rec, dow, mday);

        // cria em lote (sequencial para não matar Bitrix)
        for (let i = 0; i < dates.length; i++) {
          const d = dates[i];
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          const iso = localInputToIsoWithOffset(local);

          await actionCreateDeal(categoryId, userId, title, iso, {
            tarefa: tipo,
            urgencia: urg,
            etapa: etapa,
            colab: colab,
            obs: obs,
          });
        }

        if (opts.afterCreate) {
          await opts.afterCreate();
        }

        closeModal();
        routeRender(true);
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha ao criar:\n" + (e.message || e);
      } finally {
        clearBusy();
      }
    };
  }

  // =========================
  // 18) FOLLOW-UP (modal + lote + lista + busca)
  // =========================
  async function modalFollowUp(categoryId, userId) {
    const followTypeId = await enumIdByLabel(UF_TAREFA, "FOLLOW-UP");
    const etapaId = await enumIdByLabel(UF_ETAPA, "AGUARDANDO");
    const colabNo = await enumIdByLabel(UF_COLAB, "NÃO"); // se existir; senão fica vazio

    const dt = new Date(Date.now() + 60 * 60000);
    const localDefault = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    openModal("FOLLOW-UP", `
      <div class="warn" id="eqd-warn"></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Nomes (um por linha) — cria em lote</div>
          <textarea id="eqd-fuNames" rows="4" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" placeholder="João&#10;Maria&#10;Carlos"></textarea>
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Prazo</div>
          <input id="eqd-fuPrazo" type="datetime-local" value="${localDefault}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
        </div>

        <div style="display:flex;align-items:flex-end;justify-content:flex-end;gap:10px">
          <button class="btn" data-action="modalClose">Cancelar</button>
          <button class="btn btnPrimary" id="eqd-fuCreate">Criar FOLLOW-UP(s)</button>
        </div>

        <div style="grid-column:1 / -1;margin-top:6px">
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between">
            <div style="font-size:11px;font-weight:900">FOLLOW-UPs agendados (busca por palavra)</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              <input id="eqd-fuSearch" class="searchInput" style="width:min(360px,60vw)" placeholder="buscar..." />
              <button class="btn" id="eqd-fuRefresh">Atualizar</button>
            </div>
          </div>
          <div id="eqd-fuList" style="margin-top:10px;display:flex;flex-direction:column;gap:8px"></div>
        </div>
      </div>
    `);

    const warn = document.getElementById("eqd-warn");

    async function renderFuList() {
      const kw = norm(String(document.getElementById("eqd-fuSearch").value || "").trim());
      const all = dealsForUser(categoryId, userId, false);
      const hits = all.filter((d) => norm(d._tarefaTxt).includes(norm("FOLLOW-UP")) || norm(d.TITLE).includes(norm("FOLLOW-UP")));
      const filtered = kw ? hits.filter((d) => norm((d.TITLE||"") + " " + (d._obs||"")).includes(kw)) : hits;

      const html = filtered.slice(0, 200).map((d) => {
        const prazoTxt = d._prazo ? fmt(d._prazo) : "Sem prazo";
        return `
          <div style="border:1px solid rgba(30,40,70,.12);border-radius:16px;background:rgba(255,255,255,.75);padding:10px;display:flex;flex-direction:column;gap:6px">
            <div style="font-size:13px;font-weight:950">${escHtml(bestTitleFromText(d.TITLE))}</div>
            <div style="font-size:11px;font-weight:900;color:rgba(18,26,40,.70);display:flex;gap:10px;flex-wrap:wrap">
              <span>Prazo: <strong>${escHtml(prazoTxt)}</strong></span>
              <span>ID: <strong>${escHtml(d.ID)}</strong></span>
            </div>
          </div>
        `;
      }).join("");

      document.getElementById("eqd-fuList").innerHTML = html || `<div class="empty">Sem FOLLOW-UPs</div>`;
    }

    document.getElementById("eqd-fuRefresh").onclick = async () => {
      try {
        setBusy("Atualizando…");
        await loadDealsByCategory(categoryId);
        await renderFuList();
      } finally { clearBusy(); }
    };

    document.getElementById("eqd-fuSearch").onkeydown = (e) => {
      if (e.key === "Enter") { e.preventDefault(); renderFuList(); }
    };

    document.getElementById("eqd-fuCreate").onclick = async () => {
      try {
        warn.style.display = "none"; warn.textContent = "";
        setBusy("Criando…");

        const namesRaw = String(document.getElementById("eqd-fuNames").value || "").trim();
        const lines = namesRaw.split("\n").map((x) => x.trim()).filter(Boolean);
        if (!lines.length) throw new Error("Informe pelo menos 1 nome (1 por linha).");

        const prazoLocal = String(document.getElementById("eqd-fuPrazo").value || "").trim();
        const prazoIso = prazoLocal ? localInputToIsoWithOffset(prazoLocal) : "";
        if (!prazoIso) throw new Error("Prazo inválido.");

        // ocultos: urg sem urgência (deixa vazio), tipo follow-up, etapa aguardando, colab NÃO, obs vazio
        for (const nm of lines) {
          const title = `FOLLOW-UP de ${nm}`;
          await actionCreateDeal(categoryId, userId, title, prazoIso, {
            tarefa: followTypeId || "",   // existe no seu campo
            urgencia: "",                 // sem urgência
            etapa: etapaId || "",
            colab: colabNo || "",
            obs: "",
          });
        }

        document.getElementById("eqd-fuNames").value = "";
        await loadDealsByCategory(categoryId);
        await renderFuList();
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally { clearBusy(); }
    };

    // primeira carga
    await renderFuList();
  }

  // =========================
  // 19) CONCLUÍDAS (modal com busca por palavra e filtro de dia)
  // =========================
  async function modalConcluidas(categoryId, userId) {
    openModal("Concluídas", `
      <div class="warn" id="eqd-warn"></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between">
        <input id="eqd-doneKw" class="searchInput" style="width:min(360px,60vw)" placeholder="buscar por palavra..." />
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <div style="font-size:11px;font-weight:900">Dia</div>
          <input id="eqd-doneDay" type="date" style="padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
          <button class="btn" id="eqd-doneFilter">Filtrar</button>
          <button class="btn" id="eqd-doneRefresh">Atualizar</button>
        </div>
      </div>
      <div id="eqd-doneList" style="margin-top:10px;display:flex;flex-direction:column;gap:8px"></div>
    `);

    async function renderDone() {
      const kw = norm(String(document.getElementById("eqd-doneKw").value || "").trim());
      const dayv = String(document.getElementById("eqd-doneDay").value || "").trim();
      const dayD = dayv ? new Date(dayv + "T00:00:00") : null;
      const ds = dayD ? dayStart(dayD).getTime() : null;
      const de = dayD ? dayEnd(dayD).getTime() : null;

      const doneId = getDoneStageId(categoryId);
      const all = STATE.dealsByCategory.get(Number(categoryId)) || [];
      const list = all.filter((d) => {
        if (d._ownerUserId !== Number(userId)) return false;
        if (!doneId) return false;
        if (String(d.STAGE_ID) !== String(doneId)) return false;

        if (dayD) {
          const t = d._prazo ? new Date(d._prazo).getTime() : NaN;
          if (!Number.isFinite(t)) return false;
          if (t < ds || t > de) return false;
        }
        if (kw) {
          const blob = norm((d.TITLE||"") + " " + (d._obs||""));
          if (!blob.includes(kw)) return false;
        }
        return true;
      });

      const html = list.slice(0, 250).map((d) => {
        const prazoTxt = d._prazo ? fmt(d._prazo) : "—";
        return `
          <div style="border:1px solid rgba(30,40,70,.12);border-radius:16px;background:rgba(255,255,255,.75);padding:10px;display:flex;flex-direction:column;gap:6px">
            <div style="font-size:13px;font-weight:950">${escHtml(bestTitleFromText(d.TITLE))}</div>
            <div style="font-size:11px;font-weight:900;color:rgba(18,26,40,.70);display:flex;gap:10px;flex-wrap:wrap">
              <span>Prazo: <strong>${escHtml(prazoTxt)}</strong></span>
              <span>ID: <strong>${escHtml(d.ID)}</strong></span>
            </div>
          </div>
        `;
      }).join("");

      document.getElementById("eqd-doneList").innerHTML = html || `<div class="empty">Sem concluídas para este filtro.</div>`;
    }

    document.getElementById("eqd-doneFilter").onclick = renderDone;
    document.getElementById("eqd-doneKw").onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); renderDone(); } };
    document.getElementById("eqd-doneRefresh").onclick = async () => {
      try { setBusy("Atualizando…"); await loadDealsByCategory(categoryId); await renderDone(); }
      finally { clearBusy(); }
    };

    await renderDone();
  }

  // =========================
  // 20) VIEW RENDERERS
  // =========================
  function makeUserCard(pipeline, user, metrics) {
    const team = pipeline.teams[user.team] || { greek: "•", label: "" };
    const pic = STATE.userPhotoById.get(Number(user.id)) || "";
    const photo = pic
      ? `<img class="uPic" src="${pic}" referrerpolicy="no-referrer" onerror="try{this.onerror=null;this.style.opacity=.2}catch(e){}">`
      : `<div class="uPic"></div>`;

    const overdueEmoji = emojiOverdue(metrics.overdue);
    const loadEmoji = emojiDailyLoad(metrics.todayTotal);

    return `
      <div class="uCard" data-action="openUser" data-cat="${pipeline.categoryId}" data-user="${user.id}">
        <div class="uTop">
          <div style="display:flex;gap:12px;align-items:center">
            ${photo}
            <div style="display:flex;flex-direction:column;gap:4px;min-width:0">
              <div class="uName">${team.greek} ${escHtml(user.name)}</div>
              <div class="uSub">${escHtml(team.label)}</div>
            </div>
          </div>
          <div style="font-size:18px;font-weight:950">${overdueEmoji}</div>
        </div>

        <div class="uRow">
          <span class="uBadge">Dia: <strong>${metrics.todayTotal}</strong> ${loadEmoji}</span>
          <span class="uBadge">Concluídas: <strong>${metrics.doneTotal}</strong></span>
          <span class="uBadge">Atrasadas: <strong>${metrics.overdue}</strong></span>
        </div>

        <div class="uRow" style="justify-content:space-between">
          <span class="uSub">${metrics.hasToday ? "Tem tarefas no dia ✅" : "Sem tarefas no dia"}</span>
          <span class="uSub">ID: ${user.id}</span>
        </div>
      </div>
    `;
  }

  function computeUserMetrics(categoryId, userId) {
    const open = dealsForUser(categoryId, userId, false);
    const done = dealsForUser(categoryId, userId, true).filter((d) => {
      const doneId = getDoneStageId(categoryId);
      return doneId && String(d.STAGE_ID) === String(doneId);
    });

    const todayOpen = open.filter((d) => inSelectedDay(d._prazo));
    const overdue = open.filter((d) => d._late).length;
    const hasToday = todayOpen.length > 0;

    return {
      todayTotal: todayOpen.length,
      doneTotal: done.length,
      overdue,
      hasToday,
    };
  }

  function renderMain() {
    // principal: grid 4 colunas com 17 users
    const blocks = [];
    for (const p of PIPELINES) {
      for (const u of p.users) {
        const m = computeUserMetrics(p.categoryId, u.id);
        blocks.push(makeUserCard(p, u, m));
      }
    }

    el.view.innerHTML = `
      <div class="uGrid">${blocks.join("")}</div>
    `;

    // timers
    TIMER_MAIN = setInterval(async () => {
      // leve: recarrega deals (cache no Worker amortiza)
      try {
        await refreshAllCategories();
        renderMain();
        syncNow();
      } catch (_) {
        // silencioso
      }
    }, REFRESH_MAIN_MS);
  }

  function renderUserPanel(categoryId, userId) {
    const pipe = PIPELINES.find((p) => Number(p.categoryId) === Number(categoryId));
    const u = pipe ? pipe.users.find((x) => Number(x.id) === Number(userId)) : null;
    if (!pipe || !u) {
      el.view.innerHTML = `<div style="padding:12px" class="empty">Usuária não encontrada.</div>`;
      return;
    }
    const team = pipe.teams[u.team] || { greek: "•", label: "" };

    const pic = STATE.userPhotoById.get(Number(u.id)) || "";
    const photo = pic
      ? `<img class="colPic" style="width:114px;height:114px" src="${pic}" referrerpolicy="no-referrer">`
      : `<div class="colPic" style="width:114px;height:114px"></div>`;

    // 3 colunas sem categorização: distribui por ordem em “round-robin”
    const open = sortDealsForDisplay(dealsForUser(categoryId, userId, false));
    const cols = [[], [], []];
    for (let i = 0; i < open.length; i++) cols[i % 3].push(open[i]);

    const colHtml = cols.map((arr, idx) => {
      const list = arr.length
        ? arr.map((d) => makeTaskCard(d, true, { categoryId, userId })).join("")
        : `<div class="empty">Sem itens</div>`;
      return `
        <div class="colWrap">
          <div class="colHead">
            <div class="colTitle">
              <div class="colName">Coluna ${idx + 1}</div>
            </div>
            <div class="colMeta">${arr.length} itens</div>
          </div>
          <div class="colBody">${list}</div>
        </div>
      `;
    }).join("");

    // busca só do user
    el.view.innerHTML = `
      <div style="padding:12px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between">
        <div style="display:flex;gap:12px;align-items:center">
          ${photo}
          <div style="display:flex;flex-direction:column;gap:4px">
            <div style="font-weight:950;font-size:18px">${team.greek} ${escHtml(u.name)}</div>
            <div style="font-size:12px;font-weight:900;color:var(--muted)">${escHtml(team.label)} • ${escHtml(pipe.name)}</div>
          </div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:flex-end">
          <button class="btn" data-action="goMain">Voltar</button>

          <input class="searchInput" id="eqd-userSearch" style="width:min(320px,60vw)" placeholder="Buscar só desta usuária..." />
          <button class="btn btnPrimary" data-action="userSearch" data-cat="${categoryId}" data-user="${userId}">Buscar</button>

          <button class="btn" data-action="newTask" data-cat="${categoryId}" data-user="${userId}">+ Nova tarefa</button>
          <button class="btn" data-action="followUp" data-cat="${categoryId}" data-user="${userId}">Follow-up</button>
          <button class="btn" data-action="doneList" data-cat="${categoryId}" data-user="${userId}">✓ Concluídas</button>
        </div>
      </div>

      <div class="columns" style="grid-template-columns:repeat(3, minmax(280px, 1fr));">
        ${colHtml}
      </div>
    `;

    // timer user (tempo real)
    TIMER_USER = setInterval(async () => {
      try {
        await loadDealsByCategory(categoryId);
        renderUserPanel(categoryId, userId);
        syncNow();
      } catch (_) {}
    }, REFRESH_USER_MS);
  }

  function renderMultiPanel(categoryId, userIds) {
    const pipe = PIPELINES.find((p) => Number(p.categoryId) === Number(categoryId));
    if (!pipe) {
      el.view.innerHTML = `<div style="padding:12px" class="empty">Pipeline inválida.</div>`;
      return;
    }
    const selected = (userIds || []).slice(0, MULTI_MAX).map(Number).filter(Boolean);
    const users = selected.map((id) => pipe.users.find((u) => Number(u.id) === id)).filter(Boolean);

    const cols = users.map((u) => {
      const team = pipe.teams[u.team] || { greek: "•", label: "" };
      const pic = STATE.userPhotoById.get(Number(u.id)) || "";
      const photo = pic
        ? `<img class="colPic" src="${pic}" referrerpolicy="no-referrer">`
        : `<div class="colPic"></div>`;

      const open = sortDealsForDisplay(dealsForUser(categoryId, u.id, false));
      const list = open.length ? open.map((d) => makeTaskCard(d, true, {})).join("") : `<div class="empty">Sem itens</div>`;

      return `
        <div class="colWrap">
          <div class="colHead">
            <div class="colTitle">
              ${photo}
              <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
                <div class="colName">${team.greek} ${escHtml(u.name)}</div>
                <div class="colMeta">${escHtml(team.label)}</div>
              </div>
            </div>
            <div class="colMeta">${open.length} itens</div>
          </div>
          <div class="colBody">${list}</div>
        </div>
      `;
    }).join("");

    el.view.innerHTML = `
      <div style="padding:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between">
        <div style="font-weight:950">Painel Multi Seleção • ${users.length} usuária(s)</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn" data-action="goMain">Voltar</button>
        </div>
      </div>
      <div class="columns" style="grid-template-columns:repeat(${Math.max(1, users.length)}, minmax(280px, 1fr));">
        ${cols || `<div class="empty">Selecione até ${MULTI_MAX} usuárias.</div>`}
      </div>
    `;

    TIMER_USER = setInterval(async () => {
      try {
        await loadDealsByCategory(categoryId);
        renderMultiPanel(categoryId, selected);
        syncNow();
      } catch (_) {}
    }, REFRESH_USER_MS);
  }

  // =========================
  // 21) MULTI SELEÇÃO (modal admin)
  // =========================
  function openMultiSelector() {
    const pin = promptPin("Senha de administradora:");
    if (!isAdminPin(pin)) {
      alert("Senha inválida.");
      return;
    }

    // seleciona pipeline e usuários
    const pipeOpts = PIPELINES.map((p) => `<option value="${p.categoryId}">${escHtml(p.name)}</option>`).join("");
    openModal("Painel Multi Seleção", `
      <div class="warn" id="eqd-warn"></div>
      <div style="display:grid;grid-template-columns:1fr;gap:10px">
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">Pipeline</div>
          <select id="eqd-multiPipe" class="select" style="width:100%;min-width:auto">${pipeOpts}</select>
        </div>
        <div id="eqd-multiUsers"></div>

        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="btn" data-action="modalClose">Cancelar</button>
          <button class="btn btnPrimary" id="eqd-openMulti">Abrir painel</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("eqd-warn");
    const box = document.getElementById("eqd-multiUsers");

    function renderUsersList(catId) {
      const pipe = PIPELINES.find((p) => Number(p.categoryId) === Number(catId));
      if (!pipe) { box.innerHTML = `<div class="empty">Pipeline inválida</div>`; return; }

      const items = pipe.users.map((u) => {
        const t = pipe.teams[u.team] || { greek: "•" };
        return `
          <label style="display:flex;gap:10px;align-items:center;padding:8px;border:1px solid rgba(30,40,70,.12);border-radius:12px;background:rgba(255,255,255,.65)">
            <input type="checkbox" value="${u.id}">
            <div style="font-weight:950">${t.greek} ${escHtml(u.name)}</div>
          </label>
        `;
      }).join("");

      box.innerHTML = `
        <div style="font-size:11px;font-weight:900;margin-bottom:6px">Selecione até ${MULTI_MAX} usuárias</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${items}</div>
      `;
    }

    const selPipe = document.getElementById("eqd-multiPipe");
    renderUsersList(selPipe.value);
    selPipe.onchange = () => renderUsersList(selPipe.value);

    document.getElementById("eqd-openMulti").onclick = () => {
      try {
        warn.style.display = "none"; warn.textContent = "";
        const catId = Number(document.getElementById("eqd-multiPipe").value || 0);
        const checked = Array.from(box.querySelectorAll('input[type="checkbox"]:checked')).map((x) => Number(x.value));
        if (!checked.length) throw new Error("Selecione pelo menos 1 usuária.");
        if (checked.length > MULTI_MAX) throw new Error(`No máximo ${MULTI_MAX} usuárias.`);

        closeModal();
        setRoute({ kind: "multi", categoryId: catId, multiIds: checked });
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      }
    };
  }

  // =========================
  // 22) EVENT DELEGATION
  // =========================
  document.addEventListener("click", async (e) => {
    const a = e.target.closest("[data-action]");
    if (!a) return;

    const act = a.getAttribute("data-action");
    const cat = Number(a.getAttribute("data-cat") || 0);
    const uid = Number(a.getAttribute("data-user") || 0);
    const id = a.getAttribute("data-id");

    if (act === "modalClose") { closeModal(); return; }
    if (act === "goMain") { setRoute({ kind: "main" }); return; }

    if (act === "openUser") {
      const catId = Number(a.getAttribute("data-cat") || 0);
      const userId = Number(a.getAttribute("data-user") || 0);

      const pin = promptPin(`Senha da usuária (${userId}0):`);
      if (!checkUserPin(userId, pin) && !isAdminPin(pin)) {
        alert("Senha inválida.");
        return;
      }
      setRoute({ kind: "user", categoryId: catId, userId: userId });
      return;
    }

    if (act === "newTask") { await modalNewTask(cat, uid); return; }
    if (act === "followUp") { await modalFollowUp(cat, uid); return; }
    if (act === "doneList") { await modalConcluidas(cat, uid); return; }

    if (act === "userSearch") {
      const kw = String(document.getElementById("eqd-userSearch").value || "").trim();
      if (!kw) { openModal("Busca", `<div class="empty">Digite uma palavra.</div>`); return; }
      const kwN = norm(kw);
      const open = dealsForUser(cat, uid, false);
      const hits = open.filter((d) => norm((d.TITLE||"") + " " + (d._obs||"")).includes(kwN));
      const html = hits.length ? hits.map((d) => makeTaskCard(d, false, {})).join("") : `<div class="empty">Sem resultados</div>`;
      openModal(`Busca da usuária • ${hits.length}`, html);
      return;
    }

    // TASK ACTIONS
    if (act === "task_conclude") { await modalConcludeFlow(cat, id); return; }
    if (act === "task_edit_due") { await modalEditDue(cat, id); return; }
    if (act === "task_edit_title") { await modalEditTitle(cat, id); return; }
    if (act === "task_transfer") { await modalTransfer(cat, id); return; }
    if (act === "task_delete") { await modalDelete(cat, id); return; }
  });

  // =========================
  // 23) TOPBAR BUTTONS
  // =========================
  el.today.addEventListener("click", () => { selectedDate = new Date(); routeRender(true); });
  el.calendar.addEventListener("click", openCalendar);
  el.multi.addEventListener("click", openMultiSelector);
  el.refresh.addEventListener("click", () => routeRender(true));

  // =========================
  // 24) REFRESH / RENDER LOOP
  // =========================
  function syncNow() {
    const now = new Date();
    el.now.textContent = `${fmtDateOnly(now)} • ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    el.meta.textContent = STATE.lastOkAt ? `Atualizado em ${fmt(STATE.lastOkAt)}` : "Carregando…";
  }
  setInterval(syncNow, 1000);

  async function refreshAllCategories() {
    // carrega stages + users 1x por categoria (front), mas Worker deve cachear pesado
    for (const p of PIPELINES) {
      await loadStagesForCategory(p.categoryId);
      for (const u of p.users) await ensureUserProfile(u.id, u.name);
      await loadDealsByCategory(p.categoryId);
    }
  }

  async function routeRender(force) {
    try {
      setSoftStatus("Atualizando…");
      if (force) {
        await refreshAllCategories();
      }
      buildSearchScope();
      syncNow();

      if (ROUTE.kind === "main") renderMain();
      else if (ROUTE.kind === "user") renderUserPanel(ROUTE.categoryId, ROUTE.userId);
      else if (ROUTE.kind === "multi") renderMultiPanel(ROUTE.categoryId, ROUTE.multiIds);

      setSoftStatus("JS: ok");
    } catch (e) {
      // estabilidade: não trava. mantém UI e tenta novamente.
      setSoftStatus("Sem conexão / limite do Bitrix — tentando novamente…");
      setTimeout(() => routeRender(true).catch(() => {}), 2500);
    } finally {
      clearBusy();
    }
  }

  // =========================
  // 25) INIT
  // =========================
  (async () => {
    setRoute({ kind: "main" });
  })().catch((e) => {
    el.view.innerHTML = `<div style="padding:12px" class="empty">Falha ao iniciar: ${escHtml(String(e.message || e))}</div>`;
  });

})();
