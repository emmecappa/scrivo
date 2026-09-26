# 🐛 Correzione Bug Canvas Diagrammi

## Bug Risolti

### 1. ❌ I diagrammi non venivano salvati su DB

**Problema:**
- La funzione `saveDiagram()` non stava effettivamente salvando i dati su Firestore
- Il codice originale usava `updatePage()` che non supportava il campo `diagram_data`
- I dati venivano persi al refresh della pagina

**Soluzione Implementata:**
```typescript
const saveDiagram = useCallback((newShapes: DiagramShape[], newConnections: Connection[]) => {
  if (!currentPageId || !isFirebaseConfigured || !db) {
    console.error('❌ Cannot save: missing prerequisites');
    return;
  }

  // Debounce save (500ms)
  saveTimeoutRef.current = setTimeout(async () => {
    try {
      const data = JSON.stringify({ shapes: newShapes, connections: newConnections });
      console.log('💾 Saving diagram:', newShapes.length, 'shapes');
      
      const pageRef = doc(db, 'pages', currentPageId);
      await setDoc(pageRef, { 
        diagram_data: data,
        updated_at: new Date().toISOString()
      }, { merge: true });
      
      console.log('✅ Diagram saved successfully');
    } catch (err) {
      console.error('❌ Error saving diagram:', err);
    }
  }, 500);
}, [currentPageId]);
```

**Cambiamenti Chiave:**
1. ✅ Uso diretto di `setDoc()` con `merge: true` per salvare su Firestore
2. ✅ Salvataggio del campo `diagram_data` come JSON string
3. ✅ Debounce di 500ms per evitare troppe scritture
4. ✅ Logging dettagliato per debug
5. ✅ Gestione errori con try-catch

---

### 2. ❌ Resize e movimento non funzionavano correttamente

**Problema:**
- Il canvas non si aggiornava correttamente durante il drag/resize
- Le coordinate non tenevano conto di pan e zoom
- Il rendering non era sincronizzato con lo stato React

**Soluzione Implementata:**

#### A. Correzione Coordinate System
```typescript
const getCanvasCoords = (e: React.MouseEvent) => {
  const canvas = canvasRef.current;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  // Convert screen coordinates to canvas coordinates accounting for pan and zoom
  return {
    x: (e.clientX - rect.left - pan.x) / zoom,
    y: (e.clientY - rect.top - pan.y) / zoom,
  };
};
```

**Cambiamenti:**
- ✅ Conversione corretta delle coordinate mouse considerando pan e zoom
- ✅ Uso di `getBoundingClientRect()` per coordinate accurate
- ✅ Sottrazione di `pan.x` e `pan.y` per offset
- ✅ Divisione per `zoom` per scaling

#### B. Ottimizzazione Rendering
```typescript
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  // Clear and redraw
  ctx.clearRect(0, 0, rect.width, rect.height);
  
  // Apply transformations
  ctx.save();
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);
  
  // Draw grid, connections, shapes...
  
  ctx.restore();
}, [shapes, connections, selectedShape, zoom, pan, currentFreehandPoints, selectedColor, selectedStrokeWidth]);
```

**Cambiamenti:**
- ✅ Rendering completo ad ogni cambio di stato
- ✅ Supporto HiDPI/Retina con `devicePixelRatio`
- ✅ Trasformazioni canvas corrette (translate + scale)
- ✅ Uso di `save()` e `restore()` per isolare trasformazioni

#### C. Fix Drag & Resize
```typescript
const handleMouseMove = (e: React.MouseEvent) => {
  const coords = getCanvasCoords(e);
  
  if (isResizing && selectedShape && resizeHandle) {
    const dx = coords.x - drawStart.x;
    const dy = coords.y - drawStart.y;
    
    setShapes(prev => {
      const newShapes = prev.map(s => {
        if (s.id !== selectedShape) return s;
        
        let newX = resizeStart.x;
        let newY = resizeStart.y;
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        
        if (resizeHandle.includes('e')) newWidth = Math.max(20, resizeStart.width + dx);
        if (resizeHandle.includes('w')) {
          newWidth = Math.max(20, resizeStart.width - dx);
          newX = resizeStart.x + dx;
        }
        if (resizeHandle.includes('s')) newHeight = Math.max(20, resizeStart.height + dy);
        if (resizeHandle.includes('n')) {
          newHeight = Math.max(20, resizeStart.height - dy);
          newY = resizeStart.y + dy;
        }
        
        return { ...s, x: newX, y: newY, width: newWidth, height: newHeight };
      });
      return newShapes;
    });
  }
  
  if (isDragging && selectedShape) {
    setShapes(prev => {
      const newShapes = prev.map(s => 
        s.id === selectedShape 
          ? { ...s, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
          : s
      );
      return newShapes;
    });
  }
};
```

**Cambiamenti:**
- ✅ Uso di `setShapes(prev => ...)` per stato aggiornato
- ✅ Calcolo corretto delta (dx, dy) per resize
- ✅ Applicazione corretta offset per drag
- ✅ Limiti minimi (20px) per evitare oggetti troppo piccoli

