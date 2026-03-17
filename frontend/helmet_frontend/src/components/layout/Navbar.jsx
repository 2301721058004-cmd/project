import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TimezoneSelector } from '../ui/TimezoneSelector';
import { Shield, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, logout, timezone, setTimezone, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo Section */}
          <Link to={user?.role === 'admin' ? '/admin/dashboard' : '/supervisor/dashboard'} className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="w-11 h-11 bg-gradient-to-tr from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 group-hover:rotate-6 transition-transform duration-500 animate-float">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
            </div>

            <div className="hidden md:block transition-all duration-300 group-hover:translate-x-1">
              <h1 className="text-lg font-black text-gray-800 tracking-tight leading-none mb-0.5">
                SAFETY<span className="text-orange-500">HELMET</span>
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-1 bg-orange-500 rounded-full animate-ping" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  AI Guard System
                </p>
              </div>
            </div>
          </Link>

          {/* User Section */}
          {isAuthenticated && (
            <div className="flex items-center gap-6">

              {/* Timezone Selector - Styled */}
              <div className="hidden lg:block">
                <TimezoneSelector timezone={timezone} onTimezoneChange={setTimezone} />
              </div>

              {/* User Info Card */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                <Link to="/profile" className="flex items-center gap-3 group cursor-pointer">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-gray-800 leading-none mb-1 group-hover:text-orange-600 transition-colors">
                      {user?.full_name}
                    </p>
                    <p className="text-[10px] font-extrabold text-orange-500 uppercase tracking-tighter">
                      {user?.role} Account
                    </p>
                  </div>

                  <div className="relative">
                    <div className="w-10 h-10 ring-2 ring-orange-100 ring-offset-2 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg overflow-hidden">
                      {user?.full_name?.charAt(0).toUpperCase()}
                      <div className="absolute inset-0 bg-orange-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                    </div>
                  </div>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="ml-2 p-2.5 text-gray-400 hover:text-white hover:bg-red-500 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-100 group"
                  title="Logout System"
                >
                  <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Dynamic Progress Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
    </nav>
  );
}
