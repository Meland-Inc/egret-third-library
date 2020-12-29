
export class ServerModel {
    //傻瓜模式服务器配置
    serverConfigList = [
        { name: "正视角", gid: "1001" },
        { name: "斜视角", gid: "1002" },
    ];
    serverConfig;
    setServerConfig(value) {
        this.serverConfig = value;
    }
    async init() {
        this.serverConfig = this.serverConfigList[0];
    }
}