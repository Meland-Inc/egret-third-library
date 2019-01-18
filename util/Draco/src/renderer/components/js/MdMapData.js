import * as spawnExc from "./SpawnExecute.js";
import * as fsExc from "./FsExecute.js";
import { Global } from "./Global.js";

const m0Bat = 'MapDataBatchProcess.bat';
const m1Bat = 'XinshouMapBatchProcess.bat';

var projMapM0Path = Global.projPath + '/resource/mapData/m0';
var projMapM1Path = Global.projPath + '/resource/mapData/m1';
var svnMapPath = Global.svnPath + '/client/mapdata';
var svnMapM0OutPath = svnMapPath + '/out';
var svnMapM1OutPath = svnMapPath + '/xinshoumapOut';
var svnMapEmptyM1OutPath = svnMapPath + '/xinshouEmptyData';

var _checkBoxData = ["m0", "m1"];
export function getCheckBoxData() { return _checkBoxData; }
export function setCheckBoxData(value) { _checkBoxData = value; }

var _checkBoxValues = ["m0", "m1"];
export function getCheckBoxValues() { return _checkBoxValues; }
export function setCheckBoxValues(value) { _checkBoxValues = value; }

export async function updateSvn() {
    await spawnExc.svnUpdate(svnMapPath, '更新svn文件成功', '更新svn文件错误');
}

export async function executeBatFile() {
    try {
        for (const iterator of _checkBoxData) {
            switch (iterator) {
                case 'm0':
                    await spawnExc.runSpawn(m0Bat, [], svnMapPath, null, '执行m0bat错误');
                    break;
                case 'm1':
                    await spawnExc.runSpawn(m1Bat, [], svnMapPath, null, '执行m1bat错误');
                    break;
            }
        }
        Global.toast('执行bat文件成功');
    } catch (error) {
        Global.snack('执行bat文件错误', error);
    }
}

export async function clearMapData() {
    try {
        for (const iterator of _checkBoxData) {
            switch (iterator) {
                case 'm0':
                    await fsExc.delFiles(projMapM0Path);
                    break;
                case 'm1':
                    await fsExc.delFiles(projMapM1Path);
                    break;
            }
        }

        Global.toast('清空地图数据成功');
    } catch (error) {
        Global.snack('清空地图数据失败', error);
    }
}

export async function copyMapData() {
    try {
        for (const iterator of _checkBoxData) {
            switch (iterator) {
                case 'm0':
                    await fsExc.makeDir(projMapM0Path);
                    await fsExc.copyFile(svnMapM0OutPath, projMapM0Path);
                    break;
                case 'm1':
                    await fsExc.makeDir(projMapM1Path);
                    await fsExc.copyFile(svnMapM1OutPath, projMapM1Path);
                    await fsExc.copyFile(svnMapEmptyM1OutPath, projMapM1Path);
                    break;
            }
        }

        Global.toast('拷贝地图数据成功');
    } catch (error) {
        Global.snack('拷贝地图数据错误', error);
    }
}

export async function oneForAll() {
    await updateSvn();
    await executeBatFile();
    await clearMapData();
    await copyMapData();
}