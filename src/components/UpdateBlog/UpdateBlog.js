import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Component for posting updates to a project
 * @param {Object} props - Component props
 * @param {Function} props.onSave - Callback when update is saved
 * @param {Function} props.onCancel - Callback when update is canceled
 * @param {Array} props.existingUpdates - Array of existing updates (optional)
 * @returns {JSX.Element} Update blog component
 */
export default function UpdateBlog({ onSave, onCancel, existingUpdates = [] }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExistingUpdates, setShowExistingUpdates] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create update object
      const update = {
        title,
        content,
        date: new Date().toISOString()
      };
      
      // Call the save callback
      await onSave(update);
      
      // Reset form
      setTitle('');
      setContent('');
    } catch (error) {
      console.error('Error saving update:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Post Project Update</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="update-title" className="block text-sm font-medium text-gray-700 mb-1">
            Update Title
          </label>
          <input
            id="update-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="What's new with your project?"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="update-content" className="block text-sm font-medium text-gray-700 mb-1">
            Update Content
          </label>
          <textarea
            id="update-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share details about your progress, milestones, or changes..."
            required
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              (isSubmitting || !title.trim() || !content.trim()) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Posting...' : 'Post Update'}
          </button>
        </div>
      </form>
      
      {existingUpdates.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowExistingUpdates(!showExistingUpdates)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <span>{showExistingUpdates ? 'Hide' : 'Show'} Previous Updates</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 ml-1 transition-transform ${showExistingUpdates ? 'transform rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showExistingUpdates && (
            <div className="mt-4 space-y-4">
              {existingUpdates.map((update, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-medium text-gray-900">{update.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(update.date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 whitespace-pre-line">{update.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

UpdateBlog.propTypes = {
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  existingUpdates: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
      date: PropTypes.string.isRequired
    })
  )
};