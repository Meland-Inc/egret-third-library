<template>
    <div>
        <mu-raised-button label="更新git文件" class="demo-snackbar-button" @click="updateGit" primary/>
        <mu-raised-button label="合成proto文件" class="demo-snackbar-button" @click="composeProto" primary/>
        <mu-raised-button label="生成js文件" class="demo-snackbar-button" @click="createJs" primary/>
        <mu-raised-button label="生成ts文件" class="demo-snackbar-button" @click="createTs" primary/>
        <mu-raised-button label="修改ts文件" class="demo-snackbar-button" @click="modifyTs" primary/>
        <!-- <mu-raised-button label="生成javascript文件" class="demo-snackbar-button" @click="createJavascript" primary/> -->
        <!-- <mu-raised-button label="移动proto文件" class="demo-snackbar-button" @click="moveProto" primary/> -->

        <!-- <mu-card>
            <mu-card-title title="协议配置" subTitle="" />
            <div class="content">
                <div class="content-left">
                    <mu-content-block class="demo-raised-button-container">
                        <mu-select-field v-model="game_module_name" :labelFocusClass="['label-foucs']" label="选择游戏模块">
                            <mu-menu-item v-for="data,index in game_modules" :key="index" :value="data.moduleName" :title="data.moduleName" />
                        </mu-select-field>
                    </mu-content-block>
                    <mu-content-block class="demo-raised-button-container">
                        <mu-select-field v-model="proto_module_name" :labelFocusClass="['label-foucs']" label="选择协议模块">
                            <mu-menu-item v-for="data,index in proto_modules" :key="index" :value="data" :title="data" />
                        </mu-select-field>
                    </mu-content-block>
                    <mu-content-block class="demo-raised-button-container">
                        <mu-select-field v-model="proto_file_name" :labelFocusClass="['label-foucs']" label="选择协议文件">
                            <mu-menu-item v-for="data,index in protoFiles" :key="index" :value="data" :title="data" />
                        </mu-select-field>
                    </mu-content-block>
                </div>
                <div class="content-right">
                    <mu-table :fixedHeader="fixedHeader" :height="tableHeight" :showCheckbox="false">
                        <mu-thead>
                            <mu-tr>
                                <mu-th class="demo-table-proto">cmd</mu-th>
                                <mu-th>request</mu-th>
                                <mu-th>response</mu-th>
                            </mu-tr>
                        </mu-thead>
                        <mu-tbody>
                            <mu-tr v-for="cmd,index in proto_cmds" :key="index" :selected="cmd.selected">
                                <mu-td>{{cmd}}</mu-td>
                                <mu-td>
                                    <mu-select-field class="demo-table-item-select-field" :underlineShow="false" :maxHeight="tableItemHeight" v-on:change="requestInput(cmd, $event)">
                                        <mu-menu-item v-for="data,index in proto_messages" :key="index" :value="data.name" :title="data.name" />
                                    </mu-select-field>
                                </mu-td>
                                <mu-td>
                                    <mu-select-field class="demo-table-item-select-field" :underlineShow="false" :maxHeight="tableItemHeight" v-on:change="responseInput(cmd, $event)">
                                        <mu-menu-item v-for="data,index in proto_messages" :key="index" :value="data.name" :title="data.name" />
                                    </mu-select-field>
                                </mu-td>
                            </mu-tr>
                        </mu-tbody>
                    </mu-table>
                </div>
            </div>
            <mu-card-actions>
                <mu-raised-button label="生成" class="demo-snackbar-button" @click="protoSetting" primary/>
                <mu-raised-button label="清除" class="demo-snackbar-button" @click="clearData" backgroundColor="#e91e63" primary/>
                <mu-raised-button label="刷新" class="demo-snackbar-button" @click="protoRefresh" backgroundColor="#6495ed" primary/>
            </mu-card-actions>
        </mu-card> -->

    </div>
</template>

<script>
var exec = require("child_process").exec;
const ipcRenderer = require("electron").ipcRenderer;
const remote = require("electron").remote;
const fs = require("fs");
const removeSpaces = require("strman").removeSpaces;
const replace = require("strman").replace;
const spawn = require("child_process").spawn;

