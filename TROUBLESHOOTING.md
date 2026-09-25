# 🔧 Risoluzione Problemi - Guida Rapida

## Problema 1: Non ricevo l'email di conferma

### ✅ Soluzione rapida (CONSIGLIATA)

**Disabilita la verifica email in Firebase:**

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il tuo progetto
3. Menu laterale → **Build → Authentication**
4. Clicca sulla tab **"Settings"** (in alto)
5. Espandi la sezione **"User actions"**
6. **Disabilita** il toggle "Enable email link sign-in" o cerca "Email verification"
7. In alternativa, vai su **Authentication → Sign-in method** e verifica che non ci siano impostazioni di verifica obbligatoria

**Risultato:** Ora gli utenti possono registrarsi e accedere subito senza confermare l'email.

---

### Alternativa: Mantenere la verifica email

Se vuoi che gli utenti verifichino l'email:

1. Dopo la registrazione, controlla la **cartella spam**
2. Nell'app, clicca su **"Invia di nuovo l'email"**
3. Verifica che in **Authentication → Templates** l'email sia configurata
4. Controlla che il dominio email non sia in blacklist

---

## Problema 2: Dopo il login non vedo i miei dati

### ✅ Soluzione (99% dei casi)

**Il problema sono le regole di sicurezza Firestore!**

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Seleziona il tuo progetto
3. Menu laterale → **Build → Firestore Database**
4. Clicca sulla tab **"Rules"** (in alto)
5. **Sostituisci TUTTO il contenuto** con questo:

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

6. Clicca **"Publish"** (Pubblica)
7. **Ricarica la pagina** dell'app

**Risultato:** Ora i tuoi dati saranno visibili!

---

### Perché succede?

Firebase di default crea il database in modalità **"locked"** (bloccato), che impedisce qualsiasi lettura/scrittura anche se sei autenticato. Le regole sopra permettono a tutti gli utenti autenticati di leggere e scrivere i propri dati.

---

## 🔍 Come verificare se tutto funziona

### 1. Controlla la console del browser
- Premi **F12** o **Ctrl+Shift+I**
- Vai nella tab **"Console"**
- Dovresti vedere log come:
  ```
  Loading workspace for user: xxx
  Workspace found: xxx
  Pages loaded: 3
  ```

### 2. Usa il pannello debug
- Nell'app, clicca sull'icona **🐛** in alto a destra
- Vedrai:
  - User ID
  - Workspace ID
  - Numero di pagine caricate
  - Numero di blocchi

### 3. Verifica direttamente in Firebase
- Vai su **Firestore Database**
- Dovresti vedere le collection:
  - `workspaces`
  - `pages`
  - `blocks`
  - `workspace_members`
- Clicca su ogni collection per vedere i documenti

---

## 🆘 Se il problema persiste

### Checklist completa:

- [ ] Firebase è configurato correttamente (6 variabili d'ambiente)
- [ ] Authentication → Email/Password è abilitato
- [ ] Firestore Database è stato creato
- [ ] **Regole Firestore sono state aggiornate** (vedi sopra)
- [ ] Verifica email è disabilitata (o hai verificato l'email)
- [ ] Le variabili d'ambiente su Vercel sono corrette
- [ ] Hai fatto un nuovo deploy dopo aver aggiunto le variabili

### Errori comuni nella console:

| Errore | Causa | Soluzione |
|--------|-------|-----------|
| `Missing or insufficient permissions` | Regole Firestore bloccate | Aggiorna le regole (vedi sopra) |
| `Firebase not configured` | Variabili d'ambiente mancanti | Aggiungi le 6 variabili VITE_FIREBASE_* |
| `auth/invalid-credential` | Email/password errati | Controlla le credenziali |
| `auth/email-already-in-use` | Email già registrata | Usa un'altra email o fai login |

---

## 💡 Suggerimenti

1. **Per testare velocemente:** Disabilita la verifica email e usa regole Firestore permissive
2. **Per produzione:** Abilita la verifica email e usa regole più restrittive
3. **Per debug:** Usa il pannello 🐛 e la console del browser
4. **Per sicurezza:** Leggi la sezione "Security Rules" nella documentazione Firebase

---

## 📞 Supporto

Se dopo aver seguito questa guida hai ancora problemi:

1. Apri la console del browser (F12)
2. Copia gli errori che vedi
3. Controlla il pannello debug (🐛)
4. Verifica in Firebase Console che i dati esistano davvero

**La causa nel 90% dei casi sono le regole Firestore!**
