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

interface AppState {
  // Config
  isConfigured: boolean;
  
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  
  // Workspace
  workspace: Workspace | null;
  workspaceLoading: boolean;
  
  // Pages
  pages: Page[];
  currentPageId: string | null;
  expandedPages: Set<string>;
  
  // Blocks
  blocks: Block[];
  
  // UI
  sidebarOpen: boolean;
  isCreatingPage: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  
  loadWorkspace: () => Promise<void>;
  createWorkspace: (name: string) => Promise<void>;
  
  loadPages: () => Promise<void>;
  createPage: (parentId?: string | null) => Promise<string>;
  updatePage: (id: string, updates: Partial<Page>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  setCurrentPage: (id: string | null) => void;
  togglePageExpanded: (id: string) => void;
  
  loadBlocks: (pageId: string) => Promise<void>;
  saveBlocks: (pageId: string, blocks: Block[]) => Promise<void>;
  
  toggleSidebar: () => void;
}

// Helper per convertire Timestamp Firestore in stringa ISO
const timestampToString = (ts: any): string => {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
};

export const useStore = create<AppState>((set, get) => ({
  isConfigured: isFirebaseConfigured,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  authError: null,
  workspace: null,
  workspaceLoading: false,
  pages: [],
  currentPageId: null,
  expandedPages: new Set(),
  blocks: [],
  sidebarOpen: true,
  isCreatingPage: false,

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
      
      await get().loadWorkspace();
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
      
      // Aggiorna il displayName
      if (fbUser) {
        await updateProfile(fbUser, { displayName: fullName });
      }
      
      // Invia email di verifica (opzionale, non blocca l'accesso)
      try {
        const { sendEmailVerification } = await import('firebase/auth');
        if (auth && fbUser) {
          await sendEmailVerification(fbUser);
          console.log('Email di verifica inviata');
        }
      } catch (emailErr) {
        console.warn('Impossibile inviare email di verifica:', emailErr);
        // Non blocchiamo la registrazione se l'email non viene inviata
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
      
      // Carica il workspace (se esiste)
      await get().loadWorkspace();
    } catch (err: any) {
      console.error('Signup error:', err);
      throw new Error(err.message || 'Errore di registrazione');
    }
  },

  logout: async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    set({ 
      user: null, 
      isAuthenticated: false, 
      workspace: null, 
      pages: [], 
      currentPageId: null, 
      blocks: [] 
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
          
          // Attendi un momento per assicurarti che lo stato sia aggiornato
          await new Promise(r => setTimeout(r, 100));
          
          console.log('📂 Caricamento workspace...');
          await get().loadWorkspace();
        } else {
          console.log('❌ Nessun utente autenticato');
          set({ isLoading: false });
        }
        
        resolve();
        // Unsubscribe dopo la prima chiamata per evitare loop
        unsubscribe();
      });
    });
  },

  loadWorkspace: async () => {
    const { user } = get();
    if (!user || !isFirebaseConfigured || !db) {
      console.log('⚠️ Load workspace: skipped -', { hasUser: !!user, isConfigured: isFirebaseConfigured, hasDb: !!db });
      return;
    }
    
    set({ workspaceLoading: true });
    
    try {
      console.log('📂 Loading workspace for user:', user.id, user.email);
      
      const q = query(
        collection(db, 'workspaces'),
        where('created_by', '==', user.id)
      );
      
      const snapshot = await getDocs(q);
      console.log('📊 Workspace query result:', { 
        empty: snapshot.empty, 
        size: snapshot.size,
        docs: snapshot.docs.map(d => ({ id: d.id, data: d.data() }))
      });
      
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        
        console.log('✅ Workspace found:', docSnap.id, data);
        
        set({
          workspace: {
            id: docSnap.id,
            name: data.name || '',
            icon: data.icon || '📝',
            created_by: data.created_by || user.id,
            created_at: timestampToString(data.created_at),
          },
          workspaceLoading: false
        });
        
        console.log('📄 Caricamento pagine...');
        await get().loadPages();
      } else {
        console.log('⚠️ No workspace found for user - showing workspace creation screen');
        set({ workspaceLoading: false });
      }
    } catch (err: any) {
      console.error('❌ Load workspace error:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        name: err.name
      });
      
      set({ workspaceLoading: false });
      
      // Se è un errore di permessi, mostra un messaggio chiaro
      if (err.code === 'permission-denied') {
        console.error('🚫 ERRORE PERMESSI: Aggiorna le regole di sicurezza Firestore!');
        console.error('Vai su Firebase Console → Firestore Database → Rules e aggiorna le regole');
      }
    }
  },

  createWorkspace: async (name) => {
    const { user } = get();
    if (!user || !isFirebaseConfigured || !db) {
      console.error('❌ Create workspace: missing prerequisites', { hasUser: !!user, isConfigured: isFirebaseConfigured, hasDb: !!db });
      throw new Error('Configurazione incompleta');
    }
    
    try {
      console.log('🏗️ Creating workspace:', name, 'for user:', user.id, user.email);
      
      const workspaceData = {
        name,
        icon: '📝',
        created_by: user.id,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      
      console.log('📝 Workspace data:', workspaceData);
      
      const workspaceRef = await addDoc(collection(db, 'workspaces'), workspaceData);
      
      console.log('✅ Workspace created with ID:', workspaceRef.id);
      
      // Verify the workspace was actually saved
      const verifyDoc = await getDoc(workspaceRef);
      if (!verifyDoc.exists()) {
        throw new Error('Workspace non è stato salvato correttamente in Firestore');
      }
      
      console.log('✅ Workspace verified in Firestore:', verifyDoc.data());
      
      // Add creator as owner member
      await addDoc(collection(db, 'workspace_members'), {
        workspace_id: workspaceRef.id,
        user_id: user.id,
        role: 'owner',
        invited_at: serverTimestamp(),
        joined_at: serverTimestamp(),
      });
      
      console.log('✅ Workspace member added');
      
      set({
        workspace: {
          id: workspaceRef.id,
          name,
          icon: '📝',
          created_by: user.id,
          created_at: new Date().toISOString(),
        }
      });
      
      console.log('✅ Workspace set in state');
      
      // Create initial page
      console.log('📄 Creating initial page...');
      await get().createPage();
      console.log('✅ Initial page created');
      
      // Reload pages to ensure they're in state
      await get().loadPages();
      console.log('✅ Pages reloaded');
      
    } catch (err: any) {
      console.error('❌ Create workspace error:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        name: err.name
      });
      
      if (err.code === 'permission-denied') {
        throw new Error('Permessi negati. Aggiorna le regole di sicurezza Firestore!');
      }
      
      throw err;
    }
  },

  loadPages: async () => {
    const { workspace } = get();
    if (!workspace || !isFirebaseConfigured || !db) {
      console.log('Load pages: skipped -', { hasWorkspace: !!workspace });
      return;
    }
    
    try {
      console.log('Loading pages for workspace:', workspace.id);
      
      const q = query(
        collection(db, 'pages'),
        where('workspace_id', '==', workspace.id),
        where('is_trashed', '==', false),
        orderBy('position', 'asc')
      );
      
      const snapshot = await getDocs(q);
      console.log('Pages query result:', { empty: snapshot.empty, size: snapshot.size });
      
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
      
      console.log('Pages loaded:', pages.length);
      set({ pages });
    } catch (err) {
      console.error('Load pages error:', err);
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
      
      // Create initial empty block
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
      console.error('Create page error:', err);
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
      
      // Update local state immediately
      set({
        pages: get().pages.map(p => 
          p.id === id 
            ? { ...p, ...updates, updated_at: new Date().toISOString() }
            : p
        )
      });
    } catch (err) {
      console.error('Update page error:', err);
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
      console.error('Delete page error:', err);
    }
  },

  setCurrentPage: (id) => set({ currentPageId: id }),

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
      const q = query(
        collection(db, 'blocks'),
        where('page_id', '==', pageId),
        orderBy('position', 'asc')
      );
      
      const snapshot = await getDocs(q);
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
      
      set({ blocks });
    } catch (err) {
      console.error('Load blocks error:', err);
    }
  },

  saveBlocks: async (pageId, blocks) => {
    if (!isFirebaseConfigured || !db) return;
    
    const firestore = db; // Type narrowing
    
    try {
      // Delete existing blocks
      const q = query(
        collection(firestore, 'blocks'),
        where('page_id', '==', pageId)
      );
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(firestore);
      snapshot.docs.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      
      // Insert new blocks
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
      
      set({ blocks });
      
      // Update page timestamp
      const pageRef = doc(firestore, 'pages', pageId);
      await updateDoc(pageRef, { updated_at: serverTimestamp() });
    } catch (err) {
      console.error('Save blocks error:', err);
    }
  },

  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
}));
