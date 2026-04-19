// Updated paineldevendas_cgd.js file

const OTHER_SELLERS = [
  // Other entries remain intact
  // { label: "JULIA MELLO",      userId: 4743 }, // Line removed as per request
];

function loadAll() {
  const nowTs = Date.now();
  for (const sid of Object.keys(statsBySellerId)) {
    const numSid = Number(sid);
    const prevRaw = prevMetaPctBySellerId[numSid];
    const cur = Number(statsBySellerId[numSid]?.metaPct || 0);
    // só toca se já houve uma carga anterior (prevRaw !== undefined)
    if (prevRaw !== undefined && cur > Number(prevRaw || 0)) {
      bellUntilBySellerId[numSid] = nowTs + 10000;
      playMetaBell();
      setTimeout(() => { try { renderAll(); } catch (_) { } }, 10200);
    }
    prevMetaPctBySellerId[numSid] = cur;
  }
}

$compFilter.addEventListener("change", async () => {
  selectedCompetence = $compFilter.value;
  if (selectedCompetence !== "current") {
    const ym = normYYYYMM(selectedCompetence) || nowYYYYMM();
    try { await ensureConfigLoaded(ym); } catch (_) { }
  }
  renderAll();
  updateSorteioBar();
});

// Other code remains intact..