const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM students');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { nisn, name, parent_number, class: kelas } = req.body;
  const id = uuidv4();
  const qr_token = uuidv4();

  try {
    await pool.query(
      'INSERT INTO students (id, nisn, name, parent_number, qr_token, class) VALUES (?, ?, ?, ?, ?, ?)',
      [id, nisn, name, parent_number, qr_token, kelas]
    );
    res.status(201).json({ message: 'Student created', id, qr_token });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create student', error: err });
  }
});

router.put('/:id', async (req, res) => {
  const { nisn, name, parent_number, class: kelas } = req.body;
  await pool.query(
    'UPDATE students SET nisn = ?, name = ?, parent_number = ?, class = ? WHERE id = ?',
    [nisn, name, parent_number, kelas, req.params.id]
  );
  res.json({ message: 'Student updated' });
});

router.put('/regenerate-qr/:id', async (req, res) => {
  const newToken = uuidv4();
  await pool.query('UPDATE students SET qr_token = ? WHERE id = ?', [newToken, req.params.id]);
  res.json({ message: 'QR token regenerated', qr_token: newToken });
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
  res.json({ message: 'Student deleted' });
});

module.exports = router;
