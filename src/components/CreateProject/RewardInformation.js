import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import { milestoneService } from 'src/services/milestoneService';
import { milestoneItemService } from 'src/services/milestoneItemService';
import { useAuth } from 'src/context/AuthContext';

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

    const [showForm, setShowForm] = useState(false);
    const [currentItem, setCurrentItem] = useState({ name: '', image: null, imagePreview: null });
    const [showPhaseFilter, setShowPhaseFilter] = useState(false);
    const [selectedPhase, setSelectedPhase] = useState('all');
    const fileInputRef = useRef(null);
    const milestoneFileInputRef = useRef(null);

    // Fetch phases from the parent component's formData
    useEffect(() => {
        const getPhases = () => {
            try {
                // Try to get phases from projectData
                if (projectData && Array.isArray(projectData.phases) && projectData.phases.length > 0) {
                    // Map phases from the project data
                    const mappedPhases = projectData.phases.map(phase => ({
                        id: phase.id || `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: phase.name || `Phase ${phase.phaseNumber || 'Unknown'}`
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

    // Fetch milestones whenever phases change or auth status changes
    useEffect(() => {
        if (phases.length > 0 && isAuthenticated) {
            fetchMilestones();
        }
    }, [phases, isAuthenticated]);

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

    // Add a new milestone
    const addMilestone = async () => {
        if (!currentMilestone.title || !currentMilestone.phaseId) {
            setError('Please provide at least a title and select a phase.');
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

            setSuccess('Milestone created successfully!');

            // Refresh milestones
            fetchMilestones();

            // Reset form
            setCurrentMilestone({
                title: '',
                description: '',
                price: '',
                phaseId: '',
            });

            setShowMilestoneForm(false);
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
            await milestoneService.updateMilestone(milestoneId, updatedData);
            setSuccess('Milestone updated successfully!');

            // Update in local state
            setMilestones(prevMilestones =>
                prevMilestones.map(m =>
                    m.id === milestoneId ? { ...m, ...updatedData } : m
                )
            );
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

        setLoading(true);
        setError(null);

        try {
            await milestoneService.deleteMilestone(milestoneId);
            setSuccess('Milestone deleted successfully!');

            // Remove from local state
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

    // Add an item to a milestone
    const addMilestoneItem = async () => {
        if (!currentMilestoneItem.name || !selectedMilestone) {
            setError('Please provide a name for the item and select a milestone.');
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

    const filteredMilestones = selectedPhase === 'all'
        ? milestones
        : milestones.filter(milestone => milestone.phaseId === selectedPhase);

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
                    {filteredMilestones.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-md border border-dashed border-gray-300">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No milestones yet</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {selectedPhase !== 'all'
                                    ? 'No milestones for this phase. Add your first milestone for this phase.'
                                    : 'Get started by creating your first milestone.'}
                            </p>
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowMilestoneForm(true)}
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
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentMilestone({
                                            title: '',
                                            description: '',
                                            price: '',
                                            phaseId: '',
                                        });
                                        // Then show the form
                                        setShowMilestoneForm(true);
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Add New Milestone
                                </button>
                            </div>
                            <div className="space-y-4">
                                {filteredMilestones.map(milestone => (
                                    <div
                                        key={milestone.id}
                                        className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                                    >
                                        <div className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900">{milestone.title}</h3>
                                                    {milestone.phaseName && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                            {milestone.phaseName}
                                                        </span>
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
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteMilestone(milestone.id)}
                                                        className="text-red-600 hover:text-red-900"
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
                                                                quantity: 1,  // Changed from description to quantity
                                                                image: null,
                                                                imagePreview: null
                                                            });
                                                            setShowMilestoneItemForm(true);
                                                        }}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                    >
                                                        <svg className="-ml-0.5 mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                        </svg>
                                                        Add Item
                                                    </button>
                                                </div>

                                                {milestone.items && milestone.items.length > 0 ? (
                                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {milestone.items.map((item, index) => (
                                                            <li key={item.id || index} className="bg-gray-50 rounded-md p-2 flex items-center justify-between">
                                                                <div className="flex items-center">
                                                                    {item.imageUrl ? (
                                                                        <div className="h-10 w-10 mr-2 relative rounded overflow-hidden bg-gray-100">
                                                                            <img
                                                                                src={`${item.imageUrl}?t=${Date.now()}`} // Add cache-busting timestamp
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
                                                                                quantity: item.quantity || 1,  // Changed from description to quantity
                                                                                image: null,
                                                                                imagePreview: item.imageUrl
                                                                            });
                                                                            setShowMilestoneItemForm(true);
                                                                        }}
                                                                        className="text-indigo-600 hover:text-indigo-900 p-1"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deleteMilestoneItem(item.id)}
                                                                        className="text-red-600 hover:text-red-900 p-1"
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
                                        </div>
                                    </div>
                                ))}
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
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Enter the budget or cost for this milestone.</p>
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