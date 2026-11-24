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

const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Construct the path to package.json in the parent directory
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const appVersion = packageJson.version;

window.onload = () => {
    ipcRenderer.invoke('get-network-adapters').then(adapters => {
        const selectElement = document.getElementById('adapterSelect');
        adapters.forEach(adapter => {
            const option = document.createElement('option');
            option.value = adapter.address;
            option.textContent = `${adapter.name} (${adapter.address})`;
            selectElement.appendChild(option);
        });
    });

    // Request the list of serial ports from the main process
    ipcRenderer.invoke('get-serial-ports').then(ports => {
        const serialPortSelect = document.getElementById('serialPortSelect');
        ports.forEach(port => {
            const option = document.createElement('option');
            option.value = port.path;
            option.textContent = `${port.path} (${port.manufacturer || 'Unknown'})`;
            serialPortSelect.appendChild(option);
        });
    });

   document.getElementById('appVersion').textContent = `Version: ${appVersion}`;
};

function selectAdapter() {
    const selectedAdapter = document.getElementById('adapterSelect').value;
    const selectedPort = document.getElementById('networkPortInput').value;
    const selectedSerial = document.getElementById('serialPortSelect').value;
    ipcRenderer.send('adapter-selected', selectedAdapter, selectedPort, selectedSerial);
}

