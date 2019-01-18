import { Global } from "./Global.js";
import * as spawnExc from "./SpawnExecute.js";
import * as fsExc from "./FsExecute.js";

import * as archiver from "archiver";
import * as fs from "fs";
import { removeSpaces, replace, toStudlyCaps } from "strman";
import * as iconv from "iconv-lite";

export async function updateSvn() {
    await spawnExc.svnUpdate(Global.svnCsvPath, "更新svn文件成功", "更新svn文件错误");
}

export function zipCsv() {
    return new Promise(async (resolve, reject) => {
        let pa = await fsExc.readDir(Global.svnCsvPath);
        let archive = archiver("zip");
        let fileName = "csv.zip";
        let filePath = Global.projPath + "/resource/assets/csv/";
        let output = fs.createWriteStream(filePath + fileName);
        archive.pipe(output);

        for (let i = 0; i < pa.length; i++) {
            const element = pa[i];
            if (element.indexOf(".csv") != -1) {
                archive.append(fs.createReadStream(Global.svnCsvPath + "/" + element), {
                    name: element
                });
            }
        }

        archive.on("error", error => {
            Global.snack('压缩zip文件错误', error);
            reject();
        });
        output.on("close", () => {
            Global.toast('压缩zip文件成功');
            resolve();
        });
        archive.finalize();
    })
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

export async function oneForAll() {
    await updateSvn();
    await zipCsv();
    await createTs();
}

function createTable(name) {
    let content =
        "/**\r\n" +
        " * @author 雪糕\r\n" +
        " * @desc " +
        name +
        "表\r\n" +
        " *\r\n" +
        " */\r\n" +
        "class " +
        name +
        "Table {\r\n" +
        "	private _cells: " +
        name +
        "Cell[];\r\n" +
        "\r\n" +
        "	//单例-----------\r\n" +
        "	private static _instance: " +
        name +
        "Table;\r\n" +
        "	public static get instance(): " +
        name +
        "Table {\r\n" +
        "		if (!this._instance) {\r\n" +
        "			this._instance = new " +
        name +
        "Table();\r\n" +
        "		}\r\n" +
        "		return this._instance;\r\n" +
        "	}\r\n" +
        "\r\n" +
        "	public constructor() {\r\n" +
        "	}\r\n" +
        "\r\n" +
        "	/** 解析数据 */\r\n" +
        "	public analysis(data: any[]): void {\r\n" +
        "		this._cells = data;\r\n" +
        "	}\r\n" +
        "\r\n" +
        "\tpublic getCellById(id: number): " +
        name +
        "Cell {\r\n" +
        "\t\tlet cell = this.tryCellById(id);\r\n" +
        "\t\tif (!cell) {\r\n" +
        "\t\t\tLogger.error(LOG_TAG.Config, '" +
        name +
        "Table id: ' + id + ' is null');\r\n" +
        "\t\t}\r\n" +
        "\t\treturn cell;\r\n" +
        "\t}\r\n" +
        "\r\n" +
        "\tpublic tryCellById(id: number): " +
        name +
        "Cell {\r\n" +
        "\t\tfor (let i: number = 0; i < this._cells.length; i++) {\r\n" +
        "\t\t\tlet cell: " +
        name +
        "Cell = this._cells[i];\r\n" +
        "\t\t\tif (cell.id === id) {\r\n" +
        "\t\t\t\treturn cell;\r\n" +
        "\t\t\t}\r\n" +
        "\t\t}\r\n" +
        "\t\treturn null;\r\n" +
        "\t}\r\n" +
        "}\r\n";
    return content;
}

function createCell(name, data) {
    data = data.toString();

    let preContent =
        "/**\r\n" +
        " * @author 雪糕\r\n" +
        " * @desc " +
        name +
        "表结构体\r\n" +
        " *\r\n" +
        " */\r\n" +
        "class " +
        name +
        "Cell {\r\n";
    let endContent = "\tpublic constructor() {\r\n" + "\t}\r\n" + "}";
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
        if (attrs[i] === "") {
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
                    type = "any";
                    break;

                default:
                    let content = `${name} 表里有未知类型:${types[i]} -- 字段名: ${descs[i]}`;
                    alert(content);
                    throw content;
                    return;
                    type = "any";
                    break;
            }
        } else {
            type = "any";
        }

        if (attrs[i] != "null") {
            centerContent += "\t/** " + desc + " */\r\n";
            centerContent += "\tpublic " + attrs[i] + ": " + type + ";\r\n";
        }
    }

    let content = preContent + centerContent + endContent;
    return content;
}