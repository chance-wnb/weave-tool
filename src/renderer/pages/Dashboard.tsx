import React from 'react';
import { ArrowUpIcon, ArrowDownIcon, FolderIcon, DocumentIcon } from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your projects.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Projects */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowUpIcon className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Active Projects</div>
              <div className="text-2xl font-bold text-gray-900 flex items-baseline">
                11.28
                <span className="ml-1 text-sm font-medium text-green-600">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Files */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowDownIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Files</div>
              <div className="text-2xl font-bold text-gray-900 flex items-baseline">
                9.3
                <span className="ml-1 text-sm font-medium text-red-600">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Used */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FolderIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Storage Used</div>
              <div className="text-2xl font-bold text-gray-900 flex items-baseline">
                1,128
                <span className="ml-1 text-sm font-medium text-gray-500">MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <DocumentIcon className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Tasks Completed</div>
              <div className="text-2xl font-bold text-gray-900 flex items-baseline">
                93
                <span className="ml-1 text-sm font-medium text-gray-500">/ 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          {[
            { action: 'Created new project', time: '2 hours ago', status: 'success' },
            { action: 'Updated file structure', time: '4 hours ago', status: 'info' },
            { action: 'Deleted old backups', time: '1 day ago', status: 'warning' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${
                activity.status === 'success' ? 'bg-green-400' :
                activity.status === 'info' ? 'bg-blue-400' : 'bg-yellow-400'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 