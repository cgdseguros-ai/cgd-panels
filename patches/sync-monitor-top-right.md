# Patch: mover monitor SYNC para o canto superior direito

## Objetivo

Alterar somente o layout do monitor `SYNC: Sincronizando__`, colocando-o no espaço vazio superior direito da barra superior preta.

Atualmente ele aparece abaixo da linha de botões da barra superior. O comportamento desejado é:

- O monitor SYNC deve ficar no canto superior direito da `.eqd-topbar`.
- Não deve ocupar uma linha própria abaixo dos botões.
- Não deve alterar a lógica de sincronização, contadores, API em uso ou fila pendente.
- Não deve mexer em funções de Bitrix, painel individual, reagendamento ou modal.

## Alteração sugerida em `equipe17.js`

Localizar o bloco CSS dentro de `injectCSS(` e alterar/adicionar as regras abaixo.

### 1. Ajustar `.eqd-topbar`

Trocar:

```css
.eqd-topbar{
  display:grid;grid-template-columns:1fr;gap:4px;
  margin-bottom:8px;
  background:#14161a;border:1px solid rgba(255,255,255,.08);
  padding:3px 8px;border-radius:16px;
}
```

Por:

```css
.eqd-topbar{
  position:relative;
  display:grid;grid-template-columns:1fr;gap:4px;
  margin-bottom:8px;
  background:#14161a;border:1px solid rgba(255,255,255,.08);
  padding:3px 8px;border-radius:16px;
}
```

### 2. Adicionar regra para o monitor SYNC

Adicionar logo após `.eqd-topbar` ou junto das regras da barra superior:

```css
.eqd-topbar #eqd-sync-status,
.eqd-topbar .eqd-sync-status,
.eqd-topbar [data-eqd-sync],
.eqd-topbar [data-sync-monitor]{
  position:absolute;
  top:6px;
  right:10px;
  margin:0;
  z-index:3;
}
```

### 3. Caso o monitor use outro seletor

Se o elemento do monitor tiver outro ID/classe, aplicar a mesma regra nele. Procurar pelo texto exibido no render:

- `SYNC:`
- `Sincronizando`
- `API em uso`

E garantir que o elemento esteja dentro da `.eqd-topbar`. Se ele estiver sendo renderizado abaixo da linha de botões, mover o HTML dele para dentro da primeira área da barra ou aplicar classe `.eqd-sync-status` nele.

Exemplo:

```html
<span class="eqd-pill eqd-sync-status" id="eqd-sync-status">SYNC: Sincronizando...</span>
```

## Critério de aceite

- O SYNC fica no canto superior direito da barra preta.
- A linha de botões permanece na posição atual.
- O SYNC não cria uma terceira linha abaixo dos botões.
- Em tela menor, o SYNC pode continuar no topo direito, sem bloquear cliques nos botões.
