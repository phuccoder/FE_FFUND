import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import Layout from '@/components/Layout/Layout';
import Link from '../Reuseable/Link';
import { paymentInfoService } from 'src/services/paymentInformationService';

/**
 * Stripe onboarding callback page
 * Handles the redirect after a user completes Stripe's onboarding process
 */
export default function StripeOnboard() {
    const router = useRouter();
    const { id } = router.query;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [refreshUrl, setRefreshUrl] = useState(null);

    // Process the callback when the component mounts and has query params
    useEffect(() => {
        const verifyOnboarding = async () => {
            if (!id) return;

            try {
                setLoading(true);
                
                // Make a single API call to verify onboarding
                const response = await paymentInfoService.verifyOnboarding(id);
                console.log("Verification response:", response);

                // Check if the onboarding was successful based on the specific response format
                // { "status": 200, "message": "Account have been linked to our platform successfully" }
                if (response && 
                    (response.status === 200 || 
                     response.status === 'LINKED' || 
                     response.data?.status === 'LINKED' || 
                     response.success)) {
                    
                    setSuccess(true);
                    // Set success message if available in the response
                    if (response.message) {
                        setSuccessMessage(response.message);
                    }
                    // Don't get refresh URL on success - early return
                    return;
                } else {
                    // Only get refresh URL if verification was not successful
                    setError('Your Stripe account verification is pending or incomplete.');
                    await getRefreshUrl(id);
                }
            } catch (err) {
                console.error('Error processing Stripe callback:', err);
                setError(err.message || 'Failed to verify your Stripe account. Please try again.');
                
                // Only try to get refresh URL if verification failed
                await getRefreshUrl(id);
            } finally {
                setLoading(false);
            }
        };

        // Separate function to get refresh URL to avoid code duplication
        const getRefreshUrl = async (paymentInfoId) => {
            try {
                const refreshResponse = await paymentInfoService.refreshOnboardingLink(paymentInfoId);
                if (refreshResponse && refreshResponse.data) {
                    setRefreshUrl(refreshResponse.data);
                }
            } catch (refreshErr) {
                console.error('Error getting refresh link:', refreshErr);
                // Don't override the main error
            }
        };

        if (router.isReady && id) {
            verifyOnboarding();
        } else if (router.isReady) {
            setLoading(false);
            setError('Missing payment information ID. Please try connecting your account again.');
        }
    }, [id, router.isReady]);

    // Navigate to refresh URL if available
    const handleRefresh = () => {
        if (refreshUrl) {
            window.location.href = refreshUrl;
        } else if (id) {
            // If no refresh URL is available, try to get one
            setLoading(true);
            paymentInfoService.refreshOnboardingLink(id)
                .then(response => {
                    if (response && response.data) {
                        window.location.href = response.data;
                    } else {
                        setError('Unable to generate a Stripe connection link. Please try again later.');
                        setLoading(false);
                    }
                })
                .catch(err => {
                    setError('Failed to refresh your Stripe connection. Please try again from the project creation page.');
                    setLoading(false);
                });
        }
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Stripe Account Setup
                    </h2>

                    <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-6">
                                <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p className="mt-4 text-sm text-gray-500">Verifying your Stripe account...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-6">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="mt-3 text-lg font-medium text-red-800">Account Setup Error</h3>
                                <p className="mt-2 text-sm text-gray-500">{error}</p>

                                {refreshUrl && (
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            onClick={handleRefresh}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}

                                <div className="mt-4">
                                    <Link href="/create-project">
                                        <a className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                            Continue to Create Project
                                        </a>
                                    </Link>
                                </div>
                            </div>
                        ) : success ? (
                            <div className="text-center py-6">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="mt-3 text-lg font-medium text-gray-900">Account Setup Complete</h3>
                                <p className="mt-2 text-sm text-gray-500">
                                    {successMessage || 'Your Stripe account has been successfully linked to our platform. You can now receive payments for your project.'}
                                </p>
                                <div className="mt-6">
                                    <Link href="/create-project">
                                        <a className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                            Continue to Create Project
                                        </a>
                                    </Link>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </Layout>
    );
}