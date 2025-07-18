import React, { useEffect, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';

interface OutputPage {
  id: string;
  timestamp: Date;
  content: string;
  status: 'active' | 'concluded';
}

interface TableData {
  title: string;
  description: string;
  headers: string[];
  rows: string[][];
  metadata: {
    totalRows: number;
    dataTypes: string[];
    sortable: boolean;
  };
}

interface AnalysisResult {
  tables: TableData[];
  error?: boolean;
  message?: string;
}

interface AuxVisualizationTabProps {
  outputPages: OutputPage[];
  currentPageIndex: number;
  currentPageBuffer: string;
  onPageIndexChange: (index: number) => void;
  onGoToPreviousPage: () => void;
  onGoToNextPage: () => void;
  onGoToLatestPage: () => void;
}

// DataTable component for rendering individual tables
interface DataTableProps {
  table: TableData;
}

const DataTable: React.FC<DataTableProps> = ({ table }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Convert table data to react-table format
  const data = useMemo(() => {
    return table.rows.map(row => {
      const rowObj: Record<string, any> = {};
      table.headers.forEach((header, index) => {
        rowObj[header] = row[index] || '';
      });
      return rowObj;
    });
  }, [table.rows, table.headers]);

  // Create columns
  const columns = useMemo(() => {
    return table.headers.map(header => ({
      accessorKey: header,
      header: header,
      cell: (info: any) => info.getValue(),
    }));
  }, [table.headers]);

  const reactTable = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      {/* Table Header */}
      <div className="mb-4">
        <h5 className="text-blue-400 font-semibold text-sm mb-1">{table.title}</h5>
        <p className="text-gray-400 text-xs mb-3">{table.description}</p>
        
        {/* Table Info and Search */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-500">
            {table.metadata.totalRows} rows • 
            {table.headers.length} columns • 
            {table.metadata.sortable ? 'Sortable' : 'Static'}
          </div>
          
          {/* Search Input */}
          <input
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400"
            placeholder="Search..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            {reactTable.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-gray-600">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="text-left py-2 px-3 text-purple-400 font-semibold bg-gray-700 cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? ' ↕️'}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {reactTable.getRowModel().rows.map((row, rowIndex) => (
              <tr 
                key={row.id} 
                className={`border-b border-gray-700 hover:bg-gray-750 transition-colors ${
                  rowIndex % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                }`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="py-2 px-3 text-gray-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Table Footer Info */}
        <div className="text-center py-3 text-gray-500 text-xs">
          Showing {reactTable.getRowModel().rows.length} of {table.metadata.totalRows} rows
          {globalFilter && ` (filtered)`}
        </div>
      </div>
    </div>
  );
};

const AuxVisualizationTab: React.FC<AuxVisualizationTabProps> = ({
  outputPages,
  currentPageIndex,
  currentPageBuffer,
  onPageIndexChange,
  onGoToPreviousPage,
  onGoToNextPage,
  onGoToLatestPage,
}) => {
  // Derived values
  const hasPages = outputPages.length > 0;
  const currentPage = outputPages[currentPageIndex];
  const isOnLatestPage = currentPageIndex === outputPages.length - 1;

  // LLM Analysis State
  const [analysisResults, setAnalysisResults] = useState<Map<string, AnalysisResult>>(new Map());
  const [loadingAnalysis, setLoadingAnalysis] = useState<Set<string>>(new Set());
  const [analysisErrors, setAnalysisErrors] = useState<Map<string, string>>(new Map());

  // Analyze concluded pages with LLM
  useEffect(() => {
    if (!currentPage || currentPage.status !== 'concluded' || !currentPage.content.trim()) {
      return;
    }

    // Check React-side cache first - if we already have analysis or are currently analyzing
    if (analysisResults.has(currentPage.id) || loadingAnalysis.has(currentPage.id)) {
      return;
    }

    // Start analysis
    const analyzeCurrentPage = async () => {
      try {
        console.log('Starting LLM analysis for page (React-side cache miss):', currentPage.id);
        
        // Mark as loading
        setLoadingAnalysis(prev => new Set(prev).add(currentPage.id));
        setAnalysisErrors(prev => {
          const newMap = new Map(prev);
          newMap.delete(currentPage.id);
          return newMap;
        });

        // Call LLM analysis (main process does the actual API call)
        const result = await window.electronAPI.analyzeOutput(currentPage.id, currentPage.content);
        
        console.log('LLM analysis result received and cached:', result);

        // Store result in React-side cache
        setAnalysisResults(prev => new Map(prev).set(currentPage.id, result));
        
      } catch (error) {
        console.error('Failed to analyze page:', error);
        setAnalysisErrors(prev => new Map(prev).set(
          currentPage.id, 
          error instanceof Error ? error.message : 'Analysis failed'
        ));
      } finally {
        // Remove from loading
        setLoadingAnalysis(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentPage.id);
          return newSet;
        });
      }
    };

    analyzeCurrentPage();
  }, [currentPage?.id, currentPage?.status, currentPage?.content]);

  // Get current analysis state
  const currentAnalysis = currentPage ? analysisResults.get(currentPage.id) : null;
  const isAnalyzing = currentPage ? loadingAnalysis.has(currentPage.id) : false;
  const analysisError = currentPage ? analysisErrors.get(currentPage.id) : null;

  return (
    <div className="h-full p-4 flex flex-col">
      <div className="h-full bg-gray-800 rounded-lg p-4 overflow-hidden flex flex-col">
        
        {/* Header with page info and navigation */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-blue-400 font-semibold">
              {hasPages ? `Visualization Page ${currentPageIndex + 1} of ${outputPages.length}` : 'No visualization data yet'}
            </div>
            {hasPages && currentPage && (
              <>
                <span className="text-xs text-gray-400">
                  {currentPage.timestamp.toLocaleTimeString()}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  currentPage.status === 'active' 
                    ? 'bg-yellow-900 text-yellow-300' 
                    : 'bg-green-900 text-green-300'
                }`}>
                  {currentPage.status}
                </span>
              </>
            )}
          </div>
          
          {hasPages && (
            <div className="flex items-center gap-2">
              {/* Quick navigation buttons */}
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Viz Previous button clicked');
                  if (currentPageIndex > 0) {
                    onGoToPreviousPage();
                  }
                }}
                className={`px-3 py-2 text-xs rounded cursor-pointer select-none user-select-none transition-colors flex items-center justify-center ${
                  currentPageIndex === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
                style={{ 
                  minHeight: '28px', 
                  minWidth: '50px',
                  pointerEvents: currentPageIndex === 0 ? 'none' : 'auto'
                }}
              >
                ← Prev
              </div>
              
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Viz Next button clicked');
                  if (currentPageIndex < outputPages.length - 1) {
                    onGoToNextPage();
                  }
                }}
                className={`px-3 py-2 text-xs rounded cursor-pointer select-none user-select-none transition-colors flex items-center justify-center ${
                  currentPageIndex === outputPages.length - 1
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
                style={{ 
                  minHeight: '28px', 
                  minWidth: '50px',
                  pointerEvents: currentPageIndex === outputPages.length - 1 ? 'none' : 'auto'
                }}
              >
                Next →
              </div>
              
              {!isOnLatestPage && (
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Viz Latest button clicked');
                    onGoToLatestPage();
                  }}
                  className="px-3 py-2 text-xs bg-purple-600 hover:bg-purple-700 cursor-pointer rounded text-white select-none user-select-none transition-colors flex items-center justify-center"
                  style={{ minHeight: '28px', minWidth: '60px' }}
                >
                  Latest 📊
                </div>
              )}
            </div>
          )}
        </div>

        {/* Page content */}
        {!hasPages ? (
          <div className="text-gray-400 italic flex-1 flex items-center justify-center flex-col">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Aux Visualization</h3>
              <p className="text-gray-400 mb-6">
                No visualization data yet. Run commands to generate analysis and charts.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-blue-400 text-2xl mb-2">📈</div>
                  <div className="text-sm">Performance</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-green-400 text-2xl mb-2">🔍</div>
                  <div className="text-sm">Analysis</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-purple-400 text-2xl mb-2">🧠</div>
                  <div className="text-sm">Insights</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="text-orange-400 text-2xl mb-2">⚡</div>
                  <div className="text-sm">Real-time</div>
                </div>
              </div>
            </div>
          </div>
        ) : currentPage ? (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Visualization content area */}
            <div className="flex-1 min-h-0 bg-gray-900 rounded p-4 overflow-auto">
              <div className="h-full flex flex-col">
                {/* Analysis Status */}
                {isAnalyzing && (
                  <div className="bg-yellow-900 border border-yellow-700 p-3 rounded mb-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                      <span className="text-yellow-300 text-sm">Analyzing command output with AI...</span>
                    </div>
                  </div>
                )}

                {analysisError && (
                  <div className="bg-red-900 border border-red-700 p-3 rounded mb-4">
                    <div className="text-red-300 text-sm">
                      <strong>Analysis Error:</strong> {analysisError}
                    </div>
                  </div>
                )}

                {/* Tables from LLM Analysis */}
                {currentAnalysis && currentAnalysis.tables && currentAnalysis.tables.length > 0 ? (
                  <div className="flex-1 space-y-6 overflow-auto">
                    {currentAnalysis.tables.map((table, index) => (
                      <DataTable key={index} table={table} />
                    ))}
                  </div>
                ) : currentAnalysis && !isAnalyzing ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-sm">No tabular data found in this output</p>
                      <p className="text-xs mt-1">Try commands that produce structured data like <code>ls -la</code>, <code>ps aux</code>, or <code>df -h</code></p>
                    </div>
                  </div>
                ) : !isAnalyzing && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">⏳</div>
                      <p className="text-sm">Waiting for concluded command output...</p>
                      <p className="text-xs mt-1">Only concluded pages are analyzed</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Custom Pagination controls */}
        {outputPages.length > 1 && (
          <div className="mt-4 flex justify-center flex-shrink-0">
            <div className="flex items-center gap-1 text-xs">
              {/* Previous button */}
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Viz Paginate previous clicked');
                  if (currentPageIndex > 0) {
                    onPageIndexChange(currentPageIndex - 1);
                  }
                }}
                className={`px-3 py-2 rounded cursor-pointer transition-colors flex items-center justify-center min-w-[32px] select-none user-select-none ${
                  currentPageIndex === 0
                    ? 'opacity-50 cursor-not-allowed bg-gray-600 text-gray-500'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
                style={{ pointerEvents: currentPageIndex === 0 ? 'none' : 'auto' }}
              >
                ‹
              </div>
              
              {/* Page numbers */}
              {outputPages.map((_, index) => (
                <div
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`Viz Paginate page ${index + 1} clicked`);
                    onPageIndexChange(index);
                  }}
                  className={`px-3 py-2 rounded cursor-pointer transition-colors flex items-center justify-center min-w-[32px] select-none user-select-none ${
                    index === currentPageIndex
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                >
                  {index + 1}
                </div>
              ))}
              
              {/* Next button */}
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Viz Paginate next clicked');
                  if (currentPageIndex < outputPages.length - 1) {
                    onPageIndexChange(currentPageIndex + 1);
                  }
                }}
                className={`px-3 py-2 rounded cursor-pointer transition-colors flex items-center justify-center min-w-[32px] select-none user-select-none ${
                  currentPageIndex === outputPages.length - 1
                    ? 'opacity-50 cursor-not-allowed bg-gray-600 text-gray-500'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
                style={{ pointerEvents: currentPageIndex === outputPages.length - 1 ? 'none' : 'auto' }}
              >
                ›
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuxVisualizationTab; 