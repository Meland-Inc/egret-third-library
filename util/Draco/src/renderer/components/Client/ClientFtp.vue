<template>
  <div>
    <mu-container>
      <div class="button-wrapper">
        <mu-button
          v-loading="isZipVersionLoading"
          data-mu-loading-size="24"
          color="pink500"
          @click="onZipVersion"
        >压缩游戏版本</mu-button>
        <mu-button
          v-loading="isUploadVersionLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="onUploadVersionFile"
        >上传游戏版本</mu-button>
        <mu-divider></mu-divider>
        <mu-button
          v-loading="isCreatePolicyFileLoading"
          data-mu-loading-size="24"
          color="cyan500"
          @click="onCreatePolicyFile"
        >生成策略文件</mu-button>
        <mu-button
          v-loading="isModifyPolicyNumLoading"
          data-mu-loading-size="24"
          color="blue500"
          @click="onModifyPolicyFile"
        >修改策略文件</mu-button>
        <mu-button
          v-loading="isUploadPolicyLoading"
          data-mu-loading-size="24"
          color="purple500"
          @click="onUploadPolicyFile"
        >上传策略文件</mu-button>
        <mu-button
          v-loading="isApplyPolicyNumLoading"
          data-mu-loading-size="24"
          color="green500"
          @click="onApplyPolicyNum"
        >应用策略版本</mu-button>
      </div>
      <div class="button-wrapper">
        <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
      </div>
    </mu-container>
    <mu-container>
      <div>
        <mu-flex class="flex-wrapper" align-items="center">
          <mu-col span="12" lg="2" sm="2">
            <mu-text-field class="text-game" v-model="policyNum" label="策略版本号" label-float />
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-text-field class="text-game" v-model="whiteVersion" label="白名单游戏版本" label-float />
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-text-field class="text-game" v-model="normalVersion" label="常规游戏版本" label-float />
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-text-field class="text-game" v-model="displayVersion" label="显示版本号" label-float />
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-select label="选择类型" filterable v-model="versionType" label-float full-width>
              <mu-option v-for="type,index in versionTypes" :key="type" :label="type" :value="type"></mu-option>
            </mu-select>
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-select label="选择渠道号" filterable v-model="channel" label-float full-width>
              <mu-option
                v-for="value,index in channelList"
                :key="value"
                :label="value"
                :value="value"
              ></mu-option>
            </mu-select>
          </mu-col>
        </mu-flex>
        <mu-flex class="flex-wrapper" align-items="center">
          <mu-col span="12" lg="2" sm="2">
            <mu-checkbox v-model="needPatch" @change="needPatchChange" label="patch包"></mu-checkbox>
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-checkbox v-model="useCdn" label="使用cdn"></mu-checkbox>
          </mu-col>
          <mu-col span="12" lg="3" sm="3">
            <mu-select label="上传游戏版本" filterable v-model="uploadVersion" label-float full-width>
              <mu-option
                v-for="value,index in gameVersionList"
                :key="value"
                :label="value"
                :value="value"
              ></mu-option>
            </mu-select>
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-select
              label="资源服务器"
              @change="serverInfoChange"
              filterable
              v-model="serverInfo"
              label-float
              full-width
            >
              <mu-option
                v-for="value,index in serverList"
                :key="value.value"
                :label="value.name"
                :value="value"
              ></mu-option>
            </mu-select>
          </mu-col>
          <mu-col span="12" lg="4" sm="4">
            <mu-button @click="onCheckPolicyNum">当前策略版本</mu-button>
          </mu-col>
        </mu-flex>
      </div>
    </mu-container>
  </div>
</template>

