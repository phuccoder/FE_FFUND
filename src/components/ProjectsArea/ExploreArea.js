import { useState, useEffect, useCallback, memo } from "react";
import { Col, Container, Row } from "react-bootstrap";
import SingleProject from "./SingleProject";
import projectService from "../../services/projectService";
import Pagination from '@/components/Pagination';


const MemoizedSingleProject = memo(SingleProject);
MemoizedSingleProject.displayName = "MemoizedSingleProject";


const LoadingSkeleton = memo(() => (
    <Row className="justify-content-center">
        {Array(3)
            .fill(0)
            .map((_, index) => (
                <Col lg={4} md={6} sm={12} key={`loading-${index}`} className="mb-4">
                    <div className="bg-white rounded-lg overflow-hidden shadow-md h-full flex flex-col animate-pulse">
                        <div className="h-32 bg-gray-300"></div>
                        <div className="p-3 flex-grow flex flex-col">
                            <div className="flex items-center mb-2">
                                <div className="w-6 h-6 rounded-full mr-2 bg-gray-300"></div>
                                <div className="flex-grow">
                                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                                </div>
                            </div>
                            <div className="mb-2">
                                <div className="w-full h-1.5 bg-gray-300 rounded-full"></div>
                                <div className="flex justify-between mt-1">
                                    <div className="h-3 bg-gray-300 rounded w-20"></div>
                                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                                </div>
                            </div>
                            <div className="mb-2 h-8">
                                <div className="h-2 bg-gray-300 rounded w-full mb-1"></div>
                                <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                            </div>
                            <div className="mt-auto">
                                <div className="h-4 bg-gray-300 rounded w-20"></div>
                            </div>
                        </div>
                    </div>
                </Col>
            ))}
    </Row>
));
LoadingSkeleton.displayName = "LoadingSkeleton";

const ExploreArea = ({ searchParams }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [size] = useState(9); // Show 6 items per page
    const [isSearching, setIsSearching] = useState(false);
    const [paginationData, setPaginationData] = useState({
        currentPage: 0,
        totalPages: 1,
        pageSize: size,
        totalElements: 0
    });

    const fetchProjects = useCallback(async (pageNum = 0) => {
        try {
            console.log("Fetching projects with search params:", searchParams, "page:", pageNum);
            setLoading(true);

            let response;
            if (searchParams && searchParams.query) {
                setIsSearching(true);
                response = await projectService.searchProjects(pageNum, size, searchParams);
            } else {
                setIsSearching(false);
                response = await projectService.getAllProjects(pageNum, size);
            }

            console.log("API Response:", response);

            let extractedProjects = [];
            let paginationInfo = {
                currentPage: pageNum,
                totalPages: 1,
                pageSize: size,
                totalElements: 0
            };

            // Handle different response formats
            if (response && response.data) {
                console.log("Response has data property:", response.data);

                if (response.data.data && Array.isArray(response.data.data)) {
                    console.log("Using response.data.data for projects");
                    extractedProjects = response.data.data;

                    // Extract pagination data
                    paginationInfo = {
                        currentPage: response.data.currentPage !== undefined ? response.data.currentPage : pageNum,
                        totalPages: response.data.totalPages || Math.ceil(response.data.totalElements / size) || 1,
                        pageSize: response.data.pageSize || size,
                        totalElements: response.data.totalElements || extractedProjects.length
                    };
                } else if (Array.isArray(response.data)) {
                    console.log("Using response.data for projects");
                    extractedProjects = response.data;

                    // If we don't have pagination info, estimate it
                    paginationInfo = {
                        currentPage: pageNum,
                        totalPages: Math.ceil(extractedProjects.length / size) || 1,
                        pageSize: size,
                        totalElements: extractedProjects.length
                    };
                }
            } else if (response && response.content && Array.isArray(response.content)) {
                console.log("Using response.content for projects");
                extractedProjects = response.content;

                // Extract pagination data
                paginationInfo = {
                    currentPage: response.number !== undefined ? response.number : pageNum,
                    totalPages: response.totalPages || Math.ceil(response.totalElements / size) || 1,
                    pageSize: response.size || size,
                    totalElements: response.totalElements || extractedProjects.length
                };
            } else if (Array.isArray(response)) {
                console.log("Using response array directly for projects");
                extractedProjects = response;

                paginationInfo = {
                    currentPage: pageNum,
                    totalPages: Math.ceil(extractedProjects.length / size) || 1,
                    pageSize: size,
                    totalElements: extractedProjects.length
                };
            }

            console.log("Extracted pagination info:", paginationInfo);
            console.log("Total pages:", paginationInfo.totalPages);

            setProjects(extractedProjects);
            setPaginationData(paginationInfo);
            setCurrentPage(paginationInfo.currentPage);
            setTotalPages(paginationInfo.totalPages);
            setLoading(false);

            return extractedProjects;
        } catch (error) {
            console.error("Error fetching projects:", error);
            setError("Unable to load projects. Please try again later.");
            setLoading(false);
            return [];
        }
    }, [searchParams, size]);

    const handlePageChange = useCallback((page) => {
        console.log("Page changed to:", page);
        setCurrentPage(page);
        window.scrollTo(0, 0); // Scroll to top when changing page
        fetchProjects(page);
    }, [fetchProjects]);

    useEffect(() => {
        let isMounted = true;

        const initialLoad = async () => {
            if (isMounted) {
                await fetchProjects(0);
            }
        };

        initialLoad();

        return () => {
            isMounted = false;
        };
    }, [searchParams, fetchProjects]);

    // Debug output
    useEffect(() => {
        console.log("Current page:", currentPage);
        console.log("Total pages:", totalPages);
    }, [currentPage, totalPages]);

    return (
        <section className="explore-area pt-90 pb-120">
            <Container>
                {loading ? (
                    <div className="text-center py-8">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading projects...</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-warning text-center">{error}</div>
                ) : (
                    <>
                        {projects.length > 0 ? (
                            <>
                                <Row>
                                    {projects.map((project, index) => (
                                        <Col
                                            lg={4}
                                            md={6}
                                            sm={12}
                                            key={project.id || index}
                                            className="mb-4"
                                        >
                                            <MemoizedSingleProject project={project} />
                                        </Col>
                                    ))}
                                </Row>

                                {/* Debug info */}
                                <div className="text-center mt-4 mb-2">
                                    <div className="bg-gray-50 py-2 px-4 rounded-lg shadow-sm inline-block">
                                        <span className="text-sm font-medium text-gray-800">
                                            <strong className="text-green-500">Page {currentPage + 1}</strong> of <strong className="text-gray-800">{totalPages}</strong>
                                        </span>
                                        <span className="text-sm text-gray-600 ml-2">
                                            | Total Projects: <strong className="text-gray-800">{paginationData.totalElements}</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Always render Pagination for testing */}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p>No projects to display.</p>
                                {isSearching && (
                                    <button
                                        className="btn btn-outline-primary mt-3"
                                        onClick={() => window.location.href = "/explore"}
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </Container>
        </section>
    );
};

export default memo(ExploreArea);