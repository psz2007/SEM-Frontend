const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sem_control', {
    getports: () => ipcRenderer.invoke('getPorts'),
    openport: (portPath, baudRate, dataBits, stopBits, parity, op) => 
        ipcRenderer.invoke('openPort', portPath, baudRate, dataBits, stopBits, parity, op),
    readport: (op, clear) => ipcRenderer.invoke('readPort', op, clear),
    writeport: (data, op) => ipcRenderer.invoke('writePort', data, op),
    closePort: (op) => ipcRenderer.invoke('closePort', op),
    saveImage: (h, v, filename) => ipcRenderer.invoke('saveImage', h, v, filename),
    getImageData: (h, v) => ipcRenderer.invoke("getImageData", h, v)
});
