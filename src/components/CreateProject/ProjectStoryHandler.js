import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import ProjectStory from './ProjectStory';
import projectService from 'src/services/projectService';

const ProjectStoryHandler = ({ projectId: propProjectId, initialStoryData, updateFormData }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storyData, setStoryData] = useState(initialStoryData || { story: '', risks: '' });
  const [storyId, setStoryId] = useState(null);
  const [savingStatus, setSavingStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [publishStatus, setPublishStatus] = useState('DRAFT'); // 'DRAFT' or 'PUBLISHED'
  const [fetchAttempted, setFetchAttempted] = useState(false); // Track if we've attempted to fetch
  const router = useRouter();

  // Get project ID either from props or URL
  useEffect(() => {
    // Skip if we've already fetched or encountered an error
    if (fetchAttempted) return;

    if (initialStoryData && initialStoryData.story) {
      console.log('Using provided initialStoryData:', initialStoryData);
      setStoryData(initialStoryData);
      setLoading(false);
      setFetchAttempted(true);
      return;
    }

    // First priority: use the project ID passed as a prop
    if (propProjectId) {
      setFetchAttempted(true);
      fetchStoryData(propProjectId);
      return;
    }

    // Second priority: try to get ID from URL if component is ready
    if (router.isReady) {
      const { id } = router.query;
      if (id) {
        setFetchAttempted(true);
        fetchStoryData(id);
        return;
      }

      // If router is ready but no ID exists, set error
      if (!loading) return; // Prevent setting error multiple times

      console.error('No project ID available from props or URL');
      setError('Project ID is missing. Cannot load story data.');
      setLoading(false);
      setFetchAttempted(true);
    }
  }, [router.isReady, router.query, propProjectId, loading, fetchAttempted]);


  // Parse API blocks format to HTML for the editor
  const parseBlocksToHtml = (blocks) => {
    if (!blocks || !Array.isArray(blocks)) {
      return '';
    }

    // Sort blocks by order property
    const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

    let htmlContent = '';

    sortedBlocks.forEach(block => {
      const { type, content, metadata = {} } = block;

      // Parse metadata from string if it's a string
      let parsedMetadata = metadata;
      if (typeof metadata === 'string') {
        try {
          parsedMetadata = JSON.parse(metadata);
        } catch (e) {
          console.warn('Failed to parse metadata:', e);
          parsedMetadata = {};
        }
      }

      switch (type) {
        case 'TEXT':
          // Check if content already has HTML tags
          if (content.includes('<') && content.includes('>')) {
            htmlContent += content; // Already HTML content
          } else {
            // Apply styles from metadata if available
            const textStyles = [];
            if (parsedMetadata.additionalProp1?.color) {
              textStyles.push(`color: ${parsedMetadata.additionalProp1.color}`);
            }
            if (parsedMetadata.additionalProp1?.align) {
              textStyles.push(`text-align: ${parsedMetadata.additionalProp1.align}`);
            }
            const styleAttr = textStyles.length > 0 ? ` style="${textStyles.join(';')}"` : '';
            htmlContent += `<p${styleAttr}>${content}</p>`;
          }
          break;

        case 'HEADING':
          const level = parsedMetadata.additionalProp1?.level || 1;
          const headingStyles = [];
          if (parsedMetadata.additionalProp1?.color) {
            headingStyles.push(`color: ${parsedMetadata.additionalProp1.color}`);
          }
          if (parsedMetadata.additionalProp1?.align) {
            headingStyles.push(`text-align: ${parsedMetadata.additionalProp1.align}`);
          }
          const headingStyleAttr = headingStyles.length > 0 ? ` style="${headingStyles.join(';')}"` : '';
          htmlContent += `<h${level}${headingStyleAttr}>${content}</h${level}>`;
          break;

        case 'IMAGE':
          const imageStyles = [];
          if (parsedMetadata.additionalProp1?.width) {
            imageStyles.push(`width: ${parsedMetadata.additionalProp1.width}`);
          }
          if (parsedMetadata.additionalProp1?.float) {
            imageStyles.push(`float: ${parsedMetadata.additionalProp1.float}`);
            if (parsedMetadata.additionalProp1.float === 'left') {
              imageStyles.push('margin-right: 1rem');
            } else if (parsedMetadata.additionalProp1.float === 'right') {
              imageStyles.push('margin-left: 1rem');
            }
          }
          const imageStyleAttr = imageStyles.length > 0 ? ` style="${imageStyles.join(';')}"` : '';
          const imageClass = parsedMetadata.additionalProp1?.class || 'story-image';
          htmlContent += `<img src="${content}" alt="${parsedMetadata.additionalProp1?.alt || 'Project image'}" class="${imageClass}"${imageStyleAttr}>`;
          break;

        case 'VIDEO':
          htmlContent += `<div data-youtube-video src="${content}" class="ProseMirror-youtube-iframe"></div>`;
          break;

        default:
          htmlContent += content;
      }
    });

    return htmlContent;
  };

  // Parse HTML to blocks format for the API
  const parseHtmlToBlocks = (html) => {
    if (!html) return [];

    // Create a temporary element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const blocks = [];
    let order = 0;

    // Process each child element
    Array.from(tempDiv.childNodes).forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        const tagName = element.tagName.toLowerCase();

        // Handle different element types
        if (tagName === 'img') {
          // Image - ensure it's processed as an IMAGE type
          console.log('Converting image element to IMAGE block type');

          // Strip off query parameters from image URL if they exist
          // Some CDNs add timestamp or other params that can cause issues
          let cleanImageUrl = element.src;
          try {
            const url = new URL(element.src);
            cleanImageUrl = url.origin + url.pathname;
          } catch (e) {
            // If URL parsing fails, use the original src
            console.warn('Failed to parse image URL:', e);
          }

          blocks.push({
            type: 'IMAGE',  // Ensure this is capitalized as 'IMAGE'
            content: cleanImageUrl,
            order: order++,
            metadata: JSON.stringify({
              additionalProp1: {
                width: element.style.width || null,
                float: element.style.float || null,
                class: element.className || 'story-image',
                alt: element.alt || 'Project image'
              },
              additionalProp2: {},
              additionalProp3: {}
            })
          });
        } else if (tagName.startsWith('h') && tagName.length === 2) {
          // Heading
          const level = parseInt(tagName[1]);
          blocks.push({
            type: 'HEADING',
            content: element.textContent,
            order: order++,
            metadata: JSON.stringify({
              additionalProp1: {
                level: level,
                align: element.style.textAlign || 'left',
                color: element.style.color || null
              },
              additionalProp2: {},
              additionalProp3: {}
            })
          });
        } else if (tagName === 'p') {
          // Text paragraph
          blocks.push({
            type: 'TEXT',
            content: element.innerHTML,
            order: order++,
            metadata: JSON.stringify({
              additionalProp1: {
                align: element.style.textAlign || 'left',
                color: element.style.color || null
              },
              additionalProp2: {},
              additionalProp3: {}
            })
          });
        } else if (element.querySelector('iframe')) {
          // YouTube video
          const iframe = element.querySelector('iframe');
          if (iframe && iframe.src) {
            blocks.push({
              type: 'VIDEO',
              content: iframe.src,
              order: order++,
              metadata: JSON.stringify({
                additionalProp1: {
                  width: iframe.width || '640',
                  height: iframe.height || '480'
                },
                additionalProp2: {},
                additionalProp3: {}
              })
            });
          }
        } else if (tagName === 'div' && element.dataset.youtubeVideo) {
          // YouTube video placeholder
          blocks.push({
            type: 'VIDEO',
            content: element.getAttribute('src') || '',
            order: order++,
            metadata: JSON.stringify({
              additionalProp1: {
                width: '640',
                height: '480'
              },
              additionalProp2: {},
              additionalProp3: {}
            })
          });
        } else if (tagName === 'ul' || tagName === 'ol') {
          // Handle lists as a single TEXT block with HTML content
          blocks.push({
            type: 'TEXT',
            content: element.outerHTML,
            order: order++,
            metadata: JSON.stringify({
              additionalProp1: {
                listType: tagName === 'ul' ? 'bullet' : 'ordered'
              },
              additionalProp2: {},
              additionalProp3: {}
            })
          });
        } else if (tagName === 'blockquote') {
          // Handle blockquote as a TEXT block with special styling
          blocks.push({
            type: 'TEXT',
            content: element.outerHTML,
            order: order++,
            metadata: JSON.stringify({
              additionalProp1: {
                isQuote: true
              },
              additionalProp2: {},
              additionalProp3: {}
            })
          });
        } else {
          // Other elements - treat as TEXT
          blocks.push({
            type: 'TEXT',
            content: element.outerHTML,
            order: order++,
            metadata: JSON.stringify({
              additionalProp1: {},
              additionalProp2: {},
              additionalProp3: {}
            })
          });
        }
      }
    });

    return blocks;
  };

  // Load story data from API
  const fetchStoryData = async (projectId) => {
    try {
      setLoading(true);
      console.log('Fetching story data for project:', projectId);

      const response = await projectService.getProjectStoryByProjectId(projectId);
      console.log('Raw API response:', response);

      // The response structure might vary - handle both direct response and nested .data format
      // First check if response itself has the data directly
      const storyData = response.projectStoryId ? response : response.data;

      // Check if we have a valid response with story data
      if (storyData && storyData.blocks && Array.isArray(storyData.blocks)) {
        console.log('Story data found:', storyData);
        setStoryId(storyData.projectStoryId);
        setPublishStatus(storyData.status || 'DRAFT');

        // Process the blocks to separate story from risks section
        const blocks = storyData.blocks;

        // Find the index of "Risks and Challenges" heading
        let risksIndex = -1;
        blocks.forEach((block, index) => {
          if (block.type === 'HEADING' &&
            block.content &&
            block.content.toLowerCase().includes('risks and challenges')) {
            risksIndex = index;
          }
        });

        let storyBlocks = blocks;
        let riskBlocks = [];

        // If we found a risks section, separate the blocks
        if (risksIndex !== -1) {
          storyBlocks = blocks.slice(0, risksIndex);
          riskBlocks = blocks.slice(risksIndex);
        }

        // Convert blocks to HTML
        const storyHtml = parseBlocksToHtml(storyBlocks);
        const risksHtml = parseBlocksToHtml(riskBlocks);

        console.log('Parsed story HTML:', storyHtml.substring(0, 100) + '...');

        setStoryData({
          story: storyHtml,
          risks: risksHtml
        });
      } else {
        console.log('No story data found or invalid format, using defaults');
        // Create default content if no story exists
        setStoryData({
          story: '<h1>Project Story</h1><p>Tell your story here...</p>',
          risks: '<h1>Risks and Challenges</h1><p>Here we outline potential risks and challenges our project may face, and how we plan to address them.</p>'
        });
        setStoryId(null); // Ensure storyId is null for new stories
      }
      setError(null); // Clear any previous errors on successful fetch
    } catch (error) {
      console.error('Error fetching project story:', error);
      setError('Failed to load project story data');

      // Set default content even when there's an error so the editor is usable
      setStoryData({
        story: '<h1>Project Story</h1><p>Tell your story here...</p>',
        risks: '<h1>Risks and Challenges</h1><p>Here we outline potential risks and challenges our project may face, and how we plan to address them.</p>'
      });
      setStoryId(null);
    } finally {
      setLoading(false);
    }
  };

  // Create a new story for the project
  const createStory = useCallback(async (htmlContent) => {
    const currentProjectId = propProjectId || router.query.id;
    if (!currentProjectId) {
      console.error('No project ID available for story creation');
      setSavingStatus('error');
      return false;
    }

    try {
      setSavingStatus('saving');

      // Convert HTML content to blocks format
      const storyBlocks = parseHtmlToBlocks(htmlContent);

      // Prepare API payload
      const payload = {
        blocks: storyBlocks,
        status: "DRAFT"
      };

      console.log('Creating new story');

      const result = await projectService.createProjectStory(currentProjectId, payload);

      if (result && result.data && result.data.projectStoryId) {
        console.log('New story created with ID:', result.data.projectStoryId);
        setStoryId(result.data.projectStoryId);
        setPublishStatus(result.data.status || 'DRAFT');
        setSavingStatus('saved');

        // Show saved status briefly and then reset
        setTimeout(() => {
          if (setSavingStatus) { // Check if component is still mounted
            setSavingStatus('idle');
          }
        }, 2000);

        return true;
      } else {
        console.error('No storyId returned from create operation');
        setSavingStatus('error');
        return false;
      }
    } catch (error) {
      console.error('Error creating story:', error);
      setSavingStatus('error');
      return false;
    }
  }, [propProjectId, router.query.id]);

  // Update an existing story
  const updateStory = useCallback(async (htmlContent) => {
    if (!storyId) {
      console.error('Cannot update: Missing story ID');
      setSavingStatus('error');
      return false;
    }

    try {
      setSavingStatus('saving');

      // Convert HTML content to blocks format
      const storyBlocks = parseHtmlToBlocks(htmlContent);

      // Prepare API payload
      const payload = {
        blocks: storyBlocks,
        status: publishStatus // Maintain current publish status
      };

      console.log('Updating story with ID:', storyId);

      await projectService.updateProjectStory(storyId, payload);

      console.log('Story updated successfully');
      setSavingStatus('saved');

      // Show saved status briefly and then reset
      setTimeout(() => {
        if (setSavingStatus) { // Check if component is still mounted
          setSavingStatus('idle');
        }
      }, 2000);

      return true;
    } catch (error) {
      console.error('Error updating story:', error);
      setSavingStatus('error');
      return false;
    }
  }, [storyId, publishStatus]);

  useEffect(() => {
    if (storyData.story && storyData.risks) {
      if (updateFormData) {
        updateFormData({
          story: storyData.story,
          risks: storyData.risks
        });
      }
    }
  }, [storyData, updateFormData]);

  // Handler for story content change
  const handleContentChange = useCallback((data) => {
    console.log('Story content changed, updating state and parent form data');
    setStoryData(data);

    // Call updateFormData if it's provided as a prop
    if (updateFormData && typeof updateFormData === 'function') {
      updateFormData(data);
    } else {
      console.warn('updateFormData function not provided to ProjectStoryHandler');
    }
  }, [updateFormData]);

  useEffect(() => {
    if (storyData.story || storyData.risks) {
      if (updateFormData && typeof updateFormData === 'function') {
        console.log('Notifying parent component of story data change');
        updateFormData({
          story: storyData.story || '',
          risks: storyData.risks || ''
        });
      }
    }
  }, [storyData, updateFormData]);

  // Handle manual saving of the story
  const handleSaveStory = useCallback(async () => {
    if (storyId) {
      // Update existing story
      return await updateStory(storyData.story);
    } else {
      // Create new story
      return await createStory(storyData.story);
    }
  }, [storyId, storyData.story, updateStory, createStory]);

  // Handle publishing the story
  const handlePublishStory = useCallback(async () => {
    if (!storyId) {
      // Create story first if it doesn't exist
      const created = await createStory(storyData.story);
      if (!created) return false;
    }

    try {
      setSavingStatus('saving');

      // Convert HTML content to blocks format
      const storyBlocks = parseHtmlToBlocks(storyData.story);

      // Prepare API payload with PUBLISHED status
      const payload = {
        blocks: storyBlocks,
        status: "PUBLISHED"
      };

      console.log('Publishing story with ID:', storyId);

      await projectService.updateProjectStory(storyId, payload);

      console.log('Story published successfully');
      setPublishStatus('PUBLISHED');
      setSavingStatus('saved');

      // Show saved status briefly and then reset
      setTimeout(() => {
        if (setSavingStatus) { // Check if component is still mounted
          setSavingStatus('idle');
        }
      }, 2000);

      return true;
    } catch (error) {
      console.error('Error publishing story:', error);
      setSavingStatus('error');
      return false;
    }
  }, [storyId, storyData.story, createStory]);

  // Handle auto-save timer
  useEffect(() => {
    let autosaveTimer;

    // Set up auto-save if content has changed and we're not currently in a save operation
    if (storyData.story && savingStatus === 'idle') {
      autosaveTimer = setTimeout(async () => {
        if (storyId) {
          // Only auto-save if we already have a story ID
          await updateStory(storyData.story);
        }
      }, 30000); // Auto-save after 30 seconds of inactivity
    }

    return () => {
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
      }
    };
  }, [storyData.story, storyId, savingStatus, updateStory]);

  // Handle image uploads
  const handleImageUpload = useCallback(async (file) => {
    // Use project ID from props or URL
    const currentProjectId = propProjectId || router.query.id;

    if (!storyId) {
      console.log('No story ID available - creating one before image upload');

      // If no story ID yet, create a story first with default content
      if (currentProjectId) {
        try {
          const defaultBlocks = [
            {
              type: "TEXT",
              content: "Project story",
              order: 0,
              metadata: {
                additionalProp1: {},
                additionalProp2: {},
                additionalProp3: {}
              }
            }
          ];

          const defaultPayload = {
            blocks: defaultBlocks,
            status: "DRAFT"
          };

          console.log('Creating default story before image upload');
          const result = await projectService.createProjectStory(currentProjectId, defaultPayload);

          if (result && result.data && result.data.projectStoryId) {
            console.log('Successfully created story with ID:', result.data.projectStoryId);
            setStoryId(result.data.projectStoryId);
            setPublishStatus(result.data.status || 'DRAFT');
            // Now try to upload with the new story ID
            return await uploadImage(file, result.data.projectStoryId);
          } else {
            console.error('Failed to get story ID from create operation');
            return null;
          }
        } catch (createError) {
          console.error('Error creating story for image upload:', createError);
          return null;
        }
      } else {
        console.error('No project ID available for story creation');
        return null;
      }
    }

    return await uploadImage(file, storyId);
  }, [storyId, router.query.id, propProjectId]);

  const uploadImage = async (file, targetStoryId) => {
    try {
      console.log('Uploading image for story ID:', targetStoryId);
      const result = await projectService.uploadStoryImage(targetStoryId, file);

      // Return the image URL for the editor
      if (result && result.data && result.data.url) {
        return result.data.url;
      }

      // Some APIs include the URL directly or in a nested property
      if (typeof result === 'string' && result.startsWith('http')) {
        return result;
      }

      // Handle potential nested URL in response
      if (result && result.data && result.data.imageUrl) {
        return result.data.imageUrl;
      }

      console.error('No image URL found in upload response');
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // Handle retrying the fetch
  const handleRetry = () => {
    setError(null);
    setFetchAttempted(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <div className="ml-3">Loading project story...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <div className="mt-3">
          <button
            onClick={handleRetry}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Retry Loading
          </button>
          <span className="ml-3 text-sm">
            Or continue editing with default content (changes will be saved when network is restored)
          </span>
        </div>
      </div>
    );
  }

  // Status badge based on current saving status
  const StatusBadge = () => {
    switch (savingStatus) {
      case 'saving':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">
            <svg className="w-3 h-3 mr-1 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          </span>
        );
      case 'saved':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-md">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Saved
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-md">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            {storyId ? 'Ready' : 'Not saved yet'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Story controls */}
      <div className="flex justify-between items-center bg-white p-3 border border-gray-200 rounded-md shadow-sm">
        <div className="flex items-center space-x-2">
          <StatusBadge />
          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${publishStatus === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
            {publishStatus === 'PUBLISHED' ? 'Published' : 'Draft'}
          </span>
          {storyId && (
            <span className="text-xs text-gray-500">
              ID: {storyId}
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSaveStory}
            disabled={savingStatus === 'saving'}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {storyId ? 'Save Changes' : 'Create Story'}
          </button>
          <button
            onClick={handlePublishStory}
            disabled={savingStatus === 'saving'}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {publishStatus === 'PUBLISHED' ? 'Update Published Story' : 'Publish Story'}
          </button>
        </div>
      </div>

      {/* The actual story editor */}
      <ProjectStory
        formData={storyData.story}
        risksData={storyData.risks}
        updateFormData={handleContentChange}
        uploadImage={handleImageUpload}
      />
    </div>
  );
};

ProjectStoryHandler.propTypes = {
  projectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  initialStoryData: PropTypes.object,
  updateFormData: PropTypes.func
};

ProjectStoryHandler.defaultProps = {
  initialStoryData: {
    story: '',
    risks: ''
  }
};

export default ProjectStoryHandler;