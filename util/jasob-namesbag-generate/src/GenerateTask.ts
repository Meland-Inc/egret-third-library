import {
    window,
    commands,
    TextDocument,
    SymbolInformation,
    workspace,
    SymbolKind,
} from "vscode";

import fs = require("fs");
import path = require("path");

export enum eTaskType {
    class = 1,
    method = 2,
    property = 4,
}

export class GenerateTask {
    private static readonly KEY_WORD_DECLARE: string = "declare";//声明的符号排除掉
    private static readonly KEY_WORD_EXTENDS: string = "extends";

    private static readonly OUT_FILE_PATH = "jasobNamesbag\\jasobNamesbag.jsbb";
    private static readonly EXTENSION_TS = ".ts";
    private static readonly EXCLUDE_EXTENSION = ".d.ts";//在找符号的时候需要排除申明文件 库中不排除

    private scriptDirPath = "src";
    //排除的符号
    private excludeSymbolList: string[] = ["info", "log", "group", "groupEnd", "warn", "error", "trace", "chunks", "BaseTab", "getResource"];
    //找文件会排除文件夹中文件 给相对路径 包括第三方库
    private excludeDirList: string[] = ["libs", "mixLibs", "src\\csv", "src\\module\\codeBlock"];//, "src\\module\\codeBlock\\core"
    //排除文件 直接给文件名
    private excludeFiles: string[] = ["AssetAdapter.ts", "LoadingUI.ts", "Main.ts", "Platform.ts", "ThemeAdapter.ts", "HttpMgr.ts", "pbmessage.d.ts"];

    //排除符号 包括直接继承这些的子类符号 游戏用到了反射
    private excludeChildClass: string[] = ["GuiAlert", "GuiComponent", "GuiError", "GuiLayer", "GuiLoader", "GuiModal", "GuiObject"
        , "GuiSubLayer", "GuiToast", "GuiToolTip", "GuiWindow"];
    private egretEuiSkinDir: string = "";//"resource\\skins";//白鹭中的EUI皮肤  用到了反射 去掉skin为类文件
    private egretEuiChildClass: string = "eui.";//白鹭Eui中子类符号都要排除
    private excludeKeyWordSymbols: string[] = ["generateCodeblock"];//需要排除带有关键字的符号

    private _needSymbolKindList: SymbolKind[];
    private _curTaskType: number = 0;

    public constructor(taskType: number) {
        this._curTaskType = taskType;

        this._needSymbolKindList = [];
        if ((this._curTaskType & eTaskType.class) != 0) {
            this._needSymbolKindList.push(SymbolKind.Class);//类名现在风险太大 主要集中在GUI上面
            this._needSymbolKindList.push(SymbolKind.Interface);
            this._needSymbolKindList.push(SymbolKind.Enum);
            this._needSymbolKindList.push(SymbolKind.Variable);
        }
        if ((this._curTaskType & eTaskType.method) != 0) {
            this._needSymbolKindList.push(SymbolKind.Method);
            this._needSymbolKindList.push(SymbolKind.Property);
            this._needSymbolKindList.push(SymbolKind.Field);
        }
    }

    //组织需要排除的符号 会产生所有排除的符号 和 产生新的排除文件名数组this.excludeFiles
    private async processExcludeFiles(rootPath: string) {
        if (!this.excludeSymbolList) {
            this.excludeSymbolList = [];
        }

        let allFilePath: string[] = [];//要排除的所有文件 绝对路径 都是ts文件

        //排除目录
        for (let dir of this.excludeDirList) {
            let files = this.getAllFiles(path.join(rootPath, dir));
            allFilePath = allFilePath.concat(files);
        }

        //排除EUI skin类
        let skins = this.getAllFiles(path.join(rootPath, this.egretEuiSkinDir));
        let skinClassName: string[] = [];
        for (let skin of skins) {
            if (path.extname(skin) == ".exml") {
                let baseName = path.basename(skin);
                let className = baseName.substring(0, baseName.length - "skin.exml".length) + GenerateTask.EXTENSION_TS;//去掉名字后面的skin.exml
                skinClassName.push(className);
            }
        }

        let excludeFiles = this.excludeFiles.concat(skinClassName);
        //在源码目录下找到需要排除的文件 绝对路径
        let scrAllFiles = this.getAllFiles(path.join(rootPath, this.scriptDirPath));
        for (let file of scrAllFiles) {
            let baseName = path.basename(file);
            if (this.includeString(excludeFiles, baseName)) {
                allFilePath.push(file);
            }
        }

        //只排查ts文件目标文件
        let targetFilePaths: string[] = [];
        for (let file of allFilePath) {
            if (path.extname(file) == GenerateTask.EXTENSION_TS) {
                targetFilePaths.push(file);
            }
        }

        this.excludeFiles = [];//重新填满所有排除文件名 便于后面不再需要提取符号

        for (let filePath of targetFilePaths) {
            this.excludeFiles.push(path.basename(filePath));

            let dc: TextDocument = await workspace.openTextDocument(filePath);
            if (!dc) {
                window.showErrorMessage(`file is not textDocument path=${filePath}`);
                continue;
            }

            //获取文档所有符号
            let docSymbols: SymbolInformation[] | undefined = await this.getDocumentSymbolInfos(dc);
            if (!docSymbols) {
                continue;
            }

            let allSymbols: SymbolInformation[] = [];
            this.getAllSymbolInfoRecursion(docSymbols, allSymbols);

            //去重
            for (let s of allSymbols) {
                if (!this.includeString(this.excludeSymbolList, s.name)) {
                    this.excludeSymbolList.push(s.name);
                }
            }
        }
    }

