import { useState } from 'react';
import { useStore, Page } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  MoreHorizontal,
  Search,
  Settings,
  LogOut,
  FileText,
  Star,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

function PageItem({ page, depth = 0 }: { page: Page; depth?: number }) {
  const { currentPageId, setCurrentPage, expandedPages, togglePageExpanded, createPage, updatePage, deletePage, pages } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(page.title);

  const childPages = pages.filter(p => p.parent_id === page.id);
  const hasChildren = childPages.length > 0;
  const isExpanded = expandedPages.has(page.id);
  const isActive = currentPageId === page.id;

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await createPage(page.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    await deletePage(page.id);
  };

  const handleTitleSave = async () => {
    setIsEditing(false);
    if (editTitle !== page.title) {
      await updatePage(page.id, { title: editTitle });
    }
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer transition-colors ${
          isActive ? 'bg-gray-200/80' : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => setCurrentPage(page.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); togglePageExpanded(page.id); }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-4.5" />
        )}

        <span className="text-sm flex-shrink-0">{page.icon}</span>

        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTitleSave(); }}
            className="flex-1 text-sm bg-white border border-gray-300 rounded px-1 py-0.5 outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate text-gray-700">
            {page.title || 'Senza titolo'}
          </span>
        )}

        <div className="hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={handleAddChild}
            className="p-1 hover:bg-gray-200 rounded"
            title="Aggiungi sottopagina"
          >
            <Plus className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-4 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]"
          >
            <button
              onClick={() => { setIsEditing(true); setShowMenu(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Rinomina
            </button>
            <button
              onClick={() => { updatePage(page.id, { is_favorite: !page.is_favorite }); setShowMenu(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
            >
              <Star className="w-4 h-4" /> {page.is_favorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            </button>
            <hr className="my-1" />
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Elimina
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {childPages.map(child => (
              <PageItem key={child.id} page={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Sidebar() {
  const { workspace, pages, user, sidebarOpen, toggleSidebar, createPage, logout, currentPageId } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const rootPages = pages.filter(p => p.parent_id === null);
  const favoritePages = pages.filter(p => p.is_favorite);
  
  const filteredPages = searchQuery
    ? pages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  if (!sidebarOpen) {
    return (
      <div className="w-10 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col items-center pt-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 hover:bg-gray-200 rounded-md transition"
          title="Apri sidebar"
        >
          <PanelLeft className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
      {/* Workspace Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{workspace?.icon}</span>
            <span className="font-semibold text-sm text-gray-800 truncate">
              {workspace?.name}
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-gray-200 rounded-md transition"
            title="Chiudi sidebar"
          >
            <PanelLeftClose className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca..."
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-100 rounded-md border-none outline-none focus:bg-white focus:ring-1 focus:ring-gray-300 transition"
          />
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="px-2 pb-2">
          <p className="text-xs text-gray-400 px-2 mb-1">Risultati</p>
          {filteredPages.map(page => (
            <div
              key={page.id}
              className="flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-gray-100 text-sm"
              onClick={() => { useStore.getState().setCurrentPage(page.id); setSearchQuery(''); }}
            >
              <span>{page.icon}</span>
              <span className="truncate text-gray-700">{page.title || 'Senza titolo'}</span>
            </div>
          ))}
          {filteredPages.length === 0 && (
            <p className="text-xs text-gray-400 px-2">Nessun risultato</p>
          )}
        </div>
      )}

      {/* Favorites */}
      {favoritePages.length > 0 && !searchQuery && (
        <div className="px-2 pb-2">
          <p className="text-xs text-gray-400 px-2 mb-1 font-medium">⭐ Preferiti</p>
          {favoritePages.map(page => (
            <div
              key={page.id}
              className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer text-sm transition ${
                currentPageId === page.id ? 'bg-gray-200/80' : 'hover:bg-gray-100'
              }`}
              onClick={() => useStore.getState().setCurrentPage(page.id)}
            >
              <span>{page.icon}</span>
              <span className="truncate text-gray-700">{page.title || 'Senza titolo'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pages */}
      <div className="flex-1 overflow-y-auto px-2">
        {!searchQuery && (
          <>
            <div className="flex items-center justify-between px-2 mb-1">
              <p className="text-xs text-gray-400 font-medium">Pagine</p>
              <button
                onClick={() => createPage()}
                className="p-0.5 hover:bg-gray-200 rounded transition"
                title="Nuova pagina"
              >
                <Plus className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
            {rootPages.map(page => (
              <PageItem key={page.id} page={page} />
            ))}
            {rootPages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">Nessuna pagina</p>
                <button
                  onClick={() => createPage()}
                  className="text-sm text-blue-500 hover:text-blue-600 mt-2"
                >
                  + Crea la prima pagina
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="text-sm text-gray-600 truncate max-w-[120px]">
              {user?.full_name || user?.email}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 hover:bg-gray-200 rounded-md transition"
            title="Esci"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
