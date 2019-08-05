<template>
  <div>
    <mu-container>
      <div class="button-wrapper">
        <mu-button
          v-loading="isCompressPicturesLoading"
          data-mu-loading-size="24"
          color="pink500"
          @click="onCompressPicturesClick"
        >压缩图片</mu-button>
        <mu-button
          v-loading="isPublishProjectLoading"
          data-mu-loading-size="24"
          color="orange500"
          @click="onPublishProjectClick"
        >发布当前项目</mu-button>
        <mu-button
          v-loading="isCopyCompressPicLoading"
          data-mu-loading-size="24"
          color="cyan500"
          @click="onCopyPicturesClick"
        >拷贝压缩图片</mu-button>
        <mu-button
          v-loading="isMergeVersionLoading"
          data-mu-loading-size="24"
          color="blue500"
          @click="onMergetVersionClick"
        >比较新旧版本</mu-button>
      </div>
      <div class="button-wrapper">
        <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
      </div>
    </mu-container>
    <mu-container>
      <div>
        <mu-flex class="flex-wrapper" align-items="center">
          <mu-col span="12" lg="2" sm="2">
            <mu-checkbox v-model="needCover" label="覆盖"></mu-checkbox>
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-checkbox v-model="needCompress" label="压缩"></mu-checkbox>
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-text-field class="text-version" v-model="releaseVersion" label="发布版本号" label-float />
          </mu-col>
          <!-- <mu-col span="12" lg="2" sm="2">
            <mu-text-field class="text-version" v-model="displayVersion" label="显示版本号" label-float/>
          </mu-col>
          <mu-col span="12" lg="2" sm="2">
            <mu-select label="选择类型" filterable v-model="versionType" label-float full-width>
              <mu-option v-for="type,index in versionTypes" :key="type" :label="type" :value="type"></mu-option>
            </mu-select>
          </mu-col>-->
          <mu-col span="12" lg="2" sm="2">
            <mu-select
              label="旧版本号"
              filterable
              v-model="oldVersion"
              @change="onOldVersionChange"
              label-float
              full-width
            >
              <mu-option
                v-for="value,index in oldVersionList"
                :key="value"
                :label="value"
                :value="value"
              ></mu-option>
            </mu-select>
          </mu-col>
        </mu-flex>
      </div>
    </mu-container>
    <mu-divider />
    <mu-container>
      <mu-flex class="flex-wrapper" align-items="center">
        <mu-button @click="onOpenWhiteDialog">
          <mu-icon left color="red" value="edit"></mu-icon>编辑白名单
        </mu-button>
        <mu-button @click="onOpenCdnDialog">
          <mu-icon left color="blue" value="text_format"></mu-icon>编辑cdn路径
        </mu-button>
      </mu-flex>
    </mu-container>
    <mu-container>
      <mu-dialog
        title="白名单列表"
        width="360"
        scrollable
        :open.sync="whiteVisible"
        :overlay-close="false"
        :exc-press-close="false"
      >
        <mu-list>
          <mu-list-item :ripple="true" :key="value" v-for="(value, key) in whiteList">
            <mu-list-item-title>{{value}}</mu-list-item-title>
            <mu-list-item-action>
              <mu-button
                icon
                @click="()=>{
                  whiteList.splice(key, 1);
                }"
              >
                <mu-icon value="delete"></mu-icon>
              </mu-button>
            </mu-list-item-action>
          </mu-list-item>
          <mu-divider />
          <br />
          <mu-list-item>
            <mu-list-item-action>
              <mu-text-field
                :label-float="true"
                label="添加名单"
                v-model="addWhite"
                action-icon="add"
                :action-click="onAddWhite"
              ></mu-text-field>
            </mu-list-item-action>
          </mu-list-item>
        </mu-list>
        <mu-button slot="actions" color="error" @click="onCancelWhiteDialog">cancel</mu-button>
        <mu-button slot="actions" color="success" @click="onConfirmWhiteDialog">confirm</mu-button>
      </mu-dialog>
    </mu-container>
    <mu-container>
      <mu-dialog
        title="设置cdn路径"
        width="360"
        scrollable
        :open.sync="cdnVisible"
        :overlay-close="false"
        :exc-press-close="false"
      >
        <mu-text-field :label-float="true" label="cdn路径" v-model="cdnUrl"></mu-text-field>
        <mu-button slot="actions" color="error" @click="onCancelCdnDialog">cancel</mu-button>
        <mu-button slot="actions" color="success" @click="onConfirmCdnDialog">confirm</mu-button>
      </mu-dialog>
    </mu-container>
  </div>
</template>

<script>
import * as mdPublish from "../js/MdPublish.js";
import * as mdCompress from "../js/MdCompress.js";
import * as fsExc from "../js/FsExecute.js";
import { Global } from "../js/Global.js";

