exports.init = function (mainWindow) {
    const ipcMain = require('electron').ipcMain;
    const dialog = require('electron').dialog;
    const fs = require('fs');

    const removeSpaces = require('strman').removeSpaces;
    const replace = require('strman').replace;
    const substr = require('strman').substr;
    const toStudlyCaps = require('strman').toStudlyCaps;
    const toCamelCase = require('strman').toCamelCase;
    const leftTrim = require('strman').leftTrim;
    const rightTrim = require('strman').rightTrim;
    const trim = require('strman').trim;
    const toLowerCase = require('strman').toLowerCase;

    let win2ctrl = "/assets/script/game/constant/Win2CtrlConst.ts";

    // 对Date的扩展，将 Date 转化为指定格式的String   
    // 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，   
    // 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)   
    // 例子：   
    // (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423   
    // (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18   
    function dateFormat(date, fmt) { //author: meizz   
        let o = {
            "M+": date.getMonth() + 1,                 //月份   
            "d+": date.getDate(),                    //日   
            "h+": date.getHours(),                   //小时   
            "m+": date.getMinutes(),                 //分   
            "s+": date.getSeconds(),                 //秒   
            "q+": Math.floor((date.getMonth() + 3) / 3), //季度   
            "S": date.getMilliseconds()             //毫秒   
        };
        if (/(y+)/.test(fmt))
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (let k in o)
            if (new RegExp("(" + k + ")").test(fmt))
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }

    ipcMain.on('open_client_project_path', function (event) {
        dialog.showOpenDialog({
            properties: ['openFile', 'openDirectory']
        }, function (files) {
            if (files) {
                event.sender.send('selected_client_project_path', files);
            }
        })
    })

    ipcMain.on('open_client_proto_path', function (event) {
        dialog.showOpenDialog({
            properties: ['openFile', 'openDirectory']
        }, function (files) {
            event.sender.send('selected_client_proto_path', files);
        })
    })

    ipcMain.on('open_client_csv_path', function (event) {
        dialog.showOpenDialog({
            properties: ['openFile', 'openDirectory']
        }, function (files) {
            event.sender.send('selected_client_csv_path', files);
        })
    })

    ipcMain.on('open_client_texture_path', function (event) {
        dialog.showOpenDialog({
            properties: ['openFile', 'openDirectory']
        }, function (files) {
            event.sender.send('selected_client_texture_path', files);
        })
    })

    ipcMain.on('open_client_modify_edition_path', function (event) {
        dialog.showOpenDialog({
            properties: ['openFile']
        }, function (files) {
            event.sender.send('selected_client_modify_edition_path', files);
        })
    })

    ipcMain.on('open_client_compile_code_path', function (event) {
        dialog.showOpenDialog({
            properties: ['openFile']
        }, function (files) {
            event.sender.send('selected_client_compile_code_path', files);
        })
    })

    ipcMain.on('open_client_generate_eidtion_path', function (event) {
        dialog.showOpenDialog({
            properties: ['openFile']
        }, function (files) {
            event.sender.send('selected_client_generate_eidtion_path', files);
        })
    })

    ipcMain.on('open_client_remote_assets_path', function (event) {
        dialog.showOpenDialog({
            properties: ['openFile', 'openDirectory']
        }, function (files) {
            event.sender.send('selected_client_remote_assets_path', files);
        })
    })

    ipcMain.on('client_init', function (event) {
        if (global.sharedObject.client_modules.length != 0) {
            return;
        }
        if (!global.sharedObject.client_project_path) {
            return;
        }
        // refreshModules(event, 1);
    }.bind(this))

    ipcMain.on('client_module_refresh', function (event) {
        if (!global.sharedObject.client_project_path) {
            return
        }
        refreshModules(event, 2);
    }.bind(this))

    ipcMain.on('client_proto_refresh', function (event) {
        if (!global.sharedObject.client_proto_path) {
            return;
        }
        refreshProtos(event);
    }.bind(this))

    ipcMain.on('client_create_module', function (event, module_name, module_cn_name, create_screen) {
        createModule(event, module_name, module_cn_name, create_screen);
    }.bind(this));

    ipcMain.on('client_create_window', function (event, window_name, window_cn_name, window_module_name) {
        createWindow(event, window_name, window_cn_name, window_module_name);
    }.bind(this));

    ipcMain.on('client_show_message', function (event, msg) {
        mainWindow.webContents.send("client_show_message", msg);
    }.bind(this));

    ipcMain.on('client_show_snack', function (event, msg) {
        mainWindow.webContents.send("client_show_snack", msg);
    }.bind(this));

    ipcMain.on('client_select_proto_file', function (event, file_name) {
        selectProtoFile(event, file_name);
    }.bind(this));

    ipcMain.on('client_setting_proto', function (event, game_module_name, proto_module_name, proto_cmd_class, proto_objs) {
        settingProto(event, game_module_name, proto_module_name, proto_cmd_class, proto_objs);
    }.bind(this));

    ipcMain.on('client_create_proto_javascript', function (event) {
        createProtoJavascriptNew(event);
    }.bind(this));


    ipcMain.on('client_refresh_proto', function (event) {
        refreshProtos(event);
    }.bind(this));

    function refreshModules(event, type) {
        switch (type) {
            case 1:
                break;
            case 2:
                global.sharedObject.client_modules = [];
                break;
            default:
                break;
        }

        fs.readFile(global.sharedObject.client_project_path + win2ctrl, 'utf8', function (err, data) {
            let datas = data.split("=");
            let datastr = replace(replace(removeSpaces(datas[1]), "\r", ""), "\n", "");
            datastr = rightTrim(datastr);
            datastr = substr(datastr, 1, datastr.length - 5);
            let modules = global.sharedObject.modules = datastr.split("},");
            for (let i = 0; i < modules.length; i++) {
                let module = {};

                let moduleStruct = substr(modules[i], 1, modules[i].length);
                let moduleStructArr = moduleStruct.split("ctrl:");
                let moduleName = moduleStructArr[0].split(",")[0].split(".")[1];
                moduleStructArr = moduleStructArr[1].split("wins:");
                let ctrlName = moduleStructArr[0].split(",")[0].split(".")[1];

                module.moduleName = moduleName;
                module.ctrlName = ctrlName;
                module.windows = [];

                let windowStruct = moduleStructArr[1];
                windowStruct = substr(windowStruct, 1, windowStruct.length - 2);
                let windows = windowStruct.split(",");

                for (let m = 0; m < windows.length; m++) {
                    module.windows.push(windows[m]);
                }

                global.sharedObject.client_modules.push(module);
            }

            switch (type) {
                case 1:
                    event.sender.send('client_init_complete', global.sharedObject.client_modules);
                    if (!global.sharedObject.client_proto_path) {
                        return;
                    }
                    refreshProtos(event);
                    break;
                case 2:
                    event.sender.send('client_module_refresh_complete', global.sharedObject.client_modules);
                    break;
                default:
                    break;
            }
        });
    }

    function createModule(event, module_name, module_cn_name, create_screen) {
        module_name = toCamelCase(module_name);

        let module_path = global.sharedObject.client_project_path + "/assets/script/game/module/" + module_name;
        let exists = fs.existsSync(module_path);
        if (exists) {
            let msg = "模块" + module_name + "路径已存在";
            mainWindow.webContents.send("client_show_message", msg);
            return;
        }

        fs.mkdirSync(global.sharedObject.client_project_path + "/assets/script/game/module/" + module_name);
        fs.mkdirSync(global.sharedObject.client_project_path + "/assets/script/game/module/" + module_name + "/controller");
        fs.mkdirSync(global.sharedObject.client_project_path + "/assets/script/game/module/" + module_name + "/model");
        fs.mkdirSync(global.sharedObject.client_project_path + "/assets/script/game/module/" + module_name + "/view");
        fs.mkdirSync(global.sharedObject.client_project_path + "/assets/resources/prefabs/game/" + module_name);

        let author = global.sharedObject.client_author;

        //----------创建屏幕
        if (create_screen) {
            fs.mkdirSync(global.sharedObject.client_project_path + "/assets/script/game/module/" + module_name + "/screen");
            let spath = global.sharedObject.client_project_path + "/assets/script/game/module/" + module_name + "/screen/" + toStudlyCaps(module_name) + "Screen.ts";
            if (fs.exists(spath, function (exists) {
                if (exists) {
                    let msg = toStudlyCaps(module_name) + "Screen.ts" + "已存在";
                    mainWindow.webContents.send("client_show_message", msg);
                } else {
                    let scontent = "const { ccclass, property } = cc._decorator;\r\nimport BScreen from '../../../../framework/mvc/screen/BScreen';\r\nimport { IScreen } from '../../../../framework/mvc/screen/IScreen';\r\nimport WindowConst from '../../../constant/WindowConst';\r\n\r\n/**\r\n * @author " + author + "\r\n * @desc " + module_cn_name + "屏幕\r\n * @date " + dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss") + " \r\n * @last modified by   " + author + " \r\n * @last modified time " + dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss") + " \r\n */\r\n@ccclass\r\nexport default class " + toStudlyCaps(module_name) + "Screen extends BScreen implements IScreen {\r\n\tpublic constructor(screenName: string) {\r\n\t\tsuper(screenName);\r\n\t}\r\n\r\n\tpublic onEnter(args: any): void {\r\n\t\tthis.openWindow(WindowConst." + toStudlyCaps(module_name) + "Window);\r\n\r\n\t\tsuper.onEnter(args);\r\n\t}\r\n}";
                    fs.writeFile(spath, scontent, function (err) {
                        if (!err) {
                            let msg = "创建" + toStudlyCaps(module_name) + "Screen.ts" + "成功";
                            mainWindow.webContents.send("client_add_log", msg);
                        }
                    });
                }
            }));
        }

        //----------创建控制器
        let cpath = global.sharedObject.client_project_path + "/assets/script/game/module/" + module_name + "/controller/" + toStudlyCaps(module_name) + "Controller.ts";
        if (fs.exists(cpath, function (exists) {
            if (exists) {
                let msg = toStudlyCaps(module_name) + "Controller.ts" + "已存在";
                mainWindow.webContents.send("client_show_message", msg);
            } else {
                let ccontent = "import BController from '../../../../framework/mvc/controller/BController';\r\n"
                ccontent += "import CmdDispatchManager from '../../../../freedom/manager/CmdDispatchManager';\r\n";
                ccontent += "import { MsgEnum } from '../../../../freedom/enum/MsgEnum';\r\n";
                ccontent += "import MsgVO from '../../../../framework/vo/MsgVO'\r\n";
                ccontent += "import ProtoManager from '../../../../freedom/manager/ProtoManager';\r\n";
                ccontent += "import ProtoResponse from '../../../../freedom/net/component/ProtoResponse';\r\n"
                ccontent += "import SocketManager from '../../../../freedom/manager/SocketManager';\r\n";
                ccontent += "import StatusCode from '../../../constant/StatusCode';\r\n"
                ccontent += "\r\nconst { ccclass, property } = cc._decorator;\r\n/**\r\n * @author " + author + "\r\n * @desc " + module_cn_name + "控制器\r\n * @date " + dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss") + "\r\n * @last modified by   " + author + " \r\n * @last modified time " + dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss") + "\r\n*/\r\n@ccclass\r\nexport default class " + toStudlyCaps(module_name) + "Controller extends BController {\r\n\tpublic constructor() {\r\n\t\tsuper();\r\n\t}\r\n}";
                fs.writeFile(cpath, ccontent, function (err) {
                    if (!err) {
                        let msg = "创建" + toStudlyCaps(module_name) + "Controller.ts" + "成功";
                        mainWindow.webContents.send("client_add_log", msg);
                    }
                });
            }
        }));

        //----------创建数据模型
        let mpath = global.sharedObject.client_project_path + "/assets/script/game/module/" + module_name + "/model/" + toStudlyCaps(module_name) + "Model.ts";
        if (fs.exists(mpath, function (exists) {
            if (exists) {
                let msg = toStudlyCaps(module_name) + "Model.ts" + "已存在";
                mainWindow.webContents.send("client_show_message", msg);
            } else {
                let mcontent = "import BModel from '../../../../framework/mvc/model/BModel'; \r\n\r\n/**\r\n * @author " + author + "\r\n * @desc " + module_cn_name + " 数据模型\r\n * @date " + dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss") + " \r\n * @last modified by   " + author + "  \r\n * @last modified time " + dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss") + "\r\n */\r\nexport default class " + toStudlyCaps(module_name) + "Model extends BModel {\t\r\n\tpublic constructor() {\t\r\n\t\tsuper();\t\r\n\t}\r\n}";
                fs.writeFile(mpath, mcontent, function (err) {
                    if (!err) {
                        let msg = "创建" + toStudlyCaps(module_name) + "Model.ts" + "成功";
                        mainWindow.webContents.send("client_add_log", msg);
                    }
                });
            }
        }));

        //----------创建窗体
        let wpath = global.sharedObject.client_project_path + "/assets/script/game/module/" + module_name + "/view/" + toStudlyCaps(module_name) + "Window.ts";
        if (fs.exists(wpath, function (exists) {
            if (exists) {
                let msg = toStudlyCaps(module_name) + "Window.ts" + "已存在";
                mainWindow.webContents.send("client_show_message", msg);
            } else {
                let wcontent = "import BWindow from '../../../../framework/mvc/view/BWindow';\r\n\r\nconst { ccclass, property } = cc._decorator;\r\n/**\r\n * @author " + author + " \r\n * @desc " + module_cn_name + " 窗体\r\n * @date " + dateFormat(new Date(), "yyyy-MM - dd hh: mm:ss") + " \r\n * @last modified by   " + author + " \r\n * @last modified time " + dateFormat(new Date(), "yyyy-MM - dd hh: mm:ss") + " \r\n */\r\n@ccclass\r\nexport default class " + toStudlyCaps(module_name) + "Window extends BWindow {\r\n\tpublic constructor() {\r\n\t\tsuper();\r\n\t}\r\n\r\n\tpublic show(data?: any): void {\r\n\t\tsuper.show();\r\n\t}\r\n\r\n\tpublic hide(data?: any): void {\r\n\t\tsuper.hide();\r\n\t}\r\n\r\n\tpublic onDestroy(): void {\r\n\t\tsuper.onDestroy();\r\n\t}\r\n}";
                fs.writeFile(wpath, wcontent, function (err) {
                    if (!err) {
                        let msg = "创建" + toStudlyCaps(module_name) + "Window.ts" + "成功";
                        mainWindow.webContents.send("client_add_log", msg);
                    }
                });
            }
        }));

        //----------创建窗体预置体
        // let vcontent = '[\r\n  {\r\n    "__type__": "cc.Prefab",\r\n    "_name": "",\r\n    "_objFlags": 0,\r\n    "_rawFiles": null,\r\n    "data": {\r\n      "__id__": 1\r\n    }\r\n  },\r\n  {\r\n    "__type__": "cc.Node",\r\n    "_name": "' + toStudlyCaps(module_name) + 'WindowPrefab",\r\n    "_objFlags": 0,\r\n    "_parent": null,\r\n    "_children": [],\r\n    "_tag": -1,\r\n    "_active": true,\r\n    "_components": [],\r\n    "_prefab": {\r\n      "__id__": 2\r\n    },\r\n    "_id": "",\r\n    "_opacity": 255,\r\n    "_color": {\r\n      "__type__": "cc.Color",\r\n      "r": 255,\r\n      "g": 255,\r\n      "b": 255,\r\n      "a": 255\r\n    },\r\n    "_cascadeOpacityEnabled": true,\r\n    "_anchorPoint": {\r\n      "__type__": "cc.Vec2",\r\n      "x": 0.5,\r\n      "y": 0.5\r\n    },\r\n    "_contentSize": {\r\n      "__type__": "cc.Size",\r\n      "width": 0,\r\n      "height": 0\r\n    },\r\n    "_rotationX": 0,\r\n    "_rotationY": 0,\r\n    "_scaleX": 1,\r\n    "_scaleY": 1,\r\n    "_position": {\r\n      "__type__": "cc.Vec2",\r\n      "x": 0,\r\n      "y": 0\r\n    },\r\n    "_skewX": 0,\r\n    "_skewY": 0,\r\n    "_localZOrder": 0,\r\n    "_globalZOrder": 0,\r\n    "_opacityModifyRGB": false,\r\n    "groupIndex": 0\r\n  },\r\n  {\r\n    "__type__": "cc.PrefabInfo",\r\n    "root": {\r\n      "__id__": 1\r\n    },\r\n    "asset": {\r\n      "__id__": 0\r\n    },\r\n    "fileId": "",\r\n    "sync": false\r\n  }\r\n]';
        // fs.writeFileSync(global.sharedObject.client_project_path + "/assets/resources/prefabs/game/" + module_name + "/" + toStudlyCaps(module_name) + "WindowPrefab.prefab", vcontent, function (err) {
        // 	if (!err) {
        // 		console.log("创建窗体预置体成功");
        // 	}
        // });

        //----------修改ScreenConst
        if (create_screen) {
            let scpath = global.sharedObject.client_project_path + "/assets/script/game/constant/ScreenConst.ts";
            fs.readFile(scpath, "utf8", function (err, data) {
                if (!err) {
                    data = rightTrim(data);
                    let sccontent = substr(data, 0, data.length - 1);
                    sccontent = "import " + toStudlyCaps(module_name) + "Screen from '../module/" + module_name + "/screen/" + toStudlyCaps(module_name) + "Screen';\n" + sccontent;
                    sccontent = sccontent + "\tpublic static " + toStudlyCaps(module_name) + "Screen = " + toStudlyCaps(module_name) + "Screen;\n}";

                    fs.writeFile(scpath, sccontent, function (err) {
                        if (!err) {
                            let msg = "修改ScreenConst成功";
                            mainWindow.webContents.send("client_add_log", msg);
                        }
                    });
                }
            });
        }

        //----------修改ModuleConst
        let mdpath = global.sharedObject.client_project_path + "/assets/script/game/constant/ModuleConst.ts";
        fs.readFile(mdpath, "utf8", function (err, data) {
            if (!err) {
                data = rightTrim(data);
                let mdcontent = substr(data, 0, data.length - 1);
                mdcontent = mdcontent + "\tpublic static " + module_name + ": string = \"" + module_name + "\";\n}";

                fs.writeFile(mdpath, mdcontent, function (err) {
                    if (!err) {
                        let msg = "修改ModuleConst成功";
                        mainWindow.webContents.send("client_add_log", msg);
                    }
                });
            }
        });

        //----------修改WindowConst
        let wcpath = global.sharedObject.client_project_path + "/assets/script/game/constant/WindowConst.ts";
        fs.readFile(wcpath, "utf8", function (err, data) {
            if (!err) {
                data = rightTrim(data);
                let wccontent = substr(data, 0, data.length - 1);
                wccontent = wccontent + "\tpublic static " + toStudlyCaps(module_name) + "Window: string = \"" + toStudlyCaps(module_name) + "Window\";\n}";

                fs.writeFile(wcpath, wccontent, function (err) {
                    if (!err) {
                        let msg = "修改WindowConst成功";
                        mainWindow.webContents.send("client_add_log", msg);
                    }
                });
            }
        });

        //-----------修改CtrlConst
        let ccpath = global.sharedObject.client_project_path + "/assets/script/game/constant/CtrlConst.ts";
        fs.readFile(ccpath, "utf8", function (err, data) {
            if (!err) {
                data = rightTrim(data);
                let cccontent = substr(data, 0, data.length - 1);
                cccontent = "import " + toStudlyCaps(module_name) + "Controller from '../module/" + module_name + "/controller/" + toStudlyCaps(module_name) + "Controller';\n" + cccontent;
                cccontent = cccontent + "\tpublic static " + toStudlyCaps(module_name) + "Controller = " + toStudlyCaps(module_name) + "Controller;\n}";

                fs.writeFile(ccpath, cccontent, function (err) {
                    if (!err) {
                        let msg = "修改CtrlConst成功";
                        mainWindow.webContents.send("client_add_log", msg);
                    }
                });
            }
        });

        //-----------修改Win2CtrlConst
        let wccpath = global.sharedObject.client_project_path + "/assets/script/game/constant/Win2CtrlConst.ts";
        fs.readFile(wccpath, "utf8", function (err, data) {
            if (!err) {
                data = rightTrim(data);
                let wcccontent = substr(data, 0, data.length - 5);
                wcccontent = "import " + toStudlyCaps(module_name) + "Controller from '../module/" + module_name + "/controller/" + toStudlyCaps(module_name) + "Controller';\n" + wcccontent;
                wcccontent = "import " + toStudlyCaps(module_name) + "Window from '../module/" + module_name + "/view/" + toStudlyCaps(module_name) + "Window';\n" + wcccontent;
                wcccontent = wcccontent + "\n\t\t{\n\t\t\tmodule: ModuleConst." + module_name + ",\n\t\t\tctrl: CtrlConst." + toStudlyCaps(module_name) + "Controller,\n\t\t\twins: [\n\t\t\t\tWindowConst." + toStudlyCaps(module_name) + "Window\n\t\t\t]\n\t\t},";
                wcccontent = wcccontent + "\n\t];\n}";
                fs.writeFile(wccpath, wcccontent, function (err) {
                    if (!err) {
                        let msg = "修改Win2CtrlConst成功";
                        mainWindow.webContents.send("client_add_log", msg);
                    }
                });
            }
        });

        //----------修改ModelManager
        let mmpath = global.sharedObject.client_project_path + "/assets/script/freedom/manager/ModelManager.ts";
        fs.readFile(mmpath, "utf8", function (err, data) {
            if (!err) {
                data = rightTrim(data);
                let mmcontent = substr(data, 0, data.length - 1);
                mmcontent = "import " + toStudlyCaps(module_name) + "Model from '../../game/module/" + module_name + "/model/" + toStudlyCaps(module_name) + "Model';\r\n" + mmcontent;
                mmcontent = mmcontent + "\tpublic " + module_name + "Model: " + toStudlyCaps(module_name) + "Model = new " + toStudlyCaps(module_name) + "Model();\r\n}";

                fs.writeFile(mmpath, mmcontent, function (err) {
                    if (!err) {
                        let msg = "修改ModelManager成功";
                        mainWindow.webContents.send("client_add_log", msg);
                    }
                });
            }
        });

        //刷新模块列表
        setTimeout(function () {
            refreshModules(event, 2);
        }, 500);

        let msg = "创建" + toStudlyCaps(module_name) + "模块完毕";
        mainWindow.webContents.send("client_show_message", msg);
    }

    function createWindow(event, window_name, window_cn_name, window_module_name) {
        let author = global.sharedObject.client_author;

        //----------创建窗体
        let wpath = global.sharedObject.client_project_path + "/assets/script/game/module/" + window_module_name + "/view/" + toStudlyCaps(window_name) + "Window.ts";
        if (fs.exists(wpath, function (exists) {
            if (exists) {
                let msg = toStudlyCaps(window_name) + "Window.ts" + "已存在";
                mainWindow.webContents.send("client_show_message", msg);
            } else {
                let wcontent = "import BWindow from '../../../../framework/mvc/view/BWindow';\r\n\r\nconst { ccclass, property } = cc._decorator;\r\n/**\r\n * @author " + author + " \r\n * @desc " + window_cn_name + " 窗体\r\n * @date " + dateFormat(new Date(), "yyyy-MM - dd hh: mm:ss") + " \r\n * @last modified by   " + author + " \r\n * @last modified time " + dateFormat(new Date(), "yyyy-MM - dd hh: mm:ss") + " \r\n */\r\n@ccclass\r\nexport default class " + toStudlyCaps(window_name) + "Window extends BWindow {\r\n\tpublic constructor() {\r\n\t\tsuper();\r\n\t}\r\n\r\n\tpublic show(data?: any): void {\r\n\t\tsuper.show();\r\n\t}\r\n\r\n\tpublic hide(data?: any): void {\r\n\t\tsuper.hide();\r\n\t}\r\n\r\n\tpublic onDestroy(): void {\r\n\t\tsuper.onDestroy();\r\n\t}\r\n}";
                fs.writeFile(wpath, wcontent, function (err) {
                    if (!err) {
                        let msg = "创建" + toStudlyCaps(window_name) + "Window.ts" + "成功";
                        mainWindow.webContents.send("client_add_log", msg);
                    }
                });
            }
        }));

        //----------修改WindowConst
        let wcpath = global.sharedObject.client_project_path + "/assets/script/game/constant/WindowConst.ts";
        fs.readFile(wcpath, "utf8", function (err, data) {
            if (!err) {
                let wccontent = substr(data, 0, data.length - 1);
                wccontent = wccontent + "\tpublic static " + toStudlyCaps(window_name) + "Window: string = \"" + toStudlyCaps(window_name) + "Window\";\n}";

                fs.writeFile(wcpath, wccontent, function (err) {
                    if (!err) {
                        let msg = "修改WindowConst成功";
                        mainWindow.webContents.send("client_add_log", msg);
                    }
                });
            }
        });

        //-----------修改Win2CtrlConst
        let wccpath = global.sharedObject.client_project_path + "/assets/script/game/constant/Win2CtrlConst.ts";
        fs.readFile(wccpath, "utf8", function (err, data) {
            if (!err) {
                let datas = data.split("ModuleConst." + window_module_name);
                let preData = datas[0];
                let nexDatas = datas[1].split("[");
                let preString = datas[0] + "ModuleConst." + window_module_name + nexDatas[0] + "[";

                // endString = "\n\t\t\t\tWindowConst." + toStudlyCaps(window_name) + "Window," + nexDatas[1];
                endString = "\n\t\t\t\tWindowConst." + toStudlyCaps(window_name) + "Window,";
                for (var i = 0; i < nexDatas.length; i++) {
                    var element = nexDatas[i];
                    if (i != 0) {
                        if (i == nexDatas.length - 1) {
                            endString += element;
                        } else {
                            endString += element + "[";
                        }
                    }
                }

                let wcccontent = preString + endString;
                wcccontent = "import " + toStudlyCaps(window_name) + "Window from '../module/" + window_module_name + "/view/" + toStudlyCaps(window_name) + "Window';\n" + wcccontent;
                fs.writeFile(wccpath, wcccontent, function (err) {
                    if (!err) {
                        let msg = "修改Win2CtrlConst成功";
                        mainWindow.webContents.send("client_add_log", msg);
                    }
                });
            }
        });

        //刷新模块列表
        setTimeout(function () {
            refreshModules(event, 2);
        }, 500);

        let msg = "创建" + toStudlyCaps(window_name) + "Window.ts" + "窗体完毕";
        mainWindow.webContents.send("client_show_message", msg);
    }

    function refreshProtos(event) {
        let proto_path = global.sharedObject.client_proto_path;

        let pa = fs.readdirSync(proto_path);
        let protoModules = [];
        let protoFiles = [];
        let content = "";
        pa.forEach(function (ele, index) {
            let info = fs.statSync(proto_path + "/" + ele)
            if (info.isDirectory()) {
                fs.readDirSync(proto_path + "/" + ele);
            } else {
                let t = ele.split(".")[1];
                if (ele == "PBMODULE.proto") {
                    let eleContent = fs.readFileSync(proto_path + "/" + ele, "utf-8");
                    eleContent = rightTrim(eleContent);

                    eleContent = eleContent.split("PModule")[1];
                    eleContent = substr(eleContent, 1, eleContent.length - 2);

                    eles = eleContent.split(";");
                    for (let index = 0; index < eles.length; index++) {
                        if (index != eles.length - 1) {
                            protoModules.push(trim(eles[index].split("=")[0]));
                        }
                    }
                } else if (t == "proto") {
                    protoFiles.push(ele);
                } else {

                }
            }
        }.bind(this));

        global.sharedObject.proto_modules = protoModules;
        global.sharedObject.proto_files = protoFiles;
        event.sender.send('client_proto_refresh_complete', global.sharedObject.client_modules, protoModules, protoFiles);
    }

    function selectProtoFile(event, file_name) {
        let ptpath = global.sharedObject.client_proto_path + "/" + file_name;
        fs.readFile(ptpath, "utf8", function (err, data) {
            if (!err) {
                let reg = new RegExp(/(\/\/.*)|(\/\*[\s\S]*?\*\/)/g);
                data = data.replace(reg, "");
                data = rightTrim(data);
                let msgs = data.split("message");
                let protoCmds = [];
                let cmdData = msgs[0];

                cmdData = cmdData.split("enum")[1];
                let cmdInfo = cmdData.split("{");
                let protoCmdClassName = cmdInfo[0];
                cmdData = cmdInfo[1];
                cmdData = rightTrim(replace(replace(cmdData, "\r", ""), "\n", ""));
                cmdData = substr(cmdData, 1, cmdData.length - 2);
                let cmdDatas = cmdData.split(";")
                for (let i = 0; i < cmdDatas.length - 1; i++) {
                    let element = cmdDatas[i];
                    let cmd = removeSpaces(element.split("=")[0]);
                    protoCmds.push(cmd);
                }
                global.sharedObject.proto_cmds = protoCmds;

                let protoMessages = [];
                for (let index = 1; index < msgs.length; index++) {
                    let ele = msgs[index];
                    ele = rightTrim(leftTrim(ele));

                    let eles = ele.split("{");
                    let obj = {};
                    obj.name = trim(eles[0]);
                    let attr = rightTrim(eles[1]);
                    attr = replace(replace(attr, "\r", ""), "\n", "");
                    let attrs = attr.split(";");
                    for (let m = 0; m < attrs.length - 1; m++) {
                        let attrInfo = attrs[m].split("=")[0].split(" ");
                        let attrType = removeSpaces((attrInfo[0]));
                        let attrName = removeSpaces(attrInfo[1]);
                        if (attrType == "int32" || attrType == "int64") {
                            attrType = "number";
                        } else if (attrType == "repeated") {
                            attrType = removeSpaces(attrInfo[1]) + "[]";
                            attrName = removeSpaces(attrInfo[2]);
                        } else if (attrType.substr(0, 3) == "map") {
                            attrType = "[]";
                            if (attrInfo[2]) {
                                attrName = removeSpaces(attrInfo[2]);
                            } else {
                                attrName = removeSpaces(attrInfo[1]);
                            }
                        } else {
                        }

                        obj[attrName] = attrName;
                    }
                    protoMessages.push(obj);
                }

                global.sharedObject.proto_cmd_class = protoCmdClassName;
                global.sharedObject.proto_messages = protoMessages;

                event.sender.send('client_select_proto_file_complete', global.sharedObject.proto_cmd_class, global.sharedObject.proto_cmds, global.sharedObject.proto_messages);
            }
        });
    }

    function settingProto(event, game_module_name, proto_module_name, proto_cmd_class, proto_objs) {
        //----------修改Controller
        proto_module_name = removeSpaces(proto_module_name);
        proto_cmd_class = removeSpaces(proto_cmd_class);
        let cpath = global.sharedObject.client_project_path + "/assets/script/game/module/" + game_module_name + "/controller/" + toStudlyCaps(game_module_name) + "Controller.ts";
        fs.readFile(cpath, "utf8", function (err, data) {
            if (!err) {
                let datas = data.split("super();");
                let preContent = datas[0] + "super();";
                let cenContent = "";
                let nexContent = "\r\n}";

                let registerMsg = "";
                registerMsg += "\r\n\t\tlet cdm = CmdDispatchManager.getInstance();\r\n";
                registerMsg += "\t\tlet pm = ProtoManager.getInstance();\r\n";
                let addCmdMsg = "";
                let functionMsg = "";

                for (let index = 0; index < proto_objs.length; index++) {
                    let element = proto_objs[index];
                    let cmdDatas = element.cmd.split("_");
                    let cmdStr = "";
                    for (let index = 0; index < cmdDatas.length; index++) {
                        let element = cmdDatas[index];
                        if (index != 0) {
                            cmdStr += toStudlyCaps(toLowerCase(element));
                        }
                    }

                    //--request
                    registerMsg += "\t\tthis.registerMsg(MsgEnum.Req" + cmdStr + ", this.req" + cmdStr + ", this);\r\n"
                    functionMsg += "\r\n\r\n\tprivate req" + cmdStr + "(msg: MsgVO): void {\r\n";
                    if (element.request) {
                        functionMsg += "\t\tlet data: Proto2TypeScript." + element.request + " = ProtoManager.getInstance().createProto(MsgEnum[MsgEnum." + element.request + "]);\r\n";
                        let reqObj = getMessageObject(element.request);
                        for (let key in reqObj) {
                            if (key != "name") {
                                functionMsg += "\t\tdata." + reqObj[key] + " = msg.data." + reqObj[key] + ";\r\n";
                            }
                        }
                        functionMsg += "\t\tSocketManager.getInstance().sendData(Proto2TypeScript.PModule." + proto_module_name + ", Proto2TypeScript." + proto_cmd_class + "." + element.cmd + ", data);\r\n"
                        functionMsg += "\t}";
                    } else {
                        functionMsg += "\t\tSocketManager.getInstance().sendData(Proto2TypeScript.PModule." + proto_module_name + ", Proto2TypeScript." + proto_cmd_class + "." + element.cmd + ");\r\n"
                        functionMsg += "\t}";
                    }

                    //--response 方法
                    addCmdMsg += "\t\tcdm.addCmdListener(pm.getMessageKey(Proto2TypeScript.PModule." + proto_module_name + ", Proto2TypeScript." + proto_cmd_class + "." + element.cmd + "), this.res" + cmdStr + ", this);\r\n";
                    functionMsg += "\r\n\r\n\tprivate res" + cmdStr + "(protoResponse: ProtoResponse): void {\r\n";
                    functionMsg += "\t\tif (protoResponse.statusCode !== StatusCode.Success) {\r\n";
                    functionMsg += "\t\t\treturn;\r\n";
                    functionMsg += "\t\t}\r\n";
                    if (element.response) {
                        functionMsg += "\t\tlet data: Proto2TypeScript." + element.response + " = protoResponse.getProtoBufModel(MsgEnum[MsgEnum." + element.response + "]);\r\n";
                        let resObj = getMessageObject(element.response);
                        for (let key in resObj) {
                            if (key != "name") {
                                functionMsg += "\t\tdata." + resObj[key] + ";\r\n";
                            }
                        }
                        functionMsg += "\t}";
                    } else {
                        functionMsg += "\t}";
                    }
                }
                addCmdMsg += "\r\n\t}";
                cenContent += registerMsg;
                cenContent += addCmdMsg;
                cenContent += functionMsg;

                let content = preContent + cenContent + nexContent;

                fs.writeFile(cpath, content, function (err) {
                    if (!err) {
                        let msg = "修改Controller成功";
                        mainWindow.webContents.send("client_add_log", msg);
                    }
                });
            }
        });

        //----------修改MsgEnum.ts
        let mepath = global.sharedObject.client_project_path + "/assets/script/freedom/enum/MsgEnum.ts";
        fs.readFile(mepath, "utf8", function (err, data) {
            if (!err) {
                let datas = data.split("MsgEnum");
                msg = removeSpaces(datas[1]);
                msg = substr(msg, 1, msg.length - 2);
                msgs = msg.split(",");
                let msgNames = [];
                for (let index = 0; index < msgs.length; index++) {
                    let element = msgs[index];
                    if (index == 0) {
                        let msgName = element.split("=")[0];
                        if (msgNames.indexOf(msgName) == -1) {
                            msgNames.push(msgName);
                        }
                        continue;
                    }

                    if (index != msgs.length - 1) {
                        if (msgNames.indexOf(element) == -1) {
                            msgNames.push(element);
                        }
                        continue;
                    }
                }

                for (let index = 0; index < proto_objs.length; index++) {
                    let element = proto_objs[index];
                    let cmdDatas = element.cmd.split("_");
                    let cmdStr = "";
                    for (let i = 0; i < cmdDatas.length; i++) {
                        let element = cmdDatas[i];
                        if (i != 0) {
                            cmdStr += toStudlyCaps(toLowerCase(element));
                        }
                    }

                    if (msgNames.indexOf("Req" + cmdStr) == -1) {
                        msgNames.push("Req" + cmdStr);
                    }
                    if (msgNames.indexOf("Res" + cmdStr) == -1) {
                        msgNames.push("Res" + cmdStr);
                    }
                }

                msgNames.sort();
                let mecontent = datas[0];
                for (var index = 0; index < msgNames.length; index++) {
                    var element = msgNames[index];
                    if (index == 0) {
                        mecontent += "MsgEnum {\r\n\t" + element + " = 10001,\r\n";
                    } else if (index == msgNames.length - 1) {
                        mecontent += "\t" + element + ",\r\n}";
                    } else {
                        mecontent += "\t" + element + ",\r\n";
                    }
                }

                fs.writeFile(mepath, mecontent, function (err) {
                    if (!err) {
                        let msg = "修改MsgEnum成功";
                        mainWindow.webContents.send("client_add_log", msg);
                    }
                });
            }
        });

        let msg = "设置协议完毕";
        mainWindow.webContents.send("client_show_message", msg);

        event.sender.send('client_setting_proto_complete');
    }

    function createProtoJavascriptNew(event) {
        let jscontent = "var Proto2TypeScript = {};\r\n";
        let jsonPath = global.sharedObject.client_project_path + "/assets/script/lib/Proto2TypeScript/Proto2TypeScript.json";
        let data = fs.readFileSync(jsonPath, "utf-8");
        let jsonData = JSON.parse(data);

        for (let i = 0; i < jsonData.enums.length; i++) {
            const enumEle = jsonData.enums[i];
            jscontent += "\r\nProto2TypeScript." + enumEle.name + " = {};";
            for (let m = 0; m < enumEle.values.length; m++) {
                const enumValue = enumEle.values[m];
                jscontent += "\r\nProto2TypeScript." + enumEle.name + "['" + enumValue.name + "'] = " + enumValue.id + ";\r\nProto2TypeScript." + enumEle.name + "[" + enumValue.id + "] = '" + enumValue.name + "';"
            }
        }

        for (let i = 0; i < jsonData.messages.length; i++) {
            const msgEle = jsonData.messages[i];
            jscontent += "\r\nProto2TypeScript." + msgEle.name + " = {};";
            for (let m = 0; m < msgEle.fields.length; m++) {
                const fieldEle = msgEle.fields[m];
                jscontent += "\r\nProto2TypeScript." + msgEle.name + "." + fieldEle.name + ";";
            }
        }

        let jspath = global.sharedObject.client_project_path + "/assets/script/lib/Proto2TypeScript/Proto2TypeScript.js";
        fs.writeFile(jspath, jscontent, function (err) {
            if (!err) {
                let msg = "生成Proto2TypeScript.js成功";
                mainWindow.webContents.send("client_show_message", msg);
            }
        });
    }

    function createProtoJavascript(event) {
        let jscontent = "var Proto2TypeScript = {};\r\n";
        let tscontent = "\r\ndeclare module Proto2TypeScript {\r\n\texport interface ProtoBufModel {}";

        let proto_path = global.sharedObject.client_proto_path;
        let pa = fs.readdirSync(proto_path);
        pa.forEach(function (ele, index) {
            let info = fs.statSync(proto_path + "/" + ele)
            if (info.isDirectory()) {
                readDirSync(proto_path + "/" + ele);
            } else {
                let t = ele.split(".")[1];
                if (t == "proto") {
                    if (ele != "PBMODULE.proto") {
                        let data = fs.readFileSync(proto_path + "/" + ele, "utf-8");
                        let reg = new RegExp(/(\/\/.*)|(\/\*[\s\S]*?\*\/)/g);
                        data = data.replace(reg, "");

                        data = rightTrim(data);
                        let msgs = data.split("message");
                        let cmdData = msgs[0];
                        cmdDatas = cmdData.split("enum");
                        let msgTsContent = "";
                        let msgJsContent = "";
                        for (let i = 0; i < cmdDatas.length; i++) {
                            if (i != 0) {
                                let cmdInfo = cmdDatas[i].split("{");
                                let protoCmdClassName = removeSpaces(cmdInfo[0]);

                                msgTsContent += "\r\n\texport const enum " + protoCmdClassName + " {";
                                msgJsContent += "\r\nProto2TypeScript." + protoCmdClassName + " = {};";

                                let enumObjs = analysisEnum("{" + cmdInfo[1]);
                                for (let index = 0; index < enumObjs.length; index++) {
                                    let element = enumObjs[index];
                                    for (let key in element) {
                                        msgTsContent += "\r\n\t\t" + key + " = " + element[key] + ",";
                                        msgJsContent += "\r\nProto2TypeScript." + protoCmdClassName + "['" + key + "'] = " + element[key] + ";\r\nProto2TypeScript." + protoCmdClassName + "[" + element[key] + "] = '" + key + "';"
                                    }
                                }
                                msgTsContent += "\r\n\t}";
                            }
                        }

                        for (let index = 1; index < msgs.length; index++) {
                            let ele = msgs[index];
                            ele = rightTrim(leftTrim(ele));

                            let eles = ele.split("{");
                            let objName = trim(eles[0]);
                            msgTsContent += "\r\n\texport interface " + objName + " extends ProtoBufModel {";
                            msgJsContent += "\r\nProto2TypeScript." + objName + " = {};";

                            let attr = rightTrim(eles[1]);
                            attr = replace(replace(attr, "\r", ""), "\n", "");
                            let attrs = attr.split(";");
                            for (let m = 0; m < attrs.length - 1; m++) {
                                let attrInfo = attrs[m].split("=")[0].split(" ");
                                let attrType = removeSpaces((attrInfo[0]));
                                let attrName = removeSpaces(attrInfo[1]);
                                if (attrType == "int32" || attrType == "int64") {
                                    attrType = "number";
                                } else if (attrType == "repeated") {
                                    attrType = removeSpaces(attrInfo[1]) + "[]";
                                    attrName = removeSpaces(attrInfo[2]);
                                } else if (attrType.substr(0, 3) == "map") {
                                    attrType = "[]";
                                    if (attrInfo[2]) {
                                        attrName = removeSpaces(attrInfo[2]);
                                    } else {
                                        attrName = removeSpaces(attrInfo[1]);
                                    }
                                } else {
                                }
                                msgJsContent += "\r\nProto2TypeScript." + objName + "." + attrName + ";";
                                msgTsContent += "\r\n\t\t" + attrName + ": " + attrType + ";";
                            }
                            msgTsContent += "\r\n\t}";
                        }

                        jscontent += msgJsContent;
                        tscontent += msgTsContent;
                    } else {
                        let eleContent = fs.readFileSync(proto_path + "/" + ele, "utf-8");
                        let reg = new RegExp(/(\/\/.*)|(\/\*[\s\S]*?\*\/)/g);
                        eleContent = eleContent.replace(reg, "");
                        eleContent = eleContent.split("PModule")[1];

                        let moduleTsContent = "\r\n\texport const enum PModule {\r\n";
                        let moduleJsContent = "Proto2TypeScript.PModule = {};";

                        let enumObjs = analysisEnum(eleContent);
                        for (var index = 0; index < enumObjs.length; index++) {
                            var element = enumObjs[index];
                            for (let key in element) {
                                moduleTsContent += "\t\t" + key + " = " + element[key] + ",\r\n";
                                moduleJsContent += "\r\nProto2TypeScript.PModule['" + key + "'] = " + element[key] + ";\r\nProto2TypeScript.PModule[" + element[key] + "] = '" + key + "';"
                            }
                        }
                        moduleTsContent += "\r\n\t}";

                        jscontent += moduleJsContent;
                        tscontent += moduleTsContent;
                    }
                }
            }
        }.bind(this));

        jscontent += "";
        tscontent += "\r\n}";

        let jspath = global.sharedObject.client_project_path + "/assets/script/lib/Proto2TypeScript/Proto2TypeScript.js";
        let tspath = global.sharedObject.client_project_path + "/assets/script/lib/Proto2TypeScript/Proto2TypeScript.d.ts";

        fs.writeFile(jspath, jscontent, function (err) {
            if (!err) {
                let msg = "生成Proto2TypeScript.js成功";
                mainWindow.webContents.send("client_show_message", msg);
            }
        });
    }

    function analysisEnum(content) {
        let enumContent = removeSpaces(content);
        enumContent = substr(enumContent, 1, enumContent.length - 2);
        let enums = enumContent.split(";");
        let enumObjs = [];
        for (var index = 0; index < enums.length; index++) {
            var element = enums[index];
            if (index != enums.length - 1) {
                let enumObj = element.split("=");
                let obj = {};
                obj[enumObj[0]] = enumObj[1]
                enumObjs.push(obj);
            }
        }

        return enumObjs;
    }

    function getMessageObject(messageName) {
        let array = global.sharedObject.proto_messages;
        for (let index = 0; index < array.length; index++) {
            let element = array[index];
            if (element.name == messageName) {
                return element;
            }
        }
    }

    global.sharedObject = {
        client_modules: [],
        proto_modules: [],
        proto_files: [],
        proto_messages: [],
    }
}