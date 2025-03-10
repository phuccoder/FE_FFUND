import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import YouTube from '@tiptap/extension-youtube';
import Blockquote from '@tiptap/extension-blockquote';
import PropTypes from 'prop-types';

const MAX_CHARS = 5000;

const TiptapEditor = ({ content, onChange, placeholder }) => {
  const [charCount, setCharCount] = useState(0);
  const [isOverLimit, setIsOverLimit] = useState(false);
  
  // Count characters without HTML
  const countPlainTextCharacters = (html) => {
    if (!html) return 0;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent.length;
  };

  const editor = useEditor({
    extensions: [
      StarterKit, // This already includes heading functionality
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'story-image',
        },
      }),
      YouTube.configure({
        width: 640,
        height: 480,
        controls: true,
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
      const html = editor.getHTML();
      const currentCharCount = countPlainTextCharacters(html);
      setCharCount(currentCharCount);
      
      // Check if over limit
      if (currentCharCount > MAX_CHARS) {
        setIsOverLimit(true);
      } else {
        setIsOverLimit(false);
        onChange(html);
      }
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      const currentCharCount = countPlainTextCharacters(editor.getHTML());
      setCharCount(currentCharCount);
      setIsOverLimit(currentCharCount > MAX_CHARS);
    }
  }, [editor]);

  // Define menu items for different block types
  const blockTypes = [
    { name: 'Paragraph', icon: 'text-size', onClick: () => editor && editor.chain().focus().setParagraph().run() },
    { name: 'Heading 1', icon: 'type-h1', onClick: () => editor && editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { name: 'Heading 2', icon: 'type-h2', onClick: () => editor && editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { name: 'Heading 3', icon: 'type-h3', onClick: () => editor && editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { name: 'Bullet List', icon: 'list-ul', onClick: () => editor && editor.chain().focus().toggleBulletList().run() },
    { name: 'Numbered List', icon: 'list-ol', onClick: () => editor && editor.chain().focus().toggleOrderedList().run() },
    { name: 'Quote Block', icon: 'quote', onClick: () => editor && editor.chain().focus().toggleBlockquote().run() },
    { name: 'Code Block', icon: 'code', onClick: () => editor && editor.chain().focus().toggleCodeBlock().run() },
    { name: 'Divider', icon: 'hr', onClick: () => editor && editor.chain().focus().setHorizontalRule().run() }
  ];

  const addImage = () => {
    if (isOverLimit) {
      alert(`You've reached the character limit (${MAX_CHARS}). Please remove some content before adding images.`);
      return;
    }
    
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
            // Insert image as a new block with additional data attributes
            editor.chain().focus()
              .setImage({ 
                src: result,
                alt: file.name,
                title: file.name,
              })
              .run();
          }
        };
        
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const addYouTube = () => {
    if (isOverLimit) {
      alert(`You've reached the character limit (${MAX_CHARS}). Please remove some content before adding videos.`);
      return;
    }
    
    const url = prompt('Enter YouTube URL');
    if (url && editor) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 480,
      });
    }
  };

  const setLink = () => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    
    if (url === null) return;
    
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    
    editor.chain().focus().setLink({ href: url }).run();
  };

  const isActive = (type, options = {}) => {
    if (!editor) return false;
    return editor.isActive(type, options);
  };

  // Style panel with color picker and text alignment options
  const StylePanel = () => (
    <div className="flex flex-wrap items-center p-2 bg-gray-100 rounded mb-2">
      <span className="text-xs text-gray-500 mr-2">Style:</span>
      
      {/* Font colors */}
      <div className="flex mr-3">
        {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF'].map(color => (
          <button
            key={color}
            type="button"
            onClick={() => editor && editor.chain().focus().setColor(color).run()}
            className="w-4 h-4 rounded-full mx-1 border border-gray-400"
            style={{ backgroundColor: color }}
            title={`Set text color to ${color}`}
          />
        ))}
      </div>
      
      {/* Text background colors (highlight) */}
      <div className="flex mr-3">
        {['#FFFF00', '#FF9900', '#99FF99', '#99CCFF'].map(color => (
          <button
            key={color}
            type="button"
            onClick={() => editor && editor.chain().focus().toggleHighlight({ color }).run()}
            className="w-4 h-4 rounded-full mx-1 border border-gray-400"
            style={{ backgroundColor: color }}
            title={`Highlight text with ${color}`}
          />
        ))}
      </div>
      
      {/* Text alignment */}
      <div className="flex mr-3">
        <button
          type="button"
          onClick={() => editor && editor.chain().focus().setTextAlign('left').run()}
          className={`p-1 rounded ${isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''}`}
          title="Align left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor && editor.chain().focus().setTextAlign('center').run()}
          className={`p-1 rounded ${isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
          title="Center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor && editor.chain().focus().setTextAlign('right').run()}
          className={`p-1 rounded ${isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
          title="Align right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor && editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1 rounded ${isActive({ textAlign: 'justify' }) ? 'bg-gray-300' : ''}`}
          title="Justify"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
          </svg>
        </button>
      </div>

      {/* Image style controls (only show when an image is selected) */}
      {editor && editor.isActive('image') && (
        <div className="flex ml-auto">
          <span className="text-xs text-gray-500 mr-2">Image style:</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().updateAttributes('image', { class: 'story-image w-full' }).run()}
            className="p-1 rounded hover:bg-gray-200"
            title="Full width"
          >
            Wide
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().updateAttributes('image', { class: 'story-image w-1/2 float-left mr-4' }).run()}
            className="p-1 rounded hover:bg-gray-200"
            title="Left align"
          >
            Left
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().updateAttributes('image', { class: 'story-image w-1/2 float-right ml-4' }).run()}
            className="p-1 rounded hover:bg-gray-200"
            title="Right align"
          >
            Right
          </button>
        </div>
      )}
    </div>
  );

  if (!editor) {
    return <div className="h-[300px] border border-gray-300 rounded-md">Loading...</div>;
  }

  return (
    <div className={`border ${isOverLimit ? 'border-red-500' : 'border-gray-300'} rounded-md`}>
      {/* Main toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-300">
        {/* Text formatting */}
        <div className="flex mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded ${
              isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055a2.176 2.176 0 0 0 1.852-2.14c0-1.51-1.162-2.46-3.014-2.46H3.843V13H8.21zM5.908 4.674h1.696c.963 0 1.517.451 1.517 1.244 0 .834-.629 1.32-1.73 1.32H5.908V4.673zm0 6.788V8.598h1.73c1.217 0 1.88.492 1.88 1.415 0 .943-.643 1.449-1.832 1.449H5.907z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded ${
              isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Italic"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M7.991 11.674 9.53 4.455c.123-.595.246-.71 1.347-.807l.11-.52H7.211l-.11.52c1.06.096 1.128.212 1.005.807L6.57 11.674c-.123.595-.246.71-1.346.806l-.11.52h3.774l.11-.52c-1.06-.095-1.129-.211-1.006-.806z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-2 py-1 rounded ${
              isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.313 3.136h-1.23V9.54c0 2.105 1.47 3.623 3.917 3.623s3.917-1.518 3.917-3.623V3.136h-1.23v6.323c0 1.49-.978 2.57-2.687 2.57-1.709 0-2.687-1.08-2.687-2.57V3.136zM12.5 15h-9v-1h9v1z"/>
            </svg>
          </button>
        </div>

        <span className="text-gray-300 mx-1">|</span>

        {/* Headings buttons directly in the toolbar for better visibility */}
        <div className="flex mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`px-2 py-1 rounded ${
              isActive('paragraph') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Normal text"
          >
            <span className="text-xs">¶</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 rounded ${
              isActive('heading', { level: 1 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Heading 1"
          >
            <span className="font-bold">H1</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 rounded ${
              isActive('heading', { level: 2 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Heading 2"
          >
            <span className="font-bold">H2</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1 rounded ${
              isActive('heading', { level: 3 }) ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Heading 3"
          >
            <span className="font-bold">H3</span>
          </button>
        </div>

        <span className="text-gray-300 mx-1">|</span>
        
        {/* Block types dropdown - keep for other block types */}
        <div className="relative group">
          <button
            type="button"
            className="px-2 py-1 rounded inline-flex items-center hover:bg-gray-100"
          >
            <span className="text-sm mr-1">Block</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
          <div className="absolute left-0 mt-1 w-48 bg-white shadow-lg rounded-md border border-gray-200 hidden group-hover:block z-10">
            <button
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                isActive('paragraph') ? 'bg-gray-100' : ''
              }`}
            >
              Paragraph
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                isActive('blockquote') ? 'bg-gray-100' : ''
              }`}
            >
              Quote Block
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                isActive('codeBlock') ? 'bg-gray-100' : ''
              }`}
            >
              Code Block
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Divider
            </button>
          </div>
        </div>

        <span className="text-gray-300 mx-1">|</span>

        {/* Lists */}
        <div className="flex mr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-1 rounded ${
              isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Bullet List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2 py-1 rounded ${
              isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Numbered List"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM1.713 11.865v-.474H2c.217 0 .363-.137.363-.317 0-.185-.158-.31-.361-.31-.223 0-.367.152-.373.31h-.59c.016-.467.373-.787.986-.787.588-.002.954.291.957.703a.595.595 0 0 1-.492.594v.033a.615.615 0 0 1 .569.631c.003.533-.502.8-1.051.8-.656 0-1-.37-1.008-.794h.582c.008.178.186.306.422.309.254 0 .424-.145.422-.35-.002-.195-.155-.348-.414-.348h-.3zm-.004-4.699h-.604v-.035c0-.408.295-.844.958-.844.583 0 .96.326.96.756 0 .389-.257.617-.476.848l-.537.572v.03h1.054V9H1.143v-.395l.957-.99c.138-.142.293-.304.293-.508 0-.18-.147-.32-.342-.32a.33.33 0 0 0-.342.338v.041zM2.564 5h-.635V2.924h-.031l-.598.42v-.567l.629-.443h.635V5z"/>
            </svg>
          </button>
        </div>

        <span className="text-gray-300 mx-1">|</span>

        {/* Media */}
        <div className="flex mr-2">
          <button
            type="button"
            onClick={addImage}
            className={`px-2 py-1 rounded hover:bg-gray-100 ${isOverLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isOverLimit ? "Character limit reached" : "Add Image"}
            disabled={isOverLimit}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
              <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={addYouTube}
            className={`px-2 py-1 rounded hover:bg-gray-100 ${isOverLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isOverLimit ? "Character limit reached" : "Add YouTube Video"}
            disabled={isOverLimit}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.007 2.007 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.007 2.007 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.007 2.007 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408L6.4 5.209z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={setLink}
            className={`px-2 py-1 rounded ${
              isActive('link') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            title="Add Link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
              <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>
            </svg>
          </button>
        </div>

        {/* Toggle advanced styling panel */}
        <button
          type="button"
          onClick={() => {
            const stylePanel = document.getElementById('style-panel');
            if (stylePanel) {
              stylePanel.classList.toggle('hidden');
            }
          }}
          className="ml-auto px-2 py-1 rounded hover:bg-gray-100 flex items-center"
          title="Text & Image Styling"
        >
          <span className="text-xs mr-1">Advanced Styling</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>

      {/* Style panel (hidden by default) */}
      <div id="style-panel" className="hidden">
        <StylePanel />
      </div>

      {/* Content editable area */}
      <EditorContent 
        editor={editor} 
        className={`p-4 min-h-[300px] prose max-w-none focus:outline-none ${isOverLimit ? 'bg-red-50' : ''}`}
      />
      
      {/* Character counter */}
      <div className={`flex justify-between items-center px-4 py-2 border-t ${isOverLimit ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
        <div className={`text-sm ${isOverLimit ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          {isOverLimit ? (
            <span>Character limit exceeded. Please remove {charCount - MAX_CHARS} characters.</span>
          ) : (
            <span>Characters: {charCount}/{MAX_CHARS}</span>
          )}
        </div>
        <div className="text-xs text-gray-400">
          {Math.floor((charCount / MAX_CHARS) * 100)}% of limit
        </div>
      </div>
    </div>
  );
};

TiptapEditor.propTypes = {
  content: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string
};

TiptapEditor.defaultProps = {
  content: '',
  placeholder: 'Write something...'
};

export default TiptapEditor;