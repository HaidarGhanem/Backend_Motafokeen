const express = require('express')
const router = express.Router()
const Student = require('../models/users/students')
const Subclass = require('../models/academic/subclasses')


// Top Students Ranked with the same SubClass
router.get('/', async (req, res) => {
    try {
        const subclassId = req.session.user.subclass;
        
        // First verify subclass exists
        const subclassExists = await Subclass.findById({_id: subclassId});
        if (!subclassExists) {
            return res.status(404).json({ 
                success: false,
                message: 'الشعبة غير موجودة' 
            });
        }

        // Get students with calculated averages
        const students = await Student.find({ 
            subclassId: subclassId,
            average: { $gt: 0 } // Only students with calculated averages > 0
        })
        .sort({ average: -1 }) // Highest average first
        .select('firstName middleName lastName average picture presence absence')
        .lean(); // Convert to plain JS objects

        if (students.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'لا يوجد طلاب في هذه الشعبة بعد',
                data: {
                    subclass: subclassId,
                    count: 0,
                    students: []
                }
            });
        }

        // Add rank position (considering ties)
        let currentRank = 1;
        const rankedStudents = students.map((student, index) => {
            // If not first student and average is same as previous, keep same rank
            if (index > 0 && student.average === students[index-1].average) {
                return { ...student, rank: currentRank };
            }
            currentRank = index + 1;
            return { ...student, rank: currentRank };
        });

        res.status(200).json({
            success: true,
            message: 'تم جلب تصنيف الطلاب بنجاح',
            data: {
                subclass: subclassId,
                className: subclassExists.name, // Add subclass name
                count: rankedStudents.length,
                students: rankedStudents
            }
        });

    } catch (error) {
        console.error('Error fetching ranked students:', error);
        res.status(500).json({ 
            success: false,
            message: 'خطأ في جلب تصنيف الطلاب',
            error: error.message 
        });
    }
});

// Get ranked students within a specific class
router.get('/class', async (req, res) => {
    try {
        const classId = req.session.user.class;
        const limit = parseInt(req.query.limit) || 50 // Default top 50

        const rankedStudents = await Student.find({ 
            classId: classId,
            average: { $exists: true, $ne: null } // Only students with averages
        })
        .sort({ average: -1 }) // Highest average first
        .limit(limit)
        .select('firstName lastName average picture identifier')
        .populate('subclassId', 'name') // Include subclass info

        res.status(200).json({
            classId: classId,
            count: rankedStudents.length,
            students: rankedStudents.map((student, index) => ({
                ...student.toObject(),
                rank: index + 1 // Add rank position
            }))
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Get ranked students across all classes
router.get('/topall', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100 // Default top 100

        const rankedStudents = await Student.find({ 
            average: { $exists: true, $ne: null } // Only students with averages
        })
        .sort({ average: -1 }) // Highest average first
        .limit(limit)
        .select('firstName lastName average picture identifier classId subclassId')
        .populate('classId', 'name')
        .populate('subclassId', 'name')

        res.status(200).json({
            count: rankedStudents.length,
            students: rankedStudents.map((student, index) => ({
                ...student.toObject(),
                rank: index + 1 // Add rank position
            }))
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

module.exports = router