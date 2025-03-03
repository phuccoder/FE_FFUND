import { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Spinner, Modal } from 'react-bootstrap';
import { 
  getUserExtendedInfo, 
  updateUserExtendedInfo, 
  createUserExtendedInfo,
  uploadStudentPortfolio 
} from '../../services/userService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ExtendedProfileInfo() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [portfolioFileName, setPortfolioFileName] = useState('');
  const [currentPortfolio, setCurrentPortfolio] = useState('');
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [formData, setFormData] = useState({
    studentClass: '',
    studentCode: '',
    exeClass: '',
    fptFacility: ''
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
    { value: 'EXE301', label: 'EXE301' }
  ];

  useEffect(() => {
    const fetchExtendedUserData = async () => {
      try {
        setLoading(true);
        const userData = await getUserExtendedInfo();
        
        // Check if this is a new user (no data exists yet)
        if (!userData.studentClass && !userData.studentCode) {
          setIsNewUser(true);
          toast.warn('Please fill out your extended profile information.', {
            autoClose: false
          });
        } else {
          setFormData({
            studentClass: userData.studentClass || '',
            studentCode: userData.studentCode || '',
            exeClass: userData.exeClass || 'EXE101',
            fptFacility: userData.fptFacility || 'CAN_THO'
          });
          setCurrentPortfolio(userData.studentPortfolio || '');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching extended user data:', error);
        toast.error('Failed to load extended profile information');
        setLoading(false);
        setIsNewUser(true); // Assume new user if fetch fails
      }
    };

    fetchExtendedUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const founderData = {
        studentClass: formData.studentClass,
        studentCode: formData.studentCode,
        exeClass: formData.exeClass,
        fptFacility: formData.fptFacility
      };
      
      // Determine whether to create or update based on isNewUser flag
      let result;
      if (isNewUser) {
        result = await createUserExtendedInfo(founderData);
        setIsNewUser(false); // No longer a new user after creation
      } else {
        result = await updateUserExtendedInfo(founderData);
      }
      
      toast.success(`Founder information ${isNewUser ? 'created' : 'updated'} successfully`);
    } catch (error) {
      toast.error(`Failed to ${isNewUser ? 'create' : 'update'} founder information. Please try again.`);
      console.error(`Error ${isNewUser ? 'creating' : 'updating'} founder information:`, error);
    } finally {
      setSaving(false);
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
                {isNewUser ? 'Create Founder Information' : 'Update Founder Information'}
              </h4>
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Student Class</Form.Label>
                      <Form.Control
                        type="text"
                        name="studentClass"
                        value={formData.studentClass}
                        onChange={handleInputChange}
                        placeholder="Enter your student class"
                        style={{ borderColor: '#ddd', padding: '0.625rem' }}
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Student Code</Form.Label>
                      <Form.Control
                        type="text"
                        name="studentCode"
                        value={formData.studentCode}
                        onChange={handleInputChange}
                        placeholder="Enter your student code"
                        style={{ borderColor: '#ddd', padding: '0.625rem' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>EXE Class</Form.Label>
                      <Form.Select
                        name="exeClass"
                        value={formData.exeClass}
                        onChange={handleInputChange}
                        style={{ borderColor: '#ddd', padding: '0.625rem', cursor: 'pointer' }}
                      >
                        {exeClasses.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>FPT Facility</Form.Label>
                      <Form.Select
                        name="fptFacility"
                        value={formData.fptFacility}
                        onChange={handleInputChange}
                        style={{ borderColor: '#ddd', padding: '0.625rem', cursor: 'pointer' }}
                      >
                        {facilities.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="mt-3"
                  style={{ 
                    backgroundColor: '#FF8C00', 
                    borderColor: '#FF8C00', 
                    padding: '0.5rem 1.5rem'
                  }}
                >
                  {saving ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="mr-2" />
                      {isNewUser ? 'Creating...' : 'Updating...'}
                    </>
                  ) : (isNewUser ? 'Create Founder Information' : 'Update Founder Information')}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          
          {/* Portfolio Upload Section */}
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
      
      {/* PDF Viewer Modal */}
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