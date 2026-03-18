/* painel_cgd_revisado.js
   Substitua o <script> atual por este arquivo JS.
   Este JS reaproveita o HTML existente, injeta o novo visual e cria a barra inferior.
*/

(function(){
  'use strict';

  /* ================= CONFIG ================= */
  const PROXY_URL = "https://muddy-king-6632.cgdseguros.workers.dev/?url=";
  const BITRIX_WEBHOOK_BASE = "https://b24-6iyx5y.bitrix24.com.br/rest/1/w84d3lpz7hwutyeb/";

  const OPERATOR_FIELD = "UF_CRM_1731877451385";
  const CLOSEDATE_FIELD = "UF_CRM_1731899421651";
  const CATEGORY_ID_MAIN = 0;

  const ADMIN_PASS = "4627";
  const BLOCKED_USER_IDS = new Set([843, 269]);
  const LOAD_CONCURRENCY = 4;

  const BONIF_FIELD = "UF_CRM_1771005318";
  const CFG_COMP_FIELD     = "UF_CRM_1771006552";
  const CFG_SORTEIO_FIELD  = "UF_CRM_1771006607";
  const CFG_METAS_FIELD    = "UF_CRM_1771006649";
  const CFG_ESTORNOS_FIELD = "UF_CRM_1771006676";

  const CFG_TITLE_PREFIX = "PAINEL|CONFIG|";
  const CFG_STAGE_NAME   = "PAINEL • CONFIG";
  const CFG_CATEGORY_ID  = 0;

  const STAGE_ORDER = [
    "AGUARDANDO DOCUMENTOS",
    "EM DIGITACAO",
    "ENVIADO PARA ASSINATURA",
    "AGUARDANDO ENTREVISTA MEDICA",
    "EM ANALISE",
    "PENDENCIA",
    "AGUARDANDO PAGAMENTO",
  ];

  const MAIN_SELLERS = [
    { label: "ALINE",    userId: 15 },
    { label: "ADRIANA",  userId: 19 },
    { label: "ANDREYNA", userId: 17 },
    { label: "MARIANA",  userId: null, matchFullName: "MARIANA BARTHOLO" },
    { label: "JOSIANE",  userId: 811 },
    { label: "BRUNA LUISA", userId: 3081 },
  ];

  const OTHER_SELLERS = [
    { label: "KETHELEN",  userId: null, matchFullName: "KETHELEN PIRES" },
    { label: "USER 841",  userId: 841  },
    { label: "USER 813",  userId: 813  },
    { label: "USER 815",  userId: 815  },
    { label: "USER 3079", userId: 3079 },
    { label: "USER 3083", userId: 3083 },
    { label: "USER 3085", userId: 3085 },
    { label: "USER 3387", userId: 3387 },
    { label: "USER 3389", userId: 3389 },
  ];

  const SEARCH_ONLY_USERS = [
    { userId: 1, label: "USER 1" }
  ];

  const FOOTER_USERS = [27, 1, 15];

  /* ================= STYLE OVERRIDE ================= */
  function injectProfessionalUI(){
    const css = `
      :root{
        --topPad: 0px !important;
        --pageA:#f4f5f7 !important;
        --pageB:#eceff3 !important;
        --hdr:#000 !important;
        --hdrBorder: rgba(255,255,255,.10) !important;
        --text:#1b2230 !important;
        --muted:#657186 !important;
        --card: rgba(255,255,255,.98) !important;
        --card2: rgba(255,255,255,.96) !important;
        --cardBorder: rgba(18,24,38,.10) !important;
        --shadow: 0 12px 28px rgba(18,24,38,.10) !important;
        --cardText: #172033 !important;
        --cardMuted: rgba(23,32,51,.78) !important;
        --radius: 18px !important;
        --pad: 16px !important;
        --gap: 14px !important;
        --avatar: 58px !important;
        --zoom-big: .88 !important;
        --zoom-small: .80 !important;
      }
      body.theme-blue{ }
      html, body{margin:0 !important;height:100% !important;overflow:hidden !important;}
      #app{
        padding-top:0 !important;
        background:
          radial-gradient(1000px 460px at 15% 0%, rgba(255,255,255,.42), transparent 60%),
          radial-gradient(900px 420px at 85% 10%, rgba(120,170,255,.12), transparent 60%),
          linear-gradient(180deg, #f4f5f7, #eceff3) !important;
      }
      header{
        padding:8px 12px !important;
        min-height: 68px !important;
        background:#000 !important;
        border-bottom:1px solid rgba(255,255,255,.10) !important;
        backdrop-filter:none !important;
        align-items:center !important;
        gap:8px !important;
      }
      .brand{padding-top:0 !important; gap:10px !important;}
      .logo{
        width:38px !important; height:38px !important; border-radius:10px !important;
        border:1px solid rgba(255,255,255,.12) !important;
        background:rgba(255,255,255,.06) !important;
      }
      h1{font-size:20px !important; color:#fff !important; line-height:1.04 !important;}
      .sub{color:rgba(255,255,255,.72) !important;}
      .right{gap:6px !important;}
      .rightRow{gap:8px !important;}
      .pill{
        min-height:36px !important;
        padding:8px 10px !important;
        background:rgba(255,255,255,.07) !important;
        color:rgba(255,255,255,.86) !important;
        border:1px solid rgba(255,255,255,.14) !important;
        font-size:13px !important;
        font-weight:800 !important;
      }
      .searchWrap{max-width:440px !important;}
      .search{
        min-height:36px !important;
        padding:8px 10px !important;
        border-radius:12px !important;
        background:rgba(255,255,255,.08) !important;
        border:1px solid rgba(255,255,255,.16) !important;
        color:#fff !important;
      }
      .search svg{color:#fff !important;}
      .search path{stroke:currentColor !important;}
      .search input{
        color:#fff !important;
        font-size:13px !important;
        font-weight:700 !important;
      }
      .search input::placeholder{color:rgba(255,255,255,.62) !important;}
      .btn{
        min-height:36px !important;
        padding:8px 12px !important;
        border-radius:12px !important;
        background:#fff !important;
        color:#000 !important;
        border:1px solid rgba(255,255,255,.18) !important;
        font-size:12px !important;
        font-weight:900 !important;
        letter-spacing:.2px !important;
      }
      #themeBlue{display:none !important;}
      main{
        padding:12px 12px 10px !important;
        gap:12px !important;
      }
      .sorteioBar{
        padding:10px 12px !important;
        border-radius:16px !important;
        background:rgba(255,255,255,.92) !important;
        border:1px solid rgba(0,0,0,.08) !important;
        box-shadow:0 10px 22px rgba(0,0,0,.06) !important;
      }
      .sBadge{
        font-size:13px !important;
        background:rgba(0,0,0,.05) !important;
      }
      .gridTop{grid-template-columns: repeat(4, minmax(310px, 1fr)) !important;}
      @media (max-width:1600px){ .gridTop{grid-template-columns: repeat(3, minmax(310px, 1fr)) !important;} }
      @media (max-width:1150px){ .gridTop{grid-template-columns: repeat(2, minmax(310px, 1fr)) !important;} }
      @media (max-width:760px){ .gridTop{grid-template-columns: 1fr !important;} }
      .gridRest{grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;}
      .card.big{zoom:.88 !important;}
      .card.small{zoom:.80 !important;}
      .head{padding:16px !important;}
      .titleRow{margin-bottom:12px !important;}
      .colTitle{gap:12px !important;}
      .avatarWrap{
        position:relative !important;
        width:58px !important; height:58px !important;
        flex:0 0 auto !important;
      }
      .avatar{
        width:58px !important; height:58px !important;
        border-radius:50% !important;
      }
      .rankBadge{
        position:absolute;
        right:-6px; top:-6px;
        min-width:28px; height:28px;
        padding:0 8px;
        border-radius:999px;
        background:#000;
        color:#fff;
        border:2px solid #fff;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:13px;
        font-weight:950;
        box-shadow:0 8px 18px rgba(0,0,0,.20);
      }
      .name{
        font-size:19px !important;
        font-weight:950 !important;
        max-width:290px !important;
        line-height:1.06 !important;
      }
      .tag{
        padding:7px 10px !important;
        font-size:12px !important;
        font-weight:800 !important;
      }
      .stats{gap:10px !important;}
      .stat{
        min-height:60px !important;
        padding:10px 12px !important;
        border-radius:13px !important;
      }
      .stat b{font-size:13px !important; margin-bottom:4px !important;}
      .stat span{font-size:16px !important; font-weight:800 !important;}
      .btnRow{margin-top:12px !important;}
      .miniBtn{
        background:#000 !important;
        color:#fff !important;
        padding:9px 12px !important;
        border-radius:12px !important;
        font-size:12px !important;
        font-weight:900 !important;
      }
      .footerZero{
        padding:10px 12px !important;
        border-radius:16px !important;
        background:rgba(255,255,255,.86) !important;
      }
      .hint{font-size:13px !important; font-weight:700 !important; gap:14px !important;}
      .footerBar{
        flex:0 0 auto;
        background:#000;
        color:#fff;
        border-top:1px solid rgba(255,255,255,.08);
        padding:10px 14px;
        min-height:78px;
        display:grid;
        grid-template-columns:1.2fr .9fr 1.9fr;
        gap:16px;
        align-items:center;
        font-size:13px;
      }
      .fbLeft,.fbCenter,.fbRight{display:flex; align-items:center; min-width:0;}
      .fbLeft{gap:10px;}
      .fbCenter{justify-content:center; text-align:center; font-weight:900; letter-spacing:.3px;}
      .fbRight{justify-content:flex-end; gap:18px; flex-wrap:wrap;}
      .fbPhotos{display:flex; align-items:center;}
      .fbPhoto{
        width:34px;height:34px;border-radius:50%;overflow:hidden;
        border:2px solid rgba(255,255,255,.22);
        background:rgba(255,255,255,.10);
        margin-right:-6px;
        display:flex;align-items:center;justify-content:center;
        font-size:11px;font-weight:900;color:#fff;
      }
      .fbPhoto img{width:100%;height:100%;object-fit:cover;display:block;}
      .fbAddr,.fbBlock{display:flex; flex-direction:column; gap:2px; min-width:0;}
      .fbAddr b,.fbBlock b{font-size:12px; color:#fff;}
      .fbAddr span,.fbBlock span{font-size:12px; color:rgba(255,255,255,.78);}
      @media (max-width:1200px){
        .footerBar{grid-template-columns:1fr; gap:10px; text-align:center;}
        .fbLeft,.fbCenter,.fbRight{justify-content:center;}
      }
    `;

    const style = document.createElement('style');
    style.id = 'cgd-professional-ui';
    style.textContent = css;
    document.head.appendChild(style);

    document.body.classList.remove('theme-blue', 'theme-light');
    document.body.classList.add('theme-dark');

    const blueBtn = document.getElementById('themeBlue');
    if (blueBtn) blueBtn.remove();
  }

  /* ================= LAYOUT EXTRA ================= */
  function ensureFooterBar(){
    if (document.querySelector('.footerBar')) return;
    const app = document.getElementById('app');
    if (!app) return;

    const footer = document.createElement('div');
    footer.className = 'footerBar';
    footer.innerHTML = `
      <div class="fbLeft">
        <div class="fbPhotos" id="footerUserPhotos"></div>
        <div class="fbAddr">
          <b>Endereço</b>
          <span>Av Ayrton Senna, 2500, SS109, Barra da Tijuca</span>
        </div>
      </div>
      <div class="fbCenter">System created by GRUPO CGD</div>
      <div class="fbRight">
        <div class="fbBlock">
          <b>CGD CORRETORA</b>
          <span>CNPJ 01.654.471/0001-86 • SUSEP 202031791</span>
        </div>
        <div class="fbBlock">
          <b>CGD BARRA</b>
          <span>CNPJ 53.013.848/0001-11 • SUSEP 242158650</span>
        </div>
      </div>
    `;
    app.appendChild(footer);
  }

  /* ================= ELEMENTOS ================= */
  const $gridTop = document.getElementById("gridTop");
  const $gridRest = document.getElementById("gridRest");
  const $clock = document.getElementById("clock");
  const $err = document.getElementById("err");
  const $q = document.getElementById("q");
  const $hintCount = document.getElementById("hintCount");
  const $footerZero = document.getElementById("footerZero");
  const $zeroRow = document.getElementById("zeroRow");
  const $dotStatus = document.getElementById("dotStatus");
  const $loadStatus = document.getElementById("loadStatus");
  const $modalBack = document.getElementById("modalBack");
  const $modalClose = document.getElementById("modalClose");
  const $modalTitle = document.getElementById("modalTitle");
  const $modalContent  = document.getElementById("modalContent");
  const $modalTop = document.getElementById("modalTop");
  const $modalAvatar = document.getElementById("modalAvatar");
  const $searchPanel = document.getElementById("searchPanel");
  const $spList = document.getElementById("spList");
  const $spCount = document.getElementById("spCount");
  const $spOpenAll = document.getElementById("spOpenAll");
  const $spClose = document.getElementById("spClose");
  const $sorteioYm = document.getElementById("sorteioYm");
  const $sorteioPct = document.getElementById("sorteioPct");

  /* ================= HELPERS ================= */
  function fmtDate(d){
    const p = n => String(n).padStart(2,"0");
    return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
  setInterval(()=> $clock.textContent = fmtDate(new Date()), 500);

  function normalizeText(s){
    return String(s || "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g,"")
      .trim();
  }
  function normalizePass(s){
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g,"")
      .replace(/\s+/g,"")
      .trim();
  }
  function initials(name){
    const parts = String(name||"").trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "•";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  }
  function firstNameLower(label){
    const parts = String(label||"").trim().split(/\s+/).filter(Boolean);
    return (parts[0] || "").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g,"").trim();
  }
  function fmtMoney(v, currency="BRL"){
    const n = Number(v || 0);
    try{
      return n.toLocaleString("pt-BR", { style:"currency", currency });
    }catch(_){
      return n.toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });
    }
  }
  function absPhoto(url){
    if(!url) return "";
    const u = String(url);
    if (u.startsWith("http")) return u;
    if (u.startsWith("//")) return "https:" + u;
    if (u.startsWith("/")) return "https://b24-6iyx5y.bitrix24.com.br" + u;
    return "https://b24-6iyx5y.bitrix24.com.br/" + u.replace(/^\.?\//,"");
  }
  function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

  function normYYYYMM(yyyymm){
    const m = String(yyyymm || "").trim().match(/^(\d{4})-(\d{1,2})$/);
    if (!m) return null;
    const mm = String(Number(m[2])).padStart(2, "0");
    return `${m[1]}-${mm}`;
  }
  function yyyymmFromAnyDateStr(ds){
    if(!ds) return null;
    const s = String(ds).trim();
    let m = s.match(/^(\d{4})-(\d{2})/);
    if(m) return normYYYYMM(`${m[1]}-${m[2]}`);
    m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if(m) return normYYYYMM(`${m[3]}-${m[2]}`);
    m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
    if(m) return normYYYYMM(`${m[3]}-${m[2]}`);
    return null;
  }
  function nowYYYYMM(){
    const d = new Date();
    return normYYYYMM(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
  }
  function addMonthsYYYYMM(yyyymm, delta){
    const m = String(yyyymm || "").match(/^(\d{4})-(\d{2})$/);
    if(!m) return nowYYYYMM();
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = new Date(y, mo, 1);
    d.setMonth(d.getMonth() + Number(delta||0));
    return normYYYYMM(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
  }
  function formatImplantada(ds){
    if(!ds) return "—";
    const m = String(ds).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(m) return `${m[3]}/${m[2]}/${m[1]}`;
    if (String(ds).includes("/")) return String(ds).slice(0,10);
    return String(ds).slice(0,10);
  }
  function parseBRNumber(v){
    const s0 = String(v ?? "").trim();
    if (!s0) return 0;
    const s = s0.replace(/[^\d.,-]/g, "");
    const hasComma = s.includes(",");
    const hasDot = s.includes(".");
    if (hasComma && hasDot){
      const n = Number(s.replace(/\./g, "").replace(",", "."));
      return isFinite(n) ? n : 0;
    }
    if (hasComma && !hasDot){
      const n = Number(s.replace(/\./g, "").replace(",", "."));
      return isFinite(n) ? n : 0;
    }
    if (hasDot && !hasComma){
      const n = Number(s.replace(/,/g, ""));
      return isFinite(n) ? n : 0;
    }
    const n = Number(s);
    return isFinite(n) ? n : 0;
  }

  const STAGE_ORDER_N = STAGE_ORDER.map(normalizeText);
  function stagePriority(stage){
    const s = normalizeText(stage);
    const i = STAGE_ORDER_N.findIndex(k => s.includes(k));
    return i < 0 ? 999 : i;
  }

  function showError(msg){
    $err.textContent = msg || "";
    $dotStatus.className = "dot bad";
    if(msg) $loadStatus.textContent = "Erro ao carregar";
  }
  function clearError(){ $err.textContent = ""; }

  async function fetchWithTimeout(url, opts={}, timeoutMs=25000){
    const ctrl = new AbortController();
    const t = setTimeout(()=>ctrl.abort(), timeoutMs);
    try{ return await fetch(url, { ...opts, signal: ctrl.signal }); }
    finally{ clearTimeout(t); }
  }

  /* ======== BITRIX ======== */
  async function bxRaw(method, params, attempt=0){
    const target = BITRIX_WEBHOOK_BASE + method;
    const url = PROXY_URL + encodeURIComponent(target);

    let res = null;
    try{
      res = await fetchWithTimeout(url, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify(params || {})
      }, 25000);
    }catch(e){
      if (attempt < 2){
        await sleep(400*(attempt+1));
        return bxRaw(method, params, attempt+1);
      }
      throw new Error(`Falha de rede/timeout em ${method}: ${e?.message || e}`);
    }

    if (!res.ok){
      const txt = await res.text().catch(()=>"(sem corpo)");
      const retryable = (res.status === 429 || res.status === 503 || res.status === 502 || res.status === 504);
      if (retryable && attempt < 2){
        await sleep(500*(attempt+1));
        return bxRaw(method, params, attempt+1);
      }
      throw new Error(`HTTP ${res.status} em ${method}\nCorpo:\n${txt.slice(0,1200)}`);
    }

    let data = null;
    try{ data = await res.json(); }
    catch(_){
      const txt = await res.text().catch(()=>"(sem corpo)");
      throw new Error(`Resposta não-JSON em ${method}\nCorpo:\n${txt.slice(0,1200)}`);
    }

    if (data.error){
      throw new Error(`Bitrix erro em ${method}: ${data.error_description || data.error}`);
    }
    return data;
  }
  async function bx(method, params){
    const data = await bxRaw(method, params);
    return data.result;
  }

  /* ================= MAPAS + USERS ================= */
  let operatorMap = null;
  let stageMap = null;
  let sourceMap = null;
  let userCacheById = {};
  let sellerRankMap = {};

  async function loadOperatorMap(){
    const fields = await bx("crm.deal.fields", {});
    const f = fields[OPERATOR_FIELD];
    const map = {};
    if (f && f.items) for (const it of f.items) map[it.ID] = it.VALUE;
    return map;
  }
  async function loadStages(){
    const all = await bx("crm.status.list", {});
    const map = {};
    for (const s of all){
      if (String(s.ENTITY_ID).startsWith("DEAL_STAGE")) map[s.STATUS_ID] = s.NAME;
    }
    return map;
  }
  async function loadSources(){
    const all = await bx("crm.status.list", {});
    const map = {};
    for (const s of all){
      if (String(s.ENTITY_ID).toUpperCase() === "SOURCE") map[s.STATUS_ID] = s.NAME;
    }
    return map;
  }
  async function loadAllActiveUsers(){
    let start = 0;
    for (let guard=0; guard<500; guard++){
      const data = await bxRaw("user.get", { filter:{ ACTIVE:"Y" }, start });
      const page = data.result || [];
      for (const u of page) userCacheById[Number(u.ID)] = u;
      if (typeof data.next !== "number") break;
      start = data.next;
      if (start > 20000) break;
    }
  }
  function resolveSellerLabelFromUserId(s){
    if (!s?.userId) return;
    if (BLOCKED_USER_IDS.has(Number(s.userId))) return;
    if (String(s.label).startsWith("USER")){
      const u = userCacheById[Number(s.userId)];
      if (u){
        const nm = `${u.NAME||""} ${u.LAST_NAME||""}`.trim();
        if (nm) s.label = nm;
      }
    }
  }
  async function ensureUsersAndResolve(){
    if (!Object.keys(userCacheById).length) await loadAllActiveUsers();
    const allUsers = Object.values(userCacheById);

    const resolveArray = (arr) => {
      for (const s of arr){
        if (s.userId && BLOCKED_USER_IDS.has(Number(s.userId))){
          s.userId = null;
          continue;
        }
        if (!s.userId && s.matchFullName){
          const target = normalizeText(s.matchFullName);
          const found = allUsers.find(u => normalizeText(`${u.NAME || ""} ${u.LAST_NAME || ""}`) === target);
          if (found && !BLOCKED_USER_IDS.has(Number(found.ID))) s.userId = Number(found.ID);
        }
        resolveSellerLabelFromUserId(s);
      }
    };

    resolveArray(MAIN_SELLERS);
    resolveArray(OTHER_SELLERS);
    resolveArray(SEARCH_ONLY_USERS);
  }

  /* ================= DEALS ================= */
  async function fetchDeals({userId, categoryId, extraFilter={}, select=[]}){
    let all = [];
    let start = 0;

    while (true){
      const data = await bxRaw("crm.deal.list", {
        filter:{ ASSIGNED_BY_ID:userId, CATEGORY_ID: categoryId, ...extraFilter },
        select: ["ID","TITLE","STAGE_ID",OPERATOR_FIELD,"OPPORTUNITY","CURRENCY_ID","SOURCE_ID", CLOSEDATE_FIELD, BONIF_FIELD, ...select],
        start
      });

      const page = data.result || [];
      all = all.concat(page);

      if (typeof data.next !== "number") break;
      start = data.next;
      if (start > 20000) break;
    }
    return all;
  }

  /* ================= AVATAR ================= */
  function renderAvatar(el, seller){
    el.innerHTML = "";
    const uid = Number(seller?.userId || 0);
    const u = uid ? userCacheById[uid] : null;
    const photo = absPhoto(u?.PERSONAL_PHOTO);
    if (photo){
      const img = document.createElement("img");
      img.src = photo;
      img.alt = seller?.label || "user";
      img.onerror = ()=>{ el.textContent = initials(seller?.label || ""); };
      el.appendChild(img);
    }else{
      el.textContent = initials(seller?.label || "");
    }
  }

  function renderFooterUsers(){
    const wrap = document.getElementById('footerUserPhotos');
    if (!wrap) return;
    wrap.innerHTML = '';
    for (const uid of FOOTER_USERS){
      const seller = getSellerById(uid) || { userId: uid, label: `USER ${uid}` };
      const box = document.createElement('div');
      box.className = 'fbPhoto';
      renderAvatar(box, seller);
      wrap.appendChild(box);
    }
  }

  /* ================= MODAL ================= */
  function openModal(title, sellerRef){
    $modalTitle.textContent = title || "Detalhes";
    $modalAvatar.className = "avatar";
    if (sellerRef) renderAvatar($modalAvatar, sellerRef);
    else $modalAvatar.textContent = "•";
    $modalTop.innerHTML = "";
    $modalContent.innerHTML = "";
    $modalBack.style.display = "flex";
  }
  function closeModal(){ $modalBack.style.display = "none"; }
  $modalClose.addEventListener("click", closeModal);
  $modalBack.addEventListener("click", (e)=>{ if(e.target.id==="modalBack") closeModal(); });

  /* ================= EXPORT PDF ================= */
  function exportModalToPDF(filename){
    const title = $modalTitle.textContent || "Relatório";
    const topHTML = $modalTop.innerHTML || "";
    const contentHTML = $modalContent.innerHTML || "";

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!doctype html>
      <html lang="pt-br">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
        <style>
          body{ font-family: Arial, system-ui, sans-serif; margin: 18px; color:#111; }
          .head{ display:flex; align-items:center; gap:12px; margin-bottom:10px; }
          .logo{ width:42px; height:42px; border-radius:10px; overflow:hidden; border:1px solid #ddd; }
          .logo img{ width:100%; height:100%; object-fit:cover; display:block; }
          h1{ font-size:16px; margin:0; }
          .sub{ color:#555; font-size:12px; margin-top:4px; }
          .top{ margin: 10px 0 12px; font-size:12px; color:#333; }
          table{ width:100%; border-collapse:collapse; font-size:12px; }
          th, td{ border:1px solid #ddd; padding:8px; vertical-align:top; }
          th{ background:#f3f3f3; text-align:left; }
          @media print{ @page{ size: A4; margin: 12mm; } }
        </style>
      </head>
      <body>
        <div class="head">
          <div class="logo">
            <img alt="CGD" src="https://bitrix24public.com/b24-6iyx5y.bitrix24.com.br/docs/pub/c77325321d1ad38e8012b995a5f4e8dd/showFile/?&token=soik95n9dd9n" />
          </div>
          <div>
            <h1>${title}</h1>
            <div class="sub">Exportado do painel CGD</div>
          </div>
        </div>
        <div class="top">${topHTML}</div>
        <div class="content">${contentHTML}</div>
        <script>
          document.title = ${JSON.stringify(filename || "relatorio")};
        <\/script>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(()=>{
      try{
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }finally{
        setTimeout(()=> iframe.remove(), 1200);
      }
    }, 250);
  }

  /* ================= CONFIG MENSAL ================= */
  let cfgCacheByYM = {};

  function safeJsonParse(s, fallback){
    try{
      const v = s ? JSON.parse(s) : fallback;
      return (v && typeof v === "object") ? v : fallback;
    }catch(_){
      return fallback;
    }
  }

  function findStageIdByName(stageName){
    const target = normalizeText(stageName);
    for (const [stageId, nm] of Object.entries(stageMap || {})){
      if (normalizeText(nm) === target) return stageId;
    }
    return null;
  }

  async function getOrCreateConfigDeal(yyyymm){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    const title = CFG_TITLE_PREFIX + ym;

    const found = await bx("crm.deal.list", {
      filter: { CATEGORY_ID: CFG_CATEGORY_ID, TITLE: title },
      select: ["ID","TITLE","STAGE_ID", CFG_COMP_FIELD, CFG_SORTEIO_FIELD, CFG_METAS_FIELD, CFG_ESTORNOS_FIELD]
    });

    if (found && found.length){
      return found[0];
    }

    const stageId = findStageIdByName(CFG_STAGE_NAME);
    if (!stageId){
      throw new Error(`Etapa "${CFG_STAGE_NAME}" não encontrada na pipeline ${CFG_CATEGORY_ID}.`);
    }

    const createdId = await bx("crm.deal.add", {
      fields: {
        TITLE: title,
        CATEGORY_ID: CFG_CATEGORY_ID,
        STAGE_ID: stageId,
        [CFG_COMP_FIELD]: ym,
        [CFG_SORTEIO_FIELD]: 0,
        [CFG_METAS_FIELD]: "{}",
        [CFG_ESTORNOS_FIELD]: "{}"
      }
    });

    const created = await bx("crm.deal.get", { id: createdId });
    return created;
  }

  async function ensureConfigLoaded(yyyymm){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    if (cfgCacheByYM[ym]) return cfgCacheByYM[ym];

    const d = await getOrCreateConfigDeal(ym);

    const sorteioMeta = parseBRNumber(d[CFG_SORTEIO_FIELD]);
    const metasObj    = safeJsonParse(d[CFG_METAS_FIELD], {});
    const estornosObj = safeJsonParse(d[CFG_ESTORNOS_FIELD], {});

    cfgCacheByYM[ym] = {
      dealId: Number(d.ID),
      sorteioMeta: isFinite(sorteioMeta) ? sorteioMeta : 0,
      metasObj,
      estornosObj
    };
    return cfgCacheByYM[ym];
  }

  async function saveConfig(yyyymm, next){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    const cur = await ensureConfigLoaded(ym);
    const payload = {
      dealId: cur.dealId,
      sorteioMeta: (next && typeof next.sorteioMeta !== "undefined") ? Number(next.sorteioMeta||0) : Number(cur.sorteioMeta||0),
      metasObj: (next && typeof next.metasObj !== "undefined") ? (next.metasObj||{}) : (cur.metasObj||{}),
      estornosObj: (next && typeof next.estornosObj !== "undefined") ? (next.estornosObj||{}) : (cur.estornosObj||{})
    };

    await bx("crm.deal.update", {
      id: payload.dealId,
      fields: {
        [CFG_SORTEIO_FIELD]: payload.sorteioMeta,
        [CFG_METAS_FIELD]: JSON.stringify(payload.metasObj || {}),
        [CFG_ESTORNOS_FIELD]: JSON.stringify(payload.estornosObj || {})
      }
    });

    cfgCacheByYM[ym] = payload;
    return payload;
  }

  function getMeta(yyyymm, sellerId){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    const cfg = cfgCacheByYM[ym];
    const v = cfg?.metasObj?.[String(sellerId)] ?? 0;
    return parseBRNumber(v);
  }
  function getSorteioMeta(yyyymm){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    const cfg = cfgCacheByYM[ym];
    return Number(cfg?.sorteioMeta || 0);
  }
  function getEstornos(yyyymm, sellerId){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    const cfg = cfgCacheByYM[ym];
    const arr = cfg?.estornosObj?.[String(sellerId)] || [];
    return Array.isArray(arr) ? arr : [];
  }

  /* ================= DADOS ================= */
  let statsBySellerId = {};
  let inProgressBySellerId = {};
  let closedWonBySellerId = {};
  let globalSearchIndex = [];

  function mapDealToItem(d, sellerLabel, sellerId){
    const stageName = stageMap[d.STAGE_ID]||"";
    const opName = operatorMap[d[OPERATOR_FIELD]]||"—";

    const opportunity = parseBRNumber(d.OPPORTUNITY);
    const rawSource = d.SOURCE_ID || "";
    const srcName = (sourceMap && rawSource && sourceMap[rawSource]) ? sourceMap[rawSource] : (rawSource || "—");
    const comp = normYYYYMM(yyyymmFromAnyDateStr(d[CLOSEDATE_FIELD] || null));
    const bonif = parseBRNumber(d[BONIF_FIELD]);

    return {
      id: Number(d.ID),
      client: d.TITLE || "—",
      operator: opName,
      stage: stageName,
      stageId: d.STAGE_ID,
      seller: sellerLabel || "—",
      sellerId: Number(sellerId || 0),
      p: stagePriority(stageName),
      opportunity,
      currency: d.CURRENCY_ID || "BRL",
      source: srcName,
      closeDate: d[CLOSEDATE_FIELD] || null,
      competence: comp,
      bonif
    };
  }

  function getAllSellersForCalc(){
    const all = [...MAIN_SELLERS, ...OTHER_SELLERS, ...SEARCH_ONLY_USERS].filter(s=>s.userId);
    const map = new Map();
    for (const s of all){
      if (BLOCKED_USER_IDS.has(Number(s.userId))) continue;
      map.set(Number(s.userId), s);
    }
    return Array.from(map.values());
  }
  function getAllVisibleUsersForCards(){
    const all = [...MAIN_SELLERS, ...OTHER_SELLERS].filter(s=>s.userId && !BLOCKED_USER_IDS.has(Number(s.userId)));
    const map = new Map();
    for (const s of all) map.set(Number(s.userId), s);
    return Array.from(map.values());
  }
  function getSellerById(id){
    const all = [...MAIN_SELLERS, ...OTHER_SELLERS, ...SEARCH_ONLY_USERS, { userId: 27, label: "USER 27" }];
    return all.find(s => Number(s.userId) === Number(id)) || null;
  }

  function rebuildGlobalSearchIndex(){
    const all = [];
    for (const sid of Object.keys(inProgressBySellerId)){
      for (const it of (inProgressBySellerId[sid]||[])){
        all.push({ type:"ANDAMENTO", ...it, _hay: normalizeText(`${it.client} ${it.operator} ${it.stage} ${it.seller}`) });
      }
    }
    for (const sid of Object.keys(closedWonBySellerId)){
      for (const it of (closedWonBySellerId[sid]||[])){
        all.push({ type:"CONCLUIDA", ...it, _hay: normalizeText(`${it.client} ${it.operator} ${it.source} ${it.seller} ${it.closeDate||""}`) });
      }
    }
    globalSearchIndex = all;
  }
  function countSearchMatches(qNorm){
    if (!qNorm) return 0;
    let n = 0;
    for (const it of globalSearchIndex) if (it._hay.includes(qNorm)) n++;
    return n;
  }

  function buildSellerRankMap(){
    const sellers = getAllVisibleUsersForCards().slice();
    const ordered = sellers.map(s => ({
      sid: Number(s.userId || 0),
      value: Number(statsBySellerId[s.userId]?.andamentoValor || 0)
    })).sort((a,b)=> (b.value - a.value) || (a.sid - b.sid));

    sellerRankMap = {};
    ordered.forEach((it, idx)=>{ sellerRankMap[it.sid] = idx + 1; });
  }

  /* ================= RENDER ================= */
  function renderCard(container, seller, sizeClass){
    const sid = Number(seller.userId||0);
    const st = statsBySellerId[sid] || { andamentoQtd:0, andamentoValor:0, docsQtd:0, pagQtd:0, metaMes:0, metaPct:0 };
    const pctTxt = st.metaMes > 0 ? `${st.metaPct.toFixed(1)}%` : `${(st.metaPct||0).toFixed(1)}%`;
    const rank = sellerRankMap[sid] || "—";

    const card = document.createElement("section");
    card.className = `card ${sizeClass}`;
    card.innerHTML = `
      <div class="head">
        <div class="titleRow">
          <div class="colTitle">
            <div class="avatarWrap">
              <div class="avatar" data-avatar="1"></div>
              <div class="rankBadge">#${rank}</div>
            </div>
            <div class="name">${seller.label}</div>
          </div>
          <div class="tag">#${sid}</div>
        </div>

        <div class="stats">
          <div class="stat"><b>Em andamento</b><span>${st.andamentoQtd}</span></div>
          <div class="stat"><b>Valor produzido</b><span class="money"><b>${fmtMoney(st.andamentoValor,"BRL")}</b></span></div>
          <div class="stat"><b>Aguard. docs</b><span>${st.docsQtd}</span></div>
          <div class="stat"><b>Aguard. pagamento</b><span>${st.pagQtd}</span></div>
          <div class="stat"><b>Meta do mês (%)</b><span class="money"><b>${pctTxt}</b></span></div>
          <div class="stat"><b>Meta (R$)</b><span class="money"><b>${st.metaMes ? fmtMoney(st.metaMes,"BRL") : "—"}</b></span></div>
        </div>

        <div class="btnRow">
          <button class="miniBtn" data-list="1">LISTA</button>
          <button class="miniBtn" data-done="1">CONCLUÍDAS</button>
        </div>
      </div>
    `;
    container.appendChild(card);

    renderAvatar(card.querySelector('[data-avatar="1"]'), seller);
    card.querySelector('[data-list="1"]').addEventListener("click", ()=>openInProgressList(sid));
    card.querySelector('[data-done="1"]').addEventListener("click", ()=>openConcluidasForSeller(sid));
  }

  function renderZeroFooter(zeroSellers){
    $zeroRow.innerHTML = "";
    if (!zeroSellers.length){
      $footerZero.style.display = "none";
      return;
    }
    $footerZero.style.display = "block";

    for (const s of zeroSellers){
      const chip = document.createElement("div");
      chip.className = "zeroChip";
      chip.innerHTML = `
        <div class="avatar" data-z="1"></div>
        <div class="zeroName">${s.label}</div>
      `;
      renderAvatar(chip.querySelector('[data-z="1"]'), s);
      $zeroRow.appendChild(chip);
    }
  }

  function renderAll(){
    $gridTop.innerHTML = "";
    $gridRest.innerHTML = "";

    const sellers = getAllVisibleUsersForCards();
    sellers.sort((a,b)=>{
      const va = statsBySellerId[a.userId]?.andamentoValor || 0;
      const vb = statsBySellerId[b.userId]?.andamentoValor || 0;
      return vb - va;
    });

    buildSellerRankMap();

    const eligibleTop = sellers.filter(s=>{
      const st = statsBySellerId[s.userId] || {};
      return (st.andamentoQtd||0) > 0 || (st.metaPct||0) > 0;
    });

    const nonZero = sellers.filter(s => (statsBySellerId[s.userId]?.andamentoQtd || 0) > 0);
    const zero = sellers.filter(s => (statsBySellerId[s.userId]?.andamentoQtd || 0) === 0);

    const top12 = eligibleTop.slice(0, 12);
    const rest = nonZero.filter(s=> !top12.some(t=>t.userId===s.userId));

    for (const s of top12) renderCard($gridTop, s, "big");
    for (const s of rest) renderCard($gridRest, s, "small");

    renderZeroFooter(zero);
    renderFooterUsers();
    updateHintCount();
    $dotStatus.className = "dot";
  }

  function updateHintCount(){
    const q = normalizeText($q.value);
    $hintCount.textContent = q ? `Busca ativa: ${countSearchMatches(q)} resultado(s)` : `Busca: —`;
  }

  /* ================= BUSCA ================= */
  let searchDebounce = null;
  function closeSearchPanel(){ $searchPanel.style.display = "none"; }
  function openSearchPanel(){ $searchPanel.style.display = "block"; }

  function renderSearchPanel(){
    const qNorm = normalizeText($q.value);
    updateHintCount();

    if (!qNorm){
      closeSearchPanel();
      return;
    }

    const hits = globalSearchIndex.filter(x=>x._hay.includes(qNorm)).slice(0, 60);
    $spCount.textContent = `Encontrados: ${hits.length} (mostrando até 60)`;

    $spList.innerHTML = hits.map(it=>{
      const line1 = `${it.client} • ${fmtMoney(it.opportunity, it.currency||"BRL")}`;
      const line2 = it.type === "ANDAMENTO"
        ? `${it.seller} • ${it.operator} • ${it.stage}`
        : `${it.seller} • ${it.operator} • ${it.source || "—"} • ${formatImplantada(it.closeDate)}`;
      return `
        <div class="spItem" data-hit="${it.type}_${it.sellerId}_${it.id}">
          <div>
            <div class="spMain">${line1}</div>
            <div class="spSub">${line2}</div>
          </div>
        </div>
      `;
    }).join("") || `<div class="spItem" style="cursor:default;"><div class="spMain">Sem resultados.</div></div>`;

    openSearchPanel();

    $spList.querySelectorAll(".spItem[data-hit]").forEach(el=>{
      el.addEventListener("click", ()=>{
        openResultsModal(qNorm);
        closeSearchPanel();
      });
    });
  }

  document.addEventListener("click", (e)=>{
    const wrap = e.target.closest(".searchWrap");
    if (!wrap) closeSearchPanel();
  });

  $spClose.addEventListener("click", closeSearchPanel);
  $spOpenAll.addEventListener("click", ()=>{
    const qNorm = normalizeText($q.value);
    if (!qNorm) return;
    openResultsModal(qNorm);
    closeSearchPanel();
  });

  $q.addEventListener("input", ()=>{
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(renderSearchPanel, 120);
  });
  $q.addEventListener("focus", ()=>{
    if (normalizeText($q.value)) renderSearchPanel();
  });

  /* ================= LISTA ================= */
  let loading = false;

  async function waitUntilSellerLoaded(sellerId, timeoutMs=12000){
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs){
      if (!loading && Array.isArray(inProgressBySellerId[sellerId])) return true;
      if (Array.isArray(inProgressBySellerId[sellerId]) && inProgressBySellerId[sellerId].length) return true;
      await sleep(180);
    }
    return Array.isArray(inProgressBySellerId[sellerId]);
  }

  async function openInProgressList(sellerId){
    const seller = getSellerById(sellerId);
    openModal(`${seller?.label || "Vendedora"} – LISTA (em andamento)`, seller);

    $modalTop.innerHTML = `<div class="rowFlex"><div class="pillSmall">Carregando lista…</div></div>`;
    $modalContent.innerHTML = `<div class="smallNote">Se acabou de abrir o site, pode levar alguns segundos para carregar todas as users.</div>`;

    await waitUntilSellerLoaded(sellerId);

    const list = (inProgressBySellerId[sellerId] || []).slice();
    list.sort((a,b)=>{
      const pa = stagePriority(a.stage);
      const pb = stagePriority(b.stage);
      return pa - pb || a.client.localeCompare(b.client,"pt-BR");
    });

    const total = list.reduce((s,it)=> s + (Number(it.opportunity)||0), 0);

    const rows = list.map(it=>`
      <tr>
        <td>${it.client}</td>
        <td>${it.operator}</td>
        <td>${it.stage}</td>
        <td class="tdRight"><b>${fmtMoney(it.opportunity, it.currency)}</b></td>
      </tr>
    `).join("");

    $modalTop.innerHTML = `
      <div class="rowFlex">
        <div class="inlineCtrl">
          <span class="pillSmall">Itens: <b>${list.length}</b></span>
          <span class="pillSmall">Total: <b>${fmtMoney(total,"BRL")}</b></span>
        </div>
        <div class="btnLine">
          <button class="btn" id="pdfBtn" style="padding:8px 10px;border-radius:12px;">Exportar PDF</button>
        </div>
      </div>
    `;
    $modalContent.innerHTML = `
      <table class="table">
        <thead><tr><th>Negócio</th><th>Operadora</th><th>Etapa</th><th class="tdRight">Valor</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="4">Sem itens.</td></tr>`}</tbody>
      </table>
    `;

    document.getElementById("pdfBtn").addEventListener("click", ()=>exportModalToPDF(`lista_andamento_${sellerId}`));
  }

  /* ================= CONCLUÍDAS SELLER ================= */
  function requireSellerOrAdminPass(seller){
    const input = prompt("Digite a senha:");
    if (input == null) return { ok:false };
    const p = normalizePass(input);
    if (p === normalizePass(ADMIN_PASS)) return { ok:true, isAdmin:true };
    const userPass = normalizePass(`${seller.userId}${firstNameLower(seller.label)}`);
    return { ok: p === userPass, isAdmin:false };
  }

  function buildCompetenceOptionsForSeller(sellerId){
    const arr = (closedWonBySellerId[sellerId] || []);
    const set = new Set(arr.map(x=>normYYYYMM(x.competence)).filter(Boolean));
    const list = Array.from(set).sort().reverse();
    if (!list.length) list.push(nowYYYYMM());
    return list;
  }

  function listConcluidasForSellerCompetence(sellerId, yyyymm){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    const all = (closedWonBySellerId[sellerId] || []).slice();
    const list = all.filter(it => normYYYYMM(it.competence || "") === ym);
    list.sort((a,b)=>{
      const da = String(a.closeDate||"");
      const db = String(b.closeDate||"");
      return db.localeCompare(da) || a.client.localeCompare(b.client,"pt-BR");
    });
    return list;
  }

  function calcMetaPctForSellerCompetence(sellerId, yyyymm){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    const meta = getMeta(ym, sellerId);
    const list = listConcluidasForSellerCompetence(sellerId, ym);
    const produzido = list.reduce((s,it)=> s + (Number(it.opportunity)||0), 0);
    const pct = meta > 0 ? (produzido / meta) * 100 : 0;
    return { meta, produzido, pct };
  }

  async function openConcluidasForSeller(sellerId){
    const seller = getSellerById(sellerId);
    if (!seller?.userId) return;

    const auth = requireSellerOrAdminPass(seller);
    if (!auth.ok){
      alert("Senha incorreta.");
      return;
    }

    const comps = buildCompetenceOptionsForSeller(sellerId);
    const initial = comps[0];

    await renderConcluidasSellerModal(sellerId, initial, auth.isAdmin);
  }

  async function renderConcluidasSellerModal(sellerId, yyyymm, isAdmin){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    await ensureConfigLoaded(ym);

    const seller = getSellerById(sellerId);
    openModal(`${seller?.label || "Vendedora"} – CONCLUÍDAS (${ym})`, seller);

    const comps = buildCompetenceOptionsForSeller(sellerId);
    const list = listConcluidasForSellerCompetence(sellerId, ym);

    let totalBonif = 0;
    for (const it of list) totalBonif += parseBRNumber(it.bonif);

    const estornos = getEstornos(ym, sellerId);
    const totalEstorno = estornos.reduce((s,e)=> s + (Number(e.value)||0), 0);
    const totalLiquido = totalBonif - totalEstorno;

    const { meta, produzido, pct } = calcMetaPctForSellerCompetence(sellerId, ym);

    const opts = comps.map(c=>`<option value="${c}" ${c===ym?"selected":""}>${c}</option>`).join("");
    const adminBtn = isAdmin ? `<button class="btn btnAdm" id="admBonif" style="padding:8px 10px;border-radius:12px;">ADM (Bonificação)</button>` : ``;

    $modalTop.innerHTML = `
      <div class="rowFlex">
        <div class="inlineCtrl">
          <span class="pillSmall">Competência</span>
          <select class="sel" id="compSel">${opts}</select>
          <span class="pillSmall">Meta</span>
          <span class="pillSmall"><b>${meta ? fmtMoney(meta,"BRL") : "—"}</b></span>
          <span class="pillSmall">Produzido</span>
          <span class="pillSmall"><b>${fmtMoney(produzido,"BRL")}</b></span>
          <span class="pillSmall">% Meta</span>
          <span class="pillSmall"><b>${pct.toFixed(1)}%</b></span>
          <span class="pillSmall">Bonificação</span>
          <span class="pillSmall"><b>${fmtMoney(totalBonif,"BRL")}</b></span>
          <span class="pillSmall">Estornos</span>
          <span class="pillSmall"><b>${fmtMoney(totalEstorno,"BRL")}</b></span>
          <span class="pillSmall">Líquido</span>
          <span class="pillSmall"><b>${fmtMoney(totalLiquido,"BRL")}</b></span>
        </div>
        <div class="btnLine">
          ${adminBtn}
          <button class="btn" id="pdfBtn" style="padding:8px 10px;border-radius:12px;">Exportar PDF</button>
          <button class="btn" id="csvBtn" style="padding:8px 10px;border-radius:12px;">Exportar CSV</button>
        </div>
      </div>
    `;

    const rows = list.map(it=>{
      const b = parseBRNumber(it.bonif);
      return `
        <tr>
          <td>${formatImplantada(it.closeDate)}</td>
          <td>${it.client}</td>
          <td>${it.operator}</td>
          <td class="tdRight"><b>${fmtMoney(it.opportunity, it.currency)}</b></td>
          <td>${it.source || "—"}</td>
          <td class="tdRight"><b>${b ? fmtMoney(b,"BRL") : "—"}</b></td>
        </tr>
      `;
    }).join("");

    const estornoRows = estornos.map((e)=>`
      <tr>
        <td colspan="4">ESTORNO</td>
        <td>${e.client || "—"}</td>
        <td class="tdRight"><b>-${fmtMoney(Number(e.value)||0,"BRL")}</b></td>
      </tr>
    `).join("");

    $modalContent.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>IMPLANTADA EM</th>
            <th>Negócio</th>
            <th>Operadora</th>
            <th class="tdRight">VLR PRODUZIDO</th>
            <th>Fonte</th>
            <th class="tdRight">Bonificação</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="6">Sem negócios nesta competência.</td></tr>`}
          ${estornoRows}
        </tbody>
      </table>
    `;

    document.getElementById("compSel").addEventListener("change", async (e)=>{
      await renderConcluidasSellerModal(sellerId, e.target.value, isAdmin);
    });

    document.getElementById("pdfBtn").addEventListener("click", ()=>exportModalToPDF(`concluidas_${sellerId}_${ym}`));
    document.getElementById("csvBtn").addEventListener("click", ()=>exportConcluidasCSV_Seller(sellerId, ym));

    if (isAdmin){
      document.getElementById("admBonif").addEventListener("click", async ()=>{
        const pass = prompt("Senha ADM:");
        if (pass == null) return;
        if (normalizePass(pass) !== normalizePass(ADMIN_PASS)){
          alert("Senha incorreta.");
          return;
        }
        await openAdmBonifModal(sellerId, ym);
      });
    }
  }

  function exportConcluidasCSV_Seller(sellerId, yyyymm){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    const seller = getSellerById(sellerId);
    const list = listConcluidasForSellerCompetence(sellerId, ym);
    const estornos = getEstornos(ym, sellerId);

    const header = ["VENDEDORA","COMPETENCIA","IMPLANTADA_EM","NEGOCIO","OPERADORA","VLR_PRODUZIDO","FONTE","BONIFICACAO","TIPO"];
    const lines = [header.join(";")];

    for (const it of list){
      const b = parseBRNumber(it.bonif);
      lines.push([
        `"${seller?.label||""}"`,
        `"${ym}"`,
        `"${formatImplantada(it.closeDate)}"`,
        `"${String(it.client).replace(/"/g,'""')}"`,
        `"${String(it.operator).replace(/"/g,'""')}"`,
        `"${it.opportunity}"`,
        `"${String(it.source||"").replace(/"/g,'""')}"`,
        `"${b}"`,
        `"CONTRATO"`
      ].join(";"));
    }
    for (const e of estornos){
      lines.push([
        `"${seller?.label||""}"`,
        `"${ym}"`,
        `""`,
        `"${String(e.client||"").replace(/"/g,'""')}"`,
        `""`,
        `"0"`,
        `"ESTORNO"`,
        `"${Number(e.value)||0}"`,
        `"ESTORNO"`
      ].join(";"));
    }

    const blob = new Blob([lines.join("\n")], {type:"text/csv;charset=utf-8;"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `concluidas_${sellerId}_${ym}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function openAdmBonifModal(sellerId, yyyymm){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    await ensureConfigLoaded(ym);

    const seller = getSellerById(sellerId);
    openModal(`ADM Bonificação • ${seller?.label || ""} • ${ym}`, seller);

    const list = listConcluidasForSellerCompetence(sellerId, ym);
    const estornos = getEstornos(ym, sellerId);
    const { meta, produzido, pct } = calcMetaPctForSellerCompetence(sellerId, ym);

    const rows = list.map(it=>{
      const cur = parseBRNumber(it.bonif);
      return `
        <tr>
          <td>${formatImplantada(it.closeDate)}</td>
          <td>${it.client}</td>
          <td>${it.operator}</td>
          <td>${it.source || "—"}</td>
          <td class="tdRight"><b>${fmtMoney(it.opportunity,it.currency)}</b></td>
          <td>
            <input class="inpt" data-b="${it.id}" value="${cur ? String(cur).replace(".",",") : ""}" placeholder="Bonif. (R$)" style="width:160px;">
          </td>
        </tr>
      `;
    }).join("");

    const estRows = estornos.map((e, idx)=>`
      <tr>
        <td colspan="3">${e.client || "—"}</td>
        <td class="tdRight"><b>-${fmtMoney(Number(e.value)||0,"BRL")}</b></td>
        <td class="tdRight">
          <button class="btn" data-del-est="${idx}" style="padding:6px 10px;border-radius:12px;">Remover</button>
        </td>
        <td></td>
      </tr>
    `).join("");

    $modalTop.innerHTML = `
      <div class="rowFlex">
        <div class="inlineCtrl">
          <span class="pillSmall">Meta</span><span class="pillSmall"><b>${meta ? fmtMoney(meta,"BRL") : "—"}</b></span>
          <span class="pillSmall">Produzido</span><span class="pillSmall"><b>${fmtMoney(produzido,"BRL")}</b></span>
          <span class="pillSmall">% Meta</span><span class="pillSmall"><b>${pct.toFixed(1)}%</b></span>
          <span class="pillSmall">Bonificação: preenchida por contrato</span>
          <span class="pillSmall">Estorno: cliente + valor (deduz do total)</span>
        </div>
        <div class="btnLine">
          <button class="btn btnAdm" id="saveBonif" style="padding:8px 10px;border-radius:12px;">Salvar</button>
          <button class="btn btnAdm" id="backList" style="padding:8px 10px;border-radius:12px;">Voltar</button>
        </div>
      </div>
      <div class="rowFlex">
        <div class="inlineCtrl">
          <input class="inpt" id="estCliente" placeholder="Cliente (estorno)" style="width:260px;">
          <input class="inpt" id="estValor" placeholder="Valor (R$)" style="width:160px;">
          <button class="btn btnAdm" id="addEstorno" style="padding:8px 10px;border-radius:12px;">Adicionar estorno</button>
        </div>
      </div>
    `;

    $modalContent.innerHTML = `
      <div class="smallNote" style="margin-bottom:10px;">Competência: <b>${ym}</b></div>
      <table class="table">
        <thead>
          <tr>
            <th>IMPLANTADA EM</th>
            <th>Negócio</th>
            <th>Operadora</th>
            <th>Fonte</th>
            <th class="tdRight">VLR PRODUZIDO</th>
            <th>Bonificação (R$)</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="6">Sem negócios nesta competência.</td></tr>`}</tbody>
      </table>

      <div style="height:12px"></div>

      <table class="table">
        <thead>
          <tr>
            <th colspan="3">ESTORNOS (deduz do total)</th>
            <th class="tdRight">Valor</th>
            <th class="tdRight">Ação</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${estRows || `<tr><td colspan="6">Sem estornos.</td></tr>`}</tbody>
      </table>
    `;

    document.getElementById("saveBonif").addEventListener("click", async ()=>{
      const inputs = Array.from(document.querySelectorAll("input[data-b]"));
      for (const inp of inputs){
        const dealId = Number(inp.getAttribute("data-b"));
        const val = parseBRNumber(inp.value);
        const safe = (isFinite(val) && val >= 0) ? val : 0;

        await bx("crm.deal.update", {
          id: dealId,
          fields: { [BONIF_FIELD]: safe }
        });

        const arr = closedWonBySellerId[sellerId] || [];
        const hit = arr.find(x => Number(x.id) === Number(dealId));
        if (hit) hit.bonif = safe;
      }

      alert("Bonificações salvas.");
      await renderConcluidasSellerModal(sellerId, ym, true);
    });

    document.getElementById("backList").addEventListener("click", async ()=>{
      await renderConcluidasSellerModal(sellerId, ym, true);
    });

    document.getElementById("addEstorno").addEventListener("click", async ()=>{
      const c = document.getElementById("estCliente").value || "";
      const v = parseBRNumber(document.getElementById("estValor").value);
      if (!c.trim()){ alert("Informe o cliente do estorno."); return; }
      if (!isFinite(v) || v <= 0){ alert("Informe um valor de estorno válido (> 0)."); return; }

      const cfg = await ensureConfigLoaded(ym);
      const estObj = { ...(cfg.estornosObj || {}) };
      const key = String(sellerId);
      const arr = Array.isArray(estObj[key]) ? estObj[key].slice() : [];
      arr.push({ client: c.trim(), value: v });
      estObj[key] = arr;

      await saveConfig(ym, { estornosObj: estObj });
      await openAdmBonifModal(sellerId, ym);
    });

    document.querySelectorAll("button[data-del-est]").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        const idx = Number(btn.getAttribute("data-del-est"));
        const cfg = await ensureConfigLoaded(ym);
        const estObj = { ...(cfg.estornosObj || {}) };
        const key = String(sellerId);
        const arr = Array.isArray(estObj[key]) ? estObj[key].slice() : [];
        arr.splice(idx, 1);
        estObj[key] = arr;

        await saveConfig(ym, { estornosObj: estObj });
        await openAdmBonifModal(sellerId, ym);
      });
    });
  }

  /* ================= CONCLUÍDAS ADM ================= */
  async function openConcluidasAdm(){
    const pass = prompt("Senha ADM:");
    if (pass == null) return;
    if (normalizePass(pass) !== normalizePass(ADMIN_PASS)){
      alert("Senha incorreta.");
      return;
    }

    const compSet = new Set();
    for (const sid of Object.keys(closedWonBySellerId)){
      for (const it of (closedWonBySellerId[sid]||[])){
        const c = normYYYYMM(it.competence);
        if (c) compSet.add(c);
      }
    }
    const comps = Array.from(compSet).sort().reverse();
    const initial = comps[0] || nowYYYYMM();

    await renderConcluidasAdmModal(initial, "ALL", "ALL");
  }

  function drawPie(canvas, slices){
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    const cx = w/2, cy = h/2;
    const r = Math.min(w,h)*0.42;

    ctx.clearRect(0,0,w,h);

    const total = slices.reduce((s,x)=>s + x.value, 0) || 1;
    let a = -Math.PI/2;

    for (let i=0;i<slices.length;i++){
      const frac = slices[i].value / total;
      const a2 = a + frac * Math.PI*2;
      const hue = (i * 57) % 360;
      ctx.fillStyle = `hsl(${hue} 70% 55%)`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a, a2);
      ctx.closePath();
      ctx.fill();
      a = a2;
    }

    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath();
    ctx.arc(cx, cy, r*0.58, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 12px system-ui, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Fontes", cx, cy);
  }

  async function renderConcluidasAdmModal(yyyymm, sellerFilter, sourceFilter){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    openModal(`CONCLUÍDAS (ADM) • ${ym}`, null);

    const allSellers = getAllVisibleUsersForCards().slice().sort((a,b)=>a.label.localeCompare(b.label,"pt-BR"));

    let list = [];
    for (const s of allSellers){
      const sid = Number(s.userId||0);
      const arr = (closedWonBySellerId[sid]||[]).filter(x => normYYYYMM(x.competence) === ym);
      for (const it of arr){
        list.push({ ...it, sellerName: s.label, sellerId: sid });
      }
    }

    let filtered = list.slice();
    if (sellerFilter !== "ALL"){
      const sid = Number(sellerFilter);
      filtered = filtered.filter(x => Number(x.sellerId) === sid);
    }
    if (sourceFilter !== "ALL"){
      filtered = filtered.filter(x => String(x.source||"—") === sourceFilter);
    }

    const totalLista = filtered.reduce((s,it)=> s + (Number(it.opportunity)||0), 0);
    const totalsBySource = {};
    for (const it of filtered){
      const k = String(it.source||"—");
      totalsBySource[k] = (totalsBySource[k]||0) + (Number(it.opportunity)||0);
    }
    const sources = Object.keys(totalsBySource).sort((a,b)=>(totalsBySource[b]-totalsBySource[a]) || a.localeCompare(b,"pt-BR"));

    const compSet = new Set();
    for (const sid of Object.keys(closedWonBySellerId)){
      for (const it of (closedWonBySellerId[sid]||[])){
        const c = normYYYYMM(it.competence);
        if (c) compSet.add(c);
      }
    }
    const base = nowYYYYMM();
    for (let i=-12;i<=12;i++) compSet.add(addMonthsYYYYMM(base, i));

    const comps = Array.from(compSet).map(normYYYYMM).filter(Boolean).sort().reverse();
    const compOpts = comps.map(c=>`<option value="${c}" ${c===ym?"selected":""}>${c}</option>`).join("");

    const sellerOpts = [`<option value="ALL" ${sellerFilter==="ALL"?"selected":""}>Todas</option>`]
      .concat(allSellers.map(s=>{
        const sid = Number(s.userId||0);
        const tot = list.filter(x=>x.sellerId===sid).reduce((a,x)=>a+(Number(x.opportunity)||0),0);
        return `<option value="${sid}" ${String(sellerFilter)===String(sid)?"selected":""}>${s.label} • ${fmtMoney(tot,"BRL")}</option>`;
      })).join("");

    const sourceOpts = [`<option value="ALL" ${sourceFilter==="ALL"?"selected":""}>Todas</option>`]
      .concat(Object.keys(totalsBySource).sort((a,b)=>(totalsBySource[b]-totalsBySource[a]) || a.localeCompare(b,"pt-BR")).map(src=>{
        return `<option value="${src}" ${String(sourceFilter)===String(src)?"selected":""}>${src} • ${fmtMoney(totalsBySource[src]||0,"BRL")}</option>`;
      })).join("");

    filtered.sort((a,b)=> String(b.closeDate||"").localeCompare(String(a.closeDate||"")) || a.sellerName.localeCompare(b.sellerName,"pt-BR"));

    $modalTop.innerHTML = `
      <div class="rowFlex">
        <div class="inlineCtrl">
          <span class="pillSmall">Competência</span>
          <select class="sel" id="admComp">${compOpts}</select>
          <span class="pillSmall">Vendedora</span>
          <select class="sel" id="admSeller">${sellerOpts}</select>
          <span class="pillSmall">Fonte</span>
          <select class="sel" id="admSource">${sourceOpts}</select>
          <span class="pillSmall">Total (R$)</span>
          <span class="pillSmall"><b>${fmtMoney(totalLista,"BRL")}</b></span>
        </div>
        <div class="btnLine">
          <button class="btn" id="pdfBtn" style="padding:8px 10px;border-radius:12px;">Exportar PDF</button>
          <button class="btn" id="csvBtn" style="padding:8px 10px;border-radius:12px;">Exportar CSV</button>
        </div>
      </div>
      <div class="smallNote" style="margin-bottom:10px;"><b>Produção por Fonte • ${ym}</b> — valores e percentuais do filtro atual.</div>
    `;

    const sourceRows = sources.map((k)=>{
      const v = totalsBySource[k] || 0;
      const pct = totalLista > 0 ? (v/totalLista)*100 : 0;
      return `<tr><td>${k}</td><td class="tdRight"><b>${fmtMoney(v,"BRL")}</b></td><td class="tdRight"><b>${pct.toFixed(1)}%</b></td></tr>`;
    }).join("");

    const listRows = filtered.map(it=>`
      <tr>
        <td>${it.sellerName}</td>
        <td>${formatImplantada(it.closeDate)}</td>
        <td>${it.client}</td>
        <td>${it.operator}</td>
        <td>${it.source || "—"}</td>
        <td class="tdRight"><b>${fmtMoney(it.opportunity,it.currency)}</b></td>
      </tr>
    `).join("");

    $modalContent.innerHTML = `
      <div class="pieWrap" style="margin-bottom:12px;">
        <div class="pieBox"><canvas id="pieCanvas" width="320" height="220"></canvas></div>
        <div class="pieBox" style="flex:1 1 520px; min-width:320px;">
          <table class="table" style="margin:0;">
            <thead><tr><th>Fonte</th><th class="tdRight">Produção (R$)</th><th class="tdRight">%</th></tr></thead>
            <tbody>${sourceRows || `<tr><td colspan="3">Sem dados.</td></tr>`}</tbody>
          </table>
        </div>
      </div>
      <table class="table">
        <thead><tr><th>Vendedora</th><th>IMPLANTADA EM</th><th>Negócio</th><th>Operadora</th><th>Fonte</th><th class="tdRight">VLR PRODUZIDO</th></tr></thead>
        <tbody>${listRows || `<tr><td colspan="6">Sem itens.</td></tr>`}</tbody>
      </table>
    `;

    setTimeout(()=>{
      const cv = document.getElementById("pieCanvas");
      if (cv){
        const slices = sources.map(k=>({ label:k, value: totalsBySource[k]||0 })).filter(x=>x.value>0);
        drawPie(cv, slices.length ? slices : [{label:"—", value:1}]);
      }
    }, 0);

    document.getElementById("admComp").addEventListener("change", async (e)=>{ await renderConcluidasAdmModal(e.target.value, sellerFilter, sourceFilter); });
    document.getElementById("admSeller").addEventListener("change", async (e)=>{ await renderConcluidasAdmModal(ym, e.target.value, sourceFilter); });
    document.getElementById("admSource").addEventListener("change", async (e)=>{ await renderConcluidasAdmModal(ym, sellerFilter, e.target.value); });
    document.getElementById("pdfBtn").addEventListener("click", ()=>exportModalToPDF(`concluidas_adm_${ym}`));
    document.getElementById("csvBtn").addEventListener("click", ()=>exportConcluidasCSV_ADM(filtered, ym));
  }

  function exportConcluidasCSV_ADM(list, yyyymm){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    const header = ["COMPETENCIA","VENDEDORA","IMPLANTADA_EM","NEGOCIO","OPERADORA","FONTE","VLR_PRODUZIDO"];
    const lines = [header.join(";")];
    for (const it of list){
      lines.push([
        `"${ym}"`,
        `"${String(it.sellerName||"").replace(/"/g,'""')}"`,
        `"${formatImplantada(it.closeDate)}"`,
        `"${String(it.client||"").replace(/"/g,'""')}"`,
        `"${String(it.operator||"").replace(/"/g,'""')}"`,
        `"${String(it.source||"").replace(/"/g,'""')}"`,
        `"${Number(it.opportunity)||0}"`
      ].join(";"));
    }
    const blob = new Blob([lines.join("\n")], {type:"text/csv;charset=utf-8;"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `concluidas_adm_${ym}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ================= BONIFICAÇÃO ADM ================= */
  async function openBonifRankingADM(){
    const pass = prompt("Senha ADM:");
    if (pass == null) return;
    if (normalizePass(pass) !== normalizePass(ADMIN_PASS)){
      alert("Senha incorreta.");
      return;
    }

    const base = nowYYYYMM();
    await openBonifRankingADMForCompetence(base);
  }

  async function openBonifRankingADMForCompetence(yyyymm){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    await ensureConfigLoaded(ym);

    openModal(`BONIFICAÇÃO (ADM) • ${ym}`, null);

    const allSellers = getAllVisibleUsersForCards().slice().sort((a,b)=>a.label.localeCompare(b.label,"pt-BR"));
    const compSet = new Set();
    for (const sid of Object.keys(closedWonBySellerId)){
      for (const it of (closedWonBySellerId[sid]||[])){
        const c = normYYYYMM(it.competence);
        if (c) compSet.add(c);
      }
    }
    for (let i=-12;i<=12;i++) compSet.add(addMonthsYYYYMM(nowYYYYMM(), i));
    const comps = Array.from(compSet).map(normYYYYMM).filter(Boolean).sort().reverse();
    const compOpts = comps.map(c=>`<option value="${c}" ${c===ym?"selected":""}>${c}</option>`).join("");

    const rowsData = allSellers.map(s=>{
      const sid = Number(s.userId||0);
      const list = (closedWonBySellerId[sid]||[]).filter(x=>normYYYYMM(x.competence)===ym);
      const produzido = list.reduce((a,x)=> a+(Number(x.opportunity)||0), 0);
      const meta = getMeta(ym, sid);
      const pct = meta>0 ? (produzido/meta)*100 : 0;
      const bonifBruta = list.reduce((a,x)=> a + parseBRNumber(x.bonif), 0);
      const est = getEstornos(ym, sid).reduce((a,e)=> a + (Number(e.value)||0), 0);
      const bonifLiquida = bonifBruta - est;
      return { seller:s.label, sid, produzido, meta, pct, bonifLiquida };
    });

    const ranked = rowsData.slice().sort((a,b)=> (b.produzido-a.produzido) || (b.bonifLiquida-a.bonifLiquida) || a.seller.localeCompare(b.seller,"pt-BR"));
    const totalProduzido = ranked.reduce((a,x)=>a+x.produzido,0);
    const totalBonifLiq = ranked.reduce((a,x)=>a+x.bonifLiquida,0);

    $modalTop.innerHTML = `
      <div class="rowFlex">
        <div class="inlineCtrl">
          <span class="pillSmall">Competência</span>
          <select class="sel" id="bonifComp">${compOpts}</select>
          <span class="pillSmall">Total Produzido</span>
          <span class="pillSmall"><b>${fmtMoney(totalProduzido,"BRL")}</b></span>
          <span class="pillSmall">Bonificação (líquida)</span>
          <span class="pillSmall"><b>${fmtMoney(totalBonifLiq,"BRL")}</b></span>
        </div>
        <div class="btnLine">
          <button class="btn" id="pdfBtn" style="padding:8px 10px;border-radius:12px;">Exportar PDF</button>
        </div>
      </div>
      <div class="smallNote" style="margin-bottom:10px;">*Bonificação (R$)* aqui já considera estornos (bonif - estornos).</div>
    `;

    const rows = ranked.map((r, idx)=>`
      <tr>
        <td><b>#${idx+1}</b> ${r.seller} <span style="opacity:.75;">(#${r.sid})</span></td>
        <td class="tdRight"><b>${fmtMoney(r.produzido,"BRL")}</b></td>
        <td class="tdRight"><b>${r.meta ? fmtMoney(r.meta,"BRL") : "—"}</b></td>
        <td class="tdRight"><b>${r.meta ? r.pct.toFixed(1)+"%" : "—"}</b></td>
        <td class="tdRight"><b>${fmtMoney(r.bonifLiquida,"BRL")}</b></td>
      </tr>
    `).join("");

    $modalContent.innerHTML = `
      <table class="table">
        <thead><tr><th>Vendedora (ranking)</th><th class="tdRight">Produzido</th><th class="tdRight">Meta</th><th class="tdRight">% Meta</th><th class="tdRight">Bonificação (R$)</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5">Sem dados.</td></tr>`}</tbody>
      </table>
    `;

    document.getElementById("bonifComp").addEventListener("change", async (e)=>{ await openBonifRankingADMForCompetence(e.target.value); });
    document.getElementById("pdfBtn").addEventListener("click", ()=>exportModalToPDF(`bonificacao_adm_${ym}`));
  }

  /* ================= RESULTADOS ================= */
  function openResultsModal(qNorm){
    openModal("Resultados", null);
    const hits = qNorm ? globalSearchIndex.filter(x=>x._hay.includes(qNorm)).slice(0, 300) : [];
    $modalTop.innerHTML = `
      <div class="rowFlex">
        <div class="inlineCtrl">
          <span class="pillSmall">Resultados: <b>${hits.length}</b></span>
          <span class="pillSmall">Filtro: <b>${qNorm || "—"}</b></span>
        </div>
        <div class="btnLine">
          <button class="btn" id="pdfBtn" style="padding:8px 10px;border-radius:12px;">Exportar PDF</button>
        </div>
      </div>
    `;
    const rows = hits.map(it=>`
      <tr>
        <td>${it.seller || "—"}</td>
        <td>${it.client}</td>
        <td>${it.operator}</td>
        <td>${it.type === "ANDAMENTO" ? it.stage : "CONCLUÍDA"}</td>
        <td class="tdRight"><b>${fmtMoney(it.opportunity, it.currency||"BRL")}</b></td>
      </tr>
    `).join("");
    $modalContent.innerHTML = `
      <table class="table">
        <thead><tr><th>Vendedora</th><th>Negócio</th><th>Operadora</th><th>Status</th><th class="tdRight">Valor</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="5">Sem resultados.</td></tr>`}</tbody>
      </table>
    `;
    document.getElementById("pdfBtn").addEventListener("click", ()=>exportModalToPDF(`busca_${qNorm || "vazio"}`));
  }

  /* ================= THEME / BUTTONS ================= */
  function setThemeDarkOnly(){
    document.body.classList.remove("theme-light","theme-blue");
    document.body.classList.add("theme-dark");
    try{ localStorage.setItem("cgd_theme", "theme-dark"); }catch(_){ }
  }
  const themeDarkBtn = document.getElementById("themeDark");
  if (themeDarkBtn){
    themeDarkBtn.textContent = "PADRÃO";
    themeDarkBtn.addEventListener("click", setThemeDarkOnly);
  }

  const refreshBtn = document.getElementById("refreshNow");
  if (refreshBtn) refreshBtn.addEventListener("click", loadAll);

  const clearBtn = document.getElementById("clearSearch");
  if (clearBtn) clearBtn.addEventListener("click", ()=>{ $q.value=""; closeSearchPanel(); updateHintCount(); });

  function buildCompetenceListWindow(){
    const set = new Set();
    for (const sid of Object.keys(closedWonBySellerId)){
      for (const it of (closedWonBySellerId[sid]||[])){
        const c = normYYYYMM(it.competence);
        if (c) set.add(c);
      }
    }
    const base = nowYYYYMM();
    for (let i=-12;i<=12;i++) set.add(addMonthsYYYYMM(base, i));
    return Array.from(set).map(normYYYYMM).filter(Boolean).sort().reverse();
  }

  async function openAdmMetasByCompetence(yyyymm){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    const cfg = await ensureConfigLoaded(ym);
    openModal(`ADM Metas • ${ym}`, null);

    const sellers = getAllVisibleUsersForCards().slice().sort((a,b)=>a.label.localeCompare(b.label,"pt-BR"));
    const comps = buildCompetenceListWindow();
    const compOpts = comps.map(c=>`<option value="${c}" ${c===ym?"selected":""}>${c}</option>`).join("");

    const rows = sellers.map(s=>{
      const sid = Number(s.userId||0);
      const cur = parseBRNumber(cfg.metasObj?.[String(sid)] ?? 0);
      return `
        <tr>
          <td>${s.label}</td>
          <td>#${sid}</td>
          <td><input class="inpt" data-meta="${sid}" value="${cur ? String(cur).replace(".",",") : ""}" placeholder="Meta (R$)" style="width:180px;"></td>
        </tr>
      `;
    }).join("");

    const sorteioCur = Number(cfg.sorteioMeta || 0);

    $modalTop.innerHTML = `
      <div class="rowFlex">
        <div class="inlineCtrl">
          <span class="pillSmall">Competência</span>
          <select class="sel" id="metaComp">${compOpts}</select>
          <button class="btn btnAdm" id="metaPrev" style="padding:8px 10px;border-radius:12px;">◀ Mês anterior</button>
          <button class="btn btnAdm" id="metaNext" style="padding:8px 10px;border-radius:12px;">Mês seguinte ▶</button>
          <span class="pillSmall">Meta Sorteio (R$)</span>
          <input class="inpt" id="metaSorteio" value="${sorteioCur ? String(sorteioCur).replace(".",",") : ""}" placeholder="Meta Sorteio (R$)" style="width:180px;">
        </div>
        <div class="btnLine"><button class="btn btnAdm" id="saveMetas" style="padding:8px 10px;border-radius:12px;">Salvar</button></div>
      </div>
      <div class="pillSmall">Salva no Bitrix (Deal ${CFG_TITLE_PREFIX}${ym})</div>
    `;

    $modalContent.innerHTML = `
      <table class="table">
        <thead><tr><th>Vendedora</th><th>ID</th><th>Meta do mês (R$)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    document.getElementById("metaComp").addEventListener("change", async (e)=>{ await openAdmMetasByCompetence(e.target.value); });
    document.getElementById("metaPrev").addEventListener("click", async ()=>{ await openAdmMetasByCompetence(addMonthsYYYYMM(ym, -1)); });
    document.getElementById("metaNext").addEventListener("click", async ()=>{ await openAdmMetasByCompetence(addMonthsYYYYMM(ym, 1)); });

    document.getElementById("saveMetas").addEventListener("click", async ()=>{
      const cfgNow = await ensureConfigLoaded(ym);
      const metasObj = { ...(cfgNow.metasObj || {}) };
      document.querySelectorAll("input[data-meta]").forEach(inp=>{
        const sid = Number(inp.getAttribute("data-meta"));
        const val = parseBRNumber(inp.value);
        metasObj[String(sid)] = (isFinite(val) && val >= 0) ? Number(val) : 0;
      });
      const sorteioVal = parseBRNumber(document.getElementById("metaSorteio").value);
      const sorteioSafe = (isFinite(sorteioVal) && sorteioVal >= 0) ? Number(sorteioVal) : 0;
      await saveConfig(ym, { metasObj, sorteioMeta: sorteioSafe });
      alert("Metas salvas.");
      await loadAll();
      closeModal();
    });
  }

  const admMetasBtn = document.getElementById("admMetas");
  if (admMetasBtn) admMetasBtn.addEventListener("click", async ()=>{
    const pass = prompt("Senha ADM:");
    if (pass == null) return;
    if (normalizePass(pass) !== normalizePass(ADMIN_PASS)){
      alert("Senha incorreta.");
      return;
    }
    await openAdmMetasByCompetence(nowYYYYMM());
  });

  const admDoneAllBtn = document.getElementById("admDoneAll");
  if (admDoneAllBtn) admDoneAllBtn.addEventListener("click", openConcluidasAdm);
  const admBonifRankingBtn = document.getElementById("admBonifRanking");
  if (admBonifRankingBtn) admBonifRankingBtn.addEventListener("click", openBonifRankingADM);

  /* ================= LOAD ================= */
  async function runPool(items, worker, concurrency){
    let i = 0;
    const results = [];
    const runners = new Array(Math.min(concurrency, items.length)).fill(0).map(async ()=>{
      while (i < items.length){
        const idx = i++;
        results[idx] = await worker(items[idx], idx);
      }
    });
    await Promise.all(runners);
    return results;
  }

  function updateSorteioBar(){
    const ym = nowYYYYMM();
    $sorteioYm.textContent = ym;

    const meta = getSorteioMeta(ym) || 0;
    let produzido = 0;

    for (const s of getAllVisibleUsersForCards()){
      const sid = Number(s.userId||0);
      const list = (closedWonBySellerId[sid]||[]).filter(x => normYYYYMM(x.competence) === ym);
      produzido += list.reduce((a,x)=>a+(Number(x.opportunity)||0),0);
    }

    const hiddenSid = 1;
    const hiddenList = (closedWonBySellerId[hiddenSid] || []).filter(x => normYYYYMM(x.competence) === ym);
    produzido += hiddenList.reduce((a,x)=>a+(Number(x.opportunity)||0),0);

    const pct = meta > 0 ? (produzido / meta) * 100 : 0;
    $sorteioPct.textContent = (meta > 0) ? `${pct.toFixed(1)}%` : "—";
  }

  async function loadAll(){
    if (loading) return;
    loading = true;
    clearError();
    $dotStatus.className = "dot warn";
    $loadStatus.textContent = "Carregando…";

    try{
      if(!operatorMap) operatorMap = await loadOperatorMap();
      if(!stageMap) stageMap = await loadStages();
      if(!sourceMap) sourceMap = await loadSources();
      await ensureUsersAndResolve();

      const curYM = nowYYYYMM();
      await ensureConfigLoaded(curYM);

      statsBySellerId = {};
      inProgressBySellerId = {};
      closedWonBySellerId = {};

      const calcSellers = getAllSellersForCalc();
      let okCount = 0;
      let failCount = 0;

      await runPool(calcSellers, async (s, idx)=>{
        const sid = Number(s.userId||0);
        $loadStatus.textContent = `Carregando ${idx+1}/${calcSellers.length}… (${okCount} ok / ${failCount} falhas)`;

        try{
          const deals = await fetchDeals({ userId: sid, categoryId: CATEGORY_ID_MAIN, extraFilter: { CLOSED: "N" } });
          const items = (deals||[])
            .map(d=> mapDealToItem(d, s.label, sid))
            .filter(i=>i.p<999)
            .sort((a,b)=>a.p-b.p || a.client.localeCompare(b.client,"pt-BR"));
          inProgressBySellerId[sid] = items;

          let andamentoValor = 0, docsQtd = 0, pagQtd = 0;
          for (const it of items){
            andamentoValor += it.opportunity;
            const stg = normalizeText(it.stage);
            if (stg.includes("AGUARDANDO DOCUMENTOS")) docsQtd++;
            if (stg.includes("AGUARDANDO PAGAMENTO")) pagQtd++;
          }

          const closedDeals = await fetchDeals({ userId:sid, categoryId:CATEGORY_ID_MAIN, extraFilter:{ CLOSED:"Y" } });
          const mappedClosed = (closedDeals||[]).map(d=> mapDealToItem(d, s.label, sid));
          const prefer = mappedClosed.filter(it=>{
            const nm = normalizeText(it.stage || "");
            return (nm.includes("NEGOC") && nm.includes("FECHAD")) || nm.includes("FECHADO");
          });
          const wonList = (prefer.length ? prefer : mappedClosed)
            .filter(it=> !!it.competence)
            .sort((a,b)=> String(b.closeDate||"").localeCompare(String(a.closeDate||"")) || a.client.localeCompare(b.client,"pt-BR"));

          closedWonBySellerId[sid] = wonList;

          let fechadosMesValor = 0;
          for (const it of wonList){
            if (normYYYYMM(it.competence) === curYM) fechadosMesValor += it.opportunity;
          }

          const metaMes = getMeta(curYM, sid);
          const metaPct = metaMes > 0 ? (fechadosMesValor / metaMes) * 100 : 0;

          statsBySellerId[sid] = {
            andamentoQtd: items.length,
            andamentoValor,
            docsQtd,
            pagQtd,
            metaMes,
            metaPct
          };

          okCount++;
        }catch(e){
          failCount++;
          statsBySellerId[sid] = { andamentoQtd:0, andamentoValor:0, docsQtd:0, pagQtd:0, metaMes:getMeta(curYM, sid), metaPct:0 };
          inProgressBySellerId[sid] = [];
          closedWonBySellerId[sid] = [];
          $err.textContent += `\n[USER ${sid}] ${e?.message || e}\n`;
        }
      }, LOAD_CONCURRENCY);

      rebuildGlobalSearchIndex();
      renderAll();
      updateSorteioBar();

      $loadStatus.textContent = `Atualizado: ${okCount} ok / ${failCount} falhas`;
      $dotStatus.className = failCount ? "dot warn" : "dot";
    }catch(e){
      showError(e?.message || String(e));
    }finally{
      loading = false;
    }
  }

  /* ================= INIT ================= */
  injectProfessionalUI();
  ensureFooterBar();
  setThemeDarkOnly();
  loadAll();
  setInterval(loadAll, 600000);
})();
