import Header from "@/components/Header/Header";
import Layout from "@/components/Layout/Layout";
import ExploreArea from "@/components/ProjectsArea/ExploreArea";
import PageTitle from "@/components/Reuseable/PageTitle";
import AdvancedSearch from "@/components/ProjectsArea/AdvancedSearch";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

const Projects = () => {
  const [searchParams, setSearchParams] = useState(null);
  const router = useRouter();
  const { category, subCategory, autoSearch } = router.query;

  // Sử dụng useEffect để xử lý query params khi trang được tải
  useEffect(() => {
    // Chỉ chạy khi router.isReady để đảm bảo query params đã được tải
    if (!router.isReady) return;

    // Kiểm tra xem có cần tự động tìm kiếm không
    if (autoSearch && category && subCategory) {
      const queryParts = [];

      // Thêm category và subCategory vào query
      queryParts.push(`category.name:eq:${encodeURIComponent(category)}`);
      queryParts.push(`subCategories.subCategory.name:eq:${encodeURIComponent(subCategory)}`);

      // Tạo params tìm kiếm
      const params = {
        query: queryParts.join(","),
        sort: "-createdAt",
        page: 0,
        size: 10
      };

      // Cập nhật searchParams để kích hoạt tìm kiếm
      setSearchParams(params);

      // Gửi dữ liệu để cập nhật AdvancedSearch component
      if (window && window.dispatchEvent) {
        const event = new CustomEvent('applySearchFilters', {
          detail: {
            category: category,
            subCategory: subCategory
          }
        });
        window.dispatchEvent(event);
      }

      // Xóa query params sau khi đã xử lý để tránh tự động tìm kiếm lại khi refresh
      router.replace("/projects-1", undefined, { shallow: true });
    }
  }, [router.isReady, autoSearch, category, subCategory, router]);

  const handleSearch = (params) => {
    console.log("Search parameters in Projects page:", params);
    setSearchParams(params);
  };

  return (
    <Layout>
      <Header />
      <PageTitle title="Explore" />
      <AdvancedSearch onSearch={handleSearch} defaultCategory={category} defaultSubCategory={subCategory} />
      <ExploreArea searchParams={searchParams} />
    </Layout>
  );
};

export default Projects;