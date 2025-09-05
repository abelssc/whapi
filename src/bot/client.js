const { Client, LocalAuth } = require("whatsapp-web.js");
const path = require('node:path')

let client;

function initBot(sendQRCallback, readyCallback) {
  client = new Client({
    authStrategy: new LocalAuth({ 
      dataPath: path.join(__dirname, "storage") 
    }),
  });

  client.on("qr", (qr) => {
    // Mandar el QR al frontend
    sendQRCallback(qr);
  });

  client.on("ready", () => {
    readyCallback("✅ WhatsApp listo para enviar mensajes");
  });

  client.initialize();
}

async function sendMessage(number, message) {
  try {
    if (!client) {
      throw new Error("Client not initialized");
    }
    number=String(number).replace(/\D/g,''); //remover todo lo que no sea digito
    //agregar el sufijo 51 si no está presente
    if (number.length=='9' && !number.startsWith("51")) {
      number = "51" + number;
    }

  
    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
    await client.sendMessage(chatId, message);
    console.log(`Mensaje enviado a ${number}`);
    return { success: true };
    
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { initBot, sendMessage };
