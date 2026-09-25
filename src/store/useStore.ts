import { create } from 'zustand';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  created_by: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'active' | 'invited';
  invited_at: string;
  joined_at: string | null;
}

export interface Page {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  title: string;
  icon: string;
  cover: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_trashed: boolean;
  is_favorite: boolean;
}

export interface Block {
  id: string;
  page_id: string;
  type: string;
  content: any;
  position: number;
  parent_id: string | null;
}

export interface ActiveUser {
  userId: string;
  email: string;
  fullName: string;
  pageId: string | null;
  lastSeen: number;
  color: string;
}

interface AppState {
  // Config
  isConfigured: boolean;
  
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  
  // Workspace
  workspaces: Workspace[];
  workspace: Workspace | null;
  workspaceLoading: boolean;
  
  // Members
  members: WorkspaceMember[];
  activeUsers: ActiveUser[];
  
  // Pages
  pages: Page[];
  currentPageId: string | null;
  expandedPages: Set<string>;
  
  // Blocks
  blocks: Block[];
  
  // UI
  sidebarOpen: boolean;
  isCreatingPage: boolean;
  showMembersPanel: boolean;
  
  // Realtime subscriptions
  membersUnsubscribe: Unsubscribe | null;
  activeUsersUnsubscribe: Unsubscribe | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  
  loadWorkspaces: () => Promise<void>;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  
  // Members
  loadMembers: () => Promise<void>;
  inviteMember: (email: string, role: 'editor' | 'viewer') => Promise<void>;
  updateMemberRole: (memberId: string, role: 'owner' | 'editor' | 'viewer') => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  acceptInvitation: (memberId: string) => Promise<void>;
  
  // Active users (presence)
  subscribeToActiveUsers: () => void;
  updatePresence: (pageId: string | null) => void;
  
  // Pages
  loadPages: () => Promise<void>;
  createPage: (parentId?: string | null) => Promise<string>;
  updatePage: (id: string, updates: Partial<Page>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  setCurrentPage: (id: string | null) => void;
  togglePageExpanded: (id: string) => void;
  
  // Blocks
  loadBlocks: (pageId: string) => Promise<void>;
  saveBlocks: (pageId: string, blocks: Block[]) => Promise<void>;
  
  toggleSidebar: () => void;
  toggleMembersPanel: () => void;
}

// Helper per convertire Timestamp Firestore in stringa ISO
const timestampToString = (ts: any): string => {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
};

// Colori per gli utenti attivi
const USER_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export const useStore = create<AppState>((set, get) => ({
  isConfigured: isFirebaseConfigured,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  authError: null,
  workspaces: [],
  workspace: null,
  workspaceLoading: false,
  members: [],
  activeUsers: [],
  pages: [],
  currentPageId: null,
  expandedPages: new Set(),
  blocks: [],
  sidebarOpen: true,
  isCreatingPage: false,
  showMembersPanel: false,
  membersUnsubscribe: null,
  activeUsersUnsubscribe: null,

  login: async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase non configurato. Aggiungi le variabili VITE_FIREBASE_*');
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      set({
        user: {
          id: fbUser.uid,
          email: fbUser.email || '',
          full_name: fbUser.displayName || '',
          avatar_url: fbUser.photoURL || '',
        },
        isAuthenticated: true,
        authError: null,
        workspaceLoading: true,
      });
      
      await get().loadWorkspaces();
    } catch (err: any) {
      console.error('Login error:', err);
      throw new Error(err.message || 'Errore di login');
    }
  },

  signup: async (email, password, fullName) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase non configurato. Aggiungi le variabili VITE_FIREBASE_*');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      if (fbUser) {
        await updateProfile(fbUser, { displayName: fullName });
      }
      
      try {
        const { sendEmailVerification } = await import('firebase/auth');
        if (auth && fbUser) {
          await sendEmailVerification(fbUser);
        }
      } catch (emailErr) {
        console.warn('Impossibile inviare email di verifica:', emailErr);
      }
      
      set({
        user: {
          id: fbUser.uid,
          email: fbUser.email || '',
          full_name: fullName,
          avatar_url: '',
        },
        isAuthenticated: true,
        authError: null,
        workspaceLoading: true,
      });
      
