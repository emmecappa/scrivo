# 🔍 Guida Diagnostica - Verifica Dati Firestore

## Problema: Dopo il login non vedo i miei dati

Segui questa guida passo-passo per capire cosa sta succedendo.

---

## Passo 1: Verifica nella Console del Browser

1. Apri la tua app nel browser
2. Premi **F12** o **Ctrl+Shift+I** per aprire gli strumenti per sviluppatori
3. Vai nella tab **"Console"**
4. Fai il login
5. **Copia e incolla qui i log che vedi**

Dovresti vedere qualcosa come:
```
🔍 Controllo autenticazione...
🔔 onAuthStateChanged triggered: User: tua@email.com
✅ Utente autenticato: tua@email.com UID: xxx
📂 Caricamento workspace...
📂 Loading workspace for user: xxx
📊 Workspace query result: { empty: false, size: 1 }
✅ Workspace found: xxx
📄 Caricamento pagine...
📄 Loading pages for workspace: xxx
📊 Pages query result: { empty: false, size: 3 }
✅ Pages loaded: 3
```

**Se vedi questo:** ✅ Tutto funziona, i dati sono stati caricati

**Se vedi questo:** ❌ C'è un problema
```
📊 Workspace query result: { empty: true, size: 0 }
⚠️ No workspace found for user
```

---

## Passo 2: Verifica direttamente in Firebase Console

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il tuo progetto
3. Vai su **Build → Firestore Database**
4. Dovresti vedere queste collection:
   - `workspaces`
   - `pages`
   - `blocks`
   - `workspace_members`

5. Clicca su **`workspaces`**
6. Dovresti vedere un documento con:
   - **ID**: una stringa lunga (es: `abc123def456`)
   - **Fields**:
     - `created_by`: il tuo User ID
     - `name`: il nome del workspace
     - `icon`: "📝"

7. **Confronta il `created_by` con il tuo User ID** (lo trovi nella console del browser o nel pannello debug 🐛)

**Se i campi corrispondono:** ✅ I dati sono salvati correttamente

**Se non trovi nessun documento:** ❌ Il workspace non è stato creato

---

## Passo 3: Verifica le Regole di Sicurezza Firestore

**QUESTO È IL PROBLEMA NEL 90% DEI CASI!**

1. Vai su **Firestore Database → Rules**
2. Controlla che le regole siano ESATTAMENTE queste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Se le regole sono diverse, **cancellale tutte** e incolla quelle sopra
4. Clicca **"Publish"**
5. **Ricarica la pagina** dell'app

**Se le regole erano sbagliate:** ✅ Ora i dati dovrebbero essere visibili!

---

## Passo 4: Usa il Pannello Debug

1. Nell'app, clicca sull'icona **🐛** in alto a destra
2. Controlla:
   - **User ID**: deve corrispondere al `created_by` in Firestore
   - **Workspace**: deve mostrare il nome del workspace
   - **Pages**: deve mostrare il numero di pagine caricate

3. Clicca su **🔄** per forzare il ricaricamento dei dati
4. Controlla la console del browser per vedere i log

---

## Passo 5: Test di Creazione

Se ancora non vedi i dati:

1. Clicca su **🐛** per aprire il debug panel
2. Apri la console del browser (F12)
3. Prova a creare un nuovo workspace
4. Controlla i log nella console:
   ```
   🏗️ Creating workspace: nome-workspace for user: xxx
   📝 Workspace data: { name: "nome-workspace", ... }
   ✅ Workspace created with ID: xxx
   ✅ Workspace verified in Firestore: { ... }
   ```

5. Vai su **Firebase Console → Firestore Database → workspaces**
6. Dovresti vedere il nuovo documento

**Se il documento esiste in Firestore ma non nell'app:** ❌ Problema di caricamento

**Se il documento non esiste in Firestore:** ❌ Problema di salvataggio (probabilmente regole di sicurezza)

---

## Passo 6: Soluzioni Comuni

### ❌ "Missing or insufficient permissions"

**Causa:** Le regole di sicurezza Firestore stanno bloccando l'accesso

**Soluzione:** Aggiorna le regole (vedi Passo 3)

---

### ❌ "Workspace query result: empty: true"

**Causa:** Nessun workspace esiste per il tuo utente

**Soluzione:**
1. Verifica che il `created_by` in Firestore corrisponda al tuo User ID
2. Se non corrisponde, crea un nuovo workspace
3. Se non esiste proprio, crea un nuovo workspace

---

### ❌ I dati vengono creati ma non ricaricati dopo il login

**Causa:** Problema con la persistenza della sessione o con il caricamento

**Soluzione:**
1. Clicca su **🔄** per forzare il ricaricamento
2. Controlla la console per vedere se ci sono errori
3. Prova a fare logout e login di nuovo
4. Se ancora non funziona, svuota la cache del browser (Ctrl+Shift+Del)

---

### ❌ "permission-denied" nella console

**Causa:** Le regole di sicurezza Firestore sono troppo restrittive

**Soluzione:** Aggiorna le regole (vedi Passo 3)

---

## Passo 7: Checklist Finale

Prima di chiedere aiuto, verifica:

- [ ] Firebase è configurato (6 variabili d'ambiente presenti)
- [ ] Authentication → Email/Password è abilitato
- [ ] Firestore Database è stato creato
- [ ] **Regole Firestore sono state aggiornate** (Passo 3)
- [ ] Il documento `workspaces` esiste in Firestore
- [ ] Il campo `created_by` corrisponde al tuo User ID
- [ ] La console del browser non mostra errori
- [ ] Hai provato a cliccare **🔄** per ricaricare
- [ ] Hai provato a fare logout e login di nuovo
- [ ] Hai svuotato la cache del browser

---

## 🆘 Se il problema persiste

### Raccogli queste informazioni:

1. **Screenshot della console del browser** (F12 → Console) dopo il login
2. **Screenshot del pannello debug** (🐛)
3. **Screenshot di Firestore Database** che mostra:
   - La collection `workspaces`
   - Il documento con i campi
4. **Screenshot delle regole Firestore** (Firestore → Rules)
5. **I log completi** dalla console del browser

### Con queste informazioni possiamo capire esattamente cosa sta succedendo!

---

## 💡 Suggerimenti Extra

### Per testare velocemente:
- Usa il pulsante **🔄** per forzare il ricaricamento
- Apri la console del browser (F12) per vedere i log dettagliati
- Usa il pannello debug (🐛) per vedere lo stato dell'app

### Per verificare i dati:
- Vai su Firebase Console → Firestore Database
- Controlla che i documenti esistano
- Verifica che i campi siano corretti

### Per la sicurezza:
- Usa regole Firestore permissive solo per test
- Per produzione, usa regole più restrittive che limitano l'accesso ai soli dati dell'utente
