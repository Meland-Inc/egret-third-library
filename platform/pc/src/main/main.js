// Modules to control application life and create native browser window
const { app, globalShortcut, BrowserWindow, Menu, shell, dialog } = require('electron')
const path = require('path')
const fs = require('fs');

const util = require('./util.js');
const config = require('./config.js');
const index = require('./index.js');

let mainWindow
async function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  });

  index.init(mainWindow);

  // and load the index.html of the app.

  // logger.log('net', '跳转到游戏渲染地址');
  // let clientArg = `&fakeGameMode=lessons&pcNative=1`;
  // let rendererPath = `${config.rootPath}/src/renderer/renderer.html?${clientArg}`;
  // window.location.href = rendererPath;

  mainWindow.loadFile(`${config.rootPath}/src/renderer/renderer.html`, { query: { fakeGameMode: "lessons", pcNative: 1 } });
  // mainWindow.loadFile(`${config.rootPath}/src/main/index.html`);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    util.closeGameServer();
    mainWindow = null;
  })

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
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

async function saveProccessLog() {
  let path = await dialog.showSaveDialogSync(
    // mainWindow,
    {
      title: `后台进程日志另存为`,
      filters: [{ name: "process.log", extensions: ["log"] }]
    });
  let content = await fs.readFileSync(config.processLogPath, 'utf-8');
  let result = await fs.writeFileSync(path, content, 'utf-8');
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
      },
      // {
      //   label: '查看版本',
      //   click: () => {
      //     mainWindow.webContents.send("client_show_version");
      //     console.log('send client_show_version');
      //   }
      // }
    ]
  }
]