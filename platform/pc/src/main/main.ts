/** 
 * @Author 雪糕
 * @Description main主程序文件
 * @Date 2020-02-18 11:42:51
 * @FilePath \pc\src\main\main.ts
 */
// Modules to control application life and create native browser window
import { app, globalShortcut, BrowserWindow, Menu, shell, dialog, webContents } from 'electron';
import * as process from 'process';
import * as os from 'os';

import { CommonDefine } from '../common/CommonDefine';
import commonConfig from '../common/CommonConfig';
import MsgId from '../common/MsgId';

import { logger } from './logger';
import { util } from './util';
import mainModel from './MainModel';
import server from './Server';
import message from './Message';
import FileUtil from '../common/FileUtil';
import errorReportMain from "./ErrorReportMain";
import mainControl from './MainControl';

//限制只启用一个程序
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

class Main {
  private _mainWindow: BrowserWindow;

  public init(): void {
    //监听app事件
    app.on('ready', this.onAppReady.bind(this));
    app.on('second-instance', this.onAppSecondInstance.bind(this));
    app.on('window-all-closed', this.onAppWindowAllClosed.bind(this));
    app.on('activate', this.onAppActivate.bind(this));
    app.on('will-finish-launching', () => {
      app.on('open-url', this.onAppOpenUrl.bind(this));
    });
  }


