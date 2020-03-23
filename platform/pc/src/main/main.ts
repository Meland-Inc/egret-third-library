/**
 * @author 雪糕 
 * @desc main主程序文件
 * @date 2020-02-18 11:42:51 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-22 01:37:40
 */
// Modules to control application life and create native browser window
import { app, globalShortcut, BrowserWindow, Menu, shell, dialog, Referrer, BrowserWindowConstructorOptions } from 'electron';
import * as fs from 'fs';
import * as process from 'process';

import { define } from './define';
import { logger } from './logger';
import config from './Config';
import server from './Server';
import message from './Message';

let mainWindow: BrowserWindow;

//native初始化
async function initNative() {
  logger.log('net', `urlValue: ${config.urlValue}`);
  if (config.urlValue.indexOf(config.constPseudoProtocol) === -1) {
    config.setNativeMode(define.eNativeMode.website);
  } else {
    //设置路由
    let lessonRouter = config.urlValue.replace(config.constPseudoProtocol, '');
    lessonRouter = lessonRouter.slice(0, lessonRouter.indexOf("?") - 1);
    config.setLessonRouter(lessonRouter as define.eLessonRouter);

    //创造地图模式
    if (config.lessonRouter === define.eLessonRouter.createMap) {
      config.setNativeMode(define.eNativeMode.createMap);
    } else if (config.lessonRouter === define.eLessonRouter.banner) {
      config.setNativeMode(define.eNativeMode.banner);
    } else {
      config.setNativeMode(define.eNativeMode.platform);
    }
  }

  await mainWindow.loadFile(`./dist/renderer.html`);
  logger.log('net', `config.urlValue`, config.urlValue);
}

//创建游戏浏览窗口
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      // preload: `${config.rootPath}/dist/renderer/renderer.js`,
      nodeIntegration: true,
      webSecurity: false
    }
  });

  config.setMainWindow(mainWindow);

  // 判断创建文件
  if (!fs.existsSync(`${config.rootPath}/package`)) {
    fs.mkdirSync(`${config.rootPath}/package`)
  }

  if (!fs.existsSync(`${config.rootPath}/package/client`)) {
    fs.mkdirSync(`${config.rootPath}/package/client`)
  }

  if (!fs.existsSync(`${config.rootPath}/package/server`)) {
    fs.mkdirSync(`${config.rootPath}/package/server`)
  }

  let userAgent = mainWindow.webContents.userAgent + " BellCodeIpadWebView BellplanetNative";
  mainWindow.webContents.userAgent = userAgent;

  /** 设置url参数 */
  config.setUrlValue(process.argv[process.argv.length - 1]);

  /** 初始化消息处理类 */
  message.init();

  //日志初始化
  logger.init();


  logger.log('main', `收到参数1: ${JSON.stringify(process.argv)}`);

  //native初始化
  initNative();

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  mainWindow.webContents.on('crashed', () => {
    // const options = {
    //   type: 'error',
    //   title: '进程崩溃了',
    //   message: '这个进程已经崩溃.',
    //   buttons: ['重载', '退出'],
    // };
    recordCrash().then(() => {
      // dialog.showMessageBox(options, (index) => {
      //   if (index === 0) {
      //     reloadWindow(mainWindow);
      //   } else {
      //     app.quit();
      //   }
      // });
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
    config.setMainWindow(null);
    await server.closeGameServer();
  })

  // 拦截new-window事件，起到拦截window.open的作用
  mainWindow.webContents.on('new-window', async (event: Event, url: string) => {
    // 阻止创建默认窗口
    event.preventDefault();

    logger.log('electron', `new-window: ${url}`);
    await mainWindow.loadURL(url);
  })

  // 拦截new-window事件，起到拦截window.open的作用
  mainWindow.webContents.on('will-navigate', async (event: Event, url: string) => {
    const tokenField = "webviewToken";
    const newURL = new URL(url);
    const hash = newURL.hash;

    const searchParams = (new URL(`https://bai.com${hash.slice(1)}`)).searchParams;

    if (newURL.searchParams.has(tokenField)
      || searchParams.has(tokenField)
    ) {
      return;
    }

    // 阻止创建默认窗口
    event.preventDefault();

    if (config.bellToken) {
      newURL.searchParams.set(tokenField, config.bellToken);
    }

    logger.log('electron', `will-navigate: ${newURL}`);
    await mainWindow.loadURL(newURL.toString());
  })

  //设置菜单
  // const menu = Menu.buildFromTemplate(template);
  // Menu.setApplicationMenu(menu);
  Menu.setApplicationMenu(null)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

//限制只启用一个程序
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const onGotTheLock = async (url) => {
  logger.log('electron', `运行第二个实例`);
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    mainWindow.show();
    logger.log('electron', `显示当前主窗口`);

    // 关闭之前的服务器
    await server.closeGameServer();

    /** 设置url参数 */
    config.setUrlValue(url);
    initNative();
  }
}

app.on('second-instance', async (event, argv, workingDirectory) => {
  // 当运行第二个实例时,将会聚焦到mainWindow这个窗口
  if (process.platform === 'win32') {
    onGotTheLock(argv[argv.length - 1]);
  }

  logger.log('main', `收到参数: ${JSON.stringify(argv)}, ${JSON.stringify(process.argv)}`);
});

app.on('open-url', function (event, url) {
  onGotTheLock(url);
});

app.on('ready', () => {
  createWindow();

  //检测杀game进程
  //let cmdStr = "taskkill /im game.exe /f";
  //util.runCmd(cmdStr, null, `关闭游戏服务器成功`, "关闭游戏服务器错误");

  let shortCut = "";
  if (process.platform === 'darwin') {
    shortCut = 'Alt+Command+I';
  } else {
    shortCut = 'Ctrl+Shift+I';
  }
  globalShortcut.register(shortCut, () => {
    mainWindow.webContents.openDevTools();
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

// //保存日志文件方法
async function saveProcessLog() {
  let path = dialog.showSaveDialogSync(
    {
      title: `后台进程日志另存为`,
      filters: [{ name: "process.log", extensions: ["log"] }]
    });
  let content = fs.readFileSync(config.processLogPath, 'utf-8');
  fs.writeFileSync(path, content, 'utf-8');
}