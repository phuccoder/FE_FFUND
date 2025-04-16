import React, { useMemo } from "react";
import { useRouter } from "next/router";

const SingleProject = ({ project = {} }) => {
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

  const generateAvatar = useMemo(() => {
    const getColorFromName = (name) => {
      const colors = [
        "#4F46E5", "#10B981", "#EC4899", "#F59E0B", "#6366F1",
        "#8B5CF6", "#06B6D4", "#F97316", "#84CC16",
      ];

      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }

      return colors[Math.abs(hash) % colors.length];
    };

    const getInitials = (name) => {
      if (!name || name === "Unknown Team") return "UT";

      const words = name.split(" ");
      if (words.length === 1) {
        return name.substring(0, 2).toUpperCase();
      }

      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    const bgColor = getColorFromName(teamName);
    const initials = getInitials(teamName);

    return { bgColor, initials };
  }, [teamName]);

  const calculateDaysLeft = () => {
    if (!currentPhase?.endDate) return 0;

    const today = new Date();
    const endDate = new Date(currentPhase.endDate);
    const timeLeft = endDate - today;
    return Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
  };

  const calculatePercentage = () => {
    if (!currentPhase?.targetAmount || !currentPhase?.raiseAmount) {
      return 0;
    }
    const percentage = (currentPhase.raiseAmount / currentPhase.targetAmount) * 100;
    return Math.round(percentage);
  };

  const daysLeft = calculateDaysLeft();
  const fundingPercentage = calculatePercentage();

  const router = useRouter();

  const handleClick = () => {
    localStorage.setItem("selectedProjectId", id);
    router.replace("/single-project");
    window.dispatchEvent(new Event("storage"));
  };

  // Limit description to shorter text
  const truncatedDescription =
    description?.length > 150 ? `${description.substring(0, 150)}...` : description;

  return (
    <div
      className="bg-white rounded-md overflow-hidden shadow hover:shadow-md cursor-pointer h-full flex flex-col"
      onClick={handleClick}
      style={{ transition: 'all 0.1s ease' }}
    >
      {/* Project Image - Reduced height */}
      <div className="relative h-32 bg-gray-200 overflow-hidden">
        <img
          src={projectImage || "https://via.placeholder.com/600x400"}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Hover Overlay Effect - Faster transition */}
        <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity duration-100"></div>

        {/* Category badge - Smaller and repositioned */}
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-green-400 text-white py-0.5 px-2 text-sm font-medium rounded-full shadow-sm">
            {categoryName || "Uncategorized"}
          </span>
        </div>

        {/* Potential Project Icon - Smaller */}
        {isClassPotential && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-yellow-400 text-white p-0.5 rounded-full shadow-sm flex items-center justify-center w-5 h-5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
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
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold border border-green-500"
              style={{ backgroundColor: generateAvatar.bgColor }}
            >
              {generateAvatar.initials}
            </div>
          )}
          <div className="flex justify-between w-full items-center">
            <h3
              className="text-lg font-bold text-gray-800 hover:text-green-600 line-clamp-1 will-change-auto"
            >
              {title || "Untitled Project"}
            </h3>
            <p className="text-xs text-gray-500 ml-4">by {teamName}</p>
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

        {/* Description - Explicitly ensuring 2 lines */}
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
};

export default SingleProject;