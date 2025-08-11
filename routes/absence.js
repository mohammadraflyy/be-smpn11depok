const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { sendAbsenNotification } = require('../services/whatsapp');

router.post('/scan', async (req, res) => {
  const { qr_token, status } = req.body;

  const validStatus = ['masuk', 'pulang', 'izin', 'sakit', 'alpha'];
  if (!validStatus.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const [students] = await pool.query(
      'SELECT nisn, name, parent_number FROM students WHERE qr_token = ?',
      [qr_token]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'QR token not found or invalid' });
    }

    const { nisn, name, parent_number } = students[0];
    const id = uuidv4();
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];
    let isLate = false;
    let alreadyAt = null;

    if (['masuk', 'pulang'].includes(status)) {
      const [existing] = await pool.query(
        'SELECT * FROM absence WHERE nisn = ? AND date = ? AND status = ?',
        [nisn, date, status]
      );

      if (existing.length > 0) {
        alreadyAt = existing[0].time;
        return res.status(400).json({
          message: `Siswa ${name} sudah absen ${status}`,
          alreadyAt,
        });
      }

      const [settingRows] = await pool.query(
        'SELECT jam_mulai, jam_selesai FROM setting_waktu WHERE jenis = ?',
        [status]
      );

      if (settingRows.length === 0) {
        return res.status(500).json({ message: `Waktu absen untuk ${status} belum diatur` });
      }

      const { jam_mulai, jam_selesai } = settingRows[0];
      if (time < jam_mulai || time > jam_selesai) {
        isLate = true;
      }
    }

    await pool.query(
      `INSERT INTO absence 
       (id, date, time, nisn, status, status_message, is_late) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, date, time, nisn, status, 'pending', isLate]
    );

    if (['masuk', 'pulang'].includes(status)) {
      sendAbsenNotification(parent_number, name, time);
    }

    // 📢 Pesan sukses berdasarkan status
    let successMessage = "";
    switch (status) {
      case "masuk":
        successMessage = `Selamat datang, ${name}! Absen masuk berhasil.`;
        break;
      case "pulang":
        successMessage = `Sampai jumpa, ${name}! Absen pulang berhasil.`;
        break;
      case "izin":
        successMessage = `${name} telah mengajukan izin hari ini.`;
        break;
      case "sakit":
        successMessage = `${name} dilaporkan sakit hari ini.`;
        break;
      case "alpha":
        successMessage = `${name} tidak hadir tanpa keterangan (alpha).`;
        break;
    }

    if (isLate) successMessage += " ⚠️ (Terlambat)";

    res.status(201).json({
      message: successMessage,
      id,
      telat: isLate,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to process absence', error: err });
  }
});


module.exports = router;
