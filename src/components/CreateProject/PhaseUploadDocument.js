import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, Upload, Loader2, FileText, X, Edit, Send } from 'lucide-react';
import PropTypes from 'prop-types';
import { phaseDocumentService } from 'src/services/phaseDocumentService';

export default function PhaseUploadDocument({ phaseId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState('PROGRESS_REPORT');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploaderVisible, setUploaderVisible] = useState(true);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [editingDocument, setEditingDocument] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submittingDocuments, setSubmittingDocuments] = useState(false);
  const formContainerRef = useRef(null);
  const hasProgressReport = uploadedDocuments.some(doc => doc.type === 'PROGRESS_REPORT');
  const hasFundUsageReport = uploadedDocuments.some(doc => doc.type === 'FUND_USAGE_REPORT');
  const canSubmitDocuments = hasProgressReport && hasFundUsageReport;
  
  useEffect(() => {
    if (phaseId) {
      fetchExistingDocuments();
    }
  }, [phaseId]);

  const scrollToTop = () => {
    if (formContainerRef.current) {
      formContainerRef.current.scrollTop = 0;
    }
  };
  
  const fetchExistingDocuments = async () => {
    try {
      const response = await phaseDocumentService.getPhaseDocumentByFounder(phaseId);
      if (response && (response.data || Array.isArray(response))) {
        setUploadedDocuments(response.data || response);
      }
    } catch (error) {
      console.error('Error fetching existing documents:', error);
    }
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (error) setError('');
    }
  };

  const validateInputs = () => {
    if (!isEditMode && !description.trim()) {
      setError('Please provide a document description');
      return false;
    }
    
    if (!file) {
      setError('Please select a file to upload');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return false;
    }

    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a document file (PDF, Word, Excel, PowerPoint, or text)');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    setDocumentUrl('');
    
    try {
      if (isEditMode && editingDocument) {
        const fileFormData = new FormData();
        fileFormData.append('file', file);
        
        const uploadResponse = await phaseDocumentService.updatePhaseDocument(editingDocument.id, fileFormData);

        let documentUrlFromResponse = '';
        if (uploadResponse && uploadResponse.data) {
          documentUrlFromResponse = uploadResponse.data.documentUrl || uploadResponse.data;
        } else if (uploadResponse && typeof uploadResponse === 'object') {
          documentUrlFromResponse = uploadResponse.documentUrl || uploadResponse;
        } else {
          documentUrlFromResponse = uploadResponse;
        }
        
        setDocumentUrl(documentUrlFromResponse);
        setSuccess("Document has been successfully updated!");

        setFile(null);
        setIsEditMode(false);
        setEditingDocument(null);

        fetchExistingDocuments();

        if (onUploadSuccess && typeof onUploadSuccess === 'function') {
          onUploadSuccess(editingDocument.id, documentUrlFromResponse);
        }
      } else {
        const metadataPayload = JSON.stringify({
          type: docType,
          description: description
        });
        
        const createResponse = await phaseDocumentService.createPhaseDocument(phaseId, metadataPayload);

        let documentId;
        if (createResponse && createResponse.data) {
          documentId = createResponse.data.id || createResponse.data;
        } else if (createResponse && typeof createResponse === 'object') {
          documentId = createResponse.id;
        } else {
          documentId = createResponse;
        }
        
        if (!documentId) {
          throw new Error("Failed to get document ID from response");
        }
        
        console.log("Created document with ID:", documentId);

        const fileFormData = new FormData();
        fileFormData.append('file', file);
        
        const uploadResponse = await phaseDocumentService.updatePhaseDocument(documentId, fileFormData);

        let documentUrlFromResponse = '';
        if (uploadResponse && uploadResponse.data) {
          documentUrlFromResponse = uploadResponse.data.documentUrl || uploadResponse.data;
        } else if (uploadResponse && typeof uploadResponse === 'object') {
          documentUrlFromResponse = uploadResponse.documentUrl || uploadResponse;
        } else {
          documentUrlFromResponse = uploadResponse;
        }
        
        setDocumentUrl(documentUrlFromResponse);
        setSuccess("Document has been successfully created and uploaded!");
        setFile(null);
        setDescription('');

        fetchExistingDocuments();
        if (onUploadSuccess && typeof onUploadSuccess === 'function') {
          onUploadSuccess(documentId, documentUrlFromResponse);
        }
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setError(error.message || "An unexpected error occurred during document upload");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAllDocuments = async () => {
    if (!canSubmitDocuments) {
      setError('Both Progress Report and Fund Usage Report are required before submission');
      return;
    }

    try {
      setSubmittingDocuments(true);
      setError('');
      setSuccess('');

      const response = await phaseDocumentService.submitAllPhaseDocuments(phaseId);
      
      console.log("Documents submitted successfully:", response);
      setSuccess("All documents have been successfully submitted for review!");

      await fetchExistingDocuments();

      if (onUploadSuccess && typeof onUploadSuccess === 'function') {
        onUploadSuccess(null, null, true); 
      }
    } catch (error) {
      console.error('Error submitting documents:', error);
      setError(error.message || "An unexpected error occurred during document submission");
    } finally {
      setSubmittingDocuments(false);
    }
  };
  
  // Handle drag and drop functionality
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      if (error) setError('');
    }
  };

  const resetForm = () => {
    setFile(null);
    setDescription('');
    setDocType('PROGRESS_REPORT');
    setError('');
    setSuccess('');
    setDocumentUrl('');
    setIsEditMode(false);
    setEditingDocument(null);

    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
  };

  const handleEditDocument = (doc) => {
    setEditingDocument(doc);
    setDocType(doc.type);
    setDescription(doc.description);
    setIsEditMode(true);
    setFile(null);
    setError('');
    setSuccess('');
    setDocumentUrl('');
    setUploaderVisible(true);

    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';

    scrollToTop();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md h-full flex flex-col" style={{ maxHeight: '80vh' }}>
      <div className="sticky top-0 z-10 bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditMode ? 'Update Document File' : 'Upload Project Document'}
          </h2>
          {isEditMode && (
            <button
              onClick={resetForm}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cancel Edit
            </button>
          )}
          {!uploaderVisible && !isEditMode && (
            <button
              onClick={() => setUploaderVisible(true)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + New Document
            </button>
          )}
        </div>
      </div>
      
      <div ref={formContainerRef} className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start">
            <AlertCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <span className="text-red-700">{error}</span>
            <button 
              className="ml-auto text-red-500 hover:text-red-700"
              onClick={() => setError('')}
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex items-start">
            <CheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" size={16} />
            <span className="text-green-700">{success}</span>
            <button 
              className="ml-auto text-green-500 hover:text-green-700"
              onClick={() => setSuccess('')}
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        {uploaderVisible && (
          <div className="space-y-4">
            {isEditMode && editingDocument && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Updating Document</h3>
                <p className="text-xs text-blue-700">
                  You&apos;re updating the file for an existing document. Type and description cannot be changed.
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEditMode ? 'bg-gray-100' : ''}`}
                disabled={isEditMode}
              >
                <option value="PROGRESS_REPORT">Progress Report</option>
                <option value="FUND_USAGE_REPORT">Fund Usage Report</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description {!isEditMode && '*'}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEditMode ? 'bg-gray-100' : ''}`}
                rows="3"
                placeholder={isEditMode ? "" : "Enter document description"}
                required={!isEditMode}
                readOnly={isEditMode}
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload File *</label>
              <div 
                className={`border-2 border-dashed ${file ? 'border-blue-300 bg-blue-50' : 'border-gray-300'} 
                  rounded-md p-4 text-center cursor-pointer hover:border-blue-500 transition-colors`}
                onClick={() => document.getElementById('fileInput').click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  id="fileInput"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center">
                  {file ? (
                    <>
                      <FileText className="text-blue-500 mb-2" size={24} />
                      <p className="text-sm font-medium text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          document.getElementById('fileInput').value = '';
                        }}
                        className="mt-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="text-gray-400 mb-2" size={24} />
                      <p className="text-sm text-gray-500">
                        {isEditMode 
                          ? "Click to select a new file to replace the existing one" 
                          : "Click to select a file or drag and drop"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Max file size: 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    {isEditMode ? 'Updating...' : 'Uploading...'}
                  </>
                ) : (
                  isEditMode ? 'Update Document' : 'Upload Document'
                )}
              </button>
              
              <button
                onClick={resetForm}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                {isEditMode ? 'Cancel' : 'Reset'}
              </button>
            </div>
          </div>
        )}
        
        {documentUrl && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-sm font-medium text-green-800 mb-2">
              Document Successfully {isEditMode ? 'Updated' : 'Uploaded'}
            </h3>
            <div className="flex">
              <input
                type="text"
                value={documentUrl}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-l-md bg-white"
              />
              <button
                type="button"
                onClick={() => window.open(documentUrl, '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
              >
                Open
              </button>
            </div>
          </div>
        )}

        {uploadedDocuments && uploadedDocuments.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Document Submission Status</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${hasProgressReport ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={`text-sm ${hasProgressReport ? 'text-green-700' : 'text-gray-600'}`}>
                  Progress Report {hasProgressReport ? '✓' : '(required)'}
                </span>
              </div>
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${hasFundUsageReport ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={`text-sm ${hasFundUsageReport ? 'text-green-700' : 'text-gray-600'}`}>
                  Fund Usage Report {hasFundUsageReport ? '✓' : '(required)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {canSubmitDocuments && (
          <div className="mt-6">
            <button
              onClick={handleSubmitAllDocuments}
              disabled={submittingDocuments}
              className="w-full flex justify-center items-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-400"
            >
              {submittingDocuments ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Submitting Documents...
                </>
              ) : (
                <>
                  <Send className="mr-2" size={18} />
                  Submit All Documents for Review
                </>
              )}
            </button>
            <p className="text-xs text-gray-600 text-center mt-2">
              Once submitted, all documents will be reviewed by the administrator.
              You cannot modify documents after submission.
            </p>
          </div>
        )}
        
        {/* Display list of uploaded documents */}
        {uploadedDocuments && uploadedDocuments.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Uploaded Documents</h3>
            <div className="space-y-2">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center">
                    <FileText className="text-gray-500 mr-2" size={18} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {doc.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">{doc.description}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditDocument(doc)}
                      className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
                    >
                      <Edit size={12} className="mr-1" />
                      Update
                    </button>
                    {doc.documentUrl && (
                      <button
                        onClick={() => window.open(doc.documentUrl, '_blank')}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

PhaseUploadDocument.propTypes = {
  phaseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onUploadSuccess: PropTypes.func
};

PhaseUploadDocument.defaultProps = {
  onUploadSuccess: null
};