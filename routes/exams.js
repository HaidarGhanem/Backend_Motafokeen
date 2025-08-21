const express = require('express')
const router = express.Router()
const { ExamsMarks } = require('../controllers/exams')
const Subject = require('../models/subjects')
const Student = require('../models/students')
const Marks = require('../models/marks')
const mongoose = require('mongoose')

router.get('/', async (req, res) => {
    try {
        const semester = req.headers['semester'];
        const studentId = req.headers['studentid']; 
        
        if (!semester) {
            return res.status(400).json({
                success: false,
                message: 'يجب تحديد الفصل الدراسي في رأس الطلب'
            });
        }
        const subjectsInSemester = await Subject.find({ 
            semester: semester 
        }).select('_id');

        const marks = await Marks.find({ 
            studentId: new mongoose.Types.ObjectId(studentId),
            subjectId: { $in: subjectsInSemester.map(sub => sub._id) }
        }).populate('subjectId', 'name semester');
        
        res.status(200).json({
            success: true,
            data: marks,
            percentage: req.session.user.average,
            message: 'تم استدعاء علامات الطالب بنجاح'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'فشل في استدعاء علامات الطالب'
        });
    }
});


router.get('/download-cert', async (req, res) => {
    try {
        const student = await Student.findById(req.headers['studentid'])
        if (!student) return res.status(404).json({ error: "Student not found" })
        if (!student.certificate.data) return res.status(404).json({ error: "No certificate found" })

        res.set({
            'Content-Type': student.certificate.contentType,
            'Content-Disposition': `attachment; filename="${student.certificate.name}"`,
            'Content-Length': student.certificate.data.length
        })

        res.send(student.certificate.data)

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

module.exports = router