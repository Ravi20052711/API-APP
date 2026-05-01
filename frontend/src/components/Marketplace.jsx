import { useState, useEffect } from 'react';
import { apiKeysAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Copy, Key, ShoppingBag, Zap, Activity, Filter, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Marketplace() {
  const [availableKeys, setAvailableKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [category, setCategory] = useState('All');
  const { user } = useAuth();

  const categories = ['All', 'AI', 'Backend', 'Automation', 'Database'];

  useEffect(() => {
    fetchMarketplaceKeys();
  }, [category]);

  const fetchMarketplaceKeys = async () => {
    setLoading(true);
    try {
      const res = await apiKeysAPI.getMarketplace(category === 'All' ? null : category);
      setAvailableKeys(res.data);
    } catch (error) {
      toast.error('Failed to load marketplace keys');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (keyId) => {
    if (!window.confirm('Are you sure you want to purchase this API key? This will use your active subscription credits.')) {
      return;
    }
    
    setPurchasing(true);
    try {
      await apiKeysAPI.buy(keyId);
      toast.success('API Key acquired successfully!');
      fetchMarketplaceKeys();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Purchase failed. Ensure you have an active Pro/Max subscription.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Category Filter */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 text-gray-500 mr-2 px-2 border-r">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-bold uppercase">Filter</span>
        </div>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              category === cat 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : availableKeys.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900">No keys found in {category}</h3>
          <p className="text-gray-500 mt-1">Check back later or try another category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {availableKeys.map(apiKey => (
            <div key={apiKey.id} className="group bg-white border border-gray-100 rounded-3xl p-8 hover:shadow-2xl hover:shadow-indigo-100 transition-all border-b-4 hover:border-indigo-600">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-widest mb-3 inline-block">
                    {apiKey.category}
                  </span>
                  <h3 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{apiKey.name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-gray-900">₹{apiKey.price.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">One-time Access</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Rate Limit</p>
                    <p className="text-sm font-bold text-gray-700">{apiKey.rate_limit_per_minute.toLocaleString()} / min</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Guaranteed Uptime</p>
                    <p className="text-sm font-bold text-gray-700">99.9% SLA</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(apiKey.id)}
                disabled={purchasing}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex justify-center items-center gap-2 shadow-lg ${
                  apiKey.is_paid 
                  ? 'bg-gray-900 text-white group-hover:bg-indigo-600' 
                  : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                {purchasing 
                  ? 'Verifying...' 
                  : apiKey.is_paid ? 'Acquire API Key' : 'Obtain for Free'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
