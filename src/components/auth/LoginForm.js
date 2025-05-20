import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Checkbox,
  CssBaseline,
  FormControlLabel,
  Divider,
  FormLabel,
  FormControl,
  Link,
  TextField,
  Typography,
  Stack,
  Card,
  CircularProgress,
  Paper
} from '@mui/material';

import { ForgotPasswordModal } from './ForgotPasswordModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authenticate } from 'src/services/authenticate';
import { GoogleIcon } from './CustomIcons';
import Image from 'next/image';

// Simple logo component
const SitemarkIcon = () => (
  <Box sx={{ textAlign: 'center', mb: 2 }}>
    <Image
      src="https://admin-ffund.vercel.app/logo192.png"
      alt="logo"
      width={180}
      height={90}
      priority
      unoptimized
    />
  </Box>
);

export const LoginForm = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });

  const [googleSetupData, setGoogleSetupData] = useState({
    password: '',
    confirmPassword: '',
    role: '',
    studentCode: '',
    exeClass: 'EXE201',
    fptFacility: 'CAN_THO',
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setShowGoogleSetup(urlParams.has('showGoogleSetup'));
  }, []);

  const validateInputs = () => {
    let isValid = true;

    if (!formData.username || !/\S+@\S+\.\S+/.test(formData.username)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    // Print out request body for debugging
    const requestBody = {
      username: formData.username,
      password: formData.password,
      rememberMe: formData.rememberMe
    };

    // Safe logging (hide actual password)
    console.log('Login request body:', {
      ...requestBody,
      password: '********'
    });

    try {
      // authenticate.login already parses the JSON and returns the data
      const data = await authenticate.login(formData);

      // Log response
      console.log('Login response:', data);

      // Pass the data directly to handleAuthSuccess
      handleAuthSuccess(data);

    } catch (error) {
      console.error('Login error details:', error);

      // Extract error message from error object, which might contain nested error properties
      const errorMessage = error.message ||
        (error.error ? error.error : 'Login failed. Please try again.');

      // Display the error message to the user
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = (response) => {
    console.log('Auth success:', response); // Add logging

    // Check if we have the data property
    if (!response || !response.data) {
      console.error('Invalid auth data:', response);
      toast.error('Login successful but received invalid data');
      return;
    }

    const data = response.data;

    // Now check the properties inside data
    if (!data.accessToken || !data.role) {
      console.error('Invalid auth data:', data);
      toast.error('Login successful but received invalid data');
      return;
    }

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('role', data.role);
    localStorage.setItem('userId', data.userId);
    if (data.teamRole) {
      localStorage.setItem('teamRole', data.teamRole);
      console.log('Stored teamRole in localStorage:', data.teamRole);
    }

    // For debugging - verify role was stored correctly
    console.log('Role stored in localStorage:', data.role);
    console.log('Verifying localStorage value:', localStorage.getItem('role'));
    console.log('User ID:', data.userId);

    window.dispatchEvent(new Event('storage'));
    router.push('/');
  };

  const handleGoogleLogin = () => {
    authenticate.initiateGoogleLogin();
  };

  const handleGoogleSetupSubmit = async (e) => {
    e.preventDefault();

    // Validate password confirmation
    if (googleSetupData.password !== googleSetupData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate that a role is selected
    if (!googleSetupData.role) {
      toast.error('Please select a role');
      return;
    }

    // Role-specific validation
    if (googleSetupData.role === 'FOUNDER') {
      if (!googleSetupData.studentCode) {
        toast.error('Student code is required for Founders');
        return;
      }
      if (!googleSetupData.exeClass) {
        toast.error('EXE Class is required for Founders');
        return;
      }
      if (!googleSetupData.fptFacility) {
        toast.error('FPT Facility is required for Founders');
        return;
      }
    }

    setIsLoading(true);
    try {
      // The updated completeGoogleSetup will handle routing to the correct endpoint
      const data = await authenticate.completeGoogleSetup(googleSetupData);

      toast.success('Account setup complete');
      // Handle successful setup
      handleAuthSuccess(data);
    } catch (error) {
      // Extract and display specific error message
      let errorMessage = 'Failed to complete account setup';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Container styles for both forms
  const containerStyles = {
    minHeight: '100%',
    padding: { xs: 2, sm: 4 },
    position: 'relative',
    '&::before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      zIndex: -1,
      inset: 0,
      backgroundImage: 'radial-gradient(ellipse at 50% 50%, hsl(36, 100%, 95%), hsl(36, 100%, 97%))',
      backgroundRepeat: 'no-repeat',
    }
  };

  // Card styles for both forms
  const cardStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: 4,
    gap: 2,
    margin: 'auto',
    maxWidth: '450px',
    boxShadow: 'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  };

  if (showGoogleSetup) {
    return (
      <Stack
        direction="column"
        justifyContent="space-between"
        sx={containerStyles}
      >
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <Card variant="outlined" sx={cardStyles}>
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', textAlign: 'center' }}
          >
            Complete Your Google Account Setup
          </Typography>
          <Box
            component="form"
            onSubmit={handleGoogleSetupSubmit}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                id="password"
                type="password"
                placeholder="Create a password"
                value={googleSetupData.password}
                onChange={(e) => setGoogleSetupData({ ...googleSetupData, password: e.target.value })}
                required
                fullWidth
                variant="outlined"
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
              <TextField
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={googleSetupData.confirmPassword}
                onChange={(e) => setGoogleSetupData({ ...googleSetupData, confirmPassword: e.target.value })}
                required
                fullWidth
                variant="outlined"
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="role">Select Role</FormLabel>
              <TextField
                id="role"
                select
                SelectProps={{ native: true }}
                value={googleSetupData.role}
                onChange={(e) => setGoogleSetupData({ ...googleSetupData, role: e.target.value })}
                required
                fullWidth
                variant="outlined"
              >
                <option value="">Select a role</option>
                <option value="FOUNDER">Founder</option>
                <option value="INVESTOR">Investor</option>
              </TextField>
            </FormControl>

            {/* Conditional fields for FOUNDER role */}
            {googleSetupData.role === 'FOUNDER' && (
              <>
                <FormControl>
                  <FormLabel htmlFor="studentCode">Student Code</FormLabel>
                  <TextField
                    id="studentCode"
                    type="text"
                    placeholder="Enter your student code"
                    value={googleSetupData.studentCode}
                    onChange={(e) => setGoogleSetupData({ ...googleSetupData, studentCode: e.target.value })}
                    required
                    fullWidth
                    variant="outlined"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="exeClass">EXE Class</FormLabel>
                  <TextField
                    id="exeClass"
                    select
                    SelectProps={{ native: true }}
                    value={googleSetupData.exeClass}
                    onChange={(e) => setGoogleSetupData({ ...googleSetupData, exeClass: e.target.value })}
                    required
                    fullWidth
                    variant="outlined"
                  >
                    <option value="EXE201">EXE201</option>
                    <option value="EXE403">EXE403</option>
                  </TextField>
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="fptFacility">FPT Facility</FormLabel>
                  <TextField
                    id="fptFacility"
                    select
                    SelectProps={{ native: true }}
                    value={googleSetupData.fptFacility}
                    onChange={(e) => setGoogleSetupData({ ...googleSetupData, fptFacility: e.target.value })}
                    required
                    fullWidth
                    variant="outlined"
                  >
                    <option value="CAN_THO">CAN THO</option>
                    <option value="DA_NANG">DA NANG</option>
                    <option value="HA_NOI">HA NOI</option>
                    <option value="HO_CHI_MINH">HO CHI MINH</option>
                    <option value="QUY_NHON">QUY NHON</option>
                  </TextField>
                </FormControl>
              </>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{
                bgcolor: '#FF8C00',
                '&:hover': { bgcolor: '#E67E00' },
                py: 1.5
              }}
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Setting up account...</span>
                </Box>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </Box>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      sx={containerStyles}
    >
      <CssBaseline enableColorScheme />
      <Card variant="outlined" sx={cardStyles}>
        <SitemarkIcon />
        <Typography
          component="h1"
          variant="h5"
          sx={{ width: '100%', fontSize: 'clamp(1.5rem, 8vw, 1.75rem)', textAlign: 'center' }}
        >
          Sign in
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: 2,
          }}
        >
          <FormControl>
            <FormLabel htmlFor="email">Email</FormLabel>
            <TextField
              error={emailError}
              helperText={emailErrorMessage}
              id="email"
              type="email"
              name="email"
              placeholder="your@email.com"
              autoComplete="email"
              autoFocus
              required
              fullWidth
              variant="outlined"
              color={emailError ? 'error' : 'primary'}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="password">Password</FormLabel>
            <TextField
              error={passwordError}
              helperText={passwordErrorMessage}
              name="password"
              placeholder="••••••"
              type="password"
              id="password"
              autoComplete="current-password"
              required
              fullWidth
              variant="outlined"
              color={passwordError ? 'error' : 'primary'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  value="remember"
                  color="primary"
                />
              }
              label="Remember me"
            />
            <Link
              component="button"
              type="button"
              onClick={() => setIsModalOpen(true)}
              variant="body2"
            >
              Forgot your password?
            </Link>
          </Box>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{
              bgcolor: '#FF8C00',
              '&:hover': { bgcolor: '#E67E00' },
              py: 1.5
            }}
          >
            {isLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>Signing in...</span>
              </Box>
            ) : (
              'Sign in'
            )}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }}>or</Divider>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleLogin}
            startIcon={<GoogleIcon />}
          >
            Sign in with Google
          </Button>
        </Box>
      </Card>

      <ForgotPasswordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <ToastContainer />
    </Stack>
  );
};