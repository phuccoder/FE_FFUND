import React, { useState, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";
import SingleExploreProject from "./SingleExploreProject";
import { transactionService } from "src/services/transactionService";
import projectService from "src/services/projectService";
import Loading from "@/components/Loading";

const ExploreProjectsThree = () => {
  const [projects, setProjects] = useState([]);
  const [projectInvestments, setProjectInvestments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvestedProjects = async () => {
      try {
        setIsLoading(true);
        const transactionsResponse = await transactionService.getTransactionsByInvestor(0, 100, "+id");
        
        console.log("Transactions response:", transactionsResponse);

        // Handle different API response formats
        let investments = [];
        if (transactionsResponse?.data?.data) {
          // Original expected format
          investments = transactionsResponse.data.data;
        } else if (transactionsResponse?.content) {
          // New format from the API
          investments = transactionsResponse.content;
        } else if (Array.isArray(transactionsResponse)) {
          // Directly an array
          investments = transactionsResponse;
        }

        if (investments.length > 0) {
          console.log("Got investments:", investments.length);

          const investmentData = {};
          
          investments.forEach(investment => {
            const { projectId, projectTitle, amount } = investment;
            
            if (!investmentData[projectId]) {
              investmentData[projectId] = {
                totalAmount: 0,
                projectTitle,
                investments: []
              };
            }
            
            investmentData[projectId].totalAmount += amount;
            investmentData[projectId].investments.push(investment);
          });
          
          console.log("Investment data by project:", investmentData);
          setProjectInvestments(investmentData);

          const projectIds = [...new Set(investments.map(t => t.projectId))];
          console.log("Unique project IDs:", projectIds);
          
          const projectPromises = projectIds.map(async (id) => {
            try {
              console.log(`Fetching project data for ID: ${id}`);
              const projectData = await projectService.getProjectById(id);
              console.log(`Received project data for ID ${id}:`, projectData ? "success" : "failed");
              
              if (projectData && investmentData[id]) {
                projectData.totalInvested = investmentData[id].totalAmount;
                console.log(`Total invested in project ${id}: $${projectData.totalInvested}`);
              }
              return projectData;
            } catch (err) {
              console.error(`Failed to fetch project with ID ${id}:`, err);
              return null;
            }
          });
          
          const projectsResults = await Promise.allSettled(projectPromises);
          const validProjects = projectsResults
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value);
            
          console.log("Valid projects loaded:", validProjects.length);
          setProjects(validProjects);
        } else {
          console.warn("No investments found in response");
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

  const createFallbackProjects = () => {
    if (projects.length === 0 && Object.keys(projectInvestments).length > 0) {
      return Object.keys(projectInvestments).map(projectId => ({
        id: projectId,
        title: projectInvestments[projectId].projectTitle,
        totalInvested: projectInvestments[projectId].totalAmount,
        simpleView: true // Flag to indicate this is a fallback view
      }));
    }
    return [];
  };

  const fallbackProjects = createFallbackProjects();

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

  // Debug rendering
  console.log("Rendering with projects:", projects.length);
  console.log("Project investments:", Object.keys(projectInvestments).length);
  console.log("Fallback projects:", fallbackProjects.length);

  return (
    <section className="explore-projects-3-area explore-v2-page pt-90 pb-120">
      <Container>
        
        <div className="explore-margin">
          {Object.keys(projectInvestments).length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <h3 className="text-xl text-gray-700 mb-2">No Invested Projects Found</h3>
              <p className="text-gray-500">You haven&apos;t invested in any projects yet.</p>
            </div>
          ) : (
            <>
              {/* Projects List */}
              {projects.length > 0 ? (
                <Row className="justify-content-center">
                  {projects.map((project) => (
                    <Col lg={6} md={6} sm={9} key={project.id}>
                      <SingleExploreProject
                        project={project}
                        totalInvested={project.totalInvested || 0}
                      />
                    </Col>
                  ))}
                </Row>
              ) : fallbackProjects.length > 0 ? (
                <Row className="justify-content-center">
                  {fallbackProjects.map((project) => (
                    <Col lg={6} md={6} sm={9} key={project.id}>
                      <div className="bg-white rounded-lg overflow-hidden shadow-md p-4">
                        <h3 className="text-xl font-bold text-gray-800">{project.title}</h3>
                        <p className="text-green-600 font-semibold mt-2">
                          Total Invested: ${project.totalInvested.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                        <p className="text-gray-500 text-sm mt-4">
                          Full project details unavailable
                        </p>
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <p className="text-gray-600">Project details are being loaded or unavailable.</p>
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </section>
  );
};

export default ExploreProjectsThree;