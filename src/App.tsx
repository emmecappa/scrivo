import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import AuthPage from './components/AuthPage';
import WorkspaceSetup from './components/WorkspaceSetup';
import Sidebar from './components/Sidebar';
import DocumentEditor from './components/DocumentEditor';
import DiagramCanvas from './components/DiagramCanvas';
import { FileText, PenTool, Loader2 } from 'lucide-react';
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

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useStore();

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

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <MainLayout />;
}
