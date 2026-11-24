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

//IMPORTS
const { log } = require('./log.js');
const fs = require('fs');
const path = require('path');

// Define the paths for showfile.json and blankshowfile.json
const filepath = path.join(__dirname, 'showfile.capstr');
const blankshowfilePath = path.join(__dirname, 'blankshowfile.capstr');

// Load the showfile.capstr JSON file into memory as parsed object
const load = () => {
    try {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (error) {
        console.error('Error loading showfile.capstr:', error);
        log('Error loading showfile.capstr: ' + error);
        process.exit(1);
    }
};

// Write changes back to the showfile.capstr file after editing
const write = (showfile) => {
    fs.writeFileSync(filepath, JSON.stringify(showfile, null, 2), 'utf8');
}


// Check if showfile.capstr exists, if not copy blankshowfile.capstr to showfile.capstr
const test = () => {
    if (!fs.existsSync(filepath)) {
        try {
            fs.copyFileSync(blankshowfilePath, filepath);
            log('showfile.capstr did not exist, copied blankshowfile.capstr to showfile.capstr');
        } catch (error) {
            log('Error copying blankshowfile.capstr to showfile.capstr:', error);
            process.exit(1);
        }
    }
}

// Copy a existing capstr formatted showfile to the internal showfile.capstr file
const upload = (uploadPath) => {
    fs.renameSync(uploadPath, filepath);
}


// LINE EDITING FUNCTIONS

const updateLine = (showfile, index, updatedLine, updatedChar, oldChar, linetype) => {
    // line is [primary language, ...translations]; only the primary slot is editable here
    if (!Array.isArray(showfile.captions[index].line)) {
        showfile.captions[index].line = [showfile.captions[index].line || ''];
    }
    showfile.captions[index].line[0] = updatedLine;
    showfile.captions[index].character = updatedChar;
    if (!showfile.characters[updatedChar]) {
        showfile.characters[updatedChar] = { color: '#ffffff', font: 'default' };
    }
    showfile.captions[index]['line-type'] = linetype;
    checkCharacterExists(showfile, oldChar);
    write(showfile);
}

function checkCharacterExists(showfile, oldChar) {
    const stillUsed = showfile.captions.some(c => c.character === oldChar);
    if (!stillUsed) {
        delete showfile.characters[oldChar];
    }
}

const splitLine = (showfile, index, line1, line2) => {
    const index2 = index + 1;
    // clone so both halves keep whatever translations the original line had;
    // only the primary (line[0]) differs between the two resulting lines
    const original = showfile.captions[index].line;
    const originalLine = Array.isArray(original) ? original : [original || ''];
    const newLine = { ...showfile.captions[index], line: [...originalLine] };
    showfile.captions[index].line = [...originalLine];
    showfile.captions[index].line[0] = line1;
    showfile.captions.splice(index2, 0, newLine);
    showfile.captions[index2].line[0] = line2;
    write(showfile);
}

const deleteLine = (showfile, index, oldChar) => {
    showfile.captions.splice(index, 1);
    checkCharacterExists(showfile, oldChar);
    write(showfile);
}

// Moves `name` to index 0 of showinfo.languages and of every caption's line array (the
// "primary" slot), swapping it with whatever was there. No-op reordering if `name` is
// already primary or isn't a known language, but still records/writes primary-language.
const setPrimaryLanguage = (showfile, name) => {
    const languages = showfile.showinfo.languages;
    if (Array.isArray(languages)) {
        const targetIndex = languages.indexOf(name);
        if (targetIndex > 0) {
            [languages[0], languages[targetIndex]] = [languages[targetIndex], languages[0]];
            showfile.captions.forEach(caption => {
                if (Array.isArray(caption.line)) {
                    [caption.line[0], caption.line[targetIndex]] = [caption.line[targetIndex], caption.line[0]];
                }
            });
        }
        if (languages.includes(name)) {
            showfile.showinfo['primary-language'] = name;
        }
    }
    write(showfile);
}

const addLinetype = (showfile, linetype) => {
    const blankFormat = {
        underline: false,
        bold: false,
        italics: false,
        caps: false,
        brackets: false,
        notes: false,
        'small-caps': false,
        'square-brackets': false,
    }
    showfile.linetypes[linetype] = { ...blankFormat};
    write(showfile);
}

// Methods for use in other modules
module.exports = { load, upload, filepath, write, test, updateLine, splitLine, deleteLine, addLinetype, setPrimaryLanguage };