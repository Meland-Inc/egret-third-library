/*
 * @Author: xiangqian 
 * @Date: 2019-03-06 15:15:08 
 * @Last Modified by: xiangqian
 * @Last Modified time: 2019-03-06 16:23:44
 */
/**用来单独处理龙骨等动画系统的 另外一套单独帧率 */
class SystemTickerAnimProcess {
    public $frameDeltaTime: number;
    public $lastCount: number;
    public $frameInterval: number;

    public $frameRate: number;
    public $thisObject: any;
    public $callBack: (timeStamp: number) => boolean;

    constructor(defaultFps: number) {
        this.$frameRate = defaultFps;
        this.$frameDeltaTime = 1000 / this.$frameRate;
        this.$lastCount = this.$frameInterval = Math.round(60000 / this.$frameRate);
    }

    public getFrameRate(): number {
        return this.$frameRate;
    }

    public $setFrameRate(value: number) {
        if (this.$frameRate == value) {
            return;
        }

        if (value < 0) {
            value = 2;
        }
        else if (value > 60) {
            value = 60;
        }

        this.$frameRate = value;
        this.$frameDeltaTime = 1000 / value;
        //这里用60*1000来避免浮点数计算不准确的问题。
        this.$lastCount = this.$frameInterval = Math.round(60000 / value);
        return;
    }

    /**
     * 检查ticker是否是动画相关的
     * @param callBack 回调
     * @param thisObject this
     * @returns true:是动画相关
     */
    public $checkAnimTicker(callBack: (timeStamp: number) => boolean, thisObject: any): boolean {
        //TODO:如果混淆这里会有问题 没有好的检查办法 先这样
        if (!window["dragonBones"]) {
            return false;
        }

        if (thisObject != window["dragonBones"]["EgretFactory"]) {
            return false;
        }

        if (this.$thisObject) {
            console.error(`SystemTickerAnimProcess already exist`);
            return false;//如果存在 后面的也不至于不处理 就交给系统当做普通处理
        }

        if (!callBack || !thisObject) {
            console.error(`SystemTickerAnimProcess error cb=${callBack} this=${thisObject}`);
            return false;//异常后给系统处理
        }

        this.$thisObject = thisObject;
        this.$callBack = callBack;
        return true;
    }

    /**执行回调 */
    public $executeCallBack(timeStamp: number) {
        if (this.$callBack && this.$thisObject) {
            this.$callBack.call(this.$thisObject, timeStamp);
        }
    }
}