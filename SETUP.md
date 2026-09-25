# ⚡ QUICK START - Setup in 5 minuti

## Cosa ti serve:
1. Un account **Supabase** (gratis) → [supabase.com](https://supabase.com)
2. Un account **Vercel** (gratis) → [vercel.com](https://vercel.com)
3. Un account **GitHub** → [github.com](https://github.com)

---

## Passo 1: Supabase (5 min)

### 1a. Crea il progetto
- Vai su supabase.com → "New Project"
- Nome: `notion-clone`
- Password DB: (qualsiasi, salvala!)
- Region: la più vicina a te

### 1b. Esegui lo schema SQL
- Nel menu laterale → **SQL Editor** → **New Query**
- Copia TUTTO il contenuto del file `supabase-schema.sql`
- Incolla e premi **Run**
- Verifica in **Table Editor** che ci siano 4 tabelle: `workspaces`, `pages`, `blocks`, `workspace_members`

### 1c. Configura Auth
- Menu → **Authentication** → **Providers**
- Assicurati che **Email** sia attivo
- (Opzionale) In **Auth → Settings** → disabilita "Confirm email" per testare subito

### 1d. Copia le chiavi
- Menu → **Settings** → **API**
- Copia:
  - `Project URL` (es: `https://abcdefgh.supabase.co`)
  - `anon public` key (una stringa lunga che inizia con `eyJ...`)

---

## Passo 2: Variabili d'ambiente

### In locale (per testare):
Crea un file `.env` nella root del progetto:
```
VITE_SUPABASE_URL=https://TUO-PROGETTO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...LA-TUA-CHIAVE...
```

### Su Vercel (per il deploy):
- Vai su vercel.com → tuo progetto → **Settings** → **Environment Variables**
- Aggiungi le stesse due variabili:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

---

## Passo 3: Deploy su Vercel

1. Pusha il codice su un repo GitHub
2. Vai su vercel.com → **Add New** → **Project**
3. Importa il repo
4. Framework: **Vite** (auto-detectato)
5. Aggiungi le env variables (come sopra)
6. **Deploy!** 🚀

---

## Passo 4: Test

1. Apri il sito deployato (es: `https://notion-clone.vercel.app`)
2. Registrati con la tua email
3. Crea un workspace
4. Inizia a scrivere!

---

## 🔧 Risoluzione problemi

### "Invalid API key"
→ Controlla che le variabili d'ambiente siano corrette e inizino con `VITE_`

### "relation does not exist"
→ Non hai eseguito lo SQL su Supabase. Torna al Passo 1b.

### "new row violates row-level security policy"
→ Le RLS policies non sono state create. Riesegui lo SQL.

### L'email di conferma non arriva
→ Supabase free tier usa Inbucket per le email di test.
→ Oppure disabilita "Confirm email" in Auth → Settings.

---

## 📊 Limiti del piano gratuito

| Risorsa | Limite |
|---------|--------|
| Database | 500 MB |
| Storage | 1 GB |
| Utenti attivi | 50.000/mese |
| Realtime messages | 2M/mese |
| Bandwidth Vercel | 100 GB/mese |

**Per un team di 5-10 persone che usa l'app normalmente, il piano gratuito è più che sufficiente!**
