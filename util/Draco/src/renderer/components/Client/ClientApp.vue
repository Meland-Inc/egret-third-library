<template>
  <div>
    <mu-container>
      <div class="button-wrapper">
        <mu-button
          v-loading="isExportVersionLoading"
          data-mu-loading-size="24"
          color="pink500"
          @click="onExportVersion"
        >导出所选版本</mu-button>
        <mu-button
          v-loading="isExportApkLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="onExportApk"
        >打包apk</mu-button>
        <mu-button
          v-loading="isExportIpaLoading"
          data-mu-loading-size="24"
          color="cyan500"
          @click="onExportIpa"
        >打包ipa</mu-button>
      </div>
      <div class="button-wrapper">
        <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
      </div>
    </mu-container>

    <mu-container>
      <div class="select-control-group">
        <mu-auto-complete
          :data="newVersionList"
          label="新版本号"
          v-model="newVersion"
          open-on-focus
          label-float
          full-width
        ></mu-auto-complete>

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
          v-for="checkBoxValue,checkBoxIndex in checkBoxValues"
        >
          <mu-col span="12" lg="2" sm="2">
            <mu-checkbox :value="checkBoxValue" v-model="checkBoxData" :label="checkBoxValue"></mu-checkbox>
          </mu-col>
          <mu-col span="12" lg="10" sm="10">
            <mu-select filterable v-model="appProjs[checkBoxIndex]" label-float full-width>
              <mu-option
                v-for="value,index in appPaths[checkBoxIndex]"
                :key="value"
                :label="value"
                :value="value"
              ></mu-option>
            </mu-select>
          </mu-col>
        </mu-flex>
      </div>
    </mu-container>
  </div>
</template>

<script>
import { Global } from "../js/Global.js";
import * as mdApp from "../js/MdApp.js";
import * as fsExc from "../js/FsExecute.js";
export default {
  data() {
    return {
      isExportVersionLoading: false,
      isExportApkLoading: false,
      isExportIpaLoading: false,
      checkBoxValues: mdApp.checkBoxValues,
      checkBoxData: mdApp.getCheckBoxData(),
      checkAll: true,
      appProjs: [],
      appPaths: [],
      newVersion: "",
      newVersionList: []
    };
  },
  watch: {
    checkBoxData: val => {
      mdApp.setCheckBoxData(val);
    },
    newVersion: val => {
      mdApp.setNewVersion(val);
    },
    appProjs: val => {
      mdApp.setAppProjs(val);
    }
  },
  methods: {
    handleCheckAll() {
      this.checkAll = !this.checkAll;
      if (this.checkAll) {
        this.checkBoxData = mdApp.checkBoxValues.concat();
      } else {
        this.checkBoxData.length = 0;
      }
    },
    async refreshNewVersionList() {
      if (await fsExc.exists(Global.releasePath)) {
        this.newVersionList = await fsExc.readDir(
          Global.svnPublishPath + "/web/"
        );
      } else {
        this.newVersionList = [];
      }
    },
    async onExportVersion(showDialog = true) {
      this.isExportVersionLoading = true;
      Global.showRegionLoading();
      try {
        await mdApp.exportVersion();
        this.isExportVersionLoading = false;
        Global.hideRegionLoading();
        if (showDialog) {
          Global.dialog("导出所选版本成功");
        }
      } catch (error) {
        this.isExportVersionLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onExportApk(showDialog = true) {
      this.isExportApkLoading = true;
      Global.showRegionLoading();
      try {
        await mdApp.exportApk();
        this.isExportApkLoading = false;
        Global.hideRegionLoading();
        if (showDialog) {
          Global.dialog("导出APK成功");
        }
      } catch (error) {
        this.isExportApkLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onExportIpa(showDialog = true) {
      this.isExportIpaLoading = true;
      Global.showRegionLoading();
      try {
        await mdApp.exportIpa();
        this.isExportIpaLoading = false;
        Global.hideRegionLoading();
        if (showDialog) {
          Global.dialog("导出IPA成功");
        }
      } catch (error) {
        this.isExportIpaLoading = false;
        Global.hideRegionLoading();
      }
    },

    async oneForAll() {
      Global.showLoading();
      try {
        await this.onExportVersion(false);
        await this.onExportApk(false);
        await this.onExportIpa(false);
        Global.hideLoading();
        Global.toast("One·for·All Success");
      } catch (error) {
        Global.hideLoading();
        Global.snack("One·for·All Error", error);
      }
    }
  },
  async mounted() {
    this.refreshNewVersionList();

    let androidPaths = await mdApp.getAndroidPaths();
    let iosPaths = await mdApp.getIosPaths();
    let wechatPaths = await mdApp.getWechatPaths();
    this.appPaths = [androidPaths, iosPaths, wechatPaths];
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
</style>