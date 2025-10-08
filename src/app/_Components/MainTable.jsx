"use client"
import React, { useEffect, useState } from 'react';
import { 
  Grid3X3,
  Search,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Trash2,
  Edit,
  List
} from 'lucide-react';

import { 
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../api/firebase';
import { useParams, useRouter } from 'next/navigation';

const MainTable = ({ searchTerm, setSearchTerm, onNavigateToOrg }) => {
  const [data, setData] = useState([]);
  const router = useRouter();
  
  // View mode state (grid or list)
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  
  // Filter dropdown state
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'All', // All, Active, Onboarding, Inactive
  });
  
  // Sort state
  const [sortConfig, setSort] = useState({
    key: 'name',
    direction: 'asc' // 'asc' or 'desc'
  });

  // Firestore realtime listener
  useEffect(() => {
    const q = query(collection(db, 'organizations'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(orgs);
      console.log(orgs);
    });
    return () => unsubscribe();
  }, []);

  const createSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleRowClick = (organization, event) => {
    if (event.target.closest('button')) {
      return;
    }
    
    const slug = createSlug(organization.id);
    const orgWithSlug = { ...organization, slug };
    if (onNavigateToOrg) {
      onNavigateToOrg(orgWithSlug);
    }
    router.push(`/organizations/${slug}`);
    console.log(`Navigating to: /organizations/${slug}`);
  };

  const handleEdit = async (user) => {
    try {
      const userRef = doc(db, 'organizations', user.id);
      const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
      await updateDoc(userRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const handleDelete = async (userId) => {
    try {
      await deleteDoc(doc(db, 'organizations', userId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  // Toggle view mode between grid and list
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'list' ? 'grid' : 'list');
  };

  // Handle status filter change
  const handleFilterChange = (filterValue) => {
    setSelectedFilters({
      ...selectedFilters,
      status: filterValue
    });
    setShowFilterDropdown(false);
  };

  // Handle column sort
  const handleSort = (key) => {
    setSort({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Onboarding':
        return 'bg-orange-100 text-orange-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',  
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-teal-500',
      'bg-orange-500'
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  // Apply filters and sorting
  let filteredData = Array.isArray(data) ? data.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Apply status filter
  if (selectedFilters.status !== 'All') {
    filteredData = filteredData.filter(user => user.status === selectedFilters.status);
  }

  // Apply sorting
  filteredData.sort((a, b) => {
    let aVal = a[sortConfig.key] || '';
    let bVal = b[sortConfig.key] || '';
    
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="flex-1 p-6 h-full overflow-hidden flex flex-col">
      <div className="bg-white rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Table Controls - Fixed at top */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="relative min-w-200">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle Button */}
              <button 
                onClick={toggleViewMode}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title={viewMode === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
              >
                {viewMode === 'list' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
              
              {/* Status Filter Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <span>{selectedFilters.status}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {/* Dropdown Menu */}
                {showFilterDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <div className="py-1">
                      {['All', 'Active', 'Onboarding', 'Inactive'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleFilterChange(status)}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                            selectedFilters.status === status ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table/Grid Container - Scrollable */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'list' ? (
            // List View (Table)
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>User</span>
                      {sortConfig.key === 'name' ? (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : <ChevronDown className="w-3 h-3 opacity-50" />}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('status')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Status</span>
                      {sortConfig.key === 'status' ? (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : <ChevronDown className="w-3 h-3 opacity-50" />}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('role')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Permissions</span>
                      {sortConfig.key === 'role' ? (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : <ChevronDown className="w-3 h-3 opacity-50" />}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button 
                      onClick={() => handleSort('email')}
                      className="flex items-center space-x-1 hover:text-gray-700"
                    >
                      <span>Email</span>
                      {sortConfig.key === 'email' ? (
                        sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : <ChevronDown className="w-3 h-3 opacity-50" />}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((user) => (
                  <tr key={user.id} 
                    onClick={(e) => handleRowClick(user, e)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(user.name || '')}`}>
                          {user.avatar || user.name?.charAt(0) || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">@{(user.name || 'unknown').toLowerCase().replace(' ', '')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.role || 'No role assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email || 'No email'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {user.tags && user.tags.map((tag, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {(user.tags?.length || 0) > 4 && (
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            +{user.tags.length - 4}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(user)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* Empty State */}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <p className="text-gray-500">No data found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            // Grid View
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredData.map((user) => (
                <div 
                  key={user.id} 
                  onClick={(e) => handleRowClick(user, e)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-center mb-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium ${getAvatarColor(user.name || '')}`}>
                      {user.avatar || user.name?.charAt(0) || '?'}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">{user.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">@{(user.name || 'unknown').toLowerCase().replace(' ', '')}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status || 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Role:</span> {user.role || 'No role'}
                    </div>
                    
                    <div className="text-sm text-gray-600 truncate">
                      {user.email || 'No email'}
                    </div>
                    
                    {user.tags && user.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {user.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {user.tags.length > 3 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                            +{user.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(user.id);
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(user);
                      }}
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Empty State for Grid View */}
              {filteredData.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No data found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainTable;