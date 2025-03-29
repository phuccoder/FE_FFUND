import { useState, useEffect } from "react";
import projectService from "../../../services/projectPublicService";
import { useRouter } from "next/router";

const ProjectDetailsSidebar = ({ getClassName, project }) => {
  const [phases, setPhases] = useState([]);
  const [milestones, setMilestones] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const router = useRouter();

  const { id } = project;

  useEffect(() => {
    const fetchPhases = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedPhases = await projectService.getPhasesForGuest(id);
        setPhases(fetchedPhases);

        // For each phase, fetch milestones
        const milestonesPromises = fetchedPhases.map(async (phase) => {
          const fetchedMilestones = await projectService.getMilestoneByPhaseId(phase.id);
          return { phaseId: phase.id, milestones: fetchedMilestones };
        });

        const milestonesResults = await Promise.all(milestonesPromises);

        // Convert array of results to object with phaseId as key
        const milestonesObj = milestonesResults.reduce((acc, { phaseId, milestones }) => {
          acc[phaseId] = milestones;
          return acc;
        }, {});

        setMilestones(milestonesObj);
        
        // Select the first phase by default
        if (fetchedPhases.length > 0) {
          setSelectedPhaseId(fetchedPhases[0].id);
          
          // Select the first milestone of the first phase if available
          if (milestonesObj[fetchedPhases[0].id]?.length > 0) {
            setSelectedMilestone(milestonesObj[fetchedPhases[0].id][0]);
          }
        }
      } catch (err) {
        setError("Failed to load funding phases.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPhases();
    }
  }, [id]);

  const handleContinueClick = (phaseId) => {
    // Ensure phaseId is a string for URL parameters
    const phaseIdParam = String(phaseId);
    const projectIdParam = String(id);

    console.log(`Redirecting to payment with projectId=${projectIdParam} and phaseId=${phaseIdParam}`);

    // Navigate to the payment page with project and phase IDs
    router.push({
      pathname: '/payment',
      query: {
        projectId: projectIdParam,
        phaseId: phaseIdParam
      }
    });
  };

  const handlePhaseClick = (phaseId) => {
    setSelectedPhaseId(phaseId);
    setSelectedMilestone(milestones[phaseId]?.[0] || null);
  };

  const handleMilestoneClick = (milestone) => {
    setSelectedMilestone(milestone);
  };

  if (loading) {
    return (
      <div className={`${getClassName?.("pills-phase")} p-6 bg-white shadow-md rounded-lg`}>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${getClassName?.("pills-phase")} p-6 bg-white shadow-md rounded-lg`}>
        <div className="text-center p-6 bg-red-50 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // Find the selected phase object
  const selectedPhase = phases.find(phase => phase.id === selectedPhaseId);
  const phasesMilestones = selectedPhaseId ? (milestones[selectedPhaseId] || []) : [];

  return (
    <div className={`${getClassName?.("pills-phase")}`} id="pills-phase" role="tabpanel">
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <h3 className="text-xl font-bold text-yellow-700">Funding Details</h3>
          <p className="text-sm text-yellow-600">Explore phases and milestones</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Column 1: Phases List */}
          <div className="border-r border-gray-200 p-4">
            <h4 className="text-lg font-semibold mb-3 text-gray-800 pb-2 border-b">Project Phases</h4>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {phases.length > 0 ? (
                phases.map((phase) => (
                  <div 
                    key={phase.id}
                    onClick={() => handlePhaseClick(phase.id)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedPhaseId === phase.id 
                        ? 'bg-blue-100 border border-yellow-300' 
                        : 'hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <h5 className="font-medium text-yellow-700">Phase {phase.phaseNumber}</h5>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        phase.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {phase.status}
                      </span>
                    </div>
                    <div className="mt-2 text-sm">
                      <p className="text-gray-700"><span className="font-medium">Target:</span> ${phase.targetAmount.toLocaleString()}</p>
                      <p className="text-gray-700">
                        <span className="font-medium">Timeline:</span> {`${phase.startDate[1]}/${phase.startDate[0]}`} - {`${phase.endDate[1]}/${phase.endDate[0]}`}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContinueClick(phase.id);
                      }} 
                      className="mt-2 w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded transition-colors"
                    >
                      Support This Phase
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No phases available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Column 2: Milestones for Selected Phase */}
          <div className="border-r border-gray-200 p-4">
            <div className="flex justify-between items-center mb-3 pb-2 border-b">
              <h4 className="text-lg font-semibold text-gray-800">
                {selectedPhase ? `Milestones for Phase ${selectedPhase.phaseNumber}` : 'Select a Phase'}
              </h4>
              {selectedPhase && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedPhase.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedPhase.status}
                </span>
              )}
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {selectedPhaseId ? (
                phasesMilestones.length > 0 ? (
                  phasesMilestones.map((milestone) => (
                    <div 
                      key={milestone.id}
                      onClick={() => handleMilestoneClick(milestone)}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        selectedMilestone?.id === milestone.id 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <h5 className="font-semibold text-yellow-700-700 mb-1">{milestone.title}</h5>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{milestone.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-700">${milestone.price}</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {milestone.items?.length || 0} items
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No milestones for this phase</p>
                  </div>
                )
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-md">
                  <p className="text-gray-500">Select a phase to view milestones</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Column 3: Items for Selected Milestone */}
          <div className="p-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b">
              {selectedMilestone ? 'Milestone Items' : 'Select a Milestone'}
            </h4>
            
            {selectedMilestone ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md mb-4 border border-blue-100">
                  <h5 className="font-medium text-yellow-700 mb-1">{selectedMilestone.title}</h5>
                  <p className="text-sm text-gray-700 mb-2">{selectedMilestone.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-green-700">${selectedMilestone.price}</span>
                    <button
                      onClick={() => handleContinueClick(selectedPhaseId)}
                      className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                    >
                      Back This Milestone
                    </button>
                  </div>
                </div>
                
                {selectedMilestone.items && selectedMilestone.items.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedMilestone.items.map((item) => (
                      <div key={item.id} className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                        <div className="h-32 overflow-hidden bg-gray-100">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/150?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h6 className="font-medium text-sm text-gray-800">{item.name}</h6>
                          <p className="text-xs text-gray-500 line-clamp-2 min-h-[2rem] mt-1">
                            {item.description || "No description available"}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs bg-blue-100 text-yellow-700 px-2 py-1 rounded-full">
                              Qty: {item.quantity || 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No items in this milestone</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-10 bg-gray-50 rounded-md flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                <p className="text-gray-500">Select a milestone to view its items</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsSidebar;