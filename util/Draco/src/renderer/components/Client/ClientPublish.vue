<template>
  <div>
    <mu-container >
      <div class="button-wrapper">
        <mu-button v-loading="isPublishProjectLoading" data-mu-loading-size="24" color="pink500" @click="onPublishProjectClick">发布当前项目</mu-button>
        <mu-button v-loading="isMergeVersionLoading" data-mu-loading-size="24" color="orange500" @click="onMergetVersionClick">比较新旧版本</mu-button>
        <mu-button v-loading="isExportVersionLoading" data-mu-loading-size="24" color="cyan500" @click="onExportVersionClick">导出其他版本</mu-button>
        <mu-button v-loading="isExportApkLoading" data-mu-loading-size="24" color="blue500" @click="onExportApkClick">导出apk</mu-button>
        <mu-button v-loading="isExportIpaLoading" data-mu-loading-size="24" color="blue500" @click="onExportIpaClick">导出ipa</mu-button>
      </div>
      <div class="button-wrapper">
        <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
      </div>
    </mu-container>
    <mu-container>
      <div>
          <mu-flex class="flex-wrapper" align-items="center">
            <mu-col span="12" lg="2" sm="4">
              <mu-text-field class="text-version" v-model="cur_game_version" label="发布版本号" label-float/>
            </mu-col>
            <mu-col span="12" lg="2" sm="4">
              <mu-text-field class="text-version" v-model="cur_display_version" label="显示版本号" label-float/>
            </mu-col>
            <mu-col span="12" lg="2" sm="4">
              <mu-select label="选择类型" filterable v-model="versionType" label-float full-width>
                <mu-option v-for="type,index in versionTypes" :key="type" :label="type" :value="type"></mu-option>
              </mu-select>
            </mu-col>
              <mu-flex class="flex-wrapper">
                <mu-checkbox label="全选" :input-value="checkAll" @change="handleCheckAll" :checked-icon="checkBoxData.length < checkBoxValues.length ? 'indeterminate_check_box' : undefined"></mu-checkbox>
              </mu-flex>
              <mu-flex class="flex-wrapper" :key="checkBoxValue" v-for="checkBoxValue in checkBoxValues">
                <mu-checkbox :value="checkBoxValue" v-model="checkBoxData" :label="checkBoxValue"></mu-checkbox>
              </mu-flex>
          </mu-flex>
      </div>
      <div class="control-group">
        <!-- <mu-row gutter> -->
          <!-- <mu-col span="12" lg="2" sm="6">
            <mu-text-field class="text-version" v-model="new_version" label="新版本号" :disabled="true" />
          </mu-col>
          <mu-col span="12" lg="8" sm="6">
            <mu-text-field class="text-path" v-model="new_version_path" label="新版本目录" @change="onNewVersionPathChange" label-float />
          </mu-col>
          <mu-col span="2" lg="2" sm="6">
            <mu-button color="pink500" @click="onNewVersionClick">选择</mu-button>
          </mu-col> -->

          <mu-select label="新版本号" filterable v-model="new_version" @change="onNewVersionChange" label-float full-width>
            <mu-option v-for="value,index in newVersionList" :key="value" :label="value" :value="value"></mu-option>
          </mu-select>
          <!-- <mu-auto-complete :data="newVersionList" label="新版本号" v-model="new_version" open-on-focus></mu-auto-complete> -->

          <!-- <mu-select label="新版本号" filterable v-model="new_version" full-width>
            <mu-option v-for="value,index in newVersionList" :key="value" :label="value" :value="value"></mu-option>
          </mu-select> -->
        <!-- </mu-row> -->
      </div>
      <div class="control-group">
        <!-- <mu-row gutter>
          <mu-col span="12" lg="2" sm="6">
            <mu-text-field class="text-version" v-model="old_version" label="旧版本号" :disabled="true" />
          </mu-col>
          <mu-col span="12" lg="8" sm="6">
            <mu-text-field class="text-path" v-model="old_version_path" label="旧版本目录" @change="onOldVersionPathChange" label-float />
          </mu-col>
          <mu-col span="2" lg="2" sm="6">
            <mu-button color="orange500" @click="onOldVersionClick">选择</mu-button>
          </mu-col>
        </mu-row> -->
        <mu-select label="旧版本号" filterable v-model="old_version"  @change="onOldVersionChange" label-float full-width>
          <mu-option v-for="value,index in oldVersionList" :key="value" :label="value" :value="value"></mu-option>
        </mu-select>
          <!-- <mu-auto-complete :data="oldVersionList" label="旧版本号" @change="onOldVersionChange" v-model="old_version" open-on-focus></mu-auto-complete> -->
      </div>
      <div class="control-group">
        <mu-row gutter>
          <mu-col span="12" lg="8" sm="6">
            <mu-text-field class="text-path" v-model="cdn_path" label="CDN目录" label-float />
          </mu-col>
        </mu-row>
      </div>
    </mu-container>
  </div>
</template>

<script>
const exec = require("child_process").exec;
const ipcRenderer = require("electron").ipcRenderer;
const remote = require("electron").remote;
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const spawn = require("child_process").spawn;

const thmFilePath = "resource/default.thm.json";
const defaultResPath = "resource/default.res.json";
const mapDataResPath = "resource/mapData.res.json";
const asyncResPath = "resource/async.res.json";

export default {
  data() {
    return {
      project_path: "",
      publish_path: "",
      isPublishProjectLoading: false,
      isMergeVersionLoading: false,
      isExportVersionLoading: false,
      isExportApkLoading: false,
      isExportIpaLoading: false,
      publish_version: "",
      new_version: "",
      new_version_path: "",
      old_version: "",
      old_version_path: "",
      cur_game_version: "",
      cur_display_version: "",
      cdn_path: "",
      android_path: "",
      ios_path: "",
      wechat_path: "",
      svn_path:"",
      versionType: "",
      versionTypes: ["强制更新", "选择更新", "静态更新"],
      checkBoxValues: ["Android端", "IOS端", "小游戏端"],
      checkBoxData: [],
      checkAll: true,

      newVersionList: [],
      oldVersionList: []
    };
  },
  watch: {
    cdn_path: (val, oldVal) => {
      if (val != oldVal) {
        localStorage.setItem("client_cdn_path", val);
      }
    }
  },
  methods: {
    handleCheckAll() {
      this.checkAll = !this.checkAll;
      if (this.checkAll) {
        this.checkBoxData = this.checkBoxValues.concat();
      } else {
        this.checkBoxData.length = 0;
      }
    },
    onNewVersionChange() {
      this.new_version_path =
        this.project_path + "/bin-release/web/" + this.new_version;
    },
    onOldVersionChange() {
      this.cur_game_version = parseInt(this.old_version) + 1 + "";

      if (this.old_version != "0") {
        let versionContent = fs.readFileSync(
          this.publish_path +
            "/web/release_v" +
            this.old_version +
            "/version.json",
          "utf-8"
        );

        let versionObj = JSON.parse(versionContent);
        this.cur_display_version = versionObj.displayVersion;
      }
    },
    // onNewVersionClick() {
    //   ipcRenderer.send("open_new_version_path");
    // },
    // onOldVersionClick() {
    //   ipcRenderer.send("open_old_version_path");
    // },
    async onPublishProjectClick() {
      if (!this.cur_game_version) {
        ipcRenderer.send(
          "client_show_snack",
          "游戏版本号为空,请先设置旧版本号"
        );
        return;
      }

      if (!this.cur_display_version) {
        ipcRenderer.send(
          "client_show_snack",
          "显示版本号为空,请先设置显示版本号或者设置旧版本号"
        );
        return;
      }

      if (!this.versionType) {
        ipcRenderer.send("client_show_snack", "请先选择版本更新类型");
        return;
      }

      this.isPublishProjectLoading = true;

      let cmdStr = "egret publish --version " + this.cur_game_version;
      console.log(cmdStr);
      exec(
        cmdStr,
        { cwd: this.project_path },
        async (error, stdout, stderr) => {
          if (error) {
            this.isPublishProjectLoading = false;
            ipcRenderer.send("client_show_snack", "发布项目错误:" + error);
            console.error("发布项目错误:" + error);
          } else {
            this.isPublishProjectLoading = false;

            let content = JSON.stringify({
              gameVersion: this.cur_game_version,
              displayVersion: this.cur_display_version,
              tag: false,
              versionType: this.versionTypes.indexOf(this.versionType),
              cdnPath: this.cdn_path
            });
            let ppath =
              this.project_path +
              "/bin-release/web/" +
              this.cur_game_version +
              "/version.json";
            console.log(ppath);
            try {
              await fs.writeFileSync(ppath, content);
              ipcRenderer.send("client_show_message", "发布项目成功");
              ipcRenderer.send("client_show_dialog", "发布项目成功");
              this.new_version_path =
                this.project_path + "/bin-release/web/" + this.cur_game_version;
              this.new_version = this.cur_game_version;
              this.refreshNewVersionList();
            } catch (error) {
              ipcRenderer.send(
                "client_show_snack",
                "写入版本文件错误:" + error
              );
              console.error("写入版本文件错误:" + error);
            }
          }

          if (stdout) {
            console.log("stdout: " + stdout);
          }
          if (stderr) {
            console.log("stderr: " + stderr);
          }
        }
      );
    },
    async onMergetVersionClick() {
      if (!this.new_version) {
        ipcRenderer.send("client_show_snack", "请先选择新版本号");
        return;
      }
      if (this.old_version && this.old_version >= this.new_version) {
        ipcRenderer.send("client_show_snack", "新版本号应该比旧版本号大");
        return;
      }

      if (!this.publish_path) {
        ipcRenderer.send("client_show_snack", "请在设置选项中设置发布目录");
        return;
      }
      this.isMergeVersionLoading = true;

      try {
        let versionListContent = await fs.readFileSync(
          this.publish_path + "/versionList.json",
          "utf-8"
        );
        let versionList = JSON.parse(versionListContent);
        if (versionList.versionList.indexOf(this.new_version) == -1) {
          versionList.versionList.push(this.new_version);
          versionListContent = JSON.stringify(versionList);
        }

        if (this.old_version && this.old_version != "0") {
          versionList.versionList = versionList.versionList.sort((a, b) => {
            return a <= b ? -1 : 1;
          });
          for (const iterator of versionList.versionList) {
            if (this.old_version < iterator && iterator < this.new_version) {
              await this.mergeVersion(this.new_version, iterator, false);
            }
          }

          await this.mergeVersion(this.new_version, this.old_version, true);
        } else {
          await this.mergeVersion(this.new_version, null, true);
        }

        await fs.writeFileSync(
          this.publish_path + "/versionList.json",
          versionListContent
        );
        this.isMergeVersionLoading = false;
        ipcRenderer.send("client_show_message", "比较版本成功");
        ipcRenderer.send("client_show_dialog", "比较版本成功");
      } catch (error) {
        this.isMergeVersionLoading = false;
        ipcRenderer.send("client_show_snack", "比较版本错误:" + error);
        console.error("比较版本错误:" + error);
      }
    },
    async onExportVersionClick() {
      if (!this.new_version) {
        ipcRenderer.send("client_show_snack", "请先设置新版本目录");
        return;
      }

      if (this.checkBoxData.length == 0) {
        ipcRenderer.send("client_show_snack", "请选择要导出的版本");
        return;
      }

      this.isExportVersionLoading = true;

      try {
        for (const iterator of this.checkBoxData) {
          switch (this.checkBoxValues.indexOf(iterator)) {
            case 0:
              await this.exportAndroid();
              break;
            case 1:
              await this.exportIOS();
              break;
            case 2:
              await this.exportWeChat();
              break;
          }
        }
        this.isExportVersionLoading = false;
        ipcRenderer.send("client_show_message", "导出其他版本成功");
      } catch (error) {
        ipcRenderer.send("client_show_snack", "导出其他版本错误:" + error);
        console.log("导出其他版本错误:" + error);
        this.isExportVersionLoading = false;
      }
    },
    exportAndroid() {
      if (!this.android_path) {
        ipcRenderer.send("client_show_snack", "请先设置安卓发布目录");
        return;
      }

      let gamePath = this.android_path + "/assets/game";
      let webReleasePath =
        this.publish_path + "/web/release_v" + this.new_version;
      let cdnReleasePath =
        this.publish_path + "/cdn/release_v" + this.new_version;

      //js
      this.deleteFolder(gamePath + "/js");
      this.deleteFolder(gamePath + "/resource");

      //resource
      this.folderCopyFile(webReleasePath + "/js", gamePath + "/js");
      this.folderCopyFile(cdnReleasePath + "/resource", gamePath + "/resource");

      //index.html
      this.copyFile(webReleasePath + "/index.html", gamePath + "/index.html");

      //manifest.json
      this.copyFile(
        webReleasePath + "/manifest.json",
        gamePath + "/manifest.json"
      );

      //version.json
      this.copyFile(
        webReleasePath + "/version.json",
        gamePath + "/version.json"
      );
    },
    exportIOS() {
      if (!this.ios_path) {
        ipcRenderer.send("client_show_snack", "请先设置IOS发布目录");
        return;
      }

      let gamePath = this.ios_path + "/assets/game";
      let webReleasePath =
        this.publish_path + "/web/release_v" + this.new_version;
      let cdnReleasePath =
        this.publish_path + "/cdn/release_v" + this.new_version;

      //js
      this.deleteFolder(gamePath + "/js");
      this.folderCopyFile(webReleasePath + "/js", gamePath + "/js");

      //resource
      this.deleteFolder(gamePath + "/resource");
      this.folderCopyFile(cdnReleasePath + "/resource", gamePath + "/resource");

      //index.html
      this.copyFile(webReleasePath + "/index.html", gamePath + "/index.html");

      //manifest.json
      this.copyFile(
        webReleasePath + "/manifest.json",
        gamePath + "/manifest.json"
      );

      //version.json
      this.copyFile(
        webReleasePath + "/version.json",
        gamePath + "/version.json"
      );
    },
    exportWeChat() {
      return new Promise((resolve, reject) => {
        if (!this.wechat_path) {
          ipcRenderer.send("client_show_snack", "请先设置微信小游戏发布目录");
          return;
        }

        let cmdStr = "egret publish --target wxgame";
        console.log(cmdStr);
        exec(cmdStr, { cwd: this.project_path }, (error, stdout, stderr) => {
          if (error) {
            ipcRenderer.send("client_show_snack", "发布项目错误:" + error);
            console.error("发布项目错误:" + error);
            reject();
          } else {
            let gamePath = this.wechat_path;

            //version.js
            let versionContent = fs.readFileSync(
              this.publish_path +
                "/web/release_v" +
                this.new_version +
                "/version.json",
              "utf-8"
            );
            versionContent = "export default " + versionContent;
            fs.writeFileSync(gamePath + "/version.js", versionContent);

            //game.js
            let gameContent = fs.readFileSync(gamePath + "/game.js", "utf-8");
            if (gameContent.indexOf("version.") == -1) {
              gameContent =
                `var version = require("./version.js");\nwindow.gameVersion = version.default.version;\n` +
                gameContent;
              fs.writeFileSync(gamePath + "/game.js", gameContent);
            }

            //删除resource
            this.deleteFolder(gamePath + "/resource");
            resolve();
          }

          if (stdout) {
            console.log("stdout: " + stdout);
          }
          if (stderr) {
            console.log("stderr: " + stderr);
          }
        });
      });
    },
    onExportApkClick(showDialog = true) {
      return new Promise((resolve, reject) => {
        if (!this.android_path) {
          ipcRenderer.send("client_show_snack", "请先设置安卓发布目录");
          return;
        }

        this.isExportApkLoading = true;

        // let cmdStr = "gradle build";
        // let cmdStr =
        //   "cd " + this.android_path + "\n" + "gradle assembleRelease";

        let cmdStr = "gradle assembleRelease";
        console.log(cmdStr);
        let process = exec(cmdStr, { cwd: this.android_path });

        process.stdout.on("data", data => {
          console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
          console.log("stderr: " + data);
        });
        process.on("exit", code => {
          if (code == 0) {
            this.isExportApkLoading = false;
            ipcRenderer.send("client_show_message", "打包APK成功");
            if (showDialog) {
              ipcRenderer.send("client_show_dialog", "打包APK成功");
            }
            resolve();
          } else {
            this.isExportApkLoading = false;
            ipcRenderer.send("client_show_snack", "打包APK错误:" + code);
            if (showDialog) {
              ipcRenderer.send("client_show_dialog", "打包APK错误:" + code);
            }
            reject();
          }
        });
      });
    },
    async onExportIpaClick(showDialog = true){
      return new Promise((resolve, reject)=>{
        if (!this.ios_path) {
          ipcRenderer.send("client_show_snack", "请先设置苹果发布目录");
          return;
        }

        this.isExportIpaLoading = true;

        let xcodeprojPath = this.ios_path+"/ios-template.xcodeproj";
        let archivePath=this.svn_path+"/client/app/planet.xcarchive";
        let appPath = this.svn_path+"/client/app/";
        let plistPath = this.ios_path+"/ios-template/Info.plist";

        let cleanCmd = "xcodebuild clean -project "+xcodeprojPath+"  -scheme planet -configuration Release";
        let archiveCmd = "xcodebuild archive -project "+xcodeprojPath+" -scheme planet -archivePath "+archivePath;
        let exportCmd = "xcodebuild -exportArchive -archivePath "+archivePath+" -exportPath "+appPath+" -exportOptionsPlist "+plistPath;

        let cmdStr = cleanCmd+"\n"+archiveCmd+"\n"+exportCmd;

        // try {
        //   await this.excuteIpaCmd(cleanCmd, "clean");
        //   await this.excuteIpaCmd(archiveCmd, "archive");
        //   await this.excuteIpaCmd(exportCmd, "export");
        //   ipcRenderer.send("client_show_message", "打包IPA成功");
        //   if (showDialog) {
        //     ipcRenderer.send("client_show_dialog", "打包IPA成功");
        //   }
        //   this.isExportIpaLoading = false;
        // } catch (error) {
        //   ipcRenderer.send("client_show_snack", "打包IPA错误:" + error);
        //   if (showDialog) {
        //     ipcRenderer.send("client_show_dialog", "打包IPA错误:" + error);
        //   }
        //   this.isExportIpaLoading = false;
        // }

        console.log(cmdStr);
        let process = exec(cmdStr, { cwd: this.ios_path });

        process.stdout.on("data", data => {
          console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
          console.log("stderr: " + data);
        });
        process.on("exit", code => {
          if (code == 0) {
            this.isExportIpaLoading = false;
            ipcRenderer.send("client_show_message", "打包IPA成功");
            if (showDialog) {
              ipcRenderer.send("client_show_dialog", "打包IPA成功");
            }
          } else {
            this.isExportIpaLoading = false;
            ipcRenderer.send("client_show_snack", "打包IPA错误:" + code);
            if (showDialog) {
              ipcRenderer.send("client_show_dialog", "打包IPA错误:" + code);
            }
          }
        });
      })
    },
    excuteIpaCmd(cmdStr, tip){
      return new Promise((resolve, reject)=>{
        console.log(cmdStr);
        let process = exec(cmdStr, { cwd: this.ios_path });

        process.stdout.on("data", data => {
          console.log("stdout: " + data);
        });
        process.stderr.on("data", data => {
          console.log("stderr: " + data);
        });
        process.on("exit", code => {
          if (code == 0) {
            console.log(tip+"成功")
            resolve();
          } else {
            ipcRenderer.send("client_show_snack", tip + code);
            reject();
          }
        });
      });
    },
    async mergeVersion(newVersion, oldVersion, isRelease) {
      let webReleasePath;
      let cdnReleasePath;
      if (isRelease) {
        webReleasePath = this.publish_path + "/web/release_v" + newVersion;
        cdnReleasePath = this.publish_path + "/cdn/release_v" + newVersion;
      }

      let webPatchPath;
      let cdnPatchPath;
      let oldWebReleasePath;
      let oldCdnReleasePath;
      if (oldVersion) {
        webPatchPath =
          this.publish_path + "/web/patch_v" + oldVersion + "-" + newVersion;
        cdnPatchPath =
          this.publish_path + "/cdn/patch_v" + oldVersion + "-" + newVersion;
        oldWebReleasePath = this.publish_path + "/web/release_v" + oldVersion;
        oldCdnReleasePath = this.publish_path + "/cdn/release_v" + oldVersion;
        let webExists = await fs.existsSync(oldWebReleasePath);
        if (!webExists) {
          console.error("不存在release版本:" + oldWebReleasePath);
          return;
        }
        let cdnExists = await fs.existsSync(oldCdnReleasePath);
        if (!cdnExists) {
          console.error("不存在cdn版本:" + oldCdnReleasePath);
          return;
        }
      } else {
        webPatchPath = this.publish_path + "/web/patch_v" + newVersion;
        cdnPatchPath = this.publish_path + "/cdn/patch_v" + newVersion;
      }

      newVersion = newVersion.replace(new RegExp("[.]", "g"), "-");
      if (oldVersion) {
        oldVersion = oldVersion.replace(new RegExp("[.]", "g"), "-");
      }
      try {
        if (webReleasePath) {
          await this.checkCreateFolder(webReleasePath);
        }
        if (cdnReleasePath) {
          await this.checkCreateFolder(cdnReleasePath);
        }
        await this.checkCreateFolder(webPatchPath);
        await this.checkCreateFolder(cdnPatchPath);

        //不用比较,直接拷贝的
        if (webReleasePath) {
          await this.copyFileInVersion("index.html", webReleasePath);
        }
        await this.copyFileInVersion("index.html", webPatchPath);

        if (webReleasePath) {
          await this.copyFileInVersion("manifest.json", webReleasePath);
        }
        await this.copyFileInVersion("manifest.json", webPatchPath);

        let versionContent = await fs.readFileSync(
          this.new_version_path + "/version.json",
          "utf-8"
        );
        let versionObj = JSON.parse(versionContent);
        versionObj.tag = true;
        versionContent = JSON.stringify(versionObj);
        // if (releasePath) {
        //   await this.copyFileInVersion("version.json", releasePath);
        // }
        // await this.copyFileInVersion("version.json", patchPath);

        if (webReleasePath) {
          await fs.writeFileSync(
            webReleasePath + "/version.json",
            versionContent
          );
        }
        await fs.writeFileSync(webPatchPath + "/version.json", versionContent);

        if (webReleasePath) {
          this.folderCopyFileInVersion("js", webReleasePath);
        }
        this.folderCopyFileInVersion("js", webPatchPath);

        if (cdnReleasePath) {
          await this.checkCreateFolder(cdnReleasePath + "/resource");
        }
        await this.checkCreateFolder(cdnPatchPath + "/resource");

        // if (releasePath) {
        //   this.folderCopyFileInVersion("resource/skins", releasePath);
        // }
        // this.folderCopyFileInVersion("resource/skins", patchPath);

        //不存在旧版本,所有的都用最新的版本
        if (!oldVersion) {
          //default.thm.json
          if (cdnReleasePath) {
            await this.copyFileInVersion(
              thmFilePath,
              cdnReleasePath,
              newVersion
            );
          }
          await this.copyFileInVersion(thmFilePath, cdnPatchPath, newVersion);

          //default.res.json
          await this.resFileHandle(
            defaultResPath,
            newVersion,
            cdnReleasePath,
            cdnPatchPath
          );

          //mapData.res.json
          await this.resFileHandle(
            mapDataResPath,
            newVersion,
            cdnReleasePath,
            cdnPatchPath
          );

          //async.res.json
          await this.resFileHandle(
            asyncResPath,
            newVersion,
            cdnReleasePath,
            cdnPatchPath
          );
        } else {
          //default.thm.json
          let oldThmPath = "resource/default.thm" + "_v" + oldVersion + ".json";
          await this.mergeFileInVersion(
            oldThmPath,
            thmFilePath,
            cdnReleasePath,
            cdnPatchPath,
            oldVersion,
            newVersion,
            oldCdnReleasePath
          );

          //default.res.json
          await this.resFileHandle(
            defaultResPath,
            newVersion,
            cdnReleasePath,
            cdnPatchPath,
            oldVersion,
            oldCdnReleasePath
          );

          //mapData.res.json
          await this.resFileHandle(
            mapDataResPath,
            newVersion,
            cdnReleasePath,
            cdnPatchPath,
            oldVersion,
            oldCdnReleasePath
          );

          //async.res.json
          await this.resFileHandle(
            asyncResPath,
            newVersion,
            cdnReleasePath,
            cdnPatchPath,
            oldVersion,
            oldCdnReleasePath
          );
        }
      } catch (error) {
        ipcRenderer.send("client_show_snack", "比较版本错误:" + error);
        console.error("比较版本错误:" + error);
      }
    },
    //根据res配置文件,添加版本号到文件和配置中
    async resFileHandle(
      resFilePath,
      newVersion,
      releasePath,
      patchPath,
      oldVersion,
      oldVersionPath
    ) {
      let useNew = false;
      let newResContent = await fs.readFileSync(
        this.new_version_path + "/" + resFilePath,
        "utf-8"
      );
      let newResObj = JSON.parse(newResContent);
      if (oldVersion) {
        let oldResPath = this.addVersionToPath(resFilePath, oldVersion);
        let resEqual = await this.mergeFileInVersion(
          oldResPath,
          resFilePath,
          releasePath,
          patchPath,
          oldVersion,
          newVersion,
          oldVersionPath
        );
        if (!resEqual) {
          let oldResContent = await fs.readFileSync(
            oldVersionPath + "/" + oldResPath,
            "utf-8"
          );
          let oldResObj = JSON.parse(oldResContent);

          for (const newResIterator of newResObj.resources) {
            let newPath = "resource/" + newResIterator.url;

            let oldPath;
            let oldResIteratorUrl;
            for (const oldResIterator of oldResObj.resources) {
              if (oldResIterator.name == newResIterator.name) {
                oldPath = "resource/" + oldResIterator.url;
                oldResIteratorUrl = oldResIterator.url;
                break;
              }
            }

            let resFileEqual = false;
            //处理纹理集配置内索引的图片地址
            if (newResIterator.type == "sheet") {
              //是图集,比较图集配置文件中的图片是否相同
              let newConfigContent = await fs.readFileSync(
                this.new_version_path + "/" + newPath
              );
              let newConfigObj = JSON.parse(newConfigContent);
              let newFilePath =
                "resource/" +
                this.getFileFolder(newResIterator.url) +
                "/" +
                newConfigObj.file;

              let oldFilePath = "";
              if (oldPath) {
                //存在旧的 给旧路径赋值
                let oldConfigPath = oldVersionPath + "/" + oldPath;
                let oldConfigContent = await fs.readFileSync(oldConfigPath);
                let oldConfigObj = JSON.parse(oldConfigContent);
                oldFilePath =
                  "resource/" +
                  this.getFileFolder(newResIterator.url) +
                  oldConfigObj.file;
              } else {
                oldFilePath =
                  "resource/" +
                  this.getFileFolder(newResIterator.url) +
                  newConfigObj.file;
              }

              //判断图集是否相同
              resFileEqual = await this.mergeFileInVersion(
                oldFilePath,
                newFilePath,
                releasePath,
                patchPath,
                oldVersion,
                newVersion,
                oldVersionPath
              );

              //图集配置处理
              await this.sheetConfigHandle(
                resFileEqual,
                releasePath,
                patchPath,
                oldPath,
                newPath,
                oldVersion,
                newVersion,
                newResIterator.url,
                oldVersionPath
              );
            } else {
              //不是图集,直接比较
              resFileEqual = await this.mergeFileInVersion(
                oldPath,
                newPath,
                releasePath,
                patchPath,
                oldVersion,
                newVersion,
                oldVersionPath
              );
            }

            //修改图集配置中的版本号
            if (resFileEqual) {
              newResIterator.url = oldResIteratorUrl;
            } else {
              newResIterator.url = this.addVersionToPath(
                newResIterator.url,
                newVersion
              );
            }
          }
        } else {
          useNew = true;
        }
      } else {
        useNew = true;
      }

      if (useNew) {
        for (const iterator of newResObj.resources) {
          //处理纹理集配置内索引的图片地址
          if (iterator.type == "sheet") {
            let oldPath;
            if (oldVersion) {
              oldPath = this.addVersionToPath(
                "resource/" + iterator.url,
                oldVersion
              );
            }
            let newPath = "resource/" + iterator.url;
            let newConfigContent = await fs.readFileSync(
              this.new_version_path + "/" + newPath
            );
            let newConfigObj = JSON.parse(newConfigContent);
            let filePath =
              "resource/" +
              this.getFileFolder(iterator.url) +
              newConfigObj.file;
            //拷贝图集中的图片
            if (releasePath) {
              this.copyFileInVersion(filePath, releasePath, newVersion);
            }
            await this.copyFileInVersion(filePath, patchPath, newVersion);

            //图集配置处理,不相等,直接用新的
            await this.sheetConfigHandle(
              false,
              releasePath,
              patchPath,
              oldPath,
              newPath,
              oldVersion,
              newVersion,
              iterator.url,
              oldVersionPath
            );
          } else {
            //其他文件只要拷贝配置就好了
            let targetPath = "resource/" + iterator.url;
            if (releasePath) {
              await this.copyFileInVersion(targetPath, releasePath, newVersion);
            }
            await this.copyFileInVersion(targetPath, patchPath, newVersion);
          }

          //修改配置中的版本号
          iterator.url = this.addVersionToPath(iterator.url, newVersion);
        }
      }

      //修改res配置中的版本号
      newResContent = JSON.stringify(newResObj);
      let resUrl = this.addVersionToPath(resFilePath, newVersion);
      if (releasePath) {
        await fs.writeFileSync(releasePath + "/" + resUrl, newResContent);
      }
      await fs.writeFileSync(patchPath + "/" + resUrl, newResContent);
    },
    async sheetConfigHandle(
      resFileEqual,
      releasePath,
      patchPath,
      oldPath,
      newPath,
      oldVersion,
      newVersion,
      sheetUrl,
      oldVersionPath
    ) {
      if (resFileEqual) {
        //相等
        if (releasePath) {
          await this.copyFile(
            oldVersionPath + "/" + oldPath,
            releasePath + "/" + oldPath
          );
        }
      } else {
        //不相等
        //release
        if (releasePath) {
          await this.copyFile(
            this.new_version_path + "/" + newPath,
            releasePath + "/" + newPath,
            newVersion
          );
        }

        //patch
        await this.copyFile(
          this.new_version_path + "/" + newPath,
          patchPath + "/" + newPath,
          newVersion
        );

        //修改图集配置文件
        if (releasePath) {
          let releaseFileContent = await fs.readFileSync(
            this.new_version_path + "/resource/" + sheetUrl
          );

          let releaseFileObj = JSON.parse(releaseFileContent);
          let originFileName = releaseFileObj.file;
          releaseFileObj.file = this.addVersionToPath(
            releaseFileObj.file,
            newVersion
          );
          releaseFileContent = JSON.stringify(releaseFileObj);
          await fs.writeFileSync(
            releasePath +
              "/resource/" +
              this.addVersionToPath(sheetUrl, newVersion),
            releaseFileContent
          );
        }

        let patchFileContent = await fs.readFileSync(
          this.new_version_path + "/resource/" + sheetUrl
        );
        let patchFileObj = JSON.parse(patchFileContent);
        let originFileName = patchFileObj.file;
        patchFileObj.file = this.addVersionToPath(
          patchFileObj.file,
          newVersion
        );
        patchFileContent = JSON.stringify(patchFileObj);
        await fs.writeFileSync(
          patchPath +
            "/resource/" +
            this.addVersionToPath(sheetUrl, newVersion),
          patchFileContent
        );
      }
    },
    async oneForAll() {
      ipcRenderer.send("client_show_loading");
      try {
        await this.onPublishProjectClick();
        await this.onMergetVersionClick();
        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_message", "One·for·All Success");
      } catch (e) {
        ipcRenderer.send("client_hide_loading");
        ipcRenderer.send("client_show_snack", "One·for·All Error:" + e);
      }
    },
    // //刷新新版本号
    // async refreshNewVersion() {
    //   let versionPath = this.new_version_path + "/version.json";
    //   if (await fs.existsSync(versionPath)) {
    //     let content = await fs.readFileSync(versionPath, "utf-8");
    //     this.new_version = JSON.parse(content).version;
    //   } else {
    //     this.new_version = "";
    //     ipcRenderer.send("client_show_snack", "新版本不存在version.json");
    //   }
    // },
    // //刷新旧版本号
    // async refreshOldVersion() {
    //   let versionPath = this.old_version_path + "/version.json";
    //   if (await fs.existsSync(versionPath)) {
    //     let content = await fs.readFileSync(versionPath, "utf-8");
    //     this.old_version = JSON.parse(content).version;
    //   } else {
    //     this.old_version = "";
    //     ipcRenderer.send("client_show_snack", "旧版本不存在version.json");
    //   }
    // },
    //根据两个版本比较文件
    async mergeFileInVersion(
      oldFilePath,
      newFilePath,
      releasePath,
      patchPath,
      oldVersion,
      newVersion,
      oldVersionPath
    ) {
      let newFileExist = await fs.existsSync(
        this.new_version_path + "/" + newFilePath
      );
      let oldFileExist = await fs.existsSync(
        oldVersionPath + "/" + oldFilePath
      );
      if (!newFileExist) {
        console.log(
          "新版本删除的文件:" + this.new_version_path + "/" + newFilePath
        );
        return false;
      }

      if (!oldFileExist) {
        console.log(
          "新版本添加的文件:" + this.new_version_path + "/" + newFilePath
        );
        // return false;
      }

      let fileEqual = false;
      if (oldFileExist) {
        fileEqual = await this.mergeFileByMd5(
          oldVersionPath + "/" + oldFilePath,
          this.new_version_path + "/" + newFilePath
        );
      }

      if (fileEqual) {
        if (releasePath) {
          //相等,拷贝旧的文件到新目录
          await this.loopCheckCreateFolder(releasePath + "/" + oldFilePath);
          await this.copyFile(
            oldVersionPath + "/" + oldFilePath,
            releasePath + "/" + oldFilePath
          );
        }
      } else {
        if (releasePath) {
          await this.copyFileInVersion(newFilePath, releasePath, newVersion);
        }
        await this.copyFileInVersion(newFilePath, patchPath, newVersion);
      }
      return fileEqual;
    },
    //比较两个文件的MD5
    async mergeFileByMd5(oldFilePath, newFilePath) {
      let oldFile = await fs.readFileSync(oldFilePath);
      let newFile = await fs.readFileSync(newFilePath);
      const oldFileMd5 = crypto
        .createHash("md5")
        .update(oldFile)
        .digest("hex");
      const newFileMd5 = crypto
        .createHash("md5")
        .update(newFile)
        .digest("hex");

      return oldFileMd5 == newFileMd5;
    },
    //根据版本拷贝目录中的文件
    folderCopyFileInVersion(folderName, targetPath, version) {
      this.folderCopyFile(
        this.new_version_path + "/" + folderName,
        targetPath + "/" + folderName,
        version
      );
    },
    //根据版本拷贝文件,不存在的目录会自动创建
    async copyFileInVersion(fileName, targetPath, version, fromPath) {
      if (!fromPath) {
        fromPath = this.new_version_path;
      }

      let fileNameArr = fileName.split("/");
      let checkPath = "";
      for (let i = 0; i < fileNameArr.length; i++) {
        if (i != fileNameArr.length - 1) {
          checkPath += fileNameArr[i] + "/";
          let filePath = fromPath + "/" + checkPath;
          if (await fs.existsSync(filePath)) {
            if (await fs.statSync(filePath).isDirectory()) {
              await this.checkCreateFolder(targetPath + "/" + checkPath);
            }
          } else {
            console.error("不存在目录:" + filePath);
            return;
          }
        }
      }

      await this.copyFile(
        fromPath + "/" + fileName,
        targetPath + "/" + fileName,
        version
      );
    },
    //拷贝文件
    copyFile(filePath, targetPath, version) {
      return new Promise((resolve, reject) => {
        try {
          if (version) {
            let targetPathArr = targetPath.split("/");
            let fileName = targetPathArr[targetPathArr.length - 1];
            if (fileName.indexOf("_v" + version) == -1) {
              targetPath = this.addVersionToPath(targetPath, version);
            } else {
              console.log(
                "targetPath:" + targetPath + "---fileName:" + fileName
              );
            }
          }

          let exists = fs.exists(filePath, exists => {
            if (exists) {
              fs.readFile(filePath, (readError, data) => {
                if (readError) {
                  console.error(readError);
                  reject();
                } else {
                  fs.writeFile(targetPath, data, writeError => {
                    if (writeError) {
                      console.error(writeError);
                      reject();
                    } else {
                      resolve();
                    }
                  });
                }
              });
            } else {
              console.log("不存在文件:" + filePath);
              resolve();
            }
          });
        } catch (error) {
          ipcRenderer.send(
            "client_show_snack",
            "copy " + filePath + " to " + targetPath + " Error:" + error
          );
          console.error(
            "copy " + filePath + " to " + targetPath + " Error:" + error
          );
          reject();
        }
      });
    },
    //拷贝目录中的文件,遍历拷贝,不存在文件夹就创建
    async folderCopyFile(fromPath, targetPath, version) {
      try {
        await this.checkCreateFolder(targetPath);
        let files = await fs.readdirSync(fromPath);
        // fs.readdir(
        //   fromPath,
        //   error => {
        //     if (error) {
        //       console.error(error);
        //     }
        //   },
        // files => {
        for (const file of files) {
          let fromPathName = path.join(fromPath, file);
          let targetPathName = path.join(targetPath, file);
          if (await fs.statSync(fromPathName).isDirectory()) {
            await this.folderCopyFile(fromPathName, targetPathName);
          } else {
            await this.copyFile(fromPathName, targetPathName, version);
          }
        }
        // }
        // );
      } catch (error) {
        ipcRenderer.send(
          "client_show_snack",
          "copy " + fromPath + " to " + targetPath + " Error:" + error
        );
        console.error(
          "copy " + fromPath + " to " + targetPath + " Error:" + error
        );
      }
    },
    //根据指定路径添加版本号并返回
    addVersionToPath(targetPath, version) {
      let returnPath = targetPath;
      if (version) {
        let targetPathArr = targetPath.split(".");
        let suffix = targetPathArr[targetPathArr.length - 1];
        let preffix = "";
        for (let i = 0; i < targetPathArr.length; i++) {
          const element = targetPathArr[i];
          if (i < targetPathArr.length - 2) {
            preffix += element + ".";
          } else if (i < targetPathArr.length - 1) {
            preffix += element;
          } else {
            //reserve
          }
        }
        returnPath = preffix + "_v" + version + "." + suffix;
      }
      return returnPath;
    },
    async loopCheckCreateFolder(path) {
      let fileNameArr = path.split("/");
      let checkPath = "";
      // for (let i = 0; i < fileNameArr.length; i++) {
      //   if (i != fileNameArr.length - 1) {
      //     checkPath += fileNameArr[i] + "/";
      //     await this.checkCreateFolder(checkPath);
      //   }
      // }

      // let i = 0;
      // for (const iterator of fileNameArr) {
      //   if (i != fileNameArr.length - 1) {
      //     checkPath += fileNameArr[i] + "/";
      //     await this.checkCreateFolder(checkPath);
      //   }
      //   i++;
      // }

      fileNameArr.pop();
      while (fileNameArr.length > 0) {
        checkPath = checkPath + fileNameArr.shift() + "/";
        await this.checkCreateFolder(checkPath);
      }
    },
    //检查并创建文件夹
    async checkCreateFolder(path) {
      // return new Promise((resolve, reject) => {
      //   fs.exists(path, exists => {
      //     if (!exists) {
      //       console.log("路径不存在:" + path);
      //       fs.mkdir(path, error => {
      //         if (error) {
      //           reject(error);
      //         } else {
      //           console.log("创建文件夹成功" + path);
      //           resolve();
      //         }
      //       });
      //     } else {
      //       resolve();
      //     }
      //   });
      // });
      let exists = await fs.existsSync(path);
      if (!exists) {
        await fs.mkdirSync(path);
      }
      // fs.exists(path, exists => {
      //   if (!exists) {
      //     console.log("路径不存在:" + path);
      //     fs.mkdir(path, error => {
      //       if (error) {
      //         reject(error);
      //       } else {
      //         console.log("创建文件夹成功" + path);
      //         resolve();
      //       }
      //     });
      //   } else {
      //   }
      // });
    },
    //获取文件所在目录
    getFileFolder(filePath) {
      let filePathArr = filePath.split("/");
      let fileFolder = "";
      for (let i = 0; i < filePathArr.length; i++) {
        const element = filePathArr[i];
        if (i != filePathArr.length - 1) {
          fileFolder += element + "/";
        }
      }

      return fileFolder;
    },
    deleteFolder(folderPath) {
      return new Promise((resolve, reject) => {
        try {
          let rmFolder = async path => {
            let files = [];
            if (await fs.existsSync(path)) {
              files = await fs.readdirSync(path);
              while (files.length > 0) {
                let file = files.shift();
                let curPath = path + "/" + file;
                if (await fs.statSync(curPath).isDirectory()) {
                  // recurse
                  await rmFolder(curPath);
                } else {
                  // delete file
                  await fs.unlinkSync(curPath);
                }
              }
              // for (const file of files) {
              // }
              await fs.rmdirSync(path);
            }
          };

          rmFolder(folderPath);

          resolve();
        } catch (error) {
          ipcRenderer.send(
            "client_show_snack",
            "deleteFolder " + folderPath + " Error:" + error
          );
          reject();
        }
      });
    },

    async refreshNewVersionList() {
      let path = this.project_path + "/bin-release/web";
      if(await fs.existsSync(path)){
        this.newVersionList = await fs.readdirSync(path);;
      }else{
        this.newVersionList = [];
      }
    },

    async refreshOldVersionList() {
      let versionListContent = await fs.readFileSync(
        this.publish_path + "/versionList.json",
        "utf-8"
      );
      let versionList = JSON.parse(versionListContent);
      this.oldVersionList = versionList.versionList;

      this.old_version = this.oldVersionList[this.oldVersionList.length - 1];
      this.onOldVersionChange();
    }
  },
  mounted() {
    this.project_path = localStorage.getItem("client_project_path");
    this.publish_path = localStorage.getItem("client_publish_path");
    this.cdn_path = localStorage.getItem("client_cdn_path");
    this.android_path = localStorage.getItem("client_android_path");
    this.ios_path = localStorage.getItem("client_ios_path");
    this.wechat_path = localStorage.getItem("client_wechat_path");
    this.svn_path = localStorage.getItem("client_svn_path");

    if (!this.project_path) {
      this.project_path = "";
    }

    if (!this.publish_path) {
      this.publish_path = "";
    }

    if (!this.cdn_path) {
      this.cdn_path = "";
    }

    if (!this.android_path) {
      this.android_path = "";
    }

    if (!this.ios_path) {
      this.ios_path = "";
    }

    if (!this.wechat_path) {
      this.wechat_path = "";
    }

    this.refreshNewVersionList();
    this.refreshOldVersionList();

    // ipcRenderer.removeAllListeners([
    //   "selected_new_version_path",
    //   "selected_old_version_path"
    // ]);

    // ipcRenderer.on("selected_new_version_path", (event, path) => {
    //   if (path) {
    //     this.new_version_path = path[0];
    //     this.refreshNewVersion();
    //   }
    // });

    // ipcRenderer.on("selected_old_version_path", (event, path) => {
    //   if (path) {
    //     this.old_version_path = path[0];
    //     this.refreshOldVersion();
    //   }
    // });
  }
};
</script>
<style lang="less">
.text-version {
  width: 100px;
}

.text-path {
  width: 512px;
}

.demo-list-wrap {
  width: 100%;
  max-width: 640px;
  overflow: hidden;
}

.button-wrapper {
  text-align: left;
}

.control-group {
  margin: 15px 0;
  max-width: 800px;
}

.flex-wrapper {
  padding-left: 30px;
}
</style>