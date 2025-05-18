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
  const [isFundraisingCompleted, setIsFundraisingCompleted] = useState(false);
  const categoryPanelRef = React.useRef(null);
  const moreFiltersRef = React.useRef(null);


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await projectService.getAllCategories();
        if (data && data.length > 0) {
          setCategories(data);
          console.log("Fetched categories:", data);

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
      filters.push({
        type: 'fundingStatus',
        value: selectedFundingStatus === "PROCESS" ? "In Progress" : selectedFundingStatus === "COMPLETED" ? "Completed" : selectedFundingStatus
      });
    }

    if (isPotentialProject) {
      filters.push({ type: 'potentialProject', value: 'Potential Project' });
    }

    if (isFundraisingCompleted) {
      filters.push({ type: 'fundraisingCompleted', value: 'Fundraising Completed' });
    }

    if (searchTerm) {
      filters.push({ type: 'searchTerm', value: searchTerm });
    }

    setActiveFilters(filters);
  }, [selectedMainCategory, selectedSubCategories, selectedLocation, selectedFundingStatus, isPotentialProject, isFundraisingCompleted, searchTerm]);

  useEffect(() => {
    if (initialLoadComplete) {
      handleSearch();
    }
  }, [sortOption, selectedMainCategory, selectedSubCategories, selectedLocation, selectedFundingStatus, isPotentialProject, isFundraisingCompleted, searchTerm]);

  useEffect(() => {
    const handleExternalFilters = (event) => {
      const { category, subCategory } = event.detail;

      if (category && category !== "All") {
        setSelectedMainCategory(category);

        const selectedCat = categories.find(cat => cat.name === category);
        if (selectedCat) {
          setSubCategories(selectedCat.subCategories);

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
    } else {
      setSelectedSubCategories(selectedSubCategories.filter(name => name !== subCategoryName));
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

      const parentCategory = categories.find(cat =>
        cat.subCategories.some(subCat => subCat.name === filterValue)
      );

      if (parentCategory) {
        setSelectedMainCategory(parentCategory.name);
      } else {
        setSelectedMainCategory("All");
      }
    } else if (filterType === 'location') {
      setSelectedLocation("");
    } else if (filterType === 'fundingStatus') {
      setSelectedFundingStatus("");
    } else if (filterType === 'searchTerm') {
      setSearchTerm("");
    } else if (filterType === 'potentialProject') {
      setIsPotentialProject(false);
    } else if (filterType === 'fundraisingCompleted') {
      setIsFundraisingCompleted(false);
    }
  };

  const handleSearch = () => {
    setErrorMessage("");

    const queryParts = [];

    if (searchTerm) {
      queryParts.push(`title:eq:${encodeURIComponent(searchTerm)}`);
    }

    if (selectedMainCategory !== "All" && selectedSubCategories.length === 0) {
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
      queryParts.push(`isClassPotential:eq:true`);
    }

    if (isFundraisingCompleted) {
      queryParts.push(`status:eq:FUNDRAISING_COMPLETED`);
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

  // Function to get display text for filter chips
  const getFilterDisplayText = (filter) => {
    if (filter.type === 'potentialProject') {
      return "that are Potential Projects";
    } else if (filter.type === 'fundingStatus') {
      return `with funding status "${filter.value}"`;
    } else if (filter.type === 'searchTerm') {
      return `named "${filter.value}"`;
    } else if (filter.type === 'fundraisingCompleted') {
      return "with Fundraising Completed";
    }
    return filter.value;
  };

  return (
    <div className="search-component">
      {/* Search Bar and Toggle Button */}
      <div className="bg-white shadow-sm p-4">
        {/* Single row layout for all search elements */}
        <div className="flex items-center justify-between flex-wrap md:flex-nowrap gap-3 md:gap-4">
          {/* Left side with fixed elements */}
          <div className="flex items-center flex-nowrap space-x-3 overflow-x-auto">
            <h2 className="text-xl font-semibold whitespace-nowrap">Show me</h2>

            {/* Category Selector - UPDATED POSITION AND Z-INDEX */}
            <div className="relative" ref={categoryPanelRef}>
              {/* Category Button */}
              <div
                onClick={() => {
                  if (selectedMainCategory === "All") {
                    toggleCategoryPanel();
                  }
                }}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md cursor-pointer flex items-center justify-between min-w-[140px]"
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

              {/* IMPROVED DROPDOWN POSITIONING */}
              {isCategoryPanelOpen && (
                <div
                  className="fixed inset-0 bg-transparent"
                  style={{ zIndex: 9000 }}
                  onClick={() => setIsCategoryPanelOpen(false)}
                >
                  <div
                    className="absolute"
                    style={{
                      top: categoryPanelRef.current ? categoryPanelRef.current.getBoundingClientRect().bottom + 5 + 'px' : '0',
                      left: categoryPanelRef.current ? categoryPanelRef.current.getBoundingClientRect().left + 'px' : '0',
                      zIndex: 9100
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Category Panel Display */}
                    <div className="flex">
                      {/* Main Categories Panel */}
                      <div className="bg-white border border-gray-300 rounded-md shadow-lg w-64">
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

                      {/* Subcategory Panel - With proper spacing and z-index */}
                      {selectedMainCategory !== "All" && subCategories.length > 0 && (
                        <div className="bg-white border border-gray-300 rounded-md shadow-lg w-64 ml-2">
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
                  </div>
                </div>
              )}
            </div>

            {/* Projects text */}
            <span className="text-gray-700 whitespace-nowrap">projects</span>

            {/* Active filters section */}
            {activeFilters.filter(filter => filter.type === 'potentialProject' || filter.type === 'fundingStatus' || filter.type === 'searchTerm' || filter.type === 'fundraisingCompleted').length > 0 && (
              <div className="flex items-center flex-wrap gap-2">
                {activeFilters
                  .filter(filter => filter.type === 'potentialProject' || filter.type === 'fundingStatus' || filter.type === 'searchTerm' || filter.type === 'fundraisingCompleted')
                  .sort((a, b) => {
                    const order = { 'potentialProject': 1, 'searchTerm': 2, 'fundingStatus': 3, 'fundraisingCompleted': 4 };
                    return order[a.type] - order[b.type];
                  })
                  .map((filter, index) => {
                    let beforeHighlight = "";
                    let highlightedText = "";
                    let afterHighlight = "";

                    if (filter.type === 'potentialProject') {
                      beforeHighlight = "that are ";
                      highlightedText = "Potential";
                    } else if (filter.type === 'fundingStatus') {
                      beforeHighlight = "with status ";
                      highlightedText = filter.value;
                    } else if (filter.type === 'searchTerm') {
                      beforeHighlight = "named ";
                      highlightedText = `"${filter.value}"`;
                    } else if (filter.type === 'fundraisingCompleted') {
                      beforeHighlight = "with ";
                      highlightedText = "Fundraising Completed";
                    }

                    return (
                      <div
                        key={`${filter.type}-${index}`}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-md flex items-center justify-between min-h-[40px]"
                      >
                        <span className="text-gray-700 text-base truncate flex-grow">
                          <span className="text-gray-500 mr-1">{beforeHighlight}</span>
                          <span className="font-medium text-green-700">{highlightedText}</span>
                          <span className="text-gray-500">{afterHighlight}</span>
                        </span>
                        <button
                          onClick={() => removeFilter(filter.type, filter.value)}
                          className="ml-2 text-gray-600 hover:text-red-500 focus:outline-none shrink-0"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    );
                  })
                }
              </div>
            )}

            {/* On text */}
            <span className="text-gray-700 whitespace-nowrap">on</span>

            {/* Location Selector */}
            <select
              value={selectedLocation}
              onChange={handleLocationChange}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 min-w-[150px]"
            >
              <option value="">All Campuses</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            {/* Sort by section */}
            <span className="text-gray-700 whitespace-nowrap">sorted by</span>

            {/* Sort Option Selector */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 min-w-[180px]"
            >
              <option value="-createdAt">Newest</option>
              <option value="+createdAt">Oldest</option>
              <option value="-fundingPhases.raiseAmount">Most Funded</option>
              <option value="-fundingPhases.startDate">Latest Funding Start</option>
              <option value="+fundingPhases.startDate">Earliest Funding Start</option>
              <option value="-fundingPhases.endDate">Latest Funding Deadline</option>
              <option value="+fundingPhases.endDate">Earliest Funding Deadline</option>
            </select>
          </div>

          {/* Right side with More Filters button */}
          <div className="relative ml-auto" ref={moreFiltersRef}>
            <button
              onClick={toggleSearch}
              className="px-4 py-2 bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition-colors duration-200 flex items-center whitespace-nowrap"
            >
              More Filters
            </button>

            {/* Advanced Search Panel - IMPROVED POSITIONING AND Z-INDEX */}
            {isSearchVisible && (
              <div
                className="fixed inset-0 bg-transparent"
                style={{ zIndex: 9000 }}
                onClick={() => setIsSearchVisible(false)}
              >
                <div
                  className="absolute"
                  style={{
                    top: moreFiltersRef.current ? moreFiltersRef.current.getBoundingClientRect().bottom + 5 + 'px' : '0',
                    right: window.innerWidth - (moreFiltersRef.current ? moreFiltersRef.current.getBoundingClientRect().right : 0) + 'px',
                    zIndex: 9100
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-white border border-gray-300 rounded-md shadow-lg w-[450px] transition-all duration-200 ease-in-out">
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
                          <div className="space-y-2">
                            <div
                              onClick={() => setIsPotentialProject(!isPotentialProject)}
                              className={`px-3 py-2 rounded-md cursor-pointer transition-colors duration-200 ${isPotentialProject
                                ? "bg-green-50 text-green-700 font-medium"
                                : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                }`}
                            >
                              Projects Have Potential
                            </div>

                            {/* New fundraising completed filter */}
                            <div
                              onClick={() => setIsFundraisingCompleted(!isFundraisingCompleted)}
                              className={`px-3 py-2 rounded-md cursor-pointer transition-colors duration-200 ${isFundraisingCompleted
                                ? "bg-green-50 text-green-700 font-medium"
                                : "text-gray-700 hover:bg-gray-50 hover:text-green-600"
                                }`}
                            >
                              Fundraising Completed
                            </div>
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
                        onClick={() => setIsSearchVisible(false)}
                        className="px-4 py-1 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleSearch();
                          setIsSearchVisible(false);
                        }}
                        className="px-4 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;