      await get().loadWorkspaces();
    } catch (err: any) {
      console.error('Signup error:', err);
      throw new Error(err.message || 'Errore di registrazione');
    }
  },

  logout: async () => {
    // Rimuovi presenza utente prima del logout
    const { user, workspace } = get();
    if (user && workspace && isFirebaseConfigured && db) {
      try {
        const presenceRef = doc(db, 'active_users', `${workspace.id}_${user.id}`);
        await deleteDoc(presenceRef);
      } catch (err) {
        console.error('Error removing presence:', err);
      }
    }
    
    // Cleanup subscriptions
    const { membersUnsubscribe, activeUsersUnsubscribe } = get();
    if (membersUnsubscribe) membersUnsubscribe();
    if (activeUsersUnsubscribe) activeUsersUnsubscribe();
    
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    set({ 
      user: null, 
      isAuthenticated: false, 
      workspace: null, 
      pages: [], 
      currentPageId: null, 
      blocks: [],
      members: [],
      activeUsers: [],
      membersUnsubscribe: null,
      activeUsersUnsubscribe: null,
    });
  },

  checkAuth: async () => {
    if (!isFirebaseConfigured || !auth) {
      console.log('⚠️ Firebase non configurato');
      set({ isLoading: false, authError: 'Firebase non configurato' });
      return;
    }
    
    console.log('🔍 Controllo autenticazione...');
    
    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth!, async (fbUser: FirebaseUser | null) => {
        console.log('🔔 onAuthStateChanged triggered:', fbUser ? `User: ${fbUser.email}` : 'No user');
        
        if (fbUser) {
          console.log('✅ Utente autenticato:', fbUser.email, 'UID:', fbUser.uid);
          
          set({
            user: {
              id: fbUser.uid,
              email: fbUser.email || '',
              full_name: fbUser.displayName || '',
              avatar_url: fbUser.photoURL || '',
            },
            isAuthenticated: true,
            isLoading: false,
            authError: null,
            workspaceLoading: true,
          });
          
          await new Promise(r => setTimeout(r, 100));
          
          console.log('📂 Caricamento workspace...');
          await get().loadWorkspaces();
        } else {
          console.log('❌ Nessun utente autenticato');
          set({ isLoading: false });
        }
        
        resolve();
        unsubscribe();
      });
    });
  },

  loadWorkspaces: async () => {
    const { user } = get();
    if (!user || !isFirebaseConfigured || !db) {
      console.log('⚠️ Load workspaces: skipped');
      return;
    }
    
    set({ workspaceLoading: true });
    
    try {
      console.log('📂 Loading all workspaces for user:', user.id);
      
      // Carica workspace creati dall'utente
      const createdQuery = query(
        collection(db, 'workspaces'),
        where('created_by', '==', user.id)
      );
      
      // Carica workspace di cui l'utente è membro
      const memberQuery = query(
        collection(db, 'workspace_members'),
        where('user_id', '==', user.id),
        where('status', '==', 'active')
      );
      
      const [createdSnapshot, memberSnapshot] = await Promise.all([
        getDocs(createdQuery),
        getDocs(memberQuery)
      ]);
      
      console.log('📊 Workspaces found:', { 
        created: createdSnapshot.size,
        member: memberSnapshot.size
      });
      
      // Combina tutti i workspace
      const workspacesMap = new Map<string, Workspace>();
      
      // Aggiungi workspace creati
      createdSnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        workspacesMap.set(docSnap.id, {
          id: docSnap.id,
          name: data.name || '',
          icon: data.icon || '📝',
          created_by: data.created_by || user.id,
          created_at: timestampToString(data.created_at),
        });
      });
      
      // Aggiungi workspace di cui è membro
      for (const memberDoc of memberSnapshot.docs) {
        const memberData = memberDoc.data();
        const workspaceId = memberData.workspace_id;
        
        if (!workspacesMap.has(workspaceId)) {
          const workspaceDoc = await getDoc(doc(db, 'workspaces', workspaceId));
          if (workspaceDoc.exists()) {
            const data = workspaceDoc.data();
            workspacesMap.set(workspaceId, {
              id: workspaceId,
              name: data.name || '',
              icon: data.icon || '📝',
              created_by: data.created_by || '',
              created_at: timestampToString(data.created_at),
            });
          }
        }
      }
      
      const workspaces = Array.from(workspacesMap.values());
      console.log('✅ Total workspaces loaded:', workspaces.length);
      
      set({ workspaces, workspaceLoading: false });
      
      // Seleziona automaticamente il workspace salvato o il primo
      const savedWorkspaceId = localStorage.getItem(`lastWorkspace_${user.id}`);
      const workspaceToSelect = savedWorkspaceId && workspacesMap.has(savedWorkspaceId)
        ? savedWorkspaceId
        : workspaces.length > 0 ? workspaces[0].id : null;
      
      if (workspaceToSelect) {
        await get().selectWorkspace(workspaceToSelect);
      }
      
    } catch (err: any) {
      console.error('❌ Load workspaces error:', err);
      set({ workspaceLoading: false });
      
      if (err.code === 'permission-denied') {
        console.error('🚫 ERRORE PERMESSI: Aggiorna le regole di sicurezza Firestore!');
      }
    }
  },
  
  selectWorkspace: async (workspaceId) => {
    const { user } = get();
    if (!user || !isFirebaseConfigured || !db) return;
    
    try {
      console.log('🔄 Selecting workspace:', workspaceId);
      
      const workspaceDoc = await getDoc(doc(db, 'workspaces', workspaceId));
      
      if (!workspaceDoc.exists()) {
        console.error('❌ Workspace not found');
        return;
      }
      
      const data = workspaceDoc.data();
      const workspace: Workspace = {
        id: workspaceDoc.id,
        name: data.name || '',
        icon: data.icon || '📝',
        created_by: data.created_by || '',
        created_at: timestampToString(data.created_at),
      };
      
      // Salva la selezione
      localStorage.setItem(`lastWorkspace_${user.id}`, workspaceId);
      
      set({ workspace, workspaceLoading: false });
      
      console.log('✅ Workspace selected:', workspace.name);
      
      // Carica pagine, membri e presenza
      await get().loadPages();
      await get().loadMembers();
      get().subscribeToActiveUsers();
      
    } catch (err: any) {
      console.error('❌ Select workspace error:', err);
    }
  },
  
  updateWorkspace: async (id, updates) => {
    if (!isFirebaseConfigured || !db) return;
    
    try {
      const workspaceRef = doc(db, 'workspaces', id);
      await updateDoc(workspaceRef, {
        ...updates,
        updated_at: serverTimestamp(),
      });
      
      // Aggiorna lo stato locale
      set({
        workspaces: get().workspaces.map(w => 
          w.id === id ? { ...w, ...updates } : w
        ),
        workspace: get().workspace?.id === id 
          ? { ...get().workspace!, ...updates }
          : get().workspace
      });
      
      console.log('✅ Workspace updated');
    } catch (err: any) {
      console.error('❌ Update workspace error:', err);
      throw err;
    }
  },
  
  deleteWorkspace: async (id) => {
    const { user, workspaces } = get();
    if (!user || !isFirebaseConfigured || !db) return;
    
    try {
      // Verifica che l'utente sia il proprietario
      const workspace = workspaces.find(w => w.id === id);
      if (!workspace || workspace.created_by !== user.id) {
        throw new Error('Solo il proprietario può eliminare il workspace');
      }
      
      // Elimina il workspace
      await deleteDoc(doc(db, 'workspaces', id));
      
      // Elimina tutti i membri
      const membersQuery = query(
        collection(db, 'workspace_members'),
        where('workspace_id', '==', id)
      );
      const membersSnapshot = await getDocs(membersQuery);
      const batch = writeBatch(db);
      membersSnapshot.docs.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      
      // Elimina tutte le pagine e i blocchi
      const pagesQuery = query(
        collection(db, 'pages'),
        where('workspace_id', '==', id)
      );
      const pagesSnapshot = await getDocs(pagesQuery);
      const pagesBatch = writeBatch(db);
      
      for (const pageDoc of pagesSnapshot.docs) {
        // Elimina blocchi della pagina
        const blocksQuery = query(
          collection(db, 'blocks'),
          where('page_id', '==', pageDoc.id)
        );
        const blocksSnapshot = await getDocs(blocksQuery);
        blocksSnapshot.docs.forEach(blockDoc => {
          pagesBatch.delete(blockDoc.ref);
        });
        
        // Elimina la pagina
        pagesBatch.delete(pageDoc.ref);
      }
      
      await pagesBatch.commit();
      
      // Rimuovi dalla lista
      const newWorkspaces = workspaces.filter(w => w.id !== id);
      set({ workspaces: newWorkspaces });
      
      // Se era il workspace corrente, seleziona il primo disponibile
      if (get().workspace?.id === id) {
        if (newWorkspaces.length > 0) {
          await get().selectWorkspace(newWorkspaces[0].id);
        } else {
          set({ workspace: null, pages: [], members: [], activeUsers: [] });
        }
      }
      
      console.log('✅ Workspace deleted');
    } catch (err: any) {
      console.error('❌ Delete workspace error:', err);
      throw err;
    }
  },

  createWorkspace: async (name) => {
    const { user } = get();
    if (!user || !isFirebaseConfigured || !db) {
      console.error('❌ Create workspace: missing prerequisites');
      throw new Error('Configurazione incompleta');
    }
    
    try {
      console.log('🏗️ Creating workspace:', name, 'for user:', user.id);
      
      const workspaceRef = await addDoc(collection(db, 'workspaces'), {
        name,
        icon: '📝',
        created_by: user.id,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      
      console.log('✅ Workspace created with ID:', workspaceRef.id);
      
      // Add creator as owner member
      await addDoc(collection(db, 'workspace_members'), {
        workspace_id: workspaceRef.id,
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: 'owner',
        status: 'active',
        invited_at: serverTimestamp(),
        joined_at: serverTimestamp(),
      });
      
      set({
        workspace: {
          id: workspaceRef.id,
          name,
          icon: '📝',
          created_by: user.id,
          created_at: new Date().toISOString(),
        }
      });
      
      await get().createPage();
      await get().loadMembers();
      get().subscribeToActiveUsers();
      
    } catch (err: any) {
      console.error('❌ Create workspace error:', err);
      throw err;
    }
  },

  loadMembers: async () => {
    const { workspace } = get();
    if (!workspace || !isFirebaseConfigured || !db) return;
    
    try {
      console.log('👥 Loading members for workspace:', workspace.id);
      
      // Cleanup previous subscription
      const { membersUnsubscribe } = get();
      if (membersUnsubscribe) membersUnsubscribe();
      
      // Subscribe to realtime updates
      const q = query(
        collection(db, 'workspace_members'),
        where('workspace_id', '==', workspace.id)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const members: WorkspaceMember[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            workspace_id: data.workspace_id || '',
            user_id: data.user_id || '',
            email: data.email || '',
            full_name: data.full_name || '',
            role: data.role || 'viewer',
            status: data.status || 'invited',
            invited_at: timestampToString(data.invited_at),
            joined_at: data.joined_at ? timestampToString(data.joined_at) : null,
          };
        });
        
        console.log('✅ Members loaded:', members.length, members);
        set({ members });
      });
      
      set({ membersUnsubscribe: unsubscribe });
    } catch (err) {
      console.error('❌ Load members error:', err);
    }
  },

  inviteMember: async (email, role) => {
    const { workspace, user, members } = get();
    if (!workspace || !user || !isFirebaseConfigured || !db) return;
    
    // Check if user is owner
    const currentUserMember = members.find(m => m.user_id === user.id);
    if (!currentUserMember || currentUserMember.role !== 'owner') {
      throw new Error('Solo il proprietario può invitare membri');
    }
    
    // Check if already invited
    const existingMember = members.find(m => m.email === email);
    if (existingMember) {
      throw new Error('Questo utente è già stato invitato o è già membro');
    }
    
    try {
      console.log('📧 Inviting member:', email, 'with role:', role);
      
      await addDoc(collection(db, 'workspace_members'), {
        workspace_id: workspace.id,
        user_id: '', // Will be filled when user accepts
        email,
        full_name: '',
        role,
        status: 'invited',
        invited_at: serverTimestamp(),
        joined_at: null,
      });
      
      console.log('✅ Invitation sent');
      
      // TODO: Send invitation email via Firebase Cloud Functions
    } catch (err: any) {
      console.error('❌ Invite member error:', err);
      throw err;
    }
  },

  updateMemberRole: async (memberId, role) => {
    const { user, members } = get();
    if (!isFirebaseConfigured || !db) return;
    
    // Check if user is owner
    const currentUserMember = members.find(m => m.user_id === user?.id);
    if (!currentUserMember || currentUserMember.role !== 'owner') {
      throw new Error('Solo il proprietario può modificare i ruoli');
    }
    
    try {
      const memberRef = doc(db, 'workspace_members', memberId);
      await updateDoc(memberRef, { role });
      console.log('✅ Member role updated');
    } catch (err: any) {
      console.error('❌ Update member role error:', err);
      throw err;
    }
  },

  removeMember: async (memberId) => {
    const { user, members } = get();
    if (!isFirebaseConfigured || !db) return;
    
    // Check if user is owner
    const currentUserMember = members.find(m => m.user_id === user?.id);
    if (!currentUserMember || currentUserMember.role !== 'owner') {
      throw new Error('Solo il proprietario può rimuovere membri');
    }
    
    try {
      const memberRef = doc(db, 'workspace_members', memberId);
      await deleteDoc(memberRef);
      console.log('✅ Member removed');
    } catch (err: any) {
      console.error('❌ Remove member error:', err);
      throw err;
    }
  },

  acceptInvitation: async (memberId) => {
    const { user } = get();
    if (!user || !isFirebaseConfigured || !db) return;
    
    try {
      const memberRef = doc(db, 'workspace_members', memberId);
      await updateDoc(memberRef, {
        user_id: user.id,
        full_name: user.full_name,
        status: 'active',
        joined_at: serverTimestamp(),
      });
      console.log('✅ Invitation accepted');
    } catch (err: any) {
      console.error('❌ Accept invitation error:', err);
      throw err;
    }
  },

  subscribeToActiveUsers: () => {
    const { workspace } = get();
    if (!workspace || !isFirebaseConfigured || !db) return;
    
    // Cleanup previous subscription
    const { activeUsersUnsubscribe } = get();
    if (activeUsersUnsubscribe) activeUsersUnsubscribe();
    
    // Subscribe to active users in this workspace
    const q = query(
      collection(db, 'active_users'),
      where('workspace_id', '==', workspace.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeUsers: ActiveUser[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          userId: data.user_id || '',
          email: data.email || '',
          fullName: data.full_name || '',
          pageId: data.page_id || null,
          lastSeen: data.last_seen || Date.now(),
          color: data.color || USER_COLORS[0],
        };
      });
      
      // Filter out users who haven't been seen in the last 30 seconds
      const now = Date.now();
      const filteredUsers = activeUsers.filter(u => now - u.lastSeen < 30000);
      
      set({ activeUsers: filteredUsers });
    });
    
    set({ activeUsersUnsubscribe: unsubscribe });
  },

  updatePresence: async (pageId) => {
    const { user, workspace } = get();
    if (!user || !workspace || !isFirebaseConfigured || !db) return;
    
    try {
      const presenceId = `${workspace.id}_${user.id}`;
      const presenceRef = doc(db, 'active_users', presenceId);
      
      // Get or create user color
      const { activeUsers } = get();
      const existingUser = activeUsers.find(u => u.userId === user.id);
      const color = existingUser?.color || USER_COLORS[activeUsers.length % USER_COLORS.length];
      
      await updateDoc(presenceRef, {
        workspace_id: workspace.id,
        user_id: user.id,
        email: user.email,
        full_name: user.full_name,
        page_id: pageId,
        last_seen: Date.now(),
        color,
      }).catch(async () => {
        // If document doesn't exist, create it
        const { setDoc } = await import('firebase/firestore');
        await setDoc(presenceRef, {
          workspace_id: workspace.id,
          user_id: user.id,
          email: user.email,
          full_name: user.full_name,
          page_id: pageId,
          last_seen: Date.now(),
          color,
        });
      });
    } catch (err) {
      console.error('Error updating presence:', err);
    }
  },

  loadPages: async () => {
    const { workspace } = get();
    if (!workspace || !isFirebaseConfigured || !db) {
      console.log('⚠️ Load pages: skipped -', { hasWorkspace: !!workspace });
      return;
    }
    
    try {
      console.log('📄 Loading pages for workspace:', workspace.id);
      
      const q = query(
        collection(db, 'pages'),
        where('workspace_id', '==', workspace.id),
        where('is_trashed', '==', false),
        orderBy('position', 'asc')
      );
      
      const snapshot = await getDocs(q);
      console.log('📊 Pages query result:', { empty: snapshot.empty, size: snapshot.size });
      
      const pages: Page[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          workspace_id: data.workspace_id || '',
          parent_id: data.parent_id || null,
          title: data.title || '',
          icon: data.icon || '📄',
          cover: data.cover || null,
          position: data.position || 0,
          created_by: data.created_by || '',
          created_at: timestampToString(data.created_at),
          updated_at: timestampToString(data.updated_at),
          is_trashed: data.is_trashed || false,
          is_favorite: data.is_favorite || false,
        };
      });
      
      console.log('✅ Pages loaded:', pages.length);
      set({ pages });
    } catch (err) {
      console.error('❌ Load pages error:', err);
    }
  },

  createPage: async (parentId = null) => {
    const { user, workspace, pages } = get();
    if (!user || !workspace || !isFirebaseConfigured || !db) return '';
    
    try {
      const position = pages.length;
      const now = new Date().toISOString();
      
      const pageRef = await addDoc(collection(db, 'pages'), {
        workspace_id: workspace.id,
        parent_id: parentId,
        title: '',
        icon: '📄',
        cover: null,
        position,
        created_by: user.id,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        is_trashed: false,
        is_favorite: false,
      });
      
      await addDoc(collection(db, 'blocks'), {
        page_id: pageRef.id,
        type: 'paragraph',
        content: { text: '' },
        position: 0,
        parent_id: null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      
      const newPage: Page = {
        id: pageRef.id,
        workspace_id: workspace.id,
        parent_id: parentId,
        title: '',
        icon: '📄',
        cover: null,
        position,
        created_by: user.id,
        created_at: now,
        updated_at: now,
        is_trashed: false,
        is_favorite: false,
      };
      
      set({ 
        pages: [...pages, newPage],
        currentPageId: pageRef.id 
      });
      
      if (parentId) {
        const expanded = new Set(get().expandedPages);
        expanded.add(parentId);
        set({ expandedPages: expanded });
      }
      
      return pageRef.id;
    } catch (err) {
      console.error('❌ Create page error:', err);
      throw err;
    }
  },

  updatePage: async (id, updates) => {
    if (!isFirebaseConfigured || !db) return;
    
    try {
      const pageRef = doc(db, 'pages', id);
      await updateDoc(pageRef, {
        ...updates,
        updated_at: serverTimestamp(),
      });
      
      set({
        pages: get().pages.map(p => 
          p.id === id 
            ? { ...p, ...updates, updated_at: new Date().toISOString() }
            : p
        )
      });
    } catch (err) {
      console.error('❌ Update page error:', err);
    }
  },

  deletePage: async (id) => {
    if (!isFirebaseConfigured || !db) return;
    
    try {
      const pageRef = doc(db, 'pages', id);
      await updateDoc(pageRef, { 
        is_trashed: true,
        updated_at: serverTimestamp(),
      });
      
      const { currentPageId } = get();
      if (currentPageId === id) {
        set({ currentPageId: null });
      }
      
      set({
        pages: get().pages.map(p => 
          p.id === id ? { ...p, is_trashed: true } : p
        )
      });
    } catch (err) {
      console.error('❌ Delete page error:', err);
    }
  },

  setCurrentPage: (id) => {
    set({ currentPageId: id });
    // Update presence
    get().updatePresence(id);
  },

  togglePageExpanded: (id) => {
    const expanded = new Set(get().expandedPages);
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    set({ expandedPages: expanded });
  },

  loadBlocks: async (pageId) => {
    if (!isFirebaseConfigured || !db) return;
    
    try {
      console.log('📄 Loading blocks for page:', pageId);
      
      const q = query(
        collection(db, 'blocks'),
        where('page_id', '==', pageId),
        orderBy('position', 'asc')
      );
      
      const snapshot = await getDocs(q);
      console.log('📊 Blocks query result:', { 
        empty: snapshot.empty, 
        size: snapshot.size,
      });
      
      const blocks: Block[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          page_id: data.page_id || '',
          type: data.type || 'paragraph',
          content: data.content || {},
          position: data.position || 0,
          parent_id: data.parent_id || null,
        };
      });
      
      console.log('✅ Blocks loaded:', blocks.length);
      set({ blocks });
    } catch (err: any) {
      console.error('❌ Load blocks error:', err);
    }
  },

  saveBlocks: async (pageId, blocks) => {
    if (!isFirebaseConfigured || !db) return;
    
    const firestore = db;
    
    try {
      console.log('💾 Saving blocks for page:', pageId, 'blocks count:', blocks.length);
      
      const q = query(
        collection(firestore, 'blocks'),
        where('page_id', '==', pageId)
      );
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(firestore);
      snapshot.docs.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      
      blocks.forEach((block, index) => {
        const blockId = uuidv4();
        const blockRef = doc(firestore, 'blocks', blockId);
        batch.set(blockRef, {
          page_id: pageId,
          type: block.type,
          content: block.content as any,
          position: index,
          parent_id: block.parent_id,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      });
      
      await batch.commit();
      console.log('✅ Blocks saved successfully');
      
      set({ blocks });
      
      const pageRef = doc(firestore, 'pages', pageId);
      await updateDoc(pageRef, { updated_at: serverTimestamp() });
    } catch (err: any) {
      console.error('❌ Save blocks error:', err);
    }
  },

  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  toggleMembersPanel: () => set({ showMembersPanel: !get().showMembersPanel }),
}));
