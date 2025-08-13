const express = require('express')
const router = express.Router()
const Schedule = require('../models/schedule')

router.get('/', async (req, res) => {
    try {
        const schedules = await Schedule.find({ 
            subclassId: req.session.user.subclass
        })
        res.status(200).json({success: true , data:  schedules  , message: "تم استدعاء برامج الدوام الخاصة بالشعبة بنجاح"})
    } catch (err) {
        res.status(500).json({success: false , data: err.message ,  message: 'فشل في استدعاء برامج الدوام الخاصة بالشعبة' })
    }
})

module.exports = router