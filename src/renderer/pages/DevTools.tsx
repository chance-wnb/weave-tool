import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useList, useSetState } from 'react-use';
import '@xterm/xterm/css/xterm.css';

interface OutputPage {
  id: string;
  timestamp: Date;
  content: string;
  status: 'active' | 'concluded';
}

const DevTools: React.FC = () => {
  // UI state management with useSetState
  const [uiState, setUiState] = useSetState({
    activeTab: 'stdout' as 'stdout' | 'visualization',
    topHeight: 300,
    isDragging: false,
    containerHeight: 0,
    currentPageIndex: 0, // For pagination
  });

  // Page management with useList for better array operations
  const [outputPages, pageActions] = useList<OutputPage>([]);
  
  // Simple state for current page buffer
  const [currentPageBuffer, setCurrentPageBuffer] = useState('');

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const pageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentPageIdRef = useRef<string | null>(null);
  const handleNewOutputRef = useRef<((data: string) => void) | null>(null);

  // Manual function to conclude all active pages except current
  const concludePreviousPages = useCallback(() => {
    const updated = outputPages.map(page => 
      page.status === 'active' && page.id !== currentPageIdRef.current
        ? { ...page, status: 'concluded' as const }
        : page
    );
    const changedCount = updated.filter((page, idx) => page.status !== outputPages[idx]?.status).length;
    if (changedCount > 0) {
      console.log('📄 Concluded', changedCount, 'previous pages');
      pageActions.set(updated);
    }
  }, [outputPages, pageActions]);

  // Handle new output with page-based capture
  const handleNewOutput = useCallback((data: string) => {
    // Filter out data that shouldn't reset the timer (cursor movements, etc.)
    const isSignificantOutput = (str: string) => {
      // Ignore pure ANSI escape sequences and cursor movements
      const ansiEscapeRegex = /^\x1b\[[0-9;]*[A-Za-z]$/;
      const onlyControlChars = /^[\x00-\x1f\x7f]*$/;
      
      // If it's just ANSI escapes or control characters, don't count it
      if (ansiEscapeRegex.test(str) || onlyControlChars.test(str)) {
        return false;
      }
      
      // If it contains printable characters, count it
      return /[\x20-\x7e]/.test(str) || str.includes('\n') || str.includes('\r');
    };

    const isSignificant = isSignificantOutput(data);

    // Always add to current page for display
    if (!currentPageIdRef.current) {
      // First, conclude any existing active pages
      concludePreviousPages();

      const pageId = Date.now().toString();
      currentPageIdRef.current = pageId;
      console.log('📄 Created new page:', pageId);
      
      const newPage: OutputPage = {
        id: pageId,
        timestamp: new Date(),
        content: data,
        status: 'active'
      };
      
      pageActions.push(newPage);
      setCurrentPageBuffer(data);
      
      // Auto-switch to the latest page
      setUiState({ currentPageIndex: outputPages.length }); // New page will be at length index
    } else {
      // Add to current page
      setCurrentPageBuffer(prev => prev + data);
      const updated = outputPages.map(page => 
        page.id === currentPageIdRef.current 
          ? { ...page, content: page.content + data }
          : page
      );
      pageActions.set(updated);
    }

    // Only reset timeout for significant output
    if (isSignificant) {
      console.log('📄 Resetting timeout due to significant output');
      // Clear existing timeout
      if (pageTimeoutRef.current) {
        clearTimeout(pageTimeoutRef.current);
      }

              // Set timeout to conclude page after 5 seconds of inactivity
        pageTimeoutRef.current = setTimeout(() => {
          console.log('📄 Timeout fired - concluding all active pages');
          
          // Mark ALL active pages as concluded (not just current)
          const updated = outputPages.map(page => 
            page.status === 'active' 
              ? { ...page, status: 'concluded' as const }
              : page
          );
          const concludedCount = updated.filter((page, idx) => 
            page.status === 'concluded' && outputPages[idx]?.status === 'active'
          ).length;
          console.log('📄 Concluded', concludedCount, 'active pages');
          pageActions.set(updated);
          
          // Reset for next page
          currentPageIdRef.current = null;
          setCurrentPageBuffer('');
        }, 5000); // 5 seconds
    }
  }, [outputPages, pageActions]);

  // Keep ref updated with latest function
  handleNewOutputRef.current = handleNewOutput;

  // Navigation handlers
  const goToLatestPage = useCallback(() => {
    if (outputPages.length > 0) {
      setUiState({ currentPageIndex: outputPages.length - 1 });
    }
  }, [outputPages.length, setUiState]);

  const goToPreviousPage = useCallback(() => {
    setUiState({ currentPageIndex: Math.max(0, uiState.currentPageIndex - 1) });
  }, [uiState.currentPageIndex, setUiState]);

  const goToNextPage = useCallback(() => {
    setUiState({ currentPageIndex: Math.min(outputPages.length - 1, uiState.currentPageIndex + 1) });
  }, [outputPages.length, uiState.currentPageIndex, setUiState]);

  // Get current page to display
  const currentPage = outputPages[uiState.currentPageIndex];
  const hasPages = outputPages.length > 0;
  const isOnLatestPage = uiState.currentPageIndex === outputPages.length - 1;

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || terminal.current) return;

    console.log('Initializing terminal...');
    console.log('electronAPI available:', !!window.electronAPI);
    console.log('terminalRef.current:', terminalRef.current);

    // Create terminal instance
    terminal.current = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
      },
      fontSize: 14,
      fontFamily: '"Courier New", monospace',
      allowTransparency: false,
    });

    console.log('Terminal instance created:', !!terminal.current);

    // Create and load addons
    fitAddon.current = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.loadAddon(webLinksAddon);

    // Open terminal in DOM
    console.log('Opening terminal in DOM...');
    terminal.current.open(terminalRef.current);
    console.log('Terminal opened successfully');

    // Focus the terminal so it can receive input
    console.log('Focusing terminal...');
    terminal.current.focus();
    
    // Fit terminal to container size
    if (fitAddon.current) {
      console.log('Fitting terminal to container...');
      fitAddon.current.fit();
    }

    // Write initial test to verify terminal is working
    terminal.current.write('Terminal ready - type something!\r\n$ ');

    // Handle user input - send to PTY
    console.log('Setting up onData handler...');
    terminal.current.onData((data) => {
      if (window.electronAPI) {
        window.electronAPI.writeToTerminal(data);
      } else {
        console.warn('electronAPI not available in onData handler');
      }
    });
    console.log('onData handler set up successfully');

    // Start the PTY terminal
    if (window.electronAPI) {
      console.log('Starting PTY terminal...');
      window.electronAPI.startTerminal();
      
      // Listen for terminal output from PTY
      const removeDataListener = window.electronAPI.onTerminalData((data) => {
        if (terminal.current) {
          terminal.current.write(data);
        }
        
        // Capture stdout in pages with timeout-based separation
        handleNewOutputRef.current?.(data);
      });

      // Listen for terminal exit
      const removeExitListener = window.electronAPI.onTerminalExit((exitCode) => {
        console.log('Terminal exited with code:', exitCode);
        if (terminal.current) {
          terminal.current.writeln(`\n\nTerminal exited with code: ${exitCode}`);
        }
      });

      // Cleanup function
      return () => {
        removeDataListener();
        removeExitListener();
        if (terminal.current) {
          terminal.current.dispose();
          terminal.current = null;
        }
        if (window.electronAPI) {
          window.electronAPI.killTerminal();
        }
        // Clean up page timeout
        if (pageTimeoutRef.current) {
          clearTimeout(pageTimeoutRef.current);
        }
      };
    }
  }, []);

  // Fit terminal when container size changes
  useEffect(() => {
    if (fitAddon.current && terminal.current) {
      setTimeout(() => {
        fitAddon.current?.fit();
        terminal.current?.focus(); // Re-focus after resize
      }, 100);
    }
  }, [uiState.topHeight, uiState.containerHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setUiState({ isDragging: true });
    e.preventDefault();
  }, [setUiState]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!uiState.isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const splitterHeight = 8; // height of splitter (h-2 = 8px)
    const minTopHeight = 150;
    const minBottomHeight = 200;
    const maxTopHeight = containerRect.height - minBottomHeight - splitterHeight;
    
    const newHeight = e.clientY - containerRect.top;
    const constrainedHeight = Math.max(minTopHeight, Math.min(maxTopHeight, newHeight));
    
    setUiState({ 
      topHeight: constrainedHeight,
      containerHeight: containerRect.height 
    });
  }, [uiState.isDragging, setUiState]);

  const handleMouseUp = useCallback(() => {
    setUiState({ isDragging: false });
  }, [setUiState]);

  // Set initial container height and handle resize
  React.useLayoutEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setUiState({ containerHeight: rect.height });
      }
    };
    
    updateContainerHeight();
    window.addEventListener('resize', updateContainerHeight);
    
    return () => {
      window.removeEventListener('resize', updateContainerHeight);
    };
  }, [setUiState]);

  React.useEffect(() => {
    if (uiState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      if (uiState.isDragging) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [uiState.isDragging, handleMouseMove, handleMouseUp]);

  // Calculate bottom height based on container and top heights
  const splitterHeight = 8;
  const bottomHeight = uiState.containerHeight > 0 ? uiState.containerHeight - uiState.topHeight - splitterHeight : 'calc(100% - 308px)';

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-gray-900 text-white" style={{ height: '100%' }}>
      {/* Terminal Area */}
      <div 
        className="bg-gray-800 border-b border-gray-700 flex flex-col flex-shrink-0"
        style={{ height: `${uiState.topHeight}px` }}
      >
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <h3 className="text-lg font-semibold mb-4 text-gray-200 flex-shrink-0">Terminal</h3>
          
          {/* Terminal Container */}
          <div className="flex-1 min-h-0">
            <div 
              ref={terminalRef}
              className="w-full h-full"
              onClick={() => {
                // Focus terminal when clicked
                if (terminal.current) {
                  terminal.current.focus();
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Draggable Splitter */}
      <div
        className={`h-2 bg-gray-700 cursor-row-resize hover:bg-gray-600 transition-colors flex-shrink-0 ${
          uiState.isDragging ? 'bg-blue-500' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="h-full flex items-center justify-center">
          <div className="w-8 h-0.5 bg-gray-500 rounded"></div>
        </div>
      </div>

      {/* Bottom Area with Tabs */}
      <div className="flex flex-col overflow-hidden min-h-0" style={{ height: typeof bottomHeight === 'number' ? `${bottomHeight}px` : bottomHeight }}>
        {/* Tab Navigation */}
        <div className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
          <div className="flex">
            <button
              onClick={() => setUiState({ activeTab: 'stdout' })}
              className={`px-6 py-3 font-medium transition-colors ${
                uiState.activeTab === 'stdout'
                  ? 'bg-gray-900 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Stdout Dump
            </button>
            <button
              onClick={() => setUiState({ activeTab: 'visualization' })}
              className={`px-6 py-3 font-medium transition-colors ${
                uiState.activeTab === 'visualization'
                  ? 'bg-gray-900 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Aux Visualization
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          {uiState.activeTab === 'stdout' && (
            <div className="h-full p-4 flex flex-col">
              <div className="h-full bg-black rounded-lg p-4 overflow-hidden font-mono text-sm flex flex-col">
                
                {/* Header with page info and navigation */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div className="text-green-400">
                    {hasPages ? `Page ${uiState.currentPageIndex + 1} of ${outputPages.length}` : 'No pages yet'}
                  </div>
                  
                  {hasPages && (
                    <div className="flex items-center gap-2">
                      {/* Quick navigation buttons */}
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Previous button clicked');
                          if (uiState.currentPageIndex > 0) {
                            goToPreviousPage();
                          }
                        }}
                        className={`px-3 py-2 text-xs rounded cursor-pointer select-none user-select-none transition-colors flex items-center justify-center ${
                          uiState.currentPageIndex === 0
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                        style={{ 
                          minHeight: '28px', 
                          minWidth: '50px',
                          pointerEvents: uiState.currentPageIndex === 0 ? 'none' : 'auto'
                        }}
                      >
                        ← Prev
                      </div>
                      
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Next button clicked');
                          if (uiState.currentPageIndex < outputPages.length - 1) {
                            goToNextPage();
                          }
                        }}
                        className={`px-3 py-2 text-xs rounded cursor-pointer select-none user-select-none transition-colors flex items-center justify-center ${
                          uiState.currentPageIndex === outputPages.length - 1
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                        style={{ 
                          minHeight: '28px', 
                          minWidth: '50px',
                          pointerEvents: uiState.currentPageIndex === outputPages.length - 1 ? 'none' : 'auto'
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
                            goToLatestPage();
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
                      <span className="text-blue-400 font-semibold">Page {uiState.currentPageIndex + 1}</span>
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
                          if (uiState.currentPageIndex > 0) {
                            setUiState({ currentPageIndex: uiState.currentPageIndex - 1 });
                          }
                        }}
                        className={`px-3 py-2 rounded cursor-pointer transition-colors flex items-center justify-center min-w-[32px] select-none user-select-none ${
                          uiState.currentPageIndex === 0
                            ? 'opacity-50 cursor-not-allowed bg-gray-700 text-gray-500'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                        style={{ pointerEvents: uiState.currentPageIndex === 0 ? 'none' : 'auto' }}
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
                            setUiState({ currentPageIndex: index });
                          }}
                          className={`px-3 py-2 rounded cursor-pointer transition-colors flex items-center justify-center min-w-[32px] select-none user-select-none ${
                            index === uiState.currentPageIndex
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
                          if (uiState.currentPageIndex < outputPages.length - 1) {
                            setUiState({ currentPageIndex: uiState.currentPageIndex + 1 });
                          }
                        }}
                        className={`px-3 py-2 rounded cursor-pointer transition-colors flex items-center justify-center min-w-[32px] select-none user-select-none ${
                          uiState.currentPageIndex === outputPages.length - 1
                            ? 'opacity-50 cursor-not-allowed bg-gray-700 text-gray-500'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                        style={{ pointerEvents: uiState.currentPageIndex === outputPages.length - 1 ? 'none' : 'auto' }}
                      >
                        ›
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {uiState.activeTab === 'visualization' && (
            <div className="h-full p-4">
              <div className="h-full bg-gray-800 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold mb-2">Aux Visualization</h3>
                  <p className="text-gray-400">
                    Visualization tools and charts will be displayed here
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-4 max-w-md">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevTools; 