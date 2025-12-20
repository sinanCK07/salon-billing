const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    printBill: (data) => ipcRenderer.invoke('print-bill', data)
});
