const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM classes');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM classes WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { className, teacher_id, whatsapp_group_id } = req.body;
  const id = uuidv4();

  try {
    await pool.query(
      'INSERT INTO classes (id, class, teacher_id, whatsapp_group_id) VALUES (?, ?, ?, ?)',
      [id, className, teacher_id, whatsapp_group_id]
    );
    res.status(201).json({ message: 'Class created', id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create class', error: err });
  }
});

router.put('/:id', async (req, res) => {
  const { className, teacher_id, whatsapp_group_id } = req.body;

  try {
    await pool.query(
      'UPDATE classes SET class = ?, teacher_id = ?, whatsapp_group_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [className, teacher_id, whatsapp_group_id, req.params.id]
    );
    res.json({ message: 'Class updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update class', error: err });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM classes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Class deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete class', error: err });
  }
});

module.exports = router;
