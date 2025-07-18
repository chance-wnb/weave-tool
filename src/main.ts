import { app, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as pty from 'node-pty';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Terminal PTY instance
let ptyProcess: pty.IPty | null = null;

// No caching in main process - handled on React side

// Zod schema for structured LLM output
const TableMetadata = z.object({
  totalRows: z.number().describe("Total number of rows in the table"),
  dataTypes: z.array(z.string()).describe("Array of data types for each column (e.g., 'string', 'number', 'date')"),
  sortable: z.boolean().describe("Whether the table data can be meaningfully sorted")
});

const TableData = z.object({
  title: z.string().describe("Descriptive title for this table"),
  description: z.string().describe("Brief description of what this table represents"),
  headers: z.array(z.string()).describe("Column headers for the table"),
  rows: z.array(z.array(z.string())).describe("Array of rows, where each row is an array of string values"),
  metadata: TableMetadata
});

const AnalysisResponse = z.object({
  tables: z.array(TableData).describe("Array of extracted tables from the terminal output")
});

const analysisResponseFormat = zodResponseFormat(AnalysisResponse, "table_analysis");

const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset', // Better macOS integration
    show: false, // Don't show until ready
  });

  // Load from development server in dev mode, or built files in production
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    win.loadURL('http://localhost:3000');
    // win.webContents.openDevTools(); // Uncomment for debugging
  } else {
    win.loadFile(join(__dirname, '../dist-renderer/index.html'));
  }

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win.show();
  });
};

// LLM Analysis Function
async function analyzeTerminalOutput(content: string): Promise<any> {
  try {
    const prompt = `Analyze the following terminal output and extract any tabular data.

Look for structured data patterns such as:
- File listings (ls, dir commands)
- Process lists (ps, top commands) 
- System information (df, free, lscpu)
- Log entries with consistent formats
- Network information (netstat, ifconfig)
- Any other data that has a consistent column structure

For each table found:
- Create a descriptive title
- Identify appropriate column headers
- Extract all rows of data
- Determine if the data types are primarily strings, numbers, dates, etc.
- Assess if the data would benefit from sorting capabilities

Terminal Output:
${content}`;

    console.log('Sending request to OpenAI GPT-4o with structured output...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a data extraction expert. Analyze terminal output and extract structured tabular data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: analysisResponseFormat,
      temperature: 0.1,
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from OpenAI');
    }

    console.log('OpenAI GPT-4o structured response received');
    const parsedResult = JSON.parse(result);
    console.log('Extracted tables:', parsedResult.tables?.length || 0);
    
    return parsedResult;
  } catch (error) {
    console.error('Error analyzing terminal output:', error);
    throw error;
  }
}

// Terminal IPC Handlers
ipcMain.handle('terminal:start', async () => {
  // Kill existing terminal if it exists
  if (ptyProcess) {
    ptyProcess.kill();
  }

  // Determine shell based on platform
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  
  // Create new PTY process
  ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.cwd(),
    env: process.env,
  });

  // Send all terminal output to renderer
  ptyProcess.onData((data) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('terminal:data', data);
    });
  });

  // Handle terminal exit
  ptyProcess.onExit(({ exitCode }) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('terminal:exit', exitCode);
    });
    ptyProcess = null;
  });

  console.log('Terminal started');
});

ipcMain.handle('terminal:write', async (_, data: string) => {
  if (ptyProcess) {
    ptyProcess.write(data);
  }
});

ipcMain.handle('terminal:kill', async () => {
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
  }
});

// LLM Analysis IPC Handler
ipcMain.handle('llm:analyzeOutput', async (_, pageId: string, content: string) => {
  try {
    console.log('Analyzing output for page:', pageId);
    const analysis = await analyzeTerminalOutput(content);
    
    return analysis;
  } catch (error) {
    console.error('Error in LLM analysis:', error);
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      tables: []
    };
  }
});

app.whenReady().then((): void => {
  createWindow();

  app.on('activate', (): void => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', (): void => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 