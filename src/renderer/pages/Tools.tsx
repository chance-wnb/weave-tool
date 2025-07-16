import React from 'react';
import { 
  CodeBracketIcon,
  BugAntIcon,
  CpuChipIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon 
} from '@heroicons/react/24/outline';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  status: 'available' | 'coming-soon';
}

const tools: Tool[] = [
  {
    id: 'code-generator',
    title: 'Code Generator',
    description: 'Generate boilerplate code for common patterns and structures.',
    icon: CodeBracketIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    status: 'available',
  },
  {
    id: 'debug-console',
    title: 'Debug Console',
    description: 'Access debugging tools and console for troubleshooting.',
    icon: BugAntIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    status: 'available',
  },
  {
    id: 'system-monitor',
    title: 'System Monitor',
    description: 'Monitor system resources and application performance.',
    icon: CpuChipIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    status: 'available',
  },
  {
    id: 'config-manager',
    title: 'Configuration Manager',
    description: 'Manage application configurations and environment settings.',
    icon: Cog6ToothIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    status: 'available',
  },
  {
    id: 'terminal',
    title: 'Terminal',
    description: 'Built-in terminal for running commands and scripts.',
    icon: CommandLineIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    status: 'coming-soon',
  },
  {
    id: 'file-duplicator',
    title: 'File Duplicator',
    description: 'Advanced file duplication and batch operations.',
    icon: DocumentDuplicateIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    status: 'coming-soon',
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    description: 'View detailed analytics and usage statistics.',
    icon: ChartBarIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    status: 'available',
  },
  {
    id: 'security-scanner',
    title: 'Security Scanner',
    description: 'Scan your project for security vulnerabilities.',
    icon: ShieldCheckIcon,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    status: 'coming-soon',
  },
];

const Tools: React.FC = () => {
  const handleToolClick = (toolId: string) => {
    console.log(`Opening tool: ${toolId}`);
    // Implement tool opening logic here
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Tools & Utilities</h2>
        <p className="text-gray-600 mt-1">Powerful tools to enhance your development workflow</p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button className="btn-primary">
          <CommandLineIcon className="w-4 h-4 mr-2" />
          Quick Terminal
        </button>
        <button className="btn-secondary">
          <BugAntIcon className="w-4 h-4 mr-2" />
          Debug Current File
        </button>
        <button className="btn-secondary">
          <CpuChipIcon className="w-4 h-4 mr-2" />
          System Status
        </button>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          
          return (
            <div
              key={tool.id}
              className={`card hover:shadow-md transition-all duration-200 cursor-pointer relative ${
                tool.status === 'coming-soon' ? 'opacity-75' : 'hover:scale-105'
              }`}
              onClick={() => tool.status === 'available' && handleToolClick(tool.id)}
            >
              {tool.status === 'coming-soon' && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    Coming Soon
                  </span>
                </div>
              )}
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-12 h-12 ${tool.bgColor} rounded-xl flex items-center justify-center`}>
                  <IconComponent className={`w-6 h-6 ${tool.color}`} />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                
                {tool.status === 'available' && (
                  <button className="w-full btn-primary inline-flex items-center justify-center">
                    <span>Open</span>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Tools */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recently Used Tools</h3>
        </div>
        <div className="space-y-3">
          {tools.slice(0, 3).map((tool) => {
            const IconComponent = tool.icon;
            
            return (
              <div key={tool.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className={`w-8 h-8 ${tool.bgColor} rounded-lg flex items-center justify-center`}>
                  <IconComponent className={`w-4 h-4 ${tool.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{tool.title}</p>
                  <p className="text-xs text-gray-500">Last used 2 hours ago</p>
                </div>
                <ArrowTopRightOnSquareIcon className="w-4 h-4 text-gray-400" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Tools; 