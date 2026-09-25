import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export default function WorkspaceSetup() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const { createWorkspace, user, loadWorkspaces, workspaces, workspace } = useStore();

  // Se il workspace viene caricato mentre siamo qui, redirect automatico
  useEffect(() => {
    if (workspace) {
      console.log('✅ Workspace trovato durante il check, redirect automatico');
    }
  }, [workspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🏗️ Tentativo di creazione workspace...');
      await createWorkspace(name);
      console.log('✅ Workspace creato con successo');
      
      // Verifica che il workspace sia stato caricato
      const currentWorkspace = useStore.getState().workspace;
      if (!currentWorkspace) {
        console.warn('⚠️ Workspace creato ma non caricato nello stato, forzo reload...');
        await loadWorkspaces();
      }
    } catch (err: any) {
      console.error('❌ Errore creazione workspace:', err);
      setError(err.message || 'Errore durante la creazione del workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckData = async () => {
    setChecking(true);
    setError('');
    
    try {
      console.log('🔍 Verifica dati in Firestore...');
      console.log('User ID:', user?.id);
      console.log('User Email:', user?.email);
      
      await loadWorkspaces();
      
      const currentWorkspaces = useStore.getState().workspaces;
      const currentWorkspace = useStore.getState().workspace;
      const currentPages = useStore.getState().pages;
      
      console.log('📊 Risultato verifica:', {
        totalWorkspaces: currentWorkspaces.length,
        hasWorkspace: !!currentWorkspace,
        workspaceId: currentWorkspace?.id,
        pagesCount: currentPages.length
      });
      
      if (currentWorkspaces.length > 0) {
        setError('');
        console.log(`✅ Trovati ${currentWorkspaces.length} workspace!`);
      } else {
        setError('Nessun workspace trovato per il tuo account. Verifica le regole di sicurezza Firestore.');
      }
    } catch (err: any) {
      console.error('❌ Errore verifica:', err);
      setError(`Errore: ${err.message || 'Impossibile verificare i dati'}`);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-2xl font-bold text-gray-900">Benvenuto, {user?.full_name || user?.email || 'Utente'}!</h1>
          <p className="text-gray-500 mt-2">Crea il tuo workspace per iniziare</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Errore</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome del workspace
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition"
                placeholder="Il mio team"
                required
                autoFocus
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creazione...
                </>
              ) : (
                <>
                  Crea Workspace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3">
              Hai già dei workspace?
            </p>
            <button
              onClick={handleCheckData}
              disabled={checking}
              className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifica in corso...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {workspaces.length > 0 
                    ? `Carica i tuoi ${workspaces.length} workspace` 
                    : 'Verifica workspace esistenti'}
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-xs text-gray-400 space-y-1">
              <p><strong>Debug Info:</strong></p>
              <p>User ID: {user?.id?.substring(0, 12)}...</p>
              <p>Email: {user?.email}</p>
              <p>Workspace totali: {workspaces.length}</p>
              <p>Apri la console (F12) per vedere i log dettagliati</p>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Suggerimento:</strong> Se non vedi i tuoi dati dopo il login, verifica che le regole di sicurezza Firestore siano configurate correttamente. Vai su Firebase Console → Firestore Database → Rules.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
