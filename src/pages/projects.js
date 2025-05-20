import { useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/router";
import Header from "@/components/Header/Header";
import Layout from "@/components/Layout/Layout";
import PageFront from "@/components/Reuseable/PageFront";

// Lazy load các components không cần thiết ngay lập tức
const AdvancedSearch = lazy(() => import("@/components/ProjectsArea/AdvancedSearch"));
const ExploreArea = lazy(() => import("@/components/ProjectsArea/ExploreArea"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="text-center py-8">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading component...</span>
    </div>
  </div>
);

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
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        const event = new CustomEvent('applySearchFilters', {
          detail: {
            category: category,
            subCategory: subCategory
          }
        });
        window.dispatchEvent(event);
      }

      // Xóa query params sau khi đã xử lý để tránh tự động tìm kiếm lại khi refresh
      router.replace("/projects", undefined, { shallow: true });
    }
  }, [router.isReady, autoSearch, category, subCategory, router]);

  const handleSearch = (params) => {
    console.log("Search parameters in Projects page:", params);
    setSearchParams(params);
  };

  return (
    <Layout>
      <Header />
      <PageFront />
      <Suspense fallback={<LoadingFallback />}>
        <AdvancedSearch
          onSearch={handleSearch}
          defaultCategory={category}
          defaultSubCategory={subCategory}
        />
      </Suspense>
      <Suspense fallback={<LoadingFallback />}>
        <ExploreArea searchParams={searchParams} />
      </Suspense>
    </Layout>
  );
};

export default Projects;