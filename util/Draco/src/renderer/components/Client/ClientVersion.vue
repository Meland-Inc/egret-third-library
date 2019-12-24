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
      <mu-checkbox v-model="containNative" label="native包"></mu-checkbox>
      <mu-button small v-show="!isAdvanceMode" @click="changeAdvanceMode">
        <mu-icon value="add"></mu-icon>高级模式
      </mu-button>
      <mu-button small v-show="isAdvanceMode" @click="changeAdvanceMode">
        <mu-icon value="remove"></mu-icon>垃圾模式
      </mu-button>
      <mu-text-field
        class="text-publisher"
        @change="updatePublishText"
        v-model="publisher"
        :error-text="publishErrorText"
      />
      <mu-text-field
        @change="updateVersionDescText"
        v-model="versionDesc"
        :error-text="versionDescErrorText"
        v-show="curEnviron&&curEnviron.publishDescEnable"
      />
      <mu-container v-show="!isAdvanceMode">
        <mu-button large round color="red" @click="oneForAll">
          <mu-icon value="touch_app"></mu-icon>
          {{oneClickContent}}
        </mu-button>
      </mu-container>
    </mu-container>
    <mu-container v-show="isAdvanceMode">
      <mu-container v-show="curEnviron&&curEnviron.publishEnable">
        <div class="button-wrapper">
          <mu-button
            v-loading="isUpdateGitLoading"
            data-mu-loading-size="24"
            color="pink500"
            @click="onUpdateGitClick"
            v-show="curEnviron&&curEnviron.updateGitEnable"
          >更新GIT文件</mu-button>
          <mu-button
            v-loading="isCompressPicLoading"
            data-mu-loading-size="24"
            color="orange500"
            @click="onCompressFileClick"
            v-show="curEnviron&&curEnviron.compressPicEnable"
          >压缩图片</mu-button>
          <mu-button
            v-loading="isPublishProjectLoading"
            data-mu-loading-size="24"
            color="cyan500"
            @click="onPublishProjectClick"
          >发布当前项目</mu-button>
          <mu-button
            v-loading="isCopyCompressPicLoading"
            data-mu-loading-size="24"
            color="blue500"
            @click="onCopyPicturesClick"
            v-show="curEnviron&&curEnviron.compressPicEnable"
          >拷贝压缩图片</mu-button>
          <mu-button
            v-loading="isMergeVersionLoading"
            data-mu-loading-size="24"
            color="purple500"
            @click="onMergeVersionClick"
            v-show="curEnviron&&curEnviron.mergeVersionEnable"
          >比较新旧版本</mu-button>

          <!-- <mu-button @click="onTestClick" v-loading="isTestLoading">Test</mu-button> -->
        </div>
        <div>
          <mu-flex class="flex-wrapper" align-items="center">
            <mu-col span="12" lg="2" sm="2" v-show="curEnviron&&curEnviron.mergeVersionEnable">
              <mu-checkbox v-model="needCover" label="覆盖"></mu-checkbox>
            </mu-col>
            <mu-col span="12" lg="2" sm="2" v-show="curEnviron&&curEnviron.compressPicEnable">
              <mu-checkbox v-model="needCompress" label="压缩"></mu-checkbox>
            </mu-col>
            <mu-col span="12" lg="2" sm="2" v-show="curEnviron&&curEnviron.mergeVersionEnable">
              <mu-text-field
                class="text-version"
                v-model="releaseVersion"
                label="发布版本号"
                label-float
              />
            </mu-col>
            <mu-col span="12" lg="2" sm="2" v-show="curEnviron&&curEnviron.mergeVersionEnable">
              <mu-select label="旧版本号" filterable v-model="oldVersion" label-float full-width>
                <mu-option
                  v-for="value,index in oldVersionList"
                  :key="value"
                  :label="value"
                  :value="value"
                ></mu-option>
              </mu-select>
            </mu-col>
            <mu-col span="12" lg="2" sm="2" v-show="curEnviron&&curEnviron.mergeVersionEnable">
              <mu-button @click="onOpenWhiteDialog">
                <mu-icon left color="red" value="edit"></mu-icon>编辑白名单
              </mu-button>
            </mu-col>
            <mu-col span="12" lg="2" sm="2" v-show="editCdnUrlEnable">
              <mu-button @click="onOpenCdnDialog">
                <mu-icon left color="blue" value="text_format"></mu-icon>编辑cdn路径
              </mu-button>
            </mu-col>
          </mu-flex>
        </div>
      </mu-container>
      <mu-divider />
      <mu-container>
        <div class="button-wrapper">
          <mu-button
            v-loading="isZipVersionLoading"
            data-mu-loading-size="24"
            color="pink500"
            @click="onZipVersion"
            v-show="curEnviron&&curEnviron.zipFileEnable"
          >压缩游戏版本</mu-button>
          <mu-button
            v-loading="isUploadVersionLoading"
            data-mu-loading-size="24"
            color="orange500"
            @click="onUploadVersionFile"
          >上传游戏版本</mu-button>
        </div>
        <mu-container v-show="curEnviron&&curEnviron.scpEnable">
          <mu-flex class="flex-wrapper" align-items="center">
            <mu-col span="12" lg="2" sm="2" v-show="curEnviron&&curEnviron.mergeVersionEnable">
              <mu-checkbox v-model="needPatch" @change="needPatchChange" label="patch包"></mu-checkbox>
            </mu-col>
            <mu-col span="12" lg="3" sm="3" v-show="curEnviron&&curEnviron.mergeVersionEnable">
              <mu-select label="上传游戏版本" filterable v-model="uploadVersion" label-float full-width>
                <mu-option
                  v-for="value,index in gameVersionList"
                  :key="value"
                  :label="value"
                  :value="value"
                ></mu-option>
              </mu-select>
            </mu-col>
          </mu-flex>
        </mu-container>
      </mu-container>
      <mu-divider />
      <mu-container v-show="curEnviron&&curEnviron.policyEnable">
        <div class="button-wrapper">
          <mu-button
            v-loading="isCreatePolicyFileLoading"
            data-mu-loading-size="24"
            color="cyan500"
            @click="onCreatePolicyFile"
          >生成策略文件</mu-button>
          <mu-button
            v-loading="isModifyPolicyNumLoading"
            data-mu-loading-size="24"
            color="blue500"
            @click="onModifyPolicyFile"
          >修改策略文件</mu-button>
          <mu-button
            v-loading="isUploadPolicyLoading"
            data-mu-loading-size="24"
            color="purple500"
            @click="onUploadPolicyFile"
          >上传策略文件</mu-button>
          <mu-button
            v-loading="isApplyPolicyNumLoading"
            data-mu-loading-size="24"
            color="green500"
            @click="onApplyPolicyNum"
          >应用策略版本</mu-button>
        </div>
        <div>
          <mu-flex class="flex-wrapper" align-items="center">
            <mu-col span="12" lg="2" sm="2">
              <mu-text-field class="text-game" v-model="policyNum" label="策略版本号" label-float />
            </mu-col>
            <mu-col span="12" lg="2" sm="2">
              <mu-text-field class="text-game" v-model="whiteVersion" label="白名单游戏版本" label-float />
            </mu-col>
            <mu-col span="12" lg="2" sm="2">
              <mu-text-field class="text-game" v-model="normalVersion" label="常规游戏版本" label-float />
            </mu-col>
            <mu-col span="12" lg="2" sm="2">
              <mu-text-field class="text-game" v-model="displayVersion" label="显示版本号" label-float />
            </mu-col>
            <mu-col span="12" lg="2" sm="2">
              <mu-select label="选择类型" filterable v-model="versionType" label-float full-width>
                <mu-option
                  v-for="type,index in versionTypes"
                  :key="type"
                  :label="type"
                  :value="type"
                ></mu-option>
              </mu-select>
            </mu-col>
            <mu-col span="12" lg="2" sm="2">
              <mu-select label="选择渠道号" filterable v-model="channel" label-float full-width>
                <mu-option
                  v-for="value,index in channelList"
                  :key="value"
                  :label="value"
                  :value="value"
                ></mu-option>
              </mu-select>
            </mu-col>
          </mu-flex>
          <mu-divider />
          <mu-container>
            <div class="button-wrapper">
              <mu-button @click="onCheckPolicyNum">当前策略版本</mu-button>
              <mu-button @click="onCheckGameVerison">当前游戏版本</mu-button>
            </div>
          </mu-container>
          <mu-divider />
          <mu-container v-show="containNative&&curEnviron&&curEnviron.nativeEnable">
            <mu-button
              v-loading="isPublishNativeLoading"
              data-mu-loading-size="24"
              color="pink500"
              @click="onPublishNative"
            >生成native包</mu-button>
            <mu-button
              v-loading="isUploadNativeLoading"
              data-mu-loading-size="24"
              color="orange500"
              @click="onUploadNative"
            >上传native包</mu-button>
          </mu-container>
          <mu-divider />
          <div class="button-wrapper">
            <mu-button
              v-loading="isCommitGitLoading"
              data-mu-loading-size="24"
              color="pink500"
              @click="commitGit"
              v-show="curEnviron&&(curEnviron.pushGitEnable||curEnviron.gitTagEnable)"
            >Git提交文件</mu-button>
            <mu-button
              v-loading="isPullGitLoading"
              data-mu-loading-size="24"
              color="orange500"
              @click="pushGit"
              v-show="curEnviron&&(curEnviron.pushGitEnable||curEnviron.gitTagEnable)"
            >Git推送文件</mu-button>
            <mu-button
              v-loading="isZipUploadGameLoading"
              data-mu-loading-size="24"
              color="cyan500"
              @click="zipUploadGame"
              v-show="curEnviron&&curEnviron.zipUploadGameEnable"
            >打包上传游戏</mu-button>
          </div>
        </div>
      </mu-container>
      <mu-divider />
      <mu-container>
        <div class="button-wrapper">
          <mu-button full-width color="red" @click="oneForAll">One·for·All</mu-button>
        </div>
      </mu-container>
      <mu-container></mu-container>
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
    </mu-container>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { ModelMgr } from "../js/model/ModelMgr.js";
