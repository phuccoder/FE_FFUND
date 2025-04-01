import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { likeCommentProjectService } from "../../../services/likeCommentProjectService";
import { toast } from "react-toastify";

const ProjectDetailsArea = ({ project, isAuthenticated }) => {
  // Đặt các Hooks ở đầu, trước bất kỳ điều kiện nào
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

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

  // Xử lý Like / Unlike
  const handleLikeToggle = async () => {
    if (!isAuthenticated) {
      // Hiển thị thông báo nếu người dùng chưa đăng nhập
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

  const { title, projectImage, projectUrl, status, category, totalTargetAmount, mainSocialMediaUrl, description } = project;

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

  return (
    <section className="project-details-area pt-120 pb-190">
      <Container>
        <Row>
          <Col lg={7}>
            <div className="project-details-thumb">
              <div className="image-container" style={{ textAlign: "center" }}>
                <img
                  src={projectImage}
                  alt={title}
                  width={600}
                  height={600}
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              </div>
            </div>
          </Col>
          <Col lg={5}>
            <div className="project-details-content">
              <div className="details-btn">
                <span style={statusStyle}>{status}</span>
                <div className="flag">
                  <p>{categoryName}</p>
                </div>
              </div>
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