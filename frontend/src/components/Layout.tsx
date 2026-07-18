import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import LoginForm from './LoginForm';
import { useUser } from '../context/UserContext';

const navItems = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/castings', icon: 'groups', label: 'Casting Calls' },
  { to: '/castings/create', icon: 'add_circle', label: 'Create Casting' },
];

const roleUsers: Record<string, string> = {
  director: 'user-director-1',
  actor: 'user-actor-1',
  preselector: 'user-preselector-1',
};

export default function Layout() {
  const location = useLocation();
  const { user, refreshUser } = useUser();

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
  const [demoEnabled, setDemoEnabled] = useState(() => localStorage.getItem('demo-mode') === 'true');
  const [selectedRole, setSelectedRole] = useState(() => localStorage.getItem('demo-role') || 'director');
  console.log('selectedRole:', selectedRole);

  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token || demoEnabled;

  const sidebarWidth = collapsed ? 'w-16' : 'w-[280px]';
  const mainMargin = collapsed ? 'ml-16' : 'ml-[280px]';

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const toggleDemo = () => {
    const next = !demoEnabled;
    setDemoEnabled(next);
    localStorage.setItem('demo-mode', String(next));
    if (next) {
      localStorage.setItem('demo-role', selectedRole);
      localStorage.setItem('x-user-id', roleUsers[selectedRole]);
    } else {
      localStorage.removeItem('x-user-id');
    }
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    localStorage.setItem('demo-role', role);
    if (demoEnabled) {
      localStorage.setItem('x-user-id', roleUsers[role]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('x-user-id');
    refreshUser();
  };

  const handleLogin = () => {
    refreshUser();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* SideNavBar */}
      <nav className={`fixed left-0 top-0 h-full ${sidebarWidth} bg-background border-r border-outline-variant/30 flex flex-col py-8 z-50 transition-all duration-300`}>
        {/* Header */}
        <div className={`mb-10 ${collapsed ? 'px-3' : 'px-6'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="w-10 h-10 rounded bg-surface-container-high border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low transition-colors shrink-0"
              aria-label="Toggle sidebar"
            >
              <span className="material-symbols-outlined text-on-surface-variant">
                {collapsed ? 'menu_open' : 'menu'}
              </span>
            </button>
            {!collapsed && (
              <div className="overflow-hidden">
                <h2 className="font-headline-md text-headline-md text-primary font-bold tracking-tight whitespace-nowrap">
                  Slate Casting
                </h2>
                <p className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1 whitespace-nowrap">
                  Directorial Suite
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-4 py-3 transition-colors duration-200 active:scale-[0.98] ${
                  collapsed ? 'justify-center px-3' : 'px-6'
                } ${
                  isActive
                    ? 'text-primary border-l-2 border-primary bg-surface-container-high'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className={`mt-auto ${collapsed ? 'px-2' : 'px-6'} space-y-3`}>
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={`w-full bg-primary-container text-on-primary-container font-title-sm text-title-sm py-3 rounded hover:bg-primary transition-colors flex items-center justify-center gap-2 ${
              collapsed ? 'px-0' : 'px-4'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            {!collapsed && 'Cerrar sesión'}
          </button>
        </div>

        {/* Demo Mode Toggle - Always visible at bottom when VITE_DEMO_MODE=true */}
        {isDemoMode && (
          <div className={`${collapsed ? 'px-2 mb-2' : 'px-6 mb-4'}`}>
            <div className="bg-surface-container rounded-lg p-3 border border-outline-variant/20">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                  {collapsed ? 'Demo' : 'Modo Demo'}
                </span>
                <div
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    demoEnabled ? 'bg-primary-container' : 'bg-surface-container-high'
                  }`}
                  onClick={toggleDemo}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
                      demoEnabled
                        ? 'left-5 bg-on-primary-container'
                        : 'left-0.5 bg-outline'
                    }`}
                  />
                </div>
              </label>

              {demoEnabled && !collapsed && (
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="block mt-2 w-full bg-surface-container-high text-on-surface border border-outline-variant/30 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="director">Director</option>
                  <option value="actor">Actor</option>
                  <option value="preselector">Preselector</option>
                </select>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* TopAppBar */}
      <header className={`fixed top-0 right-0 ${mainMargin} h-16 bg-background/80 backdrop-blur-md border-b border-outline-variant/20 flex justify-between items-center px-margin-desktop w-[calc(100%-0rem)] z-40 transition-all duration-300`}>
        <div />
        <div className="flex items-center gap-4 ml-auto">
          {demoEnabled && (
            <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full font-label-caps uppercase">
              Demo: {selectedRole}
            </span>
          )}
          <button
            aria-label="Notifications"
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-2 rounded-full hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            aria-label="Settings"
            className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-2 rounded-full hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
          {user && (
            <div className="flex items-center gap-2 ml-2">
              <div className="text-right">
                <p className="text-sm font-medium text-on-surface leading-tight">{user.name}</p>
                <p className="text-xs text-on-surface-variant leading-tight">{user.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30 overflow-hidden flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
              </div>
            </div>
          )}
          {!user && (
            <div className="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/30 overflow-hidden ml-2 cursor-pointer flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className={`${mainMargin} pt-16 min-h-screen px-margin-desktop py-10 max-w-container-max transition-all duration-300`}>
        {isAuthenticated ? <Outlet /> : <LoginForm onLoginSuccess={handleLogin} />}
      </main>
    </div>
  );
}
