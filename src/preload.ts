import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Terminal PTY communication
  startTerminal: () => ipcRenderer.invoke('terminal:start'),
  writeToTerminal: (data: string) => ipcRenderer.invoke('terminal:write', data),
  onTerminalData: (callback: (data: string) => void) => {
    const wrapper = (_: any, data: string) => callback(data);
    ipcRenderer.on('terminal:data', wrapper);
    
    // Return cleanup function
    return () => ipcRenderer.removeListener('terminal:data', wrapper);
  },
  onTerminalExit: (callback: (exitCode: number) => void) => {
    const wrapper = (_: any, exitCode: number) => callback(exitCode);
    ipcRenderer.on('terminal:exit', wrapper);
    
    // Return cleanup function
    return () => ipcRenderer.removeListener('terminal:exit', wrapper);
  },
  killTerminal: () => ipcRenderer.invoke('terminal:kill'),
  
  // LLM Analysis
  analyzeOutput: (pageId: string, content: string) => ipcRenderer.invoke('llm:analyzeOutput', pageId, content),
  
  // Chrome Cookies
  getChromeCookies: (domain: string) => ipcRenderer.invoke('chrome:getCookies', domain),
});

// Type declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      startTerminal: () => Promise<void>;
      writeToTerminal: (data: string) => Promise<void>;
      onTerminalData: (callback: (data: string) => void) => () => void;
      onTerminalExit: (callback: (exitCode: number) => void) => () => void;
      killTerminal: () => Promise<void>;
      analyzeOutput: (pageId: string, content: string) => Promise<any>;
      getChromeCookies: (domain: string) => Promise<{ success: boolean; cookies?: any[]; error?: string }>;
    }
  }
} 