import { useEffect, useState } from 'react';
import { usageAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, TrendingUp, AlertCircle, Zap, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UsageStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
    
    // WebSocket for real-time updates
    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/${user?.id}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'usage_update') {
        setStats(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            total_requests: prev.total_requests + 1,
            // Simple RPM update: just incrementing doesn't account for time window, 
            // but fetchStats will refresh it correctly.
          };
        });
      }
    };

    return () => ws.close();
  }, [days, user?.id]);

  const fetchStats = async () => {
    try {
      const response = await usageAPI.stats(days);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading usage data...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8 text-gray-500">No usage data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-600" />
          Usage Analytics
        </h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Globe className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">Total Requests</span>
          </div>
          <p className="text-3xl font-black text-gray-900">{stats.total_requests.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-indigo-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">Current RPM</span>
          </div>
          <p className="text-3xl font-black text-indigo-600">{stats.rpm}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <Zap className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">Avg Latency</span>
          </div>
          <p className="text-3xl font-black text-orange-500">{stats.latency_ms?.avg}ms</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">Error Rate</span>
          </div>
          <p className="text-3xl font-black text-red-500">{stats.error_rate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.requests_by_day && stats.requests_by_day.length > 0 && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Traffic Pattern
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.requests_by_day}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#4f46e5" 
                    strokeWidth={4} 
                    dot={{r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}}
                    activeDot={{r: 6}}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {stats.endpoint_breakdown && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              Top Endpoints
            </h3>
            <div className="space-y-4">
              {stats.endpoint_breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.endpoint}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                      Avg Latency: {item.avg_latency_ms}ms
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-black text-indigo-600">
                    {item.count} req
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
