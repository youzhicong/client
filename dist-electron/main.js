import { app, Menu, BrowserWindow } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname$1 = dirname(fileURLToPath(import.meta.url));
process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
const isMac = process.platform === "darwin";
const menuTemplate = [
  ...isMac ? [
    {
      label: app.name,
      submenu: [
        { role: "about", label: "关于" },
        { type: "separator" },
        { role: "hide", label: "隐藏" },
        { role: "hideOthers", label: "隐藏其他" },
        { role: "unhide", label: "显示全部" },
        { type: "separator" },
        { role: "quit", label: "退出" }
      ]
    }
  ] : [],
  {
    label: "文件",
    submenu: [{ role: "close", label: "关闭窗口" }]
  },
  {
    label: "编辑",
    submenu: [
      { role: "undo", label: "撤销" },
      { role: "redo", label: "重做" },
      { type: "separator" },
      { role: "cut", label: "剪切" },
      { role: "copy", label: "复制" },
      { role: "paste", label: "粘贴" },
      { role: "selectAll", label: "全选" }
    ]
  },
  {
    label: "查看",
    submenu: [
      { role: "reload", label: "重新加载" },
      { role: "forceReload", label: "强制重新加载" },
      { role: "toggleDevTools", label: "开发者工具" },
      { type: "separator" },
      { role: "resetZoom", label: "重置缩放" },
      { role: "zoomIn", label: "放大" },
      { role: "zoomOut", label: "缩小" },
      { type: "separator" },
      { role: "togglefullscreen", label: "全屏" }
    ]
  },
  {
    label: "窗口",
    submenu: [
      { role: "minimize", label: "最小化" },
      { role: "zoom", label: "缩放" },
      ...isMac ? [{ type: "separator" }, { role: "front", label: "全部置顶" }] : [{ role: "close", label: "关闭" }]
    ]
  },
  {
    label: "帮助",
    submenu: [{ role: "toggleDevTools", label: "开发者工具" }]
  }
];
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    //图标
    icon: join(__dirname$1, "../public/favicon.ico")
  });
  const prodWebUrl = process.env.VITE_PROD_WEB_URL;
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    if (process.env.VITE_OPEN_DEVTOOLS === "true") {
      win.webContents.openDevTools();
    }
  } else if (prodWebUrl) {
    win.loadURL(prodWebUrl);
  } else {
    win.loadFile(join(__dirname$1, "../dist/index.html"));
  }
};
app.whenReady().then(() => {
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
