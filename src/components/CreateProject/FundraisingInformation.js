import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Fundraising information form for project creation with multi-phase support
 * @param {Object} props Component props
 * @param {Object} props.formData Initial form data
 * @param {Function} props.updateFormData Function to update parent form state
 * @returns {JSX.Element} Fundraising information form
 */
export default function FundraisingInformation({ formData, updateFormData }) {
  // Initialize with safe default values
  const [form, setForm] = useState({
    startDate: formData?.startDate || new Date().toISOString().split('T')[0],
    phases: Array.isArray(formData?.phases) ? [...formData.phases] : [],
    ...formData
  });
  
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [currentPhase, setCurrentPhase] = useState({
    name: '',
    description: '',
    fundingGoal: '',
    minimumFunding: '',
    duration: 30,
    startDate: '',
    endDate: '',
  });

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

  const addPhase = () => {
    if (currentPhase.name && currentPhase.fundingGoal && currentPhase.startDate) {
      const newPhase = { 
        ...currentPhase, 
        id: Date.now().toString(),
        fundingGoal: currentPhase.fundingGoal ? String(currentPhase.fundingGoal) : '0',
        minimumFunding: currentPhase.minimumFunding ? String(currentPhase.minimumFunding) : ''
      };
      
      const updatedForm = {
        ...form,
        phases: [...(form.phases || []), newPhase]
      };
      
      setForm(updatedForm);
      updateFormData(updatedForm);
      
      setCurrentPhase({
        name: '',
        description: '',
        fundingGoal: '',
        minimumFunding: '',
        duration: 30,
        startDate: '',
        endDate: '',
      });
      
      setShowPhaseForm(false);
    }
  };

  const removePhase = (phaseId) => {
    const updatedPhases = (form.phases || []).filter(phase => phase.id !== phaseId);
    const updatedForm = {
      ...form,
      phases: updatedPhases
    };
    
    setForm(updatedForm);
    updateFormData(updatedForm);
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
                Break your project into multiple funding phases. Each phase can have its own funding goal, timeline, and rewards. Projects are only funded if they reach or exceed their funding goal for each phase.
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

        {(!form.phases || form.phases.length === 0) && (
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
                  <div>
                    <div className="flex items-center">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">
                        Phase {index + 1}
                      </span>
                      <h3 className="text-md font-medium text-gray-900">{phase.name}</h3>
                    </div>
                    {phase.description && (
                      <p className="mt-1 text-sm text-gray-500">{phase.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhase(phase.id)}
                    className="text-red-600 hover:text-red-900 text-sm"
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
                    <span className="text-gray-500">Minimum Funding:</span>
                    <span className="ml-2 text-gray-900 font-medium">
                      {phase.minimumFunding ? formatCurrency(phase.minimumFunding) : 'Same as goal'}
                    </span>
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="phaseName" className="block text-sm font-medium text-gray-700">
                    Phase Name *
                  </label>
                  <input
                    type="text"
                    id="phaseName"
                    name="name"
                    value={currentPhase.name}
                    onChange={handlePhaseChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., Initial Development, Beta Launch"
                    required
                  />
                </div>
                
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
              </div>
              
              <div>
                <label htmlFor="phaseDescription" className="block text-sm font-medium text-gray-700">
                  Phase Description
                </label>
                <textarea
                  id="phaseDescription"
                  name="description"
                  rows={2}
                  value={currentPhase.description}
                  onChange={handlePhaseChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe what will be accomplished in this phase"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="phaseMinimumFunding" className="block text-sm font-medium text-gray-700">
                    Minimum Funding Required
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="phaseMinimumFunding"
                      name="minimumFunding"
                      value={currentPhase.minimumFunding}
                      onChange={handlePhaseChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">USD</span>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty if same as funding goal
                  </p>
                </div>

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
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPhaseForm(false)}
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addPhase}
                  disabled={!currentPhase.name || !currentPhase.fundingGoal || !currentPhase.startDate}
                  className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  Add Phase
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Funding Information</h3>
        
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Overall Campaign Start Date *
          </label>
          <input
            type="date"
            name="startDate"
            id="startDate"
            value={form.startDate || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            required
            min={new Date().toISOString().split('T')[0]}
          />
          <p className="mt-1 text-sm text-gray-500">
            Your campaign will go live at 12:00 AM UTC on this date after approval.
          </p>
        </div>
      </div>
    </div>
  );
}

// Add prop type validation
FundraisingInformation.propTypes = {
  formData: PropTypes.object,
  updateFormData: PropTypes.func.isRequired
};

// Default props
FundraisingInformation.defaultProps = {
  formData: {
    startDate: new Date().toISOString().split('T')[0],
    phases: []
  }
};