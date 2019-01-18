<template>
  <mu-container>
    <div class="button-wrapper">
      <mu-button
        v-loading="isUpdateSvnLoading"
        data-mu-loading-size="24"
        color="pink500"
        @click="updateSvn"
      >更新svn文件</mu-button>
      <mu-button
        v-loading="isZipCsvLoading"
        data-mu-loading-size="24"
        color="orange500"
        @click="zipCsv"
      >压缩csv文件</mu-button>
      <mu-button
        v-loading="isCreateTsLoading"
        data-mu-loading-size="24"
        color="cyan500"
        @click="createTs"
      >生成ts文件</mu-button>
    </div>
    <div class="button-wrapper">
      <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
    </div>
  </mu-container>
</template>

<script>
import * as mdCsv from "../js/MdCsv.js";
import { Global } from "../js/Global.js";

export default {
  data() {
    return {
      isUpdateSvnLoading: false,
      isZipCsvLoading: false,
      isCreateTsLoading: false
    };
  },
  watch: {},
  methods: {
    async updateSvn() {
      this.isUpdateSvnLoading = true;
      Global.showRegionLoading();
      try {
        await mdCsv.updateSvn();
        this.isUpdateSvnLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isUpdateSvnLoading = false;
        Global.hideRegionLoading();
      }
    },
    async zipCsv() {
      this.isZipCsvLoading = true;
      Global.showRegionLoading();
      try {
        await mdCsv.zipCsv();
        this.isZipCsvLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isZipCsvLoading = false;
        Global.hideRegionLoading();
      }
    },
    async createTs() {
      this.isCreateTsLoading = true;
      Global.showRegionLoading();
      try {
        await mdCsv.createTs();
        this.isCreateTsLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isCreateTsLoading = false;
        Global.hideRegionLoading();
      }
    },

    async oneForAll() {
      Global.showLoading();
      try {
        await this.updateSvn();
        await this.zipCsv();
        await this.createTs();
        Global.hideLoading();
        Global.toast("One·for·All Success");
      } catch (error) {
        Global.hideLoading();
        Global.snack("One·for·All Error", error);
      }
    }
  },
  mounted() {}
};
</script>