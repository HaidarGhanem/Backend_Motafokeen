const express = require('express')
const router = express.Router()
const Student = require('../models/users/students.js')
const Subclass = require('../models/academic/subclasses')
const Class = require('../models/academic/classes')
const Absence = require('../models/users/absence.js')
const authorize = require('../functions/authorize')

// Add this new endpoint to your absence routes
router.post('/get-subclass-students', async (req, res) => {
    try {
        const { class: className, subclass: subclassName } = req.body;

        // 1. Find the class and subclass
        const classInfo = await Class.findOne({ name: className });
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        const subclassInfo = await Subclass.findOne({ 
            name: subclassName, 
            classId: classInfo._id 
        });
        if (!subclassInfo) {
            return res.status(404).json({
                success: false,
                message: 'Subclass not found'
            });
        }

        // 2. Find all students in this subclass
        const students = await Student.find({ 
            subclassId: subclassInfo._id 
        }).select('firstName lastName identifier _id');

        res.status(200).json({
            success: true,
            data: students,
            message: 'Students fetched successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch students',
            error: error.message
        });
    }
});

// Mark absent students for a subclass (automatically marks others as present)
router.post('/mark-attendance', async (req, res) => {
    try {
        const { subclass, date = new Date(), absentStudentIds = [], description } = req.body

        // 1. Get all students in the subclass
        const classInfo = await Class.findOne({name: req.body.class})
        const subclassInfo = await Subclass.findOne({name: subclass , classId: classInfo._id})
        const students = await Student.find({ subclassId: subclassInfo._id})

        // 2. Process each student
        const results = await Promise.all(students.map(async student => {
            const isAbsent = absentStudentIds.includes(student.identifier)
            
            if (isAbsent) {
                // Create absence record
                const absence = new Absence({
                    studentId: student._id,
                    date,
                    description,
                    verified: true
                })
                await absence.save()
                
                // Update student's absence count
                student.absence = (student.absence || 0) + 1
            } else {
                // Update student's presence count
                student.presence = (student.presence || 0) + 1
            }
            
            await student.save()
            return {
                studentId: student._id,
                identifier: student.identifier,
                name: `${student.firstName} ${student.lastName}`,
                status: isAbsent ? 'absent' : 'present'
            }
        }))

        res.status(200).json({
            success: true,
            message: 'تم تسجيل الحضور بنجاح',
            data: {
                results
            }
        })

    } catch (error) {
        res.status(500).json({success: false , data: error.message , message:'فشل في تسجيل الحضور' })
    }
})

module.exports = router