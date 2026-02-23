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
    "https://bitrix24public.com/b24-6iyx5y.bitrix24.com.br/docs/pub/c77325321d1ad38e8012b995a5f4e8dd/showFile/?&token=wzev6g2dxwkk";

  const INTRANET_URL = "https://cgdcorretora.bitrix24.site/";
  const VENDAS_URL = "https://cgdcorretorabase.bitrix24.site/vendas/";
  const FINANCEIRO_URL = "https://cgdcorretorabase.bitrix24.site/controlefinanceiro/";
  const SEGUROS_URL = "https://getcgdcorretora.bitrix24.site/seguros/";

  const REFRESH_MS = 20000;

  const ADMIN_PINS = new Set(["4455", "8123", "6677", "4627"]);
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

    { name: "Gabriel", userId: 815, team: "ÔMEGA" },
    { name: "Amanda", userId: 269, team: "ÔMEGA" },
    { name: "Talita", userId: 29, team: "ÔMEGA" },
    { name: "Vivian", userId: 3101, team: "ÔMEGA" },
  ];

  const LEAD_USERS = new Set(["15", "19", "17", "23", "811", "3081", "3079", "3083", "3085", "3389"]);
  const SEGUROS_USERS = new Set(["815", "269", "29", "3101"]);

  const SPECIAL_PANEL_USERS = new Set([
    "3079", "3083", "3085", "3389",
    "15", "19", "17", "23", "811", "3081",
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

  function showFatal(err) {
    try {
      const root = ensureRoot();
      root.innerHTML = `
        <div style="padding:14px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial">
          <div style="font-weight:950;font-size:14px;margin-bottom:8px">Falha ao carregar o painel</div>
          <pre style="white-space:pre-wrap;background:#fff;border:1px solid rgba(0,0,0,.12);border-radius:12px;padding:12px;max-width:1100px;overflow:auto">${String(
            (err && (err.stack || err.message || err)) || err
          )}</pre>
          <div style="font-size:12px;opacity:.7;margin-top:8px">Abra o console (F12) para mais detalhes.</div>
        </div>
      `;
    } catch (_) {}
  }

  window.addEventListener("error", (e) => showFatal(e.error || e.message || e));
  window.addEventListener("unhandledrejection", (e) => showFatal(e.reason || e));

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
      display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
      margin-bottom:12px;
      background:#14161a;border:1px solid rgba(255,255,255,.08);
      padding:12px;border-radius:18px;
    }
    .eqd-titleWrap{display:flex;align-items:center;gap:12px;min-width:320px;}
    .eqd-logo{width:60px;height:60px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.92);object-fit:contain;padding:8px;flex:0 0 auto;}
    .eqd-titleBlock{display:flex;flex-direction:column;gap:2px;}
    .eqd-title{display:flex;align-items:center;gap:10px;font-weight:950;font-size:18px;color:#fff;}
    .eqd-dot{width:10px;height:10px;border-radius:999px;background:#16a34a;box-shadow:0 0 0 6px rgba(22,163,74,.12);}
    .eqd-meta{font-size:12px;color:rgba(255,255,255,.75);font-weight:800;}

    .eqd-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end;}
    .eqd-pill{font-size:12px;font-weight:900;padding:8px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.12);color:#fff;white-space:nowrap;}
    .eqd-btn{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.12);border-radius:999px;padding:8px 12px;font-size:12px;font-weight:950;cursor:pointer;white-space:nowrap;color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:8px;}
    .eqd-btnPrimary{background:rgba(120,90,255,.22);border-color:rgba(120,90,255,.40);}
    .eqd-btnDanger{background:rgba(255,70,90,.18);border-color:rgba(255,70,90,.32);}

    .eqd-searchWrap{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end;}
    .eqd-searchInput{width:min(340px,54vw);border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.10);border-radius:999px;padding:9px 12px;font-size:12px;font-weight:900;outline:none;color:#fff;}
    .eqd-searchInput::placeholder{color:rgba(255,255,255,.70)}
    .eqd-searchSelect{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.10);border-radius:999px;padding:8px 10px;font-size:12px;font-weight:950;outline:none;min-width:170px;color:#fff;}
    .eqd-searchSelect option{color:#111;background:#fff;}

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

    .userGrid{display:grid;grid-template-columns:repeat(4,minmax(220px,1fr));gap:12px;}
    @media (max-width:1200px){.userGrid{grid-template-columns:repeat(2,minmax(220px,1fr));}}
    @media (max-width:720px){.userGrid{grid-template-columns:1fr;}}

    .userCard{
      border:1px solid rgba(30,40,70,.12);
      border-radius:18px;
      background:rgba(255,255,255,.52);
      backdrop-filter: blur(12px);
      padding:12px;
      cursor:pointer;
      transition: transform .08s ease, box-shadow .08s ease;
      display:flex;gap:12px;align-items:center;
    }
    .userCard:hover{transform:translateY(-1px);box-shadow:0 10px 22px rgba(20,25,35,.10);}

    .userInfoLeft{display:flex;flex-direction:column;gap:6px;min-width:130px;}
    .userName{font-weight:950;font-size:14px;text-transform:uppercase;}
    .userTeam{font-size:11px;font-weight:900;opacity:.70;margin-top:-4px;}

    .userPhotoWrap{flex:0 0 auto;display:flex;align-items:center;justify-content:center;}
    .userPhoto{
      width:102px;height:102px;border-radius:999px;
      border:1px solid rgba(30,40,70,.14);
      background:rgba(255,255,255,.92);
      object-fit:cover;
    }

    .userRight{margin-left:auto;display:flex;flex-direction:column;gap:6px;align-items:flex-end;}
    .userEmoji{font-size:18px;}
    .userLine{font-size:11px;font-weight:950;opacity:.90}

    #eqd-app.eqd-dark .userCard{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.12);color:#fff;}
    #eqd-app.eqd-dark .userName, #eqd-app.eqd-dark .userTeam, #eqd-app.eqd-dark .userLine{color:#fff;}
    #eqd-app.eqd-dark .userPhoto{background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.12);}

    .panelHead{
      display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;
      margin-bottom:10px;
      padding:8px 10px;border-radius:18px;border:1px solid var(--border);
      background:rgba(255,255,255,.55);backdrop-filter:blur(10px);
    }
    #eqd-app.eqd-dark .panelHead{background:rgba(255,255,255,.06);}
    .panelUserInfo{display:flex;align-items:center;gap:10px;}
    .panelUserPhoto{width:58px;height:58px;border-radius:999px;border:1px solid rgba(30,40,70,.14);object-fit:cover;background:rgba(255,255,255,.9);}
    #eqd-app.eqd-dark .panelUserPhoto{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.14);}
    .panelUserName{font-weight:950;font-size:14px;text-transform:uppercase;}
    .panelUserTeam{font-size:11px;font-weight:900;opacity:.70;margin-top:2px;}

    .panelTools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:flex-end;flex:1 1 auto;}

    #eqd-app:not(.eqd-dark) .panelTools .eqd-btn{background:#1b1e24;border-color:#1b1e24;color:#fff;}
    #eqd-app:not(.eqd-dark) .panelTools .eqd-btnPrimary{background:#242a36;border-color:#242a36;color:#fff;}
    #eqd-app:not(.eqd-dark) .panelTools .eqd-btnDanger{background:#3a1f2a;border-color:#3a1f2a;color:#fff;}

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
    @keyframes eqdBlinkObs{0%,100%{opacity:1}50%{opacity:.35}}

    .eqd-tagClickable{cursor:pointer;user-select:none}
    .eqd-tagClickable:hover{filter:saturate(1.1);transform:translateY(-.5px)}

    .eqd-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:2px;font-size:10.5px;color:rgba(18,26,40,.66);}
    .eqd-cardActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;}
    .eqd-smallBtn{cursor:pointer;border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.88);border-radius:999px;padding:6px 9px;font-size:11px;font-weight:950;color:rgba(18,26,40,.92);}
    .eqd-smallBtnPrimary{background:rgba(22,163,74,.14);border-color:rgba(22,163,74,.30);}
    .eqd-smallBtnDanger{background:rgba(255,70,90,.14);border-color:rgba(255,70,90,.30);}
    .eqd-empty{border:1px dashed rgba(30,40,70,.18);border-radius:16px;padding:12px;background:rgba(255,255,255,.55);color:rgba(18,26,40,.62);font-size:11px;font-weight:800;text-align:center;}

    .leadCard{border:1px solid rgba(30,40,70,.12);border-radius:16px;background:rgba(255,255,255,.80);padding:10px;display:flex;flex-direction:column;gap:6px}
    #eqd-app.eqd-dark .leadCard{background:#f3f1eb;border-color:rgba(0,0,0,.12);color:#111;}
    .leadTitle{font-size:13px;font-weight:950}
    .leadMeta{font-size:11px;font-weight:900;opacity:.75;display:flex;gap:10px;flex-wrap:wrap}
    .leadBtns{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
    .leadBtn{cursor:pointer;border:1px solid rgba(30,40,70,.14);background:rgba(255,255,255,.88);border-radius:999px;padding:6px 9px;font-size:11px;font-weight:950}
    .leadBtnP{background:rgba(22,163,74,.14);border-color:rgba(22,163,74,.30)}
    .leadBtnD{background:rgba(255,70,90,.14);border-color:rgba(255,70,90,.30)}
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
    @keyframes blinkBorderRed{0%,100%{filter:saturate(1)}50%{filter:saturate(1.6)}}

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
      padding:14px 18px;
      display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap;
      font-size:13px;
      font-weight:850;
      backdrop-filter: blur(10px);
    }
    .eqd-footerLeft{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    .eqd-footerPeople{display:flex;gap:10px;align-items:center}
    .eqd-footAvatar{
      width:38px;height:38px;border-radius:999px;object-fit:cover;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(255,255,255,.10);
    }
    .eqd-footerBlock{display:flex;flex-direction:column;gap:2px;line-height:1.1}
    .eqd-footerRight{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap}
    .eqd-footerMiniTitle{font-weight:950;color:#fff;opacity:.92}
    .eqd-footerDim{opacity:.72}

    .eqd-footerCenter{
      flex: 1 1 auto;
      text-align:center;
      font-style: italic;
      opacity:.86;
      font-weight:900;
      letter-spacing:.2px;
      white-space:nowrap;
    }
    @media (max-width:900px){
      .eqd-footerCenter{order: 5; width:100%; text-align:center;}
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

  let BX_QUEUE = Promise.resolve();
  let BX_INFLIGHT = 0;

  async function bxRaw(method, params = {}) {
    BX_QUEUE = BX_QUEUE.then(async () => {
      BX_INFLIGHT++;
      try {
        const pairs = toPairs("", params, []);
        const body = new URLSearchParams();
        for (const [k, v] of pairs) { if (k) body.append(k, v); }

        const maxTry = 3;
        let lastErr = null;

        for (let attempt = 1; attempt <= maxTry; attempt++) {
          try {
            if (attempt > 1) {
              const base = 250 * Math.pow(2, attempt - 2);
              const jitter = Math.floor(Math.random() * 140);
              await sleep(base + jitter);
            }

            const resp = await fetchWithTimeout(
              PROXY_BASE + method,
              {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
                body,
              },
              14000
            );

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
  const LAST_LEADS_CTX = { userId: "", kw: "" };
  function setLeadsCtx(userId, kw){ LAST_LEADS_CTX.userId = String(userId||""); LAST_LEADS_CTX.kw = String(kw||""); }
  function reopenLeadsModalSafe() {
    if (!LAST_LEADS_CTX.userId) return;
    openLeadsModalForUser(LAST_LEADS_CTX.userId, LAST_LEADS_CTX.kw || "");
  }

  // =========================
  // 5) AUTH / SENHAS
  // =========================
  function askPin() { return String(prompt("Senha:") || "").trim(); }
  function isAdmin(pin) { return ADMIN_PINS.has(String(pin || "").trim()); }
  function canOpenUserPanel(userId) {
    const pin = askPin();
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
    for (const [id, label] of entries) if (norm(label) === wantedLabelNorm) return id;
    for (const [id, label] of entries) if (norm(label).includes(wantedLabelNorm)) return id;
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
  // 7) DEALS PARSE
  // =========================
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
  function leadObs(lead) { return String((lead && lead[LEAD_UF_OBS]) || "").trim(); }

  function tryParseDateAny(v) {
    const s = String(v || "").trim();
    if (!s) return null;
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;
    return null;
  }

  async function loadLeadsForOneUser(userId) {
    await loadLeadStages();

    const select = [
      "ID","TITLE","NAME","LAST_NAME","STATUS_ID","ASSIGNED_BY_ID","DATE_CREATE","DATE_MODIFY","SOURCE_ID",
      LEAD_UF_OPERADORA, LEAD_UF_IDADE, LEAD_UF_TELEFONE, LEAD_UF_BAIRRO, LEAD_UF_FONTE, LEAD_UF_DATAHORA, LEAD_UF_OBS,
    ].filter(Boolean);

    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString();
    const leads = await bxAll("crm.lead.list", {
      filter: { ">=DATE_CREATE": since, ASSIGNED_BY_ID: Number(userId) },
      select,
      order: { ID: "DESC" },
    });

    STATE.leadsByUser.set(String(userId), leads || []);

    const sAt = leadStageId("EM ATENDIMENTO");
    const atList = sAt ? (leads || []).filter((l) => String(l.STATUS_ID) === String(sAt)) : [];
    const prev = STATE.leadsAtendimentoIdsByUser.get(String(userId)) || new Set();
    const nowSet = new Set(atList.map((l) => String(l.ID)));

    let hasNew = false;
    for (const id of nowSet) { if (!prev.has(id)) { hasNew = true; break; } }
    if (hasNew && nowSet.size) STATE.leadsAlertUsers.add(String(userId));
    if (!nowSet.size) STATE.leadsAlertUsers.delete(String(userId));
    STATE.leadsAtendimentoIdsByUser.set(String(userId), nowSet);

    return leads || [];
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
  function saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), dealsAll: STATE.dealsAll }));
    } catch (_) {}
  }
  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const j = JSON.parse(raw);
      if (!j) return false;
      if (Array.isArray(j.dealsAll)) STATE.dealsAll = j.dealsAll;
      STATE.dealsOpen = (STATE.dealsAll || []).filter((d) => !(STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId)));
      return true;
    } catch (_) { return false; }
  }

  async function loadDeals() {
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
    STATE.dealsOpen = (parsed || []).filter((d) => !(STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId)));

    STATE.lastOkAt = new Date();
    STATE.offline = false;
    saveCache();

    const missing = USERS.filter((u) => !STATE.userPhotoById.has(Number(u.userId)));
    await Promise.all(missing.map((u) => ensureUserPhoto(u.userId, u.name)));

    if (!STATE.footerPhotosLoaded) {
      await Promise.all(FOOTER_PARTNERS.map((p) => ensureUserPhoto(p.userId, "")));
      STATE.footerPhotosLoaded = true;
    }
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
  function occursOn(rule, d){
    const t = (rule && rule.type) ? String(rule.type) : "";
    if (t === "DAILY_BUSINESS") return isWeekday(d);
    if (t === "WEEKLY") {
      const arr = Array.isArray(rule.weekDays) ? rule.weekDays.map(Number) : [];
      return arr.includes(d.getDay());
    }
    if (t === "MONTHLY") {
      const day = Number(rule.monthDay || 0);
      return day > 0 && d.getDate() === day;
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
      if (!uid) return;

      if (!STATE.recurConfigDealIdByUser.has(uid)) {
        STATE.recurConfigDealIdByUser.set(uid, String(d.ID));
      }

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
    await bx("crm.deal.update", { id: String(dealId), fields: { [UF_OBS]: payload } });

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
        if (!rid || !title) continue;

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
            return;
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
          <img class="eqd-logo" src="${LOGO_URL}" alt="CGD" referrerpolicy="no-referrer">
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
          <button class="eqd-btn" id="eqd-calendar">CALENDÁRIO</button>
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
    calendar: document.getElementById("eqd-calendar"),
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
  function ensureAdminForSearch() {
    const now = Date.now();
    if (now - LAST_ADMIN_PIN_OK_AT < 10 * 60 * 1000) return true;
    const pin = askPin();
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

  function runSearchAdmin() {
    if (!ensureAdminForSearch()) return;

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

  el.searchBtn.addEventListener("click", runSearchAdmin);
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

    if (isUrgenteText(deal._urgTxt)) {
      tags.push(`<span class="eqd-tag eqd-tagUrg eqd-tagClickable" data-action="editUrg" data-id="${deal.ID}">URGENTE</span>`);
    }
    if (deal._late) tags.push(`<span class="eqd-tag eqd-tagLate">ATRASADA</span>`);
    if (deal._hasObs) tags.push(`<span class="eqd-tag eqd-tagObs" data-action="editObs" data-id="${deal.ID}">OBS</span>`);
    if (deal._tarefaTxt) tags.push(`<span class="eqd-tag">Tipo: ${trunc(deal._tarefaTxt, 26)}</span>`);
    if (deal._colabTxt) tags.push(`<span class="eqd-tag">COLAB: ${trunc(deal._colabTxt, 28)}</span>`);
    if (deal._etapaTxt) tags.push(`<span class="eqd-tag">ETAPA: ${trunc(deal._etapaTxt, 18)}</span>`);
    if (deal._urgTxt) {
      tags.push(`<span class="eqd-tag eqd-tagClickable" data-action="editUrg" data-id="${deal.ID}">${trunc(deal._urgTxt, 22)}</span>`);
    }

    const batchBox =
      context && context.allowBatch
        ? `<label style="display:flex;gap:6px;align-items:center;font-size:11px;font-weight:900;margin-left:auto">
           <input type="checkbox" class="eqd-batch" data-id="${deal.ID}"> Lote
         </label>`
        : ``;

    const obsLine = deal._hasObs ? `<div class="eqd-obsLine">OBS: ${escHtml(trunc(deal._obs, 180))}</div>` : ``;

    return `
      <div class="eqd-card" style="--accent-rgb:${deal._accent}" data-deal="${deal.ID}">
        <div class="eqd-bar"></div>
        <div class="eqd-inner">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div class="eqd-task" style="flex:1 1 auto">${escHtml(title)}</div>
            ${batchBox}
          </div>
          ${obsLine}
          ${tags.length ? `<div class="eqd-tags">${tags.join("")}</div>` : ``}
          <div class="eqd-foot">
            <span>Prazo: <strong>${escHtml(prazoTxt)}</strong></span>
            <span>ID: <strong>${escHtml(deal.ID)}</strong></span>
          </div>
          <div class="eqd-cardActions">
            <button class="eqd-smallBtn eqd-smallBtnPrimary" data-action="doneMenu" data-id="${deal.ID}">Concluir</button>
            <button class="eqd-smallBtn" data-action="editPrazo" data-id="${deal.ID}">Editar prazo</button>
            <button class="eqd-smallBtn" data-action="editTitle" data-id="${deal.ID}">Editar negócio</button>
            <button class="eqd-smallBtn" data-action="editUrg" data-id="${deal.ID}">Urgência</button>
            <button class="eqd-smallBtn" data-action="changeColab" data-id="${deal.ID}">Trocar colaboradora</button>
            <button class="eqd-smallBtn eqd-smallBtnDanger" data-action="delete" data-id="${deal.ID}">Excluir</button>
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

  // =========================
  // 17) FOLLOW-UP (deal)
  // =========================
  async function createFollowUpDealForUser(user, negocioNome, prazoIso) {
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

    // ✅ SALVAR AQUI (cria deal de follow-up)
    await bx("crm.deal.add", { fields });
  }

  function openFollowUpModal(user, prefillName, opts) {
    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + 60);
    const localDefault = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    openModal(`FOLLOW-UP — ${user.name}`, `
      <div class="eqd-warn" id="fuWarn"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">NOME DO NEGÓCIO</div>
          <input id="fuNome" value="${escHtml(prefillName || "")}"
                 style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" placeholder="Ex.: JOÃO SILVA" />
        </div>
        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">PRAZO (dia e hora)</div>
          <input id="fuPrazo" type="datetime-local" value="${localDefault}"
                 style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16)" />
        </div>
        <div style="grid-column:1 / -1;display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:6px">
          <button class="eqd-btn" data-action="modalClose">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="fuSave">SALVAR FOLLOW-UP</button>
        </div>
      </div>
    `);

    const warn = document.getElementById("fuWarn");
    const btn = document.getElementById("fuSave");

    btn.onclick = async () => {
      const lk = `fuSave:${user.userId}`;
      if (!lockTry(lk)) return;
      try {
        btn.disabled = true;
        warn.style.display = "none";
        warn.textContent = "";
        const nm = String(document.getElementById("fuNome").value || "").trim();
        if (!nm) throw new Error("Preencha o NOME DO NEGÓCIO.");
        const prazoLocal = String(document.getElementById("fuPrazo").value || "").trim();
        const prazoIso = localInputToIsoWithOffset(prazoLocal);
        if (!prazoIso) throw new Error("Prazo inválido.");

        setBusy("Salvando follow-up…");

        // ✅ SALVAR AQUI
        await createFollowUpDealForUser(user, nm, prazoIso);

        closeModal();
        await refreshData(true);
        if (opts && opts.returnToLeads) {
          setLeadsCtx(opts.returnToLeads.userId, opts.returnToLeads.kw || "");
          return reopenLeadsModalSafe();
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

  function isFollowupDeal(d) {
    const t = norm(d._tarefaTxt || "");
    if (t.includes(norm("FOLLOW-UP"))) return true;
    const title = norm(d.TITLE || "");
    return title.startsWith(norm("FOLLOW-UP"));
  }

  function openFollowupListModalForUser(user) {
    const all = (STATE.dealsAll || []).filter((d) => String(d.ASSIGNED_BY_ID || d._assigned || "") === String(user.userId));
    const listAll = all.filter(isFollowupDeal);

    const from = new Date(Date.now() - 1000*60*60*24*10).getTime();
    const list = listAll.filter((d) => {
      if (!d._prazo) return false;
      const t = new Date(d._prazo).getTime();
      return Number.isFinite(t) && t >= from;
    });

    const body = `
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between">
        <div style="font-size:12px;font-weight:950;opacity:.85">Total: <strong>${list.length}</strong></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input id="fuListSearch" class="eqd-searchInput" style="width:min(520px,70vw);color:#111;background:#fff;border-color:rgba(0,0,0,.18)" placeholder="Pesquisar follow-up..." />
          <button class="eqd-btn eqd-btnPrimary" id="fuListBtn">Buscar</button>
          <button class="eqd-btn" id="fuListClear">Limpar</button>
        </div>
      </div>
      <div id="fuListBox" style="margin-top:10px;display:flex;flex-direction:column;gap:8px"></div>
    `;
    openModal(`Lista de FOLLOW-UP — ${user.name}`, body, { wide: true });

    const box = document.getElementById("fuListBox");
    const render = (kwRaw) => {
      const kw = norm(String(kwRaw || "").trim());
      const filtered = kw
        ? list.filter((d) => norm([d.TITLE || "", d._obs || "", d._colabTxt || "", d._etapaTxt || "", d._urgTxt || ""].join(" ")).includes(kw))
        : list.slice();

      const ordered = sortDeals(filtered);
      box.innerHTML = ordered.length ? ordered.map((d) => makeDealCard(d, { allowBatch: false })).join("") : `<div class="eqd-empty">Nenhum follow-up.</div>`;
    };

    render("");

    document.getElementById("fuListBtn").onclick = () => render(document.getElementById("fuListSearch").value);
    document.getElementById("fuListSearch").onkeydown = (e) => { if (e.key === "Enter") render(e.target.value); };
    document.getElementById("fuListClear").onclick = () => { document.getElementById("fuListSearch").value = ""; render(""); };
  }

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
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">ETAPA</div>
          <select id="ntEtapa" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">
            <option value="">Carregando…</option>
          </select>
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
        const etapaItems = getFieldItemsFromMeta(meta, UF_ETAPA);
        const tipoItems = getFieldItemsFromMeta(meta, UF_TAREFA);
        const urgItems = getFieldItemsFromMeta(meta, UF_URGENCIA);

        const selEtapa = document.getElementById("ntEtapa");
        const selTipo = document.getElementById("ntTipo");
        const selUrg = document.getElementById("ntUrg");

        if (selEtapa) selEtapa.innerHTML = renderOptions(etapaItems, "Selecione a etapa…");
        if (selTipo) selTipo.innerHTML = renderOptions(tipoItems, "Selecione o tipo…");
        if (selUrg) selUrg.innerHTML = renderOptions(urgItems, "Selecione a urgência…");
      } catch (_) {
        const selEtapa = document.getElementById("ntEtapa");
        const selTipo = document.getElementById("ntTipo");
        const selUrg = document.getElementById("ntUrg");
        if (selEtapa) selEtapa.innerHTML = `<option value="">(falha ao carregar)</option>`;
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

        const prazoLocal = String(document.getElementById("ntPrazo").value || "").trim();
        const prazoIso = localInputToIsoWithOffset(prazoLocal);
        if (!prazoIso) throw new Error("Prazo inválido.");

        const obs = String(document.getElementById("ntObs").value || "").trim();
        const colabTxt = String(document.getElementById("ntColab").value || "").trim();

        const etapaUfVal = String((document.getElementById("ntEtapa") || {}).value || "").trim();
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

          // ✅ SALVAR AQUI (cria uma tarefa normal)
          await bx("crm.deal.add", { fields });

          closeModal();
          await refreshData(true);
          renderCurrentView();
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
        reopenLeadsModalSafe();
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

  async function openManualLeadCreateModal(user, defaultStatusId) {
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().slice(0,16);

    const sAt = leadStageId("EM ATENDIMENTO");
    const sAtendido = leadStageId("ATENDIDO");
    const sQual = leadStageId("QUALIFICADO");

    openModal(`Novo Lead — ${user.name}`, `
      <div class="eqd-warn" id="nlWarn"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">ETAPA</div>
          <select id="nlStatus" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900">
            ${sAt ? `<option value="${escHtml(sAt)}" ${String(defaultStatusId||"")===String(sAt)?"selected":""}>EM ATENDIMENTO</option>` : ``}
            ${sAtendido ? `<option value="${escHtml(sAtendido)}" ${String(defaultStatusId||"")===String(sAtendido)?"selected":""}>ATENDIDO</option>` : ``}
            ${sQual ? `<option value="${escHtml(sQual)}" ${String(defaultStatusId||"")===String(sQual)?"selected":""}>QUALIFICADO</option>` : ``}
          </select>
        </div>

        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">NOME</div>
          <input id="nlName" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="Ex.: JOÃO" />
        </div>
        <div>
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">SOBRENOME</div>
          <input id="nlLast" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="Ex.: SILVA" />
        </div>

        <div style="grid-column:1 / -1">
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">TÍTULO (opcional)</div>
          <input id="nlTitle" style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" placeholder="Ex.: PLANO UNIMED - JOÃO SILVA" />
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
          <div style="font-size:11px;font-weight:900;margin-bottom:6px">DATA/HORA (UF)</div>
          <input id="nlDh" type="datetime-local" value="${localNow}"
            style="width:100%;padding:10px;border-radius:12px;border:1px solid rgba(30,40,70,.16);font-weight:900" />
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
      try {
        btn.disabled = true;
        warn.style.display = "none";
        warn.textContent = "";

        const STATUS_ID = String(document.getElementById("nlStatus").value || "").trim();
        if (!STATUS_ID) throw new Error("Selecione a ETAPA.");

        const NAME = String(document.getElementById("nlName").value || "").trim();
        const LAST_NAME = String(document.getElementById("nlLast").value || "").trim();
        const TITLE = String(document.getElementById("nlTitle").value || "").trim();
        const op = String(document.getElementById("nlOp").value || "").trim();
        const idade = String(document.getElementById("nlIdade").value || "").trim();
        const tel = String(document.getElementById("nlTel").value || "").trim();
        const bairro = String(document.getElementById("nlBairro").value || "").trim();
        const fonte = String(document.getElementById("nlFonte").value || "").trim();
        const dhLocal = String(document.getElementById("nlDh").value || "").trim();
        const dhIso = dhLocal ? localInputToIsoWithOffset(dhLocal) : "";
        const obs = String(document.getElementById("nlObs").value || "").trim();

        if (!NAME && !TITLE) throw new Error("Preencha pelo menos NOME ou TÍTULO.");

        const fields = {
          ASSIGNED_BY_ID: Number(user.userId),
          STATUS_ID,
        };
        if (TITLE) fields.TITLE = TITLE;
        if (NAME) fields.NAME = NAME;
        if (LAST_NAME) fields.LAST_NAME = LAST_NAME;

        if (op) fields[LEAD_UF_OPERADORA] = op;
        if (idade) fields[LEAD_UF_IDADE] = idade;
        if (tel) fields[LEAD_UF_TELEFONE] = tel;
        if (bairro) fields[LEAD_UF_BAIRRO] = bairro;
        if (fonte) fields[LEAD_UF_FONTE] = fonte;
        if (dhIso) fields[LEAD_UF_DATAHORA] = dhIso;
        if (obs) fields[LEAD_UF_OBS] = obs;

        setBusy("Salvando lead…");

        // ✅ SALVAR AQUI (cria lead)
        await bx("crm.lead.add", { fields });

        await loadLeadsForOneUser(user.userId);
        clearBusy();
        closeModal();
        reopenLeadsModalSafe();
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

  async function openLeadsModalForUser(userId, kwRaw) {
    const user = USERS.find((u) => String(u.userId) === String(userId));
    if (!user) return;

    setLeadsCtx(user.userId, String(kwRaw || ""));

    setBusy("Carregando LEADS…");
    const leadsUser = await loadLeadsForOneUser(user.userId).catch(() => []);
    clearBusy();

    STATE.leadsAlertUsers.delete(String(user.userId));

    const sAt = leadStageId("EM ATENDIMENTO");
    const sAtendido = leadStageId("ATENDIDO");
    const sQual = leadStageId("QUALIFICADO");
    const sPerdido = leadStageId("PERDIDO");
    const sConv = leadStageId("CONVERTIDO");

    const kw = norm(String(kwRaw || "").trim());
    const filtered = kw ? leadsUser.filter((l) => leadMatchesKw(l, kw)) : leadsUser;

    const at = sAt ? filtered.filter((l) => String(l.STATUS_ID) === String(sAt)) : [];
    const ok = sAtendido ? filtered.filter((l) => String(l.STATUS_ID) === String(sAtendido)) : [];
    const q = sQual ? filtered.filter((l) => String(l.STATUS_ID) === String(sQual)) : [];

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
          <button class="eqd-btn" data-action="leadNewManual" data-userid="${user.userId}">NOVO LEAD</button>
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
            <span>ATENDIDOS (<strong>${ok.length}</strong>)</span>
            <button class="eqd-btn" style="padding:6px 10px;font-size:11px" data-action="leadNewManual" data-userid="${user.userId}" data-defaultstatus="${escHtml(sAtendido||"")}">+ Criar</button>
          </div>
          <div class="panelColBody" id="ld_ok"></div>
        </div>

        <div class="panelCol">
          <div class="panelColHead" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
            <span>QUALIFICADO (<strong>${q.length}</strong>)</span>
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

      const obs = leadObs(l);
      const obsOn = !!String(obs||"").trim();
      const obsChip = `<span class="leadObsChip ${obsOn ? "on" : "off"}" data-action="leadObsModal" data-leadid="${l.ID}" data-userid="${user.userId}">
        OBS <b>${obsOn ? "•" : ""}</b>
      </span>`;

      const mkBtn = (label, toStatus) =>
        `<button class="leadBtn ${toStatus === sPerdido ? "leadBtnD" : toStatus ? "leadBtnP" : ""}" data-action="leadMove" data-leadid="${l.ID}" data-tostatus="${toStatus || ""}" data-userid="${user.userId}">${label}</button>`;

      let btns = "";
      if (column === "AT") {
        btns = `${mkBtn("ATENDIDO",sAtendido)}${mkBtn("PERDIDO",sPerdido)}`;
      } else if (column === "OK") {
        btns = `${mkBtn("PERDIDO",sPerdido)}${mkBtn("CONVERTIDO",sConv)}
                <button class="leadBtn" data-action="leadFollowupModal" data-leadid="${l.ID}" data-userid="${user.userId}">FOLLOW-UP</button>`;
      } else if (column === "Q") {
        btns = `${mkBtn("PERDIDO",sPerdido)}${mkBtn("CONVERTIDO",sConv)}
                <button class="leadBtn" data-action="leadFollowupModal" data-leadid="${l.ID}" data-userid="${user.userId}">FOLLOW-UP</button>`;
      }

      return `
        <div class="leadCard">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
            <div class="leadTitle">${escHtml(leadTitle(l))}</div>
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
          </div>

          <div class="leadBtns">${btns}</div>
        </div>
      `;
    }

    document.getElementById("ld_at").innerHTML = at.length ? at.map((l) => cardLead(l, "AT")).join("") : `<div class="eqd-empty">Nenhum</div>`;
    document.getElementById("ld_ok").innerHTML = ok.length ? ok.map((l) => cardLead(l, "OK")).join("") : `<div class="eqd-empty">Nenhum</div>`;
    document.getElementById("ld_q").innerHTML = q.length ? q.map((l) => cardLead(l, "Q")).join("") : `<div class="eqd-empty">Nenhum</div>`;

    document.getElementById("leadSearchBtn").onclick = () => openLeadsModalForUser(user.userId, String(document.getElementById("leadSearch").value || "").trim());
    document.getElementById("leadSearch").onkeydown = (e) => { if (e.key === "Enter") openLeadsModalForUser(user.userId, String(e.target.value || "").trim()); };
    document.getElementById("leadSearchClear").onclick = () => openLeadsModalForUser(user.userId, "");
  }

  // =========================
  // 20) USER CARD STATS / DAY+OVERDUE
  // =========================
  function overdueEmoji(overdueCount) {
    if (overdueCount <= 0) return "🟢";
    if (overdueCount === 2) return "🟠";
    if (overdueCount === 3) return "🟣";
    if (overdueCount >= 4) return "🔴";
    return "🟠";
  }

  function countUserStats(userId) {
    const id = String(userId);
    const all = (STATE.dealsAll || []).filter((d) => String(d.ASSIGNED_BY_ID || d._assigned || "") === id);
    const open = all.filter((d) => !(STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId)));
    const done = all.filter((d) => STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId));

    const ds = dayStart(selectedDate).getTime();
    const de = dayEnd(selectedDate).getTime();

    const dayOpenPlusLate = open.filter((d) => {
      if (!d._prazo) return false;
      const t = new Date(d._prazo).getTime();
      if (!Number.isFinite(t)) return false;
      return (t >= ds && t <= de) || t < ds;
    });

    const dayDone = done.filter((d) => {
      if (!d._prazo) return false;
      const t = new Date(d._prazo).getTime();
      return Number.isFinite(t) && t >= ds && t <= de;
    });

    const overdue = open.filter((d) => d._late);
    return { day: dayOpenPlusLate.length, doneDay: dayDone.length, overdue: overdue.length };
  }

  function makeUserCard(u) {
    const photo = STATE.userPhotoById.get(Number(u.userId)) || "";
    const stats = countUserStats(u.userId);
    const emoji = overdueEmoji(stats.overdue);

    return `
      <div class="userCard" data-action="openUser" data-userid="${u.userId}">
        <div class="userInfoLeft">
          <div class="userName">${escHtml(u.name)}</div>
          <div class="userTeam">Equipe ${escHtml(u.team || "")}</div>
        </div>

        <div class="userPhotoWrap">
          <img class="userPhoto" src="${photo || ""}" alt="${escHtml(u.name)}" referrerpolicy="no-referrer"
            onerror="try{this.onerror=null;this.src='';this.style.display='none'}catch(e){}" />
        </div>

        <div class="userRight">
          <div class="userEmoji">${emoji}</div>
          <div class="userLine">Hoje + atrasadas: <strong>${stats.day}</strong></div>
          <div class="userLine">Concluídas (dia): <strong>${stats.doneDay}</strong></div>
          <div class="userLine">Atrasadas: <strong>${stats.overdue}</strong></div>
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
  // 21) PAINEL INDIVIDUAL / MULTI
  // =========================
  let currentView = { kind: "general", userId: null, multi: null };
  let lastViewStack = [];

  function pushView(v) { lastViewStack.push(JSON.parse(JSON.stringify(v))); }
  function popView() { return lastViewStack.pop() || { kind:"general", userId:null, multi:null }; }

  function dealsOfSelectedDayPlusOverdueForUser(userId) {
    const ds = dayStart(selectedDate).getTime();
    const de = dayEnd(selectedDate).getTime();
    return (STATE.dealsOpen || []).filter((d) => {
      if (String(d.ASSIGNED_BY_ID || d._assigned || "") !== String(userId)) return false;
      if (!d._prazo) return false;
      const t = new Date(d._prazo).getTime();
      if (!Number.isFinite(t)) return false;
      return (t >= ds && t <= de) || t < ds;
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
    const sAtendido = leadStageId("ATENDIDO");
    const ds = dayStart(selectedDate).getTime();
    const de = dayEnd(selectedDate).getTime();

    return (leads || []).filter((l) => {
      if (!sAtendido) return false;
      if (String(l.STATUS_ID) !== String(sAtendido)) return false;
      const dt = tryParseDateAny(leadDataHora(l));
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
        </div>
      </div>
    `;
  }

  async function openBatchRescheduleAdvanced(ids) {
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

        setBusy("Salvando lote…");

        // ✅ SALVAR AQUI (update em lote — serial pra evitar 429)
        for (const id of ids) {
          await bx("crm.deal.update", { id: String(id), fields: { [UF_PRAZO]: prazoIso } });
          updateDealInState(id, { [UF_PRAZO]: prazoIso, _prazo: new Date(prazoIso).toISOString(), _late: false });
        }

        closeModal();
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

  function renderUserPanel(userId) {
    const user = USERS.find((u) => Number(u.userId) === Number(userId));
    if (!user) return renderGeneral();

    const photo = STATE.userPhotoById.get(Number(user.userId)) || "";

    const hasLeadsBtn = LEAD_USERS.has(String(user.userId));
    const leadsBtn = hasLeadsBtn ? `<button class="eqd-btn" data-action="leadsModal" data-userid="${user.userId}" id="btnLeads">LEADS</button>` : ``;

    const finBtn = String(user.userId) === "813" ? `<a class="eqd-btn" href="${FINANCEIRO_URL}" target="_blank" rel="noopener">FINANCEIRO</a>` : ``;
    const segBtn = SEGUROS_USERS.has(String(user.userId)) ? `<a class="eqd-btn" href="${SEGUROS_URL}" target="_blank" rel="noopener">SEGUROS</a>` : ``;

    const followListBtn = `<button class="eqd-btn" data-action="followList" data-userid="${user.userId}">LISTA DE FOLLOW-UP</button>`;
    const newTaskBtn = `<button class="eqd-btn eqd-btnPrimary" data-action="newTaskModal" data-userid="${user.userId}">NOVA TAREFA</button>`;
    const recurBtn = `<button class="eqd-btn" data-action="recurManager" data-userid="${user.userId}">RECORRÊNCIA</button>`;

    const isSpecial = SPECIAL_PANEL_USERS.has(String(user.userId));

    if (!isSpecial) {
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
              <div class="panelUserTeam">Equipe ${escHtml(user.team || "")}</div>
            </div>
          </div>

          <div class="panelTools">
            <button class="eqd-btn" data-action="backToPrevious">VOLTAR</button>
            ${finBtn}
            ${segBtn}
            ${followListBtn}
            <button class="eqd-btn" data-action="followUpModal" data-userid="${user.userId}">FOLLOW-UP</button>
            ${newTaskBtn}
            ${recurBtn}
            ${leadsBtn}
            <button class="eqd-btn" id="batchResched">REAGENDAR EM LOTE</button>

            <input class="eqd-searchInput" id="userSearch" placeholder="Buscar..." />
            <button class="eqd-btn" id="userSearchBtn">Buscar</button>
          </div>
        </div>

        <div class="panelCols">
          ${[0, 1, 2].map((i) => `
            <div class="panelCol">
              <div class="panelColHead">Tarefas</div>
              <div class="panelColBody" id="col_${i}">
                ${cols[i].length ? cols[i].map((d) => makeDealCard(d, { allowBatch: true })).join("") : `<div class="eqd-empty">Sem itens do dia</div>`}
              </div>
            </div>
          `).join("")}
        </div>
      `;

      if (hasLeadsBtn) {
        const btn = document.getElementById("btnLeads");
        if (btn) {
          if (STATE.leadsAlertUsers.has(String(user.userId))) { btn.classList.add("blinkRedBorder"); play3Beeps(); }
          else btn.classList.remove("blinkRedBorder");
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

      return;
    }

    const { tasks, follow } = dealsForSpecialPanel(user.userId);
    const orderedTasks = sortDeals(tasks);
    const orderedFollow = sortDeals(follow);

    if (!STATE.leadsByUser.has(String(user.userId))) {
      loadLeadsForOneUser(user.userId).then(() => { renderUserPanel(user.userId); }).catch(() => {});
    }

    const leadsDay = leadsAttendedOnSelectedDay(user.userId);

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

        <div class="panelTools">
          <button class="eqd-btn" data-action="backToPrevious">VOLTAR</button>
          ${finBtn}
          ${segBtn}
          ${followListBtn}
          <button class="eqd-btn" data-action="followUpModal" data-userid="${user.userId}">FOLLOW-UP</button>
          ${newTaskBtn}
          ${recurBtn}
          ${leadsBtn}
          <button class="eqd-btn" id="batchResched">REAGENDAR EM LOTE</button>

          <input class="eqd-searchInput" id="userSearch" placeholder="Buscar..." />
          <button class="eqd-btn" id="userSearchBtn">Buscar</button>
        </div>
      </div>

      <div class="panelCols">
        <div class="panelCol">
          <div class="panelColHead">NEGÓCIOS DO DIA + ATRASADOS (exceto FOLLOW-UP)</div>
          <div class="panelColBody" id="sp_tasks">
            ${orderedTasks.length ? orderedTasks.map((d) => makeDealCard(d, { allowBatch: true })).join("") : `<div class="eqd-empty">Sem itens</div>`}
          </div>
        </div>

        <div class="panelCol">
          <div class="panelColHead">FOLLOW-UP DO DIA</div>
          <div class="panelColBody" id="sp_follow">
            ${orderedFollow.length ? orderedFollow.map((d) => makeDealCard(d, { allowBatch: true })).join("") : `<div class="eqd-empty">Sem follow-up no dia</div>`}
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

    if (hasLeadsBtn) {
      const btn = document.getElementById("btnLeads");
      if (btn) {
        if (STATE.leadsAlertUsers.has(String(user.userId))) { btn.classList.add("blinkRedBorder"); play3Beeps(); }
        else btn.classList.remove("blinkRedBorder");
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
  }

  // =========================
  // 22) MULTI SELEÇÃO
  // =========================
  let lastMultiSelection = [];
  function openMultiSelect() {
    const pin = askPin();
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
      renderMultiColumns(sel);
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
    el.main.innerHTML = `
      <div class="panelHead">
        <div style="font-weight:950">PAINEL MULTI • Dia ${fmtDateOnly(selectedDate)}</div>
        <div class="panelTools">
          <button class="eqd-btn eqd-btnPrimary" data-action="newTaskMulti">NOVA TAREFA</button>
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
            return (t >= ds && t <= dayEnd(selectedDate).getTime()) || t < ds;
          });
          const ordered = sortDeals(deals);
          return `
            <section class="panelCol">
              <div class="panelColHead" style="display:flex;gap:10px;align-items:center">
                <img src="${photo || ""}" data-action="openUserFromMulti" data-userid="${uid}"
                     style="width:52px;height:52px;border-radius:999px;object-fit:cover;border:1px solid rgba(0,0,0,.12);cursor:pointer" referrerpolicy="no-referrer"
                     onerror="try{this.onerror=null;this.style.display='none'}catch(e){}" />
                <span style="font-weight:950">${escHtml(u.name)}</span>
              </div>
              <div class="panelColBody">${ordered.length ? ordered.map((d) => makeDealCard(d, { allowBatch: false })).join("") : `<div class="eqd-empty">Sem itens do dia</div>`}</div>
            </section>
          `;
        }).join("")}
      </div>
    `;
  }

  // =========================
  // 23) AÇÕES: concluir / editar / excluir / leads move / recorrência manager
  // =========================
  async function refreshData(forceNetwork) {
    if (!STATE.doneStageId) await loadStagesForCategory(CATEGORY_MAIN);

    if (!forceNetwork) loadCache();
    try {
      await loadDeals();
      await loadRecurrenceConfigDeals().catch(()=>{});
      await generateRecurringDealsWindow().catch(()=>{});
      renderFooterPeople();
      el.meta.textContent = `Atualizado: ${fmt(new Date())}`;
    } catch (_) {
      STATE.offline = true;
      el.meta.textContent = `Offline (cache)`;
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
    setBusy("Concluindo…");

    // ✅ SALVAR AQUI (move para concluído)
    await bx("crm.deal.update", { id: String(dealId), fields: { STAGE_ID: String(STATE.doneStageId) } });

    // remover do open local (pra UI reagir rápido)
    STATE.dealsOpen = (STATE.dealsOpen || []).filter(d => String(d.ID) !== String(dealId));
    updateDealInState(dealId, { STAGE_ID: String(STATE.doneStageId) });

    clearBusy();
  }

  function openDoneMenu(dealId){
    const d = getDealById(dealId);
    if (!d) return;

    openModal("Concluir tarefa", `
      <div class="eqd-warn" id="dmWarn"></div>
      <div style="font-size:12px;font-weight:950;opacity:.85;margin-bottom:10px">${escHtml(bestTitleFromText(d.TITLE || ""))}</div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
        <button class="eqd-btn" data-action="modalClose">Cancelar</button>
        <button class="eqd-btn eqd-btnPrimary" id="dmOk">CONCLUIR</button>
      </div>
    `);

    const warn = document.getElementById("dmWarn");
    document.getElementById("dmOk").onclick = async () => {
      const lk = `done:${dealId}`;
      if (!lockTry(lk)) return;
      try{
        warn.style.display = "none";
        await markDone(dealId);
        closeModal();
        await refreshData(true);
        renderCurrentView();
      }catch(e){
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      }finally{
        lockRelease(lk);
      }
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
        setBusy("Salvando…");

        // ✅ SALVAR AQUI
        await bx("crm.deal.update", { id: String(dealId), fields: { TITLE: val } });

        updateDealInState(dealId, { TITLE: val });
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
        setBusy("Salvando…");

        // ✅ SALVAR AQUI
        await bx("crm.deal.update", { id: String(dealId), fields: { [UF_PRAZO]: iso } });

        updateDealInState(dealId, { [UF_PRAZO]: iso, _prazo: new Date(iso).toISOString(), _late: false });
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

        // ✅ SALVAR AQUI
        await bx("crm.deal.update", { id: String(dealId), fields: { [UF_URGENCIA]: v } });

        updateDealInState(dealId, { [UF_URGENCIA]: v, _urgId: v, _urgTxt: "" });
        closeModal();
        await refreshData(true); // recarrega textos _urgTxt
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

        // ✅ SALVAR AQUI
        await bx("crm.deal.update", { id: String(dealId), fields: { [UF_OBS]: val } });

        updateDealInState(dealId, { [UF_OBS]: val, _obs: val, _hasObs: !!val });
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
          await bx("crm.deal.update", { id: String(dealId), fields: { [UF_COLAB]: v } });

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
        await bx("crm.deal.update", { id: String(dealId), fields: { [UF_COLAB]: v } });

        updateDealInState(dealId, { [UF_COLAB]: v, _colabId: v, _colabTxt: v });
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
  }

  async function deleteDeal(dealId){
    if (!confirm("Excluir este item?")) return;
    setBusy("Excluindo…");

    // ✅ SALVAR AQUI (delete)
    await bx("crm.deal.delete", { id: String(dealId) });

    STATE.dealsAll = (STATE.dealsAll || []).filter(d => String(d.ID) !== String(dealId));
    STATE.dealsOpen = (STATE.dealsOpen || []).filter(d => String(d.ID) !== String(dealId));
    clearBusy();
  }

  async function moveLeadStage(userId, leadId, toStatus){
    setBusy("Movendo lead…");

    // ✅ SALVAR AQUI
    await bx("crm.lead.update", { id: String(leadId), fields: { STATUS_ID: String(toStatus) } });

    await loadLeadsForOneUser(userId);
    clearBusy();
    reopenLeadsModalSafe();
  }

  function openRecurrenceManager(userId){
    const uid = String(userId);
    const user = USERS.find(u => String(u.userId) === uid);
    if (!user) return;

    const rules = STATE.recurRulesByUser.get(uid) || [];
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
            <div style="font-size:11px;font-weight:900;opacity:.72;margin-top:4px">
              ${r.etapaUf ? `ETAPA UF: ${escHtml(r.etapaUf)} • ` : ``}
              ${r.tipo ? `TIPO: ${escHtml(r.tipo)} • ` : ``}
              ${r.urg ? `URG: ${escHtml(r.urg)} • ` : ``}
              ${r.colab ? `COLAB: ${escHtml(r.colab)}` : ``}
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="eqd-btn eqd-btnDanger" data-action="recurDelete" data-userid="${uid}" data-ruleid="${escHtml(String(r.id||""))}">Excluir regra</button>
          </div>
        </div>
      `;
    };

    openModal(`Recorrência — ${user.name}`, `
      <div class="eqd-warn" id="rmWarn"></div>
      <div style="font-size:12px;font-weight:950;opacity:.85">Regras: <strong>${rules.length}</strong></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:8px">
        <button class="eqd-btn" data-action="modalClose">Fechar</button>
        <button class="eqd-btn eqd-btnPrimary" data-action="newTaskModal" data-userid="${uid}">+ Nova recorrência</button>
      </div>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px">
        ${rules.length ? rules.map(ruleLine).join("") : `<div class="eqd-empty">Sem regras cadastradas.</div>`}
      </div>
    `, { wide: true });
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

      if (act === "openUser") {
        const uid = String(a.getAttribute("data-userid") || "");
        if (!uid) return;
        if (!canOpenUserPanel(uid)) return;
        pushView(currentView);
        currentView = { kind: "user", userId: Number(uid), multi: null };
        return renderCurrentView();
      }

      if (act === "openUserFromMulti") {
        const uid = String(a.getAttribute("data-userid") || "");
        if (!uid) return;
        if (!canOpenUserPanel(uid)) return;
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

      if (act === "leadsModal") {
        const uid = String(userId||"");
        if (!uid) return;
        return openLeadsModalForUser(uid, "");
      }

      if (act === "leadObsModal") {
        const uid = String(a.getAttribute("data-userid")||"");
        const leadId = String(a.getAttribute("data-leadid")||"");
        if (!uid || !leadId) return;
        return openLeadObsModal(uid, leadId);
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

        return openFollowUpModal(u, nm, { returnToLeads: { userId: uid, kw: LAST_LEADS_CTX.kw || "" } });
      }

      if (act === "leadNewManual") {
        const uid = String(a.getAttribute("data-userid")||"");
        const def = String(a.getAttribute("data-defaultstatus")||"");
        const u = USERS.find(x => String(x.userId) === uid);
        if (!u) return;
        return openManualLeadCreateModal(u, def);
      }

      if (act === "recurManager") {
        const uid = String(userId||"");
        if (!uid) return;
        if (!STATE.recurRulesByUser || STATE.recurRulesByUser.size === 0) await loadRecurrenceConfigDeals().catch(()=>{});
        return openRecurrenceManager(uid);
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
      if (act === "editPrazo") return openEditPrazoModal(id);
      if (act === "editTitle") return openEditTitleModal(id);
      if (act === "editObs") return openEditObsModal(id);
      if (act === "editUrg") return openEditUrgModal(id);
      if (act === "changeColab") return openChangeColabModal(id);

      if (act === "delete") {
        await deleteDeal(id);
        await refreshData(true);
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
  el.calendar.onclick = openCalendarModal;
  el.multi.onclick = openMultiSelect;
  el.refresh.onclick = async () => {
    await refreshData(true);
    renderCurrentView();
  };

  // =========================
  // 26) INIT + AUTO REFRESH
  // =========================
  (async function init(){
    await refreshData(false);
    renderFooterPeople();
    renderGeneral();
    setSoftStatus("JS: ok");
  })();

  setInterval(async () => {
    try{
      await refreshData(true);
      // Se estiver em um painel de user, atualiza pra piscar leads etc.
      renderCurrentView();
    }catch(_){}
  }, REFRESH_MS);

})();
