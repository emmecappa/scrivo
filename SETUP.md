# ⚡ QUICK START - Setup Firebase in 5 minuti

## Cosa ti serve:
1. Un account **Google** (per Firebase)
2. Un account **Vercel** (gratis) → [vercel.com](https://vercel.com)
3. Un account **GitHub** → [github.com](https://github.com)

---

## Passo 1: Firebase (5 min)

### 1a. Crea il progetto
- Vai su [Firebase Console](https://console.firebase.google.com)
- Clicca **"Add project"** / **"Aggiungi progetto"**
- Nome: `notion-clone` (o quello che preferisci)
- Google Analytics: puoi disabilitarlo (non serve)
- Clicca **"Create project"**

### 1b. Abilita Authentication
- Nel menu laterale → **Build → Authentication**
- Clicca **"Get started"**
- Nella tab **"Sign-in method"** → abilita **"Email/Password"**
- Salva

### 1c. Crea il Firestore Database
- Nel menu laterale → **Build → Firestore Database**
- Clicca **"Create database"**
- Scegli **"Start in test mode"** (per iniziare, poi potrai aggiungere regole di sicurezza)
- Seleziona la region più vicina a te (es: `eur3` per Europa)
- Clicca **"Enable"**

### 1d. Registra l'app Web
- Vai su **Project Settings** (icona ingranaggio in alto a sinistra)
- Scorri fino a **"Your apps"**
- Clicca l'icona **Web** (`</>`)
- Nome app: `notion-clone-web` (o quello che preferisci)
- Clicca **"Register app"**
- **Copia la configurazione** che appare (è un oggetto JavaScript con apiKey, authDomain, etc.)

### 1e. Copia le chiavi nel file .env
La configurazione che hai copiato sarà simile a questa:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tuo-progetto.firebaseapp.com",
  projectId: "tuo-progetto",
  storageBucket: "tuo-progetto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

Crea un file `.env` nella root del progetto con:
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tuo-progetto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tuo-progetto
VITE_FIREBASE_STORAGE_BUCKET=tuo-progetto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## Passo 2: Deploy su Vercel

1. Pusha il codice su un repo GitHub
2. Vai su vercel.com → **Add New** → **Project**
3. Importa il repo
4. Framework: **Vite** (auto-detectato)
5. Nelle **Environment Variables** di Vercel, aggiungi le stesse 6 variabili:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
6. Clicca **Deploy** 🚀

---

## Passo 3: Test

1. Apri il sito deployato (es: `https://notion-clone.vercel.app`)
2. Registrati con la tua email
3. Crea un workspace
4. Inizia a scrivere!

---

## 🔧 Risoluzione problemi

### "Firebase non configurato"
→ Controlla che tutte le 6 variabili `VITE_FIREBASE_*` siano presenti nel file `.env` o nelle env variables di Vercel

### "Missing or insufficient permissions"
→ Firestore è in modalità production. Vai su Firestore → Rules e imposta:
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

### "auth/email-already-in-use"
→ L'email è già registrata. Usa un'altra email o resetta la password.

### "auth/invalid-email"
→ Controlla che l'email sia valida.

### L'app non carica dopo il deploy
→ Assicurati di aver aggiunto TUTTE le 6 variabili d'ambiente su Vercel e di aver fatto un nuovo deploy.

---

## 📊 Limiti del piano gratuito (Spark Plan)

| Risorsa | Limite |
|---------|--------|
| Firestore Storage | 1 GB |
| Firestore Letture | 50.000/giorno |
| Firestore Scritture | 20.000/giorno |
| Firestore Cancellazioni | 20.000/giorno |
| Auth Utenti | Illimitati |
| Hosting Storage | 10 GB |
| Hosting Transfer | 360 MB/giorno |

**Per un team di 5-10 persone che usa l'app normalmente, il piano gratuito è più che sufficiente!**

---

## 🔒 Sicurezza (da fare dopo il setup iniziale)

Una volta che tutto funziona, aggiungi le regole di sicurezza Firestore:

1. Vai su **Firestore Database → Rules**
2. Incolla queste regole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isWorkspaceMember(workspaceId) {
      return isAuthenticated() && (
        exists(/databases/$(database)/documents/workspaces/$(workspaceId)) &&
        get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.created_by == request.auth.uid
      );
    }
    
    // Workspaces
    match /workspaces/{workspaceId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
        resource.data.created_by == request.auth.uid;
    }
    
    // Pages
    match /pages/{pageId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // Blocks
    match /blocks/{blockId} {
      allow read, write: if isAuthenticated();
    }
    
    // Workspace Members
    match /workspace_members/{memberId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}
```

3. Clicca **"Publish"**
