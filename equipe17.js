/* eqd.js — GET • CGD CORRETORA (v5.0)
   ✅ Objetivo deste build:
   - Deixar CLARO onde está o “SALVAR” (marcadores: // ✅ SALVAR AQUI)
   - Nova Tarefa com Recorrência (salva regras no Bitrix e gera instâncias 45 dias)
   - Corrigir: instâncias recorrentes agora aplicam ETAPA / TIPO / URGÊNCIA / COLAB também
   - Painel geral + individual + multi seleção
   - Leads modal (mover etapa, OBS, follow-up)
   - Editar / Concluir / Excluir / Reagendar em lote
*/

(function () {
  // =========================
  // 1) CONFIG
  // =========================
  const PROXY_BASE = "https://cgd-bx-proxy.cgdseguros.workers.dev/bx/";
  const LOGO_URL =
    "https://bitrix24public.com/b24-6iyx5y.bitrix24.com.br/docs/pub/189eb7d8a5cc26250f61ee3c26e9f997/showFile?token=p11qbann0mhq";

  const INTRANET_URL = "https://cgdcorretora.bitrix24.site/";
  const VENDAS_URL = "https://cgdcorretorabase.bitrix24.site/vendas/";
  const FINANCEIRO_URL = "https://cgdcorretorabase.bitrix24.site/controlefinanceiro/";
  const SEGUROS_URL = "https://getcgdcorretora.bitrix24.site/seguros/";

  const REFRESH_MS = 45000;
  const LEADS_REFRESH_MS = 90 * 1000;

  const ADMIN_PINS = new Set(["4455", "6941", "6677", "4627"]);
  const CATEGORY_MAIN = 17;

  // ✅ RECORRÊNCIA (Bitrix)
  const RECURRENCE_STAGE_ID = "C17:UC_IUQR52"; // GET • RECORRÊNCIA
  const RECURRENCE_TITLE_PREFIX = "RECORRÊNCIA • ";
  const RECURRENCE_WINDOW_DAYS = 45;
  const RECURRENCE_MARKER_RE = /\[RUID=([^\]]+)\]/i;

  // USERS
  const USERS = [
    { name: "Manuela", userId: 813, team: "DELTA" },
    { name: "Maria Clara", userId: 841, team: "DELTA" },
    { name: "Beatriz", userId: 3387, team: "DELTA" },
    { name: "GEANA", userId: 4367, team: "DELTA" },
    { name: "Diogo", userId: 1, team: "DELTA" },

    { name: "Aline", userId: 15, team: "ALFA" },
    { name: "Adriana", userId: 19, team: "ALFA" },
    { name: "Andreyna", userId: 17, team: "ALFA" },
    { name: "Mariana", userId: 23, team: "ALFA" },
    { name: "Josiane", userId: 811, team: "ALFA" },
    { name: "Bruna Luisa", userId: 3081, team: "ALFA" },

    { name: "Livia Alves", userId: 3079, team: "BETA" },
    { name: "Fernanda Silva", userId: 3083, team: "BETA" },
    { name: "Nicolle Belmonte", userId: 3085, team: "BETA" },
    { name: "Anna Clara", userId: 3389, team: "BETA" },

    { name: "Gabriel", userId: 815, team: "ÔMEGA" },
    { name: "Amanda", userId: 269, team: "ÔMEGA" },
    { name: "Talita", userId: 29, team: "ÔMEGA" },
    { name: "Vivian", userId: 3101, team: "ÔMEGA" },
  ];

  const LEAD_USERS = new Set(USERS.map((u) => String(u.userId)));
  const SEGUROS_USERS = new Set(["815", "269", "29", "3101"]);
  const OMEGA_FOLLOWUP_USERS = new Set(["269", "3101", "29"]);

  const SPECIAL_PANEL_USERS = new Set([
    "3079", "3083", "3085", "3389",
    "1", "15", "19", "17", "23", "811", "3081",
  ]);

  const FOOTER_PARTNERS = [
    { userId: 27, label: "Sócio" },
    { userId: 1, label: "Sócio" },
    { userId: 15, label: "Sócio" },
  ];

  // UF Deals
  const UF_URGENCIA = "UF_CRM_1768174982";
  const UF_TAREFA = "UF_CRM_1768185018696";
  const UF_ETAPA = "UF_CRM_1768179977089";
  const UF_COLAB = "UF_CRM_1770327799";
  const UF_PRAZO = "UF_CRM_1768175087";
  const UF_OBS = "UF_CRM_691385BE7D33D";
  const DONE_STAGE_NAME = "CONCLUÍDO";

  // LEADS — campos
  const LEAD_UF_OPERADORA = "UF_CRM_1771282782";
  const LEAD_UF_IDADE = "UF_CRM_1771339221";
  const LEAD_UF_TELEFONE = "UF_CRM_1771282207";
  const LEAD_UF_BAIRRO = "UF_CRM_LEAD_1731909705398";
  const LEAD_UF_FONTE = "UF_CRM_1767285733843";
  const LEAD_UF_DATAHORA = "UF_CRM_1771333014";
  const LEAD_UF_OBS = "UF_CRM_LEAD_1762887033192";
  const LEAD_UF_ATENDIDO_DIA = "UF_CRM_1772411982";
  const DEAL_UF_LEAD_ORIGEM = "UF_CRM_1772572922";
  const LEAD_UF_LEAD_ORIGEM = "UF_CRM_1773012664";
  const LEAD_UF_HELENA = "UF_CRM_1772544689";
  const LEAD_UF_PESSOAL = "UF_CRM_1772560431";
  const LEAD_UF_POSSUI_PLANO = "UF_CRM_1773828388";
  const DEAL_UF_POSSUI_PLANO = "UF_CRM_1773828444";

  const BLOCKED_EXACT_DEAL_TITLES = new Set([
    "GERAR BOLETO | MARVINF 05.147.420/0001-19 Bradesco - Enviar para: Marcus Guimarães (MARVINF) +55 21 99601-1105",
  ]);

  // =========================
  // 2) BOOTSTRAP / CSS
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

  function hideSentinelIfAny() {
    const s = document.getElementById("eqd-sentinel");
    if (s) s.style.display = "none";
  }

  function injectCSS(cssText) {
    const id = "eqd-css-injected";
    if (document.getElementById(id)) return;
    const st = document.createElement("style");
    st.id = id;
    st.textContent = cssText;
    document.head.appendChild(st);
  }

  let EQD_BOOT_DONE = false;
  function errorToText(err) {
    try {
      if (!err) return "Erro desconhecido";
      if (typeof err === "string") return err;
      if (err && err.stack) return String(err.stack);
      if (err && err.message) return String(err.message);
      return String(err);
    } catch (_) { return "Erro desconhecido"; }
  }

  function showRuntimeWarn(err) {
    try {
      const root = ensureRoot();
      let box = document.getElementById("eqd-runtime-warn");
      if (!box) {
        box = document.createElement("div");
        box.id = "eqd-runtime-warn";
        box.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:999999;max-width:460px;background:#fff4e5;color:#111827;border:1px solid rgba(0,0,0,.12);border-radius:14px;padding:12px 14px;box-shadow:0 16px 40px rgba(0,0,0,.18);font:12px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial";
        root.appendChild(box);
      }
      const txt = errorToText(err);
      box.innerHTML = `<div style="font-weight:900;margin-bottom:4px">O painel encontrou um erro, mas foi mantido aberto.</div><div style="opacity:.85">${escHtml(txt).slice(0, 900)}</div>`;
      clearTimeout(box._hideTimer);
      box._hideTimer = setTimeout(() => { try { box.remove(); } catch (_) {} }, 12000);
    } catch (_) {}
  }

  function showFatal(err) {
    try {
      const txt = errorToText(err);
      const root = ensureRoot();
      root.innerHTML = `
        <div style="padding:14px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial">
          <div style="font-weight:950;font-size:14px;margin-bottom:8px">Falha ao carregar o painel</div>
          <pre style="white-space:pre-wrap;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:12px;padding:12px;max-width:1100px;overflow:auto">${escHtml(txt)}</pre>
          <div style="font-size:12px;opacity:.7;margin-top:8px">Abra o console (F12) para mais detalhes.</div>
        </div>
      `;
    } catch (_) {}
  }

  window.addEventListener("error", (e) => {
    const err = e && (e.error || e.message || e);
    try { console.error("[EQD][window.error]", err); } catch (_) {}
    const txt = errorToText(err);
    if (!EQD_BOOT_DONE) return showFatal(err);
    if (txt === "Script error.") return showRuntimeWarn("Erro externo/genérico detectado. O painel foi mantido aberto.");
    return showRuntimeWarn(err);
  });
  window.addEventListener("unhandledrejection", (e) => {
    const err = e && (e.reason || e);
    try { console.error("[EQD][unhandledrejection]", err); } catch (_) {}
    if (!EQD_BOOT_DONE) return showFatal(err);
    return showRuntimeWarn(err);
  });

  ensureRoot();
  hideSentinelIfAny();

  injectCSS(`
    #eqd-app{
      --bgA:#f7f3ff; --bgB:#f3fbff; --bgC:#fff7fb;
      --border: rgba(30,40,70,.12);
      --text: rgba(18,26,40,.92);
      --muted: rgba(18,26,40,.60);

      min-height: 100vh;
      padding: 14px;
      padding-bottom: 122px;
      font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial;
      color: var(--text);

      background:
        radial-gradient(900px 600px at 15% 20%, rgba(176,140,255,.25), transparent 55%),
        radial-gradient(900px 600px at 85% 20%, rgba(120,210,255,.25), transparent 55%),
        radial-gradient(900px 650px at 55% 95%, rgba(255,150,200,.18), transparent 60%),
        linear-gradient(135deg, var(--bgA), var(--bgB) 50%, var(--bgC));
    }

    .eqd-topbar{
      display:grid;grid-template-columns:1fr;gap:4px;
      margin-bottom:8px;
      background:#14161a;border:1px solid rgba(255,255,255,.08);
      padding:3px 8px;border-radius:16px;
    }
    .eqd-titleWrap{display:flex;align-items:center;gap:8px;min-width:0;}
    .eqd-logo{width:52px;height:52px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.92);object-fit:cover;padding:0;flex:0 0 auto;transform:scale(1.08);}
    .eqd-titleBlock{display:flex;flex-direction:column;gap:0;}
    .eqd-title{display:flex;align-items:center;gap:7px;font-weight:950;font-size:14px;line-height:1;color:#fff;}
    .eqd-dot{width:10px;height:10px;border-radius:999px;background:#16a34a;box-shadow:0 0 0 5px rgba(22,163,74,.12);}
    .eqd-meta{font-size:10px;line-height:1.05;color:rgba(255,255,255,.75);font-weight:800;}

    .eqd-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-start;width:100%;padding-left:0;}
    .eqd-pill{font-size:10px;line-height:1;font-weight:900;padding:4px 8px;min-height:26px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.12);color:#fff;white-space:nowrap;display:inline-flex;align-items:center;}
    .eqd-btn{border:1px solid rgba(255,255,255,.22);background:#1f2430;border-radius:999px;padding:4px 9px;min-height:26px;font-size:10px;line-height:1;font-weight:950;cursor:pointer;white-space:nowrap;color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:5px;box-shadow:0 2px 8px rgba(0,0,0,.16);}
    .eqd-btnPrimary{background:#4c3fda;border-color:#4c3fda;color:#fff;}
    .eqd-btnDanger{background:#b42318;border-color:#b42318;color:#fff;}

    #eqd-app:not(.eqd-dark) .eqd-btn{background:#1f2430;border-color:#1f2430;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.08);}
    #eqd-app:not(.eqd-dark) .eqd-btnPrimary{background:#4c3fda;border-color:#4c3fda;color:#fff;}
    #eqd-app:not(.eqd-dark) .eqd-btnDanger{background:#b42318;border-color:#b42318;color:#fff;}
    #eqd-app:not(.eqd-dark) .eqd-smallBtn{background:#eef2ff;border-color:rgba(31,36,48,.18);color:#111;}
    #eqd-app:not(.eqd-dark) .eqd-smallBtnPrimary{background:#dcfce7;border-color:rgba(22,163,74,.30);color:#14532d;}
    #eqd-app:not(.eqd-dark) .eqd-smallBtnDanger{background:#fee2e2;border-color:rgba(220,38,38,.30);color:#7f1d1d;}

    .eqd-searchWrap{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-start;}
    .eqd-searchInput{width:min(320px,48vw);border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.10);border-radius:999px;padding:5px 9px;min-height:26px;font-size:10px;font-weight:900;outline:none;color:#fff;}
    .eqd-searchInput::placeholder{color:rgba(255,255,255,.70)}
    .eqd-searchSelect{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.10);border-radius:999px;padding:4px 8px;min-height:26px;font-size:10px;font-weight:950;outline:none;min-width:170px;color:#fff;}
    .eqd-searchSelect option{color:#111;background:#fff;}
    .eqd-viewToggle{min-width:88px;justify-content:center}
    .eqd-listWrap{display:flex;flex-direction:column;gap:10px}
    .eqd-listRow{border:1px solid rgba(30,40,70,.12);border-radius:16px;background:rgba(255,255,255,.68);padding:10px;display:grid;grid-template-columns:minmax(180px,2fr) minmax(120px,1fr) minmax(140px,1.1fr) minmax(280px,2fr) auto;gap:10px;align-items:center}
    .eqd-listTitle{font-weight:950;font-size:13px;line-height:1.2}
    .eqd-listMeta{font-size:11px;font-weight:900;opacity:.82;display:flex;gap:8px;flex-wrap:wrap}
    .eqd-listActions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
    @media (max-width:980px){.eqd-listRow{grid-template-columns:1fr}.eqd-listActions{justify-content:flex-start}}

    #eqd-app.eqd-dark{
      --bgA:#1b1f25; --bgB:#171b20; --bgC:#1b1f25;
      --border: rgba(255,255,255,.10);
      --text: #fff;
      --muted: rgba(255,255,255,.78);
      background:
        radial-gradient(900px 620px at 18% 18%, rgba(120,90,255,.14), transparent 60%),
        radial-gradient(900px 620px at 82% 18%, rgba(80,170,255,.12), transparent 60%),
        linear-gradient(135deg, #14181d, #1b1f25);
    }

    .userGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;align-items:stretch;}
    @media (max-width:1200px){.userGrid{grid-template-columns:repeat(2,minmax(220px,1fr));}}
    @media (max-width:720px){.userGrid{grid-template-columns:1fr;}}

    .userCard{
      border:1px solid rgba(30,40,70,.12);
      border-radius:18px;
      background:rgba(255,255,255,.52);
      backdrop-filter: blur(12px);
      padding:10px;
      cursor:pointer;
      transition: transform .08s ease, box-shadow .08s ease;
      display:flex;gap:10px;align-items:center;
      min-width:0;
      overflow:hidden;
    }
    .userCard:hover{transform:translateY(-1px);box-shadow:0 10px 22px rgba(20,25,35,.10);}

    .userInfoLeft{display:flex;flex-direction:column;gap:5px;min-width:0;flex:0 1 124px;}
    .userName{font-weight:950;font-size:14px;text-transform:uppercase;}
    .userTeam{font-size:11px;font-weight:900;opacity:.70;margin-top:-4px;}

    .userPhotoWrap{flex:0 0 auto;display:flex;align-items:center;justify-content:center;}
    .userPhoto{
      width:90px;height:90px;border-radius:999px;
      border:1px solid rgba(30,40,70,.14);
      background:rgba(255,255,255,.92);
      object-fit:cover;
    }

    .userRight{margin-left:auto;display:flex;flex-direction:column;gap:5px;align-items:flex-end;min-width:0;max-width:132px;flex:0 1 132px;}
    .userEmoji{font-size:18px;}
    .userLine{font-size:11px;font-weight:950;opacity:.90;white-space:normal;line-height:1.15;text-align:right;word-break:break-word}

    #eqd-app.eqd-dark .userCard{background:#f3f1eb;border-color:rgba(0,0,0,.12);color:#111827;}
    #eqd-app.eqd-dark .userName, #eqd-app.eqd-dark .userTeam, #eqd-app.eqd-dark .userLine, #eqd-app.eqd-dark .userEmoji{color:#111827;}
    #eqd-app.eqd-dark .userPhoto{background:#fbfaf7;border-color:rgba(0,0,0,.12);}

    .panelHead{
      display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;
      margin-bottom:8px;
      padding:6px 8px;border-radius:16px;border:1px solid var(--border);
      background:rgba(255,255,255,.55);backdrop-filter:blur(10px);
    }
    #eqd-app.eqd-dark .panelHead{background:rgba(255,255,255,.06);}
    .panelUserInfo{display:flex;align-items:center;gap:10px;}
    .panelUserPhoto{width:48px;height:48px;border-radius:999px;border:1px solid rgba(30,40,70,.14);object-fit:cover;background:rgba(255,255,255,.9);}
    #eqd-app.eqd-dark .panelUserPhoto{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.14);}
    .panelUserName{font-weight:950;font-size:13px;line-height:1;text-transform:uppercase;}
    .panelUserTeam{font-size:10px;line-height:1;font-weight:900;opacity:.70;margin-top:2px;}

    .panelTools{display:flex;gap:4px;row-gap:4px;flex-wrap:wrap;align-items:center;justify-content:flex-end;flex:1 1 auto;max-width:66%;}
    .panelToolsUser1{justify-content:flex-start;max-width:78%;gap:6px;row-gap:6px;}
    .panelToolsUser1 .eqd-searchInput{width:min(220px,42vw);}

    #eqd-app:not(.eqd-dark) .panelTools .eqd-btn{background:#111827;border-color:#111827;color:#fff;}
    #eqd-app:not(.eqd-dark) .panelTools .eqd-btnPrimary{background:#4338ca;border-color:#4338ca;color:#fff;}
    #eqd-app:not(.eqd-dark) .panelTools .eqd-btnDanger{background:#991b1b;border-color:#991b1b;color:#fff;}

    #eqd-app:not(.eqd-dark) .panelTools .eqd-searchInput{
      background:rgba(255,255,255,.92);
      border-color:rgba(0,0,0,.18);
      color:#111;
    }
    #eqd-app:not(.eqd-dark) .panelTools .eqd-searchInput::placeholder{color:rgba(0,0,0,.55)}
    .panelTools .eqd-searchInput{width:min(280px,48vw);}

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
    .panelColHead{padding:10px 12px;border-bottom:1px solid var(--border);font-weight:950;font-size:12px;opacity:1;height:auto;}
    .panelColBody{padding:10px;display:flex;flex-direction:column;gap:8px;overflow:auto;}

    .eqd-modalOverlay{position:fixed;inset:0;background:rgba(10,14,22,.35);backdrop-filter:blur(6px);display:none;align-items:center;justify-content:center;padding:16px;z-index:99999;}
    .eqd-modal{
      width:min(920px,96vw);
      max-height:86vh;
      border-radius:18px;border:1px solid rgba(255,255,255,.35);
      background:rgba(255,255,255,.78);
      box-shadow:0 20px 60px rgba(10,14,22,.25);
      overflow:hidden;display:flex;flex-direction:column;
    }
    .eqd-modal.wide{width:min(1280px,98vw);max-height:92vh;}
    .eqd-modal.full{width:calc(100vw - 24px);max-width:none;max-height:calc(100vh - 24px);}
    #eqd-app.eqd-dark .eqd-modal{background:rgba(25,28,34,.92);border-color:rgba(255,255,255,.10);color:var(--text);}
    .eqd-modalHead{padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px solid rgba(30,40,70,.12);background:rgba(255,255,255,.82);}
    #eqd-app.eqd-dark .eqd-modalHead{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.10);}
    .eqd-modalTitle{font-size:12px;font-weight:950;text-transform:uppercase;}
    .eqd-modalClose{border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.90);border-radius:999px;padding:6px 10px;font-size:12px;font-weight:900;cursor:pointer;}
    #eqd-app.eqd-dark .eqd-modalClose{background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.12);color:var(--text);}
    .eqd-modalBody{padding:12px 14px;overflow:auto;display:flex;flex-direction:column;gap:10px;}
    .eqd-warn{border:1px solid rgba(255,80,120,.28);background:rgba(255,220,235,.55);color:rgba(120,0,40,.92);padding:10px 12px;border-radius:14px;font-size:11px;font-weight:900;white-space:pre-wrap;display:none;}

    .eqd-card{--accent-rgb:140,160,240;position:relative;border-radius:16px;border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.82);overflow:hidden;box-shadow:0 8px 18px rgba(20,25,35,.08),0 10px 26px rgba(var(--accent-rgb),.10);flex:0 0 auto;color:rgba(18,26,40,.92);}
    #eqd-app.eqd-dark .eqd-card{background:#f3f1eb;border-color:rgba(0,0,0,.12);color:rgba(18,26,40,.92);}
    .eqd-bar{height:6px;background:rgb(var(--accent-rgb));}
    .eqd-inner{padding:9px 10px;display:flex;flex-direction:column;gap:6px;}
    .eqd-task{font-size:13px;font-weight:950;line-height:1.15;}
    .eqd-obsLine{font-size:11px;font-weight:900;opacity:.78;white-space:pre-wrap}
    .eqd-tags{display:flex;gap:6px;flex-wrap:wrap;align-items:center;}
    .eqd-tag{font-size:10.5px;padding:2px 7px;border-radius:999px;border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.78);color:rgba(18,26,40,.72);white-space:nowrap;}
    .eqd-tagLate{border-color:rgba(255,80,120,.55);background:rgba(255,80,120,.22);font-weight:950;color:rgba(130,0,50,.95);animation:eqdBlink 1.6s ease-in-out infinite;}
    .eqd-tagUrg{border-color:rgba(255,45,70,.55);background:rgba(255,45,70,.18);font-weight:950;color:rgba(140,0,20,.98);animation:eqdBlinkUrg 1.05s ease-in-out infinite;}
    @keyframes eqdBlink{0%,100%{opacity:1}50%{opacity:.55}}
    @keyframes eqdBlinkUrg{0%,100%{opacity:1}50%{opacity:.35}}
    .eqd-tagObs{border-color:rgba(255,180,0,.55);background:rgba(255,200,0,.22);font-weight:950;color:rgba(120,70,0,.95);animation:eqdBlinkObs .95s ease-in-out infinite;cursor:pointer;}
    .eqd-tagObsMuted{border-color:rgba(107,114,128,.24);background:rgba(107,114,128,.12);font-weight:900;color:#4b5563;cursor:pointer;}
    @keyframes eqdBlinkObs{0%,100%{opacity:1}50%{opacity:.35}}

    .eqd-tagClickable{cursor:pointer;user-select:none}
    .eqd-tagClickable:hover{filter:saturate(1.1);transform:translateY(-.5px)}
    .eqd-etapaRunDot{display:inline-block;width:8px;height:8px;border-radius:999px;background:#16a34a;box-shadow:0 0 0 4px rgba(22,163,74,.15);margin-right:6px;vertical-align:middle;animation:eqdBlinkUrg 1.05s ease-in-out infinite;}

    .eqd-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:2px;font-size:10.5px;color:rgba(18,26,40,.66);}
    .eqd-cardActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;}
    .eqd-smallBtn{cursor:pointer;border:1px solid rgba(17,24,39,.18);background:#ffffff;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:950;color:#111827;}
    .eqd-smallBtnPrimary{background:#dcfce7;border-color:#16a34a;color:#14532d;}
    .eqd-smallBtnDanger{background:#fee2e2;border-color:#dc2626;color:#7f1d1d;}
    .eqd-empty{border:1px dashed rgba(30,40,70,.18);border-radius:16px;padding:12px;background:rgba(255,255,255,.55);color:rgba(18,26,40,.62);font-size:11px;font-weight:800;text-align:center;}

    .leadCard{border:1px solid rgba(30,40,70,.12);border-radius:16px;background:rgba(255,255,255,.80);padding:10px;display:flex;flex-direction:column;gap:6px}
    #eqd-app.eqd-dark .leadCard{background:#f3f1eb;border-color:rgba(0,0,0,.12);color:#111;}
    .leadTitle{font-size:13px;font-weight:950}
    .leadMeta{font-size:11px;font-weight:900;opacity:.75;display:flex;gap:10px;flex-wrap:wrap}
    .leadBtns{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
    .leadBtn{cursor:pointer;border:1px solid rgba(17,24,39,.18);background:#ffffff;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:950;color:#111827}
    .leadBtnP{background:#dcfce7;border-color:#16a34a;color:#14532d}
    .leadBtnD{background:#fee2e2;border-color:#dc2626;color:#7f1d1d}

    #eqd-app.eqd-dark .eqd-card .eqd-task,
    #eqd-app.eqd-dark .eqd-card .eqd-obsLine,
    #eqd-app.eqd-dark .eqd-card .eqd-foot,
    #eqd-app.eqd-dark .eqd-card .eqd-foot strong,
    #eqd-app.eqd-dark .eqd-card .eqd-meta,
    #eqd-app.eqd-dark .eqd-card .eqd-meta strong,
    #eqd-app.eqd-dark .leadCard .leadTitle,
    #eqd-app.eqd-dark .leadCard .leadMeta,
    #eqd-app.eqd-dark .leadCard .leadMeta strong,
    #eqd-app.eqd-dark .eqd-empty{
      color:#111827;
    }
    #eqd-app.eqd-dark .eqd-tag{color:rgba(18,26,40,.78);background:rgba(255,255,255,.78);border-color:rgba(30,40,70,.14);}
    #eqd-app.eqd-dark .eqd-modal .eqd-card,
    #eqd-app.eqd-dark .eqd-modal .leadCard,
    #eqd-app.eqd-dark .eqd-modal .eqd-empty{
      color:#111827;
    }
    .leadObsChip{
      cursor:pointer;
      border:1px solid rgba(30,40,70,.14);
      border-radius:999px;
      padding:5px 9px;
      font-size:11px;
      font-weight:950;
      display:inline-flex;
      align-items:center;
      gap:8px;
      user-select:none;
    }
    .leadObsChip.off{background:rgba(170,170,170,.20);border-color:rgba(170,170,170,.45);color:rgba(0,0,0,.70);}
    .leadObsChip.on{background:rgba(255,180,0,.22);border-color:rgba(255,180,0,.55);color:rgba(120,70,0,.95);}
    .leadObsChip b{font-weight:950}

    .blinkRedBorder{
      border-color: rgba(255,45,70,.85) !important;
      box-shadow: 0 0 0 2px rgba(255,45,70,.55) inset;
      animation: blinkBorderRed .9s ease-in-out infinite;
    }
    .blinkGreenFull{
      background:#00ff66 !important;
      color:#111 !important;
      border-color:#00cc55 !important;
      animation: blinkGreenFullAnim .8s ease-in-out infinite;
    }
    .blinkOrangeFull{
      background:#f59e0b !important;
      color:#111 !important;
      border-color:#d97706 !important;
      animation: blinkOrangeFullAnim .8s ease-in-out infinite;
    }
    .eqd-navArrow{font-size:20px;padding:8px 16px;min-width:52px;justify-content:center;background:#312e81;border-color:#4c3fda;color:#fff;box-shadow:0 4px 12px rgba(76,63,218,.28);font-weight:950;}
    @keyframes blinkBorderRed{0%,100%{filter:saturate(1)}50%{filter:saturate(1.6)}}
    @keyframes blinkGreenFullAnim{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18)}}
    @keyframes blinkOrangeFullAnim{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18)}}

    .calWrap{display:flex;flex-direction:column;gap:10px}
    .calHead{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
    .calTitle{font-weight:950}
    .calNav{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
    .calGrid{display:grid;grid-template-columns:repeat(7, minmax(0,1fr));gap:8px}
    .calDow{font-size:11px;font-weight:950;opacity:.75;text-align:center}
    .calCell{
      border:1px solid rgba(30,40,70,.14);
      border-radius:12px;
      padding:10px 0;
      text-align:center;
      font-weight:950;
      cursor:pointer;
      background:rgba(255,255,255,.70);
      user-select:none;
    }
    #eqd-app.eqd-dark .calCell{background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.14)}
    .calCell.off{opacity:.35}
    .calCell.today{box-shadow:0 0 0 2px rgba(22,163,74,.35) inset}
    .calCell.sel{box-shadow:0 0 0 2px rgba(120,90,255,.55) inset}

    .eqd-footer{
      position:fixed;left:0;right:0;bottom:0;
      z-index:9999;
      background:rgba(20,22,26,.92);
      color:rgba(255,255,255,.84);
      border-top:1px solid rgba(255,255,255,.10);
      padding:5px 10px;
      display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;
      font-size:10px;
      font-weight:850;
      backdrop-filter: blur(10px);
    }
    .eqd-footerLeft{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .eqd-footerPeople{display:flex;gap:6px;align-items:center}
    .eqd-footAvatar{
      width:24px;height:24px;border-radius:999px;object-fit:cover;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(255,255,255,.10);
    }
    .eqd-footerBlock{display:flex;flex-direction:column;gap:2px;line-height:1.1}
    .eqd-footerRight{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap}
    .eqd-footerMiniTitle{font-weight:950;color:#fff;opacity:.92}
    .eqd-footerDim{opacity:.72}

    .eqd-footerCenter{
      flex: 1 1 auto;
      text-align:center;
      font-style: italic;
      opacity:.86;
      font-weight:900;
      letter-spacing:.2px;
      line-height:1;
      white-space:nowrap;
    }
    @media (max-width:900px){
      .eqd-footerCenter{order: 5; width:100%; text-align:center;}
      .eqd-topbar{padding:4px 8px;}
      .eqd-actions{padding-left:0;}
    }
    @media (orientation: landscape) and (max-width: 1024px){
      .eqd-footer{display:none !important;visibility:hidden !important;opacity:0 !important;pointer-events:none !important;height:0 !important;min-height:0 !important;padding:0 !important;border:0 !important;overflow:hidden !important;}
      #eqd-app{padding-bottom:12px !important;}
    }
  `);

  // =========================
  // 3) HELPERS / BX
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

  const BX_MAX_CONCURRENCY = 3;
  let BX_INFLIGHT = 0;
  let BX_COOLDOWN_UNTIL = 0;
  const BX_WAITERS = [];

  async function bxAcquireSlot() {
    if (BX_INFLIGHT < BX_MAX_CONCURRENCY) {
      BX_INFLIGHT++;
      return;
    }
    await new Promise((resolve) => BX_WAITERS.push(resolve));
    BX_INFLIGHT++;
  }
  function bxReleaseSlot() {
    BX_INFLIGHT = Math.max(0, BX_INFLIGHT - 1);
    const next = BX_WAITERS.shift();
    if (next) next();
  }

  async function bxRaw(method, params = {}) {
    await bxAcquireSlot();
    try {
      const pairs = toPairs("", params, []);
      const body = new URLSearchParams();
      for (const [k, v] of pairs) { if (k) body.append(k, v); }

      const maxTry = 5;
      let lastErr = null;

      for (let attempt = 1; attempt <= maxTry; attempt++) {
        try {
          const now = Date.now();
          if (BX_COOLDOWN_UNTIL > now) await sleep(BX_COOLDOWN_UNTIL - now);

          if (attempt > 1) {
            const base = 600 * Math.pow(2, attempt - 2);
            const jitter = Math.floor(Math.random() * 420);
            await sleep(base + jitter);
          }

          const resp = await fetchWithTimeout(
            PROXY_BASE + method,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
              body,
            },
            22000
          );

          if ([429, 502, 503, 504].includes(resp.status)) {
            BX_COOLDOWN_UNTIL = Date.now() + (resp.status === 503 ? 5000 : 3000);
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
      bxReleaseSlot();
    }
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
  // 4) UTILS
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
    const yy = x.getFullYear();
    const hh = String(x.getHours()).padStart(2, "0");
    const mi = String(x.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yy} ${hh}:${mi}`;
  }
  function nowLocalStamp() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }
  function isBlockedExactDealTitle(title) {
    return BLOCKED_EXACT_DEAL_TITLES.has(String(title || "").trim());
  }
  function fmtDateOnly(d) {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }
  function dayStart(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0); }
  function dayEnd(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); }

  function selectedDateIsFuture() {
    return dayStart(selectedDate).getTime() > dayStart(new Date()).getTime();
  }

  function localInputToIsoWithOffset(v) {
    v = String(v || "").trim();
    if (!v) return "";
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

  function isoFromDateAndTimeParts(dateObj, hh, mm) {
    const pad = (n) => String(n).padStart(2, "0");
    const y = dateObj.getFullYear();
    const m = pad(dateObj.getMonth() + 1);
    const d = pad(dateObj.getDate());
    const offMin = -dateObj.getTimezoneOffset();
    const sign = offMin >= 0 ? "+" : "-";
    const abs = Math.abs(offMin);
    const oh = pad(Math.floor(abs / 60));
    const om = pad(abs % 60);
    return `${y}-${m}-${d}T${pad(hh)}:${pad(mm)}:00${sign}${oh}:${om}`;
  }

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

  function dealAccent(deal) {
    const seed = String(deal.ID || deal.TITLE || "Tarefa");
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
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

  // ✅ locks (evita clique duplo / “salvar 2x”)
  const ACTION_LOCKS = new Set();
  function lockKey(k){ return String(k||""); }
  function lockTry(k){ k=lockKey(k); if(!k) return false; if(ACTION_LOCKS.has(k)) return false; ACTION_LOCKS.add(k); return true; }
  function lockRelease(k){ k=lockKey(k); if(!k) return; ACTION_LOCKS.delete(k); }

  // ✅ contexto LEADS (pra voltar)
  const LAST_LEADS_CTX = { userId: "", kw: "", dateFilter: "", operFilter: "" };
  function setLeadsCtx(userId, kw, extra){ LAST_LEADS_CTX.userId = String(userId||""); LAST_LEADS_CTX.kw = String(kw||""); LAST_LEADS_CTX.dateFilter = String((extra && extra.dateFilter) || ""); LAST_LEADS_CTX.operFilter = String((extra && extra.operFilter) || ""); }
  function reopenLeadsModalSafe(opts) {
    if (!LAST_LEADS_CTX.userId) return;
    openLeadsModalForUser(LAST_LEADS_CTX.userId, LAST_LEADS_CTX.kw || "", { useCache: true, noBackgroundReload: true, dateFilter: LAST_LEADS_CTX.dateFilter || '', operFilter: LAST_LEADS_CTX.operFilter || '', ...(opts || {}) });
  }



  function isBlockedDealTitle(title) {
    return /neg[oó]cio\s*#?7259/i.test(String(title || '').trim());
  }

  function mktEmojiForType(txt) {
    const n = norm(String(txt || ''));
    if (n.includes('GRAVACAO')) return '🎥';
    if (n.includes('REUNIAO')) return '👥';
    if (n.includes('ROTEIRO')) return '📓';
    if (n.includes('EDICAO DE VIDEO')) return '📱';
    if (n.includes('FOTOGRAFIA')) return '📷';
    if (n.includes('PAUTA')) return '🖊️';
    if (n.includes('OUTROS')) return '📌';
    return '';
  }
  // =========================
  // 5) AUTH / SENHAS
  // =========================
  function askPin() {
    return new Promise((resolve) => {
      openModal("Acesso", `
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="font-size:12px;font-weight:900;opacity:.85">Digite a senha de acesso.</div>
          <input id="pinInputSecure" type="password" autocomplete="off" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="Senha" />
          <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
            <button class="eqd-btn" id="pinCancel">Cancelar</button>
            <button class="eqd-btn eqd-btnPrimary" id="pinOk">Entrar</button>
          </div>
        </div>
      `);
      const inp = document.getElementById("pinInputSecure");
      const finish = (val) => { try{ closeModal(); }catch(_){ } resolve(String(val||"").trim()); };
      document.getElementById("pinCancel").onclick = () => finish("");
      document.getElementById("pinOk").onclick = () => finish(inp ? inp.value : "");
      if (inp) { inp.focus(); inp.onkeydown = (e) => { if (e.key === "Enter") finish(inp.value); if (e.key === "Escape") finish(""); }; }
    });
  }
  function isAdmin(pin) { return ADMIN_PINS.has(String(pin || "").trim()); }
  async function canOpenUserPanel(userId) {
    const pin = await askPin();
    if (!pin) return false;
    if (isAdmin(pin)) return true;
    return pin === String(userId);
  }

  // =========================
  // 6) STATE / ENUMS / STAGES / USERS
  // =========================
  const STATE = {
    dealsAll: [],
    dealsOpen: [],
    doneStageId: null,
    todoStageId: null,
    stageMapByName: new Map(),
    enumCache: new Map(),
    dealFieldsMeta: null,

    userPhotoById: new Map(),
    userNameById: new Map(),

    lastOkAt: null,
    offline: false,

    // leads
    leadStageIdByName: new Map(),
    leadStageNameById: new Map(),
    leadsByUser: new Map(),
    leadsAtendimentoIdsByUser: new Map(),
    leadsAlertUsers: new Set(),

    footerPhotosLoaded: false,

    // recorrência
    recurConfigDealIdByUser: new Map(),
    recurRulesByUser: new Map(),
    recurLastGenAt: 0,

    lastDealsSyncAt: "",
    lastFullDealsSyncAt: 0,
    globalLeadsLoadedAt: 0,
    globalLeadsAll: [],
    viewModeByUser: new Map(),
    playedLeadAlertByUser: new Map(),
    loadingLeadsByUser: new Set(),
    dealsLoadedMode: "full",
  };

  function setUserDealViewMode(userId, mode){
    const v = String(mode || "CARD").toUpperCase() === "LIST" ? "LIST" : "CARD";
    STATE.viewModeByUser.set(String(userId||""), v);
    try { localStorage.setItem(`EQD_VIEWMODE_${String(userId||"")}`, v); } catch(_) {}
  }
  function getUserDealViewMode(userId){
    const k = String(userId || "");
    if (!STATE.viewModeByUser.has(k)) {
      let saved = "CARD";
      try { saved = localStorage.getItem(`EQD_VIEWMODE_${k}`) || "CARD"; } catch(_) {}
      STATE.viewModeByUser.set(k, saved === "LIST" ? "LIST" : "CARD");
    }
    return STATE.viewModeByUser.get(k) || "CARD";
  }

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
    for (const [id, label] of entries) if (norm(label) === wantedLabelNorm) return id;
    for (const [id, label] of entries) if (norm(label).includes(wantedLabelNorm)) return id;
    return "";
  }

  async function loadStagesForCategory(categoryId) {
    const cid = Number(categoryId);
    const stages = await bx("crm.dealcategory.stage.list", { id: cid });
    const stageMapByName = new Map();
    let doneStageId = null;
    let todoStageId = null;

    (stages || []).forEach((s, idx) => {
      const stageNameNorm = norm(s.NAME);
      const statusId = String(s.STATUS_ID);
      stageMapByName.set(stageNameNorm, statusId);
      if (!todoStageId && idx === 0) todoStageId = statusId;
      if (stageNameNorm.includes(norm(DONE_STAGE_NAME))) doneStageId = statusId;
    });

    STATE.stageMapByName = stageMapByName;
    STATE.doneStageId = doneStageId;
    STATE.todoStageId = todoStageId;
  }

  async function stageIdForUserName(userName) {
    const exact = STATE.stageMapByName.get(norm(userName));
    if (exact) return exact;
    for (const [k, v] of STATE.stageMapByName.entries()) {
      if (k.includes(norm(userName)) || norm(userName).includes(k)) return v;
    }
    return null;
  }
  async function stageIdForAssignedUser(userId) {
    const user = USERS.find((u) => String(u.userId) === String(userId));
    if (user && user.name) {
      const byName = await stageIdForUserName(user.name);
      if (byName) return String(byName);
    }
    return String(STATE.todoStageId || "");
  }

  function normalizeCompareValue(v) {
    if (v === null || v === undefined) return "";
    if (Array.isArray(v)) return v.map(normalizeCompareValue).join("|");
    return String(v).trim();
  }

  function dealFieldsMatchRequested(deal, fields) {
    const src = deal || {};
    const wanted = fields || {};
    return Object.keys(wanted).every((k) => normalizeCompareValue(src[k]) === normalizeCompareValue(wanted[k]));
  }

  async function safeDealUpdate(dealId, fields) {
    try {
      return await bx("crm.deal.update", { id: String(dealId), fields });
    } catch (e) {
      const msg = String((e && e.message) || e || "");
      if (!/HTTP 400\s+em\s+crm\.deal\.update/i.test(msg)) throw e;
      try {
        const fresh = await bx("crm.deal.get", { id: String(dealId) });
        if (dealFieldsMatchRequested(fresh, fields)) return true;
      } catch (_) {}
      throw e;
    }
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
  // 7) DEALS PARSE
  // =========================
  function parseDeal(deal, maps) {
    const { urgMap, tarefaMap, etapaMap, colabMap, colabIsEnum } = maps;
    if (!deal || isBlockedExactDealTitle(deal.TITLE)) return null;

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
    if (colabId) colabTxt = colabIsEnum ? String((colabMap || {})[colabId] || colabId).trim() : colabId;

    const obsTxt = String(deal[UF_OBS] || "").trim();
    const hasObs = !!obsTxt;

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
  // 8) LEADS STAGES (lazy)
  // =========================
  async function loadLeadStages() {
    if (STATE.leadStageIdByName && STATE.leadStageIdByName.size) return;
    const list = await bxAll("crm.status.list", { filter: { ENTITY_ID: "STATUS" } });
    const mapByName = new Map();
    const mapNameById = new Map();
    (list || []).forEach((s) => {
      if (!s || !s.STATUS_ID) return;
      mapByName.set(norm(s.NAME), String(s.STATUS_ID));
      mapNameById.set(String(s.STATUS_ID), String(s.NAME || ""));
    });
    STATE.leadStageIdByName = mapByName;
    STATE.leadStageNameById = mapNameById;
  }
  function leadStageId(name) { return STATE.leadStageIdByName.get(norm(name)) || ""; }
  function leadStageNameById(id) { return STATE.leadStageNameById.get(String(id || "")) || ""; }
  function lostLeadStageIds() { return [leadStageId("LEAD DESCARTADO"), leadStageId("PERDIDO"), leadStageId("LEAD PERDIDO")].filter(Boolean); }
  function convertedLeadStageIds() { return [leadStageId("LEAD CONVERTIDO"), leadStageId("CONVERTIDO")].filter(Boolean); }
  function isLostLead(lead) { return lostLeadStageIds().includes(String((lead && lead.STATUS_ID) || "")); }
  function isConvertedLead(lead) { return convertedLeadStageIds().includes(String((lead && lead.STATUS_ID) || "")); }
  function leadOwnsUser(lead, uid) { return String((lead && (lead.ASSIGNED_BY_ID || lead._ownerUserId)) || "") === String(uid || ""); }

  function leadTitle(lead) {
    const t = String(lead.TITLE || "").trim();
    const n = [lead.NAME, lead.LAST_NAME].filter(Boolean).join(" ").trim();
    return bestTitleFromText(t || n || `Lead`);
  }
  function leadOperadora(lead) { return String((lead && lead[LEAD_UF_OPERADORA]) || "").trim(); }
  function leadIdade(lead) { return String((lead && lead[LEAD_UF_IDADE]) || "").trim(); }
  function leadTelefone(lead) { return String((lead && lead[LEAD_UF_TELEFONE]) || "").trim(); }
  function leadBairro(lead) { return String((lead && lead[LEAD_UF_BAIRRO]) || "").trim(); }
  function leadFonte(lead) { return String((lead && lead[LEAD_UF_FONTE]) || "").trim(); }
  function leadDataHora(lead) { return String((lead && lead[LEAD_UF_DATAHORA]) || lead.DATE_CREATE || "").trim(); }
  function leadDateOnly(lead) {
    const dt = tryParseDateAny(leadDataHora(lead));
    if (!dt) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const d = String(dt.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  function leadObs(lead) { return String((lead && lead[LEAD_UF_OBS]) || "").trim(); }
  function leadOrigemId(lead) { return String((lead && (lead[LEAD_UF_LEAD_ORIGEM] || lead.ID)) || "").trim(); }
  function leadHelena(lead) { return String((lead && lead[LEAD_UF_HELENA]) || "").trim(); }
  function leadPessoal(lead) { return String((lead && lead[LEAD_UF_PESSOAL]) || "").trim(); }
  function leadPossuiPlano(lead) {
    const v = String((lead && lead[LEAD_UF_POSSUI_PLANO]) || "").trim();
    if (!v) return "";
    const n = norm(v);
    if (["Y","1","SIM"].includes(n)) return "SIM";
    if (["N","0","NAO","NÃO"].includes(n)) return "NÃO";
    return v;
  }
  function leadAgeDays(lead) {
    const dt = tryParseDateAny((lead && lead.DATE_CREATE) || leadDataHora(lead));
    if (!dt) return 0;
    return Math.max(0, Math.floor((Date.now() - dt.getTime()) / 86400000));
  }

  function tryParseDateAny(v) {
    const s = String(v || "").trim();
    if (!s) return null;
    let m = s.match(/^(\d{2})\/(\d{2})\/(\d{2,4})(?:[ T](\d{2}):(\d{2}))?$/);
    if (m) {
      let yy = Number(m[3]);
      if (yy < 100) yy += 2000;
      const d = new Date(yy, Number(m[2]) - 1, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0), 0, 0);
      if (!Number.isNaN(d.getTime())) return d;
    }
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (m) {
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0), 0);
      if (!Number.isNaN(d.getTime())) return d;
    }
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;
    return null;
  }

  function parseFlexDate(v) { return tryParseDateAny(v); }
  async function confirmWeekendModal(isoOrDate, label) {
    const d = isoOrDate instanceof Date ? isoOrDate : tryParseDateAny(isoOrDate);
    if (!d || Number.isNaN(d.getTime())) return true;
    const w = d.getDay();
    if (w !== 0 && w !== 6) return true;
    return await new Promise((resolve) => {
      openModal("Confirmar final de semana", `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="font-size:14px;font-weight:950">Tem certeza que deseja agendar ${escHtml(label || "este item")} para final de semana?</div>
          <div style="font-size:12px;font-weight:900;opacity:.8">${escHtml(fmt(d))}</div>
          <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap"><button class="eqd-btn" id="wkNo">NÃO</button><button class="eqd-btn eqd-btnPrimary" id="wkYes">SIM</button></div>
        </div>
      `);
      document.getElementById("wkNo").onclick = () => { closeModal(); resolve(false); };
      document.getElementById("wkYes").onclick = () => { closeModal(); resolve(true); };
    });
  }
  async function openLostLeadFollowupModal(lead) {
    const base = new Date(); base.setDate(base.getDate()+1); base.setHours(11,0,0,0);
    const localDefault = new Date(base.getTime() - base.getTimezoneOffset()*60000).toISOString().slice(0,16);
    return await new Promise((resolve) => {
      openModal("Lead perdido", `
        <div class="eqd-warn" id="lostWarn"></div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div style="font-size:14px;font-weight:950">Deseja agendar um novo FOLLOW-UP futuro para este lead perdido?</div>
          <div style="font-size:12px;font-weight:900;opacity:.82">${escHtml(leadTitle(lead || {}))}</div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="eqd-btn" id="lostNo">NÃO</button><button class="eqd-btn eqd-btnPrimary" id="lostYes">SIM</button></div>
          <div id="lostBox" style="display:none;padding:12px;border:1px solid rgba(0,0,0,.10);border-radius:14px;background:#fff">
            <div style="font-size:11px;font-weight:900;margin-bottom:6px">NOME DO FOLLOW-UP</div><input id="lostFuNome" value="${escHtml(leadTitle(lead || {}))}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);margin-bottom:8px" />
            <div style="font-size:11px;font-weight:900;margin-bottom:6px">DATA E HORA</div><input id="lostFuPrazo" type="datetime-local" value="${localDefault}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:10px"><button class="eqd-btn" id="lostCancel">Cancelar</button><button class="eqd-btn eqd-btnPrimary" id="lostSave">SALVAR</button></div>
          </div>
        </div>
      `);
      document.getElementById("lostNo").onclick = () => { closeModal(); resolve({ createFu:false }); };
      document.getElementById("lostYes").onclick = () => { document.getElementById("lostBox").style.display = "block"; };
      document.getElementById("lostCancel").onclick = () => { closeModal(); resolve(false); };
      document.getElementById("lostSave").onclick = async () => {
        const warn=document.getElementById("lostWarn");
        const fuNome=String(document.getElementById("lostFuNome").value||"").trim();
        const fuPrazoIso=localInputToIsoWithOffset(String(document.getElementById("lostFuPrazo").value||"").trim());
        if (!fuNome || !fuPrazoIso) { warn.style.display="block"; warn.textContent="Preencha nome e data do FOLLOW-UP."; return; }
        if (!await confirmWeekendModal(fuPrazoIso, "o FOLLOW-UP")) return;
        closeModal(); resolve({ createFu:true, fuNome, fuPrazoIso });
      };
    });
  }

  async function loadLeadsForOneUser(userId) {
    await loadLeadStages();

    const cacheKey = String(userId);
    const cached = Array.isArray(STATE.leadsByUser.get(cacheKey)) ? STATE.leadsByUser.get(cacheKey) : [];
    if (STATE.loadingLeadsByUser.has(cacheKey)) return cached;
    STATE.loadingLeadsByUser.add(cacheKey);

    try {
      const select = [
        "ID","TITLE","NAME","LAST_NAME","STATUS_ID","ASSIGNED_BY_ID","DATE_CREATE","DATE_MODIFY","SOURCE_ID",
        LEAD_UF_OPERADORA, LEAD_UF_IDADE, LEAD_UF_TELEFONE, LEAD_UF_BAIRRO, LEAD_UF_FONTE, LEAD_UF_DATAHORA, LEAD_UF_OBS, LEAD_UF_ATENDIDO_DIA, LEAD_UF_LEAD_ORIGEM, LEAD_UF_HELENA, LEAD_UF_PESSOAL, LEAD_UF_POSSUI_PLANO,
      ].filter(Boolean);

      const statusIds = [leadStageId("NOVO LEAD"), leadStageId("EM ATENDIMENTO"), leadStageId("ATENDIDO"), leadStageId("QUALIFICADO"), ...lostLeadStageIds(), ...convertedLeadStageIds()].filter(Boolean);
      let leads = [];
      let okCalls = 0;
      if (statusIds.length) {
        const results = await Promise.all(statusIds.map(async (sid) => {
          try {
            const part = await bxAll("crm.lead.list", {
              filter: { ASSIGNED_BY_ID: Number(userId), STATUS_ID: String(sid) },
              select,
              order: { ID: "DESC" },
            });
            return { ok: true, part: part || [] };
          } catch (_) {
            return { ok: false, part: [] };
          }
        }));
        results.forEach(({ ok, part }) => {
          if (ok) okCalls++;
          if (part && part.length) leads = leads.concat(part);
        });
      } else {
        try {
          leads = await bxAll("crm.lead.list", {
            filter: { ASSIGNED_BY_ID: Number(userId) },
            select,
            order: { ID: "DESC" },
          });
          okCalls++;
        } catch (_) {}
      }

      if (!okCalls) {
        if (cached.length) return cached;
        throw new Error("Falha ao carregar LEADS desta user.");
      }

      const seen = new Set();
      leads = (leads || []).filter((l) => {
        const id = String((l && l.ID) || "");
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      STATE.leadsByUser.set(cacheKey, leads || []);

      const sNovo = leadStageId("NOVO LEAD");
      const sAt = leadStageId("EM ATENDIMENTO");
      const atList = sAt ? (leads || []).filter((l) => String(l.STATUS_ID) === String(sAt)) : [];
      const novoList = sNovo ? (leads || []).filter((l) => String(l.STATUS_ID) === String(sNovo)) : [];
      const prev = STATE.leadsAtendimentoIdsByUser.get(String(userId)) || new Set();
      const nowSet = new Set(atList.map((l) => String(l.ID)));

      let hasNew = false;
      for (const id of nowSet) { if (!prev.has(id)) { hasNew = true; break; } }
      if ((hasNew && nowSet.size) || novoList.length) STATE.leadsAlertUsers.add(String(userId));
      if (!nowSet.size && !novoList.length) STATE.leadsAlertUsers.delete(String(userId));
      STATE.leadsAtendimentoIdsByUser.set(String(userId), nowSet);

      return leads || [];
    } finally {
      STATE.loadingLeadsByUser.delete(cacheKey);
    }
  }

  let LAST_ALL_LEADS_SNAPSHOT_AT = 0;
  async function loadLeadsSnapshotAllUsers(opts = {}) {
    await loadLeadStages();
    const now = Date.now();
    if (!opts.force && (now - LAST_ALL_LEADS_SNAPSHOT_AT < 45 * 1000) && STATE.leadsByUser && STATE.leadsByUser.size) return STATE.leadsByUser;

    const select = [
      "ID","TITLE","NAME","LAST_NAME","STATUS_ID","ASSIGNED_BY_ID","DATE_CREATE","DATE_MODIFY","SOURCE_ID",
      LEAD_UF_OPERADORA, LEAD_UF_IDADE, LEAD_UF_TELEFONE, LEAD_UF_BAIRRO, LEAD_UF_FONTE, LEAD_UF_DATAHORA, LEAD_UF_OBS, LEAD_UF_ATENDIDO_DIA, LEAD_UF_LEAD_ORIGEM, LEAD_UF_HELENA, LEAD_UF_PESSOAL, LEAD_UF_POSSUI_PLANO,
    ].filter(Boolean);

    const statusIds = [leadStageId("NOVO LEAD"), leadStageId("EM ATENDIMENTO"), leadStageId("ATENDIDO"), leadStageId("QUALIFICADO"), ...lostLeadStageIds(), ...convertedLeadStageIds()].filter(Boolean);
    let all = [];
    let okCalls = 0;
    const results = await Promise.all(statusIds.map(async (sid) => {
      try {
        const part = await bxAll("crm.lead.list", { filter: { STATUS_ID: String(sid) }, select, order: { ID: "DESC" } });
        return { ok: true, part: part || [] };
      } catch (_) {
        return { ok: false, part: [] };
      }
    }));
    results.forEach(({ ok, part }) => {
      if (ok) okCalls++;
      if (part && part.length) all = all.concat(part);
    });
    if (!okCalls) return STATE.leadsByUser;

    const seen = new Set();
    all = (all || []).filter((l) => {
      const id = String((l && l.ID) || "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const grouped = new Map();
    USERS.forEach((u) => grouped.set(String(u.userId), []));
    for (const lead of all) {
      const uid = String(lead && lead.ASSIGNED_BY_ID || "");
      if (!grouped.has(uid)) grouped.set(uid, []);
      grouped.get(uid).push(lead);
    }
    for (const [uid, arr] of grouped.entries()) {
      STATE.leadsByUser.set(String(uid), arr.slice().sort((a,b)=> Number(b.ID||0)-Number(a.ID||0)));
      const sNovo = leadStageId("NOVO LEAD");
      const sAt = leadStageId("EM ATENDIMENTO");
      const atList = sAt ? arr.filter((l) => String(l.STATUS_ID) === String(sAt)) : [];
      const novoList = sNovo ? arr.filter((l) => String(l.STATUS_ID) === String(sNovo)) : [];
      const prev = STATE.leadsAtendimentoIdsByUser.get(String(uid)) || new Set();
      const nowSet = new Set(atList.map((l) => String(l.ID)));
      let hasNew = false;
      for (const id of nowSet) { if (!prev.has(id)) { hasNew = true; break; } }
      if ((hasNew && nowSet.size) || novoList.length) STATE.leadsAlertUsers.add(String(uid));
      if (!nowSet.size && !novoList.length) STATE.leadsAlertUsers.delete(String(uid));
      STATE.leadsAtendimentoIdsByUser.set(String(uid), nowSet);
    }
    LAST_ALL_LEADS_SNAPSHOT_AT = now;
    return STATE.leadsByUser;
  }

  function play3Beeps() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const beep = (t) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = 880;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        o.stop(t + 0.14);
      };
      beep(now + 0.0); beep(now + 0.18); beep(now + 0.36);
      setTimeout(() => { try { ctx.close(); } catch (_) {} }, 900);
    } catch (_) {}
  }

  // =========================
  // 9) LOAD DEALS (cache-first)
  // =========================
  const CACHE_KEY = "EQD_CACHE_V5";
  function dedupeDealsById(arr) {
    const seen = new Set();
    const out = [];
    for (const d of (arr || [])) {
      const id = String((d && d.ID) || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(d);
    }
    return out;
  }
  function normalizeDealsState() {
    STATE.dealsAll = dedupeDealsById(Array.isArray(STATE.dealsAll) ? STATE.dealsAll : []);
    STATE.dealsOpen = dedupeDealsById((STATE.dealsAll || []).filter((d) => !(STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId))));
  }
  function saveCache() {
    try {
      normalizeDealsState();
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), dealsAll: STATE.dealsAll, lastDealsSyncAt: STATE.lastDealsSyncAt || null, lastFullDealsSyncAt: Number(STATE.lastFullDealsSyncAt || 0) || 0, dealsLoadedMode: STATE.dealsLoadedMode || "full" }));
    } catch (_) {}
  }
  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const j = JSON.parse(raw);
      if (!j) return false;
      if (Array.isArray(j.dealsAll)) STATE.dealsAll = j.dealsAll;
      if (j.lastDealsSyncAt) STATE.lastDealsSyncAt = String(j.lastDealsSyncAt);
      if (Number(j.lastFullDealsSyncAt || 0) > 0) STATE.lastFullDealsSyncAt = Number(j.lastFullDealsSyncAt || 0);
      if (j.dealsLoadedMode === "open" || j.dealsLoadedMode === "full") STATE.dealsLoadedMode = j.dealsLoadedMode;
      normalizeDealsState();
      return true;
    } catch (_) { return false; }
  }

  let USER_PHOTOS_PROMISE = null;
  let FULL_DEALS_BG_PROMISE = null;
  let LAST_LEADS_REFRESH_AT = 0;
  function ensureFullDealsLoadedInBackground(delayMs = 0) {
    if (STATE.dealsLoadedMode === "full") return Promise.resolve();
    if (FULL_DEALS_BG_PROMISE) return FULL_DEALS_BG_PROMISE;
    FULL_DEALS_BG_PROMISE = new Promise((resolve) => {
      setTimeout(async () => {
        try {
          await loadDeals({ forceFull: true, openOnly: false });
          STATE.dealsLoadedMode = "full";
          saveCache();
          if (el && el.modalOverlay && el.modalOverlay.style.display !== "flex") renderCurrentView();
        } catch (_) {
        } finally {
          FULL_DEALS_BG_PROMISE = null;
          resolve();
        }
      }, Math.max(0, Number(delayMs || 0)));
    });
    return FULL_DEALS_BG_PROMISE;
  }
  function ensureUserPhotosInBackground() {
    if (USER_PHOTOS_PROMISE) return USER_PHOTOS_PROMISE;
    const missing = USERS.filter((u) => !STATE.userPhotoById.has(Number(u.userId)));
    USER_PHOTOS_PROMISE = Promise.all(missing.map((u) => ensureUserPhoto(u.userId, u.name)))
      .then(async () => {
        if (!STATE.footerPhotosLoaded) {
          await Promise.all(FOOTER_PARTNERS.map((p) => ensureUserPhoto(p.userId, "")));
          STATE.footerPhotosLoaded = true;
        }
      })
      .catch(() => {})
      .finally(() => {
        USER_PHOTOS_PROMISE = null;
        try {
          if (currentView && currentView.kind === "general" && el.modalOverlay.style.display !== "flex") renderCurrentView();
        } catch (_) {}
      });
    return USER_PHOTOS_PROMISE;
  }

  async function loadDeals(opts = {}) {
    const forceFull = !!(opts && opts.forceFull);
    const openOnly = !!(opts && opts.openOnly);
    const deferPhotos = !!(opts && opts.deferPhotos);
    const [urgMap, tarefaMap, etapaMap] = await Promise.all([
      enums(UF_URGENCIA), enums(UF_TAREFA), enums(UF_ETAPA),
    ]);

    let colabIsEnum = false;
    let colabMap = {};
    try {
      colabIsEnum = await enumHasOptions(UF_COLAB);
      if (colabIsEnum) colabMap = await enums(UF_COLAB);
    } catch (_) {}

    const select = [
      "ID","TITLE","STAGE_ID","DATE_CREATE","DATE_MODIFY","ASSIGNED_BY_ID",
      UF_TAREFA, UF_PRAZO, UF_URGENCIA, UF_ETAPA, UF_COLAB, UF_OBS, DEAL_UF_LEAD_ORIGEM,
    ];

    const maps = { urgMap, tarefaMap, etapaMap, colabMap, colabIsEnum };
    const nowMs = Date.now();
    const canIncremental = !openOnly && !forceFull && !!STATE.lastDealsSyncAt && STATE.dealsLoadedMode === "full" && (nowMs - Number(STATE.lastFullDealsSyncAt || 0) < 20 * 60 * 1000) && Array.isArray(STATE.dealsAll) && STATE.dealsAll.length;

    if (openOnly) {
      const filter = { CATEGORY_ID: CATEGORY_MAIN };
      if (STATE.doneStageId) filter["!STAGE_ID"] = String(STATE.doneStageId);
      const deals = await bxAll("crm.deal.list", {
        filter,
        select,
        order: { ID: "DESC" },
      });
      STATE.dealsOpen = (deals || []).map((d) => parseDeal(d, maps)).filter(Boolean);
      if (STATE.dealsLoadedMode !== "full") STATE.dealsAll = STATE.dealsOpen.slice();
      STATE.dealsLoadedMode = STATE.dealsLoadedMode === "full" ? "full" : "open";
    } else if (!canIncremental) {
      const deals = await bxAll("crm.deal.list", {
        filter: { CATEGORY_ID: CATEGORY_MAIN },
        select,
        order: { ID: "DESC" },
      });
      STATE.dealsAll = (deals || []).map((d) => parseDeal(d, maps)).filter(Boolean);
      STATE.dealsLoadedMode = "full";
      STATE.lastFullDealsSyncAt = nowMs;
    } else {
      const deals = await bxAll("crm.deal.list", {
        filter: { CATEGORY_ID: CATEGORY_MAIN, ">DATE_MODIFY": STATE.lastDealsSyncAt },
        select,
        order: { ID: "DESC" },
      });
      if (Array.isArray(deals) && deals.length) {
        const byId = new Map((STATE.dealsAll || []).map((d, i) => [String(d.ID), i]));
        for (const raw of deals) {
          const parsed = parseDeal(raw, maps);
          if (!parsed) continue;
          const id = String(parsed.ID);
          const i = byId.get(id);
          if (i === undefined) STATE.dealsAll.unshift(parsed);
          else STATE.dealsAll[i] = parsed;
        }
      }
      STATE.dealsLoadedMode = "full";
    }

    normalizeDealsState();
    STATE.lastDealsSyncAt = new Date().toISOString();
    STATE.lastOkAt = new Date();
    STATE.offline = false;
    saveCache();

    if (deferPhotos) setTimeout(() => { try { ensureUserPhotosInBackground(); } catch (_) {} }, 250);
    else ensureUserPhotosInBackground();
  }

  // =========================
  // 9.1) RECORRÊNCIA — storage e geração
  // =========================
  function safeJsonParse(s) {
    try { return JSON.parse(String(s || "")); } catch (_) { return null; }
  }
  function makeRuleId() {
    return "R" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }
  function dowNamePt(i){
    return ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][i] || String(i);
  }
  function ymdKey(d){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${dd}`;
  }
  function nextDays(fromDate, n){
    const out = [];
    const base = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0,0,0,0);
    for(let i=0;i<=n;i++){
      const d = new Date(base);
      d.setDate(base.getDate()+i);
      out.push(d);
    }
    return out;
  }
  function isWeekday(d){
    const w = d.getDay();
    return w !== 0 && w !== 6;
  }
  function adjustedMonthlyOccurrenceDate(rule, d){
    const day = Number(rule && rule.monthDay || 0);
    if (!(day >= 1 && day <= 31)) return null;
    const target = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const chosenDay = Math.min(day, target.getDate());
    const out = new Date(d.getFullYear(), d.getMonth(), chosenDay, 0, 0, 0, 0);
    const w = out.getDay();
    if (w === 6) out.setDate(out.getDate() - 1);
    else if (w === 0) out.setDate(out.getDate() - 2);
    return out;
  }
  function occursOn(rule, d){
    const t = (rule && rule.type) ? String(rule.type) : "";
    if (t === "DAILY_BUSINESS") return isWeekday(d);
    if (t === "WEEKLY") {
      const arr = Array.isArray(rule.weekDays) ? rule.weekDays.map(Number) : [];
      return arr.includes(d.getDay());
    }
    if (t === "MONTHLY") {
      const adj = adjustedMonthlyOccurrenceDate(rule, d);
      return !!adj && sameDay(adj, d);
    }
    if (t === "YEARLY") {
      const md = String(rule.yearMD || "").trim(); // "MM-DD"
      const m = md.match(/^(\d{2})-(\d{2})$/);
      if (!m) return false;
      const mm = Number(m[1]);
      const dd = Number(m[2]);
      return (d.getMonth()+1) === mm && d.getDate() === dd;
    }
    return false;
  }
  function markerFor(ruleId, dateKey){
    return `[RUID=${ruleId}:${dateKey}]`;
  }
  function extractMarkersFromDeals(deals){
    const set = new Set();
    (deals || []).forEach((d) => {
      const txt = String(d && (d._obs || d[UF_OBS] || "")).trim();
      if (!txt) return;
      const m = txt.match(RECURRENCE_MARKER_RE);
      if (m && m[1]) set.add(String(m[1]).trim());
    });
    return set;
  }

  async function loadRecurrenceConfigDeals() {
    const select = ["ID","TITLE","STAGE_ID","ASSIGNED_BY_ID", UF_OBS, "DATE_MODIFY", "DATE_CREATE"];
    const cfgDeals = await bxAll("crm.deal.list", {
      filter: { CATEGORY_ID: CATEGORY_MAIN, STAGE_ID: RECURRENCE_STAGE_ID },
      select,
      order: { ID: "DESC" },
    }).catch(() => []);

    STATE.recurConfigDealIdByUser = new Map();
    STATE.recurRulesByUser = new Map();

    (cfgDeals || []).forEach((d) => {
      const uid = String(d.ASSIGNED_BY_ID || "").trim();
      if (!uid || STATE.recurConfigDealIdByUser.has(uid)) return;

      STATE.recurConfigDealIdByUser.set(uid, String(d.ID));

      const raw = String(d[UF_OBS] || "").trim();
      const j = safeJsonParse(raw);
      const rules = (j && Array.isArray(j.rules)) ? j.rules : [];
      STATE.recurRulesByUser.set(uid, rules);
    });
  }

  async function ensureConfigDealForUser(userId) {
    const uid = String(userId);
    if (STATE.recurConfigDealIdByUser.has(uid)) return STATE.recurConfigDealIdByUser.get(uid);

    const fields = {
      CATEGORY_ID: Number(CATEGORY_MAIN),
      STAGE_ID: String(RECURRENCE_STAGE_ID),
      TITLE: `${RECURRENCE_TITLE_PREFIX}${uid}`,
      ASSIGNED_BY_ID: Number(uid),
      [UF_OBS]: JSON.stringify({ ver: 1, userId: uid, rules: [] }),
    };

    // ✅ SALVAR AQUI (cria o Deal de configuração de recorrência)
    const id = await bx("crm.deal.add", { fields });
    const dealId = String(id);
    STATE.recurConfigDealIdByUser.set(uid, dealId);
    STATE.recurRulesByUser.set(uid, []);
    return dealId;
  }

  async function saveRulesForUser(userId, rules) {
    const uid = String(userId);
    const dealId = await ensureConfigDealForUser(uid);
    const payload = JSON.stringify({ ver: 1, userId: uid, rules: Array.isArray(rules) ? rules : [] });

    // ✅ SALVAR AQUI (atualiza JSON de regras no UF_OBS do deal de configuração)
    await safeDealUpdate(String(dealId), { [UF_OBS]: payload });

    STATE.recurRulesByUser.set(uid, Array.isArray(rules) ? rules : []);
  }

  async function addRuleForUser(userId, rule) {
    const uid = String(userId);
    const cur = STATE.recurRulesByUser.get(uid) || [];
    const next = cur.slice();
    next.push(rule);
    await saveRulesForUser(uid, next);
  }

  async function deleteRuleForUser(userId, ruleId) {
    const uid = String(userId);
    const cur = STATE.recurRulesByUser.get(uid) || [];
    const next = cur.filter((r) => String(r.id) !== String(ruleId));
    await saveRulesForUser(uid, next);
  }

  async function generateRecurringDealsWindow() {
    const now = Date.now();
    if (now - STATE.recurLastGenAt < 60 * 1000) return;
    STATE.recurLastGenAt = now;

    if (!STATE.recurRulesByUser || STATE.recurRulesByUser.size === 0) {
      await loadRecurrenceConfigDeals();
    }

    const markers = extractMarkersFromDeals(STATE.dealsAll || []);
    const today = new Date();
    const days = nextDays(today, RECURRENCE_WINDOW_DAYS);

    for (const u of USERS) {
      const uid = String(u.userId);
      const rules = STATE.recurRulesByUser.get(uid) || [];
      if (!rules.length) continue;

      const stageId = await stageIdForUserName(u.name);
      if (!stageId) continue;

      for (const rule of rules) {
        const rid = String(rule.id || "").trim();
        const title = String(rule.title || "").trim();
        if (!rid || !title || isBlockedExactDealTitle(title)) continue;

        const hh = Number(rule.hh ?? 9);
        const mm = Number(rule.mm ?? 0);

        for (const d of days) {
          if (!occursOn(rule, d)) continue;

          const key = ymdKey(d);
          const mk = `${rid}:${key}`;
          if (markers.has(mk)) continue;

          const iso = isoFromDateAndTimeParts(d, hh, mm);

          // OBS sem markers antigos
          const baseObs = (rule.obs ? String(rule.obs).trim() : "").replace(/\[RUID=.*?\]/g, "").trim();
          const marker = markerFor(rid, key);

          const fields = {
            CATEGORY_ID: Number(CATEGORY_MAIN),
            STAGE_ID: String(stageId),
            TITLE: title,
            ASSIGNED_BY_ID: Number(uid),
            [UF_PRAZO]: iso,
          };

          // ✅ IMPORTANTE: agora aplica os UFs da regra na instância
          if (rule.etapaUf) fields[UF_ETAPA] = String(rule.etapaUf);
          if (rule.tipo) fields[UF_TAREFA] = String(rule.tipo);
          if (rule.urg) fields[UF_URGENCIA] = String(rule.urg);
          if (rule.colab) fields[UF_COLAB] = String(rule.colab);

          fields[UF_OBS] = (baseObs ? (baseObs + "\n") : "") + marker;

          try {
            setSoftStatus("Gerando recorrências…");

            // ✅ SALVAR AQUI (cria instância do deal recorrente)
            const newId = await bx("crm.deal.add", { fields });

            markers.add(mk);

            STATE.dealsAll.unshift({
              ID: String(newId),
              TITLE: title,
              STAGE_ID: String(stageId),
              ASSIGNED_BY_ID: Number(uid),
              DATE_CREATE: new Date().toISOString(),
              DATE_MODIFY: new Date().toISOString(),
              [UF_PRAZO]: iso,
              [UF_OBS]: fields[UF_OBS],
              [UF_ETAPA]: fields[UF_ETAPA] || "",
              [UF_TAREFA]: fields[UF_TAREFA] || "",
              [UF_URGENCIA]: fields[UF_URGENCIA] || "",
              [UF_COLAB]: fields[UF_COLAB] || "",
              _prazo: new Date(iso).toISOString(),
              _late: false,
              _urgId: String(fields[UF_URGENCIA] || ""),
              _urgTxt: "",
              _tarefaId: String(fields[UF_TAREFA] || ""),
              _tarefaTxt: "",
              _etapaId: String(fields[UF_ETAPA] || ""),
              _etapaTxt: "",
              _colabId: String(fields[UF_COLAB] || ""),
              _colabTxt: String(fields[UF_COLAB] || ""),
              _obs: fields[UF_OBS],
              _hasObs: true,
              _assigned: String(uid),
              _accent: dealAccent({ ID: String(newId), TITLE: title }),
            });
          } catch (_) {
            continue;
          }
        }
      }
    }
    setSoftStatus("JS: ok");
  }

  // =========================
  // 10) UI BASE
  // =========================
  const root = ensureRoot();
  root.innerHTML = `
    <div id="eqd-app">
      <div class="eqd-topbar">
        <div class="eqd-titleWrap">
          <img class="eqd-logo" src="${LOGO_URL}" alt="CGD" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://bitrix24public.com/b24-6iyx5y.bitrix24.com.br/docs/pub/189eb7d8a5cc26250f61ee3c26e9f997/showFile?token=p11qbann0mhq';">
          <div class="eqd-titleBlock">
            <div class="eqd-title"><span class="eqd-dot"></span>GET - CGD CORRETORA</div>
            <div class="eqd-meta" id="eqd-meta">Carregando…</div>
          </div>
        </div>

        <div class="eqd-actions">
          <a class="eqd-btn" href="${INTRANET_URL}" target="_blank" rel="noopener">INTRANET</a>
          <a class="eqd-btn" href="${VENDAS_URL}" target="_blank" rel="noopener">VENDAS</a>

          <div class="eqd-pill" id="eqd-now">—</div>
          <div class="eqd-pill" id="eqd-status">JS: ok</div>

          <div class="eqd-searchWrap">
            <select class="eqd-searchSelect" id="eqd-searchScope"></select>
            <input class="eqd-searchInput" id="eqd-searchInput" placeholder="Buscar por palavra..." />
            <button class="eqd-btn eqd-btnPrimary" id="eqd-searchBtn">Buscar</button>
          </div>

          <button class="eqd-btn" id="eqd-today">HOJE</button>
          <button class="eqd-btn" id="eqd-tomorrow">AMANHÃ</button>
          <button class="eqd-btn eqd-navArrow" id="eqd-prevday" title="Voltar um dia">←</button>
          <button class="eqd-btn eqd-navArrow" id="eqd-nextday" title="Avançar um dia">→</button>
          <button class="eqd-btn" id="eqd-calendar">CALENDÁRIO</button>
          <button class="eqd-btn" id="eqd-globalLeads">LEADS</button>
          <button class="eqd-btn" id="eqd-multi">PAINEL MULTI SELEÇÃO</button>
          <button class="eqd-btn" id="eqd-refresh">Atualizar</button>
          <button class="eqd-btn" id="eqd-darkToggle">Modo escuro</button>
        </div>
      </div>

      <div id="eqd-main"></div>

      <div class="eqd-modalOverlay" id="eqd-modalOverlay" aria-hidden="true">
        <div class="eqd-modal" id="eqd-modal" role="dialog" aria-modal="true">
          <div class="eqd-modalHead">
            <div class="eqd-modalTitle" id="eqd-modalTitle">—</div>
            <button class="eqd-modalClose" id="eqd-modalClose">Fechar</button>
          </div>
          <div class="eqd-modalBody" id="eqd-modalBody"></div>
        </div>
      </div>

      <div class="eqd-footer" id="eqd-footer">
        <div class="eqd-footerLeft">
          <div class="eqd-footerPeople" id="eqd-footerPeople"></div>
          <div class="eqd-footerBlock">
            <div class="eqd-footerMiniTitle">Endereço</div>
            <div class="eqd-footerDim">Av Ayrton Senna, 2500, SS109, Barra da Tijuca</div>
          </div>
        </div>

        <div class="eqd-footerCenter"><span>System created by GRUPO CGD</span></div>

        <div class="eqd-footerRight">
          <div class="eqd-footerBlock">
            <div class="eqd-footerMiniTitle">CGD CORRETORA</div>
            <div class="eqd-footerDim">CNPJ 01.654.471/0001-86 • SUSEP 202031791</div>
          </div>
          <div class="eqd-footerBlock">
            <div class="eqd-footerMiniTitle">CGD BARRA</div>
            <div class="eqd-footerDim">CNPJ 53.013.848/0001-11 • SUSEP 242158650</div>
          </div>
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
    tomorrow: document.getElementById("eqd-tomorrow"),
    calendar: document.getElementById("eqd-calendar"),
    prevday: document.getElementById("eqd-prevday"),
    nextday: document.getElementById("eqd-nextday"),
    globalLeads: document.getElementById("eqd-globalLeads"),
    multi: document.getElementById("eqd-multi"),
    searchScope: document.getElementById("eqd-searchScope"),
    searchInput: document.getElementById("eqd-searchInput"),
    searchBtn: document.getElementById("eqd-searchBtn"),
    darkToggle: document.getElementById("eqd-darkToggle"),
    modalOverlay: document.getElementById("eqd-modalOverlay"),
    modalEl: document.getElementById("eqd-modal"),
    modalTitle: document.getElementById("eqd-modalTitle"),
    modalBody: document.getElementById("eqd-modalBody"),
    modalClose: document.getElementById("eqd-modalClose"),
    footerPeople: document.getElementById("eqd-footerPeople"),
  };

  let BOOT_PROGRESS = 0;
  function setBootProgress(pct, label) {
    try {
      BOOT_PROGRESS = Math.max(BOOT_PROGRESS, Math.min(100, Number(pct) || 0));
      if (el && el.meta) el.meta.textContent = `${Math.round(BOOT_PROGRESS)}% • ${label || "Carregando painel..."}`;
    } catch (_) {}
  }
  function clearBootProgress() {
    try { BOOT_PROGRESS = 100; } catch (_) {}
  }

  function canCreateLooseFollowup(uid) {
    return OMEGA_FOLLOWUP_USERS.has(String(uid || ""));
  }

  function buildTransferredLeadAlert(fromUserName) {
    const who = String(fromUserName || 'outra USER').trim();
    return `LEAD TRANSFERIDO de ${who}. ALERTA: confira possível duplicidade de telefone antes de enviar para ATENDIDO.`;
  }

  async function transferFollowupDealToUser(dealId, newUserId) {
    const d = getDealById(dealId);
    if (!d) throw new Error('FOLLOW-UP não encontrado.');
    const targetUser = USERS.find((u) => String(u.userId) === String(newUserId));
    if (!targetUser) throw new Error('USER inválida.');

    let lead = null;
    try { lead = await resolveLeadForDeal(d); } catch (_) {}

    if (!lead) {
      updateDealInState(dealId, { ASSIGNED_BY_ID: Number(newUserId), _assigned: String(newUserId), DATE_MODIFY: new Date().toISOString() });
      rebuildDealsOpen();
      enqueueSync({ type: 'dealUpdate', dealId: String(dealId), fields: { ASSIGNED_BY_ID: Number(newUserId) } });
      return { mode: 'dealOnly' };
    }

    const fromUserId = String(lead.ASSIGNED_BY_ID || lead._ownerUserId || d.ASSIGNED_BY_ID || d._assigned || '');
    const fromUser = USERS.find((u) => String(u.userId) === fromUserId);
    const sourceName = fromUser ? fromUser.name : `USER ${fromUserId || ''}`.trim();
    const targetStage = String(leadStageId('EM ATENDIMENTO') || '');
    if (!targetStage) throw new Error('Etapa EM ATENDIMENTO não encontrada.');

    const curObs = String(leadObs(lead) || '').trim();
    const transferAlert = buildTransferredLeadAlert(sourceName);
    const nextObs = curObs ? `${transferAlert}

${curObs}` : transferAlert;
    const patch = { ASSIGNED_BY_ID: Number(newUserId), STATUS_ID: targetStage, [LEAD_UF_OBS]: nextObs };

    const fromArr = (STATE.leadsByUser.get(fromUserId) || []).slice();
    const idx = fromArr.findIndex((l) => String(l.ID) === String(lead.ID));
    if (idx >= 0) {
      fromArr.splice(idx, 1);
      STATE.leadsByUser.set(fromUserId, fromArr);
    }

    const movedLead = { ...lead, ...patch, _ownerUserId: Number(newUserId) };
    upsertLeadLocal(String(newUserId), movedLead);
    if (Array.isArray(STATE.globalLeadsAll)) {
      const gi = STATE.globalLeadsAll.findIndex((l) => String(l.ID) === String(lead.ID));
      if (gi >= 0) STATE.globalLeadsAll[gi] = { ...STATE.globalLeadsAll[gi], ...movedLead };
      else STATE.globalLeadsAll.unshift(movedLead);
    }

    enqueueSync({ type: 'leadUpdate', leadId: String(lead.ID), fields: patch });
    await markDone(String(dealId));
    return { mode: 'leadTransferred', leadId: String(lead.ID) };
  }

  const LEAD_ANALYSIS_HIDDEN_KEY = "eqdLeadAnalysisHiddenUsers";
  function getLeadAnalysisHiddenUsers() {
    try {
      const raw = localStorage.getItem(LEAD_ANALYSIS_HIDDEN_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.map((x) => String(x)) : []);
    } catch (_) { return new Set(); }
  }
  function setLeadAnalysisHiddenUsers(setObj) {
    try { localStorage.setItem(LEAD_ANALYSIS_HIDDEN_KEY, JSON.stringify([...setObj].map((x) => String(x)))); } catch (_) {}
  }

  function renderFooterPeople() {
    const html = FOOTER_PARTNERS.map((p) => {
      const src = STATE.userPhotoById.get(Number(p.userId)) || "";
      return `<img class="eqd-footAvatar" src="${src}" referrerpolicy="no-referrer"
              onerror="try{this.onerror=null;this.style.display='none'}catch(e){}" title="USER ${p.userId}" />`;
    }).join("");
    el.footerPeople.innerHTML = html || "";
  }

  // =========================
  // 11) DARK TOGGLE
  // =========================
  const DARK_KEY = "eqd_dark_v7";
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
  function openModal(title, bodyHTML, opts) {
    el.modalTitle.textContent = title || "—";
    el.modalBody.innerHTML = bodyHTML || "";
    el.modalOverlay.style.display = "flex";
    el.modalOverlay.setAttribute("aria-hidden", "false");

    el.modalEl.classList.remove("wide");
    el.modalEl.classList.remove("full");
    if (opts && opts.wide) el.modalEl.classList.add("wide");
    if (opts && opts.full) el.modalEl.classList.add("full");
  }
  function closeModal() {
    el.modalOverlay.style.display = "none";
    el.modalOverlay.setAttribute("aria-hidden", "true");
    el.modalBody.onclick = null;
    el.modalEl.classList.remove("wide");
    el.modalEl.classList.remove("full");
  }
  el.modalClose.addEventListener("click", closeModal);
  el.modalOverlay.addEventListener("click", (e) => { if (e.target === el.modalOverlay) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  function setSoftStatus(msg) { el.status.textContent = msg || "JS: ok"; }
  function setBusy(msg) { el.status.textContent = msg || "Executando…"; }
  function clearBusy() { el.status.textContent = "JS: ok"; }

  // =========================
  // 13) CLOCK
  // =========================
  function tickClock() {
    const d = new Date();
    el.now.textContent = `${fmtDateOnly(d)} • ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  }
  setInterval(tickClock, 1000);
  tickClock();

  // =========================
  // 14) BUSCA (admin)
  // =========================
  function fillSearchScope() {
    el.searchScope.innerHTML =
      `<option value="__ALL__">Busca geral</option>` +
      USERS.map((u) => `<option value="${u.userId}">${escHtml(u.name)}</option>`).join("");
  }
  fillSearchScope();

  let LAST_ADMIN_PIN_OK_AT = 0;
  async function ensureAdminForSearch() {
    const now = Date.now();
    if (now - LAST_ADMIN_PIN_OK_AT < 10 * 60 * 1000) return true;
    const pin = await askPin();
    if (!isAdmin(pin)) return false;
    LAST_ADMIN_PIN_OK_AT = now;
    return true;
  }

  function dealUserNameByAssigned(assignedId) {
    const u = USERS.find((x) => String(x.userId) === String(assignedId));
    return u ? u.name : `USER ${assignedId || "—"}`;
  }

  function sortDeals(deals) {
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

    return (deals || [])
      .slice()
      .sort((a, b) => {
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

  async function runSearchAdmin() {
    if (!(await ensureAdminForSearch())) return;

    const kwRaw = String(el.searchInput.value || "").trim();
    const kw = norm(kwRaw);
    const scope = String(el.searchScope.value || "__ALL__");

    if (!kw) { openModal("Busca", `<div class="eqd-empty">Digite uma palavra-chave.</div>`); return; }

    let base = (STATE.dealsOpen || []).slice();
    if (scope !== "__ALL__") base = base.filter((d) => String(d.ASSIGNED_BY_ID || d._assigned || "") === String(scope));

    const hits = base.filter((d) => {
      const blob = norm([d.TITLE || "", d._obs || "", d._tarefaTxt || "", d._colabTxt || "", d._etapaTxt || "", d._urgTxt || ""].join(" "));
      return blob.includes(kw);
    });

    const listHTML = hits.length
      ? hits.map((d) => {
          const who = dealUserNameByAssigned(d.ASSIGNED_BY_ID || d._assigned);
          const whoLine = scope === "__ALL__" ? `<div style="font-size:11px;font-weight:950;opacity:.80">USER: ${escHtml(who)}</div>` : ``;
          return `<div>${whoLine}${makeDealCard(d, { allowBatch: false })}</div>`;
        }).join("")
      : `<div class="eqd-empty">Nenhum resultado para: <strong>${escHtml(kwRaw)}</strong></div>`;

    openModal(`Busca: “${escHtml(kwRaw)}” • ${hits.length} resultado(s)`, listHTML);
  }

  el.searchBtn.addEventListener("click", () => { runSearchAdmin(); });
  el.searchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); runSearchAdmin(); } });

  // =========================
  // 15) CALENDÁRIO
  // =========================
  let selectedDate = new Date();
  let calendarCursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

  const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const DOW_PT = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

  function sameDay(a, b) {
    return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function monthGrid(cursor) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const jsDow = first.getDay();
    const monIndex = (jsDow + 6) % 7;
    const start = new Date(y, m, 1 - monIndex);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push(d);
    }
    return { first, cells };
  }

  function renderCalendarBody(selOverride) {
    const sel = selOverride || selectedDate;
    const { cells } = monthGrid(calendarCursor);
    const today = new Date();
    const title = `${MONTHS_PT[calendarCursor.getMonth()]} ${calendarCursor.getFullYear()}`;

    const dowRow = DOW_PT.map((d) => `<div class="calDow">${d}</div>`).join("");
    const cellHtml = cells.map((d) => {
      const off = d.getMonth() !== calendarCursor.getMonth();
      const cls = ["calCell", off ? "off" : "", sameDay(d, today) ? "today" : "", sameDay(d, sel) ? "sel" : ""].filter(Boolean).join(" ");
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,"0");
      const dd = String(d.getDate()).padStart(2,"0");
      const key = `${y}-${m}-${dd}`;
      return `<div class="${cls}" data-action="calPick" data-day="${key}">${d.getDate()}</div>`;
    }).join("");

    return `
      <div class="calWrap">
        <div class="calHead">
          <div class="calTitle">${escHtml(title)}</div>
          <div class="calNav">
            <button class="eqd-btn" data-action="calPrev">◀</button>
            <button class="eqd-btn" data-action="calToday">Hoje</button>
            <button class="eqd-btn" data-action="calNext">▶</button>
            <div style="font-size:11px;font-weight:900;opacity:.72">Duplo clique no dia para abrir</div>
          </div>
        </div>
        <div class="calGrid">${dowRow}${cellHtml}</div>
      </div>
    `;
  }

  function parseDayKey(key) {
    const s = String(key||"").trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]), mo = Number(m[2])-1, d = Number(m[3]);
    const dt = new Date(y, mo, d, 0,0,0,0);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  function attachCalendarHandlers(host, onApply) {
    let lastKey = "";
    let lastAt = 0;

    const doNav = (act) => {
      if (act === "calPrev") calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
      if (act === "calNext") calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
      if (act === "calToday") {
        selectedDate = new Date();
        calendarCursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      }
      host.innerHTML = renderCalendarBody();
    };

    host.addEventListener("click", (e) => {
      const a = e.target.closest("[data-action]");
      if (!a) return;
      const act = a.getAttribute("data-action");

      if (act === "calPrev" || act === "calNext" || act === "calToday") return doNav(act);

      if (act === "calPick") {
        const key = a.getAttribute("data-day");
        const d = parseDayKey(key);
        if (!d) return;

        selectedDate = d;
        calendarCursor = new Date(d.getFullYear(), d.getMonth(), 1);
        host.innerHTML = renderCalendarBody();

        const now = Date.now();
        const isDouble = (key === lastKey) && (now - lastAt <= 360);
        lastKey = key; lastAt = now;

        if (isDouble) onApply(d);
      }
    });

    host.addEventListener("dblclick", (e) => {
      const a = e.target.closest('[data-action="calPick"]');
      if (!a) return;
      const key = a.getAttribute("data-day");
      const d = parseDayKey(key);
      if (!d) return;
      onApply(d);
    });
  }

  function openCalendarModal() {
    calendarCursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    openModal("Calendário", `<div id="calHost">${renderCalendarBody()}</div>`);
    const host = document.getElementById("calHost");

    attachCalendarHandlers(host, (d) => {
      selectedDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0);
      closeModal();
      renderCurrentView();
    });
  }

  // =========================
  // 16) Cards
  // =========================
  function makeDealCard(deal, context) {
    const showWarn = isAtencaoText(deal._urgTxt);
    const title = (showWarn ? "⚠️ " : "") + bestTitleFromText(deal.TITLE || "");
    const prazoTxt = deal._prazo ? fmt(deal._prazo) : "Sem prazo";
    const tags = [];
    const linkedLeadOrig = getDealLeadOrigemId(deal);
    const linkedLead = linkedLeadOrig ? getLeadByOrigemId(linkedLeadOrig) : null;

    if (isUrgenteText(deal._urgTxt)) tags.push(`<span class="eqd-tag eqd-tagUrg eqd-tagClickable" data-action="editUrg" data-id="${deal.ID}">URGENTE</span>`);
    if (deal._late) tags.push(`<span class="eqd-tag eqd-tagLate">ATRASADA</span>`);
    tags.push(`<span class="eqd-tag ${deal._hasObs ? "eqd-tagObs" : "eqd-tagObsMuted"}" data-action="editObs" data-id="${deal.ID}">OBS</span>`);
    if (deal._tarefaTxt) tags.push(`<span class="eqd-tag">Tipo: ${escHtml(trunc(deal._tarefaTxt, 26))}</span>`);
    if (deal._colabTxt) tags.push(`<span class="eqd-tag">COLAB: ${escHtml(trunc(deal._colabTxt, 28))}</span>`);
    if (deal._urgTxt) tags.push(`<span class="eqd-tag eqd-tagClickable" data-action="editUrg" data-id="${deal.ID}">${escHtml(trunc(deal._urgTxt, 22))}</span>`);

    if (isFollowupDeal(deal) && linkedLeadOrig) {
      if (linkedLead && String(leadStageNameById(linkedLead.STATUS_ID) || "").trim().toUpperCase() === "QUALIFICADO") tags.push(`<span class="eqd-tag" style="background:#dbeafe;color:#1d4ed8">QUALIFICADO</span>`);
      if (linkedLead && isLostLead(linkedLead)) tags.push(`<span class="eqd-tag" style="background:#fef2f2;color:#b91c1c;border:1px solid rgba(185,28,28,.18);padding:2px 8px;line-height:1.2">LEAD PERDIDO</span>`);
      const helOn = linkedLead ? !!leadHelena(linkedLead) : false;
      const pesOn = linkedLead ? !!leadPessoal(linkedLead) : false;
      tags.push(`<span class="eqd-tag eqd-tagClickable" data-action="linkedLeadToggleHelena" data-dealid="${deal.ID}" style="background:${helOn ? "#ede9fe" : "#374151"};color:${helOn ? "#6d28d9" : "#fff"}">${helOn ? "HELENA" : "HELENA NÃO"}</span>`);
      tags.push(`<span class="eqd-tag eqd-tagClickable" data-action="linkedLeadTogglePessoal" data-dealid="${deal.ID}" style="background:${pesOn ? "#dcfce7" : "#6b7280"};color:${pesOn ? "#166534" : "#fff"}">${pesOn ? "WPP DIRETO" : "WPP DIRETO NÃO"}</span>`);
      const doneCount = countDoneFollowupsForLeadOrig(linkedLeadOrig);
      if (doneCount) tags.push(`<span class="eqd-tag">FUs concluídos: ${doneCount}</span>`);
    }

    const batchBox = context && context.allowBatch
      ? `<label style="display:flex;gap:6px;align-items:center;font-size:11px;font-weight:900;margin-left:auto"><input type="checkbox" class="eqd-batch" data-id="${deal.ID}"> Lote</label>`
      : ``;

    let extraMetaInside = context && context.extraMetaInside
      ? `<div style="font-size:11px;font-weight:900;opacity:.72">${context.extraMetaInside}</div>`
      : ``;

    if (isFollowupDeal(deal) && linkedLead) {
      const parts = [];
      if (leadTelefone(linkedLead)) parts.push(`Telefone: <strong>${escHtml(leadTelefone(linkedLead))}</strong>`);
      if (leadIdade(linkedLead)) parts.push(`Idade: <strong>${escHtml(leadIdade(linkedLead))}</strong>`);
      if (leadBairro(linkedLead)) parts.push(`Bairro: <strong>${escHtml(leadBairro(linkedLead))}</strong>`);
      if (leadFonte(linkedLead)) parts.push(`Fonte: <strong>${escHtml(leadFonte(linkedLead))}</strong>`);
      if (leadOperadora(linkedLead)) parts.push(`Operadora: <strong>${escHtml(leadOperadora(linkedLead))}</strong>`);
      if (leadPossuiPlano(linkedLead)) parts.push(`Possui plano: <strong>${escHtml(leadPossuiPlano(linkedLead))}</strong>`);
      const atendidoStamp = getLeadAtendidoStamp(linkedLead);
      if (atendidoStamp) parts.push(`Atendido em: <strong>${escHtml(atendidoStamp)}</strong>`);
      if (leadDataHora(linkedLead)) parts.push(`Data do lead: <strong>${escHtml(fmt(leadDataHora(linkedLead)))}</strong>`);
      if (parts.length) extraMetaInside += `<div style="font-size:11px;font-weight:900;opacity:.8;display:flex;gap:8px;flex-wrap:wrap">${parts.map((p) => `<span>${p}</span>`).join("")}</div>`;
    }

    const actionButtons = isFollowupDeal(deal)
      ? `
            ${linkedLeadOrig ? `` : `<button class="eqd-smallBtn" data-action="linkFollowup" data-id="${deal.ID}">Vincular</button>`}
            <button class="eqd-smallBtn eqd-smallBtnPrimary" data-action="followupConverter" data-id="${deal.ID}">Converter</button>
            <button class="eqd-smallBtn" data-action="reagendarDireto" data-id="${deal.ID}">Reagendar</button>
            <button class="eqd-smallBtn" data-action="transferDealUser" data-id="${deal.ID}">Transferir user</button>
            <button class="eqd-smallBtn eqd-smallBtnDanger" data-action="followupPerdido" data-id="${deal.ID}">Perdido</button>
            <button class="eqd-smallBtn eqd-smallBtnDanger" data-action="delete" data-id="${deal.ID}">Excluir</button>
          `
      : `
            <button class="eqd-smallBtn eqd-smallBtnPrimary" data-action="doneOnly" data-id="${deal.ID}">Concluir</button>
            <button class="eqd-smallBtn" data-action="reagendarDireto" data-id="${deal.ID}">Reagendar</button>
            <button class="eqd-smallBtn" data-action="editTitle" data-id="${deal.ID}">Editar negócio</button>
            <button class="eqd-smallBtn" data-action="transferDealUser" data-id="${deal.ID}">Transferir user</button>
            <button class="eqd-smallBtn eqd-smallBtnDanger" data-action="delete" data-id="${deal.ID}">Excluir</button>
          `;

    return `
      <div class="eqd-card" style="--accent-rgb:${deal._accent}" data-deal="${deal.ID}">
        <div class="eqd-bar"></div>
        <div class="eqd-inner">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div class="eqd-task" style="flex:1 1 auto">${escHtml(title)}</div>
            ${batchBox}
          </div>
          ${tags.filter(Boolean).length ? `<div class="eqd-tags">${tags.filter(Boolean).join("")}</div>` : ``}
          ${extraMetaInside}
          <div class="eqd-foot">
            <span>Prazo: <strong>${escHtml(prazoTxt)}</strong></span>
            <span>ID: <strong>${escHtml(deal.ID)}</strong></span>
          </div>
          <div class="eqd-cardActions">
            ${actionButtons}
          </div>
        </div>
      </div>
    `;
  }

  function updateDealInState(dealId, patchFields) {
    const id = String(dealId);
    const all = (STATE.dealsAll || []);
    const open = (STATE.dealsOpen || []);
    const a = all.find(d => String(d.ID) === id);
    const b = open.find(d => String(d.ID) === id);
    const apply = (d) => { if (d) Object.assign(d, patchFields || {}); };
    apply(a); apply(b);
  }

  const SYNC_QUEUE = [];
const SYNC_QUEUE_STORAGE_KEY = "EQD_SYNC_QUEUE_V2";
function persistSyncQueue(){ try { localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(SYNC_QUEUE)); } catch(_) {} }
function restoreSyncQueue(){ try { const raw = localStorage.getItem(SYNC_QUEUE_STORAGE_KEY); const arr = raw ? JSON.parse(raw) : []; if (Array.isArray(arr)) arr.forEach((j) => SYNC_QUEUE.push(j)); } catch(_) {} }
restoreSyncQueue();
  let SYNC_QUEUE_RUNNING = false;
  let SYNC_FLUSH_TIMER = 0;
  const TAB_ID = "TAB_" + Math.random().toString(16).slice(2);

  function acquireTabLock(name, ttlMs) {
    try {
      const key = `EQD_LOCK_${name}`;
      const now = Date.now();
      const raw = localStorage.getItem(key);
      const cur = raw ? JSON.parse(raw) : null;
      if (cur && cur.owner && cur.owner !== TAB_ID && Number(cur.expiresAt || 0) > now) return false;
      localStorage.setItem(key, JSON.stringify({ owner: TAB_ID, expiresAt: now + Number(ttlMs || 0) }));
      return true;
    } catch (_) {
      return true;
    }
  }

  function releaseTabLock(name) {
    try {
      const key = `EQD_LOCK_${name}`;
      const raw = localStorage.getItem(key);
      const cur = raw ? JSON.parse(raw) : null;
      if (cur && cur.owner === TAB_ID) localStorage.removeItem(key);
    } catch (_) {}
  }

  function replaceDealIdLocal(oldId, newId) {
    const oldS = String(oldId || ""); const newS = String(newId || "");
    if (!oldS || !newS || oldS === newS) return;
    (STATE.dealsAll || []).forEach((d) => { if (String(d.ID) === oldS) d.ID = newS; });
    (STATE.dealsOpen || []).forEach((d) => { if (String(d.ID) === oldS) d.ID = newS; });
    (SYNC_QUEUE || []).forEach((job) => { if (String(job.dealId || "") === oldS) job.dealId = newS; if (String(job.tempId || "") === oldS) job.tempId = newS; });
  }

  function isTempId(v) { return String(v || "").startsWith("TMP_"); }

  function makeTempId(prefix) {
    return `${String(prefix || "TMP")}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  }

  function rebuildDealsOpen() {
    STATE.dealsOpen = (STATE.dealsAll || []).filter((d) => !(STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId)));
  }

  function parseLocalDealFromFields(tempId, fields) {
    const raw = {
      ID: String(tempId),
      TITLE: String(fields.TITLE || "Negócio"),
      STAGE_ID: String(fields.STAGE_ID || ""),
      ASSIGNED_BY_ID: Number(fields.ASSIGNED_BY_ID || 0),
      DATE_CREATE: new Date().toISOString(),
      DATE_MODIFY: new Date().toISOString(),
      [UF_TAREFA]: fields[UF_TAREFA] || "",
      [UF_PRAZO]: fields[UF_PRAZO] || "",
      [UF_URGENCIA]: fields[UF_URGENCIA] || "",
      [UF_ETAPA]: fields[UF_ETAPA] || "",
      [UF_COLAB]: fields[UF_COLAB] || "",
      [UF_OBS]: fields[UF_OBS] || "",
      [DEAL_UF_LEAD_ORIGEM]: fields[DEAL_UF_LEAD_ORIGEM] || "",
    };
    return parseDeal(raw, {
      urgMap: STATE.enumCache.get(UF_URGENCIA) || {},
      tarefaMap: STATE.enumCache.get(UF_TAREFA) || {},
      etapaMap: STATE.enumCache.get(UF_ETAPA) || {},
      colabMap: STATE.enumCache.get(UF_COLAB) || {},
      colabIsEnum: !!(STATE.enumCache.get(UF_COLAB) && Object.keys(STATE.enumCache.get(UF_COLAB)).length),
    });
  }

  function upsertDealLocal(deal) {
    if (!deal || !deal.ID) return;
    const id = String(deal.ID);
    const idxAll = (STATE.dealsAll || []).findIndex((d) => String(d.ID) === id);
    if (idxAll >= 0) STATE.dealsAll[idxAll] = deal; else (STATE.dealsAll || (STATE.dealsAll=[])).unshift(deal);
    const idxOpen = (STATE.dealsOpen || []).findIndex((d) => String(d.ID) === id);
    const doneFlag = isDealDone(deal);
    if (doneFlag) { if (idxOpen >= 0) STATE.dealsOpen.splice(idxOpen, 1); }
    else { if (idxOpen >= 0) STATE.dealsOpen[idxOpen] = deal; else (STATE.dealsOpen || (STATE.dealsOpen=[])).unshift(deal); }
    saveCache();
  }

  function removeDealLocal(dealId) {
    const id = String(dealId || "");
    if (!id) return;
    STATE.dealsAll = (STATE.dealsAll || []).filter((d) => String(d.ID) !== id);
    STATE.dealsOpen = (STATE.dealsOpen || []).filter((d) => String(d.ID) !== id);
    saveCache();
  }

  function scheduleSyncFlush(delayMs = 450) {
    clearTimeout(SYNC_FLUSH_TIMER);
    SYNC_FLUSH_TIMER = setTimeout(() => { flushSyncQueue().catch(() => {}); }, delayMs);
  }

  function enqueueSync(job, opts = {}) {
    if (!job) return;
    SYNC_QUEUE.push(job);
    persistSyncQueue();
    const delay = opts && typeof opts.delayMs === 'number' ? opts.delayMs : (job && (job.type === "dealDelete" || job.type === "leadDelete") ? 80 : 450);
    scheduleSyncFlush(delay);
  }

  function squashSyncQueue() {
    const out = [];
    const updateMap = new Map();
    for (const job of SYNC_QUEUE) {
      if (!job) continue;
      if (job.type === "dealUpdate") {
        const key = `dealUpdate:${String(job.dealId || "")}`;
        if (!updateMap.has(key)) {
          const clone = { ...job, fields: { ...(job.fields || {}) } };
          updateMap.set(key, clone);
          out.push(clone);
        } else {
          Object.assign(updateMap.get(key).fields, job.fields || {});
        }
        continue;
      }
      if (job.type === "leadUpdate") {
        const key = `leadUpdate:${String(job.leadId || "")}`;
        if (!updateMap.has(key)) {
          const clone = { ...job, fields: { ...(job.fields || {}) } };
          updateMap.set(key, clone);
          out.push(clone);
        } else {
          Object.assign(updateMap.get(key).fields, job.fields || {});
        }
        continue;
      }
      out.push(job);
    }
    SYNC_QUEUE.length = 0;
    out.forEach((j) => SYNC_QUEUE.push(j));
    persistSyncQueue();
  }


  function overlayPendingSyncState() {
    try {
      for (const job of (SYNC_QUEUE || [])) {
        if (!job) continue;
        if (job.type === 'dealAdd' && job.tempId && job.fields) {
          upsertDealLocal(parseLocalDealFromFields(job.tempId, job.fields));
          continue;
        }
        if (job.type === 'dealUpdate' && job.dealId && job.fields) {
          updateDealInState(String(job.dealId), { ...(job.fields || {}), DATE_MODIFY: new Date().toISOString() });
          continue;
        }
        if (job.type === 'dealDelete' && job.dealId) {
          removeDealLocal(String(job.dealId));
          continue;
        }
        if (job.type === 'leadUpdate' && job.leadId && job.fields) {
          for (const [uid, arr] of STATE.leadsByUser.entries()) {
            const idx = (arr || []).findIndex((l) => String(l.ID) === String(job.leadId));
            if (idx >= 0) {
              arr[idx] = { ...(arr[idx] || {}), ...(job.fields || {}) };
              STATE.leadsByUser.set(uid, arr);
              break;
            }
          }
          continue;
        }
        if (job.type === 'leadDelete' && job.leadId) {
          for (const [uid, arr] of STATE.leadsByUser.entries()) {
            STATE.leadsByUser.set(uid, (arr || []).filter((l) => String(l.ID) !== String(job.leadId)));
          }
        }
      }
      rebuildDealsOpen();
    } catch (_) {}
  }

  async function flushSyncQueue() {
    if (SYNC_QUEUE_RUNNING || !SYNC_QUEUE.length) return;
    if (!acquireTabLock("SYNC", 15000)) { scheduleSyncFlush(1200); return; }
    SYNC_QUEUE_RUNNING = true;
    try {
      squashSyncQueue();
      while (SYNC_QUEUE.length) {
        const job = SYNC_QUEUE[0];
        if (!job) { SYNC_QUEUE.shift(); persistSyncQueue(); continue; }
        if (job.type === "dealAdd") { const realId = await bx("crm.deal.add", { fields: job.fields }); replaceDealIdLocal(job.tempId, String(realId)); SYNC_QUEUE.shift(); persistSyncQueue(); continue; }
        if (job.type === "dealUpdate") { if (isTempId(job.dealId)) { SYNC_QUEUE.push(SYNC_QUEUE.shift()); persistSyncQueue(); continue; } await safeDealUpdate(String(job.dealId), job.fields); SYNC_QUEUE.shift(); persistSyncQueue(); continue; }
        if (job.type === "dealDelete") { if (!isTempId(job.dealId)) { try { await bx("crm.deal.delete", { id: String(job.dealId) }); } catch (e) { const msg = String(e && e.message || e || ''); if (!/400/.test(msg)) throw e; } } SYNC_QUEUE.shift(); persistSyncQueue(); continue; }
        if (job.type === "leadUpdate") { await bx("crm.lead.update", { id: String(job.leadId), fields: job.fields }); SYNC_QUEUE.shift(); persistSyncQueue(); continue; }
        if (job.type === "leadDelete") { try { await bx("crm.lead.delete", { id: String(job.leadId) }); } catch (e) { const msg = String(e && e.message || e || ''); if (!/400/.test(msg)) throw e; } SYNC_QUEUE.shift(); persistSyncQueue(); continue; }
        SYNC_QUEUE.shift(); persistSyncQueue();
      }
    } catch (_) {
      persistSyncQueue();
      scheduleSyncFlush(2500);
    } finally {
      SYNC_QUEUE_RUNNING = false;
      releaseTabLock("SYNC");
    }
  }


  // =========================
  // 17) FOLLOW-UP (deal)
  // =========================
  async function createFollowUpDealForUser(user, negocioNome, prazoIso, extraFields) {
    const linkedOrig = String((extraFields && extraFields[DEAL_UF_LEAD_ORIGEM]) || "").trim();
    if (linkedOrig && hasFutureFollowupForLeadOrig(linkedOrig)) {
      const existing = (STATE.dealsOpen || []).find((d) => isFollowupDeal(d) && getDealLeadOrigemId(d) === linkedOrig && d._prazo && new Date(d._prazo).getTime() >= dayStart(new Date()).getTime());
      const whenTxt = existing && existing._prazo ? fmt(existing._prazo) : "já agendado";
      throw new Error(`Este lead já possui FOLLOW-UP futuro (${whenTxt}). Reagende o existente em vez de criar outro.`);
    }
    const [urgMap, tipoMap, etapaMap] = await Promise.all([enums(UF_URGENCIA), enums(UF_TAREFA), enums(UF_ETAPA)]);
    const followTipoId = findEnumIdByLabel(tipoMap, norm("FOLLOW-UP"));
    const aguardEtapaId = findEnumIdByLabel(etapaMap, norm("AGUARDANDO"));
    const normalUrgId = findEnumIdByLabel(urgMap, norm("NORMAL")) || findEnumIdByLabel(urgMap, norm("PADRAO")) || "";

    const stageId = await stageIdForUserName(user.name);
    if (!stageId) throw new Error(`Não encontrei a coluna ${user.name} na pipeline.`);

    const fields = {
      CATEGORY_ID: Number(CATEGORY_MAIN),
      STAGE_ID: String(stageId),
      TITLE: `FOLLOW-UP ${negocioNome}`,
      ASSIGNED_BY_ID: Number(user.userId),
    };

    if (prazoIso) fields[UF_PRAZO] = prazoIso;
    if (normalUrgId) fields[UF_URGENCIA] = normalUrgId;
    if (followTipoId) fields[UF_TAREFA] = followTipoId;
    if (aguardEtapaId) fields[UF_ETAPA] = aguardEtapaId;
    if (extraFields && typeof extraFields === "object") Object.assign(fields, extraFields);

    const tempId = makeTempId("TMP_FU");
    upsertDealLocal(parseLocalDealFromFields(tempId, fields));
    enqueueSync({ type: "dealAdd", tempId, fields });
    return tempId;
  }

  function openFollowUpModal(user, prefillName, opts) {
    const base = new Date();
    base.setHours(11, 0, 0, 0);
    const leadId = String((opts && opts.leadId) || "");
    const lead = leadId ? getLeadByOrigemId(leadId) || getLeadByOrigemId(String(leadId)) || (STATE.leadsByUser.get(String(user.userId)) || []).find((l) => String(l.ID) === leadId || String(leadOrigemId(l)) === leadId) : null;
    const origId = lead ? (leadOrigemId(lead) || String(lead.ID)) : String((opts && opts.leadOrigemId) || "");
    const existingFutureDeal = origId ? (STATE.dealsOpen || []).find((d) => isFollowupDeal(d) && getDealLeadOrigemId(d) === origId && d._prazo && new Date(d._prazo).getTime() >= dayStart(new Date()).getTime()) : null;
    const alreadyFuture = existingFutureDeal ? 1 : (origId ? countOpenFutureFollowupsForLeadOrig(origId) : 0);
    if (!origId && !canCreateLooseFollowup(user.userId)) throw new Error("Para esta USER, o FOLLOW-UP precisa estar vinculado a um lead.");
    const localDefault = new Date(((existingFutureDeal && existingFutureDeal._prazo) ? new Date(existingFutureDeal._prazo) : base).getTime() - (((existingFutureDeal && existingFutureDeal._prazo) ? new Date(existingFutureDeal._prazo) : base).getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

    openModal(`FOLLOW-UP — ${user.name}`, `
      <div class="eqd-warn" id="fuWarn"></div>
      ${alreadyFuture ? `<div style="font-size:12px;font-weight:950;color:#92400e;background:#fef3c7;border:1px solid rgba(146,64,14,.18);padding:10px;border-radius:12px;margin-bottom:10px">Este lead já possui follow-up agendado. Você pode alterar a data/hora abaixo.</div>` : ``}
      <div style="display:grid;grid-template-columns:1fr;gap:10px">
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">NOME DO NEGÓCIO</div>
          <input id="fuNome" value="${escHtml(existingFutureDeal ? bestTitleFromText(existingFutureDeal.TITLE || '') : (prefillName || ""))}"
                 style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" placeholder="Ex.: JOÃO SILVA" />
        </div>
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">DATA E HORA</div>
          <input id="fuPrazo" type="datetime-local" value="${localDefault}"
                 style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            ${["09:00","11:00","14:00","16:00"].map((hh) => `<button class="eqd-btn fuQuick" data-hh="${hh}" type="button">${hh.replace(":00","h")}</button>`).join("")}
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="fuSave">${existingFutureDeal ? "SALVAR ALTERAÇÃO" : "SALVAR FOLLOW-UP"}</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("fuWarn");
    const btn = document.getElementById("fuSave");
    document.querySelectorAll(".fuQuick").forEach((b) => {
      b.onclick = () => {
        const inp = document.getElementById("fuPrazo");
        const cur = inp.value ? new Date(inp.value) : new Date();
        const parts = String(b.getAttribute("data-hh") || "11:00").split(":");
        cur.setHours(Number(parts[0] || 11), Number(parts[1] || 0), 0, 0);
        inp.value = new Date(cur.getTime() - cur.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      };
    });

    btn.onclick = async () => {
      const lk = `fuSave:${user.userId}`;
      if (!lockTry(lk)) return;
      try {
        btn.disabled = true;
        warn.style.display = "none";
        warn.textContent = "";
        const nm = String(document.getElementById("fuNome").value || "").trim();
        if (!nm) throw new Error("Preencha o NOME DO NEGÓCIO.");
        if (isBlockedDealTitle(nm)) throw new Error("Criação bloqueada para negócio #7259.");
        const prazoLocal = String(document.getElementById("fuPrazo").value || "").trim();
        const prazoIso = localInputToIsoWithOffset(prazoLocal);
        if (!prazoIso) throw new Error("Prazo inválido.");
        if (!await confirmWeekendModal(prazoIso, "estas tarefas")) return;
        if (!await confirmWeekendModal(prazoIso, "esta tarefa")) return;
        if (!await confirmWeekendModal(prazoIso, "o FOLLOW-UP")) return;
        if (!await confirmWeekendModal(prazoIso, "esta tarefa")) return;
        const wd = new Date(prazoIso).getDay();
        if (!await confirmWeekendModal(prazoIso, 'o FOLLOW-UP')) return;
        setBusy("Salvando follow-up…");
        if (existingFutureDeal) {
          updateDealInState(existingFutureDeal.ID, { TITLE: `FOLLOW-UP ${nm}`, [UF_PRAZO]: prazoIso, _prazo: new Date(prazoIso).toISOString(), _late:false, DATE_MODIFY:new Date().toISOString() });
          enqueueSync({ type: "dealUpdate", dealId: String(existingFutureDeal.ID), fields: { TITLE: `FOLLOW-UP ${nm}`, [UF_PRAZO]: prazoIso } });
        } else {
          const extraFields = {};
          if (origId) extraFields[DEAL_UF_LEAD_ORIGEM] = origId;
          await createFollowUpDealForUser(user, nm, prazoIso, extraFields);
        }
        closeModal();
        renderCurrentView();
        if (opts && opts.returnToLeads) {
          setLeadsCtx(opts.returnToLeads.userId, opts.returnToLeads.kw || "");
          return reopenLeadsModalSafe({ noBackgroundReload: true });
        }
        renderCurrentView();
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally {
        btn.disabled = false;
        clearBusy();
        lockRelease(lk);
      }
    };
  }

  function getLeadByOrigemId(origId) {
    const needle = String(origId || "").trim();
    if (!needle) return null;
    for (const arr of STATE.leadsByUser.values()) {
      const found = (arr || []).find((l) => String(leadOrigemId(l) || l.ID) === needle || String(l.ID) === needle);
      if (found) return found;
    }
    return null;
  }

  async function resolveLeadForDeal(deal) {
    if (!deal) return null;
    const origId = getDealLeadOrigemId(deal);
    const ownerUid = String(deal.ASSIGNED_BY_ID || deal._assigned || "").trim();
    const followTitleNeedle = norm(String(bestTitleFromText(String(deal.TITLE || "")).replace(/^FOLLOW-UP\s*/i, "")).trim());

    const select = [
      "ID","TITLE","NAME","LAST_NAME","STATUS_ID","ASSIGNED_BY_ID","DATE_CREATE","DATE_MODIFY","SOURCE_ID",
      LEAD_UF_OPERADORA, LEAD_UF_IDADE, LEAD_UF_TELEFONE, LEAD_UF_BAIRRO, LEAD_UF_FONTE, LEAD_UF_DATAHORA, LEAD_UF_OBS, LEAD_UF_ATENDIDO_DIA, LEAD_UF_LEAD_ORIGEM, LEAD_UF_HELENA, LEAD_UF_PESSOAL, LEAD_UF_POSSUI_PLANO,
    ].filter(Boolean);

    let lead = null;
    if (origId) {
      lead = getLeadByOrigemId(origId);
      if (lead) return lead;

      if (ownerUid) {
        try {
          const arr = await loadLeadsForOneUser(ownerUid);
          lead = (arr || []).find((l) => String(leadOrigemId(l) || l.ID) === String(origId) || String(l.ID) === String(origId)) || null;
          if (lead) return lead;
        } catch (_) {}
      }

      let rows = [];
      try {
        rows = await bxAll("crm.lead.list", { filter: { ID: String(origId) }, select, order: { ID: "DESC" } });
      } catch (_) {}
      if (!rows || !rows.length) {
        try {
          rows = await bxAll("crm.lead.list", { filter: { [LEAD_UF_LEAD_ORIGEM]: String(origId) }, select, order: { ID: "DESC" } });
        } catch (_) {}
      }
      lead = (rows || [])[0] || null;
      if (lead) {
        const uid = String(lead.ASSIGNED_BY_ID || ownerUid || "").trim();
        if (uid) {
          const arr = (STATE.leadsByUser.get(uid) || []).slice();
          const idx = arr.findIndex((l) => String(l.ID) === String(lead.ID));
          if (idx >= 0) arr[idx] = { ...arr[idx], ...lead };
          else arr.unshift(lead);
          STATE.leadsByUser.set(uid, arr);
        }
        if (Array.isArray(STATE.globalLeadsAll)) {
          const gi = STATE.globalLeadsAll.findIndex((l) => String(l.ID) === String(lead.ID));
          if (gi >= 0) STATE.globalLeadsAll[gi] = { ...STATE.globalLeadsAll[gi], ...lead };
          else STATE.globalLeadsAll.unshift(lead);
        }
        return lead;
      }
    }

    const pools = [];
    if (ownerUid) {
      try { pools.push(await loadLeadsForOneUser(ownerUid)); } catch (_) {}
      pools.push(STATE.leadsByUser.get(ownerUid) || []);
    }
    if (Array.isArray(STATE.globalLeadsAll)) pools.push(STATE.globalLeadsAll);

    const flat = [];
    const seen = new Set();
    for (const arr of pools) for (const l of (arr || [])) {
      const id = String(l && l.ID || "");
      if (!id || seen.has(id)) continue;
      seen.add(id); flat.push(l);
    }
    if (followTitleNeedle) {
      lead = flat.find((l) => norm(String(leadTitle(l) || "")) === followTitleNeedle) || null;
      if (lead) return lead;
    }

    if (ownerUid && followTitleNeedle) {
      let rows = [];
      try {
        rows = await bxAll("crm.lead.list", { filter: { ASSIGNED_BY_ID: Number(ownerUid) }, select, order: { ID: "DESC" } });
      } catch (_) {}
      lead = (rows || []).find((l) => norm(String(leadTitle(l) || "")) === followTitleNeedle) || null;
      if (lead) {
        const arr = (STATE.leadsByUser.get(ownerUid) || []).slice();
        const idx = arr.findIndex((l) => String(l.ID) === String(lead.ID));
        if (idx >= 0) arr[idx] = { ...arr[idx], ...lead };
        else arr.unshift(lead);
        STATE.leadsByUser.set(ownerUid, arr);
        if (Array.isArray(STATE.globalLeadsAll)) {
          const gi = STATE.globalLeadsAll.findIndex((l) => String(l.ID) === String(lead.ID));
          if (gi >= 0) STATE.globalLeadsAll[gi] = { ...STATE.globalLeadsAll[gi], ...lead };
          else STATE.globalLeadsAll.unshift(lead);
        }
        return lead;
      }
    }

    return null;
  }
  function getDealLeadOrigemId(deal) { return String((deal && deal[DEAL_UF_LEAD_ORIGEM]) || "").trim(); }
  function isDealDone(deal) { return !!(deal && STATE.doneStageId && String(deal.STAGE_ID || "") === String(STATE.doneStageId)); }


  function firstNameFromText(v) {
    const cleaned = String(v || "")
      .replace(/^\s*FOLLOW-UP\s*/i, "")
      .replace(/^\s*LEAD\s*[-:–—]?\s*/i, "")
      .trim();
    const parts = cleaned.split(/\s+/).map((s) => String(s || '').trim()).filter(Boolean);
    if (!parts.length) return "";
    if (norm(parts[0]) === 'lead' && parts[1]) return parts[1];
    return parts[0] || "";
  }

  async function promptLinkLeadForOldFollowup(deal, actionLabel) {
    if (!deal) return null;
    const ownerUid = String(deal.ASSIGNED_BY_ID || deal._assigned || "").trim();
    if (ownerUid && (!STATE.leadsByUser.get(ownerUid) || !STATE.leadsByUser.get(ownerUid).length)) {
      try { await loadLeadsForOneUser(ownerUid); } catch (_) {}
    }
    let candidates = ownerUid ? (STATE.leadsByUser.get(ownerUid) || []).slice() : getLikelyLeadCandidatesForFollowup(deal, {});
    if (!candidates.length) {
      const arr = ownerUid ? (STATE.leadsByUser.get(ownerUid) || []) : Array.from(STATE.leadsByUser.values()).flat();
      candidates = (arr || []).slice().sort((a,b) => String(leadTitle(a)||"").localeCompare(String(leadTitle(b)||""), 'pt-BR'));
    }
    if (!candidates.length) return null;
    return await new Promise((resolve) => {
      openModal(`Vincular FOLLOW-UP ao lead`, `
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="font-size:12px;font-weight:900;line-height:1.4">Este FOLLOW-UP não tem lead vinculado. Vincule para <strong>${escHtml(actionLabel || "continuar")}</strong>.</div>
          <input id="oldFuLeadSearch" class="eqd-searchInput" style="width:100%;color:#111;background:#fff;border-color:rgba(0,0,0,.18)" placeholder="Buscar lead provável por nome, telefone, operadora..." value="${escHtml(firstNameFromText(bestTitleFromText(String(deal.TITLE || '').replace(/^FOLLOW-UP\s*/i,''))))}" />
          <select id="oldFuLeadPick" size="12" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900"></select>
          <div style="font-size:11px;font-weight:900;opacity:.72">Prioridade de sugestão: leads sem FOLLOW-UP futuro vinculado. Leads em LEAD DESCARTADO aparecem com sinal vermelho.</div>
          <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap">
            <button class="eqd-btn eqd-btnDanger" id="oldFuDelete">Excluir FUP</button>
            <button class="eqd-btn" id="oldFuNewLead">Criar novo lead</button>
            <button class="eqd-btn" id="oldFuCancel">Cancelar</button>
            <button class="eqd-btn eqd-btnPrimary" id="oldFuConfirm">Vincular</button>
          </div>
        </div>
      `, { wide:true, full:true });
      const sel = document.getElementById('oldFuLeadPick');
      const q = document.getElementById('oldFuLeadSearch');
      const render = async (kw='') => {
        if (ownerUid && (!STATE.leadsByUser.get(ownerUid) || !STATE.leadsByUser.get(ownerUid).length)) {
          try { await loadLeadsForOneUser(ownerUid); } catch (_) {}
        }
        const rows = getLikelyLeadCandidatesForFollowup(deal, { kw }).filter((l) => String((l.ASSIGNED_BY_ID || l._ownerUserId || "")) === ownerUid).slice(0, 200);
        const base = (rows.length ? rows : candidates).filter((l) => String((l.ASSIGNED_BY_ID || l._ownerUserId || "")) === ownerUid);
        sel.innerHTML = `<option value="">Selecione um lead…</option>` + base.map((l) => {
          const discarded = leadIsDiscarded(l);
          return `<option value="${escHtml(String(l.ID))}" ${discarded ? 'style="color:#b00020;font-weight:900"' : ''}>${escHtml(formatLeadCandidateLabel(l, deal.ID))}</option>`;
        }).join('');
      };
      render(q && q.value || '');
      if (q) q.oninput = (e) => { render(e.target.value || ''); };
      const done = (v) => { try { closeModal(); } catch (_) {} resolve(v || null); };
      const cbtn = document.getElementById('oldFuCancel');
      const okbtn = document.getElementById('oldFuConfirm');
      if (cbtn) cbtn.onclick = () => done(null);
      const delbtn = document.getElementById('oldFuDelete');
      if (delbtn) delbtn.onclick = async () => {
        if (!confirm('Excluir este FOLLOW-UP?')) return;
        delbtn.disabled = true;
        try {
          await deleteDeal(String(deal.ID));
          done(null);
        } finally {
          delbtn.disabled = false;
        }
      };
      const nbtn = document.getElementById('oldFuNewLead');
      if (nbtn) nbtn.onclick = async () => {
        const uid = ownerUid || String((deal && (deal.ASSIGNED_BY_ID || deal._assigned)) || "");
        const user = USERS.find((u) => String(u.userId) === uid);
        if (!user) return alert('User não encontrada.');
        return openManualLeadCreateModal(user, leadStageId('EM ATENDIMENTO') || leadStageId('NOVO LEAD') || "", { prefillName: bestTitleFromText(String(deal.TITLE || "").replace(/^FOLLOW-UP\s*/i,"")), onSaved: () => promptLinkLeadForOldFollowup(deal, actionLabel).then(resolve) });
      };
      if (okbtn) okbtn.onclick = async () => {
        const selId = String((document.getElementById('oldFuLeadPick') || {}).value || '').trim();
        if (!selId) return alert('Selecione um lead.');
        let lead = null;
        for (const arr of STATE.leadsByUser.values()) { lead = (arr || []).find((x) => String(x.ID) === selId) || lead; if (lead) break; }
        if (!lead) return alert('Lead não encontrado no cache.');
        const origem = String(leadOrigemId(lead) || lead.ID || '').trim();
        if (origem && String(deal.ID || '').trim()) {
          updateDealInState(String(deal.ID), { [DEAL_UF_LEAD_ORIGEM]: origem, DATE_MODIFY: new Date().toISOString() });
          if (!isTempId(deal.ID)) enqueueSync({ type: 'dealUpdate', dealId: String(deal.ID), fields: { [DEAL_UF_LEAD_ORIGEM]: origem } }, { delayMs: 40 });
        }
        done(lead);
      };
    });
  }
  async function deleteFutureFollowupsForLeadOrig(origId, ignoreDealId) {
    const needle = String(origId || "").trim();
    if (!needle) return 0;
    const rows = (STATE.dealsOpen || []).filter((d) => isFollowupDeal(d) && String(d.ID || "") !== String(ignoreDealId || "") && getDealLeadOrigemId(d) === needle && d._prazo && new Date(d._prazo).getTime() >= dayStart(new Date()).getTime());
    for (const d of rows) { removeDealLocal(String(d.ID)); enqueueSync({ type: "dealDelete", dealId: String(d.ID) }); }
    return rows.length;
  }

  function hasFutureFollowupForLeadOrig(origId, ignoreDealId) {
    const needle = String(origId || "").trim();
    if (!needle) return false;
    const now = Date.now();
    return (STATE.dealsOpen || []).some((d) => isFollowupDeal(d) && String(d.ID) !== String(ignoreDealId || "") && getDealLeadOrigemId(d) === needle && d._prazo && new Date(d._prazo).getTime() >= dayStart(new Date()).getTime());
  }
  function countOpenFutureFollowupsForLeadOrig(origId, ignoreDealId) {
    const needle = String(origId || "").trim();
    if (!needle) return 0;
    return (STATE.dealsOpen || []).filter((d) => isFollowupDeal(d) && String(d.ID) !== String(ignoreDealId || "") && getDealLeadOrigemId(d) === needle && d._prazo && new Date(d._prazo).getTime() >= dayStart(new Date()).getTime()).length;
  }
  function countDoneFollowupsForLeadOrig(origId) {
    const needle = String(origId || "").trim();
    if (!needle) return 0;
    return (STATE.dealsAll || []).filter((d) => isFollowupDeal(d) && getDealLeadOrigemId(d) === needle && STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId)).length;
  }
  function getLeadWithoutFutureFollowupCount(userId, statusId) {
    const leads = (STATE.leadsByUser.get(String(userId)) || []).filter((l) => String(l.STATUS_ID) === String(statusId || ""));
    return leads.filter((l) => !hasFutureFollowupForLeadOrig(leadOrigemId(l) || l.ID)).length;
  }
  function isFollowupDeal(d) {
    const t = norm(d._tarefaTxt || "");
    if (t.includes(norm("FOLLOW-UP"))) return true;
    const title = norm(d.TITLE || "");
    return title.startsWith(norm("FOLLOW-UP"));
  }

  function openNoFutureFollowupLeadBatchModal(user, leads, title) {
    const baseList = (leads || []).slice();
    openModal(title, `
      <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap">
        <div style="font-size:12px;font-weight:950;opacity:.85">Total visível: <strong id="noFuCount">${baseList.length}</strong></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input id="noFuSearch" class="eqd-searchInput" style="width:min(360px,70vw);color:#111;background:#fff;border-color:rgba(0,0,0,.18)" placeholder="Buscar lead..." />
          <input id="noFuOper" class="eqd-searchInput" style="width:180px;color:#111;background:#fff;border-color:rgba(0,0,0,.18)" placeholder="Filtrar operadora" />
          <button class="eqd-btn eqd-btnPrimary" id="noFuApply">Buscar</button>
          <button class="eqd-btn" id="noFuClear">Limpar</button>
          <button class="eqd-btn" id="noFuSelAll">Selecionar todos</button>
          <button class="eqd-btn" id="noFuSel10">Selecionar 10</button>
          <button class="eqd-btn" id="noFuBatchLost">Perdido em lote</button>
          <button class="eqd-btn" id="noFuBatch">Agendar FOLLOW-UP em lote</button>
        </div>
      </div>
      <div id="noFuLeadBox" style="margin-top:10px;display:flex;flex-direction:column;gap:8px"></div>
    `, { wide:true });

    const box = document.getElementById('noFuLeadBox');
    const getChecks = () => [...document.querySelectorAll('#noFuLeadBox .noFuLeadChk')];
    const render = () => {
      const kw = norm(String(document.getElementById('noFuSearch')?.value || '').trim());
      const op = norm(String(document.getElementById('noFuOper')?.value || '').trim());
      const visible = baseList.filter((l) => (!kw || leadMatchesKw(l, kw)) && (!op || norm(leadOperadora(l)).includes(op))).sort((a,b) => String(leadDataHora(b)||'').localeCompare(String(leadDataHora(a)||'')));
      box.innerHTML = visible.length ? visible.map((l) => {
        const op = leadOperadora(l);
        const idade = leadIdade(l);
        const bairro = leadBairro(l);
        const fonte = leadFonte(l);
        const tel = leadTelefone(l);
        const when = leadDataHora(l) ? fmt(leadDataHora(l)) : "—";
        const stageName = leadStageNameById(l.STATUS_ID) || "";
        const atendidoStamp = getLeadAtendidoStamp(l);
        const ageDays = leadAgeDays(l);
        const futureFu = countOpenFutureFollowupsForLeadOrig(leadOrigemId(l) || l.ID);
        const hasObs = !!String(leadObs(l) || '').trim();
        return `
        <label style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid rgba(0,0,0,.10);border-radius:14px;background:#f3f1eb;color:#111">
          <input type="checkbox" class="noFuLeadChk" data-id="${escHtml(String(l.ID))}" data-name="${escHtml(leadTitle(l))}" style="margin-top:4px" />
          <div style="display:flex;flex-direction:column;gap:6px;color:#111">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <div style="font-weight:950;color:#111">${escHtml(leadTitle(l))}</div>
              ${String(stageName).trim() ? `<span class="eqd-tag" style="background:#eef2ff;color:#1e3a8a">${escHtml(stageName)}</span>` : ``}
              ${hasObs ? `<span class="eqd-tag" style="background:#fef3c7;color:#92400e">OBS</span>` : `<span class="eqd-tag" style="background:#e5e7eb;color:#111">Sem OBS</span>`}
              <span class="eqd-tag" style="background:${leadHelena(l) ? '#ede9fe' : '#e5e7eb'};color:${leadHelena(l) ? '#6d28d9' : '#111'}">${leadHelena(l) ? 'HELENA' : 'HELENA NÃO'}</span>
              <span class="eqd-tag" style="background:${leadPessoal(l) ? '#dcfce7' : '#e5e7eb'};color:${leadPessoal(l) ? '#166534' : '#111'}">${leadPessoal(l) ? 'WPP DIRETO' : 'WPP DIRETO NÃO'}</span>
            </div>
            <div style="font-size:12px;display:flex;gap:10px;flex-wrap:wrap;color:#111">
              ${op ? `<span>Operadora: <strong>${escHtml(op)}</strong></span>` : ``}
              ${idade ? `<span>Idade: <strong>${escHtml(idade)}</strong></span>` : ``}
              ${tel ? `<span>Telefone: <strong>${escHtml(tel)}</strong></span>` : ``}
              ${bairro ? `<span>Bairro: <strong>${escHtml(bairro)}</strong></span>` : ``}
              ${fonte ? `<span>Fonte: <strong>${escHtml(fonte)}</strong></span>` : ``}
              <span>Data/Hora: <strong>${escHtml(when)}</strong></span>
              ${atendidoStamp ? `<span>Atendido em: <strong>${escHtml(atendidoStamp)}</strong></span>` : ``}
              ${leadPossuiPlano(l) ? `<span>Possui plano: <strong>${escHtml(leadPossuiPlano(l))}</strong></span>` : ``}
              ${[7,15,30,45,55].includes(ageDays) ? `<span style="color:#b91c1c">Alerta: <strong>${ageDays} dias</strong></span>` : ``}
              ${futureFu ? `<span style="color:#166534">FOLLOW-UP futuro: <strong>${futureFu}</strong></span>` : `<span style="color:#92400e">Sem FOLLOW-UP futuro</span>`}
              <span>FUPs concluídos: <strong>${countDoneFollowupsForLeadOrig(leadOrigemId(l) || l.ID)}</strong></span>
            </div>
            ${hasObs ? `<div style="font-size:12px;line-height:1.45;color:#111"><strong>OBS:</strong> ${escHtml(leadObs(l))}</div>` : ``}
            <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="leadBtn" data-action="leadEdit" data-leadid="${l.ID}" data-userid="${user.userId}">EDITAR</button></div>
          </div>
        </label>`;
      }).join('') : `<div class="eqd-empty">Nenhum lead.</div>`;
      const c = document.getElementById('noFuCount'); if (c) c.textContent = String(visible.length);
    };

    render();
    document.getElementById('noFuApply').onclick = render;
    document.getElementById('noFuSearch').onkeydown = (e) => { if (e.key === 'Enter') render(); };
    document.getElementById('noFuOper').onkeydown = (e) => { if (e.key === 'Enter') render(); };
    document.getElementById('noFuClear').onclick = () => { document.getElementById('noFuSearch').value=''; document.getElementById('noFuOper').value=''; render(); };
    document.getElementById('noFuSelAll').onclick = () => { getChecks().forEach((x) => x.checked = true); };
    document.getElementById('noFuSel10').onclick = () => { getChecks().forEach((x, idx) => x.checked = idx < 10); };
    document.getElementById('noFuBatchLost').onclick = async () => {
      const picks = getChecks().filter((x) => x.checked).map((x) => String(x.getAttribute('data-id') || ''));
      if (!picks.length) return alert('Selecione ao menos um lead.');
      if (!confirm(`Marcar ${picks.length} lead(s) como perdido em lote?`)) return;
      const sLost = leadStageId("LEAD DESCARTADO") || leadStageId("PERDIDO");
      if (!sLost) return alert('Etapa PERDIDO não encontrada.');
      setBusy('Movendo leads para perdido…');
      try {
        for (const leadId of picks) await moveLeadStage(String(user.userId), leadId, sLost, { skipLostPrompt: true });
        closeModal();
        openLeadsModalForUser(user.userId, LAST_LEADS_CTX.kw || '', { useCache: true, dateFilter: LAST_LEADS_CTX.dateFilter || '', operFilter: LAST_LEADS_CTX.operFilter || '' });
      } catch (e) {
        alert('Falha: ' + (e.message || e));
      } finally { clearBusy(); }
    };
    document.getElementById('noFuBatch').onclick = async () => {
      const picks = getChecks().filter((x) => x.checked).map((x) => ({ id: String(x.getAttribute('data-id') || ''), name: String(x.getAttribute('data-name') || '') }));
      if (!picks.length) return alert('Selecione ao menos um lead.');
      const base = new Date(); base.setHours(11,0,0,0);
      const localDefault = new Date(base.getTime() - (base.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      openModal(`Agendar FOLLOW-UP em lote — ${user.name}`, `
        <div class="eqd-warn" id="noFuBatchWarn"></div>
        <div style="display:grid;gap:10px">
          <div style="font-size:13px;font-weight:950">Leads selecionados: <strong>${picks.length}</strong></div>
          <input id="noFuBatchPrazo" type="datetime-local" value="${localDefault}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
          <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button class="eqd-btn" id="noFuBatchCancel">Cancelar</button><button class="eqd-btn eqd-btnPrimary" id="noFuBatchSave">Agendar</button></div>
        </div>
      `, { wide:true });
      document.getElementById('noFuBatchCancel').onclick = () => openNoFutureFollowupLeadBatchModal(user, leads, title);
      document.getElementById('noFuBatchSave').onclick = async () => {
        const warn = document.getElementById('noFuBatchWarn');
        const prazoIso = localInputToIsoWithOffset(String(document.getElementById('noFuBatchPrazo')?.value || '').trim());
        if (!prazoIso) { if (warn) { warn.style.display='block'; warn.textContent='Preencha a data e hora.'; } return; }
        setBusy('Agendando FOLLOW-UPs…');
        try {
          for (const pick of picks) await createFollowUpDealForUser(user, pick.name, prazoIso, { [DEAL_UF_LEAD_ORIGEM]: String(pick.id) });
          closeModal();
          renderCurrentView();
          openLeadsModalForUser(user.userId, LAST_LEADS_CTX.kw || '', { useCache: true, dateFilter: LAST_LEADS_CTX.dateFilter || '', operFilter: LAST_LEADS_CTX.operFilter || '' });
        } catch (e) {
          if (warn) { warn.style.display='block'; warn.textContent='Falha: ' + (e.message || e); }
        } finally { clearBusy(); }
      };
    };
  }



  function openGlobalNoFutureFollowupModal() {
    const atendId = String(leadStageId("ATENDIDO") || "");
    const qualId = String(leadStageId("QUALIFICADO") || "");
    const leadsAll = USERS.flatMap((u) => ((STATE.leadsByUser.get(String(u.userId)) || []).map((l) => ({ ...l, _ownerUserId: String(u.userId) }))));
    const baseList = leadsAll.filter((l) => [atendId, qualId].includes(String(l.STATUS_ID || "")) && !hasFutureFollowupForLeadOrig(leadOrigemId(l) || l.ID));
    const userOptions = ['<option value="">Todos os users</option>'].concat(USERS.map((u) => `<option value="${escHtml(String(u.userId))}">${escHtml(u.name)}</option>`)).join('');
    openModal(`Leads sem FOLLOW-UP — Todos os users`, `
      <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap">
        <div style="font-size:12px;font-weight:950;opacity:.85">Total visível: <strong id="globalNoFuCount">${baseList.length}</strong></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select id="globalNoFuUser" style="padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">${userOptions}</select>
          <input id="globalNoFuSearch" class="eqd-searchInput" style="width:min(280px,60vw);color:#111;background:#fff;border-color:rgba(0,0,0,.18)" placeholder="Buscar lead..." />
          <input id="globalNoFuOper" class="eqd-searchInput" style="width:180px;color:#111;background:#fff;border-color:rgba(0,0,0,.18)" placeholder="Filtrar operadora" />
          <button class="eqd-btn eqd-btnPrimary" id="globalNoFuApply">Buscar</button>
          <button class="eqd-btn" id="globalNoFuClear">Limpar</button>
          <button class="eqd-btn" id="globalNoFuSelAll">Selecionar todos</button>
          <button class="eqd-btn" id="globalNoFuSel10">Selecionar 10</button>
          <button class="eqd-btn" id="globalNoFuBatchLost">Perder em lote</button>
          <button class="eqd-btn" id="globalNoFuBatchConv">Converter em lote</button>
          <button class="eqd-btn" id="globalNoFuBatch">Reagendar FOLLOW-UP em lote</button>
        </div>
      </div>
      <div id="globalNoFuLeadBox" style="margin-top:10px;display:flex;flex-direction:column;gap:8px"></div>
    `, { wide:true });

    const box = document.getElementById('globalNoFuLeadBox');
    const getChecks = () => [...document.querySelectorAll('#globalNoFuLeadBox .globalNoFuLeadChk')];
    const visibleList = () => {
      const kw = norm(String(document.getElementById('globalNoFuSearch')?.value || '').trim());
      const op = norm(String(document.getElementById('globalNoFuOper')?.value || '').trim());
      const uid = String(document.getElementById('globalNoFuUser')?.value || '').trim();
      return baseList
        .filter((l) => (!uid || String(l._ownerUserId || l.ASSIGNED_BY_ID || '') === uid) && (!kw || leadMatchesKw(l, kw)) && (!op || norm(leadOperadora(l)).includes(op)))
        .sort((a,b) => String(leadDataHora(b)||'').localeCompare(String(leadDataHora(a)||'')));
    };
    const render = () => {
      const visible = visibleList();
      box.innerHTML = visible.length ? visible.map((l) => {
        const owner = USERS.find((u) => String(u.userId) === String(l._ownerUserId || l.ASSIGNED_BY_ID || ''));
        const op = leadOperadora(l);
        const idade = leadIdade(l);
        const bairro = leadBairro(l);
        const fonte = leadFonte(l);
        const tel = leadTelefone(l);
        const when = leadDataHora(l) ? fmt(leadDataHora(l)) : "—";
        const stageName = leadStageNameById(l.STATUS_ID) || "";
        const atendidoStamp = getLeadAtendidoStamp(l);
        const ageDays = leadAgeDays(l);
        const futureFu = countOpenFutureFollowupsForLeadOrig(leadOrigemId(l) || l.ID);
        const hasObs = !!String(leadObs(l) || '').trim();
        return `
        <label style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid rgba(0,0,0,.10);border-radius:14px;background:#f3f1eb;color:#111">
          <input type="checkbox" class="globalNoFuLeadChk" data-id="${escHtml(String(l.ID))}" data-name="${escHtml(leadTitle(l))}" data-userid="${escHtml(String(l._ownerUserId || l.ASSIGNED_BY_ID || ''))}" style="margin-top:4px" />
          <div style="display:flex;flex-direction:column;gap:6px;color:#111;flex:1 1 auto">
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <div style="font-weight:950;color:#111">${escHtml(leadTitle(l))}</div>
              ${owner ? `<span class="eqd-tag" style="background:#e0f2fe;color:#075985">USER: ${escHtml(owner.name)}</span>` : ``}
              ${String(stageName).trim() ? `<span class="eqd-tag" style="background:#eef2ff;color:#1e3a8a">${escHtml(stageName)}</span>` : ``}
              ${hasObs ? `<span class="eqd-tag" style="background:#fef3c7;color:#92400e">OBS</span>` : `<span class="eqd-tag" style="background:#e5e7eb;color:#111">Sem OBS</span>`}
              <span class="eqd-tag" style="background:${leadHelena(l) ? '#ede9fe' : '#e5e7eb'};color:${leadHelena(l) ? '#6d28d9' : '#111'}">${leadHelena(l) ? 'HELENA' : 'HELENA NÃO'}</span>
              <span class="eqd-tag" style="background:${leadPessoal(l) ? '#dcfce7' : '#e5e7eb'};color:${leadPessoal(l) ? '#166534' : '#111'}">${leadPessoal(l) ? 'WPP DIRETO' : 'WPP DIRETO NÃO'}</span>
            </div>
            <div style="font-size:12px;display:flex;gap:10px;flex-wrap:wrap;color:#111">
              ${op ? `<span>Operadora: <strong>${escHtml(op)}</strong></span>` : ``}
              ${idade ? `<span>Idade: <strong>${escHtml(idade)}</strong></span>` : ``}
              ${tel ? `<span>Telefone: <strong>${escHtml(tel)}</strong></span>` : ``}
              ${bairro ? `<span>Bairro: <strong>${escHtml(bairro)}</strong></span>` : ``}
              ${fonte ? `<span>Fonte: <strong>${escHtml(fonte)}</strong></span>` : ``}
              <span>Data/Hora: <strong>${escHtml(when)}</strong></span>
              ${atendidoStamp ? `<span>Atendido em: <strong>${escHtml(atendidoStamp)}</strong></span>` : ``}
              ${leadPossuiPlano(l) ? `<span>Possui plano: <strong>${escHtml(leadPossuiPlano(l))}</strong></span>` : ``}
              ${[7,15,30,45,55].includes(ageDays) ? `<span style="color:#b91c1c">Alerta: <strong>${ageDays} dias</strong></span>` : ``}
              ${futureFu ? `<span style="color:#166534">FOLLOW-UP futuro: <strong>${futureFu}</strong></span>` : `<span style="color:#92400e">Sem FOLLOW-UP futuro</span>`}
              <span>FUPs concluídos: <strong>${countDoneFollowupsForLeadOrig(leadOrigemId(l) || l.ID)}</strong></span>
            </div>
            ${hasObs ? `<div style="font-size:12px;line-height:1.45;color:#111"><strong>OBS:</strong> ${escHtml(leadObs(l))}</div>` : ``}
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="leadBtn" data-action="leadEdit" data-leadid="${l.ID}" data-userid="${escHtml(String(l._ownerUserId || l.ASSIGNED_BY_ID || ''))}">EDITAR</button>
              <button type="button" class="eqd-btn eqd-adminNoFuSingleLost" data-leadid="${escHtml(String(l.ID))}" data-userid="${escHtml(String(l._ownerUserId || l.ASSIGNED_BY_ID || ''))}">PERDER</button>
              <button type="button" class="eqd-btn eqd-adminNoFuSingleConv" data-leadid="${escHtml(String(l.ID))}" data-userid="${escHtml(String(l._ownerUserId || l.ASSIGNED_BY_ID || ''))}">CONVERTER</button>
              <button type="button" class="eqd-btn eqd-adminNoFuSingleFu" data-leadid="${escHtml(String(l.ID))}" data-userid="${escHtml(String(l._ownerUserId || l.ASSIGNED_BY_ID || ''))}">REAGENDAR FOLLOW-UP</button>
            </div>
          </div>
        </label>`;
      }).join('') : `<div class="eqd-empty">Nenhum lead.</div>`;
      const c = document.getElementById('globalNoFuCount'); if (c) c.textContent = String(visible.length);

      document.querySelectorAll('.eqd-adminNoFuSingleLost').forEach((btn) => btn.onclick = async () => {
        const uid = String(btn.getAttribute('data-userid') || '');
        const leadId = String(btn.getAttribute('data-leadid') || '');
        if (!uid || !leadId) return;
        const sLost = leadStageId("LEAD DESCARTADO") || leadStageId("PERDIDO");
        if (!sLost) return alert('Etapa PERDIDO não encontrada.');
        try {
          setBusy('Movendo lead para perdido…');
          await moveLeadStage(uid, leadId, sLost, { skipLostPrompt: true });
          openGlobalNoFutureFollowupModal();
        } catch (e) {
          alert('Falha: ' + (e.message || e));
        } finally { clearBusy(); }
      });
      document.querySelectorAll('.eqd-adminNoFuSingleConv').forEach((btn) => btn.onclick = async () => {
        const uid = String(btn.getAttribute('data-userid') || '');
        const leadId = String(btn.getAttribute('data-leadid') || '');
        if (!uid || !leadId) return;
        const sConv = leadStageId("LEAD CONVERTIDO") || leadStageId("CONVERTIDO");
        if (!sConv) return alert('Etapa CONVERTIDO não encontrada.');
        try {
          setBusy('Convertendo lead…');
          await moveLeadStage(uid, leadId, sConv);
          openGlobalNoFutureFollowupModal();
        } catch (e) {
          alert('Falha: ' + (e.message || e));
        } finally { clearBusy(); }
      });
      document.querySelectorAll('.eqd-adminNoFuSingleFu').forEach((btn) => btn.onclick = async () => {
        const uid = String(btn.getAttribute('data-userid') || '');
        const leadId = String(btn.getAttribute('data-leadid') || '');
        const u = USERS.find((x) => String(x.userId) === uid);
        const lead = (STATE.leadsByUser.get(uid) || []).find((l) => String(l.ID) === leadId);
        if (!u || !lead) return;
        return openFollowUpModal(u, leadTitle(lead), { leadId: leadOrigemId(lead) || String(lead.ID), returnToLeads: { userId: uid, kw: '' } });
      });
    };

    render();
    document.getElementById('globalNoFuApply').onclick = render;
    document.getElementById('globalNoFuUser').onchange = render;
    document.getElementById('globalNoFuSearch').onkeydown = (e) => { if (e.key === 'Enter') render(); };
    document.getElementById('globalNoFuOper').onkeydown = (e) => { if (e.key === 'Enter') render(); };
    document.getElementById('globalNoFuClear').onclick = () => {
      document.getElementById('globalNoFuUser').value = '';
      document.getElementById('globalNoFuSearch').value = '';
      document.getElementById('globalNoFuOper').value = '';
      render();
    };
    document.getElementById('globalNoFuSelAll').onclick = () => { getChecks().forEach((x) => x.checked = true); };
    document.getElementById('globalNoFuSel10').onclick = () => { getChecks().forEach((x, idx) => x.checked = idx < 10); };
    document.getElementById('globalNoFuBatchLost').onclick = async () => {
      const picks = getChecks().filter((x) => x.checked).map((x) => ({ leadId: String(x.getAttribute('data-id') || ''), userId: String(x.getAttribute('data-userid') || '') }));
      if (!picks.length) return alert('Selecione ao menos um lead.');
      if (!confirm(`Marcar ${picks.length} lead(s) como perdido em lote?`)) return;
      const sLost = leadStageId("LEAD DESCARTADO") || leadStageId("PERDIDO");
      if (!sLost) return alert('Etapa PERDIDO não encontrada.');
      setBusy('Movendo leads para perdido…');
      try {
        for (const pick of picks) await moveLeadStage(pick.userId, pick.leadId, sLost, { skipLostPrompt: true });
        openGlobalNoFutureFollowupModal();
      } catch (e) {
        alert('Falha: ' + (e.message || e));
      } finally { clearBusy(); }
    };
    document.getElementById('globalNoFuBatchConv').onclick = async () => {
      const picks = getChecks().filter((x) => x.checked).map((x) => ({ leadId: String(x.getAttribute('data-id') || ''), userId: String(x.getAttribute('data-userid') || '') }));
      if (!picks.length) return alert('Selecione ao menos um lead.');
      if (!confirm(`Converter ${picks.length} lead(s) em lote?`)) return;
      const sConv = leadStageId("LEAD CONVERTIDO") || leadStageId("CONVERTIDO");
      if (!sConv) return alert('Etapa CONVERTIDO não encontrada.');
      setBusy('Convertendo leads…');
      try {
        for (const pick of picks) await moveLeadStage(pick.userId, pick.leadId, sConv);
        openGlobalNoFutureFollowupModal();
      } catch (e) {
        alert('Falha: ' + (e.message || e));
      } finally { clearBusy(); }
    };
    document.getElementById('globalNoFuBatch').onclick = async () => {
      const picks = getChecks().filter((x) => x.checked).map((x) => ({ id: String(x.getAttribute('data-id') || ''), name: String(x.getAttribute('data-name') || ''), userId: String(x.getAttribute('data-userid') || '') }));
      if (!picks.length) return alert('Selecione ao menos um lead.');
      const base = new Date(); base.setHours(11,0,0,0);
      const localDefault = new Date(base.getTime() - (base.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      openModal(`Reagendar FOLLOW-UP em lote — Todos os users`, `
        <div class="eqd-warn" id="globalNoFuBatchWarn"></div>
        <div style="display:grid;gap:10px">
          <div style="font-size:13px;font-weight:950">Leads selecionados: <strong>${picks.length}</strong></div>
          <input id="globalNoFuBatchPrazo" type="datetime-local" value="${localDefault}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
          <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button class="eqd-btn" id="globalNoFuBatchCancel">Cancelar</button><button class="eqd-btn eqd-btnPrimary" id="globalNoFuBatchSave">Agendar</button></div>
        </div>
      `, { wide:true });
      document.getElementById('globalNoFuBatchCancel').onclick = () => openGlobalNoFutureFollowupModal();
      document.getElementById('globalNoFuBatchSave').onclick = async () => {
        const warn = document.getElementById('globalNoFuBatchWarn');
        const prazoIso = localInputToIsoWithOffset(String(document.getElementById('globalNoFuBatchPrazo')?.value || '').trim());
        if (!prazoIso) { if (warn) { warn.style.display='block'; warn.textContent='Preencha a data e hora.'; } return; }
        setBusy('Agendando FOLLOW-UPs…');
        try {
          for (const pick of picks) {
            const u = USERS.find((x) => String(x.userId) === String(pick.userId));
            if (!u) continue;
            await createFollowUpDealForUser(u, pick.name, prazoIso, { [DEAL_UF_LEAD_ORIGEM]: String(pick.id) });
          }
          openGlobalNoFutureFollowupModal();
        } catch (e) {
          if (warn) { warn.style.display='block'; warn.textContent='Falha: ' + (e.message || e); }
        } finally { clearBusy(); }
      };
    };
  }

  function openSelectRecentOldModal(n, onPick) {
    openModal(`Selecionar ${n}`, `<div style="display:flex;flex-direction:column;gap:12px"><div style="font-size:13px;font-weight:950;opacity:.86">Escolha como deseja selecionar os follow-ups.</div><div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap"><button class="eqd-btn" id="pickOldBtn">MAIS ANTIGOS</button><button class="eqd-btn eqd-btnPrimary" id="pickRecentBtn">MAIS RECENTES</button></div></div>`);
    document.getElementById('pickOldBtn').onclick = () => { closeModal(); onPick(false); };
    document.getElementById('pickRecentBtn').onclick = () => { closeModal(); onPick(true); };
  }

  function openFollowupListModalForUser(user) {
    const all = (STATE.dealsOpen || []).filter((d) => String(d.ASSIGNED_BY_ID || d._assigned || "") === String(user.userId));
    const list = all.filter((d) => isFollowupDeal(d) && !isDealDone(d));
    const pendingNoFuture = ((STATE.leadsByUser.get(String(user.userId)) || []).filter((l) => ["ATENDIDO","QUALIFICADO"].includes(leadStageNameById(l.STATUS_ID).toUpperCase()))).filter((l) => !hasFutureFollowupForLeadOrig(leadOrigemId(l) || l.ID)).length;

    openModal(`Lista de FOLLOW-UP — ${user.name}`, `
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between">
        <div style="font-size:12px;font-weight:950;opacity:.85">Total: <strong>${list.length}</strong> • Sem FOLLOW-UP futuro: <strong>${pendingNoFuture}</strong></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="eqd-btn" id="fuListPrevDay">←</button>
          <button class="eqd-btn" id="fuListYesterday">ONTEM</button>
          <button class="eqd-btn" id="fuListToday">HOJE</button>
          <button class="eqd-btn" id="fuListTomorrow">AMANHÃ</button>
          <button class="eqd-btn" id="fuListNextDay">→</button>
          <span id="fuListDayLabel" style="padding:6px 10px;border-radius:999px;border:1px solid rgba(0,0,0,.12);font-size:11px;font-weight:900;background:#fff">Dia selecionado: sem data</span>
          <input id="fuListDate" type="date" style="padding:6px 10px;border-radius:999px;border:1px solid rgba(0,0,0,.18);font-weight:900" />
          <input id="fuListSearch" class="eqd-searchInput" style="width:min(340px,55vw);color:#111;background:#fff;border-color:rgba(0,0,0,.18)" placeholder="Pesquisar follow-up..." />
          <button class="eqd-btn eqd-btnPrimary" id="fuListBtn">Buscar</button>
          <button class="eqd-btn" id="fuListClear">Limpar</button>
          <button class="eqd-btn" id="fuListSelectAll">SELECIONAR TODOS</button>
          <button class="eqd-btn" id="fuListSelect10">SELECIONAR 10</button>
          <button class="eqd-btn" id="fuListSelect20">SELECIONAR 20</button>
          <button class="eqd-btn" id="fuListSelectLate">SELECIONAR ATRASADOS</button>
          <button class="eqd-btn" id="fuListBatchLost">PERDIDO EM LOTE</button>
          <button class="eqd-btn" id="fuListBatch">REAGENDAR EM LOTE</button>
          <button class="eqd-btn" id="fuListBatchTransfer">TRANSFERIR USER</button>
        </div>
      </div>
      <div id="fuListBox" style="margin-top:10px;display:flex;flex-direction:column;gap:8px"></div>
    `, { wide: true });

    const box = document.getElementById("fuListBox");
    let currentKw = "";
    let currentDateFilter = "";
    let currentNavDate = null;
    const syncDayLabel = () => {
      const el = document.getElementById('fuListDayLabel');
      if (!el) return;
      if (!currentDateFilter) { el.textContent = "Dia selecionado: sem data"; return; }
      const dt = tryParseDateAny(`${currentDateFilter} 00:00`);
      el.textContent = dt ? `Dia selecionado: ${fmtDateOnly(dt)}` : `Dia selecionado: ${currentDateFilter}`;
    };
    const setCurrentDateFilter = (value) => {
      currentDateFilter = String(value || "").trim();
      const inp = document.getElementById('fuListDate');
      if (inp) inp.value = currentDateFilter;
      currentNavDate = currentDateFilter ? tryParseDateAny(`${currentDateFilter} 00:00`) : null;
      syncDayLabel();
    };
    const applyQuickDayFilter = (offsetDays) => {
      const d = new Date();
      d.setDate(d.getDate() + offsetDays);
      setCurrentDateFilter(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
      render(currentKw);
    };
    const shiftCurrentDay = (delta) => {
      const base = currentNavDate || new Date();
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
      d.setDate(d.getDate() + delta);
      setCurrentDateFilter(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
      render(currentKw);
    };
    const render = (kwRaw) => {
      currentKw = String(kwRaw || "").trim();
      setCurrentDateFilter(String(document.getElementById('fuListDate')?.value || currentDateFilter || '').trim());
      const kw = norm(currentKw);
      let filtered = kw ? list.filter((d) => norm([d.TITLE || "", d._obs || "", d._colabTxt || "", d._etapaTxt || "", d._urgTxt || ""].join(" ")).includes(kw)) : list.slice();
      if (currentDateFilter) {
        filtered = filtered.filter((d) => {
          if (!d || !d._prazo) return false;
          const dt = new Date(d._prazo);
          if (Number.isNaN(dt.getTime())) return false;
          const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
          return key === currentDateFilter;
        });
      }
      const ordered = sortDeals(filtered);
      box.innerHTML = ordered.length ? ordered.map((d) => makeDealCard(d, { allowBatch: true, extraMetaInside: `Criado em: <strong>${d.DATE_CREATE ? fmt(d.DATE_CREATE) : "—"}</strong>` })).join("") : `<div class="eqd-empty">Nenhum follow-up.</div>`;
    };

    render("");
    document.getElementById("fuListBtn").onclick = () => render(document.getElementById("fuListSearch").value);
    document.getElementById("fuListSearch").onkeydown = (e) => { if (e.key === "Enter") render(e.target.value); };
    const fuListDateEl = document.getElementById('fuListDate'); if (fuListDateEl) fuListDateEl.onchange = () => render(document.getElementById("fuListSearch").value);
    const yBtn = document.getElementById('fuListYesterday'); if (yBtn) yBtn.onclick = () => applyQuickDayFilter(-1);
    const tBtn = document.getElementById('fuListToday'); if (tBtn) tBtn.onclick = () => applyQuickDayFilter(0);
    const tmBtn = document.getElementById('fuListTomorrow'); if (tmBtn) tmBtn.onclick = () => applyQuickDayFilter(1);
    const prevBtn = document.getElementById('fuListPrevDay'); if (prevBtn) prevBtn.onclick = () => shiftCurrentDay(-1);
    const nextBtn = document.getElementById('fuListNextDay'); if (nextBtn) nextBtn.onclick = () => shiftCurrentDay(1);
    document.getElementById("fuListClear").onclick = () => { document.getElementById("fuListSearch").value = ""; if (fuListDateEl) fuListDateEl.value=''; currentDateFilter=''; currentNavDate=null; syncDayLabel(); render(""); };
    document.getElementById("fuListBatch").onclick = async () => {
      const ids = [...document.querySelectorAll("#fuListBox .eqd-batch:checked")].map((x) => x.getAttribute("data-id"));
      if (!ids.length) return alert("Selecione os follow-ups marcando 'Lote' nos cards.");
      await openBatchRescheduleAdvanced(ids, { onDone: () => openFollowupListModalForUser(user) });
    };
    const fuListBatchDoneBtn = document.getElementById("fuListBatchDone"); if (fuListBatchDoneBtn) fuListBatchDoneBtn.onclick = async () => {
      const ids = [...document.querySelectorAll("#fuListBox .eqd-batch:checked")].map((x) => x.getAttribute("data-id"));
      if (!ids.length) return alert("Selecione os follow-ups marcando 'Lote' nos cards.");
      for (const id of ids) await markDone(id);
      openFollowupListModalForUser(user);
    };
    const fuListBatchLostBtn = document.getElementById("fuListBatchLost"); if (fuListBatchLostBtn) fuListBatchLostBtn.onclick = async () => {
      const ids = [...document.querySelectorAll("#fuListBox .eqd-batch:checked")].map((x) => x.getAttribute("data-id"));
      if (!ids.length) return alert("Selecione os follow-ups marcando 'Lote' nos cards.");
      if (!confirm(`Marcar ${ids.length} follow-up(s) como perdido em lote?`)) return;
      for (const id of ids) {
        const d = getDealById(id);
        if (!d) continue;
        let lead = await resolveLeadForDeal(d);
        if (!lead) continue;
        await moveLeadStage(String(lead.ASSIGNED_BY_ID || lead._ownerUserId || ""), String(lead.ID), leadStageId("LEAD DESCARTADO") || leadStageId("PERDIDO"));
        await markDone(id);
      }
      openFollowupListModalForUser(user);
    };
    document.getElementById("fuListSelectAll").onclick = () => { document.querySelectorAll("#fuListBox .eqd-batch").forEach((x) => { x.checked = true; }); };
    const pickFollowListByMode = (n, pickRecent) => {
      const checks = [...document.querySelectorAll("#fuListBox .eqd-batch")];
      const sorted = checks.map((x) => {
        const d = getDealById(x.getAttribute("data-id"));
        const linkedLeadOrig = d ? getDealLeadOrigemId(d) : '';
        const linkedLead = linkedLeadOrig ? getLeadByOrigemId(linkedLeadOrig) : null;
        const dt = linkedLead ? (getLeadMetricDate(linkedLead) || tryParseDateAny(linkedLead.DATE_MODIFY) || tryParseDateAny(linkedLead.DATE_CREATE)) : null;
        return { x, ts: dt ? dt.getTime() : 0 };
      }).sort((a,b) => pickRecent ? (b.ts - a.ts) : (a.ts - b.ts));
      checks.forEach((item) => { item.checked = false; });
      sorted.slice(0,n).forEach((item) => { item.x.checked = true; });
    };
    const s10 = document.getElementById("fuListSelect10"); if (s10) s10.onclick = () => openSelectRecentOldModal(10, (pickRecent) => pickFollowListByMode(10, pickRecent));
    const s20 = document.getElementById("fuListSelect20"); if (s20) s20.onclick = () => openSelectRecentOldModal(20, (pickRecent) => pickFollowListByMode(20, pickRecent));
    document.getElementById("fuListSelectLate").onclick = () => { document.querySelectorAll("#fuListBox .eqd-batch").forEach((x) => { const d = getDealById(x.getAttribute("data-id")); x.checked = !!(d && d._late); }); };
    document.getElementById("fuListBatchTransfer").onclick = async () => {
      const ids = [...document.querySelectorAll("#fuListBox .eqd-batch:checked")].map((x) => x.getAttribute("data-id"));
      if (!ids.length) return alert("Selecione os follow-ups marcando 'Lote' nos cards.");
      openBatchTransferDealUser(ids, () => openFollowupListModalForUser(user));
    };
  }

  window.addEventListener('beforeunload', () => { try { persistSyncQueue(); } catch(_) {} });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      try { persistSyncQueue(); } catch(_) {}
    } else {
      flushSyncQueue().catch(()=>{});
      setTimeout(async () => {
        try {
          if (BX_INFLIGHT > 0 || SYNC_QUEUE_RUNNING || (Array.isArray(SYNC_QUEUE) && SYNC_QUEUE.length)) return;
          await refreshData(true, { forceRecur: false, forceFullDeals: false, deferLeads: false });
          if (el.modalOverlay.style.display !== "flex") renderCurrentView();
        } catch(_) {}
      }, 450);
    }
  });
  window.addEventListener('pagehide', () => { try { persistSyncQueue(); } catch(_) {} });
  window.addEventListener('beforeunload', () => { try { persistSyncQueue(); } catch(_) {} });


  // =========================
  // 18) NOVA TAREFA (normal + recorrência)
  // =========================
  async function ensureDealFieldsMeta() {
    if (STATE.dealFieldsMeta) return STATE.dealFieldsMeta;
    const meta = await bx("crm.deal.fields", {});
    STATE.dealFieldsMeta = meta || {};
    return STATE.dealFieldsMeta;
  }

  function getFieldItemsFromMeta(meta, fieldCode) {
    const f = meta && meta[fieldCode];
    const items = f && Array.isArray(f.items) ? f.items : [];
    return items.slice().sort((a, b) => Number(a.SORT || 0) - Number(b.SORT || 0));
  }

  function renderOptions(items, placeholder) {
    const ph = placeholder || "Selecione…";
    const first = `<option value="">${escHtml(ph)}</option>`;
    const rest = items
      .map((it) => `<option value="${escHtml(String(it.ID))}">${escHtml(String(it.VALUE ?? it.NAME ?? it.ID))}</option>`)
      .join("");
    return first + rest;
  }

  function renderOptionsNoPlaceholder(items) {
    return (items || []).map((it) => `<option value="${escHtml(String(it.ID))}">${escHtml(String(it.VALUE ?? it.NAME ?? it.ID))}</option>`).join("");
  }

  function scoreLeadCandidateForFollowup(lead, followTitleBase, firstName, dealId) {
    const full = norm(String(followTitleBase || ''));
    const first = norm(String(firstName || ''));
    const title = norm(leadTitle(lead));
    let score = 0;
    if (first && norm(firstNameFromText(leadTitle(lead))) === first) score += 100;
    if (full && title === full) score += 120;
    if (full && title.includes(full)) score += 40;
    if (first && title.includes(first)) score += 24;
    const origem = leadOrigemId(lead) || lead.ID;
    const fuCount = countOpenFutureFollowupsForLeadOrig(origem, dealId);
    if (!fuCount) score += 30;
    else score -= fuCount * 50;
    return score;
  }


  function leadIsDiscarded(lead) {
    const sPerdido = leadStageId('LEAD DESCARTADO') || leadStageId('PERDIDO');
    return !!(lead && sPerdido && String(lead.STATUS_ID || '') === String(sPerdido));
  }

  function formatLeadCandidateLabel(lead, dealId) {
    const origem = leadOrigemId(lead) || lead.ID;
    const fu = countOpenFutureFollowupsForLeadOrig(origem, dealId);
    const stage = String(leadStageNameById(lead.STATUS_ID) || 'Sem etapa').trim();
    const tel = String(leadTelefone(lead) || '').trim();
    const discarded = leadIsDiscarded(lead);
    const suffix = fu ? ` • ${fu} FUP(s)` : ' • sem FUP';
    return `${discarded ? '🔴 ' : ''}${leadTitle(lead)}${tel ? ` • ${tel}` : ''} • ${stage}${suffix}`;
  }

  function getLikelyLeadCandidatesForFollowup(deal, opts = {}) {
    const ownerUid = String(deal && (deal.ASSIGNED_BY_ID || deal._assigned) || '').trim();
    const titleBase = String(bestTitleFromText(String(deal && deal.TITLE || '').replace(/^FOLLOW-UP\s*/i, ''))).trim();
    const first = norm(firstNameFromText(titleBase));
    const kw = norm(String(opts.kw || '').trim());
    let pool = ownerUid ? (STATE.leadsByUser.get(ownerUid) || []) : Array.from(STATE.leadsByUser.values()).flat();
    const unique = []; const seen = new Set();
    for (const l of pool) { const id = String(l && l.ID || ''); if (!id || seen.has(id)) continue; seen.add(id); unique.push(l); }
    let rows = unique.filter((l) => !countOpenFutureFollowupsForLeadOrig(leadOrigemId(l) || l.ID, deal && deal.ID));
    if (kw) rows = rows.filter((l) => norm([leadTitle(l), leadOperadora(l), leadTelefone(l), leadBairro(l), leadFonte(l)].join(' ')).includes(kw));
    else if (first) {
      const exactFirst = rows.filter((l) => norm(firstNameFromText(leadTitle(l))) === first);
      const containsFirst = rows.filter((l) => norm(leadTitle(l)).includes(first));
      rows = exactFirst.length ? exactFirst : containsFirst;
    }
    const dealId = String(deal && deal.ID || '');
    rows = rows.slice().sort((a,b) => {
      const sa = scoreLeadCandidateForFollowup(a, titleBase, first, dealId);
      const sb = scoreLeadCandidateForFollowup(b, titleBase, first, dealId);
      if (sa !== sb) return sb - sa;
      return String(leadTitle(a)||'').localeCompare(String(leadTitle(b)||''), 'pt-BR');
    });
    return rows;
  }

  function makeDealListRow(deal, context) {
    const prazoTxt = deal._prazo ? fmt(deal._prazo) : 'Sem prazo';
    const title = bestTitleFromText(deal.TITLE || '');
    const linkedLeadOrig = getDealLeadOrigemId(deal);
    const linkedLead = linkedLeadOrig ? getLeadByOrigemId(linkedLeadOrig) : null;
    const chips = [];
    if (deal._tarefaTxt) chips.push(`<span class="eqd-tag">${escHtml(trunc(deal._tarefaTxt, 20))}</span>`);
    if (deal._urgTxt) chips.push(`<span class="eqd-tag">${escHtml(trunc(deal._urgTxt, 16))}</span>`);
    if (deal._late) chips.push(`<span class="eqd-tag eqd-tagLate">ATRASADA</span>`);
    if (deal._hasObs) chips.push(`<span class="eqd-tag eqd-tagObs" data-action="editObs" data-id="${deal.ID}">OBS</span>`);
    if (isFollowupDeal(deal) && linkedLeadOrig) chips.push(`<span class="eqd-tag">FUs concluídos: ${countDoneFollowupsForLeadOrig(linkedLeadOrig)}</span>`);
    const batch = context && context.allowBatch ? `<label style="display:flex;gap:6px;align-items:center;font-size:11px;font-weight:900"><input type="checkbox" class="eqd-batch" data-id="${deal.ID}"> Lote</label>` : ``;
    const actions = isFollowupDeal(deal)
      ? `${linkedLeadOrig ? `` : `<button class="eqd-smallBtn" data-action="linkFollowup" data-id="${deal.ID}">Vincular</button>`}<button class="eqd-smallBtn eqd-smallBtnPrimary" data-action="followupConverter" data-id="${deal.ID}">Converter</button><button class="eqd-smallBtn" data-action="reagendarDireto" data-id="${deal.ID}">Reagendar</button><button class="eqd-smallBtn eqd-smallBtnDanger" data-action="followupPerdido" data-id="${deal.ID}">Perdido</button>`
      : `<button class="eqd-smallBtn eqd-smallBtnPrimary" data-action="doneOnly" data-id="${deal.ID}">Concluir</button><button class="eqd-smallBtn" data-action="reagendarDireto" data-id="${deal.ID}">Reagendar</button>`;
    return `<div class="eqd-listRow" data-deal="${deal.ID}"><div><div class="eqd-listTitle">${escHtml(title)}</div><div class="eqd-listMeta">${chips.join('')}</div></div><div class="eqd-listMeta"><span>Prazo: <strong>${escHtml(prazoTxt)}</strong></span>${linkedLead ? `<span>${escHtml(leadTitle(linkedLead))}</span>` : ``}</div><div class="eqd-listMeta">${deal._colabTxt ? `<span>COLAB: <strong>${escHtml(trunc(deal._colabTxt,20))}</strong></span>` : ``}${deal._etapaTxt ? `<span>Etapa: <strong>${escHtml(trunc(deal._etapaTxt,18))}</strong></span>` : ``}<span>ID: <strong>${escHtml(deal.ID)}</strong></span></div><div class="eqd-listActions">${actions}</div><div>${batch}</div></div>`;
  }

  function renderDealsByMode(deals, context, userId) {
    return deals.length ? deals.map((d) => makeDealCard(d, context)).join('') : `<div class="eqd-empty">Sem itens</div>`;
  }

  function openNewTaskModalForUser(user, opts) {
    const dt0 = new Date();
    dt0.setMinutes(dt0.getMinutes() + 60);
    const localDefault = new Date(dt0.getTime() - dt0.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    const daysRow = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      return `
        <label style="display:flex;gap:8px;align-items:center;font-size:12px;font-weight:950">
          <input type="checkbox" class="ntDow" value="${i}" ${[1, 2, 3, 4, 5].includes(i) ? "checked" : ""}>
          ${dowNamePt(i)}
        </label>
      `;
    }).join("");

    openModal(
      `Nova tarefa — ${user.name}`,
      `
      <div class="eqd-warn" id="ntWarn"></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">NOME DO NEGÓCIO</div>
          <input id="ntTitle" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900"
                 placeholder="Ex.: LIGAR PARA JOÃO / COBRAR DOCUMENTOS / REUNIÃO..." />
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">PRAZO (data e hora)</div>
          <input id="ntPrazo" type="datetime-local" value="${localDefault}"
                 style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" />
          <div style="font-size:11px;font-weight:900;opacity:.70;margin-top:6px">Para recorrência, este horário vira o horário padrão.</div>
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">RECORRÊNCIA</div>
          <select id="ntRecType" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">
            <option value="NONE">Sem recorrência</option>
            <option value="DAILY_BUSINESS">Diária (dias úteis)</option>
            <option value="WEEKLY">Semanal (escolher dias)</option>
            <option value="MONTHLY">Mensal (dia do mês)</option>
            <option value="YEARLY">Anual (dia/mês)</option>
          </select>
        </div>

        <div style="grid-column:1 / -1;display:none" id="ntWeeklyBox">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">DIAS DA SEMANA</div>
          <div style="display:flex;gap:12px;flex-wrap:wrap;border:1px solid rgba(0,0,0,.10);padding:10px;border-radius:12px;background:rgba(255,255,255,.55)">
            ${daysRow}
          </div>
        </div>

        <div style="display:none" id="ntMonthlyBox">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">DIA DO MÊS</div>
          <input id="ntMonthDay" type="number" min="1" max="31" value="1"
                 style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" />
        </div>

        <div style="display:none" id="ntYearlyBox">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">DATA DO ANO</div>
          <input id="ntYearMD" type="date"
                 style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" />
          <div style="font-size:11px;font-weight:900;opacity:.70;margin-top:6px">Escolha qualquer ano — será salvo só o dia/mês.</div>
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">TIPO DA TAREFA</div>
          <select id="ntTipo" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">
            <option value="">Carregando…</option>
          </select>
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">URGÊNCIA</div>
          <select id="ntUrg" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">
            <option value="">Carregando…</option>
          </select>
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">COLAB (opcional)</div>
          <input id="ntColab" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900"
                 placeholder="Texto livre (opcional)" />
        </div>

        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">OBS (opcional)</div>
          <textarea id="ntObs" rows="4" style="width:100%;border-radius:14px;border:1px solid rgba(30,40,70,.16);padding:10px;font-weight:900;outline:none" placeholder="Observações..."></textarea>
        </div>

        <div style="grid-column:1 / -1;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="ntSave">SALVAR / CRIAR</button>
        </div>
      </div>
    `,
      { wide: true }
    );

    // preencher selects
    (async () => {
      try {
        const meta = await ensureDealFieldsMeta();
        const tipoItems = getFieldItemsFromMeta(meta, UF_TAREFA);
        const urgItems = getFieldItemsFromMeta(meta, UF_URGENCIA);

        const selTipo = document.getElementById("ntTipo");
        const selUrg = document.getElementById("ntUrg");

        if (selTipo) selTipo.innerHTML = renderOptions(tipoItems, "Selecione o tipo…");
        if (selUrg) {
          selUrg.innerHTML = renderOptions(urgItems, "Selecione a urgência…");
          const normal = (urgItems || []).find((it) => norm(String(it.VALUE || it.NAME || '')).includes('NORMAL'));
          if (normal) selUrg.value = String(normal.ID);
        }
      } catch (_) {
        const selTipo = document.getElementById("ntTipo");
        const selUrg = document.getElementById("ntUrg");
        if (selTipo) selTipo.innerHTML = `<option value="">(falha ao carregar)</option>`;
        if (selUrg) selUrg.innerHTML = `<option value="">(falha ao carregar)</option>`;
      }
    })();

    const selRec = document.getElementById("ntRecType");
    const weeklyBox = document.getElementById("ntWeeklyBox");
    const monthlyBox = document.getElementById("ntMonthlyBox");
    const yearlyBox = document.getElementById("ntYearlyBox");
    const warn = document.getElementById("ntWarn");
    const btn = document.getElementById("ntSave");

    function refreshRecUI() {
      const v = String(selRec.value || "NONE");
      weeklyBox.style.display = v === "WEEKLY" ? "block" : "none";
      monthlyBox.style.display = v === "MONTHLY" ? "block" : "none";
      yearlyBox.style.display = v === "YEARLY" ? "block" : "none";
    }
    selRec.onchange = refreshRecUI;
    refreshRecUI();

    btn.onclick = async () => {
      const lk = `ntSave:${user.userId}`;
      if (!lockTry(lk)) return;

      try {
        btn.disabled = true;
        warn.style.display = "none";
        warn.textContent = "";

        const nomeNegocio = String(document.getElementById("ntTitle").value || "").trim();
        if (!nomeNegocio) throw new Error("Preencha o NOME DO NEGÓCIO.");
        if (isBlockedDealTitle(nomeNegocio)) throw new Error("Criação bloqueada para negócio #7259.");

        const prazoLocal = String(document.getElementById("ntPrazo").value || "").trim();
        const prazoIso = localInputToIsoWithOffset(prazoLocal);
        if (!prazoIso) throw new Error("Prazo inválido.");
        if (!await confirmWeekendModal(prazoIso, "esta tarefa")) return;

        const obs = String(document.getElementById("ntObs").value || "").trim();
        const colabTxt = String(document.getElementById("ntColab").value || "").trim();

        const etapaUfVal = "";
        const tipoVal = String((document.getElementById("ntTipo") || {}).value || "").trim();
        const urgVal = String((document.getElementById("ntUrg") || {}).value || "").trim();

        const recType = String(selRec.value || "NONE");
        const dt = new Date(prazoIso);
        const hh = dt.getHours();
        const mm = dt.getMinutes();

        setBusy("Salvando…");

        if (recType === "NONE") {
          const stageId = await stageIdForUserName(user.name);
          if (!stageId) throw new Error(`Não encontrei a coluna ${user.name} na pipeline.`);

          const fields = {
            CATEGORY_ID: Number(CATEGORY_MAIN),
            STAGE_ID: String(stageId),
            TITLE: nomeNegocio,
            ASSIGNED_BY_ID: Number(user.userId),
            [UF_PRAZO]: prazoIso,
          };

          if (obs) fields[UF_OBS] = obs;
          if (etapaUfVal) fields[UF_ETAPA] = etapaUfVal;
          if (tipoVal) fields[UF_TAREFA] = tipoVal;
          if (urgVal) fields[UF_URGENCIA] = urgVal;
          if (colabTxt) fields[UF_COLAB] = colabTxt;

          const created = await bx("crm.deal.add", { fields });
          const realId = String((created && (created.result || created)) || '').trim() || makeTempId("TMP_DEAL");
          upsertDealLocal(parseLocalDealFromFields(realId, fields));

          closeModal();
          rebuildDealsOpen();
          renderCurrentView();
          setTimeout(() => { refreshData(true).catch(()=>{}); }, 50);
          return;
        }

        const rule = {
          id: makeRuleId(),
          title: nomeNegocio,
          type: recType,
          hh,
          mm,
          obs: obs || "",
          createdAt: new Date().toISOString(),
          etapaUf: etapaUfVal || "",
          tipo: tipoVal || "",
          urg: urgVal || "",
          colab: colabTxt || "",
        };

        if (recType === "WEEKLY") {
          const dows = [...document.querySelectorAll(".ntDow:checked")].map((x) => Number(x.value));
          if (!dows.length) throw new Error("Selecione ao menos 1 dia da semana.");
          rule.weekDays = dows;
        }

        if (recType === "MONTHLY") {
          const md = Number(document.getElementById("ntMonthDay").value || 0);
          if (!(md >= 1 && md <= 31)) throw new Error("Dia do mês inválido.");
          rule.monthDay = md;
        }

        if (recType === "YEARLY") {
          const v = String(document.getElementById("ntYearMD").value || "").trim();
          const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (!m) throw new Error("Escolha uma data válida no campo ANUAL.");
          rule.yearMD = `${m[2]}-${m[3]}`;
        }

        if (!STATE.recurRulesByUser || STATE.recurRulesByUser.size === 0) {
          await loadRecurrenceConfigDeals();
        }

        // ✅ SALVAR AQUI (salva a regra no deal de RECORRÊNCIA do user)
        await addRuleForUser(user.userId, rule);

        closeModal();

        await generateRecurringDealsWindow();
        await refreshData(true);
        renderCurrentView();
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally {
        btn.disabled = false;
        clearBusy();
        lockRelease(lk);
      }
    };
  }

  // =========================
  // 19) LEADS MODAL (OBS + criar manual + mover etapa + follow-up)
  // =========================
  function leadMatchesKw(l, kwNorm) {
    if (!kwNorm) return true;
    const blob = norm([leadTitle(l), leadOperadora(l), leadTelefone(l), leadBairro(l), leadFonte(l), leadDataHora(l), leadObs(l)].join(" "));
    return blob.includes(kwNorm);
  }

  function openLeadObsModal(userId, leadId) {
    const leads = STATE.leadsByUser.get(String(userId)) || [];
    const lead = leads.find((l) => String(l.ID) === String(leadId));
    if (!lead) return;

    const cur = leadObs(lead);

    openModal(`OBS — Lead`, `
      <div class="eqd-warn" id="lobWarn"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:12px;font-weight:950;opacity:.85">${escHtml(leadTitle(lead))}</div>
        <textarea id="lobText" rows="7" style="width:100%;border-radius:14px;border:1px solid rgba(30,40,70,.16);padding:10px;font-weight:850;outline:none">${escHtml(cur)}</textarea>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="lobSave">SALVAR OBS</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("lobWarn");
    const btn = document.getElementById("lobSave");

    btn.onclick = async () => {
      const lk = `leadObsSave:${userId}:${leadId}`;
      if (!lockTry(lk)) return;
      try {
        btn.disabled = true;
        warn.style.display = "none";
        const val = String(document.getElementById("lobText").value || "").trim();
        setBusy("Salvando OBS do lead…");

        // ✅ SALVAR AQUI (salva obs no lead)
        await bx("crm.lead.update", { id: String(leadId), fields: { [LEAD_UF_OBS]: val } });

        await loadLeadsForOneUser(userId);
        clearBusy();
        closeModal();
        reopenLeadsModalSafe({ noBackgroundReload: true });
      } catch (e) {
        clearBusy();
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally {
        btn.disabled = false;
        lockRelease(lk);
      }
    };
  }

  function upsertLeadLocal(userId, lead) {
    const uid = String(userId || "");
    if (!uid || !lead) return;
    const arr = (STATE.leadsByUser.get(uid) || []).slice();
    const id = String(lead.ID || "");
    const idx = arr.findIndex((l) => String(l.ID) === id);
    if (idx >= 0) arr[idx] = { ...arr[idx], ...lead }; else arr.unshift(lead);
    STATE.leadsByUser.set(uid, arr);
  }

  async function openManualLeadBatchCreateModal(user, defaultStatusId) {
    const uid = String(user && user.userId || '');
    if (!uid) return;
    const rowTpl = (i) => `
      <tr>
        <td style="padding:6px"><input data-k="name" data-i="${i}" style="width:100%;padding:8px;border-radius:10px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="NOME" /></td>
        <td style="padding:6px"><input data-k="idade" data-i="${i}" style="width:100%;padding:8px;border-radius:10px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="IDADE" /></td>
        <td style="padding:6px"><input data-k="tel" data-i="${i}" style="width:100%;padding:8px;border-radius:10px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="TELEFONE" /></td>
        <td style="padding:6px"><input data-k="bairro" data-i="${i}" style="width:100%;padding:8px;border-radius:10px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="BAIRRO" /></td>
        <td style="padding:6px"><input data-k="fonte" data-i="${i}" style="width:100%;padding:8px;border-radius:10px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="FONTE" /></td>
      </tr>`;
    openModal(`Novo Lead em lote — ${user.name}`, `
      <div class="eqd-warn" id="nlbWarn"></div>
      <div style="display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap;margin-bottom:10px">
        <div style="font-size:12px;font-weight:900;opacity:.8">Preencha NOME, IDADE, TELEFONE, BAIRRO e FONTE. Data/hora será automática.</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="eqd-btn" id="nlbAddRow">+ Linha</button>
          <button class="eqd-btn" data-action="modalClose">Fechar</button>
          <button class="eqd-btn eqd-btnPrimary" id="nlbSave">CRIAR LEADS</button>
        </div>
      </div>
      <div style="overflow:auto;max-height:70vh">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr><th style="text-align:left;padding:6px">NOME</th><th style="text-align:left;padding:6px">IDADE</th><th style="text-align:left;padding:6px">TELEFONE</th><th style="text-align:left;padding:6px">BAIRRO</th><th style="text-align:left;padding:6px">FONTE</th></tr></thead>
          <tbody id="nlbBody">${Array.from({length:10}, (_,i)=>rowTpl(i)).join('')}</tbody>
        </table>
      </div>
    `, { wide:true, full:true });
    const body = document.getElementById('nlbBody');
    const warn = document.getElementById('nlbWarn');
    let rowCount = 10;
    document.getElementById('nlbAddRow').onclick = () => { if (body) { body.insertAdjacentHTML('beforeend', rowTpl(rowCount++)); } };
    document.getElementById('nlbSave').onclick = async () => {
      const lk = `leadBatchCreate:${uid}`;
      if (!lockTry(lk)) return;
      try {
        warn.style.display = 'none';
        const rows = [];
        for (let i=0;i<rowCount;i++) {
          const q = (k) => document.querySelector(`[data-k="${k}"][data-i="${i}"]`);
          const name = String(q('name')?.value || '').trim();
          const idade = String(q('idade')?.value || '').trim();
          const tel = String(q('tel')?.value || '').trim();
          const bairro = String(q('bairro')?.value || '').trim();
          const fonte = String(q('fonte')?.value || '').trim();
          if (!name && !idade && !tel && !bairro && !fonte) continue;
          if (!name) throw new Error(`Linha ${i+1}: preencha o nome.`);
          rows.push({ name, idade, tel, bairro, fonte });
        }
        if (!rows.length) throw new Error('Preencha ao menos uma linha.');
        setBusy(`Criando ${rows.length} lead(s)…`);
        const nowIso = new Date().toISOString();
        for (const r of rows) {
          const fields = { ASSIGNED_BY_ID: Number(uid), NAME: r.name, TITLE: r.name, STATUS_ID: String(defaultStatusId || leadStageId('NOVO LEAD') || '') };
          if (r.idade) fields[LEAD_UF_IDADE] = r.idade;
          if (r.tel) fields[LEAD_UF_TELEFONE] = r.tel;
          if (r.bairro) fields[LEAD_UF_BAIRRO] = r.bairro;
          if (r.fonte) fields[LEAD_UF_FONTE] = r.fonte;
          fields[LEAD_UF_DATAHORA] = nowIso;
          const created = await bx('crm.lead.add', { fields });
          const newLeadId = String((created && (created.result || created)) || '').trim() || makeTempId('TMP_LEAD');
          const localLead = { ID: newLeadId, ASSIGNED_BY_ID: Number(uid), NAME: r.name, TITLE: r.name, STATUS_ID: String(defaultStatusId || leadStageId('NOVO LEAD') || ''), DATE_CREATE: nowIso, DATE_MODIFY: nowIso, [LEAD_UF_IDADE]: r.idade, [LEAD_UF_TELEFONE]: r.tel, [LEAD_UF_BAIRRO]: r.bairro, [LEAD_UF_FONTE]: r.fonte, [LEAD_UF_DATAHORA]: nowIso, [LEAD_UF_LEAD_ORIGEM]: newLeadId };
          upsertLeadLocal(uid, localLead);
          if (newLeadId && LEAD_UF_LEAD_ORIGEM) { bx('crm.lead.update', { id: newLeadId, fields: { [LEAD_UF_LEAD_ORIGEM]: newLeadId } }).catch(()=>{}); }
        }
        closeModal();
        reopenLeadsModalSafe({ noBackgroundReload: true });
      } catch(e) {
        warn.style.display = 'block';
        warn.textContent = 'Falha:\n' + (e.message || e);
      } finally { clearBusy(); lockRelease(lk); }
    };
  }

  async function openManualLeadCreateModal(user, defaultStatusId, opts) {
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,16);

    openModal(`Novo Lead — ${user.name}`, `
      <div class="eqd-warn" id="nlWarn"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">NOME</div>
          <input id="nlName" value="${escHtml(String((opts && opts.prefillName) || ''))}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="Ex.: JOÃO SILVA" />
        </div>
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">OPERADORA</div>
          <input id="nlOp" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="Ex.: UNIMED" />
        </div>
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">IDADE</div>
          <input id="nlIdade" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="Ex.: 66" />
        </div>
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">TELEFONE</div>
          <input id="nlTel" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="Ex.: (21) 99999-9999" />
        </div>
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">BAIRRO</div>
          <input id="nlBairro" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="Ex.: BARRA" />
        </div>
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">FONTE</div>
          <input id="nlFonte" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="Ex.: GOOGLE ADS" />
        </div>
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">DATA/HORA</div>
          <input id="nlDh" type="datetime-local" value="${localNow}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" />
        </div>
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">POSSUI PLANO</div>
          <select id="nlPlano" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900"><option value=""></option><option>SIM</option><option>NÃO</option></select>
        </div>
        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">OBS</div>
          <textarea id="nlObs" rows="5" style="width:100%;border-radius:14px;border:1px solid rgba(30,40,70,.16);padding:10px;font-weight:900;outline:none" placeholder="Observações..."></textarea>
        </div>
        <div style="grid-column:1 / -1;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="nlSave">SALVAR LEAD</button>
        </div>
      </div>
    `, { wide: true });

    const warn = document.getElementById("nlWarn");
    const btn = document.getElementById("nlSave");

    btn.onclick = async () => {
      const lk = `leadCreate:${user.userId}`;
      if (!lockTry(lk)) return;
      const getVal = (id) => {
        const el = document.getElementById(id);
        return el && typeof el.value !== "undefined" ? String(el.value || "").trim() : "";
      };
      try {
        btn.disabled = true;
        warn.style.display = "none";
        warn.textContent = "";

        const NAME = getVal("nlName");
        const op = getVal("nlOp");
        const idade = getVal("nlIdade");
        const tel = getVal("nlTel");
        const bairro = getVal("nlBairro");
        const fonte = getVal("nlFonte");
        const dhLocal = getVal("nlDh");
        const dhIso = dhLocal ? localInputToIsoWithOffset(dhLocal) : "";
        const plano = getVal("nlPlano");
        const obsEl = document.getElementById("nlObs");
        const obs = obsEl && typeof obsEl.value !== "undefined" ? String(obsEl.value || "").trim() : "";

        if (!NAME) throw new Error("Preencha o nome.");

        const fields = { ASSIGNED_BY_ID: Number(user.userId), NAME, TITLE: NAME, STATUS_ID: String(defaultStatusId || leadStageId("NOVO LEAD") || "") };
        if (op) fields[LEAD_UF_OPERADORA] = op;
        if (idade) fields[LEAD_UF_IDADE] = idade;
        if (tel) fields[LEAD_UF_TELEFONE] = tel;
        if (bairro) fields[LEAD_UF_BAIRRO] = bairro;
        if (fonte) fields[LEAD_UF_FONTE] = fonte;
        if (dhIso) fields[LEAD_UF_DATAHORA] = dhIso;
        if (plano) fields[LEAD_UF_POSSUI_PLANO] = plano;
        if (obs) fields[LEAD_UF_OBS] = obs;

        setBusy("Salvando lead…");
        const created = await bx("crm.lead.add", { fields });
        const newLeadId = String((created && (created.result || created)) || "").trim();
        const localLead = {
          ID: newLeadId || makeTempId("TMP_LEAD"),
          ASSIGNED_BY_ID: Number(user.userId),
          NAME,
          TITLE: NAME,
          STATUS_ID: String(defaultStatusId || leadStageId("NOVO LEAD") || ""),
          DATE_CREATE: new Date().toISOString(),
          DATE_MODIFY: new Date().toISOString(),
          [LEAD_UF_OPERADORA]: op,
          [LEAD_UF_IDADE]: idade,
          [LEAD_UF_TELEFONE]: tel,
          [LEAD_UF_BAIRRO]: bairro,
          [LEAD_UF_FONTE]: fonte,
          [LEAD_UF_DATAHORA]: dhIso,
          [LEAD_UF_POSSUI_PLANO]: plano,
          [LEAD_UF_OBS]: obs,
          [LEAD_UF_LEAD_ORIGEM]: newLeadId || "",
        };
        if (newLeadId && LEAD_UF_LEAD_ORIGEM) {
          localLead[LEAD_UF_LEAD_ORIGEM] = newLeadId;
          setTimeout(() => { bx("crm.lead.update", { id: newLeadId, fields: { [LEAD_UF_LEAD_ORIGEM]: newLeadId } }).catch(()=>{}); }, 30);
        }
        upsertLeadLocal(user.userId, localLead);
        if (String(localLead.STATUS_ID) === String(leadStageId("NOVO LEAD") || "")) STATE.leadsAlertUsers.add(String(user.userId));
        clearBusy();
        if (opts && typeof opts.onSaved === "function") return opts.onSaved(localLead);
        return reopenLeadsModalSafe({ noBackgroundReload: true });
      } catch (e) {
        clearBusy();
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally {
        btn.disabled = false;
        lockRelease(lk);
      }
    };
  }



  async function openLeadEditModal(userId, leadId, opts) {
    const uid = String(userId || '').trim();
    const lid = String(leadId || '').trim();
    if (!uid || !lid) return;
    await loadLeadStages();
    const user = USERS.find((u) => String(u.userId) === uid) || { userId: uid, name: uid };
    const lead = (STATE.leadsByUser.get(uid) || []).find((l) => String(l.ID) === lid) || (STATE.globalLeadsAll || []).find((l) => String(l.ID) === lid) || null;
    if (!lead) return alert('Lead não encontrado no cache. Atualize os leads e tente novamente.');

    const stageOptions = [...STATE.leadStageNameById.entries()].map(([id, name]) => ({ id: String(id || ''), name: String(name || '').trim() })).filter((x) => x.id && x.name);
    const stageSelect = stageOptions.map((x) => `<option value="${escHtml(x.id)}" ${String(lead.STATUS_ID || '') === String(x.id) ? 'selected' : ''}>${escHtml(x.name)}</option>`).join('');
    const leadName = String(leadTitle(lead) || '').trim();
    const localDh = (() => {
      const dt = tryParseDateAny(leadDataHora(lead));
      if (!dt) return '';
      return new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
    })();

    openModal(`Editar lead — ${escHtml(user.name)}`, `
      <div class="eqd-warn" id="leadEditWarn"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">NOME</div><input id="leadEditName" value="${escHtml(leadName)}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" /></div>
        <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">ETAPA</div><select id="leadEditStatus" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${stageSelect}</select></div>
        <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">OPERADORA</div><input id="leadEditOper" value="${escHtml(leadOperadora(lead))}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" /></div>
        <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">IDADE</div><input id="leadEditIdade" value="${escHtml(leadIdade(lead))}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" /></div>
        <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">TELEFONE</div><input id="leadEditTel" value="${escHtml(leadTelefone(lead))}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" /></div>
        <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">BAIRRO</div><input id="leadEditBairro" value="${escHtml(leadBairro(lead))}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" /></div>
        <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">FONTE</div><input id="leadEditFonte" value="${escHtml(leadFonte(lead))}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" /></div>
        <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">DATA E HORA</div><input id="leadEditDh" type="datetime-local" value="${localDh}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" /></div>
        <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">POSSUI PLANO</div><input id="leadEditPlano" value="${escHtml(leadPossuiPlano(lead))}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" /></div>
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding-top:22px">
          <label style="display:inline-flex;gap:8px;align-items:center"><input id="leadEditHelena" type="checkbox" ${leadHelena(lead) ? 'checked' : ''}/> HELENA</label>
          <label style="display:inline-flex;gap:8px;align-items:center"><input id="leadEditPessoal" type="checkbox" ${leadPessoal(lead) ? 'checked' : ''}/> WPP DIRETO</label>
        </div>
        <div style="grid-column:1 / -1"><div style="font-size:11px;font-weight:900;margin-bottom:6px">OBS</div><textarea id="leadEditObs" rows="5" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${escHtml(leadObs(lead))}</textarea></div>
        <div style="grid-column:1 / -1;display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap"><button class="eqd-btn" data-action="modalClose">Cancelar</button><button class="eqd-btn eqd-btnPrimary" id="leadEditSave">SALVAR</button></div>
      </div>
    `, { wide:true });

    const leadEditSaveBtn = document.getElementById('leadEditSave');
    if (leadEditSaveBtn) leadEditSaveBtn.onclick = async () => {
      const warn = document.getElementById('leadEditWarn');
      try {
        const name = String(document.getElementById('leadEditName').value || '').trim();
        const statusId = String(document.getElementById('leadEditStatus').value || '').trim();
        const op = String(document.getElementById('leadEditOper').value || '').trim();
        const idade = String(document.getElementById('leadEditIdade').value || '').trim();
        const tel = String(document.getElementById('leadEditTel').value || '').trim();
        const bairro = String(document.getElementById('leadEditBairro').value || '').trim();
        const fonte = String(document.getElementById('leadEditFonte').value || '').trim();
        const dhIso = localInputToIsoWithOffset(String(document.getElementById('leadEditDh').value || '').trim());
        const plano = String(document.getElementById('leadEditPlano').value || '').trim();
        const obsTxt = String(document.getElementById('leadEditObs').value || '').trim();
        const hel = document.getElementById('leadEditHelena').checked ? '1' : '';
        const pes = document.getElementById('leadEditPessoal').checked ? '1' : '';
        if (!name) throw new Error('Informe o nome do lead.');
        if (!statusId) throw new Error('Informe a etapa do lead.');
        const patch = {
          TITLE: name,
          NAME: name,
          STATUS_ID: statusId,
          [LEAD_UF_OPERADORA]: op,
          [LEAD_UF_IDADE]: idade,
          [LEAD_UF_TELEFONE]: tel,
          [LEAD_UF_BAIRRO]: bairro,
          [LEAD_UF_FONTE]: fonte,
          [LEAD_UF_DATAHORA]: dhIso,
          [LEAD_UF_POSSUI_PLANO]: plano,
          [LEAD_UF_OBS]: obsTxt,
          [LEAD_UF_HELENA]: hel,
          [LEAD_UF_PESSOAL]: pes,
        };
        const localPatch = { ...patch, ID: lid, ASSIGNED_BY_ID: Number(uid), DATE_MODIFY: new Date().toISOString() };
        upsertLeadLocal(uid, localPatch);
        const gi = (STATE.globalLeadsAll || []).findIndex((x) => String(x.ID) === lid);
        if (gi >= 0) STATE.globalLeadsAll[gi] = { ...STATE.globalLeadsAll[gi], ...localPatch };
        await bx('crm.lead.update', { id: lid, fields: patch });
        closeModal();
        if (opts && typeof opts.onSaved === 'function') return opts.onSaved();
        if (LAST_LEADS_CTX && LAST_LEADS_CTX.userId) return reopenLeadsModalSafe({ noBackgroundReload: true });
        renderCurrentView();
      } catch (e) {
        if (warn) { warn.style.display = 'block'; warn.textContent = String(e.message || e); }
      }
    };
  }

  async function openLeadBatchCreateModal(user, defaultStatusId, opts) {
    const rows = Number((opts && opts.rows) || 8);
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,16);
    const rowHtml = (i) => `<tr>
      <td><input data-f="name" data-row="${i}" style="width:220px;padding:8px" /></td>
      <td><input data-f="op" data-row="${i}" style="width:130px;padding:8px" /></td>
      <td><input data-f="idade" data-row="${i}" style="width:70px;padding:8px" /></td>
      <td><input data-f="tel" data-row="${i}" style="width:130px;padding:8px" /></td>
      <td><input data-f="bairro" data-row="${i}" style="width:120px;padding:8px" /></td>
      <td><input data-f="fonte" data-row="${i}" style="width:120px;padding:8px" /></td>
      <td><input data-f="dh" data-row="${i}" type="datetime-local" value="${localNow}" style="width:170px;padding:8px" /></td>
      <td><select data-f="pp" data-row="${i}" style="width:90px;padding:8px"><option value=""></option><option>SIM</option><option>NÃO</option></select></td>
      <td><input data-f="obs" data-row="${i}" style="width:220px;padding:8px" /></td>
    </tr>`;
    openModal(`Lead em lote — ${user.name}`, `
      <div class="eqd-warn" id="lbWarn"></div>
      <div style="font-size:12px;font-weight:900;opacity:.78">Preencha uma linha por lead. Linhas sem nome serão ignoradas.</div>
      <div style="overflow:auto;max-height:68vh;border:1px solid rgba(0,0,0,.08);border-radius:12px">
        <table style="border-collapse:collapse;width:max-content;min-width:100%;font-size:12px">
          <thead><tr><th>Nome</th><th>Operadora</th><th>Idade</th><th>Telefone</th><th>Bairro</th><th>Fonte</th><th>Data/Hora</th><th>Possui plano</th><th>Obs</th></tr></thead>
          <tbody>${Array.from({length: rows}, (_,i) => rowHtml(i)).join('')}</tbody>
        </table>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap"><button class="eqd-btn" data-action="modalClose">Fechar</button><button class="eqd-btn eqd-btnPrimary" id="lbSave">SALVAR LOTE</button></div>
    `, { full:true });
    document.getElementById('lbSave').onclick = async () => {
      const warn = document.getElementById('lbWarn');
      try {
        setBusy('Salvando lote de leads…');
        const rowsData = [];
        for (let i=0;i<rows;i++) {
          const gv=(f)=>String((document.querySelector(`[data-f="${f}"][data-row="${i}"]`)||{}).value||'').trim();
          const name=gv('name'); if (!name) continue;
          rowsData.push({name,op:gv('op'),idade:gv('idade'),tel:gv('tel'),bairro:gv('bairro'),fonte:gv('fonte'),dh:gv('dh'),pp:gv('pp'),obs:gv('obs')});
        }
        if (!rowsData.length) throw new Error('Preencha ao menos um lead com nome.');
        for (const r of rowsData) {
          const fields = { ASSIGNED_BY_ID: Number(user.userId), NAME: r.name, TITLE: r.name, STATUS_ID: String(defaultStatusId || leadStageId("NOVO LEAD") || "") };
          if (r.op) fields[LEAD_UF_OPERADORA] = r.op;
          if (r.idade) fields[LEAD_UF_IDADE] = r.idade;
          if (r.tel) fields[LEAD_UF_TELEFONE] = r.tel;
          if (r.bairro) fields[LEAD_UF_BAIRRO] = r.bairro;
          if (r.fonte) fields[LEAD_UF_FONTE] = r.fonte;
          if (r.dh) fields[LEAD_UF_DATAHORA] = localInputToIsoWithOffset(r.dh);
          if (r.obs) fields[LEAD_UF_OBS] = r.obs;
          if (r.pp) fields[LEAD_UF_POSSUI_PLANO] = r.pp;
          const created = await bx("crm.lead.add", { fields });
          const newLeadId = String((created && (created.result || created)) || "").trim();
          const localLead = { ID: newLeadId || makeTempId("TMP_LEAD"), ASSIGNED_BY_ID:Number(user.userId), NAME:r.name, TITLE:r.name, STATUS_ID:String(defaultStatusId || leadStageId("NOVO LEAD") || ""), DATE_CREATE:new Date().toISOString(), DATE_MODIFY:new Date().toISOString(), [LEAD_UF_OPERADORA]:r.op, [LEAD_UF_IDADE]:r.idade, [LEAD_UF_TELEFONE]:r.tel, [LEAD_UF_BAIRRO]:r.bairro, [LEAD_UF_FONTE]:r.fonte, [LEAD_UF_DATAHORA]: localInputToIsoWithOffset(r.dh), [LEAD_UF_OBS]:r.obs, [LEAD_UF_POSSUI_PLANO]:r.pp, [LEAD_UF_LEAD_ORIGEM]: newLeadId || "" };
          upsertLeadLocal(user.userId, localLead);
        }
        clearBusy();
        reopenLeadsModalSafe({ noBackgroundReload: true });
      } catch(e) { clearBusy(); warn.style.display='block'; warn.textContent='Falha:\n'+(e.message||e); }
    };
  }



  async function openLeadsModalForUser(userId, kwRaw, opts) {
    const user = USERS.find((u) => String(u.userId) === String(userId));
    if (!user) return;

    await loadLeadStages();
    setLeadsCtx(user.userId, String(kwRaw || ""), { dateFilter: (opts && opts.dateFilter) || "", operFilter: (opts && opts.operFilter) || "" });

    const useCache = !!(opts && opts.useCache);
    const shouldLoadLeads = !!(opts && opts.forceReload) || !useCache || !STATE.leadsByUser.has(String(user.userId));
    let leadsUser = STATE.leadsByUser.get(String(user.userId)) || [];
    if (shouldLoadLeads) {
      setBusy("Carregando LEADS…");
      leadsUser = await loadLeadsSnapshotAllUsers({ force: true }).then(() => (STATE.leadsByUser.get(String(user.userId)) || [])).catch(() => (STATE.leadsByUser.get(String(user.userId)) || []));
      clearBusy();
    } else if (!(opts && opts.noBackgroundReload)) {
      setTimeout(async () => {
        try {
          await loadLeadsSnapshotAllUsers({ force: true });
          if (modal.style.display === 'block' && LAST_LEADS_CTX.userId === String(user.userId)) openLeadsModalForUser(user.userId, LAST_LEADS_CTX.kw || '', { useCache: true, noBackgroundReload: true, dateFilter: LAST_LEADS_CTX.dateFilter || '', operFilter: LAST_LEADS_CTX.operFilter || '' });
        } catch (_) {}
      }, 180);
    }

    STATE.leadsAlertUsers.delete(String(user.userId));

    const sAt = leadStageId("EM ATENDIMENTO");
    const sAtendido = leadStageId("ATENDIDO");
    const sQual = leadStageId("QUALIFICADO");
    const sPerdido = leadStageId("LEAD DESCARTADO") || leadStageId("PERDIDO");
    const sConv = leadStageId("LEAD CONVERTIDO") || leadStageId("CONVERTIDO");

    const kw = norm(String(kwRaw || "").trim());
    const dateFilter = String((opts && opts.dateFilter) || '').trim();
    const operFilter = norm(String((opts && opts.operFilter) || '').trim());
    const filtered = (kw ? leadsUser.filter((l) => leadMatchesKw(l, kw)) : leadsUser).filter((l) => {
      const okDate = !dateFilter || leadDateOnly(l) === dateFilter;
      const okOp = !operFilter || norm(leadOperadora(l)).includes(operFilter);
      return okDate && okOp;
    });

    const byAtendidoDesc = (a,b) => { const ta = parseFlexDate((a && a[LEAD_UF_ATENDIDO_DIA]) || (a && a.DATE_MODIFY) || 0); const tb = parseFlexDate((b && b[LEAD_UF_ATENDIDO_DIA]) || (b && b.DATE_MODIFY) || 0); return (tb?tb.getTime():0) - (ta?ta.getTime():0); };
    const byLeadDateDesc = (a,b) => String(leadDataHora(b)||'').localeCompare(String(leadDataHora(a)||''));
    const at = sAt ? filtered.filter((l) => String(l.STATUS_ID) === String(sAt)).sort(byLeadDateDesc) : [];
    const ok = sAtendido ? filtered.filter((l) => String(l.STATUS_ID) === String(sAtendido)).sort(byAtendidoDesc) : [];
    const q = sQual ? filtered.filter((l) => String(l.STATUS_ID) === String(sQual)).sort(byLeadDateDesc) : [];

    openModal(`Leads — ${user.name}`, `
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;align-items:center">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input id="leadSearch" class="eqd-searchInput"
            style="width:min(720px,85vw);color:#111;background:#fff;border-color:rgba(0,0,0,.18)"
            placeholder="Buscar lead por palavra (nome, operadora, tel, bairro, fonte, data/hora, etapa…)"
            value="${escHtml(String(kwRaw || ""))}" />
          <button class="eqd-btn eqd-btnPrimary" id="leadSearchBtn">Buscar</button>
          <button class="eqd-btn" id="leadSearchClear">Limpar</button>
        </div>

        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input id="leadDateFilter" type="date" class="eqd-searchInput" style="width:170px;color:#111;background:#fff;border-color:rgba(0,0,0,.18)" />
          <input id="leadOperFilter" class="eqd-searchInput" style="width:180px;color:#111;background:#fff;border-color:rgba(0,0,0,.18)" placeholder="Filtrar operadora" />
          <button class="eqd-btn" id="leadApplyFilters">Filtrar</button>
          <button class="eqd-btn" data-action="leadShowLost" data-userid="${user.userId}">PERDIDOS</button>
          <button class="eqd-btn" data-action="leadShowConv" data-userid="${user.userId}">CONVERTIDOS</button>
          <button class="eqd-btn" data-action="leadRefresh" data-userid="${user.userId}">ATUALIZAR</button>
          <button class="eqd-btn" data-action="leadNewManual" data-userid="${user.userId}">NOVO LEAD</button>
          <button class="eqd-btn" data-action="leadNewBatch" data-userid="${user.userId}">LEAD EM LOTE</button>
          <button class="eqd-btn" data-action="modalClose">Fechar</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,minmax(380px,1fr));gap:12px;margin-top:10px">
        <div class="panelCol">
          <div class="panelColHead" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
            <span>EM ATENDIMENTO (<strong>${at.length}</strong>)</span>
            <button class="eqd-btn" style="padding:6px 10px;font-size:11px" data-action="leadNewManual" data-userid="${user.userId}" data-defaultstatus="${escHtml(sAt||"")}">+ Criar</button>
          </div>
          <div class="panelColBody" id="ld_at"></div>
        </div>

        <div class="panelCol">
          <div class="panelColHead" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
            <span>ATENDIDOS (<strong>${ok.length}</strong>) • <button class="eqd-btn" style="padding:4px 8px;font-size:10px" id="okNoFuBtn">Sem FOLLOW-UP: <strong>${getLeadWithoutFutureFollowupCount(user.userId, sAtendido)}</strong></button></span>
            <button class="eqd-btn" style="padding:6px 10px;font-size:11px" data-action="leadNewManual" data-userid="${user.userId}" data-defaultstatus="${escHtml(sAtendido||"")}">+ Criar</button>
          </div>
          <div class="panelColBody" id="ld_ok"></div>
        </div>

        <div class="panelCol">
          <div class="panelColHead" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
            <span>QUALIFICADO (<strong>${q.length}</strong>) • <button class="eqd-btn" style="padding:4px 8px;font-size:10px" id="qNoFuBtn">Sem FOLLOW-UP: <strong>${getLeadWithoutFutureFollowupCount(user.userId, sQual)}</strong></button></span>
            <button class="eqd-btn" style="padding:6px 10px;font-size:11px" data-action="leadNewManual" data-userid="${user.userId}" data-defaultstatus="${escHtml(sQual||"")}">+ Criar</button>
          </div>
          <div class="panelColBody" id="ld_q"></div>
        </div>
      </div>
    `, { full: true });

    function cardLead(l, column) {
      const op = leadOperadora(l);
      const idade = leadIdade(l);
      const bairro = leadBairro(l);
      const fonte = leadFonte(l);
      const tel = leadTelefone(l);
      const when = leadDataHora(l) ? fmt(leadDataHora(l)) : "—";
      const stageName = leadStageNameById(l.STATUS_ID) || "";
      const atendidoStamp = getLeadAtendidoStamp(l);
      const ageDays = leadAgeDays(l);
      const futureFu = countOpenFutureFollowupsForLeadOrig(leadOrigemId(l) || l.ID);

      const obs = leadObs(l);
      const obsOn = !!String(obs||"").trim();
      const transferAlertText = /LEAD TRANSFERIDO/i.test(String(obs || "")) ? String(obs || "").split("\n")[0] : "";
      const obsChip = `<span class="leadObsChip ${obsOn ? "on" : "off"}" data-action="leadObsModal" data-leadid="${l.ID}" data-userid="${user.userId}">
        OBS <b>${obsOn ? "•" : ""}</b>
      </span>`;

      const mkBtn = (label, toStatus) =>
        `<button class="leadBtn ${toStatus === sPerdido ? "leadBtnD" : toStatus ? "leadBtnP" : ""}" data-action="leadMove" data-leadid="${l.ID}" data-tostatus="${toStatus || ""}" data-userid="${user.userId}">${label}</button>`;

      let btns = "";
      if (column === "AT") {
        btns = `${mkBtn("ATENDIDO",sAtendido)}${mkBtn("PERDIDO",sPerdido)}
                <button class="leadBtn" data-action="leadEdit" data-leadid="${l.ID}" data-userid="${user.userId}">EDITAR</button>
                <button class="leadBtn" data-action="leadTransferModal" data-leadid="${l.ID}" data-userid="${user.userId}">TRANSFERIR LEAD</button>
                <button class="leadBtn leadBtnD" data-action="leadDelete" data-leadid="${l.ID}" data-userid="${user.userId}">EXCLUIR</button>`;
      } else if (column === "OK") {
        btns = `${mkBtn("QUALIFICADO",sQual)}${mkBtn("PERDIDO",sPerdido)}${mkBtn("CONVERTIDO",sConv)}
                <button class="leadBtn" data-action="leadEdit" data-leadid="${l.ID}" data-userid="${user.userId}">EDITAR</button>
                <button class="leadBtn" data-action="leadTransferModal" data-leadid="${l.ID}" data-userid="${user.userId}">TRANSFERIR LEAD</button>
                <button class="leadBtn leadBtnD" data-action="leadDelete" data-leadid="${l.ID}" data-userid="${user.userId}">EXCLUIR</button>
                <button class="leadBtn" data-action="leadFollowupModal" data-leadid="${l.ID}" data-userid="${user.userId}">FOLLOW-UP</button><button class="leadBtn" data-action="leadRevalidate" data-leadid="${l.ID}" data-userid="${user.userId}">REVALIDAR +60 DIAS</button>`;
      } else if (column === "Q") {
        btns = `${mkBtn("PERDIDO",sPerdido)}${mkBtn("CONVERTIDO",sConv)}
                <button class="leadBtn" data-action="leadEdit" data-leadid="${l.ID}" data-userid="${user.userId}">EDITAR</button>
                <button class="leadBtn" data-action="leadTransferModal" data-leadid="${l.ID}" data-userid="${user.userId}">TRANSFERIR LEAD</button>
                <button class="leadBtn" data-action="leadFollowupModal" data-leadid="${l.ID}" data-userid="${user.userId}">FOLLOW-UP</button><button class="leadBtn" data-action="leadRevalidate" data-leadid="${l.ID}" data-userid="${user.userId}">REVALIDAR +60 DIAS</button>`;
      }

      return `
        <div class="leadCard">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
            <div class="leadTitle">${escHtml(leadTitle(l))}${String(leadStageNameById(l.STATUS_ID)||"").toUpperCase()==="QUALIFICADO" ? ` <span class="eqd-tag" style="background:#dbeafe;color:#1d4ed8">QUALIFICADO</span>` : ``}</div>
            ${obsChip}
          </div>

          <div class="leadMeta">
            ${op ? `<span>Operadora: <strong>${escHtml(op)}</strong></span>` : ``}
            ${idade ? `<span>Idade: <strong>${escHtml(idade)}</strong></span>` : ``}
            ${tel ? `<span>Telefone: <strong>${escHtml(tel)}</strong></span>` : ``}
            ${bairro ? `<span>Bairro: <strong>${escHtml(bairro)}</strong></span>` : ``}
            ${fonte ? `<span>Fonte: <strong>${escHtml(fonte)}</strong></span>` : ``}
            <span>Data/Hora: <strong>${escHtml(when)}</strong></span>
            ${stageName ? `<span>Etapa: <strong>${escHtml(stageName)}</strong></span>` : ``}
            ${atendidoStamp ? `<span>Atendido em: <strong>${escHtml(atendidoStamp)}</strong></span>` : ``}
            ${[7,15,30,45,55].includes(ageDays) ? `<span style="color:#b91c1c">Alerta: <strong>${ageDays} dias</strong></span>` : ``}
            ${futureFu ? `<span style="color:#166534">FOLLOW-UP futuro: <strong>${futureFu}</strong></span>` : `<span style="color:#92400e">Sem FOLLOW-UP futuro</span>`}
            ${transferAlertText ? `<span style="background:#fff3cd;color:#7c2d12;border:1px solid rgba(124,45,18,.18);padding:2px 8px;border-radius:999px"><strong>${escHtml(transferAlertText)}</strong></span>` : ``}
            ${leadPossuiPlano(l) ? `<span>Possui plano: <strong>${escHtml(leadPossuiPlano(l))}</strong></span>` : ``}
            <span>FUPs concluídos: <strong>${countDoneFollowupsForLeadOrig(leadOrigemId(l) || l.ID)}</strong></span>
            <span class="eqd-tag eqd-tagClickable" data-action="leadToggleHelena" data-leadid="${l.ID}" data-userid="${user.userId}" style="background:${leadHelena(l) ? "#ede9fe" : "#374151"};color:${leadHelena(l) ? "#6d28d9" : "#fff"};padding:2px 6px;border-radius:999px">${leadHelena(l) ? "HELENA" : "HELENA NÃO"}</span>
            <span class="eqd-tag eqd-tagClickable" data-action="leadTogglePessoal" data-leadid="${l.ID}" data-userid="${user.userId}" style="background:${leadPessoal(l) ? "#dcfce7" : "#6b7280"};color:${leadPessoal(l) ? "#166534" : "#fff"};padding:2px 6px;border-radius:999px">${leadPessoal(l) ? "WPP DIRETO" : "WPP DIRETO NÃO"}</span>
          </div>

          <div class="leadBtns">${btns}</div>
        </div>
      `;
    }

    document.getElementById("ld_at").innerHTML = at.length ? at.map((l) => cardLead(l, "AT")).join("") : `<div class="eqd-empty">Nenhum</div>`;
    document.getElementById("ld_ok").innerHTML = ok.length ? ok.map((l) => cardLead(l, "OK")).join("") : `<div class="eqd-empty">Nenhum</div>`;
    document.getElementById("ld_q").innerHTML = q.length ? q.map((l) => cardLead(l, "Q")).join("") : `<div class="eqd-empty">Nenhum</div>`;

    const reopenWithFilters = (kwVal) => openLeadsModalForUser(user.userId, kwVal, { useCache: true, dateFilter: String((document.getElementById("leadDateFilter")||{}).value || '').trim(), operFilter: String((document.getElementById("leadOperFilter")||{}).value || '').trim() });
    const dtEl = document.getElementById("leadDateFilter"); if (dtEl) dtEl.value = dateFilter;
    const opEl = document.getElementById("leadOperFilter"); if (opEl) opEl.value = String((opts && opts.operFilter) || '');
    document.getElementById("leadSearchBtn").onclick = () => reopenWithFilters(String(document.getElementById("leadSearch").value || "").trim());
    document.getElementById("leadSearch").onkeydown = (e) => { if (e.key === "Enter") reopenWithFilters(String(e.target.value || "").trim()); };
    document.getElementById("leadSearchClear").onclick = () => openLeadsModalForUser(user.userId, "", { useCache: true, dateFilter: '', operFilter: '' });
    const fa = document.getElementById("leadApplyFilters"); if (fa) fa.onclick = () => reopenWithFilters(String(document.getElementById("leadSearch").value || "").trim());
    const okNoFuBtn = document.getElementById("okNoFuBtn"); if (okNoFuBtn) okNoFuBtn.onclick = () => openNoFutureFollowupLeadBatchModal(user, ok.filter((l) => !hasFutureFollowupForLeadOrig(leadOrigemId(l) || l.ID)), `ATENDIDOS sem FOLLOW-UP — ${user.name}`);
    const qNoFuBtn = document.getElementById("qNoFuBtn"); if (qNoFuBtn) qNoFuBtn.onclick = () => openNoFutureFollowupLeadBatchModal(user, q.filter((l) => !hasFutureFollowupForLeadOrig(leadOrigemId(l) || l.ID)), `QUALIFICADOS sem FOLLOW-UP — ${user.name}`);
  }


  async function loadGlobalLeadsBulk(forceReload = false) {
    await loadLeadStages();
    const targetUsers = new Set(USERS.filter((u) => LEAD_USERS.has(String(u.userId))).map((u) => String(u.userId)));
    const nowMs = Date.now();
    const cacheOk = !forceReload && Array.isArray(STATE.globalLeadsAll) && STATE.globalLeadsAll.length && STATE.globalLeadsLoadedAt && (nowMs - Number(STATE.globalLeadsLoadedAt || 0) < 3 * 60 * 1000);
    if (cacheOk) return STATE.globalLeadsAll;

    const prevRows = Array.isArray(STATE.globalLeadsAll) ? STATE.globalLeadsAll.slice() : [];

    const select = [
      "ID","TITLE","NAME","LAST_NAME","STATUS_ID","ASSIGNED_BY_ID","DATE_CREATE","DATE_MODIFY","SOURCE_ID",
      LEAD_UF_OPERADORA, LEAD_UF_IDADE, LEAD_UF_TELEFONE, LEAD_UF_BAIRRO, LEAD_UF_FONTE, LEAD_UF_DATAHORA, LEAD_UF_OBS, LEAD_UF_ATENDIDO_DIA, LEAD_UF_LEAD_ORIGEM, LEAD_UF_HELENA, LEAD_UF_PESSOAL, LEAD_UF_POSSUI_PLANO,
    ].filter(Boolean);

    const statusIds = [leadStageId("NOVO LEAD"), leadStageId("EM ATENDIMENTO"), leadStageId("ATENDIDO"), leadStageId("QUALIFICADO"), ...lostLeadStageIds(), ...convertedLeadStageIds()].filter(Boolean);
    let leads = [];
    let okCalls = 0;
    setBusy("Carregando LEADS gerais…");
    if (statusIds.length) {
      for (const sid of statusIds) {
        try {
          const part = await bxAll("crm.lead.list", {
            filter: { STATUS_ID: String(sid) },
            select,
            order: { ID: "DESC" },
          });
          okCalls++;
          leads = leads.concat(part || []);
        } catch (_) {}
      }
    } else {
      try {
        leads = await bxAll("crm.lead.list", {
          filter: {},
          select,
          order: { ID: "DESC" },
        });
        okCalls++;
      } catch (_) {}
    }
    clearBusy();

    if (!okCalls) {
      if (prevRows.length) return prevRows;
      throw new Error("Falha ao carregar LEADS gerais do CRM.");
    }

    const seen = new Set();
    const rows = (leads || [])
      .filter((l) => targetUsers.has(String(l.ASSIGNED_BY_ID || "")))
      .filter((l) => {
        const id = String((l && l.ID) || "");
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((l) => ({ ...l, _ownerUserId: String(l.ASSIGNED_BY_ID || "") }));
    STATE.globalLeadsAll = rows;
    STATE.globalLeadsLoadedAt = Date.now();

    const byUser = new Map();
    for (const u of USERS) {
      if (!LEAD_USERS.has(String(u.userId))) continue;
      byUser.set(String(u.userId), []);
    }
    for (const l of rows) {
      const uid = String(l._ownerUserId || "");
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid).push({ ...l });
    }
    STATE.leadsAlertUsers = new Set();
    const novoStageId = String(leadStageId("NOVO LEAD") || "");
    for (const [uid, arr] of byUser.entries()) {
      STATE.leadsByUser.set(uid, arr);
      if (novoStageId && (arr || []).some((l) => String(l.STATUS_ID || "") === novoStageId)) STATE.leadsAlertUsers.add(String(uid));
    }
    return rows;
  }

  function getLeadMetricDate(l) {
    const raw = (l && l[LEAD_UF_ATENDIDO_DIA]) || "";
    return tryParseDateAny(raw);
  }

  function getLeadAtendidoStamp(l) {
    const raw = String((l && l[LEAD_UF_ATENDIDO_DIA]) || "").trim();
    if (!raw) return "";
    const dt = tryParseDateAny(raw);
    return dt ? fmt(dt) : raw;
  }

  function getLeadDayKeyFromMetric(l) {
    const dt = getLeadMetricDate(l);
    return dt ? ymdKey(dt) : "";
  }

  function renderGlobalLeadStatsTable(rows) {
    return `
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.12)">USER</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.12)">EM ATENDIMENTO</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.12)">ATENDIDO NO DIA</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((r) => `<tr><td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08);font-weight:900">${escHtml(r.name)}</td><td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${r.emAtendimento}</td><td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${r.atendidoNoDia}</td></tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function openGlobalLeadsDayStats() {
    const all = Array.isArray(STATE.globalLeadsAll) ? STATE.globalLeadsAll.slice() : [];
    const todayKey = ymdKey(new Date());
    const rows = USERS.filter((u) => LEAD_USERS.has(String(u.userId))).map((u) => {
      const mine = all.filter((l) => String(l._ownerUserId) === String(u.userId));
      const emAtendimento = mine.filter((l) => String(l.STATUS_ID) === String(leadStageId("EM ATENDIMENTO"))).length;
      const atendidoNoDia = mine.filter((l) => getLeadDayKeyFromMetric(l) === todayKey).length;
      return { name: u.name, emAtendimento, atendidoNoDia };
    });
    openModal(`LEADS • DIA (${fmtDateOnly(new Date())})`, `
      <div style="font-size:12px;font-weight:950;opacity:.82;margin-bottom:8px">
        * ATENDIDO NO DIA usa o campo UF_CRM_1772411982 do lead como referência, mesmo que hoje ele já esteja em outro stage.
      </div>
      ${renderGlobalLeadStatsTable(rows)}
    `, { wide: true });
  }

  function openGlobalLeadsHistoryModal(days) {
    const all = Array.isArray(STATE.globalLeadsAll) ? STATE.globalLeadsAll.slice() : [];
    const dates = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      dates.push(d);
    }
    const users = USERS.filter((u) => LEAD_USERS.has(String(u.userId)));
    const headerDays = dates.map((d) => `<th style="text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.12)">${escHtml(fmtDateOnly(d).slice(0,5))}</th>`).join("");
    const body = users.map((u) => {
      const mine = all.filter((l) => String(l._ownerUserId) === String(u.userId));
      const cols = dates.map((d) => {
        const key = ymdKey(d);
        const qty = mine.filter((l) => getLeadDayKeyFromMetric(l) === key).length;
        return `<td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08)">${qty}</td>`;
      }).join("");
      const total = dates.reduce((acc, d) => acc + mine.filter((l) => getLeadDayKeyFromMetric(l) === ymdKey(d)).length, 0);
      return `<tr><td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08);font-weight:900">${escHtml(u.name)}</td>${cols}<td style="padding:8px;border-bottom:1px solid rgba(0,0,0,.08);font-weight:900">${total}</td></tr>`;
    }).join("");
    openModal(`LEADS • ${days === 7 ? "SEMANA" : "MÊS"}`, `
      <div style="font-size:12px;font-weight:950;opacity:.82;margin-bottom:8px">
        Histórico de leads marcados como ATENDIDOS no dia pelo campo UF_CRM_1772411982, mesmo que depois mudem de stage.
      </div>
      <div style="overflow:auto">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.12)">USER</th>${headerDays}<th style="text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.12)">TOTAL</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `, { full: true });
  }

  function renderGlobalLeadsModal(filterUserId = "__ALL__") {
    let allLeads = Array.isArray(STATE.globalLeadsAll) ? STATE.globalLeadsAll.slice() : [];
    const targetUsers = USERS.filter((u) => LEAD_USERS.has(String(u.userId)));
    const sAt = leadStageId("EM ATENDIMENTO"); const sAtendido = leadStageId("ATENDIDO"); const sQual = leadStageId("QUALIFICADO");
    if (filterUserId !== "__ALL__") allLeads = allLeads.filter((l) => String(l._ownerUserId) === String(filterUserId));
    allLeads.sort((a, b) => new Date(b.DATE_CREATE || 0).getTime() - new Date(a.DATE_CREATE || 0).getTime());
    const at = allLeads.filter((l) => String(l.STATUS_ID) === String(sAt));
    const ok = allLeads.filter((l) => String(l.STATUS_ID) === String(sAtendido));
    const q = allLeads.filter((l) => String(l.STATUS_ID) === String(sQual));
    const userOptions = `<option value="__ALL__">Todas as vendedoras</option>` + targetUsers.map((u) => `<option value="${u.userId}" ${String(filterUserId) === String(u.userId) ? "selected" : ""}>${escHtml(u.name)}</option>`).join("");
    const card = (l) => { const owner = USERS.find((u) => String(u.userId) === String(l._ownerUserId)); const atendidoStamp = getLeadAtendidoStamp(l); return `<div class="leadCard"><div class="leadTitle">${escHtml(leadTitle(l))}${String(leadStageNameById(l.STATUS_ID)||"").toUpperCase()==="QUALIFICADO" ? ` <span class="eqd-tag" style="background:#dbeafe;color:#1d4ed8">QUALIFICADO</span>` : ``}</div><div class="leadMeta"><span>USER: <strong>${escHtml(owner ? owner.name : l._ownerUserId)}</strong></span><span>Criado em: <strong>${l.DATE_CREATE ? fmt(l.DATE_CREATE) : "—"}</strong></span>${leadOperadora(l) ? `<span>Operadora: <strong>${escHtml(leadOperadora(l))}</strong></span>` : ``}${leadTelefone(l) ? `<span>Telefone: <strong>${escHtml(leadTelefone(l))}</strong></span>` : ``}${atendidoStamp ? `<span>Atendido em: <strong>${escHtml(atendidoStamp)}</strong></span>` : ``}</div><div class="leadBtns"><button class="leadBtn" data-action="leadEdit" data-leadid="${l.ID}" data-userid="${escHtml(String(l._ownerUserId || l.ASSIGNED_BY_ID || ''))}">EDITAR</button></div></div>`; };

    openModal("LEADS GERAL", `
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;align-items:center">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select id="glUser" class="eqd-searchSelect" style="color:#111;background:#fff;border-color:rgba(0,0,0,.18)">${userOptions}</select>
          <button class="eqd-btn eqd-btnPrimary" id="glFilterBtn">Filtrar</button>
          <button class="eqd-btn" id="glRefreshBtn">Atualizar LEADS</button>
          <button class="eqd-btn" id="glDayBtn">DIA</button>
          <button class="eqd-btn" id="glWeekBtn">SEMANA</button>
          <button class="eqd-btn" id="glMonthBtn">MÊS</button>
        </div>
        <div style="font-size:12px;font-weight:950;opacity:.82">EM ATENDIMENTO: <strong>${at.length}</strong> • ATENDIDO: <strong>${ok.length}</strong> • QUALIFICADO: <strong>${q.length}</strong></div>
      </div>
      <div style="font-size:11px;font-weight:900;opacity:.70;margin-top:6px">Filtros em memória (rápidos). Atualizar LEADS refaz a carga no Bitrix.</div>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(380px,1fr));gap:12px;margin-top:10px">
        <div class="panelCol"><div class="panelColHead">EM ATENDIMENTO (${at.length})</div><div class="panelColBody">${at.length ? at.map(card).join("") : `<div class="eqd-empty">Nenhum</div>`}</div></div>
        <div class="panelCol"><div class="panelColHead">ATENDIDO (${ok.length})</div><div class="panelColBody">${ok.length ? ok.map(card).join("") : `<div class="eqd-empty">Nenhum</div>`}</div></div>
        <div class="panelCol"><div class="panelColHead">QUALIFICADO (${q.length})</div><div class="panelColBody">${q.length ? q.map(card).join("") : `<div class="eqd-empty">Nenhum</div>`}</div></div>
      </div>
    `, { full: true });

    document.getElementById("glFilterBtn").onclick = () => renderGlobalLeadsModal(String(document.getElementById("glUser").value || "__ALL__"));
    document.getElementById("glRefreshBtn").onclick = async () => { try { await loadGlobalLeadsBulk(true); renderGlobalLeadsModal(String(document.getElementById("glUser").value || "__ALL__")); } catch (e) { alert("Falha ao atualizar LEADS: " + (e && (e.message || e) || e)); } };
    document.getElementById("glDayBtn").onclick = () => openGlobalLeadsDayStats();
    document.getElementById("glWeekBtn").onclick = () => openGlobalLeadsHistoryModal(7);
    document.getElementById("glMonthBtn").onclick = () => openGlobalLeadsHistoryModal(30);
  }

  async function openGlobalLeadsModal(filterUserId = "__ALL__", forceReload = false) {
    await loadGlobalLeadsBulk(!!forceReload);
    renderGlobalLeadsModal(filterUserId);
  }

  // =========================
  // 20) USER CARD STATS / DAY+OVERDUE
  // =========================
  function overdueEmoji(overdueCount) {
    if (overdueCount <= 0) return "🟢";
    if (overdueCount === 2) return "🟡";
    if (overdueCount === 3) return "🟣";
    if (overdueCount >= 4) return "🔴";
    return "🟡";
  }

  function countUserStats(userId) {
    const all = (STATE.dealsAll || []).filter((d) => String(d.ASSIGNED_BY_ID || d._assigned || "") === String(userId));
    const open = all.filter((d) => !STATE.doneStageId || String(d.STAGE_ID) !== String(STATE.doneStageId));
    const done = all.filter((d) => STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId));

    const ds = dayStart(selectedDate).getTime();
    const de = dayEnd(selectedDate).getTime();
    const includeOverdue = !selectedDateIsFuture();

    const followDay = open.filter((d) => isFollowupDeal(d) && d._prazo && (() => { const t = new Date(d._prazo).getTime(); return Number.isFinite(t) && t >= ds && t <= de; })());
    const dayOpenPlusLate = open.filter((d) => {
      if (isFollowupDeal(d)) return false;
      if (!d._prazo) return false;
      const t = new Date(d._prazo).getTime();
      if (!Number.isFinite(t)) return false;
      if (includeOverdue) return (t >= ds && t <= de) || t < ds;
      return t >= ds && t <= de;
    });

    const dayDone = done.filter((d) => {
      if (!d._prazo || isFollowupDeal(d)) return false;
      const t = new Date(d._prazo).getTime();
      return Number.isFinite(t) && t >= ds && t <= de;
    });

    const overdueTasks = open.filter((d) => d._late && !isFollowupDeal(d)).length;
    const overdueFollow = open.filter((d) => d._late && isFollowupDeal(d)).length;
    return { day: dayOpenPlusLate.length, doneDay: dayDone.length, overdueTasks, followDay: followDay.length, overdueFollow };
  }

  function openLegendModal() {
    openModal("Legenda", `<div style="display:flex;flex-direction:column;gap:8px;font-size:12px;font-weight:900"><div>🟢 Sem atraso</div><div>🟡 1 ou 2 atrasos</div><div>🟣 3 atrasos</div><div>🔴 4 ou mais atrasos</div></div>`);
  }

  const MARKETING_MEMBERS = ["1","3079","3085","3081","3387","4367"];
const MARKETING_LOGO_URL = "https://bitrix24public.com/b24-6iyx5y.bitrix24.com.br/docs/pub/068f88c3fbd011deee71377532b727e5/showFile?token=0qvknd15el8g";


function makeMarketingCard() {
  return `<div class="userCard" data-action="openMktPanel"><div class="userEmoji" style="order:-1;align-self:center;min-width:22px;text-align:center">🟠</div><div class="userInfoLeft"><div class="userName">MARKETING</div><div class="userTeam">Agenda coletiva</div></div><div style="flex:0 0 auto;display:flex;align-items:center;justify-content:center;min-width:0;overflow:visible;background:transparent;border:none;box-shadow:none;padding:0"><img src="${MARKETING_LOGO_URL}" alt="Marketing" referrerpolicy="no-referrer" style="display:block;width:178px;height:112px;object-fit:contain;transform:scale(1.08);border:none;box-shadow:none;background:transparent;border-radius:0;outline:none" onerror="try{this.onerror=null;this.src='';this.style.display='none'}catch(e){}" /></div><div class="userRight"><div class="userLine">Users: <strong>${MARKETING_MEMBERS.length}</strong></div></div></div>`;
}

function mktTitleClean(v) {
  return String(v || '').replace(/^\[MKT\]\s*/,'').trim();
}

function mktDealGroupKey(d) {
  const title = norm(mktTitleClean(d && d.TITLE));
  const prazo = d && d._prazo ? new Date(d._prazo).toISOString().slice(0,16) : '';
  const tipo = norm((d && (d._tarefaTxt || d._tarefaId || d[UF_TAREFA])) || '');
  const obs = norm((d && (d._obs || d[UF_OBS])) || '');
  return [title, prazo, tipo, obs].join('|');
}

function groupMarketingDeals(list, members, memberColorMap) {
  const arr = Array.isArray(list) ? list : [];
  const byId = new Map((members || []).map((u) => [String(u.userId), u]));
  const grouped = new Map();
  arr.forEach((d) => {
    if (!d) return;
    const key = mktDealGroupKey(d);
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        title: mktTitleClean(d.TITLE),
        prazo: d._prazo || d[UF_PRAZO] || '',
        typeId: String(d._tarefaId || d[UF_TAREFA] || '').trim(),
        typeTxt: String(d._tarefaTxt || '').trim(),
        obs: String(d._obs || d[UF_OBS] || '').trim(),
        ids: [],
        deals: [],
        participantIds: [],
        participantNames: [],
      });
    }
    const g = grouped.get(key);
    g.ids.push(String(d.ID || ''));
    g.deals.push(d);
    const ownerId = String(d.ASSIGNED_BY_ID || d._assigned || '').trim();
    if (ownerId && !g.participantIds.includes(ownerId)) g.participantIds.push(ownerId);
    const owner = byId.get(ownerId);
    const ownerName = owner ? owner.name : ownerId;
    if (ownerName && !g.participantNames.includes(ownerName)) g.participantNames.push(ownerName);
    const colab = String(d._colabTxt || d[UF_COLAB] || '').split(',').map((x) => String(x || '').trim()).filter(Boolean);
    colab.forEach((name) => { if (!g.participantNames.includes(name)) g.participantNames.push(name); });
  });
  return [...grouped.values()].map((g) => {
    g.participantIds = g.participantIds.filter((id) => byId.has(id));
    g.participantNames = g.participantIds.length
      ? g.participantIds.map((id) => byId.get(id)?.name).filter(Boolean)
      : g.participantNames;
    g.participantChips = g.participantIds.map((uid) => {
      const owner = byId.get(uid);
      const bg = memberColorMap[uid] || '#475569';
      return `<span class="eqd-tag" style="background:${bg};color:#fff;border-color:transparent">${escHtml(owner ? owner.name : uid)}</span>`;
    }).join('');
    return g;
  }).sort((a, b) => {
    const ta = a.prazo ? new Date(a.prazo).getTime() : 0;
    const tb = b.prazo ? new Date(b.prazo).getTime() : 0;
    return ta - tb;
  });
}

async function deleteMarketingGroup(group, selectedDateStr = '', monthAnchorStr = '') {
  if (!group || !Array.isArray(group.ids) || !group.ids.length) return;
  if (!confirm(`Excluir ${group.ids.length > 1 ? 'estas tarefas' : 'esta tarefa'} MKT?`)) return;
  group.ids.forEach((id) => {
    removeDealLocal(String(id));
    enqueueSync({ type: "dealDelete", dealId: String(id) });
  });
  rebuildDealsOpen();
  renderCurrentView();
  openMarketingPanelStub(selectedDateStr, monthAnchorStr);
  setTimeout(() => { refreshData(true).catch(()=>{}); }, 50);
}

async function completeMarketingGroup(group, selectedDateStr = '', monthAnchorStr = '') {
  if (!group || !Array.isArray(group.ids) || !group.ids.length) return;
  if (!confirm(`Concluir ${group.ids.length > 1 ? 'estas tarefas' : 'esta tarefa'} MKT?`)) return;
  for (const id of group.ids) {
    try { await markDone(String(id)); } catch (e) { alert('Falha ao concluir: ' + (e.message || e)); return; }
  }
  rebuildDealsOpen();
  renderCurrentView();
  openMarketingPanelStub(selectedDateStr, monthAnchorStr);
  setTimeout(() => { refreshData(true).catch(()=>{}); }, 50);
}

async function openMarketingGroupEditModal(group, selectedDateStr = '', monthAnchorStr = '') {
  if (!group || !Array.isArray(group.ids) || !group.ids.length) return;
  const members = USERS.filter((u) => MARKETING_MEMBERS.includes(String(u.userId)));
  const memberColorMap = { "1":"#111827", "3079":"#7c3aed", "3085":"#0f766e", "3081":"#b45309", "3387":"#be185d", "4367":"#1d4ed8" };
  const typeTags = ["GRAVAÇÃO","REUNIÃO","ROTEIRO","EDIÇÃO DE VIDEO","FOTOGRAFIA","OUTROS","PAUTA"];
  const meta = await ensureDealFieldsMeta().catch(() => null);
  const tipoItemsRaw = meta ? getFieldItemsFromMeta(meta, 'UF_CRM_1768185018696') : [];
  const tipoItems = (tipoItemsRaw || []).filter((x) => typeTags.some((tt) => norm(tt) === norm(x.VALUE || x.NAME || x.ID || '')));
  const base = group.prazo ? new Date(group.prazo) : new Date();
  const localDefault = new Date(base.getTime() - base.getTimezoneOffset()*60000).toISOString().slice(0,16);
  const selectedIds = group.participantIds.length ? group.participantIds.slice() : members.map((u) => String(u.userId));
  openModal("Editar tarefa MKT", `
    <div class="eqd-warn" id="mktEditWarn"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div style="grid-column:1 / -1"><div style="font-size:11px;font-weight:900;margin-bottom:6px">TÍTULO</div><input id="mktEditTitle" value="${escHtml(group.title)}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" /></div>
      <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">TIPO</div><select id="mktEditType" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${tipoItems.length ? tipoItems.map((x)=>`<option value="${escHtml(String(x.ID || x.VALUE || ''))}" ${String(x.ID || x.VALUE || '') === String(group.typeId || '') ? 'selected' : ''}>${escHtml(String(x.VALUE || x.NAME || x.ID || ''))}</option>`).join('') : typeTags.map((x)=>`<option value="${escHtml(x)}" ${norm(x)===norm(group.typeTxt) ? 'selected' : ''}>${escHtml(x)}</option>`).join('')}</select></div>
      <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">DATA E HORA</div><input id="mktEditPrazo" type="datetime-local" value="${localDefault}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" /></div>
      <div style="grid-column:1 / -1"><div style="font-size:11px;font-weight:900;margin-bottom:6px">PARTICIPANTES</div><div style="display:flex;flex-wrap:wrap;gap:8px">${members.map((u)=>`<label style="display:inline-flex;gap:6px;align-items:center;padding:6px 10px;border:1px solid rgba(0,0,0,.08);border-radius:999px;background:${memberColorMap[String(u.userId)] || '#475569'};color:#fff"><input class="mktEditChk" type="checkbox" value="${u.userId}" ${selectedIds.includes(String(u.userId)) ? 'checked' : ''}/> ${escHtml(u.name)}</label>`).join('')}</div></div>
      <div style="grid-column:1 / -1"><div style="font-size:11px;font-weight:900;margin-bottom:6px">OBS</div><textarea id="mktEditObs" rows="4" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${escHtml(group.obs)}</textarea></div>
      <div style="grid-column:1 / -1;display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap"><button class="eqd-btn" data-action="modalClose">Cancelar</button><button class="eqd-btn eqd-btnPrimary" id="mktEditSave">SALVAR</button></div>
    </div>
  `, { wide:true });
  document.getElementById('mktEditSave').onclick = async () => {
    const warn = document.getElementById('mktEditWarn');
    try {
      const title = String(document.getElementById('mktEditTitle').value || '').trim();
      const typeId = String(document.getElementById('mktEditType').value || '').trim();
      const prazoIso = localInputToIsoWithOffset(String(document.getElementById('mktEditPrazo').value || '').trim());
      const obs = String(document.getElementById('mktEditObs').value || '').trim();
      const checked = [...document.querySelectorAll('.mktEditChk:checked')].map((c) => String(c.value || ''));
      if (!title) throw new Error('Informe o título.');
      if (isBlockedDealTitle(title)) throw new Error('Edição bloqueada para negócio #7259.');
      if (!prazoIso) throw new Error('Informe data e hora.');
      if (!checked.length) throw new Error('Selecione ao menos um participante.');
      const participantNames = members.filter((u)=>checked.includes(String(u.userId))).map((u)=>u.name).join(", ");
      const typeTxt = tipoItems.length ? String(((tipoItems.find((x)=>String(x.ID || x.VALUE || '') === typeId) || {}).VALUE || '')).trim() : typeId;
      const keepIds = group.ids.filter((id) => {
        const d = getDealById(id);
        const uid = String((d && (d.ASSIGNED_BY_ID || d._assigned)) || '');
        return checked.includes(uid);
      });
      const removeIds = group.ids.filter((id) => !keepIds.includes(id));
      removeIds.forEach((id) => {
        removeDealLocal(String(id));
        enqueueSync({ type: "dealDelete", dealId: String(id) });
      });
      for (const id of keepIds) {
        const d = getDealById(id);
        const uid = String((d && (d.ASSIGNED_BY_ID || d._assigned)) || '');
        const fields = { TITLE:`[MKT] ${title}`, [UF_PRAZO]: prazoIso, [UF_COLAB]: participantNames, [UF_OBS]: obs };
        if (typeId) fields[UF_TAREFA] = typeId;
        updateDealInState(id, { TITLE:`[MKT] ${title}`, [UF_PRAZO]: prazoIso, _prazo: new Date(prazoIso).toISOString(), [UF_COLAB]: participantNames, _colabTxt: participantNames, [UF_OBS]: obs, _obs: obs, _hasObs: !!obs, [UF_TAREFA]: typeId, _tarefaId: typeId, _tarefaTxt: typeTxt, DATE_MODIFY:new Date().toISOString() });
        enqueueSync({ type: "dealUpdate", dealId: String(id), fields });
      }
      const existingOwnerIds = keepIds.map((id) => {
        const d = getDealById(id);
        return String((d && (d.ASSIGNED_BY_ID || d._assigned)) || '');
      });
      for (const uid of checked.filter((uid) => !existingOwnerIds.includes(uid))) {
        const stageId = await stageIdForAssignedUser(uid);
        const fields = { CATEGORY_ID:Number(CATEGORY_MAIN), STAGE_ID:String(stageId), TITLE:`[MKT] ${title}`, ASSIGNED_BY_ID:Number(uid), [UF_PRAZO]: prazoIso, [UF_COLAB]: participantNames };
        if (typeId) fields[UF_TAREFA] = typeId;
        if (obs) fields[UF_OBS] = obs;
        const tempId = makeTempId('TMP_DEAL');
        upsertDealLocal(parseLocalDealFromFields(tempId, fields));
        enqueueSync({ type: "dealAdd", tempId, fields });
      }
      rebuildDealsOpen();
      closeModal();
      openMarketingPanelStub(selectedDateStr, monthAnchorStr);
      setTimeout(() => { refreshData(true).catch(()=>{}); }, 50);
    } catch (e) {
      warn.style.display = 'block';
      warn.textContent = String(e.message || e);
    }
  };
}

function openMarketingPanelStub(selectedDateStr = "", monthAnchorStr = "") {
  const typeTags = ["GRAVAÇÃO","REUNIÃO","ROTEIRO","EDIÇÃO DE VIDEO","FOTOGRAFIA","OUTROS","PAUTA"];
  const members = USERS.filter((u) => MARKETING_MEMBERS.includes(String(u.userId)));
  const memberColorMap = { "1":"#111827", "3079":"#7c3aed", "3085":"#0f766e", "3081":"#b45309", "3387":"#be185d", "4367":"#1d4ed8" };
  const today = new Date();
  const hasSelectedDay = !!selectedDateStr;
  const selected = hasSelectedDay ? (tryParseDateAny(`${selectedDateStr} 00:00`) || today) : today;
  const monthAnchor = monthAnchorStr ? (tryParseDateAny(`${monthAnchorStr} 00:00`) || selected) : selected;
  const monthBase = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
  const monthLabel = monthBase.toLocaleDateString('pt-BR', { month:'long', year:'numeric' });
  const prevMonthBase = new Date(monthBase.getFullYear(), monthBase.getMonth()-1, 1);
  const nextMonthBase = new Date(monthBase.getFullYear(), monthBase.getMonth()+1, 1);
  const selectedKey = `${selected.getFullYear()}-${String(selected.getMonth()+1).padStart(2,'0')}-${String(selected.getDate()).padStart(2,'0')}`;
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const mktDealsAll = (STATE.dealsAll || []).filter((d) => String(d.TITLE || "").trim().startsWith("[MKT]")).sort((a,b) => {
    const ta = a._prazo ? new Date(a._prazo).getTime() : 0;
    const tb = b._prazo ? new Date(b._prazo).getTime() : 0;
    return ta - tb;
  });
  const mktDealsOpen = (STATE.dealsOpen || []).filter((d) => String(d.TITLE || "").trim().startsWith("[MKT]")).sort((a,b) => {
    const ta = a._prazo ? new Date(a._prazo).getTime() : 0;
    const tb = b._prazo ? new Date(b._prazo).getTime() : 0;
    return ta - tb;
  });

  const groupedAll = groupMarketingDeals(mktDealsAll, members, memberColorMap);
  const groupedOpen = groupMarketingDeals(mktDealsOpen, members, memberColorMap);
  const filteredDeals = groupedOpen.filter((g) => {
    if (!g.prazo) return false;
    const dt = new Date(g.prazo);
    const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    if (hasSelectedDay) return key === selectedKey;
    return dt.getTime() >= todayStart;
  });

  const monthStart = new Date(monthBase.getFullYear(), monthBase.getMonth(), 1);
  const firstWeekday = monthStart.getDay();
  const startOffset = (firstWeekday + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - startOffset);

  const days = [];
  for (let i=0;i<42;i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dayGroups = groupedAll.filter((x) => {
      if (!x.prazo) return false;
      const dx = new Date(x.prazo);
      const xkey = `${dx.getFullYear()}-${String(dx.getMonth()+1).padStart(2,'0')}-${String(dx.getDate()).padStart(2,'0')}`;
      return xkey === key;
    });
    const dayEmojis = [...new Set(dayGroups.map((x) => mktEmojiForType(x.typeTxt || x.title || '')).filter(Boolean))].slice(0,3);
    const participantIds = [...new Set(dayGroups.flatMap((x) => x.participantIds || []).filter(Boolean))].slice(0,4);
    const chips = participantIds.map((uid) => {
      const owner = USERS.find((u) => String(u.userId) === uid);
      const bg = memberColorMap[uid] || "#475569";
      return `<span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;border-radius:999px;background:${bg};color:#fff;font-size:10px;font-weight:900;padding:0 6px">${escHtml((owner ? owner.name : uid).slice(0,2).toUpperCase())}</span>`;
    }).join("");
    const borderColor = participantIds.length ? (memberColorMap[participantIds[0]] || "#475569") : "rgba(0,0,0,.08)";
    const inMonth = d.getMonth() === monthBase.getMonth();
    days.push(`<button class="eqd-btn" data-action="mktPickDay" data-day="${key}" data-month="${monthBase.getFullYear()}-${String(monthBase.getMonth()+1).padStart(2,'0')}-01" style="min-height:96px;border-radius:16px;justify-content:flex-start;padding:10px 9px;background:${hasSelectedDay && key===selectedKey?'#111827':(participantIds.length?'#f8fafc':'#fff')};color:${hasSelectedDay && key===selectedKey?'#fff':(inMonth?'#111':'#94a3b8')};border:2px solid ${hasSelectedDay && key===selectedKey?'#111827':borderColor};flex-direction:column;align-items:flex-start;gap:5px;box-shadow:none"><div style="display:flex;width:100%;justify-content:space-between;align-items:center"><span style="font-weight:950;font-size:14px">${d.getDate()}</span><span style="font-size:16px">${dayEmojis.join(' ') || ''}</span></div><div style="display:flex;gap:4px;flex-wrap:wrap">${chips || '<span style="font-size:10px;opacity:.55">—</span>'}</div></button>`);
  }

  openModal("Painel MKT — implantação", `<div style="display:grid;grid-template-columns:minmax(490px,62%) 1fr;gap:12px;min-height:72vh">
    <div style="border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:14px;background:#fff;display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div style="font-weight:950">Calendário MKT</div><div style="display:flex;gap:8px;align-items:center"><button class="eqd-btn" data-action="mktNavMonth" data-day="${prevMonthBase.getFullYear()}-${String(prevMonthBase.getMonth()+1).padStart(2,'0')}-01" data-selected="${hasSelectedDay ? selectedKey : ''}">←</button><div style="font-size:12px;opacity:.72;min-width:150px;text-align:center">${escHtml(monthLabel)}</div><button class="eqd-btn" data-action="mktNavMonth" data-day="${nextMonthBase.getFullYear()}-${String(nextMonthBase.getMonth()+1).padStart(2,'0')}-01" data-selected="${hasSelectedDay ? selectedKey : ''}">→</button></div></div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:12px">
        <div style="font-size:11px;font-weight:900;opacity:.65;text-align:center">SEG</div>
        <div style="font-size:11px;font-weight:900;opacity:.65;text-align:center">TER</div>
        <div style="font-size:11px;font-weight:900;opacity:.65;text-align:center">QUA</div>
        <div style="font-size:11px;font-weight:900;opacity:.65;text-align:center">QUI</div>
        <div style="font-size:11px;font-weight:900;opacity:.65;text-align:center">SEX</div>
        <div style="font-size:11px;font-weight:900;opacity:.65;text-align:center">SÁB</div>
        <div style="font-size:11px;font-weight:900;opacity:.65;text-align:center">DOM</div>
        ${days.join("")}
      </div>
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap"><div style="font-size:12px;font-weight:900">Participantes</div>${hasSelectedDay ? `<button class="eqd-btn" id="mktShowUpcoming">Ver próximas tarefas</button>` : ``}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${members.map((u) => `<span class="eqd-tag" style="background:${memberColorMap[String(u.userId)] || '#475569'};color:#fff;border-color:transparent">${escHtml(u.name)}</span>`).join('')}</div>
      <div style="font-size:12px;font-weight:900">Tipos permitidos</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${typeTags.map((x)=>`<span class="eqd-tag">${escHtml(x)}</span>`).join('')}</div>
    </div>
    <div style="border:1px solid rgba(0,0,0,.08);border-radius:16px;padding:12px;background:#fff;display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div style="font-weight:950">Agenda MKT</div><button class="eqd-btn eqd-btnPrimary" id="mktCreateStub">Criar tarefa MKT</button></div>
      <div style="font-size:12px;opacity:.78">${hasSelectedDay ? `Dia selecionado: <strong>${escHtml(fmtDateOnly(selected))}</strong>` : `Mostrando <strong>todas as próximas tarefas</strong> a partir de hoje.`}</div>
      <div style="display:flex;flex-direction:column;gap:8px;min-height:260px;max-height:58vh;overflow:auto">
        ${filteredDeals.length ? filteredDeals.map((g) => {
          return `<div class="eqd-card"><div class="eqd-inner"><div class="eqd-task">${escHtml(g.title)}</div>${g.prazo ? `<div style="margin-top:6px;font-size:13px;font-weight:900;color:#0f172a;display:flex;align-items:center;gap:6px"><span>🗓️</span><span>Data/Hora: <strong>${escHtml(fmt(g.prazo))}</strong></span></div>` : ''}<div class="eqd-meta">${g.typeTxt ? `<span>Tipo: <strong>${escHtml(g.typeTxt)}</strong></span>` : ''}${g.participantNames.length ? `<span>Participantes: <strong>${escHtml(g.participantNames.join(', '))}</strong></span>` : ''}</div><div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">${g.participantChips}${g.typeTxt ? `<span class="eqd-tag">${mktEmojiForType(g.typeTxt)} ${escHtml(g.typeTxt)}</span>` : ''}</div>${g.obs ? `<div style="margin-top:8px;font-size:12px;opacity:.82;white-space:pre-wrap">${escHtml(g.obs)}</div>` : ''}<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="eqd-btn" data-action="mktEditGroup" data-group="${escHtml(g.key)}">Editar</button><button class="eqd-btn" data-action="mktCompleteGroup" data-group="${escHtml(g.key)}">Concluir</button><button class="eqd-btn eqd-btnDanger" data-action="mktDeleteGroup" data-group="${escHtml(g.key)}">Excluir</button></div></div></div>`;
        }).join('') : `<div class="eqd-empty">${hasSelectedDay ? 'Nenhuma tarefa MKT para este dia.' : 'Nenhuma próxima tarefa MKT a partir de hoje.'}</div>`}
      </div>
    </div>
  </div>`, { full:true, wide:true });

  const groupMap = new Map(groupedAll.map((g) => [g.key, g]));
  document.querySelectorAll('[data-action="mktPickDay"]').forEach((btn) => btn.onclick = () => openMarketingPanelStub(String(btn.getAttribute('data-day') || ''), String(btn.getAttribute('data-month') || '')));
  document.querySelectorAll('[data-action="mktNavMonth"]').forEach((btn) => btn.onclick = () => openMarketingPanelStub(String(btn.getAttribute('data-selected') || ''), String(btn.getAttribute('data-day') || '')));
  document.querySelectorAll('[data-action="mktEditGroup"]').forEach((btn) => btn.onclick = () => openMarketingGroupEditModal(groupMap.get(String(btn.getAttribute('data-group') || '')), hasSelectedDay ? selectedKey : '', `${monthBase.getFullYear()}-${String(monthBase.getMonth()+1).padStart(2,'0')}-01`));
  document.querySelectorAll('[data-action="mktDeleteGroup"]').forEach((btn) => btn.onclick = () => deleteMarketingGroup(groupMap.get(String(btn.getAttribute('data-group') || '')), hasSelectedDay ? selectedKey : '', `${monthBase.getFullYear()}-${String(monthBase.getMonth()+1).padStart(2,'0')}-01`));
  document.querySelectorAll('[data-action="mktCompleteGroup"]').forEach((btn) => btn.onclick = () => completeMarketingGroup(groupMap.get(String(btn.getAttribute('data-group') || '')), hasSelectedDay ? selectedKey : '', `${monthBase.getFullYear()}-${String(monthBase.getMonth()+1).padStart(2,'0')}-01`));
  const showUpcomingBtn = document.getElementById('mktShowUpcoming');
  if (showUpcomingBtn) showUpcomingBtn.onclick = () => openMarketingPanelStub('', `${monthBase.getFullYear()}-${String(monthBase.getMonth()+1).padStart(2,'0')}-01`);
  const createBtn = document.getElementById('mktCreateStub');
  if (createBtn) createBtn.onclick = async () => {
    const meta = await ensureDealFieldsMeta().catch(() => null);
    const tipoItemsRaw = meta ? getFieldItemsFromMeta(meta, 'UF_CRM_1768185018696') : [];
    const tipoItems = (tipoItemsRaw || []).filter((x) => typeTags.some((tt) => norm(tt) === norm(x.VALUE || x.NAME || x.ID || '')));
    const base = hasSelectedDay ? (tryParseDateAny(`${selectedKey} 11:00`) || new Date()) : new Date();
    const localDefault = new Date(base.getTime() - base.getTimezoneOffset()*60000).toISOString().slice(0,16);
    openModal("Nova tarefa MKT", `
      <div class="eqd-warn" id="mktWarn"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:1 / -1"><div style="font-size:11px;font-weight:900;margin-bottom:6px">TÍTULO</div><input id="mktTitle" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" /></div>
        <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">TIPO</div><select id="mktType" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)">${tipoItems.length ? tipoItems.map((x)=>`<option value="${escHtml(String(x.ID || x.VALUE || ''))}">${escHtml(String(x.VALUE || x.NAME || x.ID || ''))}</option>`).join('') : typeTags.map((x)=>`<option value="">${escHtml(x)}</option>`).join('')}</select></div>
        <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">DATA E HORA</div><input id="mktPrazo" type="datetime-local" value="${localDefault}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" /></div>
        <div style="grid-column:1 / -1"><div style="font-size:11px;font-weight:900;margin-bottom:6px">PARTICIPANTES</div><div style="display:flex;flex-wrap:wrap;gap:8px">${members.map((u)=>`<label style="display:inline-flex;gap:6px;align-items:center;padding:6px 10px;border:1px solid rgba(0,0,0,.08);border-radius:999px;background:${memberColorMap[String(u.userId)] || '#475569'};color:#fff"><input class="mktChk" type="checkbox" value="${u.userId}" checked /> ${escHtml(u.name)}</label>`).join('')}</div></div>
        <div style="grid-column:1 / -1"><div style="font-size:11px;font-weight:900;margin-bottom:6px">OBS</div><textarea id="mktObs" rows="4" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)"></textarea></div>
        <div style="grid-column:1 / -1;display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap"><button class="eqd-btn" data-action="modalClose">Cancelar</button><button class="eqd-btn eqd-btnPrimary" id="mktSave">CRIAR</button></div>
      </div>
    `, { wide:true });
    document.getElementById('mktSave').onclick = async () => {
      const warn = document.getElementById('mktWarn');
      try {
        const title = String(document.getElementById('mktTitle').value || '').trim();
        const typeId = String(document.getElementById('mktType').value || '').trim();
        const prazoIso = localInputToIsoWithOffset(String(document.getElementById('mktPrazo').value || '').trim());
        const obs = String(document.getElementById('mktObs').value || '').trim();
        const checked = [...document.querySelectorAll('.mktChk:checked')].map((c) => String(c.value || ''));
        if (!title) throw new Error('Informe o título.');
        if (isBlockedDealTitle(title)) throw new Error('Criação bloqueada para negócio #7259.');
        if (!prazoIso) throw new Error('Informe data e hora.');
        if (!checked.length) throw new Error('Selecione ao menos um participante.');
        for (const uid of checked) {
          const stageId = await stageIdForAssignedUser(uid);
          const participantNames = members.filter((u)=>checked.includes(String(u.userId))).map((u)=>u.name).join(", ");
          const fields = { CATEGORY_ID:Number(CATEGORY_MAIN), STAGE_ID:String(stageId), TITLE:`[MKT] ${title}`, ASSIGNED_BY_ID:Number(uid), [UF_PRAZO]: prazoIso };
          if (typeId) fields[UF_TAREFA] = typeId;
          if (obs) fields[UF_OBS] = obs;
          if (participantNames) fields[UF_COLAB] = participantNames;
          const created = await bx("crm.deal.add", { fields });
          const realId = String((created && (created.result || created)) || '').trim() || makeTempId('TMP_DEAL');
          upsertDealLocal(parseLocalDealFromFields(realId, fields));
        }
        rebuildDealsOpen();
        closeModal();
        openMarketingPanelStub(hasSelectedDay ? selectedKey : '', `${monthBase.getFullYear()}-${String(monthBase.getMonth()+1).padStart(2,'0')}-01`);
        setTimeout(() => { refreshData(true).catch(()=>{}); }, 50);
      } catch (e) {
        if (warn) { warn.style.display = 'block'; warn.textContent = String(e.message || e); }
      }
    };
  };
}

function makeUserCard(u) {
    const photo = STATE.userPhotoById.get(Number(u.userId)) || "";
    const stats = countUserStats(u.userId);
    const emoji = overdueEmoji((stats.overdueTasks || 0) + (stats.overdueFollow || 0));

    return `
      <div class="userCard" data-action="openUser" data-userid="${u.userId}">
        <div class="userEmoji" style="order:-1;align-self:center;min-width:22px;text-align:center">${emoji}</div>
        <div class="userInfoLeft">
          <div class="userName">${escHtml(u.name)}</div>
          <div class="userTeam">Equipe ${escHtml(u.team || "")}</div>
        </div>

        <div class="userPhotoWrap">
          <img class="userPhoto" src="${photo || ""}" alt="${escHtml(u.name)}" referrerpolicy="no-referrer"
            onerror="try{this.onerror=null;this.src='';this.style.display='none'}catch(e){}" />
        </div>

        <div class="userRight">
          <div class="userLine">TF Concluídas: <strong>${stats.doneDay}</strong></div>
          <div class="userLine">TF Atrasadas: <strong>${stats.overdueTasks}</strong></div>
          <div class="userLine">TF do dia: <strong>${stats.day}</strong></div>
          <div class="userLine">FUP (dia): <strong>${stats.followDay}</strong></div>
          <div class="userLine">FUP (atrasados): <strong>${stats.overdueFollow}</strong></div>
        </div>
      </div>
    `;
  }

  function renderGeneral() {
    el.main.innerHTML = `
      <div style="margin-bottom:10px;font-weight:950;opacity:.75;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span id="eqd-selectedDayLabel">Dia selecionado: ${fmtDateOnly(selectedDate)}</span><button class="eqd-btn" id="eqd-legendBtn">LEGENDA</button></div>
      <div class="userGrid">
        ${USERS.map(makeUserCard).join("")}${makeMarketingCard()}
      </div>
    `;
    const b = document.getElementById("eqd-legendBtn"); if (b) b.onclick = openLegendModal;
  }

  // =========================
  // 21) PAINEL INDIVIDUAL / MULTI
  // =========================
  let currentView = { kind: "general", userId: null, multi: null };
  let lastViewStack = [];

  function pushView(v) { lastViewStack.push(JSON.parse(JSON.stringify(v))); }
  function popView() { return lastViewStack.pop() || { kind:"general", userId:null, multi:null }; }

  function dealsOfSelectedDayPlusOverdueForUser(userId) {
    const ds = dayStart(selectedDate).getTime();
    const de = dayEnd(selectedDate).getTime();
    const includeOverdue = !selectedDateIsFuture();

    return (STATE.dealsOpen || []).filter((d) => {
      if (String(d.ASSIGNED_BY_ID || d._assigned || "") !== String(userId)) return false;
      if (!d._prazo) return false;
      const t = new Date(d._prazo).getTime();
      if (!Number.isFinite(t)) return false;
      if (includeOverdue) return (t >= ds && t <= de) || t < ds;
      return t >= ds && t <= de;
    });
  }

  function distributeInto3Cols(sortedDeals) {
    const cols = [[], [], []];
    for (let i = 0; i < sortedDeals.length; i++) cols[i % 3].push(sortedDeals[i]);
    return cols;
  }

  function dealsForSpecialPanel(userId) {
    const all = dealsOfSelectedDayPlusOverdueForUser(userId);
    const ds = dayStart(selectedDate).getTime();
    const de = dayEnd(selectedDate).getTime();

    const follow = all.filter((d) => isFollowupDeal(d) && d._prazo && (new Date(d._prazo).getTime() >= ds && new Date(d._prazo).getTime() <= de));
    const tasks = all.filter((d) => !isFollowupDeal(d));
    return { tasks, follow };
  }

  function leadsAttendedOnSelectedDay(userId) {
    const leads = STATE.leadsByUser.get(String(userId)) || [];
    const ds = dayStart(selectedDate).getTime();
    const de = dayEnd(selectedDate).getTime();

    return (leads || []).filter((l) => {
      const dt = getLeadMetricDate(l);
      if (!dt) return false;
      const t = dt.getTime();
      return t >= ds && t <= de;
    });
  }

  function renderLeadMiniCardForPanel(l) {
    const op = leadOperadora(l);
    const idade = leadIdade(l);
    const tel = leadTelefone(l);
    const bairro = leadBairro(l);
    const fonte = leadFonte(l);
    const when = leadDataHora(l) ? fmt(leadDataHora(l)) : "—";
    const stageName = leadStageNameById(l.STATUS_ID) || "";
    const atendidoStamp = getLeadAtendidoStamp(l);

    return `
      <div class="leadCard">
        <div class="leadTitle">${escHtml(leadTitle(l))}</div>
        <div class="leadMeta">
          ${op ? `<span>Operadora: <strong>${escHtml(op)}</strong></span>` : ``}
          ${idade ? `<span>Idade: <strong>${escHtml(idade)}</strong></span>` : ``}
          ${tel ? `<span>Telefone: <strong>${escHtml(tel)}</strong></span>` : ``}
          ${bairro ? `<span>Bairro: <strong>${escHtml(bairro)}</strong></span>` : ``}
          ${fonte ? `<span>Fonte: <strong>${escHtml(fonte)}</strong></span>` : ``}
          <span>Data/Hora: <strong>${escHtml(when)}</strong></span>
          ${stageName ? `<span>Etapa: <strong>${escHtml(stageName)}</strong></span>` : ``}
          ${atendidoStamp ? `<span>Atendido em: <strong>${escHtml(atendidoStamp)}</strong></span>` : ``}
        </div>
      </div>
    `;
  }

  function openBatchTransferDealUser(ids, onDone) {
    const options = USERS.map((u) => `<option value="${u.userId}">${escHtml(u.name)}</option>`).join("");
    openModal("Transferir user em lote", `
      <div class="eqd-warn" id="btWarn"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:12px;font-weight:950;opacity:.85">Selecionadas: <strong>${ids.length}</strong></div>
        <select id="btUser" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900"><option value="">Selecione…</option>${options}</select>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="btSave">TRANSFERIR</button>
        </div>
      </div>
    `);
    document.getElementById("btSave").onclick = async () => {
      const uid = String(document.getElementById("btUser").value || "");
      if (!uid) return alert("Selecione a user.");
      for (const id of ids) {
        const deal = getDealById(id);
        if (deal && isFollowupDeal(deal)) await transferFollowupDealToUser(String(id), String(uid));
        else {
          updateDealInState(id, { ASSIGNED_BY_ID: Number(uid), _assigned: Number(uid), DATE_MODIFY: new Date().toISOString() });
          enqueueSync({ type: "dealUpdate", dealId: String(id), fields: { ASSIGNED_BY_ID: Number(uid) } });
        }
      }
      closeModal();
      if (typeof onDone === "function") onDone(); else renderCurrentView();
    };
  }

  async function openBatchRescheduleAdvanced(ids, opts = {}) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);
    const localDefault = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,16);

    openModal("Reagendar em lote", `
      <div class="eqd-warn" id="brWarn"></div>
      <div style="display:grid;grid-template-columns:1fr;gap:10px">
        <div style="font-size:12px;font-weight:950;opacity:.85">Selecionadas: <strong>${ids.length}</strong></div>
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">NOVO PRAZO (data e hora)</div>
          <input id="brPrazo" type="datetime-local" value="${localDefault}"
                 style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" />
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="brSave">SALVAR (LOTE)</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("brWarn");
    const btn = document.getElementById("brSave");

    btn.onclick = async () => {
      const lk = `batchResched:${ids.join(",")}`;
      if (!lockTry(lk)) return;
      try {
        btn.disabled = true;
        warn.style.display = "none";
        const prazoLocal = String(document.getElementById("brPrazo").value || "").trim();
        const prazoIso = localInputToIsoWithOffset(prazoLocal);
        if (!prazoIso) throw new Error("Prazo inválido.");
        if (!await confirmWeekendModal(prazoIso, "estas tarefas")) return;

        setBusy("Reagendando em lote…");
        const nowIso = new Date().toISOString();
        for (const id of ids) {
          updateDealInState(id, { [UF_PRAZO]: prazoIso, _prazo: new Date(prazoIso).toISOString(), _late: false, DATE_MODIFY: nowIso });
          enqueueSync({ type: "dealUpdate", dealId: String(id), fields: { [UF_PRAZO]: prazoIso } });
        }

        closeModal();
        if (opts && typeof opts.onDone === "function") {
          opts.onDone();
        } else {
          renderCurrentView();
        }
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally {
        btn.disabled = false;
        clearBusy();
        lockRelease(lk);
      }
    };
  }

  async function openDoneSearchModal(userId) {
    openModal("CONCLUÍDOS", `
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input id="doneKw" class="eqd-searchInput" style="color:#111;background:#fff;border-color:rgba(0,0,0,.18)" placeholder="Palavra-chave" />
        <input id="doneDay" type="date" style="padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" />
        <button class="eqd-btn eqd-btnPrimary" id="doneSearchBtn">Buscar</button>
      </div>
      <div id="doneBox" style="margin-top:10px;display:flex;flex-direction:column;gap:8px"></div>
    `, { wide:true });
    if (STATE.dealsLoadedMode !== "full") {
      const box = document.getElementById("doneBox");
      if (box) box.innerHTML = `<div class="eqd-empty">Carregando concluídos…</div>`;
      ensureFullDealsLoadedInBackground(0).then(() => {
        try {
          const btn = document.getElementById("doneSearchBtn");
          if (btn) btn.click();
        } catch (_) {}
      });
    }
    document.getElementById("doneSearchBtn").onclick = async () => {
      if (STATE.dealsLoadedMode !== "full") await ensureFullDealsLoadedInBackground(0);
      const kw = norm(String(document.getElementById("doneKw").value || "").trim());
      const day = String(document.getElementById("doneDay").value || "").trim();
      let rows = (STATE.dealsAll || []).filter((d) => String(d.ASSIGNED_BY_ID || d._assigned || "") === String(userId) && STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId));
      if (kw) rows = rows.filter((d) => norm([d.TITLE || "", d._obs || ""].join(" ")).includes(kw));
      if (day) rows = rows.filter((d) => String((d.DATE_MODIFY || "")).slice(0,10) === day);
      const box = document.getElementById("doneBox");
      box.innerHTML = rows.length ? rows.map((d) => makeDealCard(d, { allowBatch:false, extraMetaInside: `Concluído em: <strong>${d.DATE_MODIFY ? fmt(d.DATE_MODIFY) : "—"}</strong>` })).join("") : `<div class="eqd-empty">Nenhum concluído encontrado.</div>`;
    };
  }

  function renderUserPanel(userId) {
    const user = USERS.find((u) => Number(u.userId) === Number(userId));
    if (!user) return renderGeneral();

    const photo = STATE.userPhotoById.get(Number(user.userId)) || "";

    const hasLeadsBtn = LEAD_USERS.has(String(user.userId));
    const leadsBtn = hasLeadsBtn ? `<button class="eqd-btn" data-action="leadsModal" data-userid="${user.userId}" id="btnLeads">LEADS</button>` : ``;
    const analysisBtn = String(user.userId) === "1" ? `<button class="eqd-btn" data-action="leadAnalysis">ANÁLISE DE LEADS</button>` : ``;
    const globalNoFuBtn = String(user.userId) === "1" ? `<button class="eqd-btn" data-action="globalNoFollowup">LEADS SEM FOLLOW-UP</button>` : ``;

    const finBtn = String(user.userId) === "813" ? `<a class="eqd-btn" href="${FINANCEIRO_URL}" target="_blank" rel="noopener">FINANCEIRO</a>` : ``;
    const segBtn = SEGUROS_USERS.has(String(user.userId)) ? `<a class="eqd-btn" href="${SEGUROS_URL}" target="_blank" rel="noopener">SEGUROS</a>` : ``;

    const overdueFollow = countUserStats(user.userId).overdueFollow;
    const followListBtn = `<button class="eqd-btn ${overdueFollow ? "blinkGreenFull" : ""}" data-action="followList" data-userid="${user.userId}" id="followListBtn">LISTA DE FOLLOW-UP</button>`;
    const genericFollowupBtn = canCreateLooseFollowup(user.userId) ? `<button class="eqd-btn" data-action="followUpModal" data-userid="${user.userId}">FOLLOW-UP</button>` : ``;
    const lostFupBtn = String(user.userId) === "1" ? `<button class="eqd-btn" data-action="lostFollowupsLocator" data-userid="${user.userId}">FUPs DE LEADS PERDIDOS</button>` : ``;
    const newTaskBtn = `<button class="eqd-btn eqd-btnPrimary" data-action="newTaskModal" data-userid="${user.userId}">NOVA TAREFA</button>`;
    const recurBtn = `<button class="eqd-btn" data-action="recurManager" data-userid="${user.userId}">RECORRÊNCIA</button>`;
    const viewMode = getUserDealViewMode(user.userId);
    const viewBtn = ``;
    const vincularFupBtn = ``;
    
    const isSpecial = SPECIAL_PANEL_USERS.has(String(user.userId));

    if (!isSpecial) {
      if (STATE.dealsLoadedMode !== "full") ensureFullDealsLoadedInBackground(1800);
      const dealsDay = dealsOfSelectedDayPlusOverdueForUser(user.userId);
      const ordered = sortDeals(dealsDay);
      const cols = distributeInto3Cols(ordered);

      el.main.innerHTML = `
        <div class="panelHead">
          <div class="panelUserInfo">
            <img class="panelUserPhoto" src="${photo || ""}" referrerpolicy="no-referrer"
                 onerror="try{this.onerror=null;this.src='';this.style.display='none'}catch(e){}" />
            <div>
              <div class="panelUserName">${escHtml(user.name)}</div>
              <div class="panelUserTeam">Equipe ${escHtml(user.team || "")}</div><div style="font-size:11px;font-weight:950;opacity:.82">Dia selecionado: ${fmtDateOnly(selectedDate)}</div>
            </div>
          </div>

          <div class="${String(user.userId) === "1" ? 'panelTools panelToolsUser1' : 'panelTools'}">
            <button class="eqd-btn" data-action="backToPrevious">VOLTAR</button>
            ${finBtn}
            ${segBtn}
            ${analysisBtn}
            ${globalNoFuBtn}
            ${leadsBtn}
            ${followListBtn}${lostFupBtn}
            ${genericFollowupBtn}
            ${newTaskBtn}
            ${recurBtn}
            ${viewBtn}
            ${vincularFupBtn}
            <button class="eqd-btn" data-action="doneSearch" data-userid="${user.userId}">CONCLUÍDOS</button>
            <button class="eqd-btn" id="batchDone">CONCLUIR EM LOTE</button><button class="eqd-btn" id="batchResched">REAGENDAR EM LOTE</button><button class="eqd-btn" id="batchTransfer">TRANSFERIR USER</button>

            <input class="eqd-searchInput" id="userSearch" placeholder="Buscar..." />
            <button class="eqd-btn" id="userSearchBtn">Buscar</button>
          </div>
        </div>

        <div class="panelCols">
          ${[0, 1, 2].map((i) => `
            <div class="panelCol">
              <div class="panelColHead">Tarefas</div>
              <div class="panelColBody" id="col_${i}">
                ${renderDealsByMode(cols[i], { allowBatch: true }, user.userId)}
              </div>
            </div>
          `).join("")}
        </div>
      `;

      if (hasLeadsBtn) {
        const btn = document.getElementById("btnLeads");
        if (btn) {
          if (STATE.leadsAlertUsers.has(String(user.userId))) { btn.classList.add("blinkOrangeFull"); play3Beeps(); }
          else btn.classList.remove("blinkOrangeFull");
        }
      }

      const doUserSearch = () => {
        const kw = norm(String(document.getElementById("userSearch").value || "").trim());
        if (!kw) return alert("Digite uma palavra.");
        const hits = ordered.filter((d) => norm([d.TITLE || "", d._obs || "", d._tarefaTxt || "", d._colabTxt || "", d._etapaTxt || "", d._urgTxt || ""].join(" ")).includes(kw));
        openModal(`Busca — ${user.name} • ${hits.length}`, hits.length ? hits.map((d) => makeDealCard(d, { allowBatch: false })).join("") : `<div class="eqd-empty">Nada encontrado.</div>`);
      };
      document.getElementById("userSearchBtn").onclick = doUserSearch;
      document.getElementById("userSearch").onkeydown = (e) => { if (e.key === "Enter") doUserSearch(); };

      document.getElementById("batchResched").onclick = async () => {
        const ids = [...document.querySelectorAll(".eqd-batch:checked")].map((x) => x.getAttribute("data-id"));
        if (!ids.length) return alert("Selecione tarefas marcando 'Lote' nos cards.");
        await openBatchRescheduleAdvanced(ids);
      };
      document.getElementById("batchDone").onclick = async () => {
        const ids = [...document.querySelectorAll(".eqd-batch:checked")].map((x) => x.getAttribute("data-id"));
        if (!ids.length) return alert("Selecione tarefas marcando 'Lote' nos cards.");
        for (const id of ids) await markDone(id);
        renderCurrentView();
      };
      document.getElementById("batchTransfer").onclick = async () => {
        const ids = [...document.querySelectorAll(".eqd-batch:checked")].map((x) => x.getAttribute("data-id"));
        if (!ids.length) return alert("Selecione tarefas marcando 'Lote' nos cards.");
        openBatchTransferDealUser(ids);
      };

      return;
    }

    if (STATE.dealsLoadedMode !== "full") ensureFullDealsLoadedInBackground(1800);
    const { tasks, follow } = dealsForSpecialPanel(user.userId);
    const orderedTasks = sortDeals(tasks);
    const orderedFollow = sortDeals(follow);


    const leadsDay = leadsAttendedOnSelectedDay(user.userId);

    el.main.innerHTML = `
      <div class="panelHead">
        <div class="panelUserInfo">
          <img class="panelUserPhoto" src="${photo || ""}" referrerpolicy="no-referrer"
               onerror="try{this.onerror=null;this.src='';this.style.display='none'}catch(e){}" />
          <div>
            <div class="panelUserName">${escHtml(user.name)}</div>
            <div class="panelUserTeam">Equipe ${escHtml(user.team || "")}</div><div style="font-size:11px;font-weight:950;opacity:.82">Dia selecionado: ${fmtDateOnly(selectedDate)}</div>
          </div>
        </div>

        <div class="${String(user.userId) === "1" ? 'panelTools panelToolsUser1' : 'panelTools'}">
          <button class="eqd-btn" data-action="backToPrevious">VOLTAR</button>
          ${finBtn}
          ${segBtn}
          ${analysisBtn}
          ${globalNoFuBtn}
          ${followListBtn}${lostFupBtn}
          ${genericFollowupBtn}
          ${newTaskBtn}
          ${recurBtn}
          ${viewBtn}
          ${vincularFupBtn}
          <button class="eqd-btn" data-action="doneSearch" data-userid="${user.userId}">CONCLUÍDOS</button>
          ${leadsBtn}
          <button class="eqd-btn" id="batchDone">CONCLUIR EM LOTE</button><button class="eqd-btn" id="batchResched">REAGENDAR EM LOTE</button><button class="eqd-btn" id="batchTransfer">TRANSFERIR USER</button>

          <input class="eqd-searchInput" id="userSearch" placeholder="Buscar..." />
          <button class="eqd-btn" id="userSearchBtn">Buscar</button>
        </div>
      </div>

      <div class="panelCols">
        <div class="panelCol">
          <div class="panelColHead">NEGÓCIOS DO DIA + ATRASADOS (exceto FOLLOW-UP)</div>
          <div class="panelColBody" id="sp_tasks">
            ${renderDealsByMode(orderedTasks, { allowBatch: true }, user.userId)}
          </div>
        </div>

        <div class="panelCol">
          <div class="panelColHead">FOLLOW-UP DO DIA (${orderedFollow.length})</div>
          <div class="panelColBody" id="sp_follow">
            ${renderDealsByMode(orderedFollow, { allowBatch: true }, user.userId)}
          </div>
        </div>

        <div class="panelCol">
          <div class="panelColHead">LEADS ATENDIDOS NO DIA</div>
          <div class="panelColBody" id="sp_leads">
            ${leadsDay.length ? leadsDay.map(renderLeadMiniCardForPanel).join("") : `<div class="eqd-empty">Sem leads atendidos no dia</div>`}
          </div>
        </div>
      </div>
    `;

    if (hasLeadsBtn && !STATE.leadsByUser.has(String(user.userId)) && !STATE.loadingLeadsByUser.has(String(user.userId))) {
      loadLeadsForOneUser(user.userId).then(() => { if (currentView.kind === "user" && String(currentView.userId) === String(user.userId)) renderUserPanel(user.userId); }).catch(() => {});
    }
    if (hasLeadsBtn) {
      const btn = document.getElementById("btnLeads");
      if (btn) {
        if (STATE.leadsAlertUsers.has(String(user.userId))) { btn.classList.add("blinkOrangeFull"); const kk = String(user.userId); if (STATE.playedLeadAlertByUser.get(kk) !== '1') { STATE.playedLeadAlertByUser.set(kk, '1'); play3Beeps(); } }
        else { btn.classList.remove("blinkOrangeFull"); STATE.playedLeadAlertByUser.delete(String(user.userId)); }
      }
    }

    const doUserSearch = () => {
      const kw = norm(String(document.getElementById("userSearch").value || "").trim());
      if (!kw) return alert("Digite uma palavra.");
      const base = orderedTasks.concat(orderedFollow);
      const hits = base.filter((d) => norm([d.TITLE || "", d._obs || "", d._tarefaTxt || "", d._colabTxt || "", d._etapaTxt || "", d._urgTxt || ""].join(" ")).includes(kw));
      openModal(`Busca — ${user.name} • ${hits.length}`, hits.length ? hits.map((d) => makeDealCard(d, { allowBatch: false })).join("") : `<div class="eqd-empty">Nada encontrado.</div>`);
    };
    document.getElementById("userSearchBtn").onclick = doUserSearch;
    document.getElementById("userSearch").onkeydown = (e) => { if (e.key === "Enter") doUserSearch(); };

    document.getElementById("batchResched").onclick = async () => {
      const ids = [...document.querySelectorAll(".eqd-batch:checked")].map((x) => x.getAttribute("data-id"));
      if (!ids.length) return alert("Selecione tarefas marcando 'Lote' nos cards.");
      await openBatchRescheduleAdvanced(ids);
    };
    document.getElementById("batchDone").onclick = async () => {
      const ids = [...document.querySelectorAll(".eqd-batch:checked")].map((x) => x.getAttribute("data-id"));
      if (!ids.length) return alert("Selecione tarefas marcando 'Lote' nos cards.");
      for (const id of ids) await markDone(id);
      renderCurrentView();
    };
    document.getElementById("batchTransfer").onclick = async () => {
      const ids = [...document.querySelectorAll(".eqd-batch:checked")].map((x) => x.getAttribute("data-id"));
      if (!ids.length) return alert("Selecione tarefas marcando 'Lote' nos cards.");
      openBatchTransferDealUser(ids);
    };
  }

  // =========================
  // 22) MULTI SELEÇÃO
  // =========================
  let lastMultiSelection = [];
  async function openMultiSelect() {
    const pin = await askPin();
    if (!isAdmin(pin)) return;

    openModal("Painel Multi Seleção", `
      <div style="font-size:12px;font-weight:950;display:flex;justify-content:space-between;align-items:center">
        <span>Selecione até 6 usuários</span>
        <button class="eqd-btn" data-action="modalClose">VOLTAR</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px">
        ${USERS.map((u) => `
          <label style="display:flex;gap:8px;align-items:center;border:1px solid rgba(0,0,0,.12);border-radius:12px;padding:8px;background:rgba(255,255,255,.65)">
            <input type="checkbox" class="ms-u" value="${u.userId}" ${lastMultiSelection.includes(Number(u.userId)) ? "checked" : ""}>
            <span style="font-weight:950">${escHtml(u.name)}</span>
          </label>
        `).join("")}
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
        <button class="eqd-btn eqd-btnPrimary" id="ms-ok">Abrir</button>
      </div>
    `);

    document.getElementById("ms-ok").onclick = () => {
      const sel = [...document.querySelectorAll(".ms-u:checked")].map((x) => Number(x.value));
      if (sel.length < 1) return alert("Selecione ao menos 1.");
      if (sel.length > 6) return alert("Máximo 6.");
      lastMultiSelection = sel.slice();
      closeModal();
      pushView(currentView);
      currentView = { kind: "multi", userId: null, multi: sel.slice() };
      setTimeout(() => { try { renderMultiColumns(sel); window.scrollTo({ top: 0, behavior: "smooth" }); } catch (_) { renderMultiColumns(sel); } }, 0);
    };
  }

  function openNewTaskFromMulti(userIds){
    openModal("Nova tarefa (Multi Seleção)", `
      <div style="font-size:12px;font-weight:950;opacity:.85">Selecione a usuária para criar a tarefa:</div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px">
        ${userIds.map((uid) => {
          const u = USERS.find((x) => String(x.userId) === String(uid)) || { userId: uid, name: `User ${uid}` };
          return `
            <button class="eqd-btn" data-action="newTaskModal" data-userid="${u.userId}" style="justify-content:center;background:#1b1e24;border-color:#1b1e24">
              ${escHtml(u.name)}
            </button>
          `;
        }).join("")}
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
        <button class="eqd-btn" data-action="modalClose">Cancelar</button>
      </div>
    `, { wide: true });
  }

  function renderMultiColumns(userIds) {
    const cols = userIds.length;
    const ds = dayStart(selectedDate).getTime();
    const includeOverdue = !selectedDateIsFuture();
    const multiLooseFollowupBtn = userIds.some((uid) => canCreateLooseFollowup(uid)) ? `<button class="eqd-btn" data-action="followUpMulti">FOLLOW-UP</button>` : ``;
    el.main.innerHTML = `
      <div class="panelHead">
        <div style="font-weight:950">PAINEL MULTI • Dia ${fmtDateOnly(selectedDate)}</div>
        <div class="panelTools">
          <button class="eqd-btn eqd-btnPrimary" data-action="newTaskMulti">NOVA TAREFA</button>
          ${multiLooseFollowupBtn}
          <button class="eqd-btn" data-action="backToPrevious">VOLTAR</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(${cols},minmax(280px,1fr));gap:12px">
        ${userIds.map((uid) => {
          const u = USERS.find((x) => Number(x.userId) === Number(uid)) || { name: `User ${uid}`, userId: uid };
          const photo = STATE.userPhotoById.get(Number(uid)) || "";
          const deals = (STATE.dealsOpen || []).filter((d) => {
            if (String(d.ASSIGNED_BY_ID || d._assigned || "") !== String(uid)) return false;
            if (!d._prazo) return false;
            const t = new Date(d._prazo).getTime();
            if (!Number.isFinite(t)) return false;
            if (includeOverdue) return (t >= ds && t <= dayEnd(selectedDate).getTime()) || t < ds;
            return t >= ds && t <= dayEnd(selectedDate).getTime();
          });
          const ordered = sortDeals(deals);
          return `
            <section class="panelCol">
              <div class="panelColHead" style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap">
                <div style="display:flex;gap:10px;align-items:center">
                  <img src="${photo || ""}" data-action="openUserFromMulti" data-userid="${uid}"
                       style="width:52px;height:52px;border-radius:999px;object-fit:cover;border:1px solid rgba(0,0,0,.12);cursor:pointer" referrerpolicy="no-referrer"
                       onerror="try{this.onerror=null;this.style.display='none'}catch(e){}" />
                  <span style="font-weight:950">${escHtml(u.name)}</span>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                  ${LEAD_USERS.has(String(uid)) ? `<button class="eqd-btn" style="padding:6px 10px;font-size:11px" data-action="leadsModal" data-userid="${uid}">LEADS</button>` : ``}
                </div>
              </div>
              <div class="panelColBody">${renderDealsByMode(ordered, { allowBatch: false }, uid)}</div>
            </section>
          `;
        }).join("")}
      </div>
    `;
  }

  // =========================
  // 23) AÇÕES: concluir / editar / excluir / leads move / recorrência manager
  // =========================
  let LAST_RECUR_LOAD_AT = 0;
  let LAST_RECUR_GEN_AT = 0;
  let DEALS_FAIL_STREAK = 0;

  async function refreshData(forceNetwork, opts = {}) {
    setBootProgress(8, "Preparando dados...");
    if (!STATE.doneStageId) {
      setBootProgress(12, "Carregando etapas...");
      await loadStagesForCategory(CATEGORY_MAIN);
    }

    if (!forceNetwork) loadCache();
    try {
      setBootProgress(38, "Carregando tarefas e eventos...");
      await loadDeals({ forceFull: !!(opts && opts.forceFullDeals), openOnly: false, deferPhotos: true });
      overlayPendingSyncState();

      const now = Date.now();

      if (opts.deferRecur) {
        setTimeout(async () => {
          try {
            const later = Date.now();
            if (opts.forceRecur || !STATE.recurRulesByUser.size || (later - LAST_RECUR_LOAD_AT > 10 * 60 * 1000)) {
              setBootProgress(62, "Carregando recorrências...");
              await loadRecurrenceConfigDeals().catch(()=>{});
              LAST_RECUR_LOAD_AT = later;
            }
            if (opts.forceRecur || (Date.now() - LAST_RECUR_GEN_AT > 5 * 60 * 1000)) {
              await generateRecurringDealsWindow().catch(()=>{});
              LAST_RECUR_GEN_AT = Date.now();
            }
            overlayPendingSyncState();
            if (el.modalOverlay.style.display !== "flex") renderCurrentView();
          } catch (_) {}
        }, 700);
      } else {
        if (opts.forceRecur || !STATE.recurRulesByUser.size || (now - LAST_RECUR_LOAD_AT > 10 * 60 * 1000)) {
          setBootProgress(62, "Carregando recorrências...");
          await loadRecurrenceConfigDeals().catch(()=>{});
          LAST_RECUR_LOAD_AT = now;
        }

        if (opts.forceRecur || (now - LAST_RECUR_GEN_AT > 5 * 60 * 1000)) {
          await generateRecurringDealsWindow().catch(()=>{});
          LAST_RECUR_GEN_AT = now;
        }
      }

      const shouldRefreshLeads = !(opts && opts.skipLeads) && ((Date.now() - LAST_LEADS_REFRESH_AT > LEADS_REFRESH_MS) || !STATE.leadsByUser.size || !!forceNetwork);
      if (opts.deferLeads) {
        if (shouldRefreshLeads) {
          setTimeout(async () => {
            try {
              setBootProgress(82, "Carregando resumos e leads...");
              await loadLeadsSnapshotAllUsers({ force: !!forceNetwork });
              LAST_LEADS_REFRESH_AT = Date.now();
              overlayPendingSyncState();
              if (el.modalOverlay.style.display !== "flex") renderCurrentView();
            } catch (_) {}
          }, 1200);
        }
      } else {
        if (shouldRefreshLeads) {
          try { setBootProgress(82, "Carregando resumos e leads..."); await loadLeadsSnapshotAllUsers({ force: !!forceNetwork }); LAST_LEADS_REFRESH_AT = Date.now(); } catch (_) {}
        }
        overlayPendingSyncState();
      }
      renderFooterPeople();
      DEALS_FAIL_STREAK = 0;
      setBootProgress(100, "Painel carregado");
      clearBootProgress();
      el.meta.textContent = `Atualizado: ${fmt(new Date())}`;
      STATE.offline = false;
    } catch (_) {
      DEALS_FAIL_STREAK++;
      const hasLocal = Array.isArray(STATE.dealsAll) && STATE.dealsAll.length > 0;
      const lastOk = STATE.lastOkAt ? fmt(STATE.lastOkAt) : "—";
      if (hasLocal) {
        STATE.offline = false;
        el.meta.textContent = `Atualizado: ${lastOk} • cache local`;
      } else {
        STATE.offline = true;
        el.meta.textContent = DEALS_FAIL_STREAK >= 3 ? `Offline (cache)` : `Conexão instável • tentando novamente`;
      }
    }
  }

  function renderCurrentView() {
    if (currentView.kind === "general") return renderGeneral();
    if (currentView.kind === "user") return renderUserPanel(currentView.userId);
    if (currentView.kind === "multi") return renderMultiColumns(currentView.multi || []);
    renderGeneral();
  }

  function getDealById(id){
    id = String(id);
    return (STATE.dealsAll || []).find(d => String(d.ID) === id) || null;
  }

  async function markDone(dealId) {
    if (!STATE.doneStageId) throw new Error("Etapa CONCLUÍDO não encontrada.");
    updateDealInState(dealId, { STAGE_ID: String(STATE.doneStageId), DATE_MODIFY: new Date().toISOString() });
    rebuildDealsOpen();
    await safeDealUpdate(String(dealId), { STAGE_ID: String(STATE.doneStageId) });
  }

  async function openDoneAndRescheduleModal(dealId) {
    const d = getDealById(dealId);
    if (!d) return;
    let localDefault = "";
    try { const dt = d[UF_PRAZO] ? new Date(d[UF_PRAZO]) : new Date(Date.now() + 60 * 60000); localDefault = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16); } catch (_) {}
    openModal("Reagendar", `
      <div class="eqd-warn" id="drWarn"></div>
      <div style="display:grid;grid-template-columns:1fr;gap:10px">
        <div style="font-size:14px;font-weight:950">${escHtml(bestTitleFromText(String(d.TITLE || '')))}</div>
        <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">NOVA DATA E HORA</div><input id="drPrazo" type="datetime-local" value="${escHtml(localDefault)}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" /></div>
        <div style="font-size:12px;font-weight:900;opacity:.82">Ao salvar, vou perguntar se a tarefa foi feita ou não.</div>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap"><button class="eqd-btn" data-action="modalClose">Cancelar</button><button class="eqd-btn eqd-btnPrimary" id="drSave">Continuar</button></div>
      </div>
    `);
    const warn = document.getElementById("drWarn");
    const btn = document.getElementById("drSave");
    btn.onclick = async () => {
      try {
        btn.disabled = true;
        warn.style.display = "none";
        const prazoIso = localInputToIsoWithOffset(String(document.getElementById("drPrazo").value || "").trim());
        if (!prazoIso) throw new Error("Prazo inválido.");
        if (!await confirmWeekendModal(prazoIso, isFollowupDeal(d) ? "o FOLLOW-UP" : "esta tarefa")) return;

        const doneMode = await new Promise((resolve) => {
          openModal("Esta tarefa foi feita?", `
            <div style="display:flex;flex-direction:column;gap:12px">
              <div style="font-size:14px;font-weight:950">${escHtml(bestTitleFromText(String(d.TITLE || '')))}</div>
              <div style="font-size:12px;font-weight:900;opacity:.82">Se foi feita, concluo a atual e crio uma nova. Se não foi feita, apenas altero o prazo deste card.</div>
              <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap">
                <button class="eqd-btn" id="drAskCancel">Voltar</button>
                <button class="eqd-btn" id="drAskNo">NÃO</button>
                <button class="eqd-btn eqd-btnPrimary" id="drAskYes">SIM</button>
              </div>
            </div>
          `, { wide:true });
          document.getElementById('drAskCancel').onclick = () => resolve('');
          document.getElementById('drAskNo').onclick = () => resolve('NAO_FEITO');
          document.getElementById('drAskYes').onclick = () => resolve('FEITO');
        });
        if (!doneMode) { openDoneAndRescheduleModal(dealId); return; }

        let resolvedLead = null;
        const followupOwnerUid = String(d.ASSIGNED_BY_ID || d._assigned || "");
        const allowLooseFollowup = canCreateLooseFollowup(followupOwnerUid);
        if (isFollowupDeal(d) && doneMode === 'FEITO' && !d[DEAL_UF_LEAD_ORIGEM] && !allowLooseFollowup) {
          try { resolvedLead = await resolveLeadForDeal(d); } catch (_) {}
          if (!resolvedLead) resolvedLead = await promptLinkLeadForOldFollowup(d, 'reagendar este follow-up');
          if (!resolvedLead) throw new Error('Vincular o FOLLOW-UP a um lead é obrigatório para reagendar.');
        }
        if (isFollowupDeal(d) && doneMode === 'FEITO' && !allowLooseFollowup) {
          const targetLead = resolvedLead || await resolveLeadForDeal(d);
          if (targetLead && !leadHelena(targetLead) && !leadPessoal(targetLead)) throw new Error('Marque HELENA e/ou WPP DIRETO antes de reagendar este FOLLOW-UP.');
        }

        if (doneMode === 'NAO_FEITO') {
          updateDealInState(dealId, { [UF_PRAZO]: prazoIso, _prazo: new Date(prazoIso).toISOString(), _late:false, DATE_MODIFY:new Date().toISOString() });
          rebuildDealsOpen();
          closeModal();
          renderCurrentView();
          await safeDealUpdate(String(dealId), { [UF_PRAZO]: prazoIso });
          setTimeout(() => { refreshData(true).catch(()=>{}); }, 120);
          return;
        }

        const originalStageId = String(d.STAGE_ID || "");
        const fields = { CATEGORY_ID: Number(CATEGORY_MAIN), STAGE_ID: originalStageId, TITLE: String(d.TITLE || ''), ASSIGNED_BY_ID: Number(d.ASSIGNED_BY_ID || d._assigned || 0), [UF_PRAZO]: prazoIso };
        if (d[UF_TAREFA]) fields[UF_TAREFA] = d[UF_TAREFA];
        if (d[UF_URGENCIA]) fields[UF_URGENCIA] = d[UF_URGENCIA];
        if (d[UF_ETAPA]) fields[UF_ETAPA] = d[UF_ETAPA];
        if (d[UF_COLAB]) fields[UF_COLAB] = d[UF_COLAB];
        if (d[UF_OBS]) fields[UF_OBS] = d[UF_OBS];
        if (d[DEAL_UF_LEAD_ORIGEM]) fields[DEAL_UF_LEAD_ORIGEM] = d[DEAL_UF_LEAD_ORIGEM];
        else if (resolvedLead) fields[DEAL_UF_LEAD_ORIGEM] = String(leadOrigemId(resolvedLead) || resolvedLead.ID || "");

        const tempNewId = makeTempId('TMP_DEAL');
        updateDealInState(dealId, { STAGE_ID: String(STATE.doneStageId), DATE_MODIFY: new Date().toISOString() });
        upsertDealLocal(parseLocalDealFromFields(tempNewId, fields));
        rebuildDealsOpen();
        closeModal();
        renderCurrentView();
        try {
          await safeDealUpdate(String(dealId), { STAGE_ID: String(STATE.doneStageId) });
          const created = await bx("crm.deal.add", { fields });
          const realId = String((created && (created.result || created)) || '').trim() || tempNewId;
          if (realId !== tempNewId) {
            const arr = (STATE.dealsAll || []).slice();
            const idx = arr.findIndex((x) => String(x.ID) === String(tempNewId));
            if (idx >= 0) {
              const parsed = parseLocalDealFromFields(realId, fields);
              arr[idx] = { ...arr[idx], ...parsed, ID: realId };
              STATE.dealsAll = arr;
              rebuildDealsOpen();
            }
          }
        } catch (netErr) {
          setTimeout(() => { refreshData(true).catch(()=>{}); }, 60);
          throw netErr;
        }
        setTimeout(() => { refreshData(true).catch(()=>{}); }, 120);
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally { btn.disabled = false; }
    };
  }

  function openDoneMenu(dealId){
    const d = getDealById(dealId);
    if (!d) return;
    openModal("Concluir tarefa", `
      <div class="eqd-warn" id="dmWarn"></div>
      <div style="font-size:12px;font-weight:950;opacity:.85;margin-bottom:10px">${escHtml(bestTitleFromText(d.TITLE || ""))}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
        <button class="eqd-btn" data-action="modalClose">Cancelar</button>
        <button class="eqd-btn" id="dmResched">CONCLUIR E REAGENDAR</button>
        <button class="eqd-btn eqd-btnPrimary" id="dmOk">SOMENTE CONCLUIR</button>
      </div>
    `);
    const warn = document.getElementById("dmWarn");
    document.getElementById("dmResched").onclick = () => openDoneAndRescheduleModal(dealId);
    document.getElementById("dmOk").onclick = async () => {
      try { warn.style.display = "none"; await markDone(dealId); closeModal(); renderCurrentView(); }
      catch (e) { warn.style.display = "block"; warn.textContent = "Falha:\n" + (e.message || e); }
    };
  }

  function openEditTitleModal(dealId){
    const d = getDealById(dealId);
    if (!d) return;

    openModal("Editar negócio", `
      <div class="eqd-warn" id="etWarn"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:11px;font-weight:900;margin-bottom:2px">TÍTULO</div>
        <input id="etVal" value="${escHtml(String(d.TITLE||""))}"
               style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" />
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="etSave">SALVAR</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("etWarn");
    const btn = document.getElementById("etSave");
    btn.onclick = async () => {
      const lk = `editTitle:${dealId}`;
      if (!lockTry(lk)) return;
      try{
        btn.disabled = true;
        warn.style.display = "none";
        const val = String(document.getElementById("etVal").value||"").trim();
        if (!val) throw new Error("Título vazio.");
        if (isBlockedDealTitle(val)) throw new Error("Criação bloqueada para negócio #7259.");
        setBusy("Salvando…");

        updateDealInState(dealId, { TITLE: val, DATE_MODIFY: new Date().toISOString() });
        enqueueSync({ type: "dealUpdate", dealId: String(dealId), fields: { TITLE: val } });
        closeModal();
        renderCurrentView();
      }catch(e){
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      }finally{
        btn.disabled = false;
        clearBusy();
        lockRelease(lk);
      }
    };
  }

  function openEditPrazoModal(dealId){
    const d = getDealById(dealId);
    if (!d) return;

    const curIso = d[UF_PRAZO] || "";
    let localDefault = "";
    try{
      const dt = curIso ? new Date(curIso) : new Date(Date.now()+60*60000);
      localDefault = new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString().slice(0,16);
    }catch(_){}

    openModal("Editar prazo", `
      <div class="eqd-warn" id="epWarn"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:11px;font-weight:900">PRAZO (data e hora)</div>
        <input id="epVal" type="datetime-local" value="${escHtml(localDefault)}"
               style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" />
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="epSave">SALVAR</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("epWarn");
    const btn = document.getElementById("epSave");
    btn.onclick = async () => {
      const lk = `editPrazo:${dealId}`;
      if (!lockTry(lk)) return;
      try{
        btn.disabled = true;
        warn.style.display = "none";
        const local = String(document.getElementById("epVal").value||"").trim();
        const iso = localInputToIsoWithOffset(local);
        if (!iso) throw new Error("Prazo inválido.");
        if (!await confirmWeekendModal(iso, 'este prazo')) return;
        setBusy("Salvando…");

        updateDealInState(dealId, { [UF_PRAZO]: iso, _prazo: new Date(iso).toISOString(), _late: false, DATE_MODIFY: new Date().toISOString() });
        enqueueSync({ type: "dealUpdate", dealId: String(dealId), fields: { [UF_PRAZO]: iso } });
        closeModal();
        renderCurrentView();
      }catch(e){
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      }finally{
        btn.disabled = false;
        clearBusy();
        lockRelease(lk);
      }
    };
  }

  async function openEditUrgModal(dealId){
    const d = getDealById(dealId);
    if (!d) return;

    const meta = await ensureDealFieldsMeta().catch(()=>null);
    const items = meta ? getFieldItemsFromMeta(meta, UF_URGENCIA) : [];
    const opts = items.length ? renderOptions(items, "Selecione a urgência…") : `<option value="">(sem opções)</option>`;

    openModal("Urgência", `
      <div class="eqd-warn" id="euWarn"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:11px;font-weight:900">URGÊNCIA</div>
        <select id="euVal" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">
          ${opts}
        </select>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="euSave">SALVAR</button>
        </div>
      </div>
    `);

    const sel = document.getElementById("euVal");
    if (sel && d[UF_URGENCIA]) sel.value = String(d[UF_URGENCIA]);

    const warn = document.getElementById("euWarn");
    const btn = document.getElementById("euSave");
    btn.onclick = async () => {
      const lk = `editUrg:${dealId}`;
      if (!lockTry(lk)) return;
      try{
        btn.disabled = true;
        warn.style.display = "none";
        const v = String(sel.value||"").trim();
        if (!v) throw new Error("Selecione uma urgência.");
        setBusy("Salvando…");

        const txt = String((STATE.dealFieldsMeta && STATE.dealFieldsMeta[UF_URGENCIA] && Array.isArray(STATE.dealFieldsMeta[UF_URGENCIA].items) ? ((STATE.dealFieldsMeta[UF_URGENCIA].items.find((it) => String(it.ID) === v) || {}).VALUE || "") : "")).trim() || String((await enums(UF_URGENCIA))[v] || "").trim();
        updateDealInState(dealId, { [UF_URGENCIA]: v, _urgId: v, _urgTxt: txt, DATE_MODIFY: new Date().toISOString() });
        enqueueSync({ type: "dealUpdate", dealId: String(dealId), fields: { [UF_URGENCIA]: v } });
        closeModal();
        renderCurrentView();
      }catch(e){
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      }finally{
        btn.disabled = false;
        clearBusy();
        lockRelease(lk);
      }
    };
  }


  async function openEditEtapaModal(dealId){
    const d = getDealById(dealId);
    if (!d) return;
    const meta = await ensureDealFieldsMeta().catch(()=>null);
    const items = meta ? getFieldItemsFromMeta(meta, UF_ETAPA) : [];
    const opts = items.length ? renderOptions(items, "Selecione a etapa…") : `<option value="">(sem opções)</option>`;

    openModal("Etapa", `
      <div class="eqd-warn" id="eeWarn"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:11px;font-weight:900">ETAPA</div>
        <select id="eeVal" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">
          ${opts}
        </select>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="eeSave">SALVAR</button>
        </div>
      </div>
    `);

    const sel = document.getElementById("eeVal");
    if (sel && d[UF_ETAPA]) sel.value = String(d[UF_ETAPA]);
    const warn = document.getElementById("eeWarn");
    const btn = document.getElementById("eeSave");
    btn.onclick = async () => {
      try {
        btn.disabled = true;
        warn.style.display = "none";
        const v = String(sel.value || "").trim();
        if (!v) throw new Error("Selecione uma etapa.");
        const etapaMap = await enums(UF_ETAPA);
        const txt = String((etapaMap || {})[v] || "").trim();
        updateDealInState(dealId, { [UF_ETAPA]: v, _etapaId: v, _etapaTxt: txt, DATE_MODIFY: new Date().toISOString() });
        saveCache();
        enqueueSync({ type: "dealUpdate", dealId: String(dealId), fields: { [UF_ETAPA]: v } });
        closeModal();
        renderCurrentView();
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally {
        btn.disabled = false;
      }
    };
  }

  async function quickToggleEtapa(dealId){
    const d = getDealById(dealId);
    if (!d) return;
    const etapaMap = await enums(UF_ETAPA);
    const cur = norm(d._etapaTxt || "");
    let nextId = "";
    if (cur.includes(norm("AGUARDANDO"))) nextId = findEnumIdByLabel(etapaMap, norm("EM ANDAMENTO"));
    else if (cur.includes(norm("EM ANDAMENTO"))) nextId = findEnumIdByLabel(etapaMap, norm("AGUARDANDO"));
    if (!nextId) return;
    const txt = String((etapaMap || {})[nextId] || "").trim();
    updateDealInState(dealId, { [UF_ETAPA]: nextId, _etapaId: nextId, _etapaTxt: txt, DATE_MODIFY: new Date().toISOString() });
    saveCache();
    enqueueSync({ type: "dealUpdate", dealId: String(dealId), fields: { [UF_ETAPA]: nextId } });
    renderCurrentView();
  }

  function openEditObsModal(dealId){
    const d = getDealById(dealId);
    if (!d) return;

    openModal("OBS", `
      <div class="eqd-warn" id="eoWarn"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:12px;font-weight:950;opacity:.85">${escHtml(bestTitleFromText(d.TITLE||""))}</div>
        <textarea id="eoVal" rows="7" style="width:100%;border-radius:14px;border:1px solid rgba(30,40,70,.16);padding:10px;font-weight:850;outline:none">${escHtml(String(d[UF_OBS]||""))}</textarea>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="eoSave">SALVAR</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("eoWarn");
    const btn = document.getElementById("eoSave");
    btn.onclick = async () => {
      const lk = `editObs:${dealId}`;
      if (!lockTry(lk)) return;
      try{
        btn.disabled = true;
        warn.style.display = "none";
        const val = String(document.getElementById("eoVal").value||"").trim();
        setBusy("Salvando…");

        updateDealInState(dealId, { [UF_OBS]: val, _obs: val, _hasObs: !!val, DATE_MODIFY: new Date().toISOString() });
        enqueueSync({ type: "dealUpdate", dealId: String(dealId), fields: { [UF_OBS]: val } });
        closeModal();
        renderCurrentView();
      }catch(e){
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      }finally{
        btn.disabled = false;
        clearBusy();
        lockRelease(lk);
      }
    };
  }

  async function openChangeColabModal(dealId){
    const d = getDealById(dealId);
    if (!d) return;

    // tenta enum
    let isEnum = false;
    try { isEnum = await enumHasOptions(UF_COLAB); } catch(_){}

    if (isEnum) {
      const meta = await ensureDealFieldsMeta().catch(()=>null);
      const items = meta ? getFieldItemsFromMeta(meta, UF_COLAB) : [];
      const opts = items.length ? renderOptions(items, "Selecione a colaboradora…") : `<option value="">(sem opções)</option>`;

      openModal("Trocar COLAB", `
        <div class="eqd-warn" id="ccWarn"></div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="font-size:11px;font-weight:900">COLAB</div>
          <select id="ccVal" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">
            ${opts}
          </select>
          <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
            <button class="eqd-btn" data-action="modalClose">Cancelar</button>
            <button class="eqd-btn eqd-btnPrimary" id="ccSave">SALVAR</button>
          </div>
        </div>
      `);

      const sel = document.getElementById("ccVal");
      if (sel && d[UF_COLAB]) sel.value = String(d[UF_COLAB]);

      const warn = document.getElementById("ccWarn");
      const btn = document.getElementById("ccSave");
      btn.onclick = async () => {
        const lk = `colabEnum:${dealId}`;
        if (!lockTry(lk)) return;
        try{
          btn.disabled = true;
          warn.style.display = "none";
          const v = String(sel.value||"").trim();
          if (!v) throw new Error("Selecione uma colaboradora.");
          setBusy("Salvando…");

          // ✅ SALVAR AQUI
          await safeDealUpdate(String(dealId), { [UF_COLAB]: v });

          updateDealInState(dealId, { [UF_COLAB]: v, _colabId: v, _colabTxt: "" });
          closeModal();
          await refreshData(true);
          renderCurrentView();
        }catch(e){
          warn.style.display = "block";
          warn.textContent = "Falha:\n" + (e.message || e);
        }finally{
          btn.disabled = false;
          clearBusy();
          lockRelease(lk);
        }
      };
      return;
    }

    // texto livre
    openModal("Trocar COLAB", `
      <div class="eqd-warn" id="ccWarn"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:11px;font-weight:900">COLAB (texto)</div>
        <input id="ccTxt" value="${escHtml(String(d[UF_COLAB]||""))}"
               style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" />
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="ccSave">SALVAR</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("ccWarn");
    const btn = document.getElementById("ccSave");
    btn.onclick = async () => {
      const lk = `colabTxt:${dealId}`;
      if (!lockTry(lk)) return;
      try{
        btn.disabled = true;
        warn.style.display = "none";
        const v = String(document.getElementById("ccTxt").value||"").trim();
        setBusy("Salvando…");

        // ✅ SALVAR AQUI
        await safeDealUpdate(String(dealId), { [UF_COLAB]: v });

        updateDealInState(dealId, { [UF_COLAB]: v, _colabId: v, _colabTxt: v });
        closeModal();
        await refreshData(true, { forceRecur: false, forceFullDeals: false, deferLeads: true, skipLeads: true });
        if (opts && typeof opts.onDone === "function") {
          opts.onDone();
        } else {
          renderCurrentView();
        }
      }catch(e){
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      }finally{
        btn.disabled = false;
        clearBusy();
        lockRelease(lk);
      }
    };
  }

  async function deleteDeal(dealId){
    if (!confirm("Excluir este item?")) return;
    removeDealLocal(dealId);
    enqueueSync({ type: "dealDelete", dealId: String(dealId) });
  }

  async function ensureFirstStageIdForCategory(categoryId) {
    const stages = await bx("crm.dealcategory.stage.list", { id: Number(categoryId) });
    const first = (stages || [])[0];
    return first ? String(first.STATUS_ID || "") : "";
  }

  async function routeLeadToCategory(userId, leadId, categoryId, finalLeadStatus) {
    const uid = String(userId);
    const arr = (STATE.leadsByUser.get(uid) || []).slice();
    const lead = arr.find((l) => String(l.ID) === String(leadId));
    if (!lead) throw new Error("Lead não encontrado no cache.");
    const stageId = await ensureFirstStageIdForCategory(categoryId);
    if (!stageId) throw new Error("Não encontrei a primeira etapa da pipeline " + categoryId);
    const fields = {
      CATEGORY_ID: Number(categoryId),
      STAGE_ID: stageId,
      TITLE: leadTitle(lead),
      ASSIGNED_BY_ID: Number(uid),
      [DEAL_UF_LEAD_ORIGEM]: leadOrigemId(lead) || String(lead.ID),
    };
    const tempId = makeTempId("TMP_DEAL");
    upsertDealLocal(parseLocalDealFromFields(tempId, fields));
    enqueueSync({ type: "dealAdd", tempId, fields });
    enqueueSync({ type: "leadUpdate", leadId: String(leadId), fields: { STATUS_ID: String(finalLeadStatus || "") } });
    const idx = arr.findIndex((l) => String(l.ID) === String(leadId));
    if (idx >= 0) { arr[idx] = { ...arr[idx], STATUS_ID: String(finalLeadStatus || "") }; STATE.leadsByUser.set(uid, arr); }
  }

  async function convertLinkedLeadFromFollowup(dealId) {
    const d = getDealById(dealId);
    if (!d) throw new Error("FOLLOW-UP não encontrado.");
    let lead = await resolveLeadForDeal(d);
    if (!lead) lead = await promptLinkLeadForOldFollowup(d, 'converter');
    if (!lead) throw new Error("Este FOLLOW-UP não tem lead de origem vinculado.");

    const uid = String(lead.ASSIGNED_BY_ID || lead._ownerUserId || d.ASSIGNED_BY_ID || "");
    const leadId = String(lead.ID || "");
    const sConv = leadStageId("LEAD CONVERTIDO") || leadStageId("CONVERTIDO");
    if (!leadId || !sConv) throw new Error("Não foi possível identificar o lead ou a etapa CONVERTIDO.");

    if (["29","3101","269"].includes(uid)) {
      await routeLeadToCategory(uid, leadId, 11, sConv);
      await markDone(dealId);
      reopenLeadsModalSafe({ noBackgroundReload: true });
      return;
    }
    if (uid === "815") {
      return new Promise((resolve) => {
        openModal("Escolher pipeline", `<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap"><button class="eqd-btn" id="pl0">SAÚDE (0)</button><button class="eqd-btn eqd-btnPrimary" id="pl11">SEGUROS (11)</button></div>`);
        document.getElementById("pl0").onclick = async () => {
          try { closeModal(); await routeLeadToCategory(uid, leadId, 0, sConv); await markDone(dealId); reopenLeadsModalSafe({ noBackgroundReload: true }); renderCurrentView(); }
          finally { resolve(); }
        };
        document.getElementById("pl11").onclick = async () => {
          try { closeModal(); await routeLeadToCategory(uid, leadId, 11, sConv); await markDone(dealId); reopenLeadsModalSafe({ noBackgroundReload: true }); renderCurrentView(); }
          finally { resolve(); }
        };
      });
    }

    await moveLeadStage(uid, leadId, sConv);
    await markDone(dealId);
    renderCurrentView();
  }

  async function openLeadAtendidoConfirmModal(userId, leadId, toStatus){
    const uid = String(userId||'');
    const arr = (STATE.leadsByUser.get(uid) || []).slice();
    const lead = arr.find((l) => String(l.ID) === String(leadId));
    if (!lead) return null;
    const origem = String(leadOrigemId(lead) || lead.ID || '').trim();
    const existingCount = origem ? countOpenFutureFollowupsForLeadOrig(origem) : 0;
    const existingFu = origem ? (STATE.dealsOpen || []).find((d) => isFollowupDeal(d) && getDealLeadOrigemId(d) === origem && d._prazo && new Date(d._prazo).getTime() >= dayStart(new Date()).getTime()) : null;
    const now = new Date();
    now.setHours(11, 0, 0, 0);
    const localDefault = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    return await new Promise((resolve) => {
      openModal(`Confirmar ATENDIDO`, `
        <div class="eqd-warn" id="attWarn"></div>
        <div style="display:flex;flex-direction:column;gap:12px;min-height:340px">
          <div style="font-size:15px;font-weight:950">Você realmente já atendeu o lead?</div>
          <div style="font-size:13px;font-weight:900;opacity:.82">${escHtml(leadTitle(lead))}</div>
          <label style="display:flex;gap:8px;align-items:center;font-weight:900"><input type="checkbox" id="attHelena" ${leadHelena(lead)?'checked':''}> HELENA</label>
          <label style="display:flex;gap:8px;align-items:center;font-weight:900"><input type="checkbox" id="attPessoal" ${leadPessoal(lead)?'checked':''}> WPP DIRETO</label>
          ${existingCount ? `
            <div style="margin-top:8px;padding:12px;border:1px solid rgba(0,0,0,.10);border-radius:14px;background:#eff6ff;color:#1e3a8a">
              <div style="font-size:13px;font-weight:950;margin-bottom:4px">Este lead já possui FOLLOW-UP futuro agendado.</div>
              <div style="font-size:12px;font-weight:900">${escHtml(existingFu ? `${bestTitleFromText(existingFu.TITLE || '')} • ${fmt(existingFu._prazo)}` : `${existingCount} follow-up(s) futuro(s)`)}</div>
            </div>` : `
            <div style="margin-top:8px;padding:12px;border:1px solid rgba(0,0,0,.10);border-radius:14px;background:#fff">
              <div style="font-size:13px;font-weight:950;margin-bottom:8px">Agendar FOLLOW-UP obrigatório</div>
              <input id="attFuNome" value="${escHtml(leadTitle(lead))}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);margin-bottom:8px" placeholder="Nome do follow-up" />
              <input id="attFuPrazo" type="datetime-local" value="${localDefault}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
                ${["09:00","11:00","14:00","16:00"].map((hh) => `<button class="eqd-btn attFuQuick" data-hh="${hh}" type="button">${hh.replace(":00","h")}</button>`).join("")}
              </div>
            </div>`}
          <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:auto">
            <button class="eqd-btn" id="attCancel">Cancelar</button>
            <button class="eqd-btn eqd-btnPrimary" id="attOk">Confirmar ATENDIDO</button>
          </div>
        </div>
      `, { wide:true });
      const warn = document.getElementById('attWarn');
      document.querySelectorAll('.attFuQuick').forEach((b) => {
        b.onclick = () => {
          const inp = document.getElementById('attFuPrazo');
          const cur = inp.value ? new Date(inp.value) : new Date();
          const parts = String(b.getAttribute('data-hh') || '11:00').split(':');
          cur.setHours(Number(parts[0] || 11), Number(parts[1] || 0), 0, 0);
          inp.value = new Date(cur.getTime() - cur.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        };
      });
      document.getElementById('attCancel').onclick = () => { closeModal(); resolve(false); };
      document.getElementById('attOk').onclick = async () => {
        const hel = !!document.getElementById('attHelena')?.checked;
        const pes = !!document.getElementById('attPessoal')?.checked;
        const fuNome = String(document.getElementById('attFuNome')?.value || '').trim();
        const fuPrazoIso = localInputToIsoWithOffset(String(document.getElementById('attFuPrazo')?.value || '').trim());
        if (!hel && !pes) {
          if (warn) { warn.style.display='block'; warn.textContent='Selecione HELENA e/ou WPP DIRETO.'; }
          return;
        }
        if (!existingCount && !fuNome) {
          if (warn) { warn.style.display='block'; warn.textContent='Preencha o nome do FOLLOW-UP.'; }
          return;
        }
        if (!existingCount && !fuPrazoIso) {
          if (warn) { warn.style.display='block'; warn.textContent='Preencha a data e hora do FOLLOW-UP.'; }
          return;
        }
        if (!existingCount && !await confirmWeekendModal(fuPrazoIso, "o FOLLOW-UP")) return;
        closeModal();
        resolve({ hel, pes, fuNome, fuPrazoIso, hasExistingFuture: !!existingCount });
      };
    });
  }


  async function revalidateLead(userId, leadId) {
    const uid = String(userId||'');
    const lead = ((STATE.leadsByUser.get(uid)||[]).find((l)=>String(l.ID)===String(leadId)) || null);
    if (!lead) throw new Error('Lead não encontrado.');
    const nowIso = new Date().toISOString();
    const fields = { ASSIGNED_BY_ID:Number(uid), NAME:leadTitle(lead), TITLE:leadTitle(lead), STATUS_ID:String(leadStageId("NOVO LEAD") || leadStageId("EM ATENDIMENTO") || "") };
    [LEAD_UF_OPERADORA, LEAD_UF_IDADE, LEAD_UF_TELEFONE, LEAD_UF_BAIRRO, LEAD_UF_FONTE, LEAD_UF_OBS, LEAD_UF_HELENA, LEAD_UF_PESSOAL, LEAD_UF_POSSUI_PLANO].forEach((k)=>{ if (String(lead[k]||'').trim()) fields[k]=lead[k]; });
    fields[LEAD_UF_DATAHORA] = nowIso;
    const tempId = makeTempId('TMP_LEAD');
    upsertLeadLocal(uid, { ID: tempId, ASSIGNED_BY_ID:Number(uid), NAME:leadTitle(lead), TITLE:leadTitle(lead), STATUS_ID:String(leadStageId("NOVO LEAD") || leadStageId("EM ATENDIMENTO") || ""), DATE_CREATE:nowIso, DATE_MODIFY:nowIso, [LEAD_UF_DATAHORA]:nowIso, [LEAD_UF_OPERADORA]:lead[LEAD_UF_OPERADORA], [LEAD_UF_IDADE]:lead[LEAD_UF_IDADE], [LEAD_UF_TELEFONE]:lead[LEAD_UF_TELEFONE], [LEAD_UF_BAIRRO]:lead[LEAD_UF_BAIRRO], [LEAD_UF_FONTE]:lead[LEAD_UF_FONTE], [LEAD_UF_OBS]:lead[LEAD_UF_OBS], [LEAD_UF_HELENA]:lead[LEAD_UF_HELENA], [LEAD_UF_PESSOAL]:lead[LEAD_UF_PESSOAL], [LEAD_UF_POSSUI_PLANO]:lead[LEAD_UF_POSSUI_PLANO] });
    reopenLeadsModalSafe({ noBackgroundReload: true });
    renderCurrentView();
    const created = await bx('crm.lead.add', { fields });
    const newLeadId = String((created && (created.result || created)) || '').trim() || tempId;
    if (newLeadId !== tempId && LEAD_UF_LEAD_ORIGEM) await bx('crm.lead.update', { id:newLeadId, fields:{ [LEAD_UF_LEAD_ORIGEM]: newLeadId } }).catch(()=>{});
    const arr = (STATE.leadsByUser.get(uid) || []).slice();
    const idx = arr.findIndex((l) => String(l.ID) === tempId);
    if (idx >= 0) arr[idx] = { ...arr[idx], ID:newLeadId, [LEAD_UF_LEAD_ORIGEM]: newLeadId };
    STATE.leadsByUser.set(uid, arr);
    await moveLeadStage(uid, leadId, lostLeadStageIds()[0] || leadStageId("PERDIDO"), { skipLostPrompt: true });
    reopenLeadsModalSafe({ noBackgroundReload: true });
    renderCurrentView();
  }

  async function moveLeadStage(userId, leadId, toStatus, opts){
    const uid = String(userId);
    const target = String(toStatus || "");
    const sAtendido = leadStageId("ATENDIDO");
    const sPerdido = leadStageId("LEAD DESCARTADO") || leadStageId("PERDIDO");
    const sConv = leadStageId("LEAD CONVERTIDO") || leadStageId("CONVERTIDO");

    const arr = (STATE.leadsByUser.get(uid) || []).slice();
    const i = arr.findIndex((l) => String(l.ID) === String(leadId));
    const cur = i >= 0 ? { ...(arr[i] || {}) } : null;

    if (target === String(sAtendido) && !(opts && opts.skipAtendidoModal)) {
      const ans = await openLeadAtendidoConfirmModal(uid, leadId, target);
      if (!ans) return;
      return moveLeadStage(uid, leadId, target, { skipAtendidoModal: true, forcedHelena: ans.hel, forcedPessoal: ans.pes, fuNome: ans.fuNome, fuPrazoIso: ans.fuPrazoIso });
    }
    let lostAsk = null;
    if (target === String(sPerdido) && !(opts && opts.skipLostPrompt)) {
      lostAsk = await openLostLeadFollowupModal(cur || arr[i] || {});
    }

    if (target === String(sConv) && ["29","3101","269"].includes(uid)) {
      await routeLeadToCategory(uid, leadId, 11, target);
      return reopenLeadsModalSafe({ noBackgroundReload: true });
    }
    if (target === String(sPerdido) && ["29","3101","269"].includes(uid)) {
      await routeLeadToCategory(uid, leadId, 23, target);
      return reopenLeadsModalSafe({ noBackgroundReload: true });
    }
    if (target === String(sConv) && uid === "815") {
      openModal("Escolher pipeline", `<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap"><button class="eqd-btn" id="pl0">SAÚDE (0)</button><button class="eqd-btn eqd-btnPrimary" id="pl11">SEGUROS (11)</button></div>`);
      document.getElementById("pl0").onclick = async () => { await routeLeadToCategory(uid, leadId, 0, target); reopenLeadsModalSafe({ noBackgroundReload: true }); };
      document.getElementById("pl11").onclick = async () => { await routeLeadToCategory(uid, leadId, 11, target); reopenLeadsModalSafe({ noBackgroundReload: true }); };
      return;
    }

    let patch = { STATUS_ID: target };
    if (cur) {
      const curMark = String(cur[LEAD_UF_ATENDIDO_DIA] || "").trim();
      if (target === String(sAtendido) && !curMark) patch[LEAD_UF_ATENDIDO_DIA] = nowLocalStamp();
      if (target === String(sAtendido)) {
        patch[LEAD_UF_HELENA] = ((opts && opts.forcedHelena) || leadHelena(cur)) ? '1' : '';
        patch[LEAD_UF_PESSOAL] = ((opts && opts.forcedPessoal) || leadPessoal(cur)) ? '1' : '';
        if (!String(patch[LEAD_UF_HELENA] || '').trim() && !String(patch[LEAD_UF_PESSOAL] || '').trim()) throw new Error('Marque HELENA e/ou WPP DIRETO antes de mover para ATENDIDO.');
      }
    }

    const origemForDelete = leadOrigemId(cur || arr[i] || {}) || String(leadId);
    if (target === String(sPerdido)) await deleteFutureFollowupsForLeadOrig(origemForDelete);
    await bx("crm.lead.update", { id: String(leadId), fields: patch });
    if (i >= 0) {
      arr[i] = { ...(arr[i] || {}), ...patch };
      STATE.leadsByUser.set(uid, arr);
    }
    if (target === String(sAtendido)) {
      const ownerUser = USERS.find((u) => String(u.userId) === uid);
      if (!ownerUser) throw new Error('User do lead não encontrado para criar FOLLOW-UP.');
      const origem = leadOrigemId(cur || arr[i] || {}) || String(leadId);
      const jaTemFuture = origem ? hasFutureFollowupForLeadOrig(origem) : false;
      if (!jaTemFuture) {
        const fuNome = String((opts && opts.fuNome) || leadTitle(cur || arr[i] || {})).trim();
        const fuPrazoIso = String((opts && opts.fuPrazoIso) || '').trim();
        if (!fuPrazoIso) throw new Error('FOLLOW-UP obrigatório sem prazo definido.');
        await createFollowUpDealForUser(ownerUser, fuNome, fuPrazoIso, origem ? { [DEAL_UF_LEAD_ORIGEM]: origem } : {});
      }
    }
    reopenLeadsModalSafe({ noBackgroundReload: true });
    renderCurrentView();
    if (target === String(sPerdido) && lostAsk && lostAsk.createFu) {
      const ownerUser = USERS.find((u) => String(u.userId) === uid);
      if (ownerUser) openFollowUpModal(ownerUser, String(lostAsk.fuNome || leadTitle(cur || arr[i] || {})), { leadId: origemForDelete, prefillPrazoIso: String(lostAsk.fuPrazoIso || ''), returnToLeads: { userId: uid, kw: LAST_LEADS_CTX.kw || '' } });
    }
  }

  async function deleteLead(userId, leadId, opts){
    const forcePermanent = !!(opts && opts.forcePermanent);
    if (!confirm(forcePermanent ? "Excluir este lead definitivamente?" : "Excluir este lead?")) return;
    const arr = (STATE.leadsByUser.get(String(userId)) || []).filter((l) => String(l.ID) !== String(leadId));
    STATE.leadsByUser.set(String(userId), arr);
    if (Array.isArray(STATE.globalLeadsAll)) STATE.globalLeadsAll = STATE.globalLeadsAll.filter((l) => String(l.ID) !== String(leadId));
    enqueueSync({ type: "leadDelete", leadId: String(leadId) });
    reopenLeadsModalSafe({ noBackgroundReload: true });
  }

  function openTransferLeadModal(fromUserId, leadId) {
    const options = USERS
      .filter((u) => LEAD_USERS.has(String(u.userId)) && String(u.userId) !== String(fromUserId))
      .map((u) => `<option value="${u.userId}">${escHtml(u.name)}</option>`)
      .join("");

    openModal("Transferir lead", `
      <div class="eqd-warn" id="ltWarn"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:11px;font-weight:900">NOVA USER</div>
        <select id="ltUser" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">
          <option value="">Selecione…</option>
          ${options}
        </select>

        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="ltSave">TRANSFERIR</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("ltWarn");
    const btn = document.getElementById("ltSave");

    btn.onclick = async () => {
      const targetUserId = String(document.getElementById("ltUser").value || "").trim();
      if (!targetUserId) {
        warn.style.display = "block";
        warn.textContent = "Selecione a USER de destino.";
        return;
      }

      try {
        btn.disabled = true;
        warn.style.display = "none";
        const fromArr = (STATE.leadsByUser.get(String(fromUserId)) || []).slice();
        const i = fromArr.findIndex((l) => String(l.ID) === String(leadId));
        if (i >= 0) {
          const lead = { ...fromArr[i], ASSIGNED_BY_ID: Number(targetUserId) };
          fromArr.splice(i, 1);
          STATE.leadsByUser.set(String(fromUserId), fromArr);
          const toArr = (STATE.leadsByUser.get(String(targetUserId)) || []).slice();
          toArr.unshift(lead);
          STATE.leadsByUser.set(String(targetUserId), toArr);
        }
        enqueueSync({ type: "leadUpdate", leadId: String(leadId), fields: { ASSIGNED_BY_ID: Number(targetUserId) } });
        closeModal();
        reopenLeadsModalSafe({ noBackgroundReload: true });
      } catch (e) {
        clearBusy();
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally {
        btn.disabled = false;
      }
    };
  }

  async function openTransferDealUserModal(dealId){
    const d = getDealById(dealId);
    if (!d) return;

    const currentAssigned = String(d.ASSIGNED_BY_ID || d._assigned || "");

    const options = USERS
      .filter((u) => String(u.userId) !== currentAssigned)
      .map((u) => `<option value="${u.userId}">${escHtml(u.name)}</option>`)
      .join("");

    openModal("Transferir negócio", `
      <div class="eqd-warn" id="tdWarn"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:12px;font-weight:950;opacity:.85">${escHtml(bestTitleFromText(d.TITLE || ""))}</div>
        <div style="font-size:11px;font-weight:900">NOVA USER</div>
        <select id="tdUser" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">
          <option value="">Selecione…</option>
          ${options}
        </select>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="tdSave">TRANSFERIR</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("tdWarn");
    const btn = document.getElementById("tdSave");

    btn.onclick = async () => {
      try {
        btn.disabled = true;
        warn.style.display = "none";

        const newUserId = String(document.getElementById("tdUser").value || "").trim();
        if (!newUserId) throw new Error("Selecione a USER de destino.");

        if (isFollowupDeal(d)) {
          await transferFollowupDealToUser(String(dealId), String(newUserId));
        } else {
          const targetUser = USERS.find((u) => String(u.userId) === newUserId);
          if (!targetUser) throw new Error("USER inválida.");

          const newStageId = await stageIdForUserName(targetUser.name);
          if (!newStageId) throw new Error(`Não encontrei a coluna ${targetUser.name} na pipeline.`);

          updateDealInState(dealId, { ASSIGNED_BY_ID: Number(newUserId), _assigned: String(newUserId), STAGE_ID: String(newStageId), DATE_MODIFY: new Date().toISOString() });
          rebuildDealsOpen();
          enqueueSync({ type: "dealUpdate", dealId: String(dealId), fields: { ASSIGNED_BY_ID: Number(newUserId), STAGE_ID: String(newStageId) } });
        }
        closeModal();
        renderCurrentView();
      } catch (e) {
        clearBusy();
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally {
        btn.disabled = false;
      }
    };
  }

  function openEditMonthlyRecurrenceModal(userId, ruleId) {
    const uid = String(userId || "");
    const rid = String(ruleId || "");
    const rules = (STATE.recurRulesByUser.get(uid) || []).slice();
    const rule = rules.find((r) => String(r.id) === rid);
    if (!rule || String(rule.type) !== "MONTHLY") return;
    openModal("Editar dia da recorrência mensal", `
      <div class="eqd-warn" id="remWarn"></div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="font-size:12px;font-weight:950;opacity:.85">${escHtml(String(rule.title || ""))}</div>
        <div><div style="font-size:11px;font-weight:900;margin-bottom:6px">DIA DO MÊS</div><input id="remDay" type="number" min="1" max="31" value="${escHtml(String(rule.monthDay || 1))}" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" /></div>
        <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap"><button class="eqd-btn" data-action="modalClose">Cancelar</button><button class="eqd-btn eqd-btnPrimary" id="remSave">SALVAR DIA</button></div>
      </div>
    `);
    const warn = document.getElementById("remWarn"); const btn = document.getElementById("remSave");
    btn.onclick = async () => {
      try {
        btn.disabled = true; warn.style.display = "none";
        const day = Number(document.getElementById("remDay").value || 0);
        if (!(day >= 1 && day <= 31)) throw new Error("Dia do mês inválido.");
        await saveRulesForUser(uid, rules.map((r) => String(r.id) === rid ? { ...r, monthDay: day } : r));
        closeModal(); openRecurrenceManager(uid);
      } catch (e) { warn.style.display = "block"; warn.textContent = "Falha:\n" + (e.message || e); } finally { btn.disabled = false; }
    };
  }

  function openEditRecurrenceRuleModal(userId, ruleId) {
    const uid = String(userId || "");
    const rules = (STATE.recurRulesByUser.get(uid) || []).slice();
    const idx = rules.findIndex((r) => String(r.id) === String(ruleId));
    if (idx < 0) return;
    const rule = rules[idx];
    const t = String(rule.type || "");

    if (t === "MONTHLY") {
      return openEditMonthlyRecurrenceModal(uid, ruleId);
    }

    if (t === "DAILY_BUSINESS") {
      openModal("Editar recorrência diária", `
        <div class="eqd-warn" id="rrWarn"></div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="font-size:12px;font-weight:950;opacity:.82">Escolha como a regra deve repetir.</div>
          <select id="rrMode" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">
            <option value="DAILY_BUSINESS">Todos os dias úteis</option>
            <option value="WEEKLY">Escolher dias da semana</option>
          </select>
          <div id="rrWeekBox" style="display:none;border:1px solid rgba(0,0,0,.10);padding:10px;border-radius:12px;background:rgba(255,255,255,.55)">
            ${[0,1,2,3,4,5,6].map((i) => `<label style="display:inline-flex;gap:6px;align-items:center;margin:0 10px 8px 0;font-size:12px;font-weight:950"><input type="checkbox" class="rrDow" value="${i}" ${[1,2,3,4,5].includes(i) ? "checked" : ""}>${dowNamePt(i)}</label>`).join("")}
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
            <button class="eqd-btn" data-action="modalClose">Cancelar</button>
            <button class="eqd-btn eqd-btnPrimary" id="rrSave">Salvar</button>
          </div>
        </div>
      `, { wide: true });
      const mode = document.getElementById("rrMode");
      const weekBox = document.getElementById("rrWeekBox");
      mode.onchange = () => weekBox.style.display = mode.value === "WEEKLY" ? "block" : "none";
      document.getElementById("rrSave").onclick = async () => {
        try {
          if (mode.value === "WEEKLY") {
            const dows = [...document.querySelectorAll(".rrDow:checked")].map((x) => Number(x.value));
            if (!dows.length) throw new Error("Selecione ao menos um dia.");
            rules[idx] = { ...rule, type: "WEEKLY", weekDays: dows };
          } else {
            rules[idx] = { ...rule, type: "DAILY_BUSINESS" };
            delete rules[idx].weekDays;
          }
          setBusy("Salvando regra…");
          await saveRulesForUser(uid, rules);
          clearBusy();
          closeModal();
          openRecurrenceManager(uid);
        } catch (e) {
          clearBusy();
          const warn = document.getElementById("rrWarn");
          if (warn) { warn.style.display = "block"; warn.textContent = "Falha:\n" + (e.message || e); }
        }
      };
      return;
    }

    if (t === "WEEKLY") {
      openModal("Editar recorrência semanal", `
        <div class="eqd-warn" id="rrWarn"></div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div style="font-size:12px;font-weight:950;opacity:.82">Escolha os dias da semana.</div>
          <div style="border:1px solid rgba(0,0,0,.10);padding:10px;border-radius:12px;background:rgba(255,255,255,.55)">
            ${[0,1,2,3,4,5,6].map((i) => `<label style="display:inline-flex;gap:6px;align-items:center;margin:0 10px 8px 0;font-size:12px;font-weight:950"><input type="checkbox" class="rrDow" value="${i}" ${(Array.isArray(rule.weekDays) && rule.weekDays.map(Number).includes(i)) ? "checked" : ""}>${dowNamePt(i)}</label>`).join("")}
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
            <button class="eqd-btn" data-action="modalClose">Cancelar</button>
            <button class="eqd-btn eqd-btnPrimary" id="rrSave">Salvar</button>
          </div>
        </div>
      `, { wide: true });
      document.getElementById("rrSave").onclick = async () => {
        try {
          const dows = [...document.querySelectorAll(".rrDow:checked")].map((x) => Number(x.value));
          if (!dows.length) throw new Error("Selecione ao menos um dia.");
          rules[idx] = { ...rule, type: "WEEKLY", weekDays: dows };
          setBusy("Salvando regra…");
          await saveRulesForUser(uid, rules);
          clearBusy();
          closeModal();
          openRecurrenceManager(uid);
        } catch (e) {
          clearBusy();
          const warn = document.getElementById("rrWarn");
          if (warn) { warn.style.display = "block"; warn.textContent = "Falha:\n" + (e.message || e); }
        }
      };
      return;
    }
  }


  function openLeadStageListModal(userId, stageId, title, kwRaw = "") {
    const user = USERS.find((u) => String(u.userId) === String(userId));
    const wanted = String(stageId || '').split(',').map((s) => String(s||'').trim()).filter(Boolean);
    const arr = (STATE.leadsByUser.get(String(userId)) || []).filter((l) => leadOwnsUser(l, userId) && (!wanted.length || wanted.includes(String(l.STATUS_ID || '')))).sort((a,b)=>{ const ta=parseFlexDate(leadDataHora(a)||a.DATE_CREATE||0); const tb=parseFlexDate(leadDataHora(b)||b.DATE_CREATE||0); return (tb?tb.getTime():0)-(ta?ta.getTime():0); });
    const kw = norm(String(kwRaw || '').trim());
    const rows = kw ? arr.filter((l) => leadMatchesKw(l, kw)) : arr;
    const card = (l) => `
      <div class="leadCard">
        <div class="leadTitle">${escHtml(leadTitle(l))}</div>
        <div class="leadMeta">${leadOperadora(l) ? `<span>Operadora: <strong>${escHtml(leadOperadora(l))}</strong></span>` : ``}${leadTelefone(l) ? `<span>Telefone: <strong>${escHtml(leadTelefone(l))}</strong></span>` : ``}${leadDataHora(l) ? `<span>Data/Hora: <strong>${escHtml(fmt(leadDataHora(l)))}</strong></span>` : ``}</div>
        <div class="leadBtns"><button class="leadBtn" data-action="leadEdit" data-leadid="${l.ID}" data-userid="${userId}">EDITAR</button><button class="leadBtn leadBtnP" data-action="leadMove" data-leadid="${l.ID}" data-tostatus="${escHtml(String(leadStageId('EM ATENDIMENTO')||''))}" data-userid="${userId}">VOLTAR PARA EM ATENDIMENTO</button><button class="leadBtn leadBtnD" data-action="leadDeleteForever" data-leadid="${l.ID}" data-userid="${userId}">EXCLUIR DEFINITIVAMENTE</button></div>
      </div>`;
    openModal(`${title} — ${user ? user.name : userId}`, `
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input id="leadStageListSearch" class="eqd-searchInput" style="width:min(560px,80vw);color:#111;background:#fff;border-color:rgba(0,0,0,.18)" placeholder="Buscar..." value="${escHtml(kwRaw)}" />
        <button class="eqd-btn eqd-btnPrimary" id="leadStageListGo">Buscar</button>
      </div>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">${rows.length ? rows.map(card).join('') : `<div class="eqd-empty">Nenhum lead</div>`}</div>
    `, { wide:true });
    const go = document.getElementById('leadStageListGo');
    const inp = document.getElementById('leadStageListSearch');
    if (go) go.onclick = () => openLeadStageListModal(userId, stageId, title, String((inp||{}).value || '').trim());
    if (inp) inp.onkeydown = (e) => { if (e.key === 'Enter') openLeadStageListModal(userId, stageId, title, String(e.target.value || '').trim()); };
  }

  async function loadAdminOrphanFollowupsForUser(userId) {
    const uid = String(userId || '').trim();
    if (!uid) return [];

    let colabIsEnum = false;
    let colabMap = {};
    try {
      colabIsEnum = await enumHasOptions(UF_COLAB);
      if (colabIsEnum) colabMap = await enums(UF_COLAB);
    } catch (_) {}

    const urgMap = await enums(UF_URGENCIA);
    const tarefaMap = await enums(UF_TAREFA);
    const etapaMap = await enums(UF_ETAPA);
    const maps = { urgMap, tarefaMap, etapaMap, colabMap, colabIsEnum };
    const followupTaskId = findEnumIdByLabel(tarefaMap, norm('FOLLOW-UP'));
    const select = [
      'ID','TITLE','STAGE_ID','DATE_CREATE','DATE_MODIFY','ASSIGNED_BY_ID',
      UF_TAREFA, UF_PRAZO, UF_URGENCIA, UF_ETAPA, UF_COLAB, UF_OBS, DEAL_UF_LEAD_ORIGEM,
    ];
    const filter = { CATEGORY_ID: CATEGORY_MAIN, ASSIGNED_BY_ID: uid };
    if (followupTaskId) filter[UF_TAREFA] = followupTaskId;
    const deals = await bxAll('crm.deal.list', { filter, select, order: { ID: 'DESC' } });
    return (deals || [])
.map((d) => parseDeal(d, maps)).filter(Boolean)
      .filter((d) => isFollowupDeal(d) && !isDealDone(d) && !getDealLeadOrigemId(d))
      .sort((a, b) => {
        const pa = a._prazo ? new Date(a._prazo).getTime() : 0;
        const pb = b._prazo ? new Date(b._prazo).getTime() : 0;
        if (pa !== pb) return pa - pb;
        return String(a.TITLE || '').localeCompare(String(b.TITLE || ''), 'pt-BR');
      });
  }


  async function openLostFollowupsLocatorModalLegacy(requesterUserId) {
    const rows = (STATE.dealsOpen || []).filter((d) => isFollowupDeal(d)).map((d) => { const lead = getLeadByOrigemId(getDealLeadOrigemId(d)); return { deal:d, lead }; }).filter((x) => x.lead && isLostLead(x.lead)).sort((a,b)=>{ const ta=a.deal._prazo?new Date(a.deal._prazo).getTime():0; const tb=b.deal._prazo?new Date(b.deal._prazo).getTime():0; return ta-tb; });
    const html = rows.length ? rows.map(({deal, lead}) => `<div class="eqd-card"><div class="eqd-inner"><div class="eqd-task">${escHtml(bestTitleFromText(deal.TITLE || ''))}</div><div class="eqd-tags"><span class="eqd-tag" style="background:#fef2f2;color:#b91c1c;border:1px solid rgba(185,28,28,.18);padding:2px 8px;line-height:1.2">LEAD PERDIDO</span><span class="eqd-tag">USER: ${escHtml((USERS.find(u=>String(u.userId)===String(lead.ASSIGNED_BY_ID||lead._ownerUserId))||{}).name || String(lead.ASSIGNED_BY_ID||''))}</span></div><div class="eqd-foot"><span>Prazo: <strong>${escHtml(deal._prazo ? fmt(deal._prazo) : '—')}</strong></span><span>Lead: <strong>${escHtml(leadTitle(lead))}</strong></span></div></div></div>`).join('') : `<div class="eqd-empty">Nenhum FOLLOW-UP agendado de lead perdido.</div>`;
    openModal('FUPs agendados de leads perdidos', `<div style="font-size:12px;font-weight:900;opacity:.8">Total: <strong>${rows.length}</strong></div><div style="display:flex;flex-direction:column;gap:10px;min-height:60vh;max-height:75vh;overflow:auto">${html}</div>`, { wide:true, full:true });
  }


  function openLostFollowupsLocatorModal() {
    const buildRows = (uidFilter = "") => (STATE.dealsOpen || [])
      .filter((d) => isFollowupDeal(d))
      .map((d) => ({ deal:d, lead:getLeadByOrigemId(getDealLeadOrigemId(d)) }))
      .filter((x) => x.lead && isLostLead(x.lead))
      .filter((x) => !uidFilter || String((x.lead.ASSIGNED_BY_ID || x.lead._ownerUserId || "")) === String(uidFilter))
      .sort((a,b)=>{ const ta=a.deal._prazo?new Date(a.deal._prazo).getTime():0; const tb=b.deal._prazo?new Date(b.deal._prazo).getTime():0; return ta-tb; });

    const render = (uidFilter = "") => {
      const rows = buildRows(uidFilter);
      const userOptions = [`<option value="">Todos os USER</option>`].concat(USERS.map((u) => `<option value="${u.userId}" ${String(uidFilter)===String(u.userId)?'selected':''}>${escHtml(u.name)}</option>`));
      openModal('FUPs de leads perdidos', `
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">
          <div style="font-size:12px;font-weight:900">Total: <strong>${rows.length}</strong></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <select id="lfUserFilter" style="padding:8px 10px;border-radius:999px;border:1px solid rgba(0,0,0,.14);font-weight:900">${userOptions.join('')}</select>
            <button class="eqd-btn" id="lfSelAll">Selecionar todas</button>
            <button class="eqd-btn eqd-btnDanger" id="lfDelSel">Excluir selecionadas</button>
            <button class="eqd-btn" id="lfRescueSel">Voltar lead para EM ATENDIMENTO</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;min-height:50vh;max-height:72vh;overflow:auto;margin-top:10px">
          ${rows.length ? rows.map(({deal,lead}) => {
            const owner = USERS.find(u=>String(u.userId)===String(lead.ASSIGNED_BY_ID||lead._ownerUserId||""));
            return `<label style="display:block;border:1px solid rgba(0,0,0,.08);border-radius:12px;padding:10px;background:#fff">
              <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-start">
                <div style="display:flex;gap:10px;align-items:flex-start">
                  <input type="checkbox" class="lfChk" data-dealid="${deal.ID}" data-leadid="${lead.ID}" />
                  <div>
                    <div style="font-weight:950">${escHtml(bestTitleFromText(deal.TITLE || ''))}</div>
                    <div style="font-size:12px;opacity:.82;line-height:1.45">
                      USER: <strong>${escHtml(owner ? owner.name : String(lead.ASSIGNED_BY_ID||''))}</strong> •
                      Prazo: <strong>${escHtml(deal._prazo ? fmt(deal._prazo) : '—')}</strong><br>
                      Lead: <strong>${escHtml(leadTitle(lead))}</strong> • Operadora: <strong>${escHtml(leadOperadora(lead) || '—')}</strong> • Telefone: <strong>${escHtml(leadTelefone(lead) || '—')}</strong><br>
                      Bairro: <strong>${escHtml(leadBairro(lead) || '—')}</strong> • Fonte: <strong>${escHtml(leadFonte(lead) || '—')}</strong> • Atendido em: <strong>${escHtml(getLeadAtendidoStamp(lead) || '—')}</strong>
                    </div>
                  </div>
                </div>
                <span class="eqd-tag" style="background:#fff1f2;color:#be123c;border:1px solid rgba(190,24,93,.14);padding:3px 10px;line-height:1.1;border-radius:999px;font-weight:950;align-self:center">LEAD PERDIDO</span>
              </div>
            </label>`;
          }).join('') : `<div class="eqd-empty">Nenhum FUP agendado de lead perdido.</div>`}
        </div>
      `, { full:true });
      const all = [...document.querySelectorAll('.lfChk')];
      const checks = () => [...document.querySelectorAll('.lfChk:checked')];
      document.getElementById('lfUserFilter')?.addEventListener('change', (e) => render(String(e.target.value || '')));
      document.getElementById('lfSelAll')?.addEventListener('click', () => all.forEach((c) => c.checked = true));
      document.getElementById('lfDelSel')?.addEventListener('click', async () => {
        const ids = checks().map((c)=>String(c.getAttribute('data-dealid')||''));
        if (!ids.length) return alert('Selecione ao menos uma FUP.');
        if (!confirm('Excluir as FUPs selecionadas?')) return;
        for (const id of ids) { removeDealLocal(id); enqueueSync({ type:'dealDelete', dealId:id }); }
        render(String(document.getElementById('lfUserFilter')?.value || ''));
      });
      document.getElementById('lfRescueSel')?.addEventListener('click', async () => {
        const rowsSel = checks();
        if (!rowsSel.length) return alert('Selecione ao menos um lead.');
        for (const c of rowsSel) {
          const leadId = String(c.getAttribute('data-leadid')||'');
          const lead = Array.from(STATE.leadsByUser.values()).flat().find((l)=>String(l.ID)===leadId);
          if (lead) await moveLeadStage(String(lead.ASSIGNED_BY_ID || lead._ownerUserId || ''), String(lead.ID), leadStageId('EM ATENDIMENTO'), { skipAtendidoModal:true });
        }
        render(String(document.getElementById('lfUserFilter')?.value || ''));
      });
    };
    render("");
  }

  async function openAdminLinkFupModal(adminUserId, selectedUid = '', preloadedOrphans = null) {
    const requesterId = String(adminUserId || '');
    const allowedUsers = requesterId === '1' ? USERS.slice() : USERS.filter((u) => String(u.userId) === requesterId);
    const safeSelected = String(selectedUid || requesterId || '');
    const userOpts = allowedUsers.map((u) => `<option value="${u.userId}" ${String(safeSelected)===String(u.userId)?'selected':''}>${escHtml(u.name)}</option>`).join('');
    const uid = String(safeSelected || '');
    let orphan = Array.isArray(preloadedOrphans) ? preloadedOrphans.slice() : null;

    if (uid && !orphan) {
      openModal(`Vincular FUP — administração`, `
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select id="adminFupUser" style="padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900"><option value="">Selecione a user…</option>${userOpts}</select>
          <button class="eqd-btn eqd-btnPrimary" id="adminFupLoad">Abrir FUPs sem vínculo</button>
          <button class="eqd-btn" data-action="modalClose">Fechar</button>
        </div>
        <div style="margin-top:14px;font-size:13px;font-weight:900;opacity:.82">Carregando FOLLOW-UPs sem lead vinculado diretamente do Bitrix…</div>
        <div class="eqd-empty" style="margin-top:10px;min-height:58vh;display:flex;align-items:center;justify-content:center">Buscando todas as FUPs da user selecionada.</div>
      `, { wide:true, full:true });
      const loadBtnTemp = document.getElementById('adminFupLoad');
      if (loadBtnTemp) loadBtnTemp.onclick = async () => {
        const v = String((document.getElementById('adminFupUser')||{}).value || '');
        if (!v) return alert('Selecione a user.');
        return openAdminLinkFupModal(adminUserId, v);
      };
      try {
        orphan = await loadAdminOrphanFollowupsForUser(uid);
      } catch (e) {
        openModal(`Vincular FUP — administração`, `
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <select id="adminFupUser" style="padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900"><option value="">Selecione a user…</option>${userOpts}</select>
            <button class="eqd-btn eqd-btnPrimary" id="adminFupLoad">Tentar novamente</button>
            <button class="eqd-btn" data-action="modalClose">Fechar</button>
          </div>
          <div class="eqd-empty" style="margin-top:12px;min-height:55vh">Falha ao carregar FOLLOW-UPs sem vínculo: ${escHtml(String(e && e.message || e || 'erro'))}</div>
        `, { wide:true, full:true });
        const loadBtnErr = document.getElementById('adminFupLoad');
        if (loadBtnErr) loadBtnErr.onclick = async () => {
          const v = String((document.getElementById('adminFupUser')||{}).value || '');
          if (!v) return alert('Selecione a user.');
          return openAdminLinkFupModal(adminUserId, v);
        };
        return;
      }
    }

    orphan = orphan || [];
    const row = (d, idx) => {
      const defaultKw = firstNameFromText(bestTitleFromText(String(d.TITLE||'').replace(/^FOLLOW-UP\s*/i,'')));
      return `<div class="adminFupRow" data-dealid="${escHtml(String(d.ID))}" style="border:1px solid rgba(0,0,0,.12);border-radius:14px;padding:12px;background:rgba(255,255,255,.78);display:grid;grid-template-columns:minmax(280px,1fr) minmax(420px,1.15fr) auto;gap:12px;align-items:start">
        <div>
          <div style="font-weight:950">${escHtml(bestTitleFromText(d.TITLE||''))}</div>
          <div style="font-size:11px;font-weight:900;opacity:.75">Prazo: ${escHtml(d._prazo ? fmt(d._prazo) : '—')} • ID: ${escHtml(String(d.ID))}</div>
        </div>
        <div>
          <div style="display:flex;gap:8px;align-items:center">
            <input class="eqd-searchInput adminFupLeadSearch" data-idx="${idx}" style="flex:1;color:#111;background:#fff;border-color:rgba(0,0,0,.18)" placeholder="Buscar lead provável" value="${escHtml(defaultKw)}" />
            <button class="eqd-btn adminFupSearchBtn" data-idx="${idx}" data-dealid="${escHtml(String(d.ID))}">Buscar</button>
          </div>
          <select class="adminFupLeadSelect" data-idx="${idx}" data-dealid="${escHtml(String(d.ID))}" size="8" style="width:100%;margin-top:8px;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900"><option value="">Clique em Buscar para carregar os leads prováveis</option></select>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:stretch;min-width:120px">
          <button class="eqd-btn eqd-btnPrimary adminFupLinkOne" data-dealid="${escHtml(String(d.ID))}" data-idx="${idx}">Vincular</button>
          <button class="eqd-btn adminFupNewLead" data-dealid="${escHtml(String(d.ID))}">Novo lead</button>
          <button class="eqd-btn eqd-btnDanger adminFupDelete" data-dealid="${escHtml(String(d.ID))}">Excluir FUP</button>
        </div>
      </div>`;
    };

    openModal(`Vincular FUP — administração`, `
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select id="adminFupUser" style="padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900"><option value="">Selecione a user…</option>${userOpts}</select>
        <button class="eqd-btn eqd-btnPrimary" id="adminFupLoad">Abrir FUPs sem vínculo</button>
        <button class="eqd-btn" data-action="modalClose">Fechar</button>
      </div>
      <div id="adminFupMeta" style="margin-top:10px;font-size:12px;font-weight:900;opacity:.8">${uid ? `FOLLOW-UPs sem lead vinculado: <strong>${orphan.length}</strong>` : 'Selecione uma user para listar os FOLLOW-UPs sem vínculo.'}</div>
      <div id="adminFupBox" style="margin-top:10px;display:flex;flex-direction:column;gap:10px;min-height:62vh;max-height:78vh;overflow:auto;padding-right:4px">${uid ? (orphan.length ? orphan.map(row).join('') : `<div class="eqd-empty">Nenhum FOLLOW-UP sem lead vinculado.</div>`) : ``}</div>
    `, { wide:true, full:true });

    const refreshCounter = () => {
      const box = document.getElementById('adminFupBox');
      const meta = document.getElementById('adminFupMeta');
      if (!box || !meta) return;
      const count = box.querySelectorAll('.adminFupRow').length;
      meta.innerHTML = uid ? `FOLLOW-UPs sem lead vinculado: <strong>${count}</strong>` : 'Selecione uma user para listar os FOLLOW-UPs sem vínculo.';
      if (!count) box.innerHTML = `<div class="eqd-empty">Nenhum FOLLOW-UP sem lead vinculado.</div>`;
    };

    const loadBtn = document.getElementById('adminFupLoad');
    if (loadBtn) loadBtn.onclick = async () => {
      const v = String((document.getElementById('adminFupUser')||{}).value || '');
      if (!v) return alert('Selecione a user.');
      return openAdminLinkFupModal(adminUserId, v);
    };

    const fillSelect = async (dealId, idx, kw='') => {
      const sel = document.querySelector(`.adminFupLeadSelect[data-idx="${idx}"]`);
      if (!sel) return;
      const deal = orphan.find((x) => String(x.ID) === String(dealId)) || getDealById(String(dealId));
      if (!deal) return;
      const ownerUid = String(deal.ASSIGNED_BY_ID || deal._assigned || uid || '').trim();
      sel.innerHTML = `<option value="">Buscando leads…</option>`;
      if (ownerUid && (!STATE.leadsByUser.get(ownerUid) || !STATE.leadsByUser.get(ownerUid).length)) {
        try { await loadLeadsForOneUser(ownerUid); } catch (_) {}
      }
      const rows = getLikelyLeadCandidatesForFollowup(deal, { kw }).slice(0, 80);
      sel.innerHTML = `<option value="">Selecione…</option>` + (rows.length
        ? rows.map((l) => {
            const discarded = leadIsDiscarded(l);
            return `<option value="${escHtml(String(l.ID))}" ${discarded ? 'style="color:#b00020;font-weight:900"' : ''}>${escHtml(formatLeadCandidateLabel(l, dealId))}</option>`;
          }).join('')
        : `<option value="">Nenhum lead provável encontrado</option>`);
    };

    document.querySelectorAll('.adminFupSearchBtn').forEach((btn) => btn.onclick = async () => {
      const idx = String(btn.getAttribute('data-idx') || '');
      const dealId = String(btn.getAttribute('data-dealid') || '');
      const inp = document.querySelector(`.adminFupLeadSearch[data-idx="${idx}"]`);
      await fillSelect(dealId, idx, inp && inp.value || '');
    });
    document.querySelectorAll('.adminFupLeadSearch').forEach((inp) => {
      const idx = String(inp.getAttribute('data-idx') || '');
      const btn = document.querySelector(`.adminFupSearchBtn[data-idx="${idx}"]`);
      let timer = null;
      inp.onkeydown = (e) => { if (e.key === 'Enter' && btn) { e.preventDefault(); btn.click(); } };
      inp.oninput = () => {
        clearTimeout(timer);
        timer = setTimeout(() => { if (btn) btn.click(); }, 280);
      };
    });

    document.querySelectorAll('.adminFupLinkOne').forEach((btn) => btn.onclick = async () => {
      const dealId = String(btn.getAttribute('data-dealid') || '');
      const idx = String(btn.getAttribute('data-idx') || '');
      const sel = document.querySelector(`.adminFupLeadSelect[data-idx="${idx}"]`);
      const leadId = String(sel && sel.value || '');
      if (!leadId) return alert('Selecione um lead.');
      let lead = null;
      for (const arr of STATE.leadsByUser.values()) { lead = (arr || []).find((x) => String(x.ID) === leadId) || lead; if (lead) break; }
      if (!lead) return alert('Lead não encontrado no cache.');
      const origem = String(leadOrigemId(lead) || lead.ID || '').trim();
      btn.disabled = true;
      try {
        await safeDealUpdate(String(dealId), { [DEAL_UF_LEAD_ORIGEM]: origem });
        updateDealInState(dealId, { [DEAL_UF_LEAD_ORIGEM]: origem, DATE_MODIFY: new Date().toISOString() });
        const rowEl = document.querySelector(`.adminFupRow[data-dealid="${dealId}"]`);
        if (rowEl) rowEl.remove();
        refreshCounter();
      } finally {
        btn.disabled = false;
      }
    });

    document.querySelectorAll('.adminFupNewLead').forEach((btn) => btn.onclick = async () => {
      const dealId = String(btn.getAttribute('data-dealid') || '');
      const deal = orphan.find((x) => String(x.ID) === String(dealId)) || getDealById(dealId);
      const v = String((document.getElementById('adminFupUser')||{}).value || '');
      const user = USERS.find((u) => String(u.userId) === v);
      if (!user || !deal) return;
      openManualLeadCreateModal(user, leadStageId('EM ATENDIMENTO') || leadStageId('NOVO LEAD') || '', {
        prefillName: bestTitleFromText(String(deal.TITLE || '').replace(/^FOLLOW-UP\s*/i,'')),
        onSaved: () => openAdminLinkFupModal(adminUserId, v),
      });
    });

    document.querySelectorAll('.adminFupDelete').forEach((btn) => btn.onclick = async () => {
      const dealId = String(btn.getAttribute('data-dealid') || '');
      if (!dealId) return;
      if (!confirm('Excluir este FOLLOW-UP?')) return;
      btn.disabled = true;
      try {
        await deleteDeal(dealId);
        const rowEl = document.querySelector(`.adminFupRow[data-dealid="${dealId}"]`);
        if (rowEl) rowEl.remove();
        refreshCounter();
      } finally {
        btn.disabled = false;
      }
    });
  }

  function openRecurrenceManager(userId){
    const uid = String(userId);
    const user = USERS.find(u => String(u.userId) === uid);
    if (!user) return;

    const rules = STATE.recurRulesByUser.get(uid) || [];
    const sortRules = (arr) => (arr || []).slice().sort((a,b) => {
      const ta = String(a.type||""); const tb = String(b.type||"");
      const oa = ta === "MONTHLY" ? 0 : ta === "WEEKLY" ? 1 : ta === "DAILY_BUSINESS" ? 2 : 3;
      const ob = tb === "MONTHLY" ? 0 : tb === "WEEKLY" ? 1 : tb === "DAILY_BUSINESS" ? 2 : 3;
      if (oa !== ob) return oa - ob;
      if (oa === 0) return Number(a.monthDay||99) - Number(b.monthDay||99);
      return String(a.title||"").localeCompare(String(b.title||""), "pt-BR");
    });
    const ruleLine = (r) => {
      const t = String(r.type||"");
      let when = "";
      if (t === "DAILY_BUSINESS") when = "Diária (dias úteis)";
      if (t === "WEEKLY") when = "Semanal: " + (Array.isArray(r.weekDays)? r.weekDays.map(dowNamePt).join(", ") : "—");
      if (t === "MONTHLY") when = "Mensal: dia " + String(r.monthDay||"—");
      if (t === "YEARLY") when = "Anual: " + String(r.yearMD||"—");
      const hh = String(r.hh??9).padStart(2,"0");
      const mm = String(r.mm??0).padStart(2,"0");
      return `
        <div style="border:1px solid rgba(0,0,0,.12);border-radius:14px;padding:10px;background:rgba(255,255,255,.62);display:flex;gap:10px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap">
          <div style="min-width:280px">
            <div style="font-weight:950">${escHtml(r.title||"")}</div>
            <div style="font-size:11px;font-weight:900;opacity:.78;margin-top:4px">${escHtml(when)} • ${hh}:${mm}</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            ${["DAILY_BUSINESS","WEEKLY","MONTHLY"].includes(t) ? `<button class="eqd-btn" data-action="recurEditRule" data-userid="${uid}" data-ruleid="${escHtml(String(r.id||""))}">Editar recorrência</button>` : ``}
            <button class="eqd-btn eqd-btnDanger" data-action="recurDelete" data-userid="${uid}" data-ruleid="${escHtml(String(r.id||""))}">Excluir regra</button>
          </div>
        </div>
      `;
    };

    openModal(`Recorrência — ${user.name}`, `
      <div class="eqd-warn" id="rmWarn"></div>
      <div style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap">
        <div style="font-size:12px;font-weight:950;opacity:.85">Regras: <strong>${rules.length}</strong></div>
        <input id="recurSearch" class="eqd-searchInput" style="width:min(360px,70vw);color:#111;background:#fff;border-color:rgba(0,0,0,.18)" placeholder="Buscar recorrência..." />
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px">
        <button class="eqd-btn" data-action="modalClose">Fechar</button>
        <button class="eqd-btn eqd-btnPrimary" data-action="newTaskModal" data-userid="${uid}">+ Nova recorrência</button>
      </div>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px" id="recurListBox"></div>
    `, { wide: true });
    const recurListBox = document.getElementById("recurListBox");
    const renderRules = (kwRaw = "") => {
      const kw = norm(String(kwRaw || "").trim());
      const base = sortRules(rules);
      const filtered = kw ? base.filter((r) => norm([r.title||"", r.type||"", String(r.monthDay||""), Array.isArray(r.weekDays)?r.weekDays.join(","):""].join(" ")).includes(kw)) : base;
      recurListBox.innerHTML = filtered.length ? filtered.map(ruleLine).join("") : `<div class="eqd-empty">Sem regras cadastradas.</div>`;
    };
    renderRules("");
    const recurSearch = document.getElementById("recurSearch");
    if (recurSearch) recurSearch.oninput = (e) => renderRules(e.target.value);
  }

  
  async function toggleLeadField(leadId, fieldName, userId, reopenMode) {
    let lead = null, ownerUid = String(userId||"");
    if (ownerUid && STATE.leadsByUser.has(ownerUid)) {
      const arr = STATE.leadsByUser.get(ownerUid) || [];
      lead = arr.find((l) => String(l.ID) === String(leadId));
    }
    if (!lead) {
      for (const [uid, arr] of STATE.leadsByUser.entries()) {
        const found = (arr||[]).find((l) => String(l.ID) === String(leadId));
        if (found) { lead = found; ownerUid = uid; break; }
      }
    }
    if (!lead) throw new Error("Lead não encontrado.");
    const current = String(lead[fieldName] || "").trim();
    const next = current ? "" : "1";
    await bx("crm.lead.update", { id: String(leadId), fields: { [fieldName]: next } });
    const arr = (STATE.leadsByUser.get(ownerUid) || []).slice();
    const idx = arr.findIndex((l) => String(l.ID) === String(leadId));
    if (idx >= 0) { arr[idx] = { ...arr[idx], [fieldName]: next }; STATE.leadsByUser.set(ownerUid, arr); }
    if (Array.isArray(STATE.globalLeadsAll)) { const gi = STATE.globalLeadsAll.findIndex((l) => String(l.ID) === String(leadId)); if (gi >= 0) STATE.globalLeadsAll[gi] = { ...STATE.globalLeadsAll[gi], [fieldName]: next }; }
    if (reopenMode === "leads") return openLeadsModalForUser(ownerUid, LAST_LEADS_CTX.kw || "", { useCache: true, noBackgroundReload: true, dateFilter: LAST_LEADS_CTX.dateFilter || '', operFilter: LAST_LEADS_CTX.operFilter || '' });
    const modalTitleNow = String((el && el.modalTitle && el.modalTitle.textContent) || '').trim();
    if (/^Lista de FOLLOW-UP/i.test(modalTitleNow)) {
      const ownerUser = USERS.find((u) => String(u.userId) === String(ownerUid));
      if (ownerUser) return openFollowupListModalForUser(ownerUser);
    }
    renderCurrentView();
  }

  async function openLeadAnalysisModal() {
    await loadGlobalLeadsBulk(true).catch(()=>{});
    const hidden = getLeadAnalysisHiddenUsers();
    const novo = String(leadStageId("NOVO LEAD") || "");
    const at = String(leadStageId("EM ATENDIMENTO") || "");
    const atend = String(leadStageId("ATENDIDO") || "");
    const qual = String(leadStageId("QUALIFICADO") || "");
    const visibleUsers = USERS.filter((u) => !hidden.has(String(u.userId)));
    const rows = visibleUsers.map((u) => {
      const arr = (STATE.leadsByUser.get(String(u.userId)) || []).slice();
      const emAt = arr.filter((l) => String(l.STATUS_ID || "") === at).length;
      const atd = arr.filter((l) => String(l.STATUS_ID || "") === atend).length;
      const q = arr.filter((l) => String(l.STATUS_ID || "") === qual).length;
      const semFu = arr.filter((l) => [atend, qual].includes(String(l.STATUS_ID || "")) && !hasFutureFollowupForLeadOrig(leadOrigemId(l) || l.ID)).length;
      const fuLate = (STATE.dealsOpen || []).filter((d) => String(d.ASSIGNED_BY_ID || d._assigned || "") === String(u.userId) && isFollowupDeal(d) && d._late).length;
      const novoCt = novo ? arr.filter((l) => String(l.STATUS_ID || "") === novo).length : 0;
      return `<tr><td>${escHtml(u.name)}</td><td>${novoCt}</td><td>${emAt}</td><td>${atd}</td><td>${q}</td><td>${semFu}</td><td>${fuLate}</td></tr>`;
    }).join("");
    const hideBoxes = USERS.map((u) => `
      <label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;font-weight:800">
        <input type="checkbox" class="eqd-leadAnalysisUserToggle" value="${escHtml(String(u.userId))}" ${hidden.has(String(u.userId)) ? "checked" : ""} />
        <span>${escHtml(u.name)}</span>
      </label>`).join("");
    openModal("Análise de Leads", `
      <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:10px">
        <div style="font-size:12px;font-weight:900;opacity:.82">Exibindo <strong>${visibleUsers.length}</strong> user(s) • Ocultos: <strong>${hidden.size}</strong></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="eqd-btn" id="leadAnalysisManageUsers">OCULTAR USERS</button>
          <button class="eqd-btn" id="leadAnalysisShowAll">MOSTRAR TODOS</button>
        </div>
      </div>
      <div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;font-weight:900"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.12)">User</th><th style="text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.12)">Novo Lead</th><th style="text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.12)">Em atendimento</th><th style="text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.12)">Atendido</th><th style="text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.12)">Qualificado</th><th style="text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.12)">Sem FUP</th><th style="text-align:left;padding:8px;border-bottom:1px solid rgba(0,0,0,.12)">FUP atrasados</th></tr></thead><tbody>${rows}</tbody></table></div>
    `, { wide:true });
    const manageBtn = document.getElementById('leadAnalysisManageUsers');
    if (manageBtn) manageBtn.onclick = () => {
      openModal('Ocultar users na Análise de Leads', `
        <div style="font-size:12px;font-weight:900;opacity:.82;margin-bottom:10px">Marque os users que deseja ocultar nessa lista.</div>
        <div style="max-height:60vh;overflow:auto">${hideBoxes}</div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
          <button class="eqd-btn" id="leadAnalysisHideCancel">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="leadAnalysisHideSave">Salvar</button>
        </div>
      `, { wide:true });
      const cancel = document.getElementById('leadAnalysisHideCancel');
      if (cancel) cancel.onclick = () => openLeadAnalysisModal();
      const save = document.getElementById('leadAnalysisHideSave');
      if (save) save.onclick = () => {
        const next = new Set([ ...document.querySelectorAll('.eqd-leadAnalysisUserToggle:checked') ].map((x) => String(x.value || '')));
        setLeadAnalysisHiddenUsers(next);
        openLeadAnalysisModal();
      };
    };
    const showAllBtn = document.getElementById('leadAnalysisShowAll');
    if (showAllBtn) showAllBtn.onclick = () => { setLeadAnalysisHiddenUsers(new Set()); openLeadAnalysisModal(); };
  }

  // =========================
  // 24) EVENT DELEGATION (cliques)
  // =========================
  document.addEventListener("click", async (e) => {
    const a = e.target.closest("[data-action]");
    if (!a) return;

    const act = a.getAttribute("data-action");
    const id = a.getAttribute("data-id");
    const userId = a.getAttribute("data-userid");

    try{
      if (act === "modalClose") return closeModal();

      if (act === "openMktPanel") { return openMarketingPanelStub(); }
      if (act === "openUser") {
        const uid = String(a.getAttribute("data-userid") || "");
        if (!uid) return;
        if (!(await canOpenUserPanel(uid))) return;
        pushView(currentView);
        currentView = { kind: "user", userId: Number(uid), multi: null };
        return renderCurrentView();
      }

      if (act === "openUserFromMulti") {
        const uid = String(a.getAttribute("data-userid") || "");
        if (!uid) return;
        if (!(await canOpenUserPanel(uid))) return;
        pushView(currentView);
        currentView = { kind: "user", userId: Number(uid), multi: null };
        return renderCurrentView();
      }

      if (act === "backToPrevious") {
        currentView = popView();
        return renderCurrentView();
      }

      if (act === "newTaskModal") {
        const u = USERS.find(x => String(x.userId) === String(userId));
        if (!u) return;
        return openNewTaskModalForUser(u, {});
      }

      if (act === "newTaskMulti") {
        if (currentView.kind !== "multi") return;
        return openNewTaskFromMulti(currentView.multi || []);
      }

      if (act === "followUpMulti") {
        if (currentView.kind !== "multi") return;
        const ids = (currentView.multi || []).map(String);
        const opts = USERS.filter((u) => ids.includes(String(u.userId))).map((u) => `<option value="${u.userId}">${escHtml(u.name)}</option>`).join("");
        openModal("FOLLOW-UP — Multi seleção", `<div style="display:flex;flex-direction:column;gap:10px"><select id="fuMultiUser" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900"><option value="">Selecione a user…</option>${opts}</select><div style="display:flex;justify-content:flex-end"><button class="eqd-btn eqd-btnPrimary" id="fuMultiGo">Continuar</button></div></div>`);
        document.getElementById("fuMultiGo").onclick = () => {
          const uid = String((document.getElementById("fuMultiUser") || {}).value || "");
          const u = USERS.find((x) => String(x.userId) === uid);
          if (!u) return alert("Selecione a user.");
          closeModal();
          return openFollowUpModal(u, "", {});
        };
        return;
      }

      if (act === "followUpModal") {
        const u = USERS.find(x => String(x.userId) === String(userId));
        if (!u) return;
        return openFollowUpModal(u, "", {});
      }

      if (act === "followList") {
        const u = USERS.find(x => String(x.userId) === String(userId));
        if (!u) return;
        return openFollowupListModalForUser(u);
      }

      if (act === "leadAnalysis") { return openLeadAnalysisModal(); }
      if (act === "globalNoFollowup") { return openGlobalNoFutureFollowupModal(); }
      if (act === "doneSearch") { const uid = String(userId||""); if (!uid) return; return openDoneSearchModal(uid); }

      if (act === "toggleDealView") { const uid = String(userId||""); if (!uid) return; setUserDealViewMode(uid, getUserDealViewMode(uid) === 'LIST' ? 'CARD' : 'LIST'); return renderCurrentView(); }
      if (act === "adminLinkFup") { const uid = String(userId||""); if (!uid) return; return openAdminLinkFupModal(uid, ""); }

      if (act === "leadsModal") {
        const uid = String(userId||"");
        if (!uid) return;
        return openLeadsModalForUser(uid, "", { useCache: true, noBackgroundReload: true });
      }

      if (act === "leadDelete") {
        const uid = String(a.getAttribute("data-userid")||"");
        const leadId = String(a.getAttribute("data-leadid")||"");
        if (!uid || !leadId) return;
        return deleteLead(uid, leadId);
      }

      if (act === "leadDeleteForever") {
        const uid = String(a.getAttribute("data-userid")||"");
        const leadId = String(a.getAttribute("data-leadid")||"");
        if (!uid || !leadId) return;
        return deleteLead(uid, leadId, { forcePermanent: true });
      }

      if (act === "leadTransferModal") {
        const uid = String(a.getAttribute("data-userid")||"");
        const leadId = String(a.getAttribute("data-leadid")||"");
        if (!uid || !leadId) return;
        return openTransferLeadModal(uid, leadId);
      }

      if (act === "leadObsModal") {
        const uid = String(a.getAttribute("data-userid")||"");
        const leadId = String(a.getAttribute("data-leadid")||"");
        if (!uid || !leadId) return;
        return openLeadObsModal(uid, leadId);
      }

      if (act === "leadEdit") {
        const uid = String(a.getAttribute("data-userid")||"");
        const leadId = String(a.getAttribute("data-leadid")||"");
        if (!uid || !leadId) return;
        return openLeadEditModal(uid, leadId, {
          onSaved: () => {
            if (LAST_LEADS_CTX && LAST_LEADS_CTX.userId) return reopenLeadsModalSafe({ noBackgroundReload: true });
            renderCurrentView();
          }
        });
      }

      if (act === "leadToggleHelena") {
        const uid = String(a.getAttribute("data-userid")||"");
        const leadId = String(a.getAttribute("data-leadid")||"");
        if (!leadId) return;
        await toggleLeadField(leadId, LEAD_UF_HELENA, uid, "leads");
        return;
      }
      if (act === "leadTogglePessoal") {
        const uid = String(a.getAttribute("data-userid")||"");
        const leadId = String(a.getAttribute("data-leadid")||"");
        if (!leadId) return;
        await toggleLeadField(leadId, LEAD_UF_PESSOAL, uid, "leads");
        return;
      }
      if (act === "linkedLeadToggleHelena") {
        const dealId = String(a.getAttribute("data-dealid")||"");
        const d = getDealById(dealId);
        let lead = await resolveLeadForDeal(d);
        if (!lead) lead = await promptLinkLeadForOldFollowup(d, 'alterar HELENA');
        if (!lead) return alert("Este FOLLOW-UP não tem lead de origem vinculado.");
        await toggleLeadField(String(lead.ID), LEAD_UF_HELENA, String(lead.ASSIGNED_BY_ID||""), "view");
        return;
      }
      if (act === "linkedLeadTogglePessoal") {
        const dealId = String(a.getAttribute("data-dealid")||"");
        const d = getDealById(dealId);
        let lead = await resolveLeadForDeal(d);
        if (!lead) lead = await promptLinkLeadForOldFollowup(d, 'alterar WPP DIRETO');
        if (!lead) return alert("Este FOLLOW-UP não tem lead de origem vinculado.");
        await toggleLeadField(String(lead.ID), LEAD_UF_PESSOAL, String(lead.ASSIGNED_BY_ID||""), "view");
        return;
      }

      if (act === "leadMove") {
        const uid = String(a.getAttribute("data-userid")||"");
        const leadId = String(a.getAttribute("data-leadid")||"");
        const to = String(a.getAttribute("data-tostatus")||"");
        if (!uid || !leadId || !to) return;
        return moveLeadStage(uid, leadId, to);
      }

      if (act === "leadFollowupModal") {
        const uid = String(a.getAttribute("data-userid")||"");
        const leadId = String(a.getAttribute("data-leadid")||"");
        if (!uid || !leadId) return;

        const u = USERS.find(x => String(x.userId) === uid);
        if (!u) return;

        const leads = STATE.leadsByUser.get(uid) || [];
        const lead = leads.find(l => String(l.ID) === String(leadId));
        const nm = lead ? leadTitle(lead) : "";

        return openFollowUpModal(u, nm, { leadId: lead ? (leadOrigemId(lead) || String(lead.ID)) : leadId, returnToLeads: { userId: uid, kw: LAST_LEADS_CTX.kw || "" } });
      }

      if (act === "leadShowLost") { const uid = String(a.getAttribute("data-userid")||""); return openLeadStageListModal(uid, lostLeadStageIds(), 'Perdidos'); }
      if (act === "leadShowConv") { const uid = String(a.getAttribute("data-userid")||""); return openLeadStageListModal(uid, convertedLeadStageIds(), 'Convertidos'); }

      if (act === "leadRefresh") {
        const uid = String(a.getAttribute("data-userid")||"");
        if (!uid) return;
        return openLeadsModalForUser(uid, LAST_LEADS_CTX.kw || "", { forceReload: true });
      }

      if (act === "leadNewManual") {
        const uid = String(a.getAttribute("data-userid")||"");
        const def = String(a.getAttribute("data-defaultstatus")||"");
        const u = USERS.find(x => String(x.userId) === uid);
        if (!u) return;
        return openManualLeadCreateModal(u, def);
      }
      if (act === "leadNewBatch") {
        const uid = String(a.getAttribute("data-userid")||"");
        const u = USERS.find(x => String(x.userId) === uid);
        if (!u) return;
        return openLeadBatchCreateModal(u, leadStageId("NOVO LEAD") || "");
      }
      if (act === "lostFollowupsLocator") { return openLostFollowupsLocatorModal(); }
      if (act === "leadNewBatch") {
        const uid = String(a.getAttribute("data-userid")||"");
        const u = USERS.find(x => String(x.userId) === uid);
        if (!u) return;
        return openLeadBatchCreateModal(u, leadStageId("NOVO LEAD") || "");
      }
      if (act === "leadRevalidate") {
        const uid = String(a.getAttribute("data-userid")||"");
        const leadId = String(a.getAttribute("data-leadid")||"");
        if (!uid || !leadId) return;
        if (!confirm("Revalidar este lead por mais 60 dias? O lead atual será descartado e um novo será criado.")) return;
        return revalidateLead(uid, leadId);
      }

      if (act === "lostFollowupsLocator") { return openLostFollowupsLocatorModal(String(a.getAttribute("data-userid")||"")); }

      if (act === "recurManager") {
        const uid = String(userId||"");
        if (!uid) return;
        if (!STATE.recurRulesByUser || STATE.recurRulesByUser.size === 0) await loadRecurrenceConfigDeals().catch(()=>{});
        return openRecurrenceManager(uid);
      }

      if (act === "recurEditMonth") {
        const uid = String(a.getAttribute("data-userid") || "");
        const rid = String(a.getAttribute("data-ruleid") || "");
        if (!uid || !rid) return;
        return openEditMonthlyRecurrenceModal(uid, rid);
      }

      if (act === "recurEditRule") {
        const uid = String(a.getAttribute("data-userid") || "");
        const rid = String(a.getAttribute("data-ruleid") || "");
        if (!uid || !rid) return;
        return openEditRecurrenceRuleModal(uid, rid);
      }

      if (act === "recurDelete") {
        const uid = String(a.getAttribute("data-userid")||"");
        const rid = String(a.getAttribute("data-ruleid")||"");
        if (!uid || !rid) return;
        if (!confirm("Excluir esta regra de recorrência?")) return;
        setBusy("Excluindo regra…");

        // ✅ SALVAR AQUI
        await deleteRuleForUser(uid, rid);

        clearBusy();
        closeModal();
        await refreshData(true);
        return openRecurrenceManager(uid);
      }

      // Cards actions
      if (act === "doneMenu") return openDoneMenu(id);
      if (act === "doneOnly") { await markDone(id); return renderCurrentView(); }
      if (act === "reagendarDireto") return openDoneAndRescheduleModal(id);
      if (act === "linkFollowup") { const d = getDealById(id); let lead = await resolveLeadForDeal(d); if (!lead) lead = await promptLinkLeadForOldFollowup(d, 'vincular este follow-up'); if (!lead) return; return renderCurrentView(); }
      if (act === "followupConverter") {
        await convertLinkedLeadFromFollowup(id);
        return renderCurrentView();
      }
      if (act === "followupPerdido") {
        const d = getDealById(id);
        let lead = await resolveLeadForDeal(d);
        if (!lead) lead = await promptLinkLeadForOldFollowup(d, 'marcar como perdido');
        if (!lead) return alert("Este FOLLOW-UP não tem lead de origem vinculado.");
        await moveLeadStage(String(lead.ASSIGNED_BY_ID || lead._ownerUserId || ""), String(lead.ID), leadStageId("LEAD DESCARTADO") || leadStageId("PERDIDO"));
        await markDone(id);
        return renderCurrentView();
      }
      if (act === "editPrazo") return openEditPrazoModal(id);
      if (act === "editTitle") return openEditTitleModal(id);
      if (act === "editObs") return openEditObsModal(id);
      if (act === "editUrg") return openEditUrgModal(id);
      if (act === "quickEtapa") return quickToggleEtapa(id);
      if (act === "transferDealUser") return openTransferDealUserModal(id);

      if (act === "delete") {
        await deleteDeal(id);
        return renderCurrentView();
      }

      // Calendário actions dentro do modal
      if (act === "calPrev" || act === "calNext" || act === "calToday" || act === "calPick") {
        // handlers do calendário estão presos no host; aqui só evita conflitos
        return;
      }
    }catch(err){
      alert("Falha: " + (err && (err.message||err) || err));
      try{ clearBusy(); }catch(_){}
    }
  });

  // =========================
  // 25) TOPBAR ACTIONS
  // =========================
  el.today.onclick = () => {
    selectedDate = new Date();
    calendarCursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    renderCurrentView();
  };
  el.tomorrow.onclick = () => {
    selectedDate = new Date(Date.now() + 86400000);
    calendarCursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    renderCurrentView();
  };
  if (el.prevday) el.prevday.onclick = () => { selectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()-1); calendarCursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1); renderCurrentView(); };
  if (el.nextday) el.nextday.onclick = () => { selectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()+1); calendarCursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1); renderCurrentView(); };
  el.calendar.onclick = openCalendarModal;
  el.globalLeads.onclick = async () => { try { await openGlobalLeadsModal("__ALL__"); } catch (e) { alert("Falha ao abrir LEADS geral: " + (e && (e.message || e) || e)); } };
  el.multi.onclick = openMultiSelect;
  el.refresh.onclick = async () => {
    try { await flushSyncQueue(); } catch(_) {}
    await refreshData(true, { forceRecur: true, forceFullDeals: true });
    renderCurrentView();
  };

  // =========================
  // 26) INIT + AUTO REFRESH
  // =========================
  (async function init(){
    try { loadCache(); } catch(_) {}
    setBootProgress(3, "Preparando interface...");
    renderFooterPeople();
    renderGeneral();
    setSoftStatus("JS: ok");
    const hasWarmCache = Array.isArray(STATE.dealsAll) && STATE.dealsAll.length > 0;
    if (hasWarmCache) { try { setBootProgress(18, "Abrindo com cache local..."); renderCurrentView(); } catch (_) {} }
    Promise.resolve().then(async () => {
      try {
        setBootProgress(22, "Buscando dados no Bitrix...");
        await refreshData(false, { forceRecur: false, forceFullDeals: false, deferLeads: false, deferRecur: false });
        renderCurrentView();
      } catch (_) {}
    });
  })();

  setInterval(() => { if (!document.hidden) scheduleSyncFlush(300); }, 5000);

  setInterval(async () => {
    try{
      if (document.hidden) return;
      if (BX_INFLIGHT > 0 || SYNC_QUEUE_RUNNING || (Array.isArray(SYNC_QUEUE) && SYNC_QUEUE.length)) return;
      if (!acquireTabLock("REFRESH", 20000)) return;
      try {
        await refreshData(true, { forceRecur: false, forceFullDeals: false, deferLeads: true });
        if (el.modalOverlay.style.display !== "flex") {
          renderCurrentView();
        }
      } finally {
        releaseTabLock("REFRESH");
      }
    }catch(_){}
  }, REFRESH_MS);

  EQD_BOOT_DONE = true;

})();