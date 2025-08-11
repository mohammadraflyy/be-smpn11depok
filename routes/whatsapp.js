const express = require('express');
const router = express.Router();
const { getQrCode, isReady, logout } = require('../services/whatsApp');

router.get('/qr', (req, res) => {
  if (isReady()) {
    console.log('[QR] WhatsApp client is ready');
    res.json({ qr: null, status: 'ready' });
  } else {
    const qr = getQrCode();
    if (qr) {
      console.log('[QR] QR requested (partial):', qr.substring(0, 50) + '...');
      res.json({ qr, status: 'waiting' });
    } else {
      console.log('[QR] WhatsApp client initializing...');
      res.json({ qr: null, status: 'initializing' });
    }
  }
});

router.post('/logout', async (req, res) => {
  const result = await logout();
  console.log(result.success ? '[LOGOUT] Success' : '[ERROR] Logout failed');
  res.status(result.success ? 200 : 500).json(result);
});

module.exports = router;