  private onAppReady(): void {
    this.createWindow();

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
      this._mainWindow.webContents.openDevTools();
    });
  }

  // 当运行第二个实例时,将会聚焦到mainWindow这个窗口
  private onAppSecondInstance(tEvent: Event, tArgv: string[], tWorkingDirectory: string): void {
    if (process.platform === 'win32') {
      this.onGotTheLock(tArgv[tArgv.length - 1]);
    }
  }

  /** 当打开url时 */
  private onAppOpenUrl(tEvent: Event, tUrl: string): void {
    tEvent.preventDefault();
    logger.log('main', `open-url, event`, tUrl);
    this.onGotTheLock(tUrl);
  }

  /** 拦截第二个实例 */
  private async onGotTheLock(tUrl: string): Promise<void> {
    logger.log('electron', `运行第二个实例`);
    /** 设置url参数 */
    mainModel.setUrlValue(tUrl);

    if (this._mainWindow) {
      if (this._mainWindow.isMinimized()) {
        this._mainWindow.restore();
      }
      this._mainWindow.focus();
      this._mainWindow.show();
      logger.log('electron', `显示当前主窗口`);

      // 关闭之前的服务器
      await server.closeGameServer();

      await this.initNative();
    }
  }

  private onAppWindowAllClosed(): void {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
  }

  private onAppActivate(): void {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (this._mainWindow === null) this.createWindow();
  }

  //创建游戏浏览窗口
  private async createWindow(): Promise<void> {
    this._mainWindow = new BrowserWindow({
      width: 1600,
      height: 900,
      webPreferences: {
        preload: `${commonConfig.rootPath}/dist/renderer-bundle.js`,
        nodeIntegration: true,
        webSecurity: false
      }
    });

    //错误上报初始化
    errorReportMain.init();
    mainModel.setMainWindow(this._mainWindow);

    //创建游戏包目录
    this.packageMkDir();

    //添加ua
    const userAgent = this._mainWindow.webContents.userAgent + " BellCodeIpadWebView BellplanetNative";
    this._mainWindow.webContents.userAgent = userAgent;

    /** 设置url参数 */
    if (os.platform() === "win32") {
      mainModel.setUrlValue(process.argv.splice(app.isPackaged ? 1 : 2).join(""));
    }

    logger.log('main', `收到参数1: ${JSON.stringify(process.argv)}`);

    //初始化消息处理类
    message.init();

    //初始化主进程控制逻辑
    mainControl.init();

    //只有打包后的要上传日志
    if (commonConfig.isPackaged) {
      util.uploadLogFileList();
    }

    await this.initNative();

    //初始化MainWindow
    this.initMainWindow();
  }

  /** 创建游戏包目录 */
  private packageMkDir(): void {
    // 判断创建文件
    if (!FileUtil.existsSync(commonConfig.packagePath)) {
      FileUtil.ensureDirSync(commonConfig.packagePath);
    }

    if (!FileUtil.existsSync(commonConfig.clientPackagePath)) {
      FileUtil.ensureDirSync(commonConfig.clientPackagePath);
    }

    if (!FileUtil.existsSync(commonConfig.serverPackagePath)) {
      FileUtil.ensureDirSync(commonConfig.serverPackagePath);
    }
  }

  /** 初始化MainWindow */
  private initMainWindow(): void {
    // Open the DevTools.
    if (!app.isPackaged) {
      this._mainWindow.webContents.openDevTools();
    }

    this._mainWindow.on('close', this.onClose);
    this._mainWindow.on('closed', this.onClosed);
    this._mainWindow.webContents.on('crashed', this.onCrashed);
    this._mainWindow.webContents.on('new-window', this.onNewWindow);

    //设置菜单
    const template = [
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
            accelerator: ((): string => {
              if (process.platform === 'darwin') {
                return 'Alt+Command+I';
              } else {
                return 'Ctrl+Shift+I';
              }
            })(),
            click: (tItem: unknown, tFocusedWindow: webContents): void => {
              if (tFocusedWindow) {
                tFocusedWindow.toggleDevTools();
              }
            }
          },
          {
            label: '下载服务器日志',
            click: this.saveProcessLog
          },
          {
            label: '关于',
            click: (): void => {
              shell.openExternal('http://www.bellcode.com');
            }
          }
        ]
      }
    ];
    // const menu = Menu.buildFromTemplate(template);
    // Menu.setApplicationMenu(menu);
    Menu.setApplicationMenu(null);
  }

  /** 程序崩溃 */
  private onCrashed(): void {
    const options = {
      type: 'error',
      title: '进程崩溃了',
      message: '这个进程已经崩溃.',
      buttons: ['重载', '退出'],
    };
    const index = dialog.showMessageBoxSync(this._mainWindow, options);
    if (index === 0) {
      //重载以前,先检测关闭游戏服务器
      server.closeGameServer()
        .finally(() => {
          this._mainWindow.reload();
        });
    } else {
      app.quit();
    }
  }

  /** 监听窗口关闭前 */
  private onClose(tEvt: Event): void {
    tEvt.preventDefault();		//阻止默认行为，一定要有
    //如果安装native更新包,不用提示,直接退出
    if (mainModel.isQuitAndInstall) {
      app.exit();
      return;
    }

    const index = dialog.showMessageBoxSync(this._mainWindow, {
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
  private onClosed(): void {
    util.copyLog2UploadDir()
      .finally((): void => {
        this._mainWindow = null;
        mainModel.setMainWindow(null);
      });
  }

  /** 拦截new-window事件，起到拦截window.open的作用 */
  private async onNewWindow(tEvent: Event, tUrl: string): Promise<void> {
    // 阻止创建默认窗口
    tEvent.preventDefault();

    logger.log('electron', `new-window: ${tUrl}`);
    await this._mainWindow.loadURL(tUrl);
  }

  /** native初始化 */
  private async initNative(): Promise<void> {
    mainModel.setBellplanetReady(false);

    logger.log('net', `urlValue: ${mainModel.urlValue}`);
    if (!mainModel.urlValue || mainModel.urlValue.indexOf(commonConfig.constPseudoProtocol) < 0) {
      mainModel.setNativeMode(CommonDefine.eNativeMode.website);
    } else {
      //设置路由
      const urlObj = new URL(mainModel.urlValue);
      const lessonRouter = urlObj.hostname;
      mainModel.setLessonRouter(lessonRouter as CommonDefine.eLessonRouter);

      logger.log('test', `router: ${mainModel.lessonRouter}`);

      //根据路由初始化native模式
      this.initNativeMode(mainModel.lessonRouter);
    }

    await this._mainWindow.loadFile(`${commonConfig.rootPath}/dist/renderer.html`);

    logger.log('net', `config.urlValue`, mainModel.urlValue);
    logger.log('env', `app.isPackaged:`, commonConfig.isPackaged);

    /** 清除渲染层数据 */
    message.sendIpcMsg(MsgId.CLEAR_RENDERER_MODEL_DATA);

    //打包后的包才要检查更新
    if (commonConfig.isPackaged) {
      message.sendIpcMsg(MsgId.GET_NATIVE_POLICY_VERSION);
    }
    //没打包的直接检查游戏包更新
    else {
      message.sendIpcMsg(MsgId.CHECK_PACKAGE_UPDATE);
    }
  }

  /** 根据路由初始化native模式 */
  private initNativeMode(tRouter: CommonDefine.eLessonRouter): void {
    switch (tRouter) {
      //创造地图模式
      case CommonDefine.eLessonRouter.createMap:
        mainModel.setNativeMode(CommonDefine.eNativeMode.createMap);
        break;
      //banner模式
      case CommonDefine.eLessonRouter.banner:
        mainModel.setNativeMode(CommonDefine.eNativeMode.banner);
        break;
      //游戏模式
      case CommonDefine.eLessonRouter.game:
        mainModel.setNativeMode(CommonDefine.eNativeMode.game);
        break;
      //指定url模式
      case CommonDefine.eLessonRouter.url:
        mainModel.setNativeMode(CommonDefine.eNativeMode.url);
        break;
      //进入指定地图模板
      case CommonDefine.eLessonRouter.enterPrestigeMap:
        mainModel.setNativeMode(CommonDefine.eNativeMode.prestigeMap);
        break;
      default:
        this._mainWindow.setFullScreen(false);
        mainModel.setNativeMode(CommonDefine.eNativeMode.platform);
        break;
    }
  }

  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and require them here.


  //保存日志文件方法
  private saveProcessLog(): void {
    const path = dialog.showSaveDialogSync(
      {
        title: `后台进程日志另存为`,
        filters: [{ name: "process.log", extensions: ["log"] }]
      });
    const content = FileUtil.readFileSync(commonConfig.processLogPath, 'utf-8');
    FileUtil.writeFileSync(path, content, 'utf-8');
  }
}

const main = new Main();
main.init();
