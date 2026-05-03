/* financeiro.js — CGD Financeiro (Bitrix via Worker)
   - LOTE full screen (despesas e receitas separados)
   - Import CSV via UPLOAD (somente RECEITAS: Favorecido, Valor, Data)
   - Export CSV (somente RECEITAS: Favorecido, Valor, Data)
   - Saldo por Centro de Custo (saldo inicial manual + ajustes)
   - Transferência entre Centros de Custo (ledger local)
   - Modal Cartão de Crédito (compras/parcelas) usando CONTA = UF_CRM_1770770758
   - Campos opcionais em lote: CONTA, OBS, VALOR (pode lançar zerado e preencher depois)
   - v2: ações em massa por seleção + gráficos reais simples no front
   - v3: paginação, auditoria local, observação rápida e ações coletivas mais ricas
   - v5: camada de persistência abstrata com fallback local e estrutura pronta para Worker
*/
(function () {
  "use strict";


  // =========================
  // CSS EMBUTIDO (arquivo único)
  // =========================
  function injectFinanceiroCSS() {
    var css = "/* ===============================\n   FINANCEIRO \u2014 CSS COMPLETO (CGD)\n   Ajustes pedidos:\n   - Topbar #2c2c2c, texto branco\n   - Busca com fundo branco e texto preto\n   - Logo redonda MENOR (28px = ~50% do que estava)\n   - Rodap\u00e9 fixo no rodap\u00e9, 1 linha, #2c2c2c, texto branco\n   - Fotos dos s\u00f3cios \u00e0 ESQUERDA do rodap\u00e9\n   - \u201cSystem created by GRUPO CGD\u201d em it\u00e1lico\n   - Empresas lado a lado (n\u00e3o empilhadas)\n   - Modais: CART\u00c3O/LOTE DESPESAS/LOTE RECEITAS 100vw x 100vh\n================================ */\n\n/* Base */\n#fin-root, .fin-page { box-sizing: border-box; }\n#fin-root *, .fin-page * { box-sizing: border-box; }\n\n:root{\n  --fin-bg: #f4f5f7;\n  --fin-card: #ffffff;\n  --fin-border: rgba(0,0,0,.10);\n  --fin-text: rgba(18,26,40,.92);\n  --fin-muted: rgba(18,26,40,.62);\n\n  --fin-dark: #2c2c2c;\n  --fin-darkText: #ffffff;\n\n  --fin-radius: 16px;\n  --fin-shadow: 0 10px 30px rgba(0,0,0,.08);\n\n  --fin-accent: #2563eb;\n  --fin-danger: #dc2626;\n  --fin-ok: #16a34a;\n}\n\n.fin-page{\n  min-height: 100vh;\n  background: var(--fin-bg);\n  color: var(--fin-text);\n  font-family: system-ui,-apple-system,Segoe UI,Roboto,Arial;\n  padding-bottom: 48px; /* rodap\u00e9 mais baixo */\n}\n\n/* ===============================\n   TOPBAR\n================================ */\n.fin-topbar{\n  position: sticky;\n  top: 0;\n  z-index: 50;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 4px;\n  padding: 5px 8px;\n  background: var(--fin-dark);\n  color: var(--fin-darkText);\n  border-bottom: 1px solid rgba(255,255,255,.10);\n}\n\n.fin-top-left{\n  display:flex;\n  align-items:center;\n  gap:6px;\n  min-width: 210px;\n}\n\n.fin-top-logo{\n  width: 26px;\n  height: 26px;\n  border-radius: 999px;\n  object-fit: cover;\n  background: #fff;\n  border: 1px solid rgba(255,255,255,.25);\n  display:block;\n  flex: 0 0 26px;\n}\n\n.fin-top-title{\n  font-weight: 950;\n  font-size: 12px;\n  line-height: 1;\n  color: #fff;\n}\n\n.fin-top-sub{\n  font-size: 10px;\n  font-weight: 700;\n  opacity: .82;\n  color: #fff;\n}\n\n.fin-loading{\n  margin-left: 4px;\n  display: inline-flex;\n  padding: 2px 6px;\n  border-radius: 999px;\n  background: rgba(255,255,255,.12);\n  color:#fff;\n  font-size: 10px;\n}\n\n/* A\u00e7\u00f5es topo */\n.fin-top-actions{\n  display:flex;\n  align-items:center;\n  justify-content:flex-end;\n  gap: 3px;\n  flex-wrap: wrap;\n}\n\n/* Busca no topo \u2014 fundo branco / texto preto */\n.fin-search{\n  display:flex;\n  align-items:center;\n  gap:6px;\n  background:#fff;\n  border:1px solid rgba(0,0,0,.12);\n  border-radius: 999px;\n  padding: 5px 8px;\n  min-width: 200px;\n  max-width: 340px;\n}\n.fin-search span{ color:#111; opacity:.65; font-size:11px; }\n.fin-search input{\n  width: 100%;\n  border: 0;\n  outline: 0;\n  background: transparent;\n  color: #111;\n  font-weight: 700;\n  font-size: 10px;\n}\n.fin-search input::placeholder{ color: rgba(0,0,0,.55); }\n\n/* Bot\u00f5es */\n.fin-btn{\n  appearance:none;\n  border: 1px solid rgba(255,255,255,.18);\n  background: rgba(255,255,255,.10);\n  color: #fff;\n  font-weight: 900;\n  font-size: 10px;\n  line-height: 1;\n  padding: 5px 7px;\n  border-radius: 8px;\n  cursor: pointer;\n  transition: transform .05s ease, background .15s ease, border-color .15s ease, opacity .15s ease;\n}\n.fin-btn:hover{ background: rgba(255,255,255,.16); border-color: rgba(255,255,255,.25); }\n.fin-btn:active{ transform: translateY(1px); }\n.fin-btn:disabled{ opacity:.55; cursor:not-allowed; }\n\n.fin-btn--primary{\n  background: var(--fin-accent);\n  border-color: rgba(255,255,255,.0);\n  color:#fff;\n}\n.fin-btn--primary:hover{ filter: brightness(1.05); }\n\n.fin-btn--csv{\n  background: #f59e0b;\n  border-color: rgba(0,0,0,.08);\n  color: #111827;\n  box-shadow: 0 8px 18px rgba(245,158,11,.25);\n  padding: 8px 12px;\n  border-radius: 10px;\n  font-size: 11px;\n  letter-spacing: .02em;\n}\n.fin-btn--csv:hover{ filter: brightness(1.04); background: #fbbf24; }\n\n.fin-btn--danger{\n  background: var(--fin-danger);\n  border-color: rgba(255,255,255,.0);\n  color:#fff;\n}\n\n/* ===============================\n   LAYOUT GERAL\n================================ */\n.fin-shell{\n  max-width: 1480px;\n  margin: 0 auto;\n  padding: 14px;\n}\n\n.fin-body{\n  display:flex;\n  gap: 12px;\n  align-items: stretch;\n}\n\n.fin-side{\n  width: 260px;\n  min-width: 240px;\n}\n\n.fin-side-brand{\n  background: var(--fin-card);\n  border: 1px solid var(--fin-border);\n  border-radius: var(--fin-radius);\n  padding: 12px;\n  box-shadow: var(--fin-shadow);\n}\n\n.fin-brand-title{\n  font-weight: 950;\n  font-size: 14px;\n}\n.fin-brand-sub{\n  margin-top: 4px;\n  color: var(--fin-muted);\n  font-weight: 800;\n  font-size: 12px;\n}\n\n.fin-side-block{\n  margin-top: 12px;\n  background: var(--fin-card);\n  border: 1px solid var(--fin-border);\n  border-radius: var(--fin-radius);\n  padding: 12px;\n  box-shadow: var(--fin-shadow);\n}\n\n.fin-side-h{\n  font-weight: 950;\n  font-size: 12px;\n  text-transform: uppercase;\n  letter-spacing: .04em;\n  margin-bottom: 10px;\n}\n\n.fin-side-list{\n  display:flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.fin-side-item{\n  display:flex;\n  align-items:center;\n  gap: 10px;\n  width:100%;\n  padding: 10px 10px;\n  border-radius: 12px;\n  border:1px solid rgba(0,0,0,.08);\n  background:#fff;\n  cursor:pointer;\n  text-align:left;\n  font-weight: 900;\n  font-size: 12px;\n  color: var(--fin-text);\n}\n.fin-side-item:hover{ background: rgba(37,99,235,.06); border-color: rgba(37,99,235,.25); }\n.fin-side-item.is-active{ background: rgba(37,99,235,.12); border-color: rgba(37,99,235,.35); }\n\n.fin-dot{\n  width: 10px;\n  height: 10px;\n  border-radius: 999px;\n  background: rgba(37,99,235,.35);\n}\n.fin-side-label{ line-height: 1.2; }\n\n.fin-panel{\n  background: var(--fin-card);\n  border: 1px solid var(--fin-border);\n  border-radius: var(--fin-radius);\n  box-shadow: var(--fin-shadow);\n}\n\n.fin-panel-inner{\n  padding: 14px;\n}\n\n.fin-kpis{\n  display:grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 10px;\n}\n\n.fin-kpi{\n  border: 1px solid rgba(0,0,0,.08);\n  border-radius: 14px;\n  padding: 12px;\n  background: linear-gradient(180deg, rgba(37,99,235,.05), rgba(0,0,0,0));\n}\n.fin-kpi-k{\n  color: var(--fin-muted);\n  font-weight: 900;\n  font-size: 12px;\n}\n.fin-kpi-v{\n  margin-top: 6px;\n  font-weight: 1000;\n  font-size: 18px;\n}\n\n.fin-filters{\n  margin-top: 12px;\n  display:flex;\n  gap: 10px;\n  flex-wrap: wrap;\n  align-items:flex-end;\n}\n\n.fin-field{\n  display:flex;\n  flex-direction: column;\n  gap: 6px;\n}\n.fin-field label{\n  font-size: 11px;\n  font-weight: 950;\n  color: var(--fin-muted);\n  text-transform: uppercase;\n  letter-spacing: .04em;\n}\n.fin-field input,\n.fin-field select,\n.fin-field textarea{\n  border:1px solid rgba(0,0,0,.12);\n  border-radius: 12px;\n  padding: 10px 10px;\n  outline: none;\n  font-weight: 750;\n  font-size: 13px;\n  background:#fff;\n  color: var(--fin-text);\n}\n.fin-field textarea{ min-height: 90px; resize: vertical; }\n\n.fin-check{\n  display:flex;\n  align-items:center;\n  gap: 8px;\n  font-weight: 900;\n  font-size: 12px;\n}\n.fin-check input{ transform: translateY(1px); }\n\n.fin-strong{ font-weight: 950; }\n.fin-muted{ color: var(--fin-muted); }\n.fin-small{ font-size: 12px; }\n.fin-mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; }\n\n.fin-toggles{\n  display:flex;\n  align-items:center;\n  gap: 12px;\n  flex-wrap: wrap;\n  width: 100%;\n}\n\n/* \u201cGr\u00e1ficos\u201d (placeholders) */\n.fin-charts{\n  margin-top: 10px;\n  width: 100%;\n  display:grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 10px;\n}\n.fin-chart-box{\n  border: 1px dashed rgba(0,0,0,.18);\n  border-radius: 14px;\n  padding: 14px;\n  background: rgba(0,0,0,.02);\n  color: var(--fin-muted);\n  font-weight: 900;\n}\n\n/* Tabela */\n.fin-table-wrap{\n  overflow:auto;\n  border-radius: 14px;\n  border: 1px solid rgba(0,0,0,.10);\n}\n\n.fin-table{\n  width: 100%;\n  border-collapse: separate;\n  border-spacing: 0;\n  background:#fff;\n  min-width: 1100px;\n}\n.fin-table thead th{\n  position: sticky;\n  top: 0;\n  z-index: 2;\n  background: #fff;\n  border-bottom: 1px solid rgba(0,0,0,.10);\n  font-size: 10px;\n  font-weight: 950;\n  color: var(--fin-muted);\n  text-transform: uppercase;\n  letter-spacing: .04em;\n  padding: 7px 8px;\n}\n.fin-table tbody td{\n  border-bottom: 1px solid rgba(0,0,0,.06);\n  padding: 5px 8px;\n  vertical-align: top;\n  font-size: 12px;\n  font-weight: 750;\n}\n.fin-table tbody tr:hover td{ background: rgba(37,99,235,.04); }\n\n.fin-actions-row{\n  display:flex;\n  gap: 4px;\n  flex-wrap: nowrap;\n  align-items: center;\n}\n\n/* Mini bot\u00f5es na tabela */\n.fin-mini{\n  appearance:none;\n  border: 1px solid rgba(0,0,0,.12);\n  background: #fff;\n  color: var(--fin-text);\n  font-weight: 950;\n  font-size: 10px;\n  padding: 4px 6px;\n  border-radius: 8px;\n  cursor: pointer;\n  white-space: nowrap;\n}\n.fin-mini:hover{ background: rgba(0,0,0,.03); }\n.fin-mini--danger{\n  border-color: rgba(220,38,38,.35);\n  color: #b91c1c;\n}\n.fin-mini--ok{\n  border-color: rgba(22,163,74,.35);\n  color: #15803d;\n}\n\n/* Toast */\n.fin-toast-host{\n  position: fixed;\n  right: 14px;\n  bottom: 88px; /* acima do rodap\u00e9 fixo */\n  z-index: 100;\n  display:flex;\n  flex-direction: column;\n  gap: 10px;\n  pointer-events: none;\n}\n.fin-toast{\n  pointer-events: none;\n  opacity: 0;\n  transform: translateY(8px);\n  transition: opacity .18s ease, transform .18s ease;\n  padding: 10px 12px;\n  border-radius: 14px;\n  background: #111;\n  color:#fff;\n  font-weight: 900;\n  font-size: 13px;\n  box-shadow: 0 10px 30px rgba(0,0,0,.20);\n}\n.fin-toast--show{ opacity: 1; transform: translateY(0); }\n.fin-toast--ok{ background: #0f172a; }\n.fin-toast--err{ background: #7f1d1d; }\n\n/* ===============================\n   MODAL (base)\n================================ */\nbody.fin-modal-open { overflow: hidden; }\n.fin-modal-wrap{\n  position: fixed;\n  inset: 0;\n  z-index: 1000;\n}\n.fin-modal-backdrop{\n  position:absolute;\n  inset: 0;\n  background: rgba(0,0,0,.55);\n}\n\n/* Modal padr\u00e3o */\n.fin-modal{\n  position:absolute;\n  left: 50%;\n  top: 50%;\n  transform: translate(-50%, -50%);\n  width: min(920px, calc(100vw - 24px));\n  max-height: calc(100vh - 24px);\n  overflow: hidden;\n  border-radius: 18px;\n  background: #fff;\n  color: var(--fin-text);\n  box-shadow: 0 20px 60px rgba(0,0,0,.35);\n  border: 1px solid rgba(0,0,0,.15);\n}\n\n/* \u2705 FULLSCREEN para CART\u00c3O/LOTE DESPESAS/LOTE RECEITAS */\n.fin-modal--full{\n  left: 0;\n  top: 0;\n  transform: none;\n  width: 100vw;      /* \u2705 */\n  height: 100vh;     /* \u2705 */\n  max-height: none;\n  border-radius: 0;  /* \u2705 */\n}\n\n.fin-modal-head{\n  display:flex;\n  align-items:center;\n  justify-content: space-between;\n  gap: 10px;\n  padding: 12px 14px;\n  background: #fff;\n  border-bottom: 1px solid rgba(0,0,0,.10);\n}\n.fin-modal-title{\n  font-weight: 1000;\n  font-size: 14px;\n}\n.fin-x{\n  appearance:none;\n  border: 0;\n  background: rgba(0,0,0,.06);\n  width: 36px;\n  height: 36px;\n  border-radius: 12px;\n  cursor: pointer;\n  font-size: 20px;\n  line-height: 1;\n  font-weight: 900;\n}\n.fin-x:hover{ background: rgba(0,0,0,.10); }\n\n.fin-modal-body{\n  padding: 14px;\n  overflow: auto;\n  height: calc(100% - 61px); /* cabe\u00e7alho */\n}\n\n.fin-row{\n  display:flex;\n  align-items:center;\n  gap: 10px;\n}\n.fin-row--right{ justify-content: flex-end; }\n\n/* Batch (tabelas nos modais) */\n.fin-batch-table{\n  width: 100%;\n  border-collapse: separate;\n  border-spacing: 0;\n  background:#fff;\n  min-width: 1200px;\n  border: 1px solid rgba(0,0,0,.10);\n  border-radius: 14px;\n  overflow: hidden;\n}\n.fin-batch-table thead th{\n  background: rgba(0,0,0,.02);\n  border-bottom: 1px solid rgba(0,0,0,.10);\n  font-size: 11px;\n  font-weight: 950;\n  color: var(--fin-muted);\n  text-transform: uppercase;\n  letter-spacing: .04em;\n  padding: 10px;\n}\n.fin-batch-table tbody td{\n  border-bottom: 1px solid rgba(0,0,0,.06);\n  padding: 8px;\n  vertical-align: top;\n}\n.fin-batch-inp, .fin-batch-sel, .fin-batch-txt{\n  width: 100%;\n  border: 1px solid rgba(0,0,0,.12);\n  border-radius: 12px;\n  padding: 9px 10px;\n  outline: none;\n  font-weight: 750;\n  font-size: 13px;\n  background:#fff;\n  color: var(--fin-text);\n}\n.fin-batch-txt{ min-height: 44px; resize: vertical; }\n\n/* ===============================\n   RODAP\u00c9 FIXO (1 linha) \u2014 #2c2c2c\n   - Fotos \u00e0 esquerda\n   - Empresas lado a lado\n   - Credits em it\u00e1lico\n================================ */\n.fin-footerbar{\n  position: fixed;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  z-index: 60;\n  display:flex;\n  align-items:center;\n  gap: 8px;\n  padding: 6px 10px;\n  background: var(--fin-dark);\n  color: var(--fin-darkText);\n  border-top: 1px solid rgba(255,255,255,.10);\n  height: 37px;\n  overflow: hidden;\n}\n\n/* Fotos s\u00f3cios (\u00e0 esquerda) */\n.fin-footer-avatars{\n  order: 0;\n  display:flex;\n  align-items:center;\n  gap: 6px;\n  min-width: 120px;\n}\n\n.fin-avatar{\n  width: 22px;\n  height: 22px;\n  border-radius: 999px;\n  background: rgba(255,255,255,.14);\n  color:#fff;\n  display:flex;\n  align-items:center;\n  justify-content:center;\n  font-weight: 950;\n  font-size: 10px;\n  border: 1px solid rgba(255,255,255,.18);\n  overflow:hidden;\n}\n.fin-avatar img{\n  width:100%;\n  height:100%;\n  object-fit: cover;\n}\n\n/* Endere\u00e7o */\n.fin-footer-left{\n  order: 1;\n  display:flex;\n  flex-direction: column;\n  gap: 1px;\n  min-width: 220px;\n  white-space: nowrap;\n}\n.fin-footer-left .k{\n  font-weight: 950;\n  font-size: 9px;\n  opacity: .9;\n}\n.fin-footer-left .v{\n  font-weight: 800;\n  font-size: 10px;\n  opacity: .95;\n}\n\n/* Cr\u00e9ditos central \u2014 it\u00e1lico */\n.fin-footer-center{\n  order: 2;\n  margin-left: auto;\n  margin-right: auto;\n  text-align:center;\n  font-weight: 900;\n  font-size: 10px;\n  font-style: italic;\n  opacity: .95;\n  white-space: nowrap;\n}\n\n/* Empresas lado a lado (1 linha) */\n.fin-footer-right{\n  order: 3;\n  display:flex;\n  align-items:center;\n  gap: 6px;\n  flex-wrap: nowrap;\n  white-space: nowrap;\n}\n.fin-footer-box{\n  border: 1px solid rgba(255,255,255,.18);\n  background: rgba(255,255,255,.10);\n  border-radius: 9px;\n  padding: 4px 7px;\n}\n.fin-footer-box .t{\n  font-weight: 950;\n  font-size: 9px;\n  line-height: 1.05;\n}\n.fin-footer-box .s{\n  font-weight: 800;\n  font-size: 9px;\n  opacity: .9;\n  line-height: 1.05;\n}\n\n/* ===============================\n   Responsivo\n================================ */\n@media (max-width: 1200px){\n  .fin-body{ flex-direction: column; }\n  .fin-side{ width: 100%; }\n  .fin-table{ min-width: 980px; }\n  .fin-charts{ grid-template-columns: 1fr; }\n}\n\n@media (max-width: 820px){\n  .fin-search{ min-width: 170px; }\n  .fin-kpis{ grid-template-columns: 1fr; }\n  .fin-footerbar{ height: 46px; }\n  .fin-page{ padding-bottom: 54px; }\n  .fin-footer-left{ display:none; }\n}\n";
    var id = "fin-css-embedded";
    var old = document.getElementById(id);
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var style = document.createElement("style");
    style.id = id;
    style.type = "text/css";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  injectFinanceiroCSS();

  function injectFinanceiroLayoutOverrides() {
    var style = document.createElement("style");
    style.id = "fin-css-layout-overrides";
    style.type = "text/css";
    style.appendChild(document.createTextNode(
      ".fin-shell{max-width:none!important;margin:0!important;padding:14px 14px 14px 0!important;width:100%!important;}" +
      ".fin-body{width:100%!important;}" +
      ".fin-body>main{flex:1 1 auto!important;min-width:0!important;}" +
      ".fin-side{margin-left:0!important;width:250px!important;min-width:250px!important;}" +
      "@media(max-width:1200px){.fin-shell{padding:14px!important}.fin-side{width:100%!important;min-width:0!important}}"
    ));
    document.head.appendChild(style);
  }

  injectFinanceiroLayoutOverrides();

  // =========================
  // CONFIG (ajuste só aqui)
  // =========================
  var WORKER_BASE = "https://financeiro199702.cgdseguros.workers.dev";
  var API_BASE = WORKER_BASE.replace(/\/$/, "") + "/api";

  var CFG = {
    // Pipeline financeira
    DEAL_CATEGORY_ID: 27,

    // Pipeline 17 — aviso financeiro diário de contas a pagar
    REMINDER_CATEGORY_ID: 17,
    REMINDER_STAGE_ID: "C17:PREPARATION",
    REMINDER_ASSIGNED_ID: 813,
    REMINDER_TITLE: "CONTA A PAGAR - HOJE ⚠️",
    // Preencha estes campos se quiser gravar URGÊNCIA e TIPO DE TAREFA em UFs específicas do Bitrix
    REMINDER_UF_URGENCIA: "UF_CRM_1768174982",
    REMINDER_UF_URGENCIA_VALOR: "URGENTE",
    REMINDER_UF_TIPO_TAREFA: "UF_CRM_1768185018696",
    REMINDER_UF_TIPO_TAREFA_VALOR: "FINANCEIRO",

    // Logo e footer
    LOGO_URL: "https://bitrix24public.com/b24-6iyx5y.bitrix24.com.br/docs/pub/189eb7d8a5cc26250f61ee3c26e9f997/showFile?token=zad2h3hug81d",
    FOOTER: {
      addressTitle: "Endereço",
      addressText: "Av Ayrton Senna, 2500, SS109, Barra da Tijuca",
      credits: "System created by GRUPO CGD",
      companies: [
        { name: "CGD CORRETORA", meta: "CNPJ 01.654.471/0001-86 • SUSEP 202031791" },
        { name: "CGD BARRA", meta: "CNPJ 53.013.848/0001-11 • SUSEP 242158650" }
      ],
      partnersUserIds: [1, 27, 15]
    },

    // Cartões de crédito — vencimento e corte
    CARD_CONFIG: {
      "CT ITAÚ PJ": { vencimento: 2, corte: 20 },
      "CT XP PF": { vencimento: 15, corte: 6 },
      "CT ITAÚ PF": { vencimento: 21, corte: 15 },
      "CT C6 PF": { vencimento: 15, corte: 9 },
      "CT PORTO PF": { vencimento: 10, corte: 4 },
      "CT PORTO PJ": { vencimento: 30, corte: 25 },
      "CT CORA": { vencimento: 22, corte: 17 },
      "CT SAMSUNG": { vencimento: 10, corte: 3 }
    },

    // RESERVA não é centro operacional: é métrica de fechamento de competência.
    RESERVE_CENTER_ID: "__RESERVA__",
    RESERVE_CENTER_NAME: "RESERVA",

    PROFIT_PARTNERS: [
      { key: "DIOGO", name: "Diogo Cesar de Oliveira Barreto", share: 0.5, aliases: ["DIOGO", "DIOGO BARRETO", "DIOGO CESAR"] },
      { key: "CESAR", name: "Cesar Antonio Barreto", share: 0.5, aliases: ["CESAR", "CESAR BARRETO", "CESAR ANTONIO"] }
    ],

    // Campos Bitrix
    F: {
      TIPO_FIN: "UF_CRM_1771208061",
      COMPETENCIA: "UF_CRM_1771163661",
      VALOR_PREV: "UF_CRM_1770769991",
      VALOR_REAL: "UF_CRM_1770770017",
      DATA_REAL: "UF_CRM_1770771170",
      FAVORECIDO: "UF_CRM_1770775760",
      OBS: "UF_CRM_691385BE7D33D",
      CATEGORIA: "UF_CRM_1770770570",
      DATA_PREV: "UF_CRM_1770769767",
      STATUS_FIN: "UF_CRM_1770770088",
      CONTA: "UF_CRM_1770770758",          // ✅ cartões / contas
      CENTRO_CUSTO: "UF_CRM_1771801157"
    },

    // Stages pipeline 27
    STAGES: {
      DESP_A_PAGAR: "C27:NEW",
      DESP_PAGA: "C27:PREPARATION",
      REC_A_RECEBER: "C27:UC_EQAFD7",
      REC_RECEBIDA: "C27:PREPAYMENT_INVOIC",
      CANCELADO: "C27:EXECUTING",
      CONCLUIDO: "C27:UC_LP2NSK"
    },

    PAGE_SIZE: 300,

    // storage keys (apenas reserve + CC ledger/balances continuam locais)
    LS: {
      RESERVE: "FIN_RESERVE_BALANCE",
      CC_BALANCES: "FIN_CC_BALANCES_V1",
      CC_LEDGER: "FIN_CC_LEDGER_V1",
      AUDIT: "FIN_AUDIT_LOG_V1",
      FILTER_PRESETS: "FIN_FILTER_PRESETS_V1",
      LAST_FILTERS: "FIN_LAST_FILTERS_V1",
      CARD_LIMITS: "FIN_CARD_LIMITS_V1",
      CARD_STATEMENTS: "FIN_CARD_STATEMENTS_V1"
    },

    PERM: {
      canEdit: true,
      canDelete: true,
      canBulkDelete: true,
      canBulkEdit: true,
      canAdjustReserve: true,
      canAdjustCC: true,
      canTransferCC: true,
      canCard: true,
      canBatch: true,
      canCreateReminders: true,
      canEditCompleted: true
    },

    STORAGE: {
      mode: "worker", // "local" | "worker"
      namespace: "financeiro-cgd-v5",
      workerGetPath: "/panel-state",
      workerPutPath: "/panel-state",
      debounceMs: 700
    },

    // Painel SÓCIOS — regras gerenciais
    SOCIOS: {
      ALINE: {
        label: "Aline",
        nomeCompleto: "Aline",
        tiposNormais: ["PRO_LABORE", "BONIFICACAO"],
        tiposPermitidos: ["PRO_LABORE", "BONIFICACAO"],
        lucroPercentual: 0,
        aliases: ["ALINE"]
      },
      DIOGO: {
        label: "Diogo",
        nomeCompleto: "Diogo Cesar de Oliveira Barreto",
        tiposNormais: ["PRO_LABORE", "DISTRIBUICAO_LUCRO"],
        tiposPermitidos: ["PRO_LABORE", "DISTRIBUICAO_LUCRO", "BONIFICACAO"],
        lucroPercentual: 50,
        aliases: ["DIOGO", "DIOGO CESAR", "DIOGO BARRETO", "DIOGO CESAR DE OLIVEIRA BARRETO"]
      },
      CESAR: {
        label: "Cesar",
        nomeCompleto: "Cesar Antonio Barreto",
        tiposNormais: ["PRO_LABORE", "DISTRIBUICAO_LUCRO"],
        tiposPermitidos: ["PRO_LABORE", "DISTRIBUICAO_LUCRO", "BONIFICACAO"],
        lucroPercentual: 50,
        aliases: ["CESAR", "CÉSAR", "CESAR ANTONIO", "CÉSAR ANTONIO", "CESAR BARRETO", "CESAR ANTONIO BARRETO"]
      }
    }
  };

  // =========================
  // Root
  // =========================
  var root = document.getElementById("fin-root") || document.body;

  // =========================
  // Utils
  // =========================
  function esc(s) {
    s = String(s == null ? "" : s);
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function parseJson(t) { try { return JSON.parse(t); } catch (_) { return null; } }
  function el(q) { return root.querySelector(q); }

  function nowBR() {
    var dt = new Date();
    var dd = String(dt.getDate()); if (dd.length < 2) dd = "0" + dd;
    var mo = String(dt.getMonth() + 1); if (mo.length < 2) mo = "0" + mo;
    var yy = dt.getFullYear();
    var hh = String(dt.getHours()); if (hh.length < 2) hh = "0" + hh;
    var mm = String(dt.getMinutes()); if (mm.length < 2) mm = "0" + mm;
    return dd + "/" + mo + "/" + yy + " " + hh + ":" + mm;
  }

  function toISODate(d) {
    var s = String(d == null ? "" : d).trim();
    if (!s) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    var m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return m[3] + "-" + m[2] + "-" + m[1];
    var m2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m2) {
      var dd = String(m2[1]).padStart(2, "0");
      var mm = String(m2[2]).padStart(2, "0");
      return m2[3] + "-" + mm + "-" + dd;
    }
    return s;
  }

  function toDisplayDate(d) {
    var iso = toISODate(d);
    if (!iso) return "";
    var m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return iso;
    return m[3] + "/" + m[2] + "/" + m[1];
  }

  function displayLabel(v) {
    var t = String(v == null ? "" : v);
    t = t.replace(/\bDIOGO\s+PF\b/gi, "PESSOA FÍSICA");
    t = t.replace(/\bCT\s+C6\s+PJ\b/gi, "CT C6 PF");
    t = t.replace(/\bCT\s+CORA\s+CGD\s+BARRA\b/gi, "CT CORA");
    return t;
  }

  function normalizeCardName(v) {
    return displayLabel(v).toUpperCase().replace(/\s+/g, " ").trim();
  }

  function cardConfigByName(name) {
    var n = normalizeCardName(name);
    var cfg = CFG.CARD_CONFIG || {};
    for (var k in cfg) {
      if (cfg.hasOwnProperty(k) && normalizeCardName(k) === n) return cfg[k];
    }
    return null;
  }

  function isConfiguredCardName(name) {
    return !!cardConfigByName(name);
  }

  function cardOptionsFromContaEnums(includeBlank, blankText) {
    var list = S.enums[CFG.F.CONTA] || [];
    var out = [];
    if (includeBlank !== false) out.push('<option value="">' + esc(blankText || "— Selecione o cartão —") + '</option>');
    for (var i = 0; i < list.length; i++) {
      var label = displayLabel(list[i].VALUE);
      if (!isConfiguredCardName(label)) continue;
      out.push('<option value="' + esc(list[i].ID) + '">' + esc(label) + '</option>');
    }
    return out.join("");
  }

  function dateFromYMD(y, m, d) {
    var last = new Date(y, m, 0).getDate();
    d = Math.max(1, Math.min(last, Number(d) || 1));
    var dt = new Date(y, m - 1, d);
    return toISODate(String(dt.getDate()).padStart(2, "0") + "/" + String(dt.getMonth() + 1).padStart(2, "0") + "/" + dt.getFullYear());
  }

  function calcCardDueDateISO(purchaseISO, cardName) {
    purchaseISO = toISODate(purchaseISO);
    var cfg = cardConfigByName(cardName);
    if (!purchaseISO || !cfg) return purchaseISO;
    var m = String(purchaseISO).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return purchaseISO;
    var y = Number(m[1]), mo = Number(m[2]), day = Number(m[3]);
    var corte = Number(cfg.corte || 1);
    var venc = Number(cfg.vencimento || 1);
    var closeMonth = mo;
    var closeYear = y;
    if (day > corte) {
      closeMonth++;
      if (closeMonth > 12) { closeMonth = 1; closeYear++; }
    }
    var dueMonth = closeMonth;
    var dueYear = closeYear;
    if (venc <= corte) {
      dueMonth++;
      if (dueMonth > 12) { dueMonth = 1; dueYear++; }
    }
    return dateFromYMD(dueYear, dueMonth, venc);
  }

  function calcCardCloseDateISO(purchaseISO, cardName) {
    purchaseISO = toISODate(purchaseISO);
    var cfg = cardConfigByName(cardName);
    if (!purchaseISO || !cfg) return purchaseISO;
    var m = String(purchaseISO).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return purchaseISO;
    var y = Number(m[1]), mo = Number(m[2]), day = Number(m[3]);
    var corte = Number(cfg.corte || 1);
    if (day > corte) { mo++; if (mo > 12) { mo = 1; y++; } }
    return dateFromYMD(y, mo, corte);
  }

  function isDateMaskTarget(node) {
    if (!node || !node.tagName) return false;
    if (String(node.tagName).toUpperCase() !== "INPUT") return false;
    var ph = String(node.getAttribute("placeholder") || "");
    var dd = String(node.getAttribute("data-date") || "");
    return dd === "1" || ph.indexOf("DD/MM/AAAA") > -1;
  }

  function maskDateInput(node) {
    if (!node) return;
    var raw = String(node.value || "").replace(/\D/g, "").slice(0, 8);
    var out = raw;
    if (raw.length > 4) out = raw.slice(0, 2) + "/" + raw.slice(2, 4) + "/" + raw.slice(4);
    else if (raw.length > 2) out = raw.slice(0, 2) + "/" + raw.slice(2);
    node.value = out;
  }

  document.addEventListener("input", function (ev) {
    if (isDateMaskTarget(ev.target)) maskDateInput(ev.target);
  }, true);

  function maskDateBRValue(v) {
    var digits = String(v || "").replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
  }

  function bindDateMasks(scope) {
    scope = scope || document;
    var nodes = scope.querySelectorAll ? scope.querySelectorAll('[data-date="1"]') : [];
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].__finDateMask) continue;
      nodes[i].__finDateMask = true;
      nodes[i].addEventListener('input', function(e){ e.target.value = maskDateBRValue(e.target.value); });
    }
  }

  function parseMoneyBR(s) {
    var t = String(s == null ? "" : s).trim();
    if (!t) return 0;
    t = t.replace(/[^\d,.-]/g, "");
    t = t.replace(/\./g, "");
    t = t.replace(",", ".");
    var n = Number(t);
    return isFinite(n) ? n : 0;
  }

  function moneyBR(v) {
    var n = Number(v);
    if (!isFinite(n)) return "R$ 0,00";
    var fixed = n.toFixed(2);
    var parts = fixed.split(".");
    var a = parts[0];
    var b = parts[1] || "00";
    a = a.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return "R$ " + a + "," + b;
  }

  function addDaysISO(iso, days) {
    var m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return iso;
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    d.setDate(d.getDate() + days);
    var y = d.getFullYear();
    var mo = String(d.getMonth() + 1); if (mo.length < 2) mo = "0" + mo;
    var da = String(d.getDate()); if (da.length < 2) da = "0" + da;
    return y + "-" + mo + "-" + da;
  }

  function addMonthsISO(iso, months, forceDay) {
    var m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return iso;
    var y = Number(m[1]), mo = Number(m[2]) - 1, da = Number(m[3]);
    var d = new Date(y, mo, da);
    d.setMonth(d.getMonth() + months);

    if (forceDay != null) {
      var fd = Math.max(1, Math.min(31, Number(forceDay) || 1));
      var tryD = new Date(d.getFullYear(), d.getMonth(), fd);
      if (tryD.getMonth() === d.getMonth()) d = tryD;
      else d = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }

    var yy = d.getFullYear();
    var mm = String(d.getMonth() + 1); if (mm.length < 2) mm = "0" + mm;
    var dd = String(d.getDate()); if (dd.length < 2) dd = "0" + dd;
    return yy + "-" + mm + "-" + dd;
  }

  function addYearsISO(iso, years, forceMonth, forceDay) {
    var m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return iso;
    var y = Number(m[1]) + years;
    var mo = (forceMonth != null) ? (Math.max(1, Math.min(12, Number(forceMonth) || 1)) - 1) : (Number(m[2]) - 1);
    var da = (forceDay != null) ? Math.max(1, Math.min(31, Number(forceDay) || 1)) : Number(m[3]);

    var d = new Date(y, mo, da);
    if (d.getMonth() !== mo) d = new Date(y, mo + 1, 0);
    var yy = d.getFullYear();
    var mm = String(d.getMonth() + 1); if (mm.length < 2) mm = "0" + mm;
    var dd = String(d.getDate()); if (dd.length < 2) dd = "0" + dd;
    return yy + "-" + mm + "-" + dd;
  }

  function safeClosest(node, sel) {
    try { return node && node.closest ? node.closest(sel) : null; } catch (_) { return null; }
  }

  // =========================
  // Toast / Modal
  // =========================
  function toast(msg, type) {
    type = type || "ok";
    var host = el("#fin-toast-host");
    if (!host) { alert(msg); return; }
    var t = document.createElement("div");
    t.className = "fin-toast fin-toast--" + type;
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(function () { t.classList.add("fin-toast--show"); }, 10);
    setTimeout(function () {
      t.classList.remove("fin-toast--show");
      setTimeout(function () { if (t && t.parentNode) t.parentNode.removeChild(t); }, 200);
    }, 3800);
  }

  function modal(html, opts) {
    opts = opts || {};
    var wrap = document.createElement("div");
    wrap.className = "fin-modal-wrap";
    wrap.innerHTML =
      '<div class="fin-modal-backdrop" data-close="1"></div>' +
      '<div class="fin-modal ' + (opts.full ? "fin-modal--full" : "") + '">' + html + "</div>";
    document.body.appendChild(wrap);
    document.body.classList.add("fin-modal-open");

    function onWrapRemoved() {
      if (!document.querySelector(".fin-modal-wrap")) {
        document.body.classList.remove("fin-modal-open");
      }
    }

    wrap.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.getAttribute && t.getAttribute("data-close") === "1") {
        if (wrap && wrap.parentNode) { wrap.parentNode.removeChild(wrap); onWrapRemoved(); }
      }
    });

    function onKey(ev) {
      if (ev.key === "Escape") {
        try { if (wrap && wrap.parentNode) { wrap.parentNode.removeChild(wrap); onWrapRemoved(); } } catch (_) {}
        document.removeEventListener("keydown", onKey);
      }
    }
    document.addEventListener("keydown", onKey);

    return {
      node: wrap,
      close: function () {
        document.removeEventListener("keydown", onKey);
        if (wrap && wrap.parentNode) { wrap.parentNode.removeChild(wrap); onWrapRemoved(); }
      },
      q: function (s) { return wrap.querySelector(s); }
    };
  }

  // =========================
  // Loading / render helpers
  // =========================
  function setLoading(v) {
    S.loading = !!v;
    var badge = el("#fin-loading");
    if (badge) badge.style.display = S.loading ? "inline-flex" : "none";
  }

  function setButtonBusy(btn, busy, textBusy) {
    if (!btn) return;
    if (!btn.__origText) btn.__origText = btn.textContent;
    btn.disabled = !!busy;
    btn.classList.toggle("is-busy", !!busy);
    btn.textContent = busy ? (textBusy || "Salvando...") : btn.__origText;
  }

  function setModalBusy(modalNode, busy, textBusy) {
    if (!modalNode) return;
    var btns = modalNode.querySelectorAll("[data-busylock='1']");
    for (var i = 0; i < btns.length; i++) setButtonBusy(btns[i], busy, textBusy);
  }

  function bindEvt(selector, eventName, handler) {
    var node = el(selector);
    if (!node || !node.addEventListener) return null;
    node.addEventListener(eventName, handler);
    return node;
  }

  function syncTopbarFilters() {
    var q = el("#f-q");
    var comp = el("#f-comp");
    var conta = el("#f-conta");
    var tExp = el("#tog-exp");
    var tRec = el("#tog-rec");
    if (q) q.value = S.filters.q || "";
    if (comp) comp.value = S.filters.competencia || "";
    if (conta) conta.value = S.filters.conta || "";
    if (tExp) tExp.checked = !!S.filters.showPayables;
    if (tRec) tRec.checked = !!S.filters.showReceivables;
  }

  function renderAfterFilter() {
    renderTable();
    renderTotals();
    renderChartsPlaceholders();
    renderSidebarCenters();
    renderPager();
    syncTopbarFilters();
  }

  function findDealIndexById(id) {
    for (var i = 0; i < S.deals.length; i++) if (String(S.deals[i].ID) === String(id)) return i;
    return -1;
  }

  function mergeDealPatch(id, fields) {
    var idx = findDealIndexById(id);
    if (idx < 0) return;
    var copy = {};
    var base = S.deals[idx] || {};
    for (var k in base) if (base.hasOwnProperty(k)) copy[k] = base[k];
    for (var f in fields) if (fields.hasOwnProperty(f)) copy[f] = fields[f];
    S.deals[idx] = copy;
    scheduleFinanceReminderSync();
  }

  function removeDealLocal(id) {
    var idx = findDealIndexById(id);
    if (idx >= 0) { S.deals.splice(idx, 1); scheduleFinanceReminderSync(); }
  }

  function addDealLocal(fields, createdId) {
    var row = { ID: String(createdId || ""), CATEGORY_ID: String(CFG.DEAL_CATEGORY_ID) };
    for (var k in fields) if (fields.hasOwnProperty(k)) row[k] = fields[k];
    S.deals.unshift(row);
    scheduleFinanceReminderSync();
  }

  // =========================
  // API (Bitrix via Worker)
  // =========================
  function apiCall(method, payload) {
    var body = JSON.stringify(payload || {});
    var headers = { "content-type": "application/json" };

    function req(url) {
      return fetch(url, { method: "POST", headers: headers, body: body })
        .then(function (r) {
          return r.text().then(function (txt) {
            var j = parseJson(txt);
            if (!r.ok) throw new Error((j && (j.error_description || j.error)) || txt || ("HTTP " + r.status));
            if (j && j.error) throw new Error(j.error_description || j.error);
            return { json: j || {}, mode: (url.indexOf("?method=") > -1 ? "query" : "path") };
          });
        });
    }

    return req(API_BASE + "/" + method)
      .catch(function () { return req(API_BASE + "?method=" + encodeURIComponent(method)); })
      .then(function (res) { S.apiMode = res.mode; return res.json; });
  }

  function updateDeal(id, fields) { return apiCall("crm.deal.update", { id: String(id), fields: fields || {} }); }
  function createDeal(fields) { return apiCall("crm.deal.add", { fields: fields || {} }).then(function (r) { return r && r.result ? r.result : null; }); }
  function deleteDeal(id) { return apiCall("crm.deal.delete", { id: String(id) }); }

  // =========================
  // State
  // =========================
  var S = {
    enums: {},
    stages: [],
    deals: [],
    filtered: [],
    partners: [],
    lastSyncAt: null,
    loading: false,
    apiMode: null,
    refreshToken: 0,
    searchTimer: null,
    reminderSyncTimer: null,
    selectedIds: {},
    audit: [],
    filterPresets: [],
    cardLimits: {},
    cardStatements: [],
    closings: {},
    recurringIndex: {},
    socios: { manualAdjustments: [] },
    pagination: { page: 1, pageSize: 50 },
    storage: { configuredMode: (CFG.STORAGE && CFG.STORAGE.mode) || "local", resolvedMode: "local", workerAvailable: false, lastPersistAt: "", persistTimer: null },

    filters: {
      q: "",
      centro: "",
      competencia: "",
      conta: "",
      stageId: "",
      showPayables: true,
      showReceivables: true
    },

    reserve: { balance: 0 },

    cc: {
      balances: {},
      ledger: []
    }
  };

  // =========================
  // Persistência local / backend-ready
  // =========================
  function safeLocalGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }
  function safeLocalSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function loadReserveLocal() {
    try {
      var raw = safeLocalGet(CFG.LS.RESERVE);
      S.reserve.balance = raw ? Number(raw) : 0;
      if (!isFinite(S.reserve.balance)) S.reserve.balance = 0;
    } catch (_) { S.reserve.balance = 0; }
  }
  function saveReserveLocal() {
    safeLocalSet(CFG.LS.RESERVE, String(S.reserve.balance || 0));
  }

  function loadCCLocal() {
    try {
      var b = parseJson(safeLocalGet(CFG.LS.CC_BALANCES) || "{}") || {};
      var l = parseJson(safeLocalGet(CFG.LS.CC_LEDGER) || "[]") || [];
      S.cc.balances = b && typeof b === "object" ? b : {};
      S.cc.ledger = Array.isArray(l) ? l : [];
    } catch (_) {
      S.cc.balances = {};
      S.cc.ledger = [];
    }
  }
  function saveCCLocal() {
    safeLocalSet(CFG.LS.CC_BALANCES, JSON.stringify(S.cc.balances || {}));
    safeLocalSet(CFG.LS.CC_LEDGER, JSON.stringify(S.cc.ledger || []));
  }

  function loadAuditLocal() {
    try {
      var a = parseJson(safeLocalGet(CFG.LS.AUDIT) || "[]");
      S.audit = Array.isArray(a) ? a : [];
    } catch (_) { S.audit = []; }
  }
  function saveAuditLocal() {
    safeLocalSet(CFG.LS.AUDIT, JSON.stringify((S.audit || []).slice(0, 300)));
  }

  function loadFilterPresetsLocal() {
    try {
      var arr = parseJson(safeLocalGet(CFG.LS.FILTER_PRESETS) || '[]');
      S.filterPresets = Array.isArray(arr) ? arr : [];
    } catch (_) { S.filterPresets = []; }
  }
  function saveFilterPresetsLocal() {
    safeLocalSet(CFG.LS.FILTER_PRESETS, JSON.stringify((S.filterPresets || []).slice(0, 50)));
  }
  function loadLastFiltersLocal() {
    try {
      var raw = parseJson(safeLocalGet(CFG.LS.LAST_FILTERS) || '{}') || {};
      if (raw && typeof raw === 'object') {
        S.filters.q = String(raw.q || '');
        S.filters.centro = String(raw.centro || '');
        S.filters.competencia = String(raw.competencia || '');
        S.filters.conta = String(raw.conta || '');
        S.filters.stageId = String(raw.stageId || '');
        S.filters.showPayables = raw.showPayables !== false;
        S.filters.showReceivables = raw.showReceivables !== false;
      }
    } catch (_) {}
  }
  function saveLastFiltersLocal() {
    safeLocalSet(CFG.LS.LAST_FILTERS, JSON.stringify(S.filters || {}));
  }

  function loadCardLimitsLocal() {
    try {
      var o = parseJson(safeLocalGet(CFG.LS.CARD_LIMITS) || "{}");
      S.cardLimits = o && typeof o === "object" ? o : {};
    } catch (_) { S.cardLimits = {}; }
  }

  function saveCardLimitsLocal() {
    safeLocalSet(CFG.LS.CARD_LIMITS, JSON.stringify(S.cardLimits || {}));
  }

  function loadCardStatementsLocal() {
    try {
      var o = parseJson(safeLocalGet(CFG.LS.CARD_STATEMENTS) || "[]");
      S.cardStatements = Array.isArray(o) ? o : [];
    } catch (_) { S.cardStatements = []; }
  }

  function saveCardStatementsLocal() {
    safeLocalSet(CFG.LS.CARD_STATEMENTS, JSON.stringify((S.cardStatements || []).slice(0, 300)));
  }

  function captureInstitutionalBundle() {
    return {
      reserve: { balance: Number(S.reserve.balance || 0) || 0 },
      cc: { balances: S.cc.balances || {}, ledger: S.cc.ledger || [] },
      audit: (S.audit || []).slice(0, 300),
      filterPresets: (S.filterPresets || []).slice(0, 50),
      lastFilters: S.filters || {},
      cardLimits: S.cardLimits || {},
      cardStatements: (S.cardStatements || []).slice(0, 300),
      closings: S.closings || {},
      recurringIndex: S.recurringIndex || {},
      socios: {
        config: CFG.SOCIOS || {},
        manualAdjustments: (S.socios && Array.isArray(S.socios.manualAdjustments)) ? S.socios.manualAdjustments.slice(0, 500) : []
      },
      meta: { savedAt: new Date().toISOString(), version: 'v10-socios-cloud' }
    };
  }

  function applyInstitutionalBundle(bundle) {
    if (!bundle || typeof bundle !== 'object') return;
    if (bundle.reserve && typeof bundle.reserve === 'object') {
      S.reserve.balance = Number(bundle.reserve.balance || 0) || 0;
    }
    if (bundle.cc && typeof bundle.cc === 'object') {
      S.cc.balances = bundle.cc.balances && typeof bundle.cc.balances === 'object' ? bundle.cc.balances : {};
      S.cc.ledger = Array.isArray(bundle.cc.ledger) ? bundle.cc.ledger : [];
    }
    if (Array.isArray(bundle.audit)) S.audit = bundle.audit;
    if (Array.isArray(bundle.filterPresets)) S.filterPresets = bundle.filterPresets;
    if (bundle.lastFilters && typeof bundle.lastFilters === 'object') {
      S.filters.q = String(bundle.lastFilters.q || '');
      S.filters.centro = ''; // ao abrir, sempre inicia em VISÃO GLOBAL
      S.filters.competencia = String(bundle.lastFilters.competencia || '');
      S.filters.conta = String(bundle.lastFilters.conta || '');
      S.filters.stageId = String(bundle.lastFilters.stageId || '');
      S.filters.showPayables = bundle.lastFilters.showPayables !== false;
      S.filters.showReceivables = bundle.lastFilters.showReceivables !== false;
    }
    if (bundle.cardLimits && typeof bundle.cardLimits === 'object') S.cardLimits = bundle.cardLimits;
    if (Array.isArray(bundle.cardStatements)) S.cardStatements = bundle.cardStatements;
    if (bundle.closings && typeof bundle.closings === 'object') S.closings = bundle.closings;
    if (bundle.recurringIndex && typeof bundle.recurringIndex === 'object') S.recurringIndex = bundle.recurringIndex;
    if (bundle.socios && typeof bundle.socios === 'object') {
      S.socios = S.socios || {};
      S.socios.manualAdjustments = Array.isArray(bundle.socios.manualAdjustments) ? bundle.socios.manualAdjustments : [];
    }
  }

  function loadLocalInstitutionalState() {
    loadReserveLocal();
    loadCCLocal();
    loadAuditLocal();
    loadFilterPresetsLocal();
    loadLastFiltersLocal();
    S.filters.centro = ''; // ao abrir, sempre inicia em VISÃO GLOBAL
    loadCardLimitsLocal();
    loadCardStatementsLocal();
    S.storage.resolvedMode = 'local';
    S.storage.workerAvailable = false;
    updateStorageBadge();
    return Promise.resolve();
  }

  function workerStateUrl() {
    var ns = encodeURIComponent((CFG.STORAGE && CFG.STORAGE.namespace) || 'financeiro-cgd-v5');
    return API_BASE + ((CFG.STORAGE && CFG.STORAGE.workerGetPath) || '/panel-state') + '?ns=' + ns;
  }

  function fetchWorkerBundle() {
    return fetch(workerStateUrl(), { credentials: 'omit' })
      .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(data){
        if (data && data.state) return data.state;
        if (data && data.bundle) return data.bundle;
        return data;
      });
  }

  function pushWorkerBundle(bundle) {
    return fetch(API_BASE + (((CFG.STORAGE && CFG.STORAGE.workerPutPath) || '/panel-state')), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ns: ((CFG.STORAGE && CFG.STORAGE.namespace) || 'financeiro-cgd-v5'), state: bundle })
    }).then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json().catch(function(){ return {}; }); });
  }

  function loadInstitutionalState() {
    if (!CFG.STORAGE || CFG.STORAGE.mode !== 'worker') return loadLocalInstitutionalState();
    return fetchWorkerBundle()
      .then(function(bundle){
        applyInstitutionalBundle(bundle || {});
        S.storage.resolvedMode = 'worker';
        S.storage.workerAvailable = true;
        updateStorageBadge();
      })
      .catch(function(){
        return loadLocalInstitutionalState().then(function(){
          S.storage.resolvedMode = 'local-fallback';
          S.storage.workerAvailable = false;
          updateStorageBadge();
        });
      });
  }

  function persistInstitutionalNow(reason) {
    saveReserveLocal();
    saveCCLocal();
    saveAuditLocal();
    saveFilterPresetsLocal();
    saveLastFiltersLocal();
    saveCardLimitsLocal();
    saveCardStatementsLocal();
    S.storage.lastPersistAt = nowBR();
    updateStorageBadge();
    if (!CFG.STORAGE || CFG.STORAGE.mode !== 'worker') return Promise.resolve(reason || 'local');
    return pushWorkerBundle(captureInstitutionalBundle())
      .then(function(){
        S.storage.resolvedMode = 'worker';
        S.storage.workerAvailable = true;
        S.storage.lastPersistAt = nowBR();
        updateStorageBadge();
      })
      .catch(function(){
        S.storage.resolvedMode = 'local-fallback';
        S.storage.workerAvailable = false;
        updateStorageBadge();
      });
  }

  function scheduleInstitutionalPersist(reason) {
    if (S.storage.persistTimer) clearTimeout(S.storage.persistTimer);
    S.storage.persistTimer = setTimeout(function(){
      S.storage.persistTimer = null;
      persistInstitutionalNow(reason || 'auto');
    }, ((CFG.STORAGE && CFG.STORAGE.debounceMs) || 700));
  }

  function updateStorageBadge() {
    var n = el('#fin-storage-mode');
    if (!n) return;
    var mode = S.storage && S.storage.resolvedMode ? S.storage.resolvedMode : 'local';
    var txt = mode === 'worker' ? 'WORKER' : (mode === 'local-fallback' ? 'LOCAL (fallback)' : 'LOCAL');
    var tail = S.storage && S.storage.lastPersistAt ? ' • ' + S.storage.lastPersistAt : '';
    n.textContent = txt + tail;
  }

  function loadReserve() { return loadReserveLocal(); }
  function saveReserve() { saveReserveLocal(); scheduleInstitutionalPersist('reserve'); }
  function loadCC() { return loadCCLocal(); }
  function saveCC() { saveCCLocal(); scheduleInstitutionalPersist('cc'); }
  function loadAudit() { return loadAuditLocal(); }
  function saveAudit() { saveAuditLocal(); scheduleInstitutionalPersist('audit'); }
  function loadFilterPresets() { return loadFilterPresetsLocal(); }
  function saveFilterPresets() { saveFilterPresetsLocal(); scheduleInstitutionalPersist('filterPresets'); }
  function loadLastFilters() { return loadLastFiltersLocal(); }
  function saveLastFilters() { saveLastFiltersLocal(); scheduleInstitutionalPersist('lastFilters'); }

  function hasPerm(key) {
    return !!(CFG.PERM && CFG.PERM[key]);
  }
  function guardPerm(key, label) {
    if (hasPerm(key)) return true;
    toast('Ação bloqueada nas permissões locais: ' + (label || key) + '.', 'err');
    return false;
  }

  function logAudit(action, detail) {
    var entry = {
      at: new Date().toISOString(),
      action: String(action || ""),
      detail: String(detail || "")
    };
    S.audit.unshift(entry);
    if (S.audit.length > 300) S.audit.length = 300;
    saveAudit();
  }

  // =========================
  // Enums / helpers
  // =========================
  function buildOptions(items, includeBlank, blankText) {
    if (includeBlank !== false) includeBlank = true;
    blankText = blankText || "— Todos —";
    var arr = Array.isArray(items) ? items : [];
    var out = [];
    if (includeBlank) out.push('<option value="">' + esc(blankText) + "</option>");
    for (var i = 0; i < arr.length; i++) out.push('<option value="' + esc(arr[i].ID) + '">' + esc(displayLabel(arr[i].VALUE)) + "</option>");
    return out.join("");
  }

  function enumName(fieldId, enumId) {
    if (!enumId) return "";
    var list = (S.enums && S.enums[fieldId]) ? S.enums[fieldId] : [];
    for (var i = 0; i < list.length; i++) if (String(list[i].ID) === String(enumId)) return displayLabel(list[i].VALUE);
    return displayLabel(enumId);
  }


  function normText(s) {
    return String(s == null ? "" : s)
      .normalize ? String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : String(s == null ? "" : s).toUpperCase();
  }

  function isProfitDistributionDeal(d) {
    var cat = enumName(CFG.F.CATEGORIA, d && d[CFG.F.CATEGORIA]);
    return normText(cat).indexOf("DISTRIBUICAO DE LUCRO") > -1;
  }

  function isTransferRow(d) {
    return !!(d && d.__FIN_TRANSFER);
  }

  function centerNameById(id) {
    id = String(id || "");
    if (id === CFG.RESERVE_CENTER_ID) return CFG.RESERVE_CENTER_NAME;
    return enumName(CFG.F.CENTRO_CUSTO, id) || id;
  }

  function centersWithReserve() {
    // A RESERVA não é mais centro operacional.
    // Ela deve aparecer apenas como métrica/fechamento na VISÃO GLOBAL,
    // evitando duplicidade quando também existir uma opção RESERVA no Bitrix.
    var raw = (S.enums && S.enums[CFG.F.CENTRO_CUSTO]) ? S.enums[CFG.F.CENTRO_CUSTO].slice() : [];
    var out = [];
    var seen = {};
    for (var i = 0; i < raw.length; i++) {
      var it = raw[i] || {};
      var id = String(it.ID || "");
      var label = displayLabel(it.VALUE || "");
      if (!id) continue;
      if (id === CFG.RESERVE_CENTER_ID) continue;
      if (normText(label) === "RESERVA") continue;
      if (seen[id]) continue;
      seen[id] = true;
      out.push(it);
    }
    return out;
  }

  function buildTransferRows() {
    var out = [];
    var sel = String(S.filters.centro || "");
    var q = String(S.filters.q || "").trim().toLowerCase();
    var list = S.cc.ledger || [];
    for (var i = 0; i < list.length; i++) {
      var t = list[i] || {};
      var from = String(t.from || "");
      var to = String(t.to || "");
      var amount = Number(t.amount || 0) || 0;
      if (!(amount > 0)) continue;
      var ts = Number(t.ts || 0) || Date.now();
      var iso = new Date(ts).toISOString().slice(0, 10);
      var baseHay = ["transferencia", "transferência", centerNameById(from), centerNameById(to), t.note || ""].join(" ").toLowerCase();
      if (q && baseHay.indexOf(q) === -1) continue;
      function mk(kind, centro, signLabel) {
        return {
          __FIN_TRANSFER: true,
          ID: "TR-" + ts + "-" + kind + "-" + i,
          TITLE: "Transferência de saldo",
          STAGE_ID: "TRANSFERENCIA",
          CATEGORY_ID: String(CFG.DEAL_CATEGORY_ID),
          __TRANSFER_KIND: kind,
          __TRANSFER_FROM: from,
          __TRANSFER_TO: to,
          __TRANSFER_NOTE: String(t.note || ""),
          __TRANSFER_SIGN_LABEL: signLabel,
          __TRANSFER_AMOUNT: amount,
          __TRANSFER_TS: ts,
          UF_CRM_1770775760: "Transferência de saldo",
          UF_CRM_1771801157: centro,
          UF_CRM_1770771170: iso,
          UF_CRM_1770769767: iso,
          UF_CRM_1770770017: amount,
          UF_CRM_1770769991: amount
        };
      }
      if (sel) {
        if (sel === from) out.push(mk("SAIDA", from, "Saída para " + centerNameById(to)));
        if (sel === to) out.push(mk("ENTRADA", to, "Entrada de " + centerNameById(from)));
      } else {
        out.push(mk("SAIDA", from, "Saída para " + centerNameById(to)));
        out.push(mk("ENTRADA", to, "Entrada de " + centerNameById(from)));
      }
    }
    return out;
  }

  function stageName(stageId) {
    for (var i = 0; i < S.stages.length; i++) if (String(S.stages[i].STATUS_ID) === String(stageId)) return S.stages[i].NAME;
    return String(stageId || "");
  }

  function isBadFav(fav) {
    var s = String(fav || "").trim().toUpperCase();
    if (!s) return false;
    if (s.indexOf("__QUEUE__") === 0) return true;
    if (s.indexOf("FILA ATENDIMENTO") > -1) return true;
    if (s.indexOf("QUEUE") === 0) return true;
    return false;
  }

  function tipoEnumForKind(kind) {
    var items = S.enums[CFG.F.TIPO_FIN] || [];
    for (var i = 0; i < items.length; i++) {
      var t = String(items[i].VALUE || "").toUpperCase();
      if (kind === "DESPESA" && t.indexOf("DESP") > -1) return String(items[i].ID);
      if (kind === "RECEITA" && t.indexOf("REC") > -1) return String(items[i].ID);
    }
    return "";
  }

  function stageForKind(kind) {
    return (kind === "RECEITA") ? CFG.STAGES.REC_A_RECEBER : CFG.STAGES.DESP_A_PAGAR;
  }

  function nextStageByCurrent(stageId) {
    stageId = String(stageId || "");
    if (stageId === CFG.STAGES.DESP_A_PAGAR) return CFG.STAGES.DESP_PAGA;
    if (stageId === CFG.STAGES.REC_A_RECEBER) return CFG.STAGES.REC_RECEBIDA;
    return "";
  }

  function guessCompetenciaIdFromISO(iso) {
    iso = toISODate(iso);
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return "";
    var yy = m[1], mm = m[2];

    var list = S.enums[CFG.F.COMPETENCIA] || [];
    var candidates = [];
    for (var i = 0; i < list.length; i++) {
      var v = String(list[i].VALUE || "").toLowerCase();
      if (v.indexOf(yy) > -1) candidates.push(list[i]);
    }
    var map = {
      "01": ["jan", "janeiro", "01"],
      "02": ["fev", "fevereiro", "02"],
      "03": ["mar", "março", "03"],
      "04": ["abr", "abril", "04"],
      "05": ["mai", "maio", "05"],
      "06": ["jun", "junho", "06"],
      "07": ["jul", "julho", "07"],
      "08": ["ago", "agosto", "08"],
      "09": ["set", "setembro", "09"],
      "10": ["out", "outubro", "10"],
      "11": ["nov", "novembro", "11"],
      "12": ["dez", "dezembro", "12"]
    };
    var keys = map[mm] || [mm];

    for (var j = 0; j < candidates.length; j++) {
      var t = String(candidates[j].VALUE || "").toLowerCase();
      for (var k = 0; k < keys.length; k++) {
        if (t.indexOf(keys[k]) > -1) return String(candidates[j].ID);
      }
    }
    for (var a = 0; a < list.length; a++) {
      var tt = String(list[a].VALUE || "").toLowerCase();
      for (var kk = 0; kk < keys.length; kk++) {
        if (tt.indexOf(keys[kk]) > -1 && tt.indexOf(yy) > -1) return String(list[a].ID);
      }
    }
    return "";
  }

  // =========================
  // Partners avatars
  // =========================
  function initialsFromName(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    var a = parts[0] ? parts[0].charAt(0) : "";
    var b = parts[1] ? parts[1].charAt(0) : "";
    var out = (a + b).toUpperCase();
    return out || "CG";
  }

  function resolveUserPhotoUrl(user) {
    var raw = user && (user.PERSONAL_PHOTO_URL || user.PERSONAL_PHOTO || user.PHOTO || "");
    if (!raw) return "";
    if (typeof raw === "string" && raw.indexOf("http") === 0) return raw;
    return "";
  }

  function loadPartners() {
    return apiCall("user.get", { ID: CFG.FOOTER.partnersUserIds })
      .then(function (r) { S.partners = (r && r.result) ? r.result : []; })
      .catch(function () { S.partners = []; });
  }

  function renderPartnersAvatars() {
    var host = el("#fin-avatars");
    if (!host) return;

    var byId = {};
    for (var i = 0; i < S.partners.length; i++) byId[String(S.partners[i].ID)] = S.partners[i];

    var html = [];
    for (var j = 0; j < CFG.FOOTER.partnersUserIds.length; j++) {
      var id = CFG.FOOTER.partnersUserIds[j];
      var u = byId[String(id)] || {};
      var name = ((u.NAME || "") + " " + (u.LAST_NAME || "")).trim() || ("User " + id);
      var url = resolveUserPhotoUrl(u);

      if (url) html.push('<div class="fin-avatar" title="' + esc(name) + '"><img src="' + esc(url) + '" alt="' + esc(name) + '"></div>');
      else html.push('<div class="fin-avatar" title="' + esc(name) + '">' + esc(initialsFromName(name)) + "</div>");
    }
    host.innerHTML = html.join("");
  }

  // =========================
  // Load meta (fields + stages)
  // =========================
  function loadMeta() {
    return apiCall("crm.deal.fields", {}).then(function (fieldsRes) {
      var fields = (fieldsRes && fieldsRes.result) ? fieldsRes.result : {};
      S.enums = {};
      for (var k in fields) {
        if (!fields.hasOwnProperty(k)) continue;
        var v = fields[k];
        if (v && Array.isArray(v.items)) {
          S.enums[k] = v.items.map(function (it) { return { ID: String(it.ID), VALUE: String(it.VALUE) }; });
        }
      }
      return apiCall("crm.status.list", { filter: { ENTITY_ID: "DEAL_STAGE_" + CFG.DEAL_CATEGORY_ID } });
    }).then(function (st) {
      var allowed = {};
      for (var a in CFG.STAGES) allowed[String(CFG.STAGES[a])] = true;

      var raw = (st && st.result) ? st.result : [];
      var out = [];
      for (var i = 0; i < raw.length; i++) {
        var sid = String(raw[i].STATUS_ID || raw[i].ID || "");
        if (!allowed[sid]) continue;
        out.push({ STATUS_ID: sid, NAME: String(raw[i].NAME || ""), SORT: Number(raw[i].SORT || 0) });
      }
      out.sort(function (x, y) { return x.SORT - y.SORT; });
      S.stages = out;
    });
  }

  // =========================
  // Deals list (all)
  // =========================
  function listDealsAll() {
    var out = [];
    var start = 0;
    var stageArr = [
      CFG.STAGES.DESP_A_PAGAR,
      CFG.STAGES.DESP_PAGA,
      CFG.STAGES.REC_A_RECEBER,
      CFG.STAGES.REC_RECEBIDA,
      CFG.STAGES.CANCELADO,
      CFG.STAGES.CONCLUIDO
    ];

    function loop() {
      return apiCall("crm.deal.list", {
        select: [
          "ID", "TITLE", "STAGE_ID", "CATEGORY_ID",
          CFG.F.TIPO_FIN, CFG.F.COMPETENCIA, CFG.F.VALOR_PREV, CFG.F.VALOR_REAL,
          CFG.F.DATA_REAL, CFG.F.FAVORECIDO, CFG.F.OBS, CFG.F.CATEGORIA,
          CFG.F.DATA_PREV, CFG.F.STATUS_FIN, CFG.F.CONTA, CFG.F.CENTRO_CUSTO
        ],
        filter: { CATEGORY_ID: String(CFG.DEAL_CATEGORY_ID), STAGE_ID: stageArr },
        order: { ID: "DESC" },
        start: start
      }).then(function (res) {
        var chunk = (res && res.result) ? res.result : [];
        for (var i = 0; i < chunk.length; i++) out.push(chunk[i]);
        if (res && res.next != null) { start = res.next; return loop(); }
        return out;
      });
    }
    return loop();
  }

  // =========================
  // Apply filters
  // =========================
  function applyFilters() {
    var q = String(S.filters.q || "").trim().toLowerCase();

    S.filtered = (S.deals || []).filter(function (d) {
      if (isBadFav(d[CFG.F.FAVORECIDO])) return false;

      if (S.filters.centro && String(d[CFG.F.CENTRO_CUSTO] || "") !== String(S.filters.centro)) return false;
      if (S.filters.competencia && String(d[CFG.F.COMPETENCIA] || "") !== String(S.filters.competencia)) return false;
      if (S.filters.stageId) {
        if (String(d.STAGE_ID || "") !== String(S.filters.stageId)) return false;
      } else {
        if (String(d.STAGE_ID || "") === String(CFG.STAGES.CONCLUIDO)) return false;
      }

      var st = String(d.STAGE_ID || "");
      var isExp = (st === CFG.STAGES.DESP_A_PAGAR || st === CFG.STAGES.DESP_PAGA);
      var isRec = (st === CFG.STAGES.REC_A_RECEBER || st === CFG.STAGES.REC_RECEBIDA);

      if (!S.filters.showPayables && isExp) return false;
      if (!S.filters.showReceivables && isRec) return false;

      if (q) {
        var hay = [
          d.ID, d.TITLE,
          d[CFG.F.FAVORECIDO],
          d[CFG.F.OBS],
          enumName(CFG.F.CONTA, d[CFG.F.CONTA]),
          enumName(CFG.F.CENTRO_CUSTO, d[CFG.F.CENTRO_CUSTO]),
          enumName(CFG.F.CATEGORIA, d[CFG.F.CATEGORIA])
        ].join(" ").toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    S.filtered.sort(function (a, b) {
      var da = toISODate(a[CFG.F.DATA_PREV] || "") || "9999-99-99";
      var db = toISODate(b[CFG.F.DATA_PREV] || "") || "9999-99-99";
      return da < db ? -1 : da > db ? 1 : 0;
    });

    var trRows = buildTransferRows();
    if (trRows.length) S.filtered = trRows.concat(S.filtered);

    renderAfterFilter();
  }

  // =========================
  // Totals + CC balances
  // =========================
  function computeCCBalance(centroId) {
    centroId = String(centroId || "");
    var base = S.cc.balances[centroId] || { initial: 0, adjust: 0 };
    var initial = Number(base.initial || 0) || 0;
    var adjust = Number(base.adjust || 0) || 0;

    // RESERVA não é centro operacional.
    // Seu cálculo é feito por fechamento de competência em computeReserveTotal().
    if (centroId === CFG.RESERVE_CENTER_ID) return computeReserveTotal();

    var realIn = 0, realOut = 0;

    for (var i = 0; i < (S.deals || []).length; i++) {
      var d = S.deals[i];
      if (String(d[CFG.F.CENTRO_CUSTO] || "") !== centroId) continue;

      var st = String(d.STAGE_ID || "");
      var vReal = Number(d[CFG.F.VALOR_REAL] || 0) || 0;

      if (st === CFG.STAGES.REC_RECEBIDA) realIn += vReal;
      if (st === CFG.STAGES.DESP_PAGA) realOut += vReal; // inclui distribuição de lucro: abate do centro, mas não entra como despesa nos gráficos/totais.
    }

    var tNet = 0;
    for (var j = 0; j < (S.cc.ledger || []).length; j++) {
      var t = S.cc.ledger[j] || {};
      if (String(t.from || "") === centroId) tNet -= Number(t.amount || 0) || 0;
      if (String(t.to || "") === centroId) tNet += Number(t.amount || 0) || 0;
    }

    return (initial + adjust + realIn - realOut + tNet);
  }


  function computeAllCCBalance() {
    var seen = {};
    var total = 0;
    var items = centersWithReserve();

    for (var i = 0; i < items.length; i++) {
      var id = String(items[i].ID || "");
      if (!id || seen[id]) continue;
      seen[id] = true;
      total += computeCCBalance(id);
    }

    for (var k in (S.cc.balances || {})) {
      if (!S.cc.balances.hasOwnProperty(k)) continue;
      var bid = String(k || "");
      if (!bid || seen[bid]) continue;
      seen[bid] = true;
      total += computeCCBalance(bid);
    }

    for (var d = 0; d < (S.deals || []).length; d++) {
      var did = String(S.deals[d][CFG.F.CENTRO_CUSTO] || "");
      if (!did || seen[did]) continue;
      seen[did] = true;
      total += computeCCBalance(did);
    }

    for (var t = 0; t < (S.cc.ledger || []).length; t++) {
      var tr = S.cc.ledger[t] || {};
      var from = String(tr.from || "");
      var to = String(tr.to || "");
      if (from && !seen[from]) { seen[from] = true; total += computeCCBalance(from); }
      if (to && !seen[to]) { seen[to] = true; total += computeCCBalance(to); }
    }

    return total;
  }

  function renderTotals() {
    var list = getPagedList();
    var prev = 0, real = 0;

    for (var i = 0; i < list.length; i++) {
      if (isTransferRow(list[i])) continue;
      if (isProfitDistributionDeal(list[i])) continue;
      prev += Number(list[i][CFG.F.VALOR_PREV] || 0) || 0;
      real += Number(list[i][CFG.F.VALOR_REAL] || 0) || 0;
    }

    if (el("#tot-prev")) el("#tot-prev").textContent = moneyBR(prev);
    if (el("#tot-real")) el("#tot-real").textContent = moneyBR(real);
    if (el("#reserve-balance")) el("#reserve-balance").textContent = moneyBR(computeReserveTotal());
    if (el("#tot-count")) el("#tot-count").textContent = String(list.length);

    var selectedCount = 0;
    for (var sid in S.selectedIds) if (S.selectedIds.hasOwnProperty(sid) && S.selectedIds[sid]) selectedCount++;
    if (el("#tot-selected")) el("#tot-selected").textContent = String(selectedCount);

    var ccSel = String(S.filters.centro || "");
    if (el("#cc-balance-label")) {
      el("#cc-balance-label").textContent = ccSel ? "Saldo Centro:" : "Saldo Total:";
    }
    if (el("#cc-balance")) {
      el("#cc-balance").textContent = ccSel ? moneyBR(computeCCBalance(ccSel)) : moneyBR(computeAllCCBalance());
    }
    if (el("#btn-transfer-inline")) {
      el("#btn-transfer-inline").style.display = ccSel ? "inline-flex" : "none";
    }

    if (S.lastSyncAt && el("#fin-lastsync")) {
      el("#fin-lastsync").textContent = "Atualizado em " + S.lastSyncAt + " • API: " + (S.apiMode || "?");
    }
  }

  function amountForChart(d) {
    var real = Number(d[CFG.F.VALOR_REAL] || 0) || 0;
    var prev = Number(d[CFG.F.VALOR_PREV] || 0) || 0;
    return real > 0 ? real : prev;
  }

  function svgEscape(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function buildBarsSvg(items, titleLeft, titleRight) {
    var w = 680, h = 220, padL = 40, padR = 10, padT = 18, padB = 34;
    var max = 0, i;
    for (i = 0; i < items.length; i++) max = Math.max(max, Number(items[i].exp || 0), Number(items[i].rec || 0));
    if (max <= 0) max = 1;
    var plotW = w - padL - padR;
    var plotH = h - padT - padB;
    var groupW = plotW / Math.max(items.length, 1);
    var barW = Math.max(8, Math.min(20, Math.floor(groupW / 3)));
    var out = [];
    out.push('<svg viewBox="0 0 ' + w + ' ' + h + '" class="fin-svg-chart" aria-label="Evolução">');
    out.push('<line x1="' + padL + '" y1="' + (h - padB) + '" x2="' + (w - padR) + '" y2="' + (h - padB) + '" stroke="currentColor" stroke-opacity=".22"/>');
    out.push('<line x1="' + padL + '" y1="' + padT + '" x2="' + padL + '" y2="' + (h - padB) + '" stroke="currentColor" stroke-opacity=".22"/>');
    out.push('<text x="' + padL + '" y="12" font-size="11" font-weight="700">' + svgEscape(titleLeft) + ' vs ' + svgEscape(titleRight) + '</text>');
    for (i = 0; i < items.length; i++) {
      var it = items[i];
      var x0 = padL + i * groupW + (groupW / 2) - barW - 2;
      var expH = Math.round((Number(it.exp || 0) / max) * plotH);
      var recH = Math.round((Number(it.rec || 0) / max) * plotH);
      var yExp = h - padB - expH;
      var yRec = h - padB - recH;
      out.push('<rect x="' + x0 + '" y="' + yExp + '" width="' + barW + '" height="' + expH + '" rx="4" fill="currentColor" fill-opacity=".22"/>');
      out.push('<rect x="' + (x0 + barW + 4) + '" y="' + yRec + '" width="' + barW + '" height="' + recH + '" rx="4" fill="currentColor" fill-opacity=".65"/>');
      out.push('<text x="' + (padL + i * groupW + groupW / 2) + '" y="' + (h - 10) + '" text-anchor="middle" font-size="10">' + svgEscape(it.label) + '</text>');
    }
    out.push('</svg>');
    return out.join('');
  }

  function renderChartsPlaceholders() {
    var a = el("#chart-cat");
    var b = el("#chart-evo");
    var list = getPagedList();
    var i, d;

    var catMap = {};
    for (i = 0; i < list.length; i++) {
      d = list[i];
      if (isTransferRow(d) || isProfitDistributionDeal(d)) continue;
      var st = String(d.STAGE_ID || "");
      var isExp = (st === CFG.STAGES.DESP_A_PAGAR || st === CFG.STAGES.DESP_PAGA);
      if (!isExp) continue;
      var cat = enumName(CFG.F.CATEGORIA, d[CFG.F.CATEGORIA]) || "Sem categoria";
      catMap[cat] = (catMap[cat] || 0) + amountForChart(d);
    }
    var catItems = [];
    for (var k in catMap) if (catMap.hasOwnProperty(k)) catItems.push({ label: k, value: catMap[k] });
    catItems.sort(function(x,y){ return y.value - x.value; });
    catItems = catItems.slice(0, 5);

    if (a) {
      if (!catItems.length) {
        a.innerHTML = '<div class="fin-chart-box">Sem despesas filtradas para gráfico por categoria.</div>';
      } else {
        var total = 0; for (i = 0; i < catItems.length; i++) total += catItems[i].value;
        var itemsHtml = [];
        for (i = 0; i < catItems.length; i++) {
          var pct = total ? ((catItems[i].value / total) * 100) : 0;
          itemsHtml.push(
            '<div class="fin-chart-row">' +
              '<div class="fin-chart-name">' + esc(catItems[i].label) + '</div>' +
              '<div class="fin-chart-bar"><span style="width:' + pct.toFixed(1) + '%"></span></div>' +
              '<div class="fin-chart-value">' + esc(moneyBR(catItems[i].value)) + '</div>' +
            '</div>'
          );
        }
        a.innerHTML = '<div class="fin-chart-box"><div class="fin-chart-title">Despesas por categoria</div>' + itemsHtml.join('') + '</div>';
      }
    }

    if (b) {
      var compMap = {};
      for (i = 0; i < list.length; i++) {
        d = list[i];
        var compLabel = enumName(CFG.F.COMPETENCIA, d[CFG.F.COMPETENCIA]) || 'Sem comp.';
        if (!compMap[compLabel]) compMap[compLabel] = { label: compLabel, exp: 0, rec: 0 };
        if (isTransferRow(d) || isProfitDistributionDeal(d)) continue;
        var amt = amountForChart(d);
        var st2 = String(d.STAGE_ID || '');
        if (st2 === CFG.STAGES.DESP_A_PAGAR || st2 === CFG.STAGES.DESP_PAGA) compMap[compLabel].exp += amt;
        if (st2 === CFG.STAGES.REC_A_RECEBER || st2 === CFG.STAGES.REC_RECEBIDA) compMap[compLabel].rec += amt;
      }
      var evo = [];
      for (var c in compMap) if (compMap.hasOwnProperty(c)) evo.push(compMap[c]);
      evo.sort(function(x, y){ return String(x.label).localeCompare(String(y.label), 'pt-BR'); });
      evo = evo.slice(0, 8);
      if (!evo.length) b.innerHTML = '<div class="fin-chart-box">Sem dados filtrados para evolução por competência.</div>';
      else b.innerHTML = '<div class="fin-chart-box"><div class="fin-chart-title">Receitas x despesas por competência</div>' + buildBarsSvg(evo, 'Despesas', 'Receitas') + '</div>';
    }

    renderProfitDistributionChart();
  }

  function renderProfitDistributionChart() {
    var host = el("#chart-profit");
    if (!host) return;
    var map = {};
    var total = 0;
    for (var i = 0; i < (S.deals || []).length; i++) {
      var d = S.deals[i];
      if (!isProfitDistributionDeal(d)) continue;
      var st = String(d.STAGE_ID || "");
      if (st !== CFG.STAGES.DESP_PAGA && st !== CFG.STAGES.DESP_A_PAGAR) continue;
      var socio = displayLabel(d[CFG.F.FAVORECIDO] || d.TITLE || "Sócio não informado");
      var comp = enumName(CFG.F.COMPETENCIA, d[CFG.F.COMPETENCIA]) || "Sem comp.";
      var val = Number(d[CFG.F.VALOR_REAL] || d[CFG.F.VALOR_PREV] || 0) || 0;
      var key = comp + " • " + socio;
      map[key] = (map[key] || 0) + val;
      total += val;
    }
    var arr = [];
    for (var k in map) if (map.hasOwnProperty(k)) arr.push({ label: k, value: map[k] });
    arr.sort(function(a,b){ return String(a.label).localeCompare(String(b.label), 'pt-BR'); });
    arr = arr.slice(-10);
    if (!arr.length) {
      host.innerHTML = '<div class="fin-chart-box">Sem distribuição de lucro para exibir.</div>';
      return;
    }
    var html = [];
    for (var j = 0; j < arr.length; j++) {
      var pct = total ? (arr[j].value / total * 100) : 0;
      html.push('<div class="fin-chart-row"><div class="fin-chart-name">' + esc(arr[j].label) + '</div><div class="fin-chart-bar"><span style="width:' + pct.toFixed(1) + '%"></span></div><div class="fin-chart-value">' + esc(moneyBR(arr[j].value)) + '</div></div>');
    }
    host.innerHTML = '<div class="fin-chart-box"><div class="fin-chart-title">Lucro dos sócios por mês</div>' + html.join('') + '</div>';
  }


  // =========================
  // Painel SÓCIOS
  // =========================
  function socioTypeLabel(type) {
    if (type === "PRO_LABORE") return "Pró-labore";
    if (type === "BONIFICACAO") return "Bonificação";
    if (type === "DISTRIBUICAO_LUCRO") return "Distribuição de lucro";
    return String(type || "");
  }

  function socioLabel(key) {
    var s = CFG.SOCIOS && CFG.SOCIOS[key];
    return s ? s.label : String(key || "");
  }

  function isSocioTypeNormal(socioKey, type) {
    var s = CFG.SOCIOS && CFG.SOCIOS[socioKey];
    if (!s) return true;
    var arr = s.tiposNormais || [];
    for (var i = 0; i < arr.length; i++) if (arr[i] === type) return true;
    return false;
  }

  function classifySocioGainType(deal) {
    var text = normText([
      deal && deal.TITLE,
      deal && deal[CFG.F.FAVORECIDO],
      deal && deal[CFG.F.OBS],
      enumName(CFG.F.CATEGORIA, deal && deal[CFG.F.CATEGORIA])
    ].join(" "));

    if (text.indexOf("DISTRIBUICAO") > -1 && text.indexOf("LUCRO") > -1) return "DISTRIBUICAO_LUCRO";
    if (text.indexOf("PRO LABORE") > -1 || text.indexOf("PRO-LABORE") > -1 || text.indexOf("PRÓ-LABORE") > -1) return "PRO_LABORE";
    if (text.indexOf("BONIF") > -1) return "BONIFICACAO";
    return "";
  }

  function identifySocioFromDeal(deal) {
    var text = normText([
      deal && deal.TITLE,
      deal && deal[CFG.F.FAVORECIDO],
      deal && deal[CFG.F.OBS]
    ].join(" "));

    var socios = CFG.SOCIOS || {};
    for (var key in socios) {
      if (!socios.hasOwnProperty(key)) continue;
      var aliases = socios[key].aliases || [];
      for (var i = 0; i < aliases.length; i++) {
        var a = normText(aliases[i]);
        if (a && text.indexOf(a) > -1) return key;
      }
    }
    return "";
  }

  function compYearMonthFromText(s) {
    var t = normText(s || "");
    var y = "";
    var ym = String(s || "").match(/(20\d{2})[-\/](\d{1,2})/);
    if (ym) return ym[1] + "-" + String(ym[2]).padStart(2, "0");
    var my = String(s || "").match(/(\d{1,2})[\/\-](20\d{2})/);
    if (my) return my[2] + "-" + String(my[1]).padStart(2, "0");
    var yy = t.match(/20\d{2}/);
    if (yy) y = yy[0];
    var months = [
      ["JANEIRO", "JAN", "01"], ["FEVEREIRO", "FEV", "02"], ["MARCO", "MAR", "03"],
      ["ABRIL", "ABR", "04"], ["MAIO", "MAI", "05"], ["JUNHO", "JUN", "06"],
      ["JULHO", "JUL", "07"], ["AGOSTO", "AGO", "08"], ["SETEMBRO", "SET", "09"],
      ["OUTUBRO", "OUT", "10"], ["NOVEMBRO", "NOV", "11"], ["DEZEMBRO", "DEZ", "12"]
    ];
    var mm = "";
    for (var i = 0; i < months.length; i++) {
      if (t.indexOf(months[i][0]) > -1 || t.indexOf(months[i][1]) > -1) { mm = months[i][2]; break; }
    }
    return (y && mm) ? (y + "-" + mm) : "";
  }

  function dealYearMonth(d) {
    var comp = enumName(CFG.F.COMPETENCIA, d && d[CFG.F.COMPETENCIA]);
    var c = compYearMonthFromText(comp);
    if (c) return c;
    var data = toISODate((d && (d[CFG.F.DATA_REAL] || d[CFG.F.DATA_PREV])) || "");
    var m = String(data || "").match(/^(20\d{2})-(\d{2})-/);
    return m ? (m[1] + "-" + m[2]) : "";
  }

  function buildSociosLedger() {
    var rows = [];
    var socios = CFG.SOCIOS || {};

    function pushRow(base, socioKey, type, value, extra) {
      if (!socioKey || !socios[socioKey]) return;
      var permitted = socios[socioKey].tiposPermitidos || [];
      var ok = false;
      for (var p = 0; p < permitted.length; p++) if (permitted[p] === type) ok = true;
      if (!ok) return;
      rows.push({
        dealId: base.dealId || "",
        socio: socioKey,
        socioLabel: socioLabel(socioKey),
        tipo: type,
        tipoLabel: socioTypeLabel(type),
        excepcional: !isSocioTypeNormal(socioKey, type),
        competencia: base.competencia || "",
        competenciaNome: base.competenciaNome || "",
        ym: base.ym || "",
        data: base.data || "",
        valor: Number(value || 0) || 0,
        descricao: base.descricao || "",
        origem: base.origem || "Bitrix",
        status: base.status || "",
        obs: extra || ""
      });
    }

    for (var i = 0; i < (S.deals || []).length; i++) {
      var d = S.deals[i];
      if (isTransferRow(d)) continue;
      var type = classifySocioGainType(d);
      if (!type) continue;

      var value = Number(d[CFG.F.VALOR_REAL] || d[CFG.F.VALOR_PREV] || 0) || 0;
      if (!value) continue;
      var compId = d[CFG.F.COMPETENCIA] || "";
      var compName = enumName(CFG.F.COMPETENCIA, compId) || "";
      var base = {
        dealId: d.ID,
        competencia: compId,
        competenciaNome: compName,
        ym: dealYearMonth(d),
        data: d[CFG.F.DATA_REAL] || d[CFG.F.DATA_PREV] || "",
        descricao: displayLabel(d.TITLE || d[CFG.F.FAVORECIDO] || ""),
        origem: "Deal " + (d.ID || ""),
        status: stageName(d.STAGE_ID || "")
      };

      var socio = identifySocioFromDeal(d);
      if (type === "DISTRIBUICAO_LUCRO") {
        if (socio === "DIOGO" || socio === "CESAR") {
          pushRow(base, socio, type, value, "");
        } else {
          for (var key in socios) {
            if (!socios.hasOwnProperty(key)) continue;
            var pct = Number(socios[key].lucroPercentual || 0) || 0;
            if (pct > 0) pushRow(base, key, type, value * pct / 100, "Divisão automática " + pct + "%");
          }
        }
        continue;
      }

      if (socio) pushRow(base, socio, type, value, "");
    }

    var manual = (S.socios && Array.isArray(S.socios.manualAdjustments)) ? S.socios.manualAdjustments : [];
    for (var j = 0; j < manual.length; j++) {
      var r = manual[j] || {};
      if (!r.socio || !r.tipo) continue;
      pushRow({
        dealId: r.id || "",
        competencia: r.competencia || "",
        competenciaNome: r.competenciaNome || "",
        ym: r.ym || compYearMonthFromText(r.competenciaNome || r.competencia || r.data || ""),
        data: r.data || "",
        descricao: r.descricao || "Ajuste manual",
        origem: "Ajuste manual",
        status: "Manual"
      }, r.socio, r.tipo, r.valor, r.obs || "");
    }

    rows.sort(function(a,b){ return String(a.ym || "9999-99").localeCompare(String(b.ym || "9999-99")) || String(a.socioLabel).localeCompare(String(b.socioLabel), 'pt-BR'); });
    return rows;
  }

  function monthLabelFromYM(ym) {
    var m = String(ym || "").match(/^(20\d{2})-(\d{2})$/);
    if (!m) return ym || "Sem mês";
    var nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return nomes[Number(m[2]) - 1] + "/" + m[1];
  }

  function sumRows(rows, pred) {
    var total = 0;
    for (var i = 0; i < rows.length; i++) if (!pred || pred(rows[i])) total += Number(rows[i].valor || 0) || 0;
    return total;
  }

  function renderSociosContent(host, rows) {
    if (!host) return;
    var now = new Date();
    var defaultYear = String(now.getFullYear());
    var years = {};
    for (var i = 0; i < rows.length; i++) if (rows[i].ym) years[String(rows[i].ym).slice(0,4)] = true;
    years[defaultYear] = true;
    var yearList = Object.keys(years).sort();

    host.innerHTML =
      '<div class="fin-filters" style="margin-top:0">' +
        '<div class="fin-field"><label>Ano</label><select id="soc-year">' + yearList.map(function(y){ return '<option value="' + esc(y) + '">' + esc(y) + '</option>'; }).join('') + '</select></div>' +
        '<div class="fin-field"><label>Mês</label><select id="soc-month"><option value="">Todos</option><option value="01">Janeiro</option><option value="02">Fevereiro</option><option value="03">Março</option><option value="04">Abril</option><option value="05">Maio</option><option value="06">Junho</option><option value="07">Julho</option><option value="08">Agosto</option><option value="09">Setembro</option><option value="10">Outubro</option><option value="11">Novembro</option><option value="12">Dezembro</option></select></div>' +
        '<div class="fin-field"><label>Sócio</label><select id="soc-socio"><option value="">Todos</option><option value="ALINE">Aline</option><option value="DIOGO">Diogo</option><option value="CESAR">Cesar</option></select></div>' +
        '<div class="fin-field"><label>Tipo</label><select id="soc-type"><option value="">Todos</option><option value="PRO_LABORE">Pró-labore</option><option value="BONIFICACAO">Bonificação</option><option value="DISTRIBUICAO_LUCRO">Distribuição de lucro</option></select></div>' +
      '</div>' +
      '<div id="soc-render"></div>';

    var yearSel = host.querySelector('#soc-year');
    if (yearSel) yearSel.value = defaultYear;

    function draw() {
      var y = host.querySelector('#soc-year').value || "";
      var m = host.querySelector('#soc-month').value || "";
      var sk = host.querySelector('#soc-socio').value || "";
      var tp = host.querySelector('#soc-type').value || "";
      var filtered = rows.filter(function(r){
        if (y && String(r.ym || '').slice(0,4) !== y) return false;
        if (m && String(r.ym || '').slice(5,7) !== m) return false;
        if (sk && r.socio !== sk) return false;
        if (tp && r.tipo !== tp) return false;
        return true;
      });
      var monthRows = rows.filter(function(r){ return y && m && String(r.ym || '') === (y + '-' + m); });
      if (!m) monthRows = filtered;

      var totalPeriodo = sumRows(filtered);
      var totalAno = sumRows(rows, function(r){ return y && String(r.ym || '').slice(0,4) === y; });
      var pro = sumRows(filtered, function(r){ return r.tipo === 'PRO_LABORE'; });
      var bon = sumRows(filtered, function(r){ return r.tipo === 'BONIFICACAO'; });
      var luc = sumRows(filtered, function(r){ return r.tipo === 'DISTRIBUICAO_LUCRO'; });
      var aline = sumRows(filtered, function(r){ return r.socio === 'ALINE'; });
      var diogo = sumRows(filtered, function(r){ return r.socio === 'DIOGO'; });
      var cesar = sumRows(filtered, function(r){ return r.socio === 'CESAR'; });

      function kpi(k,v){ return '<div class="fin-kpi"><div class="fin-kpi-k">' + esc(k) + '</div><div class="fin-kpi-v">' + esc(moneyBR(v)) + '</div></div>'; }

      function barRows(map, total, title) {
        var arr = [];
        for (var k in map) if (map.hasOwnProperty(k)) arr.push({ label:k, value: map[k] });
        arr.sort(function(a,b){ return b.value - a.value; });
        var out = ['<div class="fin-chart-box"><div class="fin-chart-title">' + esc(title) + '</div>'];
        if (!arr.length) out.push('<div class="fin-muted">Sem dados.</div>');
        for (var i=0;i<arr.length;i++) {
          var pct = total ? (arr[i].value / total * 100) : 0;
          out.push('<div class="fin-chart-row"><div class="fin-chart-name">' + esc(arr[i].label) + '</div><div class="fin-chart-bar"><span style="width:' + pct.toFixed(1) + '%"></span></div><div class="fin-chart-value">' + esc(moneyBR(arr[i].value)) + '</div></div>');
        }
        out.push('</div>');
        return out.join('');
      }

      var mapSocio = {}, mapTipo = {}, mapMes = {};
      for (var i=0;i<filtered.length;i++) {
        var r = filtered[i];
        mapSocio[r.socioLabel] = (mapSocio[r.socioLabel] || 0) + r.valor;
        mapTipo[r.tipoLabel] = (mapTipo[r.tipoLabel] || 0) + r.valor;
        var ml = monthLabelFromYM(r.ym);
        mapMes[ml + ' • ' + r.socioLabel] = (mapMes[ml + ' • ' + r.socioLabel] || 0) + r.valor;
      }

      var table = [];
      table.push('<div class="fin-table-wrap" style="margin-top:12px"><table class="fin-table"><thead><tr><th>Data</th><th>Competência</th><th>Sócio</th><th>Tipo</th><th>Descrição</th><th>Valor</th><th>Origem</th><th>Obs</th></tr></thead><tbody>');
      if (!filtered.length) table.push('<tr><td colspan="8" class="fin-muted">Sem lançamentos de sócios para os filtros selecionados.</td></tr>');
      for (var t=0;t<filtered.length;t++) {
        var rr = filtered[t];
        table.push('<tr><td>' + esc(toDisplayDate(rr.data)) + '</td><td>' + esc(rr.competenciaNome || rr.ym || '-') + '</td><td>' + esc(rr.socioLabel) + '</td><td>' + esc(rr.tipoLabel) + (rr.excepcional ? ' <span class="fin-muted">(excepcional)</span>' : '') + '</td><td>' + esc(rr.descricao) + '</td><td>' + esc(moneyBR(rr.valor)) + '</td><td>' + esc(rr.origem) + '</td><td>' + esc(rr.obs || '') + '</td></tr>');
      }
      table.push('</tbody></table></div>');

      var target = host.querySelector('#soc-render');
      target.innerHTML =
        '<div class="fin-kpis" style="margin-top:12px">' +
          kpi('Total no período', totalPeriodo) + kpi('Total no ano', totalAno) + kpi('Pró-labore', pro) +
          kpi('Bonificação', bon) + kpi('Distribuição de lucro', luc) + kpi('Aline', aline) +
          kpi('Diogo', diogo) + kpi('Cesar', cesar) +
        '</div>' +
        '<div class="fin-charts" style="margin-top:12px">' +
          barRows(mapSocio, totalPeriodo, 'Total por sócio') +
          barRows(mapTipo, totalPeriodo, 'Total por tipo de ganho') +
          barRows(mapMes, totalPeriodo, 'Evolução mensal por sócio') +
        '</div>' + table.join('');
    }

    var controls = host.querySelectorAll('#soc-year,#soc-month,#soc-socio,#soc-type');
    for (var c=0;c<controls.length;c++) controls[c].addEventListener('change', draw);
    draw();
  }

  function openSociosModal() {
    var rows = buildSociosLedger();
    var m = modal(
      '<div class="fin-modal-head"><div><div class="fin-modal-title">👥 SÓCIOS</div><div class="fin-muted fin-small">Pró-labore e bonificação entram como despesa operacional. Distribuição de lucro não entra como despesa operacional.</div></div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body"><div id="socios-content"></div></div>',
      { full: true }
    );
    renderSociosContent(m.q('#socios-content'), rows);
  }

  function fullDealTitle(kind, fav, suffix) {
    var t = "FIN • " + kind + " • " + fav;
    if (suffix) t += " • " + suffix;
    return t;
  }

  function debounceApplySearch(value) {
    S.filters.q = value || "";
    try { if (S.searchTimer) clearTimeout(S.searchTimer); } catch (_) {}
    S.searchTimer = setTimeout(function () {
      S.searchTimer = null;
      applyFilters();
    }, 220);
  }

  // =========================
  // Sidebar centers
  // =========================
  function renderSidebarCenters() {
    var host = el("#fin-side-centers");
    if (!host) return;

    var items = centersWithReserve();
    var sel = String(S.filters.centro || "");

    function btn(id, label, active) {
      return (
        '<button class="fin-side-item ' + (active ? "is-active" : "") + '" data-centro="' + esc(id) + '">' +
          '<span class="fin-dot"></span><span class="fin-side-label">' + esc(label) + "</span>" +
        "</button>"
      );
    }

    var html = btn("", "VISÃO GLOBAL", !sel);
    for (var i = 0; i < items.length; i++) html += btn(String(items[i].ID), displayLabel(items[i].VALUE), sel === String(items[i].ID));

    host.innerHTML = html;

    var bs = host.querySelectorAll("[data-centro]");
    for (var k = 0; k < bs.length; k++) {
      bs[k].addEventListener("click", function () {
        S.filters.centro = this.getAttribute("data-centro") || "";
        applyFilters();
      });
    }
  }


  // =========================
  // Pipeline 17 reminders — contas a pagar por vencimento
  // =========================
  function reminderDateKeyFromDeal(d) {
    return toISODate(d && d[CFG.F.DATA_PREV] || "");
  }

  function isOpenPayableDeal(d) {
    return !!(d && String(d.CATEGORY_ID || CFG.DEAL_CATEGORY_ID) === String(CFG.DEAL_CATEGORY_ID) && String(d.STAGE_ID || "") === CFG.STAGES.DESP_A_PAGAR && reminderDateKeyFromDeal(d));
  }

  function financeReminderObs(dateISO, count, items) {
    var names = [];
    for (var i = 0; i < items.length && i < 12; i++) {
      names.push("• " + String(items[i][CFG.F.FAVORECIDO] || items[i].TITLE || "Conta") + " — " + moneyBR(items[i][CFG.F.VALOR_PREV] || items[i][CFG.F.VALOR_REAL] || 0));
    }
    return "Quantidade de contas a pagar no dia " + toDisplayDate(dateISO) + ": " + count + (names.length ? "\n\n" + names.join("\n") : "");
  }

  function findReminderByDate(existing, dateISO) {
    for (var i = 0; i < existing.length; i++) {
      var d = existing[i] || {};
      var cd = toISODate(d.CLOSEDATE || d.BEGINDATE || "");
      var cm = String(d.COMMENTS || "").match(/dia\s+(\d{2}\/\d{2}\/\d{4})/i);
      var fromComment = cm ? toISODate(cm[1]) : "";
      if (cd === dateISO || fromComment === dateISO) return d;
    }
    return null;
  }

  function syncFinanceDueReminders() {
    if (!CFG.REMINDER_CATEGORY_ID || !CFG.REMINDER_ASSIGNED_ID) return Promise.resolve();

    var groups = {};
    for (var i = 0; i < (S.deals || []).length; i++) {
      var d = S.deals[i];
      if (!isOpenPayableDeal(d)) continue;
      var key = reminderDateKeyFromDeal(d);
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    }

    return apiCall("crm.deal.list", {
      select: ["ID", "TITLE", "CATEGORY_ID", "STAGE_ID", "ASSIGNED_BY_ID", "COMMENTS", "BEGINDATE", "CLOSEDATE"],
      filter: {
        CATEGORY_ID: String(CFG.REMINDER_CATEGORY_ID),
        ASSIGNED_BY_ID: String(CFG.REMINDER_ASSIGNED_ID),
        TITLE: CFG.REMINDER_TITLE
      },
      order: { ID: "DESC" },
      start: 0
    }).then(function(res){
      var existing = (res && res.result) ? res.result : [];
      var ops = Promise.resolve();
      Object.keys(groups).sort().forEach(function(dateISO){
        ops = ops.then(function(){
          var items = groups[dateISO] || [];
          var comments = financeReminderObs(dateISO, items.length, items);
          var found = findReminderByDate(existing, dateISO);
          var fields = {
            TITLE: CFG.REMINDER_TITLE,
            CATEGORY_ID: String(CFG.REMINDER_CATEGORY_ID),
            STAGE_ID: CFG.REMINDER_STAGE_ID,
            ASSIGNED_BY_ID: String(CFG.REMINDER_ASSIGNED_ID),
            BEGINDATE: dateISO,
            CLOSEDATE: dateISO,
            COMMENTS: comments
          };
          if (CFG.REMINDER_UF_URGENCIA) fields[CFG.REMINDER_UF_URGENCIA] = CFG.REMINDER_UF_URGENCIA_VALOR;
          if (CFG.REMINDER_UF_TIPO_TAREFA) fields[CFG.REMINDER_UF_TIPO_TAREFA] = CFG.REMINDER_UF_TIPO_TAREFA_VALOR;
          if (found && found.ID) {
            if (String(found.COMMENTS || "") === String(comments || "")) return Promise.resolve();
            return updateDeal(found.ID, fields);
          }
          return createDeal(fields);
        });
      });
      return ops;
    }).catch(function(e){
      try { console.warn("Falha ao sincronizar avisos da pipeline 17:", e); } catch(_) {}
    });
  }

  function scheduleFinanceReminderSync() {
    try { if (S.reminderSyncTimer) clearTimeout(S.reminderSyncTimer); } catch(_) {}
    S.reminderSyncTimer = setTimeout(function(){
      S.reminderSyncTimer = null;
      syncFinanceDueReminders();
    }, 900);
  }

  // =========================
  // Actions: pay/receive + delete
  // =========================
  function openPayReceiveModal(deal) {
    var stageTo = nextStageByCurrent(deal.STAGE_ID);
    if (!stageTo) {
      toast("Este item não está em A PAGAR / A RECEBER.", "err");
      return;
    }

    var isDesp = String(deal.STAGE_ID) === CFG.STAGES.DESP_A_PAGAR;
    var title = isDesp ? "Pagar DESPESA" : "Receber RECEITA";

    var ccOpts = buildOptions(S.enums[CFG.F.CENTRO_CUSTO] || [], true, "— Selecione o centro —");
    if (isDesp) ccOpts += '<option value="__CARD__">CARTÃO DE CRÉDITO</option>';
    var cardOpts = cardOptionsFromContaEnums(true, "— Selecione o cartão —");
    var currentCentro = String(deal[CFG.F.CENTRO_CUSTO] || "");

    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">' + esc(title) + '</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body">' +
        '<div class="fin-row" style="gap:10px;flex-wrap:wrap">' +
          '<div class="fin-field" style="flex:1;min-width:240px"><label>Valor ' + (isDesp ? 'pago' : 'recebido') + ' (opcional)</label><input id="pr-val" value="' + esc(String(deal[CFG.F.VALOR_REAL] || deal[CFG.F.VALOR_PREV] || "")) + '" placeholder="Ex.: R$ 1.500,00"></div>' +
          '<div class="fin-field" style="flex:1;min-width:240px"><label>Data ' + (isDesp ? 'pagamento' : 'recebimento') + ' (DD/MM/AAAA)</label><input id="pr-date" data-date="1" value="' + esc(toDisplayDate(deal[CFG.F.DATA_REAL] || nowBR().slice(0,10))) + '" placeholder="DD/MM/AAAA"></div>' +
        '</div>' +
        '<div class="fin-row" style="gap:10px;flex-wrap:wrap;margin-top:10px">' +
          '<div class="fin-field" style="flex:1;min-width:240px"><label>Centro de custo debitado/creditado</label><select id="pr-centro">' + ccOpts + '</select></div>' +
          '<div class="fin-field" id="pr-card-wrap" style="flex:1;min-width:240px;display:none"><label>Cartão de crédito</label><select id="pr-card">' + cardOpts + '</select></div>' +
        '</div>' +
        '<div id="pr-card-note" class="fin-muted" style="display:none;margin-top:8px;font-weight:900">Ao selecionar cartão, este lançamento não será baixado como pago. Ele será transferido para o cartão escolhido e continuará como despesa A PAGAR na fatura calculada.</div>' +
        '<div class="fin-row fin-row--right" style="margin-top:12px">' +
          '<button class="fin-btn" data-close="1">Cancelar</button>' +
          '<button class="fin-btn fin-btn--primary" id="pr-save" data-busylock="1">Salvar</button>' +
        '</div>' +
      '</div>'
    );

    if (currentCentro) m.q("#pr-centro").value = currentCentro;
    function syncPayCardUI() {
      var isCard = m.q("#pr-centro") && m.q("#pr-centro").value === "__CARD__";
      var wrap = m.q("#pr-card-wrap");
      var note = m.q("#pr-card-note");
      if (wrap) wrap.style.display = isCard ? "flex" : "none";
      if (note) note.style.display = isCard ? "block" : "none";
    }
    m.q("#pr-centro").addEventListener("change", syncPayCardUI);
    syncPayCardUI();

    m.q("#pr-save").addEventListener("click", function () {
      setModalBusy(m.node, true, "Salvando...");

      var v = parseMoneyBR(m.q("#pr-val").value || "");
      var dt = toISODate(m.q("#pr-date").value || "");
      if (!dt) {
        toast("Informe a data.", "err");
        setModalBusy(m.node, false);
        return;
      }

      var centroSel = m.q("#pr-centro").value;
      var fields = {};

      if (isDesp && centroSel === "__CARD__") {
        var cardSel = m.q("#pr-card").value || "";
        if (!cardSel) { toast("Selecione o cartão.", "err"); setModalBusy(m.node, false); return; }
        var cardName = enumName(CFG.F.CONTA, cardSel) || cardSel;
        fields[CFG.F.CONTA] = cardSel;
        fields[CFG.F.DATA_PREV] = calcCardDueDateISO(dt, cardName);
        fields.STAGE_ID = CFG.STAGES.DESP_A_PAGAR;
        if (v || v === 0) fields[CFG.F.VALOR_PREV] = v;
        var obs0 = String(deal[CFG.F.OBS] || "").trim();
        fields[CFG.F.OBS] = (obs0 ? obs0 + " • " : "") + "Cartão: " + cardName + " • Compra: " + toDisplayDate(dt) + " • Venc. fatura: " + toDisplayDate(fields[CFG.F.DATA_PREV]);
      } else {
        if (!centroSel) { toast("Selecione o centro de custo.", "err"); setModalBusy(m.node, false); return; }
        fields[CFG.F.VALOR_REAL] = v;
        fields[CFG.F.DATA_REAL] = dt;
        fields.STAGE_ID = stageTo;
        fields[CFG.F.CENTRO_CUSTO] = centroSel;
      }

      updateDeal(deal.ID, fields)
        .then(function () {
          mergeDealPatch(deal.ID, fields);
          S.lastSyncAt = nowBR();
          applyFilters();
          toast("Atualizado ✅");
          m.close();
        })
        .catch(function (e) { toast("Falha: " + (e.message || String(e)), "err"); })
        .finally(function () { setModalBusy(m.node, false); });
    });
  }

  function getRecurringMeta(d) {
    var txt = String((d && d[CFG.F.OBS]) || "");
    var ser = (txt.match(/REC_SERIE:([A-Za-z0-9_\-]+)/) || [])[1] || "";
    var idxM = txt.match(/REC_IDX:(\d+)\/(\d+)/);
    return { series: ser, index: idxM ? Number(idxM[1]) : 0, total: idxM ? Number(idxM[2]) : 0 };
  }

  function deleteDealsSequential(list) {
    var p = Promise.resolve();
    var deleted = 0;
    list.forEach(function(d){
      p = p.then(function(){
        return deleteDeal(d.ID).then(function(){ deleted++; removeDealLocal(d.ID); });
      });
    });
    return p.then(function(){ return deleted; });
  }

  function confirmDelete(deal) {
    if (!assertDealUnlocked(deal, "excluir")) return;
    if (!guardPerm('canDelete', 'Excluir')) return;
    var meta = getRecurringMeta(deal);
    var future = [];
    if (meta.series && meta.index) {
      for (var i = 0; i < S.deals.length; i++) {
        var d = S.deals[i];
        var m2 = getRecurringMeta(d);
        if (m2.series === meta.series && m2.index >= meta.index) future.push(d);
      }
      future.sort(function(a,b){ return (getRecurringMeta(a).index || 0) - (getRecurringMeta(b).index || 0); });
    }

    var extra = future.length > 1
      ? '<div class="fin-muted" style="margin-top:8px;font-weight:900">Este item pertence a uma recorrência. Você pode excluir apenas este lançamento ou este e os próximos da mesma série.</div>'
      : (isRecurringLikeDeal(deal) ? '<div class="fin-muted" style="margin-top:8px;font-weight:900">Este item parece recorrente, mas não possui vínculo de série antigo. Só é possível excluir este lançamento.</div>' : '');

    var buttons = future.length > 1
      ? '<button class="fin-btn fin-btn--danger" id="del-future" data-busylock="1">Excluir esta e futuras (' + future.length + ')</button><button class="fin-btn fin-btn--danger" id="del-ok" data-busylock="1">Excluir só esta</button>'
      : '<button class="fin-btn fin-btn--danger" id="del-ok" data-busylock="1">Excluir</button>';

    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">Excluir lançamento</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body">' +
        '<div style="font-weight:900">Tem certeza que deseja EXCLUIR o card <span class="fin-mono">#' + esc(deal.ID) + '</span>?</div>' + extra +
        '<div class="fin-row fin-row--right" style="margin-top:12px;gap:8px;flex-wrap:wrap">' +
          '<button class="fin-btn" data-close="1">Cancelar</button>' + buttons +
        '</div>' +
      '</div>'
    );

    function finishDelete(list) {
      setModalBusy(m.node, true, "Excluindo...");
      deleteDealsSequential(list)
        .then(function (n) {
          S.lastSyncAt = nowBR();
          applyFilters();
          toast("Excluído ✅ (" + n + ")");
          m.close();
        })
        .catch(function (e) { toast("Falha: " + (e.message || String(e)), "err"); })
        .finally(function () { setModalBusy(m.node, false); });
    }

    var delOne = m.q("#del-ok");
    if (delOne) delOne.addEventListener("click", function () { finishDelete([deal]); });
    var delFuture = m.q("#del-future");
    if (delFuture) delFuture.addEventListener("click", function () { finishDelete(future); });
  }

  function openEditModal(deal) {
    if (!assertDealUnlocked(deal, "editar")) return;
    if (!guardPerm('canEdit', 'Editar')) return;
    if (!hasPerm('canEditCompleted') && String((deal && deal.STAGE_ID) || '') === CFG.STAGES.CONCLUIDO) { toast('Edição de concluídos bloqueada nas permissões locais.', 'err'); return; }
    var ccOpts = buildOptions(S.enums[CFG.F.CENTRO_CUSTO] || [], true, "—");
    var contaOpts = buildOptions(S.enums[CFG.F.CONTA] || [], true, "—");
    var catOpts = buildOptions(S.enums[CFG.F.CATEGORIA] || [], true, "—");
    var compOpts = buildOptions(S.enums[CFG.F.COMPETENCIA] || [], true, "—");
    var stageOpts = [];
    for (var i = 0; i < S.stages.length; i++) {
      stageOpts.push('<option value="' + esc(S.stages[i].STATUS_ID) + '">' + esc(S.stages[i].NAME) + '</option>');
    }

    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">Editar lançamento #' + esc(deal.ID) + '</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body">' +
        '<div class="fin-row" style="gap:10px;flex-wrap:wrap">' +
          '<div class="fin-field" style="flex:2;min-width:260px"><label>Favorecido</label><input id="ed-fav" value="' + esc(String(deal[CFG.F.FAVORECIDO] || "")) + '"></div>' +
          '<div class="fin-field" style="flex:1;min-width:220px"><label>Etapa</label><select id="ed-stage">' + stageOpts.join("") + '</select></div>' +
        '</div>' +
        '<div class="fin-row" style="gap:10px;flex-wrap:wrap;margin-top:10px">' +
          '<div class="fin-field" style="flex:1;min-width:220px"><label>Centro</label><select id="ed-cc">' + ccOpts + '</select></div>' +
          '<div class="fin-field" style="flex:1;min-width:220px"><label>Conta</label><select id="ed-conta">' + contaOpts + '</select></div>' +
          '<div class="fin-field" style="flex:1;min-width:220px"><label>Categoria</label><select id="ed-cat">' + catOpts + '</select></div>' +
        '</div>' +
        '<div class="fin-row" style="gap:10px;flex-wrap:wrap;margin-top:10px">' +
          '<div class="fin-field" style="flex:1;min-width:220px"><label>Competência</label><select id="ed-comp">' + compOpts + '</select></div>' +
          '<div class="fin-field" style="flex:1;min-width:180px"><label>Data prevista (DD/MM/AAAA)</label><input id="ed-dprev" value="' + esc(toDisplayDate(deal[CFG.F.DATA_PREV] || "")) + '" placeholder="DD/MM/AAAA"></div>' +
          '<div class="fin-field" style="flex:1;min-width:180px"><label>Data real (DD/MM/AAAA)</label><input id="ed-dreal" value="' + esc(toDisplayDate(deal[CFG.F.DATA_REAL] || "")) + '" placeholder="DD/MM/AAAA"></div>' +
        '</div>' +
        '<div class="fin-row" style="gap:10px;flex-wrap:wrap;margin-top:10px">' +
          '<div class="fin-field" style="flex:1;min-width:200px"><label>Valor previsto</label><input id="ed-vprev" value="' + esc(String(deal[CFG.F.VALOR_PREV] || "")) + '" placeholder="1500,00"></div>' +
          '<div class="fin-field" style="flex:1;min-width:200px"><label>Valor real</label><input id="ed-vreal" value="' + esc(String(deal[CFG.F.VALOR_REAL] || "")) + '" placeholder="1500,00"></div>' +
        '</div>' +
        '<div class="fin-field" style="margin-top:10px"><label>Observação</label><textarea id="ed-obs">' + esc(String(deal[CFG.F.OBS] || "")) + '</textarea></div>' +
        '<div class="fin-row fin-row--right" style="margin-top:12px">' +
          '<button class="fin-btn" data-close="1">Cancelar</button>' +
          '<button class="fin-btn fin-btn--primary" id="ed-save" data-busylock="1">Salvar alterações</button>' +
        '</div>' +
      '</div>',
      { full: true }
    );

    m.q("#ed-stage").value = String(deal.STAGE_ID || "");
    m.q("#ed-cc").value = String(deal[CFG.F.CENTRO_CUSTO] || "");
    m.q("#ed-conta").value = String(deal[CFG.F.CONTA] || "");
    m.q("#ed-cat").value = String(deal[CFG.F.CATEGORIA] || "");
    m.q("#ed-comp").value = String(deal[CFG.F.COMPETENCIA] || "");

    m.q("#ed-save").addEventListener("click", function () {
      var fav = String(m.q("#ed-fav").value || "").trim();
      if (!fav) { toast("Informe o favorecido.", "err"); return; }
      if (isBadFav(fav)) { toast("Favorecido inválido.", "err"); return; }

      var fields = {};
      fields.STAGE_ID = m.q("#ed-stage").value || String(deal.STAGE_ID || "");
      fields[CFG.F.FAVORECIDO] = fav;
      fields[CFG.F.CENTRO_CUSTO] = m.q("#ed-cc").value || "";
      fields[CFG.F.CONTA] = m.q("#ed-conta").value || "";
      fields[CFG.F.CATEGORIA] = m.q("#ed-cat").value || "";
      fields[CFG.F.COMPETENCIA] = m.q("#ed-comp").value || "";
      fields[CFG.F.DATA_PREV] = toISODate(m.q("#ed-dprev").value || "");
      fields[CFG.F.DATA_REAL] = toISODate(m.q("#ed-dreal").value || "");
      fields[CFG.F.VALOR_PREV] = parseMoneyBR(m.q("#ed-vprev").value || "");
      fields[CFG.F.VALOR_REAL] = parseMoneyBR(m.q("#ed-vreal").value || "");
      fields[CFG.F.OBS] = String(m.q("#ed-obs").value || "").trim();

      setModalBusy(m.node, true, "Salvando...");
      updateDeal(deal.ID, fields)
        .then(function () {
          mergeDealPatch(deal.ID, fields);
          S.lastSyncAt = nowBR();
          applyFilters();
          toast("Lançamento editado ✅");
          m.close();
        })
        .catch(function (e) { toast("Falha ao editar: " + (e.message || String(e)), "err"); })
        .finally(function () { setModalBusy(m.node, false); });
    });
  }

  // =========================
  // Reserve modal
  // =========================
  function openReserveModal() {
    if (!guardPerm('canAdjustReserve', 'Reserva')) return;
    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">Fundo de Reserva</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body">' +
        '<div class="fin-field"><label>Saldo atual</label><input id="rv" value="' + esc(String(S.reserve.balance || 0).replace(".", ",")) + '" placeholder="Ex.: 5000,00"></div>' +
        '<div class="fin-row fin-row--right" style="margin-top:12px">' +
          '<button class="fin-btn" data-close="1">Cancelar</button>' +
          '<button class="fin-btn fin-btn--primary" id="rsave" data-busylock="1">Salvar</button>' +
        '</div>' +
      '</div>'
    );
    m.q("#rsave").addEventListener("click", function () {
      var val = parseMoneyBR(m.q("#rv").value || "");
      S.reserve.balance = val;
      saveReserve();
      toast("Reserva atualizada ✅");
      m.close();
      renderTotals();
    });
  }

  // =========================
  // CC balance modal
  // =========================
  function openCCBalanceModal() {
    if (!guardPerm('canAdjustCC', 'Saldo de centro')) return;
    var ccSel = String(S.filters.centro || "");
    if (!ccSel) {
      toast("Selecione um Centro de Custo na lateral para ajustar saldo.", "err");
      return;
    }
    var base = S.cc.balances[ccSel] || { initial: 0, adjust: 0 };
    var draft = { initial: Number(base.initial || 0) || 0, adjust: Number(base.adjust || 0) || 0 };
    var name = enumName(CFG.F.CENTRO_CUSTO, ccSel) || ccSel;

    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">Saldo do Centro de Custo</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body">' +
        '<div style="font-weight:950;margin-bottom:10px">' + esc(name) + '</div>' +
        '<div class="fin-row" style="gap:10px;flex-wrap:wrap">' +
          '<div class="fin-field" style="flex:1;min-width:240px"><label>Saldo inicial (manual)</label><input id="cc-init" value="' + esc(String(base.initial || 0).replace(".", ",")) + '" placeholder="Ex.: 10000,00"></div>' +
          '<div class="fin-field" style="flex:1;min-width:240px"><label>Ajuste (diferenças)</label><input id="cc-adj" value="' + esc(String(base.adjust || 0).replace(".", ",")) + '" placeholder="Ex.: -250,00"></div>' +
        '</div>' +
        '<div class="fin-row" style="margin-top:10px">' +
          '<div class="fin-check"><span class="fin-muted">Saldo calculado agora:</span> <span class="fin-strong" id="cc-now">—</span></div>' +
        '</div>' +
        '<div class="fin-row fin-row--right" style="margin-top:12px">' +
          '<button class="fin-btn" data-close="1">Voltar</button>' +
          '<button class="fin-btn fin-btn--primary" id="cc-save" data-busylock="1">Salvar</button>' +
        '</div>' +
      '</div>'
    );

    function calcDraftBalance() {
      var original = S.cc.balances[ccSel] || { initial: 0, adjust: 0 };
      S.cc.balances[ccSel] = { initial: draft.initial, adjust: draft.adjust };
      var val = computeCCBalance(ccSel);
      S.cc.balances[ccSel] = original;
      return val;
    }

    function updateNow() {
      draft.initial = parseMoneyBR(m.q("#cc-init").value || "");
      draft.adjust = parseMoneyBR(m.q("#cc-adj").value || "");
      m.q("#cc-now").textContent = moneyBR(calcDraftBalance());
    }
    m.q("#cc-init").addEventListener("input", updateNow);
    m.q("#cc-adj").addEventListener("input", updateNow);
    updateNow();

    m.q("#cc-save").addEventListener("click", function () {
      S.cc.balances[ccSel] = { initial: draft.initial, adjust: draft.adjust };
      saveCC();
      toast("Saldo do centro atualizado ✅");
      m.close();
      renderTotals();
    });
  }

  // =========================
  // Transfer between centers modal
  // =========================
  function openTransferModal() {
    if (!guardPerm('canTransferCC', 'Transferência entre centros')) return;
    var items = centersWithReserve();
    if (!items.length) {
      toast("Centro de Custo não carregou.", "err");
      return;
    }
    var ccOpts = buildOptions(items, true, "Selecione…");
    var currentFrom = String(S.filters.centro || "");

    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">Transferir entre Centros de Custo</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body">' +
        '<div class="fin-row" style="gap:10px;flex-wrap:wrap">' +
          '<div class="fin-field" style="flex:1;min-width:260px"><label>De</label><select id="tr-from" ' + (currentFrom ? 'disabled' : '') + '>' + ccOpts + '</select></div>' +
          '<div class="fin-field" style="flex:1;min-width:260px"><label>Para</label><select id="tr-to">' + ccOpts + '</select></div>' +
        '</div>' +
        '<div class="fin-row" style="gap:10px;flex-wrap:wrap;margin-top:10px">' +
          '<div class="fin-field" style="flex:1;min-width:260px"><label>Valor</label><input id="tr-val" placeholder="Ex.: 1500,00"></div>' +
          '<div class="fin-field" style="flex:2;min-width:260px"><label>Obs (opcional)</label><input id="tr-note" placeholder="Ex.: ajuste caixa / repasse..."></div>' +
        '</div>' +
        '<div class="fin-row fin-row--right" style="margin-top:12px">' +
          '<button class="fin-btn" data-close="1">Voltar</button>' +
          '<button class="fin-btn fin-btn--primary" id="tr-save" data-busylock="1">Transferir</button>' +
        '</div>' +
        '<div class="fin-muted" style="margin-top:12px;font-weight:900">Obs.: isso aparece como saída no centro de origem e entrada no destino. Não contabiliza como receita nem despesa.</div>' +
      '</div>'
    );

    if (currentFrom && m.q("#tr-from")) m.q("#tr-from").value = currentFrom;

    m.q("#tr-save").addEventListener("click", function () {
      var from = currentFrom || m.q("#tr-from").value || "";
      var to = m.q("#tr-to").value || "";
      var val = parseMoneyBR(m.q("#tr-val").value || "");
      var note = String(m.q("#tr-note").value || "").trim();

      if (!from || !to || from === to) { toast("Selecione centros diferentes.", "err"); return; }
      if (!(val > 0)) { toast("Informe um valor maior que zero.", "err"); return; }

      S.cc.ledger.unshift({ ts: Date.now(), from: from, to: to, amount: val, note: note });
      saveCC();
      toast("Transferência registrada ✅");
      m.close();
      renderTotals();
    });
  }

  // =========================
  // Recorrência usada em lançamentos em lote
  // =========================
  function calcRecurringISO(startISO, freq, idx, weekday, monthday, month) {
    startISO = toISODate(startISO);
    if (!startISO) return "";
    freq = freq || "once";

    if (freq === "once") return startISO;

    if (freq === "weekly") {
      var wd = Number(weekday || 1); // 1..7 (seg..dom)
      var d = new Date(startISO + "T12:00:00");
      var jswd = d.getDay(); // 0..6 (dom..sab)
      var cur = (jswd === 0 ? 7 : jswd);
      var delta = wd - cur;
      if (delta < 0) delta += 7;
      var first = addDaysISO(startISO, delta);
      return addDaysISO(first, idx * 7);
    }

    if (freq === "monthly") {
      var day = Number(monthday || 1);
      return addMonthsISO(startISO, idx, day);
    }

    if (freq === "yearly") {
      var mo = Number(month || 1);
      var dayy = Number(monthday || 1);
      var baseY = String(startISO).slice(0, 4);
      var first = baseY + "-" + String(mo).padStart(2, "0") + "-" + String(dayy).padStart(2, "0");
      if (first < startISO) first = String(Number(baseY) + 1) + "-" + String(mo).padStart(2, "0") + "-" + String(dayy).padStart(2, "0");
      return addYearsISO(first, idx, mo, dayy);
    }

    return startISO;
  }

  // =========================
  // CSV (Receitas) + UPLOAD import
  // =========================
  function parseCSV(text) {
    var t = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var lines = t.split("\n").filter(function (l) { return l.trim() !== ""; });
    if (!lines.length) return [];

    var sep = (lines[0].indexOf(";") > -1) ? ";" : ",";
    function split(line) {
      var out = [];
      var cur = "";
      var inQ = false;
      for (var i = 0; i < line.length; i++) {
        var ch = line.charAt(i);
        if (ch === '"') {
          if (inQ && line.charAt(i + 1) === '"') { cur += '"'; i++; }
          else inQ = !inQ;
          continue;
        }
        if (!inQ && ch === sep) {
          out.push(cur);
          cur = "";
          continue;
        }
        cur += ch;
      }
      out.push(cur);
      return out.map(function (s) { return String(s || "").trim(); });
    }

    var header = split(lines[0]).map(function (h) { return h.toLowerCase(); });
    function firstHeaderIndex(names) {
      for (var ni = 0; ni < names.length; ni++) {
        var idx = header.indexOf(names[ni]);
        if (idx >= 0) return idx;
      }
      return -1;
    }
    var idxFav = firstHeaderIndex(["favorecido", "pagador", "nome", "compra", "conta/compra", "conta compra", "descricao", "descrição"]);
    var idxVal = firstHeaderIndex(["valor", "valor da compra", "valor compra"]);
    var idxDat = firstHeaderIndex(["data", "data da compra", "data compra", "dia", "dia do recebimento"]);

    var startRow = 1;
    if (idxFav < 0 || idxVal < 0 || idxDat < 0) {
      idxFav = 0; idxVal = 1; idxDat = 2;
      startRow = 0;
    }

    var rows = [];
    for (var r = startRow; r < lines.length; r++) {
      var cols = split(lines[r]);
      if (!cols.length) continue;
      rows.push({
        favorecido: cols[idxFav] || "",
        valor: cols[idxVal] || "",
        data: cols[idxDat] || ""
      });
    }
    return rows;
  }

  function downloadCSV(filename, rows) {
    var csv = rows.map(function (r) {
      return '"' + String(r.favorecido || "").replace(/"/g, '""') + '";' +
             '"' + String(r.valor || "").replace(/"/g, '""') + '";' +
             '"' + String(r.data || "").replace(/"/g, '""') + '"';
    }).join("\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      try { URL.revokeObjectURL(a.href); } catch (_) {}
      try { document.body.removeChild(a); } catch (_) {}
    }, 300);
  }

  function exportReceitasCSV() {
    var rows = [];
    for (var i = 0; i < (S.deals || []).length; i++) {
      var d = S.deals[i];
      var st = String(d.STAGE_ID || "");
      var isRec = (st === CFG.STAGES.REC_A_RECEBER || st === CFG.STAGES.REC_RECEBIDA);
      if (!isRec) continue;
      if (isBadFav(d[CFG.F.FAVORECIDO])) continue;

      var fav = String(d[CFG.F.FAVORECIDO] || "").trim();
      if (!fav) continue;

      var val = Number(d[CFG.F.VALOR_REAL] || 0) || Number(d[CFG.F.VALOR_PREV] || 0) || 0;
      var dat = toISODate(d[CFG.F.DATA_REAL] || d[CFG.F.DATA_PREV] || "");

      rows.push({ favorecido: fav, valor: String(val).replace(".", ","), data: dat });
    }

    downloadCSV("receitas.csv", rows);
  }

  function openImportCSVModal(onDone) {
    // ✅ FULL + UPLOAD
    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">IMPORTAR CSV</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body">' +
        '<div class="fin-muted" style="font-weight:900;margin-bottom:10px">Formato: <b>Nome/Pagador;Valor;Data</b> (com ou sem cabeçalho).</div>' +

        '<div class="fin-row" style="gap:10px;flex-wrap:wrap">' +
          '<div class="fin-field" style="flex:2;min-width:260px">' +
            '<label>Arquivo CSV</label>' +
            '<input id="csvfile" type="file" accept=".csv,text/csv" />' +
          '</div>' +
          '<div class="fin-field" style="flex:1;min-width:200px">' +
            '<label>Linhas detectadas</label>' +
            '<input id="csvcount" value="0" disabled />' +
          '</div>' +
        '</div>' +

        '<div class="fin-row fin-row--right" style="margin-top:12px">' +
          '<button class="fin-btn" data-close="1">Voltar</button>' +
          '<button class="fin-btn fin-btn--primary" id="csvok" data-busylock="1" disabled>Importar</button>' +
        '</div>' +

        '<div class="fin-muted" style="margin-top:10px;font-weight:900">O arquivo não é salvo. Só lemos e preenchemos as linhas.</div>' +
      '</div>',
      { full: true }
    );

    var parsed = [];

    function setCount(n) {
      try { m.q("#csvcount").value = String(n || 0); } catch (_) {}
      try { m.q("#csvok").disabled = !(n > 0); } catch (_) {}
    }

    m.q("#csvfile").addEventListener("change", function () {
      var f = (m.q("#csvfile").files || [])[0];
      if (!f) { parsed = []; setCount(0); return; }

      var reader = new FileReader();
      reader.onload = function () {
        try {
          var txt = String(reader.result || "");
          parsed = parseCSV(txt);
          setCount(parsed.length);
          if (!parsed.length) toast("CSV vazio ou inválido.", "err");
        } catch (e) {
          parsed = [];
          setCount(0);
          toast("Falha ao ler CSV: " + (e.message || String(e)), "err");
        }
      };
      reader.onerror = function () {
        parsed = [];
        setCount(0);
        toast("Falha ao ler o arquivo.", "err");
      };
      reader.readAsText(f, "utf-8");
    });

    m.q("#csvok").addEventListener("click", function () {
      if (!parsed.length) { toast("CSV vazio ou inválido.", "err"); return; }
      m.close();
      try { onDone(parsed); } catch (_) {}
    });
  }

  // =========================
  // Batch modal (full screen) — DESPESAS / RECEITAS separados
  // =========================
  function openBatch(kind) {
    if (!guardPerm('canBatch', 'Lote')) return;
    kind = String(kind || "DESPESA").toUpperCase();

    function mkRow(k) {
      return {
        centro: S.filters.centro || "",
        conta: "",
        categoria: "",
        favorecido: "",
        valor: "",
        obs: "",
        freq: k === "RECEITA" ? "once" : "once",
        weekday: "1",
        monthday: "",
        month: "",
        start: "",
        count: k === "RECEITA" ? "1" : "1"
      };
    }

    var rows = [];
    for (var r0 = 0; r0 < 15; r0++) rows.push(mkRow(kind));

    function calcDate(startISO, r, idx) {
      startISO = toISODate(startISO);
      if (!startISO) return "";
      var freq = String(r.freq || "once");
      if (freq === "weekly") return addDaysISO(startISO, idx * 7);
      if (freq === "monthly") return addMonthsISO(startISO, idx, r.monthday || null);
      if (freq === "yearly") return addYearsISO(startISO, idx, r.month || null, r.monthday || null);
      return idx === 0 ? startISO : addDaysISO(startISO, idx);
    }

    function importCSVIntoRows(label) {
      openImportCSVModal(function(importRows){
        for (var i = 0; i < importRows.length; i++) {
          if (!rows[i]) rows[i] = mkRow(kind);
          rows[i].favorecido = importRows[i].favorecido || "";
          rows[i].valor = importRows[i].valor || "";
          rows[i].start = toISODate(importRows[i].data || "");
          rows[i].freq = "once";
          rows[i].count = "1";
        }
        renderTable(m.q("#batch-host"));
        toast("CSV importado ✅ (preencheu as linhas para edição manual)");
      });
    }

    function renderTable(host) {
      var ccOpts = buildOptions(S.enums[CFG.F.CENTRO_CUSTO] || [], true, "—");
      var contaOpts = buildOptions(S.enums[CFG.F.CONTA] || [], true, "—");
      var catOpts = buildOptions(S.enums[CFG.F.CATEGORIA] || [], true, "—");
      var isRec = kind === "RECEITA";
      var showAccountFields = false;
      var partyLabel = isRec ? "PAGADOR" : "FAVORECIDO";
      var dateLabel = isRec ? "DIA DO RECEBIMENTO" : "DATA INICIAL";

      var html =
        '<div class="fin-row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px;justify-content:space-between">' +
          '<div class="fin-muted" style="font-weight:900">' + (isRec ? 'Receitas são lançamentos manuais, sem recorrência.' : 'Despesas podem ser avulsas ou recorrentes.') + '</div>' +
          '<div class="fin-row" style="gap:8px;flex-wrap:wrap">' +
            '<button class="fin-btn fin-btn--csv" id="b-import-rec">📥 IMPORTAR CSV</button>' + (isRec ? '<button class="fin-btn" id="b-export-rec">EXPORTAR CSV</button>' : '') +
          '</div>' +
        '</div>' +
        '<div class="fin-table-wrap"><table class="fin-batch-table"><thead><tr>' +
          (showAccountFields ? '<th style="min-width:180px">CENTRO</th><th style="min-width:180px">CONTA</th>' : '') +
          '<th style="min-width:180px">CATEGORIA</th>' +
          '<th style="min-width:240px">' + partyLabel + '</th>' +
          '<th style="min-width:130px">VALOR</th>' +
          '<th style="min-width:220px">OBS</th>';
      if (!isRec) {
        html += '<th style="min-width:150px">RECORRÊNCIA</th><th style="min-width:110px">DIA SEMANA</th><th style="min-width:90px">DIA</th><th style="min-width:90px">MÊS</th>';
      }
      html += '<th style="min-width:160px">' + dateLabel + '</th>';
      if (!isRec) html += '<th style="min-width:90px">QTD</th>';
      html += '<th style="min-width:110px"></th></tr></thead><tbody>';

      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var showWeek = (r.freq === "weekly");
        var showMonthDay = (r.freq === "monthly" || r.freq === "yearly");
        var showMonth = (r.freq === "yearly");
        html += '<tr data-i="' + i + '">' +
          (showAccountFields ? '<td><select class="fin-batch-sel" data-k="centro">' + ccOpts + '</select></td><td><select class="fin-batch-sel" data-k="conta">' + contaOpts + '</select></td>' : '') +
          '<td><select class="fin-batch-sel" data-k="categoria">' + catOpts + '</select></td>' +
          '<td><input class="fin-batch-inp" data-k="favorecido" value="' + esc(r.favorecido) + '" placeholder="' + (isRec ? 'Ex.: Cliente, operadora...' : 'Ex.: Light, aluguel...') + '"></td>' +
          '<td><input class="fin-batch-inp" data-k="valor" value="' + esc(r.valor) + '" placeholder="R$ 1.500,00"></td>' +
          '<td><textarea class="fin-batch-txt" data-k="obs" placeholder="Observações...">' + esc(r.obs) + '</textarea></td>';
        if (!isRec) {
          html += '<td><select class="fin-batch-sel" data-k="freq"><option value="once" ' + (r.freq === "once" ? "selected" : "") + '>Avulsa</option><option value="weekly" ' + (r.freq === "weekly" ? "selected" : "") + '>Semanal</option><option value="monthly" ' + (r.freq === "monthly" ? "selected" : "") + '>Mensal</option><option value="yearly" ' + (r.freq === "yearly" ? "selected" : "") + '>Anual</option></select></td>' +
            '<td><select class="fin-batch-sel" data-k="weekday" ' + (showWeek ? "" : "disabled") + '><option value="1" ' + (r.weekday === "1" ? "selected" : "") + '>Seg</option><option value="2" ' + (r.weekday === "2" ? "selected" : "") + '>Ter</option><option value="3" ' + (r.weekday === "3" ? "selected" : "") + '>Qua</option><option value="4" ' + (r.weekday === "4" ? "selected" : "") + '>Qui</option><option value="5" ' + (r.weekday === "5" ? "selected" : "") + '>Sex</option><option value="6" ' + (r.weekday === "6" ? "selected" : "") + '>Sáb</option><option value="7" ' + (r.weekday === "7" ? "selected" : "") + '>Dom</option></select></td>' +
            '<td><input class="fin-batch-inp" data-k="monthday" value="' + esc(r.monthday) + '" ' + (showMonthDay ? "" : "disabled") + ' placeholder="1..31"></td>' +
            '<td><input class="fin-batch-inp" data-k="month" value="' + esc(r.month) + '" ' + (showMonth ? "" : "disabled") + ' placeholder="1..12"></td>';
        }
        html += '<td><input class="fin-batch-inp" data-k="start" data-date="1" value="' + esc(toDisplayDate(r.start)) + '" placeholder="DD/MM/AAAA"></td>';
        if (!isRec) html += '<td><input class="fin-batch-inp" data-k="count" value="' + esc(r.count) + '" placeholder="1"></td>';
        html += '<td><button class="fin-btn fin-btn--danger" data-del="1" style="width:100%">Remover</button></td></tr>';
      }

      html += '</tbody></table></div>' +
        '<div class="fin-row" style="margin-top:10px;justify-content:space-between;flex-wrap:wrap">' +
          '<div class="fin-row" style="gap:8px;flex-wrap:wrap"><button class="fin-btn" id="b-add">+ Linha</button><button class="fin-btn" id="b-clean">Limpar linhas vazias</button></div>' +
          '<div class="fin-row fin-row--right" style="gap:8px;flex-wrap:wrap"><div class="fin-field" style="min-width:320px"><label>Competência (opc.)</label><select id="b-comp">' + buildOptions(S.enums[CFG.F.COMPETENCIA] || [], true, "Automático") + '</select></div><button class="fin-btn fin-btn--primary" id="b-create" data-busylock="1">Criar</button></div>' +
        '</div>';

      host.innerHTML = html;
      var trs = host.querySelectorAll("tr[data-i]");
      for (var ti = 0; ti < trs.length; ti++) {
        var idx = Number(trs[ti].getAttribute("data-i"));
        var rr = rows[idx];
        var s1 = trs[ti].querySelector('select[data-k="centro"]'); if (s1) s1.value = rr.centro || "";
        var s2 = trs[ti].querySelector('select[data-k="conta"]'); if (s2) s2.value = rr.conta || "";
        var s3 = trs[ti].querySelector('select[data-k="categoria"]'); if (s3) s3.value = rr.categoria || "";
      }

      host.querySelector("#b-add").addEventListener("click", function(){ rows.push(mkRow(kind)); renderTable(host); });
      host.querySelector("#b-clean").addEventListener("click", function(){ rows = rows.filter(function(r){ return String(r.favorecido || "").trim() || String(r.start || "").trim() || String(r.valor || "").trim() || String(r.obs || "").trim(); }); if (!rows.length) for (var z=0; z<15; z++) rows.push(mkRow(kind)); renderTable(host); });
      host.querySelector("#b-create").addEventListener("click", function(){ createBatch(host.querySelector("#b-comp").value || ""); });
      var btnExp = host.querySelector("#b-export-rec"); if (btnExp) btnExp.addEventListener("click", exportReceitasCSV);
      var btnImp = host.querySelector("#b-import-rec"); if (btnImp) btnImp.addEventListener("click", importCSVIntoRows);

      var tbody = host.querySelector("tbody");
      tbody.addEventListener("input", function(e){ var tr = safeClosest(e.target, "tr[data-i]"); if (!tr) return; var i = Number(tr.getAttribute("data-i")); var k = e.target.getAttribute("data-k"); if (!k) return; rows[i][k] = e.target.value; });
      tbody.addEventListener("change", function(e){ var tr = safeClosest(e.target, "tr[data-i]"); if (!tr) return; var i = Number(tr.getAttribute("data-i")); var k = e.target.getAttribute("data-k"); if (!k) return; rows[i][k] = e.target.value; if (k === "freq") renderTable(host); });
      tbody.addEventListener("click", function(e){ var btn = safeClosest(e.target, "[data-del]"); if (!btn) return; var tr = safeClosest(btn, "tr[data-i]"); var i = Number(tr.getAttribute("data-i")); rows.splice(i, 1); if (!rows.length) rows.push(mkRow(kind)); renderTable(host); });
    }

    function createBatch(compOverride) {
      setModalBusy(m.node, true, "Criando...");
      var created = 0;
      var tipoEnum = tipoEnumForKind(kind);
      if (!tipoEnum) { toast("Não encontrei enum de Tipo Financeiro para " + kind + ".", "err"); setModalBusy(m.node, false); return; }
      var ops = Promise.resolve();
      for (var i = 0; i < rows.length; i++) (function(r){
        ops = ops.then(function(){
          var fav = String(r.favorecido || "").trim();
          if (!fav) return;
          if (isBadFav(fav)) throw new Error((kind === "RECEITA" ? "Pagador" : "Favorecido") + " inválido (FILA/QUEUE): " + fav);
          var start = toISODate(r.start || "");
          if (!start) throw new Error("Linha sem data (DD/MM/AAAA): " + fav);
          var vprev = parseMoneyBR(r.valor || "");
          var cc = r.centro || "";
          var conta = r.conta || "";
          var cat = r.categoria || "";
          var obs = String(r.obs || "").trim();
          var stage = stageForKind(kind);
          var count = kind === "RECEITA" ? 1 : Math.max(1, parseInt(r.count || "1", 10) || 1);
          var p = Promise.resolve();
          for (var k = 0; k < count; k++) (function(idx){
            p = p.then(function(){
              var dt = kind === "RECEITA" ? start : calcDate(start, r, idx);
              var comp = compOverride || guessCompetenciaIdFromISO(dt);
              var fields = {};
              fields.TITLE = fullDealTitle(kind, fav, count > 1 ? ("RECORRENTE " + (idx + 1) + "/" + count) : "");
              fields.CATEGORY_ID = String(CFG.DEAL_CATEGORY_ID);
              fields.STAGE_ID = stage;
              fields[CFG.F.TIPO_FIN] = tipoEnum;
              if (comp) fields[CFG.F.COMPETENCIA] = comp;
              // Receitas não pedem CONTA. O centro de custo pode ser definido depois no recebimento.
              if (kind === "RECEITA" && cc) fields[CFG.F.CENTRO_CUSTO] = cc;
              if (cat) fields[CFG.F.CATEGORIA] = cat;
              fields[CFG.F.DATA_PREV] = dt;
              if (vprev || vprev === 0) fields[CFG.F.VALOR_PREV] = vprev;
              fields[CFG.F.FAVORECIDO] = fav;
              if (kind !== "RECEITA" && count > 1) {
                if (!r.__recSerie) r.__recSerie = "REC" + Date.now() + "_" + Math.floor(Math.random() * 100000);
                fields[CFG.F.OBS] = "Recorrência: " + r.freq + " • Item " + (idx + 1) + "/" + count + " • REC_SERIE:" + r.__recSerie + " • REC_IDX:" + (idx + 1) + "/" + count + " • REC_FREQ:" + r.freq + (obs ? " • " + obs : "");
              } else {
                fields[CFG.F.OBS] = obs;
              }
              return createDeal(fields).then(function(newId){
                created++;
                addDealLocal(fields, newId);
                if (kind !== "RECEITA" && count > 1 && r.__recSerie) {
                  if (!S.recurringIndex) S.recurringIndex = {};
                  if (!S.recurringIndex[r.__recSerie]) S.recurringIndex[r.__recSerie] = { id: r.__recSerie, kind: kind, freq: r.freq, total: count, createdAt: new Date().toISOString(), dealIds: [] };
                  S.recurringIndex[r.__recSerie].dealIds.push(String(newId));
                  scheduleInstitutionalPersist('recurringIndex');
                }
                logAudit('Criar lote', 'Deal #' + newId + ' criado via lote');
              });
            });
          })(k);
          return p;
        });
      })(rows[i]);
      ops.then(function(){ S.lastSyncAt = nowBR(); applyFilters(); toast("Lote criado ✅ (" + created + " itens)"); m.close(); }).catch(function(e){ toast("Falha no lote: " + (e.message || String(e)), "err"); }).finally(function(){ setModalBusy(m.node, false); });
    }

    var m = modal('<div class="fin-modal-head"><div class="fin-modal-title">' + esc(kind === "RECEITA" ? "LOTE — RECEITAS" : "LOTE — DESPESAS") + '</div><button class="fin-x" data-close="1">×</button></div><div class="fin-modal-body"><div id="batch-host"></div></div>', { full: true });
    renderTable(m.q("#batch-host"));
  }


  // =========================
  // Expenses manager modal
  // =========================
  function isExpenseDeal(d) {
    var st = String((d && d.STAGE_ID) || "");
    return st === CFG.STAGES.DESP_A_PAGAR || st === CFG.STAGES.DESP_PAGA;
  }

  function isRecurringLikeDeal(d) {
    var hay = String((d && d.TITLE) || "") + " " + String((d && d[CFG.F.OBS]) || "");
    return /RECORR[ÊE]NCIA|RECORRENTE|\b\d+\s*\/\s*\d+\b/i.test(hay);
  }

  function openExpensesManagerModal() {
    var q = "";
    var onlyRecurring = false;
    var stageFilter = "";

    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">DESPESAS — Gerenciar lançamentos</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body">' +
        '<div class="fin-row" style="gap:10px;flex-wrap:wrap;align-items:flex-end">' +
          '<div class="fin-field" style="flex:2;min-width:260px"><label>Buscar</label><input id="exp-q" placeholder="Favorecido, centro, conta, observação..."></div>' +
          '<div class="fin-field" style="flex:1;min-width:220px"><label>Status</label><select id="exp-stage"><option value="">Todas</option><option value="' + esc(CFG.STAGES.DESP_A_PAGAR) + '">A pagar</option><option value="' + esc(CFG.STAGES.DESP_PAGA) + '">Pagas</option></select></div>' +
          '<label class="fin-check"><input type="checkbox" id="exp-rec"> <span>Mostrar apenas recorrentes</span></label>' +
          '<button class="fin-btn fin-btn--primary" id="exp-batch-d">+ LOTE DESPESAS</button><button class="fin-btn" id="exp-refresh">Atualizar lista</button>' +
        '</div>' +
        '<div class="fin-muted" style="font-weight:900;margin-top:8px">Use este modal para localizar, editar, pagar ou excluir despesas já criadas. Despesas recorrentes antigas aparecem como itens individuais; novas recorrências passam a receber marcação no título/observação.</div>' +
        '<div id="exp-count" class="fin-muted" style="font-weight:900;margin-top:10px"></div>' +
        '<div class="fin-table-wrap" style="margin-top:10px;max-height:70vh;overflow:auto">' +
          '<table class="fin-table"><thead><tr>' +
            '<th style="width:76px">ID</th><th>Favorecido</th><th style="width:120px">Data Prev.</th><th style="width:120px">Valor</th><th style="width:150px">Status</th><th style="width:240px">Ações</th>' +
          '</tr></thead><tbody id="exp-tbody"></tbody></table>' +
        '</div>' +
        '<div class="fin-row fin-row--right" style="margin-top:12px"><button class="fin-btn" data-close="1">Fechar</button></div>' +
      '</div>',
      { full: true }
    );

    function renderExpenses() {
      var list = (S.deals || []).filter(isExpenseDeal);
      if (stageFilter) list = list.filter(function(d){ return String(d.STAGE_ID || "") === stageFilter; });
      if (onlyRecurring) list = list.filter(isRecurringLikeDeal);
      var needle = String(q || "").trim().toLowerCase();
      if (needle) {
        list = list.filter(function(d){
          var hay = [d.ID, d.TITLE, d[CFG.F.FAVORECIDO], d[CFG.F.OBS], enumName(CFG.F.CENTRO_CUSTO, d[CFG.F.CENTRO_CUSTO]), enumName(CFG.F.CONTA, d[CFG.F.CONTA]), enumName(CFG.F.CATEGORIA, d[CFG.F.CATEGORIA])].join(" ").toLowerCase();
          return hay.indexOf(needle) > -1;
        });
      }
      list.sort(function(a,b){
        var da = toISODate(a[CFG.F.DATA_PREV] || "") || "9999-99-99";
        var db = toISODate(b[CFG.F.DATA_PREV] || "") || "9999-99-99";
        return da < db ? -1 : da > db ? 1 : 0;
      });
      var tb = m.q("#exp-tbody");
      var count = m.q("#exp-count");
      if (count) count.textContent = "Despesas encontradas: " + list.length;
      if (!list.length) { tb.innerHTML = '<tr><td colspan="6" class="fin-muted">Nenhuma despesa encontrada.</td></tr>'; return; }
      var rows = [];
      for (var i = 0; i < list.length; i++) {
        var d = list[i];
        var canPay = String(d.STAGE_ID || "") === CFG.STAGES.DESP_A_PAGAR;
        rows.push('<tr>' +
          '<td class="fin-mono">#' + esc(d.ID) + '</td>' +
          '<td><div class="fin-strong">' + esc(d[CFG.F.FAVORECIDO] || d.TITLE || "") + '</div><div class="fin-small fin-muted">' + esc(enumName(CFG.F.CATEGORIA, d[CFG.F.CATEGORIA]) || "") + (isRecurringLikeDeal(d) ? ' • Recorrente' : '') + '</div></td>' +
          '<td class="fin-mono">' + esc(toDisplayDate(d[CFG.F.DATA_PREV] || "")) + '</td>' +
          '<td class="fin-mono">' + esc(moneyBR(d[CFG.F.VALOR_REAL] || d[CFG.F.VALOR_PREV])) + '</td>' +
          '<td>' + esc(stageName(d.STAGE_ID)) + '</td>' +
          '<td><div class="fin-actions-row">' +
            (canPay ? '<button class="fin-mini fin-mini--ok" data-exp-act="pay" data-id="' + esc(d.ID) + '">Pagar</button>' : '') +
            '<button class="fin-mini" data-exp-act="edit" data-id="' + esc(d.ID) + '">Editar</button>' +
            '<button class="fin-mini fin-mini--danger" data-exp-act="del" data-id="' + esc(d.ID) + '">Excluir</button>' +
          '</div></td>' +
        '</tr>');
      }
      tb.innerHTML = rows.join("");
    }

    m.q("#exp-q").addEventListener("input", function(e){ q = (e && e.target ? e.target.value : "") || ""; renderExpenses(); });
    m.q("#exp-stage").addEventListener("change", function(e){ stageFilter = (e && e.target ? e.target.value : "") || ""; renderExpenses(); });
    m.q("#exp-rec").addEventListener("change", function(e){ onlyRecurring = !!(e && e.target && e.target.checked); renderExpenses(); });
    m.q("#exp-refresh").addEventListener("click", function(){ renderExpenses(); });
    m.q("#exp-batch-d").addEventListener("click", function(){ openBatch("DESPESA"); });
    m.q("#exp-tbody").addEventListener("click", function(e){
      var btn = safeClosest(e.target, "[data-exp-act]");
      if (!btn) return;
      var id = btn.getAttribute("data-id");
      var act = btn.getAttribute("data-exp-act");
      var deal = null;
      for (var i = 0; i < S.deals.length; i++) if (String(S.deals[i].ID) === String(id)) { deal = S.deals[i]; break; }
      if (!deal) return;
      if (act === "edit") return openEditModal(deal);
      if (act === "pay") return openPayReceiveModal(deal);
      if (act === "del") return confirmDelete(deal);
    });

    renderExpenses();
  }

  // =========================
  // Credit card purchases modal (FULL)
  // =========================
  function parseCardPurchaseDate(d) {
    var obs = String((d && d[CFG.F.OBS]) || "");
    var m = obs.match(/Compra:\s*(\d{2}\/\d{2}\/\d{4})/i);
    if (m) return toISODate(m[1]);
    var m2 = obs.match(/COMPRA_ISO:\s*(\d{4}-\d{2}-\d{2})/i);
    if (m2) return m2[1];
    return toISODate(d && (d[CFG.F.DATA_PREV] || d[CFG.F.DATA_REAL] || ""));
  }

  function cardOpenDeals(cardId) {
    var out = [];
    for (var i = 0; i < (S.deals || []).length; i++) {
      var d = S.deals[i];
      if (String(d[CFG.F.CONTA] || "") !== String(cardId)) continue;
      if (String(d.STAGE_ID || "") !== CFG.STAGES.DESP_A_PAGAR) continue;
      out.push(d);
    }
    return out;
  }

  // =========================
  // Credit card purchases modal (FULL)
  // =========================
  function openCardModal() {
    if (!guardPerm('canCard', 'Cartão')) return;
    var contas = S.enums[CFG.F.CONTA] || [];
    if (!contas.length) {
      toast("Não encontrei enum de CONTA (UF_CRM_1770770758) para cartões.", "err");
      return;
    }

    var rows = [];
    for (var i = 0; i < 15; i++) rows.push({
      favorecido: "",
      valor: "",
      data: "",
      parcelas: "1",
      parcelaAtual: "1",
      categoria: "",
      obs: ""
    });

    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">CARTÕES — Lançar compras</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body">' +
        '<div class="fin-row" style="gap:10px;flex-wrap:wrap">' +
          '<div class="fin-field" style="min-width:300px;flex:1"><label>Cartão</label><select id="cc-card">' + cardOptionsFromContaEnums(true, "Selecione o cartão…") + '</select></div>' +
          '<div class="fin-field" style="min-width:300px;flex:1"><label>Competência (opc.)</label><select id="cc-comp">' + buildOptions(S.enums[CFG.F.COMPETENCIA] || [], true, "Automático") + '</select></div>' +
        '</div>' +

        '<div class="fin-panel" style="margin-top:10px"><div class="fin-panel-inner">' +
          '<div style="font-weight:950;margin-bottom:8px">Gestão do cartão</div>' +
          '<div class="fin-row" style="gap:10px;flex-wrap:wrap">' +
            '<div class="fin-field" style="min-width:180px"><label>Limite total</label><input id="card-limit-total" placeholder="R$ 0,00"></div>' +
            '<div class="fin-field" style="min-width:180px"><label>Limite disponível manual</label><input id="card-limit-avail" placeholder="R$ 0,00"></div>' +
            '<div class="fin-field" style="min-width:180px"><label>Fechamento manual</label><input id="card-close-date" data-date="1" placeholder="DD/MM/AAAA"></div>' +
            '<button class="fin-btn" id="card-save-limit" style="align-self:flex-end">Salvar limite</button>' +
            '<button class="fin-btn fin-btn--primary" id="card-close-btn" style="align-self:flex-end">Calcular fatura fechada</button>' +
          '</div>' +
          '<div id="card-summary" class="fin-muted" style="margin-top:8px;font-weight:900">Selecione um cartão para ver vencimento, corte, limite e fatura.</div>' +
        '</div></div>' +

        '<div class="fin-muted" style="font-weight:900;margin-top:8px">Cria DESPESAS “A PAGAR” no cartão selecionado. O vencimento de cada parcela é calculado pelo vencimento e dia de corte do cartão.</div>' +
        '<div style="overflow:auto;max-height:52vh;margin-top:10px">' +
          '<table class="fin-batch-table">' +
            '<thead><tr>' +
              '<th style="min-width:160px">CATEGORIA</th>' +
              '<th style="min-width:240px">CONTA/COMPRA</th>' +
              '<th style="min-width:120px">VALOR</th>' +
              '<th style="min-width:160px">DATA COMPRA</th>' +
              '<th style="min-width:110px">PARCELAS</th>' +
              '<th style="min-width:150px">PARCELA INICIAL</th>' +
              '<th style="min-width:220px">OBS (opc.)</th>' +
              '<th style="min-width:110px"></th>' +
            '</tr></thead><tbody id="cc-tb"></tbody>' +
          '</table>' +
        '</div>' +
        '<div class="fin-row" style="justify-content:space-between;margin-top:10px;flex-wrap:wrap">' +
          '<div class="fin-row" style="gap:8px;flex-wrap:wrap"><button class="fin-btn" id="cc-add">+ Linha</button><button class="fin-btn fin-btn--csv" id="cc-import">📥 IMPORTAR CSV</button></div>' +
          '<div class="fin-row fin-row--right" style="gap:8px;flex-wrap:wrap">' +
            '<button class="fin-btn" data-close="1">Voltar</button>' +
            '<button class="fin-btn fin-btn--primary" id="cc-save" data-busylock="1">Criar compras</button>' +
          '</div>' +
        '</div>' +
      '</div>',
      { full: true }
    );

    function selectedCardName() {
      var card = m.q("#cc-card") ? m.q("#cc-card").value : "";
      return card ? (enumName(CFG.F.CONTA, card) || card) : "";
    }

    function updateCardSummary() {
      var card = m.q("#cc-card").value || "";
      var name = selectedCardName();
      var cfg = cardConfigByName(name);
      var limits = S.cardLimits[name] || { total: 0, available: 0 };
      if (m.q("#card-limit-total")) m.q("#card-limit-total").value = limits.total ? moneyBR(limits.total) : "";
      if (m.q("#card-limit-avail")) m.q("#card-limit-avail").value = limits.available ? moneyBR(limits.available) : "";
      var open = card ? cardOpenDeals(card) : [];
      var openTotal = 0;
      for (var i = 0; i < open.length; i++) openTotal += Number(open[i][CFG.F.VALOR_PREV] || open[i][CFG.F.VALOR_REAL] || 0) || 0;
      if (!name) { m.q("#card-summary").textContent = "Selecione um cartão para ver vencimento, corte, limite e fatura."; return; }
      m.q("#card-summary").textContent = name + (cfg ? (" • Vencimento dia " + String(cfg.vencimento).padStart(2, "0") + " • Corte dia " + String(cfg.corte).padStart(2, "0")) : "") + " • Em aberto: " + moneyBR(openTotal) + " • Limite disponível manual: " + moneyBR(limits.available || 0);
    }

    function renderRows() {
      var catOpts = buildOptions(S.enums[CFG.F.CATEGORIA] || [], true, "—");
      var tb = m.q("#cc-tb");
      var html = "";
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        html += '<tr data-i="' + i + '">' +
          '<td><select class="fin-batch-sel" data-k="categoria">' + catOpts + '</select></td>' +
          '<td><input class="fin-batch-inp" data-k="favorecido" value="' + esc(r.favorecido) + '" placeholder="Ex.: Adobe, mercado, combustível"></td>' +
          '<td><input class="fin-batch-inp" data-k="valor" value="' + esc(r.valor) + '" placeholder="R$ 1.500,00"></td>' +
          '<td><input class="fin-batch-inp" data-k="data" data-date="1" value="' + esc(toDisplayDate(r.data)) + '" placeholder="DD/MM/AAAA"></td>' +
          '<td><input class="fin-batch-inp" data-k="parcelas" value="' + esc(r.parcelas) + '" placeholder="1"></td>' +
          '<td><input class="fin-batch-inp" data-k="parcelaAtual" value="' + esc(r.parcelaAtual) + '" placeholder="1"></td>' +
          '<td><input class="fin-batch-inp" data-k="obs" value="' + esc(r.obs) + '" placeholder="opcional"></td>' +
          '<td><button class="fin-btn fin-btn--danger" data-del="1" style="width:100%">Remover</button></td>' +
        '</tr>';
      }
      tb.innerHTML = html;

      var trs = tb.querySelectorAll("tr[data-i]");
      for (var t = 0; t < trs.length; t++) {
        var idx = Number(trs[t].getAttribute("data-i"));
        var rr = rows[idx];
        var s2 = trs[t].querySelector('select[data-k="categoria"]'); if (s2) s2.value = rr.categoria || "";
      }
    }

    renderRows();
    updateCardSummary();

    m.q("#cc-card").addEventListener("change", updateCardSummary);
    m.q("#card-save-limit").addEventListener("click", function(){
      var name = selectedCardName();
      if (!name) { toast("Selecione o cartão.", "err"); return; }
      S.cardLimits[name] = {
        total: parseMoneyBR(m.q("#card-limit-total").value || ""),
        available: parseMoneyBR(m.q("#card-limit-avail").value || "")
      };
      saveCards();
      updateCardSummary();
      toast("Limite salvo ✅");
    });
    m.q("#card-close-btn").addEventListener("click", function(){
      var card = m.q("#cc-card").value || "";
      var name = selectedCardName();
      var close = toISODate(m.q("#card-close-date").value || "");
      if (!card || !name) { toast("Selecione o cartão.", "err"); return; }
      if (!close) { toast("Informe a data de fechamento.", "err"); return; }
      var list = cardOpenDeals(card).filter(function(d){
        var pd = parseCardPurchaseDate(d);
        return pd && pd <= close;
      });
      var total = 0;
      for (var i = 0; i < list.length; i++) total += Number(list[i][CFG.F.VALOR_PREV] || list[i][CFG.F.VALOR_REAL] || 0) || 0;
      var due = calcCardDueDateISO(close, name);
      S.cardStatements.unshift({ at: new Date().toISOString(), card: name, closeDate: close, dueDate: due, amount: total, count: list.length });
      saveCards();
      m.q("#card-summary").textContent = name + " • Fatura fechada em " + toDisplayDate(close) + " • Vencimento " + toDisplayDate(due) + " • Valor: " + moneyBR(total) + " • Itens: " + list.length;
      toast("Fatura calculada ✅ " + moneyBR(total));
    });

    m.q("#cc-add").addEventListener("click", function () {
      rows.push({ favorecido: "", valor: "", data: "", parcelas: "1", parcelaAtual: "1", categoria: "", obs: "" });
      renderRows();
    });

    m.q("#cc-import").addEventListener("click", function(){
      openImportCSVModal(function(importRows){
        for (var i = 0; i < importRows.length; i++) {
          if (!rows[i]) rows[i] = { favorecido: "", valor: "", data: "", parcelas: "1", parcelaAtual: "1", categoria: "", obs: "" };
          rows[i].favorecido = importRows[i].favorecido || "";
          rows[i].valor = importRows[i].valor || "";
          rows[i].data = toISODate(importRows[i].data || "");
          rows[i].parcelas = rows[i].parcelas || "1";
          rows[i].parcelaAtual = rows[i].parcelaAtual || "1";
        }
        renderRows();
        toast("CSV importado ✅ (preencheu as compras para edição manual)");
      });
    });

    m.q("#cc-tb").addEventListener("input", function (e) {
      var tr = safeClosest(e.target, "tr[data-i]");
      if (!tr) return;
      var i = Number(tr.getAttribute("data-i"));
      var k = e.target.getAttribute("data-k");
      if (!k) return;
      rows[i][k] = e.target.value;
    });
    m.q("#cc-tb").addEventListener("change", function (e) {
      var tr = safeClosest(e.target, "tr[data-i]");
      if (!tr) return;
      var i = Number(tr.getAttribute("data-i"));
      var k = e.target.getAttribute("data-k");
      if (!k) return;
      rows[i][k] = e.target.value;
    });
    m.q("#cc-tb").addEventListener("click", function (e) {
      var btn = safeClosest(e.target, "[data-del]");
      if (!btn) return;
      var tr = safeClosest(btn, "tr[data-i]");
      var i = Number(tr.getAttribute("data-i"));
      rows.splice(i, 1);
      if (!rows.length) rows.push({ favorecido: "", valor: "", data: "", parcelas: "1", parcelaAtual: "1", categoria: "", obs: "" });
      renderRows();
    });

    m.q("#cc-save").addEventListener("click", function () {
      var card = m.q("#cc-card").value || "";
      if (!card) { toast("Selecione o cartão.", "err"); return; }

      var tipoEnum = tipoEnumForKind("DESPESA");
      if (!tipoEnum) { toast("Enum de Tipo (DESPESA) não encontrado.", "err"); return; }

      var compOverride = m.q("#cc-comp").value || "";
      var cardName = enumName(CFG.F.CONTA, card) || card;

      setModalBusy(m.node, true, "Criando...");

      var created = 0;
      var ops = Promise.resolve();

      rows.forEach(function (r) {
        ops = ops.then(function () {
          var fav = String(r.favorecido || "").trim();
          if (!fav) return;
          if (isBadFav(fav)) throw new Error("Conta/compra inválida: " + fav);

          var dt0 = toISODate(r.data || "");
          if (!dt0) throw new Error("Linha sem data (DD/MM/AAAA). Compra: " + fav);

          var v = parseMoneyBR(r.valor || "");
          var parcelas = Math.max(1, parseInt(r.parcelas || "1", 10) || 1);
          var parcIni = Math.max(1, parseInt(r.parcelaAtual || "1", 10) || 1);
          if (parcIni > parcelas) parcIni = parcelas;

          var cat = r.categoria || "";
          var obs = String(r.obs || "").trim();

          var p = Promise.resolve();
          for (var k = 0; k < parcelas; k++) (function (idx) {
            p = p.then(function () {
              var parc = parcIni + idx;
              if (parc > parcelas) return;

              var purchaseDt = addMonthsISO(dt0, idx, null);
              var dueDt = calcCardDueDateISO(purchaseDt, cardName);
              var comp = compOverride || guessCompetenciaIdFromISO(dueDt);

              var fields = {};
              fields.TITLE = fullDealTitle("DESPESA", fav, "Cartão " + parc + "/" + parcelas);
              fields.CATEGORY_ID = String(CFG.DEAL_CATEGORY_ID);
              fields.STAGE_ID = CFG.STAGES.DESP_A_PAGAR;
              fields[CFG.F.TIPO_FIN] = tipoEnum;
              if (comp) fields[CFG.F.COMPETENCIA] = comp;
              fields[CFG.F.CONTA] = card;
              if (cat) fields[CFG.F.CATEGORIA] = cat;
              fields[CFG.F.DATA_PREV] = dueDt;
              if (v || v === 0) fields[CFG.F.VALOR_PREV] = v;
              fields[CFG.F.FAVORECIDO] = fav;
              fields[CFG.F.OBS] = "Cartão: " + cardName + " • Compra: " + toDisplayDate(purchaseDt) + " • Venc. fatura: " + toDisplayDate(dueDt) + " • Parcela " + parc + "/" + parcelas + " • COMPRA_ISO:" + purchaseDt + (obs ? " • " + obs : "");

              return createDeal(fields).then(function (newId) {
                created++;
                addDealLocal(fields, newId);
                logAudit('Criar cartão', 'Deal #' + newId + ' criado via cartão');
              });
            });
          })(k);

          return p;
        });
      });

      ops.then(function () {
        S.lastSyncAt = nowBR();
        applyFilters();
        scheduleFinanceReminderSync();
        updateCardSummary();
        toast("Compras criadas ✅ (" + created + " parcelas)");
        m.close();
      }).catch(function (e) {
        toast("Falha no cartão: " + (e.message || String(e)), "err");
      }).finally(function () {
        setModalBusy(m.node, false);
      });
    });
  }

  function getPagedList() {
    var list = Array.isArray(S.filtered) ? S.filtered : [];
    var pageSize = Number(S.pagination.pageSize || 50) || 50;
    var maxPage = Math.max(1, Math.ceil(list.length / pageSize));
    if (S.pagination.page > maxPage) S.pagination.page = maxPage;
    if (S.pagination.page < 1) S.pagination.page = 1;
    var start = (S.pagination.page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }

  function renderPager() {
    var host = el('#fin-pager');
    if (!host) return;
    var total = (S.filtered || []).length;
    var pageSize = Number(S.pagination.pageSize || 50) || 50;
    var maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (S.pagination.page > maxPage) S.pagination.page = maxPage;
    if (S.pagination.page < 1) S.pagination.page = 1;
    var start = total ? ((S.pagination.page - 1) * pageSize + 1) : 0;
    var end = Math.min(total, S.pagination.page * pageSize);
    host.innerHTML =
      '<div class="fin-row" style="justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<div class="fin-row" style="gap:8px;align-items:center;flex-wrap:wrap">' +
          '<span class="fin-muted">Exibindo ' + esc(String(start)) + '–' + esc(String(end)) + ' de ' + esc(String(total)) + '</span>' +
          '<label class="fin-muted">Página</label>' +
          '<button class="fin-btn" id="pg-prev"' + (S.pagination.page <= 1 ? ' disabled' : '') + '>◀</button>' +
          '<span class="fin-strong">' + esc(String(S.pagination.page)) + '/' + esc(String(maxPage)) + '</span>' +
          '<button class="fin-btn" id="pg-next"' + (S.pagination.page >= maxPage ? ' disabled' : '') + '>▶</button>' +
        '</div>' +
        '<div class="fin-row" style="gap:8px;align-items:center;flex-wrap:wrap">' +
          '<label class="fin-muted" for="pg-size">Linhas</label>' +
          '<select id="pg-size">' +
            '<option value="25"' + (pageSize===25?' selected':'') + '>25</option>' +
            '<option value="50"' + (pageSize===50?' selected':'') + '>50</option>' +
            '<option value="100"' + (pageSize===100?' selected':'') + '>100</option>' +
            '<option value="300"' + (pageSize===300?' selected':'') + '>300</option>' +
          '</select>' +
        '</div>' +
      '</div>';
    var prev = el('#pg-prev'), nxt = el('#pg-next'), size = el('#pg-size');
    if (prev) prev.onclick = function(){ if (S.pagination.page > 1) { S.pagination.page--; renderAfterFilter(); } };
    if (nxt) nxt.onclick = function(){ var mp = Math.max(1, Math.ceil(((S.filtered||[]).length)/pageSize)); if (S.pagination.page < mp) { S.pagination.page++; renderAfterFilter(); } };
    if (size) size.onchange = function(){ S.pagination.pageSize = Number(size.value || 50) || 50; S.pagination.page = 1; renderAfterFilter(); };
  }

  function cloneCurrentFilters() {
    return {
      q: String(S.filters.q || ''),
      centro: String(S.filters.centro || ''),
      competencia: String(S.filters.competencia || ''),
      conta: String(S.filters.conta || ''),
      stageId: String(S.filters.stageId || ''),
      showPayables: !!S.filters.showPayables,
      showReceivables: !!S.filters.showReceivables
    };
  }

  function applyFilterPreset(preset) {
    if (!preset || !preset.filters) return;
    S.filters = cloneCurrentFilters();
    var f = preset.filters || {};
    S.filters.q = String(f.q || '');
    S.filters.centro = String(f.centro || '');
    S.filters.competencia = String(f.competencia || '');
    S.filters.conta = String(f.conta || '');
    S.filters.stageId = String(f.stageId || '');
    S.filters.showPayables = f.showPayables !== false;
    S.filters.showReceivables = f.showReceivables !== false;
    applyFilters();
    toast('Filtro aplicado: ' + String(preset.name || 'preset'));
  }

  function openFilterPresetsModal() {
    var items = S.filterPresets || [];
    var body = items.length ? items.map(function(it, idx){
      return '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)">' +
        '<div class="fin-row" style="justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
          '<div><div class="fin-strong">' + esc(it.name || ('Filtro ' + (idx+1))) + '</div><div class="fin-muted" style="font-size:12px">Payables: ' + (it.filters && it.filters.showPayables ? 'sim' : 'não') + ' • Receivables: ' + (it.filters && it.filters.showReceivables ? 'sim' : 'não') + '</div></div>' +
          '<div class="fin-row" style="gap:8px">' +
            '<button class="fin-btn" data-preset-act="apply" data-preset-idx="' + idx + '">Aplicar</button>' +
            '<button class="fin-btn fin-btn--danger" data-preset-act="del" data-preset-idx="' + idx + '">Excluir</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('') : '<div class="fin-muted">Nenhum filtro salvo ainda.</div>';

    var m = modal('<div class="fin-modal-head"><div class="fin-modal-title">Filtros salvos</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body">' + body +
      '<div class="fin-row fin-row--right" style="margin-top:12px;gap:8px"><button class="fin-btn" data-close="1">Fechar</button></div>' +
      '</div>');
    m.node.addEventListener('click', function(ev){
      var t = safeClosest(ev.target, '[data-preset-act]');
      if (!t) return;
      var idx = Number(t.getAttribute('data-preset-idx'));
      if (!isFinite(idx) || idx < 0 || idx >= S.filterPresets.length) return;
      var act = t.getAttribute('data-preset-act');
      if (act === 'apply') {
        applyFilterPreset(S.filterPresets[idx]);
        m.close();
      } else if (act === 'del') {
        var nm = (S.filterPresets[idx] && S.filterPresets[idx].name) || 'filtro';
        if (!confirm('Excluir o filtro salvo "' + nm + '"?')) return;
        S.filterPresets.splice(idx, 1);
        saveFilterPresets();
        m.close();
        openFilterPresetsModal();
      }
    });
  }

  function saveCurrentFilterPreset() {
    var name = prompt('Nome do filtro salvo:', 'Filtro ' + new Date().toLocaleString('pt-BR'));
    if (!name) return;
    S.filterPresets.unshift({ name: String(name).trim(), filters: cloneCurrentFilters(), at: new Date().toISOString() });
    if (S.filterPresets.length > 50) S.filterPresets.length = 50;
    saveFilterPresets();
    toast('Filtro salvo.');
  }

  function resetAllFilters() {
    S.filters = { q:'', centro:'', competencia:'', conta:'', stageId:'', showPayables:true, showReceivables:true };
    applyFilters();
    toast('Filtros limpos.');
  }

  function openAuditModal() {
    var items = S.audit || [];
    var body = items.length
      ? '<div style="max-height:65vh;overflow:auto">' + items.slice(0,120).map(function(it){
          var when = '';
          try { when = new Date(it.at).toLocaleString('pt-BR'); } catch(_) { when = it.at || ''; }
          return '<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)">' +
            '<div class="fin-strong">' + esc(it.action || '') + '</div>' +
            '<div class="fin-muted" style="margin-top:4px">' + esc(it.detail || '') + '</div>' +
            '<div class="fin-muted" style="margin-top:4px;font-size:12px">' + esc(when) + '</div>' +
          '</div>';
        }).join('') + '</div>'
      : '<div class="fin-muted">Sem auditoria local registrada ainda.</div>';
    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">Auditoria local</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body">' + body +
        '<div class="fin-row fin-row--right" style="margin-top:12px;gap:8px">' +
          '<button class="fin-btn" id="audit-export">Exportar CSV</button>' +
          '<button class="fin-btn" id="audit-clear">Limpar auditoria</button>' +
          '<button class="fin-btn" data-close="1">Fechar</button>' +
        '</div>' +
      '</div>'
    );
    var exp = m.q('#audit-export');
    if (exp) exp.addEventListener('click', function(){
      var rows = ['data,acao,detalhe'];
      for (var i = 0; i < (S.audit || []).length; i++) {
        var it = S.audit[i] || {};
        function q(v){ v = String(v == null ? '' : v); return '"' + v.replace(/"/g, '""') + '"'; }
        rows.push([q(it.at || ''), q(it.action || ''), q(it.detail || '')].join(','));
      }
      var blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'auditoria_financeiro.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function(){ try { URL.revokeObjectURL(a.href); } catch(_){} }, 500);
    });
    var clr = m.q('#audit-clear');
    if (clr) clr.addEventListener('click', function(){
      S.audit = [];
      saveAudit();
      m.close();
      toast('Auditoria local limpa.');
    });
  }

  function selectedIdsArray() {
    var out = [];
    for (var id in S.selectedIds) if (S.selectedIds.hasOwnProperty(id) && S.selectedIds[id]) out.push(String(id));
    return out;
  }

  function clearSelection() {
    S.selectedIds = {};
  }

  function syncSelectAllState() {
    var box = el('#fin-select-all');
    if (!box) return;
    var list = getPagedList();
    var total = list.length;
    var count = 0;
    for (var i = 0; i < total; i++) if (S.selectedIds[String(list[i].ID)]) count++;
    box.checked = !!total && count === total;
    box.indeterminate = count > 0 && count < total;
  }

  function openBulkActionsModal() {
    if (!guardPerm('canBulkEdit', 'Ações em massa')) return;
    var ids = selectedIdsArray();
    if (!ids.length) {
      toast('Selecione ao menos 1 item na tabela.', 'err');
      return;
    }

    var ccOpts = buildOptions(S.enums[CFG.F.CENTRO_CUSTO] || [], true, '—');
    var catOpts = buildOptions(S.enums[CFG.F.CATEGORIA] || [], true, '—');
    var today = toISODate(new Date().toLocaleDateString('pt-BR'));

    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">Ações em massa</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body">' +
        '<div class="fin-strong" style="margin-bottom:10px">Itens selecionados: ' + ids.length + '</div>' +
        '<div class="fin-field"><label>Ação</label><select id="bulk-action">' +
          '<option value="stage">Marcar pagos/recebidos</option>' +
          '<option value="centro">Alterar centro</option>' +
          '<option value="categoria">Alterar categoria</option>' +
          '<option value="delete">Excluir selecionados</option>' +
        '</select></div>' +
        '<div id="bulk-stage-box"><div class="fin-field"><label>Data real</label><input id="bulk-data" type="date" value="' + esc(today) + '"></div></div>' +
        '<div id="bulk-centro-box" style="display:none"><div class="fin-field"><label>Centro</label><select id="bulk-centro">' + ccOpts + '</select></div></div>' +
        '<div id="bulk-categoria-box" style="display:none"><div class="fin-field"><label>Categoria</label><select id="bulk-categoria">' + catOpts + '</select></div></div>' +
        '<div class="fin-row fin-row--right" style="margin-top:12px">' +
          '<button class="fin-btn" data-close="1">Cancelar</button>' +
          '<button class="fin-btn fin-btn--primary" id="bulk-go" data-busylock="1">Aplicar</button>' +
        '</div>' +
      '</div>'
    );

    var sel = m.q('#bulk-action');
    function syncBulkBoxes() {
      var v = sel.value;
      m.q('#bulk-stage-box').style.display = (v === 'stage') ? '' : 'none';
      m.q('#bulk-centro-box').style.display = (v === 'centro') ? '' : 'none';
      m.q('#bulk-categoria-box').style.display = (v === 'categoria') ? '' : 'none';
    }
    sel.addEventListener('change', syncBulkBoxes);
    syncBulkBoxes();

    m.q('#bulk-go').addEventListener('click', function(){
      var action = sel.value;
      var chain = Promise.resolve();
      var updated = 0;
      setModalBusy(m.node, true, 'Aplicando...');

      ids.forEach(function(id){
        chain = chain.then(function(){
          var idx = findDealIndexById(id);
          if (idx < 0) return;
          var deal = S.deals[idx];
          if (action === 'delete') {
            return deleteDeal(id).then(function(){ removeDealLocal(id); updated++; logAudit('Ação em massa: excluir', 'Deal #' + id + ' excluído'); });
          }
          if (action === 'centro') {
            var centro = String(m.q('#bulk-centro').value || '');
            var fieldsCentro = {}; fieldsCentro[CFG.F.CENTRO_CUSTO] = centro;
            return updateDeal(id, fieldsCentro).then(function(){ mergeDealPatch(id, fieldsCentro); updated++; logAudit('Ação em massa: centro', 'Deal #' + id + ' -> centro alterado'); });
          }
          if (action === 'categoria') {
            var categoria = String(m.q('#bulk-categoria').value || '');
            var fieldsCategoria = {}; fieldsCategoria[CFG.F.CATEGORIA] = categoria;
            return updateDeal(id, fieldsCategoria).then(function(){ mergeDealPatch(id, fieldsCategoria); updated++; logAudit('Ação em massa: categoria', 'Deal #' + id + ' -> categoria alterada'); });
          }
          if (action === 'stage') {
            var next = nextStageByCurrent(deal.STAGE_ID);
            if (!next) return;
            var fieldsStage = { STAGE_ID: next };
            fieldsStage[CFG.F.DATA_REAL] = String(m.q('#bulk-data').value || '');
            fieldsStage[CFG.F.VALOR_REAL] = Number(deal[CFG.F.VALOR_REAL] || 0) || Number(deal[CFG.F.VALOR_PREV] || 0) || 0;
            return updateDeal(id, fieldsStage).then(function(){ mergeDealPatch(id, fieldsStage); updated++; logAudit('Ação em massa: estágio', 'Deal #' + id + ' -> ' + stageName(next)); });
          }
        });
      });

      chain.then(function(){
        S.lastSyncAt = nowBR();
        clearSelection();
        applyFilters();
        toast('Ação em massa aplicada ✅ (' + updated + ')');
        m.close();
      }).catch(function(e){
        toast('Falha na ação em massa: ' + (e.message || String(e)), 'err');
      }).finally(function(){
        setModalBusy(m.node, false);
      });
    });
  }

  // =========================
  // Table render
  // =========================
  function renderTable() {
    var tb = el("#fin-tbody");
    if (!tb) return;

    var list = getPagedList();
    if (!list.length) {
      tb.innerHTML = '<tr><td colspan="12" class="fin-muted">Nenhum item encontrado.</td></tr>';
      syncSelectAllState();
      return;
    }

    var rows = [];
    for (var i = 0; i < list.length && i < CFG.PAGE_SIZE; i++) {
      var d = list[i];
      if (isTransferRow(d)) {
        var direction = d.__TRANSFER_SIGN_LABEL || "Transferência";
        var note = d.__TRANSFER_NOTE ? (" • " + d.__TRANSFER_NOTE) : "";
        rows.push(
          "<tr>" +
            '<td></td>' +
            '<td class="fin-mono">' + esc(d.ID) + '</td>' +
            '<td><div class="fin-strong">' + esc(direction) + '</div><div class="fin-small fin-muted">Transferência de saldo' + esc(note) + '</div></td>' +
            '<td>' + esc(centerNameById(d[CFG.F.CENTRO_CUSTO])) + '</td>' +
            '<td>Transferência</td>' +
            '<td>—</td>' +
            '<td class="fin-mono">' + esc(toDisplayDate(d[CFG.F.DATA_PREV] || "")) + '</td>' +
            '<td class="fin-mono">' + esc(toDisplayDate(d[CFG.F.DATA_REAL] || "")) + '</td>' +
            '<td class="fin-mono">—</td>' +
            '<td class="fin-mono">' + esc(moneyBR(d.__TRANSFER_AMOUNT || 0)) + '</td>' +
            '<td>Não contabiliza</td>' +
            '<td><div class="fin-actions-row"><span class="fin-muted">Lançamento local</span><button class="fin-mini fin-mini--danger" data-act="del-transfer" data-ts="' + esc(String(d.__TRANSFER_TS || "")) + '">Excluir</button></div></td>' +
          '</tr>'
        );
        continue;
      }
      var fav = d[CFG.F.FAVORECIDO] || d.TITLE || "";
      var checked = !!S.selectedIds[String(d.ID)];

      var st = String(d.STAGE_ID || "");
      var canCheck = (st === CFG.STAGES.DESP_A_PAGAR) || (st === CFG.STAGES.REC_A_RECEBER);
      var chkLabel = (st === CFG.STAGES.DESP_A_PAGAR) ? "Pagar" : ((st === CFG.STAGES.REC_A_RECEBER) ? "Receber" : "");
      var chk = canCheck
        ? '<button class="fin-mini fin-mini--ok" data-act="chk" data-id="' + esc(d.ID) + '">' + esc(chkLabel) + '</button>'
        : '<span class="fin-muted">—</span>';

      var obsTxt = String(d[CFG.F.OBS] || '').trim();
      var obsBtn = obsTxt ? '<button class="fin-mini" data-act="obs" data-id="' + esc(d.ID) + '">OBS</button>' : '<span class="fin-muted">sem OBS</span>';

      rows.push(
        "<tr>" +
          '<td><input type="checkbox" data-sel-id="' + esc(d.ID) + '" ' + (checked ? 'checked' : '') + '></td>' +
          '<td class="fin-mono">#' + esc(d.ID) + "</td>" +
          "<td><div class=\"fin-strong\">" + esc(fav) + "</div><div class=\"fin-small fin-muted\">" + esc(enumName(CFG.F.CATEGORIA, d[CFG.F.CATEGORIA]) || "") + "</div></td>" +
          "<td>" + esc(centerNameById(d[CFG.F.CENTRO_CUSTO]) || "") + "</td>" +
          "<td>" + esc(enumName(CFG.F.TIPO_FIN, d[CFG.F.TIPO_FIN]) || "") + "</td>" +
          "<td>" + esc(enumName(CFG.F.COMPETENCIA, d[CFG.F.COMPETENCIA]) || "") + "</td>" +
          '<td class="fin-mono">' + esc(toDisplayDate(d[CFG.F.DATA_PREV] || "")) + "</td>" +
          '<td class="fin-mono">' + esc(toDisplayDate(d[CFG.F.DATA_REAL] || "")) + "</td>" +
          '<td class="fin-mono">' + esc(moneyBR(d[CFG.F.VALOR_PREV])) + "</td>" +
          '<td class="fin-mono">' + esc(moneyBR(d[CFG.F.VALOR_REAL])) + "</td>" +
          "<td>" + esc(stageName(d.STAGE_ID)) + "</td>" +
          "<td>" +
            '<div class="fin-actions-row">' +
              chk +
              '<button class="fin-mini" data-act="edit" data-id="' + esc(d.ID) + '">Editar</button>' +
              obsBtn +
              '<button class="fin-mini fin-mini--danger" data-act="del" data-id="' + esc(d.ID) + '">Excluir</button>' +
            "</div>" +
          "</td>" +
        "</tr>"
      );
    }

    tb.innerHTML = rows.join("");
    syncSelectAllState();

    tb.onchange = function(ev) {
      var c = safeClosest(ev.target, '[data-sel-id]');
      if (!c) return;
      var id = c.getAttribute('data-sel-id');
      if (!id) return;
      S.selectedIds[String(id)] = !!c.checked;
      renderTotals();
      syncSelectAllState();
    };

    tb.onclick = function (ev) {
      var t = safeClosest(ev.target, "[data-act]");
      if (!t) return;
      var id = t.getAttribute("data-id");
      var act = t.getAttribute("data-act");

      if (act === "del-transfer") {
        var ts = t.getAttribute("data-ts");
        if (!ts) return;
        if (!confirm("Excluir esta transferência de saldo? A saída e a entrada correspondentes serão removidas.")) return;
        S.cc.ledger = (S.cc.ledger || []).filter(function (x) { return String(x && x.ts || "") !== String(ts); });
        saveCC();
        toast("Transferência excluída ✅");
        applyFilters();
        return;
      }

      var deal = null;
      for (var x = 0; x < S.deals.length; x++) if (String(S.deals[x].ID) === String(id)) { deal = S.deals[x]; break; }
      if (!deal) return;

      if (act === "del") return confirmDelete(deal);
      if (act === "chk") return openPayReceiveModal(deal);
      if (act === "edit") return openEditModal(deal);
      if (act === "obs") {
        return modal('<div class="fin-modal-head"><div class="fin-modal-title">Observação • Deal #' + esc(deal.ID) + '</div><button class="fin-x" data-close="1">×</button></div><div class="fin-modal-body"><div style="white-space:pre-wrap">' + esc(deal[CFG.F.OBS] || "Sem observação.") + '</div><div class="fin-row fin-row--right" style="margin-top:12px"><button class="fin-btn" data-close="1">Fechar</button></div></div>');
      }
    };
  }



  // =========================
  // Render UI

  // =========================
  // Fechamento de competência / Reserva / Diagnóstico
  // =========================
  function compNameById(compId) {
    return enumName(CFG.F.COMPETENCIA, compId) || String(compId || "");
  }

  function dealCompId(d) {
    return String((d && d[CFG.F.COMPETENCIA]) || "");
  }

  function isCompetenciaClosed(compId) {
    compId = String(compId || "");
    return !!(compId && S.closings && S.closings[compId] && S.closings[compId].closed);
  }

  function assertDealUnlocked(deal, actionLabel) {
    var comp = dealCompId(deal);
    if (!comp || !isCompetenciaClosed(comp)) return true;
    toast("Competência fechada (" + compNameById(comp) + "). Para " + (actionLabel || "alterar") + ", reabra a competência no botão FECHAR COMPETÊNCIA.", "err");
    return false;
  }

  function partnerKeyFromName(name) {
    var n = normText(displayLabel(name || ""));
    var arr = CFG.PROFIT_PARTNERS || [];
    for (var i = 0; i < arr.length; i++) {
      var aliases = arr[i].aliases || [];
      for (var j = 0; j < aliases.length; j++) {
        if (n.indexOf(normText(aliases[j])) > -1) return arr[i].key;
      }
    }
    return "SPLIT";
  }

  function emptyProfitByPartner() {
    var out = {};
    var arr = CFG.PROFIT_PARTNERS || [];
    for (var i = 0; i < arr.length; i++) out[arr[i].key] = 0;
    return out;
  }

  function addProfitToPartnerMap(map, favorecido, amount) {
    amount = Number(amount || 0) || 0;
    if (!(amount > 0)) return;
    var key = partnerKeyFromName(favorecido);
    var arr = CFG.PROFIT_PARTNERS || [];
    if (key === "SPLIT") {
      for (var i = 0; i < arr.length; i++) {
        var share = Number(arr[i].share || 0) || 0;
        map[arr[i].key] = (Number(map[arr[i].key] || 0) || 0) + (amount * share);
      }
      return;
    }
    map[key] = (Number(map[key] || 0) || 0) + amount;
  }

  function computeCompetenciaLiveResult(compId) {
    compId = String(compId || "");
    var receipts = 0, expenses = 0, profits = 0;
    var byPartner = emptyProfitByPartner();
    for (var i = 0; i < (S.deals || []).length; i++) {
      var d = S.deals[i];
      if (dealCompId(d) !== compId) continue;
      var st = String(d.STAGE_ID || "");
      var v = Number(d[CFG.F.VALOR_REAL] || d[CFG.F.VALOR_PREV] || 0) || 0;
      if (st === CFG.STAGES.REC_RECEBIDA) receipts += v;
      if (st === CFG.STAGES.DESP_PAGA) {
        if (isProfitDistributionDeal(d)) {
          profits += v;
          addProfitToPartnerMap(byPartner, d[CFG.F.FAVORECIDO], v);
        } else {
          expenses += v;
        }
      }
    }
    return {
      compId: compId,
      compName: compNameById(compId),
      receipts: receipts,
      expenses: expenses,
      profits: profits,
      profitByPartner: byPartner,
      reserveMonth: receipts - expenses - profits,
      calculatedAt: new Date().toISOString()
    };
  }

  function closingForCompetencia(compId) {
    compId = String(compId || "");
    var saved = S.closings && S.closings[compId];
    if (saved && saved.closed) return saved;
    return computeCompetenciaLiveResult(compId);
  }

  function computeReserveTotal() {
    var total = 0;
    var closings = S.closings || {};
    for (var k in closings) {
      if (!closings.hasOwnProperty(k)) continue;
      var c = closings[k] || {};
      if (c.closed) total += Number(c.reserveMonth || 0) || 0;
    }
    return total;
  }

  function renderClosePreview(modalObj) {
    var comp = modalObj.q("#close-comp") ? modalObj.q("#close-comp").value : "";
    var host = modalObj.q("#close-preview");
    if (!host) return;
    if (!comp) { host.innerHTML = '<div class="fin-muted">Selecione uma competência.</div>'; return; }
    var live = computeCompetenciaLiveResult(comp);
    var saved = S.closings && S.closings[comp];
    var closed = !!(saved && saved.closed);
    var view = closed ? saved : live;
    var partners = CFG.PROFIT_PARTNERS || [];
    var ph = [];
    for (var i = 0; i < partners.length; i++) {
      var v = Number((view.profitByPartner || {})[partners[i].key] || 0) || 0;
      ph.push('<tr><td>' + esc(partners[i].name) + '</td><td style="text-align:right">' + esc(moneyBR(v)) + '</td></tr>');
    }
    host.innerHTML =
      '<div class="fin-chart-box" style="border-style:solid">' +
        '<div class="fin-row" style="justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">' +
          '<div><div class="fin-strong">' + esc(compNameById(comp)) + '</div><div class="fin-muted fin-small">Status: ' + (closed ? 'FECHADA em ' + esc(toDisplayDate(String(view.closedAt || '').slice(0,10))) : 'ABERTA / cálculo ao vivo') + '</div></div>' +
          '<div class="fin-strong">Reserva acumulada fechada: ' + esc(moneyBR(computeReserveTotal())) + '</div>' +
        '</div>' +
        '<table class="fin-table" style="min-width:0;margin-top:12px"><tbody>' +
          '<tr><td>Receitas recebidas</td><td style="text-align:right">' + esc(moneyBR(view.receipts)) + '</td></tr>' +
          '<tr><td>Despesas operacionais pagas</td><td style="text-align:right">' + esc(moneyBR(view.expenses)) + '</td></tr>' +
          '<tr><td>Distribuição de lucro</td><td style="text-align:right">' + esc(moneyBR(view.profits)) + '</td></tr>' +
          '<tr><td><b>Reserva da competência</b></td><td style="text-align:right"><b>' + esc(moneyBR(view.reserveMonth)) + '</b></td></tr>' +
        '</tbody></table>' +
        '<div class="fin-strong" style="margin-top:12px">Lucro por sócio</div>' +
        '<table class="fin-table" style="min-width:0;margin-top:6px"><tbody>' + ph.join('') + '</tbody></table>' +
      '</div>';
    var closeBtn = modalObj.q("#close-save");
    var reopenBtn = modalObj.q("#close-reopen");
    if (closeBtn) closeBtn.style.display = closed ? "none" : "inline-flex";
    if (reopenBtn) reopenBtn.style.display = closed ? "inline-flex" : "none";
  }

  function openCompetenciaCloseModal() {
    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">Fechar competência</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body">' +
        '<div class="fin-muted" style="font-weight:900;margin-bottom:10px">Ao fechar, o resultado da competência fica congelado na nuvem para compor a RESERVA acumulada. Para alterar lançamentos dessa competência depois, reabra primeiro.</div>' +
        '<div class="fin-row" style="gap:10px;flex-wrap:wrap;align-items:flex-end">' +
          '<div class="fin-field"><label>Competência</label><select id="close-comp">' + buildOptions(S.enums[CFG.F.COMPETENCIA] || [], true, "— Selecione —") + '</select></div>' +
          '<button class="fin-btn fin-btn--primary" id="close-save" data-busylock="1">FECHAR COMPETÊNCIA</button>' +
          '<button class="fin-btn fin-btn--danger" id="close-reopen" data-busylock="1" style="display:none">REABRIR COMPETÊNCIA</button>' +
        '</div>' +
        '<div id="close-preview" style="margin-top:12px"></div>' +
      '</div>'
    );
    var sel = m.q("#close-comp");
    if (sel) {
      sel.value = S.filters.competencia || "";
      sel.addEventListener("change", function(){ renderClosePreview(m); });
    }
    bindNode(m.q("#close-save"), "click", function(){
      var comp = m.q("#close-comp").value;
      if (!comp) { toast("Selecione a competência.", "err"); return; }
      var data = computeCompetenciaLiveResult(comp);
      data.closed = true;
      data.closedAt = new Date().toISOString();
      if (!S.closings) S.closings = {};
      S.closings[comp] = data;
      scheduleInstitutionalPersist('closing');
      renderTotals();
      renderClosePreview(m);
      toast("Competência fechada ✅");
    });
    bindNode(m.q("#close-reopen"), "click", function(){
      var comp = m.q("#close-comp").value;
      if (!comp) return;
      if (!confirm("Reabrir esta competência permitirá alterar lançamentos dela. Confirmar?")) return;
      if (S.closings && S.closings[comp]) S.closings[comp].closed = false;
      scheduleInstitutionalPersist('closing-reopen');
      renderTotals();
      renderClosePreview(m);
      toast("Competência reaberta ✅");
    });
    renderClosePreview(m);
  }

  function bindNode(node, eventName, fn) {
    if (node && node.addEventListener) node.addEventListener(eventName, fn);
  }

  function openTransferHistoryModal() {
    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">Transferências internas</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body"><div class="fin-muted" style="font-weight:900;margin-bottom:10px">Histórico próprio de transferências entre centros. Não contabiliza como receita nem despesa.</div><div id="trhist"></div></div>',
      { full: true }
    );
    function draw() {
      var list = S.cc.ledger || [];
      var rows = [];
      for (var i = list.length - 1; i >= 0; i--) {
        var t = list[i] || {};
        rows.push('<tr><td>' + esc(toDisplayDate(new Date(Number(t.ts || Date.now())).toISOString().slice(0,10))) + '</td><td>' + esc(centerNameById(t.from)) + '</td><td>' + esc(centerNameById(t.to)) + '</td><td style="text-align:right">' + esc(moneyBR(t.amount)) + '</td><td>' + esc(t.note || '') + '</td><td><button class="fin-mini fin-mini--danger" data-del-tr="' + i + '">Excluir</button></td></tr>');
      }
      var host = m.q("#trhist");
      host.innerHTML = rows.length ? '<table class="fin-table" style="min-width:900px"><thead><tr><th>Data</th><th>Origem</th><th>Destino</th><th>Valor</th><th>Obs</th><th>Ações</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>' : '<div class="fin-chart-box">Sem transferências registradas.</div>';
      var btns = host.querySelectorAll('[data-del-tr]');
      for (var b = 0; b < btns.length; b++) btns[b].addEventListener('click', function(){
        var idx = Number(this.getAttribute('data-del-tr'));
        if (!confirm('Excluir esta transferência interna?')) return;
        if (idx >= 0 && idx < S.cc.ledger.length) S.cc.ledger.splice(idx, 1);
        saveCC();
        applyFilters();
        draw();
        toast('Transferência excluída ✅');
      });
    }
    draw();
  }

  function openDiagnosticsModal() {
    var m = modal(
      '<div class="fin-modal-head"><div class="fin-modal-title">Diagnóstico do sistema</div><button class="fin-x" data-close="1">×</button></div>' +
      '<div class="fin-modal-body"><div id="diag-host" class="fin-chart-box">Executando diagnóstico...</div></div>'
    );
    var host = m.q('#diag-host');
    function line(k,v,ok){ return '<tr><td>' + esc(k) + '</td><td>' + esc(v) + '</td><td>' + (ok ? '✅' : '⚠️') + '</td></tr>'; }
    Promise.allSettled([
      fetch(WORKER_BASE + '/health', { cache: 'no-store' }).then(function(r){ return r.json(); }),
      fetch(API_BASE + '/panel-state?ns=' + encodeURIComponent((CFG.STORAGE && CFG.STORAGE.namespace) || 'financeiro-cgd-v5'), { cache: 'no-store' }).then(function(r){ return r.json(); }),
      fetch(WORKER_BASE + '/asset/financeiroCGD.js?diag=' + Date.now(), { cache: 'no-store' }).then(function(r){ return { ok: r.ok, status: r.status }; })
    ]).then(function(res){
      var health = res[0].status === 'fulfilled' ? res[0].value : null;
      var state = res[1].status === 'fulfilled' ? res[1].value : null;
      var asset = res[2].status === 'fulfilled' ? res[2].value : null;
      host.innerHTML = '<table class="fin-table" style="min-width:0"><tbody>' +
        line('Armazenamento configurado', (CFG.STORAGE && CFG.STORAGE.mode) || 'local', ((CFG.STORAGE && CFG.STORAGE.mode) === 'worker')) +
        line('Worker /health', health ? 'OK' : 'Falha', !!health) +
        line('KV vinculado', health && health.hasKV ? 'FIN_STATE ativo' : 'Não detectado', !!(health && health.hasKV)) +
        line('Panel-state', state && state.ok ? 'OK' : 'Falha', !!(state && state.ok)) +
        line('Asset JS', asset && asset.ok ? 'OK HTTP ' + asset.status : 'Falha', !!(asset && asset.ok)) +
        line('Bitrix API mode', S.apiMode || 'Ainda não testado', !!S.apiMode) +
        line('Última sincronização', S.lastSyncAt || '—', !!S.lastSyncAt) +
      '</tbody></table>';
    });
  }

  // =========================
  // Render UI
  // =========================
  function render() {
    root.innerHTML =
      '<div class="fin-page">' +

        '<header class="fin-topbar">' +
          '<div class="fin-top-left">' +
            '<img class="fin-top-logo" src="' + esc(CFG.LOGO_URL) + '" alt="CGD" referrerpolicy="no-referrer" loading="eager">' +
            '<div>' +
              '<div class="fin-top-title">Financeiro CGD</div>' +
              '<div class="fin-top-sub"><span id="fin-lastsync">—</span> • <span id="fin-storage-mode">LOCAL</span> <span id="fin-loading" class="fin-loading" style="display:none">Carregando…</span></div>' +
            '</div>' +
          '</div>' +

          '<div class="fin-top-actions">' +
            '<div class="fin-search"><span aria-hidden="true">🔎</span><input id="f-q" placeholder="Buscar por favorecido, obs, centro..."></div>' +
            '<button class="fin-btn" id="btn-cc-balance" data-busylock="1">SALDO CENTRO</button>' +
            '' +
            '<button class="fin-btn" id="btn-card" data-busylock="1">CARTÕES</button>' +
            '<button class="fin-btn" id="btn-expenses" data-busylock="1">DESPESAS</button>' +
            '<button class="fin-btn" id="btn-close-comp" data-busylock="1">FECHAR COMPETÊNCIA</button>' +
            '<button class="fin-btn" id="btn-transfers" data-busylock="1">TRANSFERÊNCIAS</button>' +
            '<button class="fin-btn" id="btn-socios" data-busylock="1">👥 SÓCIOS</button>' +
            '<button class="fin-btn" id="btn-diagnostics" data-busylock="1">DIAGNÓSTICO</button>' +
            '<button class="fin-btn fin-btn--primary" id="btn-batch-d" data-busylock="1">LOTE DESPESAS</button>' +
            '<button class="fin-btn fin-btn--primary" id="btn-batch-r" data-busylock="1">LOTE RECEITAS</button>' +
            '<button class="fin-btn" id="btn-bulk" data-busylock="1">AÇÃO EM MASSA</button>' +
            '<button class="fin-btn" id="btn-audit">AUDITORIA</button>' +
            '<button class="fin-btn" id="btn-save-filter">SALVAR FILTRO</button>' +
            '<button class="fin-btn" id="btn-filters">FILTROS</button>' +
            '<button class="fin-btn" id="btn-reset-filters">LIMPAR FILTROS</button>' +
            '<button class="fin-btn" id="btn-sync-state">SINCRONIZAR DADOS</button>' +
            '<button class="fin-btn" id="btn-refresh" data-busylock="1">ATUALIZAR</button>' +
          '</div>' +
        '</header>' +

        '<div class="fin-shell">' +
          '<div class="fin-body">' +
            '<aside class="fin-side">' +
              '<div class="fin-side-block">' +
                '<div class="fin-side-h">Centro de custo</div>' +
                '<div id="fin-side-centers" class="fin-side-list"></div>' +
              '</div>' +
            '</aside>' +

            '<main>' +
              '<section class="fin-panel"><div class="fin-panel-inner">' +

                '<div class="fin-kpis">' +
                  '<div class="fin-kpi"><div class="fin-kpi-k">Total Previsto</div><div class="fin-kpi-v" id="tot-prev">—</div></div>' +
                  '<div class="fin-kpi"><div class="fin-kpi-k">Total Realizado</div><div class="fin-kpi-v" id="tot-real">—</div></div>' +
                  '<div class="fin-kpi"><div class="fin-kpi-k">Reserva acumulada fechada</div><div class="fin-kpi-v" id="reserve-balance">—</div></div>' +
                '</div>' +

                '<div class="fin-filters">' +
                  '<div class="fin-field"><label>Competência</label><select id="f-comp">' + buildOptions(S.enums[CFG.F.COMPETENCIA] || []) + '</select></div>' +
                  '<div class="fin-check" style="margin-left:auto"><span id="cc-balance-label" class="fin-muted">Saldo Total:</span> <span id="cc-balance" class="fin-strong">—</span> <button class="fin-mini" id="btn-transfer-inline" style="display:none">🔁 TRANSFERIR SALDO</button></div>' +

                  '<div style="flex-basis:100%; height:0"></div>' +

                  '<div class="fin-toggles">' +
                    '<label class="fin-check"><input type="checkbox" id="tog-exp" checked> <span>Mostrar Despesas</span></label>' +
                    '<label class="fin-check"><input type="checkbox" id="tog-rec" checked> <span>Mostrar Receitas</span></label>' +
                    '<div class="fin-check"><span class="fin-muted">Selecionados:</span> <span id="tot-selected" class="fin-strong">0</span></div>' +
                    '<div class="fin-check" style="margin-left:auto"><span class="fin-muted">Qtd. Itens:</span> <span id="tot-count" class="fin-strong">0</span></div>' +
                  '</div>' +

                  '<div class="fin-charts" style="flex-basis:100%">' +
                    '<div id="chart-cat"></div>' +
                    '<div id="chart-evo"></div>' +
                    '<div id="chart-profit"></div>' +
                  '</div>' +
                '</div>' +

                '<div id="fin-pager" style="margin-top:12px"></div>' +
                '<div class="fin-table-wrap" style="margin-top:12px">' +
                  '<table class="fin-table">' +
                    '<thead><tr>' +
                      '<th style="width:42px"><input type="checkbox" id="fin-select-all"></th>' +
                      '<th style="width:76px">ID</th>' +
                      '<th>Favorecido/Pagador</th>' +
                      '<th style="width:170px">Centro</th>' +
                      '<th style="width:140px">Tipo</th>' +
                      '<th style="width:130px">Competência</th>' +
                      '<th style="width:120px">Data Prev.</th>' +
                      '<th style="width:120px">Data Real</th>' +
                      '<th style="width:140px">Previsto</th>' +
                      '<th style="width:140px">Realizado</th>' +
                      '<th style="width:160px">Etapa</th>' +
                      '<th style="width:480px">Ações</th>' +
                    '</tr></thead>' +
                    '<tbody id="fin-tbody"><tr><td colspan="12" class="fin-muted">Carregando…</td></tr></tbody>' +
                  '</table>' +
                '</div>' +

                '<div id="fin-toast-host" class="fin-toast-host"></div>' +

              '</div></section>' +
            '</main>' +
          '</div>' +
        '</div>' +

        '<div class="fin-footerbar">' +
          '<div class="fin-footer-left"><div class="k">' + esc(CFG.FOOTER.addressTitle) + '</div><div class="v">' + esc(CFG.FOOTER.addressText) + '</div></div>' +
          '<div class="fin-footer-center">' + esc(CFG.FOOTER.credits) + '</div>' +
          '<div class="fin-footer-right">' +
            CFG.FOOTER.companies.map(function (c) {
              return '<div class="fin-footer-box"><div class="t">' + esc(c.name) + '</div><div class="s">' + esc(c.meta) + '</div></div>';
            }).join("") +
          '</div>' +
          '<div class="fin-footer-avatars" id="fin-avatars"></div>' +
        '</div>' +

      '</div>';

    bindEvt("#btn-cc-balance", "click", openCCBalanceModal);
    bindEvt("#btn-transfer-inline", "click", openTransferModal);
    bindEvt("#btn-card", "click", openCardModal);

    bindEvt("#btn-expenses", "click", openExpensesManagerModal);
    bindEvt("#btn-close-comp", "click", openCompetenciaCloseModal);
    bindEvt("#btn-transfers", "click", openTransferHistoryModal);
    bindEvt("#btn-socios", "click", openSociosModal);
    bindEvt("#btn-diagnostics", "click", openDiagnosticsModal);
    bindEvt("#btn-batch-d", "click", function () { openBatch("DESPESA"); });
    bindEvt("#btn-batch-r", "click", function () { openBatch("RECEITA"); });
    bindEvt("#btn-bulk", "click", openBulkActionsModal);
    bindEvt("#btn-audit", "click", openAuditModal);
    bindEvt("#btn-save-filter", "click", saveCurrentFilterPreset);
    bindEvt("#btn-filters", "click", openFilterPresetsModal);
    bindEvt("#btn-reset-filters", "click", resetAllFilters);
    bindEvt("#btn-sync-state", "click", function () {
      persistInstitutionalNow("manual")
        .then(function () { toast("Dados sincronizados ✅", "ok"); })
        .catch(function (e) { toast("Erro ao sincronizar: " + (e && e.message ? e.message : String(e)), "err"); });
    });

    bindEvt("#btn-refresh", "click", refresh);

    bindEvt("#f-q", "input", function (e) { debounceApplySearch((e && e.target ? e.target.value : "") || ""); });
    bindEvt("#f-comp", "change", function () { var n = el("#f-comp"); S.filters.competencia = n ? (n.value || "") : ""; applyFilters(); });
    bindEvt("#tog-exp", "change", function () { var n = el("#tog-exp"); S.filters.showPayables = !!(n && n.checked); applyFilters(); });
    bindEvt("#tog-rec", "change", function () { var n = el("#tog-rec"); S.filters.showReceivables = !!(n && n.checked); applyFilters(); });
    bindEvt("#fin-select-all", "change", function () {
      var list = getPagedList();
      var box = el("#fin-select-all");
      var on = !!(box && box.checked);
      for (var i = 0; i < list.length && i < CFG.PAGE_SIZE; i++) S.selectedIds[String(list[i].ID)] = on;
      renderTable();
      renderTotals();
    });

    renderSidebarCenters();
    renderPager();
    renderChartsPlaceholders();
  }

  // =========================
  // Refresh
  // =========================
  function refresh() {
    var token = ++S.refreshToken;
    setLoading(true);
    return listDealsAll()
      .then(function (deals) {
        if (token !== S.refreshToken) return;
        S.deals = deals || [];
        S.lastSyncAt = nowBR();
        applyFilters();
        scheduleFinanceReminderSync();
      })
      .catch(function (e) {
        if (token !== S.refreshToken) return;
        toast("Falha ao carregar: " + (e.message || String(e)), "err");
        var tb = el("#fin-tbody");
        if (tb) tb.innerHTML = '<tr><td colspan="12" class="fin-muted">Erro: ' + esc(e.message || String(e)) + '</td></tr>';
      })
      .finally(function () {
        if (token === S.refreshToken) setLoading(false);
      });
  }

  if (!Promise.prototype.finally) {
    Promise.prototype.finally = function (cb) {
      var P = this.constructor;
      return this.then(
        function (v) { return P.resolve(cb()).then(function () { return v; }); },
        function (e) { return P.resolve(cb()).then(function () { throw e; }); }
      );
    };
  }

  // =========================
  // Boot
  // =========================
  function boot() {
    setLoading(true);
    return loadInstitutionalState()
      .then(function(){ return loadMeta(); })
      .then(function () {
        render();
        updateStorageBadge();
        return loadPartners();
      })
      .then(function () {
        renderPartnersAvatars();
        return refresh();
      })
      .catch(function (e) {
        try { console.error("Financeiro boot error:", e); } catch(_) {}
        toast("Erro ao iniciar: " + (e.message || String(e)), "err");
        root.innerHTML = '<div style="padding:16px">Falha ao iniciar. Veja console.</div>';
      })
      .finally(function () {
        setLoading(false);
      });
  }

  boot();
})();
