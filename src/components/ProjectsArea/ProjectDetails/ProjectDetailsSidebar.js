import { useState, useEffect } from "react";
import projectService from "../../../services/projectPublicService";
import { useRouter } from "next/router";

const ProjectDetailsSidebar = ({ getClassName, project }) => {
  const [phases, setPhases] = useState([]);
  const [milestones, setMilestones] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Function to open the modal
  const openModal = (phaseId) => {
    setSelectedPhaseId(phaseId);
    setIsModalOpen(true);
  };

  // Function to close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPhaseId(null);
  };

  return (
    <div className={`${getClassName?.("pills-phase")} p-6 bg-white shadow-md rounded-lg`} id="pills-phase" role="tabpanel">
      {loading && <div className="text-center text-lg font-semibold text-gray-700">Loading phases...</div>}
      {error && <div className="text-center text-lg font-semibold text-red-600">{error}</div>}

      {/* Display fetched phases in a grid layout with 3 items per row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {phases.map((phase) => (
          <div key={phase.id} className="phase-card bg-white p-4 rounded-lg shadow-md mb-6">
            <h4 className="text-2xl font-bold text-blue-600 mb-2">Phase {phase.phaseNumber}</h4>
            <div className="text-lg mb-4">
              <p><strong>Target:</strong> ${phase.targetAmount.toLocaleString()}</p>
              <p><strong>Status:</strong> {phase.status}</p>
              <p><strong>Start Date:</strong> {`${phase.startDate[1]}/${phase.startDate[0]}`}</p>
              <p><strong>End Date:</strong> {`${phase.endDate[1]}/${phase.endDate[0]}`}</p>
            </div>

            {/* Display button to open modal */}
            <button 
              onClick={() => openModal(phase.id)} 
              className="main-btn w-full mt-4"
            >
              View Milestones
            </button>

            {/* Button to continue to payment page */}
            <button 
              onClick={() => handleContinueClick(phase.id)} 
              className="main-btn w-full mt-4"
            >
              Continue now
            </button>
          </div>
        ))}
      </div>

      {/* Modal for displaying milestones */}
      {isModalOpen && selectedPhaseId && (
        <div className="modal-overlay fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="modal-content bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="modal-header flex justify-between items-center">
              <h3 className="text-xl font-semibold text-blue-600">Milestones for Phase {selectedPhaseId}</h3>
              <button onClick={closeModal} className="text-gray-500 text-lg font-bold">X</button>
            </div>
            <div className="modal-body mt-4">
              {milestones[selectedPhaseId] && milestones[selectedPhaseId].length > 0 ? (
                milestones[selectedPhaseId].map((milestone) => (
                  <div key={milestone.id} className="milestone-item bg-gray-100 p-4 rounded-lg mb-4 shadow-md">
                    <h6 className="text-lg font-semibold text-blue-500">{milestone.title}</h6>
                    <p className="text-gray-700 mb-2">{milestone.description}</p>
                    <p className="text-sm text-gray-600"><strong>Price:</strong> ${milestone.price}</p>
                    <div className="grid grid-cols-2 gap-6 mt-4">
                      {milestone.items.map((item) => (
                        <div key={item.id} className="milestone-item-card p-4 bg-white rounded-lg shadow-sm flex flex-col items-center">
                          <img src={item.imageUrl} alt={item.name} className="w-24 h-24 object-cover mb-2 rounded-md" />
                          <p className="text-center text-sm text-gray-800">{item.name}</p>
                          <span className="text-xs text-gray-500">Quantity: {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-gray-600">No milestones for this phase.</div>
              )}
            </div>
            <div className="modal-footer flex justify-end mt-4">
              <button onClick={closeModal} className="main-btn text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailsSidebar;
