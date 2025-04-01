import projectService from "../../services/projectPublicService";
import React, { useState, useEffect } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

const AdvancedSearch = ({ onSearch }) => {
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await projectService.getAllCategories();
        if (data && data.length > 0) {
          setCategories(data);
          console.log("Fetched categories:", data);
        } else {
          console.error("No categories found.");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

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

    setActiveFilters(filters);
  }, [selectedMainCategory, selectedSubCategories, selectedLocation, selectedFundingStatus]);

  useEffect(() => {
    handleSearch();
  }, [searchTerm, sortOption, selectedMainCategory, selectedSubCategories, selectedLocation, selectedFundingStatus]);


  const handleCategoryChange = (event) => {
    const category = event.target.value;
    if (selectedCategory.includes(category)) {
      setSelectedCategory(selectedCategory.filter((cat) => cat !== category));
    } else {
      setSelectedCategory([...selectedCategory, category]);
    }
  };

  const handleMainCategoryChange = (event) => {
    const categoryName = event.target.value;
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

  const handleSubCategoryChange = (event, subCategoryName) => {
    if (event.target.checked) {
      setSelectedSubCategories([...selectedSubCategories, subCategoryName]);
    } else {
      setSelectedSubCategories(selectedSubCategories.filter(name => name !== subCategoryName));
    }
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

          <div className="active-filters flex flex-wrap gap-2">
            {searchTerm && (
              <div className="filter-tag flex items-center px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-sm">
                <span>{searchTerm}</span>
                <button
                  onClick={() => removeFilter('searchTerm', searchTerm)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            )}

            {activeFilters.map((filter, index) => (
              <div
                key={index}
                className="filter-tag flex items-center px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-sm"
              >
                <span>{filter.value}</span>
                <button
                  onClick={() => removeFilter(filter.type, filter.value)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            ))}

            {activeFilters.length === 0 && !searchTerm && (
              <div className="filter-tag px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-sm">
                All projects
              </div>
            )}
          </div>

          <div className="sort-control flex items-center space-x-2">
            <span>sorted by</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-400"
            >
              <option value="+createdAt">Creation Date (Oldest to Newest)</option>
              <option value="-createdAt">Creation Date (Newest to Oldest)</option>
              <option value="+fundingPhases.startDate">Start Funding Date (Earliest to Latest)</option>
              <option value="-fundingPhases.startDate">Start Funding Date (Latest to Earliest)</option>
              <option value="+fundingPhases.endDate">End Funding Date (Earliest to Latest)</option>
              <option value="-fundingPhases.endDate">End Funding Date (Latest to Earliest)</option>
            </select>
          </div>
        </div>

        <button
          onClick={toggleSearch}
          className="p-2 bg-green-300 rounded-full shadow-md hover:bg-green-400 transition-colors duration-200"
        >
          <FaSearch size={24} />
        </button>
      </div>

      {/* Advanced Search Panel */}
      {isSearchVisible && (
        <div className="search-container p-6 bg-white rounded-lg shadow-lg mt-1 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div>
              <div className="search-form mb-6">
                <label htmlFor="search" className="block text-lg font-semibold mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  id="search"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Enter project name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="category-filter mb-6">
                <label className="block text-lg font-semibold mb-2">Category</label>
                <select
                  value={selectedMainCategory}
                  onChange={handleMainCategoryChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="All">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMainCategory !== "All" && subCategories.length > 0 && (
                <div className="subcategories-filter mb-6">
                  <label className="block text-lg font-semibold mb-2">Subcategories</label>
                  <div className="grid grid-cols-2 gap-2">
                    {subCategories.map((subCategory) => (
                      <div key={subCategory.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`subCategory-${subCategory.id}`}
                          value={subCategory.name}
                          checked={selectedSubCategories.includes(subCategory.name)}
                          onChange={(e) => handleSubCategoryChange(e, subCategory.name)}
                          className="mr-2"
                        />
                        <label htmlFor={`subCategory-${subCategory.id}`} className="text-md">{subCategory.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div>
              <div className="location-filter mb-6">
                <label className="block text-lg font-semibold mb-2">Campus Location</label>
                <select
                  value={selectedLocation}
                  onChange={handleLocationChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">All Locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="funding-status-filter mb-6">
                <label className="block text-lg font-semibold mb-2">Funding Status</label>
                <select
                  value={selectedFundingStatus}
                  onChange={handleFundingStatusChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">All Statuses</option>
                  {fundingPhaseStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status === "PLAN" ? "Planning" : status === "PROCESS" ? "In Progress" : "Completed"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sort-options mb-6">
                <label className="block text-lg font-semibold mb-2">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="+createdAt">Creation Date (Oldest to Newest)</option>
                  <option value="-createdAt">Creation Date (Newest to Oldest)</option>
                  <option value="+fundingPhases.startDate">Start Funding Date (Earliest to Latest)</option>
                  <option value="-fundingPhases.startDate">Start Funding Date (Latest to Earliest)</option>
                  <option value="+fundingPhases.endDate">End Funding Date (Earliest to Latest)</option>
                  <option value="-fundingPhases.endDate">End Funding Date (Latest to Earliest)</option>
                  <option value="+fundingPhases.raiseAmount">Funding Amount (Lowest to Highest)</option>
                  <option value="-fundingPhases.raiseAmount">Funding Amount (Highest to Lowest)</option>
                </select>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="error-message text-red-500 text-center mb-4">
              {errorMessage}
            </div>
          )}

          {/* <div className="flex justify-end mt-4">
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200"
            >
              Apply Filters
            </button>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;