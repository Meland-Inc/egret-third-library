/**
 * @author 雪糕 
 * @desc 处理loading逻辑文件
 * @date 2020-02-13 14:55:57 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-21 17:00:38
 */
let loadingGroup = document.getElementById('loadingGroup') as HTMLDivElement;
let loadingProgress = document.getElementById('loadingProgress') as HTMLProgressElement;
export function showLoading() {
    loadingGroup.hidden = false;
}

export function hideLoading() {
    loadingGroup.hidden = true;
}

export function setLoadingProgress(value: number) {
    loadingProgress.value = value;
}

export default this;