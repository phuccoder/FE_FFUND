import { useState, useEffect, useRef } from "react";
import { Tab } from "@headlessui/react";
import projectService from "src/services/projectService";
import paymentService from "src/services/paymentService";
import { globalSettingService } from "src/services/globalSettingService";
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaMoneyBillWave, FaSpinner, FaChevronUp, FaChevronDown, FaQuestionCircle, FaArrowRight } from "react-icons/fa";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

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

const ProjectPaymentPage = ({ project, selectedPhaseId = null, selectedMilestoneId = null }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [phases, setPhases] = useState([]);
  const [milestones, setMilestones] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [platformChargePercentage, setPlatformChargePercentage] = useState(0.02); // Default value
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [isInvestor, setIsInvestor] = useState(false);
  // Convert selectedPhaseId to number to ensure proper comparison
  const numericPhaseId = selectedPhaseId ? parseInt(selectedPhaseId) : null;
  const numericMilestoneId = selectedMilestoneId ? parseInt(selectedMilestoneId) : null;
  // Step tracking - start at step 1 or 2 depending on if phaseId is provided
  const [currentStep, setCurrentStep] = useState(1);

  // Payment selection state
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentType, setPaymentType] = useState("milestone");

  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [showRoleWarning, setShowRoleWarning] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const roleValue = localStorage.getItem('role');
        if (roleValue) {
          setIsInvestor(roleValue === 'INVESTOR');
        }
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        setIsInvestor(false);
      }
    }
  }, []);

  // Fetch platform charge percentage from global settings
  useEffect(() => {
    const fetchPlatformChargePercentage = async () => {
      setLoadingSettings(true);
      try {
        const response = await globalSettingService.getGlobalSettingByType('PLATFORM_CHARGE_PERCENTAGE');

        if (response && response.data) {
          // Handle both array and object response formats
          const setting = Array.isArray(response.data) ? response.data[0] : response.data;
          const percentageValue = parseFloat(setting.value);

          if (!isNaN(percentageValue)) {
            console.log(`Setting platform charge percentage to ${percentageValue}`);
            setPlatformChargePercentage(percentageValue);
          } else {
            console.warn('Invalid PLATFORM_CHARGE_PERCENTAGE value received');
          }
        } else {
          console.warn('No PLATFORM_CHARGE_PERCENTAGE setting found, using default');
        }
      } catch (error) {
        console.error('Error fetching PLATFORM_CHARGE_PERCENTAGE setting:', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchPlatformChargePercentage();
  }, []);

  useEffect(() => {
    const fetchPhases = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedPhases = await projectService.getPhasesForGuest(project.id);
        setPhases(fetchedPhases);

        // For each phase, fetch milestones using the guest endpoint
        const milestonesPromises = fetchedPhases.map(async (phase) => {
          try {
            const fetchedMilestones = await projectService.getMilestoneByPhaseIdForGuest(phase.id);
            return { phaseId: phase.id, milestones: fetchedMilestones };
          } catch (err) {
            console.error(`Error fetching milestones for phase: ${err}`);
            return { phaseId: phase.id, milestones: [] }; // Return empty array on error
          }
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

  useEffect(() => {
    const processPreselectedMilestone = async () => {
      if (numericPhaseId && numericMilestoneId && selectedPhase) {
        try {
          console.log("Processing preselected milestone:", numericMilestoneId);

          if (milestones[selectedPhase.id]) {
            const milestone = milestones[selectedPhase.id].find(
              (m) => m.id === numericMilestoneId
            );

            if (milestone) {
              console.log("Found matching milestone:", milestone.title);
              setSelectedMilestone(milestone);
              setPaymentType("milestone");

              // Only proceed to step 4 if terms have been accepted
              if (termsAccepted) {
                console.log("Terms accepted, checking authentication...");
                if (isAuthenticated && isInvestor) {
                  console.log("User is authenticated investor, moving to step 4");
                  setCurrentStep(4);
                } else {
                  console.log("Auth check failed, moving to step 3 with warnings");
                  setCurrentStep(3);
                  if (!isAuthenticated) {
                    setShowAuthWarning(true);
                  } else if (!isInvestor) {
                    setShowRoleWarning(true);
                  }
                }
              } else {
                console.log("Terms not yet accepted, staying at step 1");
              }
            }
          }
        } catch (err) {
          console.error("Error selecting milestone:", err);
        }
      }
    };

    if (selectedPhase && Object.keys(milestones).length > 0) {
      processPreselectedMilestone();
    }
  }, [selectedPhase, milestones, numericMilestoneId, numericPhaseId, isAuthenticated, isInvestor, termsAccepted]);

  // Calculate platform fee based on the amount
  const calculatePlatformFee = (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    return numericAmount * platformChargePercentage;
  };

  // Calculate total including platform fee
  const calculateTotal = (amount) => {
    const numericAmount = parseFloat(amount) || 0;
    const fee = calculatePlatformFee(numericAmount);
    return numericAmount + fee;
  };

  const handleTermsAgreement = () => {
    const newValue = !agreedToTerms;
    setAgreedToTerms(newValue);
    if (newValue) {
      setTermsAccepted(true);
    }
  };

  const handleProceedAfterTerms = () => {
    if (!agreedToTerms) return;

    // If both milestone and phase are preselected, go directly to step 4
    if (numericMilestoneId && numericPhaseId && selectedPhase && selectedMilestone) {
      if (isAuthenticated && isInvestor) {
        setCurrentStep(4);
      } else {
        setCurrentStep(3);
        if (!isAuthenticated) {
          setShowAuthWarning(true);
        } else if (!isInvestor) {
          setShowRoleWarning(true);
        }
      }
    }
    else if (numericPhaseId && selectedPhase) {
      setCurrentStep(3);
    }
    else {
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


  useEffect(() => {
  }, [selectedPhase]);

  const handleMoveToStep4 = () => {
    if (!isAuthenticated) {
      setShowAuthWarning(true);
      setShowRoleWarning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!isInvestor) {
      setShowRoleWarning(true);
      setShowAuthWarning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentStep(4);
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

      const responseData = err.response?.data;
      console.log("Full error response:", responseData);

      let errorData;
      try {
        errorData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
      } catch (e) {
        errorData = responseData;
      }

      // Check different possible structures for the error message
      if (errorData) {
        // Check for the specific duplicate purchase error message
        if (errorData.error && errorData.error.includes("You can only purchase each milestone once")) {
          setError("You have already invested in this milestone. Please select a different milestone.");
          return;
        }

        // Check for specific status code
        if (errorData.status === 400) {
          setError(errorData.error || errorData.message || "Payment validation failed. Please try again.");
          return;
        }

        // For other structured errors
        setError(
          errorData.error ||
          errorData.message ||
          (typeof errorData === 'string' ? errorData : "Payment processing failed. Please try again.")
        );
      } else {
        // Fallback for when response data is not accessible
        setError(`Payment processing failed: ${err.message || "Unknown error"}`);
      }
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

    if (!isAuthenticated) {
      setShowAuthWarning(true);
      setShowRoleWarning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!isInvestor) {
      setShowRoleWarning(true);
      setShowAuthWarning(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

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
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500 mb-4"></div>
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

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";

    try {
      // Handle array format (legacy format)
      if (Array.isArray(dateValue)) {
        return `${String(dateValue[1]).padStart(2, '0')}/${String(dateValue[2]).padStart(2, '0')}/${dateValue[0]}`;
      }

      // Handle ISO string format (YYYY-MM-DD)
      if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [year, month, day] = dateValue.split('-').map(part => parseInt(part, 10));
        return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
      }

      // Handle Date object
      if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
        return `${String(dateValue.getMonth() + 1).padStart(2, '0')}/${String(dateValue.getDate()).padStart(2, '0')}/${dateValue.getFullYear()}`;
      }

      // Return original value if we can't parse it
      return dateValue;
    } catch (err) {
      console.error("Error formatting date:", err);
      return "Invalid date";
    }
  };

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
            <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-yellow-600' : 'text-gray-500'}`}>
              {numericMilestoneId && numericPhaseId ? 'Confirm Terms' : 'Read Terms'}
            </span>
          </div>
          <div className={`h-1 w-20 ${currentStep >= 2 ? 'bg-gradient-to-r from-yellow-300 to-yellow-600' : 'bg-gray-200'} mx-2 mt-6`}></div>

          {/* Step 2 */}
          <div className={`flex flex-col items-center justify-center ${currentStep === 2 ? 'opacity-100' : 'opacity-60'}`}>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-600'} font-bold text-lg mb-2`}>
              2
            </div>
            <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-yellow-600' : 'text-gray-500'}`}>Choose Phase</span>
          </div>
          <div className={`h-1 w-20 ${currentStep >= 3 ? 'bg-gradient-to-r from-yellow-300 to-yellow-600' : 'bg-gray-200'} mx-2 mt-6`}></div>

          {/* Step 3 */}
          <div className={`flex flex-col items-center justify-center ${currentStep === 3 ? 'opacity-100' : 'opacity-60'}`}>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-600'} font-bold text-lg mb-2`}>
              3
            </div>
            <span className={`text-sm font-medium ${currentStep >= 3 ? 'text-yellow-600' : 'text-gray-500'}`}>Select Milestone</span>
          </div>
          <div className={`h-1 w-20 ${currentStep >= 4 ? 'bg-gradient-to-r from-yellow-300 to-yellow-600' : 'bg-gray-200'} mx-2 mt-6`}></div>

          {/* Step 4 */}
          <div className={`flex flex-col items-center justify-center ${currentStep === 4 ? 'opacity-100' : 'opacity-60'}`}>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-600'} font-bold text-lg mb-2`}>
              4
            </div>
            <span className={`text-sm font-medium ${currentStep >= 4 ? 'text-yellow-600' : 'text-gray-500'}`}>Confirm Payment</span>
          </div>
        </div>
      </div>

      {currentStep === 1 && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300 mb-8 max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <FaInfoCircle className="text-yellow-500 text-2xl mr-3" />
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
              className="w-5 h-5 mr-3 accent-yellow-500"
            />
            <label htmlFor="termsAgreement" className="text-gray-700">
              I have read and agree to the Terms of Use and Privacy Policy
            </label>
          </div>

          <button
            onClick={handleProceedAfterTerms}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 flex items-center justify-center
  ${agreedToTerms
                ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 hover:from-yellow-600 hover:to-yellow-400 hover:shadow-lg'
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
            <FaInfoCircle className="text-yellow-500 text-2xl mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Select a Funding Phase</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {phases
              .filter(phase => phase.status === 'PROCESS') // Only show phases with status PROCESS
              .map((phase) => (
                <div
                  key={phase.id}
                  className={`border p-5 rounded-lg cursor-pointer transition-all ${selectedPhase?.id === phase.id
                    ? 'border-yellow-500 bg-yellow-50 shadow-md transform scale-102'
                    : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 hover:shadow'
                    }`}
                  onClick={() => handlePhaseSelect(phase)}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Phase {phase.phaseNumber}</h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {phase.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Target: ${phase.targetAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Timeline: {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                  </div>
                  <div className="mt-4 text-right">
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-yellow-300 to-yellow-600 hover:from-yellow-600 hover:to-yellow-400 text-white rounded-lg font-medium flex items-center ml-auto transition-all duration-300 hover:shadow"
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

          {phases.filter(phase => phase.status === 'PROCESS').length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FaExclamationTriangle className="mx-auto text-yellow-400 text-3xl mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Active Funding Phases</h3>
              <p className="text-gray-600">This project doesn&apos;t have any phases open for funding at the moment.</p>
            </div>
          )}
        </div>
      )}

      {currentStep === 3 && showAuthWarning && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Authentication Required</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You need to be logged in to complete your payment. Please sign in or create an account to continue.</p>
                <div className="mt-3">
                  <button
                    onClick={() => router.push(`/login-register`)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mr-2"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowAuthWarning(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && showRoleWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-600">Investor Role Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Your account doesn&apos;t have permission to make investments. Only users with the Investor role can complete payments.</p>
                <div className="mt-3">
                  <button
                    onClick={() => router.push(`/login-register`)}
                    className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 mr-2"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowRoleWarning(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Milestone Selection with Enhanced Item Details */}
      {currentStep === 3 && selectedPhase && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300 mb-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FaMoneyBillWave className="text-yellow-500 text-2xl mr-3" />
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
              className="text-sm text-gray-600 hover:text-yellow-600 flex items-center hover:bg-gray-100 px-3 py-1 rounded-full transition-all duration-200"
            >
              Change Phase
            </button>
          </div>

          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-1">Phase {selectedPhase.phaseNumber}</h3>
            <p className="text-sm text-gray-500">
              Target: ${selectedPhase.targetAmount.toLocaleString()} •
              Timeline: {formatDate(selectedPhase.startDate)} - {formatDate(selectedPhase.endDate)}
            </p>
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
                          ? 'border-yellow-500 bg-yellow-50 shadow-md transform scale-102'
                          : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'}`}
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setPaymentType("milestone");
                      }}
                    >
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">{milestone.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                      </div>

                      <div className="bg-yellow-50 p-2 rounded-md inline-block mb-3">
                        <span className="text-yellow-700 font-medium">${milestone.price}</span>
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
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full ml-2">
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
                        className="w-full py-3 px-4 bg-gradient-to-r from-yellow-300 to-yellow-600 hover:from-yellow-600 hover:to-yellow-400 text-white rounded-lg font-medium transition-all duration-300 hover:shadow flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMilestone(milestone);
                          setPaymentType("milestone");
                          handleMoveToStep4();
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
                          className="w-full pl-8 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
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
                            handleMoveToStep4();
                          }
                        }}
                        className={`w-full md:w-1/3 py-3 px-6 rounded-lg text-white font-medium transition-all duration-300 flex items-center justify-center ${customAmount
                          ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 hover:from-yellow-600 hover:to-yellow-400 hover:shadow'
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
                <FaExclamationTriangle className="mx-auto text-yellow-400 text-3xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Milestones Available</h3>
                <p className="text-gray-600 mb-8">This phase doesn&apos;t have any milestones yet, but you can still contribute a custom amount.</p>

                <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-800 mb-4">Make a Custom Contribution</h4>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:w-2/3">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-700 font-medium">$</span>
                      <input
                        type="text"
                        className="w-full pl-8 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
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
                      className={`w-full sm:w-1/3 py-3 px-4 rounded-lg text-white font-medium transition-all duration-300 ${customAmount
                        ? 'bg-gradient-to-r from-yellow-300 to-yellow-600 hover:from-yellow-600 hover:to-yellow-400 hover:shadow'
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
                      className="text-yellow-600 hover:text-yellow-800 font-medium"
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

      {/* Step 4: Payment Confirmation */}
      {currentStep === 4 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Payment Confirmation, Warning and FAQs */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FaMoneyBillWave className="text-yellow-500 text-2xl mr-3" />
                <h2 className="text-2xl font-bold text-gray-800">Confirm Your Payment</h2>
              </div>
              <button
                onClick={() => {
                  setCurrentStep(3);
                  // Keep the phaseId in URL when going back to milestone selection
                }}
                className="text-sm text-gray-600 hover:text-yellow-600 flex items-center hover:bg-gray-100 px-3 py-1 rounded-full transition-all duration-200"
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
                      <div className="bg-yellow-50 inline-block px-3 py-1 rounded-md">
                        <span className="font-medium text-yellow-700">${selectedMilestone.price}</span>
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
                      <div className="bg-yellow-50 inline-block px-3 py-1 rounded-md">
                        <span className="font-medium text-yellow-700">${parseFloat(customAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Platform Fee Information */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 mb-4">
                <h4 className="font-medium text-gray-800 mb-3">Fee Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">
                      ${paymentType === "milestone" && selectedMilestone
                        ? selectedMilestone.price
                        : parseFloat(customAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Platform Fee ({(platformChargePercentage * 100).toFixed(0)}%):</span>
                    <span className="font-medium">
                      ${paymentType === "milestone" && selectedMilestone
                        ? (selectedMilestone.price * platformChargePercentage).toFixed(2)
                        : calculatePlatformFee(customAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span className="text-yellow-600">
                        ${paymentType === "milestone" && selectedMilestone
                          ? (parseFloat(selectedMilestone.price) + parseFloat(selectedMilestone.price) * platformChargePercentage).toFixed(2)
                          : calculateTotal(customAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                {loadingSettings && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating fee information...
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
                  ? 'bg-yellow-400 cursor-wait'
                  : 'bg-gradient-to-r from-yellow-300 to-yellow-600 hover:from-yellow-600 hover:to-yellow-400 hover:-translate-y-1 hover:shadow-xl'}`}
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
                <FaQuestionCircle className="text-yellow-500 mr-2" />
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
              <div className="mb-6 bg-gradient-to-r from-yellow-50 to-yellow-50 p-5 rounded-lg border border-yellow-100 shadow-sm">
                <div className="flex items-center justify-between mb-4 border-b border-yellow-200 pb-3">
                  <h3 className="text-xl font-bold text-yellow-800">Checkout Summary</h3>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-medium">
                    {selectedPhase.status}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Phase Information */}
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                      <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                      Phase {selectedPhase.phaseNumber}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600">Target Amount:</div>
                      <div className="text-right font-semibold text-gray-800">${selectedPhase.targetAmount.toLocaleString()}</div>

                      <div className="text-gray-600">Timeline:</div>
                      <div className="text-right font-semibold text-gray-800">
                        {formatDate(selectedPhase.startDate)} - {formatDate(selectedPhase.endDate)}
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
                          <span className="font-bold text-yellow-600">${selectedMilestone.price}</span>
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
                          <span className="font-bold text-yellow-600">${parseFloat(customAmount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Platform Fee */}
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-3">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                      Platform Fee
                    </h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fee ({(platformChargePercentage * 100).toFixed(0)}%):</span>
                        <span className="font-medium text-gray-800">
                          ${paymentType === "milestone" && selectedMilestone
                            ? (selectedMilestone.price * platformChargePercentage).toFixed(2)
                            : calculatePlatformFee(customAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

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
                              <span className="px-2 py-1 bg-yellow-50 text-yellow-800 text-xs rounded-full">
                                x{item.quantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total section */}
                  <div className="flex justify-between items-center pt-3 mt-2 border-t border-yellow-200">
                    <span className="font-medium text-gray-700">Total:</span>
                    <span className="text-xl font-bold text-yellow-600">
                      ${paymentType === "milestone" && selectedMilestone
                        ? (parseFloat(selectedMilestone.price) + parseFloat(selectedMilestone.price) * platformChargePercentage).toFixed(2)
                        : calculateTotal(customAmount).toFixed(2)}
                    </span>
                  </div>

                  {/* Payment info */}
                  <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-yellow-100">
                    <p className="flex items-center">
                      <FaInfoCircle className="text-yellow-400 mr-1" />
                      Payment will be processed securely via Stripe
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Amount Message */}
            {paymentType === "custom" && (
              <div className="mt-4 bg-yellow-50 p-5 rounded-lg border border-yellow-100">
                <div className="flex items-center mb-3">
                  <FaCheckCircle className="text-yellow-500 text-xl mr-2" />
                  <h3 className="text-lg font-semibold text-yellow-800">Custom Contribution</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  Thank you for your generous support! Your contribution will help this project reach its funding goals.
                </p>
                {customAmount && (
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-lg font-medium text-gray-800">
                      Your contribution: <span className="text-yellow-600 font-bold">${parseFloat(customAmount).toFixed(2)}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Platform fee ({(platformChargePercentage * 100).toFixed(0)}%): <span className="font-medium">${calculatePlatformFee(customAmount).toFixed(2)}</span>
                    </p>
                    <p className="text-lg font-medium text-gray-800 mt-3 pt-3 border-t border-gray-100">
                      Total: <span className="text-yellow-600 font-bold">${calculateTotal(customAmount).toFixed(2)}</span>
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