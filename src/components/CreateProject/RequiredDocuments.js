import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import projectService from 'src/services/projectService';

// Document type mapping for API integration
const DOCUMENT_TYPES = {
  swotAnalysis: 'SWOT_ANALYSIS',
  businessModelCanvas: 'BUSINESS_MODEL_CANVAS',
  businessPlan: 'BUSINESS_PLAN',
  marketResearch: 'MARKET_RESEARCH',
  financialInformation: 'FINANCIAL_PLAN',
  customerAcquisitionPlan: 'CUSTOMER_ACQUISITION_PLAN',
  revenueProof: 'TRANSACTION_PROOF',
  visionStrategy: 'VISION_STRATEGY'
};

/**
 * Required documents component for project creation
 * @param {Object} props - Component props
 * @param {Object} props.formData - Initial form data
 * @param {Function} props.updateFormData - Function to update parent form state
 * @param {number} props.projectId - ID of the project being created/edited
 * @returns {JSX.Element} Required documents form
 */
export default function RequiredDocuments({ formData, updateFormData, projectId }) {
  // Initialize with safe default structure
  const [form, setForm] = useState({
    mandatory: {
      swotAnalysis: formData?.mandatory?.swotAnalysis || null,
      businessModelCanvas: formData?.mandatory?.businessModelCanvas || null,
      businessPlan: formData?.mandatory?.businessPlan || null,
      marketResearch: formData?.mandatory?.marketResearch || null,
      financialInformation: formData?.mandatory?.financialInformation || null
    },
    optional: {
      customerAcquisitionPlan: formData?.optional?.customerAcquisitionPlan || null,
      revenueProof: formData?.optional?.revenueProof || null,
      visionStrategy: formData?.optional?.visionStrategy || null
    },
    projectId: projectId,
    ...formData
  });

  // Track upload status and errors for each document
  const [uploadStatus, setUploadStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [documentUrls, setDocumentUrls] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Load existing documents when editing a project
  useEffect(() => {
    const loadExistingDocuments = async () => {
      if (!projectId) return;

      try {
        setIsLoading(true);
        setGeneralError('');
        const documents = await projectService.getProjectDocumentsByProjectId(projectId);
        setExistingDocuments(Array.isArray(documents) ? documents : []);

        // Map existing documents to form state
        if (documents && documents.length > 0) {
          const updatedForm = { ...form };
          const urls = { ...documentUrls };

          documents.forEach(doc => {
            // Find the form field that corresponds to this document type
            Object.entries(DOCUMENT_TYPES).forEach(([fieldName, docType]) => {
              if (docType === doc.documentType) {
                // Determine if this is a mandatory or optional document
                if (updatedForm.mandatory.hasOwnProperty(fieldName)) {
                  updatedForm.mandatory[fieldName] = {
                    name: doc.documentDescription || 'Uploaded document',
                    documentId: doc.id,
                    uploaded: true
                  };
                  // Store document ID for viewing
                  urls[fieldName] = doc.id;
                } else if (updatedForm.optional.hasOwnProperty(fieldName)) {
                  updatedForm.optional[fieldName] = {
                    name: doc.documentDescription || 'Uploaded document',
                    documentId: doc.id,
                    uploaded: true
                  };
                  // Store document ID for viewing
                  urls[fieldName] = doc.id;
                }
              }
            });
          });

          setForm(updatedForm);
          setDocumentUrls(urls);
          updateFormData(updatedForm);
        }
      } catch (error) {
        console.error('Failed to load existing documents:', error);
        const errorMessage = error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Failed to load existing documents. Please try again.';

        setGeneralError(errorMessage);

        setUploadStatus(prev => ({
          ...prev,
          general: { error: errorMessage }
        }));
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingDocuments();
  }, [projectId]);

  /**
   * Handles document upload to server
   * @param {File} file - File object to upload
   * @param {string} category - Document category ('mandatory' or 'optional')
   * @param {string} fieldName - Field name in the form state
   */
  const uploadDocument = async (file, category, fieldName) => {
    if (!projectId) {
      setUploadStatus(prev => ({
        ...prev,
        [fieldName]: { error: 'Project ID is required to upload documents. Save project first.' }
      }));
      return;
    }

    try {
      setUploadStatus(prev => ({
        ...prev,
        [fieldName]: { loading: true }
      }));

      // 1. Create document metadata
      const documentType = DOCUMENT_TYPES[fieldName];
      if (!documentType) {
        throw new Error(`Unknown document type for field: ${fieldName}`);
      }

      const documentData = {
        documentType,
        documentDescription: file.name
      };

      const createdDocument = await projectService.createProjectDocument(projectId, documentData);

      if (!createdDocument || !createdDocument.id) {
        throw new Error('Failed to create document metadata');
      }

      // 2. Upload the actual file
      const uploadResult = await projectService.uploadDocumentFile(createdDocument.id, file);

      if (!uploadResult) {
        throw new Error('File upload failed');
      }

      // Update form state with successful upload
      const updatedForm = { ...form };
      updatedForm[category][fieldName] = {
        name: file.name,
        documentId: createdDocument.id,
        file, // Keep file reference
        uploaded: true
      };

      // Store document ID for viewing
      setDocumentUrls(prev => ({
        ...prev,
        [fieldName]: createdDocument.id
      }));

      setForm(updatedForm);
      updateFormData(updatedForm);

      setUploadStatus(prev => ({
        ...prev,
        [fieldName]: { success: true }
      }));
    } catch (error) {
      console.error(`Error uploading ${fieldName} document:`, error);
      // Enhanced error extraction
      let errorMessage;

      try {
        // Check if we have a response object with data
        if (error.response?.data) {
          // First try to get the error message directly
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          }
          else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          }
          else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          }
          else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          }
          else {
            errorMessage = `Upload failed: ${error.response.status} ${error.response.statusText}`;
          }
        }
        else if (error.rawResponse) {
          try {
            const parsedResponse = JSON.parse(error.rawResponse);
            errorMessage = parsedResponse.error || parsedResponse.message || 'Unknown upload error';
          } catch (e) {
            errorMessage = error.rawResponse;
          }
        }
        else if (error.message) {
          if (error.message.includes('{') && error.message.includes('}')) {
            try {
              const jsonStart = error.message.indexOf('{');
              const jsonEnd = error.message.lastIndexOf('}') + 1;
              const jsonStr = error.message.substring(jsonStart, jsonEnd);
              const errorObj = JSON.parse(jsonStr);
              errorMessage = errorObj.error || errorObj.message || 'Upload failed';
            } catch (jsonParseError) {
              errorMessage = error.message;
            }
          } else {
            errorMessage = error.message;
          }
        }
        // Fallback error message
        else {
          errorMessage = `Upload failed: ${fieldName} document could not be processed`;
        }
      } catch (errorParsingError) {
        errorMessage = 'An error occurred during file upload';
        console.error('Error while parsing error response:', errorParsingError);
      }

      setUploadStatus(prev => ({
        ...prev,
        [fieldName]: { error: errorMessage }
      }));
    }
  };

  const handleFileChange = async (e, category, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (category === 'mandatory' || category === 'optional') {
        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setUploadStatus(prev => ({
            ...prev,
            [fieldName]: { error: "File size exceeds 10MB limit. Please upload a smaller file." }
          }));
          return;
        }

        // Check file type
        const allowedTypes = [
          'application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg', 'image/png'
        ];

        if (!allowedTypes.includes(file.type)) {
          setUploadStatus(prev => ({
            ...prev,
            [fieldName]: { error: "Invalid file type. Please upload a PDF, Word, Excel, PowerPoint, or image document." }
          }));
          return;
        }

        // Update form state immediately for UI feedback
        setForm({
          ...form,
          [category]: {
            ...form[category],
            [fieldName]: file
          }
        });

        // Start upload process
        await uploadDocument(file, category, fieldName);
      }
    }
  };

  /**
   * Open document in a new tab
   * @param {string} documentId - ID of the document to view
   */
  const openDocument = async (documentId) => {
    if (!documentId) return;

    try {
      // First check if we already have the URL in our existing documents
      const document = existingDocuments.find(doc => doc.id === documentId);

      if (document && document.documentUrl) {
        // We have the URL directly, use it
        window.open(document.documentUrl, '_blank');
        return;
      }

      // If document URLs are stored in form state
      const allDocFields = { ...form.mandatory, ...form.optional };
      for (const field in allDocFields) {
        if (allDocFields[field]?.documentId === documentId && allDocFields[field]?.documentUrl) {
          window.open(allDocFields[field].documentUrl, '_blank');
          return;
        }
      }

      setGeneralError('');
      // Fetch the document URL
      try {
        const documentData = await projectService.getProjectDocumentById(documentId);

        if (documentData && documentData.documentUrl) {
          window.open(documentData.documentUrl, '_blank');
        } else {
          throw new Error('Document URL not found');
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Unable to retrieve document URL';
        setGeneralError(errorMessage);
      }
    } catch (error) {
      console.error('Error opening document:', error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Unable to open document at this time';
      setGeneralError(errorMessage);
    }
  };

  const renderFileInput = (category, fieldName, label, description = '') => {
    const fileSelected = category === 'mandatory' || category === 'optional'
      ? form[category]?.[fieldName]
      : null;

    const status = uploadStatus[fieldName] || {};
    const isUploading = status.loading;
    const isUploaded = status.success || (fileSelected && fileSelected.uploaded);
    const hasError = status.error;
    const documentId = documentUrls[fieldName] || (fileSelected && fileSelected.documentId);


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
              disabled={isUploading}
            />
            <label
              htmlFor={fieldName}
              className={`cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full inline-flex items-center justify-center ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {fileSelected ? 'Replace document' : 'Upload document'}
                </>
              )}
            </label>
          </div>

          {fileSelected && (
            <div className="flex items-center">
              <div className={`rounded-md px-3 py-1 text-sm flex items-center ${isUploaded ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'}`}>
                {isUploaded ? (
                  <svg className="h-5 w-5 mr-1 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 mr-1 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                <span className="truncate max-w-xs">
                  {fileSelected.name || (typeof fileSelected === 'object' && fileSelected.uploaded ? fileSelected.name : 'File selected')}
                </span>
              </div>

              {/* View button - only show for uploaded documents */}
              {isUploaded && documentId && (
                <button
                  type="button"
                  onClick={() => openDocument(documentId)}
                  className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </button>
              )}
            </div>
          )}
        </div>

        {hasError && (
          <p className="text-xs text-red-600 mt-1">{hasError}</p>
        )}

        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {isLoading && (
        <div className="flex justify-center items-center p-4">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-700">Loading documents...</span>
        </div>
      )}

      {!projectId && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Save Project First</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Please save your project before uploading documents. Documents can be uploaded after the project is created.</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
  updateFormData: PropTypes.func.isRequired,
  projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

// Default props
RequiredDocuments.defaultProps = {
  formData: {
    mandatory: {
      swotAnalysis: null,
      businessModelCanvas: null,
      businessPlan: null,
      marketResearch: null,
      financialInformation: null
    },
    optional: {
      customerAcquisitionPlan: null,
      revenueProof: null,
      visionStrategy: null
    }
  }
};