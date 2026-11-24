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
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const secretKey = process.env.SECRET_KEY;

let receivedPacket = '';
let clients = [];
let venue = "capstr";
let showname = "this show";
let primarylang;
let languages = [];
let numLangs;
// tracked separately from the relayed caption packets, since that's the only place holding state arrives
let holding = true;

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).send('Access Denied');
    }

    try {
        const verified = jwt.verify(token, secretKey);
        req.user = verified;
        next();
    } catch (error) {
        console.error('Invalid token', error);
        res.status(400).send('Invalid Token');
    }
};

app.post('/receive-packet', authenticateJWT, (req, res) => {
    receivedPacket = req.body.packet;
    console.log('Packet received:', receivedPacket);

    // receivedPacket is the SSE-formatted string ("data: {...}\n\n") straight from the local
    // server's packet.js — relayed byte-for-byte to clients below, but also peeked at here so
    // /show-setup-client can report current holding state between caption updates
    try {
        const parsed = JSON.parse(receivedPacket.replace(/^data:\s*/, '').trim());
        if (parsed.holding !== undefined) {
            holding = parsed.holding;
        }
    } catch (error) {
        // not JSON (e.g. a keep-alive ping) or malformed — ignore, nothing to update
    }

    // Send the update to all connected clients
    clients.forEach(client => client.res.write(receivedPacket));

    res.status(200).send('Packet received');
});

app.post('/show-setup', authenticateJWT, (req, res) => {
    receivedPacket = req.body.packet;
    try {
        const parsedData = JSON.parse(receivedPacket);
        console.log('Parsed Data:', parsedData);

        venue = parsedData.venue;
        showname = parsedData.showname;
        primarylang = parsedData.primarylang;
        languages = parsedData.languages;
        numLangs = parsedData.numLangs;

        console.log('Venue:', venue);
        console.log('Show Name:', showname);

        res.status(200).send('Setup received');
    } catch (error) {
        console.error('Error parsing JSON:', error);
        res.status(400).send('Invalid JSON format');
    }
});

app.get('/show-setup-client', (req, res) => {
    const showSetupData = {
        venue: venue,
        showname: showname,
        primarylang: primarylang,
        languages: languages,
        numLangs: numLangs,
        holding: holding
    };

    res.status(200).json(showSetupData);
});

app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send an initial message to confirm connection
    //res.write(`data: Connected\n\n`);

    const clientId = Date.now();
    clients.push({ id: clientId, res });

    req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
    });
});

// Send keep-alive messages to clients
setInterval(() => {
    try {
        clients.forEach(client => {
            if (!client.res.finished) {
                client.res.write('data: {"keepAlive": true}\n\n');
                console.log("ping sent");
            }
        });
    } catch (error) {
        console.error('Error in setInterval:', error);
    }
}, 15000);

app.listen(port, () => {
    const message = `Web server is running on port ${port}`;
    console.log(message);
});
