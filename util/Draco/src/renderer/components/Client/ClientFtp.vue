<template>
  <div>
    <mu-container>
      <div class="button-wrapper">
        <mu-button
          v-loading="isCreateEntranceLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="onCreateEntrance"
        >生成入口文件</mu-button>
        <mu-button
          v-loading="isModifyPolicyNumLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="onModifyPolicyFile"
        >修改策略文件</mu-button>
        <mu-button
          v-loading="isUploadVersionLoading"
          data-mu-loading-size="24"
          color="pink500"
          @click="onUploadVersionFile"
        >上传游戏版本</mu-button>
        <mu-button
          v-loading="isApplyPolicyNumLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="onApplyPolicyNum"
        >应用策略版本</mu-button>
        <!-- <mu-button
          v-loading="isExportIpaLoading"
          data-mu-loading-size="24"
          color="cyan500"
          @click="onExportIpa"
        >打包ipa</mu-button>-->
      </div>
      <div class="button-wrapper">
        <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
      </div>
    </mu-container>
    <mu-container>
      <div>
        <mu-flex class="flex-wrapper" align-items="center">
          <mu-col span="12" lg="2" sm="2">
            <mu-text-field class="text-game" v-model="policyNum" label="策略版本号" label-float/>
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-text-field class="text-game" v-model="whiteVersion" label="白名单游戏版本" label-float/>
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-text-field class="text-game" v-model="normalVersion" label="常规游戏版本" label-float/>
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
            <mu-checkbox v-model="needPatch" @change="needPatchChange" label="选择patch包"></mu-checkbox>
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
            <mu-select label="资源服务器" filterable v-model="serverInfo" label-float full-width>
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
export default {
  data() {
    return {
      isUploadVersionLoading: false,
      isCreateEntranceLoading: false,
      isModifyPolicyNumLoading: false,
      isApplyPolicyNumLoading: false,
      policyNum: null,
      gameVersionList: [],
      uploadVersion: null,
      whiteVersion: null,
      normalVersion: null,
      serverList: [],
      serverInfo: null,
      releaseList: [],
      patchList: [],
      needPatch: true,
      channelList: [],
      channel: null
    };
  },
  watch: {
    // needPatch: value => {
    //   if (value) {
    //     this.gameVersionList = this.patchList;
    //   } else {
    //     this.gameVersionList = this.releaseList;
    //   }
    //   console.log(this.gameVersionList);
    // },
    policyNum: value => {
      mdFtp.setPolicyNum(value);
    },
    uploadVersion: value => {
      mdFtp.setUploadVersion(value);
    },
    whiteVersion: value => {
      mdFtp.setWhiteVersion(value);
    },
    normalVersion: value => {
      mdFtp.setNormalVersion(value);
    },
    serverInfo: value => {
      mdFtp.setServerInfo(value);
    },
    channel: value => {
      mdFtp.setChannel(value);
    }
  },
  methods: {
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
    async onCreateEntrance() {
      this.isCreateEntranceLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.createEntrance();
        this.isCreateEntranceLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isCreateEntranceLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onUploadVersionFile() {
      this.isUploadVersionLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.uploadVersionFile();
        this.isUploadVersionLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isUploadVersionLoading = false;
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
        Global.hideLoading();
        Global.toast("One·for·All Success");
      } catch (error) {
        Global.hideLoading();
        Global.snack("One·for·All Error", error);
      }
    },

    async refreshVersionList() {
      this.releaseList = [];
      this.patchList = [];
      let webDir = await fsExc.readDir(Global.svnPublishPath + "/web/");
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

      this.gameVersionList = this.patchList;
      this.uploadVersion = this.patchList[this.releaseList.length - 1];
      let versionInfo = this.uploadVersion.split("-v");
      this.whiteVersion = this.normalVersion = versionInfo[
        versionInfo.length - 1
      ].replace(reg, "");
    },
    refreshServerList() {
      this.serverList = mdFtp.serverList;
      this.serverInfo = this.serverList[this.serverList.length - 1];
    },
    async refreshPolicyList() {
      let policyListContent = await fsExc.readFile(
        Global.svnPublishPath + "/policyList.json"
      );
      let policyList = JSON.parse(policyListContent).policy;
      this.policyNum = +policyList[policyList.length - 1] + 1;
    },
    async refreshChannelList() {
      this.channelList = mdFtp.channelList;
      this.channel = this.channelList[this.channelList.length - 1];
    }
  },
  async mounted() {
    await this.refreshVersionList();
    this.refreshServerList();
    await this.refreshPolicyList();
    this.refreshChannelList();
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