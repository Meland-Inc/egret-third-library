exports.init = function (mainWindow) {
    const ipcMain = require('electron').ipcMain;
    const dialog = require('electron').dialog;
    const fs = require('fs');

    const removeSpaces = require('strman').removeSpaces;
    const replace = require('strman').replace;
    const substr = require('strman').substr;
    const toStudlyCaps = require('strman').toStudlyCaps;
    const toCamelCase = require('strman').toCamelCase;
    const leftTrim = require('strman').leftTrim;
    const rightTrim = require('strman').rightTrim;
    const trim = require('strman').trim;
    const toLowerCase = require('strman').toLowerCase;
}