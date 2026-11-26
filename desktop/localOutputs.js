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

const { SerialPort } = require('serialport');
const osc = require("osc");
const axios = require('axios');
const { electron } = require('process');

const textTools = require('./textTools.js');
const { getSerial, getServerIp, getUDP, getLocalPort } = require('./io.js');
const UDP = getUDP();
const port = getLocalPort();
const { log } = require('./log.js');

//linelengths for OSC and serial
const oscLength = 27;
const serialLength = 27;
const oscLines = 3;

let serverip = getServerIp();
let udpPort; // Declare udpPort in the outer scope
createOSCServer();

// OSC LOGIC


function createOSCServer() {
        udpPort = new osc.UDPPort({
        remoteAddress: UDP.remoteAddress, // The address of the OSC receiver
        remotePort: UDP.remotePort        // The port of the OSC receiver
    });
    try {
        udpPort.open();
     udpPort.on("ready", () => {console.log("OSC Port is ready to send messages!");});
    } catch(error){
        udpPort.on("error", (err) => {console.error("An error occurred with the OSC port:", err.message);});
    }
}



function sendOSCMessage(input, address){

    const adaptInput = Buffer.from(input, "utf8").toString();
    const message = {
        address: address, // OSC address
        args: [
            { type: "s", value: adaptInput }, // String argument
        ]
    };

    // Send the message
    udpPort.send(message); // Replace with receiver address/port
    log("Message sent:", message);
    log("Message sent to:", udpPort.options.remoteAddress, udpPort.options.remotePort);

}


//SERIAL LOGIC

//const selectedSerial = getSerial();

// Function to send hex string to the first serial port
function sendHexToSerialPort(hexString) {
    log("function actually called");

    try {
    const serialPortPath = getSerial(); // Get the serial port path from the environment variable
    log(`Selected Serial Port: ${serialPortPath}`);
    // Check if the serial port path is defined before proceeding
    if (!serialPortPath) {
        log('Error: Serial port path is not defined.');
        return;
    }

    const port = new SerialPort({
        path: serialPortPath,  // Use the serial port retrieved from process.env
        baudRate: 9600  // Set the correct baud rate for your device
    });
    log('Serial port opened successfully' + port);

    const buffer = Buffer.from(hexString, 'hex');

    port.write(buffer, (err) => {
        if (err) {
            log('Error on write: ', err.message);
        } else {
            log('Message written to serial port');
        }
        
        // Close the port after the message is written
        port.drain((err) => {  // Wait until all data is written
            if (err) {
                log('Error on drain: ', err.message);
            }
            port.close((err) => {
                if (err) {
                    log('Error closing port: ', err.message);
                } else {
                    log('Port closed successfully');
                }
            });
        });
    });

    port.on('error', (err) => {
        log('Serial Port Error: ', err.message);
    });

} catch (error) {
    log('Error getting serial port: ' + error);}
}

function closeUDPPort() {
    try { udpPort.close(); } catch (e) {}
}

// YOUTUBE LIVE CAPTIONS
// Reverse-engineered wire format (not officially documented by YouTube): POST plain text
// to the stream's Captions Ingestion URL (YOUTUBE_CAPTION_URL in .env) with an incrementing
// &seq= on every request, body = UTC timestamp + newline + caption text + newline.

let youtubeSeq = 0;

function sendYouTubeCaption(text) {
    const url = process.env.YOUTUBE_CAPTION_URL;
    if (!url) return; // feature is optional; skip silently if not configured

    // Each cue seems to get a fixed ~2s display window regardless of whether a replacement
    // arrives sooner, and a new one landing mid-window merges with the old text instead of
    // replacing it. Explicitly clearing the cue first (empty text) before sending the real
    // caption forces the old one to end rather than relying on an implicit replace.
    postYouTubeCaptionBody('');
    postYouTubeCaptionBody(text);
}

module.exports = { sendOSCMessage, sendHexToSerialPort, createOSCServer, closeUDPPort};