# PROJECT_AI_NOTES – vetronaviglio-tds-automation

> Note operative per agenti AI e futuri sviluppatori (Stefano, ZBN).

## ⚠️ NON MODIFICARE: flusso disegno tecnico (pag. 7) e stampa

Il POC è stato validato da Stefano (2026-09-08) e **funziona solo con queste regole**.
Qualsiasi modifica al flusso di pagina 7 / export PDF tende a romperlo: riproduce il bug
originale (pagina 7 senza disegno + ottava pagina vuota nell'export dal dialogo di stampa).

### Regole da rispettare (assolute)
1. **Mai ri-introdurre `<embed>` per il PDF CAD.** In Chromium stampa una pagina vuota
   finale (era la causa storica del doppio bug).
2. **Pag. 7: il disegno (`#vPezzoDwg img`) deve stare in FLUSSO NORMALE**, non in
   `position: absolute` con `width/height: 100%`. Layout corretto attuale:
   `.cad-full { position: relative; height: 100%; display: flex; ... }` e
   `.cad-full img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; }`
   (stesso pattern di `.drawing-box img.fit` di pag. 6, che stampa bene).
3. **Funzione `tdsShowPlaceholder(msg)`**: fallback senza embed. Timeout rasterizzazione 20s.
   Niente altri percorsi alternativi per il disegno.
4. **Cache busting**: da `app.js` aprire sempre `print.html?v=CURRENT` (oggi `?v=4`).
   Bumpa il numero **ad ogni modifica** di print.html, altrimenti il browser serve una
   versione vecchia in cache e il cliente "non vede il disegno / ottava pagina vuota".
   In print.html ci sono anche meta `Cache-Control: no-store` / `Pragma: no-cache`.
5. **PDF esportato = sempre 7 pagine A4.** Nessuna ottava pagina. `@page { size: A4; margin: 0 }`,
   `.page { height: 297mm; overflow: hidden; page-break-after: always }`, `.page.last { page-break-after: auto }`.

### Stato validato (2026-09-08)
- Fix commit `99310ae` (rimozione `<embed>`) + `38deba0` (pag.7 flusso normale) → export
  reale = 7 pagine con disegno, in entrambi i casi (pdf.js ok e pdf.js bloccato → placeholder).
- Verifica headless con `page.pdf()` + `pdfimages` (immagine su pag. 7) + `pdfinfo` (Pages 7).
- Anteprima `print.html` non toccare: header/footer, 7 pagine, sezione composizione vetro,
  tabella composizione chimica, statement PCR condizionali, pack-spec con calcoli Excel.

## Altri punti fermi
- `data.js` = catalogo materiali (Chiara), mappa etichette pack-coding (GL70/HDPE2/LDPE4/
  PP5/C/PP92/C/PP95/K-RESIN), note bancale fisse+variabili, composizione vetro default (Flint Glass).
- Calcolo bancale = formula dell'Excel "Calcolatore automatico pallettizzazione 2.0"
  (`scatolePallet = scatoleStrato × strati`, `pezziTotali = pezziScatola × scatolePallet`,
  EPAL 25 Kg, cartone 0,5 Kg/scatola). NON reintrodurre il campo `pezziTotali` manuale.
- `docs/` è gitignorata: allegati Chiara (XLSX/PDF/JPG) vivono solo in locale + `docs/brief-tds-poc.md`.
- Push: usare `env -u GITHUB_TOKEN git push` (GITHUB_TOKEN env è stantio, 401). `gh` autenticato come StefanoBonfanti66.
- App live: https://stefanobonfanti66.github.io/vetronaviglio-tds-automation/