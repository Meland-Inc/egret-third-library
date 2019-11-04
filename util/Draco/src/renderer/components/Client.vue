<template>
  <div class="layout">
    <div class="header">
      <mu-appbar color="primary" :title="appTitle"></mu-appbar>
    </div>
    <div class="content">
      <div class="alert-demo-wrapper">
        <mu-alert
          color="warning"
          @delete="alert1 = false"
          delete
          v-if="alert1"
          transition="mu-scale-transition"
        >
          <mu-icon left value="warning"></mu-icon>this is warning alert
        </mu-alert>
      </div>
      <div class="content-left">
        <mu-list v-loading="regionLoading" @change="handleListChange" :value="activeList">
          <!-- <mu-list-item title="Module" value="ClientModule">
                    <mu-icon slot="left" value="assignment" />
          </mu-list-item>-->
          <mu-list-item button :ripple="false" value="ClientProto" v-show="protoEnable">
            <mu-list-item-action>
              <mu-icon slot="left" value="swap_vert" />
            </mu-list-item-action>
            <mu-list-item-title>Proto</mu-list-item-title>
          </mu-list-item>

          <mu-list-item button :ripple="false" value="ClientCsv" v-show="csvEnable">
            <mu-list-item-action>
              <mu-icon slot="left" value="extension" />
            </mu-list-item-action>
            <mu-list-item-title>Csv</mu-list-item-title>
          </mu-list-item>

          <mu-list-item button :ripple="false" value="ClientTexture" v-show="textureEnable">
            <mu-list-item-action>
              <mu-icon slot="left" value="crop_original" />
            </mu-list-item-action>
            <mu-list-item-title>Texture</mu-list-item-title>
          </mu-list-item>

          <mu-list-item button :ripple="false" value="ClientMapData" v-show="mapDataEnable">
            <mu-list-item-action>
              <mu-icon slot="left" value="map" />
            </mu-list-item-action>
            <mu-list-item-title>MapData</mu-list-item-title>
          </mu-list-item>

          <mu-list-item button :ripple="false" value="ClientAsset" v-show="assetEnable">
            <mu-list-item-action>
              <mu-icon slot="left" value="apps" />
            </mu-list-item-action>
            <mu-list-item-title>Asset</mu-list-item-title>
          </mu-list-item>

          <mu-list-item button :ripple="false" value="ClientEgret" v-show="egretEnable">
            <mu-list-item-action>
              <mu-icon slot="left" value="apps" />
            </mu-list-item-action>
            <mu-list-item-title>Egret</mu-list-item-title>
          </mu-list-item>

          <mu-divider />

          <mu-list-item button :ripple="false" value="ClientVersion" v-show="versionEnable">
            <mu-list-item-action>
              <mu-icon slot="left" value="timeline" />
            </mu-list-item-action>
            <mu-list-item-title>Version</mu-list-item-title>
          </mu-list-item>

          <!-- <mu-list-item button :ripple="false" value="ClientFtp">
            <mu-list-item-action>
              <mu-icon slot="left" value="file_upload" />
            </mu-list-item-action>
            <mu-list-item-title>Ftp</mu-list-item-title>
          </mu-list-item>-->

          <mu-list-item button :ripple="false" value="ClientLesson" v-show="lessonEnable">
            <mu-list-item-action>
              <mu-icon slot="left" value="file_upload" />
            </mu-list-item-action>
            <mu-list-item-title>Lesson</mu-list-item-title>
          </mu-list-item>

          <mu-list-item button :ripple="false" value="ClientApp" v-show="appEnable">
            <mu-list-item-action>
              <mu-icon slot="left" value="weekend" />
            </mu-list-item-action>
            <mu-list-item-title>App</mu-list-item-title>
          </mu-list-item>

          <!-- <mu-list-item button :ripple="false" value="ClientTest">
                  <mu-list-item-action>
                    <mu-icon slot="left" value="crop_original" />
                  </mu-list-item-action>
                  <mu-list-item-title>Test</mu-list-item-title>
          </mu-list-item>-->
          <mu-divider />
          <mu-list-item button :ripple="false" value="ClientSetting">
            <mu-list-item-action>
              <mu-icon slot="left" value="build" />
            </mu-list-item-action>
            <mu-list-item-title>Setting</mu-list-item-title>
          </mu-list-item>
        </mu-list>
      </div>
      <div class="content-right">
        <div class="body">
          <component :is="currentView" keep-alive></component>
        </div>
      </div>
    </div>
    <div class="footer">Draco ©2019 Created by Muse-UI</div>

    <mu-snackbar position="bottom-end" color="success" :open.sync="toastVisible" @close="hideToast">
      <mu-icon left value="check_circle"></mu-icon>
      {{toastContent}}
      <mu-button flat slot="action" color="#ffffff" @click="hideToast">关闭</mu-button>
    </mu-snackbar>

    <mu-snackbar
      position="bottom-end"
      color="error"
      :open.sync="snackbarVisible"
      @close="hideSnackbar"
    >
      <mu-icon left value="warning"></mu-icon>
      {{snackContent}}
      <mu-button flat slot="action" color="#ffffff" @click="hideSnackbar">关闭</mu-button>
    </mu-snackbar>

    <mu-dialog width="360" :open.sync="dialogVisible">
      {{dialogContent}}
      <mu-button slot="actions" flat color="primary" @click="closeDialog">关闭</mu-button>
    </mu-dialog>

    <mu-dialog
      title="Prompt"
      width="600"
      max-width="80%"
      :esc-press-close="false"
      :overlay-close="false"
      :open.sync="alertVisible"
    >
      {{alertContent}}
      <mu-button slot="actions" flat color="success" @click="onAlertConfirm">Confirm</mu-button>
      <mu-button slot="actions" flat color="error" @click="onAlertCancel">Cancel</mu-button>
    </mu-dialog>

    <mu-dialog
      title="current version"
      width="360"
      :open.sync="versionDialogVisible"
      transition="slide-top"
    >
      version {{currentVersion}}
      <mu-button slot="actions" flat color="primary" @click="onCloseVersionDialog">Confirm</mu-button>
    </mu-dialog>

    <mu-bottom-sheet :open.sync="bottomSheetVisible">
      <mu-list @item-click="closeBottomSheet" @change="switchMode">
        <mu-sub-header>选择模式</mu-sub-header>
        <mu-list-item
          v-for="value,index in modeList"
          :key="value.name"
          :label="value.title"
          :value="value"
          button
          :ripple="false"
        >
          <mu-list-item-action>
            <mu-icon :value="value.icon"></mu-icon>
          </mu-list-item-action>
          <mu-list-item-title>{{value.title}}</mu-list-item-title>
        </mu-list-item>

        <!-- <mu-list-item button>
          <mu-list-item-action>
            <mu-icon value="grade" color="orange"></mu-icon>
          </mu-list-item-action>
          <mu-list-item-title>开发</mu-list-item-title>
        </mu-list-item>
        <mu-list-item button>
          <mu-list-item-action>
            <mu-icon value="inbox" color="blue"></mu-icon>
          </mu-list-item-action>
          <mu-list-item-title>策划</mu-list-item-title>
        </mu-list-item>
        <mu-list-item button>
          <mu-list-item-action>
            <mu-icon value="chat" color="green"></mu-icon>
          </mu-list-item-action>
          <mu-list-item-title>打包</mu-list-item-title>
        </mu-list-item>-->
      </mu-list>
    </mu-bottom-sheet>
  </div>
