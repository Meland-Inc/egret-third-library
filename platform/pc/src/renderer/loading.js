/**
 * @author 雪糕 
 * @desc 处理loading逻辑文件
 * @date 2020-02-13 14:55:57 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-26 21:59:35
 */
let loadingUi = document.getElementById('loadingUi');
export function showLoading() {
    loadingUi.hidden = false;
}

export function hideLoading() {
    loadingUi.hidden = true;
}

export function setLoadingProgress(value) {
    loadingUi.value = value;
}