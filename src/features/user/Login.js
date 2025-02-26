import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ErrorText from '../../components/Typography/ErrorText';
import InputText from '../../components/Input/InputText';

function Login() {
    const navigate = useNavigate();

    const INITIAL_LOGIN_OBJ = {
        username: "",
        password: ""
    };

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [loginObj, setLoginObj] = useState(INITIAL_LOGIN_OBJ);

    const submitForm = async (e) => {
        e.preventDefault();
        setErrorMessage(""); 

        if (loginObj.username.trim() === "") return setErrorMessage("Username is required!");
        if (loginObj.password.trim() === "") return setErrorMessage("Password is required!");

        setLoading(true);

        try {

            const response = await fetch("http://localhost:8080/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: loginObj.username,
                    password: loginObj.password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json(); // Get error details from response
                throw new Error(errorData.error || `Error: ${response.statusText}`);
            }

            const data = await response.json();

            const { accessToken, refreshToken, role } = data.data; 

            if (!accessToken) {
                throw new Error("No access token received. Login failed!");
            }

            if (role !== "ADMIN") {
                throw new Error("Access denied! Only ADMIN users are allowed.");
            }

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("role", role);

            navigate('/app/welcome');

        } catch (error) {
            setErrorMessage(error.message || "An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const updateFormValue = ({ updateType, value }) => {
        setErrorMessage("");
        setLoginObj({ ...loginObj, [updateType]: value });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-orange-500 to-yellow-400">
            <div className="card w-full max-w-4xl shadow-xl rounded-xl bg-white flex md:flex-row flex-col">
                
                {/* Phần video minh họa */}
                <div className="md:w-1/2 hidden md:flex items-center justify-center bg-orange-100 rounded-l-xl overflow-hidden">
                    <video 
                        src="/login.mp4" 
                        autoPlay 
                        muted 
                        loop 
                        className="w-full h-full object-cover" 
                    />
                </div>

                {/* Phần form login */}
                <div className="md:w-1/2 w-full py-12 px-8">
                    <div className="text-center mb-4">
                        <img 
                            src="/signin.gif" 
                            alt="Sign In Animation" 
                            className="mx-auto mb-4 w-24 border-4 border-white rounded-full shadow-lg"
                        />
                        <p className="text-center text-gray-600 mb-6">Welcome back! Please enter your credentials.</p>
                    </div>
                    
                    <form onSubmit={submitForm}>
                        <div className="mb-5">
                            <InputText 
                                type="text" 
                                defaultValue={loginObj.username} 
                                updateType="username" 
                                containerStyle="mt-4" 
                                labelTitle="Username" 
                                updateFormValue={updateFormValue} 
                            />
                            <InputText 
                                type="password" 
                                defaultValue={loginObj.password} 
                                updateType="password" 
                                containerStyle="mt-4" 
                                labelTitle="Password" 
                                updateFormValue={updateFormValue} 
                            />
                        </div>

                        <div className="text-right text-orange-600">
                            <Link to="/forgot-password">
                                <span className="text-sm hover:underline cursor-pointer transition duration-200">
                                    Forgot Password?
                                </span>
                            </Link>
                        </div>

                        <ErrorText styleClass="mt-4">{errorMessage}</ErrorText>

                        <button 
                            type="submit" 
                            className={"btn mt-5 w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition duration-200" + (loading ? " loading" : "")}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
