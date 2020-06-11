/**
 * @author 雪糕 
 * @desc main主程序文件
 * @date 2020-02-18 11:42:51 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-04-29 17:37:49
 */
// Modules to control application life and create native browser window
import { app, globalShortcut, BrowserWindow, Menu, shell, dialog } from 'electron';
import * as fs from 'fs';
import * as process from 'process';
import * as os from 'os';


import { define } from './define';
import { logger } from './logger';
import config from './Config';
import server from './Server';
import message from './Message';
import { util } from './util';

//限制只启用一个程序
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow: BrowserWindow;

//监听app事件
app.on('ready', onAppReady);
app.on('second-instance', onAppSecondInstance);
app.on('window-all-closed', onAppWindowAllClosed);
app.on('activate', onAppActivate);
app.on('will-finish-launching', () => {
  app.on('open-url', onAppOpenUrl);
});

function onAppReady() {
  createWindow();

  //开启native时检测杀game进程
  let cmdGameStr: string;
  if (os.platform() === "win32") {
    cmdGameStr = "taskkill /im game.exe /f";
  } else {
    cmdGameStr = `pkill game`;
  }
  util.runCmd(cmdGameStr, null, `关闭游戏服务器成功`, "");

  //开启native时检测杀ngrok进程
  let cmdNgrokStr: string;
  if (os.platform() === "win32") {
    cmdNgrokStr = "taskkill /im ngrok.exe /f";
  } else {
    cmdNgrokStr = `pkill ngrok`;
  }
  util.runCmd(cmdNgrokStr, null, `关闭ngrok进程成功`, "");


  let shortCut = "";
  if (process.platform === 'darwin') {
    shortCut = 'Alt+Command+I';
  } else {
    shortCut = 'Ctrl+Shift+I';
  }
  globalShortcut.register(shortCut, () => {
    mainWindow.webContents.openDevTools();
  })
}

// 当运行第二个实例时,将会聚焦到mainWindow这个窗口
function onAppSecondInstance(event: Event, argv: string[], workingDirectory: string) {
  if (process.platform === 'win32') {
    onGotTheLock(argv[argv.length - 1]);
  }
}

/** 当打开url时 */
function onAppOpenUrl(event: Event, url: string) {
  event.preventDefault();
  logger.log('main', `open-url, event`, url);
  onGotTheLock(url);
}

/** 拦截第二个实例 */
async function onGotTheLock(url: string) {
  logger.log('electron', `运行第二个实例`);
  /** 设置url参数 */
  config.setUrlValue(url);

  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    mainWindow.show();
    logger.log('electron', `显示当前主窗口`);

    // 关闭之前的服务器
    await server.closeGameServer();

    await initNative();
  }
}

function onAppWindowAllClosed() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
}

function onAppActivate() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
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

  //创建游戏包目录
  packageMkDir();

  //添加ua
  let userAgent = mainWindow.webContents.userAgent + " BellCodeIpadWebView BellplanetNative";
  mainWindow.webContents.userAgent = userAgent;

  /** 设置url参数 */
  if (os.platform() === "win32") {
    config.setUrlValue(process.argv.splice(app.isPackaged ? 1 : 2).join(""));
  }

  logger.log('main', `收到参数1: ${JSON.stringify(process.argv)}`);

  /** 初始化消息处理类 */
  message.init();

  //只有打包后的要上传日志
  if (config.isPackaged) {
    logger.uploadLog();
  }

  //初始化全局配置
  util.initGlobalConfig();

  await initNative();

  //初始化MainWindow
  initMainWindow();
}

/** 创建游戏包目录 */
function packageMkDir() {
  // 判断创建文件
  if (!fs.existsSync(`${config.packagePath}`)) {
    fs.mkdirSync(`${config.packagePath}`)
  }

  if (!fs.existsSync(`${config.clientPackagePath}`)) {
    fs.mkdirSync(`${config.clientPackagePath}`)
  }

  if (!fs.existsSync(`${config.serverPackagePath}`)) {
    fs.mkdirSync(`${config.serverPackagePath}`)
  }
}

