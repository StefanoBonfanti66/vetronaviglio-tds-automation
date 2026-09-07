(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------------
  // Motore calcolo bancale (replica del foglio Excel di Chiara)
  // Input minimi: peso oggetto (g), pezzi/scatola, pezzi totali / pallet
  // ------------------------------------------------------------------
  const layoutStandard = {
    std1: { scatolePerStrato: 3, strati: 3, descr: "3 strati × 3 scatole" },
    std2: { scatolePerStrato: 2, strati: 4, descr: "4 strati × 2 scatole" },
    std3: { scatolePerStrato: 5, strati: 2, descr: "2 strati × 5 scatole" },
    forn: { scatolePerStrato: 4, strati: 3, descr: "da fornitore (vetro/accessori)" },
  };

  const PESO_SCATOLA_CARTONE_G = 500;   // tara cartone (configurabile in futuro)
  const PESO_BANCALE_EPAL_G = 25000;    // tara bancale EPAL

  // Label Pack Coding -> Collection type (da menù 1-C)
  const collectionByCoding = {
    "HDPE 2": "Plastic",
    "PP 5": "Plastic",
    "PET 1": "Plastic",
    "GL 70": "Glass",
  };

  // Materiale (codice select) -> elenco materiali per tabella pag. 2
  const MATERIALS_BY_CODE = {
    pehd: ["HIGH DENSITY POLYETHYLENE", "COLOUR MASTERBATCH", "INK / UVGL"],
    pe_pp_coprente: ["POLYPROPYLENE", "POLYETHYLENE", "COLOUR MASTERBATCH", "INK / UVGL"],
    pe_pcr: ["POLYETHYLENE PCR", "COLOUR MASTERBATCH", "INK / UVGL"],
    pp_pcr: ["POLYPROPYLENE PCR", "COLOUR MASTERBATCH", "INK / UVGL"],
    pet: ["POLYETHYLENE TEREPHTHALATE", "COLOUR MASTERBATCH", "INK / UVGL"],
  };

  const NOTE_BANCALE_DEFAULT = [
    "Items are packed inside a plastic bag and then inside the carton box",
    "Items are aligned",
    "Pallet with plastic shrink",
  ];

  function calcPallet() {
    const pesoOggetto = parseFloat($("pesoOggetto").value) || 0;
    const pezziScatola = parseFloat($("pezziScatola").value) || 0;
    const pezziTotali = parseFloat($("pezziTotali").value) || 0;

    const scatolePallet = Math.ceil(pezziTotali / pezziScatola) || 0;
    const pesoNettoScatola = pezziScatola * pesoOggetto / 1000;               // kg
    const pesoLordoscatola = pesoNettoScatola + PESO_SCATOLA_CARTONE_G / 1000;
    const pesoNettoPallet = pezziTotali * pesoOggetto / 1000;                 // kg
    const pesoLordopallet = pesoNettoPallet + (scatolePallet * PESO_SCATOLA_CARTONE_G + PESO_BANCALE_EPAL_G) / 1000;

    set("pesoNettoScatola", f(pesoNettoScatola) + " Kg");
    set("pesoLordoscatola", f(pesoLordoscatola) + " Kg");
    set("scatolePallet", scatolePallet);
    set("pesoNettoPallet", f(pesoNettoPallet) + " Kg");
    set("pesoLordopallet", f(pesoLordopallet) + " Kg");

    // quanti pezzi a strato devono allinearsi alla disposizione selezionata
    const disp = layoutStandard[$("disposizioneBancale").value];
    const scatoleStrato = parseInt($("scatoleStrato").value, 10) || disp.scatolePerStrato;
    const strati = parseInt($("stratiPallet").value, 10) || disp.strati;

    return {
      pesoOggetto, pezziScatola, pezziTotali, scatolePallet,
      pesoNettoScatola, pesoLordoscatola, pesoNettoPallet, pesoLordopallet,
      scatoleStrato, strati,
    };
  }

  // ------------------------------------------------------------------
  // PCR toggle (food contact)
  // ------------------------------------------------------------------
  function updateMaterialLogic() {
    const isPCR = $("isPCR").checked;
    const mat = $("materiale").value;
    const pcrByMaterial = { pe_pcr: true, pp_pcr: true };
    const mustRemove = isPCR || pcrByMaterial[mat] === true;

    $("foodContactAlert").hidden = !mustRemove;

    if (mat === "pet") $("packCoding").value = "PET 1";
    else if (mat === "pehd") $("packCoding").value = "HDPE 2";
    else if (mat === "pe_pp_coprente" || mat === "pe_pcr" || mat === "pp_pcr") $("packCoding").value = "PP 5";
    $("collectionType").value = collectionByCoding[$("packCoding").value] || "Plastic";
  }

  function onDispositionChange() {
    const disp = layoutStandard[$("disposizioneBancale").value];
    $("scatoleStrato").value = disp.scatolePerStrato;
    $("stratiPallet").value = disp.strati;
    calcPallet();
  }

  function onCodingChange() {
    $("collectionType").value = collectionByCoding[$("packCoding").value] || "Plastic";
  }

  // ------------------------------------------------------------------
  // Generazione PDF: stato -> localStorage -> template di stampa
  // print.html replica fedelmente la struttura del TDS di input (Word)
  // ------------------------------------------------------------------
  const TDS_STATE_KEY = "tds_state";

  // ------------------------------------------------------------------
  // Upload disegni: il file viene letto come data URL e incorporato
  // nella TDS (niente backend, tutto client-side).
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

  function collectPayload() {
    const data = calcPallet();
    const mat = $("materiale").value;
    const isPCR = $("isPCR").checked || ["pe_pcr", "pp_pcr"].includes(mat);

    const noteBancale = NOTE_BANCALE_DEFAULT.map((n, i) => {
      const el = $("notaBancale" + (i + 1));
      return el && el.value.trim() ? el.value.trim() : n;
    });

    return {
      dataCreazione: $("dataCreazione").value || new Date().toISOString().slice(0, 10),
      revisione: $("revisione").value || "0",
      nomeArticolo: $("nomeArticolo").value.trim(),
      codiceArticolo: $("codiceArticolo").value.trim(),
      materiale: $("materiale").selectedOptions[0]?.text || mat,
      materialCode: mat,
      materiali: MATERIALS_BY_CODE[mat] || MATERIALS_BY_CODE.pehd,
      materialePari: mat === "pe_pcr" ? "PE PCR" : mat === "pp_pcr" ? "PP PCR" : "PE/Soft Touch",
      pcr: isPCR,
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
      noteBancale,
      bancaleImg: uploaded.bancale || null,
      pezzoImg: uploaded.pezzo || null,
    };
  }

  // ------------------------------------------------------------------
  // Events
  // ------------------------------------------------------------------
  $("isPCR").addEventListener("change", () => { updateMaterialLogic(); calcPallet(); });
  $("materiale").addEventListener("change", updateMaterialLogic);
  $("packCoding").addEventListener("change", onCodingChange);
  $("disposizioneBancale").addEventListener("change", onDispositionChange);
  ["pesoOggetto", "pezziScatola", "pezziTotali", "scatoleStrato", "stratiPallet"].forEach((id) =>
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
        status.textContent = "File troppo pesanti per l’anteprima (limite localStorage). Usa disegni più leggeri (JPG/PNG) oppure non caricarli.";
        return;
      }
      window.open("print.html", "_blank");
      status.innerHTML = `✅ Anteprima aperta: seleziona <strong>“Salva come PDF”</strong> nel dialogo di stampa per generare <strong>TDS_${slug(payload.codiceArticolo)}.pdf</strong>.`;
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

  // init
  $("dataCreazione").value = new Date().toISOString().slice(0, 10);
  updateMaterialLogic();
  calcPallet();
})();