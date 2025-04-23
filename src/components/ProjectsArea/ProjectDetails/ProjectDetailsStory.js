import { useEffect, useState, useRef } from "react";
import { Row } from "react-bootstrap";
import projectService from "../../../services/projectPublicService";

const TableOfContents = ({ headings, activeId }) => {
  const scrollToHeading = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(`heading-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Calculate max-height based on content length
  const maxHeight = headings.length > 10 ? '400px' : headings.length > 5 ? '300px' : '200px';

  return (
    <div
      className="bg-white p-4 rounded-lg shadow-md border border-gray-100 ml-auto sticky top-24"
      style={{ maxHeight: maxHeight, overflowY: 'auto' }}
    >
      <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Table of Contents</h3>
      <nav>
        <ul className="space-y-2">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#heading-${heading.id}`}
                onClick={(e) => scrollToHeading(e, heading.id)}
                className={`block py-1 px-2 text-sm rounded transition-colors ${activeId === heading.id
                  ? 'bg-yellow-100 text-yellow-600 font-medium'
                  : 'text-gray-600 hover:text-yellow-500 hover:bg-yellow-50'
                  }`}
              >
                {heading.content}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

const ProjectDetailsStory = ({ getClassName, project }) => {
  const [projectStory, setProjectStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [headings, setHeadings] = useState([]);
  const [activeHeading, setActiveHeading] = useState(null);
  const storyRef = useRef(null);
  const observerRef = useRef(null);

  const { id } = project;

  useEffect(() => {
    const fetchProjectStory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await projectService.getProjectStoryByProjectIdForGuest(id);
        console.log('Received project story data:', data);

        if (data && data.data && Array.isArray(data.data.blocks) && data.data.blocks.length > 0) {
          setProjectStory(data);

          // Extract headings for table of contents
          const extractedHeadings = data.data.blocks
            .filter(block => block.type === "HEADING")
            .map(block => ({
              id: block.storyBlockId,
              content: block.content
            }));

          setHeadings(extractedHeadings);
          if (extractedHeadings.length > 0) {
            setActiveHeading(extractedHeadings[0].id);
          }
        } else {
          setError("Invalid data structure or no blocks found.");
          console.log('Invalid data structure:', data);
        }
      } catch (error) {
        setError("Failed to fetch project story.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProjectStory();
    } else {
      setError("No valid project ID.");
      setLoading(false);
    }
  }, [id]);

  // Clean up previous observer before creating a new one
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // Set up intersection observer to update active heading on scroll
    if (!storyRef.current || headings.length === 0) return;

    // Disconnect previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Filter for entries that are intersecting
        const visibleEntries = entries.filter(entry => entry.isIntersecting);

        if (visibleEntries.length > 0) {
          // Get the topmost visible heading (first in the DOM order that's visible)
          const topVisible = [...visibleEntries].sort((a, b) => {
            const rectA = a.target.getBoundingClientRect();
            const rectB = b.target.getBoundingClientRect();
            return rectA.top - rectB.top;
          })[0];

          const id = topVisible.target.getAttribute('id').replace('heading-', '');
          setActiveHeading(id);
        }
      },
      {
        rootMargin: '-20% 0px -80% 0px',
        threshold: 0.1
      }
    );

    // Wait for the DOM to be ready with the heading elements
    setTimeout(() => {
      const headingElements = document.querySelectorAll('[id^="heading-"]');
      headingElements.forEach(el => observerRef.current.observe(el));
    }, 100);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [headings, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!projectStory) {
    return (
      <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-gray-600 font-medium">No project story found.</p>
      </div>
    );
  }

  return (
    <div className={`${getClassName?.("pills-home")}`} id="pills-home" role="tabpanel">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main content area - 3/4 width on larger screens */}
        <div ref={storyRef} className="lg:col-span-3">
          <div className="bg-white shadow-md rounded-lg p-6 lg:p-8">
            <div className="space-y-8">
              {Array.isArray(projectStory.data?.blocks) && projectStory.data.blocks.length > 0 ? (
                projectStory.data.blocks.map((block) => {
                  const { storyBlockId, type, content, metadata } = block;

                  if (type === "HEADING") {
                    return (
                      <div
                        key={storyBlockId}
                        id={`heading-${storyBlockId}`}
                        className="pt-4 scroll-mt-24" // Add padding-top for scrolling and scroll margin
                      >
                        <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">{content}</h2>
                      </div>
                    );
                  }

                  if (type === "TEXT") {
                    return (
                      <div key={storyBlockId} className="prose max-w-none">
                        {/* Regular paragraph content */}
                        {!metadata?.additionalProp1?.listType && (
                          <div
                            className="text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: content }}
                          />
                        )}

                        {/* Improved Bullet list */}
                        {metadata?.additionalProp1?.listType === "bullet" && (
                          <ul className="list-none pl-0 space-y-3 text-gray-700">
                            {content.split("<li>").map((item, index) => {
                              if (index === 0) return null; // Skip first split which is not a list item
                              return (
                                <li
                                  key={index}
                                  className="flex items-start mb-2 pl-6 relative"
                                >
                                  <span className="absolute left-0 top-2 w-3 h-3 bg-yellow-500 rounded-full"></span>
                                  <span dangerouslySetInnerHTML={{ __html: item.replace("</li>", "") }} />
                                </li>
                              );
                            })}
                          </ul>
                        )}

                        {/* Improved Ordered list */}
                        {metadata?.additionalProp1?.listType === "ordered" && (
                          <ol className="list-none pl-0 space-y-3 text-gray-700 counter-reset-item">
                            {content.split("<li>").map((item, index) => {
                              if (index === 0) return null; // Skip first split which is not a list item
                              return (
                                <li
                                  key={index}
                                  className="flex items-start mb-2 pl-8 relative counter-increment-item"
                                >
                                  <span className="absolute left-0 top-0.5 flex items-center justify-center w-6 h-6 bg-yellow-100 rounded-full text-yellow-700 font-medium text-sm">
                                    {index}
                                  </span>
                                  <span dangerouslySetInnerHTML={{ __html: item.replace("</li>", "") }} />
                                </li>
                              );
                            })}
                          </ol>
                        )}
                      </div>
                    );
                  }

                  if (type === "IMAGE") {
                    return (
                      <div key={storyBlockId} className="flex justify-center my-8">
                        <figure className="relative">
                          <img
                            src={content}
                            alt="Project visual"
                            className="rounded-lg shadow-lg max-w-full object-cover max-h-[600px]"
                          />
                          {metadata?.additionalProp1?.caption && (
                            <figcaption className="text-sm text-gray-500 italic text-center mt-2">
                              {metadata.additionalProp1.caption}
                            </figcaption>
                          )}
                        </figure>
                      </div>
                    );
                  }

                  if (type === "VIDEO") {
                    // Parse metadata to get video properties
                    let videoProps = {};
                    try {
                      if (metadata) {
                        // Handle string metadata (needs parsing) or object metadata
                        const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
                        videoProps = metadataObj?.additionalProp1 || {};
                      }
                    } catch (err) {
                      console.error('Error parsing video metadata:', err);
                    }

                    // Get width and height or use defaults
                    const videoWidth = videoProps.width || '560px';
                    const videoHeight = videoProps.height || '315px';
                    const autoplay = videoProps.autoplay ? '1' : '0';
                    const controls = videoProps.controls ? '1' : '0';

                    // Prepare video URL with parameters if needed
                    let videoUrl = content;
                    if (videoUrl.includes('youtube.com') && !videoUrl.includes('?')) {
                      videoUrl += `?autoplay=${autoplay}&controls=${controls}`;
                    } else if (videoUrl.includes('youtube.com')) {
                      videoUrl += `&autoplay=${autoplay}&controls=${controls}`;
                    }

                    return (
                      <div key={storyBlockId} className="my-8">
                        <div className="w-full mx-auto rounded-lg overflow-hidden shadow-lg"
                          style={{
                            width: videoWidth,
                            height: videoHeight,
                            maxWidth: '100%',
                            margin: '0 auto'
                          }}>
                          <iframe
                            src={videoUrl}
                            style={{ width: '100%', height: '100%' }}
                            frameBorder="0"
                            allowFullScreen
                            title="Embedded video"
                          ></iframe>
                        </div>
                        {videoProps.caption && (
                          <p className="text-sm text-gray-500 italic text-center mt-2">
                            {videoProps.caption}
                          </p>
                        )}
                      </div>
                    );
                  }

                  if (type === "DIVIDER") {
                    return (
                      <hr
                        key={storyBlockId}
                        className="my-8 border-t border-gray-200"
                      />
                    );
                  }

                  if (type === "QUOTE") {
                    return (
                      <blockquote
                        key={storyBlockId}
                        className="border-l-4 border-yellow-400 pl-4 py-2 italic text-gray-700 bg-indigo-50 p-4 rounded-r-lg"
                      >
                        <p dangerouslySetInnerHTML={{ __html: content }} />
                        {metadata?.additionalProp1?.attribution && (
                          <footer className="text-sm text-gray-500 mt-2 font-medium">
                            — {metadata.additionalProp1.attribution}
                          </footer>
                        )}
                      </blockquote>
                    );
                  }

                  return null;
                })
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-lg font-medium">No content blocks found.</p>
                  <p className="text-sm mt-1">The project story appears to be empty.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table of Contents sidebar - 1/4 width on larger screens */}
        {headings.length > 0 && (
          <div className="lg:col-span-1 flex justify-end sticky top-8" style={{ height: 'fit-content'  }}>
            <TableOfContents headings={headings} activeId={activeHeading} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsStory;