'use strict'

import { app, protocol, BrowserWindow, Tray, Menu, MenuItem, shell, globalShortcut, ipcMain} from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import { initExtra } from "@/utils/backgroundExtra";
import path from 'path'
const isDevelopment = process.env.NODE_ENV !== 'production'

import pkg from '../package.json'

let tray = null
let win;
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])


async function createWindow() {
  // Create the browser window.
   win = new BrowserWindow({
    width: 400,
    height: 600,
    frame:false,
   // skipTaskbar: true,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    transparent: true,
    backgroundColor: '#00000000',
    //backgroundColor: '#00000080',
    icon: path.join(__static,'favicon.ico'),
    webPreferences: {
       nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
       contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
 // win.flashFrame(true)
}

function getOpenAtLogin(){
  if(app.isPackaged){
    const { openAtLogin } = app.getLoginItemSettings();
    return openAtLogin
  }else {
    const { openAtLogin } = app.getLoginItemSettings({
      path: process.execPath,
      args: [path.resolve(process.argv[1])]
    })
    return openAtLogin
  }
}
function setOpenAtLogin(openAtLogin){
  if(app.isPackaged){
      app.setLoginItemSettings({
        openAtLogin: openAtLogin
      })
  }else {
    app.setLoginItemSettings({
      openAtLogin: openAtLogin,
      openAsHidden: false,
      path: process.execPath,
      args: [path.resolve(process.argv[1])],
    })
  }
}

function createTray(){
  tray = new Tray(path.resolve(__static,'favicon.ico'))
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "开机启动",
      type: "checkbox",
      checked: getOpenAtLogin(),
      click: ()=> {
        const openAtLogin = getOpenAtLogin();
        setOpenAtLogin(!openAtLogin);
      },
    },
    {
      label: "项目地址",
      click: () => {
        shell.openExternal("https://cn.bing.com");
        }
    },
    {
        label: "问题反馈",
        click: () => {
          shell.openExternal("https://cn.bing.com");
        }
      },
      {
          label: "退出",
          click: ()=>{
            app.exit()
          }
      },
  ])
  tray.setContextMenu(contextMenu)
  tray.on('click',()=>{
    win.show()
  })
}

function registerDevTools(){
  globalShortcut.register('CommandOrControl+Shift+i',function(){
    win.webContents.openDevTools()
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  registerDevTools()
  createWindow()
  initExtra()
  createTray()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
ipcMain.handle('hideWindow',(event)=>{
    win.minimize();
})
ipcMain.handle('setIgnoreMouseEvents',(event,ignore)=>{
  if (ignore) win.setIgnoreMouseEvents(true, { forward: true });
  else win.setIgnoreMouseEvents(false);
})
