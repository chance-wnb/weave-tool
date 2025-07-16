import React, { useState } from 'react';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Import page components
import Dashboard from './pages/Dashboard';
import FileManager from './pages/FileManager';
import Settings from './pages/Settings';
import UserProfile from './pages/UserProfile';
import Tools from './pages/Tools';

interface MenuItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  component: React.ReactNode;
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    icon: ChartBarIcon,
    label: 'Dashboard',
    component: <Dashboard />,
  },
  {
    key: 'files',
    icon: DocumentTextIcon,
    label: 'File Manager',
    component: <FileManager />,
  },
  {
    key: 'tools',
    icon: WrenchScrewdriverIcon,
    label: 'Tools',
    component: <Tools />,
  },
  {
    key: 'profile',
    icon: UserIcon,
    label: 'Profile',
    component: <UserProfile />,
  },
  {
    key: 'settings',
    icon: Cog6ToothIcon,
    label: 'Settings',
    component: <Settings />,
  },
];

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');

  const currentComponent = menuItems.find(item => item.key === selectedKey)?.component;
  const currentLabel = menuItems.find(item => item.key === selectedKey)?.label;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-sidebar-bg transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} flex flex-col`}>
        {/* Logo/Header */}
        <div className="flex items-center justify-between p-4">
          <div className="text-white font-bold text-lg">
            {collapsed ? 'W' : 'Weave Tool'}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-300 hover:text-white transition-colors"
          >
            {collapsed ? (
              <Bars3Icon className="w-5 h-5" />
            ) : (
              <XMarkIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = selectedKey === item.key;
            
            return (
              <button
                key={item.key}
                onClick={() => setSelectedKey(item.key)}
                className={`w-full flex items-center px-3 py-3 text-left rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <IconComponent className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <span className="ml-3 text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">{currentLabel}</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {currentComponent}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App; 