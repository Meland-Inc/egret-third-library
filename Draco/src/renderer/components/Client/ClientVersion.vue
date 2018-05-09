<template>
    <div>
      <mu-content-block>
        <mu-text-field label="当前版本号" hintText="当前版本号" v-model="oldEdition" disabled/><br />
        <mu-text-field label="新版本号" hintText="新版本号" v-model="newEdition" /><br />
      </mu-content-block>
        <mu-raised-button label="修改版本号" class="demo-snackbar-button" @click="modifyEdition" primary/>
        <mu-raised-button label="编译JS代码" class="demo-snackbar-button" @click="compileCode" primary/>
        <mu-raised-button label="生成版本" class="demo-snackbar-button" @click="generateEdition" primary/>
        <mu-divider/>
        <mu-content-block>
          <mu-text-field label="远程服务器ip" hintText="远程服务器ip" v-model="client_remote_server_ip" /><br />
          <mu-text-field label="远程服务器用户名" hintText="远程服务器用户名" v-model="client_remote_server_user" /><br />
          <mu-text-field label="远程服务器密码" hintText="远程服务器密码" v-model="client_remote_server_password" /><br />
          <mu-text-field label="远程服务器操作路径" hintText="远程服务器操作路径" v-model="client_remote_server_operate_path" /><br />

        </mu-content-block>
        <mu-raised-button label="压缩zip工程" class="demo-snackbar-button" @click="zipProject" primary/>
        <mu-raised-button label="传输zip工程" class="demo-snackbar-button" @click="transferProject" primary/>
        <mu-raised-button label="解压远程zip工程" class="demo-snackbar-button" @click="unzipProject" primary/>
        <mu-raised-button label="执行python文件" class="demo-snackbar-button" @click="runPython" primary/>
    </div>
</template>

<script>
const spawn = require("child_process").spawn;
const ipcRenderer = require("electron").ipcRenderer;
const remote = require("electron").remote;
const fs = require("fs");
const Client = require("ssh2").Client;
const archiver = require("archiver");
const scp2 = require("scp2");

