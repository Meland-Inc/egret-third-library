/** 
 * @Author 雪糕
 * @Description 处理loading逻辑文件
 * @Date 2020-02-13 14:55:57
 * @FilePath \pc\src\renderer\loading.ts
 */
let loadingGroup = document.getElementById('loadingGroup') as HTMLDivElement;
let loadingTip = document.getElementById('loadingTip') as HTMLDivElement;
let loadingProgress = document.getElementById('loadingProgress') as HTMLProgressElement;

let timeoutId: number;
export function showLoading(value: string) {
    clearTimeout();
    loadingGroup.hidden = false;
    loadingTip.textContent = value;
}

export function hideLoading() {
    clearTimeout();
    loadingGroup.hidden = true;
    loadingTip.textContent = "";
}

export function setLoadingProgress(value: number) {
    loadingProgress.value = value;
}

export function gradualProgress() {
    loadingProgress.value += 1;
    clearTimeout();
    if (loadingProgress.value === 100) {
        return;
    }

    timeoutId = window.setTimeout(gradualProgress, 300);
}

function clearTimeout() {
    if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
    }
}