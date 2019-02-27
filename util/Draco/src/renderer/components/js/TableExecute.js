import * as iconv from 'iconv-lite';
import * as fsExc from "./FsExecute.js";

export async function readCsvContent(path) {
    let content = await fsExc.readFile(path, null);
    let buffer = new Buffer(content, 'gbk');
    return iconv.decode(buffer, 'gbk');
}

export async function getCsvCells(path) {
    // let content = await fsExc.readFile(path, null);
    // let buffer = new Buffer(content, 'gbk');
    // content = iconv.decode(buffer, 'gbk');

    let content = await readCsvContent(path);
    return csvToArray(content);
}

function csvToArray(strData, strDelimiter = undefined) {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    let objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );

    // Create an array to hold our data. Give the array
    // a default empty first row.
    let arrVect = [[]];
    let arrDict = [{}];
    let arrIndex = 0;
    let dictIndex = 0;

    // Create an array to hold our individual pattern
    // matching groups.
    let arrMatches = null;

    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {
        // Get the delimiter that was found.
        let strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
            // Since we have reached a new row of data,
            // add an empty row to our data array.
            if (arrIndex < 3) {
                arrVect.push([]);
                arrIndex++;
            } else {
                arrDict.push({});
                dictIndex = 0;
            }

        }

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        let strMatchedValue;
        if (arrMatches[2]) {
            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");
        } else {
            // We found a non-quoted value.
            strMatchedValue = arrMatches[3];
        }

        // Now that we have our value string, let's add
        // it to the data array.

        strMatchedValue = strMatchedValue.replace(/(^\s*)|(\s*$)/g, "");//去除首尾空格

        // strMatchedValue = strMatchedValue.replace(/\s+/g, ""); //FIXME:暂时注释，不知道会有什么影响
        if (arrIndex < 3) {
            arrVect[arrVect.length - 1].push(strMatchedValue);
        } else {
            if (arrVect[1][dictIndex] === "null" || arrVect[1][dictIndex] === ""
                || arrVect[2][dictIndex] === "null" || arrVect[2][dictIndex] === "") {
                dictIndex++;
                continue;
            }
            if (arrVect[2][dictIndex] === "bool") {
                strMatchedValue = (strMatchedValue === "0" || strMatchedValue === "") ? false : true;
            } else if (arrVect[2][dictIndex] === "bool[]") {
                strMatchedValue = strMatchedValue === "" ? [] : strMatchedValue.split(",");
                for (let i = 0; i < strMatchedValue.length; i++) {
                    strMatchedValue[i] = (strMatchedValue[i] === "0" || strMatchedValue[i] === "") ? false : true;
                }
            } else if (arrVect[2][dictIndex] === "bool[][]") {
                strMatchedValue = strMatchedValue === "" ? [] : strMatchedValue.split(";");
                for (let i = 0; i < strMatchedValue.length; i++) {
                    strMatchedValue[i] = strMatchedValue[i].split(",");
                    for (let j = 0; j < strMatchedValue[i].length; j++) {
                        strMatchedValue[i][j] = (strMatchedValue[i][j] === "0" || strMatchedValue[i][j] === "") ? false : true;
                    }
                }
            } else if (arrVect[2][dictIndex] === "string") {
                //reserve 不用赋值
            } else if (arrVect[2][dictIndex] === "string[]") {
                strMatchedValue = strMatchedValue === "" ? [] : strMatchedValue.split(",");
            } else if (arrVect[2][dictIndex] === "string[][]") {
                strMatchedValue = strMatchedValue === "" ? [] : strMatchedValue.split(";");
                for (let i = 0; i < strMatchedValue.length; i++) {
                    strMatchedValue[i] = strMatchedValue[i].split(",");
                }
            } else if (arrVect[2][dictIndex] === "int" || arrVect[2][dictIndex] === "float") {
                strMatchedValue = strMatchedValue === "" ? 0 : parseFloat(strMatchedValue);
            } else if (arrVect[2][dictIndex] === "int[]" || arrVect[2][dictIndex] === "float[]") {
                strMatchedValue = strMatchedValue === "" ? [] : strMatchedValue.split(",");
                for (let i = 0; i < strMatchedValue.length; i++) {
                    strMatchedValue[i] = parseFloat(strMatchedValue[i]);
                }
            } else if (arrVect[2][dictIndex] === "int[][]" || arrVect[2][dictIndex] === "float[][]") {
                strMatchedValue = strMatchedValue === "" ? [] : strMatchedValue.split(";");
                for (let i = 0; i < strMatchedValue.length; i++) {
                    strMatchedValue[i] = strMatchedValue[i].split(",");
                    for (let j = 0; j < strMatchedValue[i].length; j++) {
                        strMatchedValue[i][j] = parseFloat(strMatchedValue[i][j]);
                    }
                }
            } else {
                //reserve
            }
            arrDict[arrDict.length - 1][arrVect[1][dictIndex]] = strMatchedValue;
            dictIndex++;
        }
    }

    // Return the parsed data.
    arrDict.pop();
    return (arrDict);
}