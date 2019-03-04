<template>
  <div>
    <mu-container>
      <div class="button-wrapper">
        <mu-button
          v-loading="isCompressPicturesLoading"
          data-mu-loading-size="24"
          color="green500"
          @click="onCompressPicturesClick"
        >压缩图片</mu-button>
        <mu-button
          v-loading="isPublishProjectLoading"
          data-mu-loading-size="24"
          color="pink500"
          @click="onPublishProjectClick"
        >发布当前项目</mu-button>
        <mu-button
          v-loading="isMergeVersionLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="onMergetVersionClick"
        >比较新旧版本</mu-button>
        <!-- <mu-button
          v-loading="isExportVersionLoading"
          data-mu-loading-size="24"
          color="cyan500"
          @click="onExportVersionClick"
        >导出其他版本</mu-button>
        <mu-button
          v-loading="isExportApkLoading"
          data-mu-loading-size="24"
          color="blue500"
          @click="onExportApkClick"
        >导出apk</mu-button>
        <mu-button
          v-loading="isExportIpaLoading"
          data-mu-loading-size="24"
          color="purple500"
          @click="onExportIpaClick"
        >导出ipa</mu-button>-->
      </div>
      <div class="button-wrapper">
        <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
      </div>
    </mu-container>
    <mu-container>
      <div>
        <mu-flex class="flex-wrapper" align-items="center">
          <mu-col span="12" lg="2" sm="2">
            <mu-checkbox v-model="needCover" label="覆盖"></mu-checkbox>
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-text-field class="text-version" v-model="releaseVersion" label="发布版本号" label-float/>
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-text-field class="text-version" v-model="displayVersion" label="显示版本号" label-float/>
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-select label="选择类型" filterable v-model="versionType" label-float full-width>
              <mu-option v-for="type,index in versionTypes" :key="type" :label="type" :value="type"></mu-option>
            </mu-select>
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-select
              label="旧版本号"
              filterable
              v-model="oldVersion"
              @change="onOldVersionChange"
              label-float
              full-width
            >
              <mu-option
                v-for="value,index in oldVersionList"
                :key="value"
                :label="value"
                :value="value"
              ></mu-option>
            </mu-select>
          </mu-col>
        </mu-flex>
      </div>
      <div class="control-group">
        <mu-flex class="flex-wrapper" align-items="center">
          <mu-row gutter>
            <mu-col span="12" lg="12" sm="12">
              <mu-text-field class="text-path" v-model="cdnPath" label="CDN目录" label-float/>
            </mu-col>
          </mu-row>
        </mu-flex>
      </div>
    </mu-container>
  </div>
</template>

<script>
import * as mdPublish from "../js/MdPublish.js";
import * as mdCompress from "../js/MdCompress.js";
import * as fsExc from "../js/FsExecute.js";
import { Global } from "../js/Global.js";
import { version } from "punycode";

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
const indieResPath = "resource/indie.res.json";

