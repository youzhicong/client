import { app as o, Menu as t, BrowserWindow as i } from 'electron'
import { readFileSync as b, existsSync as p } from 'node:fs'
import { dirname as m, join as a } from 'node:path'
import { fileURLToPath as u } from 'node:url'
const r = m(u(import.meta.url))
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
const n = process.platform === 'darwin',
  d = [
    ...(n
      ? [
          {
            label: o.name,
            submenu: [
              { role: 'about', label: '关于' },
              { type: 'separator' },
              { role: 'hide', label: '隐藏' },
              { role: 'hideOthers', label: '隐藏其他' },
              { role: 'unhide', label: '显示全部' },
              { type: 'separator' },
              { role: 'quit', label: '退出' }
            ]
          }
        ]
      : []),
    {
      label: '文件',
      submenu: [{ role: 'close', label: '关闭窗口' }]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '查看',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: '缩放' },
        ...(n
          ? [{ type: 'separator' }, { role: 'front', label: '全部置顶' }]
          : [{ role: 'close', label: '关闭' }])
      ]
    },
    {
      label: '帮助',
      submenu: [{ role: 'toggleDevTools', label: '开发者工具' }]
    }
  ],
  f = () => {
    const e = [
      a(r, 'config.json'),
      a(process.cwd(), 'src-electron', 'config.json')
    ]
    for (const l of e) if (p(l)) return l
    return e[0]
  },
  g = () => {
    try {
      const e = f(),
        l = b(e, 'utf-8')
      return JSON.parse(l)
    } catch {
      return {}
    }
  },
  s = () => {
    const e = new i({
        width: 800,
        height: 600,
        //图标
        icon: a(r, '../public/favicon.ico')
      }),
      { mainPageUrl: l, openDevTools: c } = g()
    ;(o.isPackaged
      ? l
        ? e.loadURL(l)
        : e.loadFile(a(r, '../dist/index.html'))
      : e.loadURL('http://localhost:5173'),
      (c || !o.isPackaged) && e.webContents.openDevTools())
  }
o.whenReady().then(() => {
  const e = t.buildFromTemplate(d)
  ;(t.setApplicationMenu(e),
    s(),
    o.on('activate', () => {
      i.getAllWindows().length === 0 && s()
    }))
})
o.on('window-all-closed', () => {
  process.platform !== 'darwin' && o.quit()
})
