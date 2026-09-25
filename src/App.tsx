import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import AuthPage from './components/AuthPage';
import WorkspaceSetup from './components/WorkspaceSetup';
import Sidebar from './components/Sidebar';
import DocumentEditor from './components/DocumentEditor';
import DiagramCanvas from './components/DiagramCanvas';
import { FileText, PenTool, Loader2, AlertTriangle, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

type ViewMode = 'document' | 'diagram';

function MainLayout() {
  const { workspace, currentPageId, pages } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('document');
  
  const currentPage = pages.find(p => p.id === currentPageId);

  if (!workspace) {
    return <WorkspaceSetup />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-11 border-b border-gray-200 flex items-center px-4 gap-2 bg-white flex-shrink-0">
          {/* View mode tabs */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('document')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                viewMode === 'document' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Documento
            </button>
            <button
              onClick={() => setViewMode('diagram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
                viewMode === 'diagram' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Diagramma
            </button>
          </div>

          <div className="flex-1" />

          {/* Breadcrumb */}
          {currentPage && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span>{currentPage.icon}</span>
              <span className="text-gray-700">{currentPage.title || 'Senza titolo'}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'document' ? <DocumentEditor /> : <DiagramCanvas />}
        </div>
      </div>
    </div>
  );
}

function ConfigWarning() {
  const [copied, setCopied] = useState(false);
  
  const envExample = `VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=tuo-progetto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tuo-progetto
VITE_FIREBASE_STORAGE_BUCKET=tuo-progetto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-200">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configurazione Richiesta</h1>
              <p className="text-gray-500 mt-1">
                Per usare l'app devi configurare Firebase con le tue credenziali.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3">📋 Passaggi da seguire:</h3>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="font-bold text-gray-800">1.</span>
                  <span>Vai su <a href="https://console.firebase.google.com" target="_blank" rel="noopener" className="text-blue-600 underline hover:text-blue-800">Firebase Console</a> e crea un progetto gratuito</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-gray-800">2.</span>
                  <span>Abilita <strong>Authentication</strong> (Email/Password) e <strong>Firestore Database</strong></span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-gray-800">3.</span>
                  <span>Vai su <strong>Project Settings → General → Your apps</strong> e registra un'app Web</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-gray-800">4.</span>
                  <span>Copia la configurazione <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">firebaseConfig</code> e inseriscila nel file <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">.env</code> (variabili qui sotto)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-gray-800">5.</span>
                  <span>Ricarica questa pagina</span>
                </li>
              </ol>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Contenuto del file .env:</label>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copiato!' : 'Copia'}
                </button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-sm overflow-x-auto font-mono">
                {envExample}
              </pre>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Su Vercel:</strong> aggiungi le stesse variabili in Settings → Environment Variables del tuo progetto.
              </p>
              <p className="text-sm text-blue-800 mt-2">
                📖 <strong>Backend:</strong> Questo progetto usa Firebase (Firestore + Auth).
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, checkAuth, isConfigured } = useStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Caricamento...</p>
        </motion.div>
      </div>
    );
  }

  if (!isConfigured) {
    return <ConfigWarning />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <MainLayout />;
}
