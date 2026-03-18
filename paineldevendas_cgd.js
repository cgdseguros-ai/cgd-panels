(function(){
  const html = `
  <div id="app">
    <header>
      <div class="brand">
        <div class="logo" title="CGD">
          <img alt="CGD" src="https://bitrix24public.com/b24-6iyx5y.bitrix24.com.br/docs/pub/c77325321d1ad38e8012b995a5f4e8dd/showFile/?&token=soik95n9dd9n">
        </div>
        <div class="titles">
          <h1>Controle de Propostas – Planos de Saúde</h1>
          <div class="sub">(BITRIX24)</div>
        </div>
      </div>
      <div class="right">
        <div class="rightRow row1">
          <div class="pill"><span class="dot" id="dotStatus"></span><span id="clock">--/--/---- --:--</span></div>
          <div class="pill"><span id="loadStatus">Aguardando…</span></div>
          <div class="searchWrap">
            <div class="search"><span class="searchIcon">⌕</span><input id="q" placeholder="Buscar: cliente, operadora, etapa, vendedora…" autocomplete="off" /></div>
            <div class="searchPanel" id="searchPanel">
              <div class="spHead"><span id="spCount">—</span><div style="display:flex;gap:8px;align-items:center;"><button class="btn" id="spOpenAll">Abrir tudo</button><button class="btn" id="spClose">Fechar</button></div></div>
              <div class="spList" id="spList"></div>
            </div>
          </div>
        </div>
        <div class="rightRow row2">
          <button class="btn" id="themeDark">Escuro</button>
          <button class="btn btnAdm" id="admMetas">ADM (Metas)</button>
          <button class="btn btnAdm" id="admBonifRanking">BONIFICAÇÃO (ADM)</button>
          <button class="btn btnAdm" id="admDoneAll">CONCLUÍDAS (ADM)</button>
          <button class="btn" id="clearSearch">Limpar</button>
          <button class="btn" id="refreshNow">Atualizar agora</button>
        </div>
      </div>
    </header>
    <main>
      <div class="sorteioBar" id="sorteioBar">
        <div class="sLeft"><div class="sBadge">SORTEIO</div><div class="pill"><span>Competência:</span><b id="sorteioYm">—</b></div></div>
        <div class="pill"><span>%:</span><b id="sorteioPct">—</b></div>
      </div>
      <div class="gridTop" id="gridTop"></div>
      <div class="gridRest" id="gridRest"></div>
      <div class="footerZero" id="footerZero" style="display:none;"><div style="margin:0 0 8px 0; font-size:14px; opacity:.9;">Usuários com <b>0</b> em andamento</div><div class="zeroRow" id="zeroRow"></div></div>
      <div class="hint"><span>F11 = tela cheia</span><span>Zoom: Ctrl - / Ctrl +</span><span id="hintCount"></span></div>
      <div class="err" id="err"></div>
    </main>
    <footer class="bottomBar">
      <div class="bottomLeft"><div class="teamPics" id="teamPics"></div><div class="addressBlock"><div class="addressTitle">Endereço</div><div class="addressText">Av Ayrton Senna, 2500, SS109, Barra da Tijuca</div></div></div>
      <div class="bottomCenter">System created by GRUPO CGD</div>
      <div class="bottomRight">
        <div class="corpBox"><div class="corpTitle">CGD CORRETORA</div><div class="corpSub">CNPJ 01.654.471/0001-86 • SUSEP 202031791</div></div>
        <div class="corpBox"><div class="corpTitle">CGD BARRA</div><div class="corpSub">CNPJ 53.013.848/0001-11 • SUSEP 242158650</div></div>
      </div>
    </footer>
  </div>
  <div class="modalBack" id="modalBack" role="dialog" aria-modal="true"><div class="modal"><div class="modalHead"><div class="modalBrand"><div class="modalLogo" title="CGD"><img alt="CGD" src="https://bitrix24public.com/b24-6iyx5y.bitrix24.com.br/docs/pub/c77325321d1ad38e8012b995a5f4e8dd/showFile/?&token=soik95n9dd9n"></div><div class="modalTitle"><div class="avatar" id="modalAvatar" style="width:52px;height:52px;"></div><h3 id="modalTitle">Detalhes</h3></div></div><button class="modalClose" id="modalClose">Fechar</button></div><div class="modalBody"><div id="modalTop"></div><div id="modalContent"></div></div></div></div>`;
  const css = `html,body{height:100%;margin:0;background:#000}body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#fff;overflow:hidden}*{box-sizing:border-box}#app{position:fixed;inset:0;overflow:hidden;display:grid;grid-template-rows:auto 1fr auto;background:linear-gradient(180deg,#0b0d10,#121418)}header{padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.08);background:#000;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;min-height:72px}.brand{display:flex;align-items:center;gap:12px;min-width:280px;flex:1 1 320px}.logo{width:42px;height:42px;border-radius:12px;overflow:hidden;background:#111}.logo img,.modalLogo img,.avatar img{width:100%;height:100%;object-fit:cover;display:block}.titles{display:flex;flex-direction:column;gap:2px;min-width:0}h1{margin:0;font-size:24px;line-height:1.05}.sub{font-size:13px;color:rgba(255,255,255,.72)}.right{display:flex;flex-direction:column;gap:8px;flex:2 1 680px;align-items:flex-end;min-width:340px}.rightRow{width:100%;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pill,.btn{min-height:38px;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:12px;font-size:14px;white-space:nowrap}.pill{border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.06);color:#fff}.btn{border:1px solid rgba(255,255,255,.18);background:#fff;color:#000;font-weight:700;cursor:pointer}.dot{width:8px;height:8px;border-radius:50%;background:#18b45b;box-shadow:0 0 0 3px rgba(24,180,91,.18)}.dot.warn{background:#c27a00}.dot.bad{background:#d64545}.searchWrap{position:relative;flex:1 1 420px;min-width:260px;max-width:560px}.search{display:flex;align-items:center;gap:10px;padding:8px 12px;width:100%;border-radius:12px;border:1px solid rgba(255,255,255,.10);background:#fff}.search input{width:100%;border:none;outline:none;background:transparent;color:#000;font-size:15px}.searchPanel{position:absolute;top:calc(100% + 8px);left:0;width:100%;max-width:560px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:#15181d;box-shadow:0 18px 44px rgba(0,0,0,.35);overflow:hidden;display:none;z-index:50}.spHead{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.10);font-size:13px;color:#fff;display:flex;justify-content:space-between;gap:10px;align-items:center}.spList{max-height:340px;overflow:auto}.spItem{padding:12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.08)}.spItem:hover{background:rgba(255,255,255,.06)}.spMain{font-size:14px}.spSub{font-size:12px;color:rgba(255,255,255,.7);margin-top:2px}main{padding:14px 16px 10px;overflow:auto;display:flex;flex-direction:column;gap:14px;min-height:0}.sorteioBar,.footerZero{border:1px solid rgba(255,255,255,.10);border-radius:16px;background:rgba(255,255,255,.06);padding:10px 12px}.sorteioBar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.sLeft{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.sBadge{padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);font-weight:900;font-size:15px}.gridTop{display:grid;grid-template-columns:repeat(4,minmax(320px,1fr));gap:16px}.gridRest{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}@media (max-width:1600px){.gridTop{grid-template-columns:repeat(3,minmax(320px,1fr))}}@media (max-width:1180px){.gridTop{grid-template-columns:repeat(2,minmax(320px,1fr))}}@media (max-width:780px){.gridTop,.gridRest{grid-template-columns:1fr}}.card{border:1px solid rgba(0,0,0,.10);border-radius:18px;background:linear-gradient(180deg,#f6f1e8,#efe8dc);box-shadow:0 18px 42px rgba(0,0,0,.22);overflow:hidden;color:#121826}.head{padding:18px}.titleRow{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px}.colTitle{display:flex;align-items:center;gap:12px;min-width:0}.avatar{width:58px;height:58px;border-radius:50%;border:1px solid rgba(0,0,0,.10);background:rgba(0,0,0,.04);overflow:hidden;display:flex;align-items:center;justify-content:center;font-weight:900;color:rgba(18,24,38,.65)}.rankBadge{min-width:34px;height:34px;padding:0 10px;border-radius:999px;background:#111;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:16px;font-weight:900}.name{font-size:22px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:280px}.tag{font-size:13px;color:rgba(18,24,38,.65);padding:7px 12px;border-radius:999px;border:1px solid rgba(0,0,0,.08);background:rgba(0,0,0,.03);font-weight:700}.stats{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.stat{border:1px solid rgba(0,0,0,.08);background:rgba(0,0,0,.03);border-radius:14px;padding:12px;min-height:64px}.stat b{display:block;font-size:14px;margin-bottom:4px}.stat span{font-size:18px;color:rgba(18,24,38,.72);font-weight:800;line-height:1.2}.btnRow{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.miniBtn{border:1px solid rgba(0,0,0,.12);background:#fff;color:#000;padding:10px 12px;border-radius:12px;cursor:pointer;font-size:14px;font-weight:800}.zeroRow{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.zeroChip{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08)}.zeroChip .avatar{width:28px;height:28px}.zeroName{font-size:13px;font-weight:800;color:#fff}.hint{color:rgba(255,255,255,.68);font-size:13px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;padding-bottom:6px}.err{color:#ff9c9c;font-size:13px;white-space:pre-wrap;border:1px solid rgba(214,69,69,.25);padding:10px 12px;border-radius:12px;background:rgba(214,69,69,.08)}.err:empty{display:none}.modalBack{position:fixed;inset:0;background:rgba(15,20,35,.55);display:none;align-items:center;justify-content:center;z-index:80;padding:18px}.modal{width:min(1360px,96vw);max-height:88vh;border-radius:18px;border:1px solid rgba(255,255,255,.18);background:rgba(18,20,26,.98);overflow:hidden;display:flex;flex-direction:column;color:rgba(245,247,255,.92)}.modalHead{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.10);display:flex;align-items:center;justify-content:space-between;gap:10px}.modalBrand{display:flex;align-items:center;gap:10px;min-width:0}.modalLogo{width:36px;height:36px;border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06)}.modalTitle{display:flex;align-items:center;gap:12px;min-width:0}.modalTitle h3{margin:0;font-size:20px;font-weight:950}.modalBody{padding:14px 16px;overflow:auto}.modalClose{border:1px solid rgba(255,255,255,.12);background:#fff;border-radius:12px;padding:10px 12px;cursor:pointer;font-size:14px;color:#000;font-weight:800}.rowFlex{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-bottom:10px}.pillSmall{display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);font-size:14px;color:rgba(245,247,255,.92)}.inlineCtrl{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.sel,.inpt{padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;outline:none;font-size:14px}.table{width:100%;border-collapse:separate;border-spacing:0;overflow:hidden;border-radius:14px;border:1px solid rgba(255,255,255,.12)}.table th,.table td{padding:12px;font-size:14px;border-bottom:1px solid rgba(255,255,255,.10);vertical-align:top}.table th{text-align:left;font-weight:950;color:rgba(245,247,255,.94);background:rgba(255,255,255,.08);position:sticky;top:0;z-index:5}.table td{color:rgba(245,247,255,.9);background:rgba(255,255,255,.05)}.tdRight{text-align:right;white-space:nowrap}.smallNote{font-size:14px;color:rgba(245,247,255,.8)}.btnLine{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:flex-end}.bottomBar{min-height:74px;background:#000;color:#fff;border-top:1px solid rgba(255,255,255,.10);display:grid;grid-template-columns:1.25fr .8fr 1.35fr;align-items:center;gap:16px;padding:10px 14px}.bottomLeft,.bottomRight{display:flex;align-items:center;gap:12px;min-width:0}.bottomCenter{text-align:center;font-size:15px;font-weight:800}.teamPics{display:flex;align-items:center}.teamPic{width:42px;height:42px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,.18);background:#111;margin-right:-8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:900}.teamPic img{width:100%;height:100%;object-fit:cover;display:block}.addressTitle,.corpTitle{font-size:13px;font-weight:900;color:#fff}.addressText,.corpSub{font-size:12px;color:rgba(255,255,255,.78);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`;
  document.documentElement.lang='pt-br';
  document.body.innerHTML = html;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  document.getElementById('refreshNow').addEventListener('click', ()=>location.reload());
  document.getElementById('themeDark').addEventListener('click', ()=>document.body.classList.toggle('theme-dark'));
  document.getElementById('spClose').addEventListener('click', ()=>document.getElementById('searchPanel').style.display='none');
  document.getElementById('clearSearch').addEventListener('click', ()=>{document.getElementById('q').value='';document.getElementById('searchPanel').style.display='none';});
  document.getElementById('modalClose').addEventListener('click', ()=>document.getElementById('modalBack').style.display='none');
  const teamPics = document.getElementById('teamPics');
  [27,1,15].forEach(id=>{
    const d=document.createElement('div'); d.className='teamPic'; d.textContent=String(id); teamPics.appendChild(d);
  });
  const clock = document.getElementById('clock');
  const p=n=>String(n).padStart(2,'0');
  setInterval(()=>{const d=new Date();clock.textContent=`${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`},500);
})();