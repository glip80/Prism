import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Bell, Grid3X3, Settings, User, ChevronDown,
  LogOut, UserCircle, HelpCircle, Shield,
  CheckCircle, AlertTriangle, Info, Clock,
  LayoutGrid, LayoutList, Maximize2,
  Palette, Monitor, Moon, Sun
} from 'lucide-react';
import { ThemeProvider } from './components/Common/ThemeProvider';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import DashboardContainer from './components/Dashboard/DashboardContainer';
import Sidebar from './components/Dashboard/Sidebar/Sidebar';
import ThemeSwitcher from './components/Dashboard/Toolbar/ThemeSwitcher';

// Reusable dropdown hook
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return { open, setOpen, ref, toggle: () => setOpen((o) => !o) };
}

// Sample notification data
const notifications = [
  { id: 1, icon: <CheckCircle size={16} />, color: 'var(--color-success)', title: 'Build Succeeded', desc: 'Dashboard deployed successfully', time: '2 min ago' },
  { id: 2, icon: <AlertTriangle size={16} />, color: 'var(--color-warning)', title: 'High API Latency', desc: 'Response time exceeds 800ms', time: '15 min ago' },
  { id: 3, icon: <Info size={16} />, color: 'var(--color-info)', title: 'New Widget Available', desc: 'TradingView Ticker widget added', time: '1 hr ago' },
];

function App() {
  const notifDropdown = useDropdown();
  const settingsDropdown = useDropdown();
  const userDropdown = useDropdown();
  const [gridDensity, setGridDensity] = useState<'default' | 'compact' | 'comfortable'>('default');

  const cycleGridDensity = () => {
    setGridDensity((prev) => {
      if (prev === 'default') return 'compact';
      if (prev === 'compact') return 'comfortable';
      return 'default';
    });
    // Apply density via CSS variable
    const root = document.documentElement;
    if (gridDensity === 'default') {
      root.style.setProperty('--grid-row-height', '25px');
      root.style.setProperty('--grid-margin', '6px');
    } else if (gridDensity === 'compact') {
      root.style.setProperty('--grid-row-height', '35px');
      root.style.setProperty('--grid-margin', '12px');
    } else {
      root.style.setProperty('--grid-row-height', '30px');
      root.style.setProperty('--grid-margin', '10px');
    }
  };

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className="app-shell">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Area */}
          <div className="main-area">
            {/* Top Header */}
            <header className="top-header">
              <div className="header-left">
                <div className="header-search">
                  <Search size={16} className="header-search-icon" />
                  <input
                    type="text"
                    placeholder="Search dashboards..."
                    className="header-search-input"
                  />
                </div>
              </div>
              <div className="header-right">
                <ThemeSwitcher />

                {/* Grid Density Toggle */}
                <button
                  className={`header-icon-btn ${gridDensity !== 'default' ? 'active' : ''}`}
                  title={`Grid: ${gridDensity}`}
                  onClick={cycleGridDensity}
                >
                  {gridDensity === 'compact' ? <LayoutList size={18} /> :
                   gridDensity === 'comfortable' ? <Maximize2 size={18} /> :
                   <Grid3X3 size={18} />}
                </button>

                {/* Notifications Dropdown */}
                <div ref={notifDropdown.ref} className="dropdown-wrapper">
                  <button
                    className={`header-icon-btn ${notifDropdown.open ? 'active' : ''}`}
                    title="Notifications"
                    onClick={notifDropdown.toggle}
                  >
                    <Bell size={18} />
                    <span className="header-badge">3</span>
                  </button>
                  {notifDropdown.open && (
                    <div className="dropdown-menu dropdown-notifications">
                      <div className="dropdown-header">
                        <span className="dropdown-header-title">Notifications</span>
                        <button className="dropdown-header-action">Mark all read</button>
                      </div>
                      <div className="dropdown-body">
                        {notifications.map((n) => (
                          <button key={n.id} className="dropdown-item notification-item" onClick={() => notifDropdown.setOpen(false)}>
                            <div className="notification-icon" style={{ color: n.color }}>{n.icon}</div>
                            <div className="notification-content">
                              <span className="notification-title">{n.title}</span>
                              <span className="notification-desc">{n.desc}</span>
                            </div>
                            <span className="notification-time">
                              <Clock size={10} /> {n.time}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="dropdown-footer">
                        <button className="dropdown-footer-link" onClick={() => notifDropdown.setOpen(false)}>
                          View All Notifications
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Settings Dropdown */}
                <div ref={settingsDropdown.ref} className="dropdown-wrapper">
                  <button
                    className={`header-icon-btn ${settingsDropdown.open ? 'active' : ''}`}
                    title="Settings"
                    onClick={settingsDropdown.toggle}
                  >
                    <Settings size={18} />
                  </button>
                  {settingsDropdown.open && (
                    <div className="dropdown-menu dropdown-settings">
                      <div className="dropdown-header">
                        <span className="dropdown-header-title">Quick Settings</span>
                      </div>
                      <div className="dropdown-body">
                        <button className="dropdown-item" onClick={() => settingsDropdown.setOpen(false)}>
                          <Palette size={16} /> <span>Appearance</span>
                        </button>
                        <button className="dropdown-item" onClick={() => settingsDropdown.setOpen(false)}>
                          <Monitor size={16} /> <span>Display</span>
                        </button>
                        <button className="dropdown-item" onClick={() => settingsDropdown.setOpen(false)}>
                          <Shield size={16} /> <span>Privacy & Security</span>
                        </button>
                        <button className="dropdown-item" onClick={() => settingsDropdown.setOpen(false)}>
                          <HelpCircle size={16} /> <span>Help & Support</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Dropdown */}
                <div ref={userDropdown.ref} className="dropdown-wrapper">
                  <div
                    className={`header-user ${userDropdown.open ? 'active' : ''}`}
                    onClick={userDropdown.toggle}
                  >
                    <div className="header-avatar">
                      <User size={18} />
                    </div>
                    <div className="header-user-info">
                      <span className="header-user-name">Admin User</span>
                      <span className="header-user-role">Dashboard Manager</span>
                    </div>
                    <ChevronDown size={14} className={`header-user-chevron ${userDropdown.open ? 'rotated' : ''}`} />
                  </div>
                  {userDropdown.open && (
                    <div className="dropdown-menu dropdown-user">
                      <div className="dropdown-user-header">
                        <div className="dropdown-user-avatar">
                          <User size={24} />
                        </div>
                        <div>
                          <div className="dropdown-user-name">Admin User</div>
                          <div className="dropdown-user-email">admin@prism.io</div>
                        </div>
                      </div>
                      <div className="dropdown-divider" />
                      <div className="dropdown-body">
                        <button className="dropdown-item" onClick={() => userDropdown.setOpen(false)}>
                          <UserCircle size={16} /> <span>My Profile</span>
                        </button>
                        <button className="dropdown-item" onClick={() => userDropdown.setOpen(false)}>
                          <Settings size={16} /> <span>Account Settings</span>
                        </button>
                        <button className="dropdown-item" onClick={() => userDropdown.setOpen(false)}>
                          <HelpCircle size={16} /> <span>Help Center</span>
                        </button>
                      </div>
                      <div className="dropdown-divider" />
                      <div className="dropdown-body">
                        <button className="dropdown-item dropdown-item-danger" onClick={() => userDropdown.setOpen(false)}>
                          <LogOut size={16} /> <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Content */}
            <main className="main-content">
              <DashboardContainer />
            </main>
          </div>
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
