const express = require('express');
const router = express.Router();
const Student = require('../models/students');
const Class = require('../models/classes'); 

const classOrder = [
    "الصف السابع",
    "الصف الثامن",
    "الصف التاسع",
    "الصف العاشر",
    "الصف الحادي عشر",
    "الصف البكالوريا"
];

router.put('/promote', async (req, res) => {
    try {
        const students = await Student.find().populate('classId');
        const classes = await Class.find();
        const classMap = {};
        classes.forEach(c => classMap[c.name] = c._id);

        const bulkOps = [];

        for (const student of students) {
        if (student.failedSubjects < 3) {
            const currentIndex = classOrder.indexOf(student.classId.name);
            if (currentIndex < classOrder.length - 1) {
            const nextClassName = classOrder[currentIndex + 1];
            bulkOps.push({
                updateOne: {
                filter: { _id: student._id },
                update: { classId: classMap[nextClassName] }
                }
            });
            }
        }
        }

        if (bulkOps.length) await Student.bulkWrite(bulkOps);

        res.status(200).json({ success: true, message: 'تم ترقية الطلاب بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/reset-failed', async (req, res) => {
    try {
        await Student.updateMany({}, { failedSubjects: 0 });
        res.status(200).json({ success: true, message: 'تم إعادة ضبط المواد الفاشلة لجميع الطلاب' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/report', async (req, res) => {
    try {
        const students = await Student.find().populate('classId');
        const report = students.map(s => ({
        name: `${s.firstName} ${s.middleName} ${s.lastName}`,
        currentClass: s.classId.name,
        failedSubjects: s.failedSubjects,
        eligibleForPromotion: s.failedSubjects < 3
        }));
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
