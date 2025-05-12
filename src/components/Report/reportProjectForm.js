import React, { useState } from 'react';
import { reportService } from '../../services/reportService';

const ReportProjectForm = ({ projectId, onClose, onSuccess }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [reportCategory, setReportCategory] = useState('');
    const [reportType, setReportType] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const reportCategories = [
        {
            id: 'CONTENT_VIOLATIONS',
            label: 'Content Violations',
            types: [
                {
                    value: 'OBSCENE_CONTENT',
                    label: 'Obscene Content',
                    description: 'Content that contains explicit or offensive material that violates community standards.'
                },
                {
                    value: 'HATE_SPEECH',
                    label: 'Hate Speech',
                    description: 'Content that promotes hatred, discrimination, or violence against protected groups.'
                },
                {
                    value: 'VIOLENT_CONTENT',
                    label: 'Violent Content',
                    description: 'Content that depicts or promotes violence, gore, or physical harm to individuals.'
                },
                {
                    value: 'HARASSMENT',
                    label: 'Harassment',
                    description: 'Content that targets individuals with abuse, threats, or intimidation.'
                },
            ]
        },
        {
            id: 'INTELLECTUAL_PROPERTY',
            label: 'Intellectual Property Issues',
            types: [
                {
                    value: 'COPYRIGHT_INFRINGEMENT',
                    label: 'Copyright Infringement',
                    description: 'Content that uses copyrighted material without permission from the rights holder.'
                },
                {
                    value: 'PLAGIARISM',
                    label: 'Plagiarism',
                    description: 'Content that copies or closely imitates someone else\'s work without proper attribution.'
                },
            ]
        },
        {
            id: 'MISLEADING_CONTENT',
            label: 'Misleading Content',
            types: [
                {
                    value: 'MISLEADING_INFORMATION',
                    label: 'Misleading Information',
                    description: 'Content that presents false or deceptive information that could mislead users.'
                },
                {
                    value: 'INVALID_INFORMATION',
                    label: 'Invalid Information',
                    description: 'Content that contains factually incorrect information or outdated data.'
                },
                {
                    value: 'PHISHING',
                    label: 'Phishing',
                    description: 'Content that attempts to fraudulently obtain sensitive information from users.'
                },
            ]
        },
        {
            id: 'SPAM_SCAM',
            label: 'Spam & Scams',
            types: [
                {
                    value: 'SPAM',
                    label: 'Spam',
                    description: 'Unsolicited or repetitive content that doesn\'t provide value to the community.'
                },
                {
                    value: 'SCAM',
                    label: 'Scam',
                    description: 'Fraudulent content designed to trick users into giving money or personal information.'
                },
                {
                    value: 'PROHIBITED_ITEMS',
                    label: 'Prohibited Items',
                    description: 'Content that offers illegal items or services for sale or distribution.'
                },
            ]
        },
        {
            id: 'OTHER',
            label: 'Other Issues',
            types: [
                {
                    value: 'OTHER',
                    label: 'Other',
                    description: 'Any other issue not covered by the categories above. Please provide details in your description.'
                },
            ]
        }
    ];

    // Flatten all report types for easy lookup
    const allReportTypes = reportCategories.flatMap(category => category.types);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(''); // Xóa lỗi trước khi gửi

        try {
            // Step 1: Submit report
            const reportData = { title, description };
            const response = await reportService.submitReport(projectId, reportType, reportData);

            // Step 2: Upload attachment if selected
            if (attachment && response.data && response.data.id) {
                await reportService.uploadAttachment(response.data.id, attachment);
            }

            setLoading(false);
            onSuccess && onSuccess(response);
        } catch (err) {
            setLoading(false);

            if (err.response && err.response.status === 403) {
                const message = err.response.data?.message || 'You need to log in to perform this action.';
                setError(message); 
            } else if (err.response && err.response.data?.message === 'You can only submit one report per project per day') {
                setError('You can only submit one report per project per day');
            } else {
                setError('Failed to submit report. Please try again.'); 
            }
        }
    };

    const goToNextStep = () => {
        if (currentStep === 1 && !reportCategory) {
            setError('Please select a report category');
            return;
        }
        if (currentStep === 2 && !reportType) {
            setError('Please select a report type');
            return;
        }
        setError('');
        setCurrentStep(currentStep + 1);
    };

    const goToPreviousStep = () => {
        // When going back from report type selection to category selection
        if (currentStep === 2) {
            setReportType('');
        }
        setCurrentStep(currentStep - 1);
        setError('');
    };

    // Get the selected category's report types
    const getReportTypesForCategory = () => {
        const category = reportCategories.find(cat => cat.id === reportCategory);
        return category ? category.types : [];
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Report Project</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep >= 1 ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>1</div>
                        <div className={`h-1 w-12 ${currentStep >= 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    </div>
                    <div className="flex items-center">
                        <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep >= 2 ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>2</div>
                        <div className={`h-1 w-12 ${currentStep >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    </div>
                    <div className="flex items-center">
                        <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep >= 3 ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>3</div>
                        <div className={`h-1 w-12 ${currentStep >= 4 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    </div>
                    <div className="flex items-center">
                        <div className={`rounded-full h-8 w-8 flex items-center justify-center ${currentStep >= 4 ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>4</div>
                    </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Category</span>
                    <span>Issue Type</span>
                    <span>Details</span>
                    <span>Review</span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Step 1: Choose Report Category */}
                {currentStep === 1 && (
                    <div>
                        <h3 className="font-medium mb-4">What category of issue are you reporting?</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {reportCategories.map((category) => (
                                <div
                                    key={category.id}
                                    onClick={() => setReportCategory(category.id)}
                                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${reportCategory === category.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${reportCategory === category.id ? 'border-green-500' : 'border-gray-300'}`}>
                                            {reportCategory === category.id && (
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            )}
                                        </div>
                                        <span className="ml-2">{category.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={goToNextStep}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Choose Report Type */}
                {currentStep === 2 && (
                    <div>
                        <h3 className="font-medium mb-4">Select the specific issue type:</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {getReportTypesForCategory().map((type) => (
                                <div
                                    key={type.value}
                                    onClick={() => setReportType(type.value)}
                                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${reportType === type.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className="flex items-center mb-1">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${reportType === type.value ? 'border-green-500' : 'border-gray-300'}`}>
                                            {reportType === type.value && (
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            )}
                                        </div>
                                        <span className="ml-2 font-medium">{type.label}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 ml-7">{type.description}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-between">
                            <button
                                type="button"
                                onClick={goToPreviousStep}
                                className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={goToNextStep}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Report Details */}
                {currentStep === 3 && (
                    <div>
                        <h3 className="font-medium mb-4">Provide details about the issue</h3>

                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Brief title of the issue"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                                placeholder="Please provide detailed information about the issue"
                                required
                            ></textarea>
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2">Attachment (Optional)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className="mt-2 text-sm text-gray-500">
                                        {attachment ? attachment.name : 'Click to upload or drag and drop'}
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 10MB</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between">
                            <button
                                type="button"
                                onClick={goToPreviousStep}
                                className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={goToNextStep}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                                disabled={!title || !description}
                            >
                                Review
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Review and Submit */}
                {currentStep === 4 && (
                    <div>
                        <h3 className="font-medium mb-4">Review your report</h3>

                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <div className="mb-4">
                                <h4 className="text-sm text-gray-500">Category</h4>
                                <p className="font-medium">
                                    {reportCategories.find(c => c.id === reportCategory)?.label}
                                </p>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-sm text-gray-500">Issue Type</h4>
                                <p className="font-medium">
                                    {allReportTypes.find(t => t.value === reportType)?.label}
                                </p>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-sm text-gray-500">Title</h4>
                                <p className="font-medium">{title}</p>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-sm text-gray-500">Description</h4>
                                <p className="whitespace-pre-wrap">{description}</p>
                            </div>

                            {attachment && (
                                <div>
                                    <h4 className="text-sm text-gray-500">Attachment</h4>
                                    <p className="font-medium">{attachment.name}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-between">
                            <button
                                type="button"
                                onClick={goToPreviousStep}
                                className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Report'
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default ReportProjectForm;