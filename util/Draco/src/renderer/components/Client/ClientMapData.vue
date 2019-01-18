<template>
  <div>
    <mu-container>
      <div class="button-wrapper">
        <mu-button
          v-loading="isUpdateSvnLoading"
          data-mu-loading-size="24"
          color="pink500"
          @click="updateSvn"
        >更新svn文件</mu-button>
        <mu-button
          v-loading="isExecuteFileLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="executeBatFile"
        >执行bat文件</mu-button>
        <mu-button
          v-loading="isClearFileLoading"
          data-mu-loading-size="24"
          color="cyan500"
          @click="clearMapData"
        >清空地图数据</mu-button>
        <mu-button
          v-loading="isCopyFileLoading"
          data-mu-loading-size="24"
          color="blue500"
          @click="copyMapData"
        >拷贝地图数据</mu-button>
      </div>
      <div class="button-wrapper">
        <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
      </div>
    </mu-container>
    <mu-container>
      <div class="select-control-group">
        <mu-flex class="select-control-row">
          <mu-checkbox
            label="全选"
            :input-value="checkAll"
            @change="handleCheckAll"
            :checked-icon="checkBoxData.length < checkBoxValues.length ? 'indeterminate_check_box' : undefined"
          ></mu-checkbox>
        </mu-flex>
        <mu-flex
          class="select-control-row"
          :key="checkBoxValue"
          v-for="checkBoxValue in checkBoxValues"
        >
          <mu-checkbox :value="checkBoxValue" v-model="checkBoxData" :label="checkBoxValue"></mu-checkbox>
        </mu-flex>
      </div>
    </mu-container>
  </div>
</template>

<script>
import * as mdMapData from "../js/MdMapData.js";
import { Global } from "../js/Global.js";

// let exec = require("child_process").exec;
// const ipcRenderer = require("electron").ipcRenderer;
// const remote = require("electron").remote;
// const fs = require("fs");
// const spawn = require("child_process").spawn;
// const archiver = require("archiver");
// const path = require("path");

const map_data_suffix_path = "/resource/mapData";
export default {
  data() {
    return {
      project_path: "",
      map_data_path: "",
      isUpdateSvnLoading: false,
      isExecuteFileLoading: false,
      isClearFileLoading: false,
      isCopyFileLoading: false,

      checkBoxValues: mdMapData.getCheckBoxValues(),
      checkBoxData: mdMapData.getCheckBoxData(),
      checkAll: true
    };
  },
  watch: {
    checkBoxData: function(val, oldVal) {
      mdMapData.setCheckBoxData(val);
    }
  },
  methods: {
    handleCheckAll() {
      this.checkAll = !this.checkAll;
      if (this.checkAll) {
        this.checkBoxData = mdMapData.getCheckBoxValues().concat();
      } else {
        this.checkBoxData.length = 0;
      }
    },
    async updateSvn() {
      this.isUpdateSvnLoading = true;
      Global.showRegionLoading();
      try {
        await mdMapData.updateSvn();
        this.isUpdateSvnLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isUpdateSvnLoading = false;
        Global.hideRegionLoading();
      }
    },
    async executeBatFile(showDialog = true) {
      this.isExecuteFileLoading = true;
      Global.showRegionLoading();
      try {
        await mdMapData.executeBatFile();
        this.isExecuteFileLoading = false;
        Global.hideRegionLoading();
        if (showDialog) {
          Global.dialog("执行bat成功");
        }
      } catch (error) {
        this.isExecuteFileLoading = false;
        Global.hideRegionLoading();
        if (showDialog) {
          Global.dialog("执行bat错误");
        }
      }
    },
    async clearMapData() {
      this.isClearFileLoading = true;
      Global.showRegionLoading();
      try {
        await mdMapData.clearMapData();
        this.isClearFileLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isClearFileLoading = false;
        Global.hideRegionLoading();
      }
    },
    async copyMapData() {
      this.isCopyFileLoading = true;
      Global.showRegionLoading();
      try {
        await mdMapData.copyMapData();
        this.isCopyFileLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isCopyFileLoading = false;
        Global.hideRegionLoading();
      }
    },
    async oneForAll() {
      Global.showLoading();
      try {
        await this.updateSvn();
        await this.executeBatFile(false);
        await this.clearMapData();
        await this.copyMapData();
        Global.hideLoading();
        Global.dialog("One·for·All Success");
      } catch (error) {
        Global.hideLoading();
        Global.snack("One·for·All Error:", error);
      }
    }
  },
  mounted() {}
};
</script>

<style lang="css">
.select-control-row {
  padding: 8px 0;
}
.select-control-group {
  margin: 16px 0;
}
</style>