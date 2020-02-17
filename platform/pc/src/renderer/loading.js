/**
 * @author 雪糕 
 * @desc 处理loading类
 * @date 2020-02-13 14:55:57 
 * @Last Modified by 雪糕 
 * @Last Modified time 2020-02-13 14:55:57 
 */
let loadingUi = document.getElementById('loadingUi');
export function setLoadingProgress(value) {
    loadingUi.value = value;
}