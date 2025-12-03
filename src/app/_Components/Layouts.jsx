import React, { useState, useEffect } from 'react';
import { layoutsApi } from '../api/layouts-api';

function Layouts() {
  // Selection states
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [selectedGym, setSelectedGym] = useState(null);
  const [selectedLayout, setSelectedLayout] = useState(null);
  
  // Data states
  const [organizations, setOrganizations] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [customLayouts, setCustomLayouts] = useState([]);
  
  // Loading states
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [isLoadingGyms, setIsLoadingGyms] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isLoadingCustomLayouts, setIsLoadingCustomLayouts] = useState(false);
  
  // Hotspot and camera states
  const [hotspots, setHotspots] = useState([]);
  const [activeHotspot, setActiveHotspot] = useState(null);
  
  // Saved layouts states
  const [savedLayouts, setSavedLayouts] = useState([]);
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(false);
  
  // UI states
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [pendingHotspot, setPendingHotspot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // NEW: Organization search state
  const [orgSearchTerm, setOrgSearchTerm] = useState('');
  
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    file: null,
    filePreview: null
  });

  // Static layouts for now
  const [layouts] = useState([
    { id: 1, name: 'Main Floor', image: '/layouts/main-floor.jpg', type: 'predefined' },
    { id: 2, name: 'Upper Level', image: '/layouts/upper-level.jpg', type: 'predefined' },
    { id: 3, name: 'Basement', image: '/layouts/basement.jpg', type: 'predefined' },
    { id: 4, name: 'Outdoor Area', image: '/layouts/outdoor.jpg', type: 'predefined' }
  ]);

  // Fetch organizations via API
  const fetchOrganizations = async () => {
    setIsLoadingOrgs(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://sbackend.duckdns.org/api/api'}/organizations`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      const data = await response.json();
      console.log('Raw response from backend:', data);
      
      // Check both HTTP status AND success field in response
      if (response.ok && data.success) {
        const orgsData = data.data || [];
        setOrganizations(orgsData);
        console.log('Organizations loaded via API:', orgsData);
      } else {
        console.error('Failed to fetch organizations:', data.error || data.message);
        setOrganizations([]);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  // Fetch gyms via API
  const fetchGyms = async (organizationId) => {
    if (!organizationId) {
      setGyms([]);
      return;
    }
    
    setIsLoadingGyms(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://sbackend.duckdns.org/api/api'}/organizations/${organizationId}/gyms`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      const data = await response.json();
      console.log('Raw gyms response from backend:', data);
      
      if (response.ok && data.success) {
        const gymsData = data.data || [];
        setGyms(gymsData);
        console.log('Gyms loaded via API:', gymsData);
      } else {
        console.error('Failed to fetch gyms:', data.error || data.message);
        setGyms([]);
      }
    } catch (error) {
      console.error('Error fetching gyms:', error);
      setGyms([]);
    } finally {
      setIsLoadingGyms(false);
    }
  };

  // Fetch custom layouts via API
  const fetchCustomLayouts = async (organizationId, gymId = null) => {
    if (!organizationId) {
      setCustomLayouts([]);
      return;
    }
    
    setIsLoadingCustomLayouts(true);
    try {
      const result = await layoutsApi.custom.getAll(organizationId, gymId);
      console.log('Raw custom layouts response:', result);
      
      if (result.success) {
        const layoutsData = result.data || result.layouts || [];
        setCustomLayouts(layoutsData);
        console.log('Custom layouts loaded via API:', layoutsData);
      } else {
        console.error('Failed to fetch custom layouts:', result.error);
        setCustomLayouts([]);
      }
    } catch (error) {
      console.error('Error fetching custom layouts:', error);
      setCustomLayouts([]);
    } finally {
      setIsLoadingCustomLayouts(false);
    }
  };

  // Fetch devices via API
const fetchDevices = async (organizationId, gymId = null) => {
  if (!organizationId) {
    setDevices([]);
    return;
  }
  
  setIsLoadingDevices(true);
  try {
    console.log(`Fetching devices for org: ${organizationId}, gym: ${gymId || 'org-level'}`);
    
    // Use the layoutsApi.devices to fetch devices
    const filters = {
      type: 'camera', // Only get cameras for layout placement
      limit: 200
    };
    
    // If gymId is provided, filter by gym; otherwise get org-level devices
    if (gymId) {
      filters.gymId = gymId;
    } else {
      filters.gymId = null; // Explicitly get org-level devices
    }
    
    const result = await layoutsApi.devices.getAll(organizationId, filters);
    console.log('Raw devices response from backend:', result);
    
    if (result.success) {
      const devicesData = result.data || [];
      setDevices(devicesData);
      console.log(`✅ Devices loaded via API: ${devicesData.length} devices`);
    } else {
      console.error('Failed to fetch devices:', result.error);
      setDevices([]);
    }
  } catch (error) {
    console.error('Error fetching devices:', error);
    setDevices([]);
  } finally {
    setIsLoadingDevices(false);
  }
};
  // Fetch saved layouts via API
  const fetchSavedLayouts = async (organizationId, gymId = null) => {
    if (!organizationId) {
      setSavedLayouts([]);
      return;
    }
    
    setIsLoadingLayouts(true);
    try {
      const result = await layoutsApi.saved.getAll(organizationId, gymId);
      console.log('Raw saved layouts response:', result);
      
      if (result.success) {
        const layoutsData = result.data || result.layouts || [];
        setSavedLayouts(layoutsData);
        console.log('Saved layouts loaded via API:', layoutsData);
      } else {
        console.error('Failed to fetch saved layouts:', result.error);
        setSavedLayouts([]);
      }
    } catch (error) {
      console.error('Error fetching saved layouts:', error);
      setSavedLayouts([]);
    } finally {
      setIsLoadingLayouts(false);
    }
  };

  // Helper to get auth token
  const getAuthToken = async () => {
    const { auth } = await import('../api/firebase');
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return await user.getIdToken();
  };

  // Handle file selection with preview
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadForm(prev => ({
        ...prev,
        file: file,
        filePreview: e.target.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Upload layout using API
  const handleLayoutUpload = async () => {
    if (!uploadForm.file || !uploadForm.name.trim()) {
      alert('Please provide a name and select an image file');
      return;
    }

    if (!selectedOrganization) {
      alert('Please select an organization first');
      return;
    }

    setIsUploading(true);
    try {
      console.log('Starting upload process via API...');
      
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(uploadForm.file);
      });
      
      const base64Image = await base64Promise;
      
      const base64SizeInMB = (base64Image.length * 0.75) / 1024 / 1024;
      console.log('Base64 size (approximate):', base64SizeInMB.toFixed(2), 'MB');
      
      if (base64SizeInMB > 0.8) {
        alert(`Image is too large (${base64SizeInMB.toFixed(2)}MB). Please use an image smaller than 800KB for base64 storage.`);
        return;
      }
      
      const layoutData = {
        name: uploadForm.name.trim(),
        description: uploadForm.description.trim() || '',
        imageURL: base64Image,
        gymId: selectedGym?.id || null,
        gymName: selectedGym?.name || 'Organization Level',
        fileName: uploadForm.file.name,
        fileSize: uploadForm.file.size,
        fileType: uploadForm.file.type
      };
      
      console.log('Uploading layout via API...');
      const result = await layoutsApi.custom.create(selectedOrganization.id, layoutData);
      console.log('Upload result:', result);
      
      if (result.success) {
        console.log('Layout uploaded successfully via API:', result.layout || result.data);
        
        await fetchCustomLayouts(selectedOrganization.id, selectedGym?.id || null);
        
        setUploadForm({
          name: '',
          description: '',
          file: null,
          filePreview: null
        });
        setShowUploadModal(false);
        
        alert('Layout uploaded successfully!');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading layout:', error);
      alert(`Error uploading layout: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete custom layout via API
  const deleteCustomLayout = async (layout) => {
    if (!confirm(`Are you sure you want to delete "${layout.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await layoutsApi.custom.delete(
        selectedOrganization.id, 
        layout.id, 
        selectedGym?.id || null
      );
      
      if (result.success) {
        console.log('Layout deleted successfully via API');
        await fetchCustomLayouts(selectedOrganization.id, selectedGym?.id || null);
        
        if (selectedLayout?.id === layout.id) {
          setSelectedLayout(null);
          setHotspots([]);
        }
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting layout:', error);
      alert(`Error deleting layout: ${error.message}`);
    }
  };

  // Load hotspots from a saved layout
  const loadSavedLayout = (savedLayout) => {
    if (savedLayout.hotspots && savedLayout.hotspots.length > 0) {
      const layout = layouts.find(l => l.id === savedLayout.layoutId) || 
                     customLayouts.find(l => l.id === savedLayout.layoutId);
      
      if (layout) {
        setSelectedLayout(layout);
        setHotspots(savedLayout.hotspots);
        console.log('Loaded saved layout:', savedLayout);
      }
    }
  };

  // Get available cameras
  const getAvailableCameras = () => {
    return devices.filter(device => {
      const isAvailable = device.status === 'Inventory' || 
                         device.status === 'Assigned' || 
                         device.status === 'Active';
      
      const matchesContext = selectedGym 
        ? device.gymId === selectedGym.id 
        : (!device.gymId || device.gymId === null);
      
      return isAvailable && matchesContext;
    });
  };

  // Filter cameras based on search term
  const getFilteredCameras = () => {
    const availableCameras = getAvailableCameras();
    
    if (!searchTerm) return availableCameras;
    
    return availableCameras.filter(camera =>
      camera.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camera.serial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camera.modelNo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Filter organizations based on search term
  const getFilteredOrganizations = () => {
    if (!orgSearchTerm) return organizations;
    
    return organizations.filter(org =>
      org.name.toLowerCase().includes(orgSearchTerm.toLowerCase()) ||
      org.id.toLowerCase().includes(orgSearchTerm.toLowerCase())
    );
  };

  // Handle image click to place camera
  const handleImageClick = (e) => {
    if (!selectedLayout) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setPendingHotspot({ x, y });
    setShowCameraSelector(true);
  };

  // Handle camera selection for hotspot
  const handleCameraSelect = (camera) => {
    if (pendingHotspot) {
      const newHotspot = {
        id: Date.now(),
        x: pendingHotspot.x,
        y: pendingHotspot.y,
        camera: camera,
        organizationId: selectedOrganization.id,
        organizationName: selectedOrganization.name,
        gymId: selectedGym?.id || null,
        gymName: selectedGym?.name || 'Organization Level',
        layoutId: selectedLayout.id,
        layoutName: selectedLayout.name,
        createdAt: new Date().toISOString(),
        cameraId: camera.id,
        cameraName: camera.deviceName
      };
      
      setHotspots([...hotspots, newHotspot]);
      setShowCameraSelector(false);
      setPendingHotspot(null);
      setSearchTerm('');
      
      console.log('Camera placed:', newHotspot);
    }
  };

  // Remove hotspot
  const removeHotspot = (hotspotId) => {
    setHotspots(hotspots.filter(h => h.id !== hotspotId));
    setActiveHotspot(null);
  };

  // Save hotspots via API
  const saveHotspotsToFirestore = async () => {
    if (!selectedOrganization || !selectedLayout || hotspots.length === 0) {
      console.warn('Cannot save: Missing organization, layout, or no hotspots');
      alert('Cannot save: Please select organization, layout, and place at least one camera');
      return;
    }

    try {
      console.log('Saving layout via API:', hotspots);
      
      const layoutData = {
        layoutId: selectedLayout.id,
        layoutName: selectedLayout.name,
        layoutType: selectedLayout.type || 'predefined',
        gymId: selectedGym?.id || null,
        gymName: selectedGym?.name || 'Organization Level',
        totalCameras: hotspots.length,
        hotspots: hotspots.map(hotspot => ({
          id: hotspot.id,
          x: hotspot.x,
          y: hotspot.y,
          cameraId: hotspot.cameraId,
          cameraName: hotspot.cameraName,
          camera: {
            id: hotspot.camera.id,
            deviceName: hotspot.camera.deviceName,
            serial: hotspot.camera.serial,
            modelNo: hotspot.camera.modelNo,
            ipAddress: hotspot.camera.ipAddress,
            status: hotspot.camera.status
          },
          createdAt: hotspot.createdAt
        }))
      };
      
      const result = await layoutsApi.saved.create(selectedOrganization.id, layoutData);
      console.log('Save result:', result);
      
      if (result.success) {
        console.log('Layout saved successfully via API:', result.layout || result.data);
        alert(`Layout saved successfully! ${hotspots.length} cameras placed in ${selectedLayout.name}`);
        await fetchSavedLayouts(selectedOrganization.id, selectedGym?.id || null);
      } else {
        throw new Error(result.error || 'Save failed');
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      alert(`Error saving layout: ${error.message}`);
    }
  };

  // UseEffects
  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrganization) {
      fetchGyms(selectedOrganization.id);
      fetchCustomLayouts(selectedOrganization.id, selectedGym?.id || null);
      fetchSavedLayouts(selectedOrganization.id, selectedGym?.id || null);
    } else {
      setGyms([]);
      setCustomLayouts([]);
      setSavedLayouts([]);
    }
  }, [selectedOrganization]);

  useEffect(() => {
    if (selectedOrganization) {
      fetchDevices(selectedOrganization.id, selectedGym?.id || null);
      fetchCustomLayouts(selectedOrganization.id, selectedGym?.id || null);
      fetchSavedLayouts(selectedOrganization.id, selectedGym?.id || null);
    } else {
      setDevices([]);
    }
  }, [selectedOrganization, selectedGym]);

  useEffect(() => {
    setSelectedGym(null);
    setSelectedLayout(null);
    setHotspots([]);
  }, [selectedOrganization]);

  useEffect(() => {
    setSelectedLayout(null);
    setHotspots([]);
  }, [selectedGym]);

  useEffect(() => {
    setHotspots([]);
  }, [selectedLayout]);

  const filteredCameras = getFilteredCameras();
  const filteredOrganizations = getFilteredOrganizations();

  return (
    <div className="p-6 max-w-7xl mx-auto overflow-y-scroll">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Camera Layout Management</h1>
        <p className="text-gray-600">Select organization, gym, and layout to place cameras</p>
        {(isLoadingOrgs || isLoadingGyms || isLoadingDevices) && (
          <div className="mt-2 text-sm text-blue-600">
            Loading data via API...
          </div>
        )}
      </div>

      {/* Selection Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* Step 1: Organization Selection */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <h3 className="font-semibold text-lg">Select Organization</h3>
          </div>
          
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search organizations..."
                value={orgSearchTerm}
                onChange={(e) => setOrgSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <span className="absolute left-2.5 top-2.5 text-gray-400">🔍</span>
              {orgSearchTerm && (
                <button
                  onClick={() => setOrgSearchTerm('')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            {orgSearchTerm && (
              <div className="text-xs text-gray-500 mt-1">
                Found {filteredOrganizations.length} organization(s)
              </div>
            )}
          </div>
          
          {isLoadingOrgs ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Loading organizations...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredOrganizations.length > 0 ? (
                filteredOrganizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setSelectedOrganization(org);
                      setOrgSearchTerm('');
                    }}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      selectedOrganization?.id === org.id
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-gray-500">
                      ID: {org.id}
                    </div>
                  </button>
                ))
              ) : orgSearchTerm ? (
                <div className="text-sm text-gray-500 p-3 bg-yellow-50 rounded">
                  No organizations found matching "{orgSearchTerm}"
                </div>
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
                  No organizations found
                </div>
              )}
            </div>
          )}
          
          {selectedOrganization && (
            <div className="mt-4 p-2 bg-blue-50 rounded text-sm">
              <span className="text-blue-800 font-medium">Selected:</span>
              <span className="text-blue-600 ml-1">{selectedOrganization.name}</span>
            </div>
          )}
        </div>

        {/* Step 2: Gym Selection */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              selectedOrganization ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
            }`}>2</span>
            <h3 className="font-semibold text-lg">Select Gym Location</h3>
          </div>
          
          {selectedOrganization ? (
            isLoadingGyms ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading gyms...</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <button
                  onClick={() => setSelectedGym(null)}
                  className={`w-full text-left p-3 rounded border transition-colors ${
                    selectedGym === null && selectedOrganization
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="font-medium">Organization Level</div>
                  <div className="text-sm text-gray-500">General organization layout</div>
                </button>
                
                {gyms.length > 0 ? (
                  gyms.map((gym) => (
                    <button
                      key={gym.id}
                      onClick={() => setSelectedGym(gym)}
                      className={`w-full text-left p-3 rounded border transition-colors ${
                        selectedGym?.id === gym.id
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="font-medium">{gym.name}</div>
                      <div className="text-sm text-gray-500">
                        ID: {gym.id}
                      </div>
                      {gym.address && (
                        <div className="text-xs text-gray-400">
                          {gym.address}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <span>⚠</span>
                      No gym locations found
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
              Select an organization first
            </div>
          )}
        </div>

        {/* Step 3: Layout Selection */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              selectedOrganization ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
            }`}>3</span>
            <h3 className="font-semibold text-lg">Select Layout</h3>
          </div>
          
          {selectedOrganization ? (
            <>
              <div className="mb-4">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-lg">📤</span>
                  Upload Custom Layout
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Predefined Layouts
                </div>
                {layouts.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => setSelectedLayout(layout)}
                    className={`w-full text-left p-3 rounded border transition-colors ${
                      selectedLayout?.id === layout.id
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-medium">{layout.name}</div>
                    <div className="text-sm text-gray-500">Floor plan layout</div>
                  </button>
                ))}
                
                {customLayouts.length > 0 && (
                  <>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 mt-4 flex items-center gap-2">
                      Custom Layouts ({customLayouts.length})
                      {isLoadingCustomLayouts && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      )}
                    </div>
                    {customLayouts.map((layout) => (
                      <div
                        key={layout.id}
                        className={`relative border rounded transition-colors ${
                          selectedLayout?.id === layout.id
                            ? 'bg-green-100 border-green-300'
                            : 'border-gray-200'
                        }`}
                      >
                        <button
                          onClick={() => setSelectedLayout({
                            ...layout,
                            image: layout.imageURL
                          })}
                          className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium">{layout.name}</div>
                          <div className="text-sm text-gray-500">
                            {layout.description || 'Custom layout'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {(layout.fileSize / 1024 / 1024).toFixed(1)}MB • 
                            Created: {new Date(layout.createdAt).toLocaleDateString()}
                          </div>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomLayout(layout);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors flex items-center justify-center"
                          title="Delete layout"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded">
              Select an organization first
            </div>
          )}
        </div>
      </div>

      {/* Current Selection Summary */}
      {selectedOrganization && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Current Selection:</h4>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span className="bg-blue-100 px-2 py-1 rounded">
              {selectedOrganization.name}
            </span>
            <span className="text-blue-600">→</span>
            <span className="bg-blue-100 px-2 py-1 rounded">
              {selectedGym ? selectedGym.name : 'Organization Level'}
            </span>
            {selectedLayout && (
              <>
                <span className="text-blue-600">→</span>
                <span className="bg-blue-100 px-2 py-1 rounded">
                  {selectedLayout.name}
                </span>
              </>
            )}
          </div>
          
          <div className="mt-2 text-sm text-blue-700">
            Available cameras: {filteredCameras.length} | Placed cameras: {hotspots.length}
            {selectedGym ? (
              <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
                Showing cameras assigned to {selectedGym.name}
              </span>
            ) : (
              <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
                Showing organization-level cameras
              </span>
            )}
          </div>
          
          {hotspots.length > 0 && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={saveHotspotsToFirestore}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
              >
                Save Layout ({hotspots.length} cameras)
              </button>
              <button
                onClick={() => setHotspots([])}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
          
          {savedLayouts.length > 0 && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <h5 className="font-medium text-green-800 mb-2">
                Saved Layouts ({savedLayouts.length})
              </h5>
              <div className="space-y-1">
                {savedLayouts.slice(0, 3).map((savedLayout) => (
                  <button
                    key={savedLayout.id}
                    onClick={() => loadSavedLayout(savedLayout)}
                    className="w-full text-left p-2 text-xs bg-white border border-green-300 rounded hover:bg-green-50 transition-colors"
                  >
                    <div className="font-medium">
                      {savedLayout.layoutName} ({savedLayout.totalCameras} cameras)
                    </div>
                    <div className="text-green-600">
                      Saved: {new Date(savedLayout.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
                {savedLayouts.length > 3 && (
                  <div className="text-xs text-green-600">
                    + {savedLayouts.length - 3} more saved layouts
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Layout Display */}
      {selectedLayout ? (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">
                {selectedLayout.name} - Camera Placement
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {hotspots.length} camera{hotspots.length !== 1 ? 's' : ''} placed
                </span>
                <button
                  onClick={() => setHotspots([])}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  disabled={hotspots.length === 0}
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              Click on the layout to place cameras from your inventory
            </div>
          </div>
          
          <div className="relative">
            <img
              src={selectedLayout.image || "/floorImg.jpg"}
              alt={selectedLayout.name}
              className="w-full h-96 object-cover cursor-crosshair"
              onClick={handleImageClick}
              onError={(e) => {
                e.target.src = "/floorImg.jpg";
              }}
            />
            
            {hotspots.map((spot) => (
              <div
                key={spot.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspot(spot);
                }}
                className="absolute w-6 h-6 bg-red-500 border-2 border-white rounded-full cursor-pointer hover:bg-red-600 transition-colors shadow-lg flex items-center justify-center"
                style={{
                  top: `${spot.y}%`,
                  left: `${spot.x}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={`${spot.camera.deviceName} - ${spot.camera.modelNo || 'No model'}`}
              />
            ))}
            
            {pendingHotspot && (
              <div
                className="absolute w-6 h-6 bg-yellow-500 border-2 border-white rounded-full animate-pulse"
                style={{
                  top: `${pendingHotspot.y}%`,
                  left: `${pendingHotspot.x}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}
            
            <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
              {selectedLayout.type === 'custom' ? 'Custom' : 'Predefined'}
            </div>
          </div>
        </div>
      ) : selectedOrganization ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Layout</h3>
          <p className="text-gray-600">Choose a floor plan layout to start placing cameras</p>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Get Started</h3>
          <p className="text-gray-600">Select an organization and gym to begin camera placement</p>
        </div>
      )}

      {/* Layout Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw] max-h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Upload Custom Layout</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadForm({
                    name: '',
                    description: '',
                    file: null,
                    filePreview: null
                  });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                disabled={isUploading}
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <div className="text-sm text-blue-800">
                  <strong>Uploading to:</strong> {selectedOrganization?.name}
                  {selectedGym && ` → ${selectedGym.name}`}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Layout Name *
                </label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Ground Floor Plan, Warehouse Layout"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isUploading}
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the layout..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  disabled={isUploading}
                  maxLength={500}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Layout Image *
                </label>
                
                {!uploadForm.filePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="text-sm text-gray-600 mb-3">
                      Click to select an image file
                    </div>
                    
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      className="hidden"
                      id="layout-upload"
                    />
                    
                    <label
                      htmlFor="layout-upload"
                      className={`inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition-colors ${
                        isUploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Select Image
                    </label>
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={uploadForm.filePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3 bg-gray-50">
                      <div className="text-sm font-medium">{uploadForm.file.name}</div>
                      <div className="text-xs text-gray-500">
                        {(uploadForm.file.size / 1024 / 1024).toFixed(1)}MB • {uploadForm.file.type}
                      </div>
                      <button
                        onClick={() => setUploadForm(prev => ({ ...prev, file: null, filePreview: null }))}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                        disabled={isUploading}
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <strong>Requirements:</strong><br />
                • Supported formats: JPEG, PNG, GIF, WebP<br />
                • Max file size: 10MB<br />
                • Recommended: High resolution floor plans or blueprints
              </div>
              
              <button
                onClick={handleLayoutUpload}
                disabled={isUploading || !uploadForm.file || !uploadForm.name.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading layout...
                  </div>
                ) : (
                  'Upload Layout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Selector Modal */}
      {showCameraSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Camera</h3>
              <button
                onClick={() => {
                  setShowCameraSelector(false);
                  setPendingHotspot(null);
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>Location:</strong> {selectedOrganization?.name}
                {selectedGym && ` → ${selectedGym.name}`}
              </div>
              <div className="text-sm text-blue-600">
                <strong>Layout:</strong> {selectedLayout?.name}
              </div>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search cameras by name, serial, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {isLoadingDevices && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading cameras...</span>
              </div>
            )}
            
            {!isLoadingDevices && (
              <div className="flex-1 overflow-y-auto space-y-2">
                {filteredCameras.length > 0 ? (
                  filteredCameras.map((camera) => (
                    <button
                      key={camera.id}
                      onClick={() => handleCameraSelect(camera)}
                      className="w-full text-left p-3 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="font-medium">{camera.deviceName}</div>
                      <div className="text-sm text-gray-500">
                        Serial: {camera.serial} | Model: {camera.modelNo || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">
                        Status: {camera.status} | IP: {camera.ipAddress || 'Not set'}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-sm">
                      {searchTerm ? 'No cameras match your search' : 'No cameras available for this location'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Hotspot Details */}
      {activeHotspot && (
        <div className="fixed bottom-4 right-4 p-4 bg-white shadow-xl rounded-lg border w-80">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-bold">Camera Details</h3>
            <button
              onClick={() => setActiveHotspot(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div><strong>Device:</strong> {activeHotspot.camera.deviceName}</div>
            <div><strong>Serial:</strong> {activeHotspot.camera.serial}</div>
            <div><strong>Model:</strong> {activeHotspot.camera.modelNo || 'Not specified'}</div>
            <div><strong>Status:</strong> {activeHotspot.camera.status}</div>
            <div><strong>IP Address:</strong> {activeHotspot.camera.ipAddress || 'Not set'}</div>
            <div><strong>Organization:</strong> {activeHotspot.organizationName}</div>
            <div><strong>Location:</strong> {activeHotspot.gymName}</div>
            <div><strong>Layout:</strong> {activeHotspot.layoutName}</div>
            <div><strong>Position:</strong> {activeHotspot.x.toFixed(1)}%, {activeHotspot.y.toFixed(1)}%</div>
            <div><strong>Placed:</strong> {new Date(activeHotspot.createdAt).toLocaleString()}</div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
              onClick={() => setActiveHotspot(null)}
            >
              Close
            </button>
            <button
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
              onClick={() => removeHotspot(activeHotspot.id)}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Layouts;