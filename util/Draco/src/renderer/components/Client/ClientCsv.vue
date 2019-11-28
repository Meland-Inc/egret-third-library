<template>
  <mu-container>
    <div class="button-wrapper">
      <mu-select
        label="语言版本"
        @change="onLanguageChange"
        filterable
        v-model="curLanguage"
        label-float
        full-width
        v-show="languageVisible"
      >
        <mu-option
          v-for="value,index in languageList"
          :key="value.name"
          :label="value.name"
          :value="value"
        ></mu-option>
      </mu-select>
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
      <mu-button
        v-loading="isCopyUITextLoading"
        data-mu-loading-size="24"
        color="blue500"
        @click="copyUIText"
      >拷贝UIText文件</mu-button>
    </div>
    <div class="button-wrapper">
      <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
    </div>
  </mu-container>
</template>

<script>
import * as mdCsv from "../js/MdCsv.js";
import { Global } from "../js/Global.js";
import { ModelMgr } from "../js/model/ModelMgr";

export default {
  data() {
    return {
      languageList: ModelMgr.languageModel.languageList,

      isUpdateSvnLoading: false,
      isZipCsvLoading: false,
      isCreateTsLoading: false,
      isCopyUITextLoading: false,

      curLanguage: ModelMgr.languageModel.curLanguage,

      languageVisible: true
    };
  },
  watch: {},
  methods: {
    onLanguageChange() {
      ModelMgr.languageModel.curLanguage = this.curLanguage;
    },
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
    async copyUIText() {
      this.isCopyUITextLoading = true;
      Global.showRegionLoading();
      try {
        await mdCsv.copyUIText();
        this.isCopyUITextLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isCopyUITextLoading = false;
        Global.hideRegionLoading();
      }
    },

    async oneForAll() {
      Global.showLoading();
      try {
        await this.updateSvn();
        await this.zipCsv();
        await this.createTs();
        await this.copyUIText();
        Global.hideLoading();
        Global.toast("One·for·All Success");
      } catch (error) {
        Global.hideLoading();
        Global.snack("One·for·All Error", error);
      }
    }
  },
  mounted() {
    this.curLanguage = ModelMgr.languageModel.curLanguage;
    this.languageVisible = !Global.mode.egretEnable;
  }
};
</script>