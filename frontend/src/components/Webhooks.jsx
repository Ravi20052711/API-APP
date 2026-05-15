import { useState, useEffect } from "react";
import { webhooksAPI } from "../services/api";
import toast from "react-hot-toast";
import { Zap, Plus, Trash, Globe, Shield, Activity } from "lucide-react";

export default function Webhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await webhooksAPI.list();
      setWebhooks(response.data);
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUrl) return;
    try {
      const response = await webhooksAPI.create({ url: newUrl });
      setWebhooks([...webhooks, response.data]);
      setNewUrl("");
      toast.success("Webhook created");
    } catch (error) {
      toast.error("Failed to create webhook");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await webhooksAPI.delete(id);
      setWebhooks(webhooks.filter((w) => w.id !== id));
      toast.success("Webhook deleted");
    } catch (error) {
      toast.error("Failed to delete webhook");
    }
  };

  if (loading)
    return <div className="p-8 text-center">Loading webhooks...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-indigo-600" />
            Developer Webhooks
          </h2>
          <p className="text-gray-500 mt-1">
            Receive real-time notifications for platform events.
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleCreate} className="flex gap-4">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-api.com/webhook"
              required
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus className="w-5 h-5" /> Add Endpoint
            </button>
          </form>
        </div>

        {webhooks.length === 0 ? (
          <div className="p-20 text-center border-t border-gray-100">
            <Globe className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">
              No webhooks configured
            </h3>
            <p className="text-gray-500 mt-1">
              Add an endpoint above to start receiving notifications.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      Active
                    </span>
                    <h4 className="font-black text-gray-900">{webhook.url}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Secret:{" "}
                      {webhook.secret?.substring(0, 12)}...
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" /> All Events (*)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(webhook.id)}
                  className="p-3 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
