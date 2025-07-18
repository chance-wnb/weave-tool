import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useList, useSetState } from 'react-use';
import { useFullscreen } from '../contexts/FullscreenContext';
import StdoutDumpTab from '../components/StdoutDumpTab';
import AuxVisualizationTab from '../components/AuxVisualizationTab';
import '@xterm/xterm/css/xterm.css';

interface OutputPage {
  id: string;
  timestamp: Date;
  content: string;
  status: 'active' | 'concluded';
}

const DevTools: React.FC = () => {
  const { isFullscreen } = useFullscreen();
  
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
  const currentPageContentRef = useRef<string>(''); // Track content in ref to avoid race conditions
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
      pageActions.set(updated);
    }
  }, [outputPages, pageActions]);

  // Handle new output with page-based capture - using refs to avoid race conditions
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
      currentPageContentRef.current = data; // Initialize content ref
      
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
      // Add to current page using ref to avoid race conditions
      currentPageContentRef.current += data;
      setCurrentPageBuffer(currentPageContentRef.current);
      
      // Update state less frequently to avoid race conditions
      // Only update every few chunks or on significant boundaries
      const shouldUpdateState = data.includes('\n') || data.includes('│') || data.length > 500;
      
      if (shouldUpdateState) {
        const updated = outputPages.map(page => 
          page.id === currentPageIdRef.current 
            ? { ...page, content: currentPageContentRef.current }
            : page
        );
        pageActions.set(updated);
      }
    }

    // Only reset timeout for significant output
    if (isSignificant) {
      // Clear existing timeout
      if (pageTimeoutRef.current) {
        clearTimeout(pageTimeoutRef.current);
      }

      // Set timeout to conclude page after 5 seconds of inactivity
      pageTimeoutRef.current = setTimeout(() => {
        
        // Final update with complete content before concluding
        if (currentPageIdRef.current && currentPageContentRef.current) {
          const finalUpdate = outputPages.map(page => 
            page.id === currentPageIdRef.current 
              ? { ...page, content: currentPageContentRef.current, status: 'concluded' as const }
              : page.status === 'active' 
                ? { ...page, status: 'concluded' as const }
                : page
          );
          pageActions.set(finalUpdate);
        } else {
          // No current page, just conclude existing active pages
          const updated = outputPages.map(page => 
            page.status === 'active' 
              ? { ...page, status: 'concluded' as const }
              : page
          );
          pageActions.set(updated);
        }
        
        // Reset for next page
        currentPageIdRef.current = null;
        currentPageContentRef.current = '';
        setCurrentPageBuffer('');
      }, 5000); // 5 seconds
    }
  }, [concludePreviousPages, pageActions, outputPages, setUiState]);

  // Keep ref updated with latest function
  handleNewOutputRef.current = handleNewOutput;

  // Manual conclude page handler
  const handleConcludeActivePage = useCallback(() => {
    if (currentPageIdRef.current && currentPageContentRef.current) {
      // Clear any existing timeout
      if (pageTimeoutRef.current) {
        clearTimeout(pageTimeoutRef.current);
        pageTimeoutRef.current = null;
      }

      // Conclude the current active page immediately
      const finalUpdate = outputPages.map(page => 
        page.id === currentPageIdRef.current 
          ? { ...page, content: currentPageContentRef.current, status: 'concluded' as const }
          : page.status === 'active' 
            ? { ...page, status: 'concluded' as const }
            : page
      );
      pageActions.set(finalUpdate);
      
      // Reset for next page
      currentPageIdRef.current = null;
      currentPageContentRef.current = '';
      setCurrentPageBuffer('');
    }
  }, [outputPages, pageActions]);

  // Listen for manual conclude page events
  useEffect(() => {
    const handleCustomEvent = () => {
      handleConcludeActivePage();
    };

    window.addEventListener('concludeActivePage', handleCustomEvent);
    
    return () => {
      window.removeEventListener('concludeActivePage', handleCustomEvent);
    };
  }, [handleConcludeActivePage]);

  // Navigation handlers
  const handlePageIndexChange = useCallback((index: number) => {
    setUiState({ currentPageIndex: index });
  }, [setUiState]);

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

  // Derived values moved to StdoutDumpTab component

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || terminal.current) return;

    console.log('Initializing terminal...');
    console.log('electronAPI available:', !!window.electronAPI);
    console.log('terminalRef.current:', terminalRef.current);

    // Create terminal instance with wider dimensions for complex tables
    terminal.current = new Terminal({
      cursorBlink: true,
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
      },
      fontSize: 12,  // Smaller font to fit more content
      fontFamily: '"Courier New", monospace',
      allowTransparency: false,
      cols: 140,  // Match PTY width
      rows: 50,   // Match PTY height
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
      {/* Terminal Area - hidden in fullscreen mode */}
      <div 
        className="bg-gray-800 border-b border-gray-700 flex flex-col flex-shrink-0"
        style={{ 
          height: `${uiState.topHeight}px`,
          display: isFullscreen ? 'none' : 'flex'
        }}
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

      {/* Draggable Splitter - hidden in fullscreen mode */}
      <div
        className={`h-2 bg-gray-700 cursor-row-resize hover:bg-gray-600 transition-colors flex-shrink-0 ${
          uiState.isDragging ? 'bg-blue-500' : ''
        }`}
        style={{ display: isFullscreen ? 'none' : 'block' }}
        onMouseDown={handleMouseDown}
      >
        <div className="h-full flex items-center justify-center">
          <div className="w-8 h-0.5 bg-gray-500 rounded"></div>
        </div>
      </div>

      {/* Bottom Area with Tabs */}
      <div className={`flex flex-col overflow-hidden min-h-0 transition-all duration-300 ${
        isFullscreen ? 'h-full' : ''
      }`} style={isFullscreen ? { height: '100%' } : { height: typeof bottomHeight === 'number' ? `${bottomHeight}px` : bottomHeight }}>
        {/* Tab Navigation - hidden in fullscreen mode */}
        <div 
          className="bg-gray-800 border-b border-gray-700 flex-shrink-0"
          style={{ display: isFullscreen ? 'none' : 'block' }}
        >
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
          {/* Stdout Tab - always mounted, visibility controlled by display */}
          <div style={{ 
            display: (isFullscreen || uiState.activeTab !== 'stdout') ? 'none' : 'block',
            height: '100%'
          }}>
            <StdoutDumpTab
              outputPages={outputPages}
              currentPageIndex={uiState.currentPageIndex}
              currentPageBuffer={currentPageBuffer}
              onPageIndexChange={handlePageIndexChange}
              onGoToPreviousPage={goToPreviousPage}
              onGoToNextPage={goToNextPage}
              onGoToLatestPage={goToLatestPage}
            />
          </div>
          
          {/* Visualization Tab - always mounted, visibility controlled by display */}
          <div style={{ 
            display: (!isFullscreen && uiState.activeTab !== 'visualization') ? 'none' : 'block',
            height: '100%'
          }}>
            <AuxVisualizationTab
              outputPages={outputPages}
              currentPageIndex={uiState.currentPageIndex}
              currentPageBuffer={currentPageBuffer}
              onPageIndexChange={handlePageIndexChange}
              onGoToPreviousPage={goToPreviousPage}
              onGoToNextPage={goToNextPage}
              onGoToLatestPage={goToLatestPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevTools; 