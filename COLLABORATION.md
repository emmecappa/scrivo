# 🤝 Guida alla Collaborazione

## Funzionalità di Collaborazione Implementate

### ✅ Cosa puoi fare ora

1. **Gestire i membri del workspace**
   - Invitare nuove persone via email
   - Assegnare ruoli (Editor, Visualizzatore)
   - Rimuovere membri
   - Vedere lo stato degli inviti (in attesa, attivi)

2. **Vedere chi è online**
   - Avatar degli utenti attivi nella top bar
   - Indicatori di chi sta guardando la stessa pagina
   - Conteggio utenti attivi nel workspace

3. **Lavorare in tempo reale**
   - Le modifiche vengono salvate automaticamente
   - Altri utenti vedono le modifiche in tempo reale
   - Presenza utenti aggiornata ogni 30 secondi

---

## 📋 Ruoli e Permessi

### 👑 Proprietario (Owner)
- ✅ Creare e eliminare pagine
- ✅ Modificare tutte le pagine
- ✅ Invitare nuovi membri
- ✅ Cambiare i ruoli dei membri
- ✅ Rimuovere membri dal workspace
- ⚠️ Solo il creatore del workspace è proprietario

### ✏️ Editor
- ✅ Creare pagine
- ✅ Modificare tutte le pagine
- ✅ Eliminare pagine
- ❌ Non può invitare membri
- ❌ Non può gestire ruoli

### 👁️ Visualizzatore
- ✅ Vedere tutte le pagine
- ❌ Non può creare pagine
- ❌ Non può modificare pagine
- ❌ Non può eliminare pagine

---

## 🚀 Come invitare membri

### Passo 1: Apri il pannello membri
- Clicca sull'icona **👥** nella top bar (in alto a destra)
- Oppure clicca sul numero di membri

### Passo 2: Invia un invito
1. Inserisci l'**email** della persona
2. Seleziona il **ruolo** (Editor o Visualizzatore)
3. Clicca **"Invia invito"**

### Passo 3: L'utente accetta
- L'utente riceve una notifica (quando implementeremo le email)
- L'utente si registra sulla piattaforma (se non ha già un account)
- L'utente accetta l'invito
- Il membro appare come "attivo" nella lista

---

## 👥 Vedere chi è online

### Nella top bar vedi:
- **Avatar colorati** degli utenti sulla stessa pagina
- **Numero totale** di utenti attivi nel workspace
- **Tooltip** con il nome dell'utente passando il mouse

### Esempio:
```
[🔵][🟢][🟣] 3 su questa pagina  •  👥 5 attivi
```

---

## 🔄 Collaborazione in tempo reale

### Come funziona:
1. **Salvataggio automatico**: Ogni modifica viene salvata dopo 1 secondo di inattività
2. **Presenza**: Il sistema aggiorna la presenza ogni 30 secondi
3. **Realtime**: Firebase Firestore notifica tutti i client in tempo reale

### Cosa vedono gli altri utenti:
- ✅ Le tue modifiche al contenuto (dopo il salvataggio)
- ✅ Il titolo della pagina che stai modificando
- ✅ Il tuo avatar nella top bar
- ❌ Non vedono il cursore in tempo reale (feature futura)

---

## 🛠️ Configurazione Firebase

### 1. Aggiorna le regole Firestore

Vai su **Firebase Console → Firestore Database → Rules** e incolla:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Workspaces
    match /workspaces/{workspaceId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && resource.data.created_by == request.auth.uid;
    }
    
    // Pages
    match /pages/{pageId} {
      allow read, write: if isAuthenticated();
    }
    
    // Blocks
    match /blocks/{blockId} {
      allow read, write: if isAuthenticated();
    }
    
    // Workspace Members
    match /workspace_members/{memberId} {
      allow read, write: if isAuthenticated();
    }
    
    // Active Users (presence)
    match /active_users/{presenceId} {
      allow read, write: if isAuthenticated();
    }
  }
}
```

Clicca **"Publish"**.

### 2. Crea gli indici necessari

Se non l'hai già fatto, crea questi indici in **Firestore → Indexes**:

#### Indice per `pages`:
- Collection: `pages`
- Fields:
  - `workspace_id` → Ascending
  - `is_trashed` → Ascending
  - `position` → Ascending

#### Indice per `blocks`:
- Collection: `blocks`
- Fields:
  - `page_id` → Ascending
  - `position` → Ascending

---

## 📊 Struttura dati

### Collection `workspace_members`
```
{
  id: "auto-generated",
  workspace_id: "workspace-id",
  user_id: "user-uid",
  email: "user@example.com",
  full_name: "Mario Rossi",
  role: "owner" | "editor" | "viewer",
  status: "active" | "invited",
  invited_at: timestamp,
  joined_at: timestamp | null
}
```

### Collection `active_users` (presence)
```
{
  id: "workspaceId_userId",
  workspace_id: "workspace-id",
  user_id: "user-uid",
  email: "user@example.com",
  full_name: "Mario Rossi",
  page_id: "current-page-id" | null,
  last_seen: timestamp,
  color: "#3B82F6"
}
```

---

## 🔮 Feature future

### In arrivo:
- [ ] **Notifiche email** per inviti
- [ ] **Cursori in tempo reale** (vedi dove stanno scrivendo gli altri)
- [ ] **Commenti** sulle pagine
- [ ] **Menzioni** (@nome)
- [ ] **Cronologia versioni** (chi ha modificato cosa)
- [ ] **Chat integrata** nel workspace
- [ ] **Permessi granulari** per pagina

---

## 🐛 Troubleshooting

### Non vedo gli altri utenti
- Verifica che le regole Firestore siano aggiornate
- Controlla la console per errori
- Verifica che gli altri utenti siano nello stesso workspace

### Non posso invitare membri
- Solo il proprietario può invitare
- Verifica di essere il creatore del workspace
- Controlla che l'email non sia già stata invitata

### L'invito non viene accettato
- L'utente deve registrarsi con la stessa email dell'invito
- L'utente deve accettare l'invito (feature in sviluppo)

### I membri non si aggiornano in tempo reale
- Verifica la connessione internet
- Controlla la console per errori di Firestore
- Ricarica la pagina

---

## 💡 Suggerimenti

### Per team piccoli (2-5 persone):
- Usa il ruolo **Editor** per tutti
- Il proprietario gestisce gli inviti
- Comunicazione via chat esterna per coordinarsi

### Per team medi (5-20 persone):
- Assegna ruoli **Editor** solo a chi deve modificare
- Usa **Visualizzatore** per chi deve solo leggere
- Il proprietario coordina gli inviti

### Per team grandi (20+ persone):
- Considera di creare più workspace
- Usa ruoli **Visualizzatore** per la maggior parte degli utenti
- Implementa un processo di approvazione per gli inviti

---

## 📞 Supporto

Se hai problemi con la collaborazione:

1. **Controlla la console** (F12) per errori
2. **Verifica le regole Firestore** (devono essere quelle sopra)
3. **Controlla gli indici** (devono essere creati)
4. **Ricarica la pagina** (F5)
5. **Contatta il supporto** con i log della console

---

**Buona collaborazione! 🚀**
