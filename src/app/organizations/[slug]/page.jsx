"use client"
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, MoreVertical, TrendingUp, Users, MapPin, Calendar } from 'lucide-react';
// REMOVED: Direct Firebase imports
// import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, serverTimestamp, onSnapshot } from 'firebase/firestore';
// import { db } from '../../api/firebase';

// ADDED: API client and Firebase auth
import { gymsApi } from '../../api/api-clients-with-gyms';
import { auth } from '../../api/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useParams } from 'next/navigation';

const GymManagementDashboard = () => {
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedGyms, setSelectedGyms] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGym, setEditingGym] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [error, setError] = useState('');

  // Organization data (this would come from your auth/context)
  const organizationData = {
    name: user?.organizationName || "FitLife Organization",
    totalGyms: gyms.length,
    activeMembers: gyms.reduce((total, gym) => total + (gym.members || 0), 0),
    monthlyRevenue: `${gyms.reduce((total, gym) => total + (gym.monthlyRevenue || 0), 0).toLocaleString()}`,
    growthRate: "+18%"
  };

  const params = useParams();
  const id = params.slug;
  
  console.log('Organization ID:', id);

  // Initial gym form state with coordinates added
  const initialGymState = {
    name: '',
    address: '',
    phone: '',
    email: '',
    capacity: '',
    organizationId: '',
    manager: '',
    status: 'ACTIVE',
    openingTime: '',
    closingTime: '',
    amenities: [],
    latitude: '',
    longitude: ''
  };

  const [gymForm, setGymForm] = useState(initialGymState);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const token = await currentUser.getIdTokenResult();
        console.log('User authenticated:', token);
        setOrganizationId(id || 'default-org');
      } else {
        setUser(null);
        setOrganizationId(null);
        setGyms([]);
      }
    });

    return () => unsubscribe();
  }, [id]);

  // Load gyms when user and organization ID are available
  useEffect(() => {
    if (user && organizationId) {
      loadGyms();
      
      // Set up polling for real-time updates (every 10 seconds)
      const pollInterval = setInterval(() => {
        loadGyms();
      }, 10000);

      return () => clearInterval(pollInterval);
    }
  }, [user, organizationId]);

  // UPDATED: Load gyms via API
  const loadGyms = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Fetching gyms for organization:', organizationId);
      const result = await gymsApi.getAll(organizationId);

      if (result.success) {
        setGyms(result.data || []);
        console.log('Loaded gyms:', result.data);
      } else {
        console.error('Failed to load gyms:', result.error);
        setError(result.error || 'Failed to load gyms');
        setGyms([]);
      }
    } catch (error) {
      console.error('Error loading gyms:', error);
      setError('Failed to load gyms: ' + error.message);
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Create gym via API
  const createGym = async (gymData) => {
    if (!organizationId || !user) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Creating gym:', gymData);

      const result = await gymsApi.create(organizationId, {
        name: gymData.name,
        address: gymData.address,
        phone: gymData.phone,
        email: gymData.email,
        capacity: parseInt(gymData.capacity),
        manager: gymData.manager,
        status: gymData.status,
        openingTime: gymData.openingTime,
        closingTime: gymData.closingTime,
        amenities: gymData.amenities,
        latitude: gymData.latitude ? parseFloat(gymData.latitude) : null,
        longitude: gymData.longitude ? parseFloat(gymData.longitude) : null,
      });

      if (result.success) {
        console.log('Gym created successfully:', result.data);
        setShowAddModal(false);
        setGymForm(initialGymState);
        
        // Reload gyms to show the new one
        await loadGyms();
        
        alert('Gym created successfully!');
      } else {
        console.error('Failed to create gym:', result.error);
        setError(result.error || 'Failed to create gym');
        alert('Failed to create gym: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating gym:', error);
      setError('Failed to create gym: ' + error.message);
      alert('Error creating gym: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Update gym via API
  const updateGym = async (gymId, gymData) => {
    if (!organizationId || !user) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Updating gym:', gymId, gymData);

      const result = await gymsApi.update(organizationId, gymId, {
        name: gymData.name,
        address: gymData.address,
        phone: gymData.phone,
        email: gymData.email,
        capacity: parseInt(gymData.capacity),
        manager: gymData.manager,
        status: gymData.status,
        openingTime: gymData.openingTime,
        closingTime: gymData.closingTime,
        amenities: gymData.amenities,
        latitude: gymData.latitude ? parseFloat(gymData.latitude) : null,
        longitude: gymData.longitude ? parseFloat(gymData.longitude) : null,
      });

      if (result.success) {
        console.log('Gym updated successfully:', result.data);
        setShowEditModal(false);
        setEditingGym(null);
        setGymForm(initialGymState);
        
        // Reload gyms to show updates
        await loadGyms();
        
        alert('Gym updated successfully!');
      } else {
        console.error('Failed to update gym:', result.error);
        setError(result.error || 'Failed to update gym');
        alert('Failed to update gym: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating gym:', error);
      setError('Failed to update gym: ' + error.message);
      alert('Error updating gym: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Delete gym via API
  const deleteGym = async (gymId) => {
    if (!organizationId || !user) {
      setError('User not authenticated');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this gym?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Deleting gym:', gymId);

      const result = await gymsApi.delete(organizationId, gymId);

      if (result.success) {
        console.log('Gym deleted successfully');
        
        // Reload gyms to reflect deletion
        await loadGyms();
        
        alert('Gym deleted successfully!');
      } else {
        console.error('Failed to delete gym:', result.error);
        setError(result.error || 'Failed to delete gym');
        alert('Failed to delete gym: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting gym:', error);
      setError('Failed to delete gym: ' + error.message);
      alert('Error deleting gym: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (gym) => {
    console.log('Editing gym:', gym);
    setEditingGym(gym);
    setGymForm({
      name: gym.name || '',
      address: gym.address || '',
      phone: gym.phone || '',
      email: gym.email || '',
      capacity: gym.capacity?.toString() || '',
      manager: gym.manager || '',
      status: gym.status || 'ACTIVE',
      openingTime: gym.openingTime || '',
      closingTime: gym.closingTime || '',
      amenities: gym.amenities || [],
      latitude: gym.latitude?.toString() || '',
      longitude: gym.longitude?.toString() || '',
    });
    setShowEditModal(true);
  };

  const handleDelete = (gymId) => {
    deleteGym(gymId);
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!gymForm.name || !gymForm.address || !gymForm.phone || !gymForm.email || !gymForm.capacity || !gymForm.manager) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingGym) {
      updateGym(editingGym.id, gymForm);
    } else {
      createGym(gymForm);
    }
  };

  const handleCheckbox = (gymId) => {
    setSelectedGyms(prev => 
      prev.includes(gymId) 
        ? prev.filter(id => id !== gymId)
        : [...prev, gymId]
    );
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'CLOSED':
        return 'bg-red-100 text-red-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredGyms = gyms.filter(gym =>
    gym.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gym.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gym.manager?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {loading && gyms.length === 0 ? (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading gyms...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header Stats */}
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">{organizationData.name}</h1>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Gym
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Gyms</p>
                      <p className="text-2xl font-bold text-gray-900">{organizationData.totalGyms}</p>
                    </div>
                    <MapPin className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Members</p>
                      <p className="text-2xl font-bold text-gray-900">{organizationData.activeMembers}</p>
                    </div>
                    <Users className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">₹{organizationData.monthlyRevenue}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Growth Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{organizationData.growthRate}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <p className="font-medium">Error: {error}</p>
              </div>
            )}

            {/* Gym List */}
            <div className="bg-white shadow-sm rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search gyms..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <button
                    onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {viewMode === 'list' ? 'Grid View' : 'List View'}
                  </button>
                </div>
              </div>

              <div className="p-4">
                {viewMode === 'list' ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Manager</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Address</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Capacity</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Members</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGyms.map((gym) => (
                        <tr key={gym.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{gym.name}</div>
                            <div className="text-sm text-gray-500">{gym.email}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{gym.manager}</td>
                          <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{gym.address}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(gym.status)}`}>
                              {gym.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{gym.capacity}</td>
                          <td className="py-3 px-4 text-gray-700">{gym.members || 0}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(gym)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit gym"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(gym.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete gym"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredGyms.map((gym) => (
                      <div key={gym.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{gym.name}</h3>
                            <p className="text-sm text-gray-500">{gym.manager}</p>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(gym.status)}`}>
                            {gym.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{gym.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{gym.members || 0} / {gym.capacity} members</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleEdit(gym)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(gym.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {filteredGyms.length === 0 && !loading && (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No gyms found</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-4 text-blue-600 hover:text-blue-700"
                    >
                      Add your first gym
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal */}
            {(showAddModal || showEditModal) && (
              <div className="fixed inset-0 bg-black/30 backdrop-blur-md bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      {editingGym ? 'Edit Gym' : 'Add New Gym'}
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gym Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={gymForm.name}
                            onChange={(e) => setGymForm({...gymForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Manager *
                          </label>
                          <input
                            type="text"
                            required
                            value={gymForm.manager}
                            onChange={(e) => setGymForm({...gymForm, manager: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address *
                        </label>
                        <input
                          type="text"
                          required
                          value={gymForm.address}
                          onChange={(e) => setGymForm({...gymForm, address: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone *
                          </label>
                          <input
                            type="tel"
                            required
                            value={gymForm.phone}
                            onChange={(e) => setGymForm({...gymForm, phone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={gymForm.email}
                            onChange={(e) => setGymForm({...gymForm, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Latitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={gymForm.latitude}
                            onChange={(e) => setGymForm({...gymForm, latitude: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Longitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={gymForm.longitude}
                            onChange={(e) => setGymForm({...gymForm, longitude: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Capacity *
                          </label>
                          <input
                            type="number"
                            required
                            value={gymForm.capacity}
                            onChange={(e) => setGymForm({...gymForm, capacity: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Opening Time
                          </label>
                          <input
                            type="time"
                            value={gymForm.openingTime}
                            onChange={(e) => setGymForm({...gymForm, openingTime: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Closing Time
                          </label>
                          <input
                            type="time"
                            value={gymForm.closingTime}
                            onChange={(e) => setGymForm({...gymForm, closingTime: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          value={gymForm.status}
                          onChange={(e) => setGymForm({...gymForm, status: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="MAINTENANCE">Maintenance</option>
                          <option value="CLOSED">Closed</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>

                      <div className="flex justify-end space-x-4 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddModal(false);
                            setShowEditModal(false);
                            setEditingGym(null);
                            setGymForm(initialGymState);
                          }}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : (editingGym ? 'Update Gym' : 'Add Gym')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GymManagementDashboard;