(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------------
  // Motore calcolo bancale (replica del foglio Excel di Chiara)
  // ------------------------------------------------------------------
  const PESO_SCATOLA_CARTONE_G = 500;
  const PESO_BANCALE_EPAL_G = 25000;

  function calcPallet() {
    const pesoOggetto = parseFloat($("pesoOggetto").value) || 0;
    const pezziScatola = parseFloat($("pezziScatola").value) || 0;

    // Disposizione bancale (scatole/strato e strati/pallet) — fonte primaria
    const disp = LAYOUT_STANDARD[$("disposizioneBancale").value];
    const scatoleStrato = parseInt($("scatoleStrato").value, 10) || disp.scatolePerStrato;
    const strati = parseInt($("stratiPallet").value, 10) || disp.strati;

    // Calcolo allineato al "Calcolatore automatico pallettizzazione 2.0" di Chiara
    const scatolePallet = scatoleStrato * strati;                 // A16 = B9*B10
    const pesoNettoScatola = pezziScatola * pesoOggetto / 1000;   // B5 = B2*B4 (Kg)
    const pesoLordoscatola = pesoNettoScatola + PESO_SCATOLA_CARTONE_G / 1000; // C6 = C5+0.5
    const pezziTotali = pezziScatola * scatolePallet;             // B11 = B2*B16
    const pesoNettoPallet = pesoNettoScatola * scatolePallet;     // B18 = C5*B16
    const pesoLordopallet = pesoLordoscatola * scatolePallet + PESO_BANCALE_EPAL_G / 1000; // B19 = (C6*B16)+25

    set("pesoNettoScatola", f(pesoNettoScatola) + " Kg");
    set("pesoLordoscatola", f(pesoLordoscatola) + " Kg");
    set("scatolePallet", scatolePallet);
    set("pezziTotaliCalc", pezziTotali);
    set("pesoNettoPallet", f(pesoNettoPallet) + " Kg");
    set("pesoLordopallet", f(pesoLordopallet) + " Kg");

    return {
      pesoOggetto, pezziScatola, pezziTotali, scatolePallet,
      pesoNettoScatola, pesoLordoscatola, pesoNettoPallet, pesoLordopallet,
      scatoleStrato, strati,
    };
  }

  // ------------------------------------------------------------------
  // Multi-material composition management
  // ------------------------------------------------------------------
  let composition = []; // array di material ID

  function populateMaterialSelect() {
    const sel = $("materialSelect");
    sel.innerHTML = "";
    let lastCat = "";
    let grp = null;
    MATERIAL_CATALOG.forEach(function (m) {
      if (m.category !== lastCat) {
        grp = document.createElement("optgroup");
        grp.label = m.category;
        sel.appendChild(grp);
        lastCat = m.category;
      }
      const opt = document.createElement("option");
      opt.value = m.id;
      let optText = m.label + (m.role ? " (" + m.role + ")" : "");
      opt.textContent = optText;
      if (m.tip) { opt.title = m.tip; }
      grp.appendChild(opt);
    });
  }

  function renderComposition() {
    const list = $("compositionList");
    list.innerHTML = "";
    composition.forEach(function (id, idx) {
      const m = findMaterial(id);
      if (!m) return;
      const chip = document.createElement("span");
      chip.className = "mat-chip";

      let inner = m.label;
      inner += ' <span class="mat-cat">' + m.category + '</span>';
      if (m.pcr) inner += ' <span class="mat-pcr">PCR</span>';
      if (m.isGlass) inner += ' <span class="mat-glass">VETRO</span>';
      if (m.role) inner += ' <span class="mat-role">' + m.role + '</span>';
      inner += ' <button type="button" class="remove-mat" data-idx="' + idx + '" title="Rimuovi">&times;</button>';
      chip.innerHTML = inner;
      list.appendChild(chip);
    });

    // wire remove buttons
    list.querySelectorAll(".remove-mat").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const i = parseInt(btn.dataset.idx, 10);
        composition.splice(i, 1);
        renderComposition();
        updateCompositionLogic();
      });
    });
  }

  function addMaterial() {
    const sel = $("materialSelect");
    const id = sel.value;
    if (!id || composition.includes(id)) return;
    composition.push(id);
    renderComposition();
    updateCompositionLogic();
  }

  // ------------------------------------------------------------------
  // Composition logic: PCR, glass, pack coding auto-suggest
  // ------------------------------------------------------------------
  function updateCompositionLogic() {
    const ids = composition;
    const plasticPCR = hasPlasticPCR(ids);   // plastica PCR → food contact OMESSO
    const glassPCR = hasGlassPCR(ids);        // vetro PCR → food contact MANTENUTO
    const isGlass = hasGlassMaterial(ids);

    // Food contact: omesso SOLO per plastica PCR; il vetro PCR lo mantiene
    $("foodContactAlert").hidden = !plasticPCR;

    // Glass section (anche vetro PCR)
    $("glassSection").hidden = !isGlass;
    if (isGlass) {
      $("glassBadge").textContent = "vetro rilevato";
    }

    // Sezione % PCR: vetro fisso 30%, plastica libera (calcolo Excel in fase 2)
    renderPCRSection();

    // Pack coding auto-suggest
    const suggested = determinePackCoding(ids);
    if (suggested) {
      $("packCoding").value = suggested.code;
      $("collectionType").value = suggested.collection;
      $("packCodingAuto").textContent = "auto";
    } else {
      $("packCodingAuto").textContent = "";
    }
  }

  // ── Sezione % PCR (spec Chiara 2.0): per ogni materiale PCR un campo ──
  // Vetro PCR: fisso 30% (readonly). Plastica PCR: input libero.
  function renderPCRSection() {
    const box = $("pcrBox");
    if (!box) return;
    const pcrIds = composition.filter((id) => {
      const m = findMaterial(id);
      return m && m.pcr;
    });
    if (!pcrIds.length) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    box.hidden = false;
    let html = "<h4>Percentuale materiale riciclato (PCR)</h4><div class='grid'>";
    pcrIds.forEach((id) => {
      const m = findMaterial(id);
      const isGlass = !!m.isGlass;
      const val = isGlass ? PCR_GLASS_FIXED : "";
      const ro = isGlass ? " readonly" : "";
      const note = isGlass ? " (fisso 30%)" : "";
      html +=
        '<label class="full">' + m.label + note +
        '<input type="number" id="pcrPct_' + id + '" min="0" max="100" step="1" value="' + val + '"' + ro + ' /></label>';
    });
    html += "</div>";
    box.innerHTML = html;
  }

  // Raccoglie le % PCR impostate per ogni materiale PCR
  function collectPCRPercentages() {
    const out = {};
    composition.forEach((id) => {
      const m = findMaterial(id);
      if (!m || !m.pcr) return;
      const inp = $("pcrPct_" + id);
      out[id] = inp ? inp.value.trim() : (m.isGlass ? String(PCR_GLASS_FIXED) : "");
    });
    return out;
  }

  // ------------------------------------------------------------------
  // Composizione chimica vetro (tabella ossidi, default Flint Glass)
  // ------------------------------------------------------------------
  function populateGlassComposition() {
    const type = $("glassFixedType");
    if (type) type.value = GLASS_TYPE_FIXED;
    const tbody = $("glassCompBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    GLASS_COMPOSITION_DEFAULT.forEach(function (row) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + row.name + "</td>" +
        "<td>" + row.min + "</td>" +
        "<td>" + row.max + "</td>";
      tbody.appendChild(tr);
    });
  }

  function onDispositionChange() {    const disp = LAYOUT_STANDARD[$("disposizioneBancale").value];
    $("scatoleStrato").value = disp.scatolePerStrato;
    $("stratiPallet").value = disp.strati;
    calcPallet();
  }

  function onCodingChange() {
    const val = $("packCoding").value;
    // Determine collection from pack coding
    var coll = "Plastic";
    if (val === "GL 70") coll = "Glass";
    $("collectionType").value = coll;
    $("packCodingAuto").textContent = "";
  }

  // ------------------------------------------------------------------
  // Upload disegni
  // ------------------------------------------------------------------
  const uploaded = { bancale: null, pezzo: null };

  function wireUpload(inputId, slot, previewId) {
    const input = $(inputId);
    input.addEventListener("change", () => {
      const file = input.files && input.files[0];
      const nameEl = $(slot + "FileName");
      if (!file) { uploaded[slot] = null; nameEl.textContent = "nessun file caricato"; nameEl.classList.remove("loaded"); return; }
      const reader = new FileReader();
      reader.onload = () => {
        uploaded[slot] = reader.result;
        nameEl.textContent = file.name + " (" + Math.ceil(file.size / 1024) + " KB)";
        nameEl.classList.add("loaded");
        const prev = $(previewId);
        if (prev) {
          if (file.type && file.type.indexOf("image/") === 0) {
            prev.src = reader.result; prev.hidden = false;
          } else {
            prev.removeAttribute("src"); prev.hidden = true;
          }
        }
      };
      reader.onerror = () => {
        uploaded[slot] = null;
        nameEl.textContent = "errore di lettura";
        nameEl.classList.remove("loaded");
      };
      reader.readAsDataURL(file);
    });
  }
  wireUpload("caricaBancale", "bancale", "bancalePreview");
  wireUpload("caricaPezzo", "pezzo", null);

  // ------------------------------------------------------------------
  // Collect payload → localStorage → print.html
  // ------------------------------------------------------------------
  const TDS_STATE_KEY = "tds_state";

  function collectPayload() {
    const data = calcPallet();
    const ids = composition;
    const plasticPCR = hasPlasticPCR(ids);
    const glassPCR = hasGlassPCR(ids);
    const isGlass = hasGlassMaterial(ids);
    const pcrPercent = collectPCRPercentages();

    // Gather material names for page 2 table (con % PCR se presente)
    var materialNames = ids.map(function (id) {
      var m = findMaterial(id);
      if (!m) return id;
      var label = m.label;
      if (m.pcr && pcrPercent[id]) label += " (PCR " + pcrPercent[id] + "%)";
      return label;
    });

    // Pallet notes: fixed + selected variable
    var noteBancale = [];
    noteBancale.push($("notaBancale1").value.trim() || PALLET_NOTES_FIXED[0]);
    noteBancale.push($("notaBancale2").value.trim() || PALLET_NOTES_FIXED[1]);
    for (var vi = 0; vi < PALLET_NOTES_VARIABLE.length; vi++) {
      var cb = $("noteVar" + (vi + 1));
      if (cb && cb.checked) {
        noteBancale.push(PALLET_NOTES_VARIABLE[vi]);
      }
    }

    var payload = {
      dataCreazione: $("dataCreazione").value || new Date().toISOString().slice(0, 10),
      revisione: TDS_REVISION,
      nomeArticolo: $("nomeArticolo").value.trim(),
      codiceArticolo: $("codiceArticolo").value.trim(),
      materiali: materialNames,
      materialIds: ids.slice(),
      materiale: materialNames[0] || "",
      pcr: plasticPCR,             // food contact omesso SOLO se plastica PCR
      glassPCR: glassPCR,          // vetro PCR mantiene il food contact
      pcrPercent: pcrPercent,
      isGlass: isGlass,
      packCoding: $("packCoding").value,
      collectionType: $("collectionType").value,
      disegnoBancale: $("disegnoBancale").selectedOptions[0]?.text || $("disegnoBancale").value,
      disegnoPezzo: $("disegnoPezzo").value.trim(),
      pesoOggetto: data.pesoOggetto,
      pezziScatola: data.pezziScatola,
      pezziTotali: data.pezziTotali,
      scatoleStrato: data.scatoleStrato,
      strati: data.strati,
      scatolePallet: data.scatolePallet,
      pesoNettoScatola: data.pesoNettoScatola,
      pesoLordoscatola: data.pesoLordoscatola,
      pesoNettoPallet: data.pesoNettoPallet,
      pesoLordopallet: data.pesoLordopallet,
      palletType: $("palletType") ? $("palletType").value.replace(/^Pallet type: /, "") : "Fumigated EPAL (1200*800 mm)",
      palletHeight: $("altezzaPallet").value.trim() || "114",
      noteBancale: noteBancale,
      bancaleImg: uploaded.bancale || null,
      pezzoImg: uploaded.pezzo || null,
    };
    return payload;
  }

  // ------------------------------------------------------------------
  // Events
  // ------------------------------------------------------------------
  $("addMaterialBtn").addEventListener("click", addMaterial);
  $("materialSelect").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); addMaterial(); }
  });
  $("packCoding").addEventListener("change", onCodingChange);
  $("disposizioneBancale").addEventListener("change", onDispositionChange);
  ["pesoOggetto", "pezziScatola", "scatoleStrato", "stratiPallet"].forEach((id) =>
    $(id).addEventListener("input", calcPallet)
  );
  $("altezzaPallet").addEventListener("input", (e) => {
    const h = e.target.value.trim() || "114";
    const n = $("palletHeightNote");
    if (n) n.value = "Pallet height: " + h + " mm";
  });

  $("tdsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = $("generaBtn");
    const status = $("status");
    btn.disabled = true;
    status.textContent = "Apertura anteprima di stampa…";

    try {
      const payload = collectPayload();
      try {
        localStorage.setItem(TDS_STATE_KEY, JSON.stringify(payload));
      } catch (quotaErr) {
        console.warn(quotaErr);
        status.textContent = "File troppo pesanti per l'anteprima (limite localStorage). Usa disegni più leggeri (JPG/PNG) oppure non caricarli.";
        return;
      }
      window.open("print.html?v=6", "_blank");
      status.innerHTML = `✅ Anteprima aperta: seleziona <strong>"Salva come PDF"</strong> nel dialogo di stampa
        (Margini: <strong>Nessuno</strong>) per generare <strong>TDS_${slug(payload.codiceArticolo)}.pdf</strong>.`;
    } catch (err) {
      console.error(err);
      status.textContent = "Errore durante l'apertura dell'anteprima: " + err.message;
    } finally {
      btn.disabled = false;
    }
  });

  // ------------------------------------------------------------------
  // helpers
  // ------------------------------------------------------------------
  function set(id, v) { $(id).textContent = v; }
  function f(n) { return (Math.round(n * 100) / 100).toString().replace(".", ","); }
  function slug(s) { return String(s).replace(/[^a-zA-Z0-9.-]+/g, ""); }

  // ------------------------------------------------------------------
  // init
  // ------------------------------------------------------------------
  $("dataCreazione").value = new Date().toISOString().slice(0, 10);
  $("revisione").value = TDS_REVISION;
  populateMaterialSelect();
  populateGlassComposition();
  composition = ["glass_formulation", "glass_uvgl", "hdpe"]; // default demo
  renderComposition();
  updateCompositionLogic();
  calcPallet();
})();