export default {
  data() {
    return {
      oldEdition: "",
      newEdition: "",
      preModifyContent: "",
      endModifyContent: "",
      client_modify_edition_path: "",
      client_compile_code_path: "",
      client_generate_eidtion_path: "",
      client_remote_assets_path: "",
      client_remote_server_ip: "",
      client_remote_server_user: "",
      client_remote_server_password: "",
      client_remote_server_operate_path: ""
    };
  },
  methods: {
    modifyEdition() {
      if (!this.newEdition || this.newEdition == "") {
        ipcRenderer.send("client_show_message", "新版本号不能为空");
        return;
      }

      if (this.newEdition < this.oldEdition) {
        ipcRenderer.send("client_show_message", "新版本号过旧");
        return;
      }

      let content =
        this.preModifyContent +
        'cur_version = "' +
        this.newEdition +
        '"' +
        this.endModifyContent;

      fs.writeFile(this.client_modify_edition_path, content, function(err) {
        if (err) {
          console.log(err);
        }
      });

      let pathArr = this.getFilePath(this.client_modify_edition_path);
      let fileName = pathArr[0];
      let filePath = pathArr[1];

      let process = spawn("python", [fileName], { cwd: filePath });
      let self = this;
      process.stdout.on("data", function(data) {
        console.log("stdout: " + data);
      });
      process.stderr.on("data", function(data) {
        console.log("stderr: " + data);
      });
      process.on("exit", function(code) {
        if (code == 0) {
          console.log("修改版本号成功,错误码:" + code);
          ipcRenderer.send("client_show_snack", "修改版本号成功");
          self.loadVersion();
        } else {
          console.log("修改版本号失败,错误码:" + code);
        }
      });
    },

    compileCode() {
      let pathArr = this.getFilePath(this.client_compile_code_path);
      let fileName = pathArr[0];
      let filePath = pathArr[1];

      let process = spawn("python", [fileName], { cwd: filePath });
      process.stdout.on("data", function(data) {
        console.log("stdout: " + data);
      });
      process.stderr.on("data", function(data) {
        console.log("stderr: " + data);
      });
      process.on("exit", function(code) {
        if (code == 0) {
          console.log("编译代码成功,错误码:" + code);
          ipcRenderer.send("client_show_snack", "编译代码成功");
        } else {
          console.log("编译代码失败,错误码:" + code);
        }
      });
    },

    generateEdition() {
      let pathArr = this.getFilePath(this.client_generate_eidtion_path);
      let fileName = pathArr[0];
      let filePath = pathArr[1];

      let process = spawn(fileName, [], { cwd: filePath });
      process.stdout.on("data", function(data) {
        console.log("stdout: " + data);
      });
      process.stderr.on("data", function(data) {
        console.log("stderr: " + data);
      });
      process.on("exit", function(code) {
        if (code == 0) {
          console.log("生成版本成功,错误码:" + code);
          ipcRenderer.send("client_show_snack", "生成版本成功");
        } else {
          console.log("生成版本失败,错误码:" + code);
        }
      });
    },

    loadVersion() {
      let content = fs.readFileSync(this.client_modify_edition_path, "utf-8");
      let arr = content.split("cur_version");
      this.preModifyContent = arr.shift();
      let arr1 = arr.shift().split('"');
      arr1.shift();
      this.oldEdition = arr1.shift();
      this.endModifyContent = "";
      for (let i = 0; i < arr1.length; i++) {
        const element = arr1[i];
        if (i != arr1.length - 1) {
          this.endModifyContent += element + '"';
        } else {
          this.endModifyContent += element;
        }
      }

      this.endModifyContent += "cur_version";

      for (let i = 0; i < arr.length; i++) {
        const element = arr[i];
        if (i != arr.length - 1) {
          this.endModifyContent += element + "cur_version";
        } else {
          this.endModifyContent += element;
        }
      }
    },

    transferProject() {
      let remotePathArr = this.getFilePath(this.client_remote_assets_path);
      let remoteFileName = remotePathArr[0];
      let remoteFilePath = remotePathArr[1];

      scp2.scp(
        remoteFilePath + remoteFileName + ".zip",
        {
          // host: "172.16.1.4",
          // username: "ubuntu",
          // password: "1qaz1QAZ",
          // path: "/home/ubuntu/upload/"
          host: this.client_remote_server_ip,
          username: this.client_remote_server_user,
          password: this.client_remote_server_password,
          path: this.client_remote_server_operate_path
        },
        function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("传输zip成功");
            ipcRenderer.send("client_show_message", "传输zip成功");
          }
        }
      );
    },

    zipProject() {
      let pathArr = this.getFilePath(this.client_remote_assets_path);
      let fileName = pathArr[0];
      let filePath = pathArr[1];

      var output = fs.createWriteStream(filePath + fileName + ".zip");
      var archive = archiver("zip");

      archive.on("error", function(err) {
        console.log("压缩zip失败,错误" + err);
        ipcRenderer.send("client_show_snack", "压缩zip失败");
      });
      output.on("close", function() {
        console.log("压缩zip成功");
        ipcRenderer.send("client_show_message", "压缩zip成功");
      });

      archive.pipe(output);
      archive.directory(this.client_remote_assets_path, fileName);
      archive.finalize();
    },

    unzipProject() {
      let pathArr = this.getFilePath(this.client_remote_assets_path);
      let fileName = pathArr[0];
      let filePath = pathArr[1];
      let conn = new Client();
      let self = this;

      conn
        .on("ready", function() {
          console.log("Client :: ready");
          let cmdStr =
            "cd " +
            self.client_remote_server_operate_path +
            "\n" +
            "unzip -o " +
            fileName +
            ".zip";

          console.log("cmd---" + cmdStr);

          conn.exec(
            cmdStr,
            { cwd: self.client_remote_server_operate_path },
            function(err, stream) {
              if (err) throw err;
              stream
                .on("close", function(code, signal) {
                  conn.end();
                  console.log("解压zip成功");
                  ipcRenderer.send("client_show_message", "解压zip成功");
                })
                .on("data", function(data) {
                  console.log("STDOUT: " + data);
                })
                .stderr.on("data", function(data) {
                  console.log("STDERR: " + data);
                });
            }
          );
        })
        .connect({
          host: this.client_remote_server_ip,
          port: 22,
          username: this.client_remote_server_user,
          password: this.client_remote_server_password
        });
    },

    runPython() {
      let pathName = "client_tools/";
      let fileName = "replace_manifest.py";
      let conn = new Client();
      let self = this;
      let calledBack = 0;
      conn
        .on("ready", function() {
          let cmdStr =
            "cd " +
            self.client_remote_server_operate_path +
            pathName +
            "\n" +
            "python " +
            fileName;

          conn.exec(cmdStr, function(err, stream) {
            if (err) throw err;
            stream
              .on("close", function(code, signal) {
                conn.end();
                console.log("执行python成功");
                ipcRenderer.send("client_show_message", "执行python成功");
              })
              .on("data", function(data) {
                console.log("STDOUT: " + data);
              })
              .stderr.on("data", function(data) {
                console.log("STDERR: " + data);
              });
          });
        })
        .connect({
          host: this.client_remote_server_ip,
          port: 22,
          username: this.client_remote_server_user,
          password: this.client_remote_server_password
        });
    },

    getFilePath(path) {
      let filePathArr = path.split("\\");
      let filePath = "";
      let fileName = filePathArr.pop();
      for (let i = 0; i < filePathArr.length; i++) {
        const element = filePathArr[i];
        filePath += element + "\\";
      }

      return [fileName, filePath];
    }
  },
  watch: {
    newEdition: function(val, oldVal) {
      val;
    },
    client_remote_server_ip: function(val, oldVal) {
      if (val != oldVal) {
        localStorage.setItem("client_remote_server_ip", val);
      }
    },
    client_remote_server_user: function(val, oldVal) {
      if (val != oldVal) {
        localStorage.setItem("client_remote_server_user", val);
      }
    },
    client_remote_server_password: function(val, oldVal) {
      if (val != oldVal) {
        localStorage.setItem("client_remote_server_password", val);
      }
    },
    client_remote_server_operate_path: function(val, oldVal) {
      if (val != oldVal) {
        localStorage.setItem("client_remote_server_operate_path", val);
      }
    }
  },
  mounted() {
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

    this.client_remote_server_ip = localStorage.getItem(
      "client_remote_server_ip"
    );
    this.client_remote_server_user = localStorage.getItem(
      "client_remote_server_user"
    );
    this.client_remote_server_password = localStorage.getItem(
      "client_remote_server_password"
    );
    this.client_remote_server_operate_path = localStorage.getItem(
      "client_remote_server_operate_path"
    );

    this.loadVersion();
  }
};
</script>