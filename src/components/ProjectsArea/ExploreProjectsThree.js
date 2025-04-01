import React, { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import SingleExploreProject from "./SingleExploreProject";
import { transactionService } from "src/services/transactionService";
import projectService from "src/services/projectService";
import Loading from "@/components/Loading";

const ExploreProjectsThree = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvestedProjects = async () => {
      try {
        setIsLoading(true);
        // First, get all transactions
        const transactionsResponse = await transactionService.getTransactionsByInvestor(0, 100, "+id");
        
        if (transactionsResponse && transactionsResponse.content) {
          // Extract unique project IDs from transactions
          const projectIds = [...new Set(transactionsResponse.content.map(t => t.projectId))];
          
          // Fetch project details for each project ID
          const projectsData = await Promise.all(
            projectIds.map(async (id) => {
              try {
                return await projectService.getProjectById(id);
              } catch (err) {
                console.error(`Failed to fetch project with ID ${id}:`, err);
                return null;
              }
            })
          );
          
          // Filter out any null values (failed fetches)
          setProjects(projectsData.filter(project => project !== null));
        }
      } catch (err) {
        console.error("Failed to load invested projects:", err);
        setError("Failed to load your invested projects. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvestedProjects();
  }, []);

  if (isLoading) {
    return (
      <section className="explore-projects-3-area explore-v2-page pt-90 pb-120">
        <Container>
          <Loading message="Loading your invested projects..." />
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <section className="explore-projects-3-area explore-v2-page pt-90 pb-120">
        <Container>
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="explore-projects-3-area explore-v2-page pt-90 pb-120">
      <Container>
        <div className="explore-margin">
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-xl text-gray-700 mb-2">No Invested Projects Found</h3>
              <p className="text-gray-500">You haven&apos;t invested in any projects yet.</p>
            </div>
          ) : (
            <Row className="justify-content-center">
              {projects.map((project) => (
                <Col lg={6} md={6} sm={9} key={project.id}>
                  <SingleExploreProject project={project} />
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Container>
    </section>
  );
};

export default ExploreProjectsThree;