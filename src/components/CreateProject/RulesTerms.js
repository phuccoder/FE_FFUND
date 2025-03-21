import React, { useState } from 'react';

/**
 * Component for displaying project rules and terms with agreement checkbox
 * @param {boolean} props.formData - Whether terms were previously agreed to
 * @param {Function} props.updateFormData - Function to update parent form state
 * @returns {JSX.Element} Rules and terms component with agreement checkbox
 */
export default function RulesTerms({ formData, updateFormData }) {
  // Ensure we're using formData as a boolean value
  const [agreed, setAgreed] = useState(Boolean(formData));

  const handleChange = (e) => {
    setAgreed(e.target.checked);
    updateFormData(e.target.checked);
  };

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Please read the following rules and terms carefully. Violations may result in account suspension or deletion. Fraudulent activities could lead to legal consequences.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4">
        <h3 className="font-medium text-gray-900">Platform Rules & Guidelines</h3>
        
        <div className="text-sm text-gray-700 space-y-3">
          <p>By creating a project, you agree to comply with the following:</p>
          
          <ol className="list-decimal pl-5 space-y-2">
            <li>All information provided must be accurate and truthful.</li>
            <li>Your project must comply with all applicable laws and regulations.</li>
            <li>You must have the legal right to create and manage the project.</li>
            <li>You agree to fulfill all promised rewards or refund backers accordingly.</li>
            <li>You must communicate regularly with your backers about project progress.</li>
            <li>You are responsible for all taxes and legal obligations related to your funding.</li>
            <li>Prohibited projects include those involving illegal activities, offensive content, personal fundraising, and prohibited items.</li>
            <li>The platform reserves the right to remove any project that violates these terms.</li>
            <li>Platform fees of 4% will be deducted from successful campaigns (additional payment processing fees may apply).</li>
            <li>You agree to provide additional verification if requested by our team.</li>
          </ol>
          
          <p className="font-medium">Fraud Warning:</p>
          <p>Fraudulent activities, including misrepresentation of projects, misuse of funds, or creating fake campaigns will be reported to relevant legal authorities and may result in permanent banning from the platform.</p>
        </div>
      </div>

      <div className="flex items-start">
        <div className="flex-shrink-0">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            checked={agreed}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="terms" className="font-medium text-gray-700">
            I have read and agree to the platform rules and terms
          </label>
          <p className="text-gray-500">
            You must agree to these terms before creating your project. {new Date().toISOString().split('T')[0]} (Today)
          </p>
        </div>
      </div>
    </div>
  );
}