/**
 * @Author 雪糕
 * @Description 通用定义
 * @Date 2020-06-15 14:31:53
 * @FilePath \pc\src\common\CommonDefine.ts
 */
export namespace CommonDefine {
    /** 分支枚举 */
    export enum eEnvironName {
        beta = "beta",
        ready = "ready",
        release = "release",
    }

    /** 游戏包类型枚举 */
    export enum ePackageType {
        client = "client",
        server = "server",
    }

    /** 路由枚举 */
    export enum eLessonRouter {
        createMap = "createMap",    //小贝创建地图模板
        banner = "banner",      //banner
        game = "game",          //游戏模式
        url = "url",            //跳转到指定url
        enterPrestigeMap = "enterPrestigeMap",  //进入神庙地图模板
    }

    /** 用户类型枚举，教师端，学生端，机构端 */
    export enum eUserType {
        student = 1,
        teacher = 2,
        system = 3,
        institution = 4,//机构
        tutor = 5,//导师
        lessonsDevelop = 99,//小贝客户端自定义的 教研用
    }

    /** 游戏服务器模式 */
    export enum eGameServerMode {
        gameMap = 1,    //游戏地图
        mapTemplate = 2,  //模板地图
        mapTemplateRoom = 3, //模板地图房间
    }

    /** native模式 */
    export enum eNativeMode {
        game = 1,    //c端游戏模式
        website = 2,  //指定网址进入
        platform = 3, //b端平台上课模式(入口从平台进) 
        createMap = 4, //c端创造地图模式
        mapTemplate = 5, //c端地图模板模式
        mapTemplateRoom = 6, //c端地图模板房间模式
        banner = 7, //banner模式
        url = 8, //跳转指定url模式
        prestigeMap = 9, //神庙地图模板
    }

    /** native服务器的路径枚举 */
    export enum eNativeServerPathname {
        serverState = "/serverState",       //服务器状态
        serverLog = "/serverLog",           //服务器上报日志
    }
    /** log类型 */
    export enum eLogType {
        log = 1,
        error = 2,
        warn = 3,
        info = 4
    }

    /** 伪协议参数名称 */
    export enum eFakeProtoParamField {
        environName = "environName"
    }

    export const globalConfigMap = {
        "beta": {
            "patchUrl": "192.168.1.211/native/beta/patch",
            "packageUrl": "192.168.1.211/native/beta/release",
            "policyUrl": "planet.wkcoding.com/web/beta/"
        },
        "ready": {
            "patchUrl": "bg-stage.wkcoding.com/readyTest//ready/win",
            "packageUrl": "bg-stage.wkcoding.com/clientPackages/ready",
            "policyUrl": "bg-stage.wkcoding.com/readyTest"
        },
        "release": {
            "patchUrl": "bg-stage.wkcoding.com//win",
            "packageUrl": "bg-stage.wkcoding.com/clientPackages/ready",
            "policyUrl": "bg-stage.wkcoding.com/"
        }
    }
}