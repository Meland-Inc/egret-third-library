/**
 * @Author 雪糕
 * @Description ipc消息id
 * @Date 2020-06-15 20:03:32
 * @FilePath \pc\src\common\MsgId.ts
 */
export default class MsgId {
    /** 检查更新 */
    public static readonly CHECK_UPDATE_COMPLETE: string = "CHECK_UPDATE_COMPLETE";

    /** 启动地图模板游戏服务器 */
    public static readonly MAP_TEMPLATE_ENTER: string = "MAP_TEMPLATE_ENTER";

    /** 启动地图模板房间游戏服务器 */
    public static readonly MAP_TEMPLATE_ROOM_CREATE: string = "MAP_TEMPLATE_ROOM_CREATE";

    /** 进入地图模板失败 */
    public static readonly MAP_TEMPLATE_ENTER_ERROR: string = "MAP_TEMPLATE_ENTER_ERROR";

    /** 切换全屏显示 */
    public static readonly SWITCH_FULL_SCREEN: string = "SWITCH_FULL_SCREEN";

    /** 退出Native */
    public static readonly QUIT_NATIVE: string = "QUIT_NATIVE";

    /** 发送玩家id */
    public static readonly SEND_PLAYER_ID: string = "SEND_PLAYER_ID";

    /** 小贝星球准备完毕 */
    public static readonly BELLPLANET_CLIENT_READY: string = "BELLPLANET_CLIENT_READY";

    /** 设置native策略版本号 */
    public static readonly SET_NATIVE_POLICY_VERSION: string = "SET_NATIVE_POLICY_VERSION";

    /** 清除渲染数据 */
    public static readonly CLEAR_RENDERER_MODEL_DATA: string = "CLEAR_RENDERER_MODEL_DATA";

    /** 保存native平台登陆信息 */
    public static readonly SAVE_NATIVE_LOGIN_RESPONSE: string = "SAVE_NATIVE_LOGIN_RESPONSE";

    /** 设置native服务器内网ip和端口 */
    public static readonly SAVE_NATIVE_GAME_SERVER: string = "SAVE_NATIVE_GAME_SERVER";

    /** 存储客户端获取的set-cookie */
    public static readonly SAVE_NATIVE_HEADER_SET_COOKIE: string = "SAVE_NATIVE_HEADER_SET_COOKIE";

    /** 从客户端进入 */
    public static readonly START_NATIVE_CLIENT: string = "START_NATIVE_CLIENT";

    /** 开始指定网址进入 */
    public static readonly START_NATIVE_WEBSITE: string = "START_NATIVE_WEBSITE";

    /** 开始平台进入 */
    public static readonly START_NATIVE_PLATFORM: string = "START_NATIVE_PLATFORM";

    /** 跳转到指定url进入 */
    public static readonly START_NATIVE_URL: string = "START_NATIVE_URL";

    /** 发送消息到客户端 */
    public static readonly SEND_CLIENT_MSG: string = "SEND_CLIENT_MSG";

    /** 显示loading */
    public static readonly SHOW_LOADING: string = "SHOW_LOADING";

    /** 隐藏loading */
    public static readonly HIDE_LOADING: string = "HIDE_LOADING";

    /** 设置loading进度 */
    public static readonly SET_LOADING_PROGRESS: string = "SET_LOADING_PROGRESS";

    /** 检查游戏包更新 */
    public static readonly CHECK_PACKAGE_UPDATE: string = "CHECK_PACKAGE_UPDATE";

    /** 获取native策略版本号 */
    public static readonly GET_NATIVE_POLICY_VERSION: string = "GET_NATIVE_POLICY_VERSION";

    /** 错误上报 */
    public static readonly ERROR_REPORT: string = "ERROR_REPORT";

    /** native登录游戏 */
    public static readonly nativeSignIn: string = "nativeSignIn";

    /** 进入模板地图 */
    public static readonly enterMapTemplate: string = "enterMapTemplate";

    /** 进入模板地图房间 */
    public static readonly enterMapTemplateRoom: string = "enterMapTemplateRoom";

    /** 发送主进程log到渲染进程 */
    public static readonly sendMainLogToRenderer: string = "sendMainLogToRenderer";
}