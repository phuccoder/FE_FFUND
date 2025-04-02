import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { likeCommentProjectService } from "../../../services/likeCommentProjectService";
import { toast } from "react-toastify";
import SimilarProjects from "../SimilarProjects";

const ProjectDetailsArea = ({ project, isAuthenticated }) => {
  // Đặt các Hooks ở đầu, trước bất kỳ điều kiện nào
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(!!projectVideoDemo);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (project) {
      const fetchLikeCommentData = async () => {
        try {
          // Lấy số lượng like và comment
          const likeCommentResponse = await likeCommentProjectService.getCountLikesComments(project.id);
          if (likeCommentResponse.status === 200) {
            setLikeCount(likeCommentResponse.data.likeCount);
          }

          // Kiểm tra xem người dùng đã like hay chưa
          const isLikedResponse = await likeCommentProjectService.getIsLiked(project.id);
          if (isLikedResponse.status === 200) {
            setIsLiked(isLikedResponse.data); 
          }
        } catch (error) {
          console.error("Error fetching like/comment data:", error);
        }
      };

      fetchLikeCommentData();
    }
  }, [project]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setIsVideoVisible((prev) => !prev);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleToggleMedia = () => {
    setIsTransitioning(true); 
    setTimeout(() => {
      setIsVideoVisible((prev) => !prev); 
      setIsTransitioning(false); 
    }, 300);
  };

  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      toast.warning("You must log in to like this project.");
      return;
    }

    try {
      if (isLiked) {
        await likeCommentProjectService.unlikeProject(project.id);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        await likeCommentProjectService.likeProject(project.id);
        setLikeCount((prev) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error liking/unliking project:", error);
    }
  };
  // Nếu project chưa được truyền vào, hiển thị loading
  if (!project) {
    return <div>Loading project data...</div>;
  }

  const { title, projectImage, projectUrl, status, category, totalTargetAmount, mainSocialMediaUrl, description, projectVideoDemo, subCategories } = project;

  const raised = 5000;
  const backers = 150;
  const daysLeft = 10;
  const categoryName = category ? category.name : "Uncategorized";
  const raisedPercentage = (raised / totalTargetAmount) * 100 || 0;

  const statusStyle = {
    backgroundColor: "green",
    color: "white",
    padding: "5px 15px",
    borderRadius: "5px",
  };

  // Category style
  const categoryStyle = {
    display: "flex",
    alignItems: "center",
    marginTop: "15px",
    marginBottom: "10px",
  };

  // Main category badge style
  const mainCategoryBadgeStyle = {
    backgroundColor: "#4e7ae7",
    color: "white",
    padding: "8px 16px",
    borderRadius: "20px",
    fontWeight: "500",
    fontSize: "14px",
    display: "inline-flex",
    alignItems: "center",
    marginRight: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  // Sub-category badge style
  const subCategoryBadgeStyle = {
    backgroundColor: "#f8f9fa",
    color: "#495057",
    border: "1px solid #dee2e6",
    padding: "6px 12px",
    borderRadius: "15px",
    fontWeight: "400",
    fontSize: "13px",
    marginRight: "8px",
    marginBottom: "8px",
    transition: "all 0.2s ease",
    cursor: "pointer",
  };

  // Hover effect for subcategories
  const subCategoryHoverStyle = {
    ...subCategoryBadgeStyle,
    backgroundColor: "#e9ecef",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  };

  return (
    <section className="project-details-area pt-120 pb-190">
      <Container>
        <Row>
          <Col lg={7}>
            <div className="project-details-thumb">
              <div
                className={`image-container ${isTransitioning ? "fade" : ""}`}
                style={{ textAlign: "center", position: "relative" }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {isVideoVisible && projectVideoDemo ? (
                  <iframe
                    src={`${projectVideoDemo}?autoplay=1&mute=1`}
                    title="Project Video"
                    className="project-video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onPlay={() => setIsPaused(true)} 
                    onPause={() => setIsPaused(false)} 
                  ></iframe>
                ) : (
                  <img
                    src={projectImage}
                    alt={title}
                    width={600}
                    height={600}
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                )}

                {/* Nút chuyển đổi */}
                <button
                  onClick={handleToggleMedia}
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "10px",
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    cursor: "pointer",
                  }}
                >
                  &lt;
                </button>
                <button
                  onClick={handleToggleMedia}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "10px",
                    transform: "translateY(-50%)",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "40px",
                    height: "40px",
                    cursor: "pointer",
                  }}
                >
                  &gt;
                </button>
              </div>
            </div>
          </Col>
          <Col lg={5}>
            <div className="project-details-content">
              <div className="details-btn d-flex align-items-center" style={{ display: "flex", justifyContent: "space-between", gap: "15px" }}>
                {category && (
                  <div style={mainCategoryBadgeStyle}>
                    <i className="fa fa-tag" style={{ marginRight: "8px", paddingLeft: "10px" }}></i>
                    {category.name}
                  </div>
                )}
                <span style={statusStyle}>{status}</span>
              </div>

              {subCategories && subCategories.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", marginBottom: "15px", paddingTop: "10px" }}>
                  {subCategories.map((subCat) => (
                    <div
                      key={subCat.id}
                      style={subCategoryBadgeStyle}
                      onMouseOver={(e) => {
                        Object.assign(e.target.style, subCategoryHoverStyle);
                      }}
                      onMouseOut={(e) => {
                        Object.assign(e.target.style, subCategoryBadgeStyle);
                      }}
                    >
                      {subCat.name}
                    </div>
                  ))}
                </div>
              )}
              {/* Title và Icon Like */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 className="title" style={{ marginTop: '20px', fontSize: '30px' }}>{title}</h3>
                <div
                  className="icon"
                  style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                  onClick={handleLikeToggle}
                >
                  {isLiked ? <FaHeart size={24} color="red" /> : <FaRegHeart size={24} color="gray" />}
                  <span style={{ marginLeft: 5, fontSize: "16px" }}>{likeCount}</span>
                </div>
              </div>
              {description && <p className="description">{description}</p>}
              <div className="project-details-item">
                <div className="item text-center">
                  <h5 className="title">${raised}</h5>
                  <span>Pledged</span>
                </div>
                <div className="item text-center">
                  <h5 className="title">{backers}</h5>
                  <span>Backers</span>
                </div>
                <div className="item text-center">
                  <h5 className="title">{daysLeft}</h5>
                  <span>Days Left</span>
                </div>
              </div>
              <div className="projects-range">
                <div className="projects-range-content">
                  <ul>
                    <li>Raised:</li>
                    <li>{raisedPercentage}%</li>
                  </ul>
                  <div className="range"></div>
                </div>
              </div>
              <div className="projects-goal">
                <span>
                  Goal: <span>{totalTargetAmount ? Number(totalTargetAmount).toLocaleString() : "0"}$</span>
                </span>
              </div>
              <div className="project-btn mt-25">
                <a className="main-btn" href={`/payment?projectId=${project.id}`} rel="noopener noreferrer">
                  Back this project
                </a>
              </div>
              <div className="project-share d-flex align-items-center">
                <span>Share this Project</span>
                <ul>
                  <li>
                    <a href={mainSocialMediaUrl}>
                      <i className="fa fa-facebook"></i>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default ProjectDetailsArea;