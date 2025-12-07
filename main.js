const { app, BrowserWindow, ipcMain } = require('electron/main');
const path = require('node:path');
const { SerialPort, ReadlineParser } = require('serialport');
const sharp = require('sharp');

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.loadFile('index.html');
    // win.webContents.openDevTools();
};

class Reader {
    constructor(port, parser, buffer = "") {
        this.port = port;
        this.parser = parser;
        this.buffer = buffer || "";
    }
}
const p = {0: new Reader(), 1: new Reader()}; // 0 for cmd, 1 for pic
const getPorts = async () => {
    try {
        return await SerialPort.list();
    } catch (err) {
        console.error('Error listing ports:', err);
        throw new Error('Failed to list ports');
    }
};
const openPort = async (portPath, baudRate, dataBits, stopBits, parity, op = 0) => {
    try {
        p[op].port = new SerialPort({
            path: portPath,
            baudRate: baudRate,
            dataBits: dataBits,
            stopBits: stopBits,
            parity: parity,
            autoOpen: false
        });
        p[op].port.on('open', () => {
            console.log(`Connected to ${portPath} at ${baudRate} baud.`);
        });
        p[op].port.on('error', (err) => {
            console.error('Serial port error:', err.message);
        });
        p[op].port.on('data', (data) => {
            if (op === 1) {
                p[op].buffer += data.toString('binary'); 
            } else {
                const text = data.toString('ascii');
                console.log(`Received (Port ${op}): ${text}`);
                p[op].buffer += text; 
            }
        });
        return new Promise((resolve, reject) => {
            p[op].port.open((err) => {
                if (err) {
                    console.error('Error opening port:', err.message);
                    reject(err.message);
                } else {
                    console.log("Port opened successfully (op: " + op + ")");
                    resolve(true);
                }
            });
        });
    } catch (err) {
        console.error('Error setup port:', err);
        throw new Error('Failed to setup port');
    }
}

const readPort = async (op, clear = true) => {
    var t = p[op].buffer;
    if (clear) p[op].buffer = "";
    return t;
};
const writePort = async (data, op) => {
    try {
        console.log(data, op);
        p[op].port.write(data + "\n", (err) => {
            if (err) {
                console.error('Error writing:', err.message);
            }
        });
    } catch (err) {
        console.error('Error writing to port:', err);
        throw new Error('Failed to write to port');
    }
};
const closePort = async(op) => {
    try {
        p[op].port.close((err) => {
            if (err) {
                console.error('Error closing port:', err);
                throw new Error('Failed to close port');
            }
        });
    } catch (err) {
        console.error('Error closing port:', err);
        throw new Error('Failed to close port');
    }
};
const getImage = async (width, height, sav) => {
    try {
        const n = width * height, raw = p[1].buffer;
        if (!raw || raw.length === 0) {
            throw new Error("Buffer is empty");
        }
        const pixelBuffer = Buffer.alloc(n, 0);
        for (let i = 0; i < raw.length && i < n; i++) {
            pixelBuffer[i] = raw.charCodeAt(i);
        }
        await sharp(pixelBuffer, {
            raw: {
                width: width,
                height: height,
                channels: 1
            }
        }).png().toFile(sav); 
        console.log(`Image saved to ${sav}`);
        return true;
    } catch (err) {
        console.error('Image processing error:', err);
        throw err;
    }
};
const getImageBase64 = async (width, height) => {
    try {
        const n = width * height, raw = p[1].buffer;        
        if (!raw || raw.length === 0) {
            throw new Error("Buffer is empty");
        }
        const pixelBuffer = Buffer.alloc(n, 0);
        for (let i = 0; i < raw.length && i < n; i++) {
            pixelBuffer[i] = raw.charCodeAt(i);
        }
        let data = await sharp(pixelBuffer, {
            raw: {
                width: width,
                height: height,
                channels: 1
            }
        }).png().toBuffer(); 
        return `data:image/png;base64,${data.toString('base64')}`;
    } catch (err) {
        console.error('Image processing error:', err);
        throw err;
    }
};

app.whenReady().then(() => {
    ipcMain.handle('getPorts', async () => await getPorts());
    ipcMain.handle('openPort', async (e, portPath, baudRate, dataBits, stopBits, parity, op) =>
        await openPort(portPath, baudRate, dataBits, stopBits, parity, op));
    ipcMain.handle('readPort', async (e, op, clear) => await readPort(op, clear));
    ipcMain.handle('writePort', async (e, data, op) => await writePort(data, op));
    ipcMain.handle('closePort', async (e, op) => await closePort(op));
    ipcMain.handle('saveImage', async (e, width, height, filename) => {
        const savePath = path.join(app.getPath('downloads'), filename);
        await getImage(width, height, savePath);
        return savePath;
    });
    ipcMain.handle('getImageData', async (e, width, height) => await getImageBase64(width, height));
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
