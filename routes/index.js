const express = require('express');
const router = express.Router();

const whatsappRoutes = require('./whatsapp');
const studentRoutes = require('./students');
const userRoutes = require('./users');
const absenceRoutes = require('./absence');
const classesRoutes = require('./classes');
const settingWaktu = require('./settingWaktu');

router.use('/settings', settingWaktu);
router.use('/classes', classesRoutes);
router.use('/absence', absenceRoutes);
router.use('/students', studentRoutes);
router.use('/users', userRoutes);
router.use('/', whatsappRoutes);

module.exports = router;