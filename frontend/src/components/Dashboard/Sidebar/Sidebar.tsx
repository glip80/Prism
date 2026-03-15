import React from 'react';
import { useLayoutStore } from '../../../stores/layoutStore';
import { useLayout } from '../../../hooks/useLayout';
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Table2,
  Settings,
  ChevronDown,
  ChevronRight,
  PieChart,
  Activity,
  Layers,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  layoutId?: string;
  children?: { label: string; layoutId: string }[];
}

const Sidebar: React.FC = () => {
  const { layouts, currentLayout } = useLayoutStore();
  const { loadLayoutById } = useLayout();
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    dashboards: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navSections: { title: string; key: string; items: NavItem[] }[] = [
    {
      title: 'MENU',
      key: 'dashboards',
      items: [
        {
          label: 'Dashboards',
          icon: <LayoutDashboard size={18} />,
          children: (Array.isArray(layouts) ? layouts : []).map((l) => ({
            label: l.title,
            layoutId: l.id || '',
          })),
        },
      ],
    },
    {
      title: 'WIDGETS',
      key: 'widgets',
      items: [
        { label: 'Charts', icon: <BarChart3 size={18} /> },
        { label: 'Tables', icon: <Table2 size={18} /> },
        { label: 'Metrics', icon: <Activity size={18} /> },
        { label: 'Analytics', icon: <PieChart size={18} /> },
      ],
    },
    {
      title: 'FINANCE',
      key: 'finance',
      items: [
        { label: 'Stock Charts', icon: <TrendingUp size={18} /> },
        { label: 'Heatmaps', icon: <Layers size={18} /> },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <TrendingUp size={22} />
        </div>
        <span className="sidebar-logo-text">Prism</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navSections.map((section) => (
          <div key={section.key} className="sidebar-section">
            <div className="sidebar-section-title">{section.title}</div>
            {section.items.map((item) => (
              <div key={item.label}>
                <button
                  className={`sidebar-nav-item ${item.children ? '' : ''}`}
                  onClick={() => {
                    if (item.children) {
                      toggleSection(item.label);
                    } else if (item.layoutId) {
                      loadLayoutById(item.layoutId);
                    }
                  }}
                >
                  <span className="sidebar-nav-icon">{item.icon}</span>
                  <span className="sidebar-nav-label">{item.label}</span>
                  {item.children && (
                    <span className="sidebar-nav-chevron">
                      {expandedSections[item.label] ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </span>
                  )}
                </button>
                {item.children && expandedSections[item.label] && (
                  <div className="sidebar-subnav">
                    {item.children.map((child) => (
                      <button
                        key={child.layoutId}
                        className={`sidebar-subnav-item ${
                          currentLayout?.id === child.layoutId ? 'active' : ''
                        }`}
                        onClick={() => loadLayoutById(child.layoutId)}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="sidebar-footer">
        <button className="sidebar-nav-item">
          <span className="sidebar-nav-icon"><Settings size={18} /></span>
          <span className="sidebar-nav-label">Settings</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
