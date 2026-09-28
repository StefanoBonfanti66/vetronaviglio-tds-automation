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
4. **Cache busting**: da `app.js` aprire sempre `print.html?v=CURRENT` (oggi `?v=6`).
   Bumpa il numero **ad ogni modifica** di print.html, altrimenti il browser serve una
   versione vecchia in cache e il cliente "non vede il disegno / ottava pagina vuota".
   In print.html ci sono anche meta `Cache-Control: no-store` / `Pragma: no-cache`.
5. **PDF esportato = sempre 7 pagine A4.** Nessuna ottava pagina. `@page { size: A4; margin: 0 }`,
   `.page { height: 297mm; overflow: hidden; page-break-after: always }`, `.page.last { page-break-after: auto }`.

### Stato validato (2026-09-08)
- Fix commit `99310ae` (rimozione `<embed>`) + `38deba0` (pag.7 flusso normale) → export
  reale = 7 pagine con disegno, in entrambi i casi (pdf.js ok e pdf.js bloccato → placeholder).
- Verifica headless con `page.pdf()` + `pdfimages` (immagine su pag. 7) + `pdfinfo` (Pages 7).
- Dopo il feedback di Chiara (2026-09-25), la revisione è fissa a `Rev. 4 del 30/09/2022`,
  la composizione vetro Flint Glass è statica e confluita nella colonna `COMPONENT` della
  tabella materiali a pag. 2 con notazione chimica a pedici. Nella colonna `MATERIALS`
  la voce `[VETRO] Flint Glass` NON deve essere stampata: solo i materiali selezionati.
  Il marker PCR non viene stampato
  e la firma `assets/firma.jpg` è sotto Federico Rosi. Il flusso pagina 7 e il layout A4 a 7
  pagine restano invariati; la verifica locale con Playwright ha prodotto un PDF A4 di 7 pagine.
- I campi di disegno restano come nell'interfaccia precedente: i selettori conservano il
  nome/reference, mentre il file effettivamente incorporato nella TDS viene caricato da
  `Sfoglia` alle pagine 6/7.

## Altri punti fermi
- `data.js` = catalogo materiali (Chiara), mappa etichette pack-coding (GL70/HDPE2/LDPE4/
  PP5/C/PP92/C/PP95/K-RESIN), note bancale fisse+variabili, composizione vetro fissa Flint Glass,
  revisione fissa Rev. 4 del 30/09/2022.
- Calcolo bancale = formula dell'Excel "Calcolatore automatico pallettizzazione 2.0"
  (`scatolePallet = scatoleStrato × strati`, `pezziTotali = pezziScatola × scatolePallet`,
  EPAL 25 Kg, cartone 0,5 Kg/scatola). NON reintrodurre il campo `pezziTotali` manuale.
- `docs/` è gitignorata: allegati Chiara (XLSX/PDF/JPG) vivono solo in locale + `docs/brief-tds-poc.md`.
- Push: usare `env -u GITHUB_TOKEN git push` (GITHUB_TOKEN env è stantio, 401). `gh` autenticato come StefanoBonfanti66.
- App live: https://stefanobonfanti66.github.io/vetronaviglio-tds-automation/