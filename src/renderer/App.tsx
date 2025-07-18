import {
  Bars3Icon,
  ChartBarIcon,
  CommandLineIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useFullscreen } from './contexts/FullscreenContext';

// Import page components
import Dashboard from './pages/Dashboard';
import DevTools from './pages/DevTools';

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
    key: 'devtools',
    icon: CommandLineIcon,
    label: 'DevTools',
    component: <DevTools />,
  },
  // {
  //   key: 'files',
  //   icon: DocumentTextIcon,
  //   label: 'File Manager',
  //   component: <FileManager />,
  // },
  // {
  //   key: 'tools',
  //   icon: WrenchScrewdriverIcon,
  //   label: 'Tools',
  //   component: <Tools />,
  // },
  // {
  //   key: 'profile',
  //   icon: UserIcon,
  //   label: 'Profile',
  //   component: <UserProfile />,
  // },
  // {
  //   key: 'settings',
  //   icon: Cog6ToothIcon,
  //   label: 'Settings',
  //   component: <Settings />,
  // },
];

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const { isFullscreen } = useFullscreen();

  const currentComponent = menuItems.find(item => item.key === selectedKey)?.component;
  const currentLabel = menuItems.find(item => item.key === selectedKey)?.label;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - hidden in fullscreen mode */}
      <div 
        className={`bg-sidebar-bg transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} flex flex-col`}
        style={{ display: isFullscreen ? 'none' : 'flex' }}
      >
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
        {/* Header - hidden in fullscreen mode */}
        <header 
          className="bg-white shadow-sm border-b border-gray-200 px-6 py-4"
          style={{ display: isFullscreen ? 'none' : 'block' }}
        >
          <h1 className="text-2xl font-semibold text-gray-900">{currentLabel}</h1>
        </header>

        {/* Content */}
        <main className={`flex-1 overflow-auto custom-scrollbar transition-all duration-300 ${
          isFullscreen ? 'p-0' : 'p-6'
        }`}>
          <div className={`h-full transition-all duration-300 ${
            isFullscreen ? 'max-w-none' : 'max-w-7xl mx-auto'
          }`}>
            {currentComponent}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App; 