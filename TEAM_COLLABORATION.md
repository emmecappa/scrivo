# 🤝 Guida Completa alla Collaborazione in Team

## 🎯 Come Funziona il Sistema di Team

Il sistema di collaborazione ora supporta **workspace condivisi** dove più persone possono lavorare insieme in tempo reale.

---

## 📋 Flusso di Lavoro Completo

### 1. Creare un Workspace
```
Tu (Proprietario)
  ↓
Crei workspace "Progetto Alpha"
  ↓
Inviti colleghi via email
  ↓
Loro accettano l'invito
  ↓
Tutti lavorano insieme!
```

### 2. Invitare Membri
1. Apri il pannello membri (icona 👥 in alto a destra)
2. Inserisci l'email del collega
3. Seleziona il ruolo (Editor o Visualizzatore)
4. Clicca "Invia invito"
5. Il collega riceve l'invito nella sua app

### 3. Accettare un Invito
Quando un utente viene invitato:
1. Vede un banner blu "Inviti in attesa" in alto
2. Vede il nome del workspace e il ruolo assegnato
3. Può accettare o rifiutare l'invito
4. Dopo l'accettazione, il workspace appare nella lista

---

## 👥 Ruoli e Permessi

### 👑 Proprietario (Owner)
- ✅ Creatore del workspace
- ✅ Può invitare nuovi membri
- ✅ Può rimuovere membri
- ✅ Può cambiare i ruoli
- ✅ Può eliminare il workspace
- ✅ Accesso completo a tutte le pagine

### ✏️ Editor
- ✅ Può creare pagine
- ✅ Può modificare tutte le pagine
- ✅ Può eliminare pagine
- ❌ Non può invitare membri
- ❌ Non può gestire ruoli

### 👁️ Visualizzatore
- ✅ Può vedere tutte le pagine
- ❌ Non può creare pagine
- ❌ Non può modificare pagine
- ❌ Non può eliminare pagine

---

## 🔧 Configurazione Importanti

### 1. Regole di Sicurezza Firestore

**CRITICO**: Devi aggiornare le regole di sicurezza in Firebase Console!

Vai su **Firebase Console → Firestore Database → Rules** e incolla il contenuto di `firestore.rules`.

Le regole permettono:
- ✅ Agli utenti di leggere i workspace di cui sono membri
- ✅ Agli utenti invitati di vedere gli inviti
- ✅ Ai proprietari di gestire i membri
- ✅ Agli utenti di accettare/rifiutare inviti

### 2. Indici Firestore

Se non l'hai già fatto, crea questi indici:

#### Per `workspace_members`:
- Collection: `workspace_members`
- Fields:
  - `email` → Ascending
  - `status` → Ascending

Questo permette di cercare gli inviti per email.

---

## 🎨 Interfaccia Utente

### Per il Proprietario

**Pannello Membri:**
```
┌─────────────────────────────────┐
│ 👥 Membri del Workspace         │
├─────────────────────────────────┤
│ 📧 Invita un membro             │
│ Email: [collega@esempio.com]    │
│ Ruolo: [Editor ▼]               │
│ [Invia invito]                  │
├─────────────────────────────────┤
│ Membri (3)                      │
│                                 │
│ 👤 Mario Rossi                  │
│ mario@esempio.com               │
│ 👑 Proprietario                 │
│                                 │
│ 👤 Laura Bianchi                │
│ laura@esempio.com               │
│ ✏️ Editor [Modifica] [Rimuovi]  │
│                                 │
│ 👤 Giuseppe Verdi               │
│ giuseppe@esempio.com            │
│ ⏳ In attesa                    │
└─────────────────────────────────┘
```

### Per l'Utente Invitato

**Banner Inviti:**
```
┌─────────────────────────────────────────┐
│ 📧 Inviti in attesa (1)                 │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 📝 Progetto Alpha                   │ │
│ │ Invitato come Editor                │ │
│ │                    [❌] [✓ Accetto]  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Dopo l'accettazione:**
- Il workspace appare nel selettore workspace
- L'utente può selezionarlo e iniziare a lavorare

---

## 🔄 Flusso Tecnico

### Invito Membro
```typescript
// 1. Proprietario invita
await addDoc(workspace_members, {
  workspace_id: "abc123",
  email: "collega@esempio.com",
  user_id: "",  // Vuoto finché non accetta
  role: "editor",
  status: "invited",
  invited_by: "owner-uid",
  invited_at: timestamp
});
```

### Visualizzazione Inviti
```typescript
// 2. Utente invitato carica i workspace
const pendingInvitesQuery = query(
  collection(db, 'workspace_members'),
  where('email', '==', user.email),
  where('status', '==', 'invited')
);
```

### Accettazione Invito
```typescript
// 3. Utente accetta l'invito
await updateDoc(memberRef, {
  user_id: user.uid,
  full_name: user.displayName,
  status: 'active',
  joined_at: timestamp
});

