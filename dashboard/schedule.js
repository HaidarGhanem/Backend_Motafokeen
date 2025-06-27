const express = require('express');
const router = express.Router();
const Schedule = require('../models/studies/schedule');
const Class = require('../models/academic/classes');
const Subclass = require('../models/academic/subclasses');

// Create a new schedule for a subclass
router.post('/', async (req, res) => {
    try {
        const { subclass, schedules } = req.body;
        
        if (!req.body.class || !subclass || !schedules) {
            return res.status(400).json({
                success: false,
                message: 'Class, subclass, and schedules are required'
            });
        }

        const classInfo = await Class.findOne({ name: req.body.class });
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        const subclassInfo = await Subclass.findOne({
            name: subclass,
            classId: classInfo._id
        });
        if (!subclassInfo) {
            return res.status(404).json({
                success: false,
                message: 'Subclass not found for the specified class'
            });
        }

        const newSchedule = new Schedule({
            classId: classInfo._id,
            subclassId: subclassInfo._id,
            schedules,
        });

        const savedSchedule = await newSchedule.save();
        res.status(201).json({
            success: true,
            data: savedSchedule,
            message: 'تم إنشاء برنامج الدوام بنجاح'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'فشل إنشاء جدول برنامج دوام: ' + err.message
        });
    }
});

// Add or update a daily schedule for a subclass
router.post('/day', async (req, res) => {
    try {
        const { day, items, subclass } = req.body;
        const className = req.body.class;

        if (!className || !subclass || !day || !items) {
            return res.status(400).json({
                success: false,
                message: 'Class, subclass, day, and items are required'
            });
        }

        const classInfo = await Class.findOne({ name: className });
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        const subclassInfo = await Subclass.findOne({
            name: subclass,
            classId: classInfo._id
        });
        if (!subclassInfo) {
            return res.status(404).json({
                success: false,
                message: 'Subclass not found for the specified class'
            });
        }

        // Find the schedule for this subclass
        let schedule = await Schedule.findOne({
            subclassId: subclassInfo._id,
            classId: classInfo._id
        });

        if (!schedule) {
            schedule = new Schedule({
                classId: classInfo._id,
                subclassId: subclassInfo._id,
                schedules: [{ day, items }]
            });
        } else {
            // Check if day already exists
            const dayIndex = schedule.schedules.findIndex(s => s.day === day);
            if (dayIndex >= 0) {
                // Update existing day
                schedule.schedules[dayIndex].items = items;
            } else {
                // Add new day
                schedule.schedules.push({ day, items });
            }
        }

        const updatedSchedule = await schedule.save();
        res.status(200).json({
            success: true,
            data: updatedSchedule,
            message: 'تم إنشاء/تحديث برنامج الدوام اليومي بنجاح'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'فشل إنشاء/تحديث جدول برنامج دوام: ' + err.message
        });
    }
});

// Get all schedules
router.get('/', async (req, res) => {
    try {
        const schedules = await Schedule.find().populate('classId subclassId');
        res.status(200).json({
            success: true,
            data: schedules,
            message: 'تم استدعاء برامج الدوام بنجاح'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'فشل في استدعاء برامج الدوام: ' + err.message
        });
    }
});

// Get schedule for a specific subclass
router.post('/subclass', async (req, res) => {
    try {
        const { class: className, subclass } = req.body;

        if (!className || !subclass) {
            return res.status(400).json({
                success: false,
                message: 'Class and subclass are required'
            });
        }

        const classInfo = await Class.findOne({ name: className });
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        const subclassInfo = await Subclass.findOne({
            name: subclass,
            classId: classInfo._id
        });
        if (!subclassInfo) {
            return res.status(404).json({
                success: false,
                message: 'Subclass not found for the specified class'
            });
        }

        const schedule = await Schedule.findOne({
            classId: classInfo._id,
            subclassId: subclassInfo._id
        }).populate('classId subclassId');

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found for the specified subclass'
            });
        }

        res.status(200).json({
            success: true,
            data: schedule,
            message: "تم استدعاء برامج الدوام الخاصة بالشعبة بنجاح"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'فشل في استدعاء برامج الدوام الخاصة بالشعبة: ' + err.message
        });
    }
});

// Get daily schedule for a subclass on a specific day
router.post('/day', async (req, res) => {
    try {
        const { class: className, subclass, day } = req.body;

        if (!className || !subclass || !day) {
            return res.status(400).json({
                success: false,
                message: 'Class, subclass, and day are required'
            });
        }

        const classInfo = await Class.findOne({ name: className });
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        const subclassInfo = await Subclass.findOne({
            name: subclass,
            classId: classInfo._id
        });
        if (!subclassInfo) {
            return res.status(404).json({
                success: false,
                message: 'Subclass not found for the specified class'
            });
        }

        const schedule = await Schedule.findOne({
            subclassId: subclassInfo._id,
            'schedules.day': day
        }).populate('classId subclassId');

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found for the specified day'
            });
        }

        const dailySchedule = schedule.schedules.find(s => s.day === day);
        res.status(200).json({
            success: true,
            data: {
                day: dailySchedule.day,
                items: dailySchedule.items
            },
            message: "تم استدعاء برامج الدوام الخاصة بالشعبة بنجاح"
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'فشل في استدعاء برامج الدوام الخاصة بالشعبة: ' + err.message
        });
    }
});

// Update entire schedule for a subclass
router.put('/update', async (req, res) => {
    try {
        const { day, items, subclass } = req.body;
        const className = req.body.class;

        if (!className || !subclass || !day || !items) {
            return res.status(400).json({
                success: false,
                message: 'Class, subclass, day, and items are required'
            });
        }

        const classInfo = await Class.findOne({ name: className });
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        const subclassInfo = await Subclass.findOne({
            name: subclass,
            classId: classInfo._id
        });
        if (!subclassInfo) {
            return res.status(404).json({
                success: false,
                message: 'Subclass not found for the specified class'
            });
        }

        const updatedSchedule = await Schedule.findOneAndUpdate(
            {
                subclassId: subclassInfo._id,
                'schedules.day': day
            },
            {
                $set: {
                    'schedules.$.items': items
                }
            },
            { new: true }
        ).populate('classId subclassId');

        if (!updatedSchedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found for update'
            });
        }

        res.json({
            success: true,
            data: updatedSchedule,
            message: 'تم تحديث جدول يوم ' + day
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'فشل في تحديث الجدول: ' + err.message
        });
    }
});

// Delete entire schedule for a subclass
router.delete('/:subclassId', async (req, res) => {
    try {
        const deletedSchedule = await Schedule.findOneAndDelete({
            subclassId: req.params.subclassId
        });

        if (!deletedSchedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        res.json({
            success: true,
            message: 'Schedule deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete schedule: ' + err.message
        });
    }
});

// Delete a specific day from a subclass's schedule
router.delete('/:subclassId/day/:day', async (req, res) => {
    try {
        const { subclassId, day } = req.params;

        const updatedSchedule = await Schedule.findOneAndUpdate(
            { subclassId: subclassId },
            { $pull: { schedules: { day } } },
            { new: true }
        ).populate('classId subclassId');

        if (!updatedSchedule) {
            return res.status(404).json({
                success: false,
                message: 'Schedule not found'
            });
        }

        res.json({
            success: true,
            data: updatedSchedule,
            message: 'Day schedule deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete day schedule: ' + err.message
        });
    }
});

module.exports = router;