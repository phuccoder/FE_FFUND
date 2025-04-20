import { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import Image from 'next/image';
import { getUserById, updateUser, uploadAvatar } from '../../services/userService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function BasicProfileInfo() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    telephoneNumber: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await getUserById();
        setUser(userData);
        setFormData({
          fullName: userData.fullName || '',
          email: userData.email || '',
          telephoneNumber: userData.telephoneNumber || ''
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user profile');
        setLoading(false);
        toast.error('Failed to load user profile');
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const requestBody = {
        fullName: formData.fullName,
        email: formData.email,
        telephoneNumber: formData.telephoneNumber
      };

      console.log('Request Body:', requestBody);

      const response = await updateUser(requestBody);

      console.log('Response:', response);

      toast.success('Profile updated successfully');
    } catch (error) {
      setError('Failed to update profile. Please try again.');
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    try {
      setUploading(true);
      setError(null);

      await uploadAvatar(avatarFile);

      // Refresh user data to get the new avatar URL
      const userData = await getUserById();
      setUser(userData);

      toast.success('Avatar uploaded successfully');

      // Clear file input
      setAvatarFile(null);
    } catch (error) {
      setError('Failed to upload avatar. Please try again.');
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
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
        <Col md={4} className="mb-4">
          <Card className="shadow border-0">
            <Card.Body className="text-center">
              <div className="mb-4 relative mx-auto w-32 h-32 rounded-full overflow-hidden border-4" style={{ borderColor: '#FF8C00' }}>
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar Preview"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-full"
                    unoptimized
                  />
                ) : user?.userAvatar ? (
                  <Image
                    src={user.userAvatar}
                    alt="User Avatar"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-full"
                    unoptimized
                    onError={(e) => {
                      // Handle image loading errors
                      e.target.onerror = null;
                      e.target.src = { avatarPreview };
                    }}
                  />
                ) : (
                  <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                    <span className="text-gray-600 text-4xl font-bold">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>

              <h5 className="font-bold text-xl mb-1">{user?.fullName}</h5>
              <p className="text-muted mb-4" style={{ color: '#666' }}>{user?.roles}</p>

              <div className="mb-3">
                <label
                  htmlFor="avatarUpload"
                  className="btn d-block mb-2"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#FF8C00',
                    borderColor: '#FF8C00',
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.875rem',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}
                >
                  Select New Avatar
                </label>
                <input
                  type="file"
                  id="avatarUpload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  style={{ display: 'none' }}
                />

                {avatarFile && (
                  <Button
                    style={{
                      backgroundColor: '#FF8C00',
                      borderColor: '#FF8C00',
                      width: '100%'
                    }}
                    size="sm"
                    onClick={handleAvatarUpload}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" className="mr-2" />
                        Uploading...
                      </>
                    ) : 'Upload Avatar'}
                  </Button>
                )}
              </div>

              <div className="text-left mt-4">
                <p className="mb-1">
                  <strong>Email:</strong> {user?.email}
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow border-0">
            <Card.Body>
              <h4 className="text-xl font-bold mb-4" style={{ color: '#FF8C00' }}>Edit Profile Information</h4>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    style={{ borderColor: '#ddd', padding: '0.625rem' }}
                    className="focus-ring focus-ring-orange-500"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                    style={{ borderColor: '#ddd', padding: '0.625rem' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    name="telephoneNumber"
                    value={formData.telephoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    required
                    style={{ borderColor: '#ddd', padding: '0.625rem' }}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  disabled={saving}
                  className="mt-2"
                  style={{
                    backgroundColor: '#FF8C00',
                    borderColor: '#FF8C00',
                    padding: '0.5rem 1.5rem'
                  }}
                >
                  {saving ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : 'Save Changes'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}