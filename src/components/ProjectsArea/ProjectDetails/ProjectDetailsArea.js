import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { likeCommentProjectService } from "../../../services/likeCommentProjectService";
import { toast } from "react-toastify";
import { tokenManager } from "@/utils/tokenManager";

const ProjectDetailsArea = ({ project, isAuthenticated }) => {
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
    if (tokenManager.getValidToken() === null) {
      toast.warning("You must log in to like this project.");
      return;
    }

    if (!project?.id) {
      console.error("Project ID is missing. Cannot like/unlike the project.");
      return;
    }

    try {
      if (isLiked) {
        const response = await likeCommentProjectService.unlikeProject(project.id);
        if (response.status === 200) {
          setLikeCount((prev) => Math.max(0, prev - 1));
          setIsLiked(false);
        } else {
          console.error("Failed to unlike the project:", response);
        }
      } else {
        const response = await likeCommentProjectService.likeProject(project.id);
        if (response.status === 200) {
          setLikeCount((prev) => prev + 1);
          setIsLiked(true);
        } else {
          console.error("Failed to like the project:", response);
        }
      }
    } catch (error) {
      console.error("Error liking/unliking project:", error);
      toast.error("An error occurred while processing your request.");
    }
  };

  if (!project) {
    return <div>Loading project data...</div>;
  }

  const { title, projectImage, projectUrl, status, category, totalTargetAmount, mainSocialMediaUrl, description, projectVideoDemo, subCategories, currentPhase } = project;

  const raised = currentPhase?.raiseAmount || 0;
  const backers = currentPhase?.totalInvestors || 0;
  const calculateDaysLeft = () => {
    if (!currentPhase?.endDate) return 0;

    const today = new Date();
    const endDate = new Date(currentPhase.endDate);
    const timeLeft = endDate - today;
    return Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = calculateDaysLeft();
  const categoryName = category ? category.name : "Uncategorized";
  const targetAmount = currentPhase?.targetAmount || 0;
  const raisedPercentage = targetAmount > 0 ? (currentPhase?.raiseAmount / targetAmount) * 100 : 0;

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

  const numberToOrdinal = (num) => {
    const suffixes = ["th", "st", "nd", "rd"];
    const value = num % 100;
    return num + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]);
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
              <div className="project-details-item mt-3">
                {currentPhase ? (
                  <>
                    <div className="item text-center">
                      <h5 className="title">{numberToOrdinal(currentPhase.phaseNumber)}</h5>
                      <span>Phase</span>
                    </div>
                    <div className="item text-center">
                      <h5 className="title">${raised}</h5>
                      <span>Pledged</span>
                    </div>
                    <div className="item text-center">
                      <h5 className="title">{backers}</h5>
                      <span>Investors</span>
                    </div>
                    <div className="item text-center">
                      <h5 className="title">{daysLeft}</h5>
                      <span>Days Left</span>
                    </div>
                  </>
                ) : (
                    <div className="w-full text-center py-3">
                      <span className="bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-2 rounded-full inline-flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Investment Opens Soon
                      </span>
                    </div>
                )}
              </div>

              {currentPhase ? (
                <>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-3">
                    <div
                      className={`h-full rounded-full ${raisedPercentage >= 100 ? "complete-progress" : ""}`}
                      style={{
                        width: `${Math.min(raisedPercentage, 100)}%`,
                        background: raisedPercentage >= 100
                          ? "linear-gradient(90deg, #16a34a, #4ade80, #16a34a)"
                          : "#16a34a",
                        backgroundSize: raisedPercentage >= 100 ? "200% 200%" : "100% 100%",
                        transition: "width 0.5s ease-in-out",
                      }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-sm text-gray-700 mt-2">
                    <span className={`font-bold ${raisedPercentage >= 100 ? "highlight-text" : ""}`}>
                      {Math.round(raisedPercentage)}% funded
                    </span>
                    <span>{daysLeft} days left</span>
                  </div>

                  <div className="projects-goal">
                    <span>
                      Current Phase Goal: <span>{currentPhase.targetAmount ? Number(currentPhase.targetAmount).toLocaleString() : "0"}$</span>
                    </span>
                    <br />
                    <span>
                      Total Project Goal: <span>{totalTargetAmount ? Number(totalTargetAmount).toLocaleString() : "0"}$</span>
                    </span>
                  </div>
                </>
              ) : (
                <div className="projects-goal mt-3">
                  <span>
                    Total Project Goal: <span>{totalTargetAmount ? Number(totalTargetAmount).toLocaleString() : "0"}$</span>
                  </span>
                </div>
              )}
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