<template>
  <mu-container>
    <div class="button-wrapper">
      <mu-button
        v-loading="isUpdateGitLoading"
        data-mu-loading-size="24"
        color="pink500"
        @click="gitPull"
      >更新git文件</mu-button>
      <mu-button
        v-loading="isComposeProtoLoading"
        data-mu-loading-size="24"
        color="orange500"
        @click="composeProto"
      >合成proto文件</mu-button>
      <mu-button
        v-loading="isCreateJsLoading"
        data-mu-loading-size="24"
        color="cyan500"
        @click="createJs"
      >生成js文件</mu-button>
      <mu-button
        v-loading="isCreateTsLoading"
        data-mu-loading-size="24"
        color="blue500"
        @click="createTs"
      >生成ts文件</mu-button>
      <mu-button
        v-loading="isModifyTsLoading"
        data-mu-loading-size="24"
        color="purple500"
        @click="modifyTs"
      >修改ts文件</mu-button>
    </div>
    <div class="button-wrapper">
      <mu-button full-width color="red500" @click="oneForAll">One·for·All</mu-button>
    </div>
  </mu-container>
</template>

<script>
import * as mdProto from "../js/MdProto.js";
import { Global } from "../js/Global.js";

export default {
  data() {
    return {
      isUpdateGitLoading: false,
      isComposeProtoLoading: false,
      isCreateJsLoading: false,
      isCreateTsLoading: false,
      isModifyTsLoading: false
    };
  },
  watch: {},
  methods: {
    async gitPull() {
      this.isUpdateGitLoading = true;
      Global.showRegionLoading();
      try {
        await mdProto.gitPull();
        this.isUpdateGitLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isUpdateGitLoading = false;
        Global.hideRegionLoading();
      }
    },
    async composeProto() {
      this.isComposeProtoLoading = true;
      Global.showRegionLoading();
      try {
        await mdProto.composeProto();
        this.isComposeProtoLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isComposeProtoLoading = false;
        Global.hideRegionLoading();
      }
    },
    async createJs() {
      this.isCreateJsLoading = true;
      Global.showRegionLoading();
      try {
        await mdProto.createJs();
        this.isCreateJsLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isCreateJsLoading = false;
        Global.hideRegionLoading();
      }
    },
    async createTs() {
      this.isCreateTsLoading = true;
      Global.showRegionLoading();
      try {
        await mdProto.createTs();
        this.isCreateTsLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isCreateTsLoading = false;
        Global.hideRegionLoading();
      }
    },
    async modifyTs() {
      this.isModifyTsLoading = true;
      Global.showRegionLoading();
      try {
        await mdProto.modifyTs();
        this.isModifyTsLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isModifyTsLoading = false;
        Global.hideRegionLoading();
      }
    },
    async oneForAll() {
      Global.showLoading();
      try {
        await this.gitPull();
        await this.composeProto();
        await this.createJs();
        await this.createTs();
        await this.modifyTs();
        Global.hideLoading();
        Global.dialog("One·for·All Success");
      } catch (error) {
        Global.hideLoading();
        Global.snack("One·for·All Error", error);
      }
    }
  },
  mounted() {}
};
</script>

<style lang="less">
</style>