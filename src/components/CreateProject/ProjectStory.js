import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';

// Dynamically import TipTap editor to avoid SSR issues
const TiptapEditor = dynamic(() => import('./custom/TiptapEditor'), {
  ssr: false,
  loading: () => <div className="border border-gray-200 rounded-md p-4 h-[300px] flex items-center justify-center">Loading editor...</div>
});

// Character limit constants
const MAX_TOTAL_CHARS = 5000;
const DEFAULT_PART_TITLE = 'Project Overview';

/**
 * Rich text editor for project story using Tiptap with enhanced block functionality
 * @param {Object} props Component props
 * @param {Array|string} props.formData Project story content (string for backward compatibility or array of parts)
 * @param {Function} props.updateFormData Function to update parent form state
 * @returns {JSX.Element} Project story editor component
 */
export default function ProjectStory({ formData, updateFormData }) {
  // Handle both legacy string format and new array format
  const initializeStoryParts = () => {
    if (!formData) {
      return [{ id: 1, title: DEFAULT_PART_TITLE, content: '' }];
    }

    // Handle legacy format (string content)
    if (typeof formData === 'string') {
      return [{ id: 1, title: DEFAULT_PART_TITLE, content: formData }];
    }

    // Handle new format (array of parts)
    if (Array.isArray(formData) && formData.length > 0) {
      return formData;
    }

    // Default fallback
    return [{ id: 1, title: DEFAULT_PART_TITLE, content: '' }];
  };

  const [storyParts, setStoryParts] = useState(initializeStoryParts);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [blockCount, setBlockCount] = useState({
    images: 0,
    headings: 0,
    paragraphs: 0,
    lists: 0,
    videos: 0,
    others: 0
  });
  const [storyComplexityScore, setStoryComplexityScore] = useState(0);
  const [activePart, setActivePart] = useState(0); // Index of the currently active part
  const [nextId, setNextId] = useState(() => {
    // Find the highest id in existing parts + 1
    const ids = storyParts.map(part => part.id);
    return ids.length ? Math.max(...ids) + 1 : 2;
  });

  // Keep state in sync with props
  useEffect(() => {
    const newParts = initializeStoryParts();
    if (JSON.stringify(newParts) !== JSON.stringify(storyParts)) {
      setStoryParts(newParts);

      // Update nextId based on the highest existing id
      const ids = newParts.map(part => part.id);
      setNextId(ids.length ? Math.max(...ids) + 1 : 2);
    }
  }, [formData]);

  // Update parent component with new story parts
  const updateParentFormData = useCallback((updatedParts) => {
    updateFormData(updatedParts);
  }, [updateFormData]);

  // Handle content change for a specific part
  const handlePartContentChange = useCallback((partIndex, newContent) => {
    setStoryParts(prevParts => {
      const updatedParts = [...prevParts];
      updatedParts[partIndex] = {
        ...updatedParts[partIndex],
        content: newContent
      };

      // Update parent form data
      updateParentFormData(updatedParts);
      return updatedParts;
    });
  }, [updateParentFormData]);

  // Handle part title change
  const handlePartTitleChange = useCallback((partIndex, newTitle) => {
    setStoryParts(prevParts => {
      const updatedParts = [...prevParts];
      updatedParts[partIndex] = {
        ...updatedParts[partIndex],
        title: newTitle
      };

      // Update parent form data
      updateParentFormData(updatedParts);
      return updatedParts;
    });
  }, [updateParentFormData]);

  // Add a new story part
  const addStoryPart = useCallback(() => {
    const newPart = {
      id: nextId,
      title: `Part ${nextId}`,
      content: ''
    };

    setStoryParts(prevParts => {
      const updatedParts = [...prevParts, newPart];
      // Update parent form data
      updateParentFormData(updatedParts);
      return updatedParts;
    });

    setNextId(id => id + 1);
    // Set the new part as active
    setTimeout(() => {
      setActivePart(storyParts.length);
    }, 100);
  }, [nextId, storyParts.length, updateParentFormData]);

  // Remove a story part
  const removeStoryPart = useCallback((partIndex) => {
    if (storyParts.length <= 1) {
      // Don't allow removing the last part
      return;
    }

    setStoryParts(prevParts => {
      const updatedParts = prevParts.filter((_, index) => index !== partIndex);
      // Update parent form data
      updateParentFormData(updatedParts);
      return updatedParts;
    });

    // Adjust active part if needed
    if (activePart >= partIndex && activePart > 0) {
      setActivePart(activePart - 1);
    } else if (activePart >= storyParts.length - 1) {
      setActivePart(storyParts.length - 2);
    }
  }, [storyParts, activePart, updateParentFormData]);

  // Move a part up or down
  const movePart = useCallback((partIndex, direction) => {
    if ((direction === 'up' && partIndex === 0) ||
      (direction === 'down' && partIndex === storyParts.length - 1)) {
      return; // Cannot move further
    }

    const newIndex = direction === 'up' ? partIndex - 1 : partIndex + 1;

    setStoryParts(prevParts => {
      const updatedParts = [...prevParts];
      [updatedParts[partIndex], updatedParts[newIndex]] = [updatedParts[newIndex], updatedParts[partIndex]];

      // Update parent form data
      updateParentFormData(updatedParts);
      return updatedParts;
    });

    // Update active part to follow the moved part
    setActivePart(newIndex);
  }, [storyParts.length, updateParentFormData]);

  // Analyze content and update metrics
  useEffect(() => {
    const analyzeContent = () => {
      if (typeof window === 'undefined') return;

      let totalChars = 0;
      let totalWords = 0;
      let images = 0;
      let headings = 0;
      let paragraphs = 0;
      let lists = 0;
      let videos = 0;
      let others = 0;

      // Combine and analyze all parts
      storyParts.forEach(part => {
        if (!part.content) return;

        // Create a temporary element to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = part.content;

        // Extract text content for character and word count
        const plainText = tempDiv.textContent || '';
        totalChars += plainText.length;

        // Count words by splitting on spaces and filtering empty strings
        const words = plainText.split(/\s+/).filter(word => word.length > 0);
        totalWords += words.length;

        // Count different block types
        images += tempDiv.querySelectorAll('img').length;
        headings += tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
        paragraphs += tempDiv.querySelectorAll('p').length;
        lists += tempDiv.querySelectorAll('ul, ol').length;
        videos += tempDiv.querySelectorAll('.ProseMirror-youtube-iframe').length;

        // Other blocks (blockquotes, code blocks, etc.)
        const blockquotes = tempDiv.querySelectorAll('blockquote').length;
        const codeBlocks = tempDiv.querySelectorAll('pre').length;
        others += blockquotes + codeBlocks;
      });

      setCharCount(totalChars);
      setWordCount(totalWords);

      const newBlockCount = { images, headings, paragraphs, lists, videos, others };
      setBlockCount(newBlockCount);

      // Calculate a complexity score based on variety and length
      let complexityScore = 0;

      // Base score from text length (max: 40 points)
      if (totalChars > 3000) complexityScore += 40;
      else if (totalChars > 2000) complexityScore += 30;
      else if (totalChars > 1000) complexityScore += 20;
      else if (totalChars > 500) complexityScore += 10;

      // Add points for content variety (max: 60 points)
      if (headings > 0) complexityScore += Math.min(headings * 5, 15); // Up to 15 points
      if (images > 0) complexityScore += Math.min(images * 5, 20); // Up to 20 points
      if (paragraphs > 2) complexityScore += Math.min((paragraphs - 2) * 2, 10); // Up to 10 points
      if (lists > 0) complexityScore += Math.min(lists * 3, 9); // Up to 9 points
      if (videos > 0) complexityScore += Math.min(videos * 3, 6); // Up to 6 points

      setStoryComplexityScore(complexityScore);
    };

    analyzeContent();
  }, [storyParts]);

  // Helper to get feedback text based on complexity score
  const getComplexityFeedback = () => {
    if (storyComplexityScore >= 80) {
      return {
        text: "Excellent! Your story is comprehensive and engaging.",
        color: "text-green-600"
      };
    } else if (storyComplexityScore >= 60) {
      return {
        text: "Great job! Your story has good structure and detail.",
        color: "text-green-600"
      };
    } else if (storyComplexityScore >= 40) {
      return {
        text: "Good start. Consider adding more visual elements and details.",
        color: "text-blue-600"
      };
    } else if (storyComplexityScore >= 20) {
      return {
        text: "Basic content. Add headings, images, and more details to improve.",
        color: "text-yellow-600"
      };
    } else {
      return {
        text: "Your story needs more content to engage potential backers.",
        color: "text-red-500"
      };
    }
  };

  // Calculate percentage of character limit used
  const percentUsed = Math.round((charCount / MAX_TOTAL_CHARS) * 100);

  const feedback = getComplexityFeedback();

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Enhanced Project Story</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Create a rich, visual story about your project using multiple sections. Your total story is limited to {MAX_TOTAL_CHARS.toLocaleString()} characters across all sections.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="story" className="block text-sm font-medium text-gray-700 mb-2">
          Project Story *
        </label>

        {/* Story tabs navigation */}
        <div className="mb-4 border-b border-gray-200 overflow-x-auto">
          <div className="flex">
            {storyParts.map((part, index) => (
              <button
                key={part.id}
                className={`py-2 px-4 text-sm font-medium border-b-2 whitespace-nowrap ${index === activePart
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                onClick={() => setActivePart(index)}
              >
                {part.title || `Part ${part.id}`}
              </button>
            ))}

            {/* Add part button */}
            <button
              type="button"
              onClick={addStoryPart}
              className="py-2 px-4 text-sm font-medium text-blue-600 border-b-2 border-transparent hover:border-blue-300 flex items-center"
              disabled={charCount >= MAX_TOTAL_CHARS}
            >
              <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Section
            </button>
          </div>
        </div>

        {/* Active part editor and controls */}
        {storyParts.map((part, index) => (
          <div key={part.id} className={index === activePart ? 'block' : 'hidden'}>
            <div className="flex items-center mb-2 space-x-2">
              {/* Part title input */}
              <input
                type="text"
                value={part.title || ''}
                onChange={e => handlePartTitleChange(index, e.target.value)}
                placeholder="Section Title"
                // The part after the title input field
                className="text-sm font-medium border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 flex-1"
              />

              {/* Part controls */}
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => movePart(index, 'up')}
                  disabled={index === 0}
                  className={`p-1 rounded-md ${index === 0 ? 'text-gray-300' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                  title="Move up"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => movePart(index, 'down')}
                  disabled={index === storyParts.length - 1}
                  className={`p-1 rounded-md ${index === storyParts.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                  title="Move down"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => removeStoryPart(index)}
                  disabled={storyParts.length <= 1}
                  className={`p-1 rounded-md ${storyParts.length <= 1 ? 'text-gray-300' : 'text-red-500 hover:bg-red-50'}`}
                  title="Remove section"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* TipTap editor */}
            <div className="mb-4">
              <TiptapEditor
                content={part.content || ''}
                onChange={content => handlePartContentChange(index, content)}
                placeholder="Start writing your project story here..."
              />
            </div>
          </div>
        ))}

        {/* Story metrics */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex flex-col sm:flex-row sm:justify-between text-sm">
            <div className="mb-4 sm:mb-0">
              <span className="font-medium text-gray-700">Content Stats:</span>
              <ul className="mt-2 text-gray-600 space-y-1">
                <li>
                  Characters: <span className="font-medium">{charCount.toLocaleString()}</span>
                  <span className="ml-1 text-xs text-gray-500">
                    (max {MAX_TOTAL_CHARS.toLocaleString()})
                  </span>
                </li>
                <li>Words: <span className="font-medium">{wordCount.toLocaleString()}</span></li>
                <li>Sections: <span className="font-medium">{storyParts.length}</span></li>
              </ul>
            </div>

            <div>
              <span className="font-medium text-gray-700">Content Elements:</span>
              <ul className="mt-2 text-gray-600 space-y-1">
                <li>Paragraphs: <span className="font-medium">{blockCount.paragraphs}</span></li>
                <li>Headings: <span className="font-medium">{blockCount.headings}</span></li>
                <li>Images: <span className="font-medium">{blockCount.images}</span></li>
                <li>Lists: <span className="font-medium">{blockCount.lists}</span></li>
                <li>Videos: <span className="font-medium">{blockCount.videos}</span></li>
                <li>Other blocks: <span className="font-medium">{blockCount.others}</span></li>
              </ul>
            </div>
          </div>

          {/* Character limit progress */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                Character Limit ({percentUsed}%)
              </span>
              <span className={`text-xs font-medium ${percentUsed > 90 ? 'text-red-600' : 'text-gray-500'}`}>
                {charCount.toLocaleString()} / {MAX_TOTAL_CHARS.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${percentUsed > 90 ? 'bg-red-600' : percentUsed > 70 ? 'bg-yellow-400' : 'bg-green-600'
                  }`}
                style={{ width: `${Math.min(100, percentUsed)}%` }}
              ></div>
            </div>
          </div>

          {/* Story quality feedback */}
          <div className="mt-6">
            <div className="flex items-center">
              <div className="mr-2">
                <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700">Story Quality Score:</h4>
                <div className="flex items-center mt-1">
                  <div className="w-1/4 mr-4">
                    <div className="h-2.5 rounded-full bg-gray-200">
                      <div
                        className={`h-2.5 rounded-full ${storyComplexityScore > 70 ? 'bg-green-600' :
                            storyComplexityScore > 40 ? 'bg-blue-600' :
                              storyComplexityScore > 20 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${Math.min(100, storyComplexityScore)}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className={`text-sm ${feedback.color}`}>{feedback.text}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Story writing tips */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Tips for a Great Project Story:</h4>
          <ul className="text-xs text-gray-600 space-y-2">
            <li>• <strong>Start with a hook</strong> to grab attention in the first few sentences</li>
            <li>• <strong>Use headings</strong> to break up your content into easy-to-read sections</li>
            <li>• <strong>Include images</strong> to show your project, prototypes, sketches, or team</li>
            <li>• <strong>Keep paragraphs short</strong> for better readability</li>
            <li>• <strong>Tell your story</strong> - why this project matters to you and why it should matter to backers</li>
            <li>• <strong>Include a timeline</strong> showing your production plan and delivery schedule</li>
            <li>• <strong>Be transparent</strong> about challenges you might face and how you'll overcome them</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

ProjectStory.propTypes = {
  formData: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array
  ]),
  updateFormData: PropTypes.func.isRequired
};

ProjectStory.defaultProps = {
  formData: null
};