export default {
  data() {
    return {
      isPublishProjectLoading: false,
      isMergeVersionLoading: false,
      isCompressPicturesLoading: false,
      isCopyCompressPicLoading: false,
      needCover: mdPublish.getNeedCover(),
      needCompress: mdPublish.getNeedCompress(),
      oldVersion: "",
      releaseVersion: "",
      // displayVersion: "",
      // whiteVersion: "",

      // versionType: "",
      // versionTypes: null,

      cdnUrl: "",
      whiteList: [],
      whiteVisible: false,
      cdnVisible: false,
      addWhite: "",
      policyObj: { whiteList: [], cdnUrl: "" },

      oldVersionList: []
    };
  },
  watch: {
    releaseVersion: val => {
      mdPublish.setReleaseVersion(val);
      mdPublish.setNewVersion(val);
    },
    // displayVersion: val => {
    //   mdPublish.setDisplayVersion(val);
    // },
    oldVersion: val => {
      mdPublish.setOldVersion(val);
    },
    needCover: val => {
      mdPublish.setNeedCover(val);
    },
    needCompress: val => {
      mdPublish.setNeedCompress(val);
    }
  },
  methods: {
    async onOldVersionChange() {
      if (this.oldVersion != "0") {
        // let releaseDirPath = `${Global.svnPublishPath}/web/release_v${
        //   this.oldVersion
        // }s`;
        // if (await fsExc.exists(releaseDirPath)) {
        //   let releaseDir = await fsExc.readDir(releaseDirPath);
        //   for (const iterator of releaseDir) {
        //     if (iterator.indexOf(`policyFile`) != -1) {
        //       let policyContent = await fsExc.readFile(
        //         releaseDirPath + "/" + iterator
        //       );
        //       let policyObj = JSON.parse(policyContent);
        //       // this.displayVersion = policyObj.displayVersion;
        //       return;
        //     }
        //   }
        // } else {
        //   // this.displayVersion = this.releaseVersion;

        this.releaseVersion = (parseInt(this.oldVersion) + 1).toString();
        return;
      }

      this.oldVersion = "0";
      this.releaseVersion = (
        parseInt(this.oldVersionList[this.oldVersionList.length - 1]) + 1
      ).toString();
    },
    onAddWhite() {
      if (this.addWhite == "") {
        return;
      }
      if (this.whiteList.indexOf(this.addWhite) != -1) {
        return;
      }
      this.whiteList.push(this.addWhite);
      this.addWhite = "";
    },
    onOpenWhiteDialog() {
      this.whiteVisible = true;
    },
    onConfirmWhiteDialog() {
      this.whiteVisible = false;
      this.policyObj.whiteList = this.whiteList.concat();
      mdPublish.setPolicyObj(this.policyObj);
      this.addWhite = "";
    },
    onCancelWhiteDialog() {
      this.whiteVisible = false;
      this.whiteList = this.policyObj.whiteList.concat();
      this.addWhite = "";
    },
    onOpenCdnDialog() {
      this.cdnVisible = true;
    },
    onConfirmCdnDialog() {
      this.cdnVisible = false;
      this.policyObj.cdnUrl = this.cdnUrl;
      mdPublish.setPolicyObj(this.policyObj);
    },
    onCancelCdnDialog() {
      this.cdnVisible = false;
      this.cdnUrl = this.policyObj.cdnUrl;
    },
    async onCompressPicturesClick(showDialog = true) {
      this.isCompressPicturesLoading = true;
      Global.showRegionLoading();

      await mdCompress
        .compareFile()
        .then(value => {
          this.isCompressPicturesLoading = false;
          Global.hideRegionLoading();
          if (showDialog) {
            Global.dialog("压缩成功");
          }
        })
        .catch(reason => {
          this.isCompressPicturesLoading = false;
          Global.hideRegionLoading();
        });
    },
    async onPublishProjectClick(showDialog = true) {
      this.isPublishProjectLoading = true;
      Global.showRegionLoading();
      try {
        await mdPublish.publishProject();
        this.isPublishProjectLoading = false;
        Global.hideRegionLoading();
        if (showDialog) {
          Global.dialog("发布当前项目成功");
        }
      } catch (error) {
        this.isPublishProjectLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onCopyPicturesClick(showDialog = true) {
      this.isCopyCompressPicLoading = true;
      Global.showRegionLoading();

      await mdPublish
        .clearAndCopyResource()
        .then(value => {
          this.isCopyCompressPicLoading = false;
          Global.hideRegionLoading();
          if (showDialog) {
            Global.dialog("拷贝压缩图片成功");
          }
        })
        .catch(reason => {
          this.isCopyCompressPicLoading = false;
          Global.hideRegionLoading();
        });
    },
    async onMergetVersionClick(showDialog = true) {
      this.isMergeVersionLoading = true;
      Global.showRegionLoading();

      await mdPublish
        .mergeVersion()
        .then(value => {
          this.isMergeVersionLoading = false;
          Global.hideRegionLoading();
          if (showDialog) {
            Global.dialog("比较新旧成功");
          }
        })
        .catch(reason => {
          this.isMergeVersionLoading = false;
          Global.hideRegionLoading();
        });
    },
    async oneForAll() {
      Global.showLoading();
      try {
        if (this.needCompress) {
          await this.onCompressPicturesClick(false);
        }
        await this.onPublishProjectClick(false);
        if (this.needCompress) {
          await this.onCopyPicturesClick(false);
        }
        await this.onMergetVersionClick(false);
        Global.hideLoading();
        Global.dialog("One·for·All Success");
      } catch (error) {
        Global.hideLoading();
        Global.snack("One·for·All Error:", error);
      }
    },
    async refreshOldVersionList() {
      let versionListContent = await fsExc.readFile(
        Global.svnPublishPath + "/versionList.json"
      );
      let versionList = JSON.parse(versionListContent);
      this.oldVersionList = versionList.versionList;

      let tempVersion = this.oldVersionList[this.oldVersionList.length - 1];
      let exists = await fsExc.exists(
        `${Global.svnPublishPath}/web/release_v${tempVersion}s`
      );
      if (!exists) {
        this.oldVersion = "0";
      } else {
        this.oldVersion = tempVersion;
      }

      this.onOldVersionChange();
    },
    async refreshPolicyFile() {
      this.policyObj = await mdPublish.getPolicyObj();
      this.cdnUrl = this.policyObj.cdnUrl;
      this.whiteList = this.policyObj.whiteList.concat();
    }
  },
  mounted() {
    this.refreshOldVersionList();
    this.refreshPolicyFile();

    // this.versionTypes = mdPublish.versionTypes;
    // this.versionType = this.versionTypes[0];
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
</style>