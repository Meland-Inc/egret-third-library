<template>
  <mu-container>
    <div class="button-wrapper">
      <mu-button
        v-loading="isImportDefaultLoading"
        data-mu-loading-size="24"
        color="pink500"
        @click="importDefault"
      >导入default配置</mu-button>
      <mu-button
        v-loading="isImportAsyncLoading"
        data-mu-loading-size="24"
        color="orange500"
        @click="importAsync"
      >导入async配置</mu-button>
      <mu-button
        v-loading="isImportIndieLoading"
        data-mu-loading-size="24"
        color="cyan500"
        @click="importIndie"
      >导入indie配置</mu-button>
      <mu-button
        v-loading="isImportMapDataLoading"
        data-mu-loading-size="24"
        color="blue500"
        @click="importMapData"
      >导入mapData配置</mu-button>
    </div>
    <div class="button-wrapper">
      <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
    </div>
  </mu-container>
</template>

<script>
import * as mdAsset from "../js/MdAsset.js";
import { Global } from "../js/Global.js";

export default {
  data() {
    return {
      isImportDefaultLoading: false,
      isImportAsyncLoading: false,
      isImportIndieLoading: false,
      isImportMapDataLoading: false
    };
  },
  watch: {},
  methods: {
    async importDefault() {
      this.isImportDefaultLoading = true;
      Global.showRegionLoading();
      try {
        await mdAsset.importDefault();
        this.isImportDefaultLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isImportDefaultLoading = false;
        Global.hideRegionLoading();
      }
    },
    async importAsync() {
      this.isImportAsyncLoading = true;
      Global.showRegionLoading();
      try {
        await mdAsset.importAsync();
        this.isImportAsyncLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isImportAsyncLoading = false;
        Global.hideRegionLoading();
      }
    },
    async importIndie() {
      this.isImportIndieLoading = true;
      Global.showRegionLoading();
      try {
        await mdAsset.importIndie();
        this.isImportIndieLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isImportIndieLoading = false;
        Global.hideRegionLoading();
      }
    },
    async importMapData() {
      this.isImportMapDataLoading = true;
      Global.showRegionLoading();
      try {
        await mdAsset.importMapData();
        this.isImportMapDataLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isImportMapDataLoading = false;
        Global.hideRegionLoading();
      }
    },
    async oneForAll() {
      Global.showLoading();
      try {
        await this.importDefault();
        await this.importAsync();
        await this.importIndie();
        await this.importMapData();
        Global.dialog("One·for·All Success");
        Global.hideLoading();
      } catch (error) {
        Global.hideLoading();
        Global.snack("One·for·All Error", error);
      }
    }
  },
  mounted() {}
};
</script>