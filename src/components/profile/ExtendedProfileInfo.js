import { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Spinner, Modal } from 'react-bootstrap';
import { 
  getUserExtendedInfo,
  uploadStudentPortfolio 
} from '../../services/userService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ExtendedProfileInfo() {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [portfolioFileName, setPortfolioFileName] = useState('');
  const [currentPortfolio, setCurrentPortfolio] = useState('');
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  
  // Simplified form data - removed studentClass
  const [formData, setFormData] = useState({
    studentCode: '',
    exeClass: 'EXE101',
    fptFacility: 'CAN_THO'
  });

  const facilities = [
    { value: 'HO_CHI_MINH', label: 'Ho Chi Minh' },
    { value: 'HA_NOI', label: 'Ha Noi' },
    { value: 'DA_NANG', label: 'Da Nang' },
    { value: 'CAN_THO', label: 'Can Tho' },
    { value: 'QUY_NHON', label: 'Quy Nhon' }
  ];

  const exeClasses = [
    { value: 'EXE101', label: 'EXE101' },
    { value: 'EXE201', label: 'EXE201' },
    { value: 'EXE301', label: 'EXE301' },
    { value: 'EXE401', label: 'EXE401' }
  ];

  useEffect(() => {
    const fetchExtendedUserData = async () => {
      try {
        setLoading(true);
        const userData = await getUserExtendedInfo();
        
        // Just display the user data without setting isNewUser
        setFormData({
          studentCode: userData.studentCode || '',
          exeClass: userData.exeClass || 'EXE101',
          fptFacility: userData.fptFacility || 'CAN_THO'
        });
        setCurrentPortfolio(userData.studentPortfolio || '');
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching extended user data:', error);
        toast.error('Failed to load profile information');
        setLoading(false);
      }
    };

    fetchExtendedUserData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed for portfolio upload');
        return;
      }
      
      setPortfolioFile(file);
      setPortfolioFileName(file.name);
    }
  };

  const handlePortfolioUpload = async () => {
    if (!portfolioFile) {
      toast.error('Please select a PDF file first');
      return;
    }
    
    try {
      setUploading(true);
      
      const result = await uploadStudentPortfolio(portfolioFile);
      
      toast.success('Portfolio uploaded successfully');
      
      // Clear file selection after successful upload
      setPortfolioFile(null);
      setPortfolioFileName('');
      setCurrentPortfolio(result.studentPortfolio);
    } catch (error) {
      toast.error('Failed to upload portfolio. Please try again.');
      console.error('Error uploading portfolio:', error);
    } finally {
      setUploading(false);
    }
  };

  const togglePdfViewer = () => {
    console.log('Toggling PDF viewer:', !showPdfViewer);
    setShowPdfViewer(!showPdfViewer);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner animation="border" style={{ color: '#FF8C00' }} />
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      
      <Row>
        <Col md={12}>
          <Card className="shadow border-0 mb-4">
            <Card.Body>
              <h4 className="text-xl font-bold mb-4" style={{ color: '#FF8C00' }}>
                Founder Information
              </h4>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Student Code</Form.Label>
                    <Form.Control
                      type="text"
                      name="studentCode"
                      value={formData.studentCode}
                      readOnly
                      style={{ borderColor: '#ddd', padding: '0.625rem', backgroundColor: '#f9f9f9' }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>EXE Class</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.exeClass}
                      readOnly
                      style={{ borderColor: '#ddd', padding: '0.625rem', backgroundColor: '#f9f9f9' }}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>FPT Facility</Form.Label>
                    <Form.Control
                      type="text"
                      value={facilities.find(f => f.value === formData.fptFacility)?.label || formData.fptFacility}
                      readOnly
                      style={{ borderColor: '#ddd', padding: '0.625rem', backgroundColor: '#f9f9f9' }}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          {/* Portfolio Upload Section - Kept intact */}
          <Card className="shadow border-0">
            <Card.Body>
              <h4 className="text-xl font-bold mb-4" style={{ color: '#FF8C00' }}>
                Student Portfolio
              </h4>
              
              {currentPortfolio && (
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-2">
                    <h5 className="mb-0 mr-3">Current Portfolio:</h5>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <Button
                      onClick={togglePdfViewer}
                      style={{ 
                        backgroundColor: '#FF8C00', 
                        borderColor: '#FF8C00', 
                        padding: '0.5rem 1rem'
                      }}
                    >
                      View Portfolio
                    </Button>
                    
                    <Button
                      variant="outline-secondary"
                      href={currentPortfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        padding: '0.5rem 1rem'
                      }}
                    >
                      Download Portfolio
                    </Button>
                  </div>
                  
                  {/* PDF Preview Area - shows a thumbnail of the PDF */}
                  {currentPortfolio && (
                    <div className="mt-3 border p-2 d-inline-block">
                      <div style={{ 
                        height: '120px', 
                        width: '85px', 
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #ddd'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '2rem', color: '#dc3545' }}>
                            <i className="bi bi-file-earmark-pdf"></i>
                          </div>
                          <div style={{ fontSize: '0.7rem' }}>
                            Portfolio PDF
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <Form.Group className="mb-3">
                <Form.Label>Upload your portfolio (PDF only)</Form.Label>
                <div className="d-flex align-items-center">
                  <Form.Control
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ borderColor: '#ddd', padding: '0.5rem' }}
                  />
                  <Button 
                    onClick={handlePortfolioUpload}
                    disabled={uploading || !portfolioFile}
                    style={{ 
                      backgroundColor: '#FF8C00', 
                      borderColor: '#FF8C00', 
                      marginLeft: '10px',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    {uploading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="mr-2" />
                        Uploading...
                      </>
                    ) : 'Upload'}
                  </Button>
                </div>
                {portfolioFileName && (
                  <div className="mt-2">
                    <strong>Selected file:</strong> {portfolioFileName}
                  </div>
                )}
                <Form.Text className="text-muted">
                  Please upload your portfolio in PDF format. Maximum file size: 20MB.
                </Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* PDF Viewer Modal - Kept intact */}
      <Modal 
        show={showPdfViewer} 
        onHide={togglePdfViewer} 
        size="lg" 
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Portfolio Viewer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ height: '70vh' }}>
            {currentPortfolio && (
              <iframe
                src={`${currentPortfolio}#toolbar=1`}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title="Student Portfolio"
                loading="lazy"
              />
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={togglePdfViewer}
          >
            Close
          </Button>
          <Button
            style={{ 
              backgroundColor: '#FF8C00', 
              borderColor: '#FF8C00'
            }}
            href={currentPortfolio}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}