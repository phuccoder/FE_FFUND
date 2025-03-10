import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Payment information form for project creation
 * @param {Object} props - Component props
 * @param {Object} props.formData - Initial form data
 * @param {Function} props.updateFormData - Function to update parent form state
 * @returns {JSX.Element} Payment information form
 */
export default function PaymentInformation({ formData, updateFormData }) {
  // Initialize with safe default values
  const [form, setForm] = useState({
    accountName: formData?.accountName || '',
    accountNumber: formData?.accountNumber || '',
    bankName: formData?.bankName || '',
    swiftCode: formData?.swiftCode || '',
    country: formData?.country || '',
    ...formData // Keep any additional fields
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };

  const handleBlur = () => {
    updateFormData(form);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Payment Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This information is required to transfer funds to you after your campaign succeeds. All information is securely stored and encrypted.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
          Account Holder Name *
        </label>
        <input
          type="text"
          name="accountName"
          id="accountName"
          value={form.accountName || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
          Account Number *
        </label>
        <input
          type="text"
          name="accountNumber"
          id="accountNumber"
          value={form.accountNumber || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
          Bank Name *
        </label>
        <input
          type="text"
          name="bankName"
          id="bankName"
          value={form.bankName || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="swiftCode" className="block text-sm font-medium text-gray-700">
          SWIFT/BIC Code
        </label>
        <input
          type="text"
          name="swiftCode"
          id="swiftCode"
          value={form.swiftCode || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          Required for international transfers.
        </p>
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
          Country *
        </label>
        <select
          id="country"
          name="country"
          value={form.country || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          required
        >
          <option value="">Select a country</option>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="DE">Germany</option>
          <option value="FR">France</option>
          <option value="JP">Japan</option>
          <option value="CN">China</option>
          <option value="IN">India</option>
          <option value="BR">Brazil</option>
          {/* Add more countries as needed */}
        </select>
      </div>

      <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Ensure your banking information is accurate. Incorrect details may delay fund transfers. Platform fees of 5% will be deducted from the total funds raised before disbursement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add prop type validation
PaymentInformation.propTypes = {
  formData: PropTypes.object,
  updateFormData: PropTypes.func.isRequired
};

// Default props
PaymentInformation.defaultProps = {
  formData: {
    accountName: '',
    accountNumber: '',
    bankName: '',
    swiftCode: '',
    country: ''
  }
};