import { useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import projectService from "src/services/projectService";
import paymentService from "src/services/paymentService"; 
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaMoneyBillWave, FaSpinner } from "react-icons/fa";
import { useRouter } from "next/router"; 

const ProjectPaymentPage = ({ project, selectedPhaseId = null }) => {
  const router = useRouter();
  const [phases, setPhases] = useState([]);
  const [milestones, setMilestones] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Payment selection state
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentType, setPaymentType] = useState("milestone"); // "milestone" or "custom"
  
  // Tab state
  const [selectedTab, setSelectedTab] = useState(0); // 0 for Milestone, 1 for Reward

  useEffect(() => {
    const fetchPhases = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedPhases = await projectService.getPhasesForGuest(project.id);
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
        
        // If selectedPhaseId is provided, set it as the selected phase
        if (selectedPhaseId && fetchedPhases.some(phase => phase.id === selectedPhaseId)) {
          const phase = fetchedPhases.find(phase => phase.id === selectedPhaseId);
          setSelectedPhase(phase);
        } else if (fetchedPhases.length > 0) {
          // Otherwise select the first phase by default
          setSelectedPhase(fetchedPhases[0]);
        }
      } catch (err) {
        setError("Failed to load funding phases.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (project?.id) {
      fetchPhases();
    }
  }, [project, selectedPhaseId]);

  // When selected phase changes, reset milestone selection
  useEffect(() => {
    if (selectedPhase && milestones[selectedPhase.id]?.length > 0) {
      setSelectedMilestone(milestones[selectedPhase.id][0]);
    } else {
      setSelectedMilestone(null);
    }
  }, [selectedPhase, milestones]);

  const handleMilestoneChange = (milestoneId) => {
    const milestone = milestones[selectedPhase.id].find(m => m.id === milestoneId);
    setSelectedMilestone(milestone);
    setPaymentType("milestone");
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setCustomAmount(value);
      setPaymentType("custom");
    }
  };

  const handleTabChange = (index) => {
    setSelectedTab(index);
  };

  // Payment processing function for milestones
  const processMilestonePayment = async (milestoneId) => {
    try {
      setProcessingPayment(true);
      // Call API to create payment for milestone
      const response = await paymentService.createPaymentInfoForMilestone(milestoneId);
      
      if (response.status === 201 && response.data) {
        console.log("Payment created successfully:", response.message);
        // Redirect to Stripe checkout URL
        window.location.href = response.data;
      } else {
        throw new Error("Invalid response from payment service");
      }
    } catch (err) {
      console.error("Payment processing error:", err);
      setError(`Payment processing failed: ${err.message || "Unknown error"}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Payment processing function for custom amounts
  const processCustomPayment = async (phaseId, amount) => {
    try {
      setProcessingPayment(true);
      // Call API to create payment for phase with custom amount
      const response = await paymentService.createPaymentInfoForPhase(phaseId, { amount: parseFloat(amount) });
      
      if (response.status === 201 && response.data) {
        console.log("Custom payment created successfully:", response.message);
        // Redirect to Stripe checkout URL
        window.location.href = response.data;
      } else {
        throw new Error("Invalid response from payment service");
      }
    } catch (err) {
      console.error("Custom payment processing error:", err);
      setError(`Payment processing failed: ${err.message || "Unknown error"}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (processingPayment) return; // Prevent multiple submissions
    
    try {
      if (paymentType === "milestone" && selectedMilestone) {
        await processMilestonePayment(selectedMilestone.id);
      } else if (paymentType === "custom" && customAmount) {
        await processCustomPayment(selectedPhase.id, customAmount);
      } else {
        setError("Please select a milestone or enter a custom amount.");
      }
    } catch (err) {
      console.error("Payment submission error:", err);
      setError(`Payment submission failed: ${err.message || "Unknown error"}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 bg-gray-50 rounded-xl shadow-sm">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading payment options...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 border border-red-200 rounded-xl shadow">
        <FaExclamationTriangle className="mx-auto text-red-500 text-4xl mb-4" />
        <h3 className="text-xl font-bold text-red-700 mb-2">Error</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button 
          onClick={() => setError(null)} 
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header section with project title - updated with orange gradient */}
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-600  p-8 rounded-t-xl shadow-lg mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">Support {project.title}</h1>
        <p className="text-lg opacity-90">Join others in bringing this project to life</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Payment Selection */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center mb-6">
            <FaMoneyBillWave className="text-orange-500 text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Choose Your Contribution</h2>
          </div>
          
          {/* Phase information (read-only) */}
          {selectedPhase && (
            <div className="mb-6">
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">
                  Phase {selectedPhase.phaseNumber}
                </h3>
                <p className="text-gray-600 mb-2">
                  Target amount: <span className="font-semibold">${selectedPhase.targetAmount.toLocaleString()}</span>
                </p>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedPhase.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedPhase.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedPhase.status}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Payment Type Selection */}
          <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Method</h3>
            
            {/* Milestone Option */}
            <div className="mb-6">
              <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer">
                <input
                  id="milestone-radio"
                  type="radio"
                  name="payment-type"
                  className="h-5 w-5 text-orange-600 focus:ring-orange-500"
                  checked={paymentType === "milestone"}
                  onChange={() => setPaymentType("milestone")}
                />
                <label htmlFor="milestone-radio" className="ml-3 block text-gray-700 font-medium cursor-pointer w-full">
                  Select a Milestone
                </label>
              </div>
              
              {paymentType === "milestone" && selectedPhase && (
                <div className="mt-4 ml-6">
                  {milestones[selectedPhase.id]?.length > 0 ? (
                    <div className="relative">
                      <select
                        className="appearance-none w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                        value={selectedMilestone?.id || ""}
                        onChange={(e) => handleMilestoneChange(parseInt(e.target.value))}
                      >
                        {milestones[selectedPhase.id].map((milestone) => (
                          <option key={milestone.id} value={milestone.id}>
                            {milestone.title} - ${milestone.price}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No milestones available for this phase.</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Custom Amount Option */}
            <div className="mt-4">
              <div className="flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer">
                <input
                  id="custom-radio"
                  type="radio"
                  name="payment-type"
                  className="h-5 w-5 text-orange-600 focus:ring-orange-500"
                  checked={paymentType === "custom"}
                  onChange={() => setPaymentType("custom")}
                />
                <label htmlFor="custom-radio" className="ml-3 block text-gray-700 font-medium cursor-pointer w-full">
                  Custom Amount
                </label>
              </div>
              
              {paymentType === "custom" && (
                <div className="mt-4 ml-6">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-700 font-medium">$</span>
                    <input
                      type="text"
                      className="w-full pl-8 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              processingPayment || 
              (paymentType === "milestone" && !selectedMilestone) || 
              (paymentType === "custom" && !customAmount)
            }
            className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg shadow-lg transform transition-all duration-300 flex items-center justify-center
              ${processingPayment
                ? 'bg-orange-400 cursor-wait'
                : (paymentType === "milestone" && !selectedMilestone) || (paymentType === "custom" && !customAmount)
                  ? 'bg-gray-400 cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-yellow-300 to-yellow-600 hover:from-orange-600 hover:to-amber-500 hover:-translate-y-1 hover:shadow-xl text-white'}`}
          >
            {processingPayment ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Continue to Payment'
            )}
          </button>
        </div>
        
        {/* Right Column - Details */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          {/* Project Image */}
          {project.projectImage && (
            <div className="mb-6">
              <img 
                src={project.projectImage} 
                alt={project.title} 
                className="w-full h-48 object-cover rounded-lg shadow-md"
              />
            </div>
          )}
          
          {/* Phase Details */}
          {selectedPhase && (
            <div className="mb-6 bg-orange-50 p-5 rounded-lg border border-orange-100">
              <h3 className="text-xl font-bold text-orange-800 mb-3">Phase {selectedPhase.phaseNumber} Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-orange-100">
                  <span className="font-medium text-orange-700">Target Amount:</span>
                  <span className="font-semibold text-gray-800">${selectedPhase.targetAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-orange-100">
                  <span className="font-medium text-orange-700">Status:</span>
                  <span className={`font-semibold px-3 py-1 rounded-full text-xs ${
                    selectedPhase.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : selectedPhase.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedPhase.status}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="font-medium text-orange-700">Timeline:</span>
                  <span className="font-semibold text-gray-800">
                    {`${selectedPhase.startDate[1]}/${selectedPhase.startDate[0]}`} - {`${selectedPhase.endDate[1]}/${selectedPhase.endDate[0]}`}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Tabs for Milestone/Reward Details */}
          {selectedMilestone && paymentType === "milestone" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <Tab.Group selectedIndex={selectedTab} onChange={handleTabChange}>
                <Tab.List className="flex rounded-t-lg bg-gray-50 border-b border-gray-200">
                  <Tab
                    className={({ selected }) =>
                      `flex-1 py-3 text-sm font-medium leading-5 transition-colors
                      ${selected 
                        ? 'bg-white text-orange-700 border-t-2 border-orange-500' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`
                    }
                  >
                    Milestone Details
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `flex-1 py-3 text-sm font-medium leading-5 transition-colors
                      ${selected 
                        ? 'bg-white text-orange-700 border-t-2 border-orange-500' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`
                    }
                  >
                    Rewards
                  </Tab>
                </Tab.List>
                <Tab.Panels>
                  {/* Milestone Details Panel */}
                  <Tab.Panel className="p-5">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-orange-700">{selectedMilestone.title}</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedMilestone.description}</p>
                      <div className="bg-orange-50 p-3 rounded-lg inline-block">
                        <p className="text-gray-800 font-medium">
                          <span className="text-orange-600">Price:</span> ${selectedMilestone.price}
                        </p>
                      </div>
                    </div>
                  </Tab.Panel>
                  
                  {/* Reward Details Panel */}
                  <Tab.Panel className="p-5">
                    <h3 className="text-lg font-bold text-orange-700 mb-4">Rewards</h3>
                    {selectedMilestone.items && selectedMilestone.items.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedMilestone.items.map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col items-center">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                className="w-32 h-32 object-cover rounded-md mb-3"
                              />
                            ) : (
                              <div className="w-32 h-32 bg-gray-100 flex items-center justify-center rounded-md mb-3">
                                <span className="text-gray-400">No Image</span>
                              </div>
                            )}
                            <h4 className="text-md font-medium text-gray-800">{item.name}</h4>
                            <div className="mt-2 px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              Quantity: {item.quantity}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 bg-gray-50 rounded-lg">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        <p className="mt-2 text-gray-500">No rewards specified for this milestone.</p>
                      </div>
                    )}
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
          )}

          {/* Warning Box */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Important Information</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    The rewards associated with milestones are not guaranteed. They represent the project&apos;s goals but may be subject to change based on project progress and unforeseen circumstances.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Custom Amount Message */}
          {paymentType === "custom" && (
            <div className="mt-4 bg-orange-50 p-5 rounded-lg border border-orange-100">
              <div className="flex items-center mb-3">
                <FaCheckCircle className="text-orange-500 text-xl mr-2" />
                <h3 className="text-lg font-semibold text-orange-800">Custom Contribution</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Thank you for your generous support! Your contribution will help this project reach its funding goals.
              </p>
              {customAmount && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-lg font-medium text-gray-800">
                    Your contribution: <span className="text-orange-600 font-bold">${parseFloat(customAmount).toFixed(2)}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom section with additional info */}
      <div className="bg-gray-50 mt-8 p-6 rounded-lg border border-gray-200">
        <div className="flex items-start">
          <FaInfoCircle className="text-orange-500 text-xl mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">How does funding work?</h3>
            <p className="text-gray-700">
              Your payment will be securely processed and held until the project completes its current funding phase. 
              Funds are released to the project creator as they complete milestones according to their roadmap. 
              This ensures accountability and helps projects succeed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPaymentPage;