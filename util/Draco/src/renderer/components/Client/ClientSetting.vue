<template>
  <div>
    <mu-container>
      <mu-list textline="two-line" class="demo-list-wrap">
        <mu-list-item>
          <mu-list-item-content>
            <mu-text-field class="text-setting" label="设置作者" v-model="client_author" label-float/>
          </mu-list-item-content>
        </mu-list-item>

        <mu-list-item>
          <mu-list-item-content>
            <mu-text-field
              class="text-setting"
              label="设置项目git目录"
              v-model="client_project_path"
              label-float
            />
          </mu-list-item-content>
          <mu-list-item-action>
            <mu-button color="pink500" @click="onProjectPathClick">选择</mu-button>
          </mu-list-item-action>
        </mu-list-item>

        <mu-list-item>
          <mu-list-item-content>
            <mu-text-field
              class="text-setting"
              label="设置协议git目录"
              v-model="client_proto_path"
              label-float
            />
          </mu-list-item-content>
          <mu-list-item-action>
            <mu-button color="orange500" @click="onProtoPathClick">选择</mu-button>
          </mu-list-item-action>
        </mu-list-item>

        <mu-list-item>
          <mu-list-item-content>
            <mu-text-field
              class="text-setting"
              label="设置svn目录"
              v-model="client_svn_path"
              label-float
            />
          </mu-list-item-content>
          <mu-list-item-action>
            <mu-button color="cyan500" @click="onSvnPathClick">选择</mu-button>
          </mu-list-item-action>
        </mu-list-item>

        <mu-list-item>
          <mu-list-item-content>
            <mu-text-field
              class="text-setting"
              label="设置Client git目录"
              v-model="client_client_path"
              label-float
            />
          </mu-list-item-content>
          <mu-list-item-action>
            <mu-button color="purple500" @click="onClientPathClick">选择</mu-button>
          </mu-list-item-action>
        </mu-list-item>

        <!-- <mu-list-item>
                <mu-list-item-content>
                    <mu-text-field label="设置配置表目录" hintText="配置表目录" v-model="client_csv_path" />
                </mu-list-item-content>
                <mu-list-item-action>
                    <mu-button color="primary" @click="onCsvPathClick">选择</mu-button>
                </mu-list-item-action>
            </mu-list-item>

            <mu-list-item>
                <mu-list-item-content>
            <mu-text-field label="设置纹理目录" hintText="纹理目录" v-model="client_texture_path" />
                </mu-list-item-content>
                <mu-list-item-action>
            <mu-button color="primary" @click="onTexturePathClick">选择</mu-button>
                </mu-list-item-action>
        </mu-list-item>-->
      </mu-list>
    </mu-container>
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
            client_svn_path:"",
            client_client_path:"",
        }
    },
    methods: {
        onProjectPathClick () {
            ipcRenderer.send('open_client_project_path');
        },
        onProtoPathClick () {
            ipcRenderer.send('open_client_proto_path');
        },
        onSvnPathClick(){
            ipcRenderer.send('open_client_svn_path');
        },
        onClientPathClick(){
            ipcRenderer.send('open_client_client_path');
        },
    },
    watch: {
        client_author: (val, oldVal) => {
            if (val != oldVal) {
                localStorage.setItem("client_author", val);
            }
        },
        client_project_path: (val, oldVal) => {
            if (val != oldVal) {
                localStorage.setItem("client_project_path", val);
            }
        },
        client_proto_path: (val, oldVal) => {
            if (val != oldVal) {
                localStorage.setItem("client_proto_path", val);
            }
        },
        client_svn_path: (val, oldVal) => {
            if (val != oldVal) {
                localStorage.setItem("client_svn_path", val);
            }
        },
        client_client_path: (val,oldVal) => {
            if (val != oldVal) {
                localStorage.setItem("client_client_path", val);
            }
        },
    },
    mounted () {
        this.client_author = localStorage.getItem("client_author");
        this.client_project_path = localStorage.getItem("client_project_path");
        this.client_proto_path = localStorage.getItem("client_proto_path");
        this.client_svn_path = localStorage.getItem("client_svn_path");
        this.client_client_path = localStorage.getItem("client_client_path");

        ipcRenderer.removeAllListeners([
            'selected_client_project_path', 
            'selected_client_proto_path', 
            'selected_client_svn_path', 
            'selected_client_client_path',
        ]);

        ipcRenderer.on('selected_client_project_path', (event, path) => {
            if(path){
                this.client_project_path = path[0];
            }
        }),

        ipcRenderer.on('selected_client_proto_path', (event, path) => {
            if(path){
                this.client_proto_path = path[0];
            }
        });

        ipcRenderer.on('selected_client_svn_path', (event, path) => {
            if(path){
                this.client_svn_path = path[0];
            }
        });

        ipcRenderer.on('selected_client_client_path', (event, path) => {
            if(path){
                this.client_client_path = path[0];
            }
        });
    }
}
</script>


<style lang="less">
.text-setting {
  width: 512px;
}

.demo-list-wrap {
  width: 100%;
  max-width: 640px;
  overflow: hidden;
}
</style>