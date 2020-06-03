import { Global } from "./Global.js";
import * as spawnExc from "./SpawnExecute.js";
import * as fsExc from "./FsExecute.js";
import * as tableExc from "./TableExecute";

import * as archiver from "archiver";
import * as fs from "fs";
import { removeSpaces, replace, toStudlyCaps } from "strman";
import * as iconv from "iconv-lite";
import { ModelMgr } from "./model/ModelMgr.js";

export async function updateSvn() {
    await spawnExc.svnUpdate(Global.svnCsvPath, "", "更新csv文件错误");
    await spawnExc.svnUpdate(Global.svnUITextPath, "更新svn文件成功", "更新UIText文件错误");

}

export function zipCsv() {
    return new Promise(async (resolve, reject) => {
        let pa = await fsExc.readDir(Global.svnCsvPath);
        let archive = archiver("zip");
        let fileName = "csv.bin";
        let filePath = Global.projPath + "/resource/assets/csv/";
        let csvZipFile = fs.createWriteStream(filePath + fileName);
        archive.pipe(csvZipFile);

        for (let i = 0; i < pa.length; i++) {
            const element = pa[i];
            if (element.indexOf(".csv") != -1) {
                let csvContent = await tableExc.readCsvContent(Global.svnCsvPath + "/" + element);
                if (element === ModelMgr.languageModel.languageTableName) {
                    let languagePath = `${Global.projPath}/resource/assets/loading/Language.bin`;
                    let languageZipFile = fs.createWriteStream(languagePath);
                    let languageArchive = archiver("zip");
                    languageArchive.pipe(languageZipFile);
                    languageArchive.append(csvContent, {
                        name: element
                    });

                    languageZipFile.on("error", error => {
                        Global.snack('压缩Language.bin文件错误', error);
                        reject();
                    });
                    languageZipFile.on("close", () => {
                        console.log("压缩Language.bin文件成功");
                    });
                    languageArchive.finalize();
                    continue;
                }
                archive.append(csvContent, {
                    name: element
                });
            }
        }

        /**鲸幂配置表压缩 */
        if (ModelMgr.jimmyModel) {
            try {
                await ModelMgr.jimmyModel.processJimmyCSV();
            } catch (error) {
                reject();
            }
        }

        csvZipFile.on("error", error => {
            Global.snack('压缩zip文件错误', error);
            reject();
        });
        csvZipFile.on("close", () => {
            Global.toast('压缩zip文件成功');
            resolve();
        });
        archive.finalize();
    })
}

/** arrayBuffer 转换为utf8 */
function arrayBuff2utf8(buf, encoding = "gbk") {
    return new Promise((resolve, reject) => {
        let bb = new Blob([buf]);
        let f = new FileReader();
        f.onload = (evt) => {
            // callback(args, evt.target["result"])
            resolve(evt.target["result"]);
        }
        f.readAsText(bb, encoding);
    });
}

export async function createTs() {
    let pa = await fsExc.readDir(Global.svnCsvPath);

    for (let i = 0; i < pa.length; i++) {
        const element = pa[i];
        if (element.indexOf(".csv") != -1) {
            let data = await fsExc.readFile(Global.svnCsvPath + "/" + element, null);

            let buffer = new Buffer(data, "gbk");
            data = iconv.decode(buffer, "gbk");
            if (!data) {
                let error = name + "表数据为空";
                alert(error);
                throw error;
            }
            let clsName = toStudlyCaps(element.split(".csv")[0]);
            let cellContent = createCell(clsName, data);
            try {
                await fsExc.writeFile(Global.projPath + "/src/csv/cell/" + clsName + "Cell.ts", cellContent);
            } catch (error) {
                Global.snack(`生成${clsName}cell.ts文件错误`, error);
                return;
            }

            let tableContent = createTable(clsName);
            let filePath = Global.projPath + "/src/csv/table/" + clsName + "Table.ts";
            if (await fs.existsSync(filePath)) {
                //已存在，不创建
                continue;
            }

            try {
                await fsExc.writeFile(filePath, tableContent)
            } catch (error) {
                Global.snack(`生成${clsName}Table.ts文件错误`, error)
                return;
            }
        }
    }

    Global.toast('生成ts文件成功');
}

