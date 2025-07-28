import { app, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as pty from 'node-pty';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as os from 'os';
// We'll dynamically import sqlite3 when needed
import * as crypto from 'crypto';

import Groq from "groq-sdk";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const groq = new Groq({
  apiKey: process.env.GROQ_KEY,
});

// Terminal PTY instance
let ptyProcess: pty.IPty | null = null;

// No caching in main process - handled on React side

// Removed Zod schemas - now using regular JSON parsing with prompt instructions

// Chrome Cookie Reading Functions (adapted from devtools)
interface Cookie {
  name: string;
  value: string;
  domain: string;
}

async function getChromeCookieDbPath(): Promise<string | null> {
  const homeDir = os.homedir();
  const chromeProfilePath = join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome');
  
  if (!fs.existsSync(chromeProfilePath)) {
    return null;
  }
  
  // Try Default profile first, then Profile 0, Profile 1, etc.
  const profilePaths = ['Default'];
  const profileDirs = fs.readdirSync(chromeProfilePath)
    .filter(dir => dir.startsWith('Profile'))
    .sort();
  
  profilePaths.push(...profileDirs);
  
  for (const profile of profilePaths) {
    const cookiesPath = join(chromeProfilePath, profile, 'Cookies');
    if (fs.existsSync(cookiesPath)) {
      return cookiesPath;
    }
  }
  
  return null;
}

async function getChromeEncryptionKey(): Promise<Buffer | null> {
  try {
    let password = 'peanuts'; // Chrome's fallback password on macOS
    
    // Try to get the password from macOS keychain
    try {
      const keytar = await import('keytar');
      const keychainPassword = await keytar.getPassword('Chrome Safe Storage', 'Chrome');
      if (keychainPassword) {
        password = keychainPassword;
        console.log('Got Chrome password from keychain');
      } else {
        console.log('No Chrome password found in keychain, using fallback');
      }
    } catch (keychainError) {
      console.log('Could not access keychain, using fallback password:', keychainError.message);
    }
    
    const salt = Buffer.from('saltysalt', 'utf8');
    const iterations = 1003;
    const keyLength = 16;
    
    // Use PBKDF2 to derive the key
    const key = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha1');
    console.log('Generated encryption key with password length:', password.length);
    return key;
  } catch (error) {
    console.error('Error getting Chrome encryption key:', error);
    return null;
  }
}

function decryptChromeValue(encryptedValue: Buffer, key: Buffer): string {
  try {
    if (encryptedValue.length === 0) {
      return '';
    }
    
    // Chrome cookies are encrypted with AES-128-CBC
    // The first 3 bytes are version info ('v10' or 'v11')
    const version = encryptedValue.subarray(0, 3).toString('latin1');
    
    if (version !== 'v10' && version !== 'v11') {
      // Try to return as plain text if not encrypted
      return encryptedValue.toString('utf8');
    }
    
    // Remove version prefix
    const encrypted = encryptedValue.subarray(3);
    
    // IV is 16 bytes of spaces for Chrome on macOS
    const iv = Buffer.alloc(16, ' ');
    
    try {
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
      decipher.setAutoPadding(true); // Let Node.js handle padding
      
      let decrypted = decipher.update(encrypted);
      const final = decipher.final();
      decrypted = Buffer.concat([decrypted, final]);
      
      const result = decrypted.toString('utf8');
      console.log('Decrypted result:', result.substring(0, 50));
      return result;
    } catch (decryptError) {
      console.error('Decryption failed:', decryptError);
      // Try with manual padding handling
      try {
        const decipher2 = crypto.createDecipheriv('aes-128-cbc', key, iv);
        decipher2.setAutoPadding(false);
        
        let decrypted2 = decipher2.update(encrypted);
        const final2 = decipher2.final();
        decrypted2 = Buffer.concat([decrypted2, final2]);
        
        // Remove PKCS7 padding manually
        const paddingLength = decrypted2[decrypted2.length - 1];
        if (paddingLength && paddingLength <= 16 && paddingLength <= decrypted2.length) {
          decrypted2 = decrypted2.subarray(0, decrypted2.length - paddingLength);
        }
        
        const result2 = decrypted2.toString('utf8');
        console.log('Manual padding result:', result2.substring(0, 50));
        return result2;
      } catch (manualError) {
        console.error('Manual padding also failed:', manualError);
        return '';
      }
    }
  } catch (error) {
    console.error('Error decrypting Chrome cookie:', error);
    return '';
  }
}

async function getChromeCookies(domain: string): Promise<{ success: boolean; cookies?: Cookie[]; error?: string }> {
  try {
    // Dynamic import of sqlite3
    const sqlite3 = await import('sqlite3');
    
    const cookieDbPath = await getChromeCookieDbPath();
    if (!cookieDbPath) {
      return { success: false, error: 'Chrome cookie database not found. Make sure Chrome is installed and you have used it at least once.' };
    }
    
    const encryptionKey = await getChromeEncryptionKey();
    if (!encryptionKey) {
      return { success: false, error: 'Failed to get Chrome encryption key' };
    }
    
    // Copy the database to a temp location to avoid lock issues
    const tempDbPath = join(os.tmpdir(), `chrome_cookies_${Date.now()}.db`);
    fs.copyFileSync(cookieDbPath, tempDbPath);
    
    return new Promise((resolve) => {
      const db = new sqlite3.default.Database(tempDbPath, sqlite3.default.OPEN_READONLY, (err: any) => {
        if (err) {
          resolve({ success: false, error: `Failed to open Chrome cookie database: ${err.message}` });
          return;
        }
        
        const query = `SELECT name, value, encrypted_value, host_key FROM cookies WHERE host_key LIKE ?`;
        const domainPattern = `%${domain}%`;
        
        db.all(query, [domainPattern], (err: any, rows: any[]) => {
          db.close();
          
          // Clean up temp file
          try {
            fs.unlinkSync(tempDbPath);
          } catch (cleanupErr) {
            console.warn('Failed to clean up temp database file:', cleanupErr);
          }
          
          if (err) {
            resolve({ success: false, error: `Database query failed: ${err.message}` });
            return;
          }
          
          const cookies: Cookie[] = rows.map(row => {
            let value = row.value;
            
            // If value is empty and we have encrypted_value, try to decrypt it
            if (!value && row.encrypted_value && row.encrypted_value.length > 0) {
              const encryptedBuffer = Buffer.isBuffer(row.encrypted_value) 
                ? row.encrypted_value 
                : Buffer.from(row.encrypted_value);
              console.log(`Decrypting cookie: ${row.name}`);
              value = decryptChromeValue(encryptedBuffer, encryptionKey);
              console.log(`Decrypted to: ${value ? value.substring(0, 20) + '...' : 'EMPTY'}`);
            }
            
            return {
              name: row.name,
              value: value || '',
              domain: row.host_key
            };
          }).filter(cookie => cookie.value); // Only return cookies with values
          
          resolve({ success: true, cookies });
        });
      });
    });
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

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

// Chrome Cookies IPC Handler
ipcMain.handle('chrome:getCookies', async (_, domain: string) => {
  try {
    console.log('Getting Chrome cookies for domain:', domain);
    const result = await getChromeCookies(domain);
    return result;
  } catch (error) {
    console.error('Error getting Chrome cookies:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
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