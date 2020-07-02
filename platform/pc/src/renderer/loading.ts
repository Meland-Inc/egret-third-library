/** 
 * @Author 雪糕
 * @Description 处理loading逻辑文件
 * @Date 2020-02-13 14:55:57
 * @FilePath \pc\src\renderer\loading.ts
 */
function getLoadingGroup() {
    return document.getElementById('loadingGroup') as HTMLDivElement;
}

function getLoadingTip() {
    return document.getElementById('loadingTip') as HTMLDivElement;
}

function getLoadingProgress() {
    return document.getElementById('loadingProgress') as HTMLProgressElement;
}

let timeoutId: number;
export function showLoading(value: string) {
    clearTimeout();
    const loadingGroup = getLoadingGroup();
    const loadingTip = getLoadingTip();
    loadingGroup.hidden = false;
    loadingTip.textContent = value;
}

export function hideLoading() {
    clearTimeout();
    const loadingGroup = getLoadingGroup();
    const loadingTip = getLoadingTip();
    loadingGroup.hidden = true;
    loadingTip.textContent = "";
}

export function setLoadingProgress(value: number) {
    const loadingProgress = getLoadingProgress();
    loadingProgress.value = value;
}

export function gradualProgress() {
    const loadingProgress = getLoadingProgress();
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