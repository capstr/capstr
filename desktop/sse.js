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

//MANAGES SSE CLIENTS - REGISTRATION, HEARTBEAT, AND BROADCASTING TO CONNECTED BROWSERS

//IMPORTS
const express = require('express');
const appRouter = express.Router();
const { log } = require('./log.js');

// REGISTRY OF CURRENTLY CONNECTED SSE CLIENTS - PRIVATE TO THIS MODULE
let clients = [];

// ACCEPT A NEW SSE CONNECTION, REGISTER IT, AND REMOVE IT WHEN THE BROWSER DISCONNECTS
appRouter.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const clientId = Date.now();
    clients.push({ id: clientId, res });

    req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
    });
});


// END EVERY OPEN SSE STREAM - USED ON SERVER SHUTDOWN
function endSSEStreams() {
    clients.forEach(client => client.res.end());
}

// SEND A NO-OP PING TO EVERY CLIENT SO CONNECTIONS AREN'T DROPPED FOR SITTING IDLE
function sendSSEPing() {
    try {
        clients.forEach(client => {
            if (!client.res.finished) {
                client.res.write(`data: {"keepAlive": true}\n\n`);
                log('ping sent');
            }
        });
    } catch (error) {
        log('Error in setInterval: ' + error);
    }
};

// BROADCAST A PACKET TO EVERY CONNECTED CLIENT
function sendSSEMessage(packet) {
        clients.forEach(client => client.res.write(packet));
}

// START THE HEARTBEAT - RUNS AUTOMATICALLY AS SOON AS THIS MODULE IS REQUIRED
setInterval(() => { sendSSEPing(); }, 15000);

// METHODS FOR USE IN OTHER MODULES
module.exports = { appRouter, endSSEStreams, sendSSEPing, sendSSEMessage,};