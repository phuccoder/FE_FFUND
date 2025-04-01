import React, { useState } from "react";
import { useRouter } from "next/router";

const SingleProject = ({ project = {}, processPhase = null }) => {
  const [showVideo, setShowVideo] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const {
    id,
    title,
    description,
    projectImage,
    projectVideoDemo,
    totalTargetAmount,
    isClassPotential,
    location,
    team = {},
    category = {}
  } = project;

  // Get team information
  const teamName = team?.teamName || "Unknown Team";
  const teamLeader = team?.teamMembers?.find(member => member.teamRole === "LEADER");
  const leaderAvatar = teamLeader?.memberAvatar || 'https://via.placeholder.com/40';

  const calculateDaysLeft = () => {
    if (!processPhase?.endDate) return 0;

    const today = new Date();
    const endDate = new Date(processPhase.endDate);
    const timeLeft = endDate - today;
    return Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = calculateDaysLeft();

  // Calculate funding percentage
  const calculatePercentage = () => {
    return Math.min(30 * 100, 100).toFixed(0);
  };

  const fundingPercentage = calculatePercentage();

  const router = useRouter();

  const handleClick = () => {
    localStorage.setItem("selectedProjectId", id);
    router.push("/single-project");
  };

  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      {/* Project Image/Video Container */}
      <div
        className="relative cursor-pointer h-56 bg-gray-200 overflow-hidden"
        onMouseEnter={() => setShowVideo(true)}
        onMouseLeave={() => setShowVideo(false)}
        onClick={handleClick}
      >
        {showVideo && projectVideoDemo ? (
          <iframe
            src={`${projectVideoDemo}?autoplay=1&mute=1`}
            className="w-full h-full object-cover"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : (
          <img
            src={projectImage || 'https://via.placeholder.com/600x400'}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        )}

        {/* Category badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-green-400 text-white py-1 px-3 text-xs font-medium rounded-full shadow-sm">
            {category?.name || "Uncategorized"}
          </span>
        </div>

        {/* Potential Project Icon */}
        {isClassPotential && (
          <div className="absolute top-4 right-4 z-10">
            <span className="bg-yellow-400 text-white p-1 rounded-full shadow-sm flex items-center justify-center w-6 h-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
          </div>
        )}
      </div>

      {/* Project Content */}
      <div className="p-5">
        {/* Team info and title */}
        <div className="flex items-center mb-3">
          <img
            src={leaderAvatar}
            alt="Team Leader"
            className="w-8 h-8 rounded-full mr-2 object-cover border-2 border-green-500"
          />
          <div>
            <h3
              className="text-xl font-bold text-gray-800 cursor-pointer hover:text-green-600 transition-colors duration-300"
              onClick={handleClick}
            >
              {title || "Untitled Project"}
            </h3>
            <p className="text-xs text-gray-500">by {teamName}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className={`h-full rounded-full ${fundingPercentage >= 100 ? 'bg-green-500' : 'bg-green-600'}`}
              style={{ width: `${fundingPercentage}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-sm text-gray-700 mt-2">
            <span className="font-bold">{fundingPercentage}% funded</span>
            <span>{daysLeft} days left</span>
          </div>
        </div>

        {/* Popup details on hover */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-100 transition-all duration-300">
            <p className="text-sm text-gray-600 mb-3">{description}</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-gray-100 text-gray-800 py-1 px-3 text-xs font-medium rounded-full">
                {category?.name || "Uncategorized"}
              </span>
              <span className="bg-gray-100 text-gray-800 py-1 px-3 text-xs font-medium rounded-full">
                {location?.replace("_", " ") || "Unknown Location"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleProject;