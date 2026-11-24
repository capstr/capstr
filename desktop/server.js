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

const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { spawn } = require('child_process');
const multer = require('multer');
const bodyParser = require('body-parser');
const upload = multer({ dest: path.join(__dirname, 'uploads') });
const os = require('os');
const cors = require('cors');
const appServer = express();
const { SerialPort } = require('serialport');
const robot = require('robotjs');

const sseRouter = require('./sse.js');
appServer.use(sseRouter.appRouter);

const { log } = require('./log.js');
const { getSerial, getServerIp, getUDP, getLocalPort } = require('./io.js');
const { sendOSCMessage, sendHexToSerialPort, createOSCServer, closeUDPPort} = require('./localOutputs.js');
const { assemble, sendPacketToLocalClients, sendPacketToWeb } = require('./packet.js');
const UDP = getUDP();
const port = getLocalPort();
const showfileActions = require('./showfileActions.js');
const textTools = require('./textTools.js');

/* //linelengths for OSC and serial
const oscLength = 27;
const serialLength = 27;
const oscLines = 3; */

log('Server is starting');
/* const selectedSerial = getSerial(); */

// Middleware setup
appServer.use(bodyParser.json({ limit: '50mb' }));
appServer.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
appServer.use(cors());

// Load environment variables from .env file
dotenv.config();

let webServerUrl = process.env.WEB_SERVER_URL || '';
let secretKey = process.env.SECRET_KEY || '';

if (!webServerUrl || !secretKey) {
    const envPath = path.join(__dirname, '.env');
    const envVars = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
    
    if (!webServerUrl && envVars.WEB_SERVER_URL) {
        webServerUrl = envVars.WEB_SERVER_URL;
    }

    if (!secretKey && envVars.SECRET_KEY) {
        secretKey = envVars.SECRET_KEY;
    }
    
    if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, '');
    }

    if (!webServerUrl) {
        fs.appendFileSync(envPath, 'WEB_SERVER_URL=\n');
    }

    if (!secretKey) {
        fs.appendFileSync(envPath, 'SECRET_KEY=\n');
    }
}

log(`Initial WEB_SERVER_URL: ${webServerUrl}`);
log(`Initial SECRET_KEY: ${secretKey}`);

function updateEnvFile(key, value) {
    const envPath = path.join(__dirname, '.env');
    const envVars = dotenv.parse(fs.readFileSync(envPath));
    envVars[key] = value;
    const newEnvVars = Object.keys(envVars).map(k => `${k}=${envVars[k]}`).join('\n');
    fs.writeFileSync(envPath, newEnvVars);
    log(`Updated .env file with ${key}=${value}`);
}

appServer.post('/set-url', (req, res) => {
    webServerUrl = req.body.url;
    updateEnvFile('WEB_SERVER_URL', webServerUrl);
    log('Server URL set to: ' + webServerUrl);
    res.status(200).send('URL set');
});

appServer.post('/set-secret-key', (req, res) => {
    secretKey = req.body.key;
    updateEnvFile('SECRET_KEY', secretKey);
    log('Secret key set');
    res.status(200).send('Secret key set');
});

appServer.get('/get-url', (req, res) => {
    res.json({ url: webServerUrl });
});

appServer.get('/get-secret-key', (req, res) => {
    res.json({ key: secretKey ? '********' : 'Not set' });
});

let serverip = getServerIp();
let holding = true;
const networks = os.networkInterfaces();

// import showfile and showfileActions methods

let showfile;
showfileActions.test();

const loadShowfile = () => {showfile = showfileActions.load(); }

loadShowfile();


function formatCaption(index) {
    if (index >= 0 && index < showfile.captions.length) {
        const currentCaption = showfile.captions[index];
        const lineType = currentCaption['line-type'] ? currentCaption['line-type'].toLowerCase() : 'spoken';
        const format = showfile.linetypes[lineType] || showfile.linetypes['spoken'];
        currentCaption.format = format;
        console.log(currentCaption);
        return currentCaption;
    } else {
        console.error('Index out of bounds');
        return null;
    }
}

const index = 0;
const currentCaption = formatCaption(index);
console.log('Current Caption:', currentCaption);

let currentIndex = 0;
//let clients = [];
let venue = "capstr";
let showname = "this show";

