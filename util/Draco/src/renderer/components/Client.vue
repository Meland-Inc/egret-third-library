<template>
    <div class="layout">
        <div class="header">
            <div class="logo">
                Client
            </div>
        </div>
        <div class="content">
            <div class="content-left">
                <mu-list @change="handleListChange" :value="activeList">
                    <!-- <mu-list-item title="Module" value="ClientModule">
                        <mu-icon slot="left" value="assignment" />
                    </mu-list-item> -->

                    <mu-list-item title="Proto" value="ClientProto">
                        <mu-icon slot="left" value="swap_vert" />
                    </mu-list-item>

                    <mu-list-item title="Csv" value="ClientCsv">
                        <mu-icon slot="left" value="extension" />
                    </mu-list-item>

                    <mu-list-item title="Texture" value="ClientTexture">
                        <mu-icon slot="left" value="crop_original" />
                    </mu-list-item>

                    <!-- <mu-list-item title="Version" value="ClientVersion">
                        <mu-icon slot="left" value="forward" />
                    </mu-list-item> -->

                    <mu-divider/>
                    <mu-list-item title="Setting" value="ClientSetting">
                        <mu-icon slot="left" value="build" />
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

        <mu-toast v-if="toast" :message="toastContent" @close="hideToast" />
        <mu-snackbar v-if="snackbar" :message="snackContent" action="关闭" @actionClick="hideSnackbar" @close="hideSnackbar"/>
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
      toastContent: "",
      snackContent: "",
      client_author: "",
      client_project_path: "",
      client_proto_path: "",
      client_csv_path: "",
      client_modify_edition_path: "",
      client_compile_code_path: "",
      client_generate_eidtion_path: "",
      client_remote_assets_path: ""
    };
  },
  methods: {
    handleListChange(val) {
      this.activeList = val;
      this.currentView = val;
    },
    showSnackbar(content = "") {
      this.snackContent = content;
      this.snackbar = true;
    },
    hideSnackbar() {
      this.snackbar = false;
    },
    showToast(content = "") {
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
    }
  },
  components: {
    ClientModule: require("./Client/ClientModule"),
    ClientCsv: require("./Client/ClientCsv"),
    ClientProto: require("./Client/ClientProto"),
    ClientTexture: require("./Client/ClientTexture"),
    ClientSetting: require("./Client/ClientSetting"),
    ClientVersion: require("./Client/ClientVersion")
  },
  mounted() {
    this.client_author = localStorage.getItem("client_author");
    this.client_project_path = localStorage.getItem("client_project_path");
    this.client_proto_path = localStorage.getItem("client_proto_path");
    this.client_csv_path = localStorage.getItem("client_csv_path");

    this.client_modify_edition_path = localStorage.getItem(
      "client_modify_edition_path"
    );

    this.client_compile_code_path = localStorage.getItem(
      "client_compile_code_path"
    );
    this.client_generate_eidtion_path = localStorage.getItem(
      "client_generate_eidtion_path"
    );
    this.client_remote_assets_path = localStorage.getItem(
      "client_remote_assets_path"
    );

    ipcRenderer.on(
      "client_show_message",
      function(event, msg) {
        this.showToast(msg);
      }.bind(this)
    );

    ipcRenderer.on(
      "client_show_snack",
      function(event, msg) {
        this.showSnackbar(msg);
      }.bind(this)
    );

    ipcRenderer.on("client_add_log", function(event, msg) {
      console.log(msg);
    });

    ipcRenderer.send("client_init");
  }
};
</script>
<style scoped>
.layout {
  background-color: rgb(236, 236, 236);
}

.header {
  background-color: #7e57c2;
}

.logo {
  font-size: 24px;
  color: white;
  display: inline-block;
  padding: 10px 20px;
}

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
  float: right;
  padding: 10px 20px;
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
</style>