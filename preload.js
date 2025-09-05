const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ApiElectron', {
  initBot: () => ipcRenderer.send('initBot'),
  onQR: (callback) => ipcRenderer.on('qr', (event, qr) => callback(qr)),
  onReady: (callback) => ipcRenderer.on('ready', (event, message) => callback(message)),
  sendMessage: (data) => ipcRenderer.invoke('sendMessage', data)
})
//icpRenderer
//.send se usa para enviar mensajes sin esperar respuesta
//.invoke se usa para enviar mensajes y esperar una respuesta (promesa)
//.on se usa para escuchar mensajes del main
//.once se usa para escuchar un solo mensaje del main