export default {
  data() {
    return {
      isPublishProjectLoading: false,
      isMergeVersionLoading: false,
      isCompressPicturesLoading: false,
      isExportVersionLoading: false,
      isExportApkLoading: false,
      isExportIpaLoading: false,
      needCover: mdPublish.getNeedCover(),
      oldVersion: "",
      releaseVersion: "",
      displayVersion: "",
      cdnPath: "",
      versionType: "",
      versionTypes: mdPublish.versionTypes,
      checkBoxValues: mdPublish.checkBoxValues,
      checkBoxData: mdPublish.getCheckBoxData(),
      checkAll: true,

      oldVersionList: []
    };
  },
  watch: {
    checkBoxData: val => {
      mdPublish.setCheckBoxData(val);
    },
    cdnPath: val => {
      localStorage.setItem("client_cdn_path", val);
      mdPublish.setCdnPath(val);
    },
    releaseVersion: val => {
      mdPublish.setReleaseVersion(val);
      mdPublish.setNewVersion(val);
    },
    displayVersion: val => {
      mdPublish.setDisplayVersion(val);
    },
    versionType: val => {
      mdPublish.setVersionType(val);
    },
    oldVersion: val => {
      mdPublish.setOldVersion(val);
    },
    needCover: val => {
      mdPublish.setNeedCover(val);
    }
  },
  methods: {
    handleCheckAll() {
      this.checkAll = !this.checkAll;
      if (this.checkAll) {
        this.checkBoxData = mdPublish.checkBoxValues.concat();
      } else {
        this.checkBoxData.length = 0;
      }
    },
    async onOldVersionChange() {
      this.releaseVersion = parseInt(this.oldVersion) + 1 + "";
      if (this.oldVersion != "0") {
        let versionPath = `${mdPublish.svnPublishPath}/web/release_v${
          this.oldVersion
        }s/version.json`;
        if (await fsExc.exists(versionPath)) {
          let versionContent = fs.readFileSync(versionPath, "utf-8");
          let versionObj = JSON.parse(versionContent);
          this.displayVersion = versionObj.displayVersion;
        } else {
          this.oldVersion = "0";
        }
      }
    },

    async onPublishProjectClick(showDialog = true) {
      this.isPublishProjectLoading = true;
      Global.showRegionLoading();
      try {
        await mdPublish.publishProject();
        this.isPublishProjectLoading = false;
        Global.hideRegionLoading();
        if (showDialog) {
          Global.dialog("发布当前项目成功");
        }
      } catch (error) {
        this.isPublishProjectLoading = false;
        Global.hideRegionLoading();
      }
    },

    async onMergetVersionClick(showDialog = true) {
      this.isMergeVersionLoading = true;
      Global.showRegionLoading();

      await mdPublish
        .mergeVersion()
        .then(value => {
          this.isMergeVersionLoading = false;
          Global.hideRegionLoading();
          if (showDialog) {
            Global.dialog("比较新旧成功");
          }
        })
        .catch(reason => {
          this.isMergeVersionLoading = false;
          Global.hideRegionLoading();
        });
    },

    async onCompressPicturesClick(showDialog = true) {
      this.isCompressPicturesLoading = true;
      Global.showRegionLoading();

      await mdCompress
        .compareFile(Global.resourcePath, Global.originalPicPath)
        .then(value => {
          this.isCompressPicturesLoading = false;
          Global.hideRegionLoading();
          if (showDialog) {
            Global.dialog("压缩成功");
          }
        })
        .catch(reason => {
          this.isCompressPicturesLoading = false;
          Global.hideRegionLoading();
        });
    },

    // async onCopyPicturesClick(showDialog = true) {
    //   this.isCopyCompressPicLoading = true;
    //   Global.showRegionLoading();

    //   await mdPublish
    //     .clearNcopyResource()
    //     .then(value => {
    //       this.isCopyCompressPicLoading = false;
    //       Global.hideRegionLoading();
    //       if (showDialog) {
    //         Global.dialog("拷贝压缩图片成功");
    //       }
    //     })
    //     .catch(reason => {
    //       this.isCopyCompressPicLoading = false;
    //       Global.hideRegionLoading();
    //     });
    // },

    async oneForAll() {
      ipcRenderer.send("client_show_loading");
      try {
        await this.onPublishProjectClick(false);
        await this.onMergetVersionClick(false);
        Global.hideLoading();
        Global.dialog("One·for·All Success");
      } catch (error) {
        Global.hideLoading();
        Global.snack("One·for·All Error:", error);
      }
    },
    async refreshOldVersionList() {
      let versionListContent = await fs.readFileSync(
        mdPublish.svnPublishPath + "/versionList.json",
        "utf-8"
      );
      let versionList = JSON.parse(versionListContent);
      this.oldVersionList = versionList.versionList;

      this.oldVersion = this.oldVersionList[this.oldVersionList.length - 1];
      this.onOldVersionChange();
    }
  },
  mounted() {
    this.cdnPath = localStorage.getItem("client_cdn_path");

    if (!this.cdnPath) {
      this.cdnPath = "";
    }
    this.refreshOldVersionList();
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

.control-group {
  // margin: 15px 0;
  max-width: 800px;
}

.flex-wrapper {
  padding-left: 30px;
}
</style>