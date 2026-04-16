
(function () {
  const css = `
    :root{
      --topPad: 0px;

      --pageA:#ffffff;
      --pageB:#f5f6f8;

      --hdr: #000000;
      --hdrBorder: rgba(0,0,0,.08);

      --text: #1f2a44;
      --muted: rgba(31,42,68,.72);

      --card: #ffffff;
      --card2: #fbfbfc;
      --cardBorder: rgba(0,0,0,.10);
      --shadow: 0 12px 28px rgba(0,0,0,.10);

      --cardText: #1f2a44;
      --cardMuted: rgba(31,42,68,.78);

      --radius:18px;
      --pad:16px;
      --gap:16px;

      --avatar: 46px;
    }

    *{ box-sizing:border-box; }
    html, body{ height:100%; margin:0; }
    body{
      background:#fff;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif;
    }

    #app{
      position: fixed;
      inset: 0;
      overflow: hidden;
      padding-top: var(--topPad);
      display:grid;
      grid-template-rows: auto 1fr auto;
      color: var(--text);
      background:
        radial-gradient(1200px 520px at 12% 0%, rgba(0,0,0,.03), transparent 60%),
        radial-gradient(1000px 520px at 85% 8%, rgba(0,0,0,.02), transparent 60%),
        linear-gradient(180deg, var(--pageA), var(--pageB));
    }

    header{
      padding:8px 14px;
      border-bottom:1px solid rgba(0,0,0,.08);
      background: #000;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      flex-wrap:wrap;
      position: relative;
      z-index: 20;
    }

    .brand{
      display:flex;
      align-items:center;
      gap:12px;
      min-width: 280px;
      flex:1 1 360px;
    }
    .logo{
      width:42px; height:42px;
      border-radius: 12px;
      overflow:hidden;
      background: #f5f6f8;
      flex:0 0 auto;
    }
    .logo img{ width:100%; height:100%; object-fit:cover; display:block; }

    .titles{ display:flex; flex-direction:column; gap:2px; min-width:0; }
    h1{
      color:#fff;
      margin:0;
      font-size:24px;
      letter-spacing:.2px;
      line-height:1.05;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .sub{
      color:rgba(255,255,255,.78);
      font-size:13px;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }

    .right{
      display:flex;
      flex-direction:column;
      gap:8px;
      flex:2 1 700px;
      align-items:flex-end;
      min-width: 340px;
    }
    .rightRow{
      width: 100%;
      display:flex;
      align-items:center;
      gap:8px;
      flex-wrap:wrap;
      justify-content:flex-end;
    }

    .pill{
      display:flex;
      align-items:center;
      gap:8px;
      padding:8px 12px;
      border-radius:12px;
      border:1px solid rgba(255,255,255,.10);
      background: #111;
      color:#fff;
      font-size:14px;
      white-space:nowrap;
      min-height:38px;
    }

    .dot{
      width:8px;height:8px;border-radius:50%;
      background: #1f9d55;
      box-shadow: 0 0 0 3px rgba(31,157,85,.18);
    }
    .dot.warn{ background:#c27a00; box-shadow:0 0 0 3px rgba(194,122,0,.16); }
    .dot.bad{ background:#d64545; box-shadow:0 0 0 3px rgba(214,69,69,.16); }

    .searchWrap{
      position: relative;
      flex: 1 1 420px;
      min-width: 260px;
      max-width: 560px;
    }
    .search{
      display:flex;
      align-items:center;
      gap:10px;
      padding:8px 12px;
      width: 100%;
      border-radius: 12px;
      border:1px solid rgba(0,0,0,.10);
      background: #fff;
      color:#000;
    }
    .search input{
      width:100%;
      border:none;
      outline:none;
      background:transparent;
      color: #000;
      font-size: 15px;
    }

    .searchPanel{
      position:absolute;
      top: calc(100% + 8px);
      left: 0;
      width: 100%;
      max-width: 560px;
      border-radius: 14px;
      border:1px solid rgba(0,0,0,.10);
      background: #ffffff;
      box-shadow: 0 18px 44px rgba(0,0,0,.35);
      overflow:hidden;
      display:none;
      z-index: 50;
    }
    .spHead{
      padding:10px 12px;
      border-bottom: 1px solid rgba(0,0,0,.08);
      font-size: 13px;
      color: #1f2a44;
      display:flex;
      justify-content:space-between;
      gap:10px;
      align-items:center;
    }
    .spList{ max-height: 340px; overflow:auto; }
    .spItem{
      padding:12px;
      display:flex;
      gap:10px;
      align-items:flex-start;
      cursor:pointer;
      border-bottom: 1px solid rgba(0,0,0,.06);
    }
    .spItem:hover{ background: rgba(0,0,0,.04); }
    .spMain{ font-size:14px; color: #1f2a44; line-height: 1.25; }
    .spSub{ font-size:12px; color: rgba(31,42,68,.70); margin-top:2px; }

    .btn{
      border:1px solid rgba(0,0,0,.10);
      background: #fff;
      color: #000;
      padding:8px 12px;
      border-radius: 12px;
      cursor:pointer;
      font-size: 14px;
      font-weight:800;
      user-select:none;
      white-space:nowrap;
      min-height:38px;
    }
    .btn[hidden]{ display:none !important; }
    .btnAdm{ border-color: rgba(255,255,255,.20); }

    main{
      padding: 14px 16px 10px;
      overflow:auto;
      display:flex;
      flex-direction:column;
      gap: 14px;
      min-height:0;
    }

    .sorteioBar{
      border:1px solid rgba(0,0,0,.08);
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 12px 28px rgba(0,0,0,.10);
      padding: 10px 12px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      flex-wrap:wrap;
    }
    .sLeft{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .sBadge{
      padding:8px 12px;
      border-radius: 999px;
      border:1px solid rgba(0,0,0,.10);
      background: #ffffff;
      font-weight: 950;
      font-size:15px;
      letter-spacing:.3px;
    }

    .sparkWrap{
      display:inline-flex;
      align-items:center;
      gap:4px;
      margin-left:6px;
      vertical-align:middle;
      opacity:0;
      transform:translateY(2px) scale(.9);
      transition:opacity .25s ease, transform .25s ease;
      pointer-events:none;
    }
    .sparkWrap.active{
      opacity:1;
      transform:translateY(0) scale(1);
    }
    .spark{
      display:inline-block;
      font-size:14px;
      line-height:1;
      animation:sparkleFloat 1.2s ease-in-out infinite;
      transform-origin:center;
    }
    .spark:nth-child(2){ animation-delay:.18s; }
    .spark:nth-child(3){ animation-delay:.36s; }
    @keyframes sparkleFloat{
      0%,100%{ transform:translateY(0) scale(.9); opacity:.55; }
      50%{ transform:translateY(-3px) scale(1.15); opacity:1; }
    }

    .gridTop{
      display:grid;
      grid-template-columns: repeat(4, minmax(260px, 1fr));
      gap: var(--gap);
      align-items:start;
    }
    @media (max-width: 1600px){
      .gridTop{ grid-template-columns: repeat(3, minmax(260px, 1fr)); }
    }
    @media (max-width: 1180px){
      .gridTop{ grid-template-columns: repeat(2, minmax(260px, 1fr)); }
      h1{ font-size: 20px; }
    }
    @media (max-width: 780px){
      .gridTop, .gridRest{ grid-template-columns: 1fr; }
      .searchWrap{ max-width: 92vw; }
    }

    .gridRest{
      display:grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: var(--gap);
      align-items:start;
    }

    .card{
      border:1px solid var(--cardBorder);
      border-radius: var(--radius);
      background: linear-gradient(180deg, var(--card), var(--card2));
      box-shadow: var(--shadow);
      overflow:hidden;
      color: var(--cardText);
      position: relative;
    }
    .card.rank1{
      border: 3px solid #d4af37;
      box-shadow:
        0 0 0 2px rgba(212,175,55,.35),
        0 0 26px rgba(212,175,55,.52),
        0 0 40px rgba(212,175,55,.28),
        var(--shadow);
      animation: podiumGoldPulse 0.9s infinite alternate;
    }
    .card.rank2{
      border: 4px solid #7f8791;
      box-shadow:
        0 0 0 3px rgba(127,135,145,.42),
        0 0 28px rgba(127,135,145,.62),
        0 0 46px rgba(127,135,145,.32),
        0 0 70px rgba(127,135,145,.18),
        var(--shadow);
      animation: podiumSilverPulse 0.85s infinite alternate;
    }
    .card.rank3{
      border: 3px solid #8c5a2b;
      box-shadow:
        0 0 0 2px rgba(140,90,43,.30),
        0 0 22px rgba(140,90,43,.42),
        0 0 34px rgba(140,90,43,.22),
        var(--shadow);
      animation: podiumBronzePulse 1.05s infinite alternate;
    }
    @keyframes podiumGoldPulse{
      from{ box-shadow: 0 0 0 2px rgba(212,175,55,.26), 0 0 14px rgba(212,175,55,.32), 0 0 22px rgba(212,175,55,.16), var(--shadow); }
      to{ box-shadow: 0 0 0 4px rgba(212,175,55,.44), 0 0 34px rgba(212,175,55,.62), 0 0 50px rgba(212,175,55,.28), var(--shadow); }
    }
    @keyframes podiumSilverPulse{
      from{ box-shadow: 0 0 0 2px rgba(127,135,145,.28), 0 0 16px rgba(127,135,145,.34), 0 0 26px rgba(127,135,145,.16), 0 0 40px rgba(127,135,145,.08), var(--shadow); }
      to{ box-shadow: 0 0 0 5px rgba(127,135,145,.56), 0 0 38px rgba(127,135,145,.78), 0 0 58px rgba(127,135,145,.34), 0 0 84px rgba(127,135,145,.20), var(--shadow); }
    }
    @keyframes podiumBronzePulse{
      from{ box-shadow: 0 0 0 2px rgba(140,90,43,.22), 0 0 12px rgba(140,90,43,.26), 0 0 20px rgba(140,90,43,.12), var(--shadow); }
      to{ box-shadow: 0 0 0 4px rgba(140,90,43,.38), 0 0 28px rgba(140,90,43,.48), 0 0 42px rgba(140,90,43,.22), var(--shadow); }
    }
    .bellBadge{
      position:absolute;
      top:6px;
      right:6px;
      min-width:38px;
      height:38px;
      border-radius:999px;
      display:flex;
      align-items:center;
      justify-content:center;
      background:#111;
      color:#ffd54a;
      font-size:20px;
      box-shadow:0 10px 24px rgba(0,0,0,.24);
      animation: bellRing 0.9s infinite;
      z-index:5;
      border:2px solid rgba(255,213,74,.45);
    }
    @keyframes twinkle{
      from{ opacity:.45; transform: translateY(0) scale(.9); }
      to{ opacity:1; transform: translateY(-1px) scale(1.08); }
    }
    @keyframes twinkle{
      from{ opacity:.45; transform: translateY(0) scale(.9); }
      to{ opacity:1; transform: translateY(-1px) scale(1.08); }
    }
    @keyframes bellRing{
      0%{ transform: rotate(0deg) scale(1); }
      20%{ transform: rotate(16deg) scale(1.08); }
      40%{ transform: rotate(-14deg) scale(1.1); }
      60%{ transform: rotate(10deg) scale(1.06); }
      80%{ transform: rotate(-8deg) scale(1.03); }
      100%{ transform: rotate(0deg) scale(1); }
    }

    .head{ padding: 12px; }
    .titleRow{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:10px;
      margin-bottom:8px;
    }
    .colTitle{
      display:flex;
      align-items:center;
      gap:12px;
      min-width:0;
    }

    .avatar{
      width:var(--avatar);height:var(--avatar);
      border-radius:50%;
      border:1px solid rgba(0,0,0,.10);
      background: rgba(0,0,0,.04);
      overflow:hidden;
      display:flex;
      align-items:center;
      justify-content:center;
      font-weight:900;
      color: rgba(31,42,68,.65);
      user-select:none;
      flex:0 0 auto;
    }
    .avatar img{ width:100%; height:100%; object-fit:cover; display:block; }

    .rankBadge{
      min-width: 30px;
      height: 30px;
      padding: 0 10px;
      border-radius: 999px;
      background:#111;
      color:#fff;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      font-size:13px;
      font-weight:950;
      box-shadow:0 4px 12px rgba(0,0,0,.18);
      flex:0 0 auto;
      gap:4px;
    }
    .medal{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      font-size:14px;
      line-height:1;
    }

    .name{
      font-size: 18px;
      font-weight: 950;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      max-width: 180px;
    }

    .tag{
      font-size: 13px;
      color: rgba(31,42,68,.60);
      padding: 7px 12px;
      border-radius: 999px;
      border:1px solid rgba(0,0,0,.08);
      background: rgba(0,0,0,.03);
      white-space:nowrap;
      font-weight:700;
    }

    .stats{
      display:grid;
      grid-template-columns: repeat(3, 1fr);
      gap:8px;
    }
    .stat{
      border:1px solid rgba(0,0,0,.08);
      background: rgba(0,0,0,.03);
      border-radius: 14px;
      padding: 9px 10px;
      min-height: 52px;
    }
    .stat b{ display:block; font-size: 12px; margin-bottom:2px; }
    .stat span{ font-size: 15px; color: var(--cardMuted); font-weight:800; line-height:1.15; }
    .money{ font-weight: 950; }

    .btnRow{
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin-top:8px;
    }
    .miniBtn{
      border:1px solid rgba(0,0,0,.12);
      background: #fff;
      color: #000;
      padding:8px 10px;
      border-radius: 10px;
      cursor:pointer;
      font-size: 13px;
      font-weight:800;
      user-select:none;
      white-space:nowrap;
    }

    .hint{
      color: rgba(31,42,68,.70);
      font-size:13px;
      display:flex;
      gap:12px;
      flex-wrap:wrap;
      align-items:center;
      padding-bottom: 6px;
    }

    .err{
      color: #ffb3b3;
      font-size: 13px;
      white-space: pre-wrap;
      border:1px solid rgba(214,69,69,.22);
      padding:10px 12px;
      border-radius: 12px;
      background: rgba(214,69,69,.08);
    }
    .err:empty{ display:none; }

    .modalBack{
      position: fixed;
      inset: 0;
      background: rgba(15,20,35,.55);
      display:none;
      align-items:center;
      justify-content:center;
      z-index: 80;
      padding: 18px;
    }
    .modal{
      width: min(1360px, 96vw);
      max-height: 88vh;
      border-radius: 18px;
      border:1px solid rgba(0,0,0,.10);
      background: #ffffff;
      box-shadow: 0 30px 90px rgba(0,0,0,.18);
      overflow:hidden;
      display:flex;
      flex-direction:column;
      color: #1f2a44;
    }
    .modalHead{
      padding: 14px 16px;
      border-bottom:1px solid rgba(0,0,0,.08);
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
    }
    .modalBrand{ display:flex; align-items:center; gap:10px; min-width:0; }
    .modalLogo{
      width:36px;height:36px;border-radius:10px;
      overflow:hidden;
      border:1px solid rgba(0,0,0,.10);
      background: #f5f6f8;
      flex:0 0 auto;
    }
    .modalLogo img{ width:100%; height:100%; object-fit:cover; display:block; }
    .modalTitle{ display:flex; align-items:center; gap:12px; min-width:0; }
    .modalTitle h3{ margin:0; font-size: 20px; font-weight: 950; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

    .modalBody{ padding: 14px 16px; overflow:auto; }
    .modalClose{
      border:1px solid rgba(0,0,0,.10);
      background: #fff;
      border-radius: 12px;
      padding: 10px 12px;
      cursor:pointer;
      font-size: 14px;
      font-weight:800;
      white-space:nowrap;
      color: #000;
    }

    .rowFlex{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      align-items:center;
      justify-content:space-between;
      margin-bottom:10px;
    }
    .pillSmall{
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:8px 10px;
      border-radius:999px;
      border:1px solid rgba(0,0,0,.10);
      background: #f5f6f8;
      font-size: 14px;
      color: #1f2a44;
      white-space:nowrap;
    }
    .inlineCtrl{ display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .sel, .inpt{
      padding:10px 12px;
      border-radius:12px;
      border:1px solid rgba(255,255,255,.14);
      background: #111;
      color:#fff;
      outline:none;
      font-size:14px;
    }
    .inpt{ width: 180px; }

    .table{
      width:100%;
      border-collapse:separate;
      border-spacing:0;
      overflow:hidden;
      border-radius:14px;
      border:1px solid rgba(0,0,0,.10);
    }
    .table th, .table td{
      padding:12px 12px;
      font-size:14px;
      border-bottom:1px solid rgba(0,0,0,.08);
      vertical-align:top;
    }
    .table th{
      text-align:left;
      font-weight:950;
      color: #1f2a44;
      background: #f3f5f7;
      position: sticky;
      top: 0;
      z-index: 5;
    }
    .table td{ color: #1f2a44; background: #ffffff; }
    .table tr:hover td{ background: #f3f5f7; }
    .tdRight{ text-align:right; white-space:nowrap; }
    .smallNote{ opacity:.95; font-size:14px; color: rgba(31,42,68,.72); }
    .btnLine{ display:flex; gap:8px; flex-wrap:wrap; align-items:center; justify-content:flex-end; }

    .pieWrap{ display:flex; gap:14px; flex-wrap:wrap; align-items:flex-start; }
    .pieBox{
      border:1px solid rgba(0,0,0,.10);
      border-radius:14px;
      padding:10px;
      background: #ffffff;
    }

    .bottomBar{
      min-height: 76px;
      background:#000;
      color:#fff;
      border-top:1px solid rgba(255,255,255,.10);
      display:grid;
      grid-template-columns: 1.25fr .8fr 1.35fr;
      align-items:center;
      gap:16px;
      padding:10px 14px;
    }
    .bottomLeft, .bottomRight{
      display:flex;
      align-items:center;
      gap:12px;
      min-width:0;
    }
    .bottomCenter{
      text-align:center;
      font-size:15px;
      font-weight:800;
      letter-spacing:.2px;
      color:#fff;
    }
    .teamPics{ display:flex; align-items:center; }
    .teamPic{
      width:42px;
      height:42px;
      border-radius:50%;
      overflow:hidden;
      border:2px solid rgba(255,255,255,.18);
      background:#111;
      margin-right:-8px;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#fff;
      font-size:13px;
      font-weight:900;
      flex:0 0 auto;
    }
    .teamPic img{ width:100%; height:100%; object-fit:cover; display:block; }
    .addressBlock{ display:flex; flex-direction:column; gap:2px; min-width:0; }
    .addressTitle, .corpTitle{ font-size:13px; font-weight:900; color:#fff; }
    .addressText, .corpSub{
      font-size:12px;
      color:rgba(255,255,255,.78);
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .bottomRight{ justify-content:flex-end; gap:20px; }
    .corpBox{ min-width:0; }
    .hideWrap{ position: relative; }
    .hidePanel{
      position:absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 280px;
      border-radius: 14px;
      border:1px solid rgba(0,0,0,.10);
      background: #ffffff;
      box-shadow: 0 18px 44px rgba(0,0,0,.35);
      overflow:hidden;
      display:none;
      z-index: 50;
    }
    .hpHead{
      padding:10px 12px;
      border-bottom: 1px solid rgba(0,0,0,.08);
      font-size: 13px;
      color: #1f2a44;
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:8px;
    }
    .hpList{ max-height: 340px; overflow:auto; }
    .hpItem{
      padding:10px 12px;
      display:flex;
      align-items:center;
      gap:8px;
      cursor:pointer;
      border-bottom: 1px solid rgba(0,0,0,.06);
      font-size:14px;
      color:#1f2a44;
      user-select:none;
    }
    .hpItem:hover{ background: rgba(0,0,0,.04); }
    .kpiGrid{
      display:grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap:10px;
      margin-bottom:14px;
    }
    .kpiCard{
      border:1px solid rgba(0,0,0,.10);
      border-radius:14px;
      padding:12px;
      background: #f9f9f9;
    }
    .kpiCard b{ display:block; font-size:12px; color:rgba(31,42,68,.70); margin-bottom:4px; }
    .kpiCard span{ font-size:18px; font-weight:950; color:#1f2a44; }
    .compBadge{
      display:inline-block;
      font-size:11px;
      background:#1f2a44;
      color:#fff;
      border-radius:999px;
      padding:2px 8px;
      margin-bottom:6px;
    }
  `;

  const html = `
  <div id="app">
    <header>
      <div class="brand">
        <div class="logo" title="CGD">
          <img alt="CGD" src="https://bitrix24public.com/b24-6iyx5y.bitrix24.com.br/docs/pub/189eb7d8a5cc26250f61ee3c26e9f997/showFile?token=ubwaxtdpjw5b">
        </div>
        <div class="titles">
          <h1>Controle de Propostas – Planos de Saúde</h1>
          <div class="sub">(BITRIX24)</div>
        </div>
      </div>

      <div class="right">
        <div class="rightRow row1">
          <div class="pill" title="Atualização">
            <span class="dot" id="dotStatus"></span>
            <span id="clock">--/--/---- --:--</span>
          </div>

          <div class="pill" title="Status de carga">
            <span id="loadStatus">Aguardando…</span>
          </div>

          <div class="pill" title="Competência do sorteio">
            <span>Comp. sorteio:</span>
            <b id="sorteioYm">—</b>
          </div>

          <div class="pill" title="% da meta geral atingida (produzido total / meta sorteio)">
            <span>% sorteio:</span>
            <b id="sorteioPct">—</b>
          </div>

          <div class="searchWrap" title="Busca em TODAS as users do painel + USER 1 oculto">
            <div class="search" role="search">
              <span style="font-size:18px;line-height:1;">⌕</span>
              <input id="q" placeholder="Buscar: cliente, operadora, etapa, vendedora…" autocomplete="off" />
            </div>

            <div class="searchPanel" id="searchPanel" aria-live="polite">
              <div class="spHead">
                <span id="spCount">—</span>
                <div style="display:flex;gap:8px;align-items:center;">
                  <button class="btn" id="spOpenAll">Abrir tudo</button>
                  <button class="btn" id="spClose">Fechar</button>
                </div>
              </div>
              <div class="spList" id="spList"></div>
            </div>
          </div>
        </div>

        <div class="rightRow row2">
          <button class="btn" id="themeDark" hidden>Escuro</button>
          <button class="btn" id="themeBlue" hidden>Azul</button>
          <button class="btn btnAdm" id="admMetas">ADM (Metas)</button>
          <button class="btn btnAdm" id="admBonifRanking">BONIFICAÇÃO (ADM)</button>
          <button class="btn btnAdm" id="admDoneAll">CONCLUÍDAS (ADM)</button>
          <button class="btn" id="admAnalise">ANÁLISE</button>
          <div class="hideWrap">
            <button class="btn" id="hideBtn">Ocultar cards</button>
            <div class="hidePanel" id="hidePanel">
              <div class="hpHead">
                <span>Ocultar/Mostrar cards</span>
                <button class="btn" id="hpClose" style="padding:4px 8px;font-size:12px;">✕</button>
              </div>
              <div class="hpList" id="hpList"></div>
            </div>
          </div>
          <select class="sel" id="compFilter" title="Filtrar por competência">
            <option value="current">Mês atual</option>
          </select>
          <button class="btn" id="clearSearch">Limpar</button>
          <button class="btn" id="refreshNow">Atualizar agora</button>
        </div>
      </div>
    </header>

    <main>
      <div class="gridTop" id="gridTop"></div>
      <div class="gridRest" id="gridRest"></div>

      <div class="hint">
        <span>F11 = tela cheia</span>
        <span>Zoom: Ctrl - / Ctrl +</span>
        <span id="hintCount"></span>
      </div>

      <div class="err" id="err"></div>
    </main>

    <footer class="bottomBar">
      <div class="bottomLeft">
        <div class="teamPics" id="teamPics"></div>
        <div class="addressBlock">
          <div class="addressTitle">Endereço</div>
          <div class="addressText">Av Ayrton Senna, 2500, SS109, Barra da Tijuca</div>
        </div>
      </div>

      <div class="bottomCenter">System created by GRUPO CGD</div>

      <div class="bottomRight">
        <div class="corpBox">
          <div class="corpTitle">CGD CORRETORA</div>
          <div class="corpSub">CNPJ 01.654.471/0001-86 • SUSEP 202031791</div>
        </div>
        <div class="corpBox">
          <div class="corpTitle">CGD BARRA</div>
          <div class="corpSub">CNPJ 53.013.848/0001-11 • SUSEP 242158650</div>
        </div>
      </div>
    </footer>
  </div>

  <div class="modalBack" id="modalBack" role="dialog" aria-modal="true">
    <div class="modal">
      <div class="modalHead">
        <div class="modalBrand">
          <div class="modalLogo" title="CGD">
            <img alt="CGD" src="https://bitrix24public.com/b24-6iyx5y.bitrix24.com.br/docs/pub/189eb7d8a5cc26250f61ee3c26e9f997/showFile?token=ubwaxtdpjw5b">
          </div>
          <div class="modalTitle">
            <div class="avatar" id="modalAvatar" style="width:52px;height:52px;"></div>
            <h3 id="modalTitle">Detalhes</h3>
          </div>
        </div>
        <button class="modalClose" id="modalClose">Fechar</button>
      </div>
      <div class="modalBody">
        <div id="modalTop"></div>
        <div id="modalContent"></div>
      </div>
    </div>
  </div>
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  document.documentElement.lang = "pt-br";
  document.body.className = "theme-light";
  document.body.innerHTML = html;

  /* ================= CONFIG ================= */
  const PROXY_URL = "https://muddy-king-6632.cgdseguros.workers.dev/?url=";
  const BITRIX_WEBHOOK_BASE = "https://b24-6iyx5y.bitrix24.com.br/rest/1/w84d3lpz7hwutyeb/";

  const OPERATOR_FIELD = "UF_CRM_1771388467";
  const CLOSEDATE_FIELD = "UF_CRM_1731899421651";
  const SOURCE_FIELD = "UF_CRM_1767283877974";
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
    { label: "JULIA MELLO",      userId: 4743 },
    { label: "NICOLE RODRIGUES", userId: 4741 },
  ];

  const SEARCH_ONLY_USERS = [
    { userId: 1, label: "USER 1" }
  ];

  /* ================= ELEMENTOS ================= */
  const $gridTop = document.getElementById("gridTop");
  const $gridRest = document.getElementById("gridRest");
  const $clock = document.getElementById("clock");
  const $err = document.getElementById("err");
  const $q = document.getElementById("q");
  const $hintCount = document.getElementById("hintCount");
  const $dotStatus = document.getElementById("dotStatus");
  const $loadStatus = document.getElementById("loadStatus");
  const $compFilter = document.getElementById("compFilter");
  const $hidePanel = document.getElementById("hidePanel");
  const $hpList = document.getElementById("hpList");

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
  const $sorteioSpark = document.getElementById("sorteioSpark");
  const $teamPics = document.getElementById("teamPics");

  /* ================= HELPERS ================= */
  function escHtml(s){
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
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

  let bellAudioCtx = null;
  function playMetaBell(){
    try{
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!bellAudioCtx) bellAudioCtx = new Ctx();
      const ctx = bellAudioCtx;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      [0, 0.22].forEach((offset, idx)=>{
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(idx === 0 ? 1174 : 1318, now + offset);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.08, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.38);
      });
    }catch(_){}
  }

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
  let sourceCustomMap = null;
  let userCacheById = {};

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
      if (String(s.ENTITY_ID).toUpperCase() === "SOURCE"){
        map[s.STATUS_ID] = s.NAME;
      }
    }
    return map;
  }
  async function loadSourceMap(){
    const fields = await bx("crm.deal.fields", {});
    const f = fields[SOURCE_FIELD];
    const map = {};
    if (f && f.items) for (const it of f.items) map[it.ID] = it.VALUE;
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
        select: ["ID","TITLE","STAGE_ID",OPERATOR_FIELD,"OPPORTUNITY","CURRENCY_ID","SOURCE_ID", CLOSEDATE_FIELD, BONIF_FIELD, SOURCE_FIELD, ...select],
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

  function renderFooterPhotos(){
    if (!$teamPics) return;
    $teamPics.innerHTML = "";
    [27, 1, 15].forEach((uid)=>{
      const box = document.createElement("div");
      box.className = "teamPic";
      const u = userCacheById[uid];
      const photo = absPhoto(u?.PERSONAL_PHOTO);
      if (photo){
        const img = document.createElement("img");
        img.src = photo;
        img.alt = String(uid);
        img.onerror = ()=>{ box.textContent = String(uid); };
        box.appendChild(img);
      }else{
        box.textContent = String(uid);
      }
      $teamPics.appendChild(box);
    });
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
        <title>${escHtml(title)}</title>
        <style>
          body{ font-family: Arial, system-ui, sans-serif; margin: 18px; color:#111; }
          h1{ font-size:13px; margin:0 0 12px 0; }
          table{ width:100%; border-collapse:collapse; font-size:12px; }
          th, td{ border:1px solid #ddd; padding:8px; vertical-align:top; }
          th{ background:#f3f3f3; text-align:left; }
          @media print{ @page{ size: A4; margin: 12mm; } }
        </style>
      </head>
      <body>
        <h1>${escHtml(title)}</h1>
        <div>${topHTML}</div>
        <div>${contentHTML}</div>
        <script>document.title = ${JSON.stringify(filename || "relatorio")};<\/script>
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
  let prevMetaPctBySellerId = {};
  let bellUntilBySellerId = {};
  let lastSorteioPct = null;
  let sparkleUntil = 0;
  let selectedCompetence = "current";
  let hiddenSellerIds = new Set(
    (JSON.parse(localStorage.getItem("cgd_hidden_sellers") || "[]") || []).map(Number)
  );
  function saveHiddenSellerIds(){
    localStorage.setItem("cgd_hidden_sellers", JSON.stringify(Array.from(hiddenSellerIds)));
  }
  function updateHideButton(){
    const btn = document.getElementById("hideBtn");
    if (!btn) return;
    const n = hiddenSellerIds.size;
    btn.textContent = n > 0 ? `Ocultar cards (${n} ocultos)` : "Ocultar cards";
  }
  function renderHidePanel(){
    if (!$hpList) return;
    const all = getAllVisibleUsersForCards();
    $hpList.innerHTML = all.map(s => {
      const sid = Number(s.userId||0);
      const hidden = hiddenSellerIds.has(sid);
      return `<div class="hpItem" data-hid="${sid}">
        <input type="checkbox" ${hidden ? "" : "checked"} style="width:16px;height:16px;flex:0 0 auto;pointer-events:none;" />
        <span>${escHtml(s.label)}</span>
      </div>`;
    }).join("");
    $hpList.querySelectorAll(".hpItem").forEach(el => {
      el.addEventListener("click", () => {
        const sid = Number(el.getAttribute("data-hid"));
        if (hiddenSellerIds.has(sid)) hiddenSellerIds.delete(sid);
        else hiddenSellerIds.add(sid);
        saveHiddenSellerIds();
        renderHidePanel();
        updateHideButton();
        renderAll();
      });
    });
  }
  function getVisibleSellersForRender(){
    return getAllVisibleUsersForCards().filter(s => !hiddenSellerIds.has(Number(s.userId)));
  }

  function mapDealToItem(d, sellerLabel, sellerId){
    const stageName = stageMap[d.STAGE_ID]||"";
    const opName = operatorMap[d[OPERATOR_FIELD]]||"—";
    const opportunity = parseBRNumber(d.OPPORTUNITY);
    const rawSource = d[SOURCE_FIELD] || "";
    const srcName = (sourceCustomMap && rawSource && sourceCustomMap[rawSource]) ? sourceCustomMap[rawSource] : (rawSource || "—");
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
    const byId = new Map();
    for (const s of all) byId.set(Number(s.userId), s);

    const vals = Array.from(byId.values());
    vals.sort((a,b)=>{
      const na = normalizeText(a.label || "");
      const nb = normalizeText(b.label || "");
      const aManuela = na.startsWith("MANUELA");
      const bManuela = nb.startsWith("MANUELA");
      if (aManuela && Number(a.userId) === 813) return -1;
      if (bManuela && Number(b.userId) === 813) return 1;
      return Number(a.userId) - Number(b.userId);
    });

    const byName = new Map();
    for (const s of vals){
      let key = normalizeText(s.label || "");
      if (!key) continue;
      if (key.startsWith("MANUELA")) key = "MANUELA";
      if (!byName.has(key)){
        byName.set(key, s);
      } else if (key === "MANUELA" && Number(s.userId) === 813){
        byName.set(key, s);
      }
    }
    return Array.from(byName.values());
  }
  function getSellerById(id){
    const all = [...MAIN_SELLERS, ...OTHER_SELLERS, ...SEARCH_ONLY_USERS];
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

  function getStatsForSellerCompetence(sellerId, yyyymm){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    if (ym === nowYYYYMM()){
      return statsBySellerId[sellerId] || { andamentoQtd:0, andamentoValor:0, docsQtd:0, pagQtd:0, metaMes:0, metaPct:0, produzidoMes:0 };
    }
    const meta = getMeta(ym, sellerId);
    const list = (closedWonBySellerId[sellerId] || []).filter(it => normYYYYMM(it.competence) === ym);
    const produzidoMes = list.reduce((s,it)=> s + (Number(it.opportunity)||0), 0);
    const metaPct = meta > 0 ? (produzidoMes / meta) * 100 : 0;
    return { andamentoQtd:0, andamentoValor:0, docsQtd:0, pagQtd:0, metaMes:meta, metaPct, produzidoMes };
  }

  function buildRankingMap(yyyymm){
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    const sellers = getVisibleSellersForRender().slice();
    sellers.sort((a,b)=>{
      const stA = getStatsForSellerCompetence(Number(a.userId), ym);
      const stB = getStatsForSellerCompetence(Number(b.userId), ym);
      const pa = stA.produzidoMes || 0;
      const pb = stB.produzidoMes || 0;
      const ia = stA.andamentoValor || 0;
      const ib = stB.andamentoValor || 0;
      return pb - pa || ib - ia || a.label.localeCompare(b.label,"pt-BR");
    });
    const rankMap = new Map();
    sellers.forEach((s, idx)=> rankMap.set(Number(s.userId), idx + 1));
    return rankMap;
  }

  /* ================= RENDER ================= */
  function sparkleHtml(){
    return '<span style="display:inline-flex;gap:2px;margin-left:8px;animation: none;"><span style="animation: twinkle 0.7s infinite alternate;">✨</span><span style="animation: twinkle 0.9s infinite alternate;">✨</span><span style="animation: twinkle 0.8s infinite alternate;">✨</span></span>';
  }

  function medalForRank(rank){
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  }

  function renderCard(container, seller, rankMap, yyyymm){
    const sid = Number(seller.userId||0);
    const ym = normYYYYMM(yyyymm) || nowYYYYMM();
    const isCurrentMonth = ym === nowYYYYMM();
    const st = getStatsForSellerCompetence(sid, ym);
    const pctTxt = st.metaMes > 0 ? `${st.metaPct.toFixed(1)}%` : `${(st.metaPct||0).toFixed(1)}%`;
    const rank = Number(rankMap.get(sid) || 0);
    const rankClass = rank === 1 ? " rank1" : rank === 2 ? " rank2" : rank === 3 ? " rank3" : "";
    const showBell = isCurrentMonth && (bellUntilBySellerId[sid] || 0) > Date.now();
    const compBadge = !isCurrentMonth ? `<div class="compBadge">${ym}</div>` : "";
    const histContratos = isCurrentMonth ? 0 : (closedWonBySellerId[sid]||[]).filter(it=>normYYYYMM(it.competence)===ym).length;
    const card = document.createElement("section");
    card.className = `card${rankClass}`;
    card.innerHTML = `
      ${showBell ? '<div class="bellBadge">🔔</div>' : ''}
      <div class="head">
        ${compBadge}
        <div class="titleRow">
          <div class="colTitle">
            <div class="avatar" data-avatar="1"></div>
            <div class="rankBadge">${medalForRank(rank) ? `<span class="medal">${medalForRank(rank)}</span>` : ""}<span>#${rank || "—"}</span></div>
            <div class="name">${escHtml(seller.label)}</div>
          </div>
        </div>
        <div class="stats">
          ${isCurrentMonth ? `
            <div class="stat"><b>Em andamento</b><span>${st.andamentoQtd}</span></div>
            <div class="stat"><b>Valor a implantar</b><span class="money">${fmtMoney(st.andamentoValor,"BRL")}</span></div>
            <div class="stat"><b>Aguard. docs</b><span>${st.docsQtd}</span></div>
            <div class="stat"><b>Aguard. pagamento</b><span>${st.pagQtd}</span></div>
          ` : `
            <div class="stat" style="grid-column:span 2"><b>Produzido no mês</b><span class="money">${fmtMoney(st.produzidoMes,"BRL")}</span></div>
            <div class="stat"><b>Contratos</b><span>${histContratos}</span></div>
            <div class="stat"></div>
          `}
          <div class="stat"><b>% da meta</b><span class="money">${pctTxt}</span></div>
          <div class="stat"><b>Meta do mês</b><span class="money">${st.metaMes ? fmtMoney(st.metaMes,"BRL") : "—"}</span></div>
        </div>
        <div class="btnRow">
          ${isCurrentMonth ? `<button class="miniBtn" data-list="1">LISTA</button>` : ""}
          <button class="miniBtn" data-done="1">CONCLUÍDAS</button>
        </div>
      </div>
    `;
    container.appendChild(card);
    renderAvatar(card.querySelector('[data-avatar="1"]'), seller);
    if (isCurrentMonth) card.querySelector('[data-list="1"]').addEventListener("click", ()=>openInProgressList(sid));
    card.querySelector('[data-done="1"]').addEventListener("click", ()=>openConcluidasForSeller(sid));
  }

  function renderAll(){
    $gridTop.innerHTML = "";
    $gridRest.innerHTML = "";

    const ym = selectedCompetence === "current" ? nowYYYYMM() : (normYYYYMM(selectedCompetence) || nowYYYYMM());
    const sellers = getVisibleSellersForRender();
    const rankMap = buildRankingMap(ym);
    sellers.sort((a,b)=>{
      const ra = rankMap.get(Number(a.userId)) || 999;
      const rb = rankMap.get(Number(b.userId)) || 999;
      return ra - rb || a.label.localeCompare(b.label,"pt-BR");
    });

    const top12 = sellers.slice(0, 12);
    const rest = sellers.slice(12);

    for (const s of top12) renderCard($gridTop, s, rankMap, ym);
    for (const s of rest) renderCard($gridRest, s, rankMap, ym);

    updateHintCount();
    $dotStatus.className = "dot";
  }

  function updateHintCount(){
    const q = normalizeText($q.value);
    $hintCount.textContent = q ? `Busca ativa: ${countSearchMatches(q)} resultado(s)` : `Busca: —`;
  }

  function updateCompFilterOptions(){
    if (!$compFilter) return;
    const compSet = new Set();
    for (const sid of Object.keys(closedWonBySellerId)){
      for (const it of (closedWonBySellerId[sid]||[])){
        const c = normYYYYMM(it.competence);
        if (c) compSet.add(c);
      }
    }
    const comps = Array.from(compSet).sort().reverse().slice(0, 13);
    const curVal = $compFilter.value;
    $compFilter.innerHTML = `<option value="current">Mês atual</option>` +
      comps.map(c=>`<option value="${c}">${c}</option>`).join("");
    if (curVal && curVal !== "current" && comps.includes(curVal)){
      $compFilter.value = curVal;
    }
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
      const line1 = `${escHtml(it.client)} • ${fmtMoney(it.opportunity, it.currency||"BRL")}`;
      const line2 = it.type === "ANDAMENTO"
        ? `${escHtml(it.seller)} • ${escHtml(it.operator)} • ${escHtml(it.stage)}`
        : `${escHtml(it.seller)} • ${escHtml(it.operator)} • ${escHtml(it.source || "—")} • ${formatImplantada(it.closeDate)}`;
      return `
        <div class="spItem">
          <div>
            <div class="spMain">${line1}</div>
            <div class="spSub">${line2}</div>
          </div>
        </div>
      `;
    }).join("") || `<div class="spItem" style="cursor:default;"><div class="spMain">Sem resultados.</div></div>`;

    openSearchPanel();

    $spList.querySelectorAll(".spItem").forEach(el=>{
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

  $compFilter.addEventListener("change", ()=>{
    selectedCompetence = $compFilter.value;
    renderAll();
    updateSorteioBar();
  });

  document.getElementById("hideBtn").addEventListener("click", (e)=>{
    e.stopPropagation();
    const visible = $hidePanel.style.display === "block";
    $hidePanel.style.display = visible ? "none" : "block";
    if (!visible) renderHidePanel();
  });
  document.getElementById("hpClose").addEventListener("click", (e)=>{
    e.stopPropagation();
    $hidePanel.style.display = "none";
  });
  document.addEventListener("click", (e)=>{
    if (!e.target.closest(".hideWrap")) $hidePanel.style.display = "none";
  });

  /* ================= LISTA ================= */
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
        <td>${escHtml(it.client)}</td>
        <td>${escHtml(it.operator)}</td>
        <td>${escHtml(it.stage)}</td>
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
          <button class="btn" id="pdfBtn">Exportar PDF</button>
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

  /* ================= CONCLUÍDAS ================= */
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
    const adminBtn = isAdmin ? `<button class="btn btnAdm" id="admBonif">ADM (Bonificação)</button>` : ``;

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
          <button class="btn" id="pdfBtn">Exportar PDF</button>
          <button class="btn" id="csvBtn">Exportar CSV</button>
        </div>
      </div>
    `;

    const rows = list.map(it=>{
      const b = parseBRNumber(it.bonif);
      return `
        <tr>
          <td>${formatImplantada(it.closeDate)}</td>
          <td>${escHtml(it.client)}</td>
          <td>${escHtml(it.operator)}</td>
          <td class="tdRight"><b>${fmtMoney(it.opportunity, it.currency)}</b></td>
          <td>${escHtml(it.source || "—")}</td>
          <td class="tdRight"><b>${b ? fmtMoney(b,"BRL") : "—"}</b></td>
        </tr>
      `;
    }).join("");

    const estornoRows = estornos.map((e)=>`
      <tr>
        <td colspan="4">ESTORNO</td>
        <td>${escHtml(e.client || "—")}</td>
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
          <td>${escHtml(it.client)}</td>
          <td>${escHtml(it.operator)}</td>
          <td>${escHtml(it.source || "—")}</td>
          <td class="tdRight"><b>${fmtMoney(it.opportunity,it.currency)}</b></td>
          <td>
            <input class="inpt" data-b="${it.id}" value="${cur ? String(cur).replace(".",",") : ""}" placeholder="Bonif. (R$)" style="width:160px;">
          </td>
        </tr>
      `;
    }).join("");

    const estRows = estornos.map((e, idx)=>`
      <tr>
        <td colspan="3">${escHtml(e.client || "—")}</td>
        <td class="tdRight"><b>-${fmtMoney(Number(e.value)||0,"BRL")}</b></td>
        <td class="tdRight">
          <button class="btn" data-del-est="${idx}">Remover</button>
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
        </div>
        <div class="btnLine">
          <button class="btn btnAdm" id="saveBonif">Salvar</button>
          <button class="btn btnAdm" id="backList">Voltar</button>
        </div>
      </div>
      <div class="rowFlex">
        <div class="inlineCtrl">
          <input class="inpt" id="estCliente" placeholder="Cliente (estorno)" style="width:260px;">
          <input class="inpt" id="estValor" placeholder="Valor (R$)" style="width:160px;">
          <button class="btn btnAdm" id="addEstorno">Adicionar estorno</button>
        </div>
      </div>
    `;

    $modalContent.innerHTML = `
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
    ctx.font = "bold 14px system-ui, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Fontes", cx, cy);
  }

  function drawPieLabeled(canvas, slices, centerText){
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
    ctx.fillText(centerText || "—", cx, cy);
  }

  function drawBarChart(canvas, data){
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!data.length){
      ctx.fillStyle = "#888";
      ctx.font = `${14*dpr}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Sem dados", canvas.width/2, canvas.height/2);
      return;
    }
    const padL = 60*dpr, padR = 16*dpr, padT = 30*dpr, padB = 40*dpr;
    const chartW = canvas.width - padL - padR;
    const chartH = canvas.height - padT - padB;
    const maxVal = Math.max(...data.map(d=>d.value), 1);
    const barW = chartW / data.length;
    const barPad = Math.max(2*dpr, barW * 0.15);
    ctx.strokeStyle = "rgba(0,0,0,.08)";
    ctx.lineWidth = dpr;
    const steps = 4;
    for (let i=0;i<=steps;i++){
      const y = padT + chartH - (i/steps)*chartH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL+chartW, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.font = `${10*dpr}px system-ui`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const val = (maxVal * i/steps);
      const valStr = val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val.toFixed(0);
      ctx.fillText(valStr, padL - 4*dpr, y);
    }
    data.forEach((d, i)=>{
      const bh = (d.value / maxVal) * chartH;
      const x = padL + i * barW + barPad;
      const bwActual = barW - barPad*2;
      const y = padT + chartH - bh;
      const hue = (i * 47) % 360;
      ctx.fillStyle = `hsl(${hue} 65% 55%)`;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, bwActual, bh, 3*dpr);
      else ctx.rect(x, y, bwActual, bh);
      ctx.fill();
      if (d.value > 0){
        ctx.fillStyle = "#1f2a44";
        ctx.font = `bold ${10*dpr}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        const valStr = d.value >= 1000000 ? `${(d.value/1000000).toFixed(1)}M` : d.value >= 1000 ? `${(d.value/1000).toFixed(1)}k` : d.value.toFixed(0);
        ctx.fillText(valStr, x + bwActual/2, y - 2*dpr);
      }
      ctx.fillStyle = "rgba(0,0,0,.65)";
      ctx.font = `${10*dpr}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const label = String(d.comp || "").replace(/^(\d{4})-(\d{2})$/, "$2/$1");
      ctx.fillText(label, x + bwActual/2, padT + chartH + 4*dpr);
    });
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
    for (let i=-12;i<=12;i++){
      compSet.add(addMonthsYYYYMM(base, i));
    }

    const comps = Array.from(compSet).map(normYYYYMM).filter(Boolean).sort().reverse();
    const compOpts = comps.map(c=>`<option value="${c}" ${c===ym?"selected":""}>${c}</option>`).join("");

    const sellerOpts = [`<option value="ALL" ${sellerFilter==="ALL"?"selected":""}>Todas</option>`]
      .concat(allSellers.map(s=>{
        const sid = Number(s.userId||0);
        return `<option value="${sid}" ${String(sellerFilter)===String(sid)?"selected":""}>${escHtml(s.label)}</option>`;
      })).join("");

    const sourceOpts = [`<option value="ALL" ${sourceFilter==="ALL"?"selected":""}>Todas</option>`]
      .concat(Object.keys(totalsBySource).sort((a,b)=>(totalsBySource[b]-totalsBySource[a]) || a.localeCompare(b,"pt-BR")).map(src=>{
        return `<option value="${escHtml(src)}" ${String(sourceFilter)===String(src)?"selected":""}>${escHtml(src)} • ${fmtMoney(totalsBySource[src]||0,"BRL")}</option>`;
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
          <button class="btn" id="pdfBtn">Exportar PDF</button>
          <button class="btn" id="csvBtn">Exportar CSV</button>
        </div>
      </div>

      <div class="smallNote" style="margin-bottom:10px;">
        <b>Produção por Fonte • ${ym}</b> — valores e percentuais do filtro atual.
      </div>
    `;

    const sourceRows = sources.map((k)=>{
      const v = totalsBySource[k] || 0;
      const pct = totalLista > 0 ? (v/totalLista)*100 : 0;
      return `
        <tr>
          <td>${escHtml(k)}</td>
          <td class="tdRight"><b>${fmtMoney(v,"BRL")}</b></td>
          <td class="tdRight"><b>${pct.toFixed(1)}%</b></td>
        </tr>
      `;
    }).join("");

    const listRows = filtered.map(it=>`
      <tr>
        <td>${escHtml(it.sellerName)}</td>
        <td>${formatImplantada(it.closeDate)}</td>
        <td>${escHtml(it.client)}</td>
        <td>${escHtml(it.operator)}</td>
        <td>${escHtml(it.source || "—")}</td>
        <td class="tdRight"><b>${fmtMoney(it.opportunity,it.currency)}</b></td>
      </tr>
    `).join("");

    $modalContent.innerHTML = `
      <div class="pieWrap" style="margin-bottom:8px;">
        <div class="pieBox">
          <canvas id="pieCanvas" width="360" height="240"></canvas>
        </div>

        <div class="pieBox" style="flex:1 1 520px; min-width:320px;">
          <table class="table" style="margin:0;">
            <thead>
              <tr>
                <th>Fonte</th>
                <th class="tdRight">Produção (R$)</th>
                <th class="tdRight">%</th>
              </tr>
            </thead>
            <tbody>
              ${sourceRows || `<tr><td colspan="3">Sem dados.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Vendedora</th>
            <th>IMPLANTADA EM</th>
            <th>Negócio</th>
            <th>Operadora</th>
            <th>Fonte</th>
            <th class="tdRight">VLR PRODUZIDO</th>
          </tr>
        </thead>
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

    document.getElementById("admComp").addEventListener("change", async (e)=>{
      await renderConcluidasAdmModal(e.target.value, sellerFilter, sourceFilter);
    });
    document.getElementById("admSeller").addEventListener("change", async (e)=>{
      await renderConcluidasAdmModal(ym, e.target.value, sourceFilter);
    });
    document.getElementById("admSource").addEventListener("change", async (e)=>{
      await renderConcluidasAdmModal(ym, sellerFilter, e.target.value);
    });

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

  function exportAnaliseCSV(list){
    const header = ["COMPETENCIA","VENDEDORA","IMPLANTADA_EM","NEGOCIO","OPERADORA","FONTE","VLR_PRODUZIDO"];
    const lines = [header.join(";")];
    for (const it of list){
      lines.push([
        `"${normYYYYMM(it.competence)||"—"}"`,
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
    a.download = `analise_${nowYYYYMM()}.csv`;
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
    for (let i=-12;i<=12;i++){
      compSet.add(addMonthsYYYYMM(nowYYYYMM(), i));
    }
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
          <button class="btn" id="pdfBtn">Exportar PDF</button>
        </div>
      </div>
      <div class="smallNote" style="margin-bottom:10px;">
        *Bonificação (R$)* aqui já considera estornos (bonif - estornos).
      </div>
    `;

    const rows = ranked.map((r, idx)=>`
      <tr>
        <td><b>#${idx+1}</b> ${escHtml(r.seller)} <span style="opacity:.75;">(#${r.sid})</span></td>
        <td class="tdRight"><b>${fmtMoney(r.produzido,"BRL")}</b></td>
        <td class="tdRight"><b>${r.meta ? fmtMoney(r.meta,"BRL") : "—"}</b></td>
        <td class="tdRight"><b>${r.meta ? r.pct.toFixed(1)+"%" : "—"}</b></td>
        <td class="tdRight"><b>${fmtMoney(r.bonifLiquida,"BRL")}</b></td>
      </tr>
    `).join("");

    $modalContent.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Vendedora (ranking)</th>
            <th class="tdRight">Produzido</th>
            <th class="tdRight">Meta</th>
            <th class="tdRight">% Meta</th>
            <th class="tdRight">Bonificação (R$)</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="5">Sem dados.</td></tr>`}</tbody>
      </table>
    `;

    document.getElementById("bonifComp").addEventListener("change", async (e)=>{
      await openBonifRankingADMForCompetence(e.target.value);
    });

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
          <span class="pillSmall">Filtro: <b>${escHtml(qNorm || "—")}</b></span>
        </div>
        <div class="btnLine">
          <button class="btn" id="pdfBtn">Exportar PDF</button>
        </div>
      </div>
    `;
    const rows = hits.map(it=>`
      <tr>
        <td>${escHtml(it.seller || "—")}</td>
        <td>${escHtml(it.client)}</td>
        <td>${escHtml(it.operator)}</td>
        <td>${escHtml(it.type === "ANDAMENTO" ? it.stage : "CONCLUÍDA")}</td>
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

  /* ================= ANÁLISE ================= */
  async function openAnaliseModal(sellerFilter, compFilter, operFilter, srcFilter){
    openModal("ANÁLISE", null);

    const allSellers = getAllVisibleUsersForCards().slice().sort((a,b)=>a.label.localeCompare(b.label,"pt-BR"));

    let allRecords = [];
    for (const s of allSellers){
      const sid = Number(s.userId||0);
      for (const it of (closedWonBySellerId[sid]||[])){
        allRecords.push({ ...it, sellerName: s.label, sellerId: sid });
      }
    }

    const compSet = new Set(allRecords.map(x=>normYYYYMM(x.competence)).filter(Boolean));
    const comps = Array.from(compSet).sort().reverse();

    let filtered = allRecords.slice();
    if (sellerFilter !== "ALL"){
      const sid = Number(sellerFilter);
      filtered = filtered.filter(x => Number(x.sellerId) === sid);
    }
    if (compFilter !== "ALL"){
      const ym = normYYYYMM(compFilter);
      filtered = filtered.filter(x => normYYYYMM(x.competence) === ym);
    }

    const operSet = new Set(allRecords.map(x => x.operator || "—").filter(Boolean));
    const srcSet = new Set(allRecords.map(x => x.source || "—").filter(Boolean));

    if (operFilter !== "ALL") filtered = filtered.filter(x => (x.operator || "—") === operFilter);
    if (srcFilter !== "ALL") filtered = filtered.filter(x => (x.source || "—") === srcFilter);

    const totalProduzido = filtered.reduce((s,x)=> s + (Number(x.opportunity)||0), 0);
    const totalContratos = filtered.length;
    const ticketMedio = totalContratos > 0 ? totalProduzido / totalContratos : 0;

    const byMonth = {};
    for (const x of filtered){
      const c = normYYYYMM(x.competence) || "—";
      byMonth[c] = (byMonth[c]||0) + (Number(x.opportunity)||0);
    }
    const bestMonthEntry = Object.entries(byMonth).sort((a,b)=>b[1]-a[1])[0];

    const bySellerProd = {};
    for (const x of filtered) bySellerProd[x.sellerName] = (bySellerProd[x.sellerName]||0) + (Number(x.opportunity)||0);
    const bestSellerEntry = Object.entries(bySellerProd).sort((a,b)=>b[1]-a[1])[0];

    const byOper = {};
    for (const x of filtered){ const k = x.operator || "—"; byOper[k] = (byOper[k]||0) + (Number(x.opportunity)||0); }
    const bySrc = {};
    for (const x of filtered){ const k = x.source || "—"; bySrc[k] = (bySrc[k]||0) + (Number(x.opportunity)||0); }

    const sellerOpts = [`<option value="ALL" ${sellerFilter==="ALL"?"selected":""}>Todas</option>`]
      .concat(allSellers.map(s=>{
        const sid = String(s.userId||0);
        return `<option value="${sid}" ${sellerFilter===sid?"selected":""}>${escHtml(s.label)}</option>`;
      })).join("");
    const compOpts = [`<option value="ALL" ${compFilter==="ALL"?"selected":""}>Todas (acumulado)</option>`]
      .concat(comps.map(c=>`<option value="${c}" ${compFilter===c?"selected":""}>${c}</option>`)).join("");
    const operOpts = [`<option value="ALL" ${operFilter==="ALL"?"selected":""}>Todas</option>`]
      .concat(Array.from(operSet).sort().map(o=>`<option value="${escHtml(o)}" ${operFilter===o?"selected":""}>${escHtml(o)}</option>`)).join("");
    const srcOpts = [`<option value="ALL" ${srcFilter==="ALL"?"selected":""}>Todas</option>`]
      .concat(Array.from(srcSet).sort().map(o=>`<option value="${escHtml(o)}" ${srcFilter===o?"selected":""}>${escHtml(o)}</option>`)).join("");

    $modalTop.innerHTML = `
      <div class="rowFlex">
        <div class="inlineCtrl">
          <span class="pillSmall">Vendedora</span>
          <select class="sel" id="anSeller">${sellerOpts}</select>
          <span class="pillSmall">Competência</span>
          <select class="sel" id="anComp">${compOpts}</select>
          <span class="pillSmall">Operadora</span>
          <select class="sel" id="anOper">${operOpts}</select>
          <span class="pillSmall">Fonte</span>
          <select class="sel" id="anSrc">${srcOpts}</select>
        </div>
      </div>
    `;

    const rankingData = Object.entries(bySellerProd)
      .map(([name, prod]) => {
        const sellerObj = allSellers.find(s=>s.label===name);
        const sid = sellerObj ? Number(sellerObj.userId||0) : 0;
        const contracts = filtered.filter(x=>x.sellerName===name).length;
        const ticket = contracts > 0 ? prod/contracts : 0;
        const ym2 = compFilter !== "ALL" ? normYYYYMM(compFilter) : nowYYYYMM();
        const meta = getMeta(ym2, sid);
        const metaPct = meta > 0 ? (prod/meta)*100 : null;
        return { name, prod, contracts, ticket, meta, metaPct };
      })
      .sort((a,b)=>b.prod-a.prod);

    const compsOrdered = Array.from(new Set(filtered.map(x=>normYYYYMM(x.competence)).filter(Boolean))).sort();
    const prodByMonth = compsOrdered.map(c=>{
      const v = filtered.filter(x=>normYYYYMM(x.competence)===c).reduce((s,x)=>s+(Number(x.opportunity)||0),0);
      return { comp:c, value:v };
    });

    const detailSorted = filtered.slice().sort((a,b)=>
      String(b.closeDate||"").localeCompare(String(a.closeDate||"")) || a.sellerName.localeCompare(b.sellerName,"pt-BR")
    );
    const detailRows = detailSorted.map(it=>`
      <tr>
        <td>${escHtml(normYYYYMM(it.competence)||"—")}</td>
        <td>${escHtml(it.sellerName)}</td>
        <td>${formatImplantada(it.closeDate)}</td>
        <td>${escHtml(it.client)}</td>
        <td>${escHtml(it.operator||"—")}</td>
        <td>${escHtml(it.source||"—")}</td>
        <td class="tdRight"><b>${fmtMoney(it.opportunity, it.currency)}</b></td>
      </tr>
    `).join("");

    const rankRows = rankingData.map((r,idx)=>`
      <tr>
        <td><b>#${idx+1}</b></td>
        <td>${escHtml(r.name)}</td>
        <td class="tdRight"><b>${fmtMoney(r.prod,"BRL")}</b></td>
        <td class="tdRight">${r.contracts}</td>
        <td class="tdRight">${fmtMoney(r.ticket,"BRL")}</td>
        <td class="tdRight">${r.metaPct !== null ? r.metaPct.toFixed(1)+"%" : "—"}</td>
      </tr>
    `).join("");

    $modalContent.innerHTML = `
      <div class="kpiGrid">
        <div class="kpiCard"><b>Total produzido</b><span>${fmtMoney(totalProduzido,"BRL")}</span></div>
        <div class="kpiCard"><b>Total contratos</b><span>${totalContratos}</span></div>
        <div class="kpiCard"><b>Ticket médio</b><span>${fmtMoney(ticketMedio,"BRL")}</span></div>
        <div class="kpiCard"><b>Melhor mês</b><span>${bestMonthEntry ? escHtml(bestMonthEntry[0]) : "—"}</span></div>
        <div class="kpiCard"><b>Melhor vendedora</b><span style="font-size:14px;">${bestSellerEntry ? escHtml(bestSellerEntry[0]) : "—"}</span></div>
      </div>

      <div style="margin-bottom:14px;">
        <div style="font-weight:950;font-size:14px;margin-bottom:6px;">Produção por mês (R$)</div>
        <canvas id="barChart" width="800" height="220" style="width:100%;height:220px;display:block;"></canvas>
      </div>

      <div class="pieWrap" style="margin-bottom:14px;">
        <div class="pieBox">
          <div style="font-weight:950;font-size:13px;margin-bottom:6px;">Por Operadora</div>
          <canvas id="pieOper" width="300" height="200"></canvas>
        </div>
        <div class="pieBox">
          <div style="font-weight:950;font-size:13px;margin-bottom:6px;">Por Fonte</div>
          <canvas id="pieSrc" width="300" height="200"></canvas>
        </div>
      </div>

      <div style="font-weight:950;font-size:14px;margin-bottom:6px;">Ranking por vendedora</div>
      <table class="table" style="margin-bottom:14px;">
        <thead><tr><th>#</th><th>Vendedora</th><th class="tdRight">Produzido</th><th class="tdRight">Contratos</th><th class="tdRight">Ticket médio</th><th class="tdRight">% Meta</th></tr></thead>
        <tbody>${rankRows || `<tr><td colspan="6">Sem dados.</td></tr>`}</tbody>
      </table>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-weight:950;font-size:14px;">Detalhe dos registros</span>
        <button class="btn" id="anExportCSV">Exportar CSV</button>
      </div>
      <table class="table">
        <thead><tr><th>Competência</th><th>Vendedora</th><th>Implantada em</th><th>Negócio</th><th>Operadora</th><th>Fonte</th><th class="tdRight">Valor</th></tr></thead>
        <tbody>${detailRows || `<tr><td colspan="7">Sem dados.</td></tr>`}</tbody>
      </table>
    `;

    setTimeout(()=>{
      const barCanvas = document.getElementById("barChart");
      if (barCanvas){
        const dpr = window.devicePixelRatio || 1;
        const rect = barCanvas.getBoundingClientRect();
        barCanvas.width = Math.round(rect.width * dpr);
        barCanvas.height = 220 * dpr;
        drawBarChart(barCanvas, prodByMonth);
      }
      const cvOper = document.getElementById("pieOper");
      if (cvOper){
        const operSlices = Object.entries(byOper).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({label:k, value:v})).filter(x=>x.value>0);
        drawPieLabeled(cvOper, operSlices.length ? operSlices : [{label:"—",value:1}], "Operadoras");
      }
      const cvSrc = document.getElementById("pieSrc");
      if (cvSrc){
        const srcSlices = Object.entries(bySrc).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({label:k, value:v})).filter(x=>x.value>0);
        drawPieLabeled(cvSrc, srcSlices.length ? srcSlices : [{label:"—",value:1}], "Fontes");
      }
    }, 0);

    const reopen = async ()=>{
      const sf = document.getElementById("anSeller")?.value || "ALL";
      const cf = document.getElementById("anComp")?.value || "ALL";
      const of2 = document.getElementById("anOper")?.value || "ALL";
      const srf = document.getElementById("anSrc")?.value || "ALL";
      await openAnaliseModal(sf, cf, of2, srf);
    };
    document.getElementById("anSeller").addEventListener("change", reopen);
    document.getElementById("anComp").addEventListener("change", reopen);
    document.getElementById("anOper").addEventListener("change", reopen);
    document.getElementById("anSrc").addEventListener("change", reopen);
    document.getElementById("anExportCSV").addEventListener("click", ()=>exportAnaliseCSV(detailSorted));
  }

  /* ================= THEME ================= */
  function setTheme(cls){
    document.body.classList.remove("theme-dark","theme-blue","theme-light");
    document.body.classList.add("theme-light");
    localStorage.setItem("cgd_theme", "theme-light");
  }
  document.getElementById("themeDark").addEventListener("click", ()=>setTheme("theme-dark"));
  document.getElementById("themeBlue").addEventListener("click", ()=>setTheme("theme-dark"));

  (function restoreTheme(){
    setTheme("theme-light");
  })();

  document.getElementById("refreshNow").addEventListener("click", loadAll);
  document.getElementById("clearSearch").addEventListener("click", ()=>{
    $q.value="";
    closeSearchPanel();
    updateHintCount();
  });

  /* ================= ADM METAS ================= */
  function buildCompetenceListWindow(){
    const set = new Set();

    for (const sid of Object.keys(closedWonBySellerId)){
      for (const it of (closedWonBySellerId[sid]||[])){
        const c = normYYYYMM(it.competence);
        if (c) set.add(c);
      }
    }

    const base = nowYYYYMM();
    for (let i=-12;i<=12;i++){
      set.add(addMonthsYYYYMM(base, i));
    }

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
          <td>${escHtml(s.label)}</td>
          <td>#${sid}</td>
          <td>
            <input class="inpt" data-meta="${sid}" value="${cur ? String(cur).replace(".",",") : ""}" placeholder="Meta (R$)" style="width:180px;">
          </td>
        </tr>
      `;
    }).join("");

    const sorteioCur = Number(cfg.sorteioMeta || 0);

    $modalTop.innerHTML = `
      <div class="rowFlex">
        <div class="inlineCtrl">
          <span class="pillSmall">Competência</span>
          <select class="sel" id="metaComp">${compOpts}</select>
          <button class="btn btnAdm" id="metaPrev">◀ Mês anterior</button>
          <button class="btn btnAdm" id="metaNext">Mês seguinte ▶</button>

          <span class="pillSmall">Meta Sorteio (R$)</span>
          <input class="inpt" id="metaSorteio" value="${sorteioCur ? String(sorteioCur).replace(".",",") : ""}" placeholder="Meta Sorteio (R$)" style="width:180px;">
        </div>
        <div class="btnLine">
          <button class="btn btnAdm" id="saveMetas">Salvar</button>
        </div>
      </div>
      <div class="pillSmall">Salva no Bitrix (Deal ${CFG_TITLE_PREFIX}${ym})</div>
    `;

    $modalContent.innerHTML = `
      <table class="table">
        <thead><tr><th>Vendedora</th><th>ID</th><th>Meta do mês (R$)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    document.getElementById("metaComp").addEventListener("change", async (e)=>{
      await openAdmMetasByCompetence(e.target.value);
    });
    document.getElementById("metaPrev").addEventListener("click", async ()=>{
      await openAdmMetasByCompetence(addMonthsYYYYMM(ym, -1));
    });
    document.getElementById("metaNext").addEventListener("click", async ()=>{
      await openAdmMetasByCompetence(addMonthsYYYYMM(ym, 1));
    });

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

  document.getElementById("admMetas").addEventListener("click", async ()=>{
    const pass = prompt("Senha ADM:");
    if (pass == null) return;
    if (normalizePass(pass) !== normalizePass(ADMIN_PASS)){
      alert("Senha incorreta.");
      return;
    }
    await openAdmMetasByCompetence(nowYYYYMM());
  });

  document.getElementById("admDoneAll").addEventListener("click", openConcluidasAdm);
  document.getElementById("admBonifRanking").addEventListener("click", openBonifRankingADM);
  document.getElementById("admAnalise").addEventListener("click", ()=>{
    openAnaliseModal("ALL", "ALL", "ALL", "ALL");
  });

  /* ================= LOAD ================= */
  let loading = false;

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

  let sorteioSparkTimer = null;

  function updateSorteioBar(){
    const ym = selectedCompetence === "current" ? nowYYYYMM() : (normYYYYMM(selectedCompetence) || nowYYYYMM());
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

    if ($sorteioSpark){
      const shouldAnimate = selectedCompetence === "current" && lastSorteioPct !== null && pct > lastSorteioPct + 0.0001;
      if (shouldAnimate){
        $sorteioSpark.classList.add("active");
        if (sorteioSparkTimer) clearTimeout(sorteioSparkTimer);
        sorteioSparkTimer = setTimeout(()=> $sorteioSpark.classList.remove("active"), 2200);
      } else if (lastSorteioPct === null) {
        $sorteioSpark.classList.remove("active");
      }
    }

    lastSorteioPct = pct;
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
      if(!sourceCustomMap) sourceCustomMap = await loadSourceMap();
      await ensureUsersAndResolve();
      renderFooterPhotos();

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
          const deals = await fetchDeals({
            userId: sid,
            categoryId: CATEGORY_ID_MAIN,
            extraFilter: { CLOSED: "N" }
          });

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

          const closedDeals = await fetchDeals({
            userId:sid,
            categoryId:CATEGORY_ID_MAIN,
            extraFilter:{ CLOSED:"Y" }
          });
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
            metaPct,
            produzidoMes: fechadosMesValor
          };

          okCount++;
        }catch(e){
          failCount++;
          statsBySellerId[sid] = { andamentoQtd:0, andamentoValor:0, docsQtd:0, pagQtd:0, metaMes:getMeta(curYM, sid), metaPct:0, produzidoMes:0 };
          inProgressBySellerId[sid] = [];
          closedWonBySellerId[sid] = [];
          $err.textContent += `\n[USER ${sid}] ${e?.message || e}\n`;
        }
      }, LOAD_CONCURRENCY);

      const nowTs = Date.now();
      for (const sid of Object.keys(statsBySellerId)){
        const numSid = Number(sid);
        const prev = Number(prevMetaPctBySellerId[numSid] || 0);
        const cur = Number(statsBySellerId[numSid]?.metaPct || 0);
        if (prev >= 0 && cur > prev){
          bellUntilBySellerId[numSid] = nowTs + 10000;
          playMetaBell();
          setTimeout(()=>{ try{ renderAll(); }catch(_){ } }, 10200);
        }
        prevMetaPctBySellerId[numSid] = cur;
      }

      rebuildGlobalSearchIndex();
      updateCompFilterOptions();
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

  /* init */
  loadAll();
  setInterval(loadAll, 600000);
})();