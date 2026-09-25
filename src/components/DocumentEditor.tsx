import { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useStore } from '../store/useStore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Link as LinkIcon,
  Undo,
  Redo,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['📄', '📝', '📋', '📌', '🎯', '💡', '🔥', '⭐', '🚀', '💎', '🎨', '📊', '📈', '🗂️', '📁', '🏷️', '✅', '❌', '⚡', '🌟', '🎉', '💻', '📱', '🔧', '🛠️', '📐', '🧩', '🎪', '🌈', '🍀'];

interface RemoteCursor {
  userId: string;
  email: string;
  fullName: string;
  color: string;
  position: number;
  selectionFrom?: number;
  selectionTo?: number;
}

export default function DocumentEditor() {
  const { currentPageId, pages, updatePage, blocks, loadBlocks, saveBlocks, user, activeUsers } = useStore();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const lastContentRef = useRef<string>('');
  
  const currentPage = pages.find(p => p.id === currentPageId);

  // Get other users on this page
  const otherUsersOnPage = activeUsers.filter(
    u => u.userId !== user?.id && u.pageId === currentPageId
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm' } },
      }),
      Placeholder.configure({
        placeholder: "Scrivi qualcosa... gli altri vedranno le modifiche in tempo reale!",
      }),
      Highlight.configure({ multicolor: true }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-500 underline cursor-pointer' } }),
      Image.configure({ inline: true }),
    ],
    content: '',
    // IMMEDIATE SAVE - No debounce for real-time collaboration
    onUpdate: ({ editor }) => {
      if (!currentPageId) return;
      
      const html = editor.getHTML();
      
      // Only save if content actually changed
      if (html === lastContentRef.current) return;
      
      lastContentRef.current = html;
      setIsLiveSyncing(true);
      
      // Save immediately (no debounce)
      const json = editor.getJSON();
      
      const newBlocks = [{
        id: 'main',
        page_id: currentPageId,
        type: 'paragraph' as const,
        content: { html, json },
        position: 0,
        parent_id: null,
      }];
      
      saveBlocks(currentPageId, newBlocks).then(() => {
        setIsLiveSyncing(false);
      });
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] px-16 py-8',
      },
    },
  });

  // REAL-TIME SYNC: Listen for changes from other users
  useEffect(() => {
    if (!currentPageId || !isFirebaseConfigured || !db || !editor) return;
    
    console.log('🔄 Starting real-time sync for page:', currentPageId);
    
    // Unsubscribe from previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    
    // Listen to the first block of this page
    const blocksQuery = doc(db, 'blocks', 'main_' + currentPageId);
    
    // Use onSnapshot for real-time updates
    unsubscribeRef.current = onSnapshot(
      doc(db, 'pages', currentPageId),
      async (pageSnapshot) => {
        if (!pageSnapshot.exists()) return;
        
        const pageData = pageSnapshot.data();
        const lastEditedBy = pageData.last_edited_by;
        const lastEditedAt = pageData.last_edited_at;
        
        // Only update if someone else edited
        if (lastEditedBy && lastEditedBy !== user?.id) {
          console.log('📝 Remote update detected from:', lastEditedBy);
          
          // Load the latest blocks
          const { loadBlocks } = useStore.getState();
          await loadBlocks(currentPageId);
          
          const pageBlocks = useStore.getState().blocks;
          if (pageBlocks.length > 0 && pageBlocks[0].content?.html) {
            const remoteHtml = pageBlocks[0].content.html;
            
            // Only update if content is different
            if (remoteHtml !== lastContentRef.current) {
              console.log('✅ Applying remote changes');
              
              // Save current cursor position
              const { state } = editor;
              const { from, to } = state.selection;
              
              // Update content
              editor.commands.setContent(remoteHtml);
              lastContentRef.current = remoteHtml;
              
              // Try to restore cursor position
              try {
                const newPos = Math.min(from, remoteHtml.length);
                editor.commands.setTextSelection(newPos);
              } catch (e) {
                // Ignore cursor restoration errors
              }
            }
          }
        }
      }
    );
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [currentPageId, editor, user?.id]);

  // Load initial content
  useEffect(() => {
    if (currentPageId) {
      console.log('🔄 Page changed, loading blocks for:', currentPageId);
      
      // Update presence
      useStore.getState().updatePresence(currentPageId);
      
      loadBlocks(currentPageId).then(() => {
        const pageBlocks = useStore.getState().blocks;
        console.log('📄 Blocks loaded for editor:', pageBlocks.length);
        
        if (pageBlocks.length > 0 && pageBlocks[0].content?.html) {
          console.log('✅ Setting editor content from saved HTML');
          editor?.commands.setContent(pageBlocks[0].content.html);
          lastContentRef.current = pageBlocks[0].content.html;
        } else {
          console.log('⚠️ No saved content, setting empty editor');
          editor?.commands.setContent('');
          lastContentRef.current = '';
        }
      }).catch(err => {
        console.error('❌ Error loading blocks:', err);
      });
    }
  }, [currentPageId]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentPageId) {
      updatePage(currentPageId, { title: e.target.value });
    }
  }, [currentPageId]);

  const handleIconChange = (emoji: string) => {
    if (currentPageId) {
      updatePage(currentPageId, { icon: emoji });
    }
    setShowEmojiPicker(false);
  };

  if (!currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-medium text-gray-400">Seleziona una pagina</h2>
          <p className="text-sm text-gray-300 mt-2">o creane una nuova dalla sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Toolbar */}
      {editor && (
        <div className="border-b border-gray-100 px-4 py-2 flex items-center gap-1 flex-wrap sticky top-0 bg-white z-10">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Grassetto"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Corsivo"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Sottolineato"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Barrato"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            active={editor.isActive('highlight')}
            title="Evidenziato"
          >
            <Highlighter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Codice inline"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Titolo 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Titolo 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Titolo 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Lista puntata"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Lista numerata"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={editor.isActive('taskList')}
            title="Lista task"
          >
            <CheckSquare className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Citazione"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive('codeBlock')}
            title="Blocco codice"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Divisore"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarButton
            onClick={() => {
              const url = prompt('Inserisci URL:');
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            active={editor.isActive('link')}
            title="Link"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>

          <div className="flex-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Annulla"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Ripeti"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>

          {/* Live sync indicator */}
          {isLiveSyncing && (
            <div className="flex items-center gap-1 ml-2 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Sincronizzazione...</span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="px-16 pt-12">
            {/* Icon */}
            <div className="relative inline-block">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-5xl hover:bg-gray-100 rounded-lg p-2 transition"
              >
                {currentPage.icon}
              </button>
              
              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-50 grid grid-cols-6 gap-1 w-[220px]">
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleIconChange(emoji)}
                      className="text-2xl hover:bg-gray-100 rounded p-1 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title */}
            <input
              type="text"
              value={currentPage.title}
              onChange={handleTitleChange}
              placeholder="Senza titolo"
              className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 outline-none mb-2 bg-transparent"
            />
            
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
              <span>Ultima modifica: {new Date(currentPage.updated_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              
              {/* Live editing indicator */}
              {otherUsersOnPage.length > 0 && (
                <div className="flex items-center gap-2 ml-4">
                  <div className="flex -space-x-2">
                    {otherUsersOnPage.slice(0, 3).map((activeUser) => (
                      <div
                        key={activeUser.userId}
                        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: activeUser.color }}
                        title={`${activeUser.fullName || activeUser.email} sta modificando`}
                      >
                        {activeUser.fullName ? activeUser.fullName.charAt(0).toUpperCase() : activeUser.email.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {otherUsersOnPage.length === 1 
                      ? `${otherUsersOnPage[0].fullName || otherUsersOnPage[0].email} sta modificando...`
                      : `${otherUsersOnPage.length} persone stanno modificando...`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="pb-32 relative">
            <EditorContent editor={editor} />
            
            {/* Remote cursors overlay */}
            <AnimatePresence>
              {remoteCursors.map((cursor) => (
                <motion.div
                  key={cursor.userId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${cursor.position % 80}%`,
                    top: `${Math.floor(cursor.position / 80) * 24}px`,
                  }}
                >
                  <div
                    className="w-0.5 h-5 animate-pulse"
                    style={{ backgroundColor: cursor.color }}
                  />
                  <div
                    className="absolute -top-6 left-0 px-2 py-0.5 rounded text-xs text-white whitespace-nowrap"
                    style={{ backgroundColor: cursor.color }}
                  >
                    {cursor.fullName || cursor.email}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ children, onClick, active, title }: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition ${
        active ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
