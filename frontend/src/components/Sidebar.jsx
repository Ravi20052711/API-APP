import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Key,
  BarChart3,
  CreditCard,
  LogOut,
  ShieldCheck,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ onLogout }) {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/api-keys", label: "API Keys", icon: Key },
    { path: "/marketplace", label: "Marketplace", icon: ShoppingCart },
    { path: "/usage", label: "Usage", icon: BarChart3 },
    { path: "/webhooks", label: "Webhooks", icon: Zap },
    { path: "/billing", label: "Billing", icon: CreditCard },
  ];

  if (user?.is_superuser) {
    navItems.push({ path: "/admin", label: "Admin Panel", icon: ShieldCheck });
  }

  return (
    <div className="w-72 bg-gray-900 text-white min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-50">
      <Link
        to="/dashboard"
        className="block p-8 hover:bg-gray-800 transition-colors border-b border-gray-800"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">MeterFlow</h1>
        </div>
      </Link>

      <nav className="flex-1 mt-8 space-y-2 px-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "text-indigo-200" : "text-gray-500"}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-gray-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-full font-medium p-2 rounded-lg hover:bg-gray-800"
        >
          <LogOut className="w-5 h-5 text-gray-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
