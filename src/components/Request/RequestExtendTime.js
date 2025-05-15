import { useState, useEffect } from "react";
import { requestService } from "../../services/requestService";
import { globalSettingService } from "../../services/globalSettingService";

export default function ExtendTimeRequestForm() {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: "", type: "" });
    const [maxSuspendedTime, setMaxSuspendedTime] = useState(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);

    // Fetch max suspended time from global settings
    useEffect(() => {
        const fetchMaxSuspendedTime = async () => {
            setIsLoadingSettings(true);
            try {
                const response = await globalSettingService.getGlobalSettingByType('MAX_SUSPENDED_TIME');
                
                if (response && response.data && response.data.length > 0) {
                    const setting = response.data[0];
                    const timeValue = parseInt(setting.value);
                    
                    if (!isNaN(timeValue)) {
                        console.log(`Setting max suspended time to ${timeValue} days`);
                        setMaxSuspendedTime(timeValue);
                    } else {
                        console.warn('Invalid MAX_SUSPENDED_TIME value received');
                        setMaxSuspendedTime(5); // Default fallback
                    }
                } else {
                    console.warn('No MAX_SUSPENDED_TIME setting found, using default');
                    setMaxSuspendedTime(5); // Default fallback
                }
            } catch (error) {
                console.error('Error fetching MAX_SUSPENDED_TIME setting:', error);
                setMaxSuspendedTime(5); // Default fallback on error
            } finally {
                setIsLoadingSettings(false);
            }
        };

        fetchMaxSuspendedTime();
    }, []);

    const toggleForm = () => {
        if (isFormOpen) {
            resetForm();
        }
        setIsFormOpen(!isFormOpen);
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setNotification({ show: false, message: "", type: "" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Gửi request với body chứa title và description
            const requestBody = { title, description };
            await requestService.sendExtendTimeRequest(requestBody);

            setNotification({
                show: true,
                message: "Extend time request has been successfully submitted!",
                type: "success",
            });

            setTimeout(() => {
                resetForm();
            }, 2000);
        } catch (error) {
            setNotification({
                show: true,
                message: `Error: ${error.message}`,
                type: "error",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl">
            {/* Toggle Button */}
            <button
                onClick={toggleForm}
                className={`flex items-center justify-center px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-md ${isFormOpen
                        ? "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500"
                        : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                    }`}
            >
                {isFormOpen ? (
                    <>
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                        Cancel Extend Time Request
                    </>
                ) : (
                    <>
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Submit Extend Time Request
                    </>
                )}
            </button>

            {/* Form Content */}
            {isFormOpen && (
                <div className="mt-4 bg-white rounded-lg shadow-md border border-gray-200 p-6 transition-all duration-300">
                    {/* Form Header */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900">Extend Time Request</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Please fill in the details below to submit your extend time request.
                            {maxSuspendedTime !== null && (
                                <span className="font-medium"> 
                                    Maximum allowed extension time is {maxSuspendedTime} days.
                                </span>
                            )}
                            {isLoadingSettings && (
                                <span className="ml-2 inline-flex items-center text-gray-500">
                                    <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Loading settings...
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Notification */}
                    {notification.show && (
                        <div
                            className={`p-4 mb-4 rounded-md ${notification.type === "success"
                                    ? "bg-green-50 text-green-800"
                                    : "bg-red-50 text-red-800"
                                }`}
                        >
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    {notification.type === "success" ? (
                                        <svg
                                            className="h-5 w-5 text-green-400"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    ) : (
                                        <svg
                                            className="h-5 w-5 text-red-400"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm">{notification.message}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="title"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter request title"
                                required
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="description"
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter request description"
                                required
                                rows={4}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            {maxSuspendedTime !== null && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Please provide a clear explanation for why you need an extension (up to {maxSuspendedTime} days). 
                                    Include any relevant information that will help with the approval process.
                                </p>
                            )}
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                                    }`}
                            >
                                {isLoading ? (
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                ) : null}
                                {isLoading ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}