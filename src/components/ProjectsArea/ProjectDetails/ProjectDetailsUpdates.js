import { useState, useEffect } from "react";
import { Col, Row } from "react-bootstrap";
import projectService from "../../../services/projectPublicService";

const ProjectDetailsUpdates = ({ getClassName, project }) => {
  const [updates, setUpdates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { id } = project;

  useEffect(() => {
    const fetchUpdates = async () => {
      setLoading(true);
      setError(null);
      try {
        const updatesData = await projectService.getUpdatePostByProjectId(project.id);
        console.log("Received updates data:", updatesData);
        setUpdates(updatesData);

      } catch (error) {
        setError("Failed to fetch updates.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUpdates();
    } else {
      setError("No valid project ID.");
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <div className="text-center text-gray-500">Loading updates...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  if (!updates) {
    return <div className="text-center text-gray-500">No project update post found.</div>;
  }

  return (
    <div className={`${getClassName?.("pills-contact")} p-6 bg-white shadow-md rounded-lg`} id="pills-contact" role="tabpanel">
      <Row className="space-y-6">
        {updates.length > 0 ? (
          updates.map((update) => (
            <Col key={update.projectUpdatePostId} xs={12} className="mb-4">
              <div className="project-details-updates">
                <div className="project-details-updates-top">
                  <h3 className="title">{update.title}</h3>
                  <div className="info-updates d-flex justify-content-between align-items-center">
                    <div className="info">
                      {update.postMedia && (
                        <img
                          src={update.postMedia}
                          alt={update.title}
                          className="img-fluid rounded-lg shadow-lg"
                        />
                      )}
                      <span>
                        by <span>{new Date(update.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                    <div className="update">
                      <span>#{update.projectUpdatePostId} Update</span>
                    </div>
                  </div>
                </div>
                <div className="project-details-updates-content">
                  <p>{update.postContent}</p>
                </div>
              </div>
            </Col>
          ))
        ) : (
          <Col xs={12} className="text-center text-gray-500">
            <p>No updates available</p>
          </Col>
        )}
      </Row>
    </div>
  );
};

export default ProjectDetailsUpdates;
