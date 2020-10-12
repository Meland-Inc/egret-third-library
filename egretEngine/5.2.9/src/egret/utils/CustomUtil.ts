namespace egret {
    /**性能档位 */
    export enum ePerfType {
        high = 1,
        medium,
        low
    }

    /**外部不要使用 */
    export let $curPerf: ePerfType = ePerfType.medium;

    /**设置性能 */
    export function setPerf(tValue: ePerfType): void {
        $curPerf = tValue;
    }
}