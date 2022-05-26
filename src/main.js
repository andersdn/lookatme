// Modules to control application life and create native browser window
const { shell, app, ipcMain, Menu, Tray, BrowserWindow, systemPreferences } = require('electron');
const path = require('path');
const contextMenu = require('electron-context-menu');
const is_mac = process.platform === 'darwin';

let mainWindow = '';
// set globals
global.selectedSize = 0.5;
global.selectedCamera = false;
global.selectedFilter = 'blur';
global.prevCameraList = null;
global.selectedIgnoreMouse = false;
global.tray = null;

const iconPath = path.join(__dirname, 'iconTemplate.png');
global.deviceList = [{ label: 'Loading Cameras...', enabled: false }];

if (is_mac) {
  // https://syobochim.medium.com/electron-keep-apps-on-top-whether-in-full-screen-mode-or-on-other-desktops-d7d914579fce
  app.dock.hide();
}

async function askForMediaAccess(){
  try {
    if (process.platform !== "darwin") {
      return true;
    }

    const status = await systemPreferences.getMediaAccessStatus("camera");
    console.info("Current camera access status:", status);

    if (status === "not-determined") {
      const success = await systemPreferences.askForMediaAccess("camera");
      console.info("Result of camera access:", success.valueOf() ? "granted" : "denied");

      app.relaunch();
      app.exit();

      return success.valueOf();
    }

    return status === "granted";
  } catch (error) {
    console.error("Could not get camera permission:", error.message);
  }
  return false;
}

app.whenReady().then(async () => {

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    alwaysOnTop: true,
    transparent: true,
    frame: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
    icon: iconPath
  });
  mainWindow.setIcon(iconPath);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.setSize(640, 480);
  mainWindow.setResizable(false); // todo: change if resizing is a thing
  // and load the index.html of the app.
  mainWindow.loadFile('index.html');
  

  await askForMediaAccess();

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()



  const setFilter = (filterName) => {
    global.selectedFilter = filterName;
    mainWindow.webContents.send('set-filter', filterName);
  };
  const setCamera = (cameraName) => {
    global.selectedCamera = cameraName;
    mainWindow.webContents.send('set-camera', cameraName);
  };
  const toggleIgnoreMouse = () => {
    global.selectedIgnoreMouse = !global.selectedIgnoreMouse;
    mainWindow.setIgnoreMouseEvents(global.selectedIgnoreMouse);
    mainWindow.webContents.send('set-ignore-mouse', global.selectedIgnoreMouse);
  }
  const setSize = (sizeVal) => {
    global.selectedSize = sizeVal;
    mainWindow.center();
    mainWindow.webContents.send('set-size', sizeVal);
  };


  const menuOptions = ()=>{
    return [
    { label: 'Look At Me', enabled: false },
    { type: 'separator' },
    { label: '📷 Choose Camera:', submenu: [...deviceList] },
    { label: '✨ Choose Filter:', 
    submenu: [
    {
      click: () => setFilter('none'),
      label: 'None',
      type: 'radio',
      checked: global.selectedFilter == 'none',
    },
    {
      click: () => setFilter('blur'),
      label: 'Blur (Default)',
      type: 'radio',
      checked: global.selectedFilter == 'blur',
    },
    {
      click: () => setFilter('blurblur'),
      label: 'Blur More',
      type: 'radio',
      checked: global.selectedFilter == 'blurblur',
    },
    {
      click: () => setFilter('clip'),
      label: 'Hide Background',
      type: 'radio',
      checked: global.selectedFilter == 'clip',
    }
    ]},
    {
      label: '📏 Choose Size:',
      submenu: [
        {
          click: () => setSize(2),
          label: '2x',
          type: 'radio',
          checked: global.selectedFilter == 2,
        },
        {
          click: () => setSize(1.5),
          label: '1.5x',
          type: 'radio',
          checked: global.selectedSize == 1.5,
        },
        {
          click: () => setSize(1),
          label: '1',
          type: 'radio',
          checked: global.selectedSize == 1,
        },
        {
          click: () => setSize(0.75),
          label: '0.75x',
          type: 'radio',
          checked: global.selectedSize == 0.75,
        },
        {
          click: () => setSize(0.5),
          label: '0.5x',
          type: 'radio',
          checked: global.selectedSize == 0.5,
        },
        {
          click: () => setSize(0.25),
          label: '0.25x',
          type: 'radio',
          checked: global.selectedSize == 0.25,
        },
      ],
    },
    { label: '🤷 Recenter Window', click : ()=>mainWindow.center()},
    {
      click: () => toggleIgnoreMouse(),
      label: '🐁 Ignore Mouse Events',
      type: 'checkbox',
      checked: !!global.selectedIgnoreMouse,
    },
    { type: 'separator' },
    { label: 'ℹ️ About / Help', role: 'help', click : ()=>shell.openExternal('https://andersdn.github.io/lookatme/')},
    { label: '🚪 Quit', accelerator: 'CommandOrControl+Q', role: 'quit' },
  ]};

  // the tray menu
  tray = new Tray(iconPath);

  const SetTray = () => {
    if (prevCameraList) {
      global.deviceList = prevCameraList.map((c, i) => {
        return {
          click: () => setCamera(c.deviceId),
          label: c.label,
          type: 'radio',
          checked: selectedCamera == c.deviceId,
        };
      });
    }

    const contextMenu = Menu.buildFromTemplate(menuOptions());
    tray.setContextMenu(contextMenu);
  };

  const SetRightClickContextMenu = () => {
    contextMenu({
      prepend: (params, browserWindow) => menuOptions()
    });
  }

  const SetMenus = () => {
    SetTray();
    SetRightClickContextMenu();
  }
  
  
  

  ipcMain.on('camera-list', async (event, data) => {
    let cameraList = JSON.parse(data);
    // debuounce the camera list
    global.prevCameraList = cameraList;
    SetMenus();
    await askForMediaAccess();
  });

  ipcMain.on('set-size', async (event, data) => {
    let sizeObj = JSON.parse(data);
    mainWindow.setSize(sizeObj.width, sizeObj.height);
    global.selectedSize = sizeObj.selectedSize;
    SetMenus();
  });

  ipcMain.on('update-settings', async (event, data) => {
    let settingsObj = JSON.parse(data);
    global.selectedSize = settingsObj.selectedSize;
    global.selectedCamera = settingsObj.selectedCamera;
    global.selectedFilter = settingsObj.selectedFilter;
    global.selectedIgnoreMouse = settingsObj.selectedIgnoreMouse;
    SetMenus();
    await askForMediaAccess();
  });

  // should be in update settings
  // ipcMain.on('set-ignore-mouse', async (event, mouseVal) => {
  //   global.ignoreMouse = mouseVal;
  //   mainWindow.setIgnoreMouseEvents(mouseVal);
  //   SetMenus();
  // });
  

});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  app.quit();
});
