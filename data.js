/* ─── data.js ─── Catalogo materiali, etichettatura e note bancale (Chiara) */
"use strict";

const MATERIAL_CATALOG = [
  // ── Vetro ──────────────────────────────────────────────────────
  { id: "glass_lacquering",  category: "Vetro",  label: "LACQUERING FINISH (Verniciato)",  group: "glass",    isGlass: true },
  { id: "glass_frosted",     category: "Vetro",  label: "FROSTED FINISH (Satinato)",      group: "glass",    isGlass: true },
  { id: "glass_uvgl",        category: "Vetro",  label: "INK / UVGL (Serigrafia)",         group: "glass",    isGlass: true },
  { id: "glass_hotfoil",     category: "Vetro",  label: "HOT FOIL (Stampa a caldo)",       group: "glass",    isGlass: true },

  // ── Plastica ───────────────────────────────────────────────────
  { id: "pp",                category: "Plastica", label: "POLYPROPYLENE (PP)",              group: "plastic" },
  { id: "pe",                category: "Plastica", label: "POLYETHYLENE (PE)",               group: "plastic" },
  { id: "hdpe",              category: "Plastica", label: "HIGH DENSITY POLYETHYLENE (HDPE)", group: "plastic" },
  { id: "ldpe",              category: "Plastica", label: "LOW DENSITY POLYETHYLENE (LDPE)", group: "plastic" },
  { id: "colour_masterbatch", category: "Plastica", label: "COLOUR MASTERBATCH",             group: "plastic" },
  { id: "pp_pcr",            category: "Plastica", label: "POLYPROPYLENE PCR",              group: "plastic", pcr: true },
  { id: "pe_pcr",            category: "Plastica", label: "POLYETHYLENE PCR",              group: "plastic", pcr: true },
  { id: "k_resin",           category: "Plastica", label: "K RESIN",                        group: "plastic" },

  // ── Meccanica ──────────────────────────────────────────────────
  { id: "acetalic_resin",    category: "Meccanica", label: "ACETALIC RESIN",                group: "mechanical", role: "Meccanismo" },
  { id: "stainless_steel",   category: "Meccanica", label: "STAINLESS STEEL",               group: "mechanical", role: "Molla" },
  { id: "buna",              category: "Meccanica", label: "BUNA",                           group: "mechanical", role: "Dispenser e spray" },
  { id: "nitrile",           category: "Meccanica", label: "NITRILE",                        group: "mechanical" },
];

/* ── Pack Coding ─────────────────────────────────────────────────
   Chiara: mappa materiale base → codice etichettatura + collection.
   Per materiali misti (foamer+cover, spray, dispenser) serve C/PP 92.
   Per contaggocce serve C/PP 95. K-RESIN ha codice speciale.       */
const PACK_CODING_MAP = {
  // Singoli
  glass:  { code: "GL 70",     collection: "Glass" },
  hdpe:   { code: "HDPE 2",    collection: "Plastic" },
  ldpe:   { code: "LDPE 4",    collection: "Plastic" },
  pe:     { code: "LDPE 4",    collection: "Plastic" },
  pp:     { code: "PP 5",      collection: "Plastic" },
  k_resin:{ code: ">PP+PE+KRESIN< 7", collection: "Plastic" },
  // Misti (dependono dal tipo di packaging, non solo dal materiale)
  mixed_foamer_spray_dispenser: { code: "C/PP 92", collection: "Plastic" },
  mixed_contaggocce:            { code: "C/PP 95", collection: "Plastic" },
};

/* ── Note bancale fisse (sempre presenti) ─────────────────────── */
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
   Valori di default "Flint Glass" (% w/w) presi dall'esempio reale
   TDS QC030.0389 fornito da Chiara. Ogni riga: {name, min, max}.  */
const GLASS_COMPOSITION_DEFAULT = [
  { name: "SiO2",   min: "72",     max: "74" },
  { name: "SO3",    min: "0.2",    max: "0.4" },
  { name: "Na2O",   min: "11",     max: "14" },
  { name: "K2O",    min: "0",      max: "2" },
  { name: "CaO",    min: "9",      max: "13" },
  { name: "MgO",    min: "0",      max: "3" },
  { name: "Al2O3",  min: "1",      max: "3" },
  { name: "-Fe2O3", min: "0.02",   max: "0.05" },
];

/* ── Utility: trova materiale per ID ──────────────────────────── */
function findMaterial(id) {
  return MATERIAL_CATALOG.find(function (m) { return m.id === id; });
}

/* ── Utility: determina pack coding dalla composizione ────────── */
function determinePackCoding(materialIds) {
  var hasGlass = materialIds.some(function (id) {
    var m = findMaterial(id);
    return m && m.isGlass;
  });
  if (hasGlass) return PACK_CODING_MAP.glass;

  var hasKResin = materialIds.includes("k_resin");
  if (hasKResin) return PACK_CODING_MAP.k_resin;

  var hasPP = materialIds.includes("pp");
  var hasPE = materialIds.includes("pe") || materialIds.includes("pe_pcr");
  var hasHDPE = materialIds.includes("hdpe");
  var hasLDPE = materialIds.includes("ldpe");
  var hasPP_PCR = materialIds.includes("pp_pcr");

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

/* ── Utility: verifica se ci sono materiali vetro ──────────────── */
function hasGlassMaterial(materialIds) {
  return materialIds.some(function (id) {
    var m = findMaterial(id);
    return m && m.isGlass;
  });
}
