import { useState, useEffect } from "react";
import { Col, Row } from "react-bootstrap";
import projectService from "../../../services/projectPublicService";

const ProjectDetailsUpdates = ({ getClassName, project }) => {
  const [updates, setUpdates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeUpdate, setActiveUpdate] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  // Thay đổi màu chủ đạo - Chọn màu cam
  const primaryColorClasses = {
    bg: "bg-yellow-500",
    bgHover: "hover:bg-yellow-600",
    bgLight: "bg-white-100",
    border: "border-yellow-400",
    text: "text-yellow-500",
    textHover: "hover:text-yellow-600",
  };

  // Màu dành riêng cho update mới nhất
  const latestUpdateColorClasses = {
    bg: "bg-blue-500",
    bgHover: "hover:bg-white-600",
    bgLight: "bg-green-300",
    border: "border-blue-400",
    text: "text-blue-500",
    textHover: "hover:text-blue-600",
  };

  const { id } = project;

  useEffect(() => {
    const fetchUpdates = async () => {
      setLoading(true);
      setError(null);
      try {
        const updatesData = await projectService.getUpdatePostByProjectId(project.id);
        console.log("Received updates data:", updatesData);

        // Sắp xếp updates theo thứ tự mới nhất đến cũ nhất
        const sortedUpdates = updatesData.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        );

        setUpdates(sortedUpdates);
        if (sortedUpdates && sortedUpdates.length > 0) {
          setActiveUpdate(sortedUpdates[0].projectUpdatePostId);
        }
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

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className={`animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 ${primaryColorClasses.border}`}></div>
        <span className="ml-4 text-xl text-gray-600">Loading updates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg my-6">
        <p className="font-bold text-lg">Error</p>
        <p className="text-base">{error}</p>
      </div>
    );
  }

  if (!updates || updates.length === 0) {
    return (
      <div className="bg-gray-50 p-16 text-center rounded-lg border border-gray-200 my-8 w-full">
        <svg className="mx-auto h-20 w-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h3 className="mt-4 text-2xl font-medium text-gray-900">No updates available</h3>
        <p className="mt-2 text-xl text-gray-500">Project updates will appear here once they are posted.</p>
      </div>
    );
  }

  const handleUpdateClick = (updateId) => {
    setActiveUpdate(updateId);
  };

  const activeUpdateData = updates.find(update => update.projectUpdatePostId === activeUpdate);

  // Kiểm tra xem update nào là mới nhất
  const isLatestUpdate = (updateId) => {
    if (!updates || updates.length === 0) return false;
    return updateId === updates[0].projectUpdatePostId;
  };

  return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-lg max-w-screen-xl" id="pills-contact" role="tabpanel">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">Project Updates</h2>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Timeline sidebar */}
        <div className="lg:w-1/3">  {/* Thay đổi từ lg:w-1/4 thành lg:w-1/3 */}
          <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Update Timeline</h3>
            <div className="space-y-4">
              {updates.map((update, index) => {
                const isLatest = index === 0;
                const colorClasses = isLatest
                  ? {
                    bg: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
                    text: 'text-white',
                    border: 'border-green-300',
                  }
                  : primaryColorClasses;

                return (
                  <div
                    key={update.projectUpdatePostId}
                    onClick={() => handleUpdateClick(update.projectUpdatePostId)}
                    className={`cursor-pointer p-4 rounded-lg transition-all ${activeUpdate === update.projectUpdatePostId
                      ? `${colorClasses.bgLight} border-l-4 ${colorClasses.border}`
                      : 'bg-white hover:bg-gray-100 border-l-4 border-transparent'
                      } ${isLatest
                        ? 'ring-2 ring-yellow-400 shadow-lg'
                        : ''
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800 text-lg">{update.title}</span>
                      <span className="relative inline-flex items-center">
                        {isLatest && (
                          <>
                            <span className="absolute inline-flex h-6 w-6 rounded-full bg-yellow-400 opacity-75 animate-ping"></span>
                            <span className="relative">🔥</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-2">{formatDate(update.createdAt)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:w-3/4">
          {activeUpdateData && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
              {/* Title section - separated from the image */}
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold text-gray-800">{activeUpdateData.title}</h2>
                  {isLatestUpdate(activeUpdateData.projectUpdatePostId) && (
                    <div className="flex items-center">
                      <div className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-full font-semibold text-sm">
                        <span>🔸</span> Newest Update
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 text-gray-600">
                  <time dateTime={activeUpdateData.createdAt} className="text-lg">
                    Posted: {formatDate(activeUpdateData.createdAt)}
                  </time>
                  {activeUpdateData.updatedAt !== activeUpdateData.createdAt && (
                    <span className="text-base ml-3">(Edited: {formatDate(activeUpdateData.updatedAt)})</span>
                  )}
                </div>
              </div>

              {/* Image section - if exists */}
              {activeUpdateData.postMedia && (
                <div className="cursor-pointer" onClick={() => openImageModal(activeUpdateData.postMedia)}>
                  <div className="relative h-96 overflow-hidden">
                    <img
                      src={activeUpdateData.postMedia}
                      alt={activeUpdateData.title}
                      className="w-full h-full object-contain hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-lg">
                      Click to enlarge
                    </div>
                  </div>
                </div>
              )}

              {/* Content section */}
              <div className="p-8">
                <div className="prose max-w-none">
                  <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">{activeUpdateData.postContent}</p>
                </div>
              </div>

              <div className="bg-gray-50 px-8 py-5">
                <div className="text-base text-gray-500">
                  Last updated on {formatDate(activeUpdateData.updatedAt)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal with improved dark overlay, centered positioning and adjusted height */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={closeImageModal}>
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 mt-16">
            <div className="p-2 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 pl-2">Image View</h3>
              <button
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg p-1.5"
                onClick={closeImageModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 flex justify-center bg-gray-100">
              <img
                src={selectedImage}
                alt="Full size"
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsUpdates;