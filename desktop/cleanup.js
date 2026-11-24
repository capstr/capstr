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

// cleanup.js

const bonjour = require("bonjour");

let serverProcess = null;
let bonjourService = null;

function setServerProcess(proc) {
    serverProcess = proc;
}

function setBonjourService(service) {
    bonjourService = service;
}

function cleanup({ log = console.log } = {}) {
    log('Running cleanup...');
    
    if (serverProcess) {
        log('Killing server process...');
        serverProcess.kill('SIGTERM');
        serverProcess = null;
    }

    if (bonjourService) {
        log('Stopping Bonjour service...');
        bonjourService.stop(() => {
            log('Bonjour service stopped.');
        });
        bonjourService = null;
    }


}

module.exports = {
    setServerProcess,
    setBonjourService,
    cleanup
};
