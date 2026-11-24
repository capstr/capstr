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

//MANAGES ENQUIRY OF IO ROUTES - IPS, PORTS, SERIAL PORTS, ETC

//IMPORTS
const { log } = require('./log.js');

// PULL PORT FOR LOCAL SERVER FROM ELECTRON OR SET DEFAULT TO 3001 IF NOT SET
function getLocalPort() {
    const localPort = process.env.PORT || 3001;
    return localPort;   
}

// PULL SERVER IP FOR LOCAL SERVER FROM ELECTRON OR SET DEFAULT TO 127.0.0.1 IF NOT SET
function getServerIp() {
    return process.env.SELECTED_ADAPTER_IP || '127.0.0.1';
}

// PULL SERIAL PORT FOR LED BOARD FROM ELECTRON OR THROW ERROR
function getSerial() {
    try {
        const serialPort = process.env.SELECTED_SERIAL_PORT || '';
        log(`Selected Serial Port: ${serialPort}`);
        return serialPort;
    } catch (error) {
        log('Error getting serial port: ' + error);
}}

// PULL UDP PORT AND IP FOR OSC (CURRENTLY HARDCODED TO 8000 AND 127.0.0.1 FOR NOW)
function getUDP() {
    return {remoteAddress: "127.0.0.1", remotePort: 8000};
}

// METHODS FOR USE IN OTHER MODULES
module.exports = { getSerial, getServerIp, getUDP, getLocalPort };
