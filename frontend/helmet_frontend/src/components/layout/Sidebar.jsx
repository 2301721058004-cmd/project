import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  MapPin,
  Camera,
  Users,
  AlertTriangle,
  Image as ImageIcon,
  Search,
  ClipboardList,
  Activity,
  Database,
  ChevronRight,
  ShieldAlert,
  Zap,
  Settings,
  Info,
  HelpCircle,
  BarChart3,
} from 'lucide-react';

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/zones', label: 'Zones', icon: MapPin },
  { to: '/admin/cameras', label: 'Cameras', icon: Camera },
  { to: '/admin/supervisors', label: 'Supervisors', icon: Users },
  { to: '/admin/violations', label: 'Violations', icon: AlertTriangle },
  { to: '/admin/daily-violations', label: 'Daily Report', icon: BarChart3 },
  { to: '/admin/gallery', label: 'Gallery', icon: ImageIcon },
  { to: '/admin/about', label: 'About', icon: Info },
  { to: '/admin/faq', label: 'FAQ', icon: HelpCircle },
];

const SUPERVISOR_LINKS = [
  { to: '/supervisor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/supervisor/zones', label: 'My Zones', icon: MapPin },
  { to: '/supervisor/gallery', label: 'Gallery', icon: ImageIcon },
  { to: '/supervisor/history', label: 'History', icon: ClipboardList },
  { to: '/supervisor/about', label: 'About', icon: Info },
  { to: '/supervisor/faq', label: 'FAQ', icon: HelpCircle },
];

export function Sidebar() {
  const { isAdmin, user } = useAuth();
  const location = useLocation();
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 });
  const navRef = useRef(null);

  const links = isAdmin ? ADMIN_LINKS : SUPERVISOR_LINKS;

  const updateIndicator = useCallback(() => {
    // Find the element with active-link class
    const activeLink = navRef.current?.querySelector('.active-link');
    if (activeLink) {
      setIndicatorStyle(prev => {
        const newStyle = {
          top: activeLink.offsetTop,
          height: activeLink.offsetHeight,
          opacity: 1
        };
        // Only update if values actually changed to prevent loops
        if (prev.top === newStyle.top && prev.height === newStyle.height && prev.opacity === newStyle.opacity) {
          return prev;
        }
        return newStyle;
      });
    } else {
      setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
    }
  }, []);

  useEffect(() => {
    // Debug log to see current navigation state
    console.log('[Sidebar] Current Path:', location.pathname);
    console.log('[Sidebar] Role:', user?.role);

    // Immediate update
    updateIndicator();

    // Fallback updates for slower DOM changes
    const timeoutIds = [50, 150, 400].map(delay => setTimeout(updateIndicator, delay));

    return () => timeoutIds.forEach(id => clearTimeout(id));
  }, [location.pathname, links, user?.role, updateIndicator]);

  return (
    <aside className="w-72 bg-white border-r border-orange-100 min-h-screen shadow-sm flex flex-col sticky top-0 h-screen">
      <div className="flex-1 p-6 space-y-8 overflow-y-auto">

        {/* Navigation Section */}
        <div className="relative">
          <p className="text-[10px] font-extrabold text-orange-400 uppercase tracking-[0.25em] mb-6 px-4 flex items-center gap-2">
            <Zap className="w-3 h-3 text-orange-500" />
            Control Center
          </p>

          <nav ref={navRef} className="space-y-1 relative">
            {/* Sliding Indicator Background */}
            <div
              className="absolute left-0 right-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl transition-all duration-500 ease-in-out shadow-lg shadow-orange-200 pointer-events-none"
              style={{
                top: `${indicatorStyle.top}px`,
                height: `${indicatorStyle.height}px`,
                opacity: indicatorStyle.opacity,
              }}
            />

            {links.map((link, index) => {
              const Icon = link.icon;

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `
                    group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative z-10
                    ${isActive ? 'text-white active-link' : 'text-gray-500 hover:text-orange-600'}
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 transition-all duration-500 ${isActive ? 'scale-110 rotate-3' : 'group-hover:scale-110 group-hover:-rotate-3'
                        }`} />

                      <span className={`text-sm font-semibold tracking-wide transition-all duration-300 ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'
                        }`}>
                        {link.label}
                      </span>

                      <ChevronRight className={`ml-auto w-4 h-4 transition-all duration-500 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
                        }`} />

                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>


      </div>

      {/* Footer Card */}
      <div className="p-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-5 shadow-lg shadow-orange-200 group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute -left-2 -bottom-2 w-12 h-12 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-700" />

          <div className="relative z-10">
            <div className="mb-3">
              <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">v.1.2.4 Premium</span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed font-semibold mb-3">
              Enterprise Safety Suite
            </p>
            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white w-3/4 shadow-[0_0_10px_white]" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
