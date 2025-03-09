import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Reward information form for project creation
 * @param {Object} props Component props
 * @param {Array} props.formData Initial reward form data
 * @param {Function} props.updateFormData Function to update parent form state
 * @param {Object} props.projectData Project data containing phases
 * @returns {JSX.Element} Reward information form
 */
export default function RewardInformation({ formData, updateFormData, projectData }) {
    // Initialize with safe defaults
    const [rewards, setRewards] = useState(Array.isArray(formData) ? [...formData] : []);
    const [phases, setPhasesState] = useState([]);
    const [currentReward, setCurrentReward] = useState({
        title: '',
        description: '',
        amount: '',
        estimatedDelivery: '',
        shippingType: 'worldwide',
        items: [],
        limit: '',
        phaseId: '',
        phaseName: ''
    });
    const [showForm, setShowForm] = useState(false);
    const [currentItem, setCurrentItem] = useState('');
    const [showPhaseFilter, setShowPhaseFilter] = useState(false);
    const [selectedPhase, setSelectedPhase] = useState('all');

    // Fetch phases from the parent component's formData
    useEffect(() => {
        const getPhases = () => {
            try {
                // Try to get phases from projectData
                if (projectData && Array.isArray(projectData.phases) && projectData.phases.length > 0) {
                    // Map phases from the project data
                    const mappedPhases = projectData.phases.map(phase => ({
                        id: phase.id || `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: phase.name
                    }));
                    setPhasesState(mappedPhases);
                    return;
                }
                
                // Fallback to sample phases if no project phases available
                const samplePhases = [
                    { id: 'phase1', name: 'Initial Development' },
                    { id: 'phase2', name: 'Beta Testing' },
                    { id: 'phase3', name: 'Full Launch' }
                ];
                setPhasesState(samplePhases);
            } catch (error) {
                console.error('Error fetching phases:', error);
                // Set empty phases array as fallback
                setPhasesState([]);
            }
        };

        getPhases();
    }, [projectData]);

    const handleRewardChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'phaseId') {
            const selectedPhase = phases.find(phase => phase.id === value);
            const selectedPhaseName = selectedPhase ? selectedPhase.name : '';
            
            setCurrentReward(prev => ({
                ...prev,
                phaseId: value,
                phaseName: selectedPhaseName
            }));
        } else {
            setCurrentReward(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const addItem = () => {
        if (currentItem.trim()) {
            setCurrentReward(prev => ({
                ...prev,
                items: [...prev.items, currentItem.trim()]
            }));
            setCurrentItem('');
        }
    };

    const removeItem = (index) => {
        setCurrentReward(prev => {
            const newItems = [...prev.items];
            newItems.splice(index, 1);
            return {
                ...prev,
                items: newItems
            };
        });
    };

    const handleItemKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addItem();
        }
    };

    const saveReward = (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!currentReward.title || !currentReward.amount || !currentReward.description || 
            !currentReward.estimatedDelivery || !currentReward.phaseId) {
            alert('Please fill in all required fields');
            return;
        }
        
        const newReward = {
            ...currentReward,
            id: `reward-${Date.now()}`,
            // Convert amount to string to ensure consistent storage
            amount: String(currentReward.amount)
        };
        
        const newRewards = [...rewards, newReward];
        
        setRewards(newRewards);
        updateFormData(newRewards);
        
        // Reset form
        setCurrentReward({
            title: '',
            description: '',
            amount: '',
            estimatedDelivery: '',
            shippingType: 'worldwide',
            items: [],
            limit: '',
            phaseId: '',
            phaseName: ''
        });
        
        setShowForm(false);
    };

    const deleteReward = (id) => {
        const newRewards = rewards.filter(reward => reward.id !== id);
        setRewards(newRewards);
        updateFormData(newRewards);
    };

    // Handle filter dropdown outside clicks
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showPhaseFilter && !event.target.closest('[data-filter-menu]')) {
                setShowPhaseFilter(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPhaseFilter]);

    const filteredRewards = selectedPhase === 'all'
        ? rewards
        : rewards.filter(reward => reward.phaseId === selectedPhase);

    // Format currency for display
    const formatCurrency = (amount) => {
        const value = parseFloat(amount);
        return isNaN(value) ? '$0.00' : `$${value.toFixed(2)}`;
    };

    // Get a nice formatted date from YYYY-MM
    const formatDate = (dateString) => {
        try {
            const [year, month] = dateString.split('-');
            return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long'
            });
        } catch (error) {
            return dateString;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Phase-specific Rewards</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>
                                Create rewards for each phase of your project. Different phases can have unique reward tiers tailored to that stage of development.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {phases.length > 0 && (
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Project Rewards</h2>
                    <div className="relative" data-filter-menu>
                        <button
                            type="button"
                            onClick={() => setShowPhaseFilter(!showPhaseFilter)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="mr-2 -ml-0.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                            {selectedPhase === 'all' ? 'All Phases' : phases.find(p => p.id === selectedPhase)?.name || 'Filter by Phase'}
                        </button>

                        {showPhaseFilter && (
                            <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                    <button
                                        className={`block px-4 py-2 text-sm w-full text-left ${selectedPhase === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                                        onClick={() => {
                                            setSelectedPhase('all');
                                            setShowPhaseFilter(false);
                                        }}
                                    >
                                        All Phases
                                    </button>
                                    {phases.map(phase => (
                                        <button
                                            key={phase.id}
                                            className={`block px-4 py-2 text-sm w-full text-left ${selectedPhase === phase.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                                            onClick={() => {
                                                setSelectedPhase(phase.id);
                                                setShowPhaseFilter(false);
                                            }}
                                        >
                                            {phase.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {filteredRewards.map((reward) => (
                    <div key={reward.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">{reward.title}</h3>
                                {reward.phaseName && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                        {reward.phaseName}
                                    </span>
                                )}
                            </div>
                            <div className="text-lg font-bold text-green-600">{formatCurrency(reward.amount)}</div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{reward.description}</p>

                        {reward.items && reward.items.length > 0 && (
                            <div className="mt-3">
                                <h4 className="text-sm font-medium text-gray-700">Includes:</h4>
                                <ul className="mt-1 text-sm text-gray-600 list-disc list-inside">
                                    {reward.items.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-4 text-sm text-gray-500">
                            <div>Estimated delivery: {formatDate(reward.estimatedDelivery)}</div>
                            <div>Shipping: {reward.shippingType === 'worldwide' ? 'Ships worldwide' : 
                                  reward.shippingType === 'local' ? 'Local pickup only' :
                                  reward.shippingType === 'digital' ? 'Digital / No shipping required' : 
                                  'Restricted shipping'}</div>
                            {reward.limit && <div>Limited: {reward.limit} available</div>}
                        </div>

                        <button
                            type="button"
                            onClick={() => deleteReward(reward.id)}
                            className="mt-4 text-sm text-red-600 hover:text-red-800"
                        >
                            Remove reward
                        </button>
                    </div>
                ))}
            </div>

            {filteredRewards.length === 0 && !showForm && (
                <div className="text-center py-8 bg-gray-50 rounded-md border border-dashed border-gray-300">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 12H4M12 4v16m8-8H4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No rewards yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {selectedPhase !== 'all'
                            ? 'No rewards for this phase. Add your first reward for this phase.'
                            : 'Get started by creating your first reward.'}
                    </p>
                </div>
            )}

            {!showForm ? (
                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add New Reward
                    </button>
                </div>
            ) : (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Create New Reward</h3>
                    <form onSubmit={saveReward} className="mt-4 space-y-4">
                        <div>
                            <label htmlFor="phaseId" className="block text-sm font-medium text-gray-700">
                                Project Phase *
                            </label>
                            <select
                                id="phaseId"
                                name="phaseId"
                                value={currentReward.phaseId}
                                onChange={handleRewardChange}
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            >
                                <option value="">Select a phase</option>
                                {phases.map((phase) => (
                                    <option key={phase.id} value={phase.id}>{phase.name}</option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                                Select which phase this reward belongs to
                            </p>
                        </div>

                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                Reward Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                value={currentReward.title}
                                onChange={handleRewardChange}
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                                Pledge Amount ($) *
                            </label>
                            <input
                                type="number"
                                name="amount"
                                id="amount"
                                required
                                min="1"
                                step="0.01"
                                value={currentReward.amount}
                                onChange={handleRewardChange}
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                id="description"
                                required
                                rows={3}
                                value={currentReward.description}
                                onChange={handleRewardChange}
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label htmlFor="items" className="block text-sm font-medium text-gray-700">
                                Reward Items
                            </label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <input
                                    type="text"
                                    name="currentItem"
                                    id="items"
                                    value={currentItem}
                                    onChange={e => setCurrentItem(e.target.value)}
                                    onKeyDown={handleItemKeyDown}
                                    className="focus:ring-blue-500 focus:border-blue-500 flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                                    placeholder="Enter an item included in the reward"
                                />
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                                >
                                    Add
                                </button>
                            </div>

                            {currentReward.items.length > 0 && (
                                <div className="mt-2">
                                    <h4 className="text-sm font-medium text-gray-700">Items:</h4>
                                    <ul className="mt-1 space-y-1">
                                        {currentReward.items.map((item, index) => (
                                            <li key={index} className="flex justify-between items-center text-sm bg-gray-50 px-2 py-1 rounded">
                                                <span>{item}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    &times;
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="estimatedDelivery" className="block text-sm font-medium text-gray-700">
                                Estimated Delivery Date *
                            </label>
                            <input
                                type="month"
                                name="estimatedDelivery"
                                id="estimatedDelivery"
                                required
                                value={currentReward.estimatedDelivery}
                                onChange={handleRewardChange}
                                min={new Date().toISOString().slice(0, 7)}
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>

                        <div>
                            <label htmlFor="shippingType" className="block text-sm font-medium text-gray-700">
                                Shipping
                            </label>
                            <select
                                id="shippingType"
                                name="shippingType"
                                value={currentReward.shippingType}
                                onChange={handleRewardChange}
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="worldwide">Ships worldwide</option>
                                <option value="local">Local pickup only</option>
                                <option value="digital">Digital / No shipping required</option>
                                <option value="restricted">Restricted shipping</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="limit" className="block text-sm font-medium text-gray-700">
                                Reward Limit (optional)
                            </label>
                            <input
                                type="number"
                                name="limit"
                                id="limit"
                                min="1"
                                value={currentReward.limit}
                                onChange={handleRewardChange}
                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                placeholder="Leave empty for unlimited rewards"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                Setting a limit creates scarcity and can encourage backers to pledge quickly.
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Save Reward
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reward Strategy Tips</h3>

                <div className="bg-white p-4 border border-gray-200 rounded-md">
                    <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                        <li><span className="font-medium">Phase-specific rewards:</span> Tailor rewards to each development phase to give backers a reason to support your project at every stage.</li>
                        <li><span className="font-medium">Reward tiers:</span> Create a range of reward tiers starting from small amounts ($5-25) up to premium tiers.</li>
                        <li><span className="font-medium">Early-bird specials:</span> Consider offering limited early-bird rewards with special pricing to encourage early backing.</li>
                        <li><span className="font-medium">Digital + Physical:</span> Mix digital rewards (which have no shipping costs) with physical items for different backer preferences.</li>
                        <li><span className="font-medium">Limited edition rewards:</span> Create scarcity with limited quantities for premium reward tiers.</li>
                        <li><span className="font-medium">Phase progression:</span> Consider rewards that evolve or build upon each other as your project moves through phases.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

// Add prop type validation
RewardInformation.propTypes = {
    formData: PropTypes.array,
    updateFormData: PropTypes.func.isRequired,
    projectData: PropTypes.object
};

// Default props
RewardInformation.defaultProps = {
    formData: [],
    projectData: { phases: [] }
};