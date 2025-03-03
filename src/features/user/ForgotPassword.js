import { useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorText from '../../components/Typography/ErrorText';
import InputText from '../../components/Input/InputText';
import CheckCircleIcon from '@heroicons/react/24/solid/CheckCircleIcon';

function ForgotPassword() {
    const INITIAL_USER_OBJ = {
        emailId: ''
    };

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [linkSent, setLinkSent] = useState(false);
    const [userObj, setUserObj] = useState(INITIAL_USER_OBJ);
    const [countdown, setCountdown] = useState(5);  // Đếm ngược 5 giây

    const submitForm = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        if (userObj.emailId.trim() === '') {
            return setErrorMessage('Email Id is required!');
        }

        setLoading(true);

        try {
            // Gửi yêu cầu API để gửi liên kết reset mật khẩu
            const response = await fetch('http://localhost:8080/api/v1/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: userObj.emailId
                })
            });

            const data = await response.json();

            if (response.status === 200) {
                setLinkSent(true);

                // Bắt đầu đếm ngược 5 giây
                const countdownInterval = setInterval(() => {
                    setCountdown(prev => {
                        if (prev === 1) {
                            clearInterval(countdownInterval); // Dừng đếm ngược khi đạt 0
                        }
                        return prev - 1;
                    });
                }, 1000);

                // Sau 5 giây, chuyển hướng sang Gmail
                setTimeout(() => {
                    window.location.href = 'https://mail.google.com/';
                }, 5000);
            } else {
                setErrorMessage(data.message || 'An error occurred. Please try again.');
            }
        } catch (error) {
            setErrorMessage('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateFormValue = ({ updateType, value }) => {
        setErrorMessage('');
        setUserObj({ ...userObj, [updateType]: value });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-orange-500 to-yellow-400">
            <div className="card w-full max-w-4xl shadow-xl rounded-xl bg-white flex md:flex-row flex-col">
                {/* Phần video */}
                <div className="md:w-1/2 hidden md:flex items-center justify-center bg-orange-100 rounded-l-xl overflow-hidden">
                    <video 
                        src="/login.mp4" 
                        autoPlay 
                        muted 
                        loop 
                        className="w-full h-full object-cover" 
                    />
                </div>

                <div className="md:w-1/2 w-full py-12 px-8">
                    <div className="text-center mb-4">
                        <img 
                            src="/forgotpasswnedSend.gif" 
                            alt="Forgot password Animation" 
                            className="mx-auto mb-4 w-24 border-4 border-white rounded-full shadow-lg"
                        />
                        <p className="text-center text-gray-600 mb-6">Enter your email to reset your password</p>
                    </div>

                    {linkSent ? (
                        <>
                            <div className="text-center mt-8">
                                <CheckCircleIcon className="inline-block w-32 text-success" />
                            </div>
                            <p className="my-4 text-xl font-bold text-center">Link Sent</p>
                            <p className="mt-4 mb-8 font-semibold text-center">Check your email to reset password</p>

                            {/* Hiển thị đếm ngược và liên kết */}
                            <div className="text-center mt-4">
                                <p className="font-semibold">
                                    {countdown > 0 ? (
                                        <>
                                            You will be redirected in {countdown} second{countdown > 1 ? 's' : ''}.
                                        </>
                                    ) : (
                                        <span>You have been redirected.</span>
                                    )}
                                </p>
                                <p className="mt-2">
                                    <a 
                                        href="https://mail.google.com/" 
                                        className="text-orange-500 hover:underline"
                                    >
                                        Click here if you don't want to wait.
                                    </a>
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="my-8 font-semibold text-center">We will send a password reset link to your email</p>
                            <form onSubmit={submitForm}>
                                <div className="mb-4">
                                    <InputText
                                        type="email"
                                        defaultValue={userObj.emailId}
                                        updateType="emailId"
                                        containerStyle="mt-4"
                                        labelTitle="Email Id"
                                        updateFormValue={updateFormValue}
                                    />
                                </div>

                                <ErrorText styleClass="mt-12">{errorMessage}</ErrorText>
                                <button
                                    type="submit"
                                    className={`btn mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition duration-200 ${loading ? 'loading' : ''}`}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>

                                <div className="text-center mt-4">
                                    <Link to="/login">
                                        <button className="inline-block hover:text-orange-500 hover:underline transition duration-200">
                                            Back to Login
                                        </button>
                                    </Link>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