</template>
<script>
const ipcRenderer = require("electron").ipcRenderer;
const remote = require("electron").remote;
import { Global } from "./js/Global";
import { rejects } from "assert";
import { ModelMgr } from "./js/model/ModelMgr";

export default {
  data() {
    return {
      activeList: "ClientProto",
      currentView: "ClientProto",
      toastVisible: false,
      snackbarVisible: false,
      alert1: false,
      dialogVisible: false,
      toastContent: "",
      snackContent: "",
      dialogContent: "",
      alertContent: "",
      versionDialogVisible: false,
      regionLoading: false,
      alertVisible: false,
      alertResolve: null,
      loading: null,
      currentVersion: Global.currentVersion,
      bottomSheetVisible: false,
      modeList: Global.modeList,

      protoEnable: false,
      csvEnable: false,
      textureEnable: false,
      mapDataEnable: false,
      assetEnable: false,
      egretEnable: false,
      versionEnable: false,
      lessonEnable: false,
      appEnable: false,

      appTitle: ""
    };
  },
  watch: {},
  methods: {
    handleListChange(val) {
      this.activeList = val;
      this.currentView = val;
    },
    showSnackbar(content = "") {
      this.hideSnackbar();

      this.snackContent = content;
      this.snackbarVisible = true;
    },
    hideSnackbar() {
      this.snackbarVisible = false;
    },
    showToast(content = "") {
      this.hideToast();

      this.toastContent = content;
      this.toastVisible = true;
      if (this.toastTimer) {
        clearTimeout(this.toastTimer);
      }
      this.toastTimer = setTimeout(() => {
        this.toastVisible = false;
      }, 2000);
    },
    hideToast() {
      this.toastVisible = false;
      if (this.toastTimer) clearTimeout(this.toastTimer);
    },

    showLoading() {
      this.loading = this.$loading();
    },
    hideLoading() {
      if (this.loading) {
        this.loading.close();
      }
    },

    showRegionLoading() {
      this.regionLoading = true;
    },

    hideRegionLoading() {
      this.regionLoading = false;
    },

    toggleAlert() {
      this.alert1 = !this.alert1;
    },

    showDialog(dialogContent = "") {
      this.dialogContent = dialogContent;
      this.dialogVisible = true;
    },

    closeDialog() {
      this.dialogVisible = false;
    },

    showAlert(alertContent, resolve) {
      this.alertContent = alertContent;
      this.alertResolve = resolve;
      this.alertVisible = true;
    },

    onAlertConfirm() {
      this.alertVisible = false;
      if (this.alertResolve) {
        this.alertResolve(true);
        this.alertResolve = null;
      }
    },

    onAlertCancel() {
      this.alertVisible = false;
      if (this.alertResolve) {
        this.alertResolve(false);
        this.alertResolve = null;
      }
    },

    onCloseVersionDialog() {
      this.versionDialogVisible = false;
    },

    switchMode(val) {
      Global.setMode(val);
      this.refreshMode();
    },
    openBotttomSheet() {
      this.bottomSheetVisible = true;
    },
    closeBottomSheet() {
      this.bottomSheetVisible = false;
    },
    refreshMode() {
      let mode = Global.mode;
      this.protoEnable = mode.protoEnable;
      this.csvEnable = mode.csvEnable;
      this.textureEnable = mode.textureEnable;
      this.mapDataEnable = mode.mapDataEnable;
      this.assetEnable = mode.assetEnable;
      this.egretEnable = mode.egretEnable;
      this.versionEnable = mode.versionEnable;
      this.lessonEnable = mode.lessonEnable;
      this.appEnable = mode.appEnable;
      this.appTitle = mode.title;

      let viewName = "";
      switch (mode.name) {
        case Global.eMode.develop:
          viewName = "ClientProto";
          break;
        case Global.eMode.product:
          viewName = "ClientTexture";
          break;
        case Global.eMode.publish:
          viewName = "ClientVersion";
          break;
        default:
          break;
      }
      this.activeList = viewName;
      this.currentView = viewName;
    }
  },
  components: {
    ClientCsv: require("./Client/ClientCsv"),
    ClientProto: require("./Client/ClientProto"),
    ClientTexture: require("./Client/ClientTexture"),
    ClientMapData: require("./Client/ClientMapData"),
    ClientSetting: require("./Client/ClientSetting"),
    ClientAsset: require("./Client/ClientAsset"),
    ClientEgret: require("./Client/ClientEgret"),
    ClientVersion: require("./Client/ClientVersion"),
    ClientLesson: require("./Client/ClientLesson"),
    ClientApp: require("./Client/ClientApp")
    // ClientFtp: require("./Client/ClientFtp")
    // ClientModule: require("./backup/ClientModule"),
    // ClientTest: require("./backup/ClientTest")
  },
  async mounted() {
    ipcRenderer.on("client_show_toast", (event, msg) => {
      this.showToast(msg);
    });

    ipcRenderer.on("client_show_snack", (event, msg) => {
      this.showSnackbar(msg);
    });

    ipcRenderer.on("client_show_loading", event => {
      this.showLoading();
    });

    ipcRenderer.on("client_hide_loading", event => {
      this.hideLoading();
    });

    ipcRenderer.on("client_show_region_loading", event => {
      this.showRegionLoading();
    });

    ipcRenderer.on("client_hide_region_loading", event => {
      this.hideRegionLoading();
    });

    ipcRenderer.on("client_show_dialog", (event, msg) => {
      this.showDialog(msg);
    });

    ipcRenderer.on("client_show_version", event => {
      this.versionDialogVisible = true;
    });

    ipcRenderer.on("client_switch_mode", event => {
      this.bottomSheetVisible = true;
    });

    ipcRenderer.on("client_add_log", (event, msg) => {
      console.log(msg);
    });

    ipcRenderer.send("client_init");

    Global.initAlertFunc(this.showAlert);
    this.refreshMode();
    await ModelMgr.init();
  }
};
</script>
<style lang="less">
.layout {
  background-color: rgb(236, 236, 236);
}

