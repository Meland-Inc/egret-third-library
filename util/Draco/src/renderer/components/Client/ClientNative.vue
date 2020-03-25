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
        <!-- <mu-button
          v-loading="isUpdateServerPackageLoading"
          data-mu-loading-size="24"
          color="pink500"
          @click="onUpdateServerPackage"
        >更新svn服务端包</mu-button>-->
        <mu-button
          v-loading="isMergeServerPackageLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="onMergeServerPackage"
        >更新上传服务端包</mu-button>
        <mu-button
          v-loading="isUploadClientPackageLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="onUploadClientPackage"
        >上传客户端包</mu-button>
      </div>
    </mu-container>
    <mu-divider />
    <mu-container>
      <div class="button-wrapper">
        <mu-button full-width color="red" @click="oneKeyUpload">一键上传游戏包</mu-button>
      </div>
    </mu-container>
    <mu-divider />
    <mu-container>
      <div class="button-wrapper" id="package">
        <!-- <mu-button
          v-loading="isClearPackageDirLoading"
          data-mu-loading-size="24"
          color="cyan500"
          @click="onClearPackageDir"
        >清空游戏包目录</mu-button>-->
        <mu-text-field
          class="text-publisher"
          @change="updateNativeVersionText"
          v-model="nativeVersion"
          :error-text="nativeVersionText"
        />
        <mu-button
          v-loading="isWriteVersionInfoLoading"
          data-mu-loading-size="24"
          color="blue500"
          @click="onWriteVersionInfo"
        >写入版本信息</mu-button>
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
        <mu-button
          v-loading="isApplyNativePolicyNumLoading"
          data-mu-loading-size="24"
          color="green500"
          @click="applyNativePolicyNum"
        >应用native策略号</mu-button>
      </div>
    </mu-container>
    <mu-divider />
    <mu-container>
      <div class="button-wrapper">
        <mu-button full-width color="red" @click="oneKeyPackage">一键打包native</mu-button>
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
      nativeVersion: null,
      isUpdateServerPackageLoading: false,
      isMergeServerPackageLoading: false,
      isUploadClientPackageLoading: false,
      isClearPackageDirLoading: false,
      isWriteVersionInfoLoading: false,
      isPublishWinLoading: false,
      isPublishMacLoading: false,
      isUploadNativeLoading: false,
      isApplyNativePolicyNumLoading: false,

      publishErrorText: null,
      nativeVersionText: null,
      versionDescErrorText: null
    };
  },
  watch: {},
  methods: {
    updatePublishText() {
      this.publishErrorText = this.publisher ? null : "请输入发布者";
      ModelMgr.versionModel.publisher = this.publisher;
    },
    updateNativeVersionText() {
      this.nativeVersionText = this.nativeVersion ? null : "请输入版本号";
      ModelMgr.versionModel.nativeVersion = this.nativeVersion;
    },
    checkNativeVersion() {
      console.log(
        `originNativeVersion ${ModelMgr.versionModel.originNativeVersion}`
      );
      console.log(`nativeVersion ${ModelMgr.versionModel.nativeVersion}`);
      let equal =
        ModelMgr.versionModel.originNativeVersion ===
        ModelMgr.versionModel.nativeVersion;

      console.log(`equal ${equal}`);
      return equal;
    },
    async environChange() {
      let versionModel = ModelMgr.versionModel;
      versionModel.setCurEnviron(this.curEnviron);
      this.releaseShow = this.curEnviron.name === versionModel.eEnviron.release;
      this.readyShow = this.curEnviron.name === versionModel.eEnviron.ready;

      this.publisher = null;
      this.updatePublishText();
      this.nativeVersion = ModelMgr.versionModel.nativeVersion;
    },
    // async onUpdateServerPackage() {
    //   if (!ModelMgr.versionModel.publisher) {
    //     Global.snack("请输入发布者", null, false);
    //     return;
    //   }

    //   this.isUpdateServerPackageLoading = true;
    //   Global.showRegionLoading();
    //   try {
    //     await mdPublish.updateServerPackage();
    //     this.isUpdateServerPackageLoading = false;
    //     Global.hideRegionLoading();
    //   } catch (error) {
    //     this.isUpdateServerPackageLoading = false;
    //     Global.hideRegionLoading();
    //   }
    // },
    async onMergeServerPackage() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      this.isMergeServerPackageLoading = true;
      Global.showRegionLoading();
      try {
        await mdPublish.updateServerPackage();
        await ModelMgr.ftpModel.initQiniuOption();
        await mdPublish.mergeServerPackage();
        this.isMergeServerPackageLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isMergeServerPackageLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onUploadClientPackage() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      this.isUploadClientPackageLoading = true;
      Global.showRegionLoading();
      try {
        await ModelMgr.ftpModel.initQiniuOption();
        await mdPublish.uploadClientPackage();
        this.isUploadClientPackageLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isUploadClientPackageLoading = false;
        Global.hideRegionLoading();
      }
    },
    // async onClearPackageDir() {
    //   if (!ModelMgr.versionModel.publisher) {
    //     Global.snack("请输入发布者", null, false);
    //     return;
    //   }

    //   this.isClearPackageDirLoading = true;
    //   Global.showRegionLoading();
    //   try {
    //     await mdPublish.clearPackageDir();
    //     // await mdPublish.copyClientPackageToNative();
    //     this.isClearPackageDirLoading = false;
    //     Global.hideRegionLoading();
    //   } catch (error) {
    //     this.isClearPackageDirLoading = false;
    //     Global.hideRegionLoading();
    //   }
    // },
    async onWriteVersionInfo() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      if (this.checkNativeVersion()) {
        Global.snack("请填入新的native版本号!", null, false);
        return;
      }

      this.isWriteVersionInfoLoading = true;
      Global.showRegionLoading();
      try {
        await mdPublish.writeVersionInfo();
        this.isWriteVersionInfoLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isPublishWinLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onPublishWin() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      if (this.checkNativeVersion()) {
        Global.snack("请填入新的native版本号!", null, false);
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

      if (this.checkNativeVersion()) {
        Global.snack("请填入新的native版本号!", null, false);
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

      if (this.checkNativeVersion()) {
        Global.snack("请填入新的native版本号!", null, false);
        return;
      }

      this.isUploadNativeLoading = true;
      Global.showRegionLoading();
      try {
        await ModelMgr.ftpModel.initQiniuOption();
        await mdFtp.uploadNativeExe();
        await mdFtp.uploadNativeDmg();
        this.isUploadNativeLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isUploadNativeLoading = false;
        Global.hideRegionLoading();
      }
    },
    async applyNativePolicyNum() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      if (this.checkNativeVersion()) {
        Global.snack("请填入新的native版本号!", null, false);
        return;
      }

      this.isApplyNativePolicyNumLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.applyNativePolicyNum();
        this.isApplyNativePolicyNumLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isApplyNativePolicyNumLoading = false;
        Global.hideRegionLoading();
      }
    },
    //一键上传
    async oneKeyUpload() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      Global.showLoading();
      try {
        let promiseList = [];
        promiseList.push(mdPublish.updateServerPackage);
        promiseList.push(
          ModelMgr.ftpModel.initQiniuOption.bind(ModelMgr.ftpModel)
        );
        promiseList.push(mdPublish.mergeServerPackage);
        promiseList.push(
          ModelMgr.ftpModel.initQiniuOption.bind(ModelMgr.ftpModel)
        );
        promiseList.push(mdPublish.uploadClientPackage);

        await Global.executePromiseList(promiseList);

        Global.hideLoading();
        Global.dialog("One·for·All Success");
      } catch (error) {
        this.environChange();
        Global.hideLoading();
        Global.snack("One·for·All Error:", error, false);
      }
    },
    //一键打包
    async oneKeyPackage() {
      if (!ModelMgr.versionModel.publisher) {
        Global.snack("请输入发布者", null, false);
        return;
      }

      if (this.checkNativeVersion()) {
        Global.snack("请填入新的native版本号!", null, false);
        return;
      }

      Global.showLoading();
      try {
        let promiseList = [];
        promiseList.push(mdPublish.clearPackageDir);
        promiseList.push(mdPublish.writeVersionInfo);
        promiseList.push(mdPublish.publishWin);
        promiseList.push(mdPublish.publishMac);
        promiseList.push(
          ModelMgr.ftpModel.initQiniuOption.bind(ModelMgr.ftpModel)
        );
        promiseList.push(mdFtp.uploadNativeExe);
        promiseList.push(mdFtp.uploadNativeDmg);
        promiseList.push(mdFtp.applyNativePolicyNum);

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
    let versionModel = ModelMgr.versionModel;
    this.curEnviron = versionModel.curEnviron = versionModel.environList.find(
      value => value.name === versionModel.eEnviron.ready
    );
    this.environList = versionModel.environList.filter(
      value =>
        value.name === versionModel.eEnviron.ready ||
        value.name === versionModel.eEnviron.release
    );
    this.environChange();
    this.nativeVersion = versionModel.nativeVersion;
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

#package {
  padding-top: 100px;
}
</style>