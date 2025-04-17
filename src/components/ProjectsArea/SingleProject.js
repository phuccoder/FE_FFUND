import React, { useMemo } from "react";
import { useRouter } from "next/router";
import { Tooltip } from "antd";

const SingleProject = React.memo(({ project = {} }) => {
  const {
    id = null,
    title = "Untitled Project",
    description = "",
    projectImage = "",
    isClassPotential = false,
    location = "Unknown Location",
    teamName = "Unknown Team",
    leaderAvatar = "",
    categoryName = "Uncategorized",
    currentPhase = null,
  } = project;

  // Compute avatar once
  const avatar = useMemo(() => {
    const colors = ["#F59E0B", "#10B981", "#06B6D4", "#F97316"];

    const getColorFromName = (name) => {
      if (!name || name === "Unknown Team") return colors[0];

      const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    };

    const getInitials = (name) => {
      if (!name || name === "Unknown Team") return "UT";

      const words = name.split(" ");
      return words.length === 1
        ? name.substring(0, 2).toUpperCase()
        : (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    const bgColor = getColorFromName(teamName);
    const initials = getInitials(teamName);

    return { bgColor, initials };
  }, [teamName]);

  // Pre-calculate values
  const daysLeft = useMemo(() => {
    if (!currentPhase?.endDate) return 0;
    const today = new Date();
    const endDate = new Date(currentPhase.endDate);
    const timeLeft = endDate - today;
    return Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
  }, [currentPhase?.endDate]);

  const fundingPercentage = useMemo(() => {
    if (!currentPhase?.targetAmount || !currentPhase?.raiseAmount) {
      return 0;
    }
    const percentage = (currentPhase.raiseAmount / currentPhase.targetAmount) * 100;
    return Math.round(percentage);
  }, [currentPhase?.targetAmount, currentPhase?.raiseAmount]);

  // Pre-compute truncated description
  const truncatedDescription = useMemo(() => {
    if (!description) return "";
    return description.length > 150 ? `${description.substring(0, 150)}...` : description;
  }, [description]);

  const router = useRouter();

  // Better event handling
  const handleClick = React.useCallback(() => {
    if (id) {
      localStorage.setItem("selectedProjectId", id);
      router.replace("/single-project");
      window.dispatchEvent(new Event("storage"));
    }
  }, [id, router]);

  // Using transform transition instead of all for better performance
  const hoverStyle = {
    transition: 'transform 0.1s ease',
  };

  return (
    <div
      className="bg-white rounded-md overflow-hidden shadow hover:shadow-md cursor-pointer h-full flex flex-col"
      onClick={handleClick}
      style={hoverStyle}
    >
      {/* Project Image - Using native lazy loading */}
      <div className="relative h-32 bg-gray-200 overflow-hidden">
        <img
          src={projectImage || "https://via.placeholder.com/600x400"}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />

        {/* Category badge - Smaller and repositioned */}
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-green-400 text-white py-0.5 px-2 text-sm font-medium rounded-full shadow-sm">
            {categoryName || "Uncategorized"}
          </span>
        </div>

        {/* Potential Project Icon - Smaller */}
        {isClassPotential && (
          <div className="absolute top-2 right-2 z-10">
            <Tooltip
              title="Project we believe has potential"
              color="#F97316" // Nền màu cam
              styles={{ body: { color: "#FFFFFF" } }} // Chữ màu trắng
            >
              <span
                className="bg-yellow-400 text-white p-0.5 rounded-full shadow-sm flex items-center justify-center w-5 h-5"
                style={{
                  border: "2px dashed #F59E0B",
                  boxShadow: "0 0 4px 2px rgba(245, 158, 11, 0.5)",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Project Content - Reduced padding */}
      <div className="p-3 flex-grow flex flex-col">
        {/* Team info and title - Compact layout */}
        <div className="flex items-center mb-2">
          {leaderAvatar ? (
            <img
              src={leaderAvatar}
              alt="Team Leader"
              className="w-6 h-6 rounded-full mr-2 object-cover border border-green-500"
              loading="lazy"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold border border-green-500"
              style={{ backgroundColor: avatar.bgColor }}
            >
              {avatar.initials}
            </div>
          )}
          <div className="flex justify-between w-full items-center">
            <h3
              className="text-lg font-bold text-gray-800 hover:text-green-600 line-clamp-1"
            >
              {title || "Untitled Project"}
            </h3>
            <p className="text-xs text-gray-500 ml-2 truncate">by {teamName}</p>
          </div>
        </div>

        {/* Progress Bar - Thinner */}
        <div className="mb-2">
          <div className="w-full h-1.5 bg-gray-200 rounded-full">
            <div
              className={`h-full rounded-full ${fundingPercentage >= 100 ? "bg-yellow-500" : "bg-green-600"}`}
              style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-sm text-gray-700 mt-1">
            <span className="font-medium">{fundingPercentage}% funded</span>
            <span>{daysLeft} days left</span>
          </div>
        </div>

        {/* Description - Fixed height */}
        <div className="mb-2">
          <p className="text-xs text-gray-600 line-clamp-2 h-8">{truncatedDescription}</p>
        </div>

        {/* Location - Smaller tag */}
        <div className="mt-auto">
          <span className="bg-gray-100 text-gray-800 py-0.5 px-2 text-xs rounded-full">
            {location?.replace(/_/g, " ") || "Unknown Location"}
          </span>
        </div>
      </div>
    </div>
  );
});


SingleProject.displayName = 'SingleProject';

export default SingleProject;