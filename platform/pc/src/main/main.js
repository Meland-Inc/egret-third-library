/**
 * @author 雪糕 
 * @desc main主程序文件
 * @date 2020-02-18 11:42:51 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-02-25 17:14:59
 */
// Modules to control application life and create native browser window
const { app, globalShortcut, BrowserWindow, Menu, shell, dialog } = require('electron')
const os = require('os');
const fs = require('fs');
const process = require('process');

const logger = require('./logger.js');
const config = require('./config.js');
const server = require('./server.js');
const platform = require('./platform.js');
const util = require('./util.js');

let mainWindow

//初始化方法
async function init() {
  //日志初始化
  logger.init();

  //工具初始化
  util.init();

  // //平台测试参数
  // config.urlValue = 'bellplanet://lesson?temporary_token=LWKqnyRO8M:QN0WH&class_id=410&bell_origin=demoapi.wkcoding.com';

  //平台相关初始化
  let queryValue = { pcNative: 1 };
  let protocolName = "bellplanet://";
  if (config.urlValue.indexOf(protocolName) === -1) {
    //非平台
    logger.log('net', `本地打开native程序`);
    queryValue["fakeGameMode"] = "lessons";
  } else {
    //平台初始化
    await platform.init(queryValue);
    queryValue['fakeUserType'] = config.userType;
    queryValue['token'] = config.bellTempToken;
  }

  //非上课端 或者 老师端 本地服务器初始化
  if (config.channel != config.constChannelLesson || config.userType === config.eUserType.teacher) {
    server.init();
  }

  //加载渲染页面
  mainWindow.loadFile(`${config.rootPath}/src/renderer/index.html`, { query: queryValue });
  logger.log('net', 'urlValue', config.urlValue);
}

//创建游戏浏览窗口
function createWindow() {
  config.mainWindow = mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      preload: `${config.rootPath}/src/renderer/renderer.js`,
      nodeIntegration: true
    }
  });

  // mainWindow.isEnabled

  /** 设置url参数 */
  config.urlValue = process.argv[process.argv.length - 1];
  //初始化
  init();

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('crashed', () => {
    const options = {
      type: 'error',
      title: '进程崩溃了',
      message: '这个进程已经崩溃.',
      buttons: ['重载', '退出'],
    };
    recordCrash().then(() => {
      dialog.showMessageBox(options, (index) => {
        if (index === 0) {
          reloadWindow(mainWindow);
        }
        else app.quit();
      });
    }).catch((e) => {
      console.log('err', e);
    });
  })

  function recordCrash() {
    return new Promise(resolve => {
      // 崩溃日志请求成功.... 
      resolve();
    })
  }

  //监听窗口关闭
  mainWindow.on('closed', async () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    config.mainWindow = mainWindow = null;
    await server.closeGameServer();
  })

  //设置菜单
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//限制只启用一个程序
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  return;
}
app.on('second-instance', async (event, argv, workingDirectory) => {
  // 当运行第二个实例时,将会聚焦到mainWindow这个窗口
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    mainWindow.show();

    //非上课端 或者 老师端要关闭之前的服务器
    if (config.channel != config.constChannelLesson || config.userType === config.eUserType.teacher) {
      await server.closeGameServer();
    }

    /** 设置url参数 */
    config.urlValue = argv[argv.length - 1];
    init();
  }
})

app.on('ready', () => {
  createWindow();
  let shortCut = "";
  if (process.platform === 'darwin') {
    shortCut = 'Alt+Command+I';
  } else {
    shortCut = 'Ctrl+Shift+I';
  }
  globalShortcut.register(shortCut, () => {
    mainWindow.toggleDevTools();
    mainWindow.webContents.toggleDevTools
  })
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
})

app.on('ready', () => {

})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
let template = [
  // {
  //   label: '窗口',
  //   role: 'window',
  //   submenu: [
  //     {
  //       label: '重载',
  //       click: (item, focusedWindow) => {
  //         if (focusedWindow) {
  //           // 重载之后, 刷新并关闭所有的次要窗体
  //           if (focusedWindow.id === 1) {
  //             BrowserWindow.getAllWindows().forEach((win) => {
  //               if (win.id > 1) {
  //                 win.close()
  //               }
  //             })
  //           }
  //           focusedWindow.reload()
  //         }
  //       }
  //     },
  //     {
  //       label: '最小化',
  //       role: 'minimize'
  //     },
  //     {
  //       label: '切换全屏',
  //       click: (item, focusedWindow) => {
  //         if (focusedWindow) {
  //           focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
  //         }
  //       }
  //     }
  //   ]
  // },
  {
    label: '帮助',
    role: 'help',
    submenu: [
      {
        label: '切换开发者工具',
        accelerator: (() => {
          if (process.platform === 'darwin') {
            return 'Alt+Command+I'
          } else {
            return 'Ctrl+Shift+I'
          }
        })(),
        click: (item, focusedWindow) => {
          if (focusedWindow) {
            focusedWindow.toggleDevTools()
          }
        }
      },
      {
        label: '下载服务器日志',
        click: () => {
          // shell.openExternal('http://www.bellcode.com')
          saveProccessLog();
        }
      },
      {
        label: '关于',
        click: () => {
          shell.openExternal('http://www.bellcode.com')
        }
      }
    ]
  }
]

//保存日志文件方法
async function saveProccessLog() {
  let path = await dialog.showSaveDialogSync(
    // mainWindow,
    {
      title: `后台进程日志另存为`,
      filters: [{ name: "process.log", extensions: ["log"] }]
    });
  let content = await fs.readFileSync(config.processLogPath, 'utf-8');
  await fs.writeFileSync(path, content, 'utf-8');
}