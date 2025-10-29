"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { auth } from "../../app/api/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { gymsApi, devicesApi, organizationsApi } from "../../app/api/api-clients-with-gyms";

const Hardware = ({
  organizations = [],
  onRefreshDevices, // optional: parent callback to reload data
  isLoading = false,
}) => {
  const [activeHardwareTab, setActiveHardwareTab] = useState("Camera");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [orgSearchTerm, setOrgSearchTerm] = useState("");
  const [gymSearchTerm, setGymSearchTerm] = useState("");
  const [assignmentFilters, setAssignmentFilters] = useState({
    assigned: false,
    unassigned: false,
  });
  const [organizationFilters, setOrganizationFilters] = useState({});
  const [gymFilters, setGymFilters] = useState({});
  const [devices, setDevices] = useState([]);
  const [availableGyms, setAvailableGyms] = useState([]);
  const [gymsLoading, setGymsLoading] = useState(false);
  const [stickerStatusFilters, setStickerStatusFilters] = useState({
    pending: false,
    applied: false,
    notApplied: false,
  });
  const [testingStatusFilters, setTestingStatusFilters] = useState({
    notTested: false,
    passed: false,
    failed: false,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    deviceId: "",
    deviceType: activeHardwareTab.toLowerCase(),
    organization: "Unassigned",
    organizationId: null,
    gym: "",
    gymId: null,
    ipAddress: "",
    modelNo: "",
    lens: "",
    stickerStatus: "Pending",
    testedBy: "update status",
    testingStatus: "not tested yet",
    testingDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  // 🔹 Listen for Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser || null);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Fetch gyms via middleware
  const fetchGymsForOrganization = async (organizationId) => {
    if (!organizationId) {
      setAvailableGyms([]);
      return;
    }
    setGymsLoading(true);
    try {
      const result = await gymsApi.getAll(organizationId);
      if (result.success) setAvailableGyms(result.data || []);
      else {
        console.error("Error fetching gyms:", result.error);
        setAvailableGyms([]);
      }
    } catch (error) {
      console.error("Error fetching gyms via middleware:", error);
      setAvailableGyms([]);
    } finally {
      setGymsLoading(false);
    }
  };

  // 🔹 Auto-fetch gyms when org changes
  useEffect(() => {
    if (formData.organizationId) fetchGymsForOrganization(formData.organizationId);
    else setAvailableGyms([]);
  }, [formData.organizationId]);

  // 🔹 Load all devices (middleware)
  const loadDevices = async () => {
    if (!user) return;
    try {
      const allDevices = [];
      for (const org of organizations) {
        const res = await devicesApi.getAll(org.id);
        if (res.success && Array.isArray(res.data)) allDevices.push(...res.data);
      }
      setDevices(allDevices);
    } catch (err) {
      console.error("Error loading devices:", err);
    }
  };

  useEffect(() => {
    if (user && organizations.length > 0) loadDevices();
  }, [user, organizations]);

  // 🔹 Handle Add / Update Device via middleware
  const handleSubmitDevice = async (e) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in.");
    if (!formData.deviceId) return alert("Device ID is required");

    setIsSubmitting(true);
    try {
      const orgId = formData.organizationId;
      const devicePayload = {
        deviceName: formData.deviceId,
        deviceType: activeHardwareTab.toLowerCase(),
        organizationId: orgId || null,
        organization: formData.organization || "Unassigned",
        gymId: formData.gymId || null,
        gym: formData.gym || null,
        ipAddress: formData.ipAddress,
        modelNo: formData.modelNo,
        lens: formData.lens,
        stickerStatus: formData.stickerStatus,
        testing: formData.testingStatus,
        status: formData.organization === "Unassigned" ? "Inventory" : "Assigned",
      };

      const result = editingDevice
        ? await devicesApi.update(orgId, editingDevice.id, devicePayload)
        : await devicesApi.create(orgId, devicePayload);

      if (result.success) {
        alert(`Device ${editingDevice ? "updated" : "created"} successfully!`);
        setIsModalOpen(false);
        setEditingDevice(null);
        setFormData((prev) => ({ ...prev, deviceId: "" }));
        await loadDevices();
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      console.error("Error submitting device:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 Delete device via middleware
  const handleDeleteDevice = async (orgId, deviceId) => {
    if (!window.confirm("Are you sure you want to delete this device?")) return;
    try {
      const result = await devicesApi.delete(orgId, deviceId);
      if (result.success) {
        alert("Device deleted successfully!");
        await loadDevices();
      } else alert("Error: " + result.error);
    } catch (err) {
      console.error("Error deleting device:", err);
    }
  };

  // 🔹 Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "organization") {
      if (value === "Unassigned") {
        setFormData((p) => ({
          ...p,
          organization: "Unassigned",
          organizationId: null,
          gym: "",
          gymId: null,
        }));
      } else {
        const selectedOrg = organizations.find((o) => o.name === value);
        setFormData((p) => ({
          ...p,
          organization: selectedOrg?.name || "",
          organizationId: selectedOrg?.id || null,
          gym: "",
          gymId: null,
        }));
      }
    } else if (name === "gym") {
      const selectedGym = availableGyms.find((g) => g.name === value);
      setFormData((p) => ({
        ...p,
        gym: selectedGym?.name || "",
        gymId: selectedGym?.id || null,
      }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  // 🔹 UI helpers
  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned": return "bg-purple-100 text-purple-800";
      case "Inventory": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const filteredDevices = devices.filter(
    (d) => d.deviceType === activeHardwareTab.toLowerCase()
  );

  // --------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Hardware Inventory</h1>

      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-3">
          {["Camera", "Sensor"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveHardwareTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeHardwareTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {tab}s
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#00dba1] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add {activeHardwareTab}
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm text-gray-600">Device ID</th>
              <th className="px-4 py-3 text-left text-sm text-gray-600">Organization</th>
              <th className="px-4 py-3 text-left text-sm text-gray-600">Gym</th>
              <th className="px-4 py-3 text-left text-sm text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm text-gray-600">Model</th>
              <th className="px-4 py-3 text-left text-sm text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-3">{d.deviceName}</td>
                <td className="px-4 py-3">{d.organization || "Unassigned"}</td>
                <td className="px-4 py-3">{d.gym || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(d.status)}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3">{d.modelNo || "N/A"}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingDevice(d);
                      setFormData({
                        ...formData,
                        deviceId: d.deviceName,
                        organization: d.organization,
                        organizationId: d.organizationId,
                        gym: d.gym,
                        gymId: d.gymId,
                        modelNo: d.modelNo,
                        lens: d.lens,
                        stickerStatus: d.stickerStatus,
                        testingStatus: d.testing,
                      });
                      setIsModalOpen(true);
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDevice(d.organizationId, d.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {filteredDevices.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
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
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingDevice ? "Edit Device" : "Add New Device"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 text-2xl">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitDevice} className="space-y-3">
              <div>
                <label className="block text-sm mb-1 text-gray-700">Device ID</label>
                <input
                  name="deviceId"
                  value={formData.deviceId}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700">Organization</label>
                <select
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="Unassigned">Unassigned</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.name}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.organizationId && (
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Gym</label>
                  <select
                    name="gym"
                    value={formData.gym}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select Gym</option>
                    {availableGyms.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm mb-1 text-gray-700">Model No</label>
                <input
                  name="modelNo"
                  value={formData.modelNo}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingDevice
                  ? "Update Device"
                  : "Add Device"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hardware;
