/**
 * @Author 雪糕
 * @Description ipc之间传输消息用的channel
 * @Date 2020-06-15 20:12:10
 * @FilePath \pc\src\common\IpcChannel.ts
 */
export default class IpcChannel {
    /** 主进程发送的消息 */
    public static MAIN_PROCESS_MESSAGE: string = "MAIN_PROCESS_MESSAGE";
    /** 渲染进程发送的消息 */
    public static RENDERER_PROCESS_MESSAGE: string = "RENDERER_PROCESS_MESSAGE";
    /** 游戏客户端进程发送的消息 */
    public static CLIENT_PROCESS_MESSAGE: string = "CLIENT_PROCESS_MESSAGE";
}