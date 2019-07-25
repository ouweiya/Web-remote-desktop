const { app, BrowserWindow } = require('electron');
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
// process.env.NODE_ENV === 'dev' && require('electron-reload')(__dirname);
// const { ipcMain } = require('electron');
// const robot = require('robotjs');

let win;
const createWindow = _ => {
  win = new BrowserWindow({
    width: 1200,
    height: 900,
    transparent: false,
    webPreferences: {
      nodeIntegration: true,
      preload: __dirname + '/preload.js'
    }
  });

  process.env.NODE_ENV === 'dev'
    ? win.loadURL('http://localhost:3000')
    : win.loadURL(`file://${process.resourcesPath}/build/index.html`);

  win.webContents.openDevTools();
  win.on('closed', _ => (win = null));

  const React = `C:/Users/dell/AppData/Local/Google/Chrome/User Data/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/3.6.0_0`;
  // const Redux = `C:/Users/dell/AppData/Local/Google/Chrome/User Data/Default/Extensions/lmhkpmbekcpmknklioeibfkpmmfibljd/2.17.0_0`;
  BrowserWindow.addDevToolsExtension(React);
  // BrowserWindow.addDevToolsExtension(Redux);
  // BrowserWindow.removeExtension('Redux DevTools');
  // BrowserWindow.removeExtension('Translation fix');

  console.log(BrowserWindow.getExtensions());
};

app.on('ready', createWindow);
app.on('window-all-closed', _ => process.platform !== 'darwin' && app.quit());
app.on('activate', _ => win === null && createWindow());

// 在主进程中.

// ipcMain.on('one', (event, arg) => {
//   console.log(arg);
//   event.reply('two', 'Jack');
// });

// ipcMain.on('one', (event, arg) => {
//   console.log(arg);
//   event.returnValue = 'Good';
// });
