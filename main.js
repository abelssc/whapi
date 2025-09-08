const { app, BrowserWindow, ipcMain } = require('electron')
const qrcode = require('qrcode')
const path = require('node:path')
const { initBot, sendMessage } = require(path.join(__dirname,'src' ,'bot', 'client'));
//src/bot/client.js
require(path.join(__dirname,"src/utils/logger")); // activa el logger


let win;

const createWindow = () => {
  win = new BrowserWindow({
    width: 700,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('src/app/index.html')
}

app.whenReady().then(() => {
    const sendQRCallback = (qr) => {
      console.log('QR Code received:', qr);
      // Aquí puedes enviar el QR al frontend si es necesario
      if (win)
          qrcode.toDataURL(qr).then(url => {
            win.webContents.send('qr', url);
          });
    }
    const readyCallback = (message) => {
      console.log(message);
      // Aquí puedes notificar al frontend que el bot está listo
      if (win)
        win.webContents.send('ready', message);
    }

    ipcMain.on('initBot', () => {
      try {
        console.log('Initializing bot...');
        
        initBot(sendQRCallback, readyCallback)
      } catch (error) {
        console.error("Error  bot:", error);
      }
    });
    ipcMain.handle('sendMessage', async (event, data) => {
      const { number, message } = data;
      return await sendMessage(number, message);
    });

    createWindow()
})