import { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  Plus, 
  Settings, 
  Trash2, 
  Edit2,
  Check,
  X,
  Loader2
} from 'lucide-react';

export default function WorkspaceSelector() {
  const { 
    workspaces, 
    workspace, 
    selectWorkspace, 
    createWorkspace, 
    updateWorkspace,
    deleteWorkspace,
    user 
  } = useStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [editWorkspaceIcon, setEditWorkspaceIcon] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    
    setLoading(true);
    try {
      await createWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWorkspaceName.trim() || !workspace) return;
    
    setLoading(true);
    try {
      await updateWorkspace(workspace.id, {
        name: editWorkspaceName,
        icon: editWorkspaceIcon
      });
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspace) return;
    
    if (!confirm(`Sei sicuro di voler eliminare il workspace "${workspace.name}"? Questa azione non può essere annullata.`)) {
      return;
    }
    
    setLoading(true);
    try {
      await deleteWorkspace(workspace.id);
      setIsOpen(false);
    } catch (err) {
      console.error('Error deleting workspace:', err);
      alert('Errore durante l\'eliminazione del workspace');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (!workspace) return;
    setEditWorkspaceName(workspace.name);
    setEditWorkspaceIcon(workspace.icon);
    setShowEditModal(true);
    setIsOpen(false);
  };

  if (!workspace) return null;

  return (
    <>
      {/* Workspace Selector Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition group"
        >
          <span className="text-xl">{workspace.icon}</span>
          <span className="flex-1 text-left font-semibold text-sm truncate">
            {workspace.name}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              
              {/* Menu */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
              >
                {/* Workspaces List */}
                <div className="p-2 max-h-64 overflow-y-auto">
                  <div className="text-xs font-semibold text-gray-500 px-2 py-1 uppercase tracking-wide">
                    I tuoi workspace
                  </div>
                  
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={async () => {
                        await selectWorkspace(ws.id);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition text-left ${
                        ws.id === workspace.id 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{ws.icon}</span>
                      <span className="flex-1 text-sm font-medium truncate">
                        {ws.name}
                      </span>
                      {ws.id === workspace.id && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                  
                  {workspaces.length === 0 && (
                    <div className="text-sm text-gray-500 px-2 py-4 text-center">
                      Nessun workspace
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 p-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowCreateModal(true);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition text-left text-sm text-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crea nuovo workspace</span>
                  </button>
                  
                  <button
                    onClick={openEditModal}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition text-left text-sm text-gray-700"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Impostazioni workspace</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Create Workspace Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <Modal onClose={() => setShowCreateModal(false)}>
            <h2 className="text-xl font-bold mb-4">Crea nuovo workspace</h2>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome workspace
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Il mio team"
                  autoFocus
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading || !newWorkspaceName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creazione...
                    </>
                  ) : (
                    'Crea'
                  )}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit Workspace Modal */}
      <AnimatePresence>
        {showEditModal && (
          <Modal onClose={() => setShowEditModal(false)}>
            <h2 className="text-xl font-bold mb-4">Impostazioni workspace</h2>
            <form onSubmit={handleUpdateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icona
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['📝', '💼', '🏠', '🎨', '🚀', '💡', '📊', '🎯', '⭐', '🔥'].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setEditWorkspaceIcon(icon)}
                      className={`w-10 h-10 rounded-lg border-2 transition ${
                        editWorkspaceIcon === icon 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome workspace
                </label>
                <input
                  type="text"
                  value={editWorkspaceName}
                  onChange={(e) => setEditWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading || !editWorkspaceName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    'Salva'
                  )}
                </button>
              </div>
              
              {/* Delete workspace (only for owner) */}
              {workspace.created_by === user?.id && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleDeleteWorkspace}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Elimina workspace
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Questa azione non può essere annullata
                  </p>
                </div>
              )}
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          {children}
        </motion.div>
      </motion.div>
    </>
  );
}
