# Look At Me

_Look At Me_ is a utility app to have a floating version of you over your screen for when presenting

- [Installing](#installing)
- [Usage](#usage)
- [FAQ / Quirks](#faq)

> This is an _early_ alpha release so there will be updates in the near future

## Demo Video
![Demo video](look-at-me-001_demo.webp)
> Video is only 5fps here to save bandwidth, actual camera feed is full speed and not compressed.


----

# [Download v0.0.1](https://github.com/andersdn/lookatme/releases/download/v0.0.1/Look.At.Me-0.0.1.dmg)

# <a name="#installing"></a> Installing

Drag the app to your applications folder

> As the App is not signed, you will need to manualy trust the application using the steps below when you install it.
> If you have any concerns, all the source code is viewable

### Manually opening

You can override your security settings and allow the app to install and open.

1. Open Finder.
2. Locate the app you’re trying to open.
3. Right Click / Control+Click the app.
4. Select Open.
5. Click Open.
6. The app should be saved as an exception in your security settings, allowing you to open it in the future.

### Adding Exception

Bypass the block in your Security & Privacy settings. If the previous method didn’t work, you can go into your Security & Privacy settings and do it manually.

1. Open the Apple menu, and click System Preferences.
2. Click Security & Privacy.
3. Click the General tab.
4. Click the lock in the lower right corner of the window.
5. Enter your username and password when prompted, and click Unlock.
6. Click the App Store and Identified Developers radial button.
7. Look for “Look at me was blocked from opening because it is not from an identified developer” and click Open Anyway. (In older versions of macOS, you could click Anywhere and then click Allow From Anywhere.)
8. Try rerunning the app.

## Permissions

Provide camera permissions on launch

# <a name="#installing"></a> Usage

## Moving the window

Move the window around hovering on your floating window and dragging on the `✥` icon.

## Options

> Get to the options by using the icon in the task bar, or by right (or option+click) clicking on the window.

- 📷 Choose Camera
  -  List of cameras to choose from, if you have only one this will be selected by default
- ✨ Choose Filter:', 
    - `None` No Filter
    - `Blur (Default)` A little bit of background blur
    - `Blur More` Some more background blur
    - `Hide Background` Use AI background removal
        - This is abit janky so may be improved in a future release
- 📏 Choose Size:',
    -  What size of your webcam feed is to be used. `0.75x` is the default value
- 🤷 Recenter Window
    - If you have resized your window somtimes you can accidelty move the resize icon off screen, so this option brings it back to the ceter of your screen.
- 🐁 Ignore Mouse Events
    - Disables mouse events and locks the position of the window
- 🪞 Mirror Camera
    - Flips the camera
- ℹ️ About / Help
    - Takes you here
- 🚪 Quit
    - Cya, thanks for playing


# <a name="#faq"></a> FAQ / Quirks

- The app needs to re-launch after getting permissions so may be abit wierd on the first try
- When moving the window, sometimes you need to focus on another app and then move back to the window to get focus

