/**
 * @author 雪糕 
 * @desc 全局定义
 * @date 2020-03-21 14:52:44 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-21 21:07:40
 */
export namespace define {
    /** 路由枚举 */
    export enum eLessonRouter {
        createMap = "createMap",
        banner = "banner",
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
        website = 2,  //官网进入
        platform = 3, //b端平台上课模式(入口从平台进) 
        createMap = 4, //c端创造地图模式
        mapTemplate = 5, //c端地图模板模式
        mapTemplateRoom = 6, //c端地图模板房间模式
        banner = 7, //banner模式
    }
}