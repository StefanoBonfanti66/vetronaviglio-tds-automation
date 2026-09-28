/* ─── data.js ─── Catalogo materiali, etichettatura e note bancale (Chiara) */
"use strict";

const MATERIAL_CATALOG = [
  // ── Vetro ──────────────────────────────────────────────────────
  { id: "glass_formulation", category: "Vetro",         label: "GLASS FORMULATION",                  group: "glass",    isGlass: true },
  { id: "glass_lacquering",  category: "Vetro",         label: "LACQUERING FINISH (Verniciato)",      group: "glass",    isGlass: true, tip: "Verniciato" },
  { id: "glass_frosted",     category: "Vetro",         label: "FROSTED FINISH (Satinato)",           group: "glass",    isGlass: true, tip: "Satinato" },

  // ── Plastica ───────────────────────────────────────────────────
  { id: "pp",                category: "Plastica", label: "POLYPROPYLENE (PP)",              group: "plastic" },
  { id: "pe",                category: "Plastica", label: "POLYETHYLENE (PE)",               group: "plastic" },
  { id: "hdpe",              category: "Plastica", label: "HIGH DENSITY POLYETHYLENE (HDPE)", group: "plastic" },
  { id: "ldpe",              category: "Plastica", label: "LOW DENSITY POLYETHYLENE (LDPE)", group: "plastic" },
  { id: "petg",              category: "Plastica", label: "PETG (POLYETHYLENE TEREPHTHALATE GLYCOL)", group: "plastic", tip: "PETG" },
  { id: "colour_masterbatch", category: "Plastica", label: "COLOUR MASTERBATCH",             group: "plastic" },

  // ── Decorazioni (applicabili a vetro E plastica) ────────────────
  { id: "glass_uvgl",        category: "Decorazioni",  label: "INK / UVGL (Serigrafia)",       group: "plastic", tip: "Serigrafia" },
  { id: "glass_hotfoil",     category: "Decorazioni",  label: "HOT FOIL (Stampa a caldo)",     group: "plastic", tip: "Stampa a caldo" },
  { id: "metalizzazione",    category: "Decorazioni",  label: "METALLIZATION FINISH (Metallizzazione)", group: "plastic", tip: "Metallizzazione" },
  { id: "lacquering_mat",    category: "Decorazioni",  label: "LACQUERING MAT FINISH",        group: "plastic", tip: "Coperchi OPACATI e non SATINATI" },

  // ── Meccanica ──────────────────────────────────────────────────
  { id: "acetalic_resin",    category: "Meccanica",  label: "ACETALIC RESIN",      group: "mechanical", role: "Meccanismo", tip: "Meccanismo di foamer, spray e dispenser" },
  { id: "stainless_steel",   category: "Meccanica",  label: "STAINLESS STEEL",     group: "mechanical", role: "Molla",      tip: "Molla di foamer, spray e dispenser" },
  { id: "buna",              category: "Meccanica",  label: "BUNA",                group: "mechanical", role: "Dispenser e spray", tip: "No buna in dispenser e spray NEW CRISTAL e CHARME" },
  { id: "nitrile",           category: "Meccanica",  label: "NITRILE RUBBER",      group: "mechanical", tip: "Nitrile rubber" },
  { id: "rubber",            category: "Meccanica",  label: "RUBBER",              group: "mechanical", tip: "Rubber" },

  // ── Altri materiali ─────────────────────────────────────────────
  { id: "k_resin",           category: "Altri materiali", label: "K RESIN",   group: "plastic", tip: "Codice etichetta >PP+PE+KRESIN< 7" },
  { id: "urea",              category: "Altri materiali", label: "UREA",      group: "plastic", tip: "Codici etichetta UF 7 / >PP+UF< 7 / >PE+UF< 7 / C/UF 95" },

  // ── Riciclato (PCR) ─────────────────────────────────────────────
  { id: "pp_pcr",             category: "Riciclato", label: "POLYPROPYLENE PCR",        group: "plastic", pcr: true, tip: "Inserire % riciclato" },
  { id: "pe_pcr",             category: "Riciclato", label: "POLYETHYLENE PCR",         group: "plastic", pcr: true, tip: "Inserire % riciclato" },
  { id: "glass_formulation_pcr", category: "Riciclato", label: "GLASS FORMULATION PCR", group: "glass",   pcr: true, isGlass: true, tip: "Riciclato vetro fisso 30%" },
];

