import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { paymentInfoService } from 'src/services/paymentInformationService';

/**
 * Payment information component for setting up project payments with Stripe Connect
 * @param {Object} props - Component props
 * @param {Object} props.projectData - Current project data
 * @param {Function} props.updateFormData - Function to update parent form data
 * @param {Boolean} props.readOnly - Whether the component is in read-only mode
 * @returns {JSX.Element} - Payment information component
 */
export default function PaymentInformation({ projectData, updateFormData, readOnly = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);

  // Use refs to store the previous payment info to avoid unnecessary updates
  const prevPaymentInfoRef = useRef(null);
  const initialFetchDoneRef = useRef(false);
  const mountedRef = useRef(true);

  // Create a memoized fetchPaymentInfo function to avoid recreating it on every render
  const fetchPaymentInfo = useCallback(async () => {
    if (!projectData || !projectData.id || !mountedRef.current) return;

    try {
      setLoading(true);
      // Get payment info from the service
      const response = await paymentInfoService.getPaymentInfo(projectData.id);

      if (!mountedRef.current) return;

      console.log("Payment info raw response:", response);

      let newPaymentInfo = null;

      // First check if we have any data at all
      if (response && response.id) {
        newPaymentInfo = {
          id: response.id,
          stripeAccountId: response.stripeAccountId,
          projectId: response.projectId,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
          status: response.status
        };
      }
      // Check if response has the nested data structure
      else if (response && response.status === 200 && response.data) {
        // Extract payment info from the nested data property
        newPaymentInfo = {
          id: response.data.id,
          stripeAccountId: response.data.stripeAccountId,
          projectId: response.data.projectId,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
          status: response.data.status  // Use status directly from API response
        };
      }

      if (newPaymentInfo) {
        console.log("Processed payment info:", newPaymentInfo);
        setPaymentInfo(newPaymentInfo);
        updateFormData(newPaymentInfo);
        // Only update state if the new info is different from what we already have
        const prevInfo = prevPaymentInfoRef.current;
        const hasChanged = !prevInfo ||
          prevInfo.id !== newPaymentInfo.id ||
          prevInfo.stripeAccountId !== newPaymentInfo.stripeAccountId ||
          prevInfo.status !== newPaymentInfo.status;

        if (hasChanged) {
          setPaymentInfo(newPaymentInfo);
          prevPaymentInfoRef.current = newPaymentInfo;

          // Send a complete payment info object to the parent component
          updateFormData(prevData => ({
            ...prevData,
            paymentInfo: {
              ...newPaymentInfo,
              // Use status directly from API response
              status: newPaymentInfo.status
            }
          }));

          initialFetchDoneRef.current = true;
        }
      } else {
        console.log("No valid payment info in response");
        if (paymentInfo !== null) {
          setPaymentInfo(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch payment info:", err);
      // Don't show error for regular fetch operations
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [projectData?.id]); // Remove updateFormData from dependencies

  // Fetch existing payment info on component mount
  useEffect(() => {
    mountedRef.current = true;

    if (projectData?.id) {
      console.log("Fetching payment info for project ID:", projectData.id);
      fetchPaymentInfo();
    }

    // Cleanup function to prevent state updates after unmount
    return () => {
      mountedRef.current = false;
    };
  }, [projectData?.id, fetchPaymentInfo]);

  useEffect(() => {
    // Skip calculation if no updateFormData function is provided
    if (typeof updateFormData !== 'function') return;
    
    const calculatePaymentCompletion = () => {
      const paymentInfo = formData || {};
      
      // If empty or not an object, return 0%
      if (!paymentInfo || typeof paymentInfo !== 'object' || Object.keys(paymentInfo).length === 0) {
        return 0;
      }
      
      // Check for completed status
      if (paymentInfo.status === 'LINKED') {
        return 100;
      }
      
      // Check for Stripe account ID
      if (paymentInfo.stripeAccountId && typeof paymentInfo.stripeAccountId === 'string'
        && paymentInfo.stripeAccountId.trim().length > 0) {
        return 100;
      }
      
      // Check for payment ID (partial completion)
      if ((paymentInfo.id && typeof paymentInfo.id === 'string' && paymentInfo.id.trim().length > 0) ||
        (paymentInfo.id && typeof paymentInfo.id === 'number' && paymentInfo.id > 0)) {
        return 40;
      }
      
      // Minimal progress - initiated but not completed
      return 10;
    };
    
    // Calculate current percentage
    const completionPercentage = calculatePaymentCompletion();
    
    // Only update if the value has changed to avoid infinite loops
    if (formData?._completionPercentage !== completionPercentage) {
      // Create a copy of formData with completion percentage
      const updatedFormData = {
        ...formData,
        _completionPercentage: completionPercentage
      };
      // Update parent component
      updateFormData(updatedFormData);
    }
  }, [formData, updateFormData]);

  // Handle connecting to Stripe
  const handleConnectStripe = async () => {
    if (!projectData || !projectData.id) {
      setError("Project information is missing. Please save your project first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await paymentInfoService.createOnboardingLink(projectData.id);
      console.log("Onboarding link response:", response);

      if (response && response.data && typeof response.data === 'string' && response.data.startsWith('http')) {
        // Open the Stripe onboarding link in a new tab
        window.open(response.data, "_blank");
        setSuccess("Stripe connection process initiated. Please complete the onboarding in the new tab.");
      } else if (response && response.success) {
        setSuccess("Stripe connection initialized. Please check your email to continue the onboarding process.");
      } else if (response && response.message) {
        setSuccess(response.message);
      } else {
        setError("Unable to create Stripe connection. Please try again.");
      }

      // After initiating the connection, refresh payment info to show pending status
      if (response && (response.data || response.success)) {
        // Use setTimeout to ensure UI updates before fetching
        setTimeout(() => {
          fetchPaymentInfo();
        }, 1000);
      }
    } catch (err) {
      console.error("Stripe connection error:", err);
      setError(err.message || "Failed to connect with Stripe. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStripe = async () => {
    if (!projectData || !projectData.id) {
      setError("Project information is missing. Please save your project first.");
      return;
    }

    if (!paymentInfo || !paymentInfo.id) {
      setError("Payment information is missing. Please connect your account first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Use paymentInfo.id instead of projectData.id for updating the onboarding link
      const response = await paymentInfoService.updateOnboardingLink(paymentInfo.id);
      console.log("Onboarding link response:", response);

      if (response && response.data && typeof response.data === 'string' && response.data.startsWith('http')) {
        // Open the Stripe onboarding link in a new tab
        window.open(response.data, "_blank");
        setSuccess("Stripe connection process initiated. Please complete the onboarding in the new tab.");
      } else if (response && response.success) {
        setSuccess("Stripe connection initialized. Please check your email to continue the onboarding process.");
      } else if (response && response.message) {
        setSuccess(response.message);
      } else {
        setError("Unable to continue Stripe connection. Please try again.");
      }

      // After initiating the connection, refresh payment info to show pending status
      if (response && (response.data || response.success)) {
        // Use setTimeout to ensure UI updates before fetching
        setTimeout(() => {
          fetchPaymentInfo();
        }, 1000);
      }
    } catch (err) {
      console.error("Stripe connection error:", err);
      setError(err.message || "Failed to connect with Stripe. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Format date from array format [year, month, day, hour, minute, second, nanosecond]
  const formatDateFromArray = (dateInput) => {
    // If dateInput is null or undefined, return 'Unknown date'
    if (!dateInput) return 'Unknown date';

    // Handle string format: "2025-04-07T22:40:29.614771"
    if (typeof dateInput === 'string') {
      try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return 'Unknown date';
        return date.toLocaleString();
      } catch (error) {
        console.error('Error parsing date string:', error);
        return 'Unknown date';
      }
    }

    // Handle array format: [year, month, day, hour, minute, second, nanosecond]
    if (Array.isArray(dateInput) && dateInput.length >= 6) {
      try {
        const [year, month, day, hour, minute, second] = dateInput;
        // JS months are 0-indexed, but the API returns 1-indexed months
        return new Date(year, month - 1, day, hour, minute, second).toLocaleString();
      } catch (error) {
        console.error('Error parsing date array:', error);
        return 'Unknown date';
      }
    }

    return 'Unknown date';
  };

  // Determine if the account is linked based on the payment info status
  const isAccountLinked = useCallback(() => {
    if (!paymentInfo) return false;
    return paymentInfo.status === 'LINKED';
  }, [paymentInfo]);

  // Check if account is in pending status
  const isAccountPending = useCallback(() => {
    if (!paymentInfo) return false;
    return paymentInfo.status === 'PENDING';
  }, [paymentInfo]);

  // Get status badge color based on payment info status
  const getStatusBadgeColor = useCallback(() => {
    if (!paymentInfo) return 'bg-gray-100 text-gray-800';

    switch (paymentInfo.status) {
      case 'LINKED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [paymentInfo]);

  // Get status text based on payment info
  const getStatusText = useCallback(() => {
    if (!paymentInfo) return 'Not Connected';
    return paymentInfo.status || 'Not Set Up';
  }, [paymentInfo]);

  useEffect(() => {
    // Send current payment info back to parent whenever it changes
    if (paymentInfo && (
      !prevPaymentInfoRef.current ||
      prevPaymentInfoRef.current?.id !== paymentInfo.id ||
      prevPaymentInfoRef.current?.stripeAccountId !== paymentInfo.stripeAccountId ||
      prevPaymentInfoRef.current?.status !== paymentInfo.status
    )) {
      console.log("Sending updated payment info to parent:", paymentInfo);

      // Update the parent with complete payment info including status
      updateFormData(prevData => {
        return {
          ...prevData,
          paymentInfo: {
            ...paymentInfo,
            // Use status directly from the API response
            status: paymentInfo.status
          }
        };
      });

      // Update the ref after sending to parent
      prevPaymentInfoRef.current = paymentInfo;
    }
  }, [paymentInfo, updateFormData]);

  useEffect(() => {
    // Ensure payment info is properly initialized
    if (paymentInfo && Object.keys(paymentInfo).length > 0) {
      console.log("Sending payment info to parent on component init:", paymentInfo);

      // Create a direct copy to avoid reference issues
      const paymentInfoToSend = {
        id: paymentInfo.id,
        stripeAccountId: paymentInfo.stripeAccountId,
        projectId: paymentInfo.projectId,
        createdAt: paymentInfo.createdAt,
        updatedAt: paymentInfo.updatedAt,
        status: paymentInfo.status // Use status directly from API response
      };

      // Send directly to parent without wrapping in paymentInfo object
      updateFormData(paymentInfoToSend);
    }
  }, [paymentInfo])

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h2>

          {/* Error message */}
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
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

          {/* Success message */}
          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
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

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center py-4">
              <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-sm text-gray-600">Loading payment information...</span>
            </div>
          )}

          {/* Current payment status information */}
          {!loading && paymentInfo && (
            <div className="mb-6 bg-blue-50 p-4 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900">Stripe Account Status</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor()}`}>
                  {getStatusText()}
                </span>
              </div>

              <p className="text-sm text-gray-600">
                {isAccountLinked()
                  ? 'Your Stripe account is successfully connected. You can now receive payments.'
                  : isAccountPending()
                    ? 'Your Stripe account setup is pending. Please complete the onboarding process to start receiving payments.'
                    : 'Your Stripe account connection needs to be set up. Connect your account to receive payments.'}
              </p>

              {paymentInfo.stripeAccountId && (
                <p className="text-xs text-gray-600 mt-1">
                  Stripe Account ID: {paymentInfo.stripeAccountId}
                </p>
              )}

              {paymentInfo.id && (
                <p className="text-xs text-gray-600 mt-1">
                  Internal ID: {paymentInfo.id}
                </p>
              )}

              {paymentInfo.projectId && (
                <p className="text-xs text-gray-600 mt-1">
                  Project ID: {paymentInfo.projectId}
                </p>
              )}

              {paymentInfo.createdAt && (
                <p className="text-xs text-gray-600 mt-1">
                  Created: {formatDateFromArray(paymentInfo.createdAt)}
                </p>
              )}

              {paymentInfo.updatedAt && (
                <p className="text-xs text-gray-600 mt-1">
                  Last Updated: {formatDateFromArray(paymentInfo.updatedAt)}
                </p>
              )}

              {/* Show the button for both PENDING status and non-LINKED accounts */}
              {!isAccountLinked() && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleUpdateStripe}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? 'Processing...' : isAccountPending()
                      ? 'Continue Stripe Setup'
                      : 'Connect Stripe Account'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No payment info state */}
          {!loading && !paymentInfo && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payment information set up</h3>
              <p className="mt-1 text-sm text-gray-500">
                Connect your Stripe account to receive payments for your project.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleConnectStripe}
                  disabled={loading || readOnly}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm12 0H5v10h10V5z" clipRule="evenodd" />
                        <path d="M6 7a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H7z" />
                      </svg>
                      Connect with Stripe
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">About Stripe Connect</h3>
            <p className="text-sm text-gray-600">
              Stripe Connect allows you to securely receive payments from backers. Your account information is handled directly by Stripe, ensuring the security of your financial data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

PaymentInformation.propTypes = {
  projectData: PropTypes.object,
  updateFormData: PropTypes.func.isRequired,
  readOnly: PropTypes.bool
};

PaymentInformation.defaultProps = {
  projectData: {},
  readOnly: false
};