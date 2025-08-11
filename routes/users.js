const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// GET all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, name, role, created_at FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err });
  }
});

// GET user by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err });
  }
});

// POST create user
router.post('/', async (req, res) => {
  const { email, name, password, role } = req.body;
  const id = uuidv4();

  // Validasi role
  const validRoles = ['admin', 'operator', 'guru'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (id, email, name, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, email, name, hashedPassword, role]
    );
    res.status(201).json({ message: 'User created', id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user', error: err });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  const { email, name, password, role } = req.body;

  // Validasi role
  const validRoles = ['admin', 'operator', 'guru'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    let query = 'UPDATE users SET email = ?, name = ?, role = ?, updated_at = CURRENT_TIMESTAMP';
    const values = [email, name, role];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      values.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    values.push(req.params.id);

    await pool.query(query, values);
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user', error: err });
  }
});

module.exports = router;
