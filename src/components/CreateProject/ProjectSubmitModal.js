import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Link from '@/components/Reuseable/Link';

export default function ProjectSubmitModal({ isOpen, onClose, onSubmit, isSubmitting, status }) {
    const [countdown, setCountdown] = useState(4);
    const [redirecting, setRedirecting] = useState(false);

    useEffect(() => {
        let timer;
        if (status === 'success' && countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        } else if (status === 'success' && countdown === 0) {
            setRedirecting(true);
            setTimeout(() => {
                window.location.href = "/edit-project";
            }, 500);
        }

        return () => {
            clearTimeout(timer);
        };
    }, [status, countdown]);

    if (!isOpen) return null;

    // Success view with enhanced visual emphasis
    if (status === 'success') {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity"></div>

                <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                    <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:max-w-2xl w-full">
                        {/* Success header */}
                        <div className="bg-green-50 px-6 py-4 border-b border-green-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-medium text-green-800 flex items-center">
                                    <svg className="h-6 w-6 text-green-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Submission Successful
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                                >
                                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white px-6 py-5">
                            <div className="flex items-start">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-green-100 sm:mx-0 sm:h-16 sm:w-16">
                                    <svg className="h-10 w-10 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="ml-6 flex-1">
                                    <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                                        Your project has been submitted
                                    </h2>
                                    <p className="text-gray-600">
                                        Thank you for submitting your project to FFUND. Our team will carefully review your submission and provide feedback within <span className="font-semibold text-gray-800">2-7 business days</span>.
                                    </p>

                                    <div className="mt-6 bg-blue-50 border border-blue-100 rounded-md p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-blue-800">What happens next?</h3>
                                                <div className="mt-2 text-sm text-blue-700">
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        <li>Our team will <span className="font-medium">review your project details</span></li>
                                                        <li>You&apos;ll receive an <span className="font-medium">email notification</span> with the review outcome</li>
                                                        <li>If <span className="font-medium text-green-700">approved</span>, your first phase will begin immediately</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="ml-3">
                                            <span className="text-sm font-medium text-green-800">Review in progress</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center">
                            <div className="mb-3 sm:mb-0 text-sm text-gray-500 flex items-center">
                                {redirecting ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Redirecting...
                                    </span>
                                ) : (
                                    <span>Redirecting to your project in <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 font-semibold ml-1">{countdown}</span></span>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.location.href = "/"}
                                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Go to Dashboard Now
                                </button>
                                <button
                                    onClick={() => window.location.href = "/edit-project"}
                                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Go to Project Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity"></div>

            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:max-w-3xl w-full">
                    {/* Header */}
                    <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-medium text-blue-800 flex items-center">
                                <svg className="h-6 w-6 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Project Submission
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white px-6 py-5">
                        <div className="flex items-start">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-full bg-blue-100 sm:mx-0 sm:h-14 sm:w-14">
                                <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </div>
                            <div className="ml-6 flex-1">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                                    Submit Your Project to FFUND
                                </h2>
                                <p className="text-gray-600">
                                    Thank you for completing your project setup. Before finalizing your submission, please review the following <span className="font-semibold">important information</span>:
                                </p>

                                <div className="mt-6 space-y-5">
                                    <div className="bg-gray-50 border-l-4 border-blue-500 rounded-md p-4">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Project Editing Restrictions</h4>
                                        <p className="text-sm text-gray-600">
                                            After submission, you will <span className="font-bold text-red-600">not be able to modify</span> your project details, except adding milestones and rewards for future phases.
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 border-l-4 border-blue-500 rounded-md p-4">
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Review Process</h4>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Our team will evaluate your project within <span className="font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">2-7 business days</span>. If approved, your first phase will begin immediately.
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Projects with exceptional potential will receive a <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">Potential</span> badge, increasing visibility to investors.
                                        </p>
                                    </div>

                                    <div className="bg-amber-50 border-l-4 border-amber-500 rounded-md p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-bold text-amber-800">Rejection Policy</h3>
                                                <div className="mt-2 text-sm text-amber-700">
                                                    <p>
                                                        If <span className="font-bold text-red-700">rejected</span>, you may be given the opportunity to <span className="font-medium">revise and resubmit</span>. However, projects that significantly lack quality or required information may be <span className="font-bold">permanently discontinued</span>.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center">
                                    <input
                                        id="terms-agreement"
                                        name="terms-agreement"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        defaultChecked={true}
                                    />
                                    <label htmlFor="terms-agreement" className="ml-2 block text-sm text-gray-900">
                                        I confirm that I have read and agree to the <span className="font-medium text-blue-700">submission terms and conditions</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - FIXED HERE */}
                    <div className="bg-gray-50 px-6 py-4 flex justify-end">
                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="w-24 h-9 flex justify-center items-center px-4 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onSubmit}
                                disabled={isSubmitting}
                                className={`w-24 h-9 flex justify-center items-center px-4 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    'Submit'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

ProjectSubmitModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    isSubmitting: PropTypes.bool,
    status: PropTypes.oneOf(['confirm', 'success'])
};

ProjectSubmitModal.defaultProps = {
    isSubmitting: false,
    status: 'confirm'
};