/* ── Pack Coding ─────────────────────────────────────────────────
   Chiara: mappa materiale base → codice etichettatura + collection.
   Per materiali misti (foamer+cover, spray, dispenser) serve C/PP 92.
   Per contaggocce serve C/PP 95 (e C/UF 95 se in urea).          */
const PACK_CODING_MAP = {
  // Singoli
  glass:  { code: "GL 70",     collection: "Glass" },
  glass_pcr: { code: "GL 70", collection: "Glass" },
  hdpe:   { code: "HDPE 2",    collection: "Plastic" },
  ldpe:   { code: "LDPE 4",    collection: "Plastic" },
  pe:     { code: "LDPE 4",    collection: "Plastic" },
  pp:     { code: "PP 5",      collection: "Plastic" },
  petg:   { code: "PETG 7",    collection: "Plastic" },
  k_resin:{ code: ">PP+PE+KRESIN< 7", collection: "Plastic" },
  urea:     { code: "UF 7",    collection: "Plastic" },
  urea_pp:  { code: ">PP+UF< 7", collection: "Plastic" },
  urea_pe:  { code: ">PE+UF< 7", collection: "Plastic" },
  urea_contaggocce: { code: "C/UF 95", collection: "Plastic" },
  // Misti (dipendono dal tipo di packaging, non solo dal materiale)
  mixed_foamer_spray_dispenser: { code: "C/PP 92", collection: "Plastic" },
  mixed_contaggocce:            { code: "C/PP 95", collection: "Plastic" },
};

/* ── Note bancale ─────────────────────────────────────────────── */
/* Fisse (sempre presenti) */
const PALLET_NOTE_TYPE = "Pallet type: Fumigated EPAL (1200*800 mm)";
const PALLET_NOTE_HEIGHT = "Pallet height: 114 mm";
const PALLET_NOTES_FIXED = [
  "Plastic bag inside carton box",
  "Pallet with plastic shrink",
];

/* ── Note bancale variabili (checkbox) ─────────────────────────── */
const PALLET_NOTES_VARIABLE = [
  "Neck down jar packing",
  "Plastic film on top of the items for dust protection",
  "2 ply centre plate on alternate layer",
  "Side edge angle board",
];

/* ── Disposizioni bancale (layout standard) ────────────────────── */
const LAYOUT_STANDARD = {
  std1: { scatolePerStrato: 3, strati: 3, descr: "3 strati × 3 scatole" },
  std2: { scatolePerStrato: 2, strati: 4, descr: "4 strati × 2 scatole" },
  std3: { scatolePerStrato: 5, strati: 2, descr: "2 strati × 5 scatole" },
  forn: { scatolePerStrato: 4, strati: 3, descr: "da fornitore (vetro/accessori)" },
};

/* ── Composizione chimica vetro ───────────────────────────────────
   Valori di default "Flint Glass" (% w/w) presi dalla TDS QC030.0389
   e confermati da Chiara (spec 2.0). Ogni riga: {name, min, max}.  */
const GLASS_COMPOSITION_DEFAULT = [
  { name: "SiO₂",   min: "72",     max: "74" },
  { name: "SO₃",    min: "0.2",    max: "0.4" },
  { name: "Na₂O",   min: "11",     max: "14" },
  { name: "K₂O",    min: "0",      max: "2" },
  { name: "CaO",    min: "9",      max: "13" },
  { name: "MgO",    min: "0",      max: "3" },
  { name: "Al₂O₃",  min: "1",      max: "3" },
  { name: "Fe₂O₃",  min: "0.02",   max: "0.05" },
];

