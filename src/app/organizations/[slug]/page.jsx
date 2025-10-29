"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
} from "lucide-react";
import { useParams } from "next/navigation";
import { gymsApi, organizationsApi } from "../../api/api-clients-with-gyms";
import { auth } from "../../api/firebase";
import { onAuthStateChanged } from "firebase/auth";

const GymManagementDashboard = () => {
  const params = useParams();
  const organizationId = params.slug;

  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGym, setEditingGym] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("list");

  const initialGymState = {
    name: "",
    address: "",
    phone: "",
    email: "",
    capacity: "",
    manager: "",
    status: "ACTIVE",
    openingTime: "",
    closingTime: "",
    amenities: [],
    latitude: "",
    longitude: "",
  };

  const [gymForm, setGymForm] = useState(initialGymState);
   console.log(organizationId);
  // 🔹 Listen for Firebase auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);
  // 🔹 Load organization info
  useEffect(() => {
    const fetchOrg = async () => {
      if (!organizationId || !user) return;
      try {
        const result = await organizationsApi.getById(organizationId);
        if (result.success) setOrganization(result.data);
        else setError(result.error || "Organization not found");
      } catch (err) {
        setError(err.message);
      }
    };
    fetchOrg();
  }, [organizationId, user]);

  // 🔹 Load gyms for the organization
  const loadGyms = async () => {
    if (!organizationId || !user) return;
    setLoading(true);
    setError("");

    try {
      const result = await gymsApi.getAll(organizationId);
      if (result.success) {
        setGyms(result.data || []);
      } else {
        setError(result.error || "Failed to load gyms");
      }
    } catch (err) {
      setError("Failed to load gyms: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGyms();
  }, [organizationId, user]);

  // 🔹 Create a new gym
  const createGym = async () => {
    if (!user) return alert("You must be logged in.");
    if (!organizationId) return alert("Organization not found.");

    if (!gymForm.name || !gymForm.address || !gymForm.manager)
      return alert("Please fill all required fields.");

    setLoading(true);
    try {
      const result = await gymsApi.create(organizationId, gymForm);
      if (result.success) {
        alert("Gym created successfully!");
        setShowAddModal(false);
        setGymForm(initialGymState);
        loadGyms();
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Update existing gym
  const updateGym = async (gymId) => {
    if (!user) return alert("You must be logged in.");
    setLoading(true);
    try {
      const result = await gymsApi.update(organizationId, gymId, gymForm);
      if (result.success) {
        alert("Gym updated successfully!");
        setShowEditModal(false);
        setEditingGym(null);
        setGymForm(initialGymState);
        loadGyms();
      } else {
        alert("Update failed: " + result.error);
      }
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete a gym
  const deleteGym = async (gymId) => {
    if (!window.confirm("Are you sure you want to delete this gym?")) return;
    try {
      const result = await gymsApi.delete(organizationId, gymId);
      if (result.success) {
        alert("Gym deleted!");
        loadGyms();
      } else {
        alert("Delete failed: " + result.error);
      }
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  const handleSubmit = () => {
    editingGym ? updateGym(editingGym.id) : createGym();
  };

  const handleEdit = (gym) => {
    setEditingGym(gym);
    setGymForm(gym);
    setShowEditModal(true);
  };

  const filteredGyms = gyms.filter(
    (gym) =>
      gym.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gym.manager?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gym.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800";
      case "CLOSED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
            {/* ---- Header ---- */}
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {organization?.name || "Organization"}
                </h1>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Gym
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <DashboardStatCard
                  title="Total Gyms"
                  value={gyms.length}
                  icon={<MapPin className="w-8 h-8 text-blue-600" />}
                />
                <DashboardStatCard
                  title="Active Members"
                  value={gyms.reduce((sum, g) => sum + (g.members || 0), 0)}
                  icon={<Users className="w-8 h-8 text-green-600" />}
                />
                <DashboardStatCard
                  title="Monthly Revenue"
                  value={`₹${gyms
                    .reduce((sum, g) => sum + (g.monthlyRevenue || 0), 0)
                    .toLocaleString()}`}
                  icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
                />
                <DashboardStatCard
                  title="Growth Rate"
                  value="+18%"
                  icon={<Calendar className="w-8 h-8 text-orange-600" />}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                <p className="font-medium">Error: {error}</p>
              </div>
            )}

            {/* ---- Gym List ---- */}
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
                    onClick={() =>
                      setViewMode(viewMode === "list" ? "grid" : "list")
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {viewMode === "list" ? "Grid View" : "List View"}
                  </button>
                </div>
              </div>

              <GymList
                gyms={filteredGyms}
                viewMode={viewMode}
                handleEdit={handleEdit}
                deleteGym={deleteGym}
                getStatusColor={getStatusColor}
              />
            </div>

            {/* ---- Add/Edit Modal ---- */}
            {(showAddModal || showEditModal) && (
              <GymModal
                gymForm={gymForm}
                setGymForm={setGymForm}
                onClose={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setEditingGym(null);
                }}
                onSubmit={handleSubmit}
                loading={loading}
                editing={!!editingGym}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- Reusable Subcomponents ---
const DashboardStatCard = ({ title, value, icon }) => (
  <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
    {icon}
  </div>
);

const GymList = ({ gyms, viewMode, handleEdit, deleteGym, getStatusColor }) =>
  gyms.length === 0 ? (
    <div className="text-center py-12">
      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500">No gyms found</p>
    </div>
  ) : viewMode === "list" ? (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          {["Name", "Manager", "Address", "Status", "Capacity", "Members", "Actions"].map((h) => (
            <th key={h} className="text-left py-3 px-4 text-sm font-medium text-gray-600">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {gyms.map((gym) => (
          <tr key={gym.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-3 px-4 font-medium text-gray-900">{gym.name}</td>
            <td className="py-3 px-4">{gym.manager}</td>
            <td className="py-3 px-4">{gym.address}</td>
            <td className="py-3 px-4">
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  gym.status
                )}`}
              >
                {gym.status}
              </span>
            </td>
            <td className="py-3 px-4">{gym.capacity}</td>
            <td className="py-3 px-4">{gym.members || 0}</td>
            <td className="py-3 px-4 text-right">
              <button
                onClick={() => handleEdit(gym)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteGym(gym.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {gyms.map((gym) => (
        <div
          key={gym.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between mb-2">
            <h3 className="font-semibold">{gym.name}</h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ${getStatusColor(gym.status)}`}
            >
              {gym.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{gym.address}</p>
          <p className="text-sm text-gray-500">{gym.manager}</p>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => handleEdit(gym)} className="text-blue-600 hover:underline">
              Edit
            </button>
            <button onClick={() => deleteGym(gym.id)} className="text-red-600 hover:underline">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );

const GymModal = ({ gymForm, setGymForm, onClose, onSubmit, loading, editing }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-5">
        {editing ? "Edit Gym" : "Create Gym"}
      </h2>

      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* 🏋️ Basic Info */}
        <div>
          <label className="text-sm font-medium text-gray-700">Gym Name</label>
          <input
            type="text"
            placeholder="Enter gym name"
            value={gymForm.name}
            onChange={(e) => setGymForm({ ...gymForm, name: e.target.value })}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Manager</label>
          <input
            type="text"
            placeholder="Gym manager name"
            value={gymForm.manager}
            onChange={(e) => setGymForm({ ...gymForm, manager: e.target.value })}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* 📍 Contact Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input
              type="text"
              placeholder="Phone number"
              value={gymForm.phone}
              onChange={(e) => setGymForm({ ...gymForm, phone: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Gym email"
              value={gymForm.email}
              onChange={(e) => setGymForm({ ...gymForm, email: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 📍 Address */}
        <div>
          <label className="text-sm font-medium text-gray-700">Address</label>
          <textarea
            placeholder="Street address"
            rows={2}
            value={gymForm.address}
            onChange={(e) => setGymForm({ ...gymForm, address: e.target.value })}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          />
        </div>

        {/* 🕒 Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Opening Time</label>
            <input
              type="time"
              value={gymForm.openingTime}
              onChange={(e) => setGymForm({ ...gymForm, openingTime: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Closing Time</label>
            <input
              type="time"
              value={gymForm.closingTime}
              onChange={(e) => setGymForm({ ...gymForm, closingTime: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 🧮 Capacity & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Capacity</label>
            <input
              type="number"
              placeholder="Max capacity"
              value={gymForm.capacity}
              onChange={(e) => setGymForm({ ...gymForm, capacity: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              value={gymForm.status}
              onChange={(e) => setGymForm({ ...gymForm, status: e.target.value })}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🔘 Actions */}
      <div className="flex justify-end mt-6 gap-3 border-t border-gray-100 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Saving..." : editing ? "Update Gym" : "Create Gym"}
        </button>
      </div>
    </div>
  </div>
);


export default GymManagementDashboard;
