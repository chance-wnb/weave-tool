import { app, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as pty from 'node-pty';
import OpenAI from 'openai';
import dotenv from 'dotenv';

import Groq from "groq-sdk";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.moonshot.ai/v1",
});

const groq = new Groq({
  apiKey: process.env.GROQ_KEY,
});

// Terminal PTY instance
let ptyProcess: pty.IPty | null = null;

// No caching in main process - handled on React side

// Removed Zod schemas - now using regular JSON parsing with prompt instructions

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
    const prompt = `Analyze the following terminal output and extract any tabular data. Pay special attention to ASCII/Unicode table formats with box-drawing characters.

Look for structured data patterns such as:
- File listings (ls, dir commands)
- Process lists (ps, top commands) 
- System information (df, free, lscpu)
- Log entries with consistent formats
- Network information (netstat, ifconfig)
- ASCII tables with Unicode borders (┏━━━┳━━━┓, ┃, │, ┡━━━╇━━━┩, └────┴────┘)
- Any other data that has a consistent column structure

SPECIAL HANDLING FOR ASCII/UNICODE TABLES:
- Ignore all border characters: ┏ ━ ┳ ┓ ┃ ┡ ╇ ┩ │ └ ┴ ┘ ┌ ┐ ├ ┤ ┬ ┼ ─ ║ ╔ ╗ ╚ ╝ ╠ ╣ ╦ ╩ ╬ ═
- Look for headers in the first content row (often between ┃ characters)
- Each logical table row may span multiple physical lines
- Combine text that appears in the same column across multiple lines
- Empty cells should be represented as empty strings ""
- When text wraps within a cell, join the wrapped parts with a space

For each table found:
- Create a descriptive title based on the content
- Extract column headers (ignore border decorations)
- Extract ALL data rows, even if they span multiple lines
- Handle wrapped text within cells properly
- Determine appropriate data types
- Assess if the data would benefit from sorting capabilities

CRITICAL: Make sure to extract ALL rows from the table, not just the first few. Look carefully for continuation patterns where a single logical row spans multiple physical lines.

IMPORTANT: Respond with a valid JSON object in exactly this format:
{
  "tables": [
    {
      "title": "descriptive title",
      "description": "brief description",
      "headers": ["column1", "column2", "..."],
      "rows": [["value1", "value2", "..."], ["value1", "value2", "..."]],
      "metadata": {
        "totalRows": number,
        "dataTypes": ["string", "number", "..."],
        "sortable": true/false
      }
    }
  ]
}

Terminal Output:
${content}`;

    console.log('Sending request to Groq (Kimi2) with regular JSON response...');
    const response = await groq.chat.completions.create({
      model: 'moonshotai/kimi-k2-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are a data extraction expert. Analyze terminal output and extract structured tabular data. Always respond with valid JSON only, no additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from Groq');
    }

    console.log('Groq (Kimi2) response received');
    
    // Clean up the response to extract JSON if there's extra text
    let jsonContent = result.trim();
    
    // Remove markdown code blocks if present
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsedResult = JSON.parse(jsonContent);
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
  
  // Create new PTY process with wider terminal for complex tables
  ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 140,  // Much wider for complex tables
    rows: 50,   // Taller for long output
    cwd: process.cwd(),
    env: {
      ...process.env,
      // Ensure commands see the full terminal size
      COLUMNS: '140',
      LINES: '50',
      TERM: 'xterm-256color',
      // Disable output buffering/pagination
      PAGER: '',
      LESS: '',
      MORE: '',
    },
    // Disable flow control to prevent output truncation
    handleFlowControl: false,
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