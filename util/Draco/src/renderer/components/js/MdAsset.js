
import { Global } from './Global.js';
import * as fsExc from './FsExecute';
import * as path from 'path';
import { ModelMgr } from './model/ModelMgr.js';

const externalSuffix = '/resource/external';
const externalResSuffix = '/resource/external.json';

const assetSuffix = '/resource/assets';
const defaultResSuffix = '/resource/default.res.json';

const asyncSuffix = '/resource/async';
const asyncResSuffix = '/resource/async.res.json';


const indieSuffix = '/resource/indie';
const indieResSuffix = '/resource/indie.res.json';

const mapDataSuffix = '/resource/mapData';
const mapDataResSuffix = '/resource/mapData.res.json'

//鲸幂相关
const jimmySuffix = '/resource/jimmyAssets';
const jimmyResSuffix = '/resource/jimmy.res.json';
const jimmyDynamicMissionDir = 'dynamicMission';//动态关卡文件夹名 该文件夹下面子文件夹都会作为group
const jimmyNeedExternalAssetPath = ['/resource/assets/fairyGuiLog', '/resource/assets/fairySound'];//鲸幂res配置需要的外部资源

const groupArr = ['preload', 'loading', 'fairyGui', 'fairySound', 'boyAni', 'girlAni', 'regSheet', 'fairyGuiLog', 'base'];

const groupFile = {
  'common.fui': 'login',
  'common_atlas0.png': 'login',
  'common_atlas1.png': 'login',
  'login.fui': 'login',
  'login_atlas0.png': 'login',
  'createRole.fui': 'login',
  'createRole_atlas0.png': 'login',
}

const sheetArr = ['sheet', 'regSheet'];

export async function importExternal() {
  try {
    let external_folder_path = Global.projPath + externalSuffix;
    let externalConfig = {};
    await importExternalFolder(external_folder_path, externalConfig);
    let content = JSON.stringify(externalConfig);
    let configPath = Global.projPath + externalResSuffix;
    await fsExc.writeFile(configPath, content);

    Global.toast('导入external配置成功');
  } catch (error) {
    Global.snack('导入external配置错误', error);
  }
}

async function importExternalFolder(folderPath, externalConfig) {
  let files = await fsExc.readDir(folderPath);
  for (const file of files) {
    let curPath = folderPath + '/' + file;
    if (await fsExc.isDirectory(curPath)) {
      await importExternalFolder(curPath, externalConfig);
    } else {
      externalConfig[file] = file;
    }
  }
}

export async function importDefault() {
  try {
    let default_folder_path = Global.projPath + assetSuffix;
    let defaultConfig = {
      groups: [],
      resources: []
    };
    await importFolderFile(default_folder_path, defaultConfig);

    for (const iterator of defaultConfig.groups) {
      let keys = '';
      for (let i = 0; i < iterator.keyArr.length; i++) {
        const element = iterator.keyArr[i];
        if (i == iterator.keyArr.length - 1) {
          keys += element;
        } else {
          keys += element + ',';
        }
        iterator.keys = keys;
      }
      delete iterator.keyArr;
    }

    let content = JSON.stringify(defaultConfig);
    let configPath = Global.projPath + defaultResSuffix;
    await fsExc.writeFile(configPath, content);

    Global.toast('导入default配置成功');
  } catch (error) {
    Global.snack('导入default配置错误', error);
  }
}

export async function importAsync() {
  try {
    let async_folder_path = Global.projPath + asyncSuffix;
    let asyncConfig = {
      groups: [],
      resources: []
    };
    await importFolderFile(async_folder_path, asyncConfig);

    for (const iterator of asyncConfig.groups) {
      let keys = '';
      for (let i = 0; i < iterator.keyArr.length; i++) {
        const element = iterator.keyArr[i];
        if (i == iterator.keyArr.length - 1) {
          keys += element;
        } else {
          keys += element + ',';
        }
        iterator.keys = keys;
      }
      delete iterator.keyArr;
    }

    let content = JSON.stringify(asyncConfig);
    let configPath = Global.projPath + asyncResSuffix;
    await fsExc.writeFile(configPath, content);

    Global.toast('导入async配置成功');
  } catch (error) {
    Global.snack('导入async配置错误', error);
  }
}

export async function importIndie() {
  try {
    let indie_folder_path = Global.projPath + indieSuffix;
    let indieConfig = {
      groups: [],
      resources: []
    };
    await importFolderFile(indie_folder_path, indieConfig, '', false, true);

    for (const iterator of indieConfig.groups) {
      let keys = '';
      for (let i = 0; i < iterator.keyArr.length; i++) {
        const element = iterator.keyArr[i];
        if (i == iterator.keyArr.length - 1) {
          keys += element;
        } else {
          keys += element + ',';
        }
        iterator.keys = keys;
      }
      delete iterator.keyArr;
    }

    let content = JSON.stringify(indieConfig);
    let configPath = Global.projPath + indieResSuffix;
    await fsExc.writeFile(configPath, content);

    Global.toast('导入indie配置成功');
  } catch (error) {
    Global.snack('导入indie配置错误', error);
  }
}