/* ── Percentuale PCR fissata per il vetro (spec Chiara) ────────── */
const PCR_GLASS_FIXED = 30;
const GLASS_TYPE_FIXED = "Flint Glass";
const TDS_REVISION = "4";
const TDS_REVISION_DATE = "30/09/2022";

/* ── Utility: trova materiale per ID ──────────────────────────── */
function findMaterial(id) {
  return MATERIAL_CATALOG.find(function (m) { return m.id === id; });
}

/* ── Utility: determina pack coding dalla composizione ────────── */
/* Ordine di priorità: vetro > K-resin > urea (misti) > PETG > PP/PE/HDPE/LDPE */
function determinePackCoding(materialIds) {
  var hasGlass = materialIds.some(function (id) {
    var m = findMaterial(id);
    return m && m.isGlass;
  });
  if (hasGlass) {
    // Vetro PCR → stesso codice GL 70 ma riciclabile (il % va nel materiale)
    var glassIsPcr = materialIds.some(function (id) {
      var m = findMaterial(id);
      return m && m.isGlass && m.pcr;
    });
    return glassIsPcr ? PACK_CODING_MAP.glass_pcr : PACK_CODING_MAP.glass;
  }

  var hasKResin = materialIds.includes("k_resin");
  if (hasKResin) return PACK_CODING_MAP.k_resin;

  var hasUrea = materialIds.includes("urea");
  var hasPP = materialIds.includes("pp");
  var hasPE = materialIds.includes("pe") || materialIds.includes("pe_pcr");
  var hasHDPE = materialIds.includes("hdpe");
  var hasLDPE = materialIds.includes("ldpe");
  var hasPP_PCR = materialIds.includes("pp_pcr");

  if (hasUrea) {
    if (hasPP && !hasPE && !hasHDPE && !hasLDPE) return PACK_CODING_MAP.urea_pp;
    if (hasPE && !hasPP && !hasHDPE && !hasLDPE) return PACK_CODING_MAP.urea_pe;
    // Solo urea (o urea + additivi → contagocce in urea per clamp)
    return PACK_CODING_MAP.urea;
  }

  if (materialIds.includes("petg")) return PACK_CODING_MAP.petg;

  // PP+PE o PP+PP_PCR → PP 5
  if (hasPP && (hasPE || hasPP_PCR || hasHDPE || hasLDPE)) return PACK_CODING_MAP.pp;
  if (hasPP || hasPP_PCR) return PACK_CODING_MAP.pp;
  if (hasHDPE) return PACK_CODING_MAP.hdpe;
  if (hasPE || hasLDPE) return PACK_CODING_MAP.ldpe;

  // Default: PP 5 (caso più comune)
  return PACK_CODING_MAP.pp;
}

/* ── Utility: verifica se ci sono materiali PCR ────────────────── */
function hasPCR(materialIds) {
  return materialIds.some(function (id) {
    var m = findMaterial(id);
    return m && m.pcr;
  });
}

/* PCR plastica: rimuove il food contact dalla TDS */
function hasPlasticPCR(materialIds) {
  return materialIds.some(function (id) {
    var m = findMaterial(id);
    return m && m.pcr && m.group === "plastic";
  });
}

/* PCR vetro: il food contact RESTA */
function hasGlassPCR(materialIds) {
  return materialIds.some(function (id) {
    var m = findMaterial(id);
    return m && m.pcr && m.isGlass;
  });
}

/* ── Utility: verifica se ci sono materiali vetro ──────────────── */
function hasGlassMaterial(materialIds) {
  return materialIds.some(function (id) {
    var m = findMaterial(id);
    return m && m.isGlass;
  });
}