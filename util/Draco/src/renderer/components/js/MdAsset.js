
import { Global } from './Global.js';
import * as fsExc from './FsExecute';
import * as path from 'path';

const assetSuffix = '/resource/assets';
const defaultResSuffix = '/resource/default.res.json';

const asyncSuffix = '/resource/async';
const asyncResSuffix = '/resource/async.res.json';


const indieSuffix = '/resource/indie';
const indieResSuffix = '/resource/indie.res.json';

const mapDataSuffix = '/resource/mapData';
const mapDataResSuffix = '/resource/mapData.res.json'

export async function importDefault() {
  try {
    let default_folder_path = Global.projPath + assetSuffix;
    let defaultConfig = {
      groups: [
        { name: 'preload', keyArr: [], keys: '' },
        { name: 'fairyGui', keyArr: [], keys: '' },
        { name: 'loading', keyArr: [], keys: '' }
      ],
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
      groups: [
        { name: 'boyAni', keyArr: [], keys: '' },
        { name: 'girlAni', keyArr: [], keys: '' }
      ],
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

export async function oneForAll() {
  await importDefault();
  await importAsync();
  await importIndie();
  await importMapData();
}

async function importFolderFile(folderPath, config, group = '', isSheet = false, isRootGroupFolder = false, useOriginGroup = false) {
  let files = await fsExc.readDir(folderPath);
  for (const file of files) {
    let curPath = folderPath + '/' + file;
    if (await fsExc.isDirectory(curPath)) {
      if (!useOriginGroup) {
        if (file == 'preload' || file == 'loading' || file == 'fairyGui' || file == 'boyAni' || file == 'girlAni') {
          group = file;
        } else if (
          group == 'preload' ||
          group == 'loading' ||
          group == 'fairyGui' ||
          group == 'boyAni' ||
          group == 'girlAni') {
        } else {
          group = '';
        }

        if (isRootGroupFolder) {
          group = file;
        }
      }

      console.log(`--> isRootGroupFolder:${isRootGroupFolder} group:${group}`);

      if (file == 'sheet') {
        isSheet = true;
      } else {
        isSheet = false;
      }
      await importFolderFile(curPath, config, group, isSheet, false, isRootGroupFolder);
    } else {
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