export async function importMapData() {
  try {
    let map_data_folder_path = Global.projPath + mapDataSuffix;
    let mapDataConfig = {
      groups: [],
      resources: []
    };
    await importFolderFile(map_data_folder_path, mapDataConfig);
    let content = JSON.stringify(mapDataConfig);
    let configPath = Global.projPath + mapDataResSuffix;
    await fsExc.writeFile(configPath, content);

    Global.toast('导入mapData配置成功');
  } catch (error) {
    Global.snack('导入mapData配置错误', error);
  }
}

export async function importJimmy() {
  //鲸幂开关
  if (!ModelMgr.jimmyModel) {
    return;
  }

  try {
    let jmAssetPath = Global.projPath + jimmySuffix;
    let jmConfig = {
      groups: [],
      resources: []
    };

    //鲸幂自己的的非动态关卡的
    await importFolderFile(jmAssetPath, jmConfig, '', false, false, false, [jimmyDynamicMissionDir]);

    //处理依赖的鲸幂外部文件
    for (let jmExternalPath of jimmyNeedExternalAssetPath) {
      let words = jmExternalPath.split(/[\/\\]/);
      let dirName = words[words.length - 1];
      await importFolderFile(Global.projPath + jmExternalPath, jmConfig, dirName, false, true);
    }

    //处理动态关卡资源组
    await importFolderFile(jmAssetPath + `/${jimmyDynamicMissionDir}`, jmConfig, '', false, true);

    for (const iterator of jmConfig.groups) {
      let keys = '';
      for (let i = 0; i < iterator.keyArr.length; i++) {
        const element = iterator.keyArr[i];
        if (i == iterator.keyArr.length - 1) {
          keys += element;
        } else {
          keys += element + ',';
        }
        iterator.keys = keys;
      }
      delete iterator.keyArr;
    }

    let content = JSON.stringify(jmConfig);
    let configPath = Global.projPath + jimmyResSuffix;
    await fsExc.writeFile(configPath, content);

    Global.toast('导入Jimmy配置成功');
  } catch (error) {
    Global.snack('导入Jimmy配置错误', error);
  }
}

// export async function oneForAll() {
//   await importDefault();
//   await importAsync();
//   await importIndie();
//   await importMapData();
//   await importExternal();
//   await importJimmy();
// }

/**
 * 
 * @param {*} folderPath 
 * @param {*} config 
 * @param {*} group 
 * @param {*} isSheet 
 * @param {*} isRootGroupFolder 
 * @param {*} useOriginGroup 
 * @param {*} excludeDirList 排除的文件夹 string[] 默认null
 */
async function importFolderFile(folderPath, config, group = '', isSheet = false, isRootGroupFolder = false, useOriginGroup = false, excludeDirList = null) {
  let files = await fsExc.readDir(folderPath);
  let originGroup = group;
  for (const file of files) {
    let curPath = folderPath + '/' + file;
    group = originGroup;
    if (await fsExc.isDirectory(curPath)) {

      //排除特定文件夹
      if (excludeDirList && excludeDirList.indexOf(file) >= 0) {
        continue;
      }

      if (!useOriginGroup) {
        if (groupArr.some(value => { return value === file })) {
          group = file;
        } else if (groupArr.some(value => { return value === group })) {
          //
        } else {
          group = '';
        }

        if (isRootGroupFolder) {
          group = file;
        }
      }

      console.log(`--> isRootGroupFolder:${isRootGroupFolder} group:${group}`);

      if (sheetArr.some(value => { return value === file })) {
        isSheet = true;
      } else {
        isSheet = false;
      }
      await importFolderFile(curPath, config, group, isSheet, false, useOriginGroup, excludeDirList);
    } else {
      if (groupFile[file]) {
        group = groupFile[file];
      }
      await importSingleFile(curPath, config, group, isSheet);
    }
  }
}

async function importSingleFile(filePath, config, group, isSheet) {
  let relative = path.relative(Global.projPath + '/resource', filePath);
  let url = relative.replace(/\\/g, '/');
  let parsedPath = path.parse(filePath);
  let extname = parsedPath.ext;
  let type = getType(extname, isSheet);
  let name = parsedPath.name + extname.replace('.', '_');
  if (!isSheet || extname == '.json') {
    if (isSheet) {
      let subkeys = '';
      let content = await fsExc.readFile(filePath);

      let contentObj = JSON.parse(content);

      if (contentObj.frames) {
        let isFirst = true;
        for (const key in contentObj.frames) {
          if (isFirst) {
            subkeys += key;
            isFirst = false;
          } else {
            subkeys += ',' + key;
          }
        }
      }
      config.resources.push({
        name: name,
        type: type,
        url: url,
        subkeys: subkeys
      });
    } else {
      config.resources.push({ name: name, type: type, url: url });
    }

    switch (group) {
      case '':
        break;
      default:
        let groupExist = false;
        for (const iterator of config.groups) {
          if (iterator.name == group) {
            groupExist = true;
            iterator.keyArr.push(name);
          }
        }

        if (!groupExist) {
          let keyArr = { name: group, keyArr: [name], keys: '' };
          config.groups.push(keyArr);
        }
        break;
    }
  }
}

function getType(extname, isSheet) {
  if (isSheet) {
    return 'sheet';
  }
  switch (extname) {
    case '.json':
      return 'json';
    case '.fnt':
      return 'font';
    case '.txt':
    case '.proto':
      return 'text';
    case '.mp3':
    case '.wav':
    case '.m4a':
      return 'sound';
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.bmp':
    case '.gif':
      return 'image';
    default:
      return 'bin';
      break;
  }
}