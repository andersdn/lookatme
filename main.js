// Modules to control application life and create native browser window
const { shell, app, ipcMain, Menu, Tray, BrowserWindow, systemPreferences } = require('electron');
const path = require('path');
const is_mac = process.platform === 'darwin';

let mainWindow = '',
  selectedSize = 1,
  selectedCamera = false,
  selectedFilter = false,
  prevCameraList,
  tray = null;
const iconPath = path.join(__dirname, 'icon.png');
let deviceList = [{ label: 'Loading Cameras...', enabled: false }];

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
    mainWindow.webContents.send('set-filter', filterName);
  };
  const setCamera = (cameraName) => {
    selectedCamera = cameraName;
    mainWindow.webContents.send('set-camera', cameraName);
  };
  const setSize = (sizeVal) => {
    mainWindow.webContents.send('set-size', sizeVal);
  };

  // the tray menu
  tray = new Tray(iconPath);

  const SetTray = () => {
    if (prevCameraList) {
      deviceList = prevCameraList.map((c, i) => {
        return {
          click: () => setCamera(c.deviceId),
          label: c.label,
          type: 'radio',
          checked: selectedCamera == c.deviceId,
        };
      });
    }

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Look At Me', enabled: false },
      { type: 'separator' },
      { label: 'Choose Camera:', enabled: false },
      ...deviceList,
      { type: 'separator' },
      { label: 'Choose View:', enabled: false },
      {
        click: () => setFilter('none'),
        label: 'None (Default)',
        type: 'radio',
        checked: selectedFilter == 'none',
      },
      {
        click: () => setFilter('blur'),
        label: 'Blur',
        type: 'radio',
        checked: selectedFilter == 'blur',
      },
      {
        click: () => setFilter('blurblur'),
        label: 'Blur More',
        type: 'radio',
        checked: selectedFilter == 'blurblur',
      },
      {
        click: () => setFilter('clip'),
        label: 'Hide Background ᴮᴱᵀᴬ',
        type: 'radio',
        checked: selectedFilter == 'clip',
      },
      { type: 'separator' },
      {
        label: 'Choose Size:',
        submenu: [
          {
            click: () => setSize(2),
            label: '2x',
            type: 'radio',
            checked: selectedFilter == 2,
          },
          {
            click: () => setSize(1.5),
            label: '1.5x',
            type: 'radio',
            checked: selectedSize == 1.5,
          },
          {
            click: () => setSize(1),
            label: 'Default',
            type: 'radio',
            checked: selectedSize == 1,
          },
          {
            click: () => setSize(0.75),
            label: '0.75x',
            type: 'radio',
            checked: selectedSize == 0.75,
          },
          {
            click: () => setSize(0.5),
            label: '0.5x',
            type: 'radio',
            checked: selectedSize == 0.5,
          },
          {
            click: () => setSize(0.25),
            label: '0.25x',
            type: 'radio',
            checked: selectedSize == 0.25,
          },
        ],
      },
      { type: 'separator' },
      { label: 'Help', role: 'help', click : ()=>shell.openExternal('https://andersdn.github.io/lookatme/')},
      { label: 'Quit', accelerator: 'CommandOrControl+Q', role: 'quit' },
    ]);
    tray.setContextMenu(contextMenu);
  };

  SetTray();

  ipcMain.on('camera-list', async (event, data) => {
    let cameraList = JSON.parse(data);
    // debuounce the camera list
    prevCameraList = cameraList;
    SetTray();
    await askForMediaAccess();
  });

  ipcMain.on('set-size', async (event, data) => {
    let sizeObj = JSON.parse(data);
    mainWindow.setSize(sizeObj.width, sizeObj.height);
    selectedSize = sizeObj.selectedSize;
    SetTray();
  });

  ipcMain.on('update-settings', async (event, data) => {
    let settingsObj = JSON.parse(data);
    selectedSize = settingsObj.selectedSize;
    selectedCamera = settingsObj.selectedCamera;
    selectedFilter = settingsObj.selectedFilter;
    SetTray();
    await askForMediaAccess();

  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  app.quit();
});
