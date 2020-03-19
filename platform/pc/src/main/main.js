/**
 * @author 雪糕 
 * @desc main主程序文件
 * @date 2020-02-18 11:42:51 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-20 01:29:15
 */
// Modules to control application life and create native browser window
const { app, globalShortcut, BrowserWindow, Menu, shell, dialog } = require('electron')
const fs = require('fs');
const process = require('process');

const logger = require('./logger.js');
const Config = require('./config.js').Config;
const server = require('./server.js');
const message = require('./message.js');
const util = require('./util.js');

let mainWindow

//native初始化
async function initNative() {

  //平台老师端测试参数
  // config.urlValue = `bellplanet://lesson?temporary_token=LWKqnyRO8M:eRhNA&class_id=18744&package_id=278&lesson_id=960&act_id=9999&bell_origin=demoapi.wkcoding.com&local_network=127.0.0.1:8080&internet_network=democm.wkcoding.com`;

  //平台学生端端测试参数
  // config.urlValue = `bellplanet://student?temporary_token=AWRl2okDEQ:fYHQv&class_id=18744&package_id=278&lesson_id=960&act_id=9999&bell_origin=demoapi.wkcoding.com&local_network=127.0.0.1:8080&internet_network=ofga364021.codingmonkey.com.cn:80`;

  logger.log('net', `urlValue: ${Config.urlValue}`);
  if (Config.urlValue.indexOf(Config.constPseudoProtocol) === -1) {
    Config.setNativeMode(Config.eNativeMode.website);
  } else {
    //设置路由
    let lessonRouter = Config.urlValue.replace(Config.constPseudoProtocol, '');
    lessonRouter = lessonRouter.slice(0, lessonRouter.indexOf("?") - 1);
    Config.setLessonRouter(lessonRouter);

    //创造地图模式
    if (Config.lessonRouter === Config.eLessonRouter.createMap) {
      Config.setNativeMode(Config.eNativeMode.createMap);
    } else if (Config.lessonRouter === Config.eLessonRouter.banner) {
      Config.setNativeMode(Config.eNativeMode.banner);
    } else {
      Config.setNativeMode(Config.eNativeMode.platform);
    }
  }
  await mainWindow.loadFile(`${Config.rootPath}/src/renderer/renderer.html`);

  logger.log('net', `config.urlValue`, Config.urlValue);
}

//创建游戏浏览窗口
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      // preload: `${config.rootPath}/src/renderer/renderer.js`,
      nodeIntegration: true,
      webSecurity: false
    }
  });
  Config.setMainWindow(mainWindow);

  // mainWindow.isEnabled

  //判断创建文件加
  if (!fs.existsSync(`${Config.rootPath}/package`)) {
    fs.mkdirSync(`${Config.rootPath}/package`)
  }

  if (!fs.existsSync(`${Config.rootPath}/package/client`)) {
    fs.mkdirSync(`${Config.rootPath}/package/client`)
  }

  if (!fs.existsSync(`${Config.rootPath}/package/server`)) {
    fs.mkdirSync(`${Config.rootPath}/package/server`)
  }

  let userAgent = mainWindow.webContents.userAgent + " BellCodeIpadWebView BellplanetNative";
  mainWindow.webContents.userAgent = userAgent;

  /** 设置url参数 */
  Config.setUrlValue(process.argv[process.argv.length - 1]);

  /** 初始化消息处理类 */
  message.init();

  //日志初始化
  logger.init();

  //native初始化
  initNative();

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

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
        } else {
          app.quit();
        }
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
    mainWindow = null;
    Config.setMainWindow(null);
    await server.closeGameServer();
  })

  // 拦截new-window事件，起到拦截window.open的作用
  mainWindow.webContents.on('new-window', async (e, url, frameName, disposition, options, additionalFeatures) => {
    // 阻止创建默认窗口
    e.preventDefault();

    // // 在这里可以实现不同的协议
    // if (/^app:\/\//.test(url)) {
    //   app.emit('protocol-test', {
    //     sender: mainWindow.webContents
    //   }, url)
    // }

    logger.log('electron', `new-window: ${url}`);
    await mainWindow.loadURL(url);
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
  logger.log('electron', `运行第二个实例`);
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    mainWindow.show();
    logger.log('electron', `显示当前主窗口`);

    // 关闭之前的服务器
    // if (config.channel != config.constChannelLesson || config.userType != config.eUserType.student) {
    await server.closeGameServer();
    // }

    /** 设置url参数 */
    Config.setUrlValue(argv[argv.length - 1]);
    initNative();
  }
});

app.on('ready', () => {
  createWindow();

  //检测杀game进程
  let cmdStr = "taskkill /im game.exe /f";
  util.runCmd(cmdStr, null, `关闭游戏服务器成功`, "关闭游戏服务器错误");

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
        click: saveProcessLog
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
async function saveProcessLog() {
  let path = dialog.showSaveDialogSync(
    // mainWindow,
    {
      title: `后台进程日志另存为`,
      filters: [{ name: "process.log", extensions: ["log"] }]
    });
  let content = fs.readFileSync(Config.processLogPath, 'utf-8');
  fs.writeFileSync(path, content, 'utf-8');
}