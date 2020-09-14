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

import commonConfig from '../common/CommonConfig';

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
let isSecondInstance: boolean = false;
if (!gotTheLock) {
  isSecondInstance = true;
  app.quit();
}

class Main {
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

    let shortCut = "";
    if (process.platform === 'darwin') {
      shortCut = 'Alt+Command+I';
    } else {
      shortCut = 'Ctrl+Shift+I';
    }
    globalShortcut.register(shortCut, () => {
      mainModel.mainWindow.webContents.openDevTools();
    });
  }

  // 当运行第二个实例时,将会聚焦到mainWindow这个窗口
  private onAppSecondInstance(tEvent: Event, tArgv: string[], tWorkingDirectory: string): void {
    if (process.platform === 'win32') {
      this.showSecondInstanceAlert();
    }
  }

  /** 当打开url时 */
  private onAppOpenUrl(tEvent: Event, tUrl: string): void {
    tEvent.preventDefault();
    if (!mainModel.mainWindow) {
      if (tUrl) {
        try {
          const url = new URL(tUrl);
          mainModel.setFakeProtoURL(url);
        } catch {

        }
      }
      return;
    }
    this.showSecondInstanceAlert();
  }

  private showSecondInstanceAlert(): void {
    const options = {
      type: 'warning',
      title: '提示',
      message: '小贝星球星球正在运行中!',
      buttons: ['确定'],
    };
    dialog.showMessageBoxSync(mainModel.mainWindow, options);
  }

  private onAppWindowAllClosed(): void {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit();
  }

  private onAppActivate(): void {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainModel.mainWindow === null) this.createWindow();
  }

  //创建游戏浏览窗口
  private async createWindow(): Promise<void> {
    //优先设置url参数, 因为参数里带有当前环境参数
    logger.log('main', `收到参数: ${JSON.stringify(process.argv)}`);
    //优先设置url参数, 因为参数里带有当前环境参数
    if (os.platform() === "win32") {
      const urlValue = process.argv.concat().splice(app.isPackaged ? 1 : 2).join("");
      if (urlValue && urlValue !== "--updated") {
        logger.log('main', `setFakeProtoUrl value: ${urlValue}`);
        try {
          const url = new URL(urlValue);
          mainModel.setFakeProtoURL(url);
        } catch (error) {
          logger.error('main', `setFakeProtoUrl error: ${urlValue}`);
        }
      }
    }

    const mainWindow = new BrowserWindow({
      width: 1600,
      height: 900,
      webPreferences: {
        preload: `${commonConfig.rootPath}/dist/renderer-bundle.js`,
        nodeIntegration: true,
        nodeIntegrationInSubFrames: true,
        webSecurity: false
      }
    });

    //错误上报初始化
    errorReportMain.init();
    mainModel.setMainWindow(mainWindow);

    //添加ua
    const userAgent = mainModel.mainWindow.webContents.userAgent + " BellCodeIpadWebView BellplanetNative";
    mainModel.mainWindow.webContents.userAgent = userAgent;


    logger.log('main', `收到参数1: ${JSON.stringify(process.argv)}`);

    //初始化消息处理类
    message.init();

    //初始化主进程控制逻辑
    await mainControl.init();

    //初始化MainWindow
    this.initMainWindow();
  }

  /** 初始化MainWindow */
  private initMainWindow(): void {
    // Open the DevTools.
    if (!app.isPackaged) {
      mainModel.mainWindow.webContents.openDevTools();
    }

    mainModel.mainWindow.on('close', this.onClose);
    mainModel.mainWindow.on('closed', this.onClosed);
    mainModel.mainWindow.webContents.on('crashed', this.onCrashed);
    mainModel.mainWindow.webContents.on('new-window', this.onNewWindow);

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
    const index = dialog.showMessageBoxSync(mainModel.mainWindow, options);
    if (index === 0) {
      //重载以前,先检测关闭游戏服务器
      server.closeGameServer()
        .finally(() => {
          mainModel.mainWindow.reload();
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

    const index = dialog.showMessageBoxSync(mainModel.mainWindow, {
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
        mainModel.setMainWindow(null);
      });
  }

  /** 拦截new-window事件，起到拦截window.open的作用 */
  private async onNewWindow(tEvent: Event, tUrl: string): Promise<void> {
    // 阻止创建默认窗口
    tEvent.preventDefault();

    logger.log('electron', `new-window: ${tUrl}`);
    await mainModel.mainWindow.loadURL(tUrl);
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

//初始化方法
function init(): void {
  if (isSecondInstance) return;
  const main = new Main();
  main.init();
}

//初始化
init();