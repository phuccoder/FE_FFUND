import React, { useState } from "react";
import { useRouter } from "next/router";

const SingleExploreProject = ({ project = {}, totalInvested = 0 }) => {
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
    category = {},
    currentPhase = null, 
    processPhase = {} 
  } = project;

  const teamName = team?.teamName || "Unknown Team";
  const teamLeader = team?.teamMembers?.find(member => member.teamRole === "LEADER");
  const leaderAvatar = teamLeader?.memberAvatar || 'https://via.placeholder.com/40';
  const phaseData = currentPhase || processPhase || {};
  
  const calculateDaysLeft = () => {
    const endDate = phaseData.endDate;
    
    if (!endDate) {
      const defaultEndDate = new Date();
      defaultEndDate.setDate(defaultEndDate.getDate() + 30);
      return 30;
    }
    
    let endDateObj;
    try {
      // Handle array format [year, month, day]
      if (Array.isArray(endDate)) {
        // Month is 0-indexed in JavaScript Date
        endDateObj = new Date(endDate[0], endDate[1] - 1, endDate[2]);
      } else {
        // Handle string format
        endDateObj = new Date(endDate);
      }
      
      if (isNaN(endDateObj.getTime())) {
        throw new Error("Invalid date");
      }
      
      const today = new Date();
      const timeLeft = endDateObj - today;
      return Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
      
    } catch (e) {
      console.warn("Invalid end date format:", endDate);
      return 30; // Default fallback
    }
  };

  const daysLeft = calculateDaysLeft();

  
  const raisedAmount = phaseData?.raiseAmount || totalInvested || 0;
  const targetAmount = phaseData?.targetAmount || totalTargetAmount || 0;

  const calculatePercentage = () => {
    if (targetAmount <= 0) return 0;
    
    const percentage = (raisedAmount / targetAmount) * 100;
    return Math.round(percentage);
  };

  const fundingPercentage = calculatePercentage();
  
  const router = useRouter();

  const handleClick = () => {
    localStorage.setItem("selectedProjectId", id);
    router.replace("/single-project");
    window.dispatchEvent(new Event("storage"));
  };

  console.log(`Project ${id} (${title}):`, {
    currentPhase,
    processPhase: phaseData,
    endDate: phaseData?.endDate,
    daysLeft,
    raisedAmount,
    targetAmount,
    fundingPercentage
  });

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

        {/* Investment amount badge */}
        <div className="mb-3">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            You invested: ${totalInvested.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </div>

        <div className="mb-4">
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div
              className={`h-full rounded-full ${fundingPercentage >= 100 ? 'bg-yellow-500' : 'bg-green-600'}`}
              style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-sm text-gray-700 mt-2">
            <span className="font-bold">{fundingPercentage}% funded</span>
            <span>{daysLeft} days left</span>
          </div>

          <div className="text-xs text-gray-500 mt-1">
            ${raisedAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} raised of ${targetAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} goal
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-100 transition-all duration-300">
            <p className="text-sm text-gray-600 mb-3">{description}</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-gray-100 text-gray-800 py-1 px-3 text-xs font-medium rounded-full">
                {category?.name || "Uncategorized"}
              </span>
              <span className="bg-gray-100 text-gray-800 py-1 px-3 text-xs font-medium rounded-full">
                {location?.replace(/_/g, " ") || "Unknown Location"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleExploreProject;