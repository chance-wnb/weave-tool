import React from 'react';
import { 
  UserIcon, 
  PencilIcon, 
  LockClosedIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const UserProfile: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">User Profile</h2>
        <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card text-center">
            <div className="space-y-4">
              <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-primary-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900">John Doe</h3>
                <p className="text-gray-600">Software Engineer</p>
                <div className="flex items-center justify-center mt-2">
                  <ShieldCheckIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">Verified Account</span>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <button className="btn-primary inline-flex items-center justify-center">
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
                <button className="btn-secondary inline-flex items-center justify-center">
                  <LockClosedIcon className="w-4 h-4 mr-2" />
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card mt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Projects</span>
                <span className="text-sm font-medium text-gray-900">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tasks Completed</span>
                <span className="text-sm font-medium text-gray-900">148</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Files Managed</span>
                <span className="text-sm font-medium text-gray-900">2,341</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage Used</span>
                <span className="text-sm font-medium text-gray-900">1.2 GB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Username
                  </label>
                  <p className="mt-1 text-sm text-gray-900">johndoe</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <EnvelopeIcon className="w-4 h-4 mr-2" />
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900">john.doe@example.com</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <StarIcon className="w-4 h-4 mr-2" />
                    Role
                  </label>
                  <span className="mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    Administrator
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <BriefcaseIcon className="w-4 h-4 mr-2" />
                    Department
                  </label>
                  <p className="mt-1 text-sm text-gray-900">Engineering</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Joined
                  </label>
                  <p className="mt-1 text-sm text-gray-900">January 2023</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Last Login
                  </label>
                  <p className="mt-1 text-sm text-gray-900">2024-01-15 10:30 AM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="card mt-6">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            
            <div className="space-y-4">
              {[
                { action: 'Updated profile picture', time: '2 hours ago', type: 'profile' },
                { action: 'Completed project migration', time: '1 day ago', type: 'project' },
                { action: 'Changed password', time: '3 days ago', type: 'security' },
                { action: 'Added new SSH key', time: '1 week ago', type: 'security' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    activity.type === 'profile' ? 'bg-blue-400' :
                    activity.type === 'project' ? 'bg-green-400' : 'bg-yellow-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 