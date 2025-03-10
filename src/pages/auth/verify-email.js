import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EmailVerification = () => {
  const router = useRouter();
  const [status, setStatus] = useState('Verifying...');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      const { token } = router.query;

      if (!token) return;

      try {
        setIsLoading(true);
        const response = await fetch('http://103.162.15.61:8080/api/v1/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus('Email verified successfully! Redirecting...');
          toast.success('Email verified successfully! Redirecting to login...', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          
          setTimeout(() => {
            router.push('/login-register');
          }, 5000);
        } else {
          setStatus('Verification failed. Please try again or contact support.');
          toast.error('Verification failed. Please try again.', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('An error occurred during verification. Please try again.');
        toast.error('An error occurred during verification. Please try again later.', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (router.isReady) {
      verifyEmail();
    }
  }, [router.isReady, router.query]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Email Verification</h1>
        <div className="text-center space-y-4">
          {isLoading && (
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="text-gray-600">Verifying your email...</span>
            </div>
          )}
          {!isLoading && (
            <p className="text-gray-600">{status}</p>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default EmailVerification;