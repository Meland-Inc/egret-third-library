<template>
    <div>
        <mu-button label="创建模块" class="demo-snackbar-button" @click="showModuleDialog" primary/>
        <mu-button label="创建窗体" class="demo-snackbar-button" @click="showWindowDialog" primary/>
        <mu-sub-header>模块列表</mu-sub-header>
        <mu-table :fixedHeader="fixedHeader" :height="tableHeight" :enableSelectAll="enableSelectAll" :multiSelectable="multiSelectable" :selectable="selectable" :showCheckbox="showCheckbox">
            <mu-thead>
                <mu-tr>
                    <mu-th class="demo-table-module">模块</mu-th>
                    <mu-th>关联窗口</mu-th>
                </mu-tr>
            </mu-thead>
            <mu-tbody>
                <mu-tr v-for="item,index in tableData" :key="index" :selected="item.selected">
                    <mu-td>{{item.moduleName}}</mu-td>
                    <mu-td> {{ item.windows }}</mu-td>
                </mu-tr>
            </mu-tbody>
        </mu-table>

        <mu-dialog :open="moduleDialog" title="创建模块" @close="hideModuleDialog">
            <mu-content-block class="demo-raised-button-container">
                <mu-text-field class="demo-text-field" label="请输入模块名称" hintText="模块名称" v-model="module_name" />
            </mu-content-block>
            <mu-content-block class="demo-raised-button-container">
                <mu-text-field class="demo-text-field" label="请输入模块中文名称" hintText="模块中文名称" v-model="module_cn_name" />
            </mu-content-block>
            <mu-content-block class="demo-raised-button-container">
                <mu-checkbox label="创建Screen" class="demo-checkbox" v-model="create_screen" />
            </mu-content-block>

            <mu-flat-button slot="actions" @click="hideModuleDialog" primary label="取消" />
            <mu-flat-button slot="actions" primary @click="createModule" label="确定" />
        </mu-dialog>

        <mu-dialog :open="windowDialog" title="创建窗体" @close="hideWindowDialog">
            <mu-content-block class="demo-raised-button-container">
                <mu-text-field class="demo-text-field" label="请输入窗体名称" hintText="窗体名称" v-model="window_name" />
            </mu-content-block>
            <mu-content-block class="demo-raised-button-container">
                <mu-text-field class="demo-text-field" label="请输入窗体中文名称" hintText="窗体中文名称" v-model="window_cn_name" />
            </mu-content-block>
            <mu-content-block class="demo-raised-button-container">
                <mu-select-field v-model="window_module_name" :labelFocusClass="['label-foucs']" label="选择所属模块">
                    <mu-menu-item v-for="data,index in tableData" :key="index" :value="data.moduleName" :title="data.moduleName" />
                </mu-select-field>
            </mu-content-block>

            <mu-flat-button slot="actions" @click="hideWindowDialog" primary label="取消" />
            <mu-flat-button slot="actions" primary @click="createWindow" label="确定" />
        </mu-dialog>
    </div>
</template>

<script>
const ipcRenderer = require("electron").ipcRenderer;
const remote = require("electron").remote;

export default {
  data() {
    return {
      module_name: "",
      module_cn_name: "",
      create_screen: false,
      window_name: "",
      window_cn_name: "",
      window_module_name: "",

      moduleDialog: false,
      windowDialog: false,

      tableHeight: "750px",
      fixedHeader: true,
      selectable: false,
      multiSelectable: false,
      enableSelectAll: false,
      showCheckbox: false,
      tableData: []
    };
  },
  methods: {
    showModuleDialog() {
      this.moduleDialog = true;
    },
    hideModuleDialog() {
      this.moduleDialog = false;
      this.module_name = "";
      this.module_cn_name = "";
    },
    createModule() {
      if (!this.module_name) {
        ipcRenderer.send("client_show_message", "模块名不能为空");
        return;
      }

      if (!this.module_cn_name) {
        ipcRenderer.send("client_show_message", "模块中文名不能为空");
        return;
      }

      for (var i = 0; i < this.tableData.length; i++) {
        if (this.tableData[i].moduleName == this.module_name) {
          ipcRenderer.send("client_show_message", "已存在该模块");
          this.hideModuleDialog();
          return;
        }
      }

      ipcRenderer.send(
        "client_create_module",
        this.module_name,
        this.module_cn_name,
        this.create_screen
      );

      this.hideModuleDialog();
    },
    showWindowDialog() {
      this.windowDialog = true;
    },
    hideWindowDialog() {
      this.windowDialog = false;
      this.window_name = "";
      this.window_cn_name = "";
      this.window_module_name = "";
    },
    createWindow() {
      if (!this.window_name) {
        ipcRenderer.send("client_show_message", "窗体名不能为空");
        return;
      }

      if (!this.window_cn_name) {
        ipcRenderer.send("client_show_message", "窗体中文名不能为空");
        return;
      }

      if (!this.window_module_name) {
        ipcRenderer.send("client_show_message", "窗体模块名不能为空");
        return;
      }

      ipcRenderer.send(
        "client_create_window",
        this.window_name,
        this.window_cn_name,
        this.window_module_name
      );

      this.hideWindowDialog();
    }
  },
  mounted() {
    this.tableData = remote.getGlobal("sharedObject").client_modules;

    ipcRenderer.removeAllListeners([
      "client_init_complete",
      "client_module_refresh_complete"
    ]);

    ipcRenderer.on("client_init_complete", (event, modules) => {
      this.tableData = modules;
    });

    ipcRenderer.on("client_module_refresh_complete", (event, modules) => {
      this.tableData = modules;
    });
  }
};
</script>

<style lang="css">
.demo-snackbar-button {
  margin: 12px;
}

.demo-raised-button-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.demo-table-module {
  width: 80px;
}

.demo-checkbox {
  margin-bottom: 16px;
}
</style>