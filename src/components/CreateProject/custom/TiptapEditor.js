import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';

/**
 * Custom Tiptap-based rich text editor component
 */
const TiptapEditor = ({ content, onChange, placeholder }) => {
  // Create the Tiptap editor instance
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when props change
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Add image from file handler
  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = () => {
      if (input.files?.length) {
        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const result = e.target?.result;
          if (result && editor) {
            editor.chain().focus().setImage({ src: result }).run();
          }
        };
        
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  // Add link handler
  const setLink = () => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    
    // cancelled
    if (url === null) return;
    
    // empty
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    
    // update link
    editor.chain().focus().setLink({ href: url }).run();
  };

  // Check if buttons should be active
  const isActive = (type, options = {}) => {
    if (!editor) return false;
    return editor.isActive(type, options);
  };

  if (!editor) {
    return <div className="h-[300px] border border-gray-300 rounded-md">Loading...</div>;
  }

  return (
    <div className="border border-gray-300 rounded-md">
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-300">
        {/* Headings */}
        <div className="flex">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 rounded ${
              isActive('heading', { level: 1 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 rounded ${
              isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1 rounded ${
              isActive('heading', { level: 3 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        <span className="mx-1 text-gray-300">|</span>

        {/* Text formatting */}
        <div className="flex">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded ${
              isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" /></svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded ${
              isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Italic"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-2 py-1 rounded ${
              isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>
          </button>
        </div>

        <span className="mx-1 text-gray-300">|</span>

        {/* Lists */}
        <div className="flex">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-1 rounded ${
              isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Bullet List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><line x1="9" y1="6" x2="20" y2="6"></line><line x1="9" y1="12" x2="20" y2="12"></line><line x1="9" y1="18" x2="20" y2="18"></line><circle cx="5" cy="6" r="1"></circle><circle cx="5" cy="12" r="1"></circle><circle cx="5" cy="18" r="1"></circle></svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2 py-1 rounded ${
                isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Numbered List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
          </button>
        </div>

        <span className="mx-1 text-gray-300">|</span>

        {/* Alignment */}
        <div className="flex">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`px-2 py-1 rounded ${
              isActive({ textAlign: 'left' }) ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Align Left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="14" y2="12"></line><line x1="4" y1="18" x2="18" y2="18"></line></svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`px-2 py-1 rounded ${
              isActive({ textAlign: 'center' }) ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Align Center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="8" y1="12" x2="16" y2="12"></line><line x1="6" y1="18" x2="18" y2="18"></line></svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`px-2 py-1 rounded ${
              isActive({ textAlign: 'right' }) ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Align Right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><line x1="4" y1="6" x2="20" y2="6"></line><line x1="10" y1="12" x2="20" y2="12"></line><line x1="6" y1="18" x2="20" y2="18"></line></svg>
          </button>
        </div>

        <span className="mx-1 text-gray-300">|</span>

        {/* Block quotes and code */}
        <div className="flex">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-2 py-1 rounded ${
              isActive('blockquote') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Quote"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><path d="M10 11h-4a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 011 1v3a4 4 0 01-4 4v1a5 5 0 005-5V7a2 2 0 00-2-2h-3a2 2 0 00-2 2v3a2 2 0 002 2h3v-1z"></path><path d="M19 11h-4a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 011 1v3a4 4 0 01-4 4v1a5 5 0 005-5V7a2 2 0 00-2-2h-3a2 2 0 00-2 2v3a2 2 0 002 2h3v-1z"></path></svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-2 py-1 rounded ${
              isActive('codeBlock') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Code Block"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          </button>
        </div>

        <span className="mx-1 text-gray-300">|</span>

        {/* Media and Link */}
        <div className="flex">
          <button
            type="button"
            onClick={setLink}
            className={`px-2 py-1 rounded ${
              isActive('link') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Add Link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          </button>
          <button
            type="button"
            onClick={addImage}
            className="px-2 py-1 rounded hover:bg-gray-100"
            title="Add Image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          </button>
        </div>
      </div>

      {/* Content editable area */}
      <EditorContent 
        editor={editor} 
        className="p-4 min-h-[300px] prose max-w-none focus:outline-none"
      />
    </div>
  );
};

export default TiptapEditor;