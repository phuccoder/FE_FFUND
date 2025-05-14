import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import projectService from 'src/services/projectService';
import ExtendTimeRequestForm from '../Request/RequestExtendTime';
import PhaseUploadDocument from './PhaseUploadDocument';
import InvestmentTable from '../FounderInvestment/InvestmentTable';

export default function FundraisingInformation({ formData, updateFormData, projectId, isEditPage = false, readOnly = false }) {
  // Initialize with safe default values
  const [form, setForm] = useState({
    startDate: formData?.startDate || new Date().toISOString().split('T')[0],
    phases: Array.isArray(formData?.phases) ? [...formData.phases] : [],
    ...formData
  });

  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [currentPhase, setCurrentPhase] = useState({
    fundingGoal: '',
    duration: 14,
    startDate: '',
    endDate: '',
  });

  // Add loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const isLastPhaseCompleted = form.phases?.length > 0 && form.phases[form.phases.length - 1].status === 'COMPLETED';
  const [editingPhase, setEditingPhase] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [phaseRule, setPhaseRule] = useState(null);
  const [loadingPhaseRule, setLoadingPhaseRule] = useState(false);
  const [phaseRuleError, setPhaseRuleError] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [phaseInvestments, setPhaseInvestments] = useState({});
  const [loadingInvestments, setLoadingInvestments] = useState(false);
  const initialLoadDone = useRef(false);
  // Add debugging logs
  useEffect(() => {
    console.log("Current form state:", form);
    console.log("Current phases:", form.phases);
  }, [form]);

  // Fetch project data if projectId is provided (edit mode)
  useEffect(() => {
    if (projectId && !initialLoadDone.current) {
      console.log("FundraisingInformation: Attempting to fetch project data with ID:", projectId);
      fetchProjectPhases();
      initialLoadDone.current = true; // Mark initial load as done
    } else {
      console.log("FundraisingInformation: No projectId provided or initial load already done, skipping data fetch");
    }
  }, [projectId]);

  //check if the phases match the project target amount before rendering UI
  useEffect(() => {
    if (form.phases && form.phases.length > 0 && formData?.totalTargetAmount) {
      const validation = validatePhaseTotals(form.phases, formData.totalTargetAmount);
      if (!validation.isValid) {
        setError(validation.message);
      } else if (error && error.includes('Total of all phases')) {
        // Clear the error if it was a phase total error
        setError(null);
      }
    }
  }, [form.phases, formData?.totalTargetAmount]);

  useEffect(() => {
    if (typeof updateFormData !== 'function') return;

    const calculateFundraisingCompletion = () => {
      const phases = form.phases || [];

      // If no phases, return 0%
      if (!phases.length) return 0;

      let completedPhaseFields = 0;
      let totalPhaseFields = 0;

      phases.forEach(phase => {
        if (!phase) return;
        const requiredFields = ['fundingGoal', 'startDate', 'duration'];
        requiredFields.forEach(field => {
          totalPhaseFields++;
          if (phase[field]) completedPhaseFields++;
        });
      });

      return totalPhaseFields > 0 ? Math.round((completedPhaseFields / totalPhaseFields) * 100) : 0;
    };

    const completionPercentage = calculateFundraisingCompletion();

    // Only update if the value has changed to avoid infinite loops
    if (formData?._completionPercentage !== completionPercentage) {
      // Create a copy of form data with completion percentage
      const updatedFormData = { ...form, _completionPercentage: completionPercentage };
      updateFormData(updatedFormData);
    }
  }, [form, formData?._completionPercentage, updateFormData]);

  useEffect(() => {
    if (!isEditPage && formData?.totalTargetAmount && formData.totalTargetAmount > 0) {
      fetchPhaseRule(formData.totalTargetAmount);
    }
  }, [formData?.totalTargetAmount, isEditPage]);

  const fetchProjectPhases = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      console.log("Fetching funding phases for projectId:", projectId);

      // Use the correct endpoint to get phases by project ID
      const phasesResponse = await projectService.getPhaseByProject(projectId);
      console.log("Raw funding phases API response:", phasesResponse);

      // Check if we have phases data
      if (Array.isArray(phasesResponse) && phasesResponse.length > 0) {
        // Map API data format to our component format
        const phases = phasesResponse.map(phase => {
          // Convert array dates to string format
          const startDateFormatted = Array.isArray(phase.startDate)
            ? `${phase.startDate[0]}-${String(phase.startDate[1]).padStart(2, '0')}-${String(phase.startDate[2]).padStart(2, '0')}`
            : phase.startDate;

          const endDateFormatted = Array.isArray(phase.endDate)
            ? `${phase.endDate[0]}-${String(phase.endDate[1]).padStart(2, '0')}-${String(phase.endDate[2]).padStart(2, '0')}`
            : phase.endDate;

          return {
            id: phase.id,
            fundingGoal: phase.targetAmount?.toString() || '',
            targetAmount: phase.targetAmount || 0,
            raiseAmount: phase.raiseAmount || 0,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            duration: calculateDuration(startDateFormatted, endDateFormatted),
            phaseNumber: phase.phaseNumber,
            status: phase.status,
            totalInvestors: phase.totalInvestors || 0,
            savedToServer: true
          };
        });

        console.log("Converted phases:", phases);

        const updatedForm = {
          ...form,
          phases
        };

        setForm(updatedForm);
        updateFormData(updatedForm);
        console.log("Updated form with phases:", updatedForm);
      } else {
        console.log("No funding phases found in API response");
      }
    } catch (err) {
      console.error('Error fetching project phases:', err);
      setError('Failed to load project phases. Please try again. Error: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPhaseRule = async (totalAmount) => {
    try {
      setLoadingPhaseRule(true);
      setPhaseRuleError(null);

      console.log("Fetching phase rule for total amount:", totalAmount);

      const ruleData = await projectService.getPhaseRuleByTotalTargetAmount(totalAmount);
      console.log("Phase rule data:", ruleData);

      if (ruleData) {
        setPhaseRule(ruleData);
      }
    } catch (err) {
      console.error("Error fetching phase rule:", err);
      setPhaseRuleError("Failed to load phase requirements. Please try again later.");
    } finally {
      setLoadingPhaseRule(false);
    }
  };

  // Calculate duration between two dates in days
  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 30;

    try {
      let start, end;

      // Handle different possible date formats
      if (Array.isArray(startDate)) {
        start = new Date(startDate[0], startDate[1] - 1, startDate[2]); // Month is 0-based in JS Date
      } else {
        start = new Date(startDate);
      }

      if (Array.isArray(endDate)) {
        end = new Date(endDate[0], endDate[1] - 1, endDate[2]);
      } else {
        end = new Date(endDate);
      }

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn("Invalid date format:", { startDate, endDate });
        return 30;
      }

      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error("Error calculating duration:", error);
      return 30; // Default to 30 days on error
    }
  };

  const calculateMinStartDate = () => {
    if (!form.phases || form.phases.length === 0) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 7);
      return minDate.toISOString().split('T')[0];
    }

    // Find the phase with the latest end date
    let latestEndDate = null;

    form.phases.forEach(phase => {
      if (!phase.endDate) return;

      let endDate;
      try {
        // Handle different possible date formats
        if (Array.isArray(phase.endDate)) {
          endDate = new Date(phase.endDate[0], phase.endDate[1] - 1, phase.endDate[2]);
        } else {
          endDate = new Date(phase.endDate);
        }

        if (isNaN(endDate.getTime())) {
          console.warn("Invalid end date format:", phase.endDate);
          return;
        }

        if (!latestEndDate || endDate > latestEndDate) {
          latestEndDate = endDate;
        }
      } catch (error) {
        console.error("Error parsing end date:", error);
      }
    });

    // If we found a valid latest end date, add 7 days to it
    if (latestEndDate) {
      const minStartDate = new Date(latestEndDate);
      minStartDate.setDate(minStartDate.getDate() + 7);
      return minStartDate.toISOString().split('T')[0];
    }

    // Fallback to 7 days from today if no valid end dates were found
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 7);
    return fallbackDate.toISOString().split('T')[0];
  };

  const handlePhaseChange = (e) => {
    const { name, value } = e.target;

    // Validate minimum duration
    if (name === 'duration' && parseInt(value) < 14) {
      setError('Phase duration must be at least 14 days');
      return;
    }

    setCurrentPhase(prevPhase => ({
      ...prevPhase,
      [name]: value
    }));

    // Calculate end date if start date and duration are set
    if (name === 'startDate' || name === 'duration') {
      if (currentPhase.startDate || (name === 'startDate' && value)) {
        const startDate = new Date(name === 'startDate' ? value : currentPhase.startDate);
        const durationDays = parseInt(name === 'duration' ? value : currentPhase.duration);

        // Calculate minimum start date based on existing phases
        const minStartDate = new Date(calculateMinStartDate());

        if (startDate < minStartDate && name === 'startDate') {
          // Create a formatted date string for the error message
          const formattedDate = minStartDate.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          setError(`Start date must be at least ${formattedDate} (7 days after the previous phase ends)`);
          return;
        }

        if (!isNaN(startDate.getTime()) && !isNaN(durationDays)) {
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + durationDays);
          setCurrentPhase(prevPhase => ({
            ...prevPhase,
            [name]: value,
            endDate: endDate.toISOString().split('T')[0]
          }));
        }
      }
    }
  };

  const validatePhaseTotals = (phases, totalTargetAmount) => {
    if (!phases || phases.length === 0) return { isValid: false, message: 'At least one funding phase is required' };

    let targetAmount = parseFloat(totalTargetAmount || 0);

    if (isNaN(targetAmount) || targetAmount <= 0) {
      console.log("Invalid totalTargetAmount from formData, attempting to fetch from server");
    }

    // Rest of the function remains the same
    const totalPhaseAmount = phases.reduce((total, phase) => {
      const phaseAmount = parseFloat(phase.fundingGoal || 0);
      return total + (isNaN(phaseAmount) ? 0 : phaseAmount);
    }, 0);

    // Round to 2 decimal places to avoid floating point comparison issues
    const formattedTargetAmount = targetAmount.toFixed(2);
    const formattedPhasesTotal = totalPhaseAmount.toFixed(2);

    console.log("Validating phases total:", {
      totalPhaseAmount: formattedPhasesTotal,
      targetAmount: formattedTargetAmount,
      rawTargetAmount: totalTargetAmount
    });

    const difference = Math.abs(totalPhaseAmount - targetAmount);
    const tolerance = 0.01;

    if (difference > tolerance) {
      return {
        isValid: false,
        message: `Total of all phases (${formatCurrency(formattedPhasesTotal)}) must equal the project target amount (${formatCurrency(formattedTargetAmount)})`
      };
    }

    return { isValid: true };
  };

  const fetchProjectData = async () => {
    if (!projectId) return null;

    try {
      const projectData = await projectService.getProjectById(projectId);
      console.log("Project data retrieved:", projectData);

      if (projectData && projectData.totalTargetAmount) {
        return {
          totalTargetAmount: parseFloat(projectData.totalTargetAmount)
        };
      }
      return null;
    } catch (err) {
      console.error("Error fetching project data:", err);
      return null;
    }
  };


  const fetchPhaseInvestments = async (phaseId) => {
    if (!phaseId) return;

    try {
      setLoadingInvestments(true);

      console.log("Fetching investments for phase ID:", phaseId);
      const investmentsData = await projectService.getInvestmentByPhaseId(phaseId);

      console.log("Raw investments API response:", investmentsData);
      let processedInvestments = [];
      let paginationInfo = null;

      if (investmentsData && investmentsData.data && investmentsData.data.data) {
        processedInvestments = investmentsData.data.data;
        if ('currentPage' in investmentsData.data && 'totalPages' in investmentsData.data) {
          paginationInfo = {
            currentPage: investmentsData.data.currentPage,
            totalPages: investmentsData.data.totalPages,
            pageSize: investmentsData.data.pageSize,
            totalElements: investmentsData.data.totalElements
          };
        }
        console.log(`Processed ${processedInvestments.length} investments from nested data structure`);
      }
      else if (investmentsData && investmentsData.data && Array.isArray(investmentsData.data)) {
        processedInvestments = investmentsData.data;
        console.log(`Processed ${processedInvestments.length} investments from data array`);
      }
      else if (investmentsData && Array.isArray(investmentsData)) {
        processedInvestments = investmentsData;
        console.log(`Processed ${processedInvestments.length} investments from direct array`);
      }

      setPhaseInvestments(prev => ({
        ...prev,
        [phaseId]: processedInvestments
      }));

      console.log(`Loaded ${processedInvestments.length} investments for phase ${phaseId}`);
      console.log("Investment data after processing:", processedInvestments);

      // Log pagination info if available
      if (paginationInfo) {
        console.log("Pagination info:", paginationInfo);
      }
    } catch (err) {
      console.error(`Error fetching investments for phase ${phaseId}:`, err);
      setPhaseInvestments(prev => ({
        ...prev,
        [phaseId]: []
      }));
    } finally {
      setLoadingInvestments(false);
    }
  };

  const togglePhaseInvestments = (phaseId) => {
    if (expandedPhase === phaseId) {
      setExpandedPhase(null);
    } else {
      setExpandedPhase(phaseId);
      // Fetch investments if we haven't already
      if (!phaseInvestments[phaseId]) {
        fetchPhaseInvestments(phaseId);
      }
    }
  };

  const addPhase = async () => {
    console.log("addPhase function called", {
      currentPhase,
      projectId,
      formDataTargetAmount: formData?.totalTargetAmount,
      projectTotalTargetAmount: formData?.basicInfo?.totalTargetAmount
    });

    if (!currentPhase.fundingGoal || !currentPhase.startDate) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate minimum duration
    if (parseInt(currentPhase.duration) < 14) {
      setError('Phase duration must be at least 14 days');
      return;
    }

    const startDate = new Date(currentPhase.startDate);

    // Calculate minimum start date based on existing phases
    const minStartDate = new Date(calculateMinStartDate());

    if (startDate < minStartDate) {
      const formattedDate = minStartDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      setError(`Start date must be at least ${formattedDate} (7 days after the previous phase ends)`);
      return;
    }

    let targetAmount = parseFloat(
      formData?.totalTargetAmount ||
      formData?.basicInfo?.totalTargetAmount ||
      0
    );

    if ((isNaN(targetAmount) || targetAmount <= 0) && projectId) {
      setLoading(true);
      try {
        const projectData = await fetchProjectData();
        if (projectData && projectData.totalTargetAmount) {
          targetAmount = parseFloat(projectData.totalTargetAmount);
          console.log("Retrieved target amount from server:", targetAmount);
        } else {
          setError('Could not retrieve project target amount from server.');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching project target amount:', err);
        setError('Failed to retrieve project target amount. Please try again.');
        setLoading(false);
        return;
      }
    }

    if (isNaN(targetAmount) || targetAmount <= 0) {
      setError('Invalid project target amount. Please ensure you have set a valid target amount in Basic Information.');
      return;
    }

    console.log("Using target amount:", targetAmount);

    // Get the current total of existing phases
    const existingPhasesTotal = form.phases.reduce((total, phase) => {
      return total + parseFloat(phase.fundingGoal || 0);
    }, 0);

    // Add the new phase's goal
    const newPhaseAmount = parseFloat(currentPhase.fundingGoal || 0);
    const newTotal = existingPhasesTotal + newPhaseAmount;

    // Check if the new total exceeds the project target
    if (newTotal > targetAmount) {
      setError(`Adding this phase would exceed the project's target amount of ${formatCurrency(targetAmount.toFixed(2))}`);
      return;
    }

    // Check if the new total would match the target amount exactly if this is the last phase
    const isLastPhase = newTotal === targetAmount;
    if (!isLastPhase && form.phases.length === 0) {
      // If this is the first phase but won't meet the total, warn the user
      if (!confirm(`This phase only accounts for ${formatCurrency(newTotal)} of your ${formatCurrency(targetAmount)} target. You'll need to add more phases to reach your goal. Continue?`)) {
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const newPhase = {
        ...currentPhase,
        id: currentPhase.id || Date.now().toString(),
        fundingGoal: currentPhase.fundingGoal ? String(currentPhase.fundingGoal) : '0',
      };

      // If we have a projectId, save to API
      if (projectId) {
        console.log("Attempting to create phase for project ID:", projectId);

        // Map to API expected format
        const apiPhaseData = {
          targetAmount: parseFloat(newPhase.fundingGoal),
          startDate: newPhase.startDate,
          endDate: newPhase.endDate
        };

        console.log("Sending phase data to API:", apiPhaseData);

        try {
          // Send to API
          await projectService.createProjectPhase(projectId, apiPhaseData);
          setSuccess('Funding phase added successfully!');
          await fetchProjectPhases();
        } catch (apiError) {
          console.error('API Error when adding phase:', apiError);

          // Handle nested error object
          if (apiError.message && typeof apiError.message === 'string') {
            try {
              const errorObj = JSON.parse(apiError.message);
              if (errorObj && typeof errorObj === 'object') {
                const formattedError = Object.entries(errorObj)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ');
                setError(`Failed to add funding phase: ${formattedError}`);
              } else {
                setError(`Failed to add funding phase: ${apiError.message}`);
              }
            } catch (parseError) {
              setError(`Failed to add funding phase: ${apiError.message}`);
            }
          } else if (apiError.error && typeof apiError.error === 'object') {
            const formattedError = Object.entries(apiError.error)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');
            setError(`Failed to add funding phase: ${formattedError}`);
          } else {
            // Fallback error message
            setError('Failed to add funding phase: Unknown error');
          }
          return;
        }
      } else {

        const updatedForm = {
          ...form,
          phases: [...(form.phases || []), newPhase]
        };

        setForm(updatedForm);
        updateFormData(updatedForm);
      }

      setCurrentPhase({
        fundingGoal: '',
        duration: 30,
        startDate: '',
        endDate: '',
      });

      setShowPhaseForm(false);
    } catch (err) {
      console.error('Error adding phase:', err);

      let errorMessage = 'Failed to add funding phase';

      if (err.message) {
        if (typeof err.message === 'string') {
          try {
            const errorObj = JSON.parse(err.message);
            if (errorObj && typeof errorObj === 'object') {
              errorMessage += ': ' + Object.entries(errorObj)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            } else {
              errorMessage += ': ' + err.message;
            }
          } catch (parseError) {
            errorMessage += ': ' + err.message;
          }
        } else if (typeof err.message === 'object') {
          errorMessage += ': ' + JSON.stringify(err.message);
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updatePhase = async () => {
    if (!currentPhase.fundingGoal || !currentPhase.startDate) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate minimum duration
    if (parseInt(currentPhase.duration) < 14) {
      setError('Phase duration must be at least 14 days');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Find the phase index in the array
      const phaseIndex = form.phases.findIndex(phase => phase.id === currentPhase.id);
      if (phaseIndex === -1) {
        setError('Phase not found');
        return;
      }

      // Update the phase in the local array
      const updatedPhases = [...form.phases];
      updatedPhases[phaseIndex] = {
        ...updatedPhases[phaseIndex],
        fundingGoal: currentPhase.fundingGoal,
        duration: currentPhase.duration,
        startDate: currentPhase.startDate,
        endDate: currentPhase.endDate
      };

      if (projectId && editingPhase?.savedToServer) {
        console.log("Attempting to update phase for project ID:", projectId);

        // Map to API expected format
        const apiPhaseData = {
          id: currentPhase.id,
          targetAmount: parseFloat(currentPhase.fundingGoal),
          startDate: currentPhase.startDate,
          endDate: currentPhase.endDate
        };

        console.log("Sending updated phase data to API:", apiPhaseData);

        // Send to API
        await projectService.updateProjectPhase(currentPhase.id, apiPhaseData);
        setSuccess('Funding phase updated successfully!');
        await fetchProjectPhases();
      } else {
        const updatedForm = {
          ...form,
          phases: updatedPhases
        };

        setForm(updatedForm);
        updateFormData(updatedForm);
        setSuccess('Funding phase updated!');
      }

      // Reset and close form
      setShowPhaseForm(false);
      setIsEditing(false);
      setEditingPhase(null);
      setCurrentPhase({
        fundingGoal: '',
        duration: 14,
        startDate: '',
        endDate: '',
      });
    } catch (err) {
      console.error('Error updating phase:', err);

      let errorMessage = 'Failed to update funding phase';

      if (err.message) {
        if (typeof err.message === 'string') {
          try {
            const errorObj = JSON.parse(err.message);
            if (errorObj && typeof errorObj === 'object') {
              errorMessage += ': ' + Object.entries(errorObj)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            } else {
              errorMessage += ': ' + err.message;
            }
          } catch (parseError) {
            errorMessage += ': ' + err.message;
          }
        } else if (typeof err.message === 'object') {
          errorMessage += ': ' + JSON.stringify(err.message);
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Updated removePhase function
  const removePhase = async (phaseId) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Find the phase to remove
      const phaseToRemove = form.phases.find(phase => phase.id === phaseId);
      if (!phaseToRemove) {
        setError('Phase not found');
        setLoading(false);
        return;
      }

      // Calculate what the total will be after removal
      const remainingPhases = form.phases.filter(phase => phase.id !== phaseId);
      const remainingTotal = remainingPhases.reduce((total, phase) => {
        return total + parseFloat(phase.fundingGoal || 0);
      }, 0);

      // Warn if removing this phase will make it impossible to reach the target
      if (remainingPhases.length > 0 && parseFloat(formData?.totalTargetAmount || 0) - remainingTotal > 0) {
        if (!confirm(`After removing this phase, your phases will total ${formatCurrency(remainingTotal)}, which is less than your target of ${formatCurrency(formData?.totalTargetAmount || 0)}. Continue?`)) {
          setLoading(false);
          return;
        }
      }

      const updatedForm = {
        ...form,
        phases: remainingPhases
      };

      setForm(updatedForm);

      if (typeof updateFormData === 'function') {
        updateFormData(updatedForm);
      }
      setSuccess('Phase removing...');

      if (projectId && phaseToRemove?.savedToServer) {
        console.log("Attempting to delete phase with ID:", phaseId);

        // Delete using API
        await projectService.deleteProjectPhase(phaseId);
        setSuccess('Phase removed successfully');

        // Refetch to update the list
        await fetchProjectPhases();
      } else {
        // Only use local state if no projectId or phase isn't saved to server
        const updatedForm = {
          ...form,
          phases: remainingPhases
        };

        setForm(updatedForm);
        updateFormData(updatedForm);
      }
    } catch (err) {
      console.error('Error removing phase:', err);
      setError('Failed to remove funding phase: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const editPhase = (phase) => {
    setEditingPhase(phase);
    setCurrentPhase({
      id: phase.id,
      fundingGoal: phase.fundingGoal,
      duration: phase.duration,
      startDate: phase.startDate,
      endDate: phase.endDate,
      phaseNumber: phase.phaseNumber,
      status: phase.status
    });
    setIsEditing(true);
    setShowPhaseForm(true);
  };

  const calculateTotalFunding = () => {
    if (!form.phases || form.phases.length === 0) return 0;
    return form.phases.reduce((total, phase) => {
      const fundingGoal = parseFloat(phase.fundingGoal || 0);
      return total + (isNaN(fundingGoal) ? 0 : fundingGoal);
    }, 0);
  };

  const calculateProjectDuration = () => {
    if (!form.phases || form.phases.length === 0) return 0;
    return form.phases.reduce((total, phase) => {
      const duration = parseInt(phase.duration || 0);
      return total + (isNaN(duration) ? 0 : duration);
    }, 0);
  };

  const formatCurrency = (value) => {
    const numValue = parseFloat(value);
    return isNaN(numValue) ? '$0.00' : `$${numValue.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';

      // Parse the date (handles both string format and array format)
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid date';

      // Format the date as YYYY-MM-DD to avoid locale-specific issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;

    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
  };

  const handleUploadSuccess = (documentId, documentUrl) => {
    setSuccess(`Document uploaded successfully! Document ID: ${documentId}`);
    setTimeout(() => {
      setShowDocumentModal(false);
    }, 2000);
  };

  const openDocumentModal = (phase) => {
    if (isEditPage && phase.status === 'COMPLETED') {
      setSelectedPhase(phase);
      setShowDocumentModal(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Display any errors */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Display phase rule errors */}
      {phaseRuleError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{phaseRuleError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Display success message */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Display phase rules information */}
      {!isEditPage && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Multi-Phase Fundraising</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Break your project into multiple funding phases. Each phase can have its own funding goal and timeline.</p>

                {loadingPhaseRule ? (
                  <div className="mt-2 flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading phase requirements...</span>
                  </div>
                ) : phaseRule ? (
                  <div className="mt-2 p-2 bg-white rounded-md border border-blue-200">
                    <p className="font-semibold text-blue-800">Phase Requirements:</p>
                    <p>For projects with a total target amount of ${phaseRule.minTotal.toLocaleString()} or more, you need to create <span className="font-bold">{phaseRule.totalPhaseCount} phases</span>.</p>

                    {(form.phases?.length || 0) < phaseRule.totalPhaseCount && (
                      <p className="mt-1 text-yellow-700 font-medium">
                        You need to create {phaseRule.totalPhaseCount - (form.phases?.length || 0)} more phase(s).
                      </p>
                    )}

                    {(form.phases?.length || 0) >= phaseRule.totalPhaseCount && (
                      <p className="mt-1 text-green-700 font-medium">
                        ✓ You&apos;ve met the minimum phase requirement.
                      </p>
                    )}
                  </div>
                ) : formData?.totalTargetAmount ? (
                  <p className="mt-2">No specific phase requirements for this project size.</p>
                ) : (
                  <p className="mt-2">Please set a total target amount in the Basic Information section to see phase requirements.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Phases Overview */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-gray-900">Project Phases</h2>
          {form.phases && form.phases.length > 0 && (
            <div className="text-sm text-gray-500">
              <span className="font-medium">Total Funding Goal:</span> {formatCurrency(calculateTotalFunding())} |&nbsp;
              <span className="font-medium">Total Duration:</span> {calculateProjectDuration()} days
            </div>
          )}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center py-4">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
          </div>
        )}

        {(!form.phases || form.phases.length === 0) && !loading && (
          <div className="text-center py-4 bg-gray-50 rounded-md border border-dashed border-gray-300">
            <p className="text-sm text-gray-500">
              No funding phases added yet. Add at least one phase to continue.
            </p>
          </div>
        )}

        {form.phases && form.phases.length > 0 && (
          <div className="space-y-4">
            {form.phases.map((phase, index) => (
              <div
                key={phase.id || index}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                      Phase {phase.phaseNumber || index + 1}
                    </span>
                    {phase.status && (
                      <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${phase.status === 'PLAN' ? 'bg-yellow-100 text-yellow-800' :
                        phase.status === 'PROCESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                        {phase.status}
                      </span>
                    )}
                    {phase.savedToServer && (
                      <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                        Saved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center">
                    {isEditPage && (
                      <a
                        href={`/founder-investments?projectId=${projectId}`}
                        className="text-blue-600 hover:text-blue-900 text-sm mr-4"
                      >
                        View All Investments
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => editPhase(phase)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-900 text-sm mr-3 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhase(phase.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Funding Goal:</span>
                    <span className="ml-2 text-gray-900 font-medium">{formatCurrency(phase.fundingGoal)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-2 text-gray-900 font-medium">{phase.duration || 0} days</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Start Date:</span>
                    <span className="ml-2 text-gray-900 font-medium">{formatDate(phase.startDate)}</span>
                  </div>
                  {phase.endDate && (
                    <div className="col-span-2">
                      <span className="text-gray-500">End Date:</span>
                      <span className="ml-2 text-gray-900 font-medium">{formatDate(phase.endDate)}</span>
                    </div>
                  )}
                </div>
                {isEditPage && typeof phase.raiseAmount !== 'undefined' && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-xs text-gray-700">Funding Progress</div>
                      <div className="text-xs font-medium text-gray-900">
                        {formatCurrency(phase.raiseAmount || 0)} / {formatCurrency(phase.targetAmount || phase.fundingGoal || 0)}
                        {phase.totalInvestors > 0 && (
                          <span className="ml-2 text-gray-500">({phase.totalInvestors} investor{phase.totalInvestors !== 1 ? 's' : ''})</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${phase.status === 'COMPLETED' ? 'bg-green-600' :
                          phase.status === 'PROCESS' ? 'bg-blue-600' : 'bg-yellow-400'
                          }`}
                        style={{
                          width: `${Math.min(100, ((phase.raiseAmount || 0) / (phase.targetAmount || phase.fundingGoal || 1)) * 100)}%`
                        }}
                      ></div>
                    </div>
                    {((phase.raiseAmount || 0) > 0) && (
                      <div className="text-xs mt-1 text-right text-gray-500">
                        {Math.round(((phase.raiseAmount || 0) / (phase.targetAmount || phase.fundingGoal || 1)) * 100)}% funded
                      </div>
                    )}
                  </div>
                )}

                {/* Investments section - new code */}
                {isEditPage && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center">
                      {isEditPage && phase.status === 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => openDocumentModal(phase)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Upload Documents
                        </button>
                      )}

                      {/* Investment toggle button */}
                      <button
                        type="button"
                        onClick={() => togglePhaseInvestments(phase.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md shadow-sm text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 mr-1 transition-transform ${expandedPhase === phase.id ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {expandedPhase === phase.id ? 'Hide Investments' : 'View Investments'}
                      </button>
                    </div>

                    {/* Investments accordion content */}
                    {expandedPhase === phase.id && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Phase Investments</h4>
                        <InvestmentTable
                          phaseId={phase.id}
                          investments={phaseInvestments[phase.id] || []}
                          loading={loadingInvestments}
                          formatCurrency={formatCurrency}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!showPhaseForm ? (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowPhaseForm(true)}
              disabled={loading || readOnly}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Funding Phase
            </button>
          </div>
        ) : (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              {isEditing ? 'Edit Funding Phase' : 'Add New Funding Phase'}
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="phaseFundingGoal" className="block text-sm font-medium text-gray-700">
                  Phase Funding Goal *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="phaseFundingGoal"
                    name="fundingGoal"
                    value={currentPhase.fundingGoal}
                    onChange={handlePhaseChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    required
                    min="1"
                    step="0.01"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">USD</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="phaseDuration" className="block text-sm font-medium text-gray-700">
                    Phase Duration (days) *
                  </label>
                  <input
                    type="number"
                    id="phaseDuration"
                    name="duration"
                    value={currentPhase.duration}
                    onChange={handlePhaseChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    min="14"
                    max="90"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Phase duration must be at least 14 days
                  </p>
                </div>

                <div>
                  <label htmlFor="phaseStartDate" className="block text-sm font-medium text-gray-700">
                    Phase Start Date * <span className="text-xs text-gray-500">(Must be at least 7 days in the future)</span>
                  </label>
                  <input
                    type="date"
                    id="phaseStartDate"
                    name="startDate"
                    value={currentPhase.startDate}
                    onChange={handlePhaseChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    min={calculateMinStartDate()}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {form.phases && form.phases.length > 0
                      ? "Start date must be at least 7 days after the previous phase ends"
                      : "Start date must be at least 7 days from today"}
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="phaseEndDate" className="block text-sm font-medium text-gray-700">
                  Estimated End Date
                </label>
                <input
                  type="date"
                  id="phaseEndDate"
                  name="endDate"
                  value={currentPhase.endDate || ''}
                  disabled
                  className="mt-1 block w-full border border-gray-200 bg-gray-50 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Automatically calculated from start date and duration
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhaseForm(false);
                    setIsEditing(false);
                    setEditingPhase(null);
                    setCurrentPhase({
                      fundingGoal: '',
                      duration: 30,
                      startDate: '',
                      endDate: '',
                    });
                  }}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancel
                </button>

                {isEditing ? (
                  <button
                    type="button"
                    onClick={updatePhase}
                    disabled={loading || !currentPhase.fundingGoal || !currentPhase.startDate}
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Phase'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={addPhase}
                    disabled={loading || !currentPhase.fundingGoal || !currentPhase.startDate}
                    className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Adding...' : 'Add Phase'}
                  </button>
                )}
              </div>
            </div>
          </div>

        )}
        {/* Show ExtendTimeRequestForm only if the last phase is COMPLETED */}
        {/* {isEditPage && isLastPhaseCompleted && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Your project has successfully completed its fundraising phase. If you need more time to raise funds, you can request an extension below.
                  </p>
                </div>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Request Time Extension</h3>
            <ExtendTimeRequestForm projectId={projectId} />
          </div>
        )} */}
        {/* Document Upload Modal */}
        {showDocumentModal && selectedPhase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Upload Document for Phase {selectedPhase.phaseNumber || ""}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDocumentModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <PhaseUploadDocument
                  phaseId={selectedPhase.id}
                  onUploadSuccess={handleUploadSuccess}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}

// Updated prop type validation to include projectId
FundraisingInformation.propTypes = {
  formData: PropTypes.object,
  updateFormData: PropTypes.func.isRequired,
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isEditPage: PropTypes.bool,
  readOnly: PropTypes.bool,
};

// Default props
FundraisingInformation.defaultProps = {
  formData: {
    startDate: new Date().toISOString().split('T')[0],
    phases: []
  },
  projectId: null,
  isEditPage: false,
  readOnly: false
};