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
  const [savingStatus, setSavingStatus] = useState('idle');
  const [fetchAttempted, setFetchAttempted] = useState(false);
  const lastUpdateRef = React.useRef(Date.now());
  const router = useRouter();
  const [hasChanges, setHasChanges] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Get project ID either from props or URL
  useEffect(() => {
    // Skip if we've already fetched or encountered an error
    if (fetchAttempted) return;

    if (initialStoryData) {
      console.log('Using provided initialStoryData:', initialStoryData);
      setStoryData({
        story: initialStoryData.story || '',
        risks: initialStoryData.risks || ''
      });

      // More comprehensive check for story ID from initialStoryData
      // Check all possible fields where the ID might be stored
      const storyIdFromData =
        initialStoryData.id ||
        initialStoryData.storyId ||
        initialStoryData.projectStoryId ||
        (initialStoryData.projectStory &&
          (initialStoryData.projectStory.id ||
            initialStoryData.projectStory.storyId ||
            initialStoryData.projectStory.projectStoryId));

      if (storyIdFromData) {
        console.log('Found story ID in initialStoryData:', storyIdFromData);
        setStoryId(storyIdFromData);
        setLoading(false);
        setFetchAttempted(true);
        return;
      }
      // If we have initialStoryData but no ID, and there's content,
      // this might be a new story that hasn't been saved yet
      else if (initialStoryData.story || initialStoryData.risks) {
        console.log('No ID in initialStoryData, but content exists');
        setLoading(false);
        setFetchAttempted(true);
        return;
      }
    }

    // If we get here, we don't have initialStoryData, so we need to try fetching
    const currentProjectId = propProjectId || (router.isReady && router.query.id);

    if (currentProjectId) {
      console.log('No initialStoryData, fetching from API with projectId:', currentProjectId);
      fetchStoryData(currentProjectId);
    } else {
      // No project ID and no initial data, set default content and stop loading
      console.log('No projectId available for API fetch, using default content');
      createDefaultContent();
      setLoading(false);
      setFetchAttempted(true);
    }
  }, [router.isReady, router.query, propProjectId, fetchAttempted, initialStoryData]);

  // Add this function to end the loading state if it's been too long
  useEffect(() => {
    // Safety timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, using default content');
        createDefaultContent();
        setLoading(false);
        setFetchAttempted(true);
        setError(null);
      }
    }, 5000); // 5-second timeout

    return () => clearTimeout(timeoutId);
  }, [loading]);

  useEffect(() => {
    // This effect runs when initialStoryData changes
    if (!initialStoryData) return;

    // Check if we need to update the storyId
    const newStoryId =
      initialStoryData.id ||
      initialStoryData.storyId ||
      initialStoryData.projectStoryId ||
      (initialStoryData.projectStory &&
        (initialStoryData.projectStory.id ||
          initialStoryData.projectStory.storyId ||
          initialStoryData.projectStory.projectStoryId));

    // Only update if we have a new ID and it's different from the current one
    if (newStoryId && newStoryId !== storyId) {
      console.log('Updating storyId from changed initialStoryData:', newStoryId);
      setStoryId(newStoryId);
    }
  }, [initialStoryData, storyId]);

  // Parse API blocks format to HTML for the editor - enhancing video handling
  const parseBlocksToHtml = (blocks) => {
    if (!blocks || !Array.isArray(blocks)) {
      return '';
    }

    // Sort blocks by order property
    const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

    // Track image URLs to avoid duplicates
    const processedImageUrls = new Set();

    let htmlContent = '';

    sortedBlocks.forEach((block, index) => {
      const { type, content, metadata = {} } = block;

      // Skip empty blocks
      if (!content || (typeof content === 'string' && content.trim() === '')) {
        return;
      }

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

      // Add content based on block type
      switch (type) {
        case 'TEXT':
          // Special handling for empty paragraphs to preserve spacing
          if (content === '<br>' ||
            content === '<p><br></p>' ||
            content === '&nbsp;' ||
            parsedMetadata.additionalProp1?.isEmptyParagraph ||
            parsedMetadata.additionalProp1?.isBreak) {
            // Use proper line breaks instead of <br> tags
            htmlContent += '<p>\n</p>';
            break;
          }

          // Check if this TEXT block contains an embedded image
          if (content && content.includes('<img')) {
            // Extract the image URL to check for duplication
            const imgMatch = content.match(/src="([^"]+)"/);
            const imgUrl = imgMatch ? imgMatch[1] : null;

            // If this TEXT block contains an image that will be processed separately as IMAGE type,
            // check if we already processed this image URL
            if (imgUrl && processedImageUrls.has(imgUrl)) {
              console.log('Skipping TEXT block containing already processed image:', imgUrl);
              break; // Skip this block entirely
            }

            // If the TEXT block ONLY contains an image (and no other significant content)
            // and there's an IMAGE block with the same URL, skip it
            if (imgUrl && sortedBlocks.some(b => b.type === 'IMAGE' && b.content === imgUrl)) {
              // Check if TEXT block contains ONLY this image and no other content
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = content;

              // Remove all img tags
              const allImages = tempDiv.querySelectorAll('img');
              allImages.forEach(img => img.remove());

              // If no substantial text content remains, skip this TEXT block entirely
              const remainingText = tempDiv.textContent.trim();
              if (!remainingText) {
                console.log('Skipping TEXT block that only contains an image matching an IMAGE block');
                break;
              }

              processedImageUrls.add(imgUrl)
            }
          }

          // For all other TEXT blocks, preserve exactly as is
          htmlContent += content;
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

          // Preserve exact content without trimming
          htmlContent += `<h${level}${headingStyleAttr}>${content}</h${level}>`;
          break;

        case 'IMAGE':
          // Record this image URL as processed
          if (content) {
            processedImageUrls.add(content);
          }

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
          const imageAlt = parsedMetadata.additionalProp1?.alt || 'Project image';

          // Add unique ID to help identify images
          const imageId = block.storyBlockId || Math.random().toString(36).substr(2, 9);
          htmlContent += `<div class="image-container" data-type="IMAGE" data-block-id="${imageId}">
            <img src="${content}" alt="${imageAlt}" title="${imageAlt}" 
            class="${imageClass}"${imageStyleAttr} data-type="IMAGE" data-block-id="${imageId}">
          </div>`;
          break;

        case 'VIDEO':
          // Video handling code remains the same...
          let videoMetadata = {};
          if (typeof parsedMetadata === 'string') {
            try {
              videoMetadata = JSON.parse(parsedMetadata);
            } catch (e) {
              console.warn('Failed to parse video metadata:', e);
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

          const width = videoMetadata.additionalProp1?.width || '560px';
          const height = videoMetadata.additionalProp1?.height || '315px';
          const autoplay = videoMetadata.additionalProp1?.autoplay ? 1 : 0;
          const controls = videoMetadata.additionalProp1?.controls !== false ? 1 : 0;

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

          const embedUrl = autoplay || controls
            ? `${youtubeUrl}${youtubeUrl.includes('?') ? '&' : '?'}controls=${controls}&autoplay=${autoplay}`
            : youtubeUrl;

          const videoId = block.storyBlockId || Math.random().toString(36).substr(2, 9);
          htmlContent += `
          <div class="ProseMirror-youtube-iframe" data-youtube-video="true" data-type="VIDEO" data-block-id="${videoId}">
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
          if (content && content.trim()) {
            htmlContent += content;
          }
      }

      // Add a line break after each block (unless it's the last block or the next block is a heading)
      if (index < sortedBlocks.length - 1) {
        const nextBlock = sortedBlocks[index + 1];
        // Don't add line break before headings as they already create visual separation
        if (nextBlock.type !== 'HEADING') {
          // Check if current block's HTML ends with a paragraph or div closing tag
          const endsWithP = /(<\/p>|<\/div>|<\/ul>|<\/ol>)$/.test(htmlContent.trim());
          // Only add additional spacing if the block doesn't already have proper spacing
          if (!endsWithP) {
            htmlContent += '<p>\n</p>';
          }
        }
      }
    });

    return htmlContent;
  };


  const parseHtmlToBlocks = (html) => {
    if (!html) return [];

    // Create a temporary element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    console.log('Parsing HTML content with length:', html.length);

    // Approach: Map all elements with their positions first, then process them in document order
    const blocks = [];
    const processedElements = new Set();
    const processedImageSrcs = new Set();
    const processedListItems = new Set(); // Track list items to avoid duplication

    // Function to map all elements in document order
    const mapElements = () => {
      // Create a walker to process nodes in document order
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
      );

      let order = 0;
      let currentNode;

      // Walk through all elements in document order
      while (currentNode = walker.nextNode()) {
        const element = currentNode;
        const tagName = element.tagName.toLowerCase();

        // Skip empty or whitespace-only elements
        if (!element.textContent && !element.children.length && element.attributes.length === 0) {
          if (tagName !== 'img' &&
            tagName !== 'br' &&
            !element.querySelector('img') &&
            !element.querySelector('iframe') &&
            !element.querySelector('br')) {
            continue;
          }
        }

        // Handle YouTube videos (iframes)
        if (tagName === 'iframe' && element.src && element.src.includes('youtube.com/embed')) {
          if (!processedElements.has(element)) {
            const cleanUrl = element.src.split('?')[0];

            blocks.push({
              type: 'VIDEO',
              content: cleanUrl,
              order: order++,
              metadata: {
                additionalProp1: {
                  autoplay: element.src.includes('autoplay=1'),
                  controls: !element.src.includes('controls=0'),
                  width: element.width || "560px",
                  height: element.height || "315px"
                }
              }
            });

            processedElements.add(element);
            // Also mark the parent YouTube container if it exists
            if (element.parentElement &&
              (element.parentElement.classList.contains('ProseMirror-youtube-iframe') ||
                element.parentElement.hasAttribute('data-youtube-video'))) {
              processedElements.add(element.parentElement);
            }
          }
          continue;
        }

        // Handle YouTube container divs (may contain iframes)
        if ((element.classList.contains('ProseMirror-youtube-iframe') ||
          element.hasAttribute('data-youtube-video')) &&
          !processedElements.has(element)) {

          const iframe = element.querySelector('iframe[src*="youtube.com/embed"]');
          if (iframe && !processedElements.has(iframe)) {
            const cleanUrl = iframe.src.split('?')[0];

            blocks.push({
              type: 'VIDEO',
              content: cleanUrl,
              order: order++,
              metadata: {
                additionalProp1: {
                  autoplay: iframe.src.includes('autoplay=1'),
                  controls: !iframe.src.includes('controls=0'),
                  width: iframe.width || "560px",
                  height: iframe.height || "315px"
                }
              }
            });

            processedElements.add(iframe);
            processedElements.add(element);
          }
          continue;
        }

        // Handle images
        if (tagName === 'img' && element.src && !processedElements.has(element)) {
          // Skip if this image source has already been processed
          if (processedImageSrcs.has(element.src)) {
            processedElements.add(element);
            continue;
          }

          // Add to our tracking sets
          processedElements.add(element);
          processedImageSrcs.add(element.src);

          // Also skip processing the parent image container if present
          const imageContainer = element.closest('.image-container, [data-type="IMAGE"]');
          if (imageContainer && imageContainer !== element) {
            processedElements.add(imageContainer);
          }

          blocks.push({
            type: 'IMAGE',
            content: element.src,
            order: order++,
            metadata: {
              additionalProp1: {
                width: element.style.width || element.width || "100%",
                float: element.style.float || null,
                class: element.className || 'story-image',
                alt: element.alt || 'Project image'
              }
            }
          });
          continue;
        }

        // Handle headings
        if (tagName.startsWith('h') && tagName.length === 2 && !processedElements.has(element)) {
          const level = parseInt(tagName[1]);
          const headingText = element.textContent.trim();

          if (headingText) {
            blocks.push({
              type: 'HEADING',
              content: headingText,
              order: order++,
              metadata: {
                additionalProp1: {
                  level: level,
                  align: element.style.textAlign || 'left',
                  color: element.style.color || null
                }
              }
            });
            processedElements.add(element);
          }
          continue;
        }

        // FIX: Improved list handling - handle lists (ul/ol) as composite blocks
        if ((tagName === 'ul' || tagName === 'ol') && !processedElements.has(element)) {
          // Mark all child elements as processed
          const listItems = element.querySelectorAll('li');
          listItems.forEach(li => {
            processedElements.add(li);
            // Process li children but don't mark as fully processed yet
            Array.from(li.children).forEach(child => {
              processedListItems.add(child);
            });
          });

          // Get the entire list HTML - this is the key fix to preserve all list content
          const listContent = element.outerHTML;

          if (listContent.trim()) {
            blocks.push({
              type: 'TEXT',
              content: listContent,
              order: order++,
              metadata: {
                additionalProp1: {
                  align: element.style.textAlign || 'left',
                  color: element.style.color || null,
                  listType: tagName === 'ul' ? 'bullet' : 'ordered'
                }
              }
            });
            processedElements.add(element);
          }
          continue;
        }

        // FIX: Handle individual list items that might not be caught by the list handler
        if (tagName === 'li' && !processedElements.has(element) && !processedListItems.has(element)) {
          const parentList = element.closest('ul, ol');

          // If the parent list was already processed, skip this list item
          if (processedElements.has(parentList)) {
            processedElements.add(element);
            continue;
          }

          // Create a temporary list to contain just this item
          const tempList = document.createElement(parentList ? parentList.tagName : 'ul');
          tempList.appendChild(element.cloneNode(true));

          blocks.push({
            type: 'TEXT',
            content: tempList.outerHTML,
            order: order++,
            metadata: {
              additionalProp1: {
                align: 'left',
                color: null,
                listType: parentList && parentList.tagName.toLowerCase() === 'ol' ? 'ordered' : 'bullet'
              }
            }
          });

          processedElements.add(element);
          continue;
        }

        // FIX: Improved handling of paragraphs and text elements - don't skip elements with processed children
        if ((tagName === 'p' || tagName === 'div' || tagName === 'blockquote') &&
          !processedElements.has(element) && !processedListItems.has(element)) {

          // Skip if paragraph only contains an already processed image
          const containsOnlyProcessedImage = () => {
            const images = element.querySelectorAll('img');
            if (images.length === 1 && processedImageSrcs.has(images[0].src)) {
              // Check if paragraph only contains this image and no significant text
              const tempEl = element.cloneNode(true);
              Array.from(tempEl.querySelectorAll('img')).forEach(img => img.remove());
              return tempEl.textContent.trim() === '';
            }
            return false;
          };

          if (containsOnlyProcessedImage()) {
            processedElements.add(element);
            continue;
          }

          // FIX: Always process elements with text content even if they have processed children
          // This ensures we don't lose text in paragraphs that contain processed elements
          const hasTextContent = element.textContent.trim().length > 0;

          // Process if it has text or hasn't been processed elsewhere
          if (hasTextContent || !Array.from(element.querySelectorAll('*')).some(child => processedElements.has(child))) {
            const content = tagName === 'p' ? element.innerHTML : element.outerHTML;

            // Skip completely empty or whitespace-only content
            if (!content || content.trim() === '') {
              processedElements.add(element);
              continue;
            }

            // Check if it's an empty paragraph with just a <br> tag
            const isParagraphWithOnlyBr = tagName === 'p' &&
              (content === '<br>' || content === '&nbsp;' || content === '<br/>' ||
                content === '\n' || content.trim() === '');

            if (isParagraphWithOnlyBr) {
              blocks.push({
                type: 'TEXT',
                content: '<p>\n</p>',
                order: order++,
                metadata: {
                  additionalProp1: {
                    align: 'left',
                    color: null,
                    isEmptyParagraph: true
                  }
                }
              });
              processedElements.add(element);
            } else if (content.trim()) { // Only add non-empty content
              blocks.push({
                type: 'TEXT',
                content: content,
                order: order++,
                metadata: {
                  additionalProp1: {
                    align: element.style.textAlign || 'left',
                    color: element.style.color || null,
                    isQuote: tagName === 'blockquote'
                  }
                }
              });
              processedElements.add(element);
            }
          }
        }

        // Handle standalone <br> tags
        if (tagName === 'br' && !processedElements.has(element) &&
          (!element.parentElement || element.parentElement.tagName.toLowerCase() === 'body')) {
          blocks.push({
            type: 'TEXT',
            content: '<br>',
            order: order++,
            metadata: {
              additionalProp1: {
                isBreak: true
              }
            }
          });
          processedElements.add(element);
        }
      }
    };

    // Map and process all elements in document order
    mapElements();

    // FIX: NEW STEP - Ensure we don't miss any plain text nodes
    const textNodes = [];

    // Function to recursively collect text nodes
    const collectTextNodes = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text.length > 0) {
          textNodes.push(node);
        }
      } else {
        // Process children
        node.childNodes.forEach(child => collectTextNodes(child));
      }
    };

    // Start collecting from the root
    collectTextNodes(tempDiv);

    // Add text nodes that aren't already part of processed elements
    textNodes.forEach(textNode => {
      // Check if this text node is part of an already processed element
      let parent = textNode.parentNode;
      let isProcessed = false;

      while (parent && parent !== tempDiv) {
        if (processedElements.has(parent)) {
          isProcessed = true;
          break;
        }
        parent = parent.parentNode;
      }

      // If not already processed, add as a text block
      if (!isProcessed) {
        blocks.push({
          type: 'TEXT',
          content: `<p>${textNode.textContent}</p>`,
          order: blocks.length, // Add at the end
          metadata: {
            additionalProp1: {
              align: 'left',
              color: null
            }
          }
        });
      }
    });

    // Final verification and logging
    const finalVideoBlocks = blocks.filter(b => b.type === 'VIDEO');
    const finalImageBlocks = blocks.filter(b => b.type === 'IMAGE');
    const finalTextBlocks = blocks.filter(b => b.type === 'TEXT');
    const finalHeadingBlocks = blocks.filter(b => b.type === 'HEADING');

    console.log(`Parsing complete. Generated ${blocks.length} blocks`);
    console.log(`Final block counts: ${finalHeadingBlocks.length} headings, ${finalTextBlocks.length} text, ${finalImageBlocks.length} images, ${finalVideoBlocks.length} videos`);
    console.log('Block types:', blocks.map(b => b.type).join(', '));

    return blocks;
  };

  const fetchStoryData = async (propProjectId) => {
    try {
      setLoading(true);
      console.log('Fetching story data for project:', propProjectId);

      try {
        const response = await projectService.getProjectStoryByProjectId(propProjectId);
        console.log('Raw API response:', response);

        // Check if the response is an error object with status 404
        if (response && response.status === 404 && response.error === "Project story not found") {
          console.log('API returned 404: Project story not found - using default content');
          createDefaultContent();
          setError(null);
          return;
        }

        // The response structure might vary - handle both direct response and nested .data format
        const storyData = response.projectStoryId ? response : response.data;

        // Check if we have a valid response with story data
        if (storyData && storyData.blocks && Array.isArray(storyData.blocks)) {
          console.log('Story data found:', storyData);
          setStoryId(storyData.projectStoryId);

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
          // Use default content if no story data or invalid format
          createDefaultContent();
        }

        // Clear any previous errors on successful API call
        setError(null);

      } catch (apiError) {
        console.log('API error response:', apiError);

        // Check for error response body that indicates a 404 "Project story not found"
        const is404NotFound =
          // Check for error object format in response
          (apiError && apiError.status === 404 && apiError.error === "Project story not found") ||
          // Check for error in response property
          (apiError.response && apiError.response.status === 404) ||
          // Check for status code directly
          apiError.status === 404 ||
          // Check for error message in string
          (typeof apiError === 'string' && apiError.includes('Project story not found'));

        // Special case: check for JSON response in message or data
        if (apiError.message && typeof apiError.message === 'string') {
          try {
            const parsedMessage = JSON.parse(apiError.message);
            if (parsedMessage.status === 404 && parsedMessage.error === "Project story not found") {
              is404NotFound = true;
            }
          } catch (e) {
            // Not valid JSON, continue with other checks
          }
        }

        if (is404NotFound) {
          console.log('Project story not found - using default content');
          // This is expected for new projects - use default content
          createDefaultContent();
          setError(null); // Clear any errors as this is an expected situation
        } else {
          // For other errors, set the error state but still use default content
          console.error('Error fetching project story:', apiError);
          setError('Failed to load project story data');
          createDefaultContent();
        }
      }
    } catch (error) {
      console.error('Unexpected error in fetchStoryData:', error);
      setError('Failed to load project story data');
      createDefaultContent();
    } finally {
      setLoading(false);
    }
  };

  const createDefaultContent = () => {
    console.log('Creating default story content');
    setStoryData({
      story: '<h1>Project Story</h1><p>Tell your story here...</p>',
      risks: '<h1>Risks and Challenges</h1><p>Here we outline potential risks and challenges our project may face, and how we plan to address them.</p>'
    });
    setStoryId(null); // Ensure storyId is null for new stories
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
      };

      console.log('Creating new story');

      const result = await projectService.createProjectStory(currentProjectId, payload);

      if (result && result.data && result.data.projectStoryId) {
        console.log('New story created with ID:', result.data.projectStoryId);
        setStoryId(result.data.projectStoryId);
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
    if (!propProjectId || !storyId) {
      console.error('Cannot update: Missing project or story ID');
      setSavingStatus('error');
      return false;
    }

    try {
      setSavingStatus('saving');

      // Process HTML to properly handle YouTube URLs and embed them as video blocks
      const processedHtml = processYouTubeUrls(htmlContent);

      // Parse the HTML content into blocks directly
      const newStoryBlocks = parseHtmlToBlocks(processedHtml);
      console.log('New blocks from HTML:', newStoryBlocks.map(b => b.type).join(', '));

      // Clean up blocks for API submission
      const apiReadyBlocks = newStoryBlocks.map((block, index) => {
        // Create a clean block with only the fields the API expects
        return {
          type: block.type,
          content: block.content,
          order: index, // Ensure sequential ordering
          metadata: {
            additionalProp1: typeof block.metadata?.additionalProp1 === 'object'
              ? block.metadata.additionalProp1
              : {}
          }
        };
      });

      // Prepare API payload
      const payload = {
        blocks: apiReadyBlocks,
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

      // 1. Update the story FIRST
      await projectService.updateProjectStory(storyId, payload);
      console.log('Story updated successfully');

      // 2. THEN fetch the updated story to ensure we have the latest data
      try {
        const updatedStory = await projectService.getProjectStoryByProjectId(propProjectId);
        console.log('Fetched updated story data:', updatedStory);

        // If needed, update local state with fetched data
        if (updatedStory && updatedStory.blocks && Array.isArray(updatedStory.blocks)) {
          // The fetch is mainly for backend validation; we don't need to update the UI
          // since we're already showing what the user entered
          console.log('Successfully validated updated story has correct blocks');
        }
      } catch (fetchError) {
        // Non-critical error - the update succeeded but fetch failed
        console.warn('Story was updated but failed to fetch updated data:', fetchError);
        // We continue normally since the update was successful
      }

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
  }, [storyId, propProjectId, parseHtmlToBlocks, processYouTubeUrls]);

  // Helper function to process YouTube URLs in HTML content
  // Enhanced processYouTubeUrls function

  const processYouTubeUrls = (html) => {
    if (!html) return html;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // First, find existing YouTube iframes and ensure they have proper attributes
    const existingIframes = Array.from(tempDiv.querySelectorAll('iframe[src*="youtube"]'));
    existingIframes.forEach(iframe => {
      // Only process iframes that don't already have proper YouTube container
      const isAlreadyWrapped = iframe.parentElement &&
        (iframe.parentElement.classList.contains('ProseMirror-youtube-iframe') ||
          iframe.parentElement.hasAttribute('data-youtube-video'));

      if (!isAlreadyWrapped) {
        console.log('Processing unwrapped YouTube iframe:', iframe.src);

        // Create proper wrapper container
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

        console.log('Enhanced YouTube iframe with proper attributes');
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

      // Check for standalone YouTube URLs
      // Only process paragraphs that contain ONLY a YouTube URL and nothing else
      const isOnlyYouTubeUrl = content &&
        (content.includes('youtube.com/watch') ||
          content.includes('youtu.be/') ||
          content.includes('youtube.com/embed/')) &&
        // Make sure it doesn't contain other significant text
        !content.includes('. ') &&
        !content.includes('? ') &&
        content.split(' ').length < 3; // Only contains URL and maybe 1-2 words

      if (isOnlyYouTubeUrl) {
        try {
          let videoId = null;

          if (content.includes('youtube.com/watch')) {
            try {
              const url = new URL(content);
              videoId = url.searchParams.get('v');
            } catch (e) {
              // Try simple parsing if URL constructor fails
              const match = content.match(/[?&]v=([^&]+)/);
              if (match) videoId = match[1];
            }
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
              console.log('Replaced plain URL with proper YouTube embed');
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
    // Only update parent form data if needed and not too frequently
    if (!loading && (storyId || (initialStoryData && (initialStoryData.story || initialStoryData.risks)))) {
      if (updateFormData && typeof updateFormData === 'function') {
        const hasContent = Boolean(storyData.story || storyData.risks);
        const now = Date.now();

        // Only update if sufficient time has passed since last update (at least 2 seconds)
        if (hasContent && now - lastUpdateRef.current > 2000) {
          lastUpdateRef.current = now;

          // Use timeout to further debounce
          const timeoutId = setTimeout(() => {
            updateFormData({
              story: storyData.story || '',
              risks: storyData.risks || '',
              id: storyId,
              projectStoryId: storyId,
              projectId: propProjectId
            });
          }, 500);

          return () => clearTimeout(timeoutId);
        }
      }
    }
  }, [storyId, loading, initialStoryData, storyData, updateFormData]);

  // Handler for story content change
  const handleContentChange = useCallback((data) => {
    // Only update if data has actually changed and enough time has passed
    const now = Date.now();
    if (now - lastUpdateRef.current < 500) {
      return; // Skip updates that are too frequent (less than 500ms apart)
    }

    // Clone data to avoid mutation
    const fixedData = { ...data };

    try {
      // IMPROVED DETECTION: Handle case where risks content is in the story section
      if (fixedData.story) {
        const storyDiv = document.createElement('div');
        storyDiv.innerHTML = fixedData.story;

        // More robust detection of risks headings - now handles special characters safely
        const risksHeadings = Array.from(storyDiv.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .filter(heading => {
            // Normalize text by removing special characters for comparison purposes
            const headingText = (heading.textContent || '')
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/gu, "")
              .trim();

            return (headingText.includes("risk") && headingText.includes("challenge")) ||
              (headingText.includes("risks") && headingText.includes("challenges")) ||
              (headingText.includes("risk") && headingText.includes("&")) ||
              (headingText.includes("risks") && headingText.includes("&"));
          });

        if (risksHeadings.length > 0) {
          console.log('Found Risks and Challenges heading in story section, moving to risks section');
          const risksHeading = risksHeadings[0];

          // Create content container for risks
          const risksContentDiv = document.createElement('div');

          // Collect the heading and all elements after it
          let currentNode = risksHeading;
          const nodesToMove = [];

          while (currentNode) {
            nodesToMove.push(currentNode);
            currentNode = currentNode.nextSibling;
          }

          // Add each node to risks content
          nodesToMove.forEach(node => {
            risksContentDiv.appendChild(node.cloneNode(true));
          });

          // Remove moved content from story
          nodesToMove.forEach(node => {
            if (node.parentNode) {
              node.parentNode.removeChild(node);
            }
          });

          // Update story content without the risks section
          fixedData.story = storyDiv.innerHTML;

          // Merge with existing risks content if any
          if (fixedData.risks && fixedData.risks.trim()) {
            const existingRisksDiv = document.createElement('div');
            existingRisksDiv.innerHTML = fixedData.risks;

            // Check if risks already has a heading with same robust detection
            const existingRisksHeadings = Array.from(existingRisksDiv.querySelectorAll('h1, h2, h3, h4, h5, h6'))
              .filter(heading => {
                const headingText = (heading.textContent || '')
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/gu, "")
                  .trim();

                return (headingText.includes("risk") && headingText.includes("challenge")) ||
                  (headingText.includes("risks") && headingText.includes("challenges")) ||
                  (headingText.includes("risk") && headingText.includes("&")) ||
                  (headingText.includes("risks") && headingText.includes("&"));
              });

            if (existingRisksHeadings.length > 0 && risksContentDiv.querySelector('h1, h2, h3, h4, h5, h6')) {
              // Remove duplicated heading if both have one
              const newHeading = risksContentDiv.querySelector('h1, h2, h3, h4, h5, h6');
              if (newHeading) {
                newHeading.parentNode.removeChild(newHeading);
              }

              // Append new content to existing risks
              fixedData.risks = existingRisksDiv.innerHTML + risksContentDiv.innerHTML;
            } else {
              // Use the new risks content (with heading)
              fixedData.risks = risksContentDiv.innerHTML;
            }
          } else {
            // No existing risks, use new content
            fixedData.risks = risksContentDiv.innerHTML;
          }
        }
      }

      // SCAN FOR RISKS CONTENT: Look for paragraphs about risks in the story section
      if ((!fixedData.risks || !fixedData.risks.trim()) && fixedData.story) {
        const storyDiv = document.createElement('div');
        storyDiv.innerHTML = fixedData.story;

        // Enhanced detection that handles special characters
        const risksParagraphs = Array.from(storyDiv.querySelectorAll('p, div, section, li'))
          .filter(el => {
            const text = (el.textContent || '')
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/gu, "")
              .trim();

            return (text.includes("risk") && text.includes("challenge")) ||
              (text.includes("risks") && text.includes("challenges"));
          });

        if (risksParagraphs.length > 0) {
          console.log('Found paragraphs about risks in story section, moving to risks section');

          // Create default heading
          const risksHeading = document.createElement('h1');
          risksHeading.textContent = 'Risks and Challenges';

          const risksDiv = document.createElement('div');
          risksDiv.appendChild(risksHeading);

          // Move each paragraph
          risksParagraphs.forEach(p => {
            risksDiv.appendChild(p.cloneNode(true));

            // Remove from story
            if (p.parentNode) {
              p.parentNode.removeChild(p);
            }
          });

          // Update data
          fixedData.risks = risksDiv.innerHTML;
          fixedData.story = storyDiv.innerHTML;
        }
      }

      // Ensure risks section has a proper heading
      if (fixedData.risks && fixedData.risks.trim()) {
        const risksDiv = document.createElement('div');
        risksDiv.innerHTML = fixedData.risks;

        // Check if risks already has a heading with improved detection
        const hasRisksHeading = Array.from(risksDiv.querySelectorAll('h1, h2, h3, h4, h5, h6'))
          .some(heading => {
            const headingText = (heading.textContent || '')
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/gu, "")
              .trim();

            return (headingText.includes("risk") || headingText.includes("risks")) &&
              (headingText.includes("challenge") || headingText.includes("challenges") || headingText.includes("&"));
          });

        if (!hasRisksHeading) {
          // Add a heading if none exists
          const risksHeading = document.createElement('h1');
          risksHeading.textContent = 'Risks and Challenges';
          risksDiv.insertBefore(risksHeading, risksDiv.firstChild);
          fixedData.risks = risksDiv.innerHTML;
        }
      }

      // SPECIAL CASE: Handle completely restructured content
      // If the entire content structure has changed dramatically
      if (fixedData.story && !fixedData.risks) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = fixedData.story;

        // Look for patterns of structured risks content with improved detection
        const potentialRisksSections = Array.from(tempDiv.querySelectorAll('div, section'))
          .filter(section => {
            const text = (section.textContent || '')
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}]/gu, "")
              .trim();

            return text.includes("risks") && text.length > 100; // Reasonably sized section
          });

        if (potentialRisksSections.length > 0) {
          console.log('Found potential risks section in completely restructured content');

          // Take the largest matching section
          const largestSection = potentialRisksSections.reduce((largest, current) =>
            (current.textContent?.length > largest.textContent?.length) ? current : largest,
            potentialRisksSections[0]
          );

          // Create risks content with proper heading
          const risksHeading = document.createElement('h1');
          risksHeading.textContent = 'Risks and Challenges';

          const risksDiv = document.createElement('div');
          risksDiv.appendChild(risksHeading);
          risksDiv.appendChild(largestSection.cloneNode(true));

          // Remove from story
          if (largestSection.parentNode) {
            largestSection.parentNode.removeChild(largestSection);
          }

          // Update data
          fixedData.risks = risksDiv.innerHTML;
          fixedData.story = tempDiv.innerHTML;
        }
      }
    } catch (error) {
      // Add error handling to prevent crashes from special character processing
      console.error('Error processing content:', error);
    }

    // Update state with fixed data
    setStoryData(prevData => {
      // Has anything actually changed?
      const hasContentChanged =
        fixedData.story !== prevData.story ||
        fixedData.risks !== prevData.risks;

      if (hasContentChanged) {
        setHasChanges(true);

        // Log what changed for debugging
        console.log("Content changed, updating story and risks sections");
      }

      if (fixedData.story === prevData.story && fixedData.risks === prevData.risks) {
        return prevData;
      }

      // Update timestamp and return new state
      lastUpdateRef.current = now;
      return fixedData;
    });
  }, []);

  useEffect(() => {
    if (savingStatus === 'saved') {
      setHasChanges(false);
    }
  }, [savingStatus]);

  useEffect(() => {
    // Update parent form data with minimal delay for real-time checklist updates
    if (!loading && storyData.story && updateFormData) {
      // Use the ref to track if we need to update
      const now = Date.now();
      // Only update if sufficient time has passed (at least 500ms)
      if (now - lastUpdateRef.current < 500) {
        return; // Skip updates that are too frequent
      }

      // Create a debounced update function
      const updateParent = () => {
        if (updateFormData && typeof updateFormData === 'function') {
          lastUpdateRef.current = now; // Update the timestamp
          updateFormData({
            story: storyData.story || '',
            risks: storyData.risks || '',
            id: storyId,
            projectStoryId: storyId,
            projectId: propProjectId
          });
        }
      };

      // Use a longer delay to avoid too many updates
      const timer = setTimeout(updateParent, 1000);
      return () => clearTimeout(timer);
    }
  }, [storyData.story, storyData.risks, storyId, propProjectId, loading]);

  // Enhanced debug function to help troubleshoot content issues
  const debugContent = (html) => {
    console.log('--- Content Debug ---');

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
        console.log(`Parent element:`, iframe.parentNode.tagName);
        console.log(`Parent class:`, iframe.parentNode.className);

        // Check if it has proper container
        const hasProperParent = iframe.parentElement &&
          (iframe.parentElement.classList.contains('ProseMirror-youtube-iframe') ||
            iframe.parentElement.hasAttribute('data-youtube-video'));

        if (!hasProperParent) {
          console.warn('YouTube iframe is missing proper container wrapper!');
        }
      }
    });

    // Check for YouTube divs
    const youtubeDivs = Array.from(tempDiv.querySelectorAll('.ProseMirror-youtube-iframe, [data-youtube-video="true"], [data-type="VIDEO"]'));
    console.log(`Found ${youtubeDivs.length} YouTube container divs`);

    if (youtubeDivs.length > 0) {
      console.log('YouTube containers found at:');
      youtubeDivs.forEach((div, i) => {
        // Get approximate position in the document
        const position = Array.from(tempDiv.querySelectorAll('*')).indexOf(div);
        console.log(`Position ${i}: ~${position} in DOM order`);
      });
    }

    // Check for images
    const images = Array.from(tempDiv.querySelectorAll('img'));
    console.log(`Found ${images.length} images in content`);

    if (images.length > 0) {
      console.log('Images found at:');
      images.forEach((img, i) => {
        // Get approximate position in the document
        const position = Array.from(tempDiv.querySelectorAll('*')).indexOf(img);
        console.log(`Image ${i}: ~${position} in DOM order, src: ${img.src.substring(0, 50)}...`);
      });
    }

    console.log('--- End Content Debug ---');
  };

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

  const fixListStructure = (blocks) => {
    // If no blocks or not an array, return as is
    if (!blocks || !Array.isArray(blocks)) {
      return blocks;
    }
  
    // Create a map to track list items by their parent list
    const listContainers = new Map();
    
    // First pass: identify all list blocks and group related items
    blocks.forEach((block, index) => {
      // Only process TEXT blocks that might contain lists
      if (block.type === 'TEXT' && block.content) {
        // Check if this is a list item or list container
        const isListBlock = 
          block.content.includes('<ul') || 
          block.content.includes('<ol') || 
          block.content.includes('<li') ||
          (block.metadata?.additionalProp1?.listType === 'bullet' || 
           block.metadata?.additionalProp1?.listType === 'ordered');
        
        if (isListBlock) {
          // Determine the list type (bullet or ordered)
          let listType = 'bullet'; // default
          
          if (block.metadata?.additionalProp1?.listType) {
            listType = block.metadata.additionalProp1.listType;
          } else if (block.content.includes('<ol')) {
            listType = 'ordered';
          }
          
          // Create a new list container if needed
          if (!listContainers.has(listType)) {
            listContainers.set(listType, {
              items: [],
              indices: []
            });
          }
          
          // Add this block to its list container
          listContainers.get(listType).items.push(block);
          listContainers.get(listType).indices.push(index);
        }
      }
    });
    
    // Return the original blocks if no lists found
    if (listContainers.size === 0) {
      return blocks;
    }
    
    // Create a new array to hold the fixed blocks
    const fixedBlocks = [...blocks];
    
    // Process each list container and ensure proper structure
    listContainers.forEach((container, listType) => {
      // Skip if only one item (already properly structured)
      if (container.items.length <= 1) {
        return;
      }
      
      // Sort indices to maintain proper document order
      const sortedIndices = [...container.indices].sort((a, b) => a - b);
      
      // Find consecutive sequences of list items
      let currentSequence = [];
      let sequences = [];
      
      for (let i = 0; i < sortedIndices.length; i++) {
        const currentIndex = sortedIndices[i];
        
        if (currentSequence.length === 0 || currentIndex === sortedIndices[i-1] + 1) {
          // Part of the current sequence
          currentSequence.push(currentIndex);
        } else {
          // Start a new sequence
          if (currentSequence.length > 0) {
            sequences.push([...currentSequence]);
          }
          currentSequence = [currentIndex];
        }
      }
      
      // Add the last sequence if not empty
      if (currentSequence.length > 0) {
        sequences.push(currentSequence);
      }
      
      // Process each sequence of consecutive list items
      sequences.forEach(sequence => {
        // Skip if only one item
        if (sequence.length <= 1) {
          return;
        }
        
        // Get the blocks in this sequence
        const sequenceBlocks = sequence.map(index => blocks[index]);
        
        // Create a temporary element to properly combine the list items
        const tempDiv = document.createElement('div');
        
        // Determine what type of list to create
        const listTag = listType === 'ordered' ? 'ol' : 'ul';
        const list = document.createElement(listTag);
        
        // Add each item to the list
        sequenceBlocks.forEach(block => {
          const content = block.content;
          
          // If it's already a complete list, extract the items
          if (content.includes(`<${listTag}>`) && content.includes(`</${listTag}>`)) {
            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = content;
            
            // Get all list items
            const items = Array.from(itemDiv.querySelectorAll('li'));
            items.forEach(item => {
              list.appendChild(item.cloneNode(true));
            });
          }
          // If it's a list item
          else if (content.includes('<li>')) {
            const itemDiv = document.createElement('div');
            itemDiv.innerHTML = content;
            
            // Get all list items
            const items = Array.from(itemDiv.querySelectorAll('li'));
            items.forEach(item => {
              list.appendChild(item.cloneNode(true));
            });
          }
          // Otherwise wrap the content in a list item
          else {
            const li = document.createElement('li');
            li.innerHTML = content;
            list.appendChild(li);
          }
        });
        
        tempDiv.appendChild(list);
        
        // Update the first block with the combined list and mark others for removal
        const combinedContent = tempDiv.innerHTML;
        const firstIndex = sequence[0];
        
        // Update the first block with the combined content
        fixedBlocks[firstIndex] = {
          ...blocks[firstIndex],
          content: combinedContent,
          metadata: {
            ...blocks[firstIndex].metadata,
            additionalProp1: {
              ...(blocks[firstIndex].metadata?.additionalProp1 || {}),
              listType: listType
            }
          }
        };
        
        // Mark other blocks in the sequence for removal (by setting to null)
        for (let i = 1; i < sequence.length; i++) {
          fixedBlocks[sequence[i]] = null;
        }
      });
    });
    
    // Filter out null blocks (those marked for removal)
    return fixedBlocks.filter(block => block !== null);
  };

  const handleSaveStory = useCallback(async () => {
    try {
      setSavingStatus('saving');

      const currentProjectId = propProjectId || router.query.id;
      if (!currentProjectId) {
        console.error('No project ID available for story saving');
        setSavingStatus('error');
        return false;
      }

      const storyHtml = storyData.story;
      const risksHtml = storyData.risks;

      console.log('Saving story HTML (first 100 chars):', storyHtml?.substring(0, 100));

      // Debug the HTML content to see what multimedia elements we're working with
      debugContent(storyHtml);
      debugYouTubeContent(storyHtml);

      // Process YouTube URLs into proper embeds
      const processedStoryHtml = processYouTubeUrls(storyHtml);
      const processedRisksHtml = processYouTubeUrls(risksHtml);

      // FIX #1: First try to get the existing story structure from API
      let originalBlocks = [];
      let originalRisksStartIndex = -1;

      if (storyId) {
        try {
          const existingStory = await projectService.getProjectStoryByProjectId(currentProjectId);
          if (existingStory && existingStory.blocks && Array.isArray(existingStory.blocks)) {
            originalBlocks = existingStory.blocks;

            // Find where the risks section starts in the original blocks
            originalRisksStartIndex = originalBlocks.findIndex(block =>
              block.type === 'HEADING' &&
              block.content &&
              block.content.toLowerCase().includes('risks and challenges'));

            console.log(`Retrieved ${originalBlocks.length} original blocks, risks section starts at index ${originalRisksStartIndex}`);
          }
        } catch (error) {
          console.warn('Could not retrieve original blocks, will create new structure:', error);
        }
      }

      // Parse both sections to blocks
      const storyBlocks = parseHtmlToBlocks(processedStoryHtml);
      const risksBlocks = parseHtmlToBlocks(processedRisksHtml);

      console.log(`Parsed blocks - Story: ${storyBlocks.length}, Risks: ${risksBlocks.length}`);

      // FIX #2: Deduplicate image blocks - Remove images in TEXT blocks that also exist in IMAGE blocks
      const deduplicateImages = (blocks) => {
        const imageUrls = blocks
          .filter(block => block.type === 'IMAGE')
          .map(block => block.content);

        return blocks.map(block => {
          // Only process TEXT blocks
          if (block.type !== 'TEXT' || !block.content) {
            return block;
          }

          // Check if this TEXT block contains any images that exist as IMAGE blocks
          let processedContent = block.content;

          // For each image URL that exists as an IMAGE block
          imageUrls.forEach(imageUrl => {
            if (processedContent.includes(imageUrl)) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = processedContent;

              // Find and remove img tags with this src
              const images = tempDiv.querySelectorAll(`img[src="${imageUrl}"]`);
              images.forEach(img => {
                // If the image is the only content in a paragraph, remove the paragraph
                const para = img.closest('p');
                if (para && para.textContent.trim() === '') {
                  para.parentNode.removeChild(para);
                } else {
                  // Otherwise just remove the image
                  img.parentNode.removeChild(img);
                }
              });

              processedContent = tempDiv.innerHTML;
            }
          });

          // If the TEXT block now only contains empty paragraphs or whitespace, return null to filter out
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = processedContent;
          if (tempDiv.textContent.trim() === '') {
            return null;
          }

          return {
            ...block,
            content: processedContent
          };
        }).filter(Boolean); // Remove null blocks
      };

      // Apply deduplication to both sections
      const cleanedStoryBlocks = deduplicateImages(storyBlocks);
      const cleanedRisksBlocks = deduplicateImages(risksBlocks);

      // FIX #1: Determine the overall structure based on original blocks or create new one
      let finalBlocks = [];

      if (originalBlocks.length > 0 && originalRisksStartIndex > 0) {
        // We have existing structure, update while preserving order

        // For the story section (before risks)
        if (cleanedStoryBlocks.length > 0) {
          const mappedStoryBlocks = cleanedStoryBlocks.map((block, index) => ({
            ...block,
            // Maintain original ordering up to the risks section
            order: index
          }));

          finalBlocks = [...mappedStoryBlocks];
        }

        // For the risks section (if it exists)
        if (cleanedRisksBlocks.length > 0) {
          const mappedRisksBlocks = cleanedRisksBlocks.map((block, index) => ({
            ...block,
            // Continue ordering from where story section ends
            order: finalBlocks.length + index
          }));

          finalBlocks = [...finalBlocks, ...mappedRisksBlocks];
        }
      } else {
        // No existing structure, create new one from scratch
        finalBlocks = [
          ...cleanedStoryBlocks.map((block, index) => ({
            ...block,
            order: index
          })),
          ...cleanedRisksBlocks.map((block, index) => ({
            ...block,
            order: cleanedStoryBlocks.length + index
          }))
        ];
      }

      // Fix list structure in final blocks
      finalBlocks = fixListStructure(finalBlocks);

      // Clean blocks for API - only include required fields
      const apiReadyBlocks = finalBlocks.map((block, index) => {
        // Always reassign sequential order numbers to ensure proper ordering
        return {
          type: block.type,
          content: block.content,
          order: index,
          metadata: {
            additionalProp1: typeof block.metadata?.additionalProp1 === 'object'
              ? block.metadata.additionalProp1
              : {}
          }
        };
      });

      // Log final blocks and prepare API payload
      console.log(`Prepared ${apiReadyBlocks.length} blocks for API submission`);

      // Count blocks by type for final verification
      const textBlocks = apiReadyBlocks.filter(b => b.type === 'TEXT').length;
      const headingBlocks = apiReadyBlocks.filter(b => b.type === 'HEADING').length;
      const videoBlocks = apiReadyBlocks.filter(b => b.type === 'VIDEO').length;
      const finalImageBlocks = apiReadyBlocks.filter(b => b.type === 'IMAGE').length;

      console.log(`Final blocks: ${textBlocks} text, ${headingBlocks} heading, ${videoBlocks} video, ${finalImageBlocks} image`);

      // Prepare payload - EXACTLY match the API expected format
      const payload = {
        blocks: apiReadyBlocks,
      };

      // Save to API
      try {
        if (storyId) {
          console.log(`Updating existing story with ID: ${storyId}`);
          await projectService.updateProjectStory(storyId, payload);
        } else {
          console.log(`Creating new story for project: ${currentProjectId}`);
          const result = await projectService.createProjectStory(currentProjectId, payload);

          if (result && result.data && result.data.projectStoryId) {
            setStoryId(result.data.projectStoryId);
          } else if (result && result.projectStoryId) {
            setStoryId(result.projectStoryId);
          }
        }

        setSavingStatus('saved');
        setTimeout(() => {
          setSavingStatus('idle');
        }, 2000);

        if (updateFormData) {
          updateFormData({
            story: storyData.story || '',
            risks: storyData.risks || '',
            id: storyId,
            projectStoryId: storyId,
            projectId: currentProjectId
          });
        }

        console.log('Story saved successfully');
        setHasChanges(false);
        return true;
      } catch (error) {
        console.error('API error:', error);

        // Enhanced dynamic error handling
        let errorMessage = 'Failed to save story. Please try again later.';

        // Handle structured error response with different potential formats
        if (error.response) {
          // Handle response object with data property (axios-like format)
          if (error.response.data) {
            errorMessage = typeof error.response.data.error === 'string'
              ? error.response.data.error
              : error.response.data.message || `Error ${error.response.status || 400}`;
          } else {
            errorMessage = `Server error: ${error.response.status || 'Unknown'}`;
          }
        }
        // Handle direct error object with status and error properties (custom API format)
        else if (error.status) {
          errorMessage = error.error || error.message || `Error code: ${error.status}`;

          if (error.status === 400 && !error.error) {
            errorMessage = 'Invalid request. Please check your story content and try again.';
          }
        }
        else if (typeof error === 'string') {
          errorMessage = error;

          // Add specific context for known error patterns
          if (error.includes('project status')) {
            errorMessage = 'This project cannot be edited in its current status. Only draft or rejected projects can be modified.';
          } else if (error.includes('permission') || error.includes('unauthorized')) {
            errorMessage = 'You do not have permission to edit this project story.';
          } else if (error.includes('not found')) {
            errorMessage = 'The project or story could not be found. It may have been deleted.';
          }
        }
        // Handle Error objects
        else if (error instanceof Error) {
          errorMessage = error.message || 'An error occurred during save';
        }

        setApiError(errorMessage);
        setSavingStatus('error');
        return false;
      }
    } catch (error) {
      console.error('Error saving story:', error);
      setApiError('An unexpected error occurred while processing your story. Please try again.');
      setSavingStatus('error');
      return false;
    }
  }, [storyId, storyData, propProjectId, router.query.id, parseHtmlToBlocks, processYouTubeUrls, updateFormData, debugContent, debugYouTubeContent]);

  useEffect(() => {
    let autosaveTimer;

    if (storyData.story && savingStatus === 'idle') {

    }

    return () => {
      if (autosaveTimer) {
        clearTimeout(autosaveTimer);
      }
    };
  }, [storyData.story, storyId, savingStatus, updateStory]);

  // Handle image uploads
  const handleImageUpload = useCallback(async (file, editorState) => {
    try {
      // Use project ID from props or URL
      const currentProjectId = propProjectId || router.query.id;
      const cursorPosition = editorState?.selection?.from || 0;
      if (!currentProjectId) {
        console.error('No project ID available for image upload');
        return null;
      }

      console.log('Starting image upload process with project ID:', currentProjectId);

      let targetStoryId = storyId;

      // Create the story first if it doesn't exist
      if (!targetStoryId) {
        console.log('No story ID available - creating story first before image upload');

        try {
          // Use existing content from editor if available
          const currentEditorContent = storyData.story || '<p>Project story</p>';
          const storyBlocks = parseHtmlToBlocks(currentEditorContent);

          const maxOrder = storyBlocks.length > 0
            ? Math.max(...storyBlocks.map(block => block.order || 0))
            : -1;
          const newImageOrder = maxOrder + 1;

          // Add a placeholder image block - this helps us track where to put the image
          const imageBlock = {
            type: 'IMAGE',
            content: 'placeholder-for-uploading-image',
            order: newImageOrder,
            metadata: {
              additionalProp1: {
                width: "100%",
                class: "story-image",
                alt: file.name || "Project image"
              }
            }
          };

          storyBlocks.push(imageBlock);
          const payload = { blocks: storyBlocks };

          console.log('Creating story for image upload with blocks:', storyBlocks.length);

          // Create the project story
          const result = await projectService.createProjectStory(currentProjectId, payload);
          console.log('Create story API response:', result);

          // Handle different response formats
          // Check if we have a result object with data property
          let newStoryId = null;
          if (result && result.data && result.data.projectStoryId) {
            newStoryId = result.data.projectStoryId;
          }
          // Check if the result itself is the story object
          else if (result && result.projectStoryId) {
            newStoryId = result.projectStoryId;
          }
          // Check if result has an id property
          else if (result && result.id) {
            newStoryId = result.id;
          }
          // Check if the entire result is just the ID
          else if (result && typeof result === 'number') {
            newStoryId = result;
          }
          // Check if the result is a string ID
          else if (result && typeof result === 'string' && !isNaN(parseInt(result))) {
            newStoryId = parseInt(result);
          }

          // If we still don't have an ID, try to get it from the location header
          if (!newStoryId && result && result.headers && result.headers.location) {
            const locationParts = result.headers.location.split('/');
            const potentialId = locationParts[locationParts.length - 1];
            if (!isNaN(parseInt(potentialId))) {
              newStoryId = parseInt(potentialId);
            }
          }

          if (!newStoryId) {
            // As a fallback, try fetching the story by project ID to see if it was created
            console.log('No story ID found in response, attempting to fetch by project ID');
            try {
              const fetchedStory = await projectService.getProjectStoryByProjectId(currentProjectId);
              if (fetchedStory && fetchedStory.projectStoryId) {
                newStoryId = fetchedStory.projectStoryId;
              } else if (fetchedStory && fetchedStory.id) {
                newStoryId = fetchedStory.id;
              } else if (fetchedStory && fetchedStory.data && fetchedStory.data.projectStoryId) {
                newStoryId = fetchedStory.data.projectStoryId;
              }
            } catch (fetchError) {
              console.error('Error fetching story after creation:', fetchError);
            }
          }

          if (!newStoryId) {
            throw new Error('Failed to get story ID from API response');
          }

          // Store the new story ID
          targetStoryId = newStoryId;
          console.log('Successfully got story ID:', targetStoryId);
          setStoryId(targetStoryId);

          // Proceed with image upload using the new story ID
          console.log('Now retrieving created story to find image block ID');
          const retrievedStory = await projectService.getProjectStoryByProjectId(currentProjectId);

          if (!retrievedStory) {
            throw new Error('Failed to retrieve created story');
          }

          // Handle different API response formats
          const retrievedBlocks = retrievedStory.blocks ||
            (retrievedStory.data && retrievedStory.data.blocks) || [];

          console.log(`Retrieved ${retrievedBlocks.length} blocks from newly created story`);

          // Find the placeholder block we just created
          const placeholderBlock = retrievedBlocks.find(block =>
            block.type === 'IMAGE' &&
            (block.content === 'placeholder-for-uploading-image' || block.content === 'string')
          );

          if (!placeholderBlock || !placeholderBlock.storyBlockId) {
            throw new Error('Could not find image placeholder block in story');
          }

          console.log('Found placeholder block with ID:', placeholderBlock.storyBlockId);

          // Upload image to this specific block
          const uploadResult = await projectService.uploadStoryImage(placeholderBlock.storyBlockId, file);
          console.log('Upload result:', uploadResult);

          // Return the image URL from result - handle different response formats
          if (typeof uploadResult === 'string' && uploadResult.startsWith('http')) {
            console.log('Returning direct URL from upload:', uploadResult);
            return uploadResult;
          }

          // Handle object response with URL property
          if (uploadResult && typeof uploadResult === 'object') {
            if (uploadResult.url && typeof uploadResult.url === 'string') {
              console.log('Returning URL from result object:', uploadResult.url);
              return uploadResult.url;
            }

            if (uploadResult.data && uploadResult.data.url) {
              console.log('Returning URL from result.data:', uploadResult.data.url);
              return uploadResult.data.url;
            }

            if (uploadResult.content && typeof uploadResult.content === 'string' &&
              uploadResult.content.startsWith('http')) {
              console.log('Returning content URL from result:', uploadResult.content);
              return uploadResult.content;
            }
          }

          // If we still don't have a URL, check the updated story
          console.log('No URL in response, checking updated story blocks');
          const finalStory = await projectService.getProjectStoryByProjectId(currentProjectId);
          const finalBlocks = finalStory.blocks || (finalStory.data && finalStory.data.blocks) || [];

          const updatedBlock = finalBlocks.find(b => b.storyBlockId === placeholderBlock.storyBlockId);
          if (updatedBlock && updatedBlock.content && typeof updatedBlock.content === 'string' &&
            updatedBlock.content.startsWith('http')) {
            console.log('Found URL in updated block:', updatedBlock.content);
            return updatedBlock.content;
          }

          console.error('Failed to get image URL after upload');
          return null;

        } catch (error) {
          console.error('Error creating story for image upload:', error);
          return null;
        }
      } else {
        // We already have a story ID, use this for upload
        console.log('Using existing story ID for upload:', targetStoryId);
        const imageResult = await uploadImage(file, targetStoryId);

        // Return just the URL string
        if (typeof imageResult === 'string' && imageResult.startsWith('http')) {
          return imageResult;
        } else if (imageResult && imageResult.url) {
          return imageResult.url;
        }

        console.error('Invalid response from uploadImage');
        return null;
      }
    } catch (error) {
      console.error('Error in image upload process:', error);
      return null;
    }
  }, [storyId, propProjectId, router.query.id, storyData, uploadImage, parseHtmlToBlocks]);

  // Replace the uploadImage function with this improved version

  const uploadImage = async (file, targetStoryId) => {
    try {
      console.log('Starting image upload process...');

      // Get current project ID
      const currentProjectId = propProjectId || router.query.id;
      if (!currentProjectId) {
        throw new Error('No project ID available for image upload');
      }

      // If no story ID is provided, we need to create the story first with current content
      if (!targetStoryId) {
        console.log('No story ID - creating story first before uploading image');

        try {
          // Step 1: Create story with current editor content
          const currentEditorContent = storyData.story || '<h1>Project Story</h1><p>Tell your story here...</p>';
          const storyBlocks = parseHtmlToBlocks(currentEditorContent);

          // Add a placeholder image block AT THE END of the story blocks
          const uniqueId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const imageBlock = {
            type: 'IMAGE',
            content: `placeholder-for-uploading-image-${uniqueId}`,
            order: storyBlocks.length, // Ensure it goes at the end
            metadata: {
              additionalProp1: {
                width: "100%",
                class: "story-image",
                alt: file.name || "Project image",
                uniqueId: uniqueId // Adding uniqueId to ensure we can find it later
              }
            }
          };

          storyBlocks.push(imageBlock);

          // Create story with current content + placeholder
          console.log('Creating new story with current editor content');
          const result = await projectService.createProjectStory(currentProjectId, { blocks: storyBlocks });

          if (!result || !result.data || !result.data.projectStoryId) {
            throw new Error('Failed to create story - invalid response');
          }

          // Step 2: Set the new story ID in state
          const newStoryId = result.data.projectStoryId;
          console.log('Story created successfully with ID:', newStoryId);
          setStoryId(newStoryId);

          // Step 3: NOW get the story to find the placeholder block ID
          console.log('Retrieving created story to find image block ID');
          const retrievedStory = await projectService.getProjectStoryByProjectId(currentProjectId);

          if (!retrievedStory) {
            throw new Error('Failed to retrieve created story');
          }

          // Handle different API response formats
          const retrievedBlocks = retrievedStory.blocks ||
            (retrievedStory.data && retrievedStory.data.blocks) || [];

          console.log(`Retrieved ${retrievedBlocks.length} blocks from newly created story`);

          // Find the placeholder block we just created - look for our unique ID
          const placeholderBlock = retrievedBlocks.find(block =>
            block.type === 'IMAGE' &&
            (block.content === `placeholder-for-uploading-image-${uniqueId}` ||
              (block.metadata &&
                typeof block.metadata === 'object' &&
                block.metadata.additionalProp1 &&
                block.metadata.additionalProp1.uniqueId === uniqueId))
          );

          if (!placeholderBlock || !placeholderBlock.storyBlockId) {
            throw new Error('Could not find image placeholder block in story');
          }

          console.log('Found placeholder image block with ID:', placeholderBlock.storyBlockId);

          // Step 4: Upload image to the specific block
          console.log('Uploading image to block ID:', placeholderBlock.storyBlockId);
          const uploadResult = await projectService.uploadStoryImage(placeholderBlock.storyBlockId, file);

          // Step 5: Get the image URL
          let uploadedImageUrl = null;
          if (typeof uploadResult === 'string' && uploadResult.startsWith('http')) {
            console.log('Received URL from upload:', uploadResult);
            uploadedImageUrl = uploadResult;
          }
          // Handle object response with URL
          else if (uploadResult && typeof uploadResult === 'object') {
            // Check common URL patterns
            if (uploadResult.url && typeof uploadResult.url === 'string') {
              uploadedImageUrl = uploadResult.url;
            }
            else if (uploadResult.data && uploadResult.data.url) {
              uploadedImageUrl = uploadResult.data.url;
            }
            else if (uploadResult.content && typeof uploadResult.content === 'string' &&
              uploadResult.content.startsWith('http')) {
              uploadedImageUrl = uploadResult.content;
            }
          }

          // If no URL found yet, check the story again
          if (!uploadedImageUrl) {
            console.log('No direct URL in response, checking updated story');
            const finalStory = await projectService.getProjectStoryByProjectId(currentProjectId);
            const finalBlocks = finalStory.blocks || (finalStory.data && finalStory.data.blocks) || [];

            const updatedBlock = finalBlocks.find(b => b.storyBlockId === placeholderBlock.storyBlockId);
            if (updatedBlock && updatedBlock.content && typeof updatedBlock.content === 'string' &&
              updatedBlock.content.startsWith('http')) {
              uploadedImageUrl = updatedBlock.content;
            }
          }

          // If we still don't have a URL, throw an error
          if (!uploadedImageUrl) {
            throw new Error('Could not find image URL after upload');
          }

          // Now, instead of filtering out the placeholder, let's keep ONLY the IMAGE block
          // and remove ANY duplicates that might appear in TEXT blocks
          const storyToCleanup = await projectService.getProjectStoryByProjectId(currentProjectId);
          const blocksToCleanup = storyToCleanup.blocks ||
            (storyToCleanup.data && storyToCleanup.data.blocks) || [];

          // Find our newly created image block with the actual image URL
          const actualImageBlock = blocksToCleanup.find(block =>
            block.storyBlockId === placeholderBlock.storyBlockId &&
            block.type === 'IMAGE' &&
            block.content.startsWith('http')
          );

          if (!actualImageBlock) {
            console.error('Could not find the uploaded image block');
            return uploadedImageUrl; // Return the URL but don't attempt cleanup
          }

          // Process each TEXT block to remove any instances of this same image
          const cleanBlocks = blocksToCleanup.map(block => {
            // If it's not a TEXT block, keep as is
            if (block.type !== 'TEXT') {
              return {
                type: block.type,
                content: block.content,
                order: block.order,
                metadata: {
                  additionalProp1:
                    (block.metadata && block.metadata.additionalProp1) ||
                    (typeof block.metadata === 'object' ? block.metadata : {})
                }
              };
            }

            // For TEXT blocks, check if they contain the image
            if (block.content && block.content.includes(uploadedImageUrl)) {
              // Create a temporary element to handle the HTML
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = block.content;

              // Find all images with our uploaded URL
              const duplicateImages = Array.from(tempDiv.querySelectorAll(`img[src="${uploadedImageUrl}"]`));

              // Remove all instances of this image from the TEXT block
              duplicateImages.forEach(img => {
                // If the image is the only content in a paragraph, remove the whole paragraph
                const paragraphParent = img.closest('p');
                if (paragraphParent) {
                  const paragraphClone = paragraphParent.cloneNode(true);
                  paragraphClone.querySelector(`img[src="${uploadedImageUrl}"]`).remove();

                  // If paragraph is now empty (or just whitespace), remove the whole paragraph
                  if (paragraphClone.textContent.trim() === '') {
                    paragraphParent.remove();
                  } else {
                    // Otherwise just remove the image
                    img.remove();
                  }
                } else {
                  // No paragraph parent, just remove the image
                  img.remove();
                }
              });

              // Return cleaned TEXT block
              return {
                type: block.type,
                content: tempDiv.innerHTML,
                order: block.order,
                metadata: {
                  additionalProp1:
                    (block.metadata && block.metadata.additionalProp1) ||
                    (typeof block.metadata === 'object' ? block.metadata : {})
                }
              };
            }

            // No image found, return the block as is
            return {
              type: block.type,
              content: block.content,
              order: block.order,
              metadata: {
                additionalProp1:
                  (block.metadata && block.metadata.additionalProp1) ||
                  (typeof block.metadata === 'object' ? block.metadata : {})
              }
            };
          });

          // Filter out empty TEXT blocks after cleanup
          const finalCleanBlocks = cleanBlocks.filter(block => {
            if (block.type !== 'TEXT') return true;

            // Check if TEXT block is now empty
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = block.content;
            return tempDiv.textContent.trim() !== '' || tempDiv.querySelectorAll('img').length > 0;
          });

          // Update the story without duplicates
          console.log('Cleaning up by removing duplicate images from TEXT blocks');
          await projectService.updateProjectStory(newStoryId, { blocks: finalCleanBlocks });

          // Return the URL to be inserted by the editor normally
          return uploadedImageUrl;
        } catch (error) {
          console.error('Error in create-then-upload flow:', error);
          return null;
        }
      } else {
        // We already have a story ID, use the normal upload process for existing story
        console.log('Using existing story ID for upload:', targetStoryId);

        try {
          // Add a unique ID to help us track this specific image upload
          const uniqueId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          // Step 1: Add a placeholder image block to the existing story
          const existingStory = await projectService.getProjectStoryByProjectId(currentProjectId);
          const existingBlocks = existingStory?.blocks ||
            (existingStory?.data && existingStory.data.blocks) || [];

          // Determine highest order for new block - ensure it goes at the very end
          const highestOrder = existingBlocks.length > 0 ?
            Math.max(...existingBlocks.map(b => b.order || 0)) + 1 : 0;

          // Create placeholder image block with a unique ID
          const imageBlock = {
            type: 'IMAGE',
            content: `placeholder-for-uploading-image-${uniqueId}`,
            order: highestOrder, // Put at the end
            metadata: {
              additionalProp1: {
                width: "100%",
                class: "story-image",
                alt: file.name || "Project image",
                uniqueId: uniqueId // Add this to ensure uniqueness
              }
            }
          };

          // Clean existing blocks for API
          const cleanBlocks = existingBlocks.map(block => {
            // Keep only fields the API expects
            return {
              type: block.type,
              content: block.content,
              order: block.order,
              metadata: {
                additionalProp1:
                  (block.metadata && block.metadata.additionalProp1) ||
                  (typeof block.metadata === 'object' ? block.metadata : {})
              }
            };
          });

          // Add placeholder and update story
          const updatedBlocks = [...cleanBlocks, imageBlock];
          await projectService.updateProjectStory(targetStoryId, { blocks: updatedBlocks });

          // Get updated story with new block ID
          const updatedStory = await projectService.getProjectStoryByProjectId(currentProjectId);
          const updatedBlocks2 = updatedStory?.blocks ||
            (updatedStory?.data && updatedStory.data.blocks) || [];

          // Find the placeholder block - look specifically for our unique content
          const placeholderBlock = updatedBlocks2.find(block =>
            block.type === 'IMAGE' &&
            ((block.content === `placeholder-for-uploading-image-${uniqueId}`) ||
              (block.metadata &&
                typeof block.metadata === 'string' &&
                block.metadata.includes(uniqueId)) ||
              (block.metadata &&
                typeof block.metadata === 'object' &&
                block.metadata.additionalProp1 &&
                block.metadata.additionalProp1.uniqueId === uniqueId))
          );

          if (!placeholderBlock || !placeholderBlock.storyBlockId) {
            throw new Error('Could not find placeholder block after update');
          }

          // Upload image to the placeholder block
          const uploadResult = await projectService.uploadStoryImage(placeholderBlock.storyBlockId, file);

          // Get the URL from result
          let uploadedImageUrl = null;
          if (typeof uploadResult === 'string' && uploadResult.startsWith('http')) {
            uploadedImageUrl = uploadResult;
          }
          else if (uploadResult && typeof uploadResult === 'object' && uploadResult.url) {
            uploadedImageUrl = uploadResult.url;
          }
          else if (uploadResult && typeof uploadResult === 'object' && uploadResult.content &&
            uploadResult.content.startsWith('http')) {
            uploadedImageUrl = uploadResult.content;
          }

          // If no URL yet, check updated story
          if (!uploadedImageUrl) {
            const finalStory = await projectService.getProjectStoryByProjectId(currentProjectId);
            const finalBlocks = finalStory.blocks || (finalStory.data && finalStory.data.blocks) || [];

            const updatedBlock = finalBlocks.find(b => b.storyBlockId === placeholderBlock.storyBlockId);
            if (updatedBlock && updatedBlock.content && typeof updatedBlock.content === 'string' &&
              updatedBlock.content.startsWith('http')) {
              uploadedImageUrl = updatedBlock.content;
            }
          }

          if (!uploadedImageUrl) {
            throw new Error('Could not get image URL after upload');
          }

          // Get the story blocks again to clean up any potential duplicates
          const storyToCleanup = await projectService.getProjectStoryByProjectId(currentProjectId);
          const blocksToCleanup = storyToCleanup.blocks ||
            (storyToCleanup.data && storyToCleanup.data.blocks) || [];

          // Process TEXT blocks to remove any instances of this same image
          const cleanedBlocks = blocksToCleanup.map(block => {
            // If it's not a TEXT block, keep as is
            if (block.type !== 'TEXT') {
              return {
                type: block.type,
                content: block.content,
                order: block.order,
                metadata: {
                  additionalProp1:
                    (block.metadata && block.metadata.additionalProp1) ||
                    (typeof block.metadata === 'object' ? block.metadata : {})
                }
              };
            }

            // For TEXT blocks, check if they contain the image
            if (block.content && block.content.includes(uploadedImageUrl)) {
              // Create a temporary element to handle the HTML
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = block.content;

              // Find all images with our uploaded URL
              const duplicateImages = Array.from(tempDiv.querySelectorAll(`img[src="${uploadedImageUrl}"]`));

              // Remove all instances of this image from the TEXT block
              duplicateImages.forEach(img => {
                // If the image is the only content in a paragraph, remove the whole paragraph
                const paragraphParent = img.closest('p');
                if (paragraphParent) {
                  const paragraphClone = paragraphParent.cloneNode(true);
                  paragraphClone.querySelector(`img[src="${uploadedImageUrl}"]`).remove();

                  // If paragraph is now empty (or just whitespace), remove the whole paragraph
                  if (paragraphClone.textContent.trim() === '') {
                    paragraphParent.remove();
                  } else {
                    // Otherwise just remove the image
                    img.remove();
                  }
                } else {
                  // No paragraph parent, just remove the image
                  img.remove();
                }
              });

              // Return cleaned TEXT block
              return {
                type: block.type,
                content: tempDiv.innerHTML,
                order: block.order,
                metadata: {
                  additionalProp1:
                    (block.metadata && block.metadata.additionalProp1) ||
                    (typeof block.metadata === 'object' ? block.metadata : {})
                }
              };
            }

            // No image found, return the block as is
            return {
              type: block.type,
              content: block.content,
              order: block.order,
              metadata: {
                additionalProp1:
                  (block.metadata && block.metadata.additionalProp1) ||
                  (typeof block.metadata === 'object' ? block.metadata : {})
              }
            };
          });

          // Filter out any empty TEXT blocks after cleanup
          const finalCleanBlocks = cleanedBlocks.filter(block => {
            if (block.type !== 'TEXT') return true;

            // Check if TEXT block is now empty
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = block.content;
            return tempDiv.textContent.trim() !== '' || tempDiv.querySelectorAll('img').length > 0;
          });

          // Update the story with cleaned blocks
          console.log('Cleaning up by removing duplicate images from TEXT blocks');
          await projectService.updateProjectStory(targetStoryId, { blocks: finalCleanBlocks });

          // Return the URL to be inserted by the editor
          return uploadedImageUrl;
        } catch (error) {
          console.error('Error updating existing story with image:', error);
          return null;
        }
      }
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
          {hasChanges && (
            <span className="text-xs text-yellow-600">
              You have unsaved changes
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSaveStory}
            disabled={savingStatus === 'saving' || !hasChanges}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {storyId ? 'Save Changes' : 'Create Story'}
          </button>
        </div>
      </div>

      {apiError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Error Saving Story</h3>
              <div className="mt-1 text-sm text-red-700">
                {apiError}
              </div>
              <div className="mt-2 flex space-x-3">
                <button
                  onClick={() => setApiError(null)}
                  className="text-xs text-red-800 font-medium hover:text-red-900"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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