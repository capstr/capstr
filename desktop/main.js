/*
 * Capstr
 * Copyright (C) 2026 Timothy Kelly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

//MANAGES THE ELECTRON MAIN PROCESS - WINDOWS, IPC, AND FORKING THE SERVER PROCESS

//IMPORTS
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');
const os = require('os');
const net = require('net'); // Import the net module
const { SerialPort } = require('serialport');
const bonjour = require('bonjour')();
const cleanup = require('./cleanup');
const PORT = 3001;

// MODULE-LEVEL STATE - WINDOWS, SERVER PROCESS, AND SELECTED ADAPTER/SERIAL PORT
let mainWindow;
let selectWindow;
let serverProcess;
let selectedAdapterIP = '127.0.0.1'; // Default to localhost
let selectedSerial = ''; // Default to empty string
let selectedPort = PORT; // Default to 3001

// LOGGING SETUP - WRITES TO CONSOLE AND APP.LOG
const logDir = path.join(os.homedir(), 'capstr');
const logFile = path.join(logDir, 'app.log');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logStream = fs.createWriteStream(logFile, { flags: 'a' });

const log = (message) => {
    try {
        console.log(message);
        logStream.write(`${new Date().toISOString()} - ${message}\n`);
    } catch (err) {
        console.error(`Failed to write to log file: ${err.message}`);
    }
};

// ENSURE ONLY ONE INSTANCE OF THE APP RUNS AT A TIME
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    // IF A SECOND INSTANCE IS LAUNCHED, FOCUS THE EXISTING WINDOW INSTEAD
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    // CREATE THE WINDOW FOR SELECTING NETWORK ADAPTER AND SERIAL PORT
    function createSelectWindow() {
        selectWindow = new BrowserWindow({
            //frame: false,
            titleBarStyle: 'hidden',
            // expose window controlls in Windows/Linux

            width: 500,
            height: 600,
            titleBarOverlay: {
                color: '#000000',
                symbolColor: '#74b1be',
                height: 20
              },
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        selectWindow.loadFile(path.join(__dirname, '..', 'public', 'selectAdapter.html')); // public/ is shared with the web deploy, one level up from here

        selectWindow.on('closed', () => {
            selectWindow = null;
        });
    }

    // CREATE THE MAIN OPERATOR WINDOW AND LOAD THE SERVER'S URL ONCE IT'S READY
    function createMainWindow() {
        mainWindow = new BrowserWindow({
            width: 1080,
            height: 900,
            titleBarStyle: 'hidden',
            //frame: false,
            // expose window controlls in Windows/Linux
            titleBarOverlay: {
                color: '#000000',
                symbolColor: '#74b1be',
                height: 20
              }
        });

        // Listen for a request from the renderer to open a new window


        const startUrl = `http://${selectedAdapterIP}:${selectedPort}/op.html`;
        let retries = 0;
        const maxRetries = 10;

        const checkServer = (callback) => {
            if (retries >= maxRetries) {
                log('Server not ready after multiple attempts, exiting...');
                app.quit();
                return;
            }
            const client = new net.Socket();
            client.once('error', () => {
                log('Server not ready, retrying...');
                retries++;
                setTimeout(() => checkServer(callback), 1000);
            });

            client.once('connect', () => {
                client.end();
                callback();
            });

            client.connect(selectedPort, selectedAdapterIP);
        };

        const loadUrl = () => {
            mainWindow.loadURL(startUrl)
                .then(() => {
                    log('Successfully loaded URL');
                })
                .catch((error) => {
                    log(`Failed to load URL, retrying in 1 second: ${error}`);
                    setTimeout(loadUrl, 1000);
                });
        };

        checkServer(() => {
            loadUrl();
            // mainWindow.webContents.openDevTools();
        });

        mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            log(`Failed to load ${validatedURL}: ${errorDescription} (${errorCode})`);
        });

        mainWindow.on('closed', () => {
            log('Main window closed');
            if (serverProcess) {
                serverProcess.kill('SIGTERM');
            }
            mainWindow = null;
        });
    }

    // OPEN A SEPARATE MONITOR WINDOW WHEN REQUESTED BY THE RENDERER
    ipcMain.on('open-monitor-window', (event, url) => {
        let monitorWindow = new BrowserWindow({
          width: 800,
          height: 600,
          x: 200, // left position
          y: 500, // top position
          frame: false, // Removes default frame
          titleBarStyle: 'hidden', // Enables titleBarOverlay
          titleBarOverlay: {
            color: '#000000',
            symbolColor: '#74b1be',
            height: 20
          },
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        });
      
        monitorWindow.loadURL(url);
        log("opened monitor")
      });

    // FORK THE SERVER PROCESS WITH THE SELECTED ADAPTER IP, SERIAL PORT, AND HTTP PORT
    function startServer(callback) {
        const serverPath = path.join(__dirname, 'server.js');
        const nodePath = process.execPath;
        process.env.NODE_PATH = path.join(__dirname, 'node_modules');

        log(`Starting server with: ${nodePath} ${serverPath}`);

        serverProcess = fork(serverPath, [], {
            stdio: 'pipe',
            execPath: nodePath,
            env: {
                ...process.env,
                SELECTED_ADAPTER_IP: selectedAdapterIP,
                SELECTED_SERIAL_PORT: selectedSerial,
                PORT: selectedPort // Pass the port to the server
            }
        });
        
        cleanup.setServerProcess(serverProcess);
        
        serverProcess.stdout.on('data', (data) => {
            log(`Server stdout: ${data}`);
        });

        serverProcess.stderr.on('data', (data) => {
            log(`Server stderr: ${data}`);
        });

        serverProcess.on('exit', (code, signal) => {
            log(`Server process exited with code ${code} and signal ${signal}`);
        });

        serverProcess.on('error', (err) => {
            log(`Server process error: ${err.message}`);
        });

        callback();
    }

    // ONCE ELECTRON IS READY, SHOW THE ADAPTER SELECTION WINDOW
    app.whenReady().then(() => {
        log('App is ready');
        createSelectWindow();
    });

    // LIST AVAILABLE NETWORK ADAPTERS FOR THE SELECTION WINDOW
    ipcMain.handle('get-network-adapters', async () => {
        const interfaces = os.networkInterfaces();
        let adapters = [];
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (!iface.internal && iface.family === 'IPv4') {
                    adapters.push({ name, address: iface.address });
                }
            }
        }
        return adapters;
    });

       // LIST AVAILABLE SERIAL PORTS FOR THE SELECTION WINDOW
       ipcMain.handle('get-serial-ports', async () => {
        try {
            const ports = await SerialPort.list();
            return ports;  // Send list of available serial ports back to the renderer
        } catch (err) {
            console.error('Error listing serial ports: ', err);
            return [];
        }
    });

    // STORE THE SELECTED ADAPTER/SERIAL, START THE SERVER, OPEN THE MAIN WINDOW, AND PUBLISH VIA BONJOUR
    ipcMain.on('adapter-selected', (event, adapter, port, serial) => {
        selectedAdapterIP = adapter; // Store selected IP
        selectedPort = port; // Store selected port
        selectedSerial = serial; // Store selected serial port
        log("Selected serial port:" + selectedSerial);
        if (selectWindow) {
            selectWindow.close();
        }
        startServer(() => {
            createMainWindow();
       // DEBUGGING: Check if Bonjour publishes successfully
       const bonjourService = bonjour.publish({
        name: 'capstr',
        type: 'http',
        port: selectedPort,
        host: 'capstr.local' // Add explicit hostname
    });

    cleanup.setBonjourService(bonjourService);
    
    bonjourService.on('up', () => {
        console.log('Bonjour service successfully published: http://capstr.local');
    });

    bonjourService.on('error', (err) => {
        console.error('Bonjour service error:', err);
    });
        });
    });

    // ON NON-MAC PLATFORMS, QUIT THE APP WHEN ALL WINDOWS ARE CLOSED
    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            cleanup.cleanup({ log });
            app.quit();
        }
    });

    // RE-OPEN THE SELECTION WINDOW IF THE APP IS ACTIVATED WITH NO WINDOWS OPEN (E.G. MAC DOCK)
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createSelectWindow();
        }
    });

    // CLEAN UP THE SERVER PROCESS AND BONJOUR SERVICE BEFORE QUITTING
    app.on('before-quit', () => {
        cleanup.cleanup({ log });
    });
}