const setCurrentCaptionObject = (index) => {
    if (index < 0 || index >= showfile.captions.length) {
        throw new Error('Invalid index');
    }

    let currentCaptionObject = { ...showfile.captions[index] };
    const linetype = currentCaptionObject['line-type'] || 'spoken';

    //if the linetype exists in showfile.linetypes, set the format; otherwise, default to 'spoken'
    if (showfile.linetypes && showfile.linetypes[linetype]) {
        currentCaptionObject.format = { ...showfile.linetypes[linetype] };
    } else {
        currentCaptionObject.format = { ...showfile.linetypes['spoken'] };
    }

    // pull character from object and check if it exists in showfile.characters, if not default to 'default' character
    const character = currentCaptionObject['character'] || 'default';
    const characterObj = showfile.characters[character];
    
    // if the character exists, set the color; otherwise, default to white
    if (characterObj) {
        currentCaptionObject.color = characterObj.color;
    } else {
        currentCaptionObject.color = '#ffffff';
    }
   
    return currentCaptionObject;
    console.log(currentCaptionObject)
};

let currentCaptionObject = setCurrentCaptionObject(0);

function localhostOnly(req, res, next) {
    const serverIp = getServerIp(); // Get the server's IP address
    const clientIp = extractClientIp(req); // Extract the client's IP address

    console.log(`Request from host: ${req.hostname}, IP: ${clientIp}`);
    console.log(`Allowed IP: ${serverIp}`);

    // Allow only if the client's IP matches the server's IP
    if (clientIp === serverIp) {
        next();
    } else {
        res.status(403).send('Access Forbidden');
    }
}

// Function to extract and normalize the client's IP address
function extractClientIp(req) {
    // Use the x-forwarded-for header if available, or fallback to remoteAddress
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;

    // Handle IPv6-mapped IPv4 addresses
    if (ip.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '');
    }

    // Strip out port if present
    return ip.split(':').slice(-1)[0];
}

// public/ is shared with the web deploy and lives at the repo root, one level up from here
appServer.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

appServer.get('/op.html', localhostOnly, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'op.html'));
});

appServer.get('/setup.html', localhostOnly, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'setup.html'));
});

appServer.use(express.static(path.join(__dirname, '..', 'public'), { etag: false, lastModified: false }));

appServer.post('/send-blank', async (req, res) => {
    sendHexToSerialPort(textTools.textToHex("\r\r\r"));
    sendOSCMessage(" ", "/capstr");
    sendOSCMessage(" ", "/capstrjson");

});

appServer.post('/view-webserver', async (req, res) => {
    // OPEN WEBSERVER IN DEFAULT BROWSER (uses the OS's own open command, since Electron's shell isn't available in this process)
    const url = `http://${serverip}:${port}`;
    const cmd = process.platform === 'darwin' ? 'open'
              : process.platform === 'win32'  ? 'cmd'
              : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
    try {
        const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
        child.on('error', (err) => log('Error opening browser: ' + err.message));
        child.unref();
        res.sendStatus(200);
    } catch (error) {
        log('Error opening browser: ' + error.message);
        res.status(500).send('Failed to open browser');
    }
});

appServer.post('/send-packet', async (req, res) => {
    log('Received request to /send-packet with body:', JSON.stringify(req.body));
    const { currentCaptionIndex } = req.body; // Extract currentCaptionIndex from request body

    if (currentCaptionIndex === undefined || currentCaptionIndex < 0 || currentCaptionIndex >= showfile.captions.length) {
        log('Invalid index:', currentCaptionIndex);
        return res.status(400).send('Invalid index');
    }

    currentIndex = currentCaptionIndex; // Update currentIndex
    currentCaptionObject = setCurrentCaptionObject(currentIndex);
    const liveInput = null;
    const packet = assemble(currentCaptionObject, holding, liveInput);
    sendPacketToLocalClients(packet);


    try {
        await sendPacketToWeb(packet.data, webServerUrl, secretKey, 'receive-packet');
        res.status(200).send('Packet sent');
    } catch (error) {
        log('Failed to send packet to web server:', error.toString());
        return res.status(500).send('Failed to send packet to web server');
    }
});


appServer.post('/send-live-packet', async (req, res) => {
    log('Received request to /send-live-packet with body:', JSON.stringify(req.body));
    const { liveInput } = req.body; // Extract currentCaptionIndex from request body
    console.log(liveInput);
    
    const packet = assemble(currentCaptionObject, holding, liveInput);
    sendPacketToLocalClients(packet);

    try {
        await sendPacketToWeb(packet.data, webServerUrl, secretKey, 'receive-packet');
        res.status(200).send('Packet sent');
    } catch (error) {
        log('Failed to send packet to web server:', error.toString());
        return res.status(500).send('Failed to send packet to web server');
    }

});

