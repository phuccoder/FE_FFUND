import { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import projectService from "../../../services/projectService";

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
        console.log('Fetching project story for projectId:', id);
        const data = await projectService.getProjectStoryByProjectId(id);
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
    return <div>Loading project story...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!projectStory) {
    return <div>No project story found.</div>;
  }

  return (
    <div className={getClassName?.("pills-home")} id="pills-home" role="tabpanel">
      <Row>
        {Array.isArray(projectStory.data?.blocks) && projectStory.data.blocks.length > 0 ? (
          projectStory.data.blocks.map((block) => {
            const { storyBlockId, type, content, metadata } = block;

            console.log('Block data:', block);

            if (type === "HEADING") {
              return (
                <Col key={storyBlockId} xs={12}>
                  <h2>{content}</h2>
                </Col>
              );
            }

            if (type === "TEXT") {
              return (
                <Col key={storyBlockId} xs={12}>
                  <p dangerouslySetInnerHTML={{ __html: content }} />
                  {metadata?.additionalProp1?.listType === "bullet" && (
                    <ul>
                      {content.split("<li>").map((item, index) => {
                        if (item) {
                          return (
                            <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
                          );
                        }
                        return null;
                      })}
                    </ul>
                  )}
                  {metadata?.additionalProp1?.listType === "ordered" && (
                    <ol>
                      {content.split("<li>").map((item, index) => {
                        if (item) {
                          return (
                            <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
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
                <Col key={storyBlockId} xs={12} md={6}>
                  <div className="project-details-thumb">
                    <img src={content} alt="Project Image" width={400} height={200} />
                  </div>
                </Col>
              );
            }

            if (type === "VIDEO") {
              return (
                <Col key={storyBlockId} xs={12}>
                  <div className="project-details-thumb">
                    <iframe
                      src={content}
                      width={metadata?.additionalProp1?.width || "560px"}
                      height={metadata?.additionalProp1?.height || "315px"}
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
          <div>No blocks found.</div>
        )}
      </Row>
    </div>
  );
};

export default ProjectDetailsStory;
