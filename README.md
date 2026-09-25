# 📝 Notion Clone - Workspace Collaborativo

Un clone di Notion con spazio di lavoro collaborativo, editor di documenti e canvas per diagrammi.

## 🏗️ Architettura

```
┌─────────────────────────────────────────────────┐
│                    VERCEL                        │
│  ┌───────────────────────────────────────────┐  │
│  │  React + Vite + Tailwind CSS              │  │
│  │  • TipTap Editor (documenti)              │  │
│  │  • Canvas HTML5 (diagrammi)               │  │
│  │  • Zustand (state management)             │  │
│  │  • Framer Motion (animazioni)             │  │
│  └───────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────┘
                        │ HTTPS + WebSocket
┌───────────────────────┴─────────────────────────┐
│                   FIREBASE                       │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │   Auth   │ │Firestore │ │   Realtime      │ │
│  │ (Email)  │ │ (NoSQL)  │ │ (onSnapshot)    │ │
│  └──────────┘ └──────────┘ └─────────────────┘ │
│  ┌──────────┐ ┌──────────┐                      │
│  │  Rules   │ │ Storage  │                      │
│  │(Sicurezza│ │(File/Img)│                      │
│  └──────────┘ └──────────┘                      │
└─────────────────────────────────────────────────┘
```

## 🚀 Setup Completo

### 1. Creare il progetto Firebase

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Clicca **"Add project"**
3. Inserisci:
   - **Project name**: `notion-clone`
   - Google Analytics: puoi disabilitarlo
4. Clicca **"Create project"**

### 2. Configurare Authentication

1. Nel menu laterale → **Build → Authentication**
2. Clicca **"Get started"**
3. Nella tab **"Sign-in method"** → abilita **"Email/Password"**
4. Salva

### 3. Configurare Firestore Database

1. Nel menu laterale → **Build → Firestore Database**
2. Clicca **"Create database"**
3. Scegli **"Start in test mode"** (per iniziare)
4. Seleziona la region più vicina a te
5. Clicca **"Enable"**

### 4. Registrare l'app Web

1. Vai su **Project Settings** (icona ingranaggio)
2. Scorri fino a **"Your apps"**
3. Clicca l'icona **Web** (`</>`)
4. Nome app: `notion-clone-web`
5. Clicca **"Register app"**
6. **Copia la configurazione firebaseConfig**

### 5. Configurare le variabili d'ambiente

Crea un file `.env` nella root del progetto:

```bash
cp .env.example .env
```

Modifica `.env` con i valori della configurazione Firebase:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tuo-progetto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tuo-progetto
VITE_FIREBASE_STORAGE_BUCKET=tuo-progetto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 6. Deploy su Vercel

