import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import ErrorText from '../../components/Typography/ErrorText';

function ResetPassword() {
    const location = useLocation();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tokenFromURL = params.get('token');
        if (tokenFromURL) {
            setToken(tokenFromURL);
        } else {
            setErrorMessage('Invalid or expired link');
            toast.error('Invalid or expired link', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored",
            });
        }
    }, [location.search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setErrorMessage('Passwords do not match');
            toast.error('Passwords do not match', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored",
            });
            return;
        }
        if (!token) {
            setErrorMessage('Invalid token');
            toast.error('Invalid token', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored",
            });
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8080/api/v1/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword, confirmPassword }),
            });
            const data = await response.json();
            if (response.status === 200) {
                toast.success('Password reset successful!', {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "colored",
                });
                setTimeout(() => navigate('/login'), 3000);
            } else {
                setErrorMessage(data.message || 'An error occurred. Please try again.');
                toast.error(data.message || 'An error occurred. Please try again.', {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "colored",
                });
            }
        } catch (error) {
            toast.error('An error occurred. Please try again later.', {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-orange-500 to-yellow-400">
            <div className="card w-full max-w-md shadow-xl rounded-xl bg-white py-8 px-8 relative">
                <img src="/reset-password.gif" alt="Reset Password" className="w-24 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-center mb-6">Reset Your Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4 relative">
                        <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="newPassword"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-12"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <span
                                className="absolute inset-y-0 right-4 flex items-center cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeSlashIcon className="w-6 h-6" /> : <EyeIcon className="w-6 h-6" />}
                            </span>
                        </div>
                    </div>
                    <div className="mb-4 relative">
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">Confirm Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-12"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <span
                                className="absolute inset-y-0 right-4 flex items-center cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeSlashIcon className="w-6 h-6" /> : <EyeIcon className="w-6 h-6" />}
                            </span>
                        </div>
                    </div>
                    <ErrorText>{errorMessage}</ErrorText>
                    <button
                        type="submit"
                        className={`w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition duration-200 ${loading ? 'loading' : ''}`}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
