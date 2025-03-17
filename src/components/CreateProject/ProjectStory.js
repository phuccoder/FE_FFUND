import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';

// Dynamically import TipTap editor to avoid SSR issues
const TiptapEditor = dynamic(() => import('./custom/TiptapEditor'), {
  ssr: false,
  loading: () => <div className="border border-gray-200 rounded-md p-4 h-[300px] flex items-center justify-center">Loading editor...</div>
});

// Character limit constant
const MAX_CHARS = 5000;

/**
 * Rich text editor for project story using Tiptap with enhanced block functionality
 * @param {Object} props Component props
 * @param {string} props.formData Project story content
 * @param {Function} props.updateFormData Function to update parent form state
 * @returns {JSX.Element} Project story editor component
 */
export default function ProjectStory({ formData, updateFormData }) {
  const [content, setContent] = useState(formData || '');
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

  // Keep state in sync with props
  useEffect(() => {
    if (formData !== content) {
      setContent(formData || '');
    }
  }, [formData]);

  // Analyze content and update metrics
  useEffect(() => {
    const analyzeContent = () => {
      if (!content || typeof window === 'undefined') return;

      // Create a temporary element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      // Extract text content for character and word count
      const plainText = tempDiv.textContent || '';
      const chars = plainText.length;
      setCharCount(chars);
      
      // Count words by splitting on spaces and filtering empty strings
      const words = plainText.split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      
      // Count different block types
      const images = tempDiv.querySelectorAll('img').length;
      const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
      const paragraphs = tempDiv.querySelectorAll('p').length;
      const lists = tempDiv.querySelectorAll('ul, ol').length;
      const videos = tempDiv.querySelectorAll('.ProseMirror-youtube-iframe').length;
      
      // Other blocks (blockquotes, code blocks, etc.)
      const blockquotes = tempDiv.querySelectorAll('blockquote').length;
      const codeBlocks = tempDiv.querySelectorAll('pre').length;
      const others = blockquotes + codeBlocks;
      
      const newBlockCount = { images, headings, paragraphs, lists, videos, others };
      setBlockCount(newBlockCount);
      
      // Calculate a complexity score based on variety and length
      // More diverse content and appropriate length yields a higher score
      let complexityScore = 0;
      
      // Base score from text length (max: 40 points)
      // Adjusted for 5000 character limit
      if (chars > 3000) complexityScore += 40;
      else if (chars > 2000) complexityScore += 30;
      else if (chars > 1000) complexityScore += 20;
      else if (chars > 500) complexityScore += 10;
      
      // Add points for content variety (max: 60 points)
      if (headings > 0) complexityScore += Math.min(headings * 5, 15); // Up to 15 points
      if (images > 0) complexityScore += Math.min(images * 5, 20); // Up to 20 points
      if (paragraphs > 2) complexityScore += Math.min((paragraphs - 2) * 2, 10); // Up to 10 points
      if (lists > 0) complexityScore += Math.min(lists * 3, 9); // Up to 9 points
      if (videos > 0) complexityScore += Math.min(videos * 3, 6); // Up to 6 points
      
      setStoryComplexityScore(complexityScore);
    };

    analyzeContent();
  }, [content]);

  const handleChange = useCallback((newContent) => {
    setContent(newContent);
    updateFormData(newContent);
  }, [updateFormData]);

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
  const percentUsed = Math.round((charCount / MAX_CHARS) * 100);

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
                Create a rich, visual story about your project using different content blocks. Your story is limited to {MAX_CHARS.toLocaleString()} characters.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="story" className="block text-sm font-medium text-gray-700">
          Project Story *
        </label>
        <div className="mt-1">
          {typeof window !== 'undefined' && (
            <TiptapEditor
              content={content}
              onChange={handleChange}
              placeholder="Start writing your project story here..."
            />
          )}
          
          {/* Content analysis display */}
          <div className="mt-4 bg-gray-50 rounded-md p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Content Analysis</h4>
            
            {/* Character limit usage bar */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">Character Usage</span>
                <span className="text-xs font-medium text-gray-700">{charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()} ({percentUsed}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    percentUsed > 95 ? 'bg-red-500' :
                    percentUsed > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }`} 
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs mt-1 text-gray-500">Use your characters wisely for maximum impact</p>
            </div>
            
            {/* Story complexity score */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">Story Complexity</span>
                <span className="text-xs font-medium text-gray-700">{storyComplexityScore}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    storyComplexityScore >= 80 ? 'bg-green-600' :
                    storyComplexityScore >= 60 ? 'bg-green-500' :
                    storyComplexityScore >= 40 ? 'bg-blue-500' :
                    storyComplexityScore >= 20 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} 
                  style={{ width: `${storyComplexityScore}%` }}
                ></div>
              </div>
              <p className={`text-xs mt-1 ${feedback.color}`}>{feedback.text}</p>
            </div>
            
            {/* Content metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="text-xs text-gray-500">Words</div>
                <div className="font-medium">{wordCount.toLocaleString()}</div>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="text-xs text-gray-500">Paragraphs</div>
                <div className="font-medium">{blockCount.paragraphs}</div>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="text-xs text-gray-500">Headings</div>
                <div className="font-medium">{blockCount.headings}</div>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="text-xs text-gray-500">Images</div>
                <div className="font-medium">{blockCount.images}</div>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="text-xs text-gray-500">Lists</div>
                <div className="font-medium">{blockCount.lists}</div>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200">
                <div className="text-xs text-gray-500">Media Elements</div>
                <div className="font-medium">{blockCount.images + blockCount.videos}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Making the Most of Your 5,000 Characters:</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
            <li><span className="font-medium">Be concise but comprehensive:</span> Every character counts, so focus on what matters most.</li>
            <li><span className="font-medium">Use visual elements:</span> Images help tell your story without using up your character limit.</li>
            <li><span className="font-medium">Structure with headings:</span> Break up content into scannable sections with clear headings.</li>
            <li><span className="font-medium">Use bullet points:</span> Lists convey information efficiently in limited space.</li>
            <li><span className="font-medium">Focus on key details:</span> Highlight unique features, benefits, and your project timeline.</li>
            <li><span className="font-medium">Remove redundancies:</span> Edit ruthlessly to eliminate repetitive content.</li>
            <li><span className="font-medium">Balance text and media:</span> Combine text with strategic images to maximize impact.</li>
          </ul>
        </div>
        
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Content Priority Guide:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-xs text-gray-600">
              <p className="font-medium text-gray-700 mb-1">High-Impact Elements (Prioritize These)</p>
              <ul className="space-y-1">
                <li>• <b>Project overview:</b> Clear explanation of your concept</li>
                <li>• <b>Key features:</b> What makes your project unique</li>
                <li>• <b>Visual elements:</b> Strategic images that show your product</li>
                <li>• <b>Team credentials:</b> Brief background establishing credibility</li>
                <li>• <b>Timeline:</b> Concise schedule for production and delivery</li>
              </ul>
            </div>
            <div className="text-xs text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Lower-Priority Elements (If Space Permits)</p>
              <ul className="space-y-1">
                <li>• <b>Detailed backstory:</b> Summarize rather than narrate</li>
                <li>• <b>Technical specifications:</b> Focus on differentiators</li>
                <li>• <b>Market analysis:</b> Brief mention of market need</li>
                <li>• <b>Multiple testimonials:</b> Choose one strong quote</li>
                <li>• <b>Long paragraphs:</b> Break into smaller, focused sections</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add prop type validation
ProjectStory.propTypes = {
  formData: PropTypes.string,
  updateFormData: PropTypes.func.isRequired
};

// Default props
ProjectStory.defaultProps = {
  formData: ''
};