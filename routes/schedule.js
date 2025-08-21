const express = require('express')
const router = express.Router()
const Schedule = require('../models/schedule')

router.get('/', async (req, res) => {
  try {
    const subclassId = req.headers['subclassid']; // <-- getting from headers
    const schedules = await Schedule.find({ subclassId }); // <-- exact match required
    res.status(200).json({ success: true, data: schedules, message: "تم استدعاء برامج الدوام الخاصة بالشعبة بنجاح" });
  } catch (err) {
    res.status(500).json({ success: false, message: 'فشل في استدعاء برامج الدوام الخاصة بالشعبة', data: err.message });
  }
});

module.exports = router