import React from 'react';

interface OutputPage {
  id: string;
  timestamp: Date;
  content: string;
  status: 'active' | 'concluded';
}

interface StdoutDumpTabProps {
  outputPages: OutputPage[];
  currentPageIndex: number;
  currentPageBuffer: string;
  onPageIndexChange: (index: number) => void;
  onGoToPreviousPage: () => void;
  onGoToNextPage: () => void;
  onGoToLatestPage: () => void;
}

const StdoutDumpTab: React.FC<StdoutDumpTabProps> = ({
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

  return (
    <div className="h-full p-4 flex flex-col">
      <div className="h-full bg-black rounded-lg p-4 overflow-hidden font-mono text-sm flex flex-col">
        
        {/* Header with page info and navigation */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="text-green-400">
            {hasPages ? `Page ${currentPageIndex + 1} of ${outputPages.length}` : 'No pages yet'}
          </div>
          
          {hasPages && (
            <div className="flex items-center gap-2">
              {/* Quick navigation buttons */}
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Previous button clicked');
                  if (currentPageIndex > 0) {
                    onGoToPreviousPage();
                  }
                }}
                className={`px-3 py-2 text-xs rounded cursor-pointer select-none user-select-none transition-colors flex items-center justify-center ${
                  currentPageIndex === 0
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
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
                  console.log('Next button clicked');
                  if (currentPageIndex < outputPages.length - 1) {
                    onGoToNextPage();
                  }
                }}
                className={`px-3 py-2 text-xs rounded cursor-pointer select-none user-select-none transition-colors flex items-center justify-center ${
                  currentPageIndex === outputPages.length - 1
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
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
                    console.log('Latest button clicked');
                    onGoToLatestPage();
                  }}
                  className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 cursor-pointer rounded text-white select-none user-select-none transition-colors flex items-center justify-center"
                  style={{ minHeight: '28px', minWidth: '60px' }}
                >
                  Latest ⚡
                </div>
              )}
            </div>
          )}
        </div>

        {/* Page content */}
        {!hasPages ? (
          <div className="text-gray-500 italic flex-1 flex items-center justify-center">
            No output yet. Run a command to see pages...
          </div>
        ) : currentPage ? (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Page metadata */}
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <span className="text-blue-400 font-semibold">Page {currentPageIndex + 1}</span>
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
            </div>
            
            {/* Page output */}
            <div className="flex-1 min-h-0 bg-gray-900 rounded p-3 overflow-auto">
              <pre className="whitespace-pre-wrap text-gray-300 text-xs">
                {/* Show current page content */}
                {currentPage.content || '(no output)'}
                
                {/* Show live buffer if this is the latest page and it's active */}
                {isOnLatestPage && currentPageBuffer && currentPage.status === 'active' && (
                  <span className="text-yellow-300">
                    {currentPageBuffer.slice(currentPage.content.length)}
                  </span>
                )}
              </pre>
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
                  console.log('Paginate previous clicked');
                  if (currentPageIndex > 0) {
                    onPageIndexChange(currentPageIndex - 1);
                  }
                }}
                className={`px-3 py-2 rounded cursor-pointer transition-colors flex items-center justify-center min-w-[32px] select-none user-select-none ${
                  currentPageIndex === 0
                    ? 'opacity-50 cursor-not-allowed bg-gray-700 text-gray-500'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
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
                    console.log(`Paginate page ${index + 1} clicked`);
                    onPageIndexChange(index);
                  }}
                  className={`px-3 py-2 rounded cursor-pointer transition-colors flex items-center justify-center min-w-[32px] select-none user-select-none ${
                    index === currentPageIndex
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
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
                  console.log('Paginate next clicked');
                  if (currentPageIndex < outputPages.length - 1) {
                    onPageIndexChange(currentPageIndex + 1);
                  }
                }}
                className={`px-3 py-2 rounded cursor-pointer transition-colors flex items-center justify-center min-w-[32px] select-none user-select-none ${
                  currentPageIndex === outputPages.length - 1
                    ? 'opacity-50 cursor-not-allowed bg-gray-700 text-gray-500'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
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

export default StdoutDumpTab; 