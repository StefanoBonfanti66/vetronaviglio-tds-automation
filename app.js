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
      opt.textContent = m.label + (m.role ? " (" + m.role + ")" : "");
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
    const isPCR = hasPCR(ids);
    const isGlass = hasGlassMaterial(ids);

    // Food contact
    $("foodContactAlert").hidden = !isPCR;

    // Glass section
    $("glassSection").hidden = !isGlass;
    if (isGlass) {
      $("glassBadge").textContent = "vetro rilevato";
    }

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

  // ------------------------------------------------------------------
  // Composizione chimica vetro (tabella ossidi, default Flint Glass)
  // ------------------------------------------------------------------
  function populateGlassComposition() {
    const tbody = $("glassCompBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    GLASS_COMPOSITION_DEFAULT.forEach(function (row) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + row.name + "</td>" +
        '<td><input type="text" class="gc-min" value="' + row.min + '" /></td>' +
        '<td><input type="text" class="gc-max" value="' + row.max + '" /></td>';
      tbody.appendChild(tr);
    });
  }

  function collectGlassComposition(state) {
    const rows = [];
    document.querySelectorAll("#glassCompBody tr").forEach(function (tr) {
      const cells = tr.querySelectorAll("td");
      if (cells.length < 3) return;
      const name = cells[0].textContent.trim();
      const min = cells[1].querySelector("input").value.trim();
      const max = cells[2].querySelector("input").value.trim();
      rows.push({ name: name, min: min, max: max });
    });
    state.glassCompositionRows = rows;
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
    const isPCR = hasPCR(ids);
    const isGlass = hasGlassMaterial(ids);

    // Gather material names for page 2 table
    var materialNames = ids.map(function (id) {
      var m = findMaterial(id);
      return m ? m.label : id;
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

    // Collect glass composition rows (tabella ossidi)
    var payload = {
      dataCreazione: $("dataCreazione").value || new Date().toISOString().slice(0, 10),
      revisione: $("revisione").value || "0",
      nomeArticolo: $("nomeArticolo").value.trim(),
      codiceArticolo: $("codiceArticolo").value.trim(),
      materiali: materialNames,
      materialIds: ids.slice(),
      materiale: materialNames[0] || "",
      pcr: isPCR,
      isGlass: isGlass,
      glassType: $("glassType") ? $("glassType").value : "",
      glassComposition: $("glassComposition") ? $("glassComposition").value.trim() : "",
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
      palletType: "Fumigated EPAL (1200*800 mm)",
      palletHeight: $("altezzaPallet").value.trim() || "114",
      noteBancale: noteBancale,
      bancaleImg: uploaded.bancale || null,
      pezzoImg: uploaded.pezzo || null,
    };
    collectGlassComposition(payload);
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
      window.open("print.html?v=4", "_blank");
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
  populateMaterialSelect();
  populateGlassComposition();
  composition = ["hdpe", "colour_masterbatch", "glass_uvgl"]; // default demo
  renderComposition();
  updateCompositionLogic();
  calcPallet();
})();
