const express = require('express')
const router = express.Router()
const { ExamsMarks } = require('../controllers/exams')
const Student = require('../models/users/students')
const Marks = require('../models/studies/marks')



router.get('/',  async (req, res) => {
    try {
            const marks = await Marks.find({ studentId: req.session.user.id })
            .populate('subjectId', 'name semester')
            res.status(200).json({success: true , data: marks , percentage: req.session.user.average , message: 'تم استدعاء علامات الطالب بنجاح' })
        } catch (error) {
            console.error(error)
            res.status(500).json({success: false , data: error.message , message:'فشل في استدعاء علامات الطالب'})
        }
})

//Download Certification
router.get('/download-cert', async (req, res) => {
    try {
        const student = await Student.findById(req.session.user.id)
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