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
│                   SUPABASE                       │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐ │
│  │   Auth   │ │PostgreSQL│ │   Realtime      │ │
│  │ (Email)  │ │ (Dati)   │ │ (Collaborazione)│ │
│  └──────────┘ └──────────┘ └─────────────────┘ │
│  ┌──────────┐ ┌──────────┐                      │
│  │   RLS    │ │ Storage  │                      │
│  │(Sicurezza│ │(File/Img)│                      │
│  └──────────┘ └──────────┘                      │
└─────────────────────────────────────────────────┘
```

## 🚀 Setup Completo

### 1. Creare il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e crea un account
2. Clicca **"New Project"**
3. Inserisci:
   - **Name**: `notion-clone` (o quello che preferisci)
   - **Database Password**: (salvala da qualche parte!)
   - **Region**: Europe West (Frankfurt) - o la più vicina a te
4. Attendi la creazione del progetto (~2 min)

### 2. Configurare il Database

1. Nel dashboard Supabase, vai su **SQL Editor** (icona laterale)
2. Clicca **"New Query"**
3. Copia e incolla il contenuto di `supabase-schema.sql`
4. Clicca **"Run"** (o premi Ctrl+Enter)
5. Verifica che tutte le tabelle siano state create in **Table Editor**

### 3. Configurare l'Autenticazione

1. Vai su **Authentication > Providers**
2. Assicurati che **Email** sia abilitato
3. In **Authentication > URL Configuration**:
   - Site URL: `https://tuo-progetto.vercel.app`
   - Redirect URLs: `https://tuo-progetto.vercel.app/**`
4. (Opzionale) Disabilita "Confirm email" per testare più velocemente

### 4. Abilitare Realtime

1. Vai su **Database > Replication**
2. Abilita Realtime per le tabelle `blocks` e `pages`

### 5. Configurare le variabili d'ambiente

1. Vai su **Settings > API** in Supabase
2. Copia:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
3. Crea un file `.env` nella root del progetto:

```bash
cp .env.example .env
```

4. Modifica `.env` con i tuoi valori:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### 6. Deploy su Vercel

1. Pusha il progetto su GitHub
2. Vai su [vercel.com](https://vercel.com)
3. Clicca **"New Project"** → Importa il repo
4. Framework Preset: **Vite**
5. Aggiungi le variabili d'ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Clicca **"Deploy"**

## 📋 Funzionalità

### ✅ Fase 1 (Questa versione)
- [x] Autenticazione email/password
- [x] Creazione workspace
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
- [x] Row Level Security (RLS)
- [x] Realtime subscriptions

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

## 🗄️ Schema Database

```
workspaces
├── id (UUID, PK)
├── name (TEXT)
├── icon (TEXT)
├── created_by (UUID, FK → auth.users)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

pages
├── id (UUID, PK)
├── workspace_id (UUID, FK → workspaces)
├── parent_id (UUID, FK → pages) -- per nidificazione
├── title (TEXT)
├── icon (TEXT)
├── cover (TEXT)
├── position (INTEGER)
├── created_by (UUID, FK → auth.users)
├── created_at (TIMESTAMPTZ)
├── updated_at (TIMESTAMPTZ)
├── is_trashed (BOOLEAN)
└── is_favorite (BOOLEAN)

blocks
├── id (UUID, PK)
├── page_id (UUID, FK → pages)
├── type (TEXT) -- paragraph, heading1, heading2, etc.
├── content (JSONB) -- contenuto strutturato
├── position (INTEGER)
├── parent_id (UUID, FK → blocks)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

workspace_members
├── id (UUID, PK)
├── workspace_id (UUID, FK → workspaces)
├── user_id (UUID, FK → auth.users)
├── role (TEXT) -- owner, editor, viewer
├── invited_at (TIMESTAMPTZ)
└── joined_at (TIMESTAMPTZ)
```

## 🔒 Sicurezza

- **Row Level Security (RLS)**: Ogni tabella ha policy che limitano l'accesso ai soli membri del workspace
- **Ruoli**: Owner (tutto), Editor (crea/modifica), Viewer (solo lettura)
- **Autenticazione**: Email/password con Supabase Auth
- **Crittografia**: Tutti i dati sono criptati in transito (HTTPS) e a riposo

## 💰 Costi (Piano Gratuito)

### Supabase Free Tier
- ✅ 500 MB database
- ✅ 1 GB storage
- ✅ 50,000 monthly active users
- ✅ 500 MB file storage
- ✅ 2 milioni di realtime messages/mese
- ✅ 500,000 edge function invocations/mese

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
| Supabase | Backend (Auth, DB, Realtime) |
| Vercel | Hosting |

## 📝 Sviluppo Locale

```bash
# Installa dipendenze
npm install

# Copia le variabili d'ambiente
cp .env.example .env
# Modifica .env con i tuoi valori Supabase

# Avvia il server di sviluppo
npm run dev

# Build per produzione
npm run build
```

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Apri una Pull Request

---

**Creato con ❤️ usando React, Supabase e Vercel**
