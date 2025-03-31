import { useState, useEffect, useRef } from "react";
import { Tab } from "@headlessui/react";
import projectService from "src/services/projectService";
import paymentService from "src/services/paymentService";
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaMoneyBillWave, FaSpinner, FaChevronUp, FaChevronDown, FaQuestionCircle, FaArrowRight } from "react-icons/fa";
import { useRouter } from "next/router";

const Accordion = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef(null);

  return (
    <div className="border border-gray-200 rounded-md mb-2 overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-800">{title}</span>
        {isOpen ? (
          <FaChevronUp className="text-gray-500" />
        ) : (
          <FaChevronDown className="text-gray-500" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96" : "max-h-0"}`}
        ref={contentRef}
      >
        <div className="p-4 bg-white text-gray-700">{children}</div>
      </div>
    </div>
  );
};

const ProjectPaymentPage = ({ project, selectedPhaseId = null }) => {
  const router = useRouter();
  const [phases, setPhases] = useState([]);
  const [milestones, setMilestones] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Convert selectedPhaseId to number to ensure proper comparison
  const numericPhaseId = selectedPhaseId ? parseInt(selectedPhaseId) : null;

  // Step tracking - start at step 1 or 2 depending on if phaseId is provided
  const [currentStep, setCurrentStep] = useState(numericPhaseId ? 2 : 1);

  // Payment selection state
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentType, setPaymentType] = useState("milestone"); // "milestone" or "custom"

  // Tab state
  const [selectedTab, setSelectedTab] = useState(0); // 0 for Milestone, 1 for Reward

  useEffect(() => {
    setCurrentStep(1);
  }, []);

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
        const milestonesObj = milestonesResults.reduce((acc, { phaseId, milestones }) => {
          acc[phaseId] = milestones;
          return acc;
        }, {});

        setMilestones(milestonesObj);

        // If selectedPhaseId is provided, set it as the selected phase
        if (numericPhaseId && fetchedPhases.some(phase => phase.id === numericPhaseId)) {
          const phase = fetchedPhases.find(phase => phase.id === numericPhaseId);
          setSelectedPhase(phase);
        } else if (fetchedPhases.length === 1) {
          // If there's only one phase, auto-select it
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
  }, [project, numericPhaseId]);

  // Fix the terms agreement handler
  const handleTermsAgreement = () => {
    setAgreedToTerms(!agreedToTerms);
  };

  // Fix the proceed after terms function
  const handleProceedAfterTerms = () => {
    if (!agreedToTerms) return;

    // If a phase ID was provided AND phase is already selected, go directly to step 3 (milestone selection)
    if (numericPhaseId && selectedPhase) {
      setCurrentStep(3);
    } else {
      // Otherwise, go to step 2 (phase selection)
      setCurrentStep(2);
    }
  };

  // Fix phase selection handler to properly advance to step 3
  const handlePhaseSelect = (phase) => {
    setSelectedPhase(phase);
    setCurrentStep(3); // Immediately go to milestone selection after choosing a phase
    // Update URL with phaseId for better navigation
    router.push(`/payment?projectId=${project.id}&phaseId=${phase.id}`, undefined, { shallow: true });
  };

  // Add this useEffect to prevent immediate bounce back to step 1
  useEffect(() => {
    // Don't automatically redirect back to step 1 when phase is not selected
    // Only handle automatic jumps between steps when terms are agreed
  }, [selectedPhase]);

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
      <div className="bg-gradient-to-r from-yellow-300 to-yellow-600 p-8 rounded-t-xl shadow-lg mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">Support {project.title}</h1>
        <p className="text-lg opacity-90">Join others in bringing this project to life</p>
      </div>

      {/* Improved Steps Progress Indicator */}
      <div className="mb-10">
        <div className="flex items-center justify-center">
          {/* Step 1 */}
          <div className={`flex flex-col items-center justify-center ${currentStep === 1 ? 'opacity-100' : 'opacity-60'}`}>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-600'} font-bold text-lg mb-2`}>
              1
            </div>
            <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-orange-600' : 'text-gray-500'}`}>Read Terms</span>
          </div>
          <div className={`h-1 w-20 ${currentStep >= 2 ? 'bg-gradient-to-r from-yellow-300 to-yellow-600' : 'bg-gray-200'} mx-2 mt-6`}></div>

          {/* Step 2 */}
          <div className={`flex flex-col items-center justify-center ${currentStep === 2 ? 'opacity-100' : 'opacity-60'}`}>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-600'} font-bold text-lg mb-2`}>
              2
            </div>
            <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-orange-600' : 'text-gray-500'}`}>Choose Phase</span>
          </div>
          <div className={`h-1 w-20 ${currentStep >= 3 ? 'bg-gradient-to-r from-yellow-300 to-yellow-600' : 'bg-gray-200'} mx-2 mt-6`}></div>

          {/* Step 3 */}
          <div className={`flex flex-col items-center justify-center ${currentStep === 3 ? 'opacity-100' : 'opacity-60'}`}>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-600'} font-bold text-lg mb-2`}>
              3
            </div>
            <span className={`text-sm font-medium ${currentStep >= 3 ? 'text-orange-600' : 'text-gray-500'}`}>Select Milestone</span>
          </div>
          <div className={`h-1 w-20 ${currentStep >= 4 ? 'bg-gradient-to-r from-yellow-300 to-yellow-600' : 'bg-gray-200'} mx-2 mt-6`}></div>

          {/* Step 4 */}
          <div className={`flex flex-col items-center justify-center ${currentStep === 4 ? 'opacity-100' : 'opacity-60'}`}>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-600'} font-bold text-lg mb-2`}>
              4
            </div>
            <span className={`text-sm font-medium ${currentStep >= 4 ? 'text-orange-600' : 'text-gray-500'}`}>Confirm Payment</span>
          </div>
        </div>
      </div>

      {currentStep === 1 && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300 mb-8 max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <FaInfoCircle className="text-orange-500 text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Terms of Use and Privacy Policy</h2>
          </div>

          <div className="mb-6 bg-gray-50 p-6 rounded-lg border border-gray-100">
            <p className="mb-4">Please read and agree to our Terms of Use and Privacy Policy before proceeding.</p>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Terms of Use</h3>
              <div className="max-h-40 overflow-y-auto bg-white p-4 rounded border border-gray-200 mb-4">
                <p className="text-sm text-gray-700">
                  By using our platform, you agree to abide by our terms and conditions. This includes respecting project creators&apos;
                  intellectual property, understanding that pledges are not guaranteed investments, and acknowledging that project
                  delivery timelines may change. You must be at least 18 years old to make financial contributions.
                  All payments are processed securely through our payment partner. While we strive to verify project authenticity,
                  we cannot guarantee every aspect of project fulfillment.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Privacy Policy</h3>
              <div className="max-h-40 overflow-y-auto bg-white p-4 rounded border border-gray-200 mb-4">
                <p className="text-sm text-gray-700">
                  We collect personal information necessary for processing your contribution and providing project updates.
                  This includes your name, email address, billing information, and transaction history. Your information is kept
                  secure and is only shared with project creators when necessary for reward fulfillment.
                  We use industry-standard security measures to protect your data. You maintain the right to access and modify
                  your personal information at any time through your account settings.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <input
              type="checkbox"
              id="termsAgreement"
              checked={agreedToTerms}
              onChange={handleTermsAgreement}
              className="w-5 h-5 mr-3 accent-orange-500"
            />
            <label htmlFor="termsAgreement" className="text-gray-700">
              I have read and agree to the Terms of Use and Privacy Policy
            </label>
          </div>

          <button
            onClick={handleProceedAfterTerms}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 flex items-center justify-center
  ${agreedToTerms
                ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 hover:from-orange-600 hover:to-amber-500 hover:shadow-lg'
                : 'bg-gray-400 cursor-not-allowed opacity-70'}`}
            disabled={!agreedToTerms}
          >
            {numericPhaseId && selectedPhase ? 'Proceed to Milestone Selection' : 'Proceed to Phase Selection'}
          </button>
        </div>
      )}

      {/* Step 2: Phase Selection */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300 mb-8 max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <FaInfoCircle className="text-orange-500 text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Select a Funding Phase</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {phases.map((phase) => (
              <div
                key={phase.id}
                className={`border p-5 rounded-lg cursor-pointer transition-all ${selectedPhase?.id === phase.id
                  ? 'border-orange-500 bg-orange-50 shadow-md transform scale-102'
                  : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50 hover:shadow'
                  }`}
                onClick={() => handlePhaseSelect(phase)}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Phase {phase.phaseNumber}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${phase.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {phase.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Target: ${phase.targetAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  Timeline: {`${phase.startDate[1]}/${phase.startDate[0]}`} - {`${phase.endDate[1]}/${phase.endDate[0]}`}
                </div>
                <div className="mt-4 text-right">
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-yellow-300 to-yellow-600 hover:from-orange-600 hover:to-amber-500 text-white rounded-lg font-medium flex items-center ml-auto transition-all duration-300 hover:shadow"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePhaseSelect(phase);
                    }}
                  >
                    Select <FaArrowRight className="ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Milestone Selection with Enhanced Item Details */}
      {currentStep === 3 && selectedPhase && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300 mb-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FaMoneyBillWave className="text-orange-500 text-2xl mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Select Funding Option</h2>
            </div>
            <button
              onClick={() => {
                // Clear the selected phase
                setSelectedPhase(null);
                // Go back to phase selection
                setCurrentStep(2);
                // Remove phaseId from URL
                router.push(`/payment?projectId=${project.id}`, undefined, { shallow: true });
              }}
              className="text-sm text-gray-600 hover:text-orange-600 flex items-center hover:bg-gray-100 px-3 py-1 rounded-full transition-all duration-200"
            >
              Change Phase
            </button>
          </div>

          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-1">Phase {selectedPhase.phaseNumber}</h3>
            <p className="text-sm text-gray-500">Target: ${selectedPhase.targetAmount.toLocaleString()} • Timeline: {`${selectedPhase.startDate[1]}/${selectedPhase.startDate[0]}`} - {`${selectedPhase.endDate[1]}/${selectedPhase.endDate[0]}`}</p>
          </div>

          <div className="space-y-6">
            {milestones[selectedPhase.id]?.length > 0 ? (
              <>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Available Milestones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {milestones[selectedPhase.id].map(milestone => (
                    <div
                      key={milestone.id}
                      className={`border rounded-lg transition-all p-5 hover:shadow-md
                ${selectedMilestone?.id === milestone.id
                          ? 'border-orange-500 bg-orange-50 shadow-md transform scale-102'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'}`}
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setPaymentType("milestone");
                      }}
                    >
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">{milestone.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                      </div>

                      <div className="bg-orange-50 p-2 rounded-md inline-block mb-3">
                        <span className="text-orange-700 font-medium">${milestone.price}</span>
                      </div>

                      {/* Enhanced Milestone Items - Show all items */}
                      {milestone.items && milestone.items.length > 0 && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Includes:</h4>
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {milestone.items.map(item => (
                              <div key={item.id} className="flex items-start w-full bg-gray-50 p-3 rounded-md">
                                {item.imageUrl && (
                                  <div className="w-12 h-12 flex-shrink-0 mr-3">
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-12 h-12 object-cover rounded-md"
                                      onError={(e) => {
                                        e.target.src = "https://via.placeholder.com/40x40?text=No+Image";
                                      }}
                                    />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium text-gray-800">{item.name}</span>
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full ml-2">
                                      x{item.quantity || 1}
                                    </span>
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Single Pledge Button */}
                      <button
                        className="w-full py-3 px-4 bg-gradient-to-r from-yellow-300 to-yellow-600 hover:from-orange-600 hover:to-amber-500 text-white rounded-lg font-medium transition-all duration-300 hover:shadow flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMilestone(milestone);
                          setPaymentType("milestone");
                          setCurrentStep(4);
                        }}
                      >
                        Pledge ${milestone.price}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-10 pt-6 border-t border-gray-200">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Custom Contribution</h3>
                    <p className="text-gray-600 mb-6">Want to contribute a different amount to help this project reach its funding goal? Enter your custom contribution below.</p>

                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="relative w-full md:w-2/3">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-700 font-medium">$</span>
                        <input
                          type="text"
                          className="w-full pl-8 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                          placeholder="Enter amount"
                          value={customAmount}
                          onChange={handleCustomAmountChange}
                        />
                      </div>

                      <button
                        type="button"
                        disabled={!customAmount}
                        onClick={() => {
                          if (customAmount) {
                            setPaymentType("custom");
                            setCurrentStep(4);
                          }
                        }}
                        className={`w-full md:w-1/3 py-3 px-6 rounded-lg text-white font-medium transition-all duration-300 flex items-center justify-center
  ${customAmount
                            ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 hover:from-orange-600 hover:to-amber-500 hover:shadow'
                            : 'bg-gray-400 cursor-not-allowed opacity-70'}`}
                      >
                        Contribute Custom Amount
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg">
                <FaExclamationTriangle className="mx-auto text-orange-400 text-3xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Milestones Available</h3>
                <p className="text-gray-600 mb-8">This phase doesn&apos;t have any milestones yet, but you can still contribute a custom amount.</p>

                <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-800 mb-4">Make a Custom Contribution</h4>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:w-2/3">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-700 font-medium">$</span>
                      <input
                        type="text"
                        className="w-full pl-8 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                        placeholder="Enter amount"
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={!customAmount}
                      onClick={() => {
                        if (customAmount) {
                          setPaymentType("custom");
                          setCurrentStep(4); 
                        }
                      }}
                      className={`w-full sm:w-1/3 py-3 px-4 rounded-lg text-white font-medium transition-all duration-300
  ${customAmount
                          ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 hover:from-orange-600 hover:to-amber-500 hover:shadow'
                          : 'bg-gray-400 cursor-not-allowed opacity-70'}`}
                    >
                      Continue
                    </button>
                  </div>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        router.push(`/payment?projectId=${project.id}`, undefined, { shallow: true });
                      }}
                      className="text-orange-600 hover:text-orange-800 font-medium"
                    >
                      Select Different Phase
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Payment Confirmation */}
      {currentStep === 4 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Payment Confirmation, Warning and FAQs */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FaMoneyBillWave className="text-orange-500 text-2xl mr-3" />
                <h2 className="text-2xl font-bold text-gray-800">Confirm Your Payment</h2>
              </div>
              <button
                onClick={() => {
                  setCurrentStep(2);
                  // Keep the phaseId in URL when going back to milestone selection
                }}
                className="text-sm text-gray-600 hover:text-orange-600 flex items-center hover:bg-gray-100 px-3 py-1 rounded-full transition-all duration-200"
              >
                Change Selection
              </button>
            </div>

            {/* Payment Summary */}
            <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Summary</h3>

              {/* Show selected option details */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 mb-4">
                {paymentType === "milestone" && selectedMilestone ? (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FaCheckCircle className="text-green-500 mr-2" />
                      <h4 className="font-medium text-gray-800">Selected Milestone</h4>
                    </div>
                    <div className="pl-6">
                      <p className="font-medium text-gray-800">{selectedMilestone.title}</p>
                      <p className="text-sm text-gray-600 mt-1 mb-2">{selectedMilestone.description}</p>
                      <div className="bg-orange-50 inline-block px-3 py-1 rounded-md">
                        <span className="font-medium text-orange-700">${selectedMilestone.price}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <FaCheckCircle className="text-blue-500 mr-2" />
                      <h4 className="font-medium text-gray-800">Custom Contribution</h4>
                    </div>
                    <div className="pl-6">
                      <p className="text-sm text-gray-600 mb-2">Thank you for your support to Phase {selectedPhase.phaseNumber}</p>
                      <div className="bg-orange-50 inline-block px-3 py-1 rounded-md">
                        <span className="font-medium text-orange-700">${parseFloat(customAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={processingPayment}
              className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg shadow-lg transform transition-all duration-300 flex items-center justify-center
          ${processingPayment
                  ? 'bg-orange-400 cursor-wait'
                  : 'bg-gradient-to-r from-yellow-300 to-yellow-600 hover:from-orange-600 hover:to-amber-500 hover:-translate-y-1 hover:shadow-xl'}`}
            >
              {processingPayment ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Complete Payment'
              )}
            </button>

            {/* Warning Box */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 mb-6 mt-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Important Information</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Rewards aren&apos;t guaranteed. You are supporting an ambitious creative project that has yet to be developed.
                      It&apos;s important to consider that, despite a creator&apos;s efforts, there&apos;s a risk that your reward may not be fulfilled.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Accordion Section */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <FaQuestionCircle className="text-orange-500 mr-2" />
                <h3 className="text-lg font-bold text-gray-800">Frequently Asked Questions</h3>
              </div>

              <Accordion title="How do I pledge?">
                <p>Enter your pledge amount and select a reward. Then, enter your payment information to complete the checkout process.</p>
              </Accordion>
              <Accordion title="What can others see about my pledge?">
                <p>The project will be added to the list of backings on your profile page, but the amount you pledge, and the reward you choose, will not be made public.</p>
              </Accordion>

              <Accordion title="What if I want to change my pledge?">
                <p>You can change or cancel your pledge before proceeding to pay</p>
              </Accordion>

              <Accordion title="If this project is funded, how do I get my reward?">
                <p>If the creator completes the creative venture and is ready to begin fulfilling rewards, they will reach out with instructions for how to redeem your proof of pledge and claim your reward. At this point they will also request any additional information they need in order to fulfill your reward.</p>
              </Accordion>

              <Accordion title="Will I be charged more later?">
                <p>That depends. When you redeem your proof of pledge, you may be required to pay applicable sales or value-added tax and/or shipping fees, depending on the reward and where it is being delivered.</p>
              </Accordion>
            </div>
          </div>

          {/* Right Column - Checkout Summary */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            {/* Checkout */}
            {selectedPhase && (
              <div className="mb-6 bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-lg border border-orange-100 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-orange-200 pb-3">
                  <h3 className="text-xl font-bold text-orange-800">Checkout Summary</h3>
                  <span className="bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full font-medium">
                    {selectedPhase.status}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Phase Information */}
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                      <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                      Phase {selectedPhase.phaseNumber}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600">Target Amount:</div>
                      <div className="text-right font-semibold text-gray-800">${selectedPhase.targetAmount.toLocaleString()}</div>

                      <div className="text-gray-600">Timeline:</div>
                      <div className="text-right font-semibold text-gray-800">
                        {`${selectedPhase.startDate[1]}/${selectedPhase.startDate[0]}`} - {`${selectedPhase.endDate[1]}/${selectedPhase.endDate[0]}`}
                      </div>
                    </div>
                  </div>

                  {/* Milestone Information (if selected) */}
                  {selectedMilestone && paymentType === "milestone" && (
                    <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                      <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        Selected Milestone
                      </h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="font-medium text-gray-800">{selectedMilestone.title}</div>
                        <div className="text-gray-600 line-clamp-2">{selectedMilestone.description}</div>
                        <div className="flex justify-between mt-1">
                          <span>Price:</span>
                          <span className="font-bold text-orange-600">${selectedMilestone.price}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Custom Amount (if selected) */}
                  {paymentType === "custom" && customAmount && (
                    <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                      <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                        <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                        Custom Contribution
                      </h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between mt-1">
                          <span>Your contribution:</span>
                          <span className="font-bold text-orange-600">${parseFloat(customAmount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reward Preview (if milestone selected and has items) */}
                  {selectedMilestone && paymentType === "milestone" && selectedMilestone.items && selectedMilestone.items.length > 0 && (
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                        <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                        Rewards Included
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {selectedMilestone.items.map((item) => (
                          <div key={item.id} className="flex items-center py-1.5 border-b border-gray-100 last:border-0">
                            <div className="flex-grow">
                              <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                              <span className="px-2 py-1 bg-orange-50 text-orange-800 text-xs rounded-full">
                                x{item.quantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total section */}
                  <div className="flex justify-between items-center pt-3 mt-2 border-t border-orange-200">
                    <span className="font-medium text-gray-700">Total:</span>
                    <span className="text-xl font-bold text-orange-600">
                      ${paymentType === "milestone" && selectedMilestone
                        ? selectedMilestone.price
                        : paymentType === "custom" && customAmount
                          ? parseFloat(customAmount).toFixed(2)
                          : "0.00"}
                    </span>
                  </div>

                  {/* Payment info */}
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-orange-100">
                    <p className="flex items-center">
                      <FaInfoCircle className="text-orange-400 mr-1" />
                      Payment will be processed securely via Stripe
                    </p>
                  </div>
                </div>
              </div>
            )}

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
      )}
    </div>
  );
};

export default ProjectPaymentPage;