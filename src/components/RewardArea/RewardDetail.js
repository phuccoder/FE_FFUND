import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { shippingInformationService } from 'src/services/shippingInformationService';
import { getUserAddress, getUserAddressById, updateUserAddress, deleteUserAddress } from 'src/services/userAddress';

export default function RewardDetails({ investment, onRefreshAddresses }) {
  const hasMilestone = investment?.milestone != null;
  const [shippingInfo, setShippingInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchShippingInfo = useCallback(async () => {
    if (!investment?.id) return;

    try {
      setIsLoading(true);
      const response = await shippingInformationService.getShippingInformationById(investment.id);
      if (response?.data) {
        setShippingInfo(response.data);

        if (response.data.userAddressId) {
          setSelectedAddressId(response.data.userAddressId);
        }
      }
    } catch (error) {
      console.log('No shipping information found for this investment');
    } finally {
      setIsLoading(false);
    }
  }, [investment?.id]);

  const fetchAddresses = useCallback(async () => {
    try {
      const addressData = await getUserAddress();
      if (addressData && Array.isArray(addressData)) {
        setAddresses(addressData);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  }, []);

  useEffect(() => {
    fetchShippingInfo();
  }, [fetchShippingInfo, refreshTrigger]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses, refreshTrigger]);

  useEffect(() => {
    const fetchAddressDetails = async () => {
      if (!selectedAddressId) return;

      try {
        const addressDetails = await getUserAddressById(selectedAddressId);
        if (addressDetails) {
          // Update the selected address in the addresses list
          setAddresses(prevAddresses => {
            const updatedAddresses = prevAddresses.map(addr =>
              addr.id === addressDetails.id ? addressDetails : addr
            );

            if (!updatedAddresses.some(addr => addr.id === addressDetails.id)) {
              updatedAddresses.push(addressDetails);
            }

            return updatedAddresses;
          });
        }
      } catch (error) {
        console.error('Error fetching address details:', error);
      }
    };

    fetchAddressDetails();
  }, [selectedAddressId]);

  // Function to refresh shipping and address data
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Get the selected address details
  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);


  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{investment.projectTitle}</h2>
            <p className="text-gray-600">Investment ID: {investment.id}</p>
            <div className="flex space-x-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm ${investment.status === 'PAID'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {investment.status}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                Phase {investment.phaseNumber}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-600">Investment Amount</p>
            <p className="text-2xl font-bold text-gray-900">${investment.amount.toLocaleString()}</p>
          </div>
        </div>

        {hasMilestone ? (
          <div className="mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900">
                Milestone: {investment.milestone.milestoneName}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Milestone ID: {investment.milestone.milestoneId}
              </p>
              <p className="mt-2 text-blue-800">
                {investment.milestone.milestoneDescription}
              </p>
            </div>

            {investment.milestone.items && investment.milestone.items.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold mb-3">Reward Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {investment.milestone.items.map((item, index) => (
                    <div key={item.id || index} className="border rounded-md p-4 flex">
                      <div className="w-20 h-20 relative mr-4 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                        {item.imageUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-md">
                <p className="text-gray-500">No reward items available for this milestone</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 text-center py-8 bg-gray-50 rounded-md">
            <p className="text-gray-500">This investment does not include any reward milestones</p>
          </div>
        )}

        {/* Shipping Status Display */}
        {shippingInfo && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              Shipping Information
              <button
                onClick={() => {
                  refreshData();
                  fetchShippingInfo();
                  fetchAddresses();
                }}
                className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </h4>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Status:</span>{' '}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${shippingInfo.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                    shippingInfo.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                      shippingInfo.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        shippingInfo.status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                    {shippingInfo.status}
                  </span>
                </p>
              </div>

              {/* Display shipping address information */}
              {(shippingInfo.userAddress || selectedAddress) && (
                <div className="p-3 bg-white border border-blue-100 rounded-md">
                  <div className="flex justify-between items-start">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">Delivery Address</h5>
                  </div>

                  <div className="text-sm text-gray-700">
                    {shippingInfo.userAddress ? (
                      <>
                        <p className="font-medium">{shippingInfo.investorName}</p>
                        <p>{shippingInfo.userAddress.address}</p>
                        <p>
                          {shippingInfo.userAddress.ward && `${shippingInfo.userAddress.ward}, `}
                          {shippingInfo.userAddress.district && `${shippingInfo.userAddress.district}, `}
                          {shippingInfo.userAddress.province}
                        </p>
                        {shippingInfo.investorPhone && (
                          <p className="mt-1">Phone: {shippingInfo.investorPhone}</p>
                        )}
                        {shippingInfo.userAddress.note && (
                          <p className="mt-1 italic text-gray-500">Note: {shippingInfo.userAddress.note}</p>
                        )}
                      </>
                    ) : selectedAddress ? (
                      // Otherwise, use the selected address
                      <>
                        <p className="font-medium">{selectedAddress.fullName || selectedAddress.recipientName || investment.investorName}</p>
                        <p>{selectedAddress.address}</p>
                        <p>
                          {selectedAddress.ward && `${selectedAddress.ward}, `}
                          {selectedAddress.district && `${selectedAddress.district}, `}
                          {selectedAddress.province}
                        </p>
                        {selectedAddress.phoneNumber && (
                          <p className="mt-1">Phone: {selectedAddress.phoneNumber}</p>
                        )}
                        {selectedAddress.note && (
                          <p className="mt-1 italic text-gray-500">Note: {selectedAddress.note}</p>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              )}

              {shippingInfo.status === 'SHIPPED' && (
                <div className="mt-2">
                  <button
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        const response = await shippingInformationService.confirmReceived(shippingInfo.id);
                        if (response?.data) {
                          setShippingInfo(response.data);
                          toast.success('Package confirmed as received!');
                        }
                      } catch (err) {
                        toast.error('Failed to confirm receipt');
                        console.error(err);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium disabled:bg-green-300 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Confirm Receipt of Package'}
                  </button>
                </div>
              )}

              {/* Shipping Timeline */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <h5 className="text-sm font-medium text-blue-900 mb-3">Shipping Timeline</h5>
                <div className="relative">
                  {/* Processing Step */}
                  <div className="flex items-center mb-4">
                    <div className={`h-4 w-4 rounded-full mr-3 flex-shrink-0 ${['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(shippingInfo.status)
                      ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    <div>
                      <p className="text-sm font-medium">Processing</p>
                      <p className="text-xs text-gray-500">Order has been received and is being processed</p>
                    </div>
                  </div>

                  {/* Vertical Line */}
                  <div className="absolute left-[7px] top-4 h-8 w-0.5 bg-gray-200"></div>

                  {/* Shipped Step */}
                  <div className="flex items-center mb-4">
                    <div className={`h-4 w-4 rounded-full mr-3 flex-shrink-0 ${['SHIPPED', 'DELIVERED'].includes(shippingInfo.status)
                      ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    <div>
                      <p className="text-sm font-medium">Shipped</p>
                      <p className="text-xs text-gray-500">Your package is on its way</p>
                    </div>
                  </div>

                  {/* Vertical Line */}
                  <div className="absolute left-[7px] top-16 h-8 w-0.5 bg-gray-200"></div>

                  {/* Delivered Step */}
                  <div className="flex items-center">
                    <div className={`h-4 w-4 rounded-full mr-3 flex-shrink-0 ${shippingInfo.status === 'DELIVERED'
                      ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    <div>
                      <p className="text-sm font-medium">Delivered</p>
                      <p className="text-xs text-gray-500">Package has been delivered</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {investment.shippingStatus && !shippingInfo && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex justify-between items-start">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Shipping Status:</span> {investment.shippingStatus}
              </p>
              <button
                onClick={() => {
                  refreshData();
                  fetchShippingInfo();
                  fetchAddresses();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {investment.shippingAddress && (
              <div className="mt-3 p-2 bg-white rounded-md border border-green-100">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-green-800 mb-1">Delivery Address:</p>
                </div>
                <p className="text-sm text-gray-700">{investment.shippingAddress.address}</p>
                <p className="text-sm text-gray-700">
                  {investment.shippingAddress.ward}, {investment.shippingAddress.district}, {investment.shippingAddress.province}
                </p>
                {investment.shippingAddress.note && (
                  <p className="text-sm text-gray-500 italic mt-1">Note: {investment.shippingAddress.note}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}