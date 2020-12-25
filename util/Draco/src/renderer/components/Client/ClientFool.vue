<template>
  <mu-container>
    <mu-select label="服务器类型"  @change="serverChange" filterable v-model="serverConfig" label-float full-width>
      <mu-option
        v-for="value, index in serverConfigList"
        :key="value.name"
        :label="value.name"
        :value="value"
      ></mu-option>
    </mu-select>

    <div class="button-wrapper">
      <mu-button
        v-loading="isCsvLoading"
        data-mu-loading-size="24"
        color="orange500"
        @click="updateCsv"
      >更新Csv</mu-button>
      <mu-button
        v-loading="isTextureLoading"
        data-mu-loading-size="24"
        color="cyan500"
        @click="updateTexture"
      >更新资源</mu-button>
      <mu-button
        v-loading="isAssetLoading"
        data-mu-loading-size="24"
        color="blue500"
        @click="updateAsset"
      >更新配置</mu-button>
      <mu-button
        v-loading="isServerLoading"
        data-mu-loading-size="24"
        color="blue500"
        @click="updateServer"
      >重启本地服</mu-button>
    </div>
    <div class="button-wrapper">
      <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
    </div>
  </mu-container>
</template>

<script>
import * as mdCsv from "../js/MdCsv.js";
import * as mdTexture from "../js/MdTexture.js";
import * as mdAsset from "../js/MdAsset.js";
import * as mdEgret from "../js/MdEgret.js";
import { Global } from "../js/Global.js";
import { ModelMgr } from "../js/model/ModelMgr";

export default {
  data() {
    return {
      isCsvLoading: false,
      isTextureLoading: false,
      isAssetLoading: false,
      isServerLoading: false,
      serverConfig:ModelMgr.versionModel.serverConfig,
      serverConfigList: ModelMgr.versionModel.serverConfigList,
    };
  },
  watch: {},
  methods: {
    onLanguageChange() {
      ModelMgr.languageModel.curLanguage = this.curLanguage;
    },
    async updateCsv() {
      this.isCsvLoading = true;
      Global.showRegionLoading();
      try {
        await mdCsv.updateSvn();
        await mdCsv.zipCsv();
        await mdCsv.copyUIText();
        this.isCsvLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isCsvLoading = false;
        Global.hideRegionLoading();
      }
    },
    async updateTexture() {
      this.isTextureLoading = true;
      Global.showRegionLoading();
      try {
        await mdTexture.updateSvn();
        await mdTexture.checkTextureRepeat();
        await mdTexture.clearTexture();
        await mdTexture.copyTextureIn();
        await mdTexture.clipTexture();
        await mdTexture.packerTexture();
        await mdTexture.copyTextureOut();
        await mdAsset.importDefault();
        await mdAsset.importAsync();
        this.isTextureLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isTextureLoading = false;
        Global.hideRegionLoading();
      }
    },
    async updateAsset() {
      this.isAssetLoading = true;
      Global.showRegionLoading();
      try {
        await mdAsset.importDefault();
        await mdAsset.importAsync();
        await mdAsset.importIndie();
        await mdAsset.importMapData();
        await mdAsset.importExternal();
        await mdAsset.importJimmy();
        this.isAssetLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isAssetLoading = false;
        Global.hideRegionLoading();
      }
    },
    async updateServer() {
      this.isServerLoading = true;
      Global.showRegionLoading();
      try {
        await mdEgret.updateServer(this.serverConfig);
        this.isServerLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isServerLoading = false;
        Global.hideRegionLoading();
      }
    },
    async oneForAll() {
      Global.showLoading();
      try {
        await this.updateCsv();
        await this.updateTexture();
        await this.updateAsset();
        await this.updateServer();
        Global.hideLoading();
        Global.toast("One·for·All Success");
      } catch (error) {
        Global.hideLoading();
        Global.snack("One·for·All Error", error);
      }
    },
    serverChange() {
      ModelMgr.versionModel.setServerConfig(this.serverConfig);
    },
  },
  mounted() {
    this.serverConfig = ModelMgr.versionModel.serverConfig || ModelMgr.versionModel.serverConfigList[0];
  },
  
};
</script>