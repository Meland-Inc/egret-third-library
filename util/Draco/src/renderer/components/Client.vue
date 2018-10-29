<template>
    <div class="layout">
        <div class="header">
              <mu-appbar color="primary" title="Client"></mu-appbar>
        </div>
        <div class="content">
          <div class="alert-demo-wrapper">
            <mu-alert color="warning" @delete="alert1 = false" delete v-if="alert1" transition="mu-scale-transition">
              <mu-icon left value="warning"></mu-icon> this is warning alert
            </mu-alert>
          </div>
          <div class="content-left">
            <mu-list @change="handleListChange" :value="activeList">
                <!-- <mu-list-item title="Module" value="ClientModule">
                    <mu-icon slot="left" value="assignment" />
                </mu-list-item> -->

                <mu-list-item button :ripple="false" value="ClientProto">
                  <mu-list-item-action>
                    <mu-icon slot="left" value="swap_vert" />
                  </mu-list-item-action>
                  <mu-list-item-title>Proto</mu-list-item-title>
                </mu-list-item>

                <mu-list-item button :ripple="false" value="ClientCsv">
                  <mu-list-item-action>
                    <mu-icon slot="left" value="extension" />
                  </mu-list-item-action>
                  <mu-list-item-title>Csv</mu-list-item-title>
                </mu-list-item>

                <mu-list-item button :ripple="false" value="ClientTexture">
                  <mu-list-item-action>
                    <mu-icon slot="left" value="crop_original" />
                  </mu-list-item-action>
                  <mu-list-item-title>Texture</mu-list-item-title>
                </mu-list-item>

                <mu-list-item button :ripple="false" value="ClientMapData">
                  <mu-list-item-action>
                    <mu-icon slot="left" value="map" />
                  </mu-list-item-action>
                  <mu-list-item-title>MapData</mu-list-item-title>
                </mu-list-item>
                
                <mu-list-item button :ripple="false" value="ClientAsset">
                  <mu-list-item-action>
                    <mu-icon slot="left" value="apps" />
                  </mu-list-item-action>
                  <mu-list-item-title>Asset</mu-list-item-title>
                </mu-list-item>

                <mu-list-item button :ripple="false" value="ClientPublish">
                  <mu-list-item-action>
                    <mu-icon slot="left" value="timeline" />
                  </mu-list-item-action>
                  <mu-list-item-title>Publish</mu-list-item-title>
                </mu-list-item>

                <!-- <mu-list-item button :ripple="false" value="ClientTest">
                  <mu-list-item-action>
                    <mu-icon slot="left" value="crop_original" />
                  </mu-list-item-action>
                  <mu-list-item-title>Test</mu-list-item-title>
                </mu-list-item> -->

                <mu-divider/>
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
                    <component :is='currentView' keep-alive></component>
                </div>
            </div>
        </div>
        <div class="footer">
            Draco ©2018 Created by Muse-UI
        </div>

        <mu-snackbar position="bottom-end" color="success" :open.sync="toast" @close="hideToast">
          <mu-icon left value="check_circle"></mu-icon>
          {{toastContent}}
          <mu-button flat slot="action" color="#ffffff" @click="hideToast">关闭</mu-button>
        </mu-snackbar>

        <mu-snackbar position="bottom-end" color="error" :open.sync="snackbar" @close="hideSnackbar">
          <mu-icon left value="warning"></mu-icon>
          {{snackContent}}
          <mu-button flat slot="action" color="#ffffff" @click="hideSnackbar">关闭</mu-button>
        </mu-snackbar>

        <mu-dialog width="360" :open.sync="dialog">
          {{dialogContent}}
          <mu-button slot="actions" flat color="primary" @click="closeDialog">关闭</mu-button>
        </mu-dialog>
    </div>
</template>
<script>
const ipcRenderer = require("electron").ipcRenderer;
const remote = require("electron").remote;

export default {
  data() {
    return {
      activeList: "ClientProto",
      currentView: "ClientProto",
      toast: false,
      snackbar: false,
      alert1: false,
      dialog: false,
      toastContent: "",
      snackContent: "",
      dialogContent: "",
      // client_author: "",
      // client_project_path: "",
      // client_proto_path: "",
      // client_svn_path: "",
      // client_modify_edition_path: "",
      // client_compile_code_path: "",
      // client_generate_eidtion_path: "",
      // client_remote_assets_path: "",
      loading: null
    };
  },
  methods: {
    handleListChange(val) {
      this.activeList = val;
      this.currentView = val;
    },
    showSnackbar(content = "") {
      this.hideSnackbar();

      this.snackContent = content;
      this.snackbar = true;
    },
    hideSnackbar() {
      this.snackbar = false;
    },
    showToast(content = "") {
      this.hideToast();

      this.toastContent = content;
      this.toast = true;
      if (this.toastTimer) {
        clearTimeout(this.toastTimer);
      }
      this.toastTimer = setTimeout(() => {
        this.toast = false;
      }, 2000);
    },
    hideToast() {
      this.toast = false;
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

    toggleAlert() {
      this.alert1 = !this.alert1;
    },

    showDialog(dialogContent = "") {
      this.dialogContent = dialogContent;
      this.dialog = true;
    },

    closeDialog() {
      this.dialog = false;
    }
  },
  components: {
    ClientModule: require("./Client/ClientModule"),
    ClientCsv: require("./Client/ClientCsv"),
    ClientProto: require("./Client/ClientProto"),
    ClientTexture: require("./Client/ClientTexture"),
    ClientMapData: require("./Client/ClientMapData"),
    ClientSetting: require("./Client/ClientSetting"),
    ClientTest: require("./Client/ClientTest"),
    ClientPublish: require("./Client/ClientPublish"),
    ClientAsset: require("./Client/ClientAsset")
  },
  mounted() {
    // this.client_author = localStorage.getItem("client_author");
    // this.client_project_path = localStorage.getItem("client_project_path");
    // this.client_proto_path = localStorage.getItem("client_proto_path");
    // this.client_svn_path = localStorage.getItem("client_svn_path");

    // this.client_modify_edition_path = localStorage.getItem(
    //   "client_modify_edition_path"
    // );

    // this.client_compile_code_path = localStorage.getItem(
    //   "client_compile_code_path"
    // );
    // this.client_generate_eidtion_path = localStorage.getItem(
    //   "client_generate_eidtion_path"
    // );
    // this.client_remote_assets_path = localStorage.getItem(
    //   "client_remote_assets_path"
    // );

    ipcRenderer.on("client_show_message", (event, msg) => {
      this.showToast(msg);
      console.log(msg);
    });

    ipcRenderer.on("client_show_snack", (event, msg) => {
      this.showSnackbar(msg);
      console.error(msg);
    });

    ipcRenderer.on("client_show_loading", event => {
      this.showLoading();
    });

    ipcRenderer.on("client_hide_loading", event => {
      this.hideLoading();
    });

    ipcRenderer.on("client_show_dialog", (event, msg) => {
      this.showDialog(msg);
    });

    ipcRenderer.on("client_add_log", (event, msg) => {
      console.log(msg);
    });

    ipcRenderer.send("client_init");
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
  width: 30%;
  float: left;
  background-color: white;
  margin-bottom: -4000px;
  padding-bottom: 4000px;
}

.content-right {
  width: 70%;
  display: inline-block;
  padding: 10px 10px;
  background-color: rgba(0, 0, 0, 0);
}

.breadcrumb {
  margin: 10px 0;
}

.body {
  background-color: white;
  border-radius: 5px;
  min-height: 860px;
}

.footer {
  padding: 20px 0;
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
</style>