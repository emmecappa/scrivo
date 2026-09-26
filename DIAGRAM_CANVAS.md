# 🎨 Canvas Diagrammi - Funzionalità Avanzate

## ✅ Nuove Funzionalità Implementate

### 1. 🖊️ Disegno a Mano Libera (Matita)
- **Strumento**: Clicca sull'icona della matita o premi `P`
- **Come usare**: 
  - Clicca e trascina per disegnare
  - Il tratto segue esattamente il movimento del mouse
  - Supporta diversi spessori e colori
- **Caratteristiche**:
  - Tratto fluido e naturale
  - Calcolo automatico del bounding box
  - Ridimensionabile come qualsiasi altro oggetto
  - Salvato come serie di punti

### 2. 🖼️ Aggiunta Immagini
- **Strumento**: Clicca sull'icona immagine o premi `I`
- **Come usare**:
  - Clicca sul canvas
  - Si apre il file picker
  - Seleziona un'immagine dal tuo computer
  - L'immagine viene inserita e ridimensionabile
- **Caratteristiche**:
  - Supporta tutti i formati immagine (PNG, JPG, GIF, SVG, etc.)
  - Ridimensionamento proporzionale
  - Trascinabile come altri oggetti
  - Salvata in base64 nel database

### 3. 📏 Ridimensionamento Oggetti
- **Come usare**:
  - Seleziona un oggetto (clicca su di esso)
  - Appariranno 8 maniglie di ridimensionamento (angoli e lati)
  - Trascina una maniglia per ridimensionare
- **Maniglie disponibili**:
  - 4 angoli (nw, ne, sw, se) - ridimensiona in entrambe le direzioni
  - 4 lati (n, s, e, w) - ridimensiona in una direzione
- **Oggetti ridimensionabili**:
  - ✅ Forme (rettangoli, cerchi, rombi)
  - ✅ Testo
  - ✅ Immagini
  - ✅ Disegni a mano libera
  - ✅ Frecce

### 4. 🎚️ Controllo Spessore Tratto
- **Dove**: Nella toolbar, sezione "Spessore"
- **Valori disponibili**: 1, 2, 3, 5, 8, 12, 16 px
- **Come usare**:
  - Seleziona uno spessore prima di disegnare
  - Oppure seleziona un oggetto e cambia lo spessore
- **Applicabile a**:
  - ✅ Disegni a mano libera
  - ✅ Bordi delle forme
  - ✅ Testo (dimensione font)

### 5. 🧹 Gomma
- **Strumento**: Clicca sull'icona della gomma o premi `E`
- **Come usare**:
  - Clicca e trascina sugli oggetti da cancellare
  - Oppure seleziona un oggetto e premi `Delete` o `Backspace`
- **Caratteristiche**:
  - Cancella qualsiasi tipo di oggetto
  - Funziona anche sui disegni a mano libera
  - Rilevamento preciso basato sulla distanza dal tratto

---

## 🎯 Scorciatoie da Tastiera

| Tasto | Azione |
|-------|--------|
| `V` | Strumento selezione |
| `R` | Rettangolo |
| `C` | Cerchio |
| `D` | Rombo |
| `T` | Testo |
| `P` | Matita (disegno a mano libera) |
| `E` | Gomma |
| `I` | Immagine |
| `Delete` / `Backspace` | Elimina oggetto selezionato |
| `Alt` + Click | Sposta la vista (pan) |

---

## 🎨 Colori Disponibili

