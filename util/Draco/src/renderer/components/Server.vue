<template>
    <div class="layout">
        <div class="header">
            <div class="logo">
                Server
            </div>
        </div>
        <div class="content">
            <div class="content-left">
                <mu-list @change="handleListChange" :value="activeList">
                    <mu-list-item title="Database" value="ServerDatabase">
                        <mu-icon slot="left" value="assignment" />
                    </mu-list-item>

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

        <mu-snackbar v-if="toast" :message="toastContent" @close="hideToast" />
    </div>
</template>
<script>
const ipcRenderer = require("electron").ipcRenderer;
const remote = require("electron").remote;

export default {
  data() {
    return {
      activeList: "ServerDatabase",
      currentView: "ServerDatabase",
      toast: false,
      toastContent: ""
    };
  },
  methods: {
    handleListChange(val) {
      this.activeList = val;
      this.currentView = val;
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
    ServerDatabase: require("./Server/ServerDatabase"),
    ClientProto: require("./Client/ClientProto"),
    ClientSetting: require("./Client/ClientSetting")
  },
  mounted() {
    var author = localStorage.getItem("client_author");
    var project_path = localStorage.getItem("client_project_path");
    var proto_path = localStorage.getItem("client_proto_path");

    ipcRenderer.on(
      "client_show_message",
      function(event, msg) {
        this.showToast(msg);
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