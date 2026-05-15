import { useState, useEffect } from "react";
import { apiKeysAPI, authAPI } from "../services/api";
import toast from "react-hot-toast";
import {
  Key,
  Plus,
  Trash,
  ShieldCheck,
  Users,
  ShoppingBag,
  Database,
  Cpu,
  Globe,
  Zap,
  ToggleRight,
  ToggleLeft,
} from "lucide-react";
import axios from "axios";

export default function AdminPanel() {
  const [keys, setKeys] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState("keys"); // 'keys' or 'users'

  const [newKey, setNewKey] = useState({
    name: "",
    category: "AI",
    is_paid: true,
    price: 5000,
    target_user_id: "",
    upstream_url: "",
    upstream_key: "",
    rate_limit_per_minute: 100,
    rate_limit_per_day: 50000,
  });

  const categories = ["AI", "Backend", "Automation", "Database"];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "keys") {
        const res = await apiKeysAPI.list();
        setKeys(res.data);
      } else {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:8000/api/v1/admin/users",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setUsers(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKey.name) return toast.error("Please enter a name");

    try {
      const { target_user_id, ...payload } = newKey;
      const params = target_user_id ? { user_id: target_user_id } : {};

      // If NOT targetting someone and NOT making it a marketplace key,
      // default it to the admin's own account on the backend.

      const token = localStorage.getItem("token");
      await axios.post("http://localhost:8000/api/v1/api-keys/", payload, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      toast.success(
        newKey.is_paid ? "Marketplace key published!" : "Internal key created!",
      );
      setShowCreate(false);
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.detail;
      if (Array.isArray(errorMsg)) {
        toast.error(`Validation Error: ${errorMsg[0].msg}`);
      } else {
        toast.error(errorMsg || "Failed to create key");
      }
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this key? This action is permanent.",
      )
    )
      return;
    try {
      await apiKeysAPI.delete(id);
      toast.success("Key deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete key");
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-fit">
        <button
          onClick={() => setActiveTab("keys")}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
            activeTab === "keys"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Key className="w-5 h-5" /> API Keys
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
            activeTab === "users"
              ? "bg-indigo-600 text-white shadow-lg"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Users className="w-5 h-5" /> User Directory
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
              {activeTab === "keys"
                ? "Marketplace Inventory"
                : "Registered Platform Users"}
            </h2>
            <p className="text-gray-500 mt-1">
              Management console for system-wide resources.
            </p>
          </div>
          {activeTab === "keys" && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100"
            >
              <Plus className="w-5 h-5" /> Add New Key
            </button>
          )}
        </div>

        {showCreate && activeTab === "keys" && (
          <div className="p-8 bg-indigo-50 border-b border-indigo-100 animate-in fade-in duration-300">
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-indigo-900 uppercase">
                    Key Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GPT-4o Advanced"
                    value={newKey.name}
                    onChange={(e) =>
                      setNewKey({ ...newKey, name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-600 focus:ring-0 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-indigo-900 uppercase">
                    Category
                  </label>
                  <select
                    value={newKey.category}
                    onChange={(e) =>
                      setNewKey({ ...newKey, category: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-600 outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-indigo-900 uppercase">
                    Price (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={newKey.price}
                      onChange={(e) =>
                        setNewKey({ ...newKey, price: Number(e.target.value) })
                      }
                      className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Upstream Config (The "Mask" feature) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/50 p-6 rounded-2xl border-2 border-dashed border-indigo-100">
                <div className="space-y-2">
                  <label className="text-xs font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Real API Endpoint (Upstream
                    URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://api.openai.com/v1"
                    value={newKey.upstream_url}
                    onChange={(e) =>
                      setNewKey({ ...newKey, upstream_url: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-600 outline-none"
                  />
                  <p className="text-[10px] text-gray-400">
                    The gateway will proxy requests to this URL.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Secret Upstream Key
                    (Masked)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter the real secret key"
                    value={newKey.upstream_key}
                    onChange={(e) =>
                      setNewKey({ ...newKey, upstream_key: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-600 outline-none"
                  />
                  <p className="text-[10px] text-gray-400">
                    This key will never be shown but used for proxying.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border-2 border-indigo-100">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">
                      Paid Marketplace Listing
                    </p>
                    <p className="text-xs text-gray-500">
                      Enable to publish this key to the public marketplace.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setNewKey({ ...newKey, is_paid: !newKey.is_paid })
                    }
                    className={`w-14 h-8 rounded-full transition-colors relative ${newKey.is_paid ? "bg-indigo-600" : "bg-gray-200"}`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${newKey.is_paid ? "left-7" : "left-1"}`}
                    />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-indigo-900 uppercase">
                    Target User ID (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5 (Leave empty for Marketplace)"
                    value={newKey.target_user_id}
                    onChange={(e) =>
                      setNewKey({ ...newKey, target_user_id: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all"
                >
                  Confirm and Create Key
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-8 py-4 bg-white text-gray-500 rounded-2xl font-bold border-2 border-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="p-20 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === "keys" ? (
                    <>
                      <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                        Resource Name
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                        Category
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                        Price
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-8 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">
                        Actions
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                        UID
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                        User Profile
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                        Email
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                        Last Login
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-8 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">
                        Joined
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeTab === "keys"
                  ? keys.map((key) => (
                      <tr
                        key={key.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                              <Globe className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">
                                {key.name || "API Key"}
                              </p>
                              <p className="text-xs font-mono text-gray-400">
                                {key.key.substring(0, 12)}...
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                            {key.category}
                          </span>
                        </td>
                        <td className="px-8 py-5 font-black text-gray-900">
                          ₹{key.price.toLocaleString()}
                        </td>
                        <td className="px-8 py-5">
                          {key.user_id ? (
                            <span className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                              <Users className="w-3.5 h-3.5" /> Assigned (UID:{" "}
                              {key.user_id})
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs">
                              <ShoppingBag className="w-3.5 h-3.5" /> In
                              Marketplace
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button
                            onClick={() => handleDelete(key.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          >
                            <Trash className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  : users.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-8 py-5 font-mono text-xs text-indigo-600 font-bold">
                          #{u.id}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">
                              {u.full_name?.charAt(0) || u.email.charAt(0)}
                            </div>
                            <p className="font-bold text-gray-900">
                              {u.full_name || "No Name"}
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-gray-500 font-medium">
                          {u.email}
                        </td>
                        <td className="px-8 py-5 text-gray-500 text-sm">
                          {u.last_login_at
                            ? new Date(u.last_login_at).toLocaleString()
                            : "Never"}
                        </td>
                        <td className="px-8 py-5">
                          <span
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                              u.is_active
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {u.is_active ? "Active" : "Suspended"}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right text-gray-400 text-xs font-bold">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
