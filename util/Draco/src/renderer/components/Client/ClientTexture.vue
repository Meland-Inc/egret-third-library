<template>
    <div>
        <mu-container>
          <div class="button-wrapper">
            <!-- <mu-button v-loading="isCheckTextureLoading" data-mu-loading-size="24" color="primary" @click="checkTexture">检查纹理</mu-button> -->
            <mu-button v-loading="isUpdateSvnLoading" data-mu-loading-size="24" color="pink500" @click="updateSvn">更新svn文件</mu-button>
            <mu-button v-loading="isClearTextureLoading" data-mu-loading-size="24" color="orange500" @click="clearTexture">清空纹理</mu-button>
            <mu-button v-loading="isCopyTextureInLoading" data-mu-loading-size="24" color="cyan500" @click="copyTextureIn">拷入纹理</mu-button>
            <mu-button v-loading="isSplitTextureLoading" data-mu-loading-size="24" color="blue500" @click="splitTexture">裁剪纹理</mu-button>
            <mu-button v-loading="isPackerTextureLoading" data-mu-loading-size="24" color="purple500" @click="packerTexture">打包纹理</mu-button>
            <mu-button v-loading="isCopyTextureOutLoading" data-mu-loading-size="24" color="green500" @click="copyTextureOut">拷出纹理</mu-button>
          </div>
          <div class="button-wrapper">
            <mu-button full-width color="red500" @click="oneForAll">One·for·All</mu-button>
          </div>
        </mu-container>
        <mu-container>
          <div class="select-control-group" >
            <mu-flex class="select-control-row">
              <mu-checkbox label="全选" :input-value="checkAll" @change="handleCheckAll" :checked-icon="checkBoxData.length < checkBoxValues.length ? 'indeterminate_check_box' : undefined"></mu-checkbox>
            </mu-flex>
            <mu-flex class="select-control-row" :key="checkBoxValue" v-for="checkBoxValue in checkBoxValues">
              <mu-checkbox :value="checkBoxValue" v-model="checkBoxData" :label="checkBoxValue"></mu-checkbox>
            </mu-flex>
          </div>
        </mu-container>
    </div>
</template>

<script>
let exec = require("child_process").exec;
const ipcRenderer = require("electron").ipcRenderer;
const remote = require("electron").remote;
const spawn = require("child_process").spawn;
const iconv = require("iconv-lite");
const fs = require("fs");
const path = require("path");
const PNG = require("pngjs").PNG;
const jimp = require("jimp");
const input_suffix_path = "/TextureInput/object";
const output_suffix_path = "/TextureOutput/object";
const sheet_suffix_path = "/TextureSheet";

