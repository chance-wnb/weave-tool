import React, { useState, useEffect } from 'react';
import { KeyIcon } from '@heroicons/react/24/outline';

interface Cookie {
  name: string;
  value: string;
  domain: string;
}

interface CookieFixerTabProps {}

const CookieFixerTab: React.FC<CookieFixerTabProps> = () => {
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('wandb.ai');
  const [error, setError] = useState<string | null>(null);

  const domains = ['wandb.ai', 'wandb.test', 'localhost', 'github.com', 'google.com'];

  const loadCookies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the main process to get Chrome cookies
      const result = await window.electronAPI.getChromeCookies(selectedDomain);
      
      if (result.success) {
        setCookies(result.cookies);
      } else {
        setError(result.error || 'Failed to load cookies');
        setCookies([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setCookies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCookies();
  }, [selectedDomain]);

  const handleRefresh = () => {
    loadCookies();
  };

  const truncateValue = (value: string, maxLength: number = 50) => {
    return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <KeyIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Cookie Fixer</h2>
            <p className="text-sm text-gray-600">View and manage Chrome cookies</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading cookies...</div>
          </div>
        ) : cookies.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <KeyIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No cookies found for {selectedDomain}</p>
              <p className="text-sm mt-2">Try selecting a different domain or refreshing</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Found {cookies.length} cookie{cookies.length !== 1 ? 's' : ''} for {selectedDomain}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cookies.map((cookie, index) => (
                    <tr key={`${cookie.name}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cookie.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        <span 
                          className="font-mono text-xs bg-gray-100 px-2 py-1 rounded"
                          title={cookie.value}
                        >
                          {truncateValue(cookie.value)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cookie.domain}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieFixerTab;