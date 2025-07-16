import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

const DevTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stdout' | 'visualization'>('stdout');
  const [stdoutContent, setStdoutContent] = useState('Welcome to DevTools\n> Ready for commands...\n');
  const [topHeight, setTopHeight] = useState(300); // Initial height for terminal area
  const [isDragging, setIsDragging] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || terminal.current) return;

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
    });

    // Create and load addons
    fitAddon.current = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.loadAddon(webLinksAddon);

    // Open terminal in DOM
    terminal.current.open(terminalRef.current);

    // Welcome message
    terminal.current.writeln('Welcome to DevTools Terminal');
    terminal.current.writeln('Type commands and press Enter to execute...');
    terminal.current.write('$ ');

    // Handle command input
    let currentLine = '';
    terminal.current.onData((data) => {
      if (!terminal.current) return;

      if (data === '\r') { // Enter key
        terminal.current.writeln('');
        if (currentLine.trim()) {
          // Capture the command before resetting
          const commandToExecute = currentLine;
          
          // Echo command to stdout content
          setStdoutContent(prev => `${prev}> ${commandToExecute}\nCommand executed: ${commandToExecute}\n`);
          
          // Here you would typically execute the actual command
          terminal.current.writeln(`Executed: ${commandToExecute}`);
        }
        currentLine = '';
        terminal.current.write('$ ');
      } else if (data === '\x7f') { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          terminal.current.write('\b \b');
        }
      } else if (data >= ' ') { // Printable characters
        currentLine += data;
        terminal.current.write(data);
      }
    });

    // Cleanup function
    return () => {
      if (terminal.current) {
        terminal.current.dispose();
        terminal.current = null;
      }
    };
  }, []);

  // Fit terminal when container size changes
  useEffect(() => {
    if (fitAddon.current && terminal.current) {
      setTimeout(() => fitAddon.current?.fit(), 100);
    }
  }, [topHeight, containerHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const splitterHeight = 8; // height of splitter (h-2 = 8px)
    const minTopHeight = 150;
    const minBottomHeight = 200;
    const maxTopHeight = containerRect.height - minBottomHeight - splitterHeight;
    
    const newHeight = e.clientY - containerRect.top;
    const constrainedHeight = Math.max(minTopHeight, Math.min(maxTopHeight, newHeight));
    
    setTopHeight(constrainedHeight);
    setContainerHeight(containerRect.height);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Set initial container height and handle resize
  React.useLayoutEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height);
      }
    };
    
    updateContainerHeight();
    window.addEventListener('resize', updateContainerHeight);
    
    return () => {
      window.removeEventListener('resize', updateContainerHeight);
    };
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Calculate bottom height based on container and top heights
  const splitterHeight = 8;
  const bottomHeight = containerHeight > 0 ? containerHeight - topHeight - splitterHeight : 'calc(100% - 308px)';

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col bg-gray-900 text-white" style={{ height: '100%' }}>
      {/* Terminal Area */}
      <div 
        className="bg-gray-800 border-b border-gray-700 flex flex-col flex-shrink-0"
        style={{ height: `${topHeight}px` }}
      >
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <h3 className="text-lg font-semibold mb-4 text-gray-200 flex-shrink-0">Terminal</h3>
          
          {/* Terminal Container */}
          <div className="flex-1 min-h-0">
            <div 
              ref={terminalRef}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Draggable Splitter */}
      <div
        className={`h-2 bg-gray-700 cursor-row-resize hover:bg-gray-600 transition-colors flex-shrink-0 ${
          isDragging ? 'bg-blue-500' : ''
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
              onClick={() => setActiveTab('stdout')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'stdout'
                  ? 'bg-gray-900 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              Stdout Dump
            </button>
            <button
              onClick={() => setActiveTab('visualization')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'visualization'
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
          {activeTab === 'stdout' && (
            <div className="h-full p-4">
              <div className="h-full bg-black rounded-lg p-4 overflow-auto font-mono text-sm">
                <div className="text-green-400 mb-2">Standard Output:</div>
                <pre className="whitespace-pre-wrap text-gray-300">
                  {stdoutContent}
                </pre>
              </div>
            </div>
          )}
          
          {activeTab === 'visualization' && (
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