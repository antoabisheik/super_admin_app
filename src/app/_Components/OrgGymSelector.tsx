// app/_Components/OrgGymSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { organizationAPI, gymAPI, Organization, Gym } from '../api/api';

interface OrgGymSelectorProps {
  onSelectionChange: (organizationId: number | null, gymId: number | null) => void;
}

export default function OrgGymSelector({ onSelectionChange }: OrgGymSelectorProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<number | null>(null);
  const [selectedGym, setSelectedGym] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      fetchGyms(selectedOrg);
    } else {
      setGyms([]);
      setSelectedGym(null);
    }
  }, [selectedOrg]);

  useEffect(() => {
    onSelectionChange(selectedOrg, selectedGym);
  }, [selectedOrg, selectedGym, onSelectionChange]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await organizationAPI.getAll();
      setOrganizations(response.data);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const fetchGyms = async (orgId: number) => {
    try {
      setLoading(true);
      const response = await gymAPI.getAll(orgId);
      setGyms(response.data);
      setSelectedGym(null); // Reset gym selection
    } catch (error) {
      console.error('Failed to fetch gyms:', error);
      setError('Failed to load gyms');
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setSelectedOrg(value);
  };

  const handleGymChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setSelectedGym(value);
  };

  if (error) {
    return (
      <div className="flex gap-4 items-center">
        <div className="text-red-500 text-sm">
          {error}
          <button 
            onClick={fetchOrganizations}
            className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 items-center">
      {/* Organization Selector */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-300 mb-1">
          Organization
        </label>
        <select
          value={selectedOrg || ''}
          onChange={handleOrgChange}
          disabled={loading}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
        >
          <option value="">Select Organization</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name} ({org.gym_count} gyms)
            </option>
          ))}
        </select>
      </div>

      {/* Gym Selector */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-300 mb-1">
          Gym
        </label>
        <select
          value={selectedGym || ''}
          onChange={handleGymChange}
          disabled={loading || !selectedOrg}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
        >
          <option value="">
            {selectedOrg ? 'All Gyms' : 'Select Organization First'}
          </option>
          {gyms.map((gym) => (
            <option key={gym.id} value={gym.id}>
              {gym.name} ({gym.online_cameras}/{gym.camera_count} cameras online)
            </option>
          ))}
        </select>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
          Loading...
        </div>
      )}

      {/* Selection Info */}
      {selectedOrg && (
        <div className="text-sm text-gray-400 max-w-[250px]">
          {selectedGym 
            ? `Viewing: ${gyms.find(g => g.id === selectedGym)?.name}`
            : `Viewing all gyms in ${organizations.find(o => o.id === selectedOrg)?.name}`
          }
        </div>
      )}
    </div>
  );
}