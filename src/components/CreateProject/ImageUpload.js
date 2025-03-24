
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import projectService from 'src/services/projectService';

/**
 * Component for uploading project cover image
 * @param {Object} props - Component props
 * @param {string|number} props.projectId - Project ID
 * @param {string} props.currentImage - Current image URL
 * @param {Function} props.onImageUpdate - Callback when image is updated
 * @returns {JSX.Element} Project image upload component
 */
export default function ImageUpload({ projectId, currentImage, onImageUpdate }) {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState(null);
    // Add a state to track if image was manually removed
    const [imageRemoved, setImageRemoved] = useState(false);

    // Modified effect to respect manual image removal
    useEffect(() => {
        console.log('ImageUpload - currentImage changed:', currentImage);
        console.log('Image removed state:', imageRemoved);

        // Only update preview if image wasn't manually removed and currentImage exists
        if (currentImage && !imageRemoved) {
            console.log('Setting previewUrl to currentImage:', currentImage);
            setPreviewUrl(currentImage);

            // Force an image reload to ensure the browser doesn't use a cached version
            if (typeof window !== 'undefined') {
                const img = new Image();
                img.src = currentImage + '?t=' + new Date().getTime();
                img.onload = () => console.log('Image successfully loaded:', currentImage);
                img.onerror = (e) => console.error('Image failed to load:', currentImage, e);
            }
        } else {
            console.log('No currentImage provided or image was manually removed');
        }
    }, [currentImage, imageRemoved]);

    // Just before the return statement, add this debug log
    console.log('ImageUpload render state:', {
        projectId,
        currentImage,
        previewUrl,
        uploading,
        error,
        imageRemoved
    });

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        console.log('File selected:', file);

        if (!file) {
            console.log('No file selected');
            return;
        }

        // Reset the imageRemoved flag when a new image is selected
        setImageRemoved(false);

        // Validate file is an image and not too large
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (png, jpg, jpeg, gif)');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('Image must be less than 10MB');
            return;
        }

        // Clear previous error
        setError(null);

        // Create preview URL and handle any existing preview URL
        if (previewUrl && previewUrl.startsWith('blob:')) {
            try {
                URL.revokeObjectURL(previewUrl);
            } catch (e) {
                console.error('Failed to revoke object URL:', e);
            }
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload file if project ID is available
        if (projectId) {
            try {
                setUploading(true);
                const result = await projectService.uploadProjectImage(projectId, file);

                console.log('Image upload result:', result);

                // For your specific response format where success is indicated by status: 200
                if (result && result.status === 200) {
                    // If the API doesn't return the URL directly, we need to fetch the project details
                    // to get the updated image URL or construct it based on your API structure
                    try {
                        // Get the latest project data which should include the updated image URL
                        const projectDetails = await projectService.getProjectById(projectId);
                        console.log('Updated project details:', projectDetails);

                        // Extract image URL from project details - handle both data wrapper and direct object format
                        const projectData = projectDetails.data || projectDetails;
                        const imageUrl = projectData.projectImage || projectData.image;

                        if (imageUrl) {
                            // Use the server URL in both state and parent component
                            setPreviewUrl(imageUrl);
                            if (onImageUpdate) {
                                onImageUpdate(imageUrl);
                            }
                        } else {
                            // If image URL is not found in project details, keep using the local preview
                            if (onImageUpdate) {
                                // Pass a special object to indicate temporary local preview
                                onImageUpdate({
                                    tempUrl: previewUrl,
                                    pendingServerUpdate: true,
                                    message: 'Image uploaded successfully but URL not yet available'
                                });
                            }
                            console.warn('Image uploaded but URL not available in project details');
                        }
                    } catch (fetchErr) {
                        console.error('Error fetching updated project details:', fetchErr);
                        // Even if fetching details fails, the upload was successful
                        if (onImageUpdate) {
                            onImageUpdate({
                                tempUrl: previewUrl,
                                pendingServerUpdate: true,
                                message: 'Image uploaded successfully but URL not yet available'
                            });
                        }
                    }
                } else {
                    // Try to extract any URL if available in the response
                    let imageUrl = null;
                    if (typeof result === 'string' && result.startsWith('http')) {
                        imageUrl = result;
                    } else if (result && result.url) {
                        imageUrl = result.url;
                    } else if (result && result.imageUrl) {
                        imageUrl = result.imageUrl;
                    } else if (result && result.data && result.data.url) {
                        imageUrl = result.data.url;
                    } else if (result && result.data && result.data.imageUrl) {
                        imageUrl = result.data.imageUrl;
                    }

                    if (imageUrl) {
                        // Notify parent component
                        setPreviewUrl(imageUrl);
                        if (onImageUpdate) {
                            onImageUpdate(imageUrl);
                        }
                    } else if (result && result.status === 200) {
                        // Success response but no URL - use the preview temporarily
                        if (onImageUpdate) {
                            onImageUpdate({
                                tempUrl: previewUrl,
                                pendingServerUpdate: true,
                                message: 'Image uploaded successfully but URL not yet available'
                            });
                        }
                    } else {
                        setError('Failed to get image URL from server response');
                        console.error('Unexpected response format:', result);
                    }
                }
            } catch (err) {
                console.error('Error uploading project image:', err);
                setError(err.message || 'Failed to upload image');
            } finally {
                setUploading(false);
            }
        } else {
            // If no projectId yet, just update the preview and notify parent
            if (onImageUpdate) {
                // Pass the file object instead of URL since we can't upload yet
                onImageUpdate({ file, previewUrl: reader.result, isLocalPreview: true });
            }
        }
    };

    // Debugging logs to help identify issues
    useEffect(() => {
        console.log('ImageUpload mounted with currentImage:', currentImage);
        console.log('Current previewUrl state:', previewUrl);
        console.log('Image removed state:', imageRemoved);
    }, [currentImage, previewUrl, imageRemoved]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Project Cover Image
                </label>
            </div>

            {/* Image preview */}
            {previewUrl ? (
                <div className="relative">
                    {/* Add a fallback system in case the main image fails */}
                    {previewUrl.includes('cloudinary.com') ? (
                        <div className="relative w-full h-48">
                            <img
                                src={`${previewUrl}?t=${new Date().getTime()}`}
                                alt="Project cover"
                                className="w-full h-full object-cover rounded-lg"
                                crossOrigin="anonymous"
                                onLoad={() => console.log('Cloudinary image loaded successfully')}
                                onError={(e) => {
                                    console.error('Cloudinary image failed to load, trying proxy:', previewUrl);
                                    e.target.onerror = null;

                                    // Create an image element to test if CORS is the issue
                                    const testImg = document.createElement('img');
                                    testImg.src = previewUrl;
                                    testImg.style.display = 'none';
                                    document.body.appendChild(testImg);

                                    setTimeout(() => {
                                        document.body.removeChild(testImg);
                                        // Set a fallback image
                                        e.target.src = 'https://via.placeholder.com/600x300?text=Image+Not+Available';
                                    }, 2000);
                                }}
                            />
                        </div>
                    ) : previewUrl.startsWith('data:') ? (
                        // For data URLs (local file preview)
                        <img
                            src={previewUrl}
                            alt="Project cover preview"
                            className="w-full h-48 object-cover rounded-lg"
                        />
                    ) : (
                        // For other URLs
                        <img
                            src={previewUrl}
                            alt="Project cover"
                            className="w-full h-48 object-cover rounded-lg"
                            onError={(e) => {
                                console.error('Image failed to load:', previewUrl);
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/600x300?text=Image+Error';
                            }}
                        />
                    )}

                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                        {previewUrl && previewUrl.length > 50
                            ? previewUrl.substring(0, 47) + '...'
                            : previewUrl}
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            console.log('Image removal requested');
                            // Clear local state
                            setPreviewUrl(null);
                            setError(null);
                            // Set the imageRemoved flag to true to prevent auto-reloading
                            setImageRemoved(true);

                            const fileInput = document.getElementById('project-image-upload');
                            if (fileInput) fileInput.value = '';

                            // Notify parent component with a slight delay to ensure state is updated
                            setTimeout(() => {
                                if (onImageUpdate) {
                                    console.log('Notifying parent component of image removal');
                                    onImageUpdate(null);
                                }
                            }, 50);
                        }}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full"
                        title="Remove image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="flex justify-center items-center border-2 border-dashed border-gray-300 rounded-lg h-48">
                    <div className="space-y-1 text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                        >
                            <path
                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                            <label
                                htmlFor="project-image-upload"
                                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                                <span>Upload an image</span>
                                <input
                                    id="project-image-upload"
                                    name="project-image-upload"
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={handleImageChange}
                                    disabled={uploading}
                                />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                            PNG, JPG, GIF up to 10MB
                        </p>
                    </div>
                </div>
            )}

            {/* Upload indicator */}
            {uploading && (
                <div className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-gray-700">Uploading image...</span>
                </div>
            )}

            {/* Success message after upload */}
            {!uploading && error === null && previewUrl && (
                <div className="flex items-center justify-center text-green-600">
                    <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Image uploaded successfully</span>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Help text */}
            <p className="text-sm text-gray-500">
                A high-quality cover image helps your project stand out. Ideal dimensions are 1200×675 pixels.
            </p>
        </div>
    );
}

ImageUpload.propTypes = {
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currentImage: PropTypes.string,
    onImageUpdate: PropTypes.func
};

ImageUpload.defaultProps = {
    currentImage: null
};
