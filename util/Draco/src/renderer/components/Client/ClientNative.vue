<template>
  <div>
    <mu-container>
      <div>
        <mu-select
          label="发布环境"
          @change="environChange"
          filterable
          v-model="curEnviron"
          label-float
          full-width
        >
          <mu-option
            v-for="value,index in environList"
            :key="value.name"
            :label="value.name"
            :value="value"
          ></mu-option>
        </mu-select>
      </div>
    </mu-container>
    <mu-container>
      <mu-text-field
        class="text-publisher"
        @change="updatePublishText"
        v-model="publisher"
        :error-text="publishErrorText"
      />
    </mu-container>
    <mu-container>
      <div class="button-wrapper">
        <mu-button
          v-loading="isUpdateServerPackageLoading"
          data-mu-loading-size="24"
          color="pink500"
          @click="onUpdateServerPackage"
        >更新svn服务器包</mu-button>
        <mu-button
          v-loading="isMergeServerPackageLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="onMergeServerPackage"
        >比较上传服务器包</mu-button>
        <mu-button
          v-loading="isCopyClientPackageLoading"
          data-mu-loading-size="24"
          color="cyan500"
          @click="onCopyClientPackage"
        >拷贝客户端包</mu-button>
        <mu-button
          v-loading="isPublishWinLoading"
          data-mu-loading-size="24"
          color="blue500"
          @click="onPublishWin"
        >发布windows包</mu-button>
        <mu-button
          v-loading="isPublishMacLoading"
          data-mu-loading-size="24"
          color="purple500"
          @click="onPublishMac"
        >发布mac包</mu-button>
        <mu-button
          v-loading="isUploadNativeLoading"
          data-mu-loading-size="24"
          color="green500"
          @click="onUploadNative"
        >上传native包</mu-button>
      </div>
    </mu-container>
    <mu-divider />
    <mu-container>
      <div class="button-wrapper">
        <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
      </div>
    </mu-container>
  </div>
</template>
<script>
import { ModelMgr } from "../js/model/ModelMgr.js";
import * as mdPublish from "../js/MdPublish.js";
import { Global } from "../js/Global.js";
import * as mdFtp from "../js/MdFtp.js";

export default {
  data() {
    return {
      curEnviron: ModelMgr.versionModel.curEnviron,
      environList: [],

      publisher: null,
      isUpdateServerPackageLoading: false,
      isMergeServerPackageLoading: false,
      isCopyClientPackageLoading: false,
      isPublishWinLoading: false,
      isPublishMacLoading: false,
      isUploadNativeLoading: false,

      publishErrorText: null,
      versionDescErrorText: null
    };
  },
  watch: {},
  methods: {
    updatePublishText() {
      this.publishErrorText = this.publisher ? null : "请输入发布者";
      ModelMgr.versionModel.publisher = this.publisher;
    },
    async environChange() {
      ModelMgr.versionModel.setCurEnviron(this.curEnviron);

      this.publisher = null;
      this.updatePublishText();
    },
    async onUpdateServerPackage() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      this.isUpdateServerPackageLoading = true;
      Global.showRegionLoading();
      try {
        await mdPublish.updateServerPackage();
        this.isUpdateServerPackageLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isUpdateServerPackageLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onMergeServerPackage() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      this.isMergeServerPackageLoading = true;
      Global.showRegionLoading();
      try {
        await ModelMgr.ftpModel.initQiniuOption();
        await mdPublish.mergeServerPackage();
        this.isMergeServerPackageLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isMergeServerPackageLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onCopyClientPackage() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      this.isCopyClientPackageLoading = true;
      Global.showRegionLoading();
      try {
        await mdPublish.clearPackageDir();
        await mdPublish.copyClientPackageToNative();
        this.isCopyClientPackageLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isCopyClientPackageLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onPublishWin() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      this.isPublishWinLoading = true;
      Global.showRegionLoading();
      try {
        await mdPublish.publishWin();
        this.isPublishWinLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isPublishWinLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onPublishMac() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      this.isPublishMacLoading = true;
      Global.showRegionLoading();
      try {
        await mdPublish.publishMac();
        this.isPublishMacLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isPublishMacLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onUploadNative() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      this.isUploadNativeLoading = true;
      Global.showRegionLoading();
      try {
        await ModelMgr.ftpModel.initQiniuOption();
        await mdFtp.copyPackageToSvn();
        await mdFtp.uploadNativeExe();
        await mdFtp.uploadNativeDmg();
        this.isUploadNativeLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isUploadNativeLoading = false;
        Global.hideRegionLoading();
      }
    },
    async oneForAll() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      Global.showLoading();
      try {
        let promiseList = [];
        promiseList.push(mdPublish.updateServerPackage);
        promiseList.push(ModelMgr.ftpModel.initQiniuOption);
        promiseList.push(mdPublish.mergeServerPackage);
        promiseList.push(mdPublish.clearPackageDir);
        promiseList.push(mdPublish.copyClientPackageToNative);

        promiseList.push(mdPublish.publishWin);
        promiseList.push(mdPublish.publishMac);
        promiseList.push(ModelMgr.ftpModel.initQiniuOption);
        promiseList.push(mdFtp.copyPackageToSvn);
        promiseList.push(mdFtp.uploadNativeExe);
        promiseList.push(mdFtp.uploadNativeDmg);

        await Global.executePromiseList(promiseList);

        Global.hideLoading();
        Global.dialog("One·for·All Success");
      } catch (error) {
        this.environChange();
        Global.hideLoading();
        Global.snack("One·for·All Error:", error, false);
      }
    }
  },
  async mounted() {
    if (!ModelMgr.versionModel.curEnviron) {
      ModelMgr.versionModel.initEnviron();
    }
    this.environList = ModelMgr.versionModel.environList.filter(
      value => Global.mode.environNames.indexOf(value.name) != -1
    );
    this.curEnviron = ModelMgr.versionModel.curEnviron;
    this.environChange();
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
.text-game {
  width: 120px;
}
.text-publisher {
  width: 80px;
}
</style>