appServer.post('/hold', async (req, res) => {
    holding = true;
    log('holding');
    res.status(200).send('Held');
});

appServer.post('/check-hold', async (req, res) => {
    res.status(200).send(holding);
});

appServer.post('/check-index', async (req, res) => {
    console.log("checking")
    res.status(200).json(currentIndex);
});

appServer.post('/start', async (req, res) => {
    holding = false;
    log('starting');
    res.status(200).send('Resumed');
});

function search(nameKey, myArray) {
    return myArray.find(item => item.Character === nameKey);
}

appServer.get('/showfile', (req, res) => {
    try {
        log('Request received for /showfile');
        //const showfile = JSON.parse(fs.readFileSync(showfilePath, 'utf8'));
        res.json(showfile);
        log('showfile.capstr sent successfully');
    } catch (error) {
        log('Error reading showfile.capstr: ' + error);
        res.sendStatus(500);
    }
});


// Endpoint to update a line in the showfile
appServer.post('/update-line', (req, res) => {
    try {
        log('Request received for /update-line');
        console.log(req.body);
        const message = req.body;
        const oldChar = showfile.captions[message.index].character;
        showfileActions.updateLine(showfile, message.index, message.line, message.character, oldChar, message.linetype);
        log('showfile.capstr updated successfully');
        res.sendStatus(200);
        loadShowfile();
        syncWithWeb();

    } catch (error) {
        log('Error updating line: ' + error);
        res.sendStatus(500);
    }
})

// Endpoint to update a line in the showfile
appServer.post('/add-linetype', (req, res) => {
    try {
        log('Request received for /update-line');
        console.log(req.body);
        const message = req.body;
        showfileActions.addLinetype(showfile, message.linetype);
        log('showfile.capstr updated successfully');
        res.sendStatus(200);
        loadShowfile();
        syncWithWeb();

    } catch (error) {
        log('Error updating line: ' + error);
        res.sendStatus(500);
    }
})

// Endpoint to update a line in the showfile
appServer.post('/split-line', (req, res) => {
    try {
        log('Request received for /split-line');
        console.log(req.body);
        const message = req.body;
        showfileActions.splitLine(showfile, message.index, message.line1, message.line2);
        log('showfile.capstr updated successfully');
        res.sendStatus(200);
        loadShowfile();
        syncWithWeb();

    } catch (error) {
        log('Error updating line: ' + error);
        res.sendStatus(500);
    }
})

appServer.post('/delete-line', (req, res) => {
    try {
        log('Request received for /delete-line');
        console.log(req.body);
        const message = req.body;
        const index = message.index;
        const oldChar = showfile.captions[message.index].character;
        showfileActions.deleteLine(showfile, index, oldChar);
        log('showfile.capstr updated successfully');
        res.sendStatus(200);
        loadShowfile();
        syncWithWeb();

    } catch (error) {
        log('Error updating line: ' + error);
        res.sendStatus(500);
    }
})

appServer.get('/captions', (req, res) => {
    try {
        log('Request received for /captions');
        res.json(showfile.captions);
        log('captions sent successfully');
    } catch (error) {
        log('Error reading captions: ' + error);
        res.sendStatus(500);
    }
});

appServer.get('/linetypes', (req, res) => {
    try {
        log('Request received for /captions');
        res.json(showfile.linetypes);
        log('captions sent successfully');
    } catch (error) {
        log('Error reading captions: ' + error);
        res.sendStatus(500);
    }
});

appServer.get('/server-ip', (req, res) => {
    try {
        log('Requested IP');
        res.json(serverip + ':' + port);
        log('IP sent successfully');
    } catch (error) {
        log('Error returning IP: ' + error);
        res.sendStatus(500);
    }
});

appServer.post('/update-showfile', (req, res) => {
    try {
        log('Request received to update showfile');
        const showfileUpdate = req.body;
        // also pushes whichever language setup.html's selector chose to the front of
        // showinfo.languages and every caption's line array, then writes
        showfileActions.setPrimaryLanguage(showfileUpdate, showfileUpdate.showinfo['primary-language']);
        log('showfile.capstr updated successfully');
        res.sendStatus(200);
        loadShowfile();
        syncWithWeb();
        venue = showfile.showinfo.venue;
        showname = showfile.showinfo.name;
    } catch (error) {
        log('Error updating showfile.capstr: ' + error);
        res.sendStatus(500);
    }
});

