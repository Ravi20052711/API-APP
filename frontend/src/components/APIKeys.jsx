import { useState, useEffect } from 'react';
import { apiKeysAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Copy, Trash, ToggleLeft, ToggleRight, Key, ShoppingBag, Globe, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function APIKeys({ apiKeys, setApiKeys }) {
  const { user } = useAuth();
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const maskKey = (key) => {
    if (key.length <= 12) return '*'.repeat(key.length);
    return key.substring(0, 8) + '••••' + key.substring(key.length - 4);
  };

  const handleToggle = async (id) => {
    try {
      const response = await apiKeysAPI.toggle(id);
      setApiKeys(apiKeys.map(key => 
        key.id === id ? response.data : key
      ));
      toast.success(response.data.is_active ? 'API key activated' : 'API key deactivated');
    } catch (error) {
      toast.error('Failed to update API key');
    }
  };

  const handleRotate = async (id) => {
    if (!confirm('Rotate this key? The current key will remain valid for 7 days.')) return;
    try {
      const response = await apiKeysAPI.rotate(id);
      setApiKeys(apiKeys.map(key => 
        key.id === id ? response.data : key
      ));
      toast.success('API key rotated. New key generated.');
    } catch (error) {
      toast.error('Failed to rotate API key');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    
    try {
      await apiKeysAPI.delete(id);
      setApiKeys(apiKeys.filter(key => key.id !== id));
      toast.success('API key deleted');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete API key');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <Key className="w-8 h-8 text-indigo-600" />
              Active Integration Keys
            </h2>
            <p className="text-gray-500 mt-1">Manage your keys for external service integration.</p>
          </div>
          {!user?.is_superuser && (
            <div className="px-4 py-2 bg-indigo-50 rounded-xl text-indigo-600 text-xs font-bold uppercase border border-indigo-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Admin Managed
            </div>
          )}
        </div>

        {apiKeys.length === 0 ? (
          <div className="p-20 text-center">
            <Globe className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No active keys found</h3>
            <p className="text-gray-500 mt-1 max-w-xs mx-auto">
              {user?.is_superuser 
                ? 'Create a key in the Admin Panel to get started.' 
                : 'Visit the API Marketplace to acquire keys for your account.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="p-8 hover:bg-gray-50/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {key.category}
                      </span>
                      <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                        {maskKey(key.key)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(key.key)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <h4 className="font-black text-gray-900">{key.name || 'API Integration Key'}</h4>
                      <div className="h-1 w-1 rounded-full bg-gray-300"></div>
                      {key.is_paid ? (
                        <span className="text-green-600 font-bold text-xs uppercase flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" /> Marketplace Key
                        </span>
                      ) : (
                        <span className="text-gray-400 font-bold text-xs uppercase">Free Access</span>
                      )}
                    </div>

                    {key.expires_at && (
                      <p className="text-xs font-bold text-red-400 mt-2 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Access Expires: {new Date(key.expires_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRotate(key.id)}
                      title="Rotate API Key"
                      className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleToggle(key.id)}
                      className="p-2 hover:bg-white rounded-xl transition-all"
                    >
                      {key.is_active ? (
                        <ToggleRight className="w-10 h-10 text-indigo-600" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-gray-300" />
                      )}
                    </button>
                    
                    {user?.is_superuser && (
                      <button
                        onClick={() => handleDelete(key.id)}
                        className="p-3 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