    public async startTask() {
        let folders = workspace.workspaceFolders;
        if (!folders) {
            window.showErrorMessage(`not find workspace folder`);
            return;
        }

        if (folders.length !== 1) {
            window.showErrorMessage(`workspace folder count=${folders.length}`);
            return;
        }

        let workspaceRootDir = folders[0].uri.fsPath;

        let srcDirRoot = path.join(workspaceRootDir, this.scriptDirPath);
        if (!fs.existsSync(srcDirRoot)) {
            window.showErrorMessage(`root directory not find=${srcDirRoot}`);
            return;
        }

        //处理排除文件中的符号 添加到排除符号组中 产生新的排除文件名数组
        await this.processExcludeFiles(workspaceRootDir).catch((e) => {
            window.showErrorMessage(`处理库文件出错，请重新打开工程重试`);
        });

        let resultSymbols: string[] = [];
        let allFilePath: string[] = this.getProcessedFiles(srcDirRoot);

        for (let filePath of allFilePath) {
            let dc: TextDocument = await workspace.openTextDocument(filePath);
            if (!dc) {
                window.showErrorMessage(`file is not textDocument path=${filePath}`);
                continue;
            }

            //获取文档所有符号
            let docSymbols: SymbolInformation[] | undefined = await this.getDocumentSymbolInfos(dc);
            if (!docSymbols) {
                continue;
            }

            let allSymbols: SymbolInformation[] = [];
            this.getAllSymbolInfoRecursion(docSymbols, allSymbols);

            //获取任务过滤后的符号
            let taskSymbols = this.getTaskProcessedSymbolInfos(allSymbols, dc);
            for (let s of taskSymbols) {
                resultSymbols.push(s.name);
            }
        }

        //统一排除掉符号
        let oldResultSymbols = resultSymbols;
        resultSymbols = [];
        for (let s of oldResultSymbols) {
            if (this.includeString(this.excludeSymbolList, s)) {
                continue;
            }

            if (this.excludeKeyWordSymbols.findIndex(o => { return s.includes(o) }) >= 0) {
                continue;
            }

            resultSymbols.push(s);
        }

        //去重 排序
        resultSymbols = this.getOrganizedSymbols(resultSymbols);

        this.saveFile(resultSymbols, path.join(workspaceRootDir, GenerateTask.OUT_FILE_PATH));

        window.showInformationMessage(`generate jasob namesbag finish!, symbol num=${resultSymbols.length}, find file num=${allFilePath.length}`);
    }

    /**递归拿到里面所有符号 因为新版的vscode改了结构 */
    private getAllSymbolInfoRecursion(docSymbols: SymbolInformation[], resultList: SymbolInformation[]) {
        if (!resultList) {
            resultList = [];
        }

        if (!docSymbols || docSymbols.length === 0) {
            return;
        }

        for (let symbol of docSymbols) {
            resultList.push(symbol);

            //新版vscode加入了这个层级 兼容一下 但是api SymbolInformation没有更新
            if ("children" in symbol) {
                this.getAllSymbolInfoRecursion((<any>symbol)["children"], resultList);
            }
        }
    }

