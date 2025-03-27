import { useState, useEffect, useRef } from "react";
import { Tab } from "@headlessui/react";
import projectService from "src/services/projectService";
import paymentService from "src/services/paymentService";
import { FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaMoneyBillWave, FaSpinner, FaChevronUp, FaChevronDown, FaQuestionCircle } from "react-icons/fa";
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
        className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96" : "max-h-0"
          }`}
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

        {/* Right Column - Details */}
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
                    {selectedMilestone.items.length > 4 && (
                      <div className="pt-2 text-center">
                        <button
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                          onClick={() => setSelectedTab(1)}
                        >
                          See all rewards
                        </button>
                      </div>
                    )}
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

          {/* Phase information (read-only) */}
          {selectedPhase && (
            <div className="mb-6 bg-orange-50 p-5 rounded-lg border border-orange-100">
              <h3 className="text-xl font-bold text-orange-800 mb-3">Phase {selectedPhase.phaseNumber} Details</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                <div className="flex justify-between py-2 border-b border-orange-100">
                  <span className="font-medium text-orange-700">Target Amount:</span>
                  <span className="font-semibold text-gray-800">${selectedPhase.targetAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-orange-100">
                  <span className="font-medium text-orange-700">Status:</span>
                  <span className={`font-semibold px-3 py-1 rounded-full text-xs ${selectedPhase.status === 'ACTIVE'
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
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
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
                  {/* Milestone Details Panel - With scroll for long content */}
                  <Tab.Panel className="p-5">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-orange-700">{selectedMilestone.title}</h3>
                      <div className="max-h-48 overflow-y-auto pr-2 text-gray-700 leading-relaxed">
                        <p>{selectedMilestone.description}</p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg inline-block">
                        <p className="text-gray-800 font-medium">
                          <span className="text-orange-600">Price:</span> ${selectedMilestone.price}
                        </p>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Reward Details Panel - With scroll for many items */}
                  <Tab.Panel className="p-5">
                    <h3 className="text-lg font-bold text-orange-700 mb-4">Rewards</h3>
                    {selectedMilestone && paymentType === "milestone" && selectedMilestone.items && selectedMilestone.items.length > 0 && (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                          <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                          Rewards Included
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {selectedMilestone.items.map((item) => (
                            <div key={item.id} className="flex items-center py-1.5 border-b border-gray-100 last:border-0">
                              {item.imageUrl ? (
                                <div className="flex-shrink-0 w-8 h-8 mr-3">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-8 h-8 object-cover rounded border border-gray-200"
                                  />
                                </div>
                              ) : (
                                <div className="flex-shrink-0 w-8 h-8 mr-3 bg-gray-100 rounded border border-gray-200 text-xs flex items-center justify-center text-gray-400">
                                  <span>Item</span>
                                </div>
                              )}
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
                        {selectedMilestone.items.length > 4 && (
                          <div className="pt-2 text-center">
                            <button
                              className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                              onClick={() => setSelectedTab(1)}
                            >
                              See all rewards
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
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
    </div>
  );
};

export default ProjectPaymentPage;