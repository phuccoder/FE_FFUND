import React, { useState } from 'react';
import ReportProjectForm from './reportProjectForm';

const ReportProjectModal = ({ projectId, isOpen, onClose }) => {
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSuccess = (response) => {
        setIsSuccess(true);
        // Reset success message after 3 seconds and close modal
        setTimeout(() => {
            setIsSuccess(false);
            onClose();
        }, 3000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {isSuccess ? (
                    <div className="p-6 text-center">
                        <div className="mb-4 flex justify-center">
                            <div className="rounded-full bg-green-100 p-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-xl font-medium mb-2">Report Submitted</h3>
                        <p className="text-gray-600 mb-4">Thank you for your report. Our team will review it shortly.</p>
                        <button
                            onClick={onClose}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <ReportProjectForm
                        projectId={projectId}
                        onClose={onClose}
                        onSuccess={handleSuccess}
                    />
                )}
            </div>
        </div>
    );
};

export default ReportProjectModal;