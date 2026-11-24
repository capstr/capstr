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

// Ad-hoc sign the whole .app bundle after packaging.
// Without this the app only has a linker signature, which Gatekeeper reports as "damaged"
// on other Macs. A full ad-hoc signature lets users allow it via right-click > Open
// or System Settings > Privacy & Security > Open Anyway (no notarization needed).
const { execSync } = require('child_process');
const path = require('path');

exports.default = async function (context) {
    if (context.electronPlatformName !== 'darwin') return;
    const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
    console.log(`Ad-hoc signing ${appPath}`);
    execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
};
