import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';

// Dynamically import TipTap editor to avoid SSR issues
const TiptapEditor = dynamic(() => import('../../components/CreateProject/custom/TiptapEditor'), {
  ssr: false,
  loading: () => <div className="border border-gray-200 rounded-md p-4 h-[300px] flex items-center justify-center">Loading editor...</div>
});

/**
 * Rich text editor for project story using Tiptap
 * @param {Object} props Component props
 * @param {string} props.formData Project story content
 * @param {Function} props.updateFormData Function to update parent form state
 * @returns {JSX.Element} Project story editor component
 */
export default function ProjectStory({ formData, updateFormData }) {
  const [content, setContent] = useState(formData || '');
  const [charCount, setCharCount] = useState(0);

  // Keep state in sync with props
  useEffect(() => {
    if (formData !== content) {
      setContent(formData || '');
    }
  }, [formData]);

  // Count characters without HTML tags
  useEffect(() => {
    const stripHtml = (html) => {
      if (!html) return '';
      // Create a temporary element to parse HTML and extract text content
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || '';
    };
    
    const plainText = typeof window !== 'undefined' ? stripHtml(content) : '';
    setCharCount(plainText.length);
  }, [content]);

  const handleChange = useCallback((newContent) => {
    setContent(newContent);
    updateFormData(newContent);
  }, [updateFormData]);

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
            <h3 className="text-sm font-medium text-blue-800">Project Story</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Craft a compelling story about your project. Explain what you&apos;re creating, why it matters, and how you&apos;ll execute it.
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
          <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
            <div>
              {charCount < 200 ? (
                <span className="text-yellow-600">
                  At least {200 - charCount} more characters needed
                </span>
              ) : charCount < 500 ? (
                <span>Good start! Adding more details is recommended.</span>
              ) : (
                <span className="text-green-600">Great level of detail!</span>
              )}
            </div>
            <div className={charCount < 200 ? "text-red-500" : "text-gray-500"}>
              {charCount} characters
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Story Guidelines:</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
            <li><span className="font-medium">Project Overview:</span> Clearly explain what your project is and what you plan to accomplish.</li>
            <li><span className="font-medium">Your Background:</span> Share your qualifications and why you&apos;re the right person for this project.</li>
            <li><span className="font-medium">Project Timeline:</span> Provide a realistic schedule for production and delivery.</li>
            <li><span className="font-medium">Visual Elements:</span> Add images or videos using the toolbar to showcase your project or prototypes.</li>
            <li><span className="font-medium">Transparency:</span> Address potential challenges and how you plan to overcome them.</li>
            <li><span className="font-medium">Budget Breakdown:</span> Explain how funds will be used across different phases of your project.</li>
            <li><span className="font-medium">Impact:</span> Describe the broader impact of your project and why backers should care.</li>
          </ul>
        </div>
        
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Writing Tips:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Use headings to organize your content into clear sections</li>
            <li>• Keep paragraphs short and focused on one idea</li>
            <li>• Include images after you&apos;ve written your key points</li>
            <li>• Use bullet points for lists of features or specifications</li>
            <li>• Tell a story about why this project matters to you personally</li>
            <li>• Proofread carefully before submitting</li>
          </ul>
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