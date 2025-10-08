"use client"
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, MoreVertical, TrendingUp, Users, MapPin, Calendar } from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../../api/firebase';
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
  
  console.log(id);

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
        // Get organization ID from user claims or custom claims
        const token = await currentUser.getIdTokenResult();
        console.log(token);
        setOrganizationId(id || 'default-org');
      } else {
        setUser(null);
        setOrganizationId(null);
        setGyms([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load gyms when user and organization ID are available
  useEffect(() => {
    if (user && organizationId) {
      loadGyms();
    }
  }, [user, organizationId]);

  const loadGyms = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const gymsRef = collection(db, 'organizations', organizationId, 'gyms');
      const q = query(gymsRef, orderBy('createdAt', 'desc'));
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const gymsData = [];
          snapshot.forEach((doc) => {
            gymsData.push({
              id: doc.id,
              ...doc.data(),
              // Convert Firestore timestamps to readable format
              createdAt: doc.data().createdAt?.toDate?.() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
            });
          });
          setGyms(gymsData);
          setLoading(false);
          console.log('Loaded gyms:', gymsData);
        },
        (error) => {
          console.error('Error loading gyms:', error);
          setError('Failed to load gyms');
          setLoading(false);
        }
      );

      // Return cleanup function
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up gyms listener:', error);
      setError('Failed to load gyms');
      setLoading(false);
    }
  };

  // Firestore CRUD operations
  const createGym = async (gymData) => {
    if (!organizationId || !user) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Creating gym:', gymData);
      
      const gymsRef = collection(db, 'organizations', organizationId, 'gyms');
      const docRef = await addDoc(gymsRef, {
        ...gymData,
        capacity: parseInt(gymData.capacity),
        latitude: gymData.latitude ? parseFloat(gymData.latitude) : null,
        longitude: gymData.longitude ? parseFloat(gymData.longitude) : null,
        members: 0,
        monthlyRevenue: 0,
        createdBy: user.uid,
        organizationId: id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Gym created successfully with ID:', docRef.id);
      
      setShowAddModal(false);
      setGymForm(initialGymState);
      
    } catch (error) {
      console.error('Error creating gym:', error);
      setError('Failed to create gym: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateGym = async (gymId, gymData) => {
    if (!organizationId || !user) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('Updating gym:', gymId, gymData);
      
      const gymRef = doc(db, 'organizations', organizationId, 'gyms', gymId);
      await updateDoc(gymRef, {
        ...gymData,
        capacity: parseInt(gymData.capacity),
        latitude: gymData.latitude ? parseFloat(gymData.latitude) : null,
        longitude: gymData.longitude ? parseFloat(gymData.longitude) : null,
        updatedBy: user.uid,
        updatedAt: serverTimestamp()
      });
      
      console.log('Gym updated successfully');
      
      setShowEditModal(false);
      setEditingGym(null);
      setGymForm(initialGymState);
      
    } catch (error) {
      console.error('Error updating gym:', error);
      setError('Failed to update gym: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteGym = async (gymId) => {
    if (!organizationId || !user) {
      setError('User not authenticated');
      return;
    }

    if (!confirm('Are you sure you want to delete this gym? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      console.log('Deleting gym:', gymId);
      
      const gymRef = doc(db, 'organizations', organizationId, 'gyms', gymId);
      await deleteDoc(gymRef);
      
      console.log('Gym deleted successfully');
      
    } catch (error) {
      console.error('Error deleting gym:', error);
      setError('Failed to delete gym: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (editingGym) {
      updateGym(editingGym.id, gymForm);
    } else {
      createGym(gymForm);
    }
  };

  const handleEdit = (gym) => {
    setEditingGym(gym);
    setGymForm({
      name: gym.name,
      address: gym.address,
      phone: gym.phone,
      email: gym.email,
      capacity: gym.capacity.toString(),
      manager: gym.manager,
      status: gym.status,
      openingTime: gym.openingTime,
      closingTime: gym.closingTime,
      amenities: gym.amenities,
      latitude: gym.latitude ? gym.latitude.toString() : '',
      longitude: gym.longitude ? gym.longitude.toString() : ''
    });
    setShowEditModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'MAINTENANCE': 'bg-yellow-100 text-yellow-800',
      'CLOSED': 'bg-red-100 text-red-800',
      'INACTIVE': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleSelectGym = (gymId) => {
    setSelectedGyms(prev => 
      prev.includes(gymId) 
        ? prev.filter(id => id !== gymId)
        : [...prev, gymId]
    );
  };

  const handleSelectAll = () => {
    setSelectedGyms(selectedGyms.length === gyms.length ? [] : gyms.map(gym => gym.id));
  };

  const filteredGyms = gyms.filter(gym => 
    gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gym.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gym.manager.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError('')}
            >
              <span className="text-red-500">×</span>
            </button>
          </div>
        )}

        {/* Authentication Check */}
        {!user ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Required</h2>
              <p className="text-gray-600">Please sign in to access the gym management dashboard.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Gym Management</h1>
              <p className="text-gray-600 mb-6">{organizationData.name}</p>
              
              {/* Organization Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Gyms</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{gyms.length}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Members</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{organizationData.activeMembers.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{organizationData.monthlyRevenue}</p>
                    </div>
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {organizationData.growthRate}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Gyms</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{gyms.filter(g => g.status === 'ACTIVE').length}</p>
                    </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  {/* Search */}
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search gyms..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Add Gym Button */}
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Gym
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-12 px-6 py-4">
                          <input 
                            type="checkbox" 
                            checked={selectedGyms.length === filteredGyms.length && filteredGyms.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gym Name</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                        <th className="w-12 px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredGyms.map((gym) => (
                        <tr key={gym.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <input 
                              type="checkbox" 
                              checked={selectedGyms.includes(gym.id)}
                              onChange={() => handleSelectGym(gym.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{gym.name}</div>
                              <div className="text-sm text-gray-500">{gym.address}</div>
                              <div className="text-sm text-gray-500">{gym.phone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{gym.manager}</div>
                            <div className="text-sm text-gray-500">{gym.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(gym.status)}`}>
                              {gym.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {gym.members}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {gym.capacity}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleEdit(gym)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteGym(gym.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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