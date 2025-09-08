const { Client, LocalAuth } = require("whatsapp-web.js");
const puppeteer = require('puppeteer-core');
const electron = require('electron');

const os = require("os");
const fs = require("fs");
const path = require("path");

require(path.join(__dirname,"../utils/logger")); // activa el logger

const storagePath = path.join(os.homedir(), ".whatsapp-bot");
let client;

if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

function initBot(sendQRCallback, readyCallback) {
  try {
    console.log("Starting bot...");

    const storagePath = path.join(os.homedir(), ".whatsapp-bot");

    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }

    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: storagePath,
      }),
      puppeteer: {
        headless: true, // 👀 ponlo en false para ver si abre el navegador
        executablePath: puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked'),
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu"
        ],
      },
    });

    console.log("Client created");
    console.log("Usando Chromium:", client.options.puppeteer.executablePath);

    client.on("qr", (qr) => {
      console.log("📲 QR recibido");
      sendQRCallback(qr);
    });

    client.on("authenticated", () => {
      console.log("🔐 Autenticado correctamente");
    });

    client.on("auth_failure", (msg) => {
      console.error("❌ Error de autenticación:", msg);
    });

    client.on("ready", () => {
      readyCallback("✅ WhatsApp listo para enviar mensajes");
    });

    client.initialize();
  } catch (error) {
    console.error("Error initializing bot:", error);
  }
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
