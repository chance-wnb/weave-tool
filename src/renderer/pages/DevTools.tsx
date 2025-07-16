import React, { useState, useRef, useCallback } from 'react';

const DevTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stdout' | 'visualization'>('stdout');
  const [command, setCommand] = useState('');
  const [stdoutContent, setStdoutContent] = useState('Welcome to DevTools\n> Ready for commands...\n');
  const [topHeight, setTopHeight] = useState(300); // Initial height for command input area
  const [isDragging, setIsDragging] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCommand = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      setStdoutContent(prev => `${prev}> ${command}\n`);
      // Here you would typically execute the command and capture output
      setStdoutContent(prev => `${prev}Command executed: ${command}\n`);
      setCommand('');
    }
  }, [command]);

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
      {/* Command Input Area */}
      <div 
        className="bg-gray-800 border-b border-gray-700 flex flex-col flex-shrink-0"
        style={{ height: `${topHeight}px` }}
      >
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <h3 className="text-lg font-semibold mb-4 text-gray-200 flex-shrink-0">Command Line Interface</h3>
          
          {/* Command History/Output Preview */}
          <div className="flex-1 bg-black rounded-lg p-3 mb-4 overflow-auto font-mono text-sm min-h-0">
            <div className="text-green-400">
              Last executed commands:
            </div>
            <div className="text-gray-300 mt-2">
              {stdoutContent.split('\n').slice(-5).map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>

          {/* Command Input */}
          <form onSubmit={handleCommand} className="flex gap-2 flex-shrink-0">
            <div className="flex-1 flex items-center bg-black rounded-lg px-3 py-2">
              <span className="text-green-400 mr-2">$</span>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command..."
                className="flex-1 bg-transparent text-white outline-none font-mono"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Execute
            </button>
          </form>
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