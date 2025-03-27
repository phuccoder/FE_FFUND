import { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import projectService from "../../../services/projectPublicService";

const ProjectDetailsStory = ({ getClassName, project }) => {
  const [projectStory, setProjectStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <div className="text-center text-gray-500">Loading project story...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!projectStory) {
    return <div className="text-center text-gray-500">No project story found.</div>;
  }

  return (
    <div className={`${getClassName?.("pills-home")} p-6 bg-white shadow-md rounded-lg`} id="pills-home" role="tabpanel">
      <Row className="space-y-6">
        {Array.isArray(projectStory.data?.blocks) && projectStory.data.blocks.length > 0 ? (
          projectStory.data.blocks.map((block) => {
            const { storyBlockId, type, content, metadata } = block;

            console.log('Block data:', block);

            if (type === "HEADING") {
              return (
                <Col key={storyBlockId} xs={12}>
                  <h2 className="text-2xl font-bold text-indigo-600">{content}</h2>
                </Col>
              );
            }

            if (type === "TEXT") {
              return (
                <Col key={storyBlockId} xs={12}>
                  <p className="text-lg leading-relaxed text-gray-800" dangerouslySetInnerHTML={{ __html: content }} />
                  {metadata?.additionalProp1?.listType === "bullet" && (
                    <ul className="list-disc pl-5 space-y-2">
                      {content.split("<li>").map((item, index) => {
                        if (item) {
                          return (
                            <li key={index} className="text-gray-700" dangerouslySetInnerHTML={{ __html: item }} />
                          );
                        }
                        return null;
                      })}
                    </ul>
                  )}
                  {metadata?.additionalProp1?.listType === "ordered" && (
                    <ol className="list-decimal pl-5 space-y-2">
                      {content.split("<li>").map((item, index) => {
                        if (item) {
                          return (
                            <li key={index} className="text-gray-700" dangerouslySetInnerHTML={{ __html: item }} />
                          );
                        }
                        return null;
                      })}
                    </ol>
                  )}
                </Col>
              );
            }

            if (type === "IMAGE") {
              return (
                <Col key={storyBlockId} xs={12} md={6} className="flex justify-center">
                  <div className="project-details-thumb max-w-xs">
                    <img src={content} alt="Project Image" className="rounded-lg shadow-lg" />
                  </div>
                </Col>
              );
            }

            if (type === "VIDEO") {
              return (
                <Col key={storyBlockId} xs={12} className="flex justify-center">
                  <div className="project-details-thumb max-w-lg">
                    <iframe
                      src={content}
                      width={metadata?.additionalProp1?.width || "560px"}
                      height={metadata?.additionalProp1?.height || "315px"}
                      className="rounded-lg shadow-xl"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </div>
                </Col>
              );
            }

            return null;
          })
        ) : (
          <div className="text-center text-gray-500">No blocks found.</div>
        )}
      </Row>
    </div>
  );
};

export default ProjectDetailsStory;
