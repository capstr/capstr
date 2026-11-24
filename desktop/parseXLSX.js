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

const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Get the file path from the command line arguments
const filePath = process.argv[2];

// Read the Excel file
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert the worksheet to JSON
const captionsData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

// Extract the headers (column titles)
const headers = captionsData[0];
const showfileActions = require('./showfileActions.js');


const formattedCaptions = []
const linetypes = {};
const characters = {};

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

// A header starting with '*' marks a language/line column; the rest of the header text
// is that language's display name. This lets language columns be told apart from other
// column types (type, character, and whatever gets added later) by name, not position.
const languageColumnIndices = headers
  .map((header, index) => ({ header, index }))
  .filter(({ header }) => typeof header === 'string' && header.startsWith('*'))
  .map(({ index }) => index);

const languages = languageColumnIndices.map(index => headers[index].slice(1));

captionsData.slice(1).forEach(row => {

  const type = row[headers.indexOf('type')] !== undefined
  ? row[headers.indexOf('type')].toLowerCase()
  : "spoken";

  const character = row[headers.indexOf('character')] !== undefined
  ? row[headers.indexOf('character')].toUpperCase()
  : "DEFAULT";

  // One entry per language column, in the same order as `languages`
  const lineArray = languageColumnIndices.map(index => row[index] || '');

  const caption = {
    line: lineArray,
    character: character,
    'line-type': type,
    flag: false // Add the flag field with a default value of false
  };

  formattedCaptions.push(caption);
  linetypes[type] = { ...blankFormat};

  if (type != "title") {
  characters[character] = { color: '#ffffff', font: 'default'};
  }


})

// Read the existing JSON file
//const showfilePath = path.join(__dirname, 'showfile.capstr');
//const showfile = JSON.parse(fs.readFileSync(showfilePath, 'utf8'));
const showfilePath = showfileActions.filepath;
const showfile = showfileActions.load();

// Overwrite the captions in the showfile
showfile.captions = formattedCaptions;

// Add or overwrite the characters array in the showfile
showfile.characters = characters;

//Add or overwrite linetypes array into the showfile
showfile.linetypes = linetypes;

// Refactor the showinfo object. Keep whichever language was already set as primary if this
// show still has it after re-import; otherwise default to the first language column found.
const existingPrimary = showfile.showinfo['primary-language'];
const chosenPrimary = languages.includes(existingPrimary) ? existingPrimary : languages[0];

showfile.showinfo = {
  name: showfile.showinfo.name,
  venue: showfile.showinfo.venue,
  'primary-language': chosenPrimary,
  languages: languages
};

// Pushes the primary language to index 0 of showinfo.languages and of every caption's
// line array, then writes the updated JSON back to the file.
showfileActions.setPrimaryLanguage(showfile, chosenPrimary);

console.log('Captions, characters, and show info updated successfully!');
