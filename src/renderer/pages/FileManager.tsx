import React from 'react';
import { 
  EyeIcon, 
  ArrowDownTrayIcon, 
  TrashIcon, 
  FolderIcon, 
  DocumentIcon,
  MagnifyingGlassIcon,
  PlusIcon 
} from '@heroicons/react/24/outline';

interface FileData {
  key: string;
  name: string;
  size: string;
  type: 'file' | 'folder';
  modified: string;
}

const data: FileData[] = [
  {
    key: '1',
    name: 'project-config.json',
    size: '2.4 KB',
    type: 'file',
    modified: '2024-01-15 10:30',
  },
  {
    key: '2',
    name: 'Documents',
    size: '---',
    type: 'folder',
    modified: '2024-01-14 15:45',
  },
  {
    key: '3',
    name: 'app.log',
    size: '156 KB',
    type: 'file',
    modified: '2024-01-15 09:22',
  },
  {
    key: '4',
    name: 'src',
    size: '---',
    type: 'folder',
    modified: '2024-01-15 08:15',
  },
  {
    key: '5',
    name: 'package.json',
    size: '1.8 KB',
    type: 'file',
    modified: '2024-01-14 16:20',
  },
];

const FileManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">File Manager</h2>
        <p className="text-gray-600 mt-1">Manage your project files and folders</p>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Search files..."
          />
        </div>
        <button className="btn-primary inline-flex items-center">
          <PlusIcon className="w-4 h-4 mr-2" />
          New Folder
        </button>
      </div>

      {/* File Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((file) => (
                <tr key={file.key} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        {file.type === 'folder' ? (
                          <FolderIcon className="h-5 w-5 text-blue-500" />
                        ) : (
                          <DocumentIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {file.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {file.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      file.type === 'folder' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {file.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {file.modified}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button className="text-primary-600 hover:text-primary-800 transition-colors">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 transition-colors">
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800 transition-colors">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="card">
          <div className="text-sm font-medium text-gray-500">Total Files</div>
          <div className="text-2xl font-bold text-gray-900">
            {data.filter(f => f.type === 'file').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm font-medium text-gray-500">Total Folders</div>
          <div className="text-2xl font-bold text-gray-900">
            {data.filter(f => f.type === 'folder').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm font-medium text-gray-500">Total Size</div>
          <div className="text-2xl font-bold text-gray-900">4.2 KB</div>
        </div>
      </div>
    </div>
  );
};

export default FileManager; 