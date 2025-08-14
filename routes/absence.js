const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { sendAbsenNotification } = require('../services/whatsapp');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

router.get('/', async (req, res) => {
  try {
    const format = req.query.format?.toLowerCase();

    const [rows] = await pool.query(
      `SELECT id, date, time, nisn, status, status_message, is_late
       FROM absence`
    );

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Absences');

      sheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Time', key: 'time', width: 15 },
        { header: 'NISN', key: 'nisn', width: 20 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Status Message', key: 'status_message', width: 25 },
        { header: 'Is Late', key: 'is_late', width: 10 },
      ];

      rows.forEach(row => sheet.addRow(row));

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=absence.xlsx');
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=absence.pdf');

      doc.pipe(res);

      doc.fontSize(18).text('Absence Recap', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10);
      const tableTop = 80;
      const itemSpacing = 20;

      const columns = [
        { label: 'ID', x: 30, width: 80 },
        { label: 'Date', x: 110, width: 60 },
        { label: 'Time', x: 170, width: 60 },
        { label: 'NISN', x: 230, width: 60 },
        { label: 'Status', x: 290, width: 60 },
        { label: 'Status Msg', x: 350, width: 90 },
        { label: 'Late', x: 440, width: 30 },
      ];

      columns.forEach(col => {
        doc.text(col.label, col.x, tableTop, { width: col.width, bold: true });
      });

      let y = tableTop + 20;
      rows.forEach(row => {
        doc.text(row.id, columns[0].x, y, { width: columns[0].width });
        doc.text(row.date, columns[1].x, y, { width: columns[1].width });
        doc.text(row.time, columns[2].x, y, { width: columns[2].width });
        doc.text(row.nisn, columns[3].x, y, { width: columns[3].width });
        doc.text(row.status, columns[4].x, y, { width: columns[4].width });
        doc.text(row.status_message, columns[5].x, y, { width: columns[5].width });
        doc.text(row.is_late ? 'Yes' : 'No', columns[6].x, y, { width: columns[6].width });
        y += itemSpacing;
      });

      doc.end();
      return;
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get absence records', error: err });
  }
});

async function processAbsence({ token, status, isManual = false }) {
  const validStatus = ['masuk', 'pulang', 'izin', 'sakit', 'alpha'];
  if (!validStatus.includes(status)) {
    throw { statusCode: 400, message: 'Invalid status' };
  }

  if (!token) {
    throw { statusCode: 400, message: 'Token is required' };
  }

  const [students] = await pool.query(
    'SELECT nisn, name, parent_number FROM students WHERE qr_token = ?',
    [token]
  );
  if (students.length === 0) {
    throw { statusCode: 404, message: 'Token not found or invalid' };
  }

  const { nisn, name, parent_number } = students[0];
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0];
  let isLate = false;

  if (['masuk', 'pulang'].includes(status)) {
    const [existing] = await pool.query(
      'SELECT * FROM absence WHERE nisn = ? AND date = ? AND status = ?',
      [nisn, date, status]
    );
    if (existing.length > 0) {
      throw {
        statusCode: 400,
        message: `Siswa ${name} sudah absen ${status}`,
        alreadyAt: existing[0].time,
      };
    }

    const [settingRows] = await pool.query(
      'SELECT jam_mulai, jam_selesai FROM setting_waktu WHERE jenis = ?',
      [status]
    );
    if (settingRows.length === 0) {
      throw {
        statusCode: 500,
        message: `Waktu absen untuk ${status} belum diatur`,
      };
    }

    const { jam_mulai, jam_selesai } = settingRows[0];
    if (time < jam_mulai || time > jam_selesai) {
      isLate = true;
    }
  }

  const id = uuidv4();
  await pool.query(
    `INSERT INTO absence 
      (id, date, time, nisn, status, status_message, is_late) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, date, time, nisn, status, 'pending', isLate]
  );

  if (['masuk', 'pulang'].includes(status)) {
    sendAbsenNotification(parent_number, name, time);
  }

  let successMessage = "";
  switch (status) {
    case "masuk":
      successMessage = `Selamat datang, ${name}! Absen masuk berhasil${isManual ? ' (manual)' : ''}.`;
      break;
    case "pulang":
      successMessage = `Sampai jumpa, ${name}! Absen pulang berhasil${isManual ? ' (manual)' : ''}.`;
      break;
    case "izin":
      successMessage = `${name} telah mengajukan izin hari ini${isManual ? ' (manual)' : ''}.`;
      break;
    case "sakit":
      successMessage = `${name} dilaporkan sakit hari ini${isManual ? ' (manual)' : ''}.`;
      break;
    case "alpha":
      successMessage = `${name} tidak hadir tanpa keterangan (alpha)${isManual ? ' (manual)' : ''}.`;
      break;
  }
  if (isLate) successMessage += " ⚠️ (Terlambat)";

  return { message: successMessage, id, telat: isLate };
}

router.post('/scan', async (req, res) => {
  try {
    const result = await processAbsence({ token: req.body.qr_token, status: req.body.status, isManual: false });
    res.status(201).json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: err.message, alreadyAt: err.alreadyAt, error: err });
  }
});

router.post('/manual-scan', async (req, res) => {
  try {
    const result = await processAbsence({ token: req.body.token, status: req.body.status, isManual: true });
    res.status(201).json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ message: err.message, alreadyAt: err.alreadyAt, error: err });
  }
});

module.exports = router;