import * as mdPublish from "../js/MdPublish.js";
import * as mdCompress from "../js/MdCompress.js";
import * as fsExc from "../js/FsExecute.js";
import { Global } from "../js/Global.js";
import * as mdFtp from "../js/MdFtp.js";

export default {
  data() {
    return {
      oneClickContent: "只需要点一下就够了.",
      containNative: false,
      isAdvanceMode: false,
      isTestLoading: false,

      isUpdateGitLoading: false,
      isPublishProjectLoading: false,
      isMergeVersionLoading: false,
      isCompressPicLoading: false,
      isCopyCompressPicLoading: false,

      isZipVersionLoading: false,
      isUploadVersionLoading: false,

      isCreatePolicyFileLoading: false,
      isModifyPolicyNumLoading: false,
      isUploadPolicyLoading: false,
      isApplyPolicyNumLoading: false,

      isCommitGitLoading: false,
      isPullGitLoading: false,
      isGitTagLoading: false,
      isZipUploadGameLoading: false,

      isPublishNativeLoading: false,
      isUploadNativeLoading: false,

      needCover: ModelMgr.versionModel.needCover,
      needCompress: ModelMgr.versionModel.needCompress,
      oldVersion: "",
      oldVersionList: [],
      releaseVersion: "",
      cdnUrl: "",
      whiteList: [],
      whiteVisible: false,
      cdnVisible: false,
      addWhite: "",

      editCdnUrlEnable: true,

      patchList: [],
      releaseList: [],
      curEnviron: ModelMgr.versionModel.curEnviron,
      environList: [],

      needPatch: true,
      gameVersionList: [],
      uploadVersion: null,

      policyNum: 0,
      whiteVersion: null,
      normalVersion: null,
      displayVersion: null,
      versionTypes: null,
      versionType: "",
      channelList: [],
      channel: null,
      publisher: null,
      versionDesc: null,

      publishErrorText: null,
      versionDescErrorText: null
    };
  },
  watch: {
    releaseVersion: val => {
      ModelMgr.versionModel.setReleaseVersion(val);
      ModelMgr.versionModel.setNewVersion(val);
    },
    oldVersion: val => {
      ModelMgr.versionModel.setOldVersion(val);
    },
    needCover: val => {
      ModelMgr.versionModel.setNeedCover(val);
    },
    needCompress: val => {
      ModelMgr.versionModel.setNeedCompress(val);
    },
    needPatch: value => {
      ModelMgr.versionModel.setNeedPatch(value);
    },
    uploadVersion: value => {
      ModelMgr.versionModel.setUploadVersion(value);
    },
    policyNum: value => {
      ModelMgr.versionModel.setPolicyNum(value);
    },
    whiteVersion: value => {
      ModelMgr.versionModel.setWhiteVersion(value);
    },
    normalVersion: value => {
      ModelMgr.versionModel.setNormalVersion(value);
    },
    displayVersion: value => {
      ModelMgr.versionModel.setDisplayVersion(value);
    },
    versionType: val => {
      ModelMgr.versionModel.setVersionType(val);
    },
    channel: value => {
      ModelMgr.versionModel.setChannel(value);
    }
  },
  methods: {
    async onTestClick() {
      // this.isTestLoading = true;
      // await mdPublish.copyVersionToNative();
      // await mdPublish.publishWin();
      // await mdPublish.publishMac();
      // await ModelMgr.ftpModel.initQiniuOption();
      // await mdFtp.copyPackageToSvn();
      // await mdFtp.uploadNativeExe();
      // await mdFtp.uploadNativeDmg();
      // this.isTestLoading = false;
    },
    updatePublishText() {
      this.publishErrorText = this.publisher ? null : "请输入发布者";
      ModelMgr.versionModel.publisher = this.publisher;
    },
    updateVersionDescText() {
      this.versionDescErrorText = this.versionDesc ? null : "请输入版本描述";
      ModelMgr.versionModel.versionDesc = this.versionDesc;
    },
    changeAdvanceMode() {
      this.isAdvanceMode = !this.isAdvanceMode;
    },
    async environChange() {
      ModelMgr.versionModel.setCurEnviron(this.curEnviron);
      this.editCdnUrlEnable =
        this.curEnviron.name === ModelMgr.versionModel.eEnviron.release;
      this.needPatch = ModelMgr.versionModel.needPatch;

      this.cdnUrl = ModelMgr.versionModel.cdnUrl;
      this.versionTypes = ModelMgr.versionModel.versionTypes;
      this.versionType = ModelMgr.versionModel.versionType;

      await this.refreshVersionList();
      this.refreshChannelList();

      await ModelMgr.versionModel.initReleaseVersion();
      this.releaseVersion = ModelMgr.versionModel.releaseVersion;
      await ModelMgr.versionModel.initPolicyNum();
      this.policyNum = ModelMgr.versionModel.policyNum;
      let oldVersion = ModelMgr.versionModel.oldVersion;
      this.oldVersion = oldVersion ? oldVersion : "0";
      this.publisher = null;
      this.updatePublishText();
      this.updateVersionDescText();
    },
    needPatchChange() {
      if (this.needPatch) {
        this.gameVersionList = this.patchList;
      } else {
        this.gameVersionList = this.releaseList;
      }
      this.uploadVersion = this.gameVersionList[
        this.gameVersionList.length - 1
      ];
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
      ModelMgr.versionModel.setWhiteList(this.whiteList.concat());
      this.addWhite = "";
    },
    onCancelWhiteDialog() {
      this.whiteVisible = false;
      this.whiteList = ModelMgr.versionModel.whiteList.concat();
      this.addWhite = "";
    },
    onOpenCdnDialog() {
      this.cdnVisible = true;
    },
    onConfirmCdnDialog() {
      this.cdnVisible = false;
      ModelMgr.versionModel.setCdnUrl(this.cdnUrl);
    },
    onCancelCdnDialog() {
      this.cdnVisible = false;
      this.cdnUrl = ModelMgr.versionModel.cdnUrl;
    },
    async onUpdateGitClick() {
      this.isUpdateGitLoading = true;
      Global.showRegionLoading();

      await mdPublish
        .updateGit()
        .then(() => {
          this.isUpdateGitLoading = false;
          Global.hideRegionLoading();
        })
        .catch(() => {
          this.isUpdateGitLoading = false;
          Global.hideRegionLoading();
        });
      // try {
      //   await mdPublish.updateGit();
      // } catch (error) {
      // }
    },
    async onCompressFileClick(showDialog = true) {
      this.isCompressPicLoading = true;
      Global.showRegionLoading();

      await mdCompress
        .compressFile()
        .then(value => {
          this.isCompressPicLoading = false;
          Global.hideRegionLoading();
          if (showDialog) {
            Global.dialog("压缩成功");
          }
        })
        .catch(reason => {
          this.isCompressPicLoading = false;
          Global.hideRegionLoading();
        });
    },
    async onPublishProjectClick(showDialog = true) {
      this.isPublishProjectLoading = true;
      Global.showRegionLoading();
      try {
        await mdPublish.publishProject();
        await this.refreshVersionList();
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
        .copyPictures()
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
    async onMergeVersionClick(showDialog = true) {
      this.isMergeVersionLoading = true;
      Global.showRegionLoading();

      await mdPublish
        .mergeVersion()
        .then(async value => {
          await this.refreshVersionList();
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
    async onZipVersion() {
      this.isZipVersionLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.zipVersion();
        this.isZipVersionLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isZipVersionLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onUploadVersionFile(showDialog = true) {
      this.isUploadVersionLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.uploadVersionFile();
        this.isUploadVersionLoading = false;
        Global.hideRegionLoading();
        if (showDialog) {
          Global.dialog("上传游戏版本成功");
        }
      } catch (error) {
        this.isUploadVersionLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onCreatePolicyFile() {
      this.isCreatePolicyFileLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.createPolicyFile();
        this.isCreatePolicyFileLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isCreatePolicyFileLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onModifyPolicyFile() {
      this.isModifyPolicyNumLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.modifyPolicyFile();
        this.isModifyPolicyNumLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isModifyPolicyNumLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onUploadPolicyFile() {
      this.isUploadPolicyLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.uploadPolicyFile();
        this.isUploadPolicyLoading = false;
        Global.hideRegionLoading();
        if (showDialog) {
          Global.dialog("上传游戏版本成功");
        }
      } catch (error) {
        this.isUploadPolicyLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onApplyPolicyNum() {
      this.isApplyPolicyNumLoading = true;
      Global.showRegionLoading();

      try {
        await mdFtp.applyPolicyNum();
        this.isApplyPolicyNumLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isApplyPolicyNumLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onCheckPolicyNum() {
      let value = await ModelMgr.versionModel.getCurPolicyInfo();
      let data = JSON.parse(value);
      if (data.Code == 0) {
        Global.toast(`策略版本:${data.Data.Version}`);
      } else {
        Global.snack(data.Message, null, false);
      }
    },
    async onCheckGameVerison() {
      let gameVersion = await ModelMgr.versionModel.getEnvironGameVersion();
      Global.toast(`游戏版本:${gameVersion}`);
    },
    async commitGit() {
      this.isCommitGitLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.commitGit();
        this.isCommitGitLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isCommitGitLoading = false;
        Global.hideRegionLoading();
      }
    },
    async pushGit() {
      this.isPullGitLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.pushGit();
        this.isPullGitLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isPullGitLoading = false;
        Global.hideRegionLoading();
      }
    },
    async zipUploadGame() {
      this.isZipUploadGameLoading = true;
      Global.showRegionLoading();
      try {
        await mdFtp.zipUploadGame();
        this.isZipUploadGameLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isZipUploadGameLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onPublishNative() {
      this.isPublishNativeLoading = true;
      Global.showRegionLoading();
      try {
        await mdPublish.copyVersionToNative();
        await mdPublish.publishWin();
        await mdPublish.publishMac();
        this.isPublishNativeLoading = false;
        Global.hideRegionLoading();
      } catch (error) {
        this.isPublishNativeLoading = false;
        Global.hideRegionLoading();
      }
    },
    async onUploadNative() {
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

      if (
        !ModelMgr.versionModel.versionDesc &&
        this.curEnviron &&
        this.curEnviron.publishDescEnable
      ) {
        Global.snack("请输入版本描述", null, false);
        return;
      }
      Global.showLoading();
      try {
        let promiseList = [];

        if (this.curEnviron.publishEnable) {
          if (this.curEnviron.updateGitEnable) {
            promiseList.push(mdPublish.updateGit);
          }
          if (this.needCompress) {
            promiseList.push(mdCompress.compressFile);
          }
          promiseList.push(mdPublish.publishProject);

          //发布完项目后要刷新版本列表
          promiseList.push(this.refreshVersionList);

          if (this.needCompress) {
            promiseList.push(mdPublish.copyPictures);
          }
          if (this.curEnviron.mergeVersionEnable) {
            promiseList.push(mdPublish.mergeVersion);
          }

          //比较完项目后要刷新版本列表
          promiseList.push(this.refreshVersionList);
        }

        if (this.curEnviron.zipFileEnable) {
          promiseList.push(mdFtp.zipVersion);
        }
        promiseList.push(mdFtp.uploadVersionFile);

        if (this.curEnviron.policyEnable) {
          promiseList.push(mdFtp.createPolicyFile);
          promiseList.push(mdFtp.modifyPolicyFile);
          promiseList.push(mdFtp.uploadPolicyFile);
          promiseList.push(mdFtp.applyPolicyNum);
        }

        if (this.containNative && this.curEnviron.nativeEnable) {
          //打包native包
          promiseList.push(mdPublish.copyVersionToNative);
          promiseList.push(mdPublish.publishWin);
          promiseList.push(mdPublish.publishMac);

          //改名native包拷贝到svn,并上传到cdn
          promiseList.push(
            ModelMgr.ftpModel.initQiniuOption.bind(ModelMgr.ftpModel)
          );
          promiseList.push(mdFtp.copyPackageToSvn);
          promiseList.push(mdFtp.uploadNativeExe);
          promiseList.push(mdFtp.uploadNativeDmg);
        }

        if (this.curEnviron.pushGitEnable || this.curEnviron.gitTagEnable) {
          promiseList.push(mdFtp.commitGit);
          promiseList.push(mdFtp.pushGit);
        }

        if (this.curEnviron.zipUploadGameEnable) {
          promiseList.push(mdFtp.zipUploadGame);
        }

        promiseList.push(this.environChange);

        await Global.executePromiseList(promiseList);

        Global.hideLoading();
        Global.dialog("One·for·All Success");
      } catch (error) {
        this.environChange();
        Global.hideLoading();
        Global.snack("One·for·All Error:", error, false);
      }
    },
    async refreshVersionList() {
      await ModelMgr.versionModel.initVersionList();
      this.releaseList = ModelMgr.versionModel.releaseList;
      this.oldVersionList = ModelMgr.versionModel.oldVersionList;
      this.patchList = ModelMgr.versionModel.patchList;
      this.whiteList = ModelMgr.versionModel.whiteList.concat();
      this.whiteVersion = ModelMgr.versionModel.whiteVersion;
      this.normalVersion = ModelMgr.versionModel.normalVersion;
      this.displayVersion = ModelMgr.versionModel.displayVersion;

      this.needPatchChange();
    },
    async refreshChannelList() {
      this.channelList = ModelMgr.versionModel.channelList;
      this.channel = ModelMgr.versionModel.channel;
    }
  },
  async mounted() {
    ModelMgr.versionModel.initEnviron();
    this.environList = ModelMgr.versionModel.environList.filter(
      value => Global.mode.environNames.indexOf(value.name) != -1
    );
    this.curEnviron = ModelMgr.versionModel.curEnviron;
    this.environChange();

    ipcRenderer.on("client_one_click", (event, msg) => {
      this.oneClickContent = "只需要点一下就够了,蠢货!";
    });
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