1. Pusha il progetto su GitHub
2. Vai su [vercel.com](https://vercel.com)
3. Clicca **"New Project"** → Importa il repo
4. Framework Preset: **Vite**
5. Aggiungi le 6 variabili d'ambiente (come sopra)
6. Clicca **"Deploy"**

## 📋 Funzionalità

### ✅ Fase 1 (Questa versione)
- [x] Autenticazione email/password
- [x] **Multi-workspace** (crea, gestisci e seleziona workspace)
- [x] Creazione workspace
- [x] **Collaborazione in tempo reale**
- [x] **Invito membri via email**
- [x] **Gestione ruoli** (Owner, Editor, Viewer)
- [x] **Presenza utenti** (vedi chi è online)
- [x] **Indicatori di attività** (chi sta guardando la pagina)
- [x] Pagine nidificate (albero)
- [x] Editor rich text (TipTap)
- [x] Formattazione: grassetto, corsivo, sottolineatura, evidenziato
- [x] Heading (H1, H2, H3)
- [x] Liste (puntate, numerate, task)
- [x] Blocchi codice
- [x] Citazioni
- [x] Link e immagini
- [x] Canvas per diagrammi (forme, connessioni, colori)
- [x] Ricerca pagine
- [x] Pagine preferite
- [x] Eliminazione pagine (cestino)
- [x] Icone personalizzate per pagina
- [x] Salvataggio automatico
- [x] Sicurezza Firestore Rules
- [x] Realtime con onSnapshot

### 🔜 Fase 2 (Prossimi sviluppi)
- [ ] Invito membri al workspace
- [ ] Commenti e menzioni
- [ ] Version history
- [ ] Template pagine
- [ ] Drag & drop per riordinare
- [ ] File upload (immagini, PDF)
- [ ] Notifiche
- [ ] Dark mode
- [ ] Export PDF/Markdown
- [ ] Mobile responsive completo

### 🔮 Fase 3 (Futuro)
- [ ] Intelligenza artificiale (riassunti, completamento)
- [ ] Database interno (tabelle stile Notion)
- [ ] Calendar view
- [ ] Kanban board
- [ ] API pubblica
- [ ] Integrazioni (Slack, Google Drive)

## 🗄️ Struttura Firestore

```
workspaces (collection)
├── {workspaceId} (document)
│   ├── name: string
│   ├── icon: string
│   ├── created_by: string (user ID)
│   ├── created_at: timestamp
│   └── updated_at: timestamp

pages (collection)
├── {pageId} (document)
│   ├── workspace_id: string
│   ├── parent_id: string | null
│   ├── title: string
│   ├── icon: string
│   ├── cover: string | null
│   ├── position: number
│   ├── created_by: string
│   ├── created_at: timestamp
│   ├── updated_at: timestamp
│   ├── is_trashed: boolean
│   └── is_favorite: boolean

blocks (collection)
├── {blockId} (document)
│   ├── page_id: string
│   ├── type: string (paragraph, heading1, heading2, etc.)
│   ├── content: object (HTML/JSON)
│   ├── position: number
│   ├── parent_id: string | null
│   ├── created_at: timestamp
│   └── updated_at: timestamp

workspace_members (collection)
├── {memberId} (document)
│   ├── workspace_id: string
│   ├── user_id: string
│   ├── email: string
│   ├── full_name: string
│   ├── role: string (owner, editor, viewer)
│   ├── status: string (active, invited)
│   ├── invited_at: timestamp
│   └── joined_at: timestamp | null

active_users (collection)
├── {workspaceId_userId} (document)
│   ├── workspace_id: string
│   ├── user_id: string
│   ├── email: string
│   ├── full_name: string
│   ├── page_id: string | null
│   ├── last_seen: timestamp
│   └── color: string
```

## 🏢 Multi-Workspace

### Creare un nuovo workspace
1. Clicca sul nome del workspace nella sidebar (in alto)
2. Clicca **"Crea nuovo workspace"**
3. Inserisci il nome del workspace
4. Clicca "Crea"

### Selezionare un workspace
1. Clicca sul nome del workspace nella sidebar
2. Seleziona il workspace dalla lista
3. Il workspace viene caricato automaticamente
4. La selezione viene ricordata (localStorage)

### Gestire un workspace
1. Clicca sul nome del workspace nella sidebar
2. Clicca **"Impostazioni workspace"**
3. Puoi:
   - Cambiare l'icona del workspace
   - Rinominare il workspace
   - Eliminare il workspace (solo proprietario)

### Workspace disponibili
Vedi tutti i workspace di cui fai parte:
- ✅ Workspace che hai creato
- ✅ Workspace in cui sei stato invitato
- ✅ Passa da uno all'altro con un click

---

## 🤝 Collaborazione

### Invitare membri
1. Clicca sull'icona **👥** nella top bar
2. Inserisci l'email della persona
3. Seleziona il ruolo (Editor o Visualizzatore)
4. Clicca "Invia invito"

### Ruoli
- **👑 Proprietario**: Controllo completo del workspace
- **✏️ Editor**: Può creare e modificare pagine
- **👁️ Visualizzatore**: Può solo vedere le pagine

### Presenza in tempo reale
- Vedi gli avatar degli utenti attivi nella top bar
- Indicatori di chi sta guardando la stessa pagina
- Aggiornamento ogni 30 secondi

📖 **Guida completa**: Vedi [COLLABORATION.md](./COLLABORATION.md)

## 🔒 Sicurezza

- **Firestore Rules**: Limitano l'accesso ai soli utenti autenticati
- **Authentication**: Email/password con Firebase Auth
- **Crittografia**: Tutti i dati sono criptati in transito (HTTPS) e a riposo
- **Validazione**: Le regole Firestore validano i dati in scrittura
- **Permessi**: Ruoli granulari per workspace e pagine

## 💰 Costi (Piano Gratuito - Spark Plan)

### Firebase Free Tier
- ✅ Firestore: 1 GB storage
- ✅ Firestore: 50K letture/giorno, 20K scritture/giorno
- ✅ Authentication: utenti illimitati
- ✅ Hosting: 10 GB storage, 360 MB/giorno transfer
- ✅ Storage: 5 GB per file

### Vercel Free Tier
- ✅ Hosting illimitato
- ✅ HTTPS automatico
- ✅ CDN globale
- ✅ 100 GB bandwidth/mese
- ✅ Serverless functions (100 GB-hours/mese)

**Totale: €0/mese per uso personale o piccoli team!**

## 🛠️ Stack Tecnologico

| Tecnologia | Uso |
|-----------|-----|
| React 18 | UI Framework |
| Vite | Build tool |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| TipTap | Editor rich text |
| Zustand | State management |
| Framer Motion | Animazioni |
| Lucide React | Icone |
| Firebase | Backend (Auth, Firestore, Realtime) |
| Vercel | Hosting |

## 📝 Sviluppo Locale

```bash
# Installa dipendenze
npm install

# Copia le variabili d'ambiente
cp .env.example .env
# Modifica .env con i tuoi valori Firebase

# Avvia il server di sviluppo
npm run dev

# Build per produzione
npm run build
```

## 🔥 Firestore Rules (Sicurezza)

Dopo il setup iniziale, aggiungi queste regole in **Firestore → Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    
    match /workspaces/{workspaceId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && 
        resource.data.created_by == request.auth.uid;
    }
    
    match /pages/{pageId} {
      allow read, write: if isAuthenticated();
    }
    
    match /blocks/{blockId} {
      allow read, write: if isAuthenticated();
    }
    
    match /workspace_members/{memberId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

---

**Creato con ❤️ usando React, Firebase e Vercel**
