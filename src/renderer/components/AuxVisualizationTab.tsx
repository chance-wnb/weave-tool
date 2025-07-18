import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnResizeMode,
} from '@tanstack/react-table';

// Static cache stored at module level - persists across component unmounts
const staticAnalysisCache = new Map<string, AnalysisResult>();
const staticLoadingSet = new Set<string>();
const staticErrorCache = new Map<string, string>();

// Static cache management functions
const CacheManager = {
  getAnalysis: (pageId: string) => staticAnalysisCache.get(pageId),
  setAnalysis: (pageId: string, result: AnalysisResult) => staticAnalysisCache.set(pageId, result),
  hasAnalysis: (pageId: string) => staticAnalysisCache.has(pageId),
  
  isLoading: (pageId: string) => staticLoadingSet.has(pageId),
  setLoading: (pageId: string) => staticLoadingSet.add(pageId),
  removeLoading: (pageId: string) => staticLoadingSet.delete(pageId),
  
  getError: (pageId: string) => staticErrorCache.get(pageId),
  setError: (pageId: string, error: string) => staticErrorCache.set(pageId, error),
  clearError: (pageId: string) => staticErrorCache.delete(pageId),
  
  // Optional: Clear all caches (for debugging/reset)
  clearAll: () => {
    staticAnalysisCache.clear();
    staticLoadingSet.clear();
    staticErrorCache.clear();
    console.log('🧹 Static analysis cache cleared');
  },
  
  // Optional: Get cache stats
  getStats: () => ({
    analysisCount: staticAnalysisCache.size,
    loadingCount: staticLoadingSet.size,
    errorCount: staticErrorCache.size
  })
};

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

// Tooltip component for truncated text
interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {children}
      {isVisible && (
        <div
          className="fixed z-50 px-2 py-1 text-xs bg-gray-900 text-white border border-gray-600 rounded shadow-lg pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translateX(-50%) translateY(-100%)',
            maxWidth: '300px',
            wordWrap: 'break-word'
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

// Cell component with truncation and tooltip
interface TruncatedCellProps {
  value: string;
  maxWidth?: number;
}

const TruncatedCell: React.FC<TruncatedCellProps> = ({ value, maxWidth = 150 }) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (textRef.current) {
      setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, [value]);

  const cellContent = (
    <div
      ref={textRef}
      className="truncate"
      style={{ maxWidth: `${maxWidth}px` }}
    >
      {value}
    </div>
  );

  return isTruncated ? (
    <Tooltip content={value}>
      {cellContent}
    </Tooltip>
  ) : (
    cellContent
  );
};

// DataTable component for rendering individual tables
interface DataTableProps {
  table: TableData;
}

const DataTable: React.FC<DataTableProps> = ({ table }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnResizeMode, setColumnResizeMode] = useState<ColumnResizeMode>('onChange');

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

  // Create columns with truncated cells
  const columns = useMemo(() => {
    return table.headers.map(header => ({
      accessorKey: header,
      header: header,
      size: 150, // Default column width
      minSize: 50, // Minimum column width
      maxSize: 500, // Maximum column width
      cell: (info: any) => (
        <TruncatedCell 
          value={String(info.getValue() || '')} 
          maxWidth={info.column.getSize() - 24} // Account for padding
        />
      ),
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
    columnResizeMode,
    enableColumnResizing: true,
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
        <table 
          className="text-xs border-collapse"
          style={{ width: reactTable.getCenterTotalSize() }}
        >
          <thead>
            {reactTable.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-gray-600">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="text-left py-2 px-3 text-purple-400 font-semibold bg-gray-700 relative border-r border-gray-600 last:border-r-0"
                    style={{ 
                      width: header.getSize(),
                      position: 'relative'
                    }}
                  >
                    <div 
                      className="flex items-center gap-1 cursor-pointer hover:bg-gray-600 transition-colors p-1 -m-1 rounded"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="truncate">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      <span className="text-xs opacity-60">
                        {{
                          asc: '🔼',
                          desc: '🔽',
                        }[header.column.getIsSorted() as string] ?? '↕️'}
                      </span>
                    </div>
                    
                    {/* Resize Handle */}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className="absolute right-0 top-0 h-full w-1 bg-gray-500 opacity-0 hover:opacity-100 cursor-col-resize transition-opacity"
                        style={{
                          transform: header.column.getIsResizing() ? 'scaleX(2)' : 'scaleX(1)',
                          backgroundColor: header.column.getIsResizing() ? '#3b82f6' : '#6b7280'
                        }}
                      />
                    )}
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
                  <td 
                    key={cell.id} 
                    className="py-2 px-3 text-gray-300 border-r border-gray-700 last:border-r-0"
                    style={{ width: cell.column.getSize() }}
                  >
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

  // Force re-render when static cache changes (since static cache doesn't trigger React updates)
  const [cacheVersion, setCacheVersion] = useState(0);
  const forceUpdate = () => setCacheVersion(prev => prev + 1);

  // Log cache stats on mount to demonstrate persistence across tab switches
  useEffect(() => {
    const stats = CacheManager.getStats();
    console.log('📊 AuxVisualizationTab mounted - Static cache stats:', stats);
  }, []);

  // Analyze concluded pages with LLM using static cache
  useEffect(() => {
    if (!currentPage || currentPage.status !== 'concluded' || !currentPage.content.trim()) {
      return;
    }

    // Check static cache - if we already have analysis or are currently analyzing
    if (CacheManager.hasAnalysis(currentPage.id) || CacheManager.isLoading(currentPage.id)) {
      return;
    }

    // Start analysis
    const analyzeCurrentPage = async () => {
      try {
        console.log('Starting LLM analysis for page (static cache miss):', currentPage.id);
        
        // Mark as loading in static cache
        CacheManager.setLoading(currentPage.id);
        CacheManager.clearError(currentPage.id);
        forceUpdate(); // Trigger re-render

        // Call LLM analysis (main process does the actual API call)
        const result = await window.electronAPI.analyzeOutput(currentPage.id, currentPage.content);
        
        console.log('LLM analysis result received and cached in static storage:', result);

        // Store result in static cache
        CacheManager.setAnalysis(currentPage.id, result);
        
      } catch (error) {
        console.error('Failed to analyze page:', error);
        CacheManager.setError(
          currentPage.id, 
          error instanceof Error ? error.message : 'Analysis failed'
        );
      } finally {
        // Remove from loading in static cache
        CacheManager.removeLoading(currentPage.id);
        forceUpdate(); // Trigger re-render
      }
    };

    analyzeCurrentPage();
  }, [currentPage?.id, currentPage?.status, currentPage?.content, cacheVersion]);

  // Get current analysis state from static cache
  const currentAnalysis = currentPage ? CacheManager.getAnalysis(currentPage.id) : null;
  const isAnalyzing = currentPage ? CacheManager.isLoading(currentPage.id) : false;
  const analysisError = currentPage ? CacheManager.getError(currentPage.id) : null;

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
                    {currentAnalysis.tables.map((table: TableData, index: number) => (
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