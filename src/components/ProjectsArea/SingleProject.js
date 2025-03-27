import React from "react";
import { useRouter } from "next/router";

const SingleProject = ({ project = {} }) => {
  const { id, title, createdAt, totalTargetAmount, projectUrl, projectImage } = project;

  const category = project.category ? project.category.name : "Uncategorized"; 
  const date = createdAt ? new Date(createdAt).toLocaleDateString() : "Unknown Date";
  const projectTitle = title || "Untitled Project";

  const router = useRouter();

  const handleClick = () => {
    localStorage.setItem("selectedProjectId", id);
    router.push("/single-project");
  };

  return (
    <div className="mt-8 p-4 bg-white shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative">
        {/* Image with smaller size */}
        <img 
          src={projectImage || 'https://s3-ap-south-1.amazonaws.com/static.awfis.com/wp-content/uploads/2017/07/07184649/ProjectManagement.jpg'}
          alt={projectTitle} 
          className="w-full h-40 object-cover rounded-lg transition-transform duration-300 transform hover:scale-105" 
        />
        <a 
          href={projectUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="absolute top-2 right-2 text-white bg-red-500 p-2 rounded-full shadow-md hover:bg-red-600">
          <i className="fa fa-heart"></i>
        </a>
      </div>

      <div className="mt-4">
        {/* Category with orange background */}
        <div className="flex items-center justify-between">
          <span className="bg-green-600 text-white py-1 px-4 text-sm font-semibold rounded-full">{category}</span>
          <p className="flex items-center text-gray-500">
            <i className="fa fa-clock-o mr-1"></i> {date}
          </p>
        </div>

        {/* Title with hover effect */}
        <h3 
          className="mt-2 text-xl font-semibold text-gray-800 cursor-pointer hover:text-yellow-600" 
          onClick={handleClick}>
          {projectTitle}
        </h3>

        <div className="mt-3">
          <div className="flex justify-between items-center">
            <div>
              <ul className="text-sm text-gray-500">
                <li>Raised:</li>
                <li>0%</li>
              </ul>
            </div>
            <div className="w-full h-2 bg-gray-300 rounded-full mt-2">
              <div className="h-full bg-green-500" style={{ width: '0%' }}></div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <span className="text-sm text-gray-700">Goal: <span className="font-bold text-yellow-500">{totalTargetAmount}</span></span>
        </div>
      </div>
    </div>
  );
};

export default SingleProject;
