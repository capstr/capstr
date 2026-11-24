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

//WRITE LOGS TO A FILE IN THE USER'S HOME DIRECTORY IN A FOLDER CALLED /CAPSTR

//IMPORTS
const path = require('path');
const fs = require('fs');
const os = require('os');


//GET THE LOG DIRECTORY AND FILE PATHS
const logDir = path.join(os.homedir(), 'capstr');
const serverLogFile = path.join(logDir, 'server.log');

//MAKE THE LOG DIRECTORY IF IT DOESN'T EXIST
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

//CREATE A WRITE STREAM FOR THE LOG FILE
const logStream = fs.createWriteStream(serverLogFile, { flags: 'a' });

//WRITE AN ENTRY TO THE LOG FILE
const log = (message) => {
    try {
        console.log(message);
        logStream.write(`${new Date().toISOString()} - ${message}\n`);
    } catch (err) {
        console.error(`Failed to write to log file: ${err.message}`);
    }
};

//METHOD FOR USE IN OTHER MODULES
module.exports = { log };