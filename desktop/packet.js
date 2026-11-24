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


const axios = require('axios');
const jwt = require('jsonwebtoken');
const { sendSSEMessage } = require('./sse.js');
const { sendOSCMessage, sendHexToSerialPort } = require('./localOutputs.js');
const textTools = require('./textTools.js');
const log = require('./log.js').log;

//linelengths for OSC and serial
const oscLength = 27;
const serialLength = 27;
const oscLines = 3;


function assemble(currentCaptionObject, holding, liveInput) {
    // Implementation for assembling packet data
    let packetData = {}
    if (liveInput !== undefined && liveInput !== null) {
        packetData = {
        holding: holding,
        character: " ",
        line: liveInput,
        color: "white",
        underline: false,
        bold: false,
        brackets: false,
        notes: false,
        italics: false,
        caps: false,
        };

    } else {

        packetData = {
            holding: holding,
            character: currentCaptionObject.character,
            line: currentCaptionObject.line,
            color: currentCaptionObject.color,
            underline: currentCaptionObject.format.underline,
            bold: currentCaptionObject.format.bold,
            brackets: currentCaptionObject.format.brackets,
            notes: currentCaptionObject.format.notes,
            italics: currentCaptionObject.format.italics,
            caps: currentCaptionObject.format.caps,
    };
}

    console.log(packetData);

    // line is [primary language, ...translations] for normal captions, or a plain string for live input;
    // OSC/serial hardware outputs always get the primary language only
    const primaryLine = Array.isArray(packetData.line) ? packetData.line[0] : packetData.line;

    const packetJSON = JSON.stringify(packetData);

    const packet = {

        JSON: packetJSON,
        data: `data: ${packetJSON}\n\n`,
        osc: textTools.formatForOSC(packetData.character + ": " + primaryLine, oscLength, oscLines),
        hex: "1c"+"00"+textTools.textToHex(packetData.character + ": " + primaryLine)+"0d"

    }
   
    return packet;
    }

function sendPacketToLocalClients(packet) {
        // Send the packet to all connected SSE clients
        sendSSEMessage(packet.data);

        // Send the packet via OSC and serial
        sendOSCMessage(packet.osc, "/capstr");
        sendOSCMessage(packet.JSON, "/capstrjson");
        sendHexToSerialPort(packet.hex);

}

   
async function sendPacketToWeb(packetData, webServerUrl, secretKey, route) {

    try {
        const signedPacket = signPacket(packetData, webServerUrl, secretKey); // Sign the packet before sending
        log('Signed packet');
        try {
                const response = await axios.post(`${webServerUrl}/${route}`, { packet: packetData }, {
                    headers: {
                        Authorization: signedPacket
                    }
                });
                log('Packet sent successfully:', JSON.stringify(response.data));
                return response.data; // Return the response data for further processing if needed
            } catch (error) {
                log('Failed to send packet', error.toString());
                throw error; // Rethrow the error to be handled by the caller
            }
    }
    catch (error) {
        log('Error signing packet:', error.toString());
        throw error; // Rethrow the error to be handled by the caller
    }
}

function signPacket(packetData, webServerUrl, secretKey) {
    let token;
    if (webServerUrl && secretKey) {
        token = jwt.sign({ packetData }, secretKey, { expiresIn: '1h' });
        log('Generated JWT token:', token);
    } else if (!webServerUrl || !secretKey) {
        log('WebServerUrl or secretKey is not defined. JWT token cannot be generated.');
    } else {
        log('A secret third thing happened with the signing of the packet. Weird.');
    }
    return token; // Return the generated token for use in the request
}

module.exports = { assemble, sendPacketToLocalClients, sendPacketToWeb };