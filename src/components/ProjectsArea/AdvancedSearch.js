import projectService from "../../services/projectPublicService";
import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";

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

    if (queryParts.length === 0) {
      setErrorMessage("Please enter or select at least one field to search.");
      return;
    }

    const searchParams = {
      query: queryParts.join(","),
      sort: sortOption
    };

    console.log("Search parameters:", searchParams);
    onSearch(searchParams);
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  return (
    <div>
      <div className="flex justify-end p-4">
        <button
          onClick={toggleSearch}
          className="p-2 bg-green-300 rounded-full shadow-md hover:bg-green-400 transition-colors duration-200"
        >
          <FaSearch size={24} />
        </button>
      </div>

      {isSearchVisible && (
        <div className="search-container p-6 bg-gray-100 rounded-lg shadow-md mt-4">
          <div className="search-form mb-4">
            <label htmlFor="search" className="block text-lg font-semibold mb-2">
              Project Search
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

          <div className="category-filter mb-4">
            <label className="block text-lg font-semibold mb-2">Select Category</label>
            <div className="flex flex-wrap mb-4">
              <select
                value={selectedMainCategory}
                onChange={handleMainCategoryChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="All">All</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedMainCategory !== "All" && subCategories.length > 0 && (
            <div className="subcategories-filter mb-4">
              <div className="flex flex-wrap mb-4">
                {subCategories.map((subCategory) => (
                  <div key={subCategory.id} className="flex items-center mr-4">
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

          <div className="location-filter mb-4">
            <label className="block text-lg font-semibold mb-2">FPT University Campus</label>
            <select
              value={selectedLocation}
              onChange={handleLocationChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">Not selected</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {errorMessage && (
            <div className="error-message text-red-500 text-center mb-4">
              {errorMessage}
            </div>
          )}

          <div className="sort-options mb-4">
            <label className="block text-lg font-semibold mb-2">Sort By</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="+createdAt">Creation Date (Oldest to Newest)</option>
              <option value="-createdAt">Creation Date (Newest to Oldest)</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            className="w-full p-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200"
          >
            Search
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
