const express = require('express')
const router = express.Router()
const Schedule = require('../models/schedule')

router.get('/:day', async (req, res) => {
    try {
        const day = req.params.day
        const schedule = await Schedule.findOne({ 
            subclassId: req.session.user.subclass,
            'schedules.day': day
        })
        const dailySchedule = schedule.schedules.find(s => s.day == day);
        res.status(200).json({success: true , data: {
            day: dailySchedule.day,
            items: dailySchedule.items
        } , message: "تم استدعاء برامج الدوام الخاصة بالشعبة بنجاح"})
    } catch (err) {
        res.status(500).json({success: false , data: err.message ,  message: 'فشل في استدعاء برامج الدوام الخاصة بالشعبة' })
    }
})

module.exports = router