export async function copyUIText() {
    return new Promise(async (resolve, reject) => {
        let UILanguageName = "UILanguage.xml";
        let UILanguageContent = await fsExc.readFile(`${Global.svnUITextPath}/${UILanguageName}`);
        let UILanguagePath = `${Global.projPath}/resource/assets/loading/UILanguage.bin`;
        let UILanguageZipFile = fs.createWriteStream(UILanguagePath);
        let UILanguageArchive = archiver("zip");
        UILanguageArchive.pipe(UILanguageZipFile);
        UILanguageArchive.append(UILanguageContent, {
            name: UILanguageName
        });

        UILanguageZipFile.on("error", error => {
            Global.snack('压缩UILanguage.bin文件错误', error);
            reject();
        });
        UILanguageZipFile.on("close", () => {
            console.log("压缩UILanguage.bin文件成功");
            resolve();
        });
        UILanguageArchive.finalize();
    })

    // fsExc.copyFile(Global.svnUITextPath, Global.projPath + "/resource/assets/loading/")
}

export async function oneForAll() {
    await updateSvn();
    await zipCsv();
    await createTs();
}

function createTable(name) {
    let content = `
/**
 * @author 雪糕"
 * @desc ${name}表
 *
 */
class ${name}Table {
    private _cells: ${name}Cell[];

    //单例-----------
    private static _instance: ${name}Table;
    public static get instance(): ${name}Table {
        if (!this._instance) {
            this._instance = new ${name}Table();
        }
        return this._instance;
    }
        
    /** 解析数据 */
    public analysis(data: ${name}Cell[]): void {
        this._cells = data;
    }
    
    public getCellById(id: number): ${name}Cell {
        const cell = this.tryCellById(id);
        if (!cell) {
            Logger.error(LOG_TAG.Config, '${name}Table id: ' + id + ' is null');
        }
        return cell;
    }
    
    public tryCellById(id: number): ${name}Cell {
        for (let i: number = 0; i < this._cells.length; i++) {
            const cell: ${name}Cell = this._cells[i];
            if (cell.id === id) {
                return cell;
            }
        }
        return null;
    }
}`
    return content;
}

function createCell(name, data) {
    data = data.toString();

    let preContent = `
/**
 * @author 雪糕
 * @desc ${name} 表结构体
 *
 */
class ${name}Cell {`

    let funcContent = `

    public static is(tData: unknown): boolean {
        const data = tData as Record<string, unknown>;
        if (!data) {
            return false;
        }
        if (`

    let endContent = `
}`;
    let centerContent = "";
    let rows = data.split("\r\n");
    if (rows.length < 3) {
        let content = name + "表数据格式错误";
        alert(content);
        throw content;
    }
    let descs = rows[0].split(",");
    let attrs = rows[1].split(",");
    let types = rows[2].split(",");
    if (
        !descs ||
        descs.length == 0 ||
        !attrs ||
        attrs.length == 0 ||
        !types ||
        types.length == 0
    ) {
        let content = name + "表数据格式错误";
        alert(content);
        throw content;
    }


    for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        if (attr === "") {
            continue;
        }

        let desc = descs[i] ? descs[i] : "";
        let type = "";
        if (types[i]) {
            switch (types[i]) {
                case "int":
                case "float":
                    type = "number";
                    break;
                case "string":
                    type = "string";
                    break;
                case "bool":
                    type = "boolean";
                    break;

                case "int[]":
                case "float[]":
                    type = "number[]";
                    break;
                case "int[][]":
                case "float[][]":
                    type = "number[][]";
                    break;
                case "string[]":
                    type = "string[]";
                    break;
                case "string[][]":
                    type = "string[][]";
                    break;
                case "bool[]":
                    type = "boolean[]";
                    break;
                case "bool[][]":
                    type = "boolean[][]";
                    break;
                case "null":
                    type = "unknown";
                    break;

                default:
                    let content = `${name} 表里有未知类型:${types[i]} -- 字段名: ${descs[i]}`;
                    alert(content);
                    throw content;
            }
        } else {
            type = "unknown";
        }

        if (attr != "null") {
            centerContent += `
    /** ${desc} */`;
            centerContent += `
    public ${attr}: ${type};`;

            if (i == 0) {
                funcContent += `data.hasOwnProperty("${attr}")`
            } else {
                funcContent += `
            && data.hasOwnProperty("${attr}")`
            }
        }
    }

    funcContent += `
        ) {
            return true;
        }
        return false;
    }`

    let content = preContent + centerContent + funcContent + endContent;
    return content;
}