/* .header {
  background-color: #7e57c2;
}

.logo {
  font-size: 24px;
  color: white;
  display: inline-block;
  padding: 10px 20px;
} */

.nav {
  display: inline-block;
  width: calc(100% - 150px);
  margin: 0 auto;
}

.tab {
  margin: 0 auto;
  width: 400px;
  background-color: rgba(0, 0, 0, 0);
}

.content {
  overflow: hidden;
}

.content-left {
  width: 20%;
  float: left;
  background-color: white;
  min-height: 80vh;
  // margin-bottom: -4000px;
  // padding-bottom: 4000px;
}

.content-right {
  width: 80%;
  display: inline-block;
  padding-left: 10px;

  background-color: rgba(0, 0, 0, 0);
}

.breadcrumb {
  margin: 10px 0;
}

.body {
  background-color: white;

  display: flex;
  min-height: 80vh;
  flex-direction: column;
}

.footer {
  // padding: 20px 0;
  text-align: center;
}

.alert-demo-wrapper {
  width: 100%;
  > .mu-alert {
    margin-bottom: 16px;
    &:last-child {
      margin-bottom: 0;
    }
  }
  > .mu-button {
    margin: 0 auto;
    display: block;
  }
}

.button-wrapper {
  text-align: left;
}
.mu-button {
  margin: 8px;
  vertical-align: top;
}

.mu-scale-transition-enter-active,
.mu-scale-transition-leave-active {
  transition: transform 0.45s cubic-bezier(0.23, 1, 0.32, 1),
    opacity 0.45s cubic-bezier(0.23, 1, 0.32, 1);
  backface-visibility: hidden;
}

.mu-scale-transition-enter,
.mu-scale-transition-leave-active {
  transform: scale(0);
  opacity: 0;
}
.text-game {
  width: 120px;
}
</style>