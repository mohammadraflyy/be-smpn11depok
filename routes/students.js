const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Get all students
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students');
    res.json(rows);
  } catch (err) {
    console.error('DB Error (GET all):', err);
    res.status(500).json({ message: 'Database error', error: err });
  }
});

// Get student by id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('DB Error (GET by id):', err);
    res.status(500).json({ message: 'Database error', error: err });
  }
});

// Create student
router.post('/', async (req, res) => {
  const { nisn, name, parent_number, class: kelas } = req.body;
  const id = uuidv4();
  const qr_token = uuidv4();

  try {
    await pool.query(
      'INSERT INTO students (id, nisn, name, parent_number, qr_token, `class`) VALUES (?, ?, ?, ?, ?, ?)',
      [id, nisn, name, parent_number, qr_token, kelas]
    );
    res.status(201).json({ message: 'Student created', id, qr_token });
  } catch (err) {
    console.error('DB Error (CREATE):', err);
    res.status(500).json({ message: 'Failed to create student', error: err });
  }
});

// Update student
router.put('/:id', async (req, res) => {
  const { nisn, name, parent_number, class: kelas } = req.body;
  try {
    await pool.query(
      'UPDATE students SET nisn = ?, name = ?, parent_number = ?, `class` = ? WHERE id = ?',
      [nisn, name, parent_number, kelas, req.params.id]
    );
    res.json({ message: 'Student updated' });
  } catch (err) {
    console.error('DB Error (UPDATE):', err);
    res.status(500).json({ message: 'Failed to update student', error: err });
  }
});

// Regenerate QR token
router.put('/regenerate-qr/:id', async (req, res) => {
  const newToken = uuidv4();
  try {
    await pool.query('UPDATE students SET qr_token = ? WHERE id = ?', [newToken, req.params.id]);
    res.json({ message: 'QR token regenerated', qr_token: newToken });
  } catch (err) {
    console.error('DB Error (REGENERATE QR):', err);
    res.status(500).json({ message: 'Failed to regenerate QR token', error: err });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    console.error('DB Error (DELETE):', err);
    res.status(500).json({ message: 'Failed to delete student', error: err });
  }
});

module.exports = router;
