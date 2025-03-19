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

const TiptapEditor = ({ content, onChange, placeholder, onImageUpload }) => {
  const [charCount, setCharCount] = useState(0);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const [isBlockMenuOpen, setIsBlockMenuOpen] = useState(false);

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
      console.log('Setting TiptapEditor content:', content ? content.substring(0, 100) + '...' : 'empty content');
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isBlockMenuOpen && !event.target.closest('.block-type-dropdown')) {
        setIsBlockMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBlockMenuOpen]);

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

  const getCurrentBlockType = () => {
    if (!editor) return 'Paragraph';

    if (editor.isActive('heading', { level: 1 })) return 'Heading 1';
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2';
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3';
    if (editor.isActive('bulletList')) return 'Bullet List';
    if (editor.isActive('orderedList')) return 'Numbered List';
    if (editor.isActive('blockquote')) return 'Quote Block';
    if (editor.isActive('codeBlock')) return 'Code Block';
    if (editor.isActive('horizontalRule')) return 'Divider';
    if (editor.isActive('paragraph')) return 'Paragraph';

    return 'Paragraph';
  };
  // Replace the addImage function with this improved version
  const addImage = () => {
    if (isOverLimit) {
      alert(`You've reached the character limit (${MAX_CHARS}). Please remove some content before adding images.`);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async () => {
      if (input.files?.length) {
        const file = input.files[0];

        // Add loading indicator
        if (editor) {
          const tempId = `loading-${Date.now()}`;
          editor.chain().focus().insertContent(`
          <div id="${tempId}" class="bg-gray-100 p-4 rounded text-center">
            <p>Uploading image...</p>
          </div>
        `).run();
        }

        try {
          let imageUrl;

          if (onImageUpload && typeof onImageUpload === 'function') {
            console.log('Using provided upload function');
            imageUrl = await onImageUpload(file);
          } else {
            console.log('Falling back to base64 encoding');
            imageUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result);
              reader.readAsDataURL(file);
            });
          }

          // Remove the loading placeholder
          const tempElements = document.querySelectorAll('[id^="loading-"]');
          if (tempElements.length > 0) {
            tempElements.forEach(el => {
              el.parentNode?.removeChild(el);
            });
          }

          if (imageUrl && editor) {
            // Insert the image with proper attributes for the API to recognize
            editor.chain().focus().insertContent(`
            <img 
              src="${imageUrl}" 
              alt="${file.name || 'Project image'}" 
              title="${file.name || 'Project image'}"
              class="story-image" 
              data-type="IMAGE"
            />
          `).run();

            console.log('Image inserted successfully');
          } else {
            alert('Failed to upload image. Please try again.');
          }
        } catch (error) {
          console.error('Image upload failed:', error);
          alert('Failed to upload image: ' + (error.message || 'Unknown error'));

          // Remove loading placeholder
          const tempElements = document.querySelectorAll('[id^="loading-"]');
          if (tempElements.length > 0) {
            tempElements.forEach(el => {
              el.parentNode?.removeChild(el);
            });
          }
        }
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
            <path fillRule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor && editor.chain().focus().setTextAlign('center').run()}
          className={`p-1 rounded ${isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
          title="Center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor && editor.chain().focus().setTextAlign('right').run()}
          className={`p-1 rounded ${isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
          title="Align right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor && editor.chain().focus().setTextAlign('justify').run()}
          className={`p-1 rounded ${isActive({ textAlign: 'justify' }) ? 'bg-gray-300' : ''}`}
          title="Justify"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
          </svg>
        </button>
      </div>
    </div>
  );

  // Toolbar with buttons
  return (
    <div className="flex flex-col h-full border rounded-md shadow-sm overflow-hidden">
      <div className="flex flex-col bg-gray-50 border-b border-gray-200">
        {/* Primary toolbar */}
        <div className="flex flex-wrap items-center px-2 py-1 gap-1 border-b border-gray-200">
          {/* Block type dropdown */}
          <div className="relative block-type-dropdown">
            <button
              className="flex items-center px-2 py-1 text-sm rounded hover:bg-gray-200 border border-gray-300"
              title="Paragraph Format"
              onClick={() => setIsBlockMenuOpen(!isBlockMenuOpen)}
            >
              <span className="mr-1">{getCurrentBlockType()}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
              </svg>
            </button>
            {isBlockMenuOpen && (
              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-40">
                {blockTypes.map((block) => (
                  <button
                    key={block.name}
                    onClick={() => {
                      block.onClick();
                      setIsBlockMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${editor && editor.isActive(block.name.toLowerCase()) ? 'bg-blue-100' : ''
                      }`}
                  >
                    {block.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-6 border-l border-gray-300 mx-1"></div>

          {/* Text formatting buttons */}
          <div className="flex bg-white rounded border border-gray-300">
            <button
              onClick={() => editor && editor.chain().focus().toggleBold().run()}
              className={`p-1 rounded-l hover:bg-gray-100 ${isActive('bold') ? 'bg-blue-50 text-blue-600' : ''
                }`}
              title="Bold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055a2.176 2.176 0 0 0 1.852-2.14c0-1.51-1.162-2.46-3.014-2.46H3.843V13H8.21zM5.908 4.674h1.696c.963 0 1.517.451 1.517 1.244 0 .834-.629 1.32-1.73 1.32H5.908V4.673zm0 6.788V8.598h1.73c1.217 0 1.88.492 1.88 1.415 0 .943-.643 1.449-1.832 1.449H5.907z" />
              </svg>
            </button>

            <button
              onClick={() => editor && editor.chain().focus().toggleItalic().run()}
              className={`p-1 border-l border-gray-300 hover:bg-gray-100 ${isActive('italic') ? 'bg-blue-50 text-blue-600' : ''
                }`}
              title="Italic"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.991 11.674 9.53 4.455c.123-.595.246-.71 1.347-.807l.11-.52H7.211l-.11.52c1.06.096 1.128.212 1.005.807L6.57 11.674c-.123.595-.246.71-1.346.806l-.11.52h3.774l.11-.52c-1.06-.095-1.129-.211-1.006-.806z" />
              </svg>
            </button>

            <button
              onClick={() => editor && editor.chain().focus().toggleUnderline().run()}
              className={`p-1 border-l border-gray-300 hover:bg-gray-100 ${isActive('underline') ? 'bg-blue-50 text-blue-600' : ''
                }`}
              title="Underline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.313 3.136h-1.23V9.54c0 2.105 1.47 3.623 3.917 3.623s3.917-1.518 3.917-3.623V3.136h-1.23v6.323c0 1.49-.978 2.57-2.687 2.57-1.709 0-2.687-1.08-2.687-2.57V3.136zM12.5 15h-9v-1h9v1z" />
              </svg>
            </button>

            <button
              onClick={() => editor && editor.chain().focus().toggleStrike().run()}
              className={`p-1 border-l border-gray-300 rounded-r hover:bg-gray-100 ${isActive('strike') ? 'bg-blue-50 text-blue-600' : ''
                }`}
              title="Strike"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6.333 5.686c0 .31.083.581.27.814H5.166a2.776 2.776 0 0 1-.099-.76c0-1.627 1.436-2.768 3.48-2.768 1.969 0 3.39 1.175 3.445 2.85h-1.23c-.11-1.08-.964-1.743-2.25-1.743-1.23 0-2.18.602-2.18 1.607zm2.194 7.478c-2.153 0-3.589-1.107-3.705-2.81h1.23c.144 1.06 1.129 1.703 2.544 1.703 1.34 0 2.31-.705 2.31-1.675 0-.827-.547-1.374-1.914-1.675L8.046 8.5H1v-1h14v1h-3.504c.468.437.675.994.675 1.697 0 1.826-1.436 2.967-3.644 2.967z" />
              </svg>
            </button>
          </div>

          <div className="h-6 border-l border-gray-300 mx-1"></div>

          {/* Lists */}
          <div className="flex bg-white rounded border border-gray-300">
            <button
              onClick={() => editor && editor.chain().focus().toggleBulletList().run()}
              className={`p-1 rounded-l hover:bg-gray-100 ${isActive('bulletList') ? 'bg-blue-50 text-blue-600' : ''}`}
              title="Bullet List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
              </svg>
            </button>
            <button
              onClick={() => editor && editor.chain().focus().toggleOrderedList().run()}
              className={`p-1 border-l border-gray-300 rounded-r hover:bg-gray-100 ${isActive('orderedList') ? 'bg-blue-50 text-blue-600' : ''}`}
              title="Numbered List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z" />
                <path d="M1.713 11.865v-.474H2c.217 0 .363-.137.363-.317 0-.185-.158-.31-.361-.31-.223 0-.367.152-.373.31h-.59c.016-.467.373-.787.986-.787.588-.002.954.291.957.703a.595.595 0 0 1-.492.594v.033a.615.615 0 0 1 .569.631c.003.533-.502.8-1.051.8-.656 0-1-.37-1.008-.794h.582c.008.178.186.306.422.309.254 0 .424-.145.422-.35-.002-.195-.155-.348-.414-.348h-.3zm-.004-4.699h-.604v-.035c0-.408.295-.844.958-.844.583 0 .96.326.96.756 0 .389-.257.617-.476.848l-.537.572v.03h1.054V9H1.143v-.395l.957-.99c.138-.142.293-.304.293-.508 0-.18-.147-.32-.342-.32a.33.33 0 0 0-.342.338v.041zM2.564 5h-.635V2.924h-.031l-.598.42v-.567l.629-.443h.635V5z" />
              </svg>
            </button>
          </div>

          <div className="h-6 border-l border-gray-300 mx-1"></div>

          {/* Alignment */}
          <div className="flex bg-white rounded border border-gray-300">
            <button
              onClick={() => editor && editor.chain().focus().setTextAlign('left').run()}
              className={`p-1 rounded-l hover:bg-gray-100 ${isActive({ textAlign: 'left' }) ? 'bg-blue-50 text-blue-600' : ''}`}
              title="Align left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
              </svg>
            </button>
            <button
              onClick={() => editor && editor.chain().focus().setTextAlign('center').run()}
              className={`p-1 border-l border-gray-300 hover:bg-gray-100 ${isActive({ textAlign: 'center' }) ? 'bg-blue-50 text-blue-600' : ''}`}
              title="Center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
              </svg>
            </button>
            <button
              onClick={() => editor && editor.chain().focus().setTextAlign('right').run()}
              className={`p-1 border-l border-gray-300 hover:bg-gray-100 ${isActive({ textAlign: 'right' }) ? 'bg-blue-50 text-blue-600' : ''}`}
              title="Align right"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
              </svg>
            </button>
            <button
              onClick={() => editor && editor.chain().focus().setTextAlign('justify').run()}
              className={`p-1 border-l border-gray-300 rounded-r hover:bg-gray-100 ${isActive({ textAlign: 'justify' }) ? 'bg-blue-50 text-blue-600' : ''}`}
              title="Justify"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2 12.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5zm0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
              </svg>
            </button>
          </div>

          {/* Media & Link buttons - positioned to right */}
          <div className="ml-auto flex gap-1">
            <button
              onClick={setLink}
              className={`px-2 py-1 rounded text-sm border ${isActive('link') ? 'bg-blue-50 text-blue-600 border-blue-200' : 'border-gray-300 hover:bg-gray-100'
                }`}
              title="Insert Link"
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
                  <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z" />
                  <path d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z" />
                </svg>
                Link
              </div>
            </button>

            <button
              onClick={addImage}
              className="px-2 py-1 rounded text-sm border border-gray-300 hover:bg-gray-100"
              title="Insert Image"
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
                  <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                  <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z" />
                </svg>
                Image
              </div>
            </button>

            <button
              onClick={addYouTube}
              className="px-2 py-1 rounded text-sm border border-gray-300 hover:bg-gray-100"
              title="Insert YouTube Video"
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
                  <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.007 2.007 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.007 2.007 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.007 2.007 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408L6.4 5.209z" />
                </svg>
                Video
              </div>
            </button>
          </div>
        </div>

        {/* Text and highlight colors toolbar */}
        <div className="px-3 py-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">Text color:</span>
            <div className="flex gap-1">
              {['#000000', '#4a5568', '#2b6cb0', '#2c7a7b', '#2f855a', '#744210', '#c53030', '#702459'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => editor && editor.chain().focus().setColor(color).run()}
                  className="w-5 h-5 rounded border border-gray-300"
                  style={{ backgroundColor: color }}
                  title={`Set text color`}
                />
              ))}
            </div>
          </div>

          <div className="h-5 border-l border-gray-300 mx-1"></div>

          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-2">Highlight:</span>
            <div className="flex gap-1">
              {['#FFFF00', '#00FFFF', '#FF99CC', '#99FF99', '#FF9966', '#99CCFF'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => editor && editor.chain().focus().toggleHighlight({ color }).run()}
                  className="w-5 h-5 rounded border border-gray-300 flex items-center justify-center"
                  style={{ backgroundColor: color }}
                  title={`Highlight text`}
                >
                  <span className="text-xs" style={{ color: '#000' }}>A</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4 bg-white">
        {editor && <EditorContent editor={editor} className="prose max-w-none h-full" />}
      </div>

      <div className="flex justify-between items-center p-2 bg-gray-50 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {isOverLimit ? (
            <span className="text-red-500 font-medium">
              Character limit exceeded: {charCount}/{MAX_CHARS}
            </span>
          ) : (
            <span>
              Characters: {charCount}/{MAX_CHARS}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => editor && editor.chain().focus().undo().run()}
            disabled={!editor?.can().undo()}
            className="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:bg-gray-50"
            title="Undo"
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
                <path fillRule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z" />
                <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z" />
              </svg>
              Undo
            </div>
          </button>

          <button
            onClick={() => editor && editor.chain().focus().redo().run()}
            disabled={!editor?.can().redo()}
            className="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:bg-gray-50"
            title="Redo"
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="mr-1">
                <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
              </svg>
              Redo
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

TiptapEditor.propTypes = {
  content: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  onImageUpload: PropTypes.func
};

TiptapEditor.defaultProps = {
  content: '',
  placeholder: 'Start typing...'
};

export default TiptapEditor;