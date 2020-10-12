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

    /**刷新渲染尺寸 一般不需要*/
    export function refreshRenderSize(): void {
        lifecycle.stage.$screen.updateScreenSize();
    }
}