import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { contactFormArea } from "@/data/contactArea";
import { requestService } from "src/services/RequestService";
import { tokenManager } from "@/utils/tokenManager";

const { tagline, title } = contactFormArea;

const ContactFormArea = () => {
  const [formData, setFormData] = useState({
    requestType: "REPORT_BUG",
    title: "",
    description: "",
    attachment: null,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment") {
      setFormData((prev) => ({ ...prev, attachment: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = tokenManager.getValidToken();
    if (!token) {
      toast.error("You must be logged in to submit a request.");
      return;
    }

    try {
      setLoading(true);
      toast.info("Submitting your request...");

      const requestPayload = {
        requestType: formData.requestType,
        title: formData.title,
        description: formData.description,
      };
      const requestResponse = await requestService.sendRequest(requestPayload);

      const requestId = requestResponse?.data?.id;
      if (!requestId) throw new Error("Failed to retrieve requestId.");

      if (formData.attachment) {
        const formDataObj = new FormData();
        formDataObj.append("file", formData.attachment);
        await requestService.uploadAttachment(requestId, formDataObj);
      }

      toast.success("Request submitted successfully!");
      setFormData({ requestType: "REPORT_BUG", title: "", description: "", attachment: null });
    } catch (error) {
      toast.error("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <ToastContainer />
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-center text-gray-800">{title}</h2>
        <p className="text-gray-500 text-center mb-6">{tagline}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Request Type</label>
            <select
              name="requestType"
              value={formData.requestType}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            >
              <option value="REPORT_BUG">Report a Bug</option>
              <option value="INVESTMENT">Investment</option>
              <option value="CREATE_PROJECT">Create Project</option>
              <option value="REWARD_SHIPPING">Reward Shipping</option>
              <option value="CHOOSE_MILESTONE">Choose Milestone</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              placeholder="Enter the title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows="5"
              placeholder="Enter the description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              required
            ></textarea>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload Attachment</label>
            <input
              type="file"
              name="attachment"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handleChange}
              className="w-full border border-dashed border-orange-500 p-3 rounded-lg bg-orange-100 text-gray-700 cursor-pointer"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactFormArea;
