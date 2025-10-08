'use client';

import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../api/firebase';
import LoadingOverlay from './LoadingOverlay'; 

const RequestResetPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 

  const handleResetRequest = async () => {
    setLoading(true); 
    try {
      await sendPasswordResetEmail(auth, email, {
        url: 'http://localhost:3000/auth-verf',
        handleCodeInApp: true,
      });
      setMessage('Password reset email sent! Check your inbox.');
      setError('');
    } catch (err) {
      setError(err.message);
      setMessage('');
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[url('')] flex flex-row items-start  text-white relative">
      {loading && <LoadingOverlay />}
      <div className="p-5 rounded-lg my-20 mx-20 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-1 text-green-300">Reset Password</h2>
        <p className="py-4 mb-6 text-white">
          An email will be sent to your verified email address.
          Click on the link to reset your password.
        </p>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 ring-1 ring-white rounded-2xl bg-gray-700 text-white focus:outline-none"
        />

        {error && <p className="text-red-400 mb-2 text-sm">{error}</p>}
        {message && <p className="text-green-400 mb-2 text-sm">{message}</p>}

        <button
          onClick={handleResetRequest}
          className="w-full bg-green-400 text-black py-2 rounded-2xl hover:bg-green-300 transition"
        >
          Send Reset Email
        </button>
      </div>
    </div>
  );
};

export default RequestResetPage;
