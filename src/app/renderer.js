document.addEventListener("DOMContentLoaded", () => {
  // Elementos DOM
  const qrContainer = document.getElementById('qrContainer');
  const formContainer = document.getElementById('formContainer');
  const connectionStatus = document.getElementById('connectionStatus');
  const qrCodeImg = document.getElementById('qrcode');
  const qrStatus = document.getElementById('qrStatus');
  const fileInput = document.getElementById('fileInput');
  const summary = document.getElementById('summary');
  const sendButton = document.getElementById('sendButton');
  const pauseButton = document.getElementById('pauseButton');
  const resetButton = document.getElementById('resetButton');
  const progressBar = document.getElementById('progressBar');
  const progressStatus = document.getElementById('progressStatus');
  const progressPercentage = document.getElementById('progressPercentage');
  const logsContainer = document.getElementById('logsContainer');

  // Variables de estado
  let clientes = [];
  let isSending = false;
  let isPaused = false;
  let currentIndex = 0;
  let successCount = 0;
  let errorCount = 0;

  // Inicializar bot
  window.ApiElectron.initBot();
  addLog('Inicializando bot de WhatsApp...', 'info');

  // Mostrar QR
  window.ApiElectron.onQR((qr) => {
    qrCodeImg.src = qr;
    qrStatus.textContent = 'Escanea el código QR con tu teléfono';
    addLog('Código QR generado. Escanea con tu teléfono.', 'info');
  });

  // Cuando está listo el bot
  window.ApiElectron.onReady((message) => {
    addLog('Conexión exitosa con WhatsApp', 'success');
    connectionStatus.innerHTML = '<span class="status-indicator status-connected"></span> Conectado a WhatsApp';
    connectionStatus.style.backgroundColor = '#e8f5e9';
    
    // Ocultar QR y mostrar form
    qrContainer.classList.add('hidden');
    formContainer.classList.remove('hidden');
  });

  // Manejar errores de conexión
  // window.ApiElectron.onError((error) => {
  //   addLog(`Error: ${error}`, 'error');
  //   connectionStatus.innerHTML = '<span class="status-indicator status-disconnected"></span> Error de conexión';
  //   connectionStatus.style.backgroundColor = '#ffeef0';
  // });

  // Leer Excel
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    addLog(`Procesando archivo: ${file.name}`, 'info');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        // Validar columnas
        const isValid = rows.length > 0 &&
          Object.keys(rows[0]).includes('celular') &&
          Object.keys(rows[0]).includes('mensaje');

        if (!isValid) {
          addLog('Error: El archivo debe contener las columnas "celular" y "mensaje"', 'error');
          alert('El Excel debe contener las columnas: celular, mensaje');
          fileInput.value = '';
          clientes = [];
          summary.textContent = '';
          sendButton.disabled = true;
          return;
        }

        clientes = rows;
        console.log(clientes);

        // Personalizamos mensaje reemplazamos el texto entre corchetes {} con el nombre de las columnas del excel
        clientes.forEach(cliente => {
          cliente.mensaje = cliente.mensaje.replace(/{(.*?)}/g, (match, p1) => cliente[p1.trim()] || match);
        });
        
        summary.innerHTML = `
          <strong><i class="fas fa-users"></i> Clientes cargados:</strong> ${clientes.length}<br>
          <strong><i class="fas fa-phone"></i> Ejemplo de celular:</strong> ${clientes[0].celular}<br>
          <strong><i class="fas fa-comment"></i> Ejemplo de mensaje:</strong> ${clientes[0].mensaje}
        `;
        sendButton.disabled = false;
        addLog(`Se cargaron ${clientes.length} clientes correctamente`, 'success');
      } catch (error) {
        addLog(`Error al procesar el archivo: ${error.message}`, 'error');
        alert('Error al leer el archivo Excel. Asegúrate de que es un formato válido.');
      }
    };
    reader.onerror = () => {
      addLog('Error al leer el archivo', 'error');
      alert('Error al leer el archivo. Intenta nuevamente.');
    };
    reader.readAsArrayBuffer(file);
  });

  // Enviar mensajes
  sendButton.addEventListener('click', async () => {
    if (clientes.length === 0) return;
    
    isSending = true;
    isPaused = false;
    sendButton.disabled = true;
    pauseButton.classList.remove('hidden');
    successCount = 0;
    errorCount = 0;
    
    addLog(`Iniciando envío de ${clientes.length} mensajes`, 'info');
    
    await processMessages();
  });

  // Pausar envío
  pauseButton.addEventListener('click', () => {
    if (isPaused) {
      // Reanudar
      isPaused = false;
      pauseButton.innerHTML = '<i class="fas fa-pause"></i> Pausar';
      addLog('Reanudando envío de mensajes', 'info');
      processMessages();
    } else {
      // Pausar
      isPaused = true;
      pauseButton.innerHTML = '<i class="fas fa-play"></i> Reanudar';
      addLog('Envío pausado', 'warning');
    }
  });

  // Reiniciar
  resetButton.addEventListener('click', () => {
    isSending = false;
    isPaused = false;
    currentIndex = 0;
    successCount = 0;
    errorCount = 0;
    
    progressBar.style.width = '0%';
    progressPercentage.textContent = '0%';
    progressStatus.textContent = 'Envío cancelado';
    
    sendButton.disabled = false;
    pauseButton.classList.add('hidden');
    pauseButton.innerHTML = '<i class="fas fa-pause"></i> Pausar';
    
    addLog('Envío cancelado por el usuario', 'warning');
  });

  // Función para procesar mensajes
  async function processMessages() {
    while (currentIndex < clientes.length && isSending && !isPaused) {
      const cliente = clientes[currentIndex];

      try {
        addLog(`Enviando a: ${cliente.celular}`, 'info');
        const result = await window.ApiElectron.sendMessage({
          number: cliente.celular,
          message: cliente.mensaje
        });
        
        if (result && result.success) {
          successCount++;
          addLog(`✓ Enviado a ${cliente.celular}`, 'success');
        } else {
          errorCount++;
          addLog(`✕ Error con ${cliente.celular}: ${result.error || 'Error desconocido'}`, 'error');
        }
      } catch (error) {
        errorCount++;
        addLog(`✕ Error con ${cliente.celular}: ${error.message || 'Error de conexión'}`, 'error');
      }
      
      currentIndex++;
      
      // Actualizar progreso
      const progress = (currentIndex / clientes.length) * 100;
      progressBar.style.width = `${progress}%`;
      progressPercentage.textContent = `${Math.round(progress)}%`;
      progressStatus.textContent = `Enviados: ${currentIndex}/${clientes.length} | Éxitos: ${successCount} | Errores: ${errorCount}`;
      
      // Pequeña pausa entre mensajes para no saturar
      if (currentIndex < clientes.length && !isPaused) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // Verificar si terminó
    if (currentIndex >= clientes.length) {
      isSending = false;
      sendButton.disabled = false;
      pauseButton.classList.add('hidden');
      
      addLog(`Envío completado. Total: ${clientes.length}, Éxitos: ${successCount}, Errores: ${errorCount}`, 
              errorCount > 0 ? 'warning' : 'success');
      
      progressStatus.textContent = `Completado: ${successCount} exitosos, ${errorCount} errores`;
      
      if (errorCount > 0) {
        alert(`Envío completado con ${errorCount} errores. Revisa el registro para más detalles.`);
      } else {
        alert('¡Todos los mensajes fueron enviados exitosamente!');
      }
    }
  }

  // Función para agregar logs
  function addLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.innerHTML = `[${timestamp}] ${message}`;
    
    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }
});