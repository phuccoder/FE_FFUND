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


  // Parse API blocks format to HTML for the editor - enhancing video handling
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
          // Add a div wrapper with data-type attribute to ensure proper parsing later
          htmlContent += `<div class="image-container" data-type="IMAGE"><img src="${content}" alt="${parsedMetadata.additionalProp1?.alt || 'Project image'}" class="${imageClass}"${imageStyleAttr} data-type="IMAGE"></div>`;
          break;

        case 'VIDEO':
          // Parse metadata if it's a string
          let videoMetadata = {};
          if (typeof parsedMetadata === 'string') {
            try {
              videoMetadata = JSON.parse(parsedMetadata);
            } catch (e) {
              console.warn('Failed to parse video metadata:', e);
              // Provide default values
              videoMetadata = {
                additionalProp1: {
                  width: "560px",
                  height: "315px",
                  autoplay: false,
                  controls: true
                }
              };
            }
          } else {
            videoMetadata = parsedMetadata;
          }

          // Extract dimensions and attributes from metadata
          const width = videoMetadata.additionalProp1?.width || '560px';
          const height = videoMetadata.additionalProp1?.height || '315px';
          const autoplay = videoMetadata.additionalProp1?.autoplay ? 1 : 0;
          const controls = videoMetadata.additionalProp1?.controls !== false ? 1 : 0;

          // Ensure content is a clean YouTube URL
          let youtubeUrl = content;
          if (!youtubeUrl.includes('youtube.com/embed/') && youtubeUrl.includes('youtube.com')) {
            try {
              const url = new URL(youtubeUrl);
              const videoId = url.searchParams.get('v');
              if (videoId) {
                youtubeUrl = `https://www.youtube.com/embed/${videoId}`;
              }
            } catch (e) {
              console.warn('Failed to parse YouTube URL:', e);
            }
          }

          // Add parameters for controls and autoplay if needed
          const embedUrl = autoplay || controls
            ? `${youtubeUrl}${youtubeUrl.includes('?') ? '&' : '?'}controls=${controls}&autoplay=${autoplay}`
            : youtubeUrl;

          // Create the HTML for the video iframe with explicit data-type attribute
          htmlContent += `
          <div class="ProseMirror-youtube-iframe" data-youtube-video="true" data-type="VIDEO">
            <iframe 
              src="${embedUrl}"
              width="${width}" 
              height="${height}" 
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
              data-type="VIDEO"
            ></iframe>
          </div>`;
          break;

        default:
          htmlContent += content;
      }
    });

    return htmlContent;
  };

  // Improved parseHtmlToBlocks function

  const parseHtmlToBlocks = (html) => {
    if (!html) return [];

    // Create a temporary element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    console.log('Parsing HTML content with length:', html.length);

    const blocks = [];
    let order = 0;

    // Track node positions for precise ordering
    const nodePositions = new Map();

    // Map each node to its position in the document to maintain order
    const mapNodePositions = (container) => {
      let position = 0;
      const walk = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);

      let node;
      while (node = walk.nextNode()) {
        nodePositions.set(node, position++);
      }
    };

    mapNodePositions(tempDiv);

    // Function to check if a node is empty or just whitespace
    const isEmptyOrWhitespace = (node) => {
      if (!node.textContent || !node.textContent.trim()) return true;

      // Special case for paragraphs with just line breaks or non-breaking spaces
      if (node.tagName?.toLowerCase() === 'p') {
        const content = node.innerHTML.trim();
        return content === '<br>' || content === '&nbsp;' ||
          content === '<br/>' || content === '<br />' ||
          content === '' || !content;
      }

      return false;
    };

    // Clean up empty nodes first
    let nodesToRemove = [];
    Array.from(tempDiv.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && (!node.textContent || !node.textContent.trim())) {
        nodesToRemove.push(node);
      } else if (node.nodeType === Node.ELEMENT_NODE && isEmptyOrWhitespace(node)) {
        nodesToRemove.push(node);
      }
    });

    nodesToRemove.forEach(node => node.parentNode?.removeChild(node));

    // First, find and process YouTube iframes and video containers
    console.log('Looking for video elements in content...');

    // More inclusive selector to find all YouTube embeds
    const videoSelectors = [
      'iframe[src*="youtube"]',
      '.ProseMirror-youtube-iframe',
      '[data-youtube-video="true"]',
      '[data-type="VIDEO"]',
      'div:has(iframe[src*="youtube"])'
    ];

    const videoElements = Array.from(tempDiv.querySelectorAll(videoSelectors.join(',')));

    console.log(`Found ${videoElements.length} potential video elements`);

    // Process all video elements
    videoElements.forEach(element => {
      // Get iframe src if available
      const iframe = element.tagName.toLowerCase() === 'iframe' ? element : element.querySelector('iframe');

      if (!iframe || !iframe.src) {
        console.log('Skipping video element without iframe or src:', element.outerHTML.substring(0, 100));
        return;
      }

      const srcUrl = iframe.src;
      console.log('Found video iframe with src:', srcUrl);

      // Check if it's a YouTube video
      if (srcUrl.includes('youtube.com/embed/')) {
        try {
          // Get the position for ordering
          const nodePosition = nodePositions.get(element) || nodePositions.get(iframe) || order++;

          // Extract clean YouTube URL without query parameters
          const cleanUrl = srcUrl.split('?')[0];

          // Create VIDEO block
          blocks.push({
            type: 'VIDEO',
            content: cleanUrl,
            order: nodePosition,
            metadata: {
              additionalProp1: {
                autoplay: srcUrl.includes('autoplay=1'),
                controls: !srcUrl.includes('controls=0'),
                width: iframe.getAttribute('width') || "560px",
                height: iframe.getAttribute('height') || "315px"
              }
            }
          });

          console.log('Added VIDEO block at position:', nodePosition, 'with URL:', cleanUrl);

          // Mark as processed
          element.setAttribute('data-processed', 'true');
          if (iframe.parentElement) {
            iframe.parentElement.setAttribute('data-processed', 'true');
          }
        } catch (err) {
          console.error('Error processing video element:', err);
        }
      } else {
        console.log('Not a YouTube embed URL:', srcUrl);
      }
    });

    // Process all image elements to ensure they're captured with proper positioning
    console.log('Looking for image elements in content...');
    const imageElements = Array.from(tempDiv.querySelectorAll('img, [data-type="IMAGE"], .image-container'));

    console.log(`Found ${imageElements.length} potential image elements`);

    imageElements.forEach(element => {
      const img = element.tagName.toLowerCase() === 'img' ? element : element.querySelector('img');
      if (!img || !img.src) return;

      // Get clean image URL
      let cleanImageUrl = img.src;
      try {
        const url = new URL(img.src);
        cleanImageUrl = url.origin + url.pathname;
        console.log('Found image with URL:', cleanImageUrl);
      } catch (e) {
        console.warn('Failed to parse image URL:', e);
      }

      // Get the position for ordering
      const nodePosition = nodePositions.get(element) || nodePositions.get(img) || order++;

      // Create IMAGE block
      blocks.push({
        type: 'IMAGE',
        content: cleanImageUrl,
        order: nodePosition,
        metadata: {
          additionalProp1: {
            width: img.style.width || "100%",
            float: img.style.float || null,
            class: img.className || 'story-image',
            alt: img.alt || 'Project image'
          }
        }
      });

      console.log('Added IMAGE block at position:', nodePosition);

      // Mark as processed
      element.setAttribute('data-processed', 'true');
      if (element.parentNode) {
        element.parentNode.setAttribute('data-processed', 'true');
      }
    });

    // Process YouTube URLs in paragraphs
    console.log('Looking for YouTube URLs in text...');
    Array.from(tempDiv.querySelectorAll('p')).forEach(p => {
      if (p.getAttribute('data-processed') === 'true') return;

      const content = p.textContent.trim();
      if (content && (
        content.includes('youtube.com/watch') ||
        content.includes('youtu.be/') ||
        content.includes('youtube.com/embed/')
      )) {
        try {
          let videoId = null;

          if (content.includes('youtube.com/watch')) {
            const url = new URL(content);
            videoId = url.searchParams.get('v');
          } else if (content.includes('youtu.be/')) {
            videoId = content.split('youtu.be/')[1].split(/[?&#]/)[0].trim();
          } else if (content.includes('youtube.com/embed/')) {
            videoId = content.split('youtube.com/embed/')[1].split(/[?&#]/)[0].trim();
          }

          if (videoId) {
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            const nodePosition = nodePositions.get(p) || order++;

            console.log('Found YouTube URL in text, converting to VIDEO block:', embedUrl);

            blocks.push({
              type: 'VIDEO',
              content: embedUrl,
              order: nodePosition,
              metadata: {
                additionalProp1: {
                  autoplay: false,
                  controls: true,
                  width: "560px",
                  height: "315px"
                }
              }
            });

            console.log('Added VIDEO block from URL at position:', nodePosition);

            // Mark as processed to avoid duplicate processing
            p.setAttribute('data-processed', 'true');
          }
        } catch (err) {
          console.error('Error processing YouTube URL:', err);
        }
      }
    });

    // Process all remaining elements in DOM order
    const walkNodes = (node) => {
      if (!node) return;

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;

        // Skip already processed elements
        if (element.getAttribute('data-processed') === 'true') {
          return;
        }

        const tagName = element.tagName.toLowerCase();
        const nodePosition = nodePositions.get(element) || order++;

        // Handle headings
        if (tagName.startsWith('h') && tagName.length === 2) {
          const level = parseInt(tagName[1]);
          const headingText = element.textContent.trim();
          if (headingText) {
            blocks.push({
              type: 'HEADING',
              content: headingText,
              order: nodePosition,
              metadata: {
                additionalProp1: {
                  level: level,
                  align: element.style.textAlign || 'left',
                  color: element.style.color || null
                }
              }
            });
            element.setAttribute('data-processed', 'true');
          }
        }

        // Handle paragraphs
        else if (tagName === 'p' && !element.querySelector('img')) {
          const paragraphContent = element.innerHTML.trim();

          if (paragraphContent &&
            paragraphContent !== '<br>' &&
            paragraphContent !== '&nbsp;') {
            blocks.push({
              type: 'TEXT',
              content: paragraphContent,
              order: nodePosition,
              metadata: {
                additionalProp1: {
                  align: element.style.textAlign || 'left',
                  color: element.style.color || null
                }
              }
            });
            element.setAttribute('data-processed', 'true');
          }
        }

        // Handle lists
        else if ((tagName === 'ul' || tagName === 'ol') && element.children.length > 0) {
          blocks.push({
            type: 'TEXT',
            content: element.outerHTML,
            order: nodePosition,
            metadata: {
              additionalProp1: {
                listType: tagName === 'ul' ? 'bullet' : 'ordered'
              }
            }
          });
          element.setAttribute('data-processed', 'true');
        }

        // Handle blockquotes
        else if (tagName === 'blockquote' && element.textContent.trim()) {
          blocks.push({
            type: 'TEXT',
            content: element.outerHTML,
            order: nodePosition,
            metadata: {
              additionalProp1: {
                isQuote: true
              }
            }
          });
          element.setAttribute('data-processed', 'true');
        }

        // Handle other elements with content
        else if (element.textContent.trim() &&
          !element.querySelector('[data-processed="true"]')) {
          blocks.push({
            type: 'TEXT',
            content: element.outerHTML,
            order: nodePosition,
            metadata: {
              additionalProp1: {}
            }
          });
          element.setAttribute('data-processed', 'true');
        }

        // Process children if not marked as processed
        if (element.getAttribute('data-processed') !== 'true') {
          Array.from(element.children).forEach(child => {
            walkNodes(child);
          });
        }
      }
    };

    // Process all top-level nodes
    Array.from(tempDiv.children).forEach(node => {
      if (!node.getAttribute('data-processed')) {
        walkNodes(node);
      }
    });

    // Sort the blocks by their order value
    blocks.sort((a, b) => a.order - b.order);

    // Reassign sequential order numbers
    blocks.forEach((block, index) => {
      block.order = index;
    });

    // Log the results
    console.log(`Parsing complete. Generated ${blocks.length} blocks`);
    console.log('Block types:', blocks.map(b => b.type).join(', '));

    // Debug video blocks specifically
    const videoBlocks = blocks.filter(b => b.type === 'VIDEO');
    if (videoBlocks.length > 0) {
      console.log(`Found ${videoBlocks.length} VIDEO blocks with content:`,
        videoBlocks.map(b => b.content));
    } else {
      console.warn('NO VIDEO BLOCKS FOUND in the parsed HTML content');
    }

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
  // Update an existing story - Fixed to properly handle all block types correctly
  const updateStory = useCallback(async (htmlContent) => {
    if (!storyId) {
      console.error('Cannot update: Missing story ID');
      setSavingStatus('error');
      return false;
    }

    try {
      setSavingStatus('saving');

      // Process HTML to properly handle YouTube URLs and embed them as video blocks
      const processedHtml = processYouTubeUrls(htmlContent);

      // First, fetch the existing story to get all blocks including IMAGE and VIDEO blocks
      console.log('Fetching current story data to preserve all blocks');
      const existingStory = await projectService.getProjectStoryById(storyId);

      // Extract existing blocks (handle different response formats)
      const existingBlocks = existingStory?.blocks || (existingStory?.data?.blocks || []);
      console.log('Existing blocks:', existingBlocks.map(b => `${b.type}:${b.storyBlockId}`).join(', '));

      // Create a map of existing blocks by content for matching new blocks to existing ones
      const contentToBlockIdMap = new Map();
      existingBlocks.forEach(block => {
        if (block.storyBlockId && block.content) {
          contentToBlockIdMap.set(block.content, block.storyBlockId);
        }
      });

      // Parse the new HTML content into blocks
      const newStoryBlocks = parseHtmlToBlocks(processedHtml);
      console.log('New blocks from HTML:', newStoryBlocks.map(b => b.type).join(', '));

      // Now add any IMAGE or VIDEO blocks from existing content that aren't in the new blocks
      const newContentSet = new Set(newStoryBlocks.map(b => b.content));

      // Get the media blocks that should be preserved
      const preservedMediaBlocks = existingBlocks.filter(block =>
        (block.type === 'IMAGE' || block.type === 'VIDEO') &&
        block.storyBlockId &&
        !newContentSet.has(block.content)
      );

      // Combine preserved media blocks with the new blocks
      const combinedBlocks = [...newStoryBlocks, ...preservedMediaBlocks];

      // Re-order all blocks
      const orderedBlocks = combinedBlocks.map((block, index) => ({
        ...block,
        order: index
      }));

      // Clean up metadata structure for API
      const cleanedBlocks = orderedBlocks.map(block => {
        const cleanBlock = { ...block };

        // Ensure metadata has correct structure for API
        if (!cleanBlock.metadata || typeof cleanBlock.metadata !== 'object') {
          cleanBlock.metadata = { additionalProp1: {} };
        } else if (typeof cleanBlock.metadata === 'string') {
          try {
            const parsed = JSON.parse(cleanBlock.metadata);
            cleanBlock.metadata = { additionalProp1: parsed };
          } catch (e) {
            console.warn('Failed to parse metadata string:', e);
            cleanBlock.metadata = { additionalProp1: {} };
          }
        } else if (!cleanBlock.metadata.additionalProp1) {
          cleanBlock.metadata = {
            additionalProp1: cleanBlock.metadata
          };
        }

        return cleanBlock;
      });

      // IMPORTANT: Remove storyBlockId, createdAt and updatedAt as the API doesn't accept these fields
      const apiReadyBlocks = cleanedBlocks.map(block => {
        // Start with a new object that only includes the fields the API expects
        return {
          type: block.type,
          content: block.content,
          order: block.order,
          metadata: block.metadata
        };
        // This ensures any other fields like storyBlockId are completely excluded
      });

      // Prepare API payload
      const payload = {
        blocks: apiReadyBlocks,
        status: publishStatus // Maintain current publish status
      };

      console.log('Updating story with ID:', storyId);
      console.log('Updated blocks count:', apiReadyBlocks.length);
      console.log('Block types being sent:', apiReadyBlocks.map(b => b.type).join(', '));

      // Log video and image blocks for debugging
      const videoBlocks = apiReadyBlocks.filter(b => b.type === 'VIDEO');
      const imageBlocks = apiReadyBlocks.filter(b => b.type === 'IMAGE');

      if (videoBlocks.length > 0) {
        console.log('Video blocks being sent:', videoBlocks.length);
        videoBlocks.forEach((block, i) => {
          console.log(`Video block ${i}:`, block.content.substring(0, 50));
        });
      }

      if (imageBlocks.length > 0) {
        console.log('Image blocks being sent:', imageBlocks.length);
        imageBlocks.forEach((block, i) => {
          console.log(`Image block ${i}:`, block.content.substring(0, 50));
        });
      }

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
  }, [storyId, publishStatus, parseHtmlToBlocks, processYouTubeUrls]);

  // Helper function to process YouTube URLs in HTML content
  // Enhanced processYouTubeUrls function

  const processYouTubeUrls = (html) => {
    if (!html) return html;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // First, find existing YouTube iframes and ensure they have proper attributes
    const existingIframes = Array.from(tempDiv.querySelectorAll('iframe[src*="youtube"]'));
    existingIframes.forEach(iframe => {
      if (!iframe.parentElement.classList.contains('ProseMirror-youtube-iframe')) {
        // Wrap iframe in proper container if needed
        const wrapper = document.createElement('div');
        wrapper.className = 'ProseMirror-youtube-iframe';
        wrapper.setAttribute('data-youtube-video', 'true');
        wrapper.setAttribute('data-type', 'VIDEO');

        // Clone iframe to avoid DOM manipulation issues
        const clonedIframe = iframe.cloneNode(true);
        clonedIframe.setAttribute('data-type', 'VIDEO');

        // Replace the original iframe
        wrapper.appendChild(clonedIframe);
        iframe.parentElement.replaceChild(wrapper, iframe);

        console.log('Enhanced existing YouTube iframe with proper attributes');
      }
    });

    // Find paragraphs containing only YouTube URLs
    const paragraphs = Array.from(tempDiv.querySelectorAll('p'));

    // Process paragraphs in reverse order to avoid DOM mutation issues
    for (let i = paragraphs.length - 1; i >= 0; i--) {
      const p = paragraphs[i];
      const content = p.textContent.trim();

      // Skip paragraphs that already contain video embeds or are inside video embeds
      if (p.querySelector('iframe') ||
        p.closest('[data-youtube-video="true"]') ||
        p.closest('.ProseMirror-youtube-iframe')) {
        continue;
      }

      // Check for YouTube URLs
      if (content && (
        content.includes('youtube.com/watch') ||
        content.includes('youtu.be/') ||
        content.includes('youtube.com/embed/')
      )) {
        try {
          let videoId = null;

          if (content.includes('youtube.com/watch')) {
            const url = new URL(content);
            videoId = url.searchParams.get('v');
          } else if (content.includes('youtu.be/')) {
            videoId = content.split('youtu.be/')[1].split(/[?&#]/)[0].trim();
          } else if (content.includes('youtube.com/embed/')) {
            videoId = content.split('youtube.com/embed/')[1].split(/[?&#]/)[0].trim();
          }

          if (videoId) {
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            console.log('Converting YouTube URL to embedded video:', content, '→', embedUrl);

            // Create a wrapper div with proper attributes for the API to recognize
            const videoDiv = document.createElement('div');
            videoDiv.className = 'ProseMirror-youtube-iframe';
            videoDiv.setAttribute('data-youtube-video', 'true');
            videoDiv.setAttribute('data-type', 'VIDEO');

            // Create proper iframe with explicit data attributes
            videoDiv.innerHTML = `
            <iframe 
              src="${embedUrl}"
              width="560" 
              height="315" 
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
              data-type="VIDEO"
            ></iframe>
          `;

            // Replace the paragraph with our video embed
            if (p.parentNode) {
              p.parentNode.replaceChild(videoDiv, p);
            }
          }
        } catch (err) {
          console.error('Error processing YouTube URL:', err);
        }
      }
    }

    return tempDiv.innerHTML;
  };

  useEffect(() => {
    if (storyData.story && storyData.risks) {
      if (updateFormData) {
      }
    }
  }, [storyData, updateFormData]);

  // Handler for story content change
  // Improved handler for story content change

  const handleContentChange = useCallback((data) => {
    setStoryData(prevData => {
      // Only update if data actually changed to prevent re-renders
      if (data.story === prevData.story && data.risks === prevData.risks) {
        return prevData;
      }

      // Debug YouTube content on change
      if (data.story && data.story !== prevData.story) {
        debugYouTubeContent(data.story);
      }

      // Call updateFormData if it's provided and data changed
      if (updateFormData && typeof updateFormData === 'function') {
        updateFormData(data);
      }

      return data;
    });
  }, [updateFormData]);

  const debugYouTubeContent = (html) => {
    console.log('--- YouTube Debug ---');
    
    if (!html) {
      console.log('HTML content is empty');
      return;
    }
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Check for YouTube iframes
    const iframes = Array.from(tempDiv.querySelectorAll('iframe'));
    console.log(`Found ${iframes.length} iframes in content`);
    
    iframes.forEach((iframe, i) => {
      if (iframe.src && iframe.src.includes('youtube.com/embed/')) {
        console.log(`YouTube iframe ${i}: ${iframe.src}`);
        console.log(`Parent element:`, iframe.parentElement.outerHTML.substring(0, 100));
      }
    });
    
    // Check for YouTube divs
    const youtubeDivs = Array.from(tempDiv.querySelectorAll('.ProseMirror-youtube-iframe, [data-youtube-video="true"], [data-type="VIDEO"]'));
    console.log(`Found ${youtubeDivs.length} YouTube container divs`);
    
    // Check for raw YouTube URLs in text
    const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
    const youtubeUrlParagraphs = paragraphs.filter(p => {
      const content = p.textContent.trim();
      return content && (
        content.includes('youtube.com/watch') ||
        content.includes('youtu.be/') ||
        content.includes('youtube.com/embed/')
      );
    });
    
    console.log(`Found ${youtubeUrlParagraphs.length} paragraphs with YouTube URLs`);
    console.log('--- End YouTube Debug ---');
  };

  // Handle manual saving of the story
  const handleSaveStory = useCallback(async () => {
    try {
      setSavingStatus('saving');

      // Pre-process HTML to handle multimedia elements
      const storyHtml = storyData.story;
      const risksHtml = storyData.risks;

      console.log('Saving story HTML (first 100 chars):', storyHtml.substring(0, 100));

      // Process YouTube URLs into proper embeds
      const processedStoryHtml = processYouTubeUrls(storyHtml);
      const processedRisksHtml = processYouTubeUrls(risksHtml);

      // First parse all content into blocks before any API calls
      // This ensures complete blocks are ready before sending
      console.log('Parsing HTML content into blocks...');
      const storyBlocks = parseHtmlToBlocks(processedStoryHtml);
      const risksBlocks = parseHtmlToBlocks(processedRisksHtml);

      console.log(`Parsed blocks - Story: ${storyBlocks.length}, Risks: ${risksBlocks.length}`);

      // Log the types of blocks we found
      const storyTypes = storyBlocks.map(b => b.type);
      const risksTypes = risksBlocks.map(b => b.type);
      console.log('Story block types:', storyTypes);
      console.log('Risks block types:', risksTypes);

      // Examine YouTube blocks for debugging
      const videoBlocks = storyBlocks.filter(b => b.type === 'VIDEO');
      videoBlocks.forEach((block, i) => {
        console.log(`Story video block ${i}:`, block.content);
      });

      // Combine blocks in sequence and assign order
      const combinedBlocks = [...storyBlocks, ...risksBlocks].map((block, index) => ({
        ...block,
        order: index  // Sequential ordering
      }));

      // Clean blocks for API
      const apiReadyBlocks = combinedBlocks.map(block => {
        // Create a clean block with only the required API fields
        return {
          type: block.type,
          content: block.content,
          order: block.order,
          metadata: {
            additionalProp1: block.metadata?.additionalProp1 || {}
          }
        };
      });

      // Log the final blocks that will be sent to API
      console.log(`Prepared ${apiReadyBlocks.length} blocks for API submission`);
      console.log('Block types being sent:',
        apiReadyBlocks.map(b => b.type)
          .reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {}));

      // Prepare payload
      const payload = {
        blocks: apiReadyBlocks,
        status: storyId ? publishStatus : "DRAFT"
      };

      if (storyId) {
        // Update existing story
        console.log(`Updating story with ID: ${storyId}`);
        await projectService.updateProjectStory(storyId, payload);
        console.log('Story updated successfully');
      } else {
        // Create new story
        const currentProjectId = propProjectId || router.query.id;
        if (!currentProjectId) {
          throw new Error('No project ID available');
        }

        console.log(`Creating new story for project: ${currentProjectId}`);
        const result = await projectService.createProjectStory(currentProjectId, payload);

        if (result?.data?.projectStoryId) {
          console.log(`Story created with ID: ${result.data.projectStoryId}`);
          setStoryId(result.data.projectStoryId);
          setPublishStatus(result.data.status || 'DRAFT');
        } else {
          console.error('Failed to get story ID from creation operation');
        }
      }

      // Set save state success
      setSavingStatus('saved');

      // Reset after delay
      setTimeout(() => {
        if (setSavingStatus) {
          setSavingStatus('idle');
        }
      }, 2000);

      return true;
    } catch (error) {
      console.error('Error saving story:', error);
      setSavingStatus('error');
      return false;
    }
  }, [storyId, storyData, publishStatus, propProjectId, router.query.id, parseHtmlToBlocks, processYouTubeUrls]);


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
      // autosaveTimer = setTimeout(async () => {
      //   if (storyId) {
      //     // Only auto-save if we already have a story ID
      //     await updateStory(storyData.story);
      //   }
      // }, 30000); // Auto-save after 30 seconds of inactivity
    }

    return () => {
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
      }
    };
  }, [storyData.story, storyId, savingStatus, updateStory]);

  // Handle image uploads
  const handleImageUpload = useCallback(async (file) => {
    try {
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
              const newStoryId = result.data.projectStoryId;
              setStoryId(newStoryId);
              setPublishStatus(result.data.status || 'DRAFT');

              // Now upload image to the new story
              return await uploadImage(file, newStoryId);
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

      // We have a story ID, just upload the image
      return await uploadImage(file, storyId);
    } catch (error) {
      console.error('Error in image upload process:', error);
      return null;
    }
  }, [storyId, router.query.id, propProjectId, publishStatus]);

  const uploadImage = async (file, targetStoryId) => {
    try {
      console.log('Uploading image for story ID:', targetStoryId);

      if (!targetStoryId) {
        throw new Error('No story ID provided for image upload');
      }

      // Step 1: Get current story blocks
      const storyResponse = await projectService.getProjectStoryById(targetStoryId);
      let currentBlocks = [];
      if (storyResponse && storyResponse.blocks) {
        currentBlocks = storyResponse.blocks;
      } else if (storyResponse && storyResponse.data && storyResponse.data.blocks) {
        currentBlocks = storyResponse.data.blocks;
      }

      // Determine highest order for new block placement
      const highestOrder = currentBlocks.length > 0 ?
        Math.max(...currentBlocks.map(block => block.order || 0)) + 1 : 0;

      // Step 2: Create a block with type IMAGE
      const imageBlock = {
        type: 'IMAGE',
        content: 'placeholder-for-uploading-image',
        order: highestOrder,
        metadata: {
          additionalProp1: {
            width: "100%",
            class: "story-image",
            alt: file.name || "Project image"
          }
        }
      };

      // Step 3: Clean the existing blocks for API compatibility
      const cleanedBlocks = currentBlocks.map(block => {
        // Remove fields that backend doesn't recognize
        const { storyBlockId, createdAt, updatedAt, ...essentialBlock } = block;

        // Clean up metadata
        let cleanMetadata = { additionalProp1: {} };

        if (typeof essentialBlock.metadata === 'string') {
          try {
            const parsedMeta = JSON.parse(essentialBlock.metadata);
            cleanMetadata = {
              additionalProp1: parsedMeta.additionalProp1 || {},
            };
          } catch (e) {
            console.warn('Failed to parse metadata string:', e);
          }
        } else if (essentialBlock.metadata && typeof essentialBlock.metadata === 'object') {
          cleanMetadata = {
            additionalProp1: essentialBlock.metadata.additionalProp1 ||
              essentialBlock.metadata || {},
          };
        }

        return {
          type: essentialBlock.type,
          content: essentialBlock.content,
          order: essentialBlock.order,
          metadata: cleanMetadata
        };
      });

      // Add our new image block
      const updatedBlocks = [...cleanedBlocks, imageBlock];

      // Step 4: Update the story with the new block
      console.log('Adding new IMAGE block to story');
      await projectService.updateProjectStory(targetStoryId, {
        blocks: updatedBlocks,
        status: publishStatus
      });

      // Step 5: Fetch the updated story to get the new block ID
      console.log('Fetching updated story to get block ID');
      const updatedStoryResponse = await projectService.getProjectStoryById(targetStoryId);

      let updatedBlocks2 = [];
      if (updatedStoryResponse && updatedStoryResponse.blocks) {
        updatedBlocks2 = updatedStoryResponse.blocks;
      } else if (updatedStoryResponse && updatedStoryResponse.data && updatedStoryResponse.data.blocks) {
        updatedBlocks2 = updatedStoryResponse.data.blocks;
      }

      // Find the newly created IMAGE block
      const createdBlock = updatedBlocks2.find(
        block => block.type === 'IMAGE' &&
          (block.content === 'placeholder-for-uploading-image' ||
            block.content === 'string') &&
          block.order === highestOrder
      );

      if (!createdBlock || !createdBlock.storyBlockId) {
        throw new Error('Failed to find the newly created block ID');
      }

      const createdBlockId = createdBlock.storyBlockId;
      console.log('Found new block ID:', createdBlockId);

      // Step 6: Upload the image to the specific block
      console.log('Uploading image to block with ID:', createdBlockId);
      const imageResult = await projectService.uploadStoryImage(createdBlockId, file);
      console.log('Image upload result:', imageResult);

      // Step 7: Fetch the story again to get the updated image URL
      console.log('Fetching updated story to get the image URL');
      const finalResponse = await projectService.getProjectStoryById(targetStoryId);

      // Find our block with the newly uploaded image URL
      const blocks = finalResponse.data ? finalResponse.data.blocks : finalResponse.blocks;
      const updatedImageBlock = blocks.find(block => block.storyBlockId === createdBlockId);

      if (updatedImageBlock && updatedImageBlock.content && updatedImageBlock.content.startsWith('http')) {
        console.log('Successfully found image URL:', updatedImageBlock.content);
        return updatedImageBlock.content;
      }

      // Fallback: try to find any recently created IMAGE block with a URL
      const fallbackBlock = blocks
        .filter(block =>
          block.type === 'IMAGE' &&
          block.content &&
          block.content.startsWith('http') &&
          block.content !== 'placeholder-for-uploading-image'
        )
        .sort((a, b) => {
          // Sort by creation date (most recent first)
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          // Or by order (higher order = more recent)
          return b.order - a.order;
        })[0];

      if (fallbackBlock) {
        console.log('Found image URL via fallback method:', fallbackBlock.content);
        return fallbackBlock.content;
      }

      console.error('Could not find image URL in the response');
      return null;
    } catch (error) {
      console.error('Error in image upload process:', error);
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