import React, { useState, useEffect } from 'react';

/**
 * Component for displaying project rules and terms with agreement checkbox
 * @param {boolean} props.formData - Whether terms were previously agreed to
 * @param {Function} props.updateFormData - Function to update parent form state
 * @returns {JSX.Element} Rules and terms component with agreement checkbox
 */
export default function RulesTerms({ formData, updateFormData }) {
  // Initialize agreed state from localStorage or fallback to formData
  const [agreed, setAgreed] = useState(() => {
    const savedAgreement = localStorage.getItem('agreedToTerms');
    return savedAgreement ? JSON.parse(savedAgreement) : Boolean(formData);
  });

  // Handle checkbox change
  const handleChange = (e) => {
    const isChecked = e.target.checked;
    setAgreed(isChecked);
    updateFormData({isChecked });
    localStorage.setItem('agreedToTerms', JSON.stringify(isChecked));
  };

  useEffect(() => {
    // Sync state with localStorage on mount
    const savedAgreement = localStorage.getItem('agreedToTerms');
    if (savedAgreement) {
      setAgreed(JSON.parse(savedAgreement));
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Warning Section */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-md shadow-md">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-2xl font-bold text-red-600">Warning</h3>
            <p className="mt-2 text-base text-yellow-700">
              Please read the following rules and terms carefully. Violations may result in account suspension or deletion. Fraudulent activities could lead to legal consequences.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Section */}
      <div className="bg-white border border-gray-200 rounded-md p-6 shadow-md">
        <h3 className="text-xl font-bold text-gray-900">Platform Rules & Guidelines</h3>
        <div className="mt-4 text-base text-gray-700 space-y-4">
          <p>By creating a project, you agree to follow these simple rules:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Be honest - all project information must be truthful.</li>
            <li>Follow the law - your project must be legal.</li>
            <li>Own your project - you must have rights to create it.</li>
            <li>Deliver rewards - fulfill what you promise to backers.</li>
            <li>Keep backers updated - share regular progress updates.</li>
            <li>Handle your taxes - you&apos;re responsible for any tax obligations.</li>
            <li>No prohibited content - no illegal activities, offensive content, personal fundraising, or banned items.</li>
            <li>We can remove projects - if they break our rules.</li>
            <li>Verify when asked - provide extra verification if we request it.</li>
          </ol>
          <p className="font-medium text-red-500 mt-3">Warning:</p>
          <p>
            Dishonest behavior (fake projects, misusing funds, creating fake campaigns) will get you banned and reported to authorities.
          </p>
        </div>
      </div>

      {/* Agreement Section */}
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            checked={agreed}
            onChange={handleChange}
            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        <div className="ml-4 text-base">
          <label htmlFor="terms" className="font-medium text-gray-700">
            I have read and agree to the platform rules and terms
          </label>
          <p className="text-gray-500 italic">
            You must agree to these terms before creating your project. {new Date().toISOString().split('T')[0]} (Today)
          </p>
        </div>
      </div>
    </div>
  );
}