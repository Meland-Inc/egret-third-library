declare class KeyBoard extends egret.EventDispatcher {
    private static _curInstance;
    private _isActive;
    private _pauseCB;
    private _resumeCB;
    private inputs;
    /**
     * 同一时刻按下多个键：则返回多个键的字符串数组。
     */
    static onkeydown: string;
    static onkeyup: string;
    static NumLock: string;
    static Num_Slash: string;
    static Num_Mul: string;
    static Num_Sub: string;
    static Num_7: string;
    static Num_8: string;
    static Num_9: string;
    static Num_Plus: string;
    static Num_4: string;
    static Num_5: string;
    static Num_6: string;
    static Num_1: string;
    static Num_2: string;
    static Num_3: string;
    static Num_Enter: string;
    static Num_0: string;
    static Num_dot: string;
    static Esc: string;
    static F1: string;
    static F2: string;
    static F3: string;
    static F4: string;
    static F5: string;
    static F6: string;
    static F7: string;
    static F8: string;
    static F9: string;
    static F10: string;
    static F11: string;
    static F12: string;
    static PrintScreen: string;
    static ScrollLock: string;
    static PauseBreak: string;
    static key_Points: string;
    static key_1: string;
    static key_2: string;
    static key_3: string;
    static key_4: string;
    static key_5: string;
    static key_6: string;
    static key_7: string;
    static key_8: string;
    static key_9: string;
    static key_0: string;
    static key_Sub: string;
    static key_Plus: string;
    static Backspace: string;
    static Insert: string;
    static Home: string;
    static PageUp: string;
    static Tab: string;
    static Q: string;
    static W: string;
    static E: string;
    static R: string;
    static T: string;
    static Y: string;
    static U: string;
    static I: string;
    static O: string;
    static P: string;
    static brace1: string;
    static brace2: string;
    static CnterEnter: string;
    static Delete: string;
    static End: string;
    static PageDown: string;
    static CapsLock: string;
    static A: string;
    static S: string;
    static D: string;
    static F: string;
    static G: string;
    static H: string;
    static J: string;
    static K: string;
    static L: string;
    static semicolon: string;
    static quotes: string;
    static bar: string;
    static key_Shift: string;
    static Z: string;
    static X: string;
    static C: string;
    static V: string;
    static B: string;
    static N: string;
    static M: string;
    static key_Semicolon: string;
    static key_Dot: string;
    static question: string;
    static Right_Shift: string;
    static UpArrow: string;
    static left_Ctrl: string;
    static Left_Win: string;
    static key_Alt: string;
    static SPACE: string;
    static RIGH_Alt: string;
    static RIGHT_WIN: string;
    static NoteSign: string;
    static RIGHT_Ctrl: string;
    static keyArrow: string;
    static DownArrow: string;
    static RightArrow: string;
    static shieldingHotKey: string[];
    private keyValue;
    constructor();
    /**系统自动调用 外部不调用 */
    $dispose(): void;
    private resume;
    private pause;
    /**释放所有按键 */
    private freeAllKey;
    private init;
    private handlekeydown;
    private handlekeyup;
    private checkInput;
    private removeByKey;
    /**
     * 判断data字符串数组中是否包含某个字符串
     */
    isContain(data: any, keyCode: any): boolean;
    private checkShieldingHotKey;
    /**
     * 设置屏蔽浏览器的热键
     */
    static setShieldingHotKey(tKeyList: string[]): void;
}
