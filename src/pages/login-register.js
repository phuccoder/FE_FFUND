import { useEffect, useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import Image from 'next/image';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Head from 'next/head';
import Link from 'next/link';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [showGoogleSetup, setShowGoogleSetup] = useState(false);
  const [animationLoaded, setAnimationLoaded] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showGoogleSetupParam = urlParams.get('showGoogleSetup');
    if (showGoogleSetupParam) {
      setShowGoogleSetup(true);
    }
    
    // Redirect query param
    const redirectParam = urlParams.get('redirect');
    if (redirectParam) {
      // Store it for later use after successful login
      localStorage.setItem('redirectAfterLogin', redirectParam);
    }
  }, []);

  return (
    <>
      <Head>
        <title>{activeTab === 'login' ? 'Log In' : 'Sign Up'} | FFund</title>
        <meta name="description" content="Access your FFund account or create a new one" />
      </Head>
      
      <div className="h-screen w-full flex flex-col md:flex-row">
        {/* Left side with illustration - Full height */}
        <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-yellow-400 to-yellow-600 relative">
          <div className="absolute inset-0 bg-yellow-500 opacity-10 pattern-dots"></div>
          
          {/* Logo in top left */}
          <div className="absolute top-8 left-8 z-20">
            <Link href="/">
              <a className="flex items-center">
                <span className="font-bold text-2xl text-white">FFund</span>
              </a>
            </Link>
          </div>
          
          {/* Animation centered */}
          <div className="flex justify-center items-center w-full h-full relative z-10">
            <DotLottieReact
              src="https://lottie.host/7faa2db2-5024-43ed-b5b1-b50a3d408a2f/lSRyqte73w.lottie"
              background="transparent" 
              speed="1" 
              className="w-4/5 h-4/5 max-w-2xl"
              loop 
              autoplay
              onLoad={() => setAnimationLoaded(true)}
            />
          </div>
          
          {/* Text at bottom */}
          <div className="absolute bottom-12 left-0 right-0 text-white text-center px-8">
            <h3 className="font-bold text-2xl mb-3">Welcome to FFund</h3>
            <p className="text-white text-opacity-90 text-lg max-w-md mx-auto">
              Connecting innovative founders with forward-thinking investors to build a better future
            </p>
          </div>
        </div>

        {/* Right side with forms - Full height with scrolling */}
        <div className="w-full md:w-1/2 flex flex-col overflow-y-auto bg-white">
          {/* Mobile header */}
          <div className="md:hidden flex items-center justify-between p-4 border-b">
            <Link href="/">
              <a className="flex items-center">
                <span className="font-bold text-xl">FFund</span>
              </a>
            </Link>
          </div>
          
          {/* Content centered vertically in the available space */}
          <div className="flex-grow flex flex-col justify-center px-6 md:px-16 lg:px-24 py-8">
            {!showGoogleSetup && (
              <div className="flex mb-8 border-b border-gray-200">
                <button
                  type="button"
                  className={`flex-1 py-3 text-sm font-medium transition-all duration-200 ${
                    activeTab === 'login'
                      ? 'border-b-2 border-yellow-500 text-yellow-600 font-semibold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('login')}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className={`flex-1 py-3 text-sm font-medium transition-all duration-200 ${
                    activeTab === 'register'
                      ? 'border-b-2 border-yellow-500 text-yellow-600 font-semibold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('register')}
                >
                  Create Account
                </button>
              </div>
            )}

            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {showGoogleSetup ? 'Connect Google Account' : 
                  activeTab === 'login' ? 'Welcome back!' : 'Join us today'}
              </h2>
              <div className="text-base md:text-lg text-gray-600">
                {showGoogleSetup ? 'Link your Google account for easier access' :
                  activeTab === 'login' 
                    ? 'Enter your credentials to access your account' 
                    : 'Create an account to get started'}
              </div>
            </div>

            <div className="transition-all duration-300 transform">
              {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
            </div>
            
            <div className="mt-8 text-center text-sm text-gray-500">
              {activeTab === 'login' ? (
                <p>Don&apos;t have an account? <button onClick={() => setActiveTab('register')} className="text-yellow-600 font-medium hover:underline">Sign up</button></p>
              ) : (
                <p>Already have an account? <button onClick={() => setActiveTab('login')} className="text-yellow-600 font-medium hover:underline">Log in</button></p>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 text-center text-xs text-gray-500 border-t">
            <p>© {new Date().getFullYear()} FFund. All rights reserved.</p>
            <div className="mt-2">
              <Link href="/privacy-policy"><a className="hover:text-yellow-600 mx-2">Privacy Policy</a></Link>
              <Link href="/terms"><a className="hover:text-yellow-600 mx-2">Terms of Service</a></Link>
              <Link href="/contact"><a className="hover:text-yellow-600 mx-2">Contact Us</a></Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}