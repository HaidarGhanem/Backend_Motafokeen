const express = require('express')
const router = express.Router()
const Student = require('../models/users/students')
const Absence = require('../models/users/absence')

// Get student's own attendance data
router.get('/', async (req, res) => {
    try {
        const studentId = req.session.user.id
        
        // 1. Get student's basic info and counts
        const student = await Student.findById(studentId)
            .select('firstName lastName presence absence')
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' })
        }

        // 2. Get all absence records
        const absences = await Absence.find({ studentId })
            .sort({ date: -1 }) // Newest first
            .select('date verified description -_id') // Exclude _id

        res.status(200).json({
            student: {
                name: `${student.firstName} ${student.lastName}`,
                presence: student.presence || 0,
                absence: student.absence || 0,
            },
            absences
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

module.exports = router