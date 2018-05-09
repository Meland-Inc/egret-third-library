<template>
    <div>
        <mu-sub-header>Setting</mu-sub-header>
        <mu-content-block class="demo-raised-button-container">
            <mu-text-field label="设置作者" hintText="作者" v-model="client_author" />
        </mu-content-block>
        <mu-content-block class="demo-raised-button-container">
            <mu-text-field label="设置项目目录" hintText="项目目录" v-model="client_project_path" />
            <mu-raised-button label="选择" class="demo-raised-button" primary @click="onProjectPathClick" />
        </mu-content-block>
        <mu-content-block class="demo-raised-button-container">
            <mu-text-field label="设置协议目录" hintText="协议目录" v-model="client_proto_path" />
            <mu-raised-button label="选择" class="demo-raised-button" primary @click="onProtoPathClick" />
        </mu-content-block>
        <mu-content-block class="demo-raised-button-container">
            <mu-text-field label="设置配置表目录" hintText="配置表目录" v-model="client_csv_path" />
            <mu-raised-button label="选择" class="demo-raised-button" primary @click="onCsvPathClick" />
        </mu-content-block>
         <mu-content-block class="demo-raised-button-container">
            <mu-text-field label="设置纹理目录" hintText="纹理目录" v-model="client_texture_path" />
            <mu-raised-button label="选择" class="demo-raised-button" primary @click="onTexturePathClick" />
        </mu-content-block>
    </div>
</template>

<<script>
const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;

export default {
    data () {
        return {
            client_author:"",
            client_project_path: "",
            client_proto_path:"",
            client_csv_path:"",
            client_texture_path:"",
        }
    },
    methods: {
        onProjectPathClick () {
            ipcRenderer.send('open_client_project_path');
        },
        onProtoPathClick () {
            ipcRenderer.send('open_client_proto_path');
        },
        onCsvPathClick () {
            ipcRenderer.send('open_client_csv_path');
        },
        onTexturePathClick () {
            ipcRenderer.send('open_client_texture_path');
        },
    },
    watch: {
        client_author: function (val, oldVal) {
            if (val != oldVal) {
                localStorage.setItem("client_author", val);
            }
        },
        client_project_path: function (val, oldVal) {
            if (val != oldVal) {
                localStorage.setItem("client_project_path", val);
            }
        },
        client_proto_path: function (val, oldVal) {
            if (val != oldVal) {
                localStorage.setItem("client_proto_path", val);
            }
        },
        client_csv_path: function (val, oldVal) {
            if (val != oldVal) {
                localStorage.setItem("client_csv_path", val);
            }
        },
        client_texture_path: (val,oldVal)=>{
            if (val != oldVal) {
                localStorage.setItem("client_texture_path", val);
            }
        },
    },
    mounted () {
        this.client_author = localStorage.getItem("client_author");
        this.client_project_path = localStorage.getItem("client_project_path");
        this.client_proto_path = localStorage.getItem("client_proto_path");
        this.client_csv_path = localStorage.getItem("client_csv_path");
        this.client_texture_path = localStorage.getItem("client_texture_path");

        ipcRenderer.removeAllListeners(['selected_client_project_path', 'selected_client_proto_path', 'selected_client_csv_path', 'selected_client_texture_path']);

        ipcRenderer.on('selected_client_project_path', function (event, path) {
            this.client_project_path = path[0];
        }.bind(this)),

        ipcRenderer.on('selected_client_proto_path', function (event, path) {
            this.client_proto_path = path[0];
        }.bind(this));

        ipcRenderer.on('selected_client_csv_path', function (event, path) {
            this.client_csv_path = path[0];
        }.bind(this));

         ipcRenderer.on('selected_client_texture_path', function (event, path) {
            this.client_texture_path = path[0];
        }.bind(this));
    }
}
</script>


<style lang="css">
.file-button {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  opacity: 0;
}

.demo-raised-button-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.demo-raised-button {
  margin: 12px;
}

.mu-text-field {
  width: 512px;
}
</style>