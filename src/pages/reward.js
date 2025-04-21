import { useState, useEffect } from 'react';
import Head from 'next/head';
import Loading from '@/components/Loading';
import RewardList from '@/components/RewardArea/RewardList';
import RewardDetails from '@/components/RewardArea/RewardDetail';
import AddressSelector from '@/components/RewardArea/AddressSelector';
import Layout from '@/components/Layout/Layout';
import Header from '@/components/Header/Header';
import PageTitle from '@/components/Reuseable/PageTitle';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { transactionService } from 'src/services/transactionService';
import { getUserAddress, createUserAddress, deleteUserAddress, updateUserAddress } from 'src/services/userAddress';
import { shippingInformationService } from 'src/services/shippingInformationService';
import projectService from 'src/services/projectService';
import { toast } from 'react-toastify';

function RewardPage() {
    const [investments, setInvestments] = useState([]);
    const [selectedInvestment, setSelectedInvestment] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [shippingInfo, setShippingInfo] = useState(null);
    const [savingShipping, setSavingShipping] = useState(false);

    useEffect(() => {
        const fetchInvestments = async () => {
            try {
                setLoading(true);

                // Fetch investments data from the API
                const response = await fetch('https://quanbeo.duckdns.org/api/v1/investment/user?page=0&size=100&sort=', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Get response as text first for better error handling
                const responseText = await response.text();

                // Try to parse the response as JSON
                let responseData;
                try {
                    responseData = JSON.parse(responseText);
                } catch (parseError) {
                    console.error('Error parsing response as JSON:', parseError);
                    if (!response.ok) {
                        throw new Error(responseText || `Error: ${response.status}`);
                    }
                    // Return empty array for non-JSON success responses
                    responseData = [];
                }

                // If response wasn't successful, extract error message from result
                if (!response.ok) {
                    const errorMessage = responseData.error ||
                        responseData.message ||
                        (typeof responseData === 'string' ? responseData : null) ||
                        `Error: ${response.status}`;

                    throw new Error(errorMessage);
                }

                // Check the exact structure and handle both possible formats
                let investmentsArray = [];

                if (responseData && Array.isArray(responseData)) {
                    // If response is directly an array
                    investmentsArray = responseData;
                } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
                    // If response has a data property that is an array
                    investmentsArray = responseData.data;
                } else if (responseData && responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
                    // If response has a nested data.data property that is an array
                    investmentsArray = responseData.data.data;
                } else {
                    console.log("Response structure:", responseData);
                    throw new Error('Invalid data format received from server');
                }

                // Transform the data to match the expected format and filter for investments with milestoneId
                const transformedInvestments = investmentsArray
                    .filter(investment => investment.milestoneId)
                    .map(investment => ({
                        id: investment.id,
                        projectTitle: investment.projectTitle,
                        amount: investment.amount,
                        phaseNumber: investment.phaseNumber,
                        status: investment.status,
                        investorName: investment.investorName,
                        date: new Date().toISOString(), // Default to current date if not provided
                        // If phaseId exists, we'll fetch milestone details separately
                        phaseId: investment.phaseId || null,
                        milestoneId: investment.milestoneId
                    }));

                setInvestments(transformedInvestments);

                // Select the first investment by default if available
                if (transformedInvestments.length > 0) {
                    await fetchMilestoneDetails(transformedInvestments[0]);
                }
            } catch (err) {
                setError(err.message || 'An error occurred while fetching investments');
                console.error('Error fetching investments:', err);
                toast.error('Failed to load investment data');
            } finally {
                setLoading(false);
            }
        };

        const fetchAddresses = async () => {
            try {
                // Fetch user addresses using the imported getUserAddress function
                const addressData = await getUserAddress();

                if (addressData && Array.isArray(addressData)) {
                    setAddresses(addressData);

                    if (addressData.length > 0) {
                        // Select default address if available
                        const defaultAddress = addressData.find(addr => addr.isDefault) || addressData[0];
                        setSelectedAddress(defaultAddress);
                    }
                }
            } catch (err) {
                console.error('Error fetching addresses:', err);
                toast.error('Failed to load address data');
            }
        };

        fetchInvestments();
        fetchAddresses();
    }, []);

    // Fetch milestone details for a specific investment using the direct API
    const fetchMilestoneDetails = async (investment) => {
        if (!investment?.milestoneId) {
            setSelectedInvestment(investment);
            return;
        }

        try {
            // Directly get the milestone by ID
            const response = await fetch(`https://quanbeo.duckdns.org/api/v1/milestone/guest/${investment.milestoneId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Get response as text first for better error handling
            const responseText = await response.text();

            // Try to parse the response as JSON
            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Error parsing milestone response as JSON:', parseError);
                if (!response.ok) {
                    throw new Error(responseText || `Error: ${response.status}`);
                }
                // Set default milestone data for non-JSON success responses
                responseData = { data: null };
            }

            // If response wasn't successful, extract error message from result
            if (!response.ok) {
                const errorMessage = responseData.error ||
                    responseData.message ||
                    (typeof responseData === 'string' ? responseData : null) ||
                    `Error: ${response.status}`;

                throw new Error(errorMessage);
            }

            let milestone = null;

            if (responseData && responseData.data) {
                milestone = responseData.data;
            }

            if (milestone) {
                const updatedInvestment = {
                    ...investment,
                    milestone: {
                        milestoneId: milestone.id,
                        milestoneName: milestone.title || 'Milestone',
                        milestoneDescription: milestone.description || 'Support for this project milestone',
                        items: milestone.items || []
                    }
                };

                setSelectedInvestment(updatedInvestment);

                // Try to fetch any existing shipping information
                try {
                    const shippingResponse = await shippingInformationService.getShippingInformationById(investment.id);
                    if (shippingResponse?.data) {
                        setShippingInfo(shippingResponse.data);

                        // If we have shipping info with an address, select that address
                        if (shippingResponse.data.userAddressId) {
                            const shippingAddress = addresses.find(addr => addr.id === shippingResponse.data.userAddressId);
                            if (shippingAddress) {
                                setSelectedAddress(shippingAddress);
                            }
                        }
                    }
                } catch (error) {
                    // It's okay if there's no shipping info
                    setShippingInfo(null);
                }
            } else {
                // If no milestone found, just use the investment as is
                setSelectedInvestment(investment);
            }
        } catch (err) {
            console.error('Error fetching milestone details:', err);
            toast.error('Failed to load milestone details');

            // Still set the investment but with empty milestone data
            setSelectedInvestment({
                ...investment,
                milestone: {
                    milestoneId: investment.milestoneId,
                    milestoneName: 'Milestone',
                    milestoneDescription: 'Support for this project milestone',
                    items: []
                }
            });
        }
    };

    const handleSelectInvestment = async (investment) => {
        // Fetch milestone details when selecting an investment
        await fetchMilestoneDetails(investment);
    };

    const handleSelectAddress = (address) => {
        setSelectedAddress(address);
    };

    const handleAddAddress = async (newAddress) => {
        try {
            // Use the createUserAddress function from userAddress.js
            const response = await createUserAddress(newAddress);

            if (response && response.data) {
                // Add the new address to the list
                setAddresses([...addresses, response.data]);
                setSelectedAddress(response.data);
                toast.success('Address added successfully');
                return true;
            } else {
                toast.error('Failed to add address');
                return false;
            }
        } catch (err) {
            console.error('Error adding address:', err);
            toast.error('Error adding address');
            return false;
        }
    };

    const handleSaveShipping = async () => {
        if (!selectedInvestment || !selectedAddress) {
            toast.warning('Please select an address');
            return;
        }

        try {
            setSavingShipping(true);
            let response;

            if (shippingInfo?.id) {
                // Update existing shipping information
                response = await shippingInformationService.updateShippingInformation(
                    shippingInfo.id,
                    selectedAddress.id
                );

                // Check both response formats
                if (response?.data) {
                    setShippingInfo(response.data);
                } else if (response?.status === 200) {
                    // Handle success response that doesn't include data
                    // Fetch the updated shipping info
                    try {
                        const updatedInfo = await shippingInformationService.getShippingInformationById(selectedInvestment.id);
                        if (updatedInfo?.data) {
                            setShippingInfo(updatedInfo.data);
                        }
                    } catch (fetchErr) {
                        console.error('Error fetching updated shipping info:', fetchErr);
                    }
                }
            } else {
                // Create new shipping information
                response = await shippingInformationService.createShippingInformation(
                    selectedInvestment.id,
                    selectedAddress.id
                );

                if (response?.data) {
                    setShippingInfo(response.data);
                } else if (response?.status === 200) {
                    // Handle success response without data
                    // Fetch the new shipping info
                    try {
                        const newInfo = await shippingInformationService.getShippingInformationById(selectedInvestment.id);
                        if (newInfo?.data) {
                            setShippingInfo(newInfo.data);
                        }
                    } catch (fetchErr) {
                        console.error('Error fetching new shipping info:', fetchErr);
                    }
                }
            }

            // Check if response is successful
            if (response?.data || response?.status === 200) {
                // Update the local state with the shipping information
                const updatedInvestments = investments.map(inv => {
                    if (inv.id === selectedInvestment.id) {
                        return {
                            ...inv,
                            shippingAddress: selectedAddress,
                            shippingStatus: (shippingInfo?.status || response?.data?.status || 'PENDING')
                        };
                    }
                    return inv;
                });

                setInvestments(updatedInvestments);
                setSelectedInvestment({
                    ...selectedInvestment,
                    shippingAddress: selectedAddress,
                    shippingStatus: (shippingInfo?.status || response?.data?.status || 'PENDING')
                });

                toast.success('Shipping information saved successfully!');
            } else {
                toast.error('Failed to save shipping information');
            }
        } catch (err) {
            console.error('Error saving shipping:', err);

            // Check if the error contains a success message anyway (API inconsistency)
            if (err.response?.data?.status === 200 || err.response?.data?.message?.includes('success')) {
                toast.success('Shipping information saved successfully!');

                // Fetch the updated info
                try {
                    const refreshedInfo = await shippingInformationService.getShippingInformationById(selectedInvestment.id);
                    if (refreshedInfo?.data) {
                        setShippingInfo(refreshedInfo.data);
                    }
                } catch (fetchErr) {
                    console.error('Error fetching refreshed shipping info:', fetchErr);
                }
            } else {
                toast.error('An error occurred while saving shipping information.');
            }
        } finally {
            setSavingShipping(false);
        }
    };

    const handleRefreshAddresses = async () => {
        try {
            const addressData = await getUserAddress();
            if (addressData && Array.isArray(addressData)) {
                setAddresses(addressData);
            }

            if (selectedInvestment?.id) {
                try {
                    const shippingResponse = await shippingInformationService.getShippingInformationById(selectedInvestment.id);
                    if (shippingResponse?.data) {
                        setShippingInfo(shippingResponse.data);

                        if (shippingResponse.data.userAddressId) {
                            const shippingAddress = addressData.find(addr => addr.id === shippingResponse.data.userAddressId);
                            if (shippingAddress) {
                                setSelectedAddress(shippingAddress);
                            }
                        }
                    }
                } catch (error) {
                    console.log('No shipping information found for this investment');
                }
            }
        } catch (err) {
            console.error('Error refreshing addresses:', err);
        }
    };

    const handleEditAddress = async (addressId, addressData) => {
        try {
            const response = await updateUserAddress(addressId, addressData);

            if (response?.data) {
                setAddresses(prevAddresses =>
                    prevAddresses.map(addr => addr.id === addressId ? response.data : addr)
                );

                if (selectedAddress?.id === addressId) {
                    setSelectedAddress(response.data);
                }

                if (shippingInfo && shippingInfo.userAddressId === addressId) {
                    try {
                        const shippingResponse = await shippingInformationService.updateShippingInformation(
                            shippingInfo.id,
                            addressId
                        );

                        if (shippingResponse?.data) {
                            await handleRefreshAddresses();
                            setShippingInfo(shippingResponse.data);
                        }
                    } catch (shippingErr) {
                        console.error('Error updating shipping information with new address:', shippingErr);
                    }
                }
                return true;
            } else {
                toast.error('Failed to update address');
                return false;
            }
        } catch (err) {
            console.error('Error updating address:', err);
            toast.error('Error updating address');
            return false;
        }
    };

    const handleDeleteAddress = async (addressId) => {
        try {
            await deleteUserAddress(addressId);

            setAddresses(prevAddresses => prevAddresses.filter(addr => addr.id !== addressId));

            if (selectedAddress?.id === addressId) {

                const remainingAddresses = addresses.filter(addr => addr.id !== addressId);
                if (remainingAddresses.length > 0) {

                    const defaultAddress = remainingAddresses.find(addr => addr.isDefault);
                    setSelectedAddress(defaultAddress || remainingAddresses[0]);
                } else {
                    setSelectedAddress(null);
                }
            }
            await handleRefreshAddresses();
            return true;
        } catch (err) {
            console.error('Error deleting address:', err);
            toast.error('Error deleting address');
            return false;
        }
    };

    return (
        <Layout>
            <Header />
            <PageTitle title="My Rewards" />
            <div className="container mx-auto px-4 py-8">
                {loading ? (
                    <Loading message="Loading your rewards..." />
                ) : error ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                ) : investments.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4M12 20V4" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No rewards available</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            You don&apos;t have any investments with available rewards yet.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                                <h2 className="text-xl font-semibold mb-4">My Rewards</h2>
                                <RewardList
                                    investments={investments}
                                    selectedInvestmentId={selectedInvestment?.id}
                                    onSelectInvestment={handleSelectInvestment}
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            {selectedInvestment ? (
                                <>
                                    <RewardDetails
                                        investment={selectedInvestment}
                                        onRefreshAddresses={handleRefreshAddresses}
                                    />

                                    {!shippingInfo && selectedInvestment.milestone && selectedInvestment.milestone.items?.length > 0 && (
                                        <div className="bg-white rounded-lg shadow-md p-4 mt-6">
                                            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>

                                            <AddressSelector
                                                addresses={addresses}
                                                selectedAddress={selectedAddress}
                                                onSelectAddress={handleSelectAddress}
                                                onAddAddress={handleAddAddress}
                                            />

                                            <div className="mt-4">
                                                <button
                                                    onClick={handleSaveShipping}
                                                    disabled={!selectedAddress || savingShipping}
                                                    className={`px-4 py-2 rounded ${!selectedAddress || savingShipping
                                                        ? 'bg-gray-300 cursor-not-allowed'
                                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                        }`}
                                                >
                                                    {savingShipping ? 'Saving...' : 'Save Shipping Information'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {shippingInfo && selectedInvestment.milestone && selectedInvestment.milestone.items?.length > 0 && (
                                        <div className="bg-white rounded-lg shadow-md p-4 mt-6">
                                            <h2 className="text-xl font-semibold mb-4">Update Shipping Address</h2>

                                            <AddressSelector
                                                addresses={addresses}
                                                selectedAddress={selectedAddress}
                                                onSelectAddress={handleSelectAddress}
                                                onAddAddress={handleAddAddress}
                                                onEditAddress={handleEditAddress}
                                                onDeleteAddress={handleDeleteAddress}
                                            />

                                            <div className="mt-4">
                                                <button
                                                    onClick={handleSaveShipping}
                                                    disabled={!selectedAddress || savingShipping}
                                                    className={`px-4 py-2 rounded ${!selectedAddress || savingShipping
                                                        ? 'bg-gray-300 cursor-not-allowed'
                                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                        }`}
                                                >
                                                    {savingShipping ? 'Updating...' : 'Update Shipping Address'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-gray-100 rounded-lg p-8 text-center">
                                    <p className="text-gray-500">Select a reward to view details</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default function Reward() {
    return (
        <ProtectedRoute requiredRoles={['INVESTOR']}>
            <RewardPage />
        </ProtectedRoute>
    );
}