const object_csv = "/Object.csv";
const copy_in_path_arr = [
  "/settings/resource/object",
  "/settings/resource/object_varia"
];
export default {
  data() {
    return {
      project_path: "",
      svn_path: "",
      csv_path: "",
      art_path: "",
      texture_path: "",
      objectCells: [],
      isUpdateSvnLoading: false,
      isCheckTextureLoading: false,
      isCopyTextureInLoading: false,
      isClearTextureLoading: false,
      isSplitTextureLoading: false,
      isPackerTextureLoading: false,
      isCopyTextureOutLoading: false,

      checkBoxValues: [
        "itemIcon",
        "mapcell",
        "material",
        "object",
        "objectDecorate"
      ],
      checkBoxData: [
        "itemIcon",
        "mapcell",
        "material",
        "object",
        "objectDecorate"
      ],
      checkAll: true
    };
  },
  watch: {},
  methods: {
    handleCheckAll() {
      this.checkAll = !this.checkAll;
      if (this.checkAll) {
        this.checkBoxData = this.checkBoxValues.concat();
      } else {
        this.checkBoxData.length = 0;
      }
    },
    checkTexture() {
      return new Promise((resolve, reject) => {
        this.isCheckTextureLoading = true;
        let object_csv_path = this.csv_path + object_csv;
        if (this.objectCells.length == 0) {
          let content = fs.readFileSync(object_csv_path);
          let buffer = new Buffer(content, "gbk");
          content = iconv.decode(buffer, "gbk");
          this.objectCells = this.CSVToArray(content);
        }

        let existsTextureFunc = (cells, index, input_path, reject) => {
          let filePath = input_path + "/" + cells[index].texture + ".png";
          if (!fs.existsSync(filePath)) {
            isCheckTextureLoading = false;
            ipcRenderer.send(
              "client_show_snack",
              "检查图片错误,不存在该图片" + cells[index].texture + ".png"
            );
            reject();
          } else {
            if (index < cells.length) {
              index++;
              existsTextureFunc(cells, index, input_path, reject);
            }
          }
        };

        let input_path = this.art_path + input_suffix_path;
        existsTextureFunc(this.objectCells, 0, input_path, reject);

        isCheckTextureLoading = false;
        ipcRenderer.send("client_show_message", "检查图片成功");
        resolve();
      });
    },
    updateSvn() {
      return new Promise((resolve, reject) => {
        this.isUpdateSvnLoading = true;
        let resource_path = this.svn_path + "/settings/resource";
        let process = spawn("svn", ["update"], { cwd: resource_path });
        process.stdout.on("data", data => {
          console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
          console.log("stderr: " + data);
        });

        process.on("exit", code => {
          if (code == 0) {
            this.isUpdateSvnLoading = false;
            ipcRenderer.send("client_show_message", "更新svn成功");
            resolve();
          } else {
            this.isUpdateSvnLoading = false;
            ipcRenderer.send("client_show_snack", "更新svn错误:" + code);
            reject();
          }
        });
      });
    },
    clearTexture() {
      return new Promise(async (resolve, reject) => {
        this.isClearTextureLoading = true;
        let input_path = this.art_path + input_suffix_path;
        let output_path = this.art_path + output_suffix_path;
        try {
          await this.deleteFolder(input_path);
          await this.deleteFolder(output_path);
          this.isClearTextureLoading = false;
          ipcRenderer.send("client_show_message", "清空纹理成功");
          resolve();
        } catch (error) {
          this.isClearTextureLoading = false;
          ipcRenderer.send("client_show_snack", "清空纹理失败,错误码:" + error);
          reject();
        }
      });
    },
    copyTextureIn() {
      return new Promise(async (resolve, reject) => {
        this.isCopyTextureInLoading = true;
        let input_path = this.art_path + input_suffix_path;
        try {
          if (!fs.existsSync(input_path)) {
            fs.mkdirSync(input_path);
          }
          for (const iterator of copy_in_path_arr) {
            let copy_in_path = this.svn_path + iterator;
            await this.folderCopyFile(copy_in_path, input_path);
          }
          this.isCopyTextureInLoading = false;
          ipcRenderer.send("client_show_message", "拷入纹理成功");
          resolve();
        } catch (error) {
          this.isCopyTextureInLoading = false;
          ipcRenderer.send("client_show_snack", "拷入纹理错误:" + error);
          reject();
        }
      });
    },
    splitTexture() {
      return new Promise((resolve, reject) => {
        this.isSplitTextureLoading = true;

        let input_path = this.art_path + input_suffix_path;
        let output_path = this.art_path + output_suffix_path;
        let object_csv_path = this.csv_path + object_csv;
        if (this.objectCells.length == 0) {
          let content = fs.readFileSync(object_csv_path);
          let buffer = new Buffer(content, "gbk");
          content = iconv.decode(buffer, "gbk");
          this.objectCells = this.CSVToArray(content);
        }

        this.jimpPng(
          this.objectCells,
          0,
          input_path,
          output_path,
          resolve,
          reject
        );
      });
    },
    jimpPng(cells, index, input_path, output_path, resolve, reject) {
      const element = cells[index];
      let id = element.id;
      let area = element.area;
      let texture = element.texture;
      let filePath = input_path + "/" + texture + ".png";

      if (!fs.existsSync(filePath)) {
        // console.error("文件不存在:" + filePath);
        this.loopJimp(cells, index, input_path, output_path, resolve, reject);
        return;
      }

      jimp
        .read(filePath)
        .then(oimg => {
          let iw = oimg.bitmap.width;
          let ih = oimg.bitmap.height;
          let th = 60;
          let tw = 120;
          let trow = area.length;
          let tcol = area[0].length;

          if (area.length == 1 && area[0].length == 1) {
            oimg.write(output_path + "/" + texture + ".png", (error, img) => {
              if (!error) {
                this.loopJimp(
                  cells,
                  index,
                  input_path,
                  output_path,
                  resolve,
                  reject
                );
              }
            });

            return;
          }

          for (let m = area.length - 1; m >= 0; m--) {
            for (let n = area[m].length - 1; n >= 0; n--) {
              /**
               * type
               * 1:
               *  /\
               *  \/
               *
               * 2:
               *  ____
               *  |  |
               *  |  |
               *  |  |
               *   \/
               *
               * 3:
               *  ____
               *  ||
               *  ||
               *  | \
               *   \/
               *
               * 4:
               *  ____
               *    ||
               *    ||
               *   / |
               *   \/
               */
              let type;
              let sx;
              let sy;
              let gridHeight;
              let itemHigh;
              let lengthX;
              if (m != 0 && n != 0) {
                type = 1;
                sx = 0;
                sy = 0;
                itemHigh = 0;
                gridHeight = ih - ((trow + tcol) * th) / 2 + 10;
                lengthX = 0;
              } else if (m == 0 && n == 0) {
                type = 2;
                sx = -tw / 2;
                sy = (-(m + n) * th) / 2;
                itemHigh = ((m + n) * th) / 2;
                lengthX = tw / 2;
              } else if (n == 0) {
                type = 3;
                sx = -tw / 2;
                sy = (-(m + n) * th) / 2;
                itemHigh = ((m + n) * th) / 2;
                lengthX = 0;
              } else if (m == 0) {
                type = 4;
                sx = 0;
                sy = (-(m + n) * th) / 2;
                itemHigh = ((m + n) * th) / 2;
                lengthX = tw / 2;
              } else {
                //reserve
              }

              gridHeight = ih - ((trow + tcol) * th) / 2 + itemHigh + 10;
              let ox = iw - (trow * tw) / 2 - tw / 2;
              let oy = ih - th - gridHeight;
              let lengthY = gridHeight + th;
              let cx =
                ox +
                ((area.length - 1 - m - (area[m].length - 1 - n)) * tw) / 2;
              let cy =
                oy - ((area.length - 1 - m + area[m].length - 1 - n) * th) / 2;

              // if (m == 0 || n == 0) {
              //   //最高点 特殊处理 加初始y 加lengthY
              //   // cy = oy - ((area.length - 1 + area[m].length - 1) * th) / 2;
              //   sx = -tw / 2;
              //   sy = (-(m + n) * th) / 2;
              //   gridHeight = ih - ((trow + tcol) * th) / 2 + ((m + n) * th) / 2 + 10;

              //   type = 2;
              // }

              let aimg = new jimp(tw, th + gridHeight);
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

                if (type == 1 && m <= gridHeight + th / 2) {
                  sx -= 2;
                  lengthX = Math.abs(sx);
                }

                if (type == 3 && m > itemHigh) {
                  lengthX += 2;
                }

                if (type == 4 && m > itemHigh) {
                  sx -= 2;
                }

                if (m > gridHeight + th / 2) {
                  sx += 2;
                  lengthX = Math.abs(sx);
                  // lengthX += 2;
                }
              }

              aimg.write(
                output_path + "/" + texture + "_" + m + "_" + n + ".png"
              );
            }
          }
          this.loopJimp(cells, index, input_path, output_path, resolve, reject);
        })
        .catch(error => {
          this.isSplitTextureLoading = false;
          ipcRenderer.send("client_show_snack", "裁剪纹理错误:" + error);
          reject();
        });
    },
    loopJimp(cells, index, input_path, output_path, resolve, reject) {
      if (index < cells.length - 1) {
        index++;
        this.jimpPng(cells, index, input_path, output_path, resolve, reject);
      } else {
        this.isSplitTextureLoading = false;
        ipcRenderer.send("client_show_message", "裁剪纹理成功");
        resolve();
      }
    },

    /**
     * @param type
     * 1:
     *  /\
     *  \/
     *
     * 2:
     *  ____
     *  |  |
     *  |  |
     *  |  |
     *   \/
     *
     * 3:
     *  ____
     *  ||
     *  ||
     *  | \
     *   \/
     *
     * 4:
     *  ____
     *    ||
     *   / |
     *   \/
     */
    createPng(
      oimg,
      iw,
      ih,
      tw,
      th,
      gridHeight,
      lengthX,
      lengthY,
      cx,
      cy,
      sx,
      sy,
      type
    ) {
      if (type == 2) {
        sx = -tw / 2;
      }

      let aimg = new jimp(tw, th + gridHeight);
      let overHalf = false;
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

        if (m > gridHeight + th / 2) {
          overHalf = true;
        }

        if (overHalf) {
          sx += 2;
        }
        // switch (type) {
        //   case 1:
        //     sx -= 2;
        //     if (sx <= -tw / 2) {
        //       type = 2;
        //     }
        //     break;
        //   case 2:
        //     if (m > gridHeight + th / 2) {
        //       type = 3;
        //     }
        //     break;
        //   case 3:
        //     break;
        //   default:
        //     break;
        // }
        lengthX = Math.abs(sx);
      }

      return aimg;
    },
    copyTextureOut() {
      return new Promise((resolve, reject) => {
        this.isCopyTextureOutLoading = true;
        let sheet_path = this.art_path + sheet_suffix_path;
        try {
          for (const iterator of this.checkBoxData) {
            let pa = fs.readdirSync(sheet_path);
            for (let i = 0; i < pa.length; i++) {
              const element = pa[i];
              if (
                element.indexOf(iterator + "-") != -1 &&
                (element.indexOf(".png") != -1 ||
                  element.indexOf(".json") != -1)
              ) {
                let inputPath = sheet_path + "/" + element;
                let outputPath =
                  this.project_path +
                  "/resource/assets/preload/sheet/" +
                  element;
                // if (iterator == "itemIcon") {
                //   outputPath =
                //     this.project_path +
                //     "/resource/assets/icon/" +
                //     iterator +
                //     "/" +
                //     element;
                // } else {
                //   outputPath =
                //     this.project_path +
                //     "/resource/assets/map/" +
                //     iterator +
                //     "/" +
                //     element;
                // }
                this.copyFile(inputPath, outputPath);
              }
            }
          }

          this.isCopyTextureOutLoading = false;
          ipcRenderer.send("client_show_message", "拷出纹理成功");
          resolve();
        } catch (error) {
          this.isCopyTextureOutLoading = false;
          ipcRenderer.send("client_show_snack", "拷出纹理错误:" + error);
          reject();
        }
      });
    },
    async packerTexture() {
      this.isPackerTextureLoading = true;
      try {
        for (const iterator of this.checkBoxData) {
          let inputs = [];
          let output;
          switch (iterator) {
            case "itemIcon":
              inputs.push(this.svn_path + "/settings/resource/item_icon");
              break;
            case "mapcell":
              inputs.push(this.svn_path + "/settings/resource/mapcell");
              break;
            case "material":
              inputs.push(this.svn_path + "/settings/resource/material");
              break;
            case "object":
              inputs.push(this.art_path + output_suffix_path);
              break;
            case "objectDecorate":
              inputs.push(this.svn_path + "/settings/resource/objectDecorate");
              break;
            default:
              break;
          }
          output = this.art_path + sheet_suffix_path + "/" + iterator;
          await this.packerTextureOnce(inputs, output);
        }

        this.isPackerTextureLoading = false;
        ipcRenderer.send("client_show_message", "打包纹理成功");
      } catch (error) {
        this.isPackerTextureLoading = false;
        ipcRenderer.send("client_show_snack", "打包纹理错误:" + error);
      }
    },

    packerTextureOnce(inputs, output) {
      return new Promise((resolve, reject) => {
        let objectCmd = this.getCmdPackerTexture(inputs, output);
        exec(objectCmd, (error, stdout, stderr) => {
          if (error) {
            this.isPackerTextureLoading = false;
            ipcRenderer.send("client_show_snack", "处理纹理错误:" + inputs);
            reject();
          } else {
            ipcRenderer.send("client_show_message", "处理纹理成功:" + inputs);
            resolve();
          }
        });
      });
    },

    getCmdPackerTexture(inputPaths, outputPath) {
      let cmd =
        "texturePacker" +
        " --multipack" +
        " --sheet" +
        " " +
        outputPath +
        "-{n}.png" +
        " --data" +
        " " +
        outputPath +
        "-{n}.json" +
        " --texture-format png" +
        " --format Egret" +
        " --max-size 1024" +
        " --algorithm MaxRects" +
        " --maxrects-heuristics Best" +
        " --size-constraints WordAligned" +
        " --pack-mode Best" +
        " --shape-padding 1" +
        " --border-padding 1" +
        " --trim-mode Trim" +
        " --disable-rotation" +
        " --trim-margin 1" +
        " --opt RGBA8888" +
        " --scale 1" +
        " --scale-mode Smooth" +
        " --alpha-handling KeepTransparentPixels";

      for (const iterator of inputPaths) {
        cmd += " " + iterator;
      }

      return cmd;
    },
    async oneForAll() {
      ipcRenderer.send("client_show_loading");
      try {
        await this.updateSvn();
        if (this.checkBoxData.indexOf("object") != -1) {
          await this.clearTexture();
          await this.copyTextureIn();
          await this.splitTexture();
        }
        await this.packerTexture();
        await this.copyTextureOut();

        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_message", "One·for·All Success");
        ipcRenderer.send("client_show_dialog", "One·for·All Success");
      } catch (e) {
        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_snack", "One·for·All Error:" + e);
      }
    },

    deleteFolder(path) {
      return new Promise((resolve, reject) => {
        try {
          let files = [];
          if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach((file, index) => {
              let curPath = path + "/" + file;
              if (fs.statSync(curPath).isDirectory()) {
                // recurse
                this.deleteFolder(curPath);
              } else {
                // delete file
                fs.unlinkSync(curPath);
              }
            });
            fs.rmdirSync(path);
          }

          resolve();
        } catch (error) {
          ipcRenderer.send(
            "client_show_snack",
            "deleteFolder " + path + " Error:" + error
          );
          reject();
        }
      });
    },
    copyFile(filePath, targetFolderPath) {
      return new Promise((resolve, reject) => {
        try {
          fs.writeFileSync(targetFolderPath, fs.readFileSync(filePath));
          resolve();
        } catch (error) {
          ipcRenderer.send(
            "client_show_snack",
            "copyt " + filePath + " to " + targetFolderPath + " Error:" + error
          );
          reject();
        }
      });
    },
    folderCopyFile(fromPath, targetPath) {
      return new Promise((resolve, reject) => {
        try {
          fs.readdirSync(fromPath).forEach(file => {
            let pathName = path.join(fromPath, file);
            if (fs.statSync(pathName).isDirectory()) {
              this.folderCopyFile(pathName, targetPath);
            } else {
              this.copyFile(pathName, targetPath + "/" + file);
            }
          });
          resolve();
        } catch (error) {
          ipcRenderer.send(
            "client_show_snack",
            "copyt " + fromPath + " to " + targetPath + " Error:" + error
          );
          reject();
        }
      });
    },

    CSVToArray(strData, strDelimiter = undefined) {
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
          if (
            arrVect[1][dictIndex] === "null" ||
            arrVect[1][dictIndex] === "" ||
            arrVect[2][dictIndex] === "null" ||
            arrVect[2][dictIndex] === ""
          ) {
            dictIndex++;
            continue;
          }
          if (arrVect[2][dictIndex] === "bool") {
            strMatchedValue =
              strMatchedValue === "0" || strMatchedValue === "" ? false : true;
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
  },
  mounted() {
    this.project_path = localStorage.getItem("client_project_path");
    this.svn_path = localStorage.getItem("client_svn_path");
    this.csv_path = localStorage.getItem("client_svn_path") + "/settings/csv";
    this.art_path = localStorage.getItem("client_svn_path") + "/art";
  }
};

// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
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
  padding: 10px 20px;
  background-color: rgba(0, 0, 0, 0);
}

.select-control-row {
  padding: 8px 0;
}
.select-control-group {
  margin: 16px 0;
}
</style>