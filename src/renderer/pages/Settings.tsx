import React, { useState } from 'react';
import { 
  PaintBrushIcon,
  GlobeAltIcon,
  BellIcon,
  ShieldCheckIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  ComputerDesktopIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

interface SettingsState {
  darkMode: boolean;
  language: string;
  autoSave: boolean;
  notifications: boolean;
  autoSaveInterval: number;
  theme: string;
  fontSize: string;
  sound: boolean;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    darkMode: false,
    language: 'en',
    autoSave: true,
    notifications: true,
    autoSaveInterval: 5,
    theme: 'system',
    fontSize: 'medium',
    sound: true,
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    console.log('Settings saved:', settings);
    setHasChanges(false);
    // Here you would typically save to electron store or backend
  };

  const handleReset = () => {
    setSettings({
      darkMode: false,
      language: 'en',
      autoSave: true,
      notifications: true,
      autoSaveInterval: 5,
      theme: 'system',
      fontSize: 'medium',
      sound: true,
    });
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Application Settings</h2>
        <p className="text-gray-600 mt-1">Customize your application experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appearance */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <PaintBrushIcon className="w-5 h-5 mr-2" />
                Appearance
              </h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Theme</label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: SunIcon },
                    { value: 'dark', label: 'Dark', icon: MoonIcon },
                    { value: 'system', label: 'System', icon: ComputerDesktopIcon },
                  ].map((theme) => {
                    const IconComponent = theme.icon;
                    return (
                      <button
                        key={theme.value}
                        onClick={() => updateSetting('theme', theme.value)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          settings.theme === theme.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <IconComponent className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                        <div className="text-sm font-medium text-gray-900">{theme.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Font Size</label>
                <select
                  value={settings.fontSize}
                  onChange={(e) => updateSetting('fontSize', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="extra-large">Extra Large</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <GlobeAltIcon className="w-4 h-4 mr-2" />
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                Preferences
              </h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto Save</label>
                  <p className="text-sm text-gray-500">Automatically save changes</p>
                </div>
                <button
                  onClick={() => updateSetting('autoSave', !settings.autoSave)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.autoSave ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {settings.autoSave && (
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Auto Save Interval (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.autoSaveInterval}
                    onChange={(e) => updateSetting('autoSaveInterval', parseInt(e.target.value))}
                    className="mt-1 block w-24 rounded-md border border-gray-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <BellIcon className="w-4 h-4 mr-2" />
                    Notifications
                  </label>
                  <p className="text-sm text-gray-500">Show desktop notifications</p>
                </div>
                <button
                  onClick={() => updateSetting('notifications', !settings.notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Sound Effects</label>
                  <p className="text-sm text-gray-500">Play sound effects for actions</p>
                </div>
                <button
                  onClick={() => updateSetting('sound', !settings.sound)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.sound ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.sound ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="btn-secondary"
            >
              Reset to Defaults
            </button>
            <div className="flex space-x-3">
              {hasChanges && (
                <span className="text-sm text-amber-600 self-center">You have unsaved changes</span>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`btn-primary ${!hasChanges ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* Settings Info */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2" />
                System Info
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Version</label>
                <p className="text-sm text-gray-900">1.0.0</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Platform</label>
                <p className="text-sm text-gray-900">macOS</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Node.js</label>
                <p className="text-sm text-gray-900">22.14.0</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Electron</label>
                <p className="text-sm text-gray-900">37.2.2</p>
              </div>
            </div>
          </div>

          <div className="card mt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Shortcuts</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Save</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘S</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Settings</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘,</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Toggle Sidebar</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘B</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 