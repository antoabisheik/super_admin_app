'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaEnvelope, FaLock, FaEyeSlash } from 'react-icons/fa';
import { MdOutlineVisibility } from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import {
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../api/firebase';
import { useRouter } from 'next/navigation';
import LoadingOverlay from './LoadingOverlay';
import { toast } from 'sonner';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const idToken = await result.user.getIdToken();

          const res = await fetch('https://webapps-middleware.onrender.com/api/Sauth/google-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ idToken }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Failed to log in via Google');
          }

          toast.success('Login successful');
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Google redirect error:', err);
        toast.error(err.message || 'Google login failed');
        setLoading(false);
      }
    };
    handleRedirect();
  }, [router]);

  const handleEmailLogin = async (e) => {
    if (e) e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://webapps-middleware.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      toast.success('Login successful');
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);

      const errorMessage = err.message.includes('INVALID_LOGIN_CREDENTIALS') ||
        err.message.includes('INVALID_PASSWORD') ||
        err.message.includes('EMAIL_NOT_FOUND')
        ? 'Invalid email or password'
        : err.message.includes('TOO_MANY_ATTEMPTS_TRY_LATER')
        ? 'Too many failed attempts. Please try again later.'
        : err.message.includes('USER_DISABLED')
        ? 'This account has been disabled'
        : err.message || 'Failed to sign in';

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch('https://webapps-middleware.onrender.com/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Google login failed');
      }

      toast.success('Login successful');
      router.push('/dashboard');
    } catch (err) {
      console.error('Google login error:', err);

      if (err.code === 'auth/popup-blocked') {
        toast.error('Popup was blocked. Please allow popups for this site.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        toast.error('An account already exists with the same email');
      } else {
        toast.error(err.message || 'Google login failed');
      }

      setLoading(false);
    }
  };

  return (
    <div className="flex from-[#0D1A1C] to-[#1B2C2E] text-white relative min-h-screen">
      {loading && <LoadingOverlay />}

      <div className="flex flex-col px-6 mx-auto my-8 w-full max-w-sm z-10">
        <h1 className="text-3xl font-bold text-[#A4FEB7] mb-1">Sign in</h1>
        <p className="text-gray-300 mb-4">
          Please login to continue to your account.
        </p>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <div className="relative">
              <FaEnvelope className="absolute top-3 left-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Your Email"
                required
                className="w-full pl-10 pr-4 py-2 bg-transparent border border-white rounded-2xl placeholder-gray-400 focus:outline-none focus:border-[#A4FEB7]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <div className="relative">
              <FaLock className="absolute top-3 left-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-10 pr-10 py-2 bg-transparent border border-white rounded-2xl placeholder-gray-400 focus:outline-none focus:border-[#A4FEB7]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3 right-4 text-gray-400 hover:text-white"
              >
                {showPassword ? (
                  <MdOutlineVisibility />
                ) : (
                  <FaEyeSlash />
                )}
              </button>
            </div>
            <Link href="/fp" className="text-blue-400 text-sm mt-1 inline-block hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-xl bg-[#A4FEB7] text-black font-semibold text-base cursor-pointer hover:bg-[#8ef0a5] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="text-center text-gray-400 text-sm">or</div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2 flex items-center justify-center border border-gray-500 rounded-xl text-white hover:bg-gray-800 cursor-pointer text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FcGoogle className="mr-2 text-lg" />
            Sign in with Google
          </button>

          <p className="text-gray-400 text-xs text-center">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-400 hover:underline">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SignInForm;