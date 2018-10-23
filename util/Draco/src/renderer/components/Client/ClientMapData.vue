<template>
  <mu-container >
    <div class="button-wrapper">
      <mu-button v-loading="isUpdateSvnLoading" data-mu-loading-size="24" color="pink500" @click="updateSvn">更新svn文件</mu-button>
      <mu-button v-loading="isExecuteFileLoading" data-mu-loading-size="24" color="orange500" @click="executeBatFile">执行bat文件</mu-button>
      <mu-button v-loading="isClearFileLoading" data-mu-loading-size="24" color="cyan500" @click="clearMapDataFile">清空mapData文件</mu-button>
      <mu-button v-loading="isCopyFileLoading" data-mu-loading-size="24" color="blue500" @click="copyMapDataFile">拷贝mapData文件</mu-button>
    </div>
    <div class="button-wrapper">
      <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
    </div>
  </mu-container>
</template>

<script>
let exec = require("child_process").exec;
const ipcRenderer = require("electron").ipcRenderer;
const remote = require("electron").remote;
const fs = require("fs");
const spawn = require("child_process").spawn;
const archiver = require("archiver");
const path = require("path");

const map_data_suffix_path = "/resource/mapData";
export default {
  data() {
    return {
      project_path: "",
      map_data_path: "",
      isUpdateSvnLoading: false,
      isExecuteFileLoading: false,
      isClearFileLoading: false,
      isCopyFileLoading: false
    };
  },
  watch: {},
  methods: {
    updateSvn() {
      return new Promise((resolve, reject) => {
        this.isUpdateSvnLoading = true;

        let process = spawn("svn", ["update"], { cwd: this.map_data_path });
        process.stdout.on("data", data => {
          console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
          console.log("stderr: " + data);
        });

        process.on("exit", code => {
          if (code == 0) {
            this.isUpdateSvnLoading = false;
            ipcRenderer.send("client_show_message", "更新mapData成功");
            resolve();
          } else {
            this.isUpdateSvnLoading = false;
            ipcRenderer.send("client_show_snack", "更新mapData错误:" + code);
            reject();
          }
        });
      });
    },
    executeBatFile(showDialog = true) {
      return new Promise((resolve, reject) => {
        this.isExecuteFileLoading = true;

        let process = spawn("MapDataBatchProcess.bat", [], {
          cwd: this.map_data_path + "/"
        });
        process.stdout.on("data", data => {
          console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
          console.log("stderr: " + data);
        });
        process.on("exit", code => {
          if (code == 0) {
            this.isExecuteFileLoading = false;
            ipcRenderer.send("client_show_message", "执行bat成功");
            if (showDialog) {
              ipcRenderer.send("client_show_dialog", "执行bat成功");
            }
            resolve();
          } else {
            this.isExecuteFileLoading = false;
            ipcRenderer.send("client_show_snack", "执行bat错误:" + code);
            if (showDialog) {
              ipcRenderer.send("client_show_dialog", "执行bat错误:" + code);
            }
            reject();
          }
        });
      });
    },
    async clearMapDataFile() {
      this.isClearFileLoading = true;

      let map_data_path = this.project_path + map_data_suffix_path;
      try {
        let files = await fs.readdirSync(map_data_path);
        for (const file of files) {
          let curPath = map_data_path + "/" + file;
          let stat = await fs.statSync(curPath);
          if (!stat.isDirectory()) {
            await fs.unlinkSync(curPath);
          }
        }

        ipcRenderer.send("client_show_message", "清空文件成功");
        this.isClearFileLoading = false;
      } catch (error) {
        ipcRenderer.send("client_show_snack", "清空文件失败,错误码:" + error);
        this.isClearFileLoading = false;
      }
    },
    async copyMapDataFile() {
      this.isCopyFileLoading = true;

      let copy_from_path = this.map_data_path + "/out";
      let copy_to_path = this.project_path + map_data_suffix_path;
      try {
        let exists = await fs.existsSync(copy_to_path);
        if (!exists) {
          await fs.mkdirSync(copy_to_path);
        }

        await this.folderCopyFile(copy_from_path, copy_to_path);
        this.isCopyFileLoading = false;
        ipcRenderer.send("client_show_message", "拷入文件成功");
      } catch (error) {
        this.isCopyFileLoading = false;
        ipcRenderer.send("client_show_snack", "拷入文件错误:" + error);
      }
    },
    async oneForAll() {
      let arr = [];
      ipcRenderer.send("client_show_loading");
      try {
        await this.updateSvn();
        await this.executeBatFile(false);
        await this.clearMapDataFile();
        await this.copyMapDataFile();

        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_message", "One·for·All Success");
        ipcRenderer.send("client_show_dialog", "One·for·All Success");
      } catch (e) {
        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_snack", "One·for·All Error:" + e);
      }
    },
    async folderCopyFile(fromPath, targetPath) {
      try {
        let files = await fs.readdirSync(fromPath);
        for (const file of files) {
          let pathName = path.join(fromPath, file);
          let stat = await fs.statSync(pathName);
          if (stat.isDirectory()) {
            await this.folderCopyFile(pathName, targetPath);
          } else {
            await this.copyFile(pathName, targetPath + "/" + file);
          }
        }
      } catch (error) {
        ipcRenderer.send(
          "client_show_snack",
          "copy " + fromPath + " to " + targetPath + " Error:" + error
        );
      }
    },
    async copyFile(filePath, targetFolderPath) {
      try {
        let content = await fs.readFileSync(filePath);
        await fs.writeFileSync(targetFolderPath, content);
      } catch (error) {
        ipcRenderer.send(
          "client_show_snack",
          "copy " + filePath + " to " + targetFolderPath + " Error:" + error
        );
      }
    }
  },
  mounted() {
    this.project_path = localStorage.getItem("client_project_path");
    this.map_data_path =
      localStorage.getItem("client_svn_path") + "/client/mapdata";
  }
};
</script>