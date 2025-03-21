import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";

const AdvancedSearch = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState(""); // Giá trị tìm kiếm
  const [selectedCategory, setSelectedCategory] = useState([]); // Danh sách các thể loại được chọn
  const [sortOption, setSortOption] = useState("name"); // Tùy chọn sắp xếp
  const [isSearchVisible, setIsSearchVisible] = useState(false); // Điều khiển hiển thị tìm kiếm
  const [categories, setCategories] = useState([]); // Danh sách các thể loại
  const [selectedMainCategory, setSelectedMainCategory] = useState("All"); // Thể loại chính được chọn

  useEffect(() => {
    // Lấy danh sách thể loại khi component được mount
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
    const query = searchTerm;
    const page = 0; // Page index
    const size = 10; // Số lượng kết quả mỗi trang
    const sort = sortOption;

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
        // Gửi dữ liệu dự án đã lọc lên Projects (page)
        onSearch({
          projects: data.data,
          selectedCategory,
          sortOption,
        });
      } else {
        console.error("Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible); // Toggle hiển thị phần tìm kiếm
  };

  return (
    <div>
      <div className="flex justify-end p-4">
        <button
          onClick={toggleSearch}
          className="p-2 bg-green-300 rounded-full shadow-md hover:bg-green-400"
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
              className="w-full p-3 border border-gray-300 rounded-md"
              placeholder="Nhập tên dự án..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} // Cập nhật giá trị tìm kiếm
            />
          </div>

          <div className="category-filter mb-4">
            <label className="block text-lg font-semibold mb-2">Chọn thể loại</label>
            <div className="flex flex-wrap mb-4">
              <select
                value={selectedMainCategory}
                onChange={handleMainCategoryChange}
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="All">Tất cả</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.categoryName}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>

            {selectedMainCategory !== "All" && (
              <div className="subcategories">
                {categories
                  .filter((category) => category.categoryName === selectedMainCategory)
                  .map((category) => (
                    <div key={category.id}>
                      {category.subCategories.map((subCategory) => (
                        <div key={subCategory.id} className="mr-4 mb-2">
                          <input
                            type="checkbox"
                            id={subCategory.subCategoryName}
                            value={subCategory.subCategoryName}
                            checked={selectedCategory.includes(subCategory.subCategoryName)}
                            onChange={handleCategoryChange}
                            className="mr-2"
                          />
                          <label htmlFor={subCategory.subCategoryName}>
                            {subCategory.subCategoryName}
                          </label>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="sort-options mb-4">
            <label className="block text-lg font-semibold mb-2">Sắp xếp theo</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md"
            >
              <option value="name">Tên dự án</option>
              <option value="date">Ngày tạo</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            className="w-full p-3 bg-green-500 text-white rounded-md"
          >
            Tìm kiếm
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
