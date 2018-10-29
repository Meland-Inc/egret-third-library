<template>
  <mu-container >
    <div class="button-wrapper">
      <mu-button v-loading="isImportDefaultLoading" data-mu-loading-size="24" color="pink500" @click="importDefault">导入default配置</mu-button>
      <mu-button v-loading="isImportAsyncLoading" data-mu-loading-size="24" color="orange500" @click="importAsync">导入async配置</mu-button>
      <mu-button v-loading="isImportMapDataLoading" data-mu-loading-size="24" color="cyan500" @click="importMapData">导入mapData配置</mu-button>
    </div>
    <div class="button-wrapper">
      <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
    </div>
  </mu-container>
</template>

<script>
let exec = require("child_process").exec;
const ipcRenderer = require("electron").ipcRenderer;
const fs = require("fs");
const path = require("path");

export default {
  data() {
    return {
      project_path: "",
      isImportDefaultLoading: false,
      isImportAsyncLoading: false,
      isImportMapDataLoading: false
    };
  },
  watch: {},
  methods: {
    async importDefault() {
      this.isImportDefaultLoading = true;
      try {
        let default_folder_path = this.project_path + "/resource/assets";
        let defaultConfig = {
          groups: [
            { name: "preload", keyArr: [], keys: "" },
            { name: "fairyGui", keyArr: [], keys: "" },
            { name: "loading", keyArr: [], keys: "" }
          ],
          resources: []
        };
        await this.importFolderFile(default_folder_path, defaultConfig);

        for (const iterator of defaultConfig.groups) {
          let keys = "";
          for (let i = 0; i < iterator.keyArr.length; i++) {
            const element = iterator.keyArr[i];
            if (i == iterator.keyArr.length - 1) {
              keys += element;
            } else {
              keys += element + ",";
            }
            iterator.keys = keys;
          }
          delete iterator.keyArr;
        }

        let content = JSON.stringify(defaultConfig);
        let configPath = this.project_path + "/resource/default.res.json";
        await fs.writeFileSync(configPath, content);

        this.isImportDefaultLoading = false;
        ipcRenderer.send("client_show_message", "导入default成功");
      } catch (error) {
        this.isImportDefaultLoading = false;
        ipcRenderer.send("client_show_snack", "导入default错误:" + error);
      }
    },
    async importAsync() {
      this.isImportAsyncLoading = true;
      try {
        let async_folder_path = this.project_path + "/resource/async";
        let asyncConfig = {
          groups: [],
          resources: []
        };
        await this.importFolderFile(async_folder_path, asyncConfig);
        let content = JSON.stringify(asyncConfig);
        let configPath = this.project_path + "/resource/async.res.json";
        await fs.writeFileSync(configPath, content);

        this.isImportAsyncLoading = false;
        ipcRenderer.send("client_show_message", "导入async成功");
      } catch (error) {
        this.isImportAsyncLoading = false;
        ipcRenderer.send("client_show_snack", "导入async错误:" + error);
      }
    },
    async importMapData() {
      this.isImportMapDataLoading = true;

      try {
        let map_data_folder_path = this.project_path + "/resource/mapData";
        let mapDataConfig = {
          groups: [],
          resources: []
        };
        await this.importFolderFile(map_data_folder_path, mapDataConfig);
        let content = JSON.stringify(mapDataConfig);
        let configPath = this.project_path + "/resource/mapData.res.json";
        await fs.writeFileSync(configPath, content);

        this.isImportMapDataLoading = false;
        ipcRenderer.send("client_show_message", "导入mapData成功");
      } catch (error) {
        this.isImportMapDataLoading = false;
        ipcRenderer.send("client_show_snack", "导入mapData错误:" + error);
      }
    },
    async oneForAll() {
      ipcRenderer.send("client_show_loading");
      try {
        await this.importDefault();
        await this.importAsync();
        await this.importMapData();

        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_message", "One·for·All Success");
        ipcRenderer.send("client_show_dialog", "One·for·All Success");
      } catch (error) {
        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_snack", "One·for·All Error:" + error);
      }
    },
    async importFolderFile(folderPath, config, group = "", isSheet = false) {
      let files = await fs.readdirSync(folderPath);
      for (const file of files) {
        let curPath = folderPath + "/" + file;
        let stat = await fs.statSync(curPath);
        if (stat.isDirectory()) {
          if (file == "preload" || file == "loading" || file == "fairyGui") {
            group = file;
          } else if (
            group == "preload" ||
            group == "loading" ||
            group == "fairyGui"
          ) {
          } else {
            group = "";
          }

          if (file == "sheet") {
            isSheet = true;
          } else {
            isSheet = false;
          }
          await this.importFolderFile(curPath, config, group, isSheet);
        } else {
          await this.importSingleFile(curPath, config, group, isSheet);
        }
      }
    },
    async importSingleFile(filePath, config, group, isSheet) {
      let relative = path.relative(this.project_path + "/resource", filePath);
      let url = relative.replace(/\\/g, "/");
      let parsedPath = path.parse(filePath);
      let extname = parsedPath.ext;
      let type = this.getType(extname, isSheet);
      let name = parsedPath.name + extname.replace(".", "_");
      let addToGroup = false;
      if (!isSheet || extname == ".json") {
        addToGroup = true;
        if (isSheet) {
          let subkeys = "";
          let content = await fs.readFileSync(filePath);
          let contentObj = JSON.parse(content);

          if (contentObj.frames) {
            let isfirst = true;
            for (const key in contentObj.frames) {
              if (isfirst) {
                subkeys += key;
                isfirst = false;
              } else {
                subkeys += "," + key;
              }
            }
          }
          config.resources.push({
            name: name,
            type: type,
            url: url,
            subkeys: subkeys
          });
        } else {
          config.resources.push({ name: name, type: type, url: url });
        }

        switch (group) {
          case "":
            break;
          default:
            for (const iterator of config.groups) {
              if (iterator.name == group) {
                iterator.keyArr.push(name);
              }
            }
            break;
        }
      }
    },
    getType(extname, isSheet) {
      if (isSheet) {
        return "sheet";
      }
      switch (extname) {
        case ".json":
          return "json";
        case ".fnt":
          return "font";
        case ".txt":
        case ".proto":
          return "text";
        case ".mp3":
        case ".wav":
        case ".m4a":
          return "sound";
        case ".png":
        case ".jpg":
        case ".jpeg":
        case ".bmp":
        case ".gif":
          return "image";
        default:
          return "bin";
          break;
      }
    }
  },
  mounted() {
    this.project_path = localStorage.getItem("client_project_path");
  }
};
</script>