import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import updatePostService from 'src/services/updatePostService';

export default function UpdateBlog({ onSave, onCancel, projectId }) {
  const [title, setTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExistingUpdates, setShowExistingUpdates] = useState(true);
  const [images, setImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [existingUpdates, setExistingUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUpdateId, setCurrentUpdateId] = useState(null);
  const fileInputRef = useRef(null);
  const [existingImageUrls, setExistingImageUrls] = useState([]); // Track existing images separately

  useEffect(() => {
    if (projectId) {
      fetchUpdates();
    }
  }, [projectId]);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const response = await updatePostService.getUpdatePostByProjectId(projectId);
      if (response && response.data) {
        setExistingUpdates(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

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
        setImagePreviewUrls(prevUrls => [...prevUrls, e.target.result]);
      };
      reader.readAsDataURL(file);
      newImages.push(file);
    });

    setImages(prevImages => [...prevImages, ...newImages]);
  };

  const uploadImages = async (postId) => {
    if (!postId) {
      console.error('Cannot upload images: Invalid post ID');
      return;
    }

    if (images.length === 0) {
      console.log('No new image to upload');
      return;
    }

    console.log(`Uploading ${images.length} images for post ID: ${postId}`);
    setUploadingImages(true);

    try {
      for (const image of images) {
        await updatePostService.uploadImage(postId, image);
      }
      console.log('Image upload completed successfully');
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    // Check if we're removing an existing image or a new one
    if (index < existingImageUrls.length) {
      // This is an existing image
      setExistingImageUrls(prevUrls => {
        const newUrls = [...prevUrls];
        newUrls.splice(index, 1);
        return newUrls;
      });

      // Also remove from preview URLs
      setImagePreviewUrls(prevUrls => {
        const newUrls = [...prevUrls];
        newUrls.splice(index, 1);
        return newUrls;
      });
    } else {
      // This is a new image - adjust index for the images array
      const imageIndex = index - existingImageUrls.length;

      setImages(prevImages => {
        const newImages = [...prevImages];
        newImages.splice(imageIndex, 1);
        return newImages;
      });

      // Also remove from preview URLs
      setImagePreviewUrls(prevUrls => {
        const newUrls = [...prevUrls];
        newUrls.splice(index, 1);
        return newUrls;
      });
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }

    // Prevent duplicate submissions
    if (isSubmitting || uploadingImages) {
      console.log('Submission already in progress, ignoring duplicate request');
      return;
    }

    // Validate inputs
    if (!title.trim() || !postContent.trim()) {
      console.log('Title or content is empty, aborting submission');
      return;
    }

    // Determine if we're creating or updating
    const isUpdating = editMode && currentUpdateId;

    setIsSubmitting(true);
    console.log(`${isUpdating ? 'Updating' : 'Creating'} blog post...`);

    try {
      const update = {
        title: title.trim(),
        postContent: postContent.trim()
      };

      let response;
      let postId;

      if (isUpdating) {
        // Update existing post
        console.log(`Updating post with ID: ${currentUpdateId}`);
        response = await updatePostService.updateUpdatePost(currentUpdateId, update);
        postId = currentUpdateId;
      } else {
        // Create new post
        console.log(`Creating new post for project: ${projectId}`);
        response = await updatePostService.createUpdatePost(projectId, update);
        postId = response.data?.projectUpdatePostId;

        if (!postId) {
          throw new Error('Failed to get post ID from response');
        }
      }

      // Upload images if any
      if (images.length > 0 && postId) {
        console.log(`Uploading ${images.length} images for post ID: ${postId}`);
        await uploadImages(postId);
      }

      // Refresh updates list
      await fetchUpdates();

      // Reset form state
      resetForm();

      // IMPORTANT FIX: Pass response to onSave without triggering another API call
      if (onSave) {
        // Don't await here - this prevents onSave from blocking our completion
        onSave({
          success: true,
          data: response.data || response
        });
      }

    } catch (error) {
      console.error('Error saving update:', error);
      alert(`Failed to save update. ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setPostContent('');
    setImages([]);
    setImagePreviewUrls([]);
    setExistingImageUrls([]);
    setEditMode(false);
    setCurrentUpdateId(null);
  };

  const handleEdit = (update) => {
    setEditMode(true);
    setCurrentUpdateId(update.projectUpdatePostId);
    setTitle(update.title);
    setPostContent(update.postContent);

    // Reset new images
    setImages([]);

    // Process existing media
    if (update.postMedia) {
      const media = typeof update.postMedia === 'string'
        ? [update.postMedia]
        : Array.isArray(update.postMedia) ? update.postMedia : [];

      const filteredMedia = media.filter(Boolean);

      // Store existing images separately
      setExistingImageUrls(filteredMedia);

      // Show all images in preview
      setImagePreviewUrls(filteredMedia);
    } else {
      setExistingImageUrls([]);
      setImagePreviewUrls([]);
    }

    // Scroll to form
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleDelete = async (updateId) => {
    if (!window.confirm('Are you sure you want to delete this update?')) {
      return;
    }

    try {
      // Set submitting state to prevent duplicate calls
      setIsSubmitting(true);
      await updatePostService.deleteUpdatePost(updateId);
      await fetchUpdates();
    } catch (error) {
      console.error('Error deleting update:', error);
      alert('Failed to delete update. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel && onCancel();
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">
        {editMode ? 'Edit Project Update' : 'Post Project Update'}
      </h2>

      <form onSubmit={(e) => e.preventDefault()}>
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
            Image
          </label>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editMode ? 'Add New Image' : 'Add Image'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="hidden"
              required
            />
            <span className="text-sm text-gray-500">
              {images.length > 0 ? `${images.length} new image(s) selected` : 'No new images selected'}
            </span>
          </div>

          {/* Image previews */}
          {imagePreviewUrls.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {imagePreviewUrls.map((url, index) => {
                // Check if this is an existing image or a new one
                const isExistingImage = index < existingImageUrls.length;

                return (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="h-24 w-24 object-cover rounded border border-gray-300"
                    />
                    {/* Add delete button for ALL images */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-80 hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || uploadingImages || !title.trim() || !postContent.trim()}
            className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(isSubmitting || uploadingImages || !title.trim() || !postContent.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting || uploadingImages ? 'Saving...' : editMode ? 'Update' : 'Post Update'}
          </button>
        </div>
      </form>

      {/* Previous updates section - no changes */}
      <div className="mt-8 border-t pt-6">
        {/* Existing code for updates display - unchanged */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Project Updates</h3>
          <button
            type="button"
            onClick={() => setShowExistingUpdates(!showExistingUpdates)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <span>{showExistingUpdates ? 'Hide' : 'Show'} Updates</span>
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
        </div>

        {loading && (
          <div className="flex justify-center my-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {showExistingUpdates && !loading && (
          existingUpdates.length > 0 ? (
            <div className="space-y-6">
              {existingUpdates.map((update) => (
                <div key={update.projectUpdatePostId} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-900">{update.title}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(update)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit update"
                        type="button"
                        disabled={isSubmitting}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(update.projectUpdatePostId)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete update"
                        type="button"
                        disabled={isSubmitting}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-2">
                    {formatDate(update.createdAt)}
                    {update.updatedAt && update.updatedAt !== update.createdAt && (
                      <span className="ml-2 text-gray-400">(edited)</span>
                    )}
                  </p>

                  <div className="text-gray-700 whitespace-pre-line mb-3">
                    {update.postContent}
                  </div>

                  {update.postMedia && (
                    <div className="mt-3">
                      <img
                        src={update.postMedia}
                        alt="Update image"
                        className="max-h-48 rounded border border-gray-300"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No updates posted yet. Be the first to share project progress!
            </div>
          )
        )}
      </div>
    </div>
  );
}

UpdateBlog.propTypes = {
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};