/** 初始化MainWindow */
function initMainWindow() {
  // Open the DevTools.
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('close', onClose);
  mainWindow.on('closed', onClosed);
  mainWindow.webContents.on('crashed', onCrashed);
  mainWindow.webContents.on('new-window', onNewWindow);
  // mainWindow.webContents.on('will-navigate', onWillNavigate);

  //设置菜单
  // const menu = Menu.buildFromTemplate(template);
  // Menu.setApplicationMenu(menu);
  Menu.setApplicationMenu(null)
}

/** 程序崩溃 */
function onCrashed() {
  const options = {
    type: 'error',
    title: '进程崩溃了',
    message: '这个进程已经崩溃.',
    buttons: ['重载', '退出'],
  };
  let index = dialog.showMessageBoxSync(mainWindow, options)
  if (index === 0) {
    mainWindow.reload();
  } else {
    app.quit();
  }
}

/** 监听窗口关闭前 */
async function onClose(e: Event) {
  e.preventDefault();		//阻止默认行为，一定要有
  let index = dialog.showMessageBoxSync(mainWindow, {
    type: 'info',
    title: '提示',
    defaultId: 1,
    message: '确定要关闭吗？\n(如果在创作地图记得要先点击退出按钮保存哦！)',
    buttons: ['关闭', '取消'],
    cancelId: 1,
  });

  //取消
  if (index !== 0) {
    return;
  }

  //关闭native前,先检测关闭游戏服务器
  server.closeGameServer()
    .finally(() => {
      app.exit();		//exit()直接关闭客户端，不会执行quit();
    });
}

/** 监听窗口关闭时的方法 */
async function onClosed() {
  util.copyLog2UploadDir()
    .finally(async () => {
      mainWindow = null;
      config.setMainWindow(null);
    });
}

/** 拦截new-window事件，起到拦截window.open的作用 */
async function onNewWindow(event: Event, url: string) {
  // 阻止创建默认窗口
  event.preventDefault();

  logger.log('electron', `new-window: ${url}`);
  await mainWindow.loadURL(url);
}

/** native初始化 */
async function initNative() {
  logger.log('net', `urlValue: ${config.urlValue}`);
  if (!config.urlValue || config.urlValue.indexOf(config.constPseudoProtocol) < 0) {
    config.setNativeMode(define.eNativeMode.website);
  } else {
    //设置路由
    const urlObj = new URL(config.urlValue);
    const lessonRouter = urlObj.hostname;
    config.setLessonRouter(lessonRouter as define.eLessonRouter);

    logger.log('test', `router: ${config.lessonRouter}`);

    //创造地图模式
    if (config.lessonRouter === define.eLessonRouter.createMap) {
      config.setNativeMode(define.eNativeMode.createMap);
    } else if (config.lessonRouter === define.eLessonRouter.banner) {
      config.setNativeMode(define.eNativeMode.banner);
    } else if (config.lessonRouter === define.eLessonRouter.game) {
      config.setNativeMode(define.eNativeMode.game);
    } else {
      config.setNativeMode(define.eNativeMode.platform);
    }
  }


  await mainWindow.loadFile(`./dist/renderer.html`);

  logger.log('net', `config.urlValue`, config.urlValue);
  logger.log('env', `app.isPackaged:`, app.isPackaged);
  config.setIsPackaged(app.isPackaged);
  //打包后的包才要检查更新
  if (app.isPackaged) {
    message.sendIpcMsg("GET_NATIVE_POLICY_VERSION");
  }
  //没打包的直接检查游戏包更新
  else {
    message.sendIpcMsg("CHECK_PACKAGE_UPDATE");
  }
}

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
function saveProcessLog() {
  let path = dialog.showSaveDialogSync(
    {
      title: `后台进程日志另存为`,
      filters: [{ name: "process.log", extensions: ["log"] }]
    });
  let content = fs.readFileSync(config.processLogPath, 'utf-8');
  fs.writeFileSync(path, content, 'utf-8');
}