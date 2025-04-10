import React from "react";
import { useRouter } from "next/router";

const SingleProject = ({ project = {} }) => {
  const {
    id,
    title,
    description,
    projectImage,
    totalTargetAmount,
    isClassPotential,
    location,
    team = {},
    category = {},
    currentPhase = null,
  } = project;

  // Get team information
  const teamName = team?.teamName || "Unknown Team";
  const teamLeader = team?.teamMembers?.find((member) => member.teamRole === "LEADER");
  const leaderAvatar = teamLeader?.memberAvatar || "https://via.placeholder.com/40";

  const calculateDaysLeft = () => {
    if (!currentPhase?.endDate) return 0;

    const today = new Date();
    const endDate = new Date(currentPhase.endDate);
    const timeLeft = endDate - today;
    return Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = calculateDaysLeft();

  // Calculate funding percentage
  const calculatePercentage = () => {
    if (!currentPhase?.targetAmount || !currentPhase?.raiseAmount) {
      return 0;
    }
    const percentage = (currentPhase.raiseAmount / currentPhase.targetAmount) * 100;
    return Math.round(percentage);
  };

  const fundingPercentage = calculatePercentage();

  const router = useRouter();

  const handleClick = () => {
    localStorage.setItem("selectedProjectId", id);
    router.replace("/single-project");
    window.dispatchEvent(new Event("storage"));
  };

  // Limit description to 2 lines
  const truncatedDescription =
    description?.length > 100 ? `${description.substring(0, 100)}...` : description;

  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-md hover:border-green-400 hover:border-2 cursor-pointer h-full flex flex-col"
      onClick={handleClick}
      style={{ transition: 'border 0.2s ease' }}
    >
      {/* Project Image */}
      <div className="relative h-56 bg-gray-200 overflow-hidden">
        <img
          src={projectImage || "https://via.placeholder.com/600x400"}
          alt={title}
          className="w-full h-full object-cover"
        />

        {/* Hover Overlay Effect */}
        <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity duration-300"></div>

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
      <div className="p-5 flex-grow flex flex-col">
        {/* Team info and title */}
        <div className="flex items-center mb-3">
          <img
            src={leaderAvatar}
            alt="Team Leader"
            className="w-8 h-8 rounded-full mr-2 object-cover border-2 border-green-500"
          />
          <div>
            <h3
              className="text-xl font-bold text-gray-800 hover:text-green-600"
              style={{ transition: 'color 0.2s ease' }}
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
              className={`h-full rounded-full ${fundingPercentage >= 100 ? "bg-yellow-500" : "bg-green-600"}`}
              style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-sm text-gray-700 mt-2">
            <span className="font-bold">{fundingPercentage}% funded</span>
            <span>{daysLeft} days left</span>
          </div>
        </div>

        {/* Description - Fixed height and line clamp */}
        <div className="mb-3 h-12 overflow-hidden">
          <p className="text-sm text-gray-600 line-clamp-2">{truncatedDescription}</p>
        </div>

        {/* Location */}
        <div className="flex flex-wrap gap-2 mt-auto">
          <span className="bg-gray-100 text-gray-800 py-1 px-3 text-xs font-medium rounded-full">
            {location?.replace(/_/g, " ") || "Unknown Location"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SingleProject;