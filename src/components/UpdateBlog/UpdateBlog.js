import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import updatePostService from 'src/services/updatePostService';

/**
 * Component for posting updates to a project
 * @param {Object} props - Component props
 * @param {Function} props.onSave - Callback when update is saved
 * @param {Function} props.onCancel - Callback when update is canceled
 * @param {Array} props.existingUpdates - Array of existing updates (optional)
 * @param {String} props.projectId - Project ID for the update
 * @returns {JSX.Element} Update blog component
 */
export default function UpdateBlog({ onSave, onCancel, existingUpdates = [], projectId }) {
  const [title, setTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExistingUpdates, setShowExistingUpdates] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Preview images
    const newImagePreviewUrls = [];
    const newImages = [];

    files.forEach(file => {
      if (!file.type.match('image.*')) {
        alert('Please select only image files.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        newImagePreviewUrls.push(e.target.result);
        setImagePreviewUrls([...imagePreviewUrls, ...newImagePreviewUrls]);
      };
      reader.readAsDataURL(file);
      newImages.push(file);
    });

    setImages([...images, ...newImages]);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    const newPreviewUrls = [...imagePreviewUrls];
    newImages.splice(index, 1);
    newPreviewUrls.splice(index, 1);
    setImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
  };

  const uploadImages = async (postId) => {
    if (images.length === 0) return [];
    
    setUploadingImages(true);
    const imageUrls = [];
    
    try {
      for (const image of images) {
        const result = await updatePostService.uploadImage(postId, image);
        if (result && result.url) {
          imageUrls.push(result.url);
        }
      }
      return imageUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !postContent.trim()) {
      return;
    }

    if (!projectId) {
      alert('Project ID is missing. Cannot create update.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create update object with postContent instead of content
      const update = {
        title,
        postContent, // Use postContent instead of content
        date: new Date().toISOString(),
        images
      };
      
      // Call the save callback with projectId
      await onSave(update);
      
      // Reset form
      setTitle('');
      setPostContent('');
      setImages([]);
      setImagePreviewUrls([]);
    } catch (error) {
      console.error('Error saving update:', error);
      alert('Failed to save update. Please try again.');
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
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share details about your progress, milestones, or changes..."
            required
          />
        </div>

        {/* Image upload section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images (Optional)
          </label>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Images
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
            />
            <span className="text-sm text-gray-500">
              {images.length > 0 ? `${images.length} image(s) selected` : 'No images selected'}
            </span>
          </div>

          {/* Image previews */}
          {imagePreviewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={url} 
                    alt={`Preview ${index + 1}`} 
                    className="h-24 w-24 object-cover rounded border border-gray-300" 
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-80 hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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
            disabled={isSubmitting || uploadingImages || !title.trim() || !postContent.trim()}
            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              (isSubmitting || uploadingImages || !title.trim() || !postContent.trim()) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting || uploadingImages ? 'Posting...' : 'Post Update'}
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
                  {/* Display postContent if available, otherwise use content */}
                  <p className="text-gray-700 whitespace-pre-line">
                    {update.postContent || update.content}
                  </p>
                  
                  {/* Display images if available */}
                  {update.images && update.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {update.images.map((img, imgIndex) => (
                        <img 
                          key={imgIndex}
                          src={img.url || img}
                          alt={`Update image ${imgIndex + 1}`}
                          className="h-20 w-20 object-cover rounded border border-gray-300"
                        />
                      ))}
                    </div>
                  )}
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
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  existingUpdates: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      content: PropTypes.string,
      postContent: PropTypes.string,
      date: PropTypes.string.isRequired,
      images: PropTypes.array
    })
  )
};