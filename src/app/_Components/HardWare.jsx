import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import Image from 'next/image';

const Hardware = ({
  organizations = [],
  devices = [],
  onCreateDevice,
  onUpdateDevice,
  onDeleteDevice,
  isLoading = false,
  db // Add Firebase db instance as prop
}) => {
  // Hardware tab state (Camera or Sensor)
  const [activeHardwareTab, setActiveHardwareTab] = useState('Camera');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Organization and gym search states
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  const [gymSearchTerm, setGymSearchTerm] = useState('');

  // NEW: State to store gyms for selected organization
  const [availableGyms, setAvailableGyms] = useState([]);
  const [gymsLoading, setGymsLoading] = useState(false);

  // Filter states with checkboxes
  const [assignmentFilters, setAssignmentFilters] = useState({
    assigned: false,
    unassigned: false
  });

  const [organizationFilters, setOrganizationFilters] = useState({});

  const [gymFilters, setGymFilters] = useState({});

  const [stickerStatusFilters, setStickerStatusFilters] = useState({
    pending: false,
    applied: false,
    notApplied: false
  });

  const [testingStatusFilters, setTestingStatusFilters] = useState({
    notTested: false,
    passed: false,
    failed: false
  });

  // Modal and form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state - FIXED: Using IDs for relationships
  const [formData, setFormData] = useState({
    deviceId: '',
    deviceType: activeHardwareTab.toLowerCase(),
    organization: 'Unassigned',
    organizationId: null,        // ID for database relationship
    gym: '',
    gymId: null,                 // ID for database relationship
    ipAddress: '',
    modelNo: '',
    lens: '',
    stickerStatus: 'Pending',
    testedBy: 'update status',
    testingStatus: 'not tested yet',
    testingDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  //Function to fetch gyms for a specific organization
  const fetchGymsForOrganization = async (organizationId) => {
    if (!organizationId || !db) {
      setAvailableGyms([]);
      return;
    }

    setGymsLoading(true);
    try {
      const gymsRef = collection(db, 'organizations', organizationId, 'gyms');
      const gymsSnapshot = await getDocs(gymsRef);
      const gyms = gymsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableGyms(gyms);
    } catch (error) {
      console.error('Error fetching gyms:', error);
      setAvailableGyms([]);
    } finally {
      setGymsLoading(false);
    }
  };

  // NEW: Effect to fetch gyms when organization changes
  useEffect(() => {
    if (formData.organizationId) {
      fetchGymsForOrganization(formData.organizationId);
    } else {
      setAvailableGyms([]);
    }
  }, [formData.organizationId, db]);

  // Initialize organization and gym filters when organizations change
  React.useEffect(() => {
    const orgFilters = {};
    const gymFilters = {};

    organizations.forEach(org => {
      orgFilters[org.name] = false;

      // Initialize gym filters for each organization
      if (org.gyms && Array.isArray(org.gyms)) {
        org.gyms.forEach(gym => {
          const gymKey = `${org.name}::${gym.name}`;
          gymFilters[gymKey] = false;
        });
      }
    });

    setOrganizationFilters(orgFilters);
    setGymFilters(gymFilters);
  }, [organizations]);

  // Get filtered organizations for the filter panel
  const getFilteredOrganizations = () => {
    if (!orgSearchTerm) return organizations;

    return organizations.filter(org =>
      org.name.toLowerCase().includes(orgSearchTerm.toLowerCase())
    );
  };

  console.log(organizations);
  // Get filtered gyms for the filter panel
  const getFilteredGyms = () => {
    if (!gymSearchTerm) {
      // Return all gyms from all organizations
      const allGyms = [];

      organizations.forEach(org => {
        if (org.gyms && Array.isArray(org.gyms)) {
          org.gyms.forEach(gym => {
            allGyms.push({
              ...gym,
              organizationName: org.name,
              key: `${org.name}::${gym.name}`
            });
          });
        }
      });
      return allGyms;
    }

    // Filter gyms by search term
    const filteredGyms = [];
    organizations.forEach(org => {
      if (org.gyms && Array.isArray(org.gyms)) {
        org.gyms.forEach(gym => {
          if (gym.name.toLowerCase().includes(gymSearchTerm.toLowerCase()) ||
            org.name.toLowerCase().includes(gymSearchTerm.toLowerCase())) {
            filteredGyms.push({
              ...gym,
              organizationName: org.name,
              key: `${org.name}::${gym.name}`
            });
          }
        });
      }
    });
    return filteredGyms;
  };

  // Get filtered devices based on active tab and filters
  const getFilteredDevices = () => {
    let filteredDevices = devices.filter(device =>
      device.deviceType === activeHardwareTab.toLowerCase()
    );

    // Apply search filter
    if (searchTerm) {
      filteredDevices = filteredDevices.filter(device =>
        device.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.gym?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.modelNo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply assignment filters
    const activeAssignmentFilters = Object.keys(assignmentFilters).filter(key => assignmentFilters[key]);
    if (activeAssignmentFilters.length > 0) {
      filteredDevices = filteredDevices.filter(device => {
        if (activeAssignmentFilters.includes('assigned') && (device.organization && device.organization !== 'Unassigned')) {
          return true;
        }
        if (activeAssignmentFilters.includes('unassigned') && (device.organization === 'Unassigned' || !device.organization)) {
          return true;
        }
        return false;
      });
    }

    // Apply organization filters
    const activeOrgFilters = Object.keys(organizationFilters).filter(key => organizationFilters[key]);
    if (activeOrgFilters.length > 0) {
      filteredDevices = filteredDevices.filter(device =>
        activeOrgFilters.includes(device.organization)
      );
    }

    // Apply gym filters
    const activeGymFilters = Object.keys(gymFilters).filter(key => gymFilters[key]);
    if (activeGymFilters.length > 0) {
      filteredDevices = filteredDevices.filter(device => {
        if (!device.gym || !device.organization) return false;
        const gymKey = `${device.organization}::${device.gym}`;
        return activeGymFilters.includes(gymKey);
      });
    }

    // Apply sticker status filters
    const activeStickerFilters = Object.keys(stickerStatusFilters).filter(key => stickerStatusFilters[key]);
    if (activeStickerFilters.length > 0) {
      filteredDevices = filteredDevices.filter(device => {
        const status = device.stickerStatus?.toLowerCase();
        if (activeStickerFilters.includes('pending') && status === 'pending') return true;
        if (activeStickerFilters.includes('applied') && status === 'applied') return true;
        if (activeStickerFilters.includes('notApplied') && status === 'not applied') return true;
        return false;
      });
    }

    // Apply testing status filters
    const activeTestingFilters = Object.keys(testingStatusFilters).filter(key => testingStatusFilters[key]);
    if (activeTestingFilters.length > 0) {
      filteredDevices = filteredDevices.filter(device => {
        const testing = device.testing?.toLowerCase();
        if (activeTestingFilters.includes('notTested') && testing === 'not tested yet') return true;
        if (activeTestingFilters.includes('passed') && testing === 'passed') return true;
        if (activeTestingFilters.includes('failed') && testing === 'failed') return true;
        return false;
      });
    }

    return filteredDevices;
  };

  // Handle filter changes
  const handleAssignmentFilterChange = (key) => {
    setAssignmentFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleOrganizationFilterChange = (key) => {
    setOrganizationFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleGymFilterChange = (key) => {
    setGymFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleStickerStatusFilterChange = (key) => {
    setStickerStatusFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTestingStatusFilterChange = (key) => {
    setTestingStatusFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setAssignmentFilters({ assigned: false, unassigned: false });
    setOrganizationFilters(Object.keys(organizationFilters).reduce((acc, key) => ({ ...acc, [key]: false }), {}));
    setGymFilters(Object.keys(gymFilters).reduce((acc, key) => ({ ...acc, [key]: false }), {}));
    setStickerStatusFilters({ pending: false, applied: false, notApplied: false });
    setTestingStatusFilters({ notTested: false, passed: false, failed: false });
    setSearchTerm('');
    setOrgSearchTerm('');
    setGymSearchTerm('');
  };

  // Count active filters
  const getActiveFilterCount = () => {
    return Object.values(assignmentFilters).filter(Boolean).length +
      Object.values(organizationFilters).filter(Boolean).length +
      Object.values(gymFilters).filter(Boolean).length +
      Object.values(stickerStatusFilters).filter(Boolean).length +
      Object.values(testingStatusFilters).filter(Boolean).length;
  };

  // Add this helper function in your component
  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'camera':
        return <Image src='/camera.png' alt="Camera" width={24} height={24} />;
      case 'sensor':
        return <Image src="/sensor.png" alt="Sensor" width={24} height={24} />;
      default:
        return <Image src="/device.png" alt="Device" width={24} height={24} />;
    }
  };

  // ✅ FIXED: Handle form input changes with proper ID mapping
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If organization is selected, set both name and ID, reset gym
    if (name === 'organization') {
      if (value === 'Unassigned') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          organizationId: null,
          gym: '',
          gymId: null
        }));
      } else {
        //FIXED: Find organization by name but store ID
        const selectedOrg = organizations.find(org => org.name === value);
        console.log('Selected Organization:', selectedOrg);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          organizationId: selectedOrg ? selectedOrg.id : null,
          gym: '', // Reset gym when organization changes
          gymId: null
        }));
      }
    }
    // If gym is selected, set both name and ID
    else if (name === 'gym') {
      if (value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          gymId: null
        }));
      } else {
        //FIXED: Find gym by name from availableGyms (fetched from subcollection)
        const selectedGym = availableGyms.find(gym => gym.name === value);
        console.log('Selected Gym:', selectedGym);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          gymId: selectedGym ? selectedGym.id : null
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  console.log('Form Data:', formData);
  console.log('Available Gyms:', availableGyms);

  // FIXED: Handle adding new device with proper ID-based relationships
  const handleAddDevice = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      //FIXED: Find organization by ID (not name)
      const selectedOrg = formData.organizationId !== null
        ? organizations.find(org => org.id === formData.organizationId)
        : null;

      console.log('Selected Organization for Create:', selectedOrg);

      //FIXED: Find gym by ID from fetched availableGyms
      const selectedGym = formData.gymId && availableGyms.length > 0
        ? availableGyms.find(gym => gym.id === formData.gymId)
        : null;

      console.log('Selected Gym for Create:', selectedGym);

      // Auto-determine status based on assignment
      const deviceStatus = formData.organization === 'Unassigned' ? 'Inventory' : 'Assigned';

      //FIXED: Create device with proper ID references and cached names
      const newDevice = {
        deviceName: formData.deviceId,
        serial: Math.random().toString().substring(2, 12),
        deviceType: activeHardwareTab.toLowerCase(),
        stickerStatus: formData.stickerStatus,
        ipAddress: formData.ipAddress,
        testing: formData.testingStatus,
        //Store both ID and name for organization
        organizationId: selectedOrg ? selectedOrg.id : null,
        organization: selectedOrg ? selectedOrg.name : 'Unassigned',
        //Store both ID and name for gym
        gymId: selectedGym ? selectedGym.id : null,
        gym: selectedGym ? selectedGym.name : null,
        status: deviceStatus,
        modelNo: formData.modelNo,
        lens: formData.lens || 'N/A',
      };

      console.log('Device data to save:', newDevice);

      // Call the parent's create function (this will handle Firestore)
      await onCreateDevice(newDevice);

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding device:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle editing device
  const handleEditDevice = async (device) => {
    setEditingDevice(device);
    setFormData({
      deviceId: device.deviceName,
      deviceType: device.deviceType,
      organization: device.organization || 'Unassigned',
      organizationId: device.organizationId || null,  //Load existing ID
      gym: device.gym || '',
      gymId: device.gymId || null,                    //Load existing ID
      ipAddress: device.ipAddress,
      modelNo: device.modelNo,
      lens: device.lens,
      stickerStatus: device.stickerStatus,
      testedBy: 'update status',
      testingStatus: device.testing,
      testingDate: device.testingDate || new Date().toISOString().split('T')[0],
      remarks: device.remarks || ''
    });

    //NEW: If device has an organization, fetch its gyms
    if (device.organizationId) {
      await fetchGymsForOrganization(device.organizationId);
    }

    setIsModalOpen(true);
  };

  //FIXED: Handle updating device with proper ID-based relationships
  const handleUpdateDevice = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      //FIXED: Find organization by ID (not name)
      const selectedOrg = formData.organizationId !== null
        ? organizations.find(org => org.id === formData.organizationId)
        : null;

      console.log('Selected Organization for Update:', selectedOrg);

      //FIXED: Find gym by ID from fetched availableGyms
      const selectedGym = formData.gymId && availableGyms.length > 0
        ? availableGyms.find(gym => gym.id === formData.gymId)
        : null;

      console.log('Selected Gym for Update:', selectedGym);

      // Auto-determine status based on assignment
      const deviceStatus = formData.organization === 'Unassigned' ? 'Inventory' : 'Assigned';

      //FIXED: Update device with proper ID references and cached names
      const updatedDevice = {
        ...editingDevice,
        deviceName: formData.deviceId,
        //Store both ID and name for organization
        organizationId: selectedOrg ? selectedOrg.id : null,
        organization: selectedOrg ? selectedOrg.name : 'Unassigned',
        //Store both ID and name for gym
        gymId: selectedGym ? selectedGym.id : null,
        gym: selectedGym ? selectedGym.name : null,
        ipAddress: formData.ipAddress,
        modelNo: formData.modelNo,
        lens: formData.lens,
        stickerStatus: formData.stickerStatus,
        testing: formData.testingStatus,
        status: deviceStatus
      };

      console.log('Updated device data to save:', updatedDevice);

      // Call the parent's update function (this will handle Firestore)
      await onUpdateDevice(updatedDevice);

      setIsModalOpen(false);
      setEditingDevice(null);
      resetForm();
    } catch (error) {
      console.error('Error updating device:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting device
  const handleDeleteDevice = async (deviceId) => {
    try {
      // Call the parent's delete function (this will handle Firestore)
      await onDeleteDevice(deviceId);
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  // Handle opening modal for new device
  const handleNewDevice = () => {
    setEditingDevice(null);
    resetForm();
    setIsModalOpen(true);
  };

  // Reset form helper
  const resetForm = () => {
    setFormData({
      deviceId: '',
      deviceType: activeHardwareTab.toLowerCase(),
      organization: 'Unassigned',
      organizationId: null,
      gym: '',
      gymId: null,
      ipAddress: '',
      modelNo: '',
      lens: '',
      stickerStatus: 'Pending',
      testedBy: 'update status',
      testingStatus: 'not tested yet',
      testingDate: new Date().toISOString().split('T')[0],
      remarks: ''
    });
    setAvailableGyms([]); //Clear available gyms when resetting form
  };

  // Get status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      case 'Inventory': return 'bg-blue-100 text-blue-800';
      case 'Assigned': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTestingColor = (testing) => {
    switch (testing) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'not tested yet': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredDevices = getFilteredDevices();
  const filteredOrganizations = getFilteredOrganizations();
  const filteredGyms = getFilteredGyms();
  const deviceCounts = {
    camera: devices.filter(d => d.deviceType === 'camera').length,
    sensor: devices.filter(d => d.deviceType === 'sensor').length
  };

  // Get inventory stats
  const inventoryStats = {
    total: devices.length,
    unassigned: devices.filter(d => d.organization === 'Unassigned' || !d.organization).length,
    assigned: devices.filter(d => d.organization && d.organization !== 'Unassigned').length,
    inventory: devices.filter(d => d.status === 'Inventory').length,
    active: devices.filter(d => d.status === 'Active').length
  };

  // Loading state component
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">Loading devices...</span>
    </div>
  );

  return (
    <div className="p-6">

      {/* Hardware Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Hardware Inventory</h1>
        <span className="bg-[#d1f5ec] text-black px-2 py-1 rounded text-xs">
          Device Inventory Management
        </span>
        {isLoading && (
          <div className="mt-2 text-sm text-blue-600">
            🔄 Syncing with Firestore...
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Devices</h3>
          <p className="text-2xl font-bold text-blue-600">
            {isLoading ? '...' : inventoryStats.total}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Unassigned</h3>
          <p className="text-2xl font-bold text-orange-600">
            {isLoading ? '...' : inventoryStats.unassigned}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned</h3>
          <p className="text-2xl font-bold text-green-600">
            {isLoading ? '...' : inventoryStats.assigned}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">In Inventory</h3>
          <p className="text-2xl font-bold text-purple-600">
            {isLoading ? '...' : inventoryStats.inventory}
          </p>
          <p className="text-xs text-gray-400">Unassigned devices</p>
        </div>
      </div>

      {/* Hardware Tabs */}
      <div className="bg-white rounded-lg shadow-sm">

        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['Camera', 'Sensor'].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveHardwareTab(tab);
                  setSearchTerm(''); // Reset search when switching tabs
                  clearAllFilters(); // Clear all filters when switching tabs
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${activeHardwareTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {tab === 'Camera' ? <Image src="/camera.png" alt="Camera" width={24} height={24} /> : <Image src="/sensor.png" alt="Sensor" width={24} height={24} />}
                  </span>
                  {tab}s ({isLoading ? '...' : deviceCounts[tab.toLowerCase()]})
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-80">
              <input
                type="text"
                placeholder={`Search ${activeHardwareTab.toLowerCase()}s by name, serial, organization, gym, IP, model...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${showFilters ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
                }`}
              disabled={isLoading}
            >
              <span className="text-lg"> <Image src="/filter-green.png" alt='filter' width={20} height={20} /> </span>
              Filters
              {getActiveFilterCount() > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>

            {/* Filter Panel - Add this after the Filter Results Info section */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">

                  {/* Assignment Filters */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Assignment</h4>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={assignmentFilters.assigned}
                          onChange={() => handleAssignmentFilterChange('assigned')}
                          className="mr-2"
                        />
                        Assigned
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={assignmentFilters.unassigned}
                          onChange={() => handleAssignmentFilterChange('unassigned')}
                          className="mr-2"
                        />
                        Unassigned
                      </label>
                    </div>
                  </div>

                  {/* Organization Filters */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Organizations</h4>
                    <input
                      type="text"
                      placeholder="Search orgs..."
                      value={orgSearchTerm}
                      onChange={(e) => setOrgSearchTerm(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded mb-2"
                    />
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {filteredOrganizations.map((org) => (
                        <label key={org.id} className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={organizationFilters[org.name] || false}
                            onChange={() => handleOrganizationFilterChange(org.name)}
                            className="mr-2"
                          />
                          {org.name}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Gym Filters */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Gyms</h4>
                    <input
                      type="text"
                      placeholder="Search gyms..."
                      value={gymSearchTerm}
                      onChange={(e) => setGymSearchTerm(e.target.value)}
                      className="w-full px-2 py-1 text-sm border rounded mb-2"
                    />
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {filteredGyms.map((gym) => (
                        <label key={gym.key} className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={gymFilters[gym.key] || false}
                            onChange={() => handleGymFilterChange(gym.key)}
                            className="mr-2"
                          />
                          <span className="truncate" title={`${gym.organizationName} - ${gym.name}`}>
                            {gym.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sticker Status Filters */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Sticker Status</h4>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={stickerStatusFilters.pending}
                          onChange={() => handleStickerStatusFilterChange('pending')}
                          className="mr-2"
                        />
                        Pending
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={stickerStatusFilters.applied}
                          onChange={() => handleStickerStatusFilterChange('applied')}
                          className="mr-2"
                        />
                        Applied
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={stickerStatusFilters.notApplied}
                          onChange={() => handleStickerStatusFilterChange('notApplied')}
                          className="mr-2"
                        />
                        Not Applied
                      </label>
                    </div>
                  </div>

                  {/* Testing Status Filters */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Testing Status</h4>
                    <div className="space-y-2">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={testingStatusFilters.notTested}
                          onChange={() => handleTestingStatusFilterChange('notTested')}
                          className="mr-2"
                        />
                        Not Tested
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={testingStatusFilters.passed}
                          onChange={() => handleTestingStatusFilterChange('passed')}
                          className="mr-2"
                        />
                        Passed
                      </label>
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={testingStatusFilters.failed}
                          onChange={() => handleTestingStatusFilterChange('failed')}
                          className="mr-2"
                        />
                        Failed
                      </label>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Clear Filters Button */}
            {getActiveFilterCount() > 0 && (
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 text-red-600 hover:bg-red-50 border border-red-300 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Clear All
              </button>
            )}

            {/* Add Device Button */}
            <button
              onClick={handleNewDevice}
              disabled={isLoading}
              className="bg-[#00dba1] text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">+</span>
              Add {activeHardwareTab}
            </button>
          </div>

          {/* Filter Results Info */}
          <div className="mt-4 text-sm text-gray-600">
            {isLoading ? (
              'Loading device data...'
            ) : (
              <>
                Showing {filteredDevices.length} of {devices.filter(d => d.deviceType === activeHardwareTab.toLowerCase()).length} {activeHardwareTab.toLowerCase()}s
                {searchTerm && ` matching "${searchTerm}"`}
                {getActiveFilterCount() > 0 && ` with ${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? 's' : ''} applied`}
              </>
            )}
          </div>
        </div>

        {/* Device Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Device Info
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Assignment
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Gym Location
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  IP Address
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Testing
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Model
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : filteredDevices.length > 0 ? (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {getDeviceIcon(device.deviceType)}
                        </div>
                        <div>
                          <div className="font-medium">{device.deviceName}</div>
                          <div className="text-sm text-gray-500">{device.serial}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${device.organization === 'Unassigned' || !device.organization
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                        }`}>
                        {device.organization || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {device.gym ? (
                        <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                          🏋️ {device.gym}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Not assigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(device.status)}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {device.ipAddress || 'Not set'}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${getTestingColor(device.testing)}`}>
                        {device.testing}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {device.modelNo || 'Not specified'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditDevice(device)}
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                          title="Edit device"
                        >
                          <Image src="/pencil-green.png" alt='pencil' width={20} height={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteDevice(device.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete device"
                        >
                          <Image src="/bin-green.png" alt='bin' width={20} height={20} />
                        </button>
                        <button
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="More options"
                        >
                          ⋮
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    <div className="text-4xl mb-2">
                      {activeHardwareTab === 'Camera' ? <Image src="/camera.png" alt="Camera" width={24} height={24} /> : <Image src="/sensor.png" alt="Sensor" width={24} height={24} />}
                    </div>
                    <div className="text-lg mb-1">No {activeHardwareTab.toLowerCase()}s found</div>
                    <div className="text-sm">
                      {searchTerm || getActiveFilterCount() > 0
                        ? 'Try adjusting your search or filters'
                        : `Add your first ${activeHardwareTab.toLowerCase()} to the inventory`
                      }
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-black font-semibold">
                {editingDevice ? 'Edit' : 'Add'} {activeHardwareTab} to Inventory
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingDevice(null);
                }}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
                disabled={isSubmitting}
              >
                ×
              </button>
            </div>

            {/* Device Form */}
            <form onSubmit={editingDevice ? handleUpdateDevice : handleAddDevice} className="space-y-4">

              {/* Device ID and Assignment */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-[#00dba1]">Device ID *</label>
                  <input
                    type="text"
                    name="deviceId"
                    value={formData.deviceId}
                    onChange={handleInputChange}
                    placeholder={`${activeHardwareTab.substring(0, 3).toUpperCase()}-01`}
                    className="w-full px-3 py-2 bg-white border border-slate-600 rounded text-black focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[#00dba1]">Assignment</label>
                  <select
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-slate-600 rounded text-black focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="Unassigned">Unassigned (Inventory)</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.name}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gym Selection (only when organization is selected) */}
              {formData.organization !== 'Unassigned' && (
                <div>
                  <label className="block text-sm mb-1 text-blue-400">
                    Gym Location
                    {gymsLoading && (
                      <span className="ml-2 text-xs text-yellow-400">
                        🔄 Loading gyms...
                      </span>
                    )}
                  </label>

                  {availableGyms.length > 0 ? (
                    <select
                      name="gym"
                      value={formData.gym}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-slate-600 rounded text-black focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting || gymsLoading}
                    >
                      <option value="">Select a gym (optional)</option>
                      {availableGyms.map((gym) => (
                        <option key={gym.id} value={gym.name}>
                          🏋️ {gym.name}
                        </option>
                      ))}
                    </select>
                  ) : !gymsLoading ? (
                    <div className="bg-slate-600 border border-slate-500 rounded p-3">
                      <div className="text-sm text-yellow-400 flex items-center gap-2">
                        <span>⚠️</span>
                        No gym locations found for {formData.organization}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Device will be assigned to organization level only
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-700 border border-slate-600 rounded p-3">
                      <div className="text-sm text-blue-400 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                        Loading gym locations...
                      </div>
                    </div>
                  )}

                  {availableGyms.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      Select specific gym location within {formData.organization}
                    </div>
                  )}
                </div>
              )}

              {/* IP Address and Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 font-medium text-[#00dba1]">IP Address</label>
                  <input
                    type="text"
                    name="ipAddress"
                    value={formData.ipAddress}
                    onChange={handleInputChange}
                    placeholder="192.168.1.100"
                    className="w-full px-3 py-2 bg-white border border-slate-600 rounded text-black focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[]">Model No</label>
                  <input
                    type="text"
                    name="modelNo"
                    value={formData.modelNo}
                    onChange={handleInputChange}
                    placeholder="Model number"
                    className="w-full px-3 py-2 bg-white border border-slate-600 rounded text-black focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Lens (only for cameras) */}
              {activeHardwareTab === 'Camera' && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#00dba1]">Lens</label>
                  <input
                    type="text"
                    name="lens"
                    value={formData.lens}
                    onChange={handleInputChange}
                    placeholder="in mm"
                    className="w-full px-3 py-2 bg-white border border-slate-600 rounded text-black focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Status Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#00dba1]">Sticker Status</label>
                  <select
                    name="stickerStatus"
                    value={formData.stickerStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-slate-600 rounded text-black focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Applied">Applied</option>
                    <option value="Not Applied">Not Applied</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#00dba1]">Testing Status</label>
                  <select
                    name="testingStatus"
                    value={formData.testingStatus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-slate-600 rounded text-black focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="not tested yet">Not tested yet</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || gymsLoading}
                className="w-full bg-[#00dba1]  text-white py-3 rounded hover:bg-blue-700 font-medium mt-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingDevice ? 'Updating...' : 'Adding...'}
                  </div>
                ) : (
                  `${editingDevice ? 'Update' : 'Add'} ${activeHardwareTab}`
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hardware;