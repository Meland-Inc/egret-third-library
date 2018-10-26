<template>
  <mu-container >
    <div class="button-wrapper">
      <mu-button v-loading="isUpdateSvnLoading" data-mu-loading-size="24" color="pink500" @click="updateSvn">更新svn文件</mu-button>
      <mu-button v-loading="isZipCsvLoading" data-mu-loading-size="24" color="orange500" @click="zipCsv">压缩csv文件</mu-button>
      <mu-button v-loading="isCreateTsLoading" data-mu-loading-size="24" color="cyan500" @click="createTs">生成ts文件</mu-button>
    </div>
    <div class="button-wrapper">
      <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
    </div>
  </mu-container>
</template>

<script>
const ipcRenderer = require("electron").ipcRenderer;
const remote = require("electron").remote;
const fs = require("fs");
const removeSpaces = require("strman").removeSpaces;
const replace = require("strman").replace;
const spawn = require("child_process").spawn;
const iconv = require("iconv-lite");
const toStudlyCaps = require("strman").toStudlyCaps;
const archiver = require("archiver");

export default {
  data() {
    return {
      project_path: "",
      csv_path: "",
      isUpdateSvnLoading: false,
      isZipCsvLoading: false,
      isCreateTsLoading: false
    };
  },
  watch: {},
  methods: {
    updateSvn() {
      return new Promise((resolve, reject) => {
        this.isUpdateSvnLoading = true;

        let process = spawn("svn", ["update"], { cwd: this.csv_path });
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
    zipCsv() {
      return new Promise((resolve, reject) => {
        this.isZipCsvLoading = true;

        let pa = fs.readdirSync(this.csv_path);
        let archive = archiver("zip");
        let fileName = "csv.zip";
        let filePath = this.project_path + "/resource/assets/csv/";
        let output = fs.createWriteStream(filePath + fileName);
        archive.pipe(output);

        for (let i = 0; i < pa.length; i++) {
          const element = pa[i];
          if (element.indexOf(".csv") != -1) {
            archive.append(fs.createReadStream(this.csv_path + "/" + element), {
              name: element
            });
          }
        }

        archive.on("error", error => {
          this.isZipCsvLoading = false;
          ipcRenderer.send("client_show_snack", "压缩zip错误:" + error);
          reject();
        });
        output.on("close", () => {
          this.isZipCsvLoading = false;
          ipcRenderer.send("client_show_message", "压缩zip成功");
          resolve();
        });
        archive.finalize();
      });
    },
    async createTs() {
      this.isCreateTsLoading = true;
      let pa = await fs.readdirSync(this.csv_path);
      for (let i = 0; i < pa.length; i++) {
        const element = pa[i];
        if (element.indexOf(".csv") != -1) {
          let data = await fs.readFileSync(this.csv_path + "/" + element);
          let buffer = new Buffer(data, "gbk");
          data = iconv.decode(buffer, "gbk");
          if (!data) {
            let error = name + "表数据为空";
            alert(error);
            throw error;
          }
          let clsName = toStudlyCaps(element.split(".csv")[0]);
          let cellContent = this.createCell(clsName, data);
          try {
            fs.writeFile(
              this.project_path + "/src/csv/cell/" + clsName + "Cell.ts",
              cellContent,
              error => {
                if (error) {
                  ipcRenderer.send(
                    "client_show_message",
                    "生成" + clsName + "cell.ts文件失败"
                  );
                }
              }
            );
          } catch (error) {
            this.isCreateTsLoading = false;
            ipcRenderer.send(
              "client_show_snack",
              "生成" + clsName + "cell.ts文件错误:" + error
            );
            return;
          }

          let tableContent = this.createTable(clsName);
          let filePath =
            this.project_path + "/src/csv/table/" + clsName + "Table.ts";
          if (await fs.existsSync(filePath)) {
            //已存在，不创建
            break;
          }
          try {
            fs.writeFile(filePath, tableContent, error => {
              if (error) {
                ipcRenderer.send(
                  "client_show_message",
                  "生成" + clsName + "Table.ts文件失败"
                );
              }
            });
          } catch (error) {
            this.isCreateTsLoading = false;
            ipcRenderer.send(
              "client_show_snack",
              "生成" + clsName + "Table.ts文件错误:" + error
            );
            return;
          }
        }
      }

      this.isCreateTsLoading = false;
      ipcRenderer.send("client_show_message", "生成ts文件成功");
    },

    createCell(name, data) {
      data = data.toString();
      let content = "";

      let preContent =
        "/**\r\n" +
        " * @author 雪糕\r\n" +
        " * @desc " +
        name +
        "表结构体\r\n" +
        " *\r\n" +
        " */\r\n" +
        "class " +
        name +
        "Cell {\r\n";
      let endContent = "\tpublic constructor() {\r\n" + "\t}\r\n" + "}";
      let centerContent = "";
      let rows = data.split("\r\n");
      if (rows.length < 3) {
        let content = name + "表数据格式错误";
        alert(content);
        throw content;
      }
      let descs = rows[0].split(",");
      let attrs = rows[1].split(",");
      let types = rows[2].split(",");
      if (
        !descs ||
        descs.length == 0 ||
        !attrs ||
        attrs.length == 0 ||
        !types ||
        types.length == 0
      ) {
        let content = name + "表数据格式错误";
        alert(content);
        throw content;
      }

      for (let i = 0; i < attrs.length; i++) {
        if (attrs[i] === "") {
          continue;
        }
        let desc = descs[i] ? descs[i] : "";
        let type = "";
        if (types[i]) {
          switch (types[i]) {
            case "int":
            case "float":
              type = "number";
              break;
            case "string":
              type = "string";
              break;
            case "bool":
              type = "boolean";
              break;

            case "int[]":
            case "float[]":
              type = "number[]";
              break;
            case "int[][]":
            case "float[][]":
              type = "number[][]";
              break;
            case "string[]":
              type = "string[]";
              break;
            case "string[][]":
              type = "string[][]";
              break;
            case "bool[]":
              type = "boolean[]";
              break;
            case "bool[][]":
              type = "boolean[][]";
              break;
            case "null":
              type = "any";
              break;

            default:
              let content = `${name} 表里有未知类型:${types[i]} -- 字段名: ${
                descs[i]
              }`;
              alert(content);
              throw content;
              return;
              type = "any";
              break;
          }
        } else {
          type = "any";
        }

        if (attrs[i] != "null") {
          centerContent += "\t/** " + desc + " */\r\n";
          centerContent += "\tpublic " + attrs[i] + ": " + type + ";\r\n";
        }
      }

      content = preContent + centerContent + endContent;
      return content;
    },

    createTable(name) {
      let content =
        "/**\r\n" +
        " * @author 雪糕\r\n" +
        " * @desc " +
        name +
        "表\r\n" +
        " *\r\n" +
        " */\r\n" +
        "class " +
        name +
        "Table {\r\n" +
        "	private _cells: " +
        name +
        "Cell[];\r\n" +
        "\r\n" +
        "	//单例-----------\r\n" +
        "	private static _instance: " +
        name +
        "Table;\r\n" +
        "	public static get instance(): " +
        name +
        "Table {\r\n" +
        "		if (!this._instance) {\r\n" +
        "			this._instance = new " +
        name +
        "Table();\r\n" +
        "		}\r\n" +
        "		return this._instance;\r\n" +
        "	}\r\n" +
        "\r\n" +
        "	public constructor() {\r\n" +
        "	}\r\n" +
        "\r\n" +
        "	/** 解析数据 */\r\n" +
        "	public analysis(data: any[]): void {\r\n" +
        "		this._cells = data;\r\n" +
        "	}\r\n" +
        "\r\n" +
        "\tpublic getCellById(id: number): " +
        name +
        "Cell {\r\n" +
        "\t\tlet cell = this.tryCellById(id);\r\n" +
        "\t\tif (!cell) {\r\n" +
        "\t\t\tLogger.error(LOG_TAG.Config, '" +
        name +
        "Table id: ' + id + ' is null');\r\n" +
        "\t\t}\r\n" +
        "\t\treturn cell;\r\n" +
        "\t}\r\n" +
        "\r\n" +
        "\tpublic tryCellById(id: number): " +
        name +
        "Cell {\r\n" +
        "\t\tfor (let i: number = 0; i < this._cells.length; i++) {\r\n" +
        "\t\t\tlet cell: " +
        name +
        "Cell = this._cells[i];\r\n" +
        "\t\t\tif (cell.id === id) {\r\n" +
        "\t\t\t\treturn cell;\r\n" +
        "\t\t\t}\r\n" +
        "\t\t}\r\n" +
        "\t\treturn null;\r\n" +
        "\t}\r\n" +
        "}\r\n";
      return content;
    },

    async oneForAll() {
      let arr = [];
      ipcRenderer.send("client_show_loading");
      try {
        await this.updateSvn();
        await this.zipCsv();
        await this.createTs();

        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_message", "One·for·All Success");
      } catch (e) {
        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_snack", "One·for·All Error:" + e);
      }
    }
  },
  mounted() {
    this.project_path = localStorage.getItem("client_project_path");
    this.csv_path = localStorage.getItem("client_svn_path") + "/settings/csv";
  }
};
</script>