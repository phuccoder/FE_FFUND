import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";

const AdvancedSearch = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState(""); // Giá trị tìm kiếm
  const [selectedCategory, setSelectedCategory] = useState([]); // Danh sách các thể loại được chọn
  const [sortOption, setSortOption] = useState("+createdAt"); // Sắp xếp theo ngày tạo
  const [isSearchVisible, setIsSearchVisible] = useState(false); // Điều khiển hiển thị tìm kiếm
  const [categories, setCategories] = useState([]); // Danh sách các thể loại
  const [selectedMainCategory, setSelectedMainCategory] = useState("All"); // Thể loại chính được chọn

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("https://quanbeo.duckdns.org/api/v1/category/get-all", {
          method: "GET",
          headers: {
            "accept": "*/*",
          },
        });

        const data = await response.json();
        if (data.status === 200) {
          setCategories(data.data); // Lưu danh sách thể loại
        } else {
          console.error("Failed to fetch categories");
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
    setSelectedMainCategory(event.target.value);
    setSelectedCategory([]);
  };

  const handleSearch = async () => {
    const queryParts = [];
  
    if (searchTerm) {
      queryParts.push(`projectTitle:eq:${searchTerm}`);
    }
  
    if (selectedMainCategory !== "All") {
      queryParts.push(`category.name:eq:${selectedMainCategory}`);
    }
  
    if (queryParts.length === 0) {
      console.error("No search criteria provided.");
      return;
    }
  
    const sort = sortOption;
  
    const query = queryParts.join(",");
  
    console.log("Constructed Query:", query);
  
    const page = 0;
    const size = 10;
  
    try {
      const response = await fetch(
        `https://quanbeo.duckdns.org/api/v1/project/search?page=${page}&size=${size}&sort=${sort}&query=${query}`,
        {
          method: "GET",
          headers: {
            "accept": "*/*",
          },
        }
      );
      const data = await response.json();
  
      if (data.status === 200) {
        onSearch({
          projects: data.data,
          selectedCategory,
          sortOption,
        });
      } else {
        console.error("Failed to fetch projects:", data.error);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
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
              Tìm kiếm dự án
            </label>
            <input
              type="text"
              id="search"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Nhập tên dự án..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="category-filter mb-4">
            <label className="block text-lg font-semibold mb-2">Chọn thể loại</label>
            <div className="flex flex-wrap mb-4">
              <select
                value={selectedMainCategory}
                onChange={handleMainCategoryChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="All">Tất cả</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.categoryName}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sort-options mb-4">
            <label className="block text-lg font-semibold mb-2">Sắp xếp theo</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="+createdAt">Ngày tạo (cũ đến mới)</option>
              <option value="-createdAt">Ngày tạo (mới đến cũ)</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            className="w-full p-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200"
          >
            Tìm kiếm
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
