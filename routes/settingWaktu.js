const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM setting_waktu');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch setting waktu', error: err });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM setting_waktu WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch setting waktu', error: err });
  }
});

router.post('/', async (req, res) => {
  const { jenis, jam_mulai, jam_selesai } = req.body;

  if (!['masuk', 'pulang'].includes(jenis)) {
    return res.status(400).json({ message: 'Jenis harus "masuk" atau "pulang"' });
  }

  try {
    const [existing] = await pool.query('SELECT * FROM setting_waktu WHERE jenis = ?', [jenis]);
    if (existing.length > 0) {
      return res.status(400).json({ message: `Setting untuk jenis "${jenis}" sudah ada` });
    }

    await pool.query(
      'INSERT INTO setting_waktu (jenis, jam_mulai, jam_selesai) VALUES (?, ?, ?)',
      [jenis, jam_mulai, jam_selesai]
    );

    res.status(201).json({ message: 'Setting waktu created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create setting waktu', error: err });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { jenis, jam_mulai, jam_selesai } = req.body;

  if (!['masuk', 'pulang'].includes(jenis)) {
    return res.status(400).json({ message: 'Jenis harus "masuk" atau "pulang"' });
  }

  try {
    const [conflict] = await pool.query(
      'SELECT * FROM setting_waktu WHERE jenis = ? AND id != ?',
      [jenis, id]
    );

    if (conflict.length > 0) {
      return res.status(400).json({ message: `Setting untuk jenis "${jenis}" sudah ada` });
    }

    const [result] = await pool.query(
      'UPDATE setting_waktu SET jenis = ?, jam_mulai = ?, jam_selesai = ? WHERE id = ?',
      [jenis, jam_mulai, jam_selesai, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Setting waktu tidak ditemukan' });
    }

    res.json({ message: 'Setting waktu updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update setting waktu', error: err });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM setting_waktu WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Setting waktu tidak ditemukan' });
    }

    res.json({ message: 'Setting waktu deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete setting waktu', error: err });
  }
});

module.exports = router;
