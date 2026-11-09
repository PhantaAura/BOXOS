const { contextBridge, ipcRenderer } = require('electron');
const inv = (c) => (...a) => ipcRenderer.invoke(c, ...a);
contextBridge.exposeInMainWorld('boxos', {
  native: true,
  sysInfo: inv('sys:info'), places: inv('fs:places'), list: inv('fs:list'),
  readText: inv('fs:readText'), writeText: inv('fs:writeText'), mkdir: inv('fs:mkdir'),
  rename: inv('fs:rename'), trash: inv('fs:trash'), reveal: inv('fs:reveal'), icon: inv('fs:icon'),
  pickFile: inv('fs:pickFile'), saveAs: inv('fs:saveAs'), search: inv('fs:search'),
  apps: inv('app:list'), launch: inv('app:launch'), openExternal: inv('app:openExternal'),
  quit: inv('app:quit'), fullscreen: inv('app:fullscreen'), power: inv('app:power'),
  suggest: inv('search:suggest'), firefox: inv('app:firefox'), openInFirefox: inv('app:openInFirefox'),
  onOpen: (cb) => ipcRenderer.on('boxos:open-external', (_e, items) => cb(items)),
  onNewTab: (cb) => ipcRenderer.on('boxos:new-tab', (_e, url) => cb(url)),
  pathForFile: (f) => { try { return require('electron').webUtils.getPathForFile(f); } catch { return f.path || ''; } },
});
