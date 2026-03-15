import React from 'react';
import { Search, Bell, Grid3X3, Settings, User, ChevronDown } from 'lucide-react';
import { ThemeProvider } from './components/Common/ThemeProvider';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import DashboardContainer from './components/Dashboard/DashboardContainer';
import Sidebar from './components/Dashboard/Sidebar/Sidebar';
import ThemeSwitcher from './components/Dashboard/Toolbar/ThemeSwitcher';

function App() {
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
                <button className="header-icon-btn" title="Notifications">
                  <Bell size={18} />
                  <span className="header-badge">3</span>
                </button>
                <button className="header-icon-btn" title="Grid View">
                  <Grid3X3 size={18} />
                </button>
                <button className="header-icon-btn" title="Settings">
                  <Settings size={18} />
                </button>
                <div className="header-user">
                  <div className="header-avatar">
                    <User size={18} />
                  </div>
                  <div className="header-user-info">
                    <span className="header-user-name">Admin User</span>
                    <span className="header-user-role">Dashboard Manager</span>
                  </div>
                  <ChevronDown size={14} className="header-user-chevron" />
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
