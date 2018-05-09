<template>
    <div>
        <mu-raised-button label="裁剪纹理" class="demo-snackbar-button" @click="splitTexture" primary/>
        <mu-raised-button label="打包纹理" class="demo-snackbar-button" @click="packerTexture" primary/>
    </div>
</template>

<script>
let exec = require("child_process").exec;
const ipcRenderer = require("electron").ipcRenderer;
const remote = require("electron").remote;
const iconv = require("iconv-lite");
const fs = require("fs");
const PNG = require("pngjs").PNG;
const jimp = require("jimp");
const input_suffix_path = "/TextureInput/object";
const output_suffix_path = "/TextureOutput/object";
const object_csv = "/Object.csv";
export default {
  data() {
    return {
      project_path: "",
      csv_path: "",
      texture_path: "",
      objectCells: []
    };
  },
  watch: {},
  methods: {
    splitTexture() {
      let input_path = this.texture_path + input_suffix_path;
      let output_path = this.texture_path + output_suffix_path;
      let object_csv_path = this.csv_path + object_csv;
      if (this.objectCells.length == 0) {
        let content = fs.readFileSync(object_csv_path);
        let buffer = new Buffer(content, "gbk");
        content = iconv.decode(buffer, "gbk");
        this.objectCells = CSVToArray(content);
      }

      for (let i = 0; i < this.objectCells.length; i++) {
        const element = this.objectCells[i];
        let id = element.id;
        let area = element.area;

        jimp
          .read(input_path + "/" + id + ".png")
          .then(oimg => {
            let iw = oimg.bitmap.width;
            let ih = oimg.bitmap.height;
            let th = 60;
            let tw = 120;
            let high = element.tileHigh;
            let lengthY = high + th;
            let lengthX = 0;
            let trow = 0;
            let tcol = 2;
            let ox = iw - tcol * tw / 2 - tw / 2;
            let oy = ih - th - high;

            if (area.length == 1 && area[0].length == 1) {
              oimg.write(output_path + "/" + id + ".png");
              return;
            }

            for (let m = area.length - 1; m >= 0; m--) {
              for (let n = area[m].length - 1; n >= 0; n--) {
                let cx =
                  ox +
                  (area.length - 1 - m - (area[m].length - 1 - n)) * tw / 2;
                let cy =
                  oy - (area.length - 1 - m + area[m].length - 1 - n) * th / 2;

                let aimg = this.createPng(
                  oimg,
                  iw,
                  ih,
                  tw,
                  th,
                  high,
                  lengthX,
                  lengthY,
                  cx,
                  cy
                );
                aimg.write(output_path + "/" + id + "_" + m + "_" + n + ".png");
              }
            }
          })
          .catch(function(err) {
            console.error(err);
          });
      }
    },
    createPng(oimg, iw, ih, tw, th, high, lengthX, lengthY, cx, cy) {
      let type = 1;
      let sx = 0;
      let sy = 0;
      let aimg = new jimp(tw, th + high);
      for (let m = sy; m <= lengthY; m++) {
        for (let n = sx; n <= lengthX; n++) {
          let px = cx + n + tw / 2;
          let py = cy + m;
          let hex;
          if (px < 0 || px > iw || py < 0 || py > ih) {
            hex = 0;
          } else {
            hex = oimg.getPixelColor(px, py);
          }
          // hex = 3904926462;
          aimg.setPixelColor(hex, n + tw / 2, m);
        }
        switch (type) {
          case 1:
            sx -= 2;
            if (sx <= -tw / 2) {
              type = 2;
            }
            break;
          case 2:
            if (m > high + th / 2) {
              type = 3;
            }
            break;
          case 3:
            sx += 2;
            break;
          default:
            break;
        }
        lengthX = Math.abs(sx);
      }

      return aimg;
    },
    packerTexture() {}
  },
  mounted() {
    this.project_path = localStorage.getItem("client_project_path");
    this.csv_path = localStorage.getItem("client_csv_path");
    this.texture_path = localStorage.getItem("client_texture_path");
  }
};

// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function CSVToArray(strData, strDelimiter = undefined) {
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = strDelimiter || ",";

  // Create a regular expression to parse the CSV values.
  let objPattern = new RegExp(
    // Delimiters.
    "(\\" +
      strDelimiter +
      "|\\r?\\n|\\r|^)" +
      // Quoted fields.
      '(?:"([^"]*(?:""[^"]*)*)"|' +
      // Standard fields.
      '([^"\\' +
      strDelimiter +
      "\\r\\n]*))",
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
  while ((arrMatches = objPattern.exec(strData))) {
    // Get the delimiter that was found.
    let strMatchedDelimiter = arrMatches[1];

    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (strMatchedDelimiter.length && strMatchedDelimiter != strDelimiter) {
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
      strMatchedValue = arrMatches[2].replace(new RegExp('""', "g"), '"');
    } else {
      // We found a non-quoted value.
      strMatchedValue = arrMatches[3];
    }

    // Now that we have our value string, let's add
    // it to the data array.

    strMatchedValue = strMatchedValue.replace(/\s+/g, "");
    if (arrIndex < 3) {
      arrVect[arrVect.length - 1].push(strMatchedValue);
    } else {
      if (arrVect[1][dictIndex] === "null") {
        return;
      }
      if (arrVect[2][dictIndex] === "bool") {
        strMatchedValue = strMatchedValue === "0" || "" ? false : true;
      } else if (arrVect[2][dictIndex] === "string[]") {
        strMatchedValue =
          strMatchedValue === "" ? [] : strMatchedValue.split(",");
      } else if (arrVect[2][dictIndex] === "string[][]") {
        strMatchedValue =
          strMatchedValue === "" ? [] : strMatchedValue.split(";");
        for (let i = 0; i < strMatchedValue.length; i++) {
          strMatchedValue[i] = strMatchedValue[i].split(",");
        }
      } else if (
        arrVect[2][dictIndex] === "int" ||
        arrVect[2][dictIndex] === "float"
      ) {
        strMatchedValue =
          strMatchedValue === "" ? 0 : parseFloat(strMatchedValue);
      } else if (
        arrVect[2][dictIndex] === "int[]" ||
        arrVect[2][dictIndex] === "float[]"
      ) {
        strMatchedValue =
          strMatchedValue === "" ? [] : strMatchedValue.split(",");
        for (let i = 0; i < strMatchedValue.length; i++) {
          strMatchedValue[i] = parseFloat(strMatchedValue[i]);
        }
      } else if (
        arrVect[2][dictIndex] === "int[][]" ||
        arrVect[2][dictIndex] === "float[][]"
      ) {
        strMatchedValue =
          strMatchedValue === "" ? [] : strMatchedValue.split(";");
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
  return arrDict;
}
</script>

<style lang="css">
.demo-snackbar-button {
  margin: 12px;
}

.demo-table-item-select-field {
  margin-top: 12px;
}

.content {
  overflow: hidden;
}

.content-left {
  width: 20%;
  float: left;
  background-color: white;
  margin-bottom: -4000px;
  padding-bottom: 4000px;
}

.content-right {
  width: 80%;
  display: inline-block;
  float: right;
  padding: 10px 20px;
  background-color: rgba(0, 0, 0, 0);
}
</style>