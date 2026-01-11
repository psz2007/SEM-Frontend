const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sem_control', {
    getports: () => ipcRenderer.invoke('getPorts'),
    openport: (portPath, baudRate, dataBits, stopBits, parity, op) => 
        ipcRenderer.invoke('openPort', portPath, baudRate, dataBits, stopBits, parity, op),
    readport: (op, clear) => ipcRenderer.invoke('readPort', op, clear),
    writeport: (data, op) => ipcRenderer.invoke('writePort', data, op),
    closePort: (op) => ipcRenderer.invoke('closePort', op),
    saveImage: (h, v, filename, l = 0, r = 255) => ipcRenderer.invoke('saveImage', h, v, filename, l, r),
    getImageData: (h, v, l = 0, r = 255) => ipcRenderer.invoke("getImageData", h, v, l, r),
    saveSuperposedImage: (h, v, filename, l = 0, r = 255) => ipcRenderer.invoke('saveSuperposedImage', h, v, filename, l, r),
    getSuperposedImageData: (h, v, l = 0, r = 255) => ipcRenderer.invoke("getSuperposedImageData", h, v, l, r)
});