10 colori predefiniti:
- 🔵 Blu (#3B82F6)
- 🔴 Rosso (#EF4444)
- 🟢 Verde (#10B981)
- 🟡 Giallo (#F59E0B)
- 🟣 Viola (#8B5CF6)
- 🌸 Rosa (#EC4899)
- 🟦 Indaco (#6366F1)
- 🟢 Turchese (#14B8A6)
- ⚫ Nero (#000000)
- ⚪ Bianco (#FFFFFF)

---

## 📐 Spessori Disponibile

7 spessori predefiniti:
- 1px - Molto sottile
- 2px - Sottile (default)
- 3px - Medio
- 5px - Spesso
- 8px - Molto spesso
- 12px - Extra spesso
- 16px - Ultra spesso

---

## 🖱️ Interazione con gli Oggetti

### Selezione
- Clicca su un oggetto per selezionarlo
- Apparirà un bordo blu tratteggiato
- 8 maniglie di ridimensionamento diventeranno visibili

### Spostamento
- Clicca e trascina un oggetto selezionato
- L'oggetto segue il mouse
- Rilascia per confermare la posizione

### Ridimensionamento
- Seleziona un oggetto
- Trascina una delle 8 maniglie
- L'oggetto si ridimensiona in tempo reale
- Rilascia per confermare

### Modifica Testo
- Doppio click su una forma
- Si apre un prompt per inserire/modificare il testo
- Il testo viene centrato nella forma

### Eliminazione
- Seleziona un oggetto
- Premi `Delete` o `Backspace`
- Oppure usa il pulsante cestino nella toolbar
- Oppure usa la gomma

---

## 🎯 Casi d'Uso

### 1. Diagrammi di Flusso
```
[Rettangolo] → [Rombo] → [Rettangolo]
   Start      Decisione      End
```
- Usa rettangoli per i processi
- Usa rombi per le decisioni
- Collega con frecce
- Aggiungi testo descrittivo

### 2. Schizzi a Mano Libera
- Usa la matita per disegnare idee
- Aggiungi forme per strutturare
- Inserisci immagini per riferimento
- Ridimensiona per adattare

### 3. Wireframe UI
- Rettangoli per container
- Cerchi per avatar
- Testo per label
- Immagini per mockup

### 4. Mappe Mentali
- Cerchio centrale per il tema
- Rettangoli per i sotto-temi
- Frecce per le connessioni
- Colori diversi per categorie

### 5. Presentazioni Visuali
- Forme per i concetti chiave
- Immagini per supporto visivo
- Testo per spiegazioni
- Colori per enfasi

---

## 💡 Suggerimenti e Trick

### Disegno Preciso
- Usa `Alt` + Click per spostare la vista
- Usa lo zoom per lavorare sui dettagli
- Seleziona uno spessore sottile (1-2px) per precisione

### Ridimensionamento Proporzionale
- Trascina dagli angoli per ridimensionare proporzionalmente
- Trascina dai lati per ridimensionare in una direzione

### Organizzazione
- Usa colori diversi per categorie
- Usa spessori diversi per gerarchia
- Raggruppa oggetti correlati visivamente

### Immagini
- Carica immagini ad alta risoluzione
- Ridimensionale dopo il caricamento
- Usa il formato PNG per trasparenze

### Disegno a Mano Libera
- Usa uno spessore medio (3-5px) per leggibilità
- Disegna lentamente per tratti più precisi
- Usa la gomma per correggere errori

---

## 🔧 Caratteristiche Tecniche

### Salvataggio
- Tutti gli oggetti vengono salvati automaticamente
- Salvataggio triggerato dopo ogni modifica
- Dati salvati in formato JSON nel database

### Performance
- Rendering ottimizzato con HTML5 Canvas
- Supporto per HiDPI/Retina display
- Grid di sfondo per allineamento

### Precisione
- Coordinate floating point per precisione sub-pixel
- Rilevamento collisioni accurato
- Bounding box calcolato dinamicamente

### Compatibilità
- Supporta tutti i browser moderni
- Funziona su desktop e tablet
- Responsive al ridimensionamento della finestra

---

## 🚀 Prossime Funzionalità (Future)

### In Arrivo
- [ ] Rotazione oggetti
- [ ] Allineamento automatico
- [ ] Griglia snap-to-grid
- [ ] Raggruppamento oggetti
- [ ] Livelli (z-index)
- [ ] Opacity/trasparenza
- [ ] Gradienti e pattern
- [ ] Esportazione PNG/SVG
- [ ] Importazione da file
- [ ] Template predefiniti
- [ ] Connessioni curve (Bezier)
- [ ] Testo su path
- [ ] Forme personalizzate

---

## 📚 Esempi di Utilizzo

### Esempio 1: Diagramma di Flusso Semplice
```
1. Seleziona strumento Rettangolo (R)
2. Disegna un rettangolo
3. Doppio click per aggiungere testo "Start"
4. Ripeti per "Processo" e "End"
5. Seleziona strumento Freccia
6. Collega i rettangoli
7. Aggiungi un rombo per "Decisione?"
```

### Esempio 2: Schizzo a Mano Libera
```
1. Seleziona strumento Matita (P)
2. Scegli colore nero e spessore 3px
3. Disegna liberamente
4. Aggiungi forme geometriche per struttura
5. Inserisci immagini per riferimento
6. Ridimensiona gli elementi per adattare
```

### Esempio 3: Wireframe con Immagini
```
1. Disegna rettangoli per il layout
2. Seleziona strumento Immagine (I)
3. Carica screenshot o mockup
4. Posiziona le immagini nei rettangoli
5. Ridimensiona per adattare
6. Aggiungi testo per label
```

---

## 🎉 Conclusione

Il canvas dei diagrammi ora supporta:
- ✅ Forme geometriche (rettangoli, cerchi, rombi)
- ✅ Testo
- ✅ Frecce e connessioni
- ✅ **Disegno a mano libera** (matita)
- ✅ **Immagini** (upload e ridimensionamento)
- ✅ **Ridimensionamento** di tutti gli oggetti
- ✅ **Controllo spessore** tratto
- ✅ Gomma per cancellare
- ✅ 10 colori predefiniti
- ✅ 7 spessori predefiniti
- ✅ Scorciatoie da tastiera
- ✅ Salvataggio automatico

**Buon disegno! 🎨✨**
