import * as spawnExc from "./SpawnExecute.js";
import * as fsExc from "./FsExecute.js";
import { Global } from "./Global.js";

export async function gitPull() {
    await spawnExc.gitPull(Global.protoPath, '更新git文件成功', '更新git文件错误');
}

export async function composeProto() {
    let pa = await fsExc.readDir(Global.pbMessagePath);
    let content = "";
    content += "syntax = 'proto3';\r\n";
    content += "package Bian;\r\n";
    for (let i = 0; i < pa.length; i++) {
        const element = pa[i];
        if (element.indexOf(".proto") != -1) {
            let eleContent = await fsExc.readFile(Global.pbMessagePath + "/" + element);

            eleContent = eleContent
                .split("\n")
                .filter(i => {
                    return i.indexOf("import") !== 0;
                })
                .join("\n");

            eleContent = eleContent.replace("syntax = 'proto3';", "");
            eleContent = eleContent.replace('syntax = "proto3";', "");
            eleContent = eleContent.replace("package Bian;", "");

            eleContent = eleContent.replace("option go_package Bian;", "");
            content += "// ----- from " + element + " ---- \n";
            content += eleContent + "\n";
        }
    }

    try {
        let projectProtoPath = Global.projPath + "/resource/assets/proto/pbmessage.proto";
        await fsExc.writeFile(projectProtoPath, content);
        Global.toast('合成proto文件成功');
    } catch (error) {
        Global.snack('合成proto文件错误', error);
    }
}

export async function createJs() {
    let cmdStr = "pbjs -t static-module -w commonjs -o "
        + Global.pbMessagePath
        + "/pbmessage.js "
        + Global.projPath
        + "/resource/assets/proto/pbmessage.proto";
    await spawnExc.runCmd(cmdStr, null, '生成js文件成功', '生成js文件错误');
}

export async function createTs() {
    let cmdStr = "pbts -o "
        + Global.projPath
        + "/src/protocol/pbmessage.d.ts "
        + Global.pbMessagePath
        + "/pbmessage.js";
    await spawnExc.runCmd(cmdStr, null, '生成ts文件成功', '生成ts文件错误');
}

export async function modifyTs() {
    let msgPath = Global.projPath + "/src/protocol/pbmessage.d.ts";
    let content = await fsExc.readFile(msgPath);
    content = content.replace(
        'import * as $protobuf from "protobufjs";',
        ""
    );
    content = content.replace(
        "export namespace Bian {",
        "declare namespace Bian {"
    );
    if (content.indexOf("declare class Long") == -1) {
        content +=
            "declare class Long {\n" +
            "\tlow: number;\n" +
            "\thigh: number;\n" +
            "\tunsigned: boolean;\n" +
            "\ttoNumber();\n" +
            "\tstatic fromNumber(value);\n" +
            "\tequals(other): any;\n" +
            "}\n";
    }

    try {
        await fsExc.writeFile(msgPath, content);
        Global.toast('修改ts文件成功');
    } catch (error) {
        Global.toast('修改ts文件错误', error);
    }
}

export async function oneForAll() {
    await gitPull();
    await composeProto();
    await createJs();
    await createTs();
    await modifyTs();
}