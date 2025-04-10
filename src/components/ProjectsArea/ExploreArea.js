import { useState, useEffect, useRef, useCallback } from "react";
import { Col, Container, Row } from "react-bootstrap";
import SingleProject from "./SingleProject";
import projectService from "../../services/projectService";

const ExploreArea = ({ searchParams }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [size] = useState(9); // Show 9 items per page (3 per row)
    const [isSearching, setIsSearching] = useState(false);
    const observer = useRef();
    const loadingTimeoutRef = useRef(null);

    // Last element ref for infinite scrolling
    const lastProjectElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !loadingMore) {
                // Set loadingMore immediately when scrolling to the bottom
                setLoadingMore(true);

                // Clear any existing timeout
                if (loadingTimeoutRef.current) {
                    clearTimeout(loadingTimeoutRef.current);
                }

                // Add a small delay to ensure loading state is visible
                loadingTimeoutRef.current = setTimeout(() => {
                    loadMoreProjects();
                }, 500); // Short delay to ensure loading indicator appears
            }
        }, { threshold: 0.1 }); // Lower threshold to trigger earlier

        if (node) observer.current.observe(node);
    }, [loading, hasMore, loadingMore]);

    const fetchProjects = async (pageNum = 0, replace = true) => {
        try {
            console.log("Fetching projects with search params:", searchParams, "page:", pageNum);

            // Simulate network delay to show loading (remove in production)
            // This is just to demonstrate the loading effect
            await new Promise(resolve => setTimeout(resolve, 1000));

            let response;
            // Only use search if we have valid search parameters
            if (searchParams && searchParams.query) {
                setIsSearching(true);
                response = await projectService.searchProjects(pageNum, size, searchParams);
            } else {
                setIsSearching(false);
                response = await projectService.getAllProjects(pageNum, size);
            }

            let extractedProjects = [];
            // Extract projects based on API response structure
            if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
                extractedProjects = response.data.data;
                setHasMore(extractedProjects.length === size);
            } else if (response && response.data && Array.isArray(response.data)) {
                extractedProjects = response.data;
                setHasMore(extractedProjects.length === size);
            } else if (response && response.content && Array.isArray(response.content)) {
                extractedProjects = response.content;
                setHasMore(response.hasNext || extractedProjects.length === size);
            } else if (Array.isArray(response)) {
                extractedProjects = response;
                setHasMore(extractedProjects.length === size);
            }

            if (replace) {
                setProjects(extractedProjects);
            } else {
                setProjects(prev => [...prev, ...extractedProjects]);
            }

            return extractedProjects;
        } catch (error) {
            console.error("Error fetching projects:", error);
            setError("Unable to load projects. Please try again later.");
            setProjects(replace ? [] : projects);
            return [];
        }
    };

    // Initial load
    useEffect(() => {
        let isMounted = true;

        const initialLoad = async () => {
            setLoading(true);
            setError(null);

            if (isMounted) {
                await fetchProjects(0, true);
                setLoading(false);
            }
        };

        initialLoad();

        return () => {
            isMounted = false;
            // Clear timeout when component unmounts
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
        };
    }, [searchParams]);

    // Function to load more projects
    const loadMoreProjects = async () => {
        if (!hasMore) {
            setLoadingMore(false);
            return;
        }

        const nextPage = page + 1;
        const newProjects = await fetchProjects(nextPage, false);

        if (newProjects.length > 0) {
            setPage(nextPage);
        } else {
            setHasMore(false);
        }

        setLoadingMore(false);
    };

    // Reset when search changes
    useEffect(() => {
        setPage(0);
        setHasMore(true);
    }, [searchParams]);

    // Create a placeholder array of loading cards
    const loadingCards = Array(3).fill(0).map((_, index) => (
        <Col lg={4} md={6} sm={7} key={`loading-${index}`} className="mb-4">
            <div className="bg-white rounded-lg overflow-hidden shadow-md h-full flex flex-col animate-pulse">
                <div className="h-56 bg-gray-300"></div>
                <div className="p-5 flex-grow flex flex-col">
                    <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full mr-2 bg-gray-300"></div>
                        <div>
                            <div className="h-5 bg-gray-300 rounded w-36 mb-1"></div>
                            <div className="h-3 bg-gray-300 rounded w-24"></div>
                        </div>
                    </div>
                    <div className="mb-4">
                        <div className="w-full h-2 bg-gray-300 rounded-full"></div>
                        <div className="flex justify-between mt-2">
                            <div className="h-4 bg-gray-300 rounded w-20"></div>
                            <div className="h-4 bg-gray-300 rounded w-16"></div>
                        </div>
                    </div>
                    <div className="mb-3 h-12">
                        <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                    <div className="mt-auto">
                        <div className="h-6 bg-gray-300 rounded w-20"></div>
                    </div>
                </div>
            </div>
        </Col>
    ));

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
                        <Row className="justify-content-center">
                            {projects.length > 0 ? (
                                projects.map((project, index) => (
                                    <Col
                                        lg={4}
                                        md={6}
                                        sm={7}
                                        key={project.id || project._id}
                                        className="mb-4"
                                        ref={index === projects.length - 1 ? lastProjectElementRef : null}
                                    >
                                        <SingleProject project={project} />
                                    </Col>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <p>No projects to display.</p>
                                    {isSearching && (
                                        <button
                                            className="btn btn-outline-primary mt-3"
                                            onClick={() => setSearchParams(null)}
                                        >
                                            Clear search
                                        </button>
                                    )}
                                </div>
                            )}
                        </Row>

                        {/* Loading indicator for infinite scroll with skeleton cards */}
                        {loadingMore && (
                            <Row className="justify-content-center">
                                {loadingCards}
                            </Row>
                        )}

                        {/* Invisible element to trigger loading when scrolled to */}
                        {!loading && hasMore && !loadingMore && (
                            <div
                                ref={lastProjectElementRef}
                                className="h-10 w-full"
                            ></div>
                        )}
                    </>
                )}
            </Container>
        </section>
    );
};

export default ExploreArea;