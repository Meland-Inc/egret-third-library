/**
 * @author 雪糕 
 * @desc main主程序文件
 * @date 2020-02-18 11:42:51 
 * @Last Modified by: 雪糕
 * @Last Modified time: 2020-03-26 20:47:19
 */
// Modules to control application life and create native browser window
import { app, globalShortcut, BrowserWindow, Menu, shell, dialog, session, Referrer, BrowserWindowConstructorOptions } from 'electron';
import * as fs from 'fs';
import * as process from 'process';


import { define } from './define';
import { logger } from './logger';
import config from './Config';
import server from './Server';
import message from './Message';
import NativeUpdate from './NativeUpdate';
import { util } from './util';

//限制只启用一个程序
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow: BrowserWindow;
let nativeUpdate: NativeUpdate = new NativeUpdate();

//监听app事件
app.on('ready', onAppReady);
app.on('second-instance', onAppSecondInstance);
app.on('open-url', onAppOpenUrl);
app.on('window-all-closed', onAppWindowAllClosed);
app.on('activate', onAppActivate);

function onAppReady() {
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
}

// 当运行第二个实例时,将会聚焦到mainWindow这个窗口
function onAppSecondInstance(event: Event, argv: string[], workingDirectory: string) {
  if (process.platform === 'win32') {
    onGotTheLock(argv[argv.length - 1]);
  }
}

/** 当打开url时 */
function onAppOpenUrl(event: Event, url: string) {
  onGotTheLock(url);
}

/** 拦截第二个实例 */
async function onGotTheLock(url: string) {
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
  config.setUrlValue(process.argv[process.argv.length - 1]);

  /** 初始化消息处理类 */
  message.init();

  //日志初始化
  logger.init();
  logger.log('main', `收到参数1: ${JSON.stringify(process.argv)}`);

  //初始化全局配置
  await util.initGlobalConfig();

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
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', onClosed);
  mainWindow.webContents.on('crashed', onCrashed);
  mainWindow.webContents.on('new-window', onNewWindow);
  mainWindow.webContents.on('will-navigate', onWillNavigate);

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

/** 监听窗口关闭 */
async function onClosed() {
  mainWindow = null;
  config.setMainWindow(null);
  await server.closeGameServer();
}

/** 拦截new-window事件，起到拦截window.open的作用 */
async function onNewWindow(event: Event, url: string) {
  // 阻止创建默认窗口
  event.preventDefault();

  logger.log('electron', `new-window: ${url}`);
  await mainWindow.loadURL(url);
}

/** 拦截will-navigate事件，起到拦截window.location.href = xxx的作用 */
async function onWillNavigate(event: Event, url: string) {
  logger.log('electron', `will-navigate url: ${url}`);
  const newURL = new URL(url);
  const hash = newURL.hash;
  //江哥写的特殊处理平台locationBuilder的代码
  const searchParams = (new URL(`https://bai.com${hash.slice(1)}`)).searchParams;

  const tokenField = "webviewToken";
  if (newURL.searchParams.has(tokenField)
    || searchParams.has(tokenField)
  ) {
    return;
  }

  logger.log('platform', `config.environName`, config.environName);

  // 阻止创建默认窗口
  event.preventDefault();

  if (config.bellToken) {
    newURL.searchParams.set(tokenField, config.bellToken);
  } else {
    if (config.environName) {
      logger.log('token', '浏览器参数内不存在token, 查找cookie看是否有参数')
      let cookies = await session.defaultSession.cookies.get({});
      let domain: string;
      if (config.environName === define.eEnvironName.ready) {
        domain = config.readyTokenDomain;
      } else {
        domain = config.releaseTokenDomain;
      }

      let cookie = cookies.find(value => value.name === "token" && value.domain === domain);
      if (cookie) {
        let token = cookie.value;
        logger.log('token', `cookie内存在token:${token}`);
        config.setBellToken(token);
        newURL.searchParams.set(tokenField, token);
      }
    }
  }

  logger.log('electron', `will-navigate newURL: ${newURL}`);
  await mainWindow.loadURL(newURL.toString());
}

/** native初始化 */
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
  logger.log('env', `app.isPackaged:`, app.isPackaged);
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