export default {
  data() {
    return {
      fixedHeader: true,
      tableHeight: "500px",
      tableItemHeight: 300,
      project_path: "",
      proto_path: "",
      game_module_name: "",
      proto_module_name: "",
      proto_file_name: "",
      game_modules: [],
      proto_modules: [],
      protoFiles: [],
      proto_cmds: [],
      proto_messages: [],
      proto_objs: [],
      proto_cmd_class: ""
    };
  },
  watch: {
    proto_file_name: function(val, oldVal) {
      if (val != oldVal) {
        ipcRenderer.send("client_select_proto_file", val);
      }
    }
  },
  methods: {
    updateGit() {
      let process = spawn("git", ["pull"], { cwd: this.proto_path });
      process.stdout.on("data", function(data) {
        console.log("stdout: " + data);
      });
      process.stderr.on("data", function(data) {
        console.log("stderr: " + data);
      });
      process.on("exit", function(code) {
        if (code == 0) {
          console.log("更新git成功,错误码:" + code);
          ipcRenderer.send("client_show_snack", "更新git成功");
        } else {
          console.log("更新git错误,错误码:" + code);
        }
      });
    },
    createJs() {
      var cmdStr =
        "pbjs -t static-module -w commonjs -o " +
        this.project_path +
        "/resource/proto/pbmessage.js " +
        this.project_path +
        "/resource/proto/pbmessage.proto";
      exec(cmdStr, function(err, stdout, stderr) {
        if (err) {
          console.log(err);
          ipcRenderer.send("client_show_message", "生成js错误");
        } else {
          ipcRenderer.send("client_show_message", "生成js成功");
        }
      });
    },
    createTs() {
      var cmdStr =
        "pbts -o " +
        this.project_path +
        "/src/protocol/pbmessage.d.ts " +
        this.project_path +
        "/resource/proto/pbmessage.js";
      exec(cmdStr, function(err, stdout, stderr) {
        if (err) {
          console.log(err);
          ipcRenderer.send("client_show_message", "生成ts错误");
        } else {
          ipcRenderer.send("client_show_message", "生成ts成功");
        }
      });
    },
    modifyTs() {
      let msgptah = this.project_path + "/src/protocol/pbmessage.d.ts";
      let content = fs.readFileSync(msgptah, "utf-8");
      content = content.replace('import * as $protobuf from "protobufjs";', "");
      content = content.replace(
        "export namespace Bian {",
        "declare namespace Bian {"
      );
      if (content.indexOf("declare class Long") == -1) {
        content +=
          "declare class Long {\n" +
          "\tlow: number;\n" +
          "\thigh: number;\n" +
          "\tunsigned: boolean;\n" +
          "\ttoNumber();\n" +
          "\tstatic fromNumber(value);\n" +
          "\tequals(other): any;\n" +
          "}\n";
      }
      fs.writeFile(msgptah, content, function(err) {
        if (!err) {
          ipcRenderer.send("client_show_message", "修改ts成功");
        }
      });
    },
    moveProto() {
      var content = fs.readFileSync(this.proto_path + "/" + "pbmessage.proto");
      var ppath = this.project_path + "/resource/proto/pbmessage.proto";
      fs.writeFile(ppath, content, function(err) {
        if (!err) {
          ipcRenderer.send("client_show_message", "移动proto成功");
        }
      });
    },
    composeProto() {
      var pa = fs.readdirSync(this.proto_path);
      var content = "";
      content += "syntax = 'proto3';\r\n";
      content += "package Bian;\r\n";
      for (let i = 0; i < pa.length; i++) {
        const element = pa[i];
        if (element.indexOf(".proto") != -1) {
          var eleContent = fs.readFileSync(
            this.proto_path + "/" + element,
            "utf-8"
          );

          eleContent = eleContent
            .split("\n")
            .filter(i => {
              return i.indexOf("import") !== 0;
            })
            .join("\n");

          eleContent = eleContent.replace("syntax = 'proto3';", "");
          eleContent = eleContent.replace("package Bian;", "");

          eleContent = eleContent.replace("option go_package Bian;", "");
          content += "// ----- from " + element + " ---- \n";
          content += eleContent + "\n";
        }
      }

      var ppath = this.project_path + "/resource/proto/pbmessage.proto";
      fs.writeFile(ppath, content, function(err) {
        if (!err) {
          ipcRenderer.send("client_show_message", "合成proto成功");
        }
      });
    },

    //--------------以下为旧的
    createJson() {
      var cmdStr =
        "pbjs " +
        this.proto_path +
        "/a_proto_list.md > " +
        this.project_path +
        "/assets/script/lib/Proto2TypeScript/Proto2TypeScript.json";
      exec(cmdStr, function(err, stdout, stderr) {
        if (err) {
          ipcRenderer.send("client_show_message", "生成json错误");
        } else {
          ipcRenderer.send("client_show_message", "生成json成功");
        }
      });
    },
    createTypescript() {
      var cmdStr =
        "proto2typescript --file " +
        this.project_path +
        "/assets/script/lib/Proto2TypeScript/Proto2TypeScript.json" +
        " > " +
        this.project_path +
        "/assets/script/lib/Proto2TypeScript/Proto2TypeScript.d.ts";
      console.log(cmdStr);
      exec(cmdStr, function(err, stdout, stderr) {
        if (err) {
          ipcRenderer.send("client_show_message", "生成typescript错误");
        } else {
          ipcRenderer.send("client_show_message", "生成typescript成功");
        }
      });
    },
    createJavascript() {
      ipcRenderer.send("client_create_proto_javascript");
    },
    protoSetting() {
      ipcRenderer.send(
        "client_setting_proto",
        this.game_module_name,
        this.proto_module_name,
        this.proto_cmd_class,
        this.proto_objs
      );
    },
    protoRefresh() {
      ipcRenderer.send("client_refresh_proto");
    },
    requestInput(cmd, request) {
      var hasCmd = false;
      for (var index = 0; index < this.proto_objs.length; index++) {
        var element = this.proto_objs[index];
        if (element.cmd == cmd) {
          hasCmd = true;
          element.request = request;
          break;
        }
      }
      if (!hasCmd) {
        var obj = {};
        obj.cmd = cmd;
        obj.request = request;
        this.proto_objs.push(obj);
      }
    },
    responseInput(cmd, response) {
      var hasCmd = false;
      for (var index = 0; index < this.proto_objs.length; index++) {
        var element = this.proto_objs[index];
        if (element.cmd == cmd) {
          hasCmd = true;
          element.response = response;
          break;
        }
      }
      if (!hasCmd) {
        var obj = {};
        obj.cmd = cmd;
        obj.response = response;
        this.proto_objs.push(obj);
      }
    },
    clearData() {
      this.game_module_name = "";
      this.proto_module_name = "";
      this.proto_file_name = "";
      this.proto_cmds = [];
      this.proto_messages = [];
      this.proto_objs = [];
      this.proto_cmd_class = "";
    }
  },
  mounted() {
    this.project_path = localStorage.getItem("client_project_path");
    this.proto_path = localStorage.getItem("client_proto_path");

    this.game_modules = remote.getGlobal("sharedObject").client_modules;
    this.proto_modules = remote.getGlobal("sharedObject").proto_modules;
    this.protoFiles = remote.getGlobal("sharedObject").proto_files;

    ipcRenderer.removeAllListeners([
      "client_init_complete",
      "client_proto_refresh_complete"
    ]);

    ipcRenderer.on(
      "client_proto_refresh_complete",
      function(event, modules, proto_modules, protoFiles) {
        this.game_modules = modules;
        this.proto_modules = proto_modules;
        this.protoFiles = protoFiles;
      }.bind(this)
    );

    ipcRenderer.on(
      "client_select_proto_file_complete",
      function(event, proto_cmd_class, proto_cmds, proto_messages) {
        this.proto_cmd_class = proto_cmd_class;
        this.proto_cmds = proto_cmds;
        this.proto_messages = proto_messages;
        for (let index = 0; index < this.proto_cmds.length; index++) {
          let element = this.proto_cmds[index];
          let hasCmd = false;

          for (let m = 0; m < this.proto_objs.length; m++) {
            if (this.proto_objs[m].cmd == element) {
              hasCmd = true;
              break;
            }
          }

          if (!hasCmd) {
            var obj = {};
            obj.cmd = element;
            this.proto_objs.push(obj);
          }
        }
      }.bind(this)
    );

    ipcRenderer.on(
      "client_setting_proto_complete",
      function(event) {
        this.clearData();
      }.bind(this)
    );
  }
};
</script>

<style lang="css">
.demo-snackbar-button {
  margin: 12px;
}

.demo-table-item-select-field {
  margin-top: 12px;
}

.content {
  overflow: hidden;
}

.content-left {
  width: 20%;
  float: left;
  background-color: white;
  margin-bottom: -4000px;
  padding-bottom: 4000px;
}

.content-right {
  width: 80%;
  display: inline-block;
  float: right;
  padding: 10px 20px;
  background-color: rgba(0, 0, 0, 0);
}
</style>