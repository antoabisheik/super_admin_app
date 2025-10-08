"use client";

import React, { useState } from 'react';
import { FaEyeSlash, FaPhoneAlt } from 'react-icons/fa';
import { MdOutlineVisibility } from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../api/firebase';
import { useRouter } from 'next/navigation';
import LoadingOverlay from './LoadingOverlay'; //import loading
import { toast } from 'react-hot-toast';

const SignUpForm = () => {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); //loading state
 
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true); // start loading

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      toast.error("Password Mismatch");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setMessage("Account created! Please verify your email before signing in.");
      setError('');
      router.push('/verify-email');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true); //start loading
    try {
      const result = await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false); // stop loading
    }
  };

  return (
    <div className="flex min-h-screen bg-[url('')] bg-gradient-to-r from-[#0C1E1D] to-[#10211F] text-white relative">
      {loading && <LoadingOverlay />} 

      <div className="w-full max-w-md p-8 mx-20">
        <h2 className="text-3xl font-bold text-[#93F5AE] mb-2">Sign up</h2>
  
        {message && <p className="text-green-400 text-sm mb-2"> {toast.success({message})}</p>}

        <form onSubmit={handleSignUp} className="space-y-3">
          {/* Form fields remain unchanged */}
 <div className="relative w-full">
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="peer w-90 px-4 pt-6 pb-1 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none"
            />
            <label htmlFor="name" className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400">Your Name</label>
          </div>

          {/* Email */}
          <div className="relative w-full">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="peer w-90 px-4 pt-6 pb-1 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none"
            />
            <label htmlFor="email" className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400">Email</label>
          </div>

          {/* Password */}
          <div className="relative w-full">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="peer w-90 px-4 pt-6 pb-2 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none pr-10"
            />
            <label htmlFor="password" className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400">Password</label>
            <FaEyeSlash className="absolute left-80 top-5 text-gray-400" />
          </div>

          {/* Confirm Password */}
          <div className="relative w-full">
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="peer w-90 px-4 pt-6 pb-2 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none pr-10"
            />
            <label htmlFor="confirm-password" className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400">Confirm Password</label>
            <MdOutlineVisibility className="absolute left-80 top-5 text-gray-400" />
          </div>

          {/* Phone Number */}
          <div className="relative w-full">
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className="peer w-90 px-4 pt-6 pb-2 text-white bg-transparent border border-white rounded-xl placeholder-transparent focus:outline-none pr-10"
            />
            <label htmlFor="phone" className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-2 peer-focus:text-sm peer-focus:text-gray-400">Phone Number</label>
            <FaPhoneAlt className="absolute left-80 top-5 text-gray-400" />
          </div>

          <button type="submit" className="w-full py-2 rounded-md bg-[#93F5AE] text-black font-semibold hover:bg-[#7ce49e] transition">
            Create Account
          </button>

          <div className="w-full text-center text-sm text-white">or</div>

          <button type="button" onClick={handleGoogleSignUp} className="w-full py-2 flex items-center justify-center bg-white text-black rounded-md hover:bg-gray-100 transition">
            <FcGoogle className="mr-2 text-lg" />
            Continue with Google
          </button>

          <p className="w-full text-sm text-white text-center">
            Already have an account?{' '}
            <Link href="/signin" className="text-blue-400 hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUpForm;
