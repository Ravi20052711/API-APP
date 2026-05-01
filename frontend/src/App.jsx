import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Sidebar from './components/Sidebar';
import BillingPlans from './components/BillingPlans';
import APIKeys from './components/APIKeys';
import AdminPanel from './components/AdminPanel';
import UsageStats from './components/UsageStats';
import Marketplace from './components/Marketplace';
import UPIPaymentFlow from './components/UPIPaymentFlow';
import { apiKeysAPI, usageAPI, billingAPI } from './services/api';
import { useEffect, useState } from 'react';
import { Activity, Key, AlertCircle, Clock, User as UserIcon, Zap, ShieldCheck, Globe, Layout, Layers, Terminal } from 'lucide-react';

// --- Dashboard Component (Flexible & Responsive) ---
function Dashboard() {
  const [apiKeys, setApiKeys] = useState([]);
  const [stats, setStats] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [keysRes, statsRes] = await Promise.all([
        apiKeysAPI.list(),
        usageAPI.stats(7),
      ]);
      setApiKeys(keysRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar onLogout={logout} />
      
      <main className="flex-1 overflow-auto bg-[#f8fafc]">
        <div className="p-4 md:p-10 max-w-[1600px] mx-auto space-y-8">
          
          {/* Top Hero Section */}
          <div className="relative overflow-hidden bg-indigo-600 rounded-[3rem] p-8 md:p-14 text-white shadow-2xl shadow-indigo-200">
             <div className="absolute top-0 right-0 w-1/3 h-full bg-white/10 -skew-x-12 translate-x-20" />
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-4">
                   <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest">
                      <Zap className="w-3.5 h-3.5 fill-current" /> Live Status
                   </div>
                   <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
                      Welcome back, <br/>
                      <span className="text-indigo-200">{user?.full_name || user?.email.split('@')[0]}</span>
                   </h1>
                </div>
                <div className="flex gap-4">
                   <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/20">
                      <p className="text-xs font-bold text-indigo-100 uppercase mb-1">Current Plan</p>
                      <p className="text-2xl font-black">{user?.is_superuser ? 'Enterprise Admin' : 'Pro Member'}</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Flexible Grid System */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             
             {/* Main Activity Column */}
             <div className="lg:col-span-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                         <Layers className="w-7 h-7" />
                      </div>
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">Active Integrations</h3>
                      <p className="text-5xl font-black text-gray-900 tracking-tighter">{apiKeys.length}</p>
                   </div>
                   <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                      <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all">
                         <Terminal className="w-7 h-7" />
                      </div>
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">Total Requests (7d)</h3>
                      <p className="text-5xl font-black text-gray-900 tracking-tighter">{stats?.total_requests || 0}</p>
                   </div>
                </div>

                <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
                   <div className="p-8 md:p-10 border-b border-gray-50 flex justify-between items-center">
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                         <Key className="w-6 h-6 text-indigo-600" />
                         Key Management
                      </h2>
                      <Link to="/api-keys" className="text-sm font-bold text-indigo-600 hover:underline">View All Keys</Link>
                   </div>
                   <div className="p-4 md:p-8">
                      <APIKeys apiKeys={apiKeys.slice(0, 3)} setApiKeys={setApiKeys} />
                   </div>
                </div>
             </div>

             {/* Side Insights Column */}
             <div className="lg:col-span-4 space-y-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                   <h3 className="text-lg font-black text-gray-900 mb-6">Quick Insights</h3>
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-sm font-bold text-gray-500">Service Uptime</span>
                         </div>
                         <span className="text-sm font-black text-gray-900">99.99%</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-sm font-bold text-gray-500">Success Rate</span>
                         </div>
                         <span className="text-sm font-black text-gray-900">{100 - (stats?.error_rate || 0)}%</span>
                      </div>
                      <div className="pt-4 border-t border-gray-50">
                         <p className="text-xs text-gray-400 leading-relaxed italic">Your account is in good standing. All gateway endpoints are reachable.</p>
                      </div>
                   </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-[2.5rem] text-white shadow-xl">
                   <Globe className="w-10 h-10 text-indigo-400 mb-6" />
                   <h3 className="text-xl font-black mb-2">Need More Power?</h3>
                   <p className="text-gray-400 text-sm leading-relaxed mb-8">Unlock specialized AI and Automation keys in the marketplace.</p>
                   <Link to="/marketplace" className="block w-full py-4 bg-indigo-600 rounded-2xl text-center font-black hover:bg-indigo-500 transition-all">
                      Browse Marketplace
                   </Link>
                </div>
             </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// --- Page Layout (Flexible Wrapper) ---
function PageLayout({ title, children, maxWidth = "max-w-6xl" }) {
  const { logout } = useAuth();
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar onLogout={logout} />
      <main className="flex-1 overflow-auto">
        <div className={`p-4 md:p-10 lg:p-12 ${maxWidth} mx-auto space-y-8`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">{title}</h1>
                <div className="w-16 h-2 bg-indigo-600 rounded-full" />
             </div>
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Pages ---
function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState([]);
  useEffect(() => {
    apiKeysAPI.list().then(res => setApiKeys(res.data)).catch(console.error);
  }, []);
  return <PageLayout title="Integrations" maxWidth="max-w-5xl"><APIKeys apiKeys={apiKeys} setApiKeys={setApiKeys} /></PageLayout>;
}

function AdminPage() {
  const { user } = useAuth();
  if (!user?.is_superuser) return <Navigate to="/dashboard" />;
  return <PageLayout title="Admin Hub" maxWidth="max-w-[1400px]"><AdminPanel /></PageLayout>;
}

function UsagePage() {
  return <PageLayout title="Analytics" maxWidth="max-w-7xl"><UsageStats /></PageLayout>;
}

function WebhooksPage() {
  return <PageLayout title="Webhooks" maxWidth="max-w-5xl"><Webhooks /></PageLayout>;
}

function BillingPage() {
  return <PageLayout title="Subscription" maxWidth="max-w-7xl"><BillingPlans /></PageLayout>;
}

function MarketplacePage() {
  return <PageLayout title="Marketplace" maxWidth="max-w-7xl"><Marketplace /></PageLayout>;
}

// --- High-Color Vibrant Home Page ---
function HomePage() {
  const { user } = useAuth();
  if (user) return <Dashboard />;
  
  return (
    <div className="min-h-screen bg-white font-sans overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-500/20 blur-[120px] rounded-full" />
         <div className="absolute top-[20%] right-[10%] w-[30%] h-[40%] bg-cyan-400/10 blur-[100px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 p-8 flex justify-between items-center max-w-7xl mx-auto">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
               <Zap className="w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-gray-900">MeterFlow</span>
         </div>
         <div className="flex items-center gap-8">
            <Link to="/login" className="text-sm font-black text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">Login</Link>
            <Link to="/register" className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200">Get Started</Link>
         </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 flex flex-col items-center text-center">
         <div className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-50 rounded-full border border-indigo-100 mb-10">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">New: API Masking 2.0 Live</span>
         </div>
         
         <h1 className="text-6xl md:text-9xl font-black text-gray-900 tracking-tighter leading-[0.9] mb-10">
            The Multi-Chain <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600">API Marketplace.</span>
         </h1>
         
         <p className="text-xl md:text-2xl text-gray-500 max-w-3xl leading-relaxed mb-16 font-medium">
            Mask, distribute, and monetize your API keys with enterprise-grade security. 
            Automated billing, real-time usage tracking, and instantaneous proxying.
         </p>

         <div className="flex flex-col md:flex-row gap-6">
            <Link to="/register" className="group px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-300 hover:bg-indigo-700 transition-all flex items-center gap-4">
               Create Professional Account <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <div className="px-12 py-6 bg-white border-2 border-gray-100 rounded-[2rem] font-black text-xl text-gray-900 hover:border-indigo-200 transition-all cursor-default">
               ₹2,00,000+ Distributed
            </div>
         </div>

         {/* Social Proof / Brands */}
         <div className="mt-32 w-full pt-20 border-t border-gray-100 flex flex-wrap justify-center gap-12 grayscale opacity-40">
            <span className="text-2xl font-black tracking-tighter">OPENAI</span>
            <span className="text-2xl font-black tracking-tighter">ANTHROPIC</span>
            <span className="text-2xl font-black tracking-tighter">STRIPE</span>
            <span className="text-2xl font-black tracking-tighter">GOOGLE CLOUD</span>
            <span className="text-2xl font-black tracking-tighter">AWS</span>
         </div>
      </main>

      {/* Decorative Blob */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-[0.03]" />
    </div>
  );
}

const ArrowRight = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// --- Auth Handling ---
function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
         <div className="space-y-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
            <p className="text-indigo-400 font-black text-xs uppercase tracking-widest">Encrypting Session</p>
         </div>
      </div>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/api-keys" element={<ProtectedRoute><APIKeysPage /></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/usage" element={<ProtectedRoute><UsagePage /></ProtectedRoute>} />
        <Route path="/webhooks" element={<ProtectedRoute><WebhooksPage /></ProtectedRoute>} />
        <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
