"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { auth } from "../../app/api/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { gymsApi, devicesApi, organizationsApi } from "../../app/api/api-clients-with-gyms";

const Hardware = ({
  organizations = [],
  onRefreshDevices,
  isLoading = false,
}) => {
  const [activeHardwareTab, setActiveHardwareTab] = useState("Camera");
  const [devices, setDevices] = useState([]);
  const [availableGyms, setAvailableGyms] = useState([]);
  const [gymsLoading, setGymsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    deviceId: "",
    type: "camera",
    serialNumber: "",
    organization: "Unassigned",
    organizationId: null,
    organizationName: "",
    gym: "",
    gymId: null, // ✅ Firestore document ID
    gymUniqueId: "", // ✅ Custom gym ID (e.g., "VIJ-GYM-001")
    gymName: "",
    ipAddress: "",
    modelNo: "",
    macAddress: "",
  });

  // 🔹 Keep 'type' in sync with tab
  useEffect(() => {
    setFormData((prev) => ({ ...prev, type: activeHardwareTab.toLowerCase() }));
  }, [activeHardwareTab]);

  // 🔹 Listen for Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Fetch gyms for selected organization
  const fetchGymsForOrganization = async (organizationId) => {
    if (!organizationId) {
      setAvailableGyms([]);
      return;
    }
    setGymsLoading(true);
    try {
      const result = await gymsApi.getAll(organizationId);
      if (result.success) {
        console.log("📍 Fetched gyms:", result.data);
        setAvailableGyms(result.data || []);
      } else {
        console.error("Error fetching gyms:", result.error);
        setAvailableGyms([]);
      }
    } catch (error) {
      console.error("Error fetching gyms:", error);
      setAvailableGyms([]);
    } finally {
      setGymsLoading(false);
    }
  };

  // 🔹 Auto-fetch gyms when org changes
  useEffect(() => {
    if (formData.organizationId) {
      fetchGymsForOrganization(formData.organizationId);
    } else {
      setAvailableGyms([]);
    }
  }, [formData.organizationId]);

  // 🔹 Load all devices
  const loadDevices = async () => {
    if (!user) return;
    try {
      const res = await devicesApi.getAll(null);
      if (res.success && Array.isArray(res.data)) {
        console.log("📦 Loaded devices:", res.data);
        setDevices(res.data);
      } else {
        console.error("Error loading devices:", res.error);
        setDevices([]);
      }
    } catch (err) {
      console.error("Error loading devices:", err);
      setDevices([]);
    }
  };

  useEffect(() => {
    if (user) loadDevices();
  }, [user]);

  // 🔹 Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "organization") {
      if (value === "Unassigned") {
        setFormData((p) => ({
          ...p,
          organization: "Unassigned",
          organizationId: null,
          organizationName: "",
          gym: "",
          gymId: null,
          gymUniqueId: "",
          gymName: "",
        }));
      } else {
        const selectedOrg = organizations.find((o) => o.name === value);
        setFormData((p) => ({
          ...p,
          organization: selectedOrg?.name || "",
          organizationId: selectedOrg?.id || null,
          organizationName: selectedOrg?.name || "",
          gym: "",
          gymId: null,
          gymUniqueId: "",
          gymName: "",
        }));
      }
    } else if (name === "gym") {
      const selectedGym = availableGyms.find((g) => g.name === value);
      console.log("🏋️ Selected gym:", selectedGym);
      
      setFormData((p) => ({
        ...p,
        gym: selectedGym?.name || "",
        gymId: selectedGym?.id || null, // Firestore document ID
        gymUniqueId: selectedGym?.gymId || "", // Custom gym ID (VIJ-GYM-001)
        gymName: selectedGym?.name || "",
      }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  //Create or update device
  const handleSubmitDevice = async (e) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in.");
    if (!formData.deviceId?.trim()) return alert("Device ID is required");
    if (!formData.type?.trim()) return alert("Device Type is required");
    if (!formData.serialNumber?.trim()) return alert("Serial Number is required");

    setIsSubmitting(true);
    try {
      const orgId = formData.organizationId;
      
      //Determine status based on assignment
      let deviceStatus = "Inventory"; // Default: in inventory
      if (orgId && formData.gymId) {
        deviceStatus = "Assigned"; // Assigned to a gym
      } else if (orgId && !formData.gymId) {
        deviceStatus = "Assigned to Organization"; // Assigned to org but no specific gym
      }

      // Prepare device payload with all tracking info
      const devicePayload = {
        deviceName: formData.deviceId.trim(),
        type: formData.type.toLowerCase().trim(),
        serialNumber: formData.serialNumber.trim(),
        model: formData.modelNo.trim() || "",
        manufacturer: "N/A",
        
        // ✅ Organization tracking
        organizationId: orgId || null,
        organizationName: formData.organizationName || "Unassigned",
        
        // ✅ Gym tracking with BOTH IDs
        gymId: formData.gymId || null, // Firestore document ID
        gymUniqueId: formData.gymUniqueId || null, // Custom ID (VIJ-GYM-001)
        gymName: formData.gymName || "",
        location: formData.gymName || "", // For backward compatibility
        
        // ✅ Status tracking
        status: deviceStatus,
        
        // Additional fields
        ipAddress: formData.ipAddress.trim() || "",
        macAddress: formData.macAddress.trim() || "",
      };

      console.log("💾 Submitting device payload:", devicePayload);

      const result = editingDevice
        ? await devicesApi.update(orgId, editingDevice.id, devicePayload)
        : await devicesApi.create(orgId, devicePayload);

      if (result.success) {
        alert(`Device ${editingDevice ? "updated" : "created"} successfully!`);
        console.log("✅ Device saved:", result.data);
        setIsModalOpen(false);
        setEditingDevice(null);
        resetForm();
        await loadDevices();
      } else {
        alert("Error: " + result.error);
        console.error("❌ Error:", result.error);
      }
    } catch (err) {
      console.error("❌ Error submitting device:", err);
      alert("Error submitting device: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 Reset form
  const resetForm = () => {
    setFormData({
      deviceId: "",
      type: activeHardwareTab.toLowerCase(),
      serialNumber: "",
      organization: "Unassigned",
      organizationId: null,
      organizationName: "",
      gym: "",
      gymId: null,
      gymUniqueId: "",
      gymName: "",
      ipAddress: "",
      modelNo: "",
      macAddress: "",
    });
  };

  // 🔹 Delete device
  const handleDeleteDevice = async (device) => {
    if (!window.confirm(`Are you sure you want to delete device "${device.deviceName}"?`)) return;
    try {
      const result = await devicesApi.delete(device.organizationId, device.id);
      if (result.success) {
        alert("Device deleted successfully!");
        await loadDevices();
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      console.error("Error deleting device:", err);
      alert("Error deleting device: " + err.message);
    }
  };

  // 🔹 Handle edit
  const handleEditDevice = (device) => {
    console.log("✏️ Editing device:", device);
    setEditingDevice(device);
    setFormData({
      deviceId: device.deviceName || "",
      type: device.type || "",
      serialNumber: device.serialNumber || "",
      organization: device.organizationName || "Unassigned",
      organizationId: device.organizationId || null,
      organizationName: device.organizationName || "",
      gym: device.gymName || "",
      gymId: device.gymId || null,
      gymUniqueId: device.gymUniqueId || "",
      gymName: device.gymName || "",
      ipAddress: device.ipAddress || "",
      modelNo: device.model || "",
      macAddress: device.macAddress || "",
    });
    setIsModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned":
        return "bg-green-100 text-green-800";
      case "Assigned to Organization":
        return "bg-purple-100 text-purple-800";
      case "Inventory":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredDevices = devices.filter(
    (d) => d.type === activeHardwareTab.toLowerCase()
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Hardware Inventory</h1>

      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-3">
          {["Camera", "Sensor"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveHardwareTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeHardwareTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab}s
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setEditingDevice(null);
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-[#00dba1] text-white px-4 py-2 rounded-lg hover:bg-[#00c291] transition"
        >
          + Add {activeHardwareTab}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Total Devices</p>
          <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">In Inventory</p>
          <p className="text-2xl font-bold text-blue-600">
            {devices.filter(d => d.status === "Inventory").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Assigned</p>
          <p className="text-2xl font-bold text-green-600">
            {devices.filter(d => d.status === "Assigned").length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">To Organization</p>
          <p className="text-2xl font-bold text-purple-600">
            {devices.filter(d => d.status === "Assigned to Organization").length}
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Device ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Serial No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Organization</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Gym</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Gym ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Model</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((d) => (
              <tr key={d.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{d.deviceName}</td>
                <td className="px-4 py-3 capitalize">{d.type}</td>
                <td className="px-4 py-3">{d.serialNumber}</td>
                <td className="px-4 py-3">{d.organizationName || "Unassigned"}</td>
                <td className="px-4 py-3">{d.gymName || "—"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-blue-600">
                    {d.gymUniqueId || "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(d.status)}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3">{d.model || "N/A"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditDevice(d)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(d)}
                      className="text-red-600 hover:text-red-800 hover:underline font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredDevices.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-500">
                  No {activeHardwareTab.toLowerCase()}s found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingDevice ? "Edit Device" : "Add New Device"}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingDevice(null);
                }} 
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Device ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="deviceId"
                  value={formData.deviceId}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., CAM-001"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Device Type <span className="text-red-500">*</span>
                </label>
                <input
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  placeholder="e.g., camera, sensor"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Serial Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="Unique serial number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Organization</label>
                <select
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Unassigned">Unassigned (Inventory)</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.name}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.organizationId && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Gym (Optional)
                  </label>
                  <select
                    name="gym"
                    value={formData.gym}
                    onChange={handleInputChange}
                    disabled={gymsLoading}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">None (Assign to Organization only)</option>
                    {availableGyms.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name} {g.gymId ? `(${g.gymId})` : ""}
                      </option>
                    ))}
                  </select>
                  {gymsLoading && (
                    <p className="text-xs text-gray-500 mt-1">Loading gyms...</p>
                  )}
                  {formData.gymUniqueId && (
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      Selected Gym ID: {formData.gymUniqueId}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Model Number</label>
                <input
                  name="modelNo"
                  value={formData.modelNo}
                  onChange={handleInputChange}
                  placeholder="Device model number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">IP Address</label>
                <input
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleInputChange}
                  placeholder="e.g., 192.168.1.100"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">MAC Address</label>
                <input
                  name="macAddress"
                  value={formData.macAddress}
                  onChange={handleInputChange}
                  placeholder="e.g., 00:1B:44:11:3A:B7"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingDevice(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingDevice
                    ? "Update Device"
                    : "Add Device"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hardware;