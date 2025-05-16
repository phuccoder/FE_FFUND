import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { milestoneService } from 'src/services/milestoneService';
import { milestoneItemService } from 'src/services/milestoneItemService';
import { useAuth } from 'src/context/AuthContext';
import { globalSettingService } from 'src/services/globalSettingService';

/**
 * Reward information form for project creation with enhanced item management
 * @param {Object} props Component props
 * @param {Array} props.formData Initial reward form data
 * @param {Function} props.updateFormData Function to update parent form state
 * @param {Object} props.projectData Project data containing phases
 * @returns {JSX.Element} Reward information form
 */
export default function RewardInformation({ formData, updateFormData, projectData }) {
    // Auth context for detecting login/logout
    const { isAuthenticated } = useAuth();

    // Initialize with safe defaults
    const [rewards, setRewards] = useState(Array.isArray(formData) ? [...formData] : []);
    const [phases, setPhasesState] = useState([]);

    // Milestone management state
    const [milestones, setMilestones] = useState([]);
    const [currentMilestone, setCurrentMilestone] = useState({
        title: '',
        description: '',
        price: '',
        phaseId: '',
    });

    // Milestone item state
    const [currentMilestoneItem, setCurrentMilestoneItem] = useState({
        name: '',
        quantity: 1,
        image: null,
        imagePreview: null
    });

    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [showMilestoneForm, setShowMilestoneForm] = useState(false);
    const [showMilestoneItemForm, setShowMilestoneItemForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [milestoneMaxPercentage, setMilestoneMaxPercentage] = useState(0.2); // Default fallback
    const [loadingSettings, setLoadingSettings] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [currentItem, setCurrentItem] = useState({ name: '', image: null, imagePreview: null });
    const [showPhaseFilter, setShowPhaseFilter] = useState(false);
    const [selectedPhase, setSelectedPhase] = useState(null);
    const fileInputRef = useRef(null);
    const milestoneFileInputRef = useRef(null);
    const prevCompletionRef = useRef(null);

    // Fetch the milestone value percentage from global settings
    useEffect(() => {
        const fetchMilestoneValuePercentage = async () => {
            setLoadingSettings(true);
            try {
                const settings = await globalSettingService.getGlobalSettingByType('MILESTONE_VALUE_PERCENTAGE');

                console.log('Fetched milestone value percentage setting:', settings);

                if (settings && Array.isArray(settings.data) && settings.data.length > 0) {
                    const percentageSetting = settings.data[0];
                    const percentageValue = parseFloat(percentageSetting.value);

                    if (!isNaN(percentageValue)) {
                        console.log(`Setting milestone max percentage to ${percentageValue}`);
                        setMilestoneMaxPercentage(percentageValue);
                    }
                } else {
                    console.warn('No milestone value percentage setting found, using default of 0.2');
                }
            } catch (error) {
                console.error('Error fetching milestone value percentage:', error);
            } finally {
                setLoadingSettings(false);
            }
        };

        fetchMilestoneValuePercentage();
    }, []);

    // Fetch phases from the parent component's formData
    useEffect(() => {
        const getPhases = () => {
            try {
                // Try to get phases from projectData
                if (projectData && Array.isArray(projectData.phases) && projectData.phases.length > 0) {
                    // Map phases from the project data, handling both object formats
                    const mappedPhases = projectData.phases.map(phase => ({
                        id: phase.id || `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: phase.name || `Phase ${phase.phaseNumber || 'Unknown'}`,
                        fundingGoal: phase.targetAmount || phase.fundingGoal || 0,
                        phaseNumber: phase.phaseNumber || 1
                    }));

                    console.log("Mapped phases:", mappedPhases);
                    setPhasesState(mappedPhases);
                    return;
                }

                // Fallback to sample phases if no project phases available
                const samplePhases = [
                    { id: 'phase1', name: 'Initial Development', fundingGoal: 1000 },
                    { id: 'phase2', name: 'Beta Testing', fundingGoal: 2000 },
                    { id: 'phase3', name: 'Full Launch', fundingGoal: 3000 }
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

    useEffect(() => {
        if (phases.length > 0) {
            fetchMilestones();
        }
    }, [phases]);

    useEffect(() => {
        if (selectedPhase && phases.length > 0) {
            console.log(`Selected phase changed to: ${selectedPhase}`);

            // If you need to fetch milestone items for this specific phase:
            const phaseMilestones = milestones.filter(m => m.phaseId === selectedPhase);
            phaseMilestones.forEach(milestone => {
                if (milestone.id) {
                    fetchMilestoneItems(milestone.id);
                }
            });
        }
    }, [selectedPhase]);

    useEffect(() => {
        if (!phases || phases.length === 0 || !milestones || milestones.length === 0) return;

        // Group milestones by phase
        const milestonesByPhase = {};
        milestones.forEach(milestone => {
            if (!milestonesByPhase[milestone.phaseId]) {
                milestonesByPhase[milestone.phaseId] = [];
            }
            milestonesByPhase[milestone.phaseId].push(milestone);
        });

        // Validate each phase's milestones
        for (const phaseId in milestonesByPhase) {
            const phaseMilestones = milestonesByPhase[phaseId];
            const validation = validateMilestoneTotals(phaseMilestones, phaseId, phases);

            if (!validation.isValid) {
                setError(validation.message);
                return;
            }
        }

        // Clear the error if all phases are valid
        if (error && error.includes('Total of all milestones')) {
            setError(null);
        }
    }, [milestones, phases]);

    useEffect(() => {
        if (currentMilestone.phaseId && showMilestoneForm) {
            // Force a re-render to update the helper text with the latest data
            const phaseId = currentMilestone.phaseId;
            const phase = phases.find(p => p.id === phaseId || p.id === parseInt(phaseId));
            if (phase) {
                const phaseMilestones = milestones.filter(m => m.phaseId === phaseId);
                const totalAllocated = phaseMilestones.reduce(
                    (sum, m) => sum + parseFloat(m.price || 0), 0
                );
                // This is just to force a re-render with updated calculations
                console.log(`Phase ${phaseId} has ${phaseMilestones.length} milestones totaling ${totalAllocated}`);
            }
        }
    }, [currentMilestone.phaseId, milestones, showMilestoneForm]);

    useEffect(() => {
        // Skip calculation if no updateFormData function is provided
        if (typeof updateFormData !== 'function') return;

        const calculateRewardCompletion = () => {
            const rewards = formData || [];
            const phasesList = phases || [];

            // If no rewards or phases, return 0%
            if (!rewards.length || !phasesList.length) return 0;

            // Get unique phase IDs
            const phaseIds = phasesList
                .filter(phase => phase && phase.id)
                .map(phase => phase.id);

            if (phaseIds.length === 0) return 0;

            // Get unique phases that have rewards
            const phasesWithRewards = new Set(
                rewards
                    .filter(reward => reward && reward.phaseId)
                    .map(reward => reward.phaseId)
            );

            // Calculate phase coverage percentage
            const phasesCovered = phaseIds.filter(id => phasesWithRewards.has(id)).length;
            const phaseCoverage = phaseIds.length > 0 ? phasesCovered / phaseIds.length : 0;

            // Calculate reward completeness (80% for phase coverage)
            let percentage = Math.round(phaseCoverage * 80);

            // Check if rewards have full details
            const completeRewards = rewards.filter(reward =>
                reward && reward.title && reward.description && reward.amount && reward.phaseId
            ).length;

            // Check for rewards with items
            const rewardsWithItems = rewards.filter(reward =>
                reward && reward.items && Array.isArray(reward.items) && reward.items.length > 0
            ).length;

            // Add up to 20% bonus for quality
            const qualityBonus = Math.min(20, Math.round((rewardsWithItems / Math.max(1, rewards.length)) * 20));

            // Final percentage capped at 100%
            return Math.min(100, percentage + qualityBonus);
        };

        // Calculate current percentage
        const completionPercentage = calculateRewardCompletion();
        if (prevCompletionRef.current !== completionPercentage) {
            prevCompletionRef.current = completionPercentage;

            // Create a new array from formData (if it's an array) with the completion percentage
            if (Array.isArray(formData)) {
                const updatedFormData = [...formData];
                updatedFormData._completionPercentage = completionPercentage;
                updateFormData(updatedFormData);
            } else {
                const updatedFormData = [];
                updatedFormData._completionPercentage = completionPercentage;
                updateFormData(updatedFormData);
            }
        }
    }, [formData, phases]);

    // Fetch milestones for all phases
    const fetchMilestones = async () => {
        setLoading(true);
        setError(null);
        try {
            const allMilestones = [];

            for (const phase of phases) {
                try {
                    const response = await milestoneService.getMilestonesByPhaseId(phase.id);
                    console.log("API Response for phase", phase.id, ":", response);

                    let phaseMilestones = [];

                    if (response && response.status === 200 && Array.isArray(response.data)) {
                        phaseMilestones = response.data;
                    } else if (response && response.data && Array.isArray(response.data)) {
                        phaseMilestones = response.data;
                    } else if (Array.isArray(response)) {
                        phaseMilestones = response;
                    }

                    if (phaseMilestones.length > 0) {
                        phaseMilestones = phaseMilestones.map(milestone => ({
                            ...milestone,
                            phaseName: phase.name,
                            phaseId: phase.id
                        }));
                        allMilestones.push(...phaseMilestones);
                    }
                } catch (err) {
                    console.warn(`Error fetching milestones for phase ${phase.id}:`, err);
                }
            }
            console.log("Final milestones to display:", allMilestones);
            setMilestones(allMilestones);
        } catch (error) {
            console.error('Error fetching milestones:', error);
            setError('Failed to load milestones. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only update parent formData when milestones have been loaded
        if (milestones.length > 0) {
            // Format milestones to match rewardInfo structure
            const formattedRewards = milestones.map(milestone => ({
                id: milestone.id,
                title: milestone.title,
                description: milestone.description || '',
                amount: milestone.price || '0',
                phaseId: milestone.phaseId,
                estimatedDelivery: milestone.estimatedDelivery || new Date().toISOString().split('T')[0],
                items: milestone.items || []
            }));

            // Update parent component state
            updateFormData(formattedRewards);
        }
    }, [milestones]);

    // Fetch items for a specific milestone
    const fetchMilestoneItems = async (milestoneId) => {
        try {
            setLoading(true);
            const response = await milestoneService.getMilestoneById(milestoneId);
            console.log(`Fetched milestone ${milestoneId} details:`, response);

            // If the milestone details include items
            if (response) {
                let updatedItems = [];

                // Extract items based on API response format
                if (response.items && Array.isArray(response.items)) {
                    updatedItems = response.items;
                } else if (response.data && response.data.items && Array.isArray(response.data.items)) {
                    updatedItems = response.data.items;
                }

                // Log the extracted items for debugging
                console.log(`Extracted ${updatedItems.length} items for milestone ${milestoneId}:`, updatedItems);

                // Update the milestone in our state with the items
                setMilestones(prevMilestones =>
                    prevMilestones.map(m =>
                        m.id === milestoneId ? { ...m, items: updatedItems } : m
                    )
                );
            }

            return response;
        } catch (error) {
            console.error(`Error fetching items for milestone ${milestoneId}:`, error);
            setError(`Failed to load items for milestone. Please try again.`);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const validateMilestoneTotals = (milestones, phaseId, phases) => {
        if (!milestones || milestones.length === 0) return { isValid: true }; // No milestones is valid initially

        // Find the target phase
        const phase = phases.find(p => p.id === phaseId);
        if (!phase) return { isValid: true }; // Can't validate if phase not found

        // Get phase funding goal
        const phaseFundingGoal = parseFloat(phase.fundingGoal || 0);

        // Calculate total milestone amounts for this phase
        const phaseMilestones = milestones.filter(m => m.phaseId === phaseId);
        const totalMilestoneAmount = phaseMilestones.reduce((total, milestone) => {
            return total + parseFloat(milestone.price || 0);
        }, 0);

        // Round to 2 decimal places to avoid floating point comparison issues
        const phaseGoal = phaseFundingGoal.toFixed(2);
        const milestonesTotal = totalMilestoneAmount.toFixed(2);

        if (milestonesTotal !== phaseGoal) {
            return {
                isValid: false,
                message: `Total of all milestones (${formatCurrency(milestonesTotal)}) 
                      must equal the phase funding goal (${formatCurrency(phaseGoal)})`
            };
        }

        return { isValid: true };
    };

    const isMilestoneEditable = (milestone) => {

        if (!milestone || !milestone.phaseId) return false;

        // Find the phase this milestone belongs to
        const phase = projectData.phases.find(p =>
            p.id === milestone.phaseId ||
            p.id === parseInt(milestone.phaseId)
        );

        // Only allow editing if the phase status is PLAN
        return phase && phase.status === 'PLAN';
    };

    const isPhaseEditable = (phaseId) => {
        if (!phaseId) return false;

        const phase = projectData.phases.find(p =>
            p.id === phaseId ||
            p.id === parseInt(phaseId)
        );

        return phase && phase.status === 'PLAN';
    };

    const validateMilestoneAmount = (price, phaseId) => {
        // Find the target phase
        const targetPhase = projectData.phases.find(p =>
            p.id === phaseId || p.id === parseInt(phaseId)
        );

        if (!targetPhase) {
            return {
                isValid: false,
                message: 'Selected phase not found'
            };
        }

        const phaseGoal = parseFloat(targetPhase.fundingGoal || targetPhase.targetAmount || 0);
        const milestonePrice = parseFloat(price || 0);

        // Calculate maximum allowed (using the dynamic percentage from global settings)
        const maxAllowed = phaseGoal * milestoneMaxPercentage;

        if (milestonePrice > maxAllowed) {
            return {
                isValid: false,
                message: `A single milestone cannot exceed ${(milestoneMaxPercentage * 100).toFixed(0)}% (${formatCurrency(maxAllowed)}) of the phase's total funding goal (${formatCurrency(phaseGoal)})`
            };
        }

        return { isValid: true };
    };

    // Add a new milestone
    const addMilestone = async () => {
        if (!currentMilestone.title || !currentMilestone.phaseId) {
            setError('Please provide at least a title and select a phase.');
            return;
        }

        // Validate amount doesn't exceed 20% of phase goal
        const amountValidation = validateMilestoneAmount(currentMilestone.price, currentMilestone.phaseId);
        if (!amountValidation.isValid) {
            setError(amountValidation.message);
            return;
        }

        // Existing milestone validation code...
        const phaseMilestones = milestones.filter(m => m.phaseId === currentMilestone.phaseId);
        const existingMilestonesTotal = phaseMilestones.reduce((total, m) => {
            return total + parseFloat(m.price || 0);
        }, 0);

        // Find the target phase
        const targetPhase = projectData.phases.find(p =>
            p.id === currentMilestone.phaseId ||
            p.id === parseInt(currentMilestone.phaseId)
        );

        if (!targetPhase) {
            console.error('Unable to find phase with ID:', currentMilestone.phaseId);
            console.log('Available phases:', projectData.phases);
            setError('Selected phase not found. Please try selecting the phase again.');
            return;
        }
        const phaseGoal = parseFloat(targetPhase.fundingGoal || targetPhase.targetAmount || 0);
        const newMilestonePrice = parseFloat(currentMilestone.price || 0);
        const newTotal = existingMilestonesTotal + newMilestonePrice;

        // Check if adding this milestone would exceed the phase goal
        if (newTotal > phaseGoal) {
            setError(`Adding this milestone would exceed the phase's funding goal of ${formatCurrency(phaseGoal)}`);
            return;
        }

        // Check if adding this milestone would complete the phase goal
        const remaining = phaseGoal - newTotal;
        if (Math.abs(remaining) > 0.01 && !confirm(`After adding this milestone, you will still need to allocate ${formatCurrency(remaining)} to meet this phase's funding goal. Continue?`)) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await milestoneService.createMilestoneForPhase(
                currentMilestone.phaseId,
                {
                    title: currentMilestone.title,
                    description: currentMilestone.description,
                    price: currentMilestone.price,
                }
            );

            const newMilestone = {
                id: response?.data?.id || response?.id || Date.now().toString(),
                title: currentMilestone.title,
                description: currentMilestone.description,
                price: currentMilestone.price,
                phaseId: currentMilestone.phaseId,
                phaseName: phases.find(p => p.id === currentMilestone.phaseId)?.name || '',
                items: []
            };

            setMilestones(prev => [...prev, newMilestone]);
            setSuccess('Milestone created successfully!');

            // Reset form
            setCurrentMilestone({
                title: '',
                description: '',
                price: '',
                phaseId: '',
            });

            setShowMilestoneForm(false);

            // Also refresh from server to ensure everything is in sync
            await fetchMilestones();
        } catch (error) {
            console.error('Error creating milestone:', error);
            setError('Failed to create milestone. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Update an existing milestone
    const updateMilestone = async (milestoneId, updatedData) => {
        setLoading(true);
        setError(null);

        try {
            // Validate amount doesn't exceed 20% of phase goal
            const amountValidation = validateMilestoneAmount(updatedData.price, updatedData.phaseId || currentMilestone.phaseId);
            if (!amountValidation.isValid) {
                setError(amountValidation.message);
                setLoading(false);
                return;
            }

            // Find the current milestone to get its phase ID and current price
            const currentMilestone = milestones.find(m => m.id === milestoneId);
            if (!currentMilestone) {
                setError('Milestone not found');
                setLoading(false);
                return;
            }

            const { phaseId } = currentMilestone;
            const currentPrice = parseFloat(currentMilestone.price || 0);

            // Calculate the total of other milestones in this phase
            const otherMilestones = milestones.filter(m => m.phaseId === phaseId && m.id !== milestoneId);
            const otherMilestonesTotal = otherMilestones.reduce((total, m) =>
                total + parseFloat(m.price || 0), 0);

            // Find the target phase
            const targetPhase = projectData.phases.find(p =>
                p.id === phaseId ||
                p.id === parseInt(phaseId)
            );

            if (!targetPhase) {
                console.error('Phase not found with ID:', phaseId);
                console.log('Available phases:', projectData.phases);
                setError('Phase not found. The phase structure may have changed.');
                setLoading(false);
                return;
            }

            // Get the new price from updated data
            const newPrice = parseFloat(updatedData.price || 0);

            // Calculate new total
            const newTotal = otherMilestonesTotal + newPrice;
            const phaseGoal = parseFloat(targetPhase.fundingGoal || targetPhase.targetAmount || 0);

            // Validate if the new total would exceed phase goal
            if (newTotal > phaseGoal) {
                setError(`Updating this milestone would exceed the phase's funding goal of ${formatCurrency(phaseGoal)}`);
                setLoading(false);
                return;
            }

            // Check if updating this milestone would leave a gap in funding
            const remaining = phaseGoal - newTotal;
            if (Math.abs(remaining) > 0.01 && !confirm(`After updating this milestone, you will still need to allocate ${formatCurrency(remaining)} to meet this phase's funding goal. Continue?`)) {
                setLoading(false);
                return;
            }

            // Create a copy of updatedData without the phaseId
            const dataToUpdate = { ...updatedData };
            delete dataToUpdate.phaseId;

            // Call API with the filtered data
            await milestoneService.updateMilestone(milestoneId, dataToUpdate);
            setSuccess('Milestone updated successfully!');

            // Update in local state - keep the original phaseId in our local state
            setMilestones(prevMilestones =>
                prevMilestones.map(m =>
                    m.id === milestoneId ? { ...m, ...dataToUpdate, phaseId: m.phaseId } : m
                )
            );

            // After update, validate the current state of milestones for this phase
            setTimeout(() => {
                const updatedPhaseMilestones = milestones
                    .filter(m => m.phaseId === phaseId)
                    .map(m => m.id === milestoneId ? { ...m, price: newPrice } : m);

                const validation = validateMilestoneTotals(updatedPhaseMilestones, phaseId, [targetPhase]);
                if (!validation.isValid) {
                    setSuccess(null);
                    setError(validation.message);
                }
            }, 100);
        } catch (error) {
            console.error('Error updating milestone:', error);
            setError('Failed to update milestone. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Delete a milestone
    const deleteMilestone = async (milestoneId) => {
        if (!confirm('Are you sure you want to delete this milestone?')) {
            return;
        }

        // Find the milestone to be deleted
        const milestoneToDelete = milestones.find(m => m.id === milestoneId);
        if (!milestoneToDelete) {
            setError('Milestone not found');
            return;
        }

        // Find all milestones for the same phase
        const phaseId = milestoneToDelete.phaseId;
        const phaseMilestones = milestones.filter(m => m.phaseId === phaseId);

        // Calculate what the total would be after deletion
        const milestonePrice = parseFloat(milestoneToDelete.price || 0);
        const totalAfterDeletion = phaseMilestones.reduce((total, m) =>
            total + parseFloat(m.price || 0), 0) - milestonePrice;

        // Find the phase
        const targetPhase = projectData.phases.find(p => p.id === phaseId);

        if (!targetPhase) {
            setError('Phase not found for this milestone.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await milestoneService.deleteMilestone(milestoneId);
            setSuccess('Milestone deleted successfully!');

            setMilestones(prevMilestones =>
                prevMilestones.filter(m => m.id !== milestoneId)
            );
        } catch (error) {
            console.error('Error deleting milestone:', error);
            setError('Failed to delete milestone. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const debugImageFile = (file) => {
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.group('Image File Debug');
        console.log('File name:', file.name);
        console.log('File type:', file.type);
        console.log('File size:', Math.round(file.size / 1024), 'KB');
        console.log('Is File object:', file instanceof File);
        console.groupEnd();
    };

    const formatHelperText = (phaseId) => {
        const phase = phases.find(p => p.id === phaseId || p.id === parseInt(phaseId));
        if (!phase) return '';

        // Get all existing milestones for this phase
        const phaseMilestones = milestones.filter(m => m.phaseId === phaseId);

        // Calculate total allocated from existing milestones
        const totalAllocated = phaseMilestones.reduce(
            (sum, m) => sum + parseFloat(m.price || 0),
            0
        );

        const phaseGoal = parseFloat(phase.fundingGoal || phase.targetAmount || 0);
        const maxAllowed = phaseGoal * milestoneMaxPercentage;
        const percentText = (milestoneMaxPercentage * 100).toFixed(0);

        // Calculate remaining budget
        const remaining = phaseGoal - totalAllocated;

        // Consider the current milestone's price being entered/edited if it's for this phase
        const isCurrentMilestoneForThisPhase = currentMilestone.phaseId === phaseId &&
            currentMilestone.price;

        // Adjust remaining amount when entering price in new milestone form
        let adjustedRemaining = remaining;
        if (isCurrentMilestoneForThisPhase && !currentMilestone.id) {
            // Only subtract for new milestones (not for editing)
            const currentPrice = parseFloat(currentMilestone.price) || 0;
            adjustedRemaining = remaining - currentPrice;
        }

        // Add information about the percentage limit
        const limitInfo = `Maximum single milestone amount: ${formatCurrency(maxAllowed)} (${percentText}% of phase goal)`;

        if (Math.abs(adjustedRemaining) < 0.01) {
            return `${limitInfo}. This phase's budget of ${formatCurrency(phaseGoal)} is fully allocated.`;
        } else if (adjustedRemaining < 0) {
            return `Warning: You're exceeding the phase budget by ${formatCurrency(Math.abs(adjustedRemaining))}. ${limitInfo}`;
        } else {
            // When editing a milestone, show the phase total and already allocated
            if (isCurrentMilestoneForThisPhase && currentMilestone.id) {
                // Find the current milestone's price
                const editingMilestone = phaseMilestones.find(m => m.id === currentMilestone.id);
                const editingMilestonePrice = editingMilestone ? parseFloat(editingMilestone.price || 0) : 0;

                // Calculate other milestones' total (excluding the one being edited)
                const otherMilestonesTotal = totalAllocated - editingMilestonePrice;

                // Calculate what's available for this milestone
                const availableForThisMilestone = phaseGoal - otherMilestonesTotal;

                return `${limitInfo}. Available for this milestone: ${formatCurrency(availableForThisMilestone)} of ${formatCurrency(phaseGoal)}`;
            } else {
                return `${limitInfo}. Remaining budget to allocate: ${formatCurrency(adjustedRemaining)} of ${formatCurrency(phaseGoal)}`;
            }
        }
    };

    // Add an item to a milestone
    const addMilestoneItem = async () => {
        if (!currentMilestoneItem.name || !selectedMilestone) {
            setError('Please provide a name for the item and select a milestone.');
            return;
        }

        if (!currentMilestoneItem.name || !selectedMilestone) {
            setError('Please provide a name for the item and select a milestone.');
            return;
        }

        // Find the milestone this item will be added to
        const milestone = milestones.find(m => m.id === selectedMilestone);
        if (!milestone) {
            setError('Selected milestone not found.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Step 1: Create the item first
            const newItemData = {
                name: currentMilestoneItem.name,
                quantity: parseInt(currentMilestoneItem.quantity) || 1,
            };

            console.log('Creating new milestone item with data:', newItemData);

            const itemResponse = await milestoneItemService.createMilestoneItem(
                selectedMilestone,
                newItemData
            );

            console.log('Item creation response:', itemResponse);

            // Step 2: Extract the item ID from the response (based on the actual API response format)
            let itemId = null;

            // Check different response formats to find the ID
            if (itemResponse && typeof itemResponse.data === 'number') {
                itemId = itemResponse.data;
            } else if (itemResponse && itemResponse.id) {
                itemId = itemResponse.id;
            } else if (itemResponse && itemResponse.data && itemResponse.data.id) {
                itemId = itemResponse.data.id;
            }

            console.log('Extracted item ID:', itemId);

            if (!itemId) {
                console.error('Failed to extract item ID from response:', itemResponse);
                setError('Item created but failed to extract ID for image upload');
            }

            // Step 3: Upload the image if available and we have an ID
            if (currentMilestoneItem.image && itemId) {
                console.log(`Now uploading image for item ${itemId}`);
                debugImageFile(currentMilestoneItem.image);

                try {
                    // Allow the backend to process the item creation first
                    await new Promise(resolve => setTimeout(resolve, 500));

                    console.time('Image upload');
                    const imageResponse = await milestoneItemService.uploadMilestoneItemImage(
                        itemId,
                        currentMilestoneItem.image
                    );
                    console.timeEnd('Image upload');

                    console.log('Image upload response:', imageResponse);
                    setSuccess('Item added with image successfully!');
                } catch (imageError) {
                    console.error('Error uploading image:', imageError);
                    setError(`Item created but image upload failed: ${imageError.message || 'Unknown error'}`);
                    // Continue even if image upload fails
                }
            } else if (!currentMilestoneItem.image) {
                console.log('No image to upload');
                setSuccess('Item added successfully!');
            } else if (!itemId) {
                console.error('Missing item ID, cannot upload image');
                setError('Item created but could not get ID for image upload');
            }

            // Reset form
            setCurrentMilestoneItem({
                name: '',
                quantity: 1,
                image: null,
                imagePreview: null
            });

            // Close the form
            setShowMilestoneItemForm(false);

            // Clear file input
            if (milestoneFileInputRef.current) {
                milestoneFileInputRef.current.value = '';
            }

            // Add a small delay to ensure the API has processed the changes
            await new Promise(resolve => setTimeout(resolve, 800));

            // Immediately refresh the milestone to get updated items
            await fetchMilestoneItems(selectedMilestone);

            // Also refresh all milestones to ensure parent component has latest data
            await fetchMilestones();

        } catch (error) {
            console.error('Error adding item to milestone:', error);
            setError(`Failed to add item: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    // Update the updateMilestoneItem function similarly
    const updateMilestoneItem = async (itemId, updatedData) => {
        if (!itemId) {
            setError('Missing item ID for update');
            return;
        }

        const milestone = milestones.find(m => m.id === selectedMilestone);
        if (!milestone) {
            setError('Selected milestone not found.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Only include the image if a new one was selected
            const dataToUpdate = {
                name: updatedData.name,
                quantity: parseInt(updatedData.quantity) || 1,
            };

            console.log(`Updating item ${itemId} with data:`, dataToUpdate);

            const response = await milestoneItemService.updateMilestoneItem(itemId, dataToUpdate);
            console.log('Item update response:', response);

            // If there's a new image, upload it
            if (updatedData.image instanceof File) {
                console.log(`Uploading new image for item ${itemId}`);
                debugImageFile(updatedData.image);

                try {
                    const imageResponse = await milestoneItemService.uploadMilestoneItemImage(
                        itemId,
                        updatedData.image
                    );

                    console.log('Image upload response:', imageResponse);
                } catch (imageError) {
                    console.error('Error uploading image:', imageError);
                    setError(`Item updated but image upload failed: ${imageError.message || 'Unknown error'}`);
                    // Continue execution even if image upload fails
                }
            }

            setSuccess('Item updated successfully!');

            // Reset form and close modal
            setCurrentMilestoneItem({
                name: '',
                quantity: 1,
                image: null,
                imagePreview: null
            });

            setShowMilestoneItemForm(false);

            // Clear file input
            if (milestoneFileInputRef.current) {
                milestoneFileInputRef.current.value = '';
            }

            // Refresh the milestone to get updated items
            if (selectedMilestone) {
                await fetchMilestoneItems(selectedMilestone);
            }

            // Also refresh all milestones to ensure parent component has latest data
            await fetchMilestones();

        } catch (error) {
            console.error('Error updating milestone item:', error);
            setError(`Failed to update item: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    // Delete a milestone item
    const deleteMilestoneItem = async (itemId) => {
        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }
        const milestone = milestones.find(m => m.id === selectedMilestone);
        if (!milestone) {
            setError('Selected milestone not found.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await milestoneItemService.deleteMilestoneItem(itemId);
            console.log('Item deletion response:', response);

            setSuccess('Item deleted successfully!');

            // Refresh the milestone to get updated items
            if (selectedMilestone) {
                await fetchMilestoneItems(selectedMilestone);
            }

            // Also refresh all milestones to ensure parent component has latest data
            await fetchMilestones();

        } catch (error) {
            console.error('Error deleting milestone item:', error);
            setError('Failed to delete item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle milestone form changes
    const handleMilestoneChange = (e) => {
        const { name, value } = e.target;

        setCurrentMilestone(prev => ({
            ...prev,
            [name]: value
        }));

        // Check if selecting a phase that's not in PLAN status
        if (name === 'phaseId' && value) {
            const selectedPhase = projectData.phases.find(p =>
                p.id === value || p.id === parseInt(value)
            );

            if (selectedPhase && selectedPhase.status !== 'PLAN') {
                setError('You can only add or edit milestones for phases with PLAN status.');
            } else {
                // Clear any existing phase selection errors
                if (error && error.includes('phases with PLAN status')) {
                    setError(null);
                }
            }
        }

        if (name === 'price' || name === 'phaseId') {
            setTimeout(() => {
                setShowMilestoneForm(show => show ? true : true);
            }, 0);
        }
    };

    // Handle milestone item form changes
    const handleMilestoneItemChange = (e) => {
        const { name, value } = e.target;
        setCurrentMilestoneItem(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle milestone item image selection
    const handleMilestoneItemImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image must be less than 10MB');
            return;
        }

        // Create preview for UI
        const reader = new FileReader();
        reader.onload = () => {
            setCurrentMilestoneItem(prev => ({
                ...prev,
                image: file,
                imagePreview: reader.result
            }));
        };
        reader.readAsDataURL(file);

        // Clear any existing errors
        setError(null);
    };

    const addItem = () => {
        if (!currentItem.name.trim()) {
            setError('Please enter an item name');
            return;
        }

        setCurrentItem(prev => ({
            ...prev,
            items: [...prev.items, {
                name: currentItem.name.trim(),
                image: currentItem.image, // Store the preview as base64 since we can't store File objects in state directly
                imagePreview: currentItem.imagePreview
            }]
        }));
        setCurrentItem({ name: '', image: null, imagePreview: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeItem = (index) => {
        setCurrentItem(prev => {
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



    const filteredMilestones = milestones.filter(milestone => milestone.phaseId === selectedPhase);

    // Format currency for display
    const formatCurrency = (amount) => {
        const value = parseFloat(amount);
        return isNaN(value) ? '$0.00' : `$${value.toFixed(2)}`;
    };

    // Get a nice formatted date from YYYY-MM
    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';

        try {
            if (dateString.includes('-')) {
                const [year, month] = dateString.split('-');
                return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long'
                });
            }

            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            return dateString;
        }
    };

    const areAllPhasesFunded = (selectedPhaseId = 'all') => {
        // If no phase is selected or no milestones, don't hide the button
        if (!phases || phases.length === 0) return false;

        // Check all phases or just the selected one
        const phasesToCheck = selectedPhaseId === 'all'
            ? phases
            : phases.filter(p => p.id === selectedPhaseId);

        // For each phase, check if milestone totals equal the funding goal
        for (const phase of phasesToCheck) {
            const phaseMilestones = milestones.filter(m => m.phaseId === phase.id);
            const totalMilestoneAmount = phaseMilestones.reduce((total, milestone) => {
                return total + parseFloat(milestone.price || 0);
            }, 0);

            const phaseGoal = parseFloat(phase.fundingGoal || phase.targetAmount || 0);

            // If there's a difference greater than 1 cent, the phase is not fully funded
            if (Math.abs(totalMilestoneAmount - phaseGoal) > 0.01) {
                return false;
            }
        }

        return true;
    };

    const isPriceExceedingMaxPercentage = () => {
        if (!currentMilestone.phaseId || !currentMilestone.price) return false;

        const phase = phases.find(p => p.id === currentMilestone.phaseId || p.id === parseInt(currentMilestone.phaseId));
        if (!phase) return false;

        const phaseGoal = parseFloat(phase.fundingGoal || phase.targetAmount || 0);
        const maxAllowed = phaseGoal * milestoneMaxPercentage;
        const currentPrice = parseFloat(currentMilestone.price);

        return currentPrice > maxAllowed;
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
                        <h3 className="text-sm font-medium text-blue-800">Phase-specific Milestones</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>
                                Create milestones for each phase of your project. Different phases can have unique milestones to track your progress.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {phases.length > 0 && (
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Project Milestones</h2>
                    <div className="relative" data-filter-menu>
                        <button
                            type="button"
                            onClick={() => setShowPhaseFilter(!showPhaseFilter)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="mr-2 -ml-0.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                            {selectedPhase ? (phases.find(p => p.id === selectedPhase)?.name || 'Select Phase') : 'Select Phase'}
                        </button>

                        {showPhaseFilter && (
                            <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="py-1">
                                    {phases.map(phase => (
                                        <button
                                            key={phase.id}
                                            className={`block px-4 py-2 text-sm w-full text-left ${selectedPhase === phase.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                                            onClick={() => {
                                                if (selectedPhase !== phase.id) {
                                                    setSelectedPhase(phase.id);
                                                    setShowPhaseFilter(false);
                                                }
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

            {/* Error and success messages */}
            {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setError(null)}
                            className="ml-auto pl-3 text-red-500 hover:text-red-700"
                        >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {success && (
                <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSuccess(null)}
                            className="ml-auto pl-3 text-green-500 hover:text-green-700"
                        >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-8">
                    <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-gray-500 mt-2">Loading milestones...</p>
                </div>
            ) : (
                <>
                    {!selectedPhase ? (
                        // Display message when no phase is selected
                        <div className="text-center py-8 bg-gray-50 rounded-md border border-dashed border-gray-300">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No phase selected</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Please select a phase from the dropdown menu above to view or add milestones.
                            </p>
                        </div>
                    ) : filteredMilestones.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-md border border-dashed border-gray-300">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No milestones yet</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                No milestones for this phase. Add your first milestone for this phase.
                            </p>
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentMilestone({
                                            title: '',
                                            description: '',
                                            price: '',
                                            phaseId: selectedPhase,
                                        });
                                        setShowMilestoneForm(true);
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Add First Milestone
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 text-right">
                                {!areAllPhasesFunded(selectedPhase) && isPhaseEditable(selectedPhase) ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCurrentMilestone({
                                                title: '',
                                                description: '',
                                                price: '',
                                                phaseId: selectedPhase,
                                            });
                                            setShowMilestoneForm(true);
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        Add New Milestone
                                    </button>
                                ) : !isPhaseEditable(selectedPhase) ? (
                                    <div className="text-sm text-amber-600 font-medium">
                                        <span className="inline-flex items-center">
                                            <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            This phase is not in PLAN status and cannot be modified
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-sm text-green-600 font-medium">
                                        <span className="inline-flex items-center">
                                            <svg className="mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            This phase is fully funded
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                {filteredMilestones.map(milestone => {
                                    const isEditable = isMilestoneEditable(milestone);
                                    return (
                                        <div
                                            key={milestone.id}
                                            className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${!isEditable ? 'opacity-80' : ''}`}
                                        >
                                            <div className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-medium text-gray-900">{milestone.title}</h3>
                                                        {milestone.phaseName && (
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {milestone.phaseName}
                                                                </span>
                                                                {!isEditable && (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                                        Not Editable
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex space-x-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setCurrentMilestone({
                                                                    id: milestone.id,
                                                                    title: milestone.title,
                                                                    description: milestone.description || '',
                                                                    price: milestone.price || '',
                                                                    phaseId: milestone.phaseId,
                                                                });
                                                                setShowMilestoneForm(true);
                                                            }}
                                                            disabled={!isEditable}
                                                            className={`text-indigo-600 hover:text-indigo-900 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            title={!isEditable ? "This milestone cannot be edited because its phase is not in PLAN status" : "Edit milestone"}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteMilestone(milestone.id)}
                                                            disabled={!isEditable}
                                                            className={`text-red-600 hover:text-red-900 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            title={!isEditable ? "This milestone cannot be deleted because its phase is not in PLAN status" : "Delete milestone"}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                {milestone.description && (
                                                    <p className="mt-2 text-sm text-gray-600">{milestone.description}</p>
                                                )}

                                                <div className="mt-4 border-t border-gray-200 pt-4">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="text-sm font-medium text-gray-700">Milestone Items</h4>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedMilestone(milestone.id);
                                                                setCurrentMilestoneItem({
                                                                    name: '',
                                                                    quantity: 1,
                                                                    image: null,
                                                                    imagePreview: null
                                                                });
                                                                setShowMilestoneItemForm(true);
                                                            }}
                                                            disabled={!isEditable}
                                                            className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md ${isEditable
                                                                ? "text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                                                : "text-gray-500 bg-gray-100 cursor-not-allowed"
                                                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                                                            title={!isEditable ? "Cannot add items because this milestone's phase is not in PLAN status" : "Add item"}
                                                        >
                                                            <svg className="-ml-0.5 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                            </svg>
                                                            Add Item
                                                        </button>
                                                    </div>

                                                    {/* Items list with edit permissions */}
                                                    {milestone.items && milestone.items.length > 0 ? (
                                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            {milestone.items.map((item, index) => (
                                                                <li key={item.id || index} className="bg-gray-50 rounded-md p-2 flex items-center justify-between">
                                                                    <div className="flex items-center">
                                                                        {item.imageUrl ? (
                                                                            <div className="h-10 w-10 mr-2 relative rounded overflow-hidden bg-gray-100">
                                                                                <img
                                                                                    src={`${item.imageUrl}?t=${Date.now()}`}
                                                                                    alt={item.name}
                                                                                    width={40}
                                                                                    height={40}
                                                                                    className="h-full w-full object-cover"
                                                                                    onError={(e) => {
                                                                                        console.error(`Failed to load image for item ${item.id}`);
                                                                                        e.target.src = "https://via.placeholder.com/40x40?text=No+Image";
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="h-10 w-10 mr-2 bg-gray-100 rounded flex items-center justify-center">
                                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                                </svg>
                                                                            </div>
                                                                        )}
                                                                        <span className="text-sm text-gray-700">{item.name}</span>
                                                                    </div>
                                                                    <div className="flex space-x-1">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setSelectedMilestone(milestone.id);
                                                                                setCurrentMilestoneItem({
                                                                                    id: item.id,
                                                                                    name: item.name,
                                                                                    quantity: item.quantity || 1,
                                                                                    image: null,
                                                                                    imagePreview: item.imageUrl
                                                                                });
                                                                                setShowMilestoneItemForm(true);
                                                                            }}
                                                                            disabled={!isEditable}
                                                                            className={`text-indigo-600 hover:text-indigo-900 p-1 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            title={!isEditable ? "Cannot edit item because this milestone's phase is not in PLAN status" : "Edit item"}
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                                            </svg>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => deleteMilestoneItem(item.id)}
                                                                            disabled={!isEditable}
                                                                            className={`text-red-600 hover:text-red-900 p-1 ${!isEditable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            title={!isEditable ? "Cannot delete item because this milestone's phase is not in PLAN status" : "Delete item"}
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 italic">No items added to this milestone yet</p>
                                                    )}
                                                </div>

                                                {/* Phase status information */}
                                                {!isEditable && (
                                                    <div className="mt-4 px-3 py-2 bg-amber-50 rounded-md border border-amber-200">
                                                        <p className="text-sm text-amber-700">
                                                            This milestone belongs to a phase that is not in PLAN status and cannot be edited.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Milestone Form Modal */}
            {showMilestoneForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {currentMilestone.id ? 'Edit Milestone' : 'Create New Milestone'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMilestoneForm(false);
                                        setCurrentMilestone({
                                            title: '',
                                            description: '',
                                            price: '',
                                            phaseId: '',
                                        });
                                    }}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={e => {
                                e.preventDefault();
                                if (currentMilestone.id) {
                                    updateMilestone(currentMilestone.id, {
                                        title: currentMilestone.title,
                                        description: currentMilestone.description,
                                        price: currentMilestone.price,
                                        phaseId: currentMilestone.phaseId
                                    });
                                    setShowMilestoneForm(false);
                                } else {
                                    addMilestone();
                                }
                            }} className="space-y-4">
                                <div>
                                    <label htmlFor="milestone-phase" className="block text-sm font-medium text-gray-700">
                                        Project Phase *
                                    </label>
                                    <select
                                        id="milestone-phase"
                                        name="phaseId"
                                        value={currentMilestone.phaseId}
                                        onChange={handleMilestoneChange}
                                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required
                                    >
                                        <option value="">Select a phase</option>
                                        {phases.map((phase) => (
                                            <option key={phase.id} value={phase.id}>{phase.name}</option>
                                        ))}
                                    </select>
                                    {currentMilestone.phaseId && (
                                        <p className="mt-1 text-xs text-blue-600">
                                            {formatHelperText(currentMilestone.phaseId)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="milestone-title" className="block text-sm font-medium text-gray-700">
                                        Milestone Title *
                                    </label>
                                    <input
                                        type="text"
                                        id="milestone-title"
                                        name="title"
                                        value={currentMilestone.title}
                                        onChange={handleMilestoneChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="milestone-description" className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        id="milestone-description"
                                        name="description"
                                        value={currentMilestone.description}
                                        onChange={handleMilestoneChange}
                                        rows={3}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="milestone-price" className="block text-sm font-medium text-gray-700">
                                        Price
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            id="milestone-price"
                                            name="price"
                                            value={currentMilestone.price}
                                            onChange={handleMilestoneChange}
                                            className={`mt-1 block w-full border ${isPriceExceedingMaxPercentage() ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                                                } rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none sm:text-sm`}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    {isPriceExceedingMaxPercentage() && (
                                        <p className="mt-1 text-xs text-red-600">
                                            Price exceeds {(milestoneMaxPercentage * 100).toFixed(0)}% of the phase budget limit.
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        Enter the budget or cost for this milestone. Maximum {(milestoneMaxPercentage * 100).toFixed(0)}% of phase total.
                                    </p>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowMilestoneForm(false);
                                            setCurrentMilestone({
                                                title: '',
                                                description: '',
                                                price: '',
                                                phaseId: '',
                                            });
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : currentMilestone.id ? 'Update Milestone' : 'Create Milestone'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Milestone Item Form Modal */}

            {showMilestoneItemForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {currentMilestoneItem.id ? 'Edit Milestone Item' : 'Add New Milestone Item'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMilestoneItemForm(false);
                                        setCurrentMilestoneItem({
                                            name: '',
                                            quantity: 1,
                                            image: null,
                                            imagePreview: null
                                        });
                                    }}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={e => {
                                e.preventDefault();
                                if (currentMilestoneItem.id) {
                                    updateMilestoneItem(currentMilestoneItem.id, {
                                        name: currentMilestoneItem.name,
                                        quantity: currentMilestoneItem.quantity,
                                        image: currentMilestoneItem.image
                                    });
                                    setShowMilestoneItemForm(false);
                                } else {
                                    addMilestoneItem();
                                }
                            }} className="space-y-4">
                                <div>
                                    <label htmlFor="item-name" className="block text-sm font-medium text-gray-700">
                                        Item Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="item-name"
                                        name="name"
                                        value={currentMilestoneItem.name}
                                        onChange={handleMilestoneItemChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="item-quantity" className="block text-sm font-medium text-gray-700">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        id="item-quantity"
                                        name="quantity"
                                        value={currentMilestoneItem.quantity}
                                        onChange={handleMilestoneItemChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        min="1"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Enter the number of items needed.</p>
                                </div>

                                <div>
                                    <label htmlFor="item-image" className="block text-sm font-medium text-gray-700">
                                        Item Image
                                    </label>
                                    <div className="mt-1 flex items-center space-x-2">
                                        {currentMilestoneItem.imagePreview ? (
                                            <div className="relative">
                                                <img
                                                    src={currentMilestoneItem.imagePreview}
                                                    alt="Item preview"
                                                    className="h-24 w-24 object-cover rounded-md border border-gray-200"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCurrentMilestoneItem(prev => ({
                                                            ...prev,
                                                            image: null,
                                                            imagePreview: null
                                                        }));
                                                        if (milestoneFileInputRef.current) {
                                                            milestoneFileInputRef.current.value = '';
                                                        }
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                                                    title="Remove image"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <label
                                                htmlFor="item-image"
                                                className="cursor-pointer flex flex-col items-center justify-center h-24 w-24 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50"
                                            >
                                                <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                <span className="mt-1 text-xs text-gray-500">Upload Image</span>
                                            </label>
                                        )}

                                        <input
                                            type="file"
                                            id="item-image"
                                            name="image"
                                            accept="image/*"
                                            ref={milestoneFileInputRef}
                                            onChange={handleMilestoneItemImageChange}
                                            className="sr-only"
                                        />

                                        <div className="text-sm text-gray-500">
                                            <p>Recommended: Square image (1:1 ratio)</p>
                                            <p>Max size: 10MB</p>
                                            <p>Formats: JPG, PNG, GIF, WEBP</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowMilestoneItemForm(false);
                                            setCurrentMilestoneItem({
                                                name: '',
                                                quantity: 1,
                                                image: null,
                                                imagePreview: null
                                            });
                                        }}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : currentMilestoneItem.id ? 'Update Item' : 'Add Item'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

RewardInformation.propTypes = {
    formData: PropTypes.array,
    updateFormData: PropTypes.func,
    projectData: PropTypes.object
};

RewardInformation.defaultProps = {
    formData: [],
    updateFormData: () => { },
    projectData: { phases: [] }
};