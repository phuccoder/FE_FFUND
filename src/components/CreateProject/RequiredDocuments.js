import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Required documents component for project creation
 * @param {Object} props - Component props
 * @param {Object} props.formData - Initial form data
 * @param {Function} props.updateFormData - Function to update parent form state
 * @returns {JSX.Element} Required documents form
 */
export default function RequiredDocuments({ formData, updateFormData }) {
  // Initialize with safe default structure
  const [form, setForm] = useState({
    mandatory: {
      swotAnalysis: formData?.mandatory?.swotAnalysis || null,
      businessModelCanvas: formData?.mandatory?.businessModelCanvas || null,
      businessPlan: formData?.mandatory?.businessPlan || null,
      marketResearch: formData?.mandatory?.marketResearch || null,
      financialInformation: formData?.mandatory?.financialInformation || null,
      projectMedia: Array.isArray(formData?.mandatory?.projectMedia) ? 
        [...formData.mandatory.projectMedia] : []
    },
    optional: {
      customerAcquisitionPlan: formData?.optional?.customerAcquisitionPlan || null,
      revenueProof: formData?.optional?.revenueProof || null,
      visionStrategy: formData?.optional?.visionStrategy || null
    },
    ...formData // Keep any additional fields
  });

  const handleFileChange = (e, category, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (category === 'mandatory' || category === 'optional') {
        setForm({
          ...form,
          [category]: {
            ...form[category],
            [fieldName]: file
          }
        });
        
        updateFormData({
          ...form,
          [category]: {
            ...form[category],
            [fieldName]: file
          }
        });
      } else if (fieldName === 'projectMedia') {
        // Handle multiple files for project media
        const updatedMedia = form.mandatory.projectMedia ? 
          [...form.mandatory.projectMedia, file] : [file];
          
        setForm({
          ...form,
          mandatory: {
            ...form.mandatory,
            projectMedia: updatedMedia
          }
        });
        
        updateFormData({
          ...form,
          mandatory: {
            ...form.mandatory,
            projectMedia: updatedMedia
          }
        });
      }
    }
  };

  const removeMedia = (index) => {
    if (!Array.isArray(form.mandatory.projectMedia)) return;
    
    const newMedia = [...form.mandatory.projectMedia];
    newMedia.splice(index, 1);
    
    setForm({
      ...form,
      mandatory: {
        ...form.mandatory,
        projectMedia: newMedia
      }
    });
    
    updateFormData({
      ...form,
      mandatory: {
        ...form.mandatory,
        projectMedia: newMedia
      }
    });
  };

  const renderFileInput = (category, fieldName, label, description = '') => {
    const fileSelected = category === 'mandatory' || category === 'optional' 
      ? form[category]?.[fieldName] 
      : null;
    
    return (
      <div className="space-y-2">
        <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700">
          {label} {category === 'mandatory' && <span className="text-red-500">*</span>}
        </label>
        
        <div className="flex items-center space-x-3">
          <div className="flex-grow">
            <input
              type="file"
              id={fieldName}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={(e) => handleFileChange(e, category, fieldName)}
              className="sr-only"
            />
            <label
              htmlFor={fieldName}
              className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full inline-flex items-center justify-center"
            >
              <svg className="h-5 w-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {fileSelected ? 'Replace document' : 'Upload document'}
            </label>
          </div>
          
          {fileSelected && (
            <div className="bg-blue-50 rounded-md px-3 py-1 text-sm text-blue-800 flex items-center">
              <svg className="h-5 w-5 mr-1 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              {fileSelected.name}
            </div>
          )}
        </div>
        
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Required Documents</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                These documents help us evaluate the feasibility and legitimacy of your project. All mandatory documents must be uploaded before submission.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Mandatory Documents</h3>
        <div className="space-y-6">
          {renderFileInput('mandatory', 'swotAnalysis', 'SWOT Analysis', 
            'Upload a document that analyzes your project\'s Strengths, Weaknesses, Opportunities, and Threats.')}
          
          {renderFileInput('mandatory', 'businessModelCanvas', 'Business Model Canvas',
            'Upload your business model canvas showing key partners, activities, resources, value propositions, customer relationships, channels, customer segments, cost structure, and revenue streams.')}
          
          {renderFileInput('mandatory', 'businessPlan', 'Business Plan',
            'Upload a comprehensive business plan including executive summary, market analysis, organization structure, product/service line, marketing strategy, and financial projections.')}
          
          {renderFileInput('mandatory', 'marketResearch', 'Market Research & Feasibility Study',
            'Upload your research on target market, competition analysis, and project feasibility assessment.')}
          
          {renderFileInput('mandatory', 'financialInformation', 'Financial Information',
            'Upload documentation showing current cash flow, break-even point, and 3-5 year forecast.')}
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Project Media & Communication Channels <span className="text-red-500">*</span>
            </label>
            
            <div className="flex items-center space-x-3">
              <div className="flex-grow">
                <input
                  type="file"
                  id="projectMedia"
                  accept=".jpg,.jpeg,.png,.gif,.mp4,.mov"
                  onChange={(e) => handleFileChange(e, null, 'projectMedia')}
                  className="sr-only"
                />
                <label
                  htmlFor="projectMedia"
                  className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full inline-flex items-center justify-center"
                >
                  <svg className="h-5 w-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload image or video
                </label>
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              Upload high-quality images or videos that showcase your project, team, prototypes, or previous work.
            </p>
            
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {Array.isArray(form.mandatory.projectMedia) && form.mandatory.projectMedia.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-w-1 aspect-h-1 bg-gray-200 rounded-md overflow-hidden">
                    {file.type?.includes('image') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Project media ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                    ) : file.type?.includes('video') ? (
                      <video
                        src={URL.createObjectURL(file)}
                        controls
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Optional Documents</h3>
        <p className="text-sm text-gray-500 mb-6">
          These documents are not required but can strengthen your project proposal and increase your chances of approval.
        </p>
        
        <div className="space-y-6">
          {renderFileInput('optional', 'customerAcquisitionPlan', 'Customer Acquisition Plan',
            'Upload your marketing and customer acquisition strategy.')}
          
          {renderFileInput('optional', 'revenueProof', 'Transaction & Revenue Proof',
            'Upload documentation showing existing sales, revenue, or customer traction if applicable.')}
          
          {renderFileInput('optional', 'visionStrategy', '5-Year Vision & Strategy',
            'Upload a document outlining your long-term vision and strategy.')}
        </div>
      </div>
    </div>
  );
}

// Add prop type validation
RequiredDocuments.propTypes = {
  formData: PropTypes.object,
  updateFormData: PropTypes.func.isRequired
};

// Default props
RequiredDocuments.defaultProps = {
  formData: {
    mandatory: {
      swotAnalysis: null,
      businessModelCanvas: null,
      businessPlan: null,
      marketResearch: null,
      financialInformation: null,
      projectMedia: []
    },
    optional: {
      customerAcquisitionPlan: null,
      revenueProof: null,
      visionStrategy: null
    }
  }
};