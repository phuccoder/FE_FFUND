import projectService from "../../services/projectPublicService";
import React, { useState, useEffect } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

const AdvancedSearch = ({ onSearch, defaultCategory = "All", defaultSubCategory = "" }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [sortOption, setSortOption] = useState("+createdAt");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState("All");
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [locations] = useState(["HO_CHI_MINH", "DA_NANG", "HA_NOI", "CAN_THO", "QUY_NHON"]);
  const [fundingPhaseStatuses] = useState(["PROCESS", "COMPLETED"]);
  const [selectedFundingStatus, setSelectedFundingStatus] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isPotentialProject, setIsPotentialProject] = useState(false);
  const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(false);
  const categoryPanelRef = React.useRef(null);


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await projectService.getAllCategories();
        if (data && data.length > 0) {
          setCategories(data);
          console.log("Fetched categories:", data);

          // Áp dụng defaultCategory và defaultSubCategory sau khi đã tải categories
          if (defaultCategory && defaultCategory !== "All") {
            setSelectedMainCategory(defaultCategory);

            const selectedCat = data.find(cat => cat.name === defaultCategory);
            if (selectedCat) {
              setSubCategories(selectedCat.subCategories);

              if (defaultSubCategory) {
                setSelectedSubCategories([defaultSubCategory]);
              }
            }
          }

          setInitialLoadComplete(true);
        } else {
          console.error("No categories found.");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, [defaultCategory, defaultSubCategory]);

  

  useEffect(() => {
    const filters = [];

    if (selectedMainCategory !== "All") {
      filters.push({ type: 'category', value: selectedMainCategory });
    }

    selectedSubCategories.forEach(subCat => {
      filters.push({ type: 'subCategory', value: subCat });
    });

    if (selectedLocation) {
      filters.push({ type: 'location', value: selectedLocation.replace(/_/g, " ") });
    }

    if (selectedFundingStatus) {
      filters.push({ type: 'fundingStatus', value: selectedFundingStatus });
    }

    if (isPotentialProject) {
      filters.push({ type: 'potentialProject', value: 'Potential Project' });
    }

    setActiveFilters(filters);
  }, [selectedMainCategory, selectedSubCategories, selectedLocation, selectedFundingStatus, isPotentialProject]);

  useEffect(() => {
    if (initialLoadComplete) {
      handleSearch();
    }
  }, [searchTerm, sortOption, selectedMainCategory, selectedSubCategories, selectedLocation, selectedFundingStatus, isPotentialProject]);

  useEffect(() => {
    const handleExternalFilters = (event) => {
      const { category, subCategory } = event.detail;

      if (category && category !== "All") {
        setSelectedMainCategory(category);

        // Tìm category trong danh sách để lấy subcategories
        const selectedCat = categories.find(cat => cat.name === category);
        if (selectedCat) {
          setSubCategories(selectedCat.subCategories);

          // Nếu có subCategory, thêm vào danh sách đã chọn
          if (subCategory) {
            setSelectedSubCategories([subCategory]);
          }
        }
      }

      setIsSearchVisible(true);

      setTimeout(() => {
        setIsSearchVisible(false);
      }, 0);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('applySearchFilters', handleExternalFilters);

      return () => {
        window.removeEventListener('applySearchFilters', handleExternalFilters);
      };
    }
  }, [categories]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryPanelRef.current && !categoryPanelRef.current.contains(event.target)) {
        setIsCategoryPanelOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [categoryPanelRef]);

  const handleCategoryChange = (event) => {
    const category = event.target.value;
    if (selectedCategory.includes(category)) {
      setSelectedCategory(selectedCategory.filter((cat) => cat !== category));
    } else {
      setSelectedCategory([...selectedCategory, category]);
    }
  };

  const handleSelectCategory = (categoryName) => {
    setSelectedMainCategory(categoryName);
    setSelectedCategory([]);
    setSelectedSubCategories([]);

    if (categoryName === "All") {
      setSubCategories([]);
    } else {
      const selectedCategory = categories.find(cat => cat.name === categoryName);
      if (selectedCategory) {
        setSubCategories(selectedCategory.subCategories);
      }
    }
  };

  const toggleCategoryPanel = () => {
    setIsCategoryPanelOpen(!isCategoryPanelOpen);
  };

  const closeCategoryPanel = () => {
    setIsCategoryPanelOpen(false);
  };
  const handleSubCategoryChange = (event, subCategoryName) => {
    if (event.target.checked) {
      setSelectedSubCategories([...selectedSubCategories, subCategoryName]);
      setSelectedMainCategory(subCategoryName);
    } else {
      setSelectedSubCategories(selectedSubCategories.filter(name => name !== subCategoryName));
      if (selectedMainCategory === subCategoryName) {
        setSelectedMainCategory("All");
      }
    }
  };

  const handleSubCategorySelect = (subCategoryName) => {
    setSelectedSubCategories([subCategoryName]);
    setSelectedMainCategory(subCategoryName);
    setIsCategoryPanelOpen(false);
  };

  const handleLocationChange = (event) => {
    setSelectedLocation(event.target.value);
  };

  const handleFundingStatusChange = (event) => {
    setSelectedFundingStatus(event.target.value);
  };

  const removeFilter = (filterType, filterValue) => {
    if (filterType === 'category') {
      setSelectedMainCategory("All");
      setSubCategories([]);
      setSelectedSubCategories([]);
    } else if (filterType === 'subCategory') {
      setSelectedSubCategories(selectedSubCategories.filter(sc => sc !== filterValue));
    } else if (filterType === 'location') {
      setSelectedLocation("");
    } else if (filterType === 'fundingStatus') {
      setSelectedFundingStatus("");
    } else if (filterType === 'searchTerm') {
      setSearchTerm("");
    } else if (filterType === 'potentialProject') {
      setIsPotentialProject(false);
    }
  };

  const handleSearch = () => {
    setErrorMessage("");

    const queryParts = [];

    if (searchTerm) {
      queryParts.push(`title:eq:${encodeURIComponent(searchTerm)}`);
    }

    if (selectedMainCategory !== "All") {
      queryParts.push(`category.name:eq:${encodeURIComponent(selectedMainCategory)}`);
    }

    if (selectedSubCategories.length > 0) {
      selectedSubCategories.forEach(subCategory => {
        queryParts.push(`subCategories.subCategory.name:eq:${encodeURIComponent(subCategory)}`);
      });
    }

    if (selectedLocation) {
      queryParts.push(`location:eq:${encodeURIComponent(selectedLocation)}`);
    }

    if (isPotentialProject) {
      queryParts.push(`isClassPotential:true`);
    }

    if (
      sortOption === "+fundingPhases.startDate" ||
      sortOption === "-fundingPhases.startDate" ||
      sortOption === "+fundingPhases.endDate" ||
      sortOption === "-fundingPhases.endDate"
    ) {
      if (!selectedFundingStatus) {
        queryParts.push(`fundingPhases.status:eq:PROCESS`);
      }
    }

    if (selectedFundingStatus) {
      queryParts.push(`fundingPhases.status:eq:${encodeURIComponent(selectedFundingStatus)}`);
    }

    const searchParams = {
      query: queryParts.length > 0 ? queryParts.join(",") : "",
      sort: sortOption,
      page: 0,
      size: 10
    };

    console.log("Search parameters:", searchParams);
    onSearch(searchParams);
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  return (
    <div className="search-component">
      {/* Search Bar and Toggle Button */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <div className="search-header flex items-center space-x-3">
          <h2 className="text-xl font-semibold">Show me</h2>

          <div className="relative" ref={categoryPanelRef}>
            {/* Category Button */}
            <div
              onClick={() => {
                if (selectedMainCategory === "All") {
                  toggleCategoryPanel(); // Mở panel nếu chưa chọn Category/SubCategory
                }
              }}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md cursor-pointer flex items-center justify-between w-auto"
            >
              <span className="text-gray-700 text-base truncate">
                {selectedMainCategory === "All" ? "All Categories" : selectedMainCategory}
              </span>
              {selectedMainCategory !== "All" ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMainCategory("All");
                    setSubCategories([]);
                    setSelectedSubCategories([]);
                    setIsCategoryPanelOpen(true);
                  }}
                  className="ml-2 text-gray-600 hover:text-red-500 focus:outline-none shrink-0"
                >
                  <FaTimes />
                </button>
              ) : (
                <span className="ml-2 text-gray-600 shrink-0">
                  {isCategoryPanelOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </span>
              )}
            </div>

            {/* Panel Wrapper */}
            {isCategoryPanelOpen && (
              <div className="absolute left-0 top-full mt-1 flex z-30">
                {/* Category Panel - Kích thước cố định không phụ thuộc button */}
                <div className="bg-white border border-gray-300 rounded-md shadow-lg w-64 transition-all duration-200 ease-in-out">
                  <div className="py-3 px-4">
                    <h3 className="uppercase text-gray-700 font-medium text-sm mb-2">CATEGORIES</h3>
                    <div className="max-h-80 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-x-4">
                        {/* First column */}
                        <div className="space-y-3">
                          <div
                            className={`text-sm cursor-pointer ${selectedMainCategory === "All" ? "text-green-600 font-medium" : "text-gray-700"}`}
                            onClick={() => handleSelectCategory("All")}
                          >
                            All categories
                          </div>
                          {categories.slice(0, Math.ceil(categories.length / 2)).map((category) => (
                            <div
                              key={category.id}
                              className={`text-sm cursor-pointer ${selectedMainCategory === category.name ? "text-green-600 font-medium" : "text-gray-700"}`}
                              onClick={() => handleSelectCategory(category.name)}
                            >
                              {category.name}
                            </div>
                          ))}
                        </div>

                        {/* Second column */}
                        <div className="space-y-3">
                          {categories.slice(Math.ceil(categories.length / 2)).map((category) => (
                            <div
                              key={category.id}
                              className={`text-sm cursor-pointer ${selectedMainCategory === category.name ? "text-green-600 font-medium" : "text-gray-700"}`}
                              onClick={() => handleSelectCategory(category.name)}
                            >
                              {category.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subcategory Panel */}
                {selectedMainCategory !== "All" && subCategories.length > 0 && (
                  <div className="absolute left-full top-0 ml-1 bg-white border border-gray-300 rounded-md shadow-lg z-30 w-64 transition-all duration-200 ease-in-out">
                    <div className="py-3 px-4">
                      <h3 className="uppercase text-gray-700 font-medium text-sm mb-2">
                        {selectedMainCategory.toUpperCase()}
                      </h3>

                      {/* Subcategory with 2 columns */}
                      <div className="max-h-80 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-x-4">
                          <div className="space-y-3">
                            {subCategories.slice(0, Math.ceil(subCategories.length / 2)).map((subCategory) => (
                              <div
                                key={subCategory.id}
                                className={`text-sm cursor-pointer ${selectedSubCategories.includes(subCategory.name) ? "text-green-600 font-medium" : "text-gray-700"}`}
                                onClick={() => handleSubCategorySelect(subCategory.name)}
                              >
                                {subCategory.name}
                              </div>
                            ))}
                          </div>

                          <div className="space-y-3">
                            {subCategories.slice(Math.ceil(subCategories.length / 2)).map((subCategory) => (
                              <div
                                key={subCategory.id}
                                className={`text-sm cursor-pointer ${selectedSubCategories.includes(subCategory.name) ? "text-green-600 font-medium" : "text-gray-700"}`}
                                onClick={() => handleSubCategorySelect(subCategory.name)}
                              >
                                {subCategory.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>


          <span className="text-gray-700">projects on</span>

          {/* Location Selector */}
          <select
            value={selectedLocation}
            onChange={handleLocationChange}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="">All Campuses</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <span className="text-gray-700">sorted by</span>

          {/* Sort Option Selector */}
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="+createdAt">Creation Date (Oldest to Newest)</option>
            <option value="-createdAt">Creation Date (Newest to Oldest)</option>
            <option value="+fundingPhases.startDate">Start Funding Date (Earliest to Latest)</option>
            <option value="-fundingPhases.startDate">Start Funding Date (Latest to Earliest)</option>
            <option value="+fundingPhases.endDate">End Funding Date (Earliest to Latest)</option>
            <option value="-fundingPhases.endDate">End Funding Date (Latest to Earliest)</option>
          </select>
        </div>

        {/* More Filter Button and Dropdown */}
        <div className="relative">
          {/* More Filter Button */}
          <button
            onClick={toggleSearch}
            className="px-4 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center"
          >
            More Filters
          </button>
          {/* Advanced Search Panel - Dropdown Design */}
          {isSearchVisible && (
            <div className="fixed right-4 top-[4.5rem] mt-1 bg-white border border-gray-300 rounded-md shadow-lg w-[450px] z-50 transition-all duration-200 ease-in-out">
              {/* Header */}
              <div className="py-2 px-4 border-b border-gray-200">
                <h3 className="uppercase text-gray-700 font-medium text-sm mb-0">More filters</h3>
              </div>
              {/* Content area */}
              <div className="p-4">
                {/* Project Name Search input at top */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Project Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Enter project name..."
                      className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FaSearch className="h-4 w-4 text-gray-500" />
                    </span>
                  </div>
                </div>

                {/* Two columns layout */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Left column */}
                  <div className="col-span-1">
                    <h3 className="text-sm font-medium mb-2 text-gray-700">Quick Filters</h3>
                    <div
                      onClick={() => setIsPotentialProject(!isPotentialProject)}
                      className={`px-3 py-2 cursor-pointer transition-colors duration-200 ${isPotentialProject
                          ? "text-green-700 font-medium"
                          : "text-gray-700 hover:text-green-600"
                        }`}
                    >
                      Projects Have Potential
                    </div>
                  </div>

                  {/* Right column: Funding Status */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium mb-2 text-gray-700">Funding Status</label>
                    <select
                      value={selectedFundingStatus}
                      onChange={handleFundingStatusChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                    >
                      <option value="">All Statuses</option>
                      {fundingPhaseStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status === "PLAN" ? "Planning" : status === "PROCESS" ? "In Progress" : "Completed"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer with buttons */}
              <div className="py-2 px-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={toggleSearch}
                  className="px-4 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSearch();
                    toggleSearch();
                  }}
                  className="px-4 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;