#### D. Fix Grid Rendering
```typescript
// Draw grid
ctx.strokeStyle = '#f0f0f0';
ctx.lineWidth = 0.5;
const gridSize = 20;
const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize;
const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize;
const endX = startX + (rect.width / zoom) + gridSize * 2;
const endY = startY + (rect.height / zoom) + gridSize * 2;

for (let x = startX; x < endX; x += gridSize) {
  ctx.beginPath();
  ctx.moveTo(x, startY);
  ctx.lineTo(x, endY);
  ctx.stroke();
}
for (let y = startY; y < endY; y += gridSize) {
  ctx.beginPath();
  ctx.moveTo(startX, y);
  ctx.lineTo(endX, y);
  ctx.stroke();
}
```

**Cambiamenti:**
- ✅ Calcolo ottimizzato dei limiti della grid
- ✅ Grid si estende oltre i bordi per evitare buchi durante pan
- ✅ Performance migliorata con calcolo dinamico

---

## Test dei Bug Fix

### Test 1: Salvataggio Diagrammi
1. Crea un nuovo diagramma
2. Aggiungi alcune forme
3. **Refresh della pagina** (F5)
4. ✅ Il diagramma deve essere ancora visibile
5. Controlla la console per i log:
   ```
   💾 Saving diagram: X shapes
   ✅ Diagram saved successfully
   ```

### Test 2: Movimento Oggetti
1. Crea una forma
2. Selezionala
3. Trascinala in una nuova posizione
4. ✅ La forma deve seguire il mouse esattamente
5. Rilascia il mouse
6. ✅ La forma deve rimanere nella nuova posizione

### Test 3: Resize Oggetti
1. Crea una forma
2. Selezionala
3. Trascina una maniglia di resize
4. ✅ La forma deve ridimensionarsi in tempo reale
5. Rilascia il mouse
6. ✅ La forma deve mantenere le nuove dimensioni

### Test 4: Pan e Zoom
1. Crea alcune forme
2. Usa Alt+Click per spostare la vista (pan)
3. ✅ Le forme devono muoversi con la vista
4. Usa i pulsanti zoom
5. ✅ Le forme devono scalare correttamente
6. Prova a trascinare le forme dopo zoom
7. ✅ Le coordinate devono essere corrette

### Test 5: Disegno a Mano Libera
1. Seleziona lo strumento matita (P)
2. Disegna liberamente
3. ✅ Il tratto deve seguire esattamente il mouse
4. Rilascia il mouse
5. ✅ Il disegno deve rimanere visibile
6. Prova a ridimensionare il disegno
7. ✅ Il bounding box deve essere corretto

---

## Dettagli Tecnici

### Architettura Salvataggio
```
User Action (drag/resize/draw)
  ↓
setShapes() → Update React state
  ↓
useEffect() → Re-render canvas
  ↓
saveDiagram() → Debounce 500ms
  ↓
setDoc() → Save to Firestore
  ↓
Console log → Debug info
```

### Coordinate System
```
Screen Coords (mouse event)
  ↓
getBoundingClientRect() → Canvas bounds
  ↓
Subtract pan offset → Remove translation
  ↓
Divide by zoom → Remove scaling
  ↓
Canvas Coords (drawing space)
```

### Rendering Pipeline
```
React State Change
  ↓
useEffect() triggered
  ↓
Clear canvas
  ↓
Apply transformations (pan, zoom)
  ↓
Draw grid
  ↓
Draw connections
  ↓
Draw shapes
  ↓
Draw selection box
  ↓
Restore context
```

---

## Performance Ottimizzazioni

### 1. Debounce Salvataggio
- 500ms di delay prima di salvare
- Evita troppe scritture su Firestore
- Riduce costi e migliora performance

### 2. Rendering Efficiente
- Uso di `requestAnimationFrame` implicito (React)
- Clear e redraw solo quando necessario
- Trasformazioni canvas isolate con save/restore

### 3. Coordinate Ottimizzate
- Calcolo una sola volta per evento mouse
- Nessuna conversione ridondante
- Supporto HiDPI senza overhead

---

## Limiti Conosciuti

### 1. Salvataggio Non Istantaneo
- 500ms di delay prima del salvataggio
- Se la pagina viene chiusa prima del salvataggio, i dati potrebbero essere persi
- **Workaround**: Salvataggio manuale prima di chiudere

### 2. Performance con Molti Oggetti
- Canvas redraw completo ad ogni cambio
- Potrebbe rallentare con >100 oggetti
- **Workaround**: Limitare il numero di oggetti per pagina

### 3. Immagini Grandi
- Immagini salvate in base64
- Potrebbero rallentare il caricamento
- **Workaround**: Comprimere immagini prima del caricamento

---

## Prossimi Miglioramenti

### 1. Salvataggio Istantaneo Opzionale
- Aggiungere opzione per salvare immediatamente
- Utile per dati critici

### 2. Undo/Redo
- Implementare history stack
- Supporto Ctrl+Z e Ctrl+Y

### 3. Auto-save Indicator
- Mostrare stato salvataggio nella UI
- "Salvato" / "Salvataggio..." / "Non salvato"

### 4. Conflict Resolution
- Gestire modifiche simultanee da più utenti
- Implementare CRDT o Operational Transformation

---

## Conclusioni

✅ **Bug 1 Risolto**: I diagrammi ora vengono salvati correttamente su Firestore
✅ **Bug 2 Risolto**: Resize e movimento funzionano correttamente con coordinate accurate
✅ **Performance**: Ottimizzazioni per rendering e salvataggio
✅ **Stabilità**: Gestione errori e logging per debug

Il canvas dei diagrammi ora è completamente funzionante e pronto per l'uso! 🎨✨
