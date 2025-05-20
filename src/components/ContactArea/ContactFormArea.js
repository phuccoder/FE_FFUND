import React, { useState, useRef, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { contactFormArea } from "@/data/contactArea";
import { tokenManager } from "@/utils/tokenManager";
import { requestService } from "src/services/RequestService";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Paperclip, Send, AlertCircle } from "lucide-react";

const { tagline, title } = contactFormArea;

const REQUEST_TYPES = [
  { value: "STRIPE_ACCOUNT", label: "Stripe Account" },
  { value: "CREATE_PROJECT", label: "Create Project" },
  { value: "PROJECT_SUSPEND", label: "Project Suspend" }
];

const ContactFormArea = () => {
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  const [formData, setFormData] = useState({
    requestType: "STRIPE_ACCOUNT",
    title: "",
    description: "",
    attachment: null,
  });
  const [loading, setLoading] = useState(false);

  // Fixed handleChange function using useCallback to prevent re-renders
  const handleChange = useCallback((e) => {
    const { name, value, files } = e.target;

    setFormData((prev) => {
      if (name === "attachment") {
        return { ...prev, attachment: files[0] || null };
      } else {
        return { ...prev, [name]: value };
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await tokenManager.getValidToken();
      if (!token) {
        toast.error("You must be logged in to submit a request.");
        return;
      }

      setLoading(true);
      toast.info("Submitting your request...");

      const requestPayload = {
        requestType: formData.requestType,
        title: formData.title,
        description: formData.description,
      };

      // Get request response
      const requestResponse = await requestService.sendRequest(requestPayload);
      console.log("Request response:", requestResponse); // Debugging

      // Handle both data formats - direct ID or nested ID
      const requestId = requestResponse?.data || requestResponse?.id;

      // Fix the requestId check to handle the numeric value directly
      if (requestId === undefined || requestId === null) {
        throw new Error("Failed to retrieve requestId from response.");
      }

      if (formData.attachment) {
        const formDataObj = new FormData();
        formDataObj.append("file", formData.attachment);
        await requestService.uploadAttachment(requestId, formDataObj);
      }

      toast.success("Request submitted successfully!");

      // Reset form but maintain the same requestType 
      setFormData({
        requestType: formData.requestType,
        title: "",
        description: "",
        attachment: null
      });
    } catch (error) {
      console.error("Request submission error:", error);
      // Improved error handling to show more informative messages
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(`Failed to submit request: ${error.response.data.error}`);
      } else {
        toast.error(`Failed to submit request: ${error.message || "Unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-20 px-4">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-600 mt-2 text-lg">{tagline}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-12 items-stretch bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Left side - Lottie Animation */}
          <div className="w-full md:w-1/2 bg-yellow-50 flex items-center justify-center p-8">
            <div className="w-full h-full max-h-96 rounded-xl overflow-hidden">
              <DotLottieReact
                src="https://lottie.host/10057247-c158-4bc2-bc35-8be90442b710/nzL5AzCeqx.lottie"
                loop
                autoplay
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Right side - Contact Form */}
          <div className="w-full md:w-1/2 p-8">
            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Request Type */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Type</label>
                <select
                  name="requestType"
                  value={formData.requestType}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition bg-white appearance-none pr-10 shadow-sm"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.5em 1.5em" }}
                >
                  {REQUEST_TYPES.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter the title of your request"
                  required
                  ref={titleInputRef}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition bg-white shadow-sm"
                />
              </div>

              {/* Description */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  rows="5"
                  placeholder="Please provide as much detail as possible"
                  value={formData.description}
                  onChange={handleChange}
                  ref={descriptionInputRef}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition bg-white shadow-sm resize-none"
                  required
                ></textarea>
              </div>

              {/* Attachment */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Attachment</label>
                <div className="relative">
                  <input
                    type="file"
                    name="attachment"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="border border-dashed border-yellow-500 bg-yellow-50 rounded-lg p-4 flex items-center justify-center hover:bg-yellow-100 transition-colors">
                    <div className="flex flex-col items-center text-center">
                      <Paperclip className="h-6 w-6 text-yellow-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {formData.attachment ? formData.attachment.name : "Click or drag file to upload"}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports: PDF, DOC, PNG, JPG (max 10MB)
                      </p>
                    </div>
                  </div>
                </div>
                {formData.attachment && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>File selected: {formData.attachment.name}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center shadow-md hover:shadow-lg ${loading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Contact our support team at <span className="text-yellow-600 font-medium">ffundsep490@gmail.com</span></p>
        </div>
      </div>
    </div>
  );
};

export default ContactFormArea;