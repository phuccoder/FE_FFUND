import { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import SingleProject from "./SingleProject";
import projectService from "../../services/projectService";

const ExploreArea = ({ searchParams }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        let isMounted = true; // Flag to avoid state updates if component unmounts
        
        const fetchProjects = async () => {
            if (!isMounted) return;
            
            setLoading(true);
            setError(null);

            try {
                console.log("Fetching projects with search params:", searchParams);
                
                let response;
                
                // Only use search if we have valid search parameters
                if (searchParams && searchParams.query) {
                    setIsSearching(true);
                    response = await projectService.searchProjects(page, size, searchParams);
                    console.log('Search response:', response);
                } else {
                    setIsSearching(false);
                    response = await projectService.getAllProjects(page, size);
                    console.log('All projects response:', response);
                }

                if (isMounted) {
                    // First, extract the projects based on the API response structure
                    let extractedProjects = [];

                    if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
                        // Handle nested data.data structure (matches your API response)
                        extractedProjects = response.data.data;
                        console.log('Extracted projects from nested data:', extractedProjects);
                    } else if (response && response.data && Array.isArray(response.data)) {
                        // Handle data array structure
                        extractedProjects = response.data;
                        console.log('Extracted projects from data array:', extractedProjects);
                    } else if (response && response.content && Array.isArray(response.content)) {
                        // Handle paginated content structure
                        extractedProjects = response.content;
                        console.log('Extracted projects from content:', extractedProjects);
                    } else if (Array.isArray(response)) {
                        // Handle direct array response
                        extractedProjects = response;
                        console.log('Projects from direct array:', extractedProjects);
                    }

                    if (extractedProjects.length > 0) {
                        setProjects(extractedProjects);
                    } else {
                        setProjects([]);
                        setError(isSearching ? "No projects match your search criteria." : "No projects found.");
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Error fetching projects:", error);
                    setError("Unable to load projects. Please try again later.");
                    setProjects([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProjects();
        return () => {
            isMounted = false;
        };
    }, [page, size, searchParams]);

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
                    <Row className="justify-content-center">
                        {projects.length > 0 ? (
                            projects.map((project) => (
                                <Col lg={4} md={6} sm={7} key={project.id || project._id}>
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
                )}
            </Container>
        </section>
    );
};

export default ExploreArea;