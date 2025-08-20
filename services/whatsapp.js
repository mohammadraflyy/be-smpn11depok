const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

const SESSION_FOLDER = '.wwebjs_auth';
const SESSION_READY_FILE = path.join(SESSION_FOLDER, 'session.ready');

if (fs.existsSync(SESSION_FOLDER) && !fs.existsSync(SESSION_READY_FILE)) {
  console.log('[CLEANUP] Deleting stale session folder...');
  fs.rmSync(SESSION_FOLDER, { recursive: true, force: true });
} else {
  console.log('[INFO] Session valid or not yet created.');
}

const client = new Client({
  authStrategy: new LocalAuth({}),
  puppeteer: { headless: true }
});

let qrImageData = null;
let readyStatus = false;

const messageQueue = [];
let processing = false;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

client.on('ready', () => {
  console.log('[READY] WhatsApp client is ready');
  qrImageData = null;
  readyStatus = true;

  fs.writeFileSync(SESSION_READY_FILE, 'ready');
});

client.on('qr', async (qr) => {
  console.log('[QR] QR code generated');
  qrImageData = await qrcode.toDataURL(qr);
  readyStatus = false;
});

client.on('auth_failure', (msg) => {
  console.error('[ERROR] Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
  console.log('[DISCONNECTED] WhatsApp client disconnected:', reason);
  readyStatus = false;
});

client.on('loading_screen', (percent, message) => {
  console.log(`[LOADING] ${percent}% - ${message}`);
});

const reinitClient = () => {
  console.log('[REINIT] Reinitializing WhatsApp client...');
  client.initialize()
    .then(() => console.log('[REINIT] Client initialized'))
    .catch((err) => console.error('[REINIT ERROR] Failed to init client:', err));
};

const logout = async () => {
  try {
    if (client.pupBrowser) {
      console.log('[ACTION] Closing puppeteer browser...');
      await client.pupBrowser.close();
    } else if (client._client?.browser) {
      console.log('[ACTION] Closing puppeteer browser (alt path)...');
      await client._client.browser.close();
    }

    if (!client || !client.info || !client.info.wid) {
      console.warn('[WARN] Cannot logout: Client not connected.');
    } else {
      console.log('[ACTION] Logging out...');
      await client.logout();
    }

    if (fs.existsSync(SESSION_FOLDER)) {
      fs.rmSync(SESSION_FOLDER, { recursive: true, force: true });
      console.log('[CLEANUP] Session folder deleted');
    }

    reinitClient();
    return { success: true, message: 'Logged out and browser killed successfully.' };
  } catch (err) {
    console.error('[ERROR] Logout failed:', err.message || err);
    return { success: false, message: 'Failed to logout properly.' };
  }
};

const processQueue = async () => {
  if (processing || !readyStatus) return;
  processing = true;

  while (messageQueue.length > 0 && readyStatus) {
    const { number, name, time, status } = messageQueue.shift();
    const formattedNumber = number.includes('@c.us') ? number : `${number}@c.us`;

    let message = "";

    switch (status) {
      case "masuk":
        message = `[Absen Masuk Sekolah]\n\nHalo, anak Anda *${name}* sudah melakukan absen *masuk* pada pukul *${time}*.\n\nTerima kasih`;
        break;
      case "pulang":
        message = `[Absen Pulang Sekolah]\n\nHalo, anak Anda *${name}* telah melakukan absen *pulang* pada pukul *${time}*.\n\nTerima kasih`;
        break;
      case "izin":
        message = `[Izin Tidak Masuk Sekolah]\n\nAnak Anda *${name}* hari ini mengajukan *izin tidak masuk* sekolah.\n\nTerima kasih`;
        break;
      case "sakit":
        message = `[Laporan Sakit]\n\nAnak Anda *${name}* dilaporkan *sakit* dan tidak masuk sekolah hari ini.\n\nSemoga lekas sembuh`;
        break;
      case "alpha":
        message = `[Alpha Hari Ini]\n\nAnak Anda *${name}* *tidak hadir* dan *tanpa keterangan (alpha)* hari ini.\n\nMohon perhatian Anda.`;
        break;
      default:
        message = `Absen status: ${status} untuk *${name}* pada pukul *${time}*`;
    }

    try {
      await client.sendMessage(formattedNumber, message);
      console.log(`[SENT] Message sent to ${number} (status: ${status})`);
    } catch (err) {
      console.error(`[FAILED] Could not send to ${number}:`, err);
    }

    await delay(3600);
  }

  processing = false;
};

const sendAbsenNotification = (parentNumber, studentName, time, status) => {
  if (!readyStatus) {
    console.log('[SKIP] WhatsApp not ready. Message not queued.');
    return;
  }

  messageQueue.push({
    number: parentNumber,
    name: studentName,
    time,
    status,
  });

  processQueue();
};

client.initialize().then(() => {
  console.log('[INIT] WhatsApp client initialized');
}).catch((err) => {
  console.error('[ERROR] Failed to initialize client:', err);
});

module.exports = {
  client,
  getQrCode: () => qrImageData,
  isReady: () => readyStatus,
  sendAbsenNotification,
  logout
};
