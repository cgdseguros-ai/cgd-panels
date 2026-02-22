/* eqd.js — GET • CGD CORRETORA (ATUALIZAÇÃO v4 — fixes solicitados)
   ✅ v4 inclui (sem quebrar o que já funciona):
   1) EDITAR sem prompt: tudo em MODAL (editar título/prazo/obs) + OBS tag abre o mesmo modal
   2) Rodapé: 1 linha itálico em inglês: "System created by GRUPO CGD" (sem título SISTEMA)
   3) Rodapé +20% extra (altura, fonte, fotos) + padding-bottom ajustado
   4) Calendário normal e reagendar em lote: duplo clique fecha e leva para o dia / conclui corretamente
   5) Lista de FOLLOW-UP: não mostra antigos (últimos 10 dias)
   6) Painel individual: colunas fixas (NEGÓCIOS | FOLLOW-UP | LEADS ATENDIDOS)
   7) Logo superior redonda
   8) Concluir: opções "Concluir" e "Concluir e reagendar" (com calendário duplo clique, mantém horário)

   Mantido:
   - cache-first render + refresh em background
   - LEADS lazy-load
   - Multi seleção até 6
   - Botões INTRANET/VENDAS/FINANCEIRO/SEGUROS/LISTA FOLLOW-UP
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
  const FINANCEIRO_URL = "https://cgdcorretorabase.bitrix24.site/financeiro1997";
  const SEGUROS_URL = "https://getcgdcorretora.bitrix24.site/seguros/";

  const REFRESH_MS = 30000; // ✅ mais estável e reduz travamentos

  const ADMIN_PINS = new Set(["4455", "8123", "6677", "4627"]);

  const CATEGORY_MAIN = 17;

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

    { name: "Gabriel", userId: 815, team: "BETA" },
    { name: "Amanda", userId: 269, team: "BETA" },
    { name: "Talita", userId: 29, team: "BETA" },
    { name: "Vivian", userId: 3101, team: "BETA" },
  ];

  const LEAD_USERS = new Set(["15", "19", "17", "23", "811", "3081", "3079", "3083", "3085", "3389"]);
  const SEGUROS_USERS = new Set(["815", "269", "29", "3101"]); // ✅ SEGUROS

  // ✅ Rodapé: sócios (Bitrix USER IDs)
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
      padding-bottom: 132px; /* ✅ rodapé maior (extra +20%) */
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
    .eqd-logo{
      width:60px;height:60px;
      border-radius:999px !important; /* ✅ logo redonda */
      border:1px solid rgba(255,255,255,.14);
      background:rgba(255,255,255,.92);
      object-fit:contain;
      padding:8px;
      flex:0 0 auto;
    }
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

    /* ✅ Modo escuro: preto suave/cinzento */
    #eqd-app.eqd-dark{
      --bgA:#121418; --bgB:#0f1115; --bgC:#121418;
      --border: rgba(255,255,255,.10);
      --text: #fff;
      --muted: rgba(255,255,255,.78);
      background: linear-gradient(135deg, #0f1115, #121418);
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

    #eqd-app.eqd-dark .userCard{background:#f3f1eb;border-color:rgba(0,0,0,.12);color:#111;}
    #eqd-app.eqd-dark .userName, #eqd-app.eqd-dark .userTeam, #eqd-app.eqd-dark .userLine{color:#111;}
    #eqd-app.eqd-dark .userPhoto{background:#fff;border-color:rgba(0,0,0,.12);}

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

    #eqd-app:not(.eqd-dark) .panelTools .eqd-btn{
      background:#1b1e24;border-color:#1b1e24;color:#fff;
    }
    #eqd-app:not(.eqd-dark) .panelTools .eqd-btnPrimary{background:#242a36;border-color:#242a36;color:#fff;}
    #eqd-app:not(.eqd-dark) .panelTools .eqd-btnDanger{background:#3a1f2a;border-color:#3a1f2a;color:#fff;}

    #eqd-app:not(.eqd-dark) .panelTools .eqd-searchInput{
      background:rgba(255,255,255,.92);
      border-color:rgba(0,0,0,.18);
      color:#111;
    }
    #eqd-app:not(.eqd-dark) .panelTools .eqd-searchInput::placeholder{color:rgba(0,0,0,.55)}
    /* ✅ Busca painel individual: letra preta enquanto digita */
    #eqd-app:not(.eqd-dark) #userSearch{ color:#111 !important; }

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
    .panelColHead{padding:8px 12px;border-bottom:1px solid var(--border);font-weight:950;font-size:12px;opacity:1;height:auto;}
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
    .leadObs{width:100%;border:1px solid rgba(30,40,70,.14);border-radius:12px;padding:8px;font-size:12px;font-weight:850;outline:none;background:rgba(255,255,255,.92)}
    #eqd-app.eqd-dark .leadObs{background:rgba(255,255,255,.10);color:var(--text);border-color:rgba(255,255,255,.14)}
    .leadObsRow{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;margin-top:6px}
    .leadObsRow .leadBtn{margin-left:auto}

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

    /* ✅ rodapé +20% extra */
    .eqd-footer{
      position:fixed;left:0;right:0;bottom:0;
      z-index:9999;
      background:rgba(20,22,26,.92);
      color:rgba(255,255,255,.84);
      border-top:1px solid rgba(255,255,255,.10);
      padding:16px 20px; /* ✅ +20% extra */
      display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap;
      font-size:14px; /* ✅ +20% extra */
      font-weight:850;
      backdrop-filter: blur(10px);
    }
    .eqd-footerLeft{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    .eqd-footerPeople{display:flex;gap:10px;align-items:center}
    .eqd-footAvatar{
      width:38px;height:38px;border-radius:999px;object-fit:cover; /* ✅ +20% extra */
      border:1px solid rgba(255,255,255,.14);
      background:rgba(255,255,255,.10);
    }
    .eqd-footerBlock{display:flex;flex-direction:column;gap:2px;line-height:1.1}
    .eqd-footerRight{display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap}
    .eqd-footerMiniTitle{font-weight:950;color:#fff;opacity:.92}
    .eqd-footerDim{opacity:.72}
  `);

  // =========================
  // 3) HELPERS / BX
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
  function dayStart(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }
  function dayEnd(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
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

  function sortDeals(deals) {
    return (deals || [])
      .slice()
      .sort((a, b) => {
        const ua = isUrgenteText(a._urgTxt) ? 0 : 1;
        const ub = isUrgenteText(b._urgTxt) ? 0 : 1;
        if (ua !== ub) return ua - ub;

        const la = a._late ? 0 : 1;
        const lb = b._late ? 0 : 1;
        if (la !== lb) return la - lb;

        const pa = prazoMs(a),
          pb = prazoMs(b);
        if (pa !== pb) return pa - pb;

        return createdMs(a) - createdMs(b);
      });
  }

  function dealAccent(deal) {
    const seed = String(deal.ID || deal.TITLE || "Tarefa");
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const hue = (h >>> 0) % 360;
    const s = 0.45,
      l = 0.55;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0,
      g = 0,
      b = 0;
    if (hue < 60) {
      r = c;
      g = x;
    } else if (hue < 120) {
      r = x;
      g = c;
    } else if (hue < 180) {
      g = c;
      b = x;
    } else if (hue < 240) {
      g = x;
      b = c;
    } else if (hue < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }
    return `${Math.round((r + m) * 255)},${Math.round((g + m) * 255)},${Math.round((b + m) * 255)}`;
  }

  // =========================
  // 5) AUTH / SENHAS
  // =========================
  function askPin() {
    return String(prompt("Senha:") || "").trim();
  }
  function isAdmin(pin) {
    return ADMIN_PINS.has(String(pin || "").trim());
  }
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

    userPhotoById: new Map(),
    userNameById: new Map(),

    lastOkAt: null,
    offline: false,

    // leads
    leadStageIdByName: new Map(),
    leadsByUser: new Map(),
    leadsAtendimentoIdsByUser: new Map(),
    leadsAlertUsers: new Set(),

    footerPhotosLoaded: false,
    bootstrapLoaded: false,
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
  // 8) LEADS STAGES (lazy load)
  // =========================
  async function loadLeadStages() {
    if (STATE.leadStageIdByName && STATE.leadStageIdByName.size) return;
    const list = await bxAll("crm.status.list", { filter: { ENTITY_ID: "STATUS" } });
    const map = new Map();
    (list || []).forEach((s) => {
      if (!s || !s.STATUS_ID) return;
      map.set(norm(s.NAME), String(s.STATUS_ID));
    });
    STATE.leadStageIdByName = map;
  }
  function leadStageId(name) {
    return STATE.leadStageIdByName.get(norm(name)) || "";
  }
  function leadTitle(lead) {
    const t = String(lead.TITLE || "").trim();
    const n = [lead.NAME, lead.LAST_NAME].filter(Boolean).join(" ").trim();
    return bestTitleFromText(t || n || `Lead ${lead.ID}`);
  }
  function leadOperadora(lead) {
    return String((lead && lead[LEAD_UF_OPERADORA]) || "").trim();
  }
  function leadIdade(lead) {
    return String((lead && lead[LEAD_UF_IDADE]) || "").trim();
  }
  function leadTelefone(lead) {
    return String((lead && lead[LEAD_UF_TELEFONE]) || "").trim();
  }
  function leadBairro(lead) {
    return String((lead && lead[LEAD_UF_BAIRRO]) || "").trim();
  }
  function leadFonte(lead) {
    return String((lead && lead[LEAD_UF_FONTE]) || "").trim();
  }
  function leadDataHora(lead) {
    return String((lead && lead[LEAD_UF_DATAHORA]) || lead.DATE_CREATE || "").trim();
  }
  function leadObs(lead) {
    return String((lead && lead[LEAD_UF_OBS]) || "").trim();
  }

  async function loadLeadsForOneUser(userId) {
    await loadLeadStages();

    const select = [
      "ID",
      "TITLE",
      "NAME",
      "LAST_NAME",
      "STATUS_ID",
      "ASSIGNED_BY_ID",
      "DATE_CREATE",
      "DATE_MODIFY",
      "SOURCE_ID",
      LEAD_UF_OPERADORA,
      LEAD_UF_IDADE,
      LEAD_UF_TELEFONE,
      LEAD_UF_BAIRRO,
      LEAD_UF_FONTE,
      LEAD_UF_DATAHORA,
      LEAD_UF_OBS,
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
    for (const id of nowSet) {
      if (!prev.has(id)) {
        hasNew = true;
        break;
      }
    }
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
      beep(now + 0.0);
      beep(now + 0.18);
      beep(now + 0.36);
      setTimeout(() => {
        try {
          ctx.close();
        } catch (_) {}
      }, 900);
    } catch (_) {}
  }

  // =========================
  // 9) LOAD DEALS (cache-first)
  // =========================
  const CACHE_KEY = "EQD_CACHE_V4";
  function saveCache() {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          at: Date.now(),
          dealsAll: STATE.dealsAll,
        })
      );
    } catch (_) {}
  }
  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const j = JSON.parse(raw);
      if (!j) return false;
      if (Array.isArray(j.dealsAll)) STATE.dealsAll = j.dealsAll;
      STATE.dealsOpen = (STATE.dealsAll || []).filter(
        (d) => !(STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId))
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  async function loadDeals() {
    const [urgMap, tarefaMap, etapaMap] = await Promise.all([enums(UF_URGENCIA), enums(UF_TAREFA), enums(UF_ETAPA)]);

    let colabIsEnum = false;
    let colabMap = {};
    try {
      colabIsEnum = await enumHasOptions(UF_COLAB);
      if (colabIsEnum) colabMap = await enums(UF_COLAB);
    } catch (_) {}

    const select = [
      "ID",
      "TITLE",
      "STAGE_ID",
      "DATE_CREATE",
      "DATE_MODIFY",
      "ASSIGNED_BY_ID",
      UF_TAREFA,
      UF_PRAZO,
      UF_URGENCIA,
      UF_ETAPA,
      UF_COLAB,
      UF_OBS,
    ];

    const deals = await bxAll("crm.deal.list", {
      filter: { CATEGORY_ID: CATEGORY_MAIN },
      select,
      order: { ID: "DESC" },
    });

    const maps = { urgMap, tarefaMap, etapaMap, colabMap, colabIsEnum };
    const parsed = (deals || []).map((d) => parseDeal(d, maps));
    STATE.dealsAll = parsed;

    STATE.dealsOpen = (parsed || []).filter(
      (d) => !(STATE.doneStageId && String(d.STAGE_ID) === String(STATE.doneStageId))
    );

    STATE.lastOkAt = new Date();
    STATE.offline = false;
    saveCache();

    // fotos: só buscar quem não tem cache ainda
    const missing = USERS.filter((u) => !STATE.userPhotoById.has(Number(u.userId)));
    await Promise.all(missing.map((u) => ensureUserPhoto(u.userId, u.name)));

    if (!STATE.footerPhotosLoaded) {
      await Promise.all(FOOTER_PARTNERS.map((p) => ensureUserPhoto(p.userId, "")));
      STATE.footerPhotosLoaded = true;
    }
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
          <div class="eqd-footerBlock">
            <div class="eqd-footerDim"><em>System created by GRUPO CGD</em></div>
          </div>
        </div>

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
  const DARK_KEY = "eqd_dark_v6";
  function applyDark(on) {
    if (on) el.app.classList.add("eqd-dark");
    else el.app.classList.remove("eqd-dark");
    el.darkToggle.textContent = on ? "Modo claro" : "Modo escuro";
    try {
      localStorage.setItem(DARK_KEY, on ? "1" : "0");
    } catch (_) {}
  }
  (function initDark() {
    let on = false;
    try {
      on = localStorage.getItem(DARK_KEY) === "1";
    } catch (_) {}
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
  el.modalOverlay.addEventListener("click", (e) => {
    if (e.target === el.modalOverlay) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  function setSoftStatus(msg) {
    el.status.textContent = msg || "JS: ok";
  }
  function setBusy(msg) {
    el.status.textContent = msg || "Executando…";
  }
  function clearBusy() {
    el.status.textContent = "JS: ok";
  }

  // =========================
  // 13) CLOCK
  // =========================
  function tickClock() {
    const d = new Date();
    el.now.textContent = `${fmtDateOnly(d)} • ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
      2,
      "0"
    )}:${String(d.getSeconds()).padStart(2, "0")}`;
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

  function runSearchAdmin() {
    if (!ensureAdminForSearch()) return;

    const kwRaw = String(el.searchInput.value || "").trim();
    const kw = norm(kwRaw);
    const scope = String(el.searchScope.value || "__ALL__");

    if (!kw) {
      openModal("Busca", `<div class="eqd-empty">Digite uma palavra-chave.</div>`);
      return;
    }

    let base = (STATE.dealsOpen || []).slice();
    if (scope !== "__ALL__") base = base.filter((d) => String(d.ASSIGNED_BY_ID || d._assigned || "") === String(scope));

    const hits = base.filter((d) => {
      // ✅ Título + Obs (sem inverter)
      const blob = norm([d.TITLE || "", d._obs || "", d._tarefaTxt || "", d._colabTxt || "", d._etapaTxt || "", d._urgTxt || ""].join(" "));
      return blob.includes(kw);
    });

    const listHTML = hits.length
      ? hits
          .map((d) => {
            const who = dealUserNameByAssigned(d.ASSIGNED_BY_ID || d._assigned);
            const whoLine = scope === "__ALL__" ? `<div style="font-size:11px;font-weight:950;opacity:.80">USER: ${escHtml(who)}</div>` : ``;
            return `<div>${whoLine}${makeDealCard(d, { allowBatch: false })}</div>`;
          })
          .join("")
      : `<div class="eqd-empty">Nenhum resultado para: <strong>${escHtml(kwRaw)}</strong></div>`;

    openModal(`Busca: “${escHtml(kwRaw)}” • ${hits.length} resultado(s)`, listHTML);
  }

  el.searchBtn.addEventListener("click", runSearchAdmin);
  el.searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearchAdmin();
    }
  });

  // =========================
  // 15) CALENDÁRIO (compartilhado)
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

  function renderCalendarBody(overrideSelected) {
    const sel = overrideSelected || selectedDate;
    const { cells } = monthGrid(calendarCursor);
    const today = new Date();
    const title = `${MONTHS_PT[calendarCursor.getMonth()]} ${calendarCursor.getFullYear()}`;

    const dowRow = DOW_PT.map((d) => `<div class="calDow">${d}</div>`).join("");
    const cellHtml = cells
      .map((d) => {
        const off = d.getMonth() !== calendarCursor.getMonth();
        const cls = ["calCell", off ? "off" : "", sameDay(d, today) ? "today" : "", sameDay(d, sel) ? "sel" : ""].filter(Boolean).join(" ");
        return `<div class="${cls}" data-action="calPick" data-cal="${d.toISOString()}">${d.getDate()}</div>`;
      })
      .join("");

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

  function openCalendarModal() {
    calendarCursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    openModal("Calendário", `<div id="calHost">${renderCalendarBody()}</div>`);
    const host = document.getElementById("calHost");

    host.addEventListener("click", (e) => {
      const a = e.target.closest("[data-action]");
      if (!a) return;
      const act = a.getAttribute("data-action");
      if (act === "calPrev") {
        calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
        host.innerHTML = renderCalendarBody();
        return;
      }
      if (act === "calNext") {
        calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
        host.innerHTML = renderCalendarBody();
        return;
      }
      if (act === "calToday") {
        selectedDate = new Date();
        calendarCursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        host.innerHTML = renderCalendarBody();
        return;
      }
      if (act === "calPick") {
        const d = new Date(a.getAttribute("data-cal"));
        if (!Number.isNaN(d.getTime())) {
          selectedDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          calendarCursor = new Date(d.getFullYear(), d.getMonth(), 1);
          host.innerHTML = renderCalendarBody();
        }
      }
    });

    // ✅ duplo clique: FECHA e já vai pro dia (com stopPropagation)
    host.addEventListener("dblclick", (e) => {
      const a = e.target.closest('[data-action="calPick"]');
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();

      const d = new Date(a.getAttribute("data-cal"));
      if (Number.isNaN(d.getTime())) return;

      selectedDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      closeModal();
      renderCurrentView();
    });
  }

  // ✅ calendário para reagendar em lote (apenas dia, duplo clique, mantém horário)
  async function openBatchRescheduleCalendar(dealIds) {
    calendarCursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    let tempSelected = new Date(selectedDate.getTime());

    openModal(
      `Reagendar em lote • ${dealIds.length} item(ns)`,
      `
        <div style="font-size:12px;font-weight:950;opacity:.85">
          Escolha o <strong>dia</strong> (duplo clique). O <strong>horário de cada card</strong> será mantido.
        </div>
        <div id="calHost">${renderCalendarBody(tempSelected)}</div>
      `
    );

    const host = document.getElementById("calHost");

    host.addEventListener("click", (e) => {
      const a = e.target.closest("[data-action]");
      if (!a) return;
      const act = a.getAttribute("data-action");
      if (act === "calPrev") {
        calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
        host.innerHTML = renderCalendarBody(tempSelected);
        return;
      }
      if (act === "calNext") {
        calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
        host.innerHTML = renderCalendarBody(tempSelected);
        return;
      }
      if (act === "calToday") {
        tempSelected = new Date();
        calendarCursor = new Date(tempSelected.getFullYear(), tempSelected.getMonth(), 1);
        host.innerHTML = renderCalendarBody(tempSelected);
        return;
      }
      if (act === "calPick") {
        const d = new Date(a.getAttribute("data-cal"));
        if (!Number.isNaN(d.getTime())) {
          tempSelected = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          calendarCursor = new Date(d.getFullYear(), d.getMonth(), 1);
          host.innerHTML = renderCalendarBody(tempSelected);
        }
      }
    });

    host.addEventListener("dblclick", async (e) => {
      const a = e.target.closest('[data-action="calPick"]');
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();

      const d = new Date(a.getAttribute("data-cal"));
      if (Number.isNaN(d.getTime())) return;

      const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      try {
        setBusy("Reagendando…");
        for (const id of dealIds) {
          const deal = (STATE.dealsAll || []).find((x) => String(x.ID) === String(id));
          if (!deal || !deal._prazo) continue;
          const old = new Date(deal._prazo);
          const hh = old.getHours();
          const mm = old.getMinutes();
          const newIso = isoFromDateAndTimeParts(targetDay, hh, mm);
          await bx("crm.deal.update", { id: String(id), fields: { [UF_PRAZO]: newIso } });
          deal[UF_PRAZO] = newIso;
          deal._prazo = new Date(newIso).toISOString();
          deal._late = false;
        }
        closeModal();
        await refreshData(false);
        renderCurrentView();
      } catch (err) {
        alert("Falha ao reagendar: " + (err.message || err));
      } finally {
        clearBusy();
      }
    });
  }

  // =========================
  // 16) Cards
  // =========================
  function isFollowupDeal(d) {
    const t = norm(d._tarefaTxt || "");
    if (t.includes(norm("FOLLOW-UP"))) return true;
    const title = norm(d.TITLE || "");
    return title.startsWith(norm("FOLLOW-UP"));
  }

  function makeDealCard(deal, context) {
    const showWarn = isAtencaoText(deal._urgTxt);
    const title = (showWarn ? "⚠️ " : "") + bestTitleFromText(deal.TITLE || "");
    const prazoTxt = deal._prazo ? fmt(deal._prazo) : "Sem prazo";
    const tags = [];

    if (isUrgenteText(deal._urgTxt)) tags.push(`<span class="eqd-tag eqd-tagUrg">URGENTE</span>`);
    if (deal._late) tags.push(`<span class="eqd-tag eqd-tagLate">ATRASADA</span>`);
    if (deal._hasObs) tags.push(`<span class="eqd-tag eqd-tagObs" data-action="editDeal" data-id="${deal.ID}">OBS</span>`);
    if (deal._tarefaTxt) tags.push(`<span class="eqd-tag">Tipo: ${trunc(deal._tarefaTxt, 26)}</span>`);
    if (deal._colabTxt) tags.push(`<span class="eqd-tag">COLAB: ${trunc(deal._colabTxt, 28)}</span>`);
    if (deal._etapaTxt) tags.push(`<span class="eqd-tag">ETAPA: ${trunc(deal._etapaTxt, 18)}</span>`);
    if (deal._urgTxt) tags.push(`<span class="eqd-tag">${trunc(deal._urgTxt, 22)}</span>`);

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
            <button class="eqd-smallBtn" data-action="editDeal" data-id="${deal.ID}">EDITAR</button>
            <button class="eqd-smallBtn" data-action="transfer" data-id="${deal.ID}">Trocar colaboradora</button>
            <button class="eqd-smallBtn eqd-smallBtnDanger" data-action="delete" data-id="${deal.ID}">Excluir</button>
          </div>
        </div>
      </div>
    `;
  }

  function removeFromOpen(dealId) {
    const id = String(dealId);
    STATE.dealsOpen = (STATE.dealsOpen || []).filter((d) => String(d.ID) !== id);
  }

  // =========================
  // 17) FOLLOW-UP (deal) — padrão
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

    await bx("crm.deal.add", { fields });
  }

  function openFollowUpModal(user, prefillName) {
    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + 60);
    const localDefault = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    openModal(
      `FOLLOW-UP — ${user.name}`,
      `
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
          <button class="eqd-btn eqd-btnPrimary" id="fuCreate">Criar FOLLOW-UP</button>
        </div>
      </div>
    `
    );

    const warn = document.getElementById("fuWarn");
    document.getElementById("fuCreate").onclick = async () => {
      try {
        warn.style.display = "none";
        warn.textContent = "";
        const nm = String(document.getElementById("fuNome").value || "").trim();
        if (!nm) throw new Error("Preencha o NOME DO NEGÓCIO.");
        const prazoLocal = String(document.getElementById("fuPrazo").value || "").trim();
        const prazoIso = localInputToIsoWithOffset(prazoLocal);
        if (!prazoIso) throw new Error("Prazo inválido.");

        setBusy("Criando follow-up…");
        await createFollowUpDealForUser(user, nm, prazoIso);

        closeModal();
        await refreshData(true);
        renderCurrentView();
      } catch (e) {
        warn.style.display = "block";
        warn.textContent = "Falha:\n" + (e.message || e);
      } finally {
        clearBusy();
      }
    };
  }

  // =========================
  // 18) LISTA DE FOLLOW-UP (sem antigos)
  // =========================
  function openFollowupListModalForUser(user) {
    const all = (STATE.dealsAll || []).filter((d) => String(d.ASSIGNED_BY_ID || d._assigned || "") === String(user.userId));

    const tenDaysMs = 10 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - tenDaysMs;

    const list = all
      .filter(isFollowupDeal)
      .filter((d) => {
        const t = new Date(d._prazo || d.DATE_CREATE || 0).getTime();
        return Number.isFinite(t) && t >= cutoff;
      });

    const body = `
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:space-between">
        <div style="font-size:12px;font-weight:950;opacity:.85">Total: <strong>${list.length}</strong> <span style="opacity:.65">(últimos 10 dias)</span></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input id="fuListSearch" class="eqd-searchInput" style="width:min(520px,70vw)" placeholder="Pesquisar follow-up..." />
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
    document.getElementById("fuListSearch").onkeydown = (e) => {
      if (e.key === "Enter") render(e.target.value);
    };
    document.getElementById("fuListClear").onclick = () => {
      document.getElementById("fuListSearch").value = "";
      render("");
    };
  }

  // =========================
  // 19) LEADS MODAL (full width + follow-up modal)
  // =========================
  function leadMatchesKw(l, kwNorm) {
    if (!kwNorm) return true;
    const blob = norm([leadTitle(l), leadOperadora(l), leadTelefone(l), leadBairro(l), leadFonte(l), leadDataHora(l), leadObs(l), l.ID || ""].join(" "));
    return blob.includes(kwNorm);
  }

  async function openLeadsModalForUser(userId, kwRaw) {
    const user = USERS.find((u) => String(u.userId) === String(userId));
    if (!user) return;

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

    openModal(
      `Leads — ${user.name}`,
      `
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between;align-items:center">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input id="leadSearch" class="eqd-searchInput" style="width:min(720px,85vw)" placeholder="Buscar lead por palavra (nome, operadora, tel, bairro, obs, ID…)" value="${escHtml(String(kwRaw || ""))}" />
          <button class="eqd-btn eqd-btnPrimary" id="leadSearchBtn">Buscar</button>
          <button class="eqd-btn" id="leadSearchClear">Limpar</button>
        </div>
        <button class="eqd-btn" data-action="modalClose">Fechar</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,minmax(380px,1fr));gap:12px;margin-top:10px">
        <div class="panelCol">
          <div class="panelColHead">EM ATENDIMENTO</div>
          <div class="panelColBody" id="ld_at"></div>
        </div>
        <div class="panelCol">
          <div class="panelColHead">ATENDIDOS</div>
          <div class="panelColBody" id="ld_ok"></div>
        </div>
        <div class="panelCol">
          <div class="panelColHead">QUALIFICADO</div>
          <div class="panelColBody" id="ld_q"></div>
        </div>
      </div>
    `,
      { full: true }
    );

    const filtered = kw ? leadsUser.filter((l) => leadMatchesKw(l, kw)) : leadsUser;

    const at = sAt ? filtered.filter((l) => String(l.STATUS_ID) === String(sAt)) : [];
    const ok = sAtendido ? filtered.filter((l) => String(l.STATUS_ID) === String(sAtendido)) : [];
    const q = sQual ? filtered.filter((l) => String(l.STATUS_ID) === String(sQual)) : [];

    function cardLead(l, column) {
      const op = leadOperadora(l);
      const idade = leadIdade(l);
      const bairro = leadBairro(l);
      const fonte = leadFonte(l);
      const tel = leadTelefone(l);
      const when = leadDataHora(l) ? fmt(leadDataHora(l)) : "—";
      const obs = leadObs(l);

      const mkBtn = (label, action, toStatus) =>
        `<button class="leadBtn ${toStatus === sPerdido ? "leadBtnD" : toStatus ? "leadBtnP" : ""}" data-action="${action}" data-leadid="${l.ID}" data-tostatus="${toStatus || ""}" data-userid="${user.userId}">${label}</button>`;

      let btns = "";
      if (column === "AT") {
        btns = `${mkBtn("ATENDIDO", "leadMove", sAtendido)}${mkBtn("PERDIDO", "leadMove", sPerdido)}`;
      } else if (column === "OK") {
        btns = `${mkBtn("PERDIDO", "leadMove", sPerdido)}${mkBtn("CONVERTIDO", "leadMove", sConv)}
                <button class="leadBtn" data-action="leadFollowupModal" data-leadid="${l.ID}" data-userid="${user.userId}">FOLLOW-UP</button>`;
      } else if (column === "Q") {
        btns = `${mkBtn("PERDIDO", "leadMove", sPerdido)}${mkBtn("CONVERTIDO", "leadMove", sConv)}
                <button class="leadBtn" data-action="leadFollowupModal" data-leadid="${l.ID}" data-userid="${user.userId}">FOLLOW-UP</button>`;
      }

      return `
        <div class="leadCard">
          <div class="leadTitle">${escHtml(leadTitle(l))}</div>
          <div class="leadMeta">
            ${op ? `<span>Operadora: <strong>${escHtml(op)}</strong></span>` : ``}
            ${idade ? `<span>Idade: <strong>${escHtml(idade)}</strong></span>` : ``}
            ${tel ? `<span>Telefone: <strong>${escHtml(tel)}</strong></span>` : ``}
            ${bairro ? `<span>Bairro: <strong>${escHtml(bairro)}</strong></span>` : ``}
            ${fonte ? `<span>Fonte: <strong>${escHtml(fonte)}</strong></span>` : ``}
            <span>Data: <strong>${escHtml(when)}</strong></span>
            <span>ID: <strong>${escHtml(l.ID)}</strong></span>
          </div>

          <div class="leadObsRow">
            <textarea class="leadObs" rows="2" data-leadobs="${l.ID}" placeholder="OBS do lead (UF_CRM_LEAD_1762887033192)">${escHtml(obs)}</textarea>
            <button class="leadBtn leadBtnP" data-action="leadSaveObs" data-leadid="${l.ID}" data-userid="${user.userId}">Salvar OBS</button>
          </div>

          <div class="leadBtns">${btns}</div>
        </div>
      `;
    }

    document.getElementById("ld_at").innerHTML = at.length ? at.map((l) => cardLead(l, "AT")).join("") : `<div class="eqd-empty">Nenhum</div>`;
    document.getElementById("ld_ok").innerHTML = ok.length ? ok.map((l) => cardLead(l, "OK")).join("") : `<div class="eqd-empty">Nenhum</div>`;
    document.getElementById("ld_q").innerHTML = q.length ? q.map((l) => cardLead(l, "Q")).join("") : `<div class="eqd-empty">Nenhum</div>`;

    document.getElementById("leadSearchBtn").onclick = () =>
      openLeadsModalForUser(user.userId, String(document.getElementById("leadSearch").value || "").trim());
    document.getElementById("leadSearch").onkeydown = (e) => {
      if (e.key === "Enter") openLeadsModalForUser(user.userId, String(e.target.value || "").trim());
    };
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
  // 21) PAINEL INDIVIDUAL — COLUNAS FIXAS
  // =========================
  let currentView = { kind: "general", userId: null, multi: null };

  function dealsOfSelectedDayPlusOverdueForUser(userId) {
    const ds = dayStart(selectedDate).getTime();
    const de = dayEnd(selectedDate).getTime();
    return (STATE.dealsOpen || []).filter((d) => {
      if (String(d.ASSIGNED_BY_ID || d._assigned || "") !== String(userId)) return false;
      if (!d._prazo) return false;
      const t = new Date(d._prazo).getTime();
      if (!Number.isFinite(t)) return false;
      // ✅ do dia OU atrasadas (antes do dia)
      return (t >= ds && t <= de) || t < ds;
    });
  }

  function renderUserPanel(userId) {
    const user = USERS.find((u) => Number(u.userId) === Number(userId));
    if (!user) return renderGeneral();

    const photo = STATE.userPhotoById.get(Number(user.userId)) || "";
    const dealsDay = dealsOfSelectedDayPlusOverdueForUser(user.userId);
    const ordered = sortDeals(dealsDay);

    // ✅ colunas fixas
    const colNegocios = ordered.filter((d) => !isFollowupDeal(d));
    const colFollowup = ordered.filter((d) => isFollowupDeal(d));

    // Leads atendidos: usa cache (não força load). Mostra últimos 10 dias após abrir LEADS 1x.
    let colLeadsAtendidos = [];
    const leadsCached = STATE.leadsByUser.get(String(user.userId)) || [];
    if (leadsCached.length) {
      const sAtendido = leadStageId("ATENDIDO");
      const cutoff = Date.now() - 10 * 24 * 60 * 60 * 1000;
      colLeadsAtendidos = leadsCached
        .filter((l) => String(l.STATUS_ID) === String(sAtendido))
        .filter((l) => new Date(l.DATE_MODIFY || l.DATE_CREATE || 0).getTime() >= cutoff);
    }

    const hasLeadsBtn = LEAD_USERS.has(String(user.userId));
    const leadsBtn = hasLeadsBtn ? `<button class="eqd-btn" data-action="leadsModal" data-userid="${user.userId}" id="btnLeads">LEADS</button>` : ``;

    const finBtn = String(user.userId) === "813" ? `<a class="eqd-btn" href="${FINANCEIRO_URL}" target="_blank" rel="noopener">FINANCEIRO</a>` : ``;

    const segBtn = SEGUROS_USERS.has(String(user.userId))
      ? `<a class="eqd-btn" href="${SEGUROS_URL}" target="_blank" rel="noopener">SEGUROS</a>`
      : ``;

    const followListBtn = `<button class="eqd-btn" data-action="followList" data-userid="${user.userId}">LISTA DE FOLLOW-UP</button>`;

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
          ${leadsBtn}
          <button class="eqd-btn" id="batchResched">REAGENDAR EM LOTE</button>

          <input class="eqd-searchInput" id="userSearch" placeholder="Buscar..." />
          <button class="eqd-btn" id="userSearchBtn">Buscar</button>
        </div>
      </div>

      <div class="panelCols">
        <div class="panelCol">
          <div class="panelColHead">NEGÓCIOS / TAREFAS</div>
          <div class="panelColBody" id="col_0">
            ${colNegocios.length ? colNegocios.map((d) => makeDealCard(d, { allowBatch: true })).join("") : `<div class="eqd-empty">Sem itens</div>`}
          </div>
        </div>

        <div class="panelCol">
          <div class="panelColHead">FOLLOW-UP</div>
          <div class="panelColBody" id="col_1">
            ${colFollowup.length ? colFollowup.map((d) => makeDealCard(d, { allowBatch: true })).join("") : `<div class="eqd-empty">Sem follow-up</div>`}
          </div>
        </div>

        <div class="panelCol">
          <div class="panelColHead">LEADS ATENDIDOS</div>
          <div class="panelColBody" id="col_2">
            ${
              colLeadsAtendidos.length
                ? colLeadsAtendidos
                    .map(
                      (l) => `
                  <div class="leadCard">
                    <div class="leadTitle">${escHtml(leadTitle(l))}</div>
                    <div class="leadMeta">
                      <span>ID: <strong>${escHtml(l.ID)}</strong></span>
                      <span>Data: <strong>${escHtml(fmt(leadDataHora(l)))}</strong></span>
                    </div>
                  </div>
                `
                    )
                    .join("")
                : `<div class="eqd-empty">Nenhum lead atendido (últimos 10 dias) no cache. Abra LEADS 1x para carregar.</div>`
            }
          </div>
        </div>
      </div>
    `;

    // borda piscando se alert
    if (hasLeadsBtn) {
      const btn = document.getElementById("btnLeads");
      if (btn) {
        if (STATE.leadsAlertUsers.has(String(user.userId))) {
          btn.classList.add("blinkRedBorder");
          play3Beeps();
        } else btn.classList.remove("blinkRedBorder");
      }
    }

    const doUserSearch = () => {
      const kw = norm(String(document.getElementById("userSearch").value || "").trim());
      if (!kw) return alert("Digite uma palavra.");
      const hits = ordered.filter((d) =>
        norm([d.TITLE || "", d._obs || "", d._tarefaTxt || "", d._colabTxt || "", d._etapaTxt || "", d._urgTxt || ""].join(" ")).includes(kw)
      );
      openModal(
        `Busca — ${user.name} • ${hits.length}`,
        hits.length ? hits.map((d) => makeDealCard(d, { allowBatch: false })).join("") : `<div class="eqd-empty">Nada encontrado.</div>`
      );
    };
    document.getElementById("userSearchBtn").onclick = doUserSearch;
    document.getElementById("userSearch").onkeydown = (e) => {
      if (e.key === "Enter") doUserSearch();
    };

    document.getElementById("batchResched").onclick = async () => {
      const ids = [...document.querySelectorAll(".eqd-batch:checked")].map((x) => x.getAttribute("data-id"));
      if (!ids.length) return alert("Selecione tarefas marcando 'Lote' nos cards.");
      await openBatchRescheduleCalendar(ids);
    };
  }

  // =========================
  // 22) MULTI SELEÇÃO (até 6)
  // =========================
  let lastMultiSelection = [];
  function openMultiSelect() {
    const pin = askPin();
    if (!isAdmin(pin)) return;

    openModal(
      "Painel Multi Seleção",
      `
      <div style="font-size:12px;font-weight:950;display:flex;justify-content:space-between;align-items:center">
        <span>Selecione até 6 usuários</span>
        <button class="eqd-btn" data-action="modalClose">VOLTAR</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px">
        ${USERS.map(
          (u) => `
          <label style="display:flex;gap:8px;align-items:center;border:1px solid rgba(0,0,0,.12);border-radius:12px;padding:8px;background:rgba(255,255,255,.65)">
            <input type="checkbox" class="ms-u" value="${u.userId}" ${lastMultiSelection.includes(Number(u.userId)) ? "checked" : ""}>
            <span style="font-weight:950">${escHtml(u.name)}</span>
          </label>
        `
        ).join("")}
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
        <button class="eqd-btn eqd-btnPrimary" id="ms-ok">Abrir</button>
      </div>
    `
    );

    document.getElementById("ms-ok").onclick = () => {
      const sel = [...document.querySelectorAll(".ms-u:checked")].map((x) => Number(x.value));
      if (sel.length < 1) return alert("Selecione ao menos 1.");
      if (sel.length > 6) return alert("Máximo 6.");
      lastMultiSelection = sel.slice();
      closeModal();
      currentView = { kind: "multi", userId: null, multi: sel.slice() };
      renderMultiColumns(sel);
    };
  }

  function renderMultiColumns(userIds) {
    const cols = userIds.length;
    const ds = dayStart(selectedDate).getTime();
    const de = dayEnd(selectedDate).getTime();

    el.main.innerHTML = `
      <div class="panelHead">
        <div style="font-weight:950">PAINEL MULTI • Dia ${fmtDateOnly(selectedDate)}</div>
        <div class="panelTools">
          <button class="eqd-btn" data-action="backGeneral">VOLTAR</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(${cols},minmax(280px,1fr));gap:12px">
        ${userIds
          .map((uid) => {
            const u = USERS.find((x) => Number(x.userId) === Number(uid)) || { name: `User ${uid}`, userId: uid };
            const photo = STATE.userPhotoById.get(Number(uid)) || "";

            // ✅ filtro com parênteses corretos: assigned E (do dia OU atrasado)
            const deals = (STATE.dealsOpen || []).filter((d) => {
              if (String(d.ASSIGNED_BY_ID || d._assigned || "") !== String(uid)) return false;
              if (!d._prazo) return false;
              const t = new Date(d._prazo).getTime();
              if (!Number.isFinite(t)) return false;
              return (t >= ds && t <= de) || t < ds;
            });

            const ordered = sortDeals(deals);
            return `
            <section class="panelCol">
              <div class="panelColHead" style="padding:10px 12px;display:flex;gap:10px;align-items:center;border-bottom:1px solid var(--border)">
                <img src="${photo || ""}" data-action="openUserFromMulti" data-userid="${uid}"
                     style="width:52px;height:52px;border-radius:999px;object-fit:cover;border:1px solid rgba(0,0,0,.12);cursor:pointer" referrerpolicy="no-referrer"
                     onerror="try{this.onerror=null;this.style.display='none'}catch(e){}" />
                <span style="font-weight:950">${escHtml(u.name)}</span>
              </div>
              <div class="panelColBody">${ordered.length ? ordered.map((d) => makeDealCard(d, { allowBatch: false })).join("") : `<div class="eqd-empty">Sem itens do dia</div>`}</div>
            </section>
          `;
          })
          .join("")}
      </div>
    `;
  }

  // =========================
  // 23) EDIT MODAL (sem prompt) + TRANSFER MODAL
  // =========================
  function openEditDealModal(dealId) {
    const deal = (STATE.dealsAll || []).find((d) => String(d.ID) === String(dealId));
    if (!deal) return;

    const currentTitle = String(deal.TITLE || "");
    const currentObs = String(deal._obs || "");
    const currentPrazo = deal._prazo ? new Date(deal._prazo) : null;

    const valDateTime = currentPrazo
      ? `${currentPrazo.getFullYear()}-${String(currentPrazo.getMonth() + 1).padStart(2, "0")}-${String(currentPrazo.getDate()).padStart(2, "0")}T${String(currentPrazo.getHours()).padStart(2, "0")}:${String(currentPrazo.getMinutes()).padStart(2, "0")}`
      : "";

    openModal(
      `Editar • ID ${dealId}`,
      `
      <div class="eqd-warn" id="edWarn"></div>

      <div style="display:grid;gap:10px">
        <div>
          <div style="font-size:11px;font-weight:950;opacity:.8;margin-bottom:6px">NOME DO NEGÓCIO</div>
          <input id="edTitle" class="eqd-searchInput" style="width:100%" value="${escHtml(currentTitle)}" />
        </div>

        <div>
          <div style="font-size:11px;font-weight:950;opacity:.8;margin-bottom:6px">PRAZO (dia e hora)</div>
          <input id="edPrazo" type="datetime-local" class="eqd-searchInput" style="width:100%" value="${escHtml(valDateTime)}" />
        </div>

        <div>
          <div style="font-size:11px;font-weight:950;opacity:.8;margin-bottom:6px">OBSERVAÇÕES</div>
          <textarea id="edObs" class="leadObs" style="min-height:110px">${escHtml(currentObs)}</textarea>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
          <button class="eqd-btn" id="edCancel">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="edSave">Salvar</button>
        </div>
      </div>
    `
    );

    document.getElementById("edCancel").onclick = closeModal;

    document.getElementById("edSave").onclick = async () => {
      try {
        setBusy("Salvando…");

        const t = String(document.getElementById("edTitle").value || "").trim();
        const pLocal = String(document.getElementById("edPrazo").value || "").trim();
        const p = pLocal ? localInputToIsoWithOffset(pLocal) : "";
        const o = String(document.getElementById("edObs").value || "").trim();

        const fields = {};
        if (t) fields.TITLE = t;
        fields[UF_PRAZO] = p || "";
        fields[UF_OBS] = o || "";

        await bx("crm.deal.update", { id: String(dealId), fields });

        closeModal();
        await refreshData(false);
        renderCurrentView();
      } catch (err) {
        const w = document.getElementById("edWarn");
        if (w) {
          w.style.display = "block";
          w.textContent = "Erro ao salvar: " + (err.message || err);
        } else alert("Erro ao salvar: " + (err.message || err));
      } finally {
        clearBusy();
      }
    };
  }

  function openTransferModal(dealId) {
    const deal = (STATE.dealsAll || []).find((d) => String(d.ID) === String(dealId));
    if (!deal) return;

    const current = String(deal.ASSIGNED_BY_ID || deal._assigned || "");

    openModal(
      `Trocar colaboradora • ID ${dealId}`,
      `
      <div class="eqd-warn" id="trWarn"></div>

      <div style="display:grid;gap:10px">
        <div style="font-size:12px;font-weight:950;opacity:.85">Escolha o novo responsável:</div>

        <select id="trUser" class="eqd-searchSelect" style="width:100%;background:rgba(255,255,255,.92);color:#111;border-color:rgba(0,0,0,.18)">
          ${USERS.map((u) => `<option value="${u.userId}" ${String(u.userId) === current ? "selected" : ""}>${escHtml(u.name)} (${u.userId})</option>`).join("")}
        </select>

        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
          <button class="eqd-btn" id="trCancel">Cancelar</button>
          <button class="eqd-btn eqd-btnPrimary" id="trSave">Transferir</button>
        </div>
      </div>
    `
    );

    document.getElementById("trCancel").onclick = closeModal;

    document.getElementById("trSave").onclick = async () => {
      try {
        setBusy("Transferindo…");
        const uid = Number(document.getElementById("trUser").value);
        if (!uid) throw new Error("Seleção inválida.");

        await bx("crm.deal.update", { id: String(dealId), fields: { ASSIGNED_BY_ID: uid } });

        closeModal();
        await refreshData(true);
        renderCurrentView();
      } catch (err) {
        const w = document.getElementById("trWarn");
        if (w) {
          w.style.display = "block";
          w.textContent = "Erro: " + (err.message || err);
        } else alert("Erro: " + (err.message || err));
      } finally {
        clearBusy();
      }
    };
  }

  // =========================
  // 24) DONE: menu + conclude & reschedule
  // =========================
  function openDoneMenu(dealId) {
    openModal(
      "Concluir",
      `
      <div style="font-size:12px;font-weight:950;opacity:.85">Escolha uma opção:</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;margin-top:10px">
        <button class="eqd-btn" data-action="modalClose">Cancelar</button>
        <button class="eqd-btn eqd-btnPrimary" data-action="doneOnly" data-id="${dealId}">Concluir</button>
        <button class="eqd-btn eqd-btnDanger" data-action="doneResched" data-id="${dealId}">Concluir e reagendar</button>
      </div>
    `
    );
  }

  async function doneOnly(dealId) {
    if (!STATE.doneStageId) throw new Error("Não encontrei a coluna CONCLUÍDO na pipeline.");
    setBusy("Concluindo…");
    await bx("crm.deal.update", { id: String(dealId), fields: { STAGE_ID: String(STATE.doneStageId) } });
    removeFromOpen(dealId);
    await refreshData(false);
    clearBusy();
    renderCurrentView();
  }

  async function openConcludeAndRescheduleCalendar(dealId) {
    const deal = (STATE.dealsAll || []).find((d) => String(d.ID) === String(dealId));
    if (!deal) return;

    const oldPrazo = deal._prazo ? new Date(deal._prazo) : new Date();
    const hh = oldPrazo.getHours();
    const mm = oldPrazo.getMinutes();

    calendarCursor = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    let tempSelected = new Date(selectedDate.getTime());

    openModal(
      `Concluir e reagendar • ID ${dealId}`,
      `
      <div style="font-size:12px;font-weight:950;opacity:.85">Duplo clique no dia (mantém o horário do card).</div>
      <div id="calHost">${renderCalendarBody(tempSelected)}</div>
    `
    );

    const host = document.getElementById("calHost");

    host.addEventListener("click", (e) => {
      const a = e.target.closest("[data-action]");
      if (!a) return;
      const act = a.getAttribute("data-action");
      if (act === "calPrev") {
        calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() - 1, 1);
        host.innerHTML = renderCalendarBody(tempSelected);
        return;
      }
      if (act === "calNext") {
        calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + 1, 1);
        host.innerHTML = renderCalendarBody(tempSelected);
        return;
      }
      if (act === "calToday") {
        tempSelected = new Date();
        calendarCursor = new Date(tempSelected.getFullYear(), tempSelected.getMonth(), 1);
        host.innerHTML = renderCalendarBody(tempSelected);
        return;
      }
      if (act === "calPick") {
        const d = new Date(a.getAttribute("data-cal"));
        if (!Number.isNaN(d.getTime())) {
          tempSelected = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          calendarCursor = new Date(d.getFullYear(), d.getMonth(), 1);
          host.innerHTML = renderCalendarBody(tempSelected);
        }
      }
    });

    host.addEventListener("dblclick", async (e) => {
      const a = e.target.closest('[data-action="calPick"]');
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();

      const d = new Date(a.getAttribute("data-cal"));
      if (Number.isNaN(d.getTime())) return;

      const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const newIso = isoFromDateAndTimeParts(targetDay, hh, mm);

      try {
        if (!STATE.doneStageId) throw new Error("Não encontrei a coluna CONCLUÍDO na pipeline.");

        setBusy("Concluindo e recriando…");

        // 1) Concluir card atual
        await bx("crm.deal.update", { id: String(dealId), fields: { STAGE_ID: String(STATE.doneStageId) } });

        // 2) Criar novo card com os mesmos campos e novo prazo
        const fieldsNew = {
          CATEGORY_ID: Number(CATEGORY_MAIN),
          STAGE_ID: String(deal.STAGE_ID),
          TITLE: String(deal.TITLE || ""),
          ASSIGNED_BY_ID: Number(deal.ASSIGNED_BY_ID || deal._assigned || 0),
          [UF_TAREFA]: deal[UF_TAREFA] || "",
          [UF_URGENCIA]: deal[UF_URGENCIA] || "",
          [UF_ETAPA]: deal[UF_ETAPA] || "",
          [UF_COLAB]: deal[UF_COLAB] || "",
          [UF_OBS]: deal[UF_OBS] || "",
          [UF_PRAZO]: newIso,
        };

        await bx("crm.deal.add", { fields: fieldsNew });

        closeModal();
        await refreshData(false);
        renderCurrentView();
      } catch (err) {
        alert("Falha: " + (err.message || err));
      } finally {
        clearBusy();
      }
    });
  }

  async function deleteDeal(dealId) {
    openModal(
      "Confirmar exclusão",
      `
      <div class="eqd-warn" style="display:block">Excluir este item?</div>
      <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
        <button class="eqd-btn" data-action="modalClose">Cancelar</button>
        <button class="eqd-btn eqd-btnDanger" id="confirmDel">Excluir</button>
      </div>
    `
    );
    document.getElementById("confirmDel").onclick = async () => {
      try {
        setBusy("Excluindo…");
        await bx("crm.deal.delete", { id: String(dealId) });
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
    const leadId = a.getAttribute("data-leadid");
    const toStatus = a.getAttribute("data-tostatus");

    if (act === "modalClose") return closeModal();

    if (act === "openUser") {
      const userId = Number(uid);
      if (!canOpenUserPanel(userId)) return;
      currentView = { kind: "user", userId, multi: currentView.multi };
      renderUserPanel(userId);
      return;
    }

    if (act === "openUserFromMulti") {
      const userId = Number(uid);
      if (!canOpenUserPanel(userId)) return;
      currentView = { kind: "user", userId, multi: lastMultiSelection.slice() };
      renderUserPanel(userId);
      return;
    }

    if (act === "backGeneral") {
      currentView = { kind: "general", userId: null, multi: null };
      return renderGeneral();
    }

    if (act === "backToPrevious") {
      if (currentView.multi && currentView.multi.length) {
        currentView = { kind: "multi", userId: null, multi: currentView.multi.slice() };
        return renderMultiColumns(currentView.multi);
      }
      currentView = { kind: "general", userId: null, multi: null };
      return renderGeneral();
    }

    if (act === "followUpModal") {
      const user = USERS.find((u) => Number(u.userId) === Number(uid));
      if (!user) return;
      return openFollowUpModal(user, "");
    }

    if (act === "followList") {
      const user = USERS.find((u) => Number(u.userId) === Number(uid));
      if (!user) return;
      return openFollowupListModalForUser(user);
    }

    if (act === "leadsModal") {
      return openLeadsModalForUser(uid, "");
    }

    if (act === "leadMove") {
      if (!leadId || !toStatus) return;
      setBusy("Movendo lead…");
      bx("crm.lead.update", { id: String(leadId), fields: { STATUS_ID: String(toStatus) } })
        .then(() => loadLeadsForOneUser(uid))
        .then(() => {
          clearBusy();
          openLeadsModalForUser(uid, document.getElementById("leadSearch") ? document.getElementById("leadSearch").value : "");
        })
        .catch((err) => {
          clearBusy();
          alert(err.message || err);
        });
      return;
    }

    if (act === "leadSaveObs") {
      if (!leadId) return;
      const ta = document.querySelector(`textarea[data-leadobs="${leadId}"]`);
      const val = ta ? String(ta.value || "").trim() : "";
      setBusy("Salvando OBS do lead…");
      bx("crm.lead.update", { id: String(leadId), fields: { [LEAD_UF_OBS]: val } })
        .then(() => loadLeadsForOneUser(uid))
        .then(() => {
          clearBusy();
          openLeadsModalForUser(uid, document.getElementById("leadSearch") ? document.getElementById("leadSearch").value : "");
        })
        .catch((err) => {
          clearBusy();
          alert(err.message || err);
        });
      return;
    }

    if (act === "leadFollowupModal") {
      const user = USERS.find((u) => String(u.userId) === String(uid));
      const leads = STATE.leadsByUser.get(String(uid)) || [];
      const lead = leads.find((l) => String(l.ID) === String(leadId));
      if (!user || !lead) return;
      return openFollowUpModal(user, leadTitle(lead));
    }

    if (act === "editDeal") return openEditDealModal(dealId);
    if (act === "transfer") return openTransferModal(dealId);

    if (act === "doneMenu") return openDoneMenu(dealId);

    if (act === "doneOnly") {
      closeModal();
      return doneOnly(dealId).catch((err) => alert(err.message || err));
    }

    if (act === "doneResched") {
      closeModal();
      return openConcludeAndRescheduleCalendar(dealId);
    }

    if (act === "delete") return deleteDeal(dealId);
  }

  el.main.addEventListener("click", globalClickHandler);
  el.modalBody.addEventListener("click", globalClickHandler);

  // =========================
  // 26) TOP BUTTONS
  // =========================
  el.refresh.addEventListener("click", () => {
    refreshData(true).then(renderCurrentView).catch(() => {});
  });
  el.today.addEventListener("click", () => {
    selectedDate = new Date();
    renderCurrentView();
  });
  el.calendar.addEventListener("click", openCalendarModal);
  el.multi.addEventListener("click", openMultiSelect);

  // =========================
  // 27) RENDER
  // =========================
  function renderCurrentView() {
    el.meta.textContent = STATE.lastOkAt ? `Atualizado em ${fmt(STATE.lastOkAt)}${STATE.offline ? " • (offline)" : ""}` : `Carregando…`;
    renderFooterPeople();

    if (currentView.kind === "user" && currentView.userId) return renderUserPanel(currentView.userId);
    if (currentView.kind === "multi" && currentView.multi) return renderMultiColumns(currentView.multi);
    return renderGeneral();
  }

  // =========================
  // 28) REFRESH (cache-first + background)
  // =========================
  let REFRESH_RUNNING = false;

  async function refreshData(force) {
    if (REFRESH_RUNNING) return;
    REFRESH_RUNNING = true;

    try {
      setSoftStatus(force ? "Atualizando (completo)…" : "Atualizando…");
      if (force || !STATE.bootstrapLoaded) {
        await loadStagesForCategory(CATEGORY_MAIN);
        STATE.bootstrapLoaded = true;
      }
      await loadDeals();
      setSoftStatus("JS: ok");
    } catch (e) {
      STATE.offline = true;
      setSoftStatus("Sem conexão / limite — mantendo painel estável…");
    } finally {
      REFRESH_RUNNING = false;
    }
  }

  // =========================
  // 29) INIT (render imediato do cache)
  // =========================
  (async () => {
    try {
      await loadStagesForCategory(CATEGORY_MAIN).catch(() => {});
      STATE.bootstrapLoaded = true;
      loadCache();
    } catch (_) {}

    currentView = { kind: "general", userId: null, multi: null };
    renderCurrentView();

    refreshData(true).then(() => renderCurrentView()).catch(() => {});

    setInterval(() => {
      if (!REFRESH_RUNNING && BX_INFLIGHT === 0) {
        refreshData(false).then(() => renderCurrentView()).catch(() => {});
      }
    }, REFRESH_MS);
  })().catch(showFatal);
})();
