"use client"
import React, { useState, useEffect } from 'react';
import Sidebar from './SideBar';
import Header from './Header';
import MainTable from './MainTable';
import OrganizationModal from './OrganizationModel';
import Hardware from './HardWare';
import Layouts from './Layouts'
import TicketSupportSystem from './NotificationSystem'
import Image from 'next/image';

// Firestore imports
import { db } from '../api/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import LicenseManagement from './LicenseManagement'
import CameraLayout from './CameraLayout';
import NotificationSystem from './NotificationSystem';

const Dashboard = () => {
  // Active tab state for navigation
  const [activeTab, setActiveTab] = useState('Organization');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Loading states
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);

  // Organization data - now loaded from Firestore
  const [users, setUsers] = useState([]);

  // Hardware devices state - managed with Firestore
  const [devices, setDevices] = useState([]);

  // Load organizations from Firestore
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setIsLoadingOrgs(true);

        // Simple query without orderBy to avoid index issues
        const orgsCollection = collection(db, "organizations");

        // Set up real-time listener for organizations
        const unsubscribe = onSnapshot(orgsCollection, (querySnapshot) => {
          const orgsData = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('Organization document:', doc.id, data); // Debug log
            orgsData.push({
              id: doc.id,
              ...data
            });
          });

          setUsers(orgsData);
          setIsLoadingOrgs(false);
          console.log('Organizations loaded from Firestore:', orgsData);
        }, (error) => {
          console.error("Error loading organizations:", error);
          // Try a simple getDocs as fallback
          loadOrganizationsFallback();
        });

        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up organizations listener:", error);
        // Try a simple getDocs as fallback
        loadOrganizationsFallback();
      }
    };

    // Fallback method using getDocs
    const loadOrganizationsFallback = async () => {
      try {
        console.log('Trying fallback method for organizations...');
        const querySnapshot = await getDocs(collection(db, "organizations"));
        const orgsData = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Fallback - Organization document:', doc.id, data);
          orgsData.push({
            id: doc.id,
            ...data
          });
        });

        setUsers(orgsData);
        setIsLoadingOrgs(false);
        console.log('Organizations loaded via fallback:', orgsData);
      } catch (error) {
        console.error("Fallback method also failed:", error);
        setIsLoadingOrgs(false);
      }
    };

    const unsubscribe = loadOrganizations();

    // Cleanup on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Load devices from Firestore
  useEffect(() => {
    const loadDevices = async () => {
      try {
        setIsLoadingDevices(true);

        // Create query to get devices ordered by creation date
        const devicesQuery = query(
          collection(db, "devices"),
          orderBy("createdAt", "desc")
        );

        // Set up real-time listener
        const unsubscribe = onSnapshot(devicesQuery, (querySnapshot) => {
          const devicesData = [];
          querySnapshot.forEach((doc) => {
            devicesData.push({
              id: doc.id,
              ...doc.data()
            });
          });

          setDevices(devicesData);
          setIsLoadingDevices(false);
          console.log('Devices loaded from Firestore:', devicesData);
        }, (error) => {
          console.error("Error loading devices:", error);
          setIsLoadingDevices(false);
        });

        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up devices listener:", error);
        setIsLoadingDevices(false);
      }
    };

    const unsubscribe = loadDevices();

    // Cleanup on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // CRUD Operations for Devices (Firestore integration)
  const handleCreateDevice = async (deviceData) => {
    try {
      // Prepare device data for Firestore
      const firestoreDeviceData = {
        ...deviceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to Firestore (let Firestore generate the ID)
      const docRef = await addDoc(collection(db, "devices"), firestoreDeviceData);

      console.log('Device created in Firestore with ID:', docRef.id);
    } catch (error) {
      console.error("Error creating device:", error);
      alert("Failed to create device. Please try again.");
    }
  };

  const handleUpdateDevice = async (deviceData) => {
    try {
      // Prepare updated data
      const updatedData = {
        ...deviceData,
        updatedAt: serverTimestamp()
      };

      // Remove the id field from the update data
      const { id, ...dataToUpdate } = updatedData;

      // Update in Firestore
      const deviceRef = doc(db, "devices", deviceData.id);
      await updateDoc(deviceRef, dataToUpdate);

      console.log('Device updated in Firestore:', deviceData.id);
    } catch (error) {
      console.error("Error updating device:", error);
      alert("Failed to update device. Please try again.");
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, "devices", deviceId));

        console.log('Device deleted from Firestore:', deviceId);
      } catch (error) {
        console.error("Error deleting device:", error);
        alert("Failed to delete device. Please try again.");
      }
    }
  };

  // Modal handlers for Organizations
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Get statistics for dashboard
  const getStats = () => {
    const activeDevices = devices.filter(d => d.status === 'Active').length;
    const totalDevices = devices.length;
    const devicesByOrg = devices.reduce((acc, device) => {
      const orgName = device.organization || 'Unassigned';
      acc[orgName] = (acc[orgName] || 0) + 1;
      return acc;
    }, {});

    return {
      organizations: users.length,
      activeUsers: users.filter(u => u.status === 'Active').length,
      onboardingUsers: users.filter(u => u.status === 'Onboarding').length,
      totalDevices,
      activeDevices,
      cameras: devices.filter(d => d.deviceType === 'camera').length,
      sensors: devices.filter(d => d.deviceType === 'sensor').length,
      unassignedDevices: devices.filter(d => d.organization === 'Unassigned' || !d.organization).length,
      devicesByOrg
    };
  };

  const stats = getStats();

  // Function to render content based on active tab
  const renderActiveContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <span className="bg-[#d1f5ec] text-black px-4 py-1 rounded text-xs">
                Overview and Analytics
              </span>
              {(isLoadingOrgs || isLoadingDevices) && (
                <div className="mt-2 text-sm text-blue-600">
                   <Image src="/filter-green.png" alt='' width={40} height={40} /> Loading data from Firestore...
                </div>
              )}
            </div>

            {/* Enhanced Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Organizations</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {isLoadingOrgs ? '...' : stats.organizations}
                </p>
                <p className="text-xs text-gray-400">{stats.activeUsers} active</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Devices</h3>
                <p className="text-2xl font-bold text-green-600">
                  {isLoadingDevices ? '...' : stats.totalDevices}
                </p>
                <p className="text-xs text-gray-400">{stats.activeDevices} active</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Unassigned Devices</h3>
                <p className="text-2xl font-bold text-orange-600">
                  {isLoadingDevices ? '...' : stats.unassignedDevices}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Device Types</h3>
                <div className="text-sm text-gray-600">
                  <div> <Image src="/camera-green.png" alt="Camera" width={24} height={24} /> Cameras: {isLoadingDevices ? '...' : stats.cameras}</div>
                  <div> <Image src="/sensor-green.png" alt="Camera" width={24} height={24} /> Sensors: {isLoadingDevices ? '...' : stats.sensors}</div>
                </div>
              </div>
            </div>

            {/* Device Distribution by Organization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Devices by Assignment</h3>
                {isLoadingDevices ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading device distribution...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.devicesByOrg).map(([org, count]) => (
                      <div key={org} className="flex items-center justify-between">
                        <span className={`text-gray-700 ${org === 'Unassigned' ? 'text-orange-600 font-medium' : ''}`}>
                          {org}
                        </span>
                        <span className="font-medium">{count} devices</span>
                      </div>
                    ))}
                    {Object.keys(stats.devicesByOrg).length === 0 && (
                      <div className="text-gray-500 text-center py-4">
                        No devices found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isLoadingOrgs ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      {isLoadingOrgs ? 'Loading organizations...' : 'Organizations loaded successfully'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isLoadingDevices ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      {isLoadingDevices ? 'Loading devices...' : 'Devices loaded successfully'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      Firestore real-time sync active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveTab('Organization')}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10  flex items-center justify-center">
                    <Image src="/org-green.png" alt='org-png'  width={40} height={40} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Manage Organizations</div>
                    <div className="text-sm text-gray-500">Add or edit organizations</div>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('Hardware')}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10  flex items-center justify-center">
                    <Image src="/camera-green.png" alt='org-png'  width={40} height={40} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Hardware Inventory</div>
                    <div className="text-sm text-gray-500">Manage device inventory</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      case 'Organization':
        return (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h1 className="text-2xl font-bold">Organizations</h1>
                <span className="bg-[#d1f5ec] text-black px-2 py-1 rounded text-xs">
                  {isLoadingOrgs ? 'Loading...' : `${users.length} total`}
                </span>
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="bg-[#00dba1] hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span className="text-lg">+</span>
                Create Organization
              </button>
            </div>

            {isLoadingOrgs ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-[#d1f5ec] text-white">Loading organizations from Firestore...</span>
              </div>
            ) : (
              <MainTable
                data={users}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                readOnly={false}
                onEdit={handleOpenEditModal}
              />
            )}
          </>
        );

      case 'Hardware':
        return (
          <Hardware
            organizations={users}
            devices={devices}
            onCreateDevice={handleCreateDevice}
            onUpdateDevice={handleUpdateDevice}
            onDeleteDevice={handleDeleteDevice}
            db={db}
            isLoading={isLoadingDevices}
          />
        );

      case 'Layouts':
        return (
          <Layouts />
        );

      case 'LicenseManagement':
        return (
          <LicenseManagement
            organizations={users}
            db={db}
            isLoadingOrgs={isLoadingOrgs}
          />
        );
      
      case 'NotificationSystem':
        return(
          <NotificationSystem db={db}/>
        )

      case 'Camera':
        return(
          <CameraLayout
          
          />
        )

      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold">Welcome to Dashboard</h1>
            <p className="text-gray-600">Select a section from the sidebar to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Pass activeTab and setActiveTab to Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Render the active content */}
        {renderActiveContent()}
      </div>

      {/* Organization Modal */}
      <OrganizationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={editingUser}
      />
    </div>
  );
};

export default Dashboard;