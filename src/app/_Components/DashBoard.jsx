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

// Import API client instead of Firebase
import { organizationsApi, devicesApi } from '../api/api-client';

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

  // Organization data - now loaded from API
  const [users, setUsers] = useState([]);

  // Hardware devices state - managed via API
  const [devices, setDevices] = useState([]);

  // Load organizations from API
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setIsLoadingOrgs(true);
        
        const result = await organizationsApi.getAll();
        
        if (result.success && result.data) {
          setUsers(result.data);
          console.log('Organizations loaded from API:', result.data);
        } else {
          console.error('Failed to load organizations:', result.error);
          alert('Failed to load organizations: ' + result.error);
        }
      } catch (error) {
        console.error("Error loading organizations:", error);
        alert('Error loading organizations. Please try again.');
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    loadOrganizations();
  }, []);

  // Load devices from API
  useEffect(() => {
    const loadDevices = async () => {
      try {
        setIsLoadingDevices(true);
        
        const result = await devicesApi.getAll();
        
        if (result.success && result.data) {
          setDevices(result.data);
          console.log('Devices loaded from API:', result.data);
        } else {
          console.error('Failed to load devices:', result.error);
          alert('Failed to load devices: ' + result.error);
        }
      } catch (error) {
        console.error("Error loading devices:", error);
        alert('Error loading devices. Please try again.');
      } finally {
        setIsLoadingDevices(false);
      }
    };

    loadDevices();
  }, []);

  // CRUD Operations for Organizations (using API)
  const handleCreateOrganization = async (organizationData) => {
    try {
      const result = await organizationsApi.create(organizationData);
      
      if (result.success) {
        console.log('Organization created:', result.data);
        // Reload organizations to get fresh data
        const refreshResult = await organizationsApi.getAll();
        if (refreshResult.success) {
          setUsers(refreshResult.data);
        }
        alert('Organization created successfully!');
      } else {
        throw new Error(result.error || 'Failed to create organization');
      }
    } catch (error) {
      console.error("Error creating organization:", error);
      alert("Failed to create organization: " + error.message);
    }
  };

  const handleUpdateOrganization = async (organizationData) => {
    try {
      const { id, ...updateData } = organizationData;
      const result = await organizationsApi.update(id, updateData);
      
      if (result.success) {
        console.log('Organization updated:', result.data);
        // Reload organizations
        const refreshResult = await organizationsApi.getAll();
        if (refreshResult.success) {
          setUsers(refreshResult.data);
        }
        alert('Organization updated successfully!');
      } else {
        throw new Error(result.error || 'Failed to update organization');
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      alert("Failed to update organization: " + error.message);
    }
  };

  const handleDeleteOrganization = async (organizationId) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) {
      return;
    }

    try {
      const result = await organizationsApi.delete(organizationId);
      
      if (result.success) {
        console.log('Organization deleted:', organizationId);
        // Reload organizations
        const refreshResult = await organizationsApi.getAll();
        if (refreshResult.success) {
          setUsers(refreshResult.data);
        }
        alert('Organization deleted successfully!');
      } else {
        throw new Error(result.error || 'Failed to delete organization');
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      alert("Failed to delete organization: " + error.message);
    }
  };

  // CRUD Operations for Devices (using API)
  const handleCreateDevice = async (deviceData) => {
    try {
      const result = await devicesApi.create(deviceData);
      
      if (result.success) {
        console.log('Device created:', result.data);
        // Reload devices
        const refreshResult = await devicesApi.getAll();
        if (refreshResult.success) {
          setDevices(refreshResult.data);
        }
        alert('Device created successfully!');
      } else {
        throw new Error(result.error || 'Failed to create device');
      }
    } catch (error) {
      console.error("Error creating device:", error);
      alert("Failed to create device: " + error.message);
    }
  };

  const handleUpdateDevice = async (deviceData) => {
    try {
      const { id, ...updateData } = deviceData;
      const result = await devicesApi.update(id, updateData);
      
      if (result.success) {
        console.log('Device updated:', result.data);
        // Reload devices
        const refreshResult = await devicesApi.getAll();
        if (refreshResult.success) {
          setDevices(refreshResult.data);
        }
        alert('Device updated successfully!');
      } else {
        throw new Error(result.error || 'Failed to update device');
      }
    } catch (error) {
      console.error("Error updating device:", error);
      alert("Failed to update device: " + error.message);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm('Are you sure you want to delete this device?')) {
      return;
    }

    try {
      const result = await devicesApi.delete(deviceId);
      
      if (result.success) {
        console.log('Device deleted:', deviceId);
        // Reload devices
        const refreshResult = await devicesApi.getAll();
        if (refreshResult.success) {
          setDevices(refreshResult.data);
        }
        alert('Device deleted successfully!');
      } else {
        throw new Error(result.error || 'Failed to delete device');
      }
    } catch (error) {
      console.error("Error deleting device:", error);
      alert("Failed to delete device: " + error.message);
    }
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Calculate statistics
  const stats = {
    organizations: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalDevices: devices.length,
    activeDevices: devices.filter(d => d.status === 'active').length,
    unassignedDevices: devices.filter(d => !d.organizationId).length,
    cameras: devices.filter(d => d.type === 'camera').length,
    sensors: devices.filter(d => d.type === 'sensor').length,
    devicesByOrg: devices.reduce((acc, device) => {
      const org = device.organizationName || 'Unassigned';
      acc[org] = (acc[org] || 0) + 1;
      return acc;
    }, {})
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

            {/* Stats Grid */}
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
                  <div> <Image src="/sensor-green.png" alt="Sensor" width={24} height={24} /> Sensors: {isLoadingDevices ? '...' : stats.sensors}</div>
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
                      API middleware active
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
                <span className="ml-2 text-gray-600">Loading organizations from API...</span>
              </div>
            ) : (
              <MainTable
                data={users}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                readOnly={false}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteOrganization}
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
            isLoadingOrgs={isLoadingOrgs}
          />
        );
      
      case 'NotificationSystem':
        return(
          <NotificationSystem />
        )

      case 'Camera':
        return(
          <CameraLayout />
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
        onSave={editingUser ? handleUpdateOrganization : handleCreateOrganization}
      />
    </div>
  );
};

export default Dashboard;