// 4. Ricarica i workspace per includere il nuovo
await loadWorkspaces();
```

---

## 🐛 Troubleshooting

### Problema: "Non vedo gli inviti"

**Cause possibili:**
1. ❌ Regole di sicurezza Firestore non aggiornate
2. ❌ Indici Firestore mancanti
3. ❌ Email dell'invito non corrisponde all'email dell'account

**Soluzioni:**
1. ✅ Aggiorna le regole in Firebase Console → Firestore → Rules
2. ✅ Crea l'indice per `workspace_members` (email + status)
3. ✅ Verifica che l'email dell'invito sia esattamente quella usata per registrarsi

### Problema: "Non posso leggere il workspace dopo l'accettazione"

**Cause possibili:**
1. ❌ Regole di sicurezza troppo restrittive
2. ❌ Il workspace non è stato ricaricato dopo l'accettazione

**Soluzioni:**
1. ✅ Usa le regole fornite in `firestore.rules`
2. ✅ Il codice ora ricarica automaticamente i workspace dopo l'accettazione

### Problema: "Vedo solo il mio workspace, non quelli condivisi"

**Cause possibili:**
1. ❌ Non hai ancora accettato gli inviti
2. ❌ Gli inviti sono stati inviati a un'email diversa

**Soluzioni:**
1. ✅ Controlla il banner "Inviti in attesa" in alto
2. ✅ Verifica che l'email dell'account corrisponda a quella dell'invito

---

## 📊 Struttura Dati

### Collection `workspace_members`
```typescript
{
  id: "auto-generated",
  workspace_id: "workspace-id",
  user_id: "user-uid" | "",  // Vuoto se invitato, compilato se attivo
  email: "user@example.com",
  full_name: "Mario Rossi" | "",
  role: "owner" | "editor" | "viewer",
  status: "active" | "invited",
  invited_by: "owner-uid",
  invited_at: timestamp,
  joined_at: timestamp | null
}
```

### Stati di un Membro
- **`status: "invited"`**: L'utente è stato invitato ma non ha ancora accettato
  - `user_id` è vuoto
  - `email` contiene l'email dell'invito
  - `joined_at` è null
  
- **`status: "active"`**: L'utente ha accettato l'invito
  - `user_id` contiene l'UID dell'utente
  - `full_name` contiene il nome dell'utente
  - `joined_at` contiene la data di accettazione

---

## 🚀 Test Completo

### Scenario 1: Creare e Condividere un Workspace

1. **Utente A** (Proprietario):
   - Crea workspace "Team Project"
   - Invita utente B come Editor
   - Invita utente C come Visualizzatore

2. **Utente B** (Editor):
   - Riceve invito
   - Accetta l'invito
   - Vede "Team Project" nella lista workspace
   - Può creare e modificare pagine

3. **Utente C** (Visualizzatore):
   - Riceve invito
   - Accetta l'invito
   - Vede "Team Project" nella lista workspace
   - Può solo leggere le pagine

### Scenario 2: Gestire Membri

1. **Proprietario**:
   - Cambia ruolo di B da Editor a Visualizzatore
   - Rimuove C dal workspace
   - Invita nuovo membro D

2. **Membri**:
   - B ora può solo leggere
   - C non vede più il workspace
   - D riceve invito e accetta

---

## 💡 Best Practices

### Per i Proprietari
- ✅ Usa ruoli appropriati (Editor per chi lavora, Visualizzatore per chi legge)
- ✅ Rimuovi membri che non lavorano più al progetto
- ✅ Comunica gli inviti via chat/email per assicurarti che vengano accettati

### Per i Membri
- ✅ Controlla regolarmente gli inviti in attesa
- ✅ Accetta gli inviti il prima possibile
- ✅ Se non vedi un workspace, verifica l'email dell'account

### Per il Team
- ✅ Definite chi è proprietario di ogni workspace
- ✅ Usate ruoli consistenti (tutti Editor o tutti Visualizzatori)
- ✅ Comunicate quando qualcuno viene aggiunto/rimosso

---

## 🔮 Feature Future

### In arrivo:
- [ ] **Notifiche email** per inviti (Firebase Cloud Functions)
- [ ] **Link di invito** condivisibili (invece di email specifica)
- [ ] **Domini approvati** (invita solo email @azienda.com)
- [ ] **Scadenza inviti** (inviti che scadono dopo X giorni)
- [ ] **Messaggio personalizzato** con l'invito
- [ ] **Bulk invite** (invita più persone contemporaneamente)

---

## 📞 Supporto

Se hai problemi con la collaborazione:

1. **Controlla le regole Firestore** (devono essere quelle fornite)
2. **Controlla gli indici** (email + status per workspace_members)
3. **Verifica le email** (devono corrispondere esattamente)
4. **Controlla la console** (F12) per errori dettagliati
5. **Ricarica la pagina** dopo aver accettato un invito

---

**Buon lavoro in team! 🚀**
