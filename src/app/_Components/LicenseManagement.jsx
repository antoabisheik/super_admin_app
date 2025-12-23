import React, { useState, useEffect, useMemo } from 'react';
import licensesApi from '../api/licenses-api';
import { useAuth } from '../contexts/AuthContext';

const LicenseManagement = ({ organizations = [], isLoadingOrgs = false }) => {
  const { user } = useAuth(); // Use AuthContext instead of local auth listener
  const [licenses, setLicenses] = useState([]);
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  // License Plans Configuration
  const licensePlans = {
    basic: {
      name: 'Basic',
      price: 99,
      features: ['Up to 5 devices', 'Basic analytics', 'Email support'],
      maxDevices: 5,
      color: 'bg-gray-500'
    },
    professional: {
      name: 'Professional',
      price: 299,
      features: ['Up to 25 devices', 'Advanced analytics', 'Priority support', 'API access'],
      maxDevices: 25,
      color: 'bg-blue-500'
    },
    enterprise: {
      name: 'Enterprise',
      price: 599,
      features: ['Unlimited devices', 'Custom analytics', '24/7 support', 'White-label option'],
      maxDevices: -1,
      color: 'bg-purple-500'
    },
    custom: {
      name: 'Custom',
      price: 'Contact us',
      features: ['Tailored solution', 'Custom integrations', 'Dedicated support'],
      maxDevices: -1,
      color: 'bg-green-500'
    }
  };

  //  Fetch licenses via middleware
  const fetchLicenses = async () => {
    if (!user) {
      console.log('User not authenticated, skipping license fetch');
      return;
    }

    setIsLoadingLicenses(true);
    try {
      console.log('📍 Fetching licenses via middleware...');
      const result = await licensesApi.getAll();
      
      if (result.success) {
        setLicenses(result.data || []);
        console.log('Licenses loaded:', result.data.length);
      } else {
        console.error('Error fetching licenses:', result.error);
        setLicenses([]);
      }
    } catch (error) {
      console.error('Error fetching licenses:', error);
      setLicenses([]);
    } finally {
      setIsLoadingLicenses(false);
    }
  };

  // Fetch licenses when user is authenticated
  useEffect(() => {
    if (user) {
      fetchLicenses();
    }
  }, [user]);

  // Memoize license status calculation
  const getLicenseStatus = useMemo(() => {
    return (license) => {
      if (!license.expiryDate) return 'active';
      
      const today = new Date();
      const expiryDate = new Date(license.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) return 'expired';
      if (daysUntilExpiry <= 30) return 'expiring';
      return 'active';
    };
  }, []);

  // Memoize filtered licenses
  const filteredLicenses = useMemo(() => {
    return licenses.filter(license => {
      const matchesSearch = license.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           license.licenseKey?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const status = getLicenseStatus(license);
      const matchesStatus = filterStatus === 'all' || status === filterStatus;
      const matchesPlan = filterPlan === 'all' || license.plan === filterPlan;
      
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [licenses, searchTerm, filterStatus, filterPlan, getLicenseStatus]);

  // Memoize statistics
  const stats = useMemo(() => {
    const stats = {
      total: licenses.length,
      active: 0,
      expiring: 0,
      expired: 0,
      revenue: 0
    };

    licenses.forEach(license => {
      const status = getLicenseStatus(license);
      stats[status]++;
      
      if (status === 'active' && licensePlans[license.plan]?.price !== 'Contact us') {
        stats.revenue += licensePlans[license.plan]?.price || 0;
      }
    });

    return stats;
  }, [licenses, getLicenseStatus, licensePlans]);

  // Create license via middleware
  const handleCreateLicense = async (licenseData) => {
    try {
      console.log(' Creating license via middleware...');
      const result = await licensesApi.create(licenseData);
      
      if (result.success) {
        console.log(' License created successfully');
        setIsModalOpen(false);
        await fetchLicenses(); // Refresh the list
      } else {
        console.error(' Create failed:', result.error);
        alert('Error creating license: ' + result.error);
      }
    } catch (error) {
      console.error(" Error creating license:", error);
      alert("Failed to create license. Please try again.");
    }
  };

  //  Update license via middleware
  const handleUpdateLicense = async (licenseData) => {
    try {
      console.log(' Updating license via middleware...');
      const result = await licensesApi.update(licenseData.id, licenseData);
      
      if (result.success) {
        console.log(' License updated successfully');
        setIsModalOpen(false);
        await fetchLicenses(); // Refresh the list
      } else {
        console.error('Update failed:', result.error);
        alert('Error updating license: ' + result.error);
      }
    } catch (error) {
      console.error(" Error updating license:", error);
      alert("Failed to update license. Please try again.");
    }
  };

  // Delete license via middleware
  const handleDeleteLicense = async (licenseId) => {
    if (!window.confirm('Are you sure you want to delete this license?')) {
      return;
    }

    try {
      console.log('Deleting license via middleware...');
      const result = await licensesApi.delete(licenseId);
      
      if (result.success) {
        console.log('License deleted successfully');
        await fetchLicenses(); // Refresh the list
      } else {
        console.error(' Delete failed:', result.error);
        alert('Error deleting license: ' + result.error);
      }
    } catch (error) {
      console.error(" Error deleting license:", error);
      alert("Failed to delete license. Please try again.");
    }
  };

  // Modal handlers
  const handleOpenCreateModal = () => {
    if (organizations.length === 0) {
      alert('Please create organizations first before adding licenses.');
      return;
    }
    setEditingLicense(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (license) => {
    setEditingLicense(license);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLicense(null);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      expiring: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Expiring Soon' },
      expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' }
    };

    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Show loading state
  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please log in to access license management.</p>
        </div>
      </div>
    );
  }

  if (isLoadingOrgs) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading organizations...</span>
        </div>
      </div>
    );
  }

  if (isLoadingLicenses) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading licenses...</span>
        </div>
      </div>
    );
  }

  // Show message if no organizations exist
  if (organizations.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <div className="text-4xl mb-2">🏢</div>
            <h3 className="text-lg font-medium">No Organizations Found</h3>
            <p className="text-sm">You need to create organizations first before managing licenses.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">License Management</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">
              {licenses.length} total licenses
            </span>
            <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
              {organizations.length} organizations available
            </span>
          </div>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-[#00dba1] hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span className="text-lg">+</span>
          Create License
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Licenses</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Active</h3>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Expiring Soon</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Expired</h3>
          <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Monthly Revenue</h3>
          <p className="text-2xl font-bold text-purple-600">${stats.revenue}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search by organization or license key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Plans</option>
            {Object.entries(licensePlans).map(([key, plan]) => (
              <option key={key} value={key}>{plan.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* License Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLicenses.map((license) => {
                const status = getLicenseStatus(license);
                const plan = licensePlans[license.plan];
                
                return (
                  <tr key={license.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {license.organizationName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {license.contactEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {license.licenseKey}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${plan?.color}`}>
                        {plan?.name}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        ${plan?.price === 'Contact us' ? 'Custom' : plan?.price + '/month'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {license.expiryDate ? new Date(license.expiryDate).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleOpenEditModal(license)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLicense(license.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredLicenses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {licenses.length === 0 ? 'No licenses created yet' : 'No licenses match your filters'}
            </div>
          </div>
        )}
      </div>

      {/* License Modal */}
      {isModalOpen && (
        <LicenseModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={editingLicense ? handleUpdateLicense : handleCreateLicense}
          initialData={editingLicense}
          organizations={organizations}
          licensePlans={licensePlans}
        />
      )}
    </div>
  );
};

// License Modal Component (keep the same as before)
const LicenseModal = ({ isOpen, onClose, onSave, initialData, organizations, licensePlans }) => {
  const [formData, setFormData] = useState({
    organizationId: '',
    organizationName: '',
    contactEmail: '',
    plan: 'basic',
    expiryDate: '',
    maxDevices: 5,
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const defaultExpiry = new Date();
      defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
      
      setFormData({
        organizationId: '',
        organizationName: '',
        contactEmail: '',
        plan: 'basic',
        expiryDate: defaultExpiry.toISOString().split('T')[0],
        maxDevices: 5,
        notes: ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.organizationId || !formData.contactEmail) {
      alert('Please fill in all required fields.');
      return;
    }
    
    onSave(formData);
  };

  const handleOrganizationChange = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setFormData({
        ...formData,
        organizationId: orgId,
        organizationName: org.name,
        contactEmail: org.email || formData.contactEmail
      });
    }
  };

  const handlePlanChange = (plan) => {
    const planConfig = licensePlans[plan];
    setFormData({
      ...formData,
      plan,
      maxDevices: planConfig.maxDevices === -1 ? 999999 : planConfig.maxDevices
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {initialData ? 'Edit License' : 'Create New License'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization *
            </label>
            <select
              value={formData.organizationId}
              onChange={(e) => handleOrganizationChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Organization</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name} {org.email && `(${org.email})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email *
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Plan
            </label>
            <select
              value={formData.plan}
              onChange={(e) => handlePlanChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(licensePlans).map(([key, plan]) => (
                <option key={key} value={key}>
                  {plan.name} - ${plan.price === 'Contact us' ? 'Custom' : plan.price + '/month'}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              Max devices: {formData.maxDevices === 999999 ? 'Unlimited' : formData.maxDevices}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
              placeholder="Optional notes about this license..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {initialData ? 'Update' : 'Create'} License
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LicenseManagement;