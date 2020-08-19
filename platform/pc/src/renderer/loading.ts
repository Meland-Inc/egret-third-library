/** 
 * @Author 雪糕
 * @Description 处理loading逻辑文件
 * @Date 2020-02-13 14:55:57
 * @FilePath \pc\src\renderer\loading.ts
 */
function getLogoImg() {
    return document.getElementById('logoImg') as HTMLDivElement;
}

function getLoadingCtnr() {
    return document.getElementById('loadingCtnr') as HTMLDivElement;
}

function getLoadingGroup() {
    return document.getElementById('loadingGroup') as HTMLDivElement;
}

function getLoadingTip() {
    return document.getElementById('loadingTip') as HTMLDivElement;
}

function getLoadingBar() {
    return document.getElementById('loadingBar') as HTMLProgressElement;
}

function getLoadingBarText() {
    return document.getElementById('loadingBarText') as HTMLProgressElement;
}

let timeoutId: number;
let progressValue: number;
/** 显示loading界面 */
export function showLoading(value: string) {
    clearTimeout();
    const logoImg = getLogoImg();
    const loadingCtnr = getLoadingCtnr();
    const loadingGroup = getLoadingGroup();
    const loadingTip = getLoadingTip();
    logoImg.hidden = true;
    loadingGroup.hidden = false;
    loadingCtnr.hidden = false;
    loadingTip.textContent = value;
}

/** 隐藏loading条 */
export function hideLoadingProgress() {
    clearTimeout();
    const loadingGroup = getLoadingGroup();
    const loadingTip = getLoadingTip();
    loadingGroup.hidden = true;
    loadingTip.textContent = "";
}

export function setLoadingProgress(value: number) {
    progressValue = value;
    updateLoadingProgress();
}

export function gradualProgress() {
    progressValue += 0.1;
    updateLoadingProgress();
    clearTimeout();
    if (progressValue === 100) {
        return;
    }

    timeoutId = window.setTimeout(gradualProgress, 50);
}

function updateLoadingProgress(): void {
    const loadingBar = getLoadingBar();
    const loadingBarText = getLoadingBarText();
    loadingBar.style.width = `${progressValue}%`;
    loadingBarText.innerText = `${Math.round(progressValue)}%`;
}

function clearTimeout() {
    if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
    }
}