    //按照jasob namesbag规则生成保存文件
    private saveFile(symbols: string[], fsPath: string): boolean {
        if (!symbols || symbols.length === 0) {
            return false;
        }

        let dir = path.dirname(fsPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        let itemDes: string = "";
        for (let i = 0; i < symbols.length; i++) {
            if (i !== 0) {
                itemDes += "\n";
            }
            itemDes += `\t<item marked="true" name="${symbols[i]}" newName="" markedInStrings="true"/>`;
        }

        let textFileContent: string = `<?xml version="1.0" encoding="utf-8"?>
<namesBag comments="">
${itemDes}
</namesBag>`;

        try {
            fs.writeFileSync(fsPath, textFileContent);
        }
        catch (e) {
            window.showErrorMessage(`save jasob file error = ${e}`);
            return false;
        }

        window.showInformationMessage(`save jasob file to ${fsPath}`);
        return true;
    }

    //获取处理过的 后缀筛查
    private getProcessedFiles(dirFsPath: string): string[] {
        let resultList: string[] = [];

        let allFiles: string[] = this.getAllFiles(dirFsPath);
        for (let file of allFiles) {
            if (path.extname(file) !== GenerateTask.EXTENSION_TS) {
                continue;
            }

            //需要排除后缀的
            let fileName = path.basename(file);
            if (fileName.includes(GenerateTask.EXCLUDE_EXTENSION)) {
                window.showInformationMessage(`find possible library file =${fileName}`);
                continue;
            }

            //排除文件
            if (this.includeString(this.excludeFiles, fileName)) {
                continue;
            }

            resultList.push(file);
        }

        return resultList;
    }

    //获取某个文件夹下的所有文件 绝对路径
    private getAllFiles(dirFsPath: string): string[] {
        if (!fs.existsSync(dirFsPath)) {
            window.showErrorMessage(`not find dir =${dirFsPath}`);
            return [];
        }

        let status = fs.statSync(dirFsPath);
        if (!status.isDirectory()) {
            window.showErrorMessage(`is not a dir =${dirFsPath}`);
            return [];
        }

        let files: string[] = [];
        this.getDirFiles(dirFsPath, files);
        return files;
    }

    //递归获取某个文件夹下所有文件
    private getDirFiles(dirFsPath: string, outFiles: string[]) {
        if (!outFiles) {
            outFiles = [];
        }

        if (!fs.existsSync(dirFsPath)) {
            return;
        }

        if (!fs.statSync(dirFsPath).isDirectory()) {
            return;
        }

        let files = fs.readdirSync(dirFsPath);
        if (!files || files.length === 0) {
            return;
        }

        for (let file of files) {
            let childDir = path.join(dirFsPath, file);
            let state = fs.statSync(childDir);
            if (state.isDirectory()) {
                this.getDirFiles(childDir, outFiles);
            }
            else if (state.isFile()) {
                outFiles.push(childDir);
            }
        }
    }

    //组织符号 去重 排序
    private getOrganizedSymbols(symbols: string[]): string[] {
        if (!symbols || symbols.length === 0) {
            return [];
        }

        //去重
        let resultList: string[] = [];
        for (let s of symbols) {
            if (resultList.findIndex((o) => { return o == s }) >= 0) {
                continue;
            }
            resultList.push(s);
        }

        //按照字符串排序
        resultList.sort((a, b) => { return a.localeCompare(b); })

        return resultList;
    }

    //获取当前任务类型需要的符号
    private getTaskProcessedSymbolInfos(symbols: SymbolInformation[], dc: TextDocument): SymbolInformation[] {
        let resultList: SymbolInformation[] = [];
        for (let symbol of symbols) {
            //不需要
            if (this._needSymbolKindList.findIndex(o => { return o == symbol.kind }) < 0) {
                this.excludeSymbolList.push(symbol.name);
                continue;
            }

            //去掉declare的
            let line = dc.lineAt(symbol.location.range.start.line);
            if (line.text.includes(GenerateTask.KEY_WORD_DECLARE)) {
                this.excludeSymbolList.push(symbol.name);
                continue;
            }

            //排除get set
            if (line.text.includes(" get ") || line.text.includes(" set ")) {
                if (!this.includeString(this.excludeSymbolList, symbol.name)) {
                    this.excludeSymbolList.push(symbol.name);
                }
                continue;
            }

            //如果是特定类和子类都排除掉 针对反射
            if (this.includeString(this.excludeChildClass, symbol.name)) {
                this.excludeSymbolList.push(symbol.name);
                continue;
            }
            if (line.text.includes(GenerateTask.KEY_WORD_EXTENDS)) {
                //找到特定继承某些类之后 所有当前文档符号加入排除列表
                if (line.text.includes(this.egretEuiChildClass)) {
                    for (let symbol of symbols) {
                        this.excludeSymbolList.push(symbol.name);
                    }
                    return [];
                }

                if (this.excludeChildClass.findIndex(o => { return line.text.includes(o) }) >= 0) {
                    this.excludeSymbolList.push(symbol.name);
                    continue;
                }
            }

            resultList.push(symbol);
        }

        return resultList;
    }

    //文档所有符号
    private getDocumentSymbolInfos(document: TextDocument): Thenable<SymbolInformation[] | undefined> {
        return commands.executeCommand<SymbolInformation[]>(
            "vscode.executeDocumentSymbolProvider",
            document.uri
        );
    }

    private includeString(list: string[], target: string): boolean {
        if (!list || list.length == 0) {
            return false;
        }
        if (list.findIndex(o => { return o == target }) >= 0) {
            return true;
        }

        return false;
    }
}