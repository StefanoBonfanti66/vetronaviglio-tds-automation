# TDS Automation – POC (Vetronaviglio)

**Stato:** POC esplorativo – costo zero (lavoro da dipendente)
**Proprietario:** Stefano Bonfanti (QA collaboration with Chiara Garramone)
**Output atteso:** un unico PDF TDS per prodotto

## Indice
- `docs/questionario-tds-chiara.md` – domande per Chiara (raccolta dati menù/tendenze)
- `docs/brief-tds-poc.md` – brief tecnico del POC
- `./` (root) – sito statico (GitHub Pages) con il form di generazione TDS
  (`index.html`, `print.html`, `app.js`, `data.js`, `style.css`, `assets/`)

## Come girare il POC
1. Apri `index.html` in un browser (oppure `python3 -m http.server` dalla root)
2. Compila il form (nome articolo, codice, materiale, etichettatura, bancale…)
3. Clicca **Genera PDF** → si apre `print.html`, una replica pagina-per-pagina della TDS
4. In `print.html` clicca **Esporta PDF / Stampa** → dialogo di stampa → "Salva come PDF"
   (scelta "Senza margini", attiva "Grafica di sfondo")

> Il PDF non è generato da una libreria: è la **stampa del browser** sul template `print.html`,
> che riproduce struttura e font (Arimo/Carlito) della TDS Word attuale.

## Deploy GitHub Pages
Pubblicare la root del repo da GitHub Pages (repo `StefanoBonfanti66/vetronaviglio-tds-automation`,
branch `main`) — essendo statico nessun backend richiesto.

## Regole implementate nel POC (dalle risposte di Chiara)
- Catalogo materiali in `data.js` (`MATERIAL_CATALOG`), raggruppato per categoria
  (Vetro / Plastica / Meccanica), con etichette e ruoli (Meccanismo, Molla, Dispenser e spray)
- Composizione **multi-materiale**: aggiungi/rimuovi chip per costruire l'elenco materiali
- **PCR** rilevato automaticamente dalla selezione (PP PCR / PE PCR) → rimuove il paragrafo
  food contact con alert
- **Vetro** rilevato automaticamente → mostra la sezione "Composizione vetro" e aggiunge
  la riga vetro nella tabella materiali; pack coding `GL 70` proposto automaticamente
- **Etichettatura automatica**: `determinePackCoding()` suggerisce Pack Coding + Collection
  type dalla composizione (GL 70, HDPE 2, LDPE 4, PP 5, C/PP 92, C/PP 95, K-RESIN)
- Calcolo automatico bancale da: peso oggetto, pezzi/scatola, pezzi totali
- Note bancale fisse (plastic bag, plastic shrink) + **note variabili** a checkbox
  (neck down jar, plastic film, 2 ply centre plate, side edge angle board)
- Selettore disegno bancale (3 standard + fornitori) e pulsanti **Sfoglia** per caricare
  disegno bancale e disegno pezzo (incorporati nella TDS pag. 6/7; senza upload si usano
  i campioni in `assets/`)
- Generazione PDF unico in output
