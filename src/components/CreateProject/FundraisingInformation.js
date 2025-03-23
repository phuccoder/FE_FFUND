import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import projectService from 'src/services/projectService';

export default function FundraisingInformation({ formData, updateFormData, projectId }) {
  // Initialize with safe default values
  const [form, setForm] = useState({
    startDate: formData?.startDate || new Date().toISOString().split('T')[0],
    phases: Array.isArray(formData?.phases) ? [...formData.phases] : [],
    ...formData
  });

  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [currentPhase, setCurrentPhase] = useState({
    fundingGoal: '',
    duration: 30,
    startDate: '',
    endDate: '',
  });

  // Add loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Add debugging logs
  useEffect(() => {
    console.log("Current form state:", form);
    console.log("Current phases:", form.phases);
  }, [form]);

  // Fetch project data if projectId is provided (edit mode)
  useEffect(() => {
    if (projectId) {
      console.log("FundraisingInformation: Attempting to fetch project data with ID:", projectId);
      fetchProjectPhases();
    } else {
      console.log("FundraisingInformation: No projectId provided, skipping data fetch");
    }
  }, [projectId]);

  // New dedicated method to fetch only funding phases
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
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            duration: calculateDuration(startDateFormatted, endDateFormatted),
            phaseNumber: phase.phaseNumber,
            status: phase.status,
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

      // Check if dates are valid
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };

  const handleBlur = () => {
    updateFormData(form);
  };

  const handlePhaseChange = (e) => {
    const { name, value } = e.target;
    setCurrentPhase(prevPhase => ({
      ...prevPhase,
      [name]: value
    }));

    // Calculate end date if start date and duration are set
    if (name === 'startDate' || name === 'duration') {
      if (currentPhase.startDate || (name === 'startDate' && value)) {
        const startDate = new Date(name === 'startDate' ? value : currentPhase.startDate);
        const durationDays = parseInt(name === 'duration' ? value : currentPhase.duration);

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

  const addPhase = async () => {
    console.log("addPhase function called", { currentPhase, projectId });

    if (!currentPhase.fundingGoal || !currentPhase.startDate) {
      setError('Please fill in all required fields');
      return;
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

        // Send to API
        await projectService.createProjectPhase(projectId, apiPhaseData);
        setSuccess('Funding phase added successfully!');

        // Refetch to get server-generated IDs
        await fetchProjectPhases();
      } else {
        // Only use local state if no projectId
        const updatedForm = {
          ...form,
          phases: [...(form.phases || []), newPhase]
        };

        setForm(updatedForm);
        updateFormData(updatedForm);
      }

      // Reset the form for a new phase
      setCurrentPhase({
        fundingGoal: '',
        duration: 30,
        startDate: '',
        endDate: '',
      });

      setShowPhaseForm(false);
    } catch (err) {
      console.error('Error adding phase:', err);
      setError('Failed to add funding phase: ' + (err.message || 'Unknown error'));
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

      // Find the phase to see if it's saved to the server
      const phaseToRemove = form.phases.find(phase => phase.id === phaseId);

      // If phase exists on server and we have a projectId, delete from API
      if (projectId && phaseToRemove?.savedToServer) {
        console.log("Attempting to delete phase with ID:", phaseId);

        // Delete using API
        await projectService.deleteProjectPhase(phaseId);
        setSuccess('Phase removed successfully');

        // Refetch to update the list
        await fetchProjectPhases();
      } else {
        // Only use local state if no projectId or phase isn't saved to server
        const updatedPhases = (form.phases || []).filter(phase => phase.id !== phaseId);
        const updatedForm = {
          ...form,
          phases: updatedPhases
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
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
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
              <p>
                Break your project into multiple funding phases. Each phase can have its own funding goal and timeline.
                {!projectId && " Complete the Basic Information section first to enable saving phases to the server."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Project Phases Overview */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Project Phases</h2>
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
                    {phase.savedToServer && (
                      <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                        Saved
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhase(phase.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-900 text-sm disabled:opacity-50"
                  >
                    Remove
                  </button>
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
              </div>
            ))}
          </div>
        )}

        {!showPhaseForm ? (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowPhaseForm(true)}
              disabled={loading}
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
            <h3 className="text-md font-medium text-gray-900 mb-4">Add New Funding Phase</h3>
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
                    min="1"
                    max="90"
                  />
                </div>

                <div>
                  <label htmlFor="phaseStartDate" className="block text-sm font-medium text-gray-700">
                    Phase Start Date *
                  </label>
                  <input
                    type="date"
                    id="phaseStartDate"
                    name="startDate"
                    value={currentPhase.startDate}
                    onChange={handlePhaseChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
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
                  onClick={() => setShowPhaseForm(false)}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addPhase}
                  disabled={loading || !currentPhase.fundingGoal || !currentPhase.startDate}
                  className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Phase'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Updated prop type validation to include projectId
FundraisingInformation.propTypes = {
  formData: PropTypes.object,
  updateFormData: PropTypes.func.isRequired,
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

// Default props
FundraisingInformation.defaultProps = {
  formData: {
    startDate: new Date().toISOString().split('T')[0],
    phases: []
  },
  projectId: null
};