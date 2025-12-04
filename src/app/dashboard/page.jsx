'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashBoard from '../_Components/DashBoard';
import { useAuth } from '../contexts/AuthContext';

function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated after loading completes
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to login');
      router.push('/');
    }
  }, [user, loading, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div>
      <DashBoard />
    </div>
  );
}

export default DashboardPage;