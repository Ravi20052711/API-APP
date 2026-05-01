import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Key, BarChart3, CreditCard, LogOut, ShieldCheck, ShoppingCart, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/api-keys', label: 'API Keys', icon: Key },
    { path: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
    { path: '/usage', label: 'Usage', icon: BarChart3 },
    { path: '/webhooks', label: 'Webhooks', icon: Zap },
    { path: '/billing', label: 'Billing', icon: CreditCard },
  ];

  if (user?.is_superuser) {
    navItems.push({ path: '/admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen">
      <Link to="/dashboard" className="block p-6 hover:bg-gray-800 transition-colors">
        <h1 className="text-2xl font-bold">MeterFlow</h1>
        <p className="text-gray-400 text-sm mt-1">API Billing Platform</p>
      </Link>

      <nav className="mt-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${
                isActive ? 'bg-gray-800 text-white border-l-4 border-blue-500' : ''
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-6 border-t border-gray-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
