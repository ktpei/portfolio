# Desktop folders and wallpapers

Native macOS is the 1:1 reference for desktop icons, window chrome, selection, and keyboard and pointer behavior. The folder launchers sit directly on the portfolio desktop. [Apple's Designing for macOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-macos)

The portfolio uses a Mac Stickies-style desktop. **Wallpapers** starts at the top of the left-side folder column. Click once to select a folder and double-click to open it. On touch devices, tap once. When a folder has keyboard focus, Enter, Space, Command-O, and Command-Down Arrow open it. Browse thumbnails, choose an image, shuffle on demand, or restore the default background. Shuffle skips the current image. The selected background applies to both desktops and survives refresh in the current browser.

## Desktop folders

**Wallpapers**, **Files**, and **Archive** share the supplied [`desktop-folder.png`](../public/desktop-folder.png) sprite and start 100 px apart vertically with 64 px icons on wide screens. They stay attached to the portfolio desktop when switching to the Ideas Board. Drag a folder to move it, or focus it and use the arrow keys. The browser restores each saved position before showing its folder. **Archive** is empty.

**Files** contains a link to [Kevin's résumé PDF](../public/files/Kevin-Pei-Resume.pdf), which opens in a new tab. Click outside an open desktop folder window or press Escape to close it.

## Wallpaper collection

Folder labels sit directly on the desktop with a text shadow for contrast. The Idea Board and Portfolio shortcuts also sit directly on the wallpaper.

The site serves optimized WebP copies from `public/wallpapers`. The collection includes all 12 Banshees of Inisherin images and Miyazaki images 1, 2, 3, and 5. The Miyazaki numbers come from sorting the original image filenames. Entry 4 is `wp4409084.jpg` and entry 6 is `wp9853204.webp`. The original files were kept intact.

## Placement history

The first picker opened from the menu bar. It then moved to the left side of the desktop, where the folder's row shifted the content below it. The folder now uses absolute positioning within the portfolio desktop.