// Endpoint to handle file upload and process with readshow.js
appServer.post('/upload-excel', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    log(`File uploaded to ${filePath}`);

    const nodePath = process.execPath; // Use the Node.js binary bundled with Electron
    const scriptPath = path.join(__dirname, 'parseXLSX.js');
    const args = [scriptPath, filePath];

    const child = spawn(nodePath, args);

    child.stdout.on('data', (data) => {
       // log(`Output from readshow.js: ${data}`);
    });

    child.stderr.on('data', (data) => {
        log(`Error output from parseXLSX.js: ${data}`);
    });

    child.on('close', (code) => {
        if (code !== 0) {
            log(`parseXLSX.js process exited with code ${code}`);
            res.status(500).send(`Error executing parseXLSX.js, exited with code ${code}`);
        } else {
            log(`parseXLSX.js process exited successfully with code ${code}`);
            loadShowfile();
            res.status(200).send(`Output from parseXLSX.js: ${code}`);
        }
        fs.unlink(filePath, (err) => {
            if (err) log(`Error deleting uploaded file: ${err.message}`);
            else log('Uploaded file deleted');
        });
    });
});

async function syncWithWeb() {

    let numLangs = showfile.showinfo.languages.length;
    const packetJSON = JSON.stringify({
        venue: showfile.showinfo.venue,
        showname: showfile.showinfo.name,
        primarylang: showfile.showinfo["primary-language"],
        languages: showfile.showinfo.languages,
        numLangs: numLangs
    });

    try {
        await sendPacketToWeb(packetJSON, webServerUrl, secretKey, 'show-setup');
        log('Show setup packet sent successfully');
    } catch (error) {
        log('Failed to send show setup packet: ' + error);
    }

}

appServer.get('/show-setup-client', (req, res) => {
    let numLangs = showfile.showinfo.languages.length;
    const showSetupData = {
        venue: venue,
        showname: showname,
        primarylang: showfile.showinfo["primary-language"],
        languages: showfile.showinfo.languages,
        numLangs: numLangs,
        holding: holding
    };
    res.status(200).json(showSetupData);
    console.log(showSetupData)
});

appServer.post('/upload-showfile', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }
    const uploadPath = req.file.path;
    //const showfilePath = path.join(__dirname, 'showfile.json');
    showfileActions.upload(uploadPath);
    log('File copied to showfile.capstr');
    loadShowfile();
    res.status(200).send('File uploaded and copied to showfile.capstr');
});


appServer.post('/trigger-dictation', (req, res) => {
    if (process.platform === 'darwin') {
        // Click Edit → Start Dictation… in the frontmost app (works regardless of the user's shortcut)
        const script = `
            tell application "System Events"
                tell (first application process whose frontmost is true)
                    click (first menu item of menu 1 of menu bar item "Edit" of menu bar 1 whose name starts with "Start Dictation")
                end tell
            end tell`;
        const child = spawn('osascript', ['-e', script]);
        child.stderr.on('data', (data) => log('Dictation error: ' + data));
        child.on('close', (code) => {
            if (code === 0) {
                console.log('Dictation triggered');
                res.send({ success: true });
            } else {
                res.status(500).send({ success: false });
            }
        });
    } else {
        // Trigger Windows Dictation (Win + H)
        robot.keyToggle('command', 'down');
        robot.keyTap('h');
        robot.keyToggle('command', 'up');
        console.log('Dictation triggered');
        res.send({ success: true });
    }
});

const httpserver = appServer.listen(port, getServerIp(), () => {
    log(`Local server is running on port ${port} and IP ${getServerIp()}`);
});

function shutdown() {
    //clients.forEach(client => client.res.end());   // end SSE streams
    sseRouter.endSSEStreams();   // end SSE streams
    httpserver.closeAllConnections();              // drop keep-alive sockets (Node 18.2+)
    httpserver.close(() => process.exit(0));
    // try { udpPort.close(); } catch (e) {}
    closeUDPPort();
    setTimeout(() => process.exit(0), 1000).unref(); // hard stop if anything still hangs
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('disconnect', shutdown);   // parent Electron process went away (crash / force quit)


process.on('exit', () => {
    //udpPort.close();
    closeUDPPort();
    console.log('OSC UDP Port closed');
});