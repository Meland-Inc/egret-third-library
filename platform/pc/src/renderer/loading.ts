/**
 * @author 雪糕 
 * @desc 处理loading逻辑文件
 * @date 2020-02-13 14:55:57 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-25 18:41:12
 */
let loadingGroup = document.getElementById('loadingGroup') as HTMLDivElement;
let loadingTip = document.getElementById('loadingTip') as HTMLDivElement;
let loadingProgress = document.getElementById('loadingProgress') as HTMLProgressElement;
export function showLoading(value: string) {
    loadingGroup.hidden = false;
    loadingTip.textContent = value;
}

export function hideLoading() {
    loadingGroup.hidden = true;
    loadingTip.textContent = "";
}

export function setLoadingProgress(value: number) {
    loadingProgress.value = value;
}