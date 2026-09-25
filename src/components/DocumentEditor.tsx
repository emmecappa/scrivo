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
  MoreHorizontal,
  GripVertical,
  Plus,
  Smile,
} from 'lucide-react';

const EMOJIS = ['📄', '📝', '📋', '📌', '🎯', '💡', '🔥', '⭐', '🚀', '💎', '🎨', '📊', '📈', '🗂️', '📁', '🏷️', '✅', '❌', '⚡', '🌟', '🎉', '💻', '📱', '🔧', '🛠️', '📐', '🧩', '🎪', '🌈', '🍀'];

export default function DocumentEditor() {
  const { currentPageId, pages, updatePage, blocks, loadBlocks, saveBlocks } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  
  const currentPage = pages.find(p => p.id === currentPageId);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm' } },
      }),
      Placeholder.configure({
        placeholder: "Scrivi qualcosa o premi '/' per i comandi...",
      }),
      Highlight.configure({ multicolor: true }),
      Underline,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-500 underline cursor-pointer' } }),
      Image.configure({ inline: true }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (!currentPageId) return;
      
      console.log('✏️ Editor content updated for page:', currentPageId);
      setIsSaving(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(() => {
        const html = editor.getHTML();
        const json = editor.getJSON();
        
        console.log('💾 Saving content, HTML length:', html.length);
        
        const newBlocks = [{
          id: 'main',
          page_id: currentPageId,
          type: 'paragraph' as const,
          content: { html, json },
          position: 0,
          parent_id: null,
        }];
        
        saveBlocks(currentPageId, newBlocks);
        setIsSaving(false);
      }, 1000);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] px-16 py-8',
      },
    },
  });

  // Load blocks when page changes
  useEffect(() => {
    if (currentPageId) {
      console.log('🔄 Page changed, loading blocks for:', currentPageId);
      loadBlocks(currentPageId).then(() => {
        const pageBlocks = useStore.getState().blocks;
        console.log('📄 Blocks loaded for editor:', pageBlocks.length, pageBlocks);
        
        if (pageBlocks.length > 0 && pageBlocks[0].content?.html) {
          console.log('✅ Setting editor content from saved HTML');
          editor?.commands.setContent(pageBlocks[0].content.html);
        } else {
          console.log('⚠️ No saved content, setting empty editor');
          editor?.commands.setContent('');
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
            <Italic className="w-4" />
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

          {isSaving && (
            <span className="text-xs text-gray-400 ml-2">Salvataggio...</span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
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
            </div>
          </div>

          {/* Editor */}
          <div className="pb-32">
            <EditorContent editor={editor} />
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
