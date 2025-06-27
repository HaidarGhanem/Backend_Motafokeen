const express = require('express');
const router = express.Router();
const Student = require('../models/users/students');
const Teacher = require('../models/users/teachers');
const Class = require('../models/academic/classes');
const Subclass = require('../models/academic/subclasses');
const Admin = require('../models/users/admins');
const AcademicYear = require('../models/academic/year') // Assuming you have a User model for admins
const authorize = require('../functions/authorize');

// Get all statistics
router.get('/', async (req, res) => {
    try {
        // 1. Get counts of all entities
        const [studentCount, teacherCount, adminCount] = await Promise.all([
            Student.countDocuments(),
            Teacher.countDocuments(),
            Admin.countDocuments() // Adjust based on your User model
        ]);

        const yearInfo = await AcademicYear.findOne()
        .sort({ startDate: -1 })  // Sort by startDate descending (newest first)
        .select('year -_id')      // Only return the year field, exclude _id
        .lean();
        const year = yearInfo.year

        // 2. Get student distribution by class
        const classes = await Class.find().lean();
        const classStats = await Promise.all(classes.map(async (classItem) => {
            const subclasses = await Subclass.find({ classId: classItem._id });
            const subclassIds = subclasses.map(s => s._id);
            const count = await Student.countDocuments({ subclassId: { $in: subclassIds } });
            
            return {
                className: classItem.name,
                count,
                percentage: studentCount > 0 ? Math.round((count / studentCount) * 100) : 0
            };
        }));

        // 3. Prepare response
        const response = {
            
            counts: {
                students: studentCount,
                teachers: teacherCount,
                admins: adminCount,
                yearName: year
            },
            studentDistribution: {
                byClass: classStats,
                totalStudents: studentCount
            }
        };
        res.status(200).json({
            success: true,
            message: 'تم جلب الإحصائيات بنجاح',
            data: response
        });

    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب الإحصائيات',
            error: error.message
        });
    }
});

module.exports = router;