<script>
import { Global } from "../js/Global.js";
import * as fsExc from "../js/FsExecute.js";
import * as mdFtp from "../js/MdFtp.js";
import { ModelMgr } from "../js/model/ModelMgr";
export default {
  data() {
    return {
      isZipVersionLoading: false,
      isUploadVersionLoading: false,
      isCreatePolicyFileLoading: false,
      isModifyPolicyNumLoading: false,
      isUploadPolicyLoading: false,
      isApplyPolicyNumLoading: false,
      policyNum: null,
      gameVersionList: [],
      uploadVersion: null,
      whiteVersion: null,
      normalVersion: null,
      displayVersion: null,
      serverList: [],
      serverInfo: null,
      releaseList: [],
      patchList: [],
      needPatch: true,
      useCdn: false,
      channelList: [],
      channel: null,
      versionTypes: null,
      versionType: ""
    };
  },
  watch: {
    displayVersion: val => {
      // mdFtp.setDisplayVersion(val);
      ModelMgr.versionModel.setDisplayVersion(val);
    },
    policyNum: value => {
      // mdFtp.setPolicyNum(value);
      ModelMgr.versionModel.setPolicyNum(value);
    },
    uploadVersion: value => {
      // mdFtp.setUploadVersion(value);
      ModelMgr.versionModel.setUploadVersion(value);
    },
    whiteVersion: value => {
      // mdFtp.setWhiteVersion(value);
      ModelMgr.versionModel.setWhiteList(value);
    },
    normalVersion: value => {
      // mdFtp.setNormalVersion(value);
      ModelMgr.versionModel.setNormalVersion(value);
    },
    channel: value => {
      // mdFtp.setChannel(value);
      ModelMgr.versionModel.setChannel(value);
    },
    needPatch: value => {
      // mdFtp.setNeedPatch(value);
      ModelMgr.versionModel.setNeedPatch(value);
    },
    versionType: val => {
      // mdFtp.setVersionType(val);
      ModelMgr.versionModel.setVersionType(val);
    },
    useCdn: value => {
      ModelMgr.ftpModel.useCdn = value;
    }
  },
  methods: {
    serverInfoChange() {
      // mdFtp.setServerInfo(this.serverInfo);
      this.refreshPolicyNum();
    },
    needPatchChange() {
      if (this.needPatch) {
        this.gameVersionList = this.patchList;
      } else {
        this.gameVersionList = this.releaseList;
      }
      this.uploadVersion = this.gameVersionList[
        this.gameVersionList.length - 1
      ];
    },
    async onZipVersion() {
      this.isZipVersionLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.zipVersion();
        this.isZipVersionLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isZipVersionLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onUploadVersionFile(showDialog = true) {
      this.isUploadVersionLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.uploadVersionFile();
        this.isUploadVersionLoading = false;
        Global.hideRegionLoading();
        if (showDialog) {
          Global.dialog("上传游戏版本成功");
        }
      } catch (error) {
        this.isUploadVersionLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onCreatePolicyFile() {
      this.isCreatePolicyFileLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.createPolicyFile();
        this.isCreatePolicyFileLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isCreatePolicyFileLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onModifyPolicyFile() {
      this.isModifyPolicyNumLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.modifyPolicyFile();
        this.isModifyPolicyNumLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isModifyPolicyNumLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onUploadPolicyFile() {
      this.isUploadPolicyLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.uploadPolicyFile();
        if (this.useCdn) {
          await mdFtp.uploadCdnPolicyFile();
        }
        this.isUploadPolicyLoading = false;
        Global.hideRegionLoading();
        if (showDialog) {
          Global.dialog("上传游戏版本成功");
        }
      } catch (error) {
        this.isUploadPolicyLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onApplyPolicyNum() {
      this.isApplyPolicyNumLoading = true;
      Global.showRegionLoading();

      try {
        await mdFtp.applyPolicyNum();
        this.isApplyPolicyNumLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isApplyPolicyNumLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onCheckPolicyNum() {
      let value = await mdFtp.checkPolicyNum();
      let data = JSON.parse(value);
      if (data.Code == 0) {
        Global.toast(`策略版本:${data.Data.Version}`);
      } else {
        Global.snack(data.Message, null, false);
      }
    },
    async oneForAll() {
      Global.showLoading();
      try {
        await this.onZipVersion();
        await this.onUploadVersionFile(false);
        await this.onCreatePolicyFile();
        await this.onModifyPolicyFile();
        await this.onUploadPolicyFile();
        await this.onApplyPolicyNum();
        Global.hideLoading();
        Global.dialog("One·for·All Success");
      } catch (error) {
        Global.hideLoading();
        Global.snack("One·for·All Error", error);
      }
    },

    async refreshVersionList() {
      this.releaseList = [];
      this.patchList = [];
      let webDir = await fsExc.readDir(localPath);
      let reg = /[A-Za-z]_*/g;
      for (const iterator of webDir) {
        if (iterator.indexOf("release") != -1) {
          iterator;
          this.releaseList.push(iterator);
        }

        if (iterator.indexOf("patch") != -1) {
          this.patchList.push(iterator);
        }
      }

      this.releaseList = this.releaseList.sort((a, b) => {
        return parseInt(a.replace(reg, "")) - parseInt(b.replace(reg, ""));
      });

      this.patchList = this.patchList.sort((a, b) => {
        return parseInt(a.replace(reg, "")) - parseInt(b.replace(reg, ""));
      });

      this.needPatchChange();

      let releaseVersion = this.releaseList[this.releaseList.length - 1];
      let versionInfo = releaseVersion.split("_v");
      this.whiteVersion = this.normalVersion = this.displayVersion = versionInfo[
        versionInfo.length - 1
      ].replace(reg, "");
    },
    // refreshServerList() {
    //   this.serverList = mdFtp.serverList;
    //   this.serverInfo = this.serverList[this.serverList.length - 1];
    //   mdFtp.setServerInfo(this.serverInfo);
    // },
    async refreshPolicyNum() {
      let value = await mdFtp.checkPolicyNum();
      let data = JSON.parse(value);
      if (data.Code == 0) {
        this.policyNum = +data.Data.Version + 1;
      }
    },
    async refreshChannelList() {
      this.channelList = ModelMgr.versionModel.channelList;
      this.channel = this.channelList[this.channelList.length - 1];
    }
  },
  async mounted() {
    await ModelMgr.ftpModel.init();
    await this.refreshVersionList();
    // this.refreshServerList();
    this.refreshChannelList();
    // mdFtp.setNeedPatch(this.needPatch);
    this.versionTypes = ModelMgr.versionModel.versionTypes;
    this.versionType = ModelMgr.versionModel.versionType;
    await this.refreshPolicyNum();
  }
};
</script>

<style lang="css">
.select-control-row {
  padding: 8px 0;
}
.select-control-group {
  margin: 16px 0;
}
.text-game {
  width: 120px;
}
</style>