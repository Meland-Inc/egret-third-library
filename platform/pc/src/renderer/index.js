/**
 * @author 雪糕 
 * @desc index.js
 * @date 2020-02-18 11:44:51 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-25 17:14:28
 */
import { ClientUpdate } from './update/ClientUpdate.js';
import * as config from './config.js';
import * as logger from './logger.js';

const fs = require('fs');
let clientUpdate = new ClientUpdate(startRunGame);

async function startRunGame() {
    return;

    let content = await fs.readFileSync(config.globalConfigPath, "utf-8");
    let globalConfigData = JSON.parse(content);
    if (globalConfigData) {
        localStorage.setItem(config.nativeConfig, JSON.stringify(globalConfigData));
    }

    let hrefArr = location.href.split(".html");
    if (hrefArr[1] != "") {
        location.href = `${config.rootPath}/package/client/index.html${hrefArr[1]}`;
    } else {
        location.href = `${config.rootPath}/package/client/index.html`;
    }
}

try {
    clientUpdate.checkUpdate(startRunGame);
} catch (error) {
    let content = `native更新客户端报错`
    logger.error(`update`, content, error);
    alert(content);

    startRunGame();
}