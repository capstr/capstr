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



function textToHex(text) {
    // Add carriage return at the start
    //let LEDcolor = "31" -> unsure why i'm setting this here?
    
    text = replaceCurlyApostrophe(text);
    // Convert each character to its hexadecimal representation
    const hexString = Buffer.from(text, 'utf8').toString('hex');

    return hexString;
}

function breakAtSpaces(text, limit) {
    if (text.length <= limit) {
        return text; // Base case: if the text is within the limit, return as is
    }

    // Find the last space before the limit
    const breakpoint = text.lastIndexOf(" ", limit);

    // If no space is found, break at the limit
    const splitPoint = breakpoint === -1 ? limit : breakpoint;

    // Split at the breakpoint and recursively process the rest of the string
    return text.slice(0, splitPoint) + "\n" + breakAtSpaces(text.slice(splitPoint).trim(), limit);
}

function keepSetLines(text, lineNum) {
    const lines = text.split("\n"); // Split the string into an array of lines
    return lines.slice(0, lineNum).join("\n"); // Keep only the first 3 lines and join them back
}

function replaceCurlyApostrophe(text) {
    return text
    .replace(/’/g, "'")  // Replace curly apostrophes
    .replace(/“|”/g, '"'); // Replace curly quotes (both opening and closing) with straight quotes
}

function formatForOSC(text, limit, lineNum) {
    // Replace curly apostrophes and quotes with straight ones
    text = keepSetLines(replaceCurlyApostrophe(breakAtSpaces(text, limit)), lineNum);
    return text;
}


module.exports = {
    textToHex,
    breakAtSpaces,
    keepSetLines,
    replaceCurlyApostrophe,
    formatForOSC
};