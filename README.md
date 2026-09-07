# TDS Automation – POC (Vetronaviglio)

**Stato:** POC esplorativo – costo zero (lavoro da dipendente)
**Proprietario:** Stefano Bonfanti (QA collaboration with Chiara Garramone)
**Output atteso:** un unico PDF TDS per prodotto

## Indice
- `docs/questionario-tds-chiara.md` – domande per Chiara (raccolta dati menù/tendenze)
- `docs/brief-tds-poc.md` – brief tecnico del POC
- `app/` – sito statico (GitHub Pages) con il form di generazione TDS

## Come girare il POC
1. Apri `app/index.html` in un browser (oppure `cd app && python3 -m http.server`)
2. Compila il form (nome articolo, codice, materiale, etichettatura, bancale…)
3. Clicca **Genera PDF** → si apre `print.html`, una replica pagina-per-pagina della TDS
4. In `print.html` clicca **Esporta PDF / Stampa** → dialogo di stampa → "Salva come PDF"
   (scelta "Senza margini", attiva "Grafica di sfondo")

> Il PDF non è generato da una libreria: è la **stampa del browser** sul template `print.html`,
> che riproduce struttura e font (Arimo/Carlito) della TDS Word attuale.

## Deploy GitHub Pages
Pubblicare la cartella `app/` da GitHub Pages (root del repo o `/app`) — essendo statico
nessun backend richiesto.

## Regole implementate nel POC (dai commenti di Chiara)
- Menù a tendina materiali (da popolare con i dati del questionario)
- Toggle **PCR** → rimuove il paragrafo food contact con alert
- Menù etichettatura (Pack Coding → Collection type)
- Calcolo automatico bancale da: peso oggetto, pezzi/scatola, pezzi totali
- Selettore disegno bancale (3 standard + fornitori) e pulsanti **Sfoglia** per caricare
  disegno bancale e disegno pezzo (incorporati nella TDS pag. 6/7; senza upload si usano
  i campioni in `app/assets/`)
- Campi fissi vs a tendina nella composizione bancale
- Generazione PDF unico in output
