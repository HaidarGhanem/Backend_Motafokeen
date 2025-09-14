const express = require('express');
const router = express.Router();
const Subject = require('../models/subjects');
const Student = require('../models/students');
const Marks = require('../models/marks');
const Class = require('../models/classes');
const AcademicYear = require('../models/year');

// Helper: get active academic year
async function getActiveYear() {
    return AcademicYear.findOne({ active: 1 }).lean();
}

// Create new mark
router.post('/', async (req, res) => {
    try {
        const activeYear = await getActiveYear();
        if (!activeYear) {
            return res.status(404).json({
                success: false,
                message: 'لا يوجد عام دراسي مفعل حالياً'
            });
        }

        const { id, class: className, subject, verbal, homeworks, activities, quiz, finalExam, semester } = req.body;

        const studentInfo = await Student.findOne({ identifier: id, academicYearId: activeYear._id });
        if (!studentInfo) {
            return res.status(404).json({
                success: false,
                message: 'لم يتم إيجاد الطالب في السنة الحالية'
            });
        }

        const classInfo = await Class.findOne({ name: className });
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'الصف غير موجود'
            });
        }

        const subjectInfo = await Subject.findOne({ 
            name: subject,
            classId: classInfo._id
        });
        if (!subjectInfo) {
            return res.status(404).json({
                success: false,
                message: 'لم يتم إيجاد المادة للصف المطلوب'
            });
        }

        const newMark = new Marks({
            verbal,
            homeworks,
            activities,
            quiz,
            finalExam,
            semester: parseInt(semester),
            studentId: studentInfo._id,
            subjectId: subjectInfo._id
        });

        await newMark.save();
        res.status(201).json({
            success: true,
            data: newMark,
            message: 'تم إنشاء العلامة بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create mark: ' + error.message
        });
    }
});

// Update a mark
router.put('/:id', async (req, res) => {
    try {
        const markId = req.params.id;
        const { verbal, homeworks, activities, quiz, finalExam } = req.body;

        if (!markId) {
            return res.status(400).json({
                success: false,
                message: 'Mark ID is required'
            });
        }

        const updatedMark = await Marks.findByIdAndUpdate(markId, {
            verbal,
            homeworks,
            activities,
            quiz,
            finalExam
        }, {
            new: true,
            runValidators: true
        })
        .populate('studentId', 'firstName middleName lastName identifier')
        .populate('subjectId', 'name semester classId');

        if (!updatedMark) {
            return res.status(404).json({
                success: false,
                message: 'العلامة غير موجودة'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedMark,
            message: 'تم تحديث العلامة بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update mark: ' + error.message
        });
    }
});

// Delete a mark
router.delete('/:id', async (req, res) => {
    try {
        const markId = req.params.id;

        if (!markId) {
            return res.status(400).json({
                success: false,
                message: 'Mark ID is required'
            });
        }

        const deletedMark = await Marks.findByIdAndDelete(markId);

        if (!deletedMark) {
            return res.status(404).json({
                success: false,
                message: 'Mark not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'تم حذف العلامة بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete mark: ' + error.message
        });
    }
});

// Get marks with flexible filters (only active year students)
router.post('/search', async (req, res) => {
    try {
        const activeYear = await getActiveYear();
        if (!activeYear) {
            return res.status(404).json({
                success: false,
                message: 'لا يوجد عام دراسي مفعل حالياً'
            });
        }

        const { id, firstName, middleName, lastName, class: className, semester, subject } = req.body;

        let query = {};

        // Build student query if any student filters are provided
        let studentQuery = { academicYearId: activeYear._id }; // restrict to active year
        if (id && id.trim() !== '') studentQuery.identifier = id.trim();
        if (firstName && firstName.trim() !== '') studentQuery.firstName = new RegExp(firstName.trim(), 'i');
        if (middleName && middleName.trim() !== '') studentQuery.middleName = new RegExp(middleName.trim(), 'i');
        if (lastName && lastName.trim() !== '') studentQuery.lastName = new RegExp(lastName.trim(), 'i');

        // If we have student filters, find matching students first
        if (Object.keys(studentQuery).length > 0) {
            const students = await Student.find(studentQuery);
            if (students.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    message: 'لا يوجد تطابق'
                });
            }
            query.studentId = { $in: students.map(s => s._id) };
        }

        // Build subject query if class/semester/subject filters are provided
        if (className && className.trim() !== '') {
            const classInfo = await Class.findOne({ name: className.trim() });
            if (!classInfo) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'الصف غير موجود' 
                });
            }

            let subjectQuery = { classId: classInfo._id };
            if (semester) subjectQuery.semester = parseInt(semester);
            if (subject && subject.trim() !== '') subjectQuery.name = subject.trim();

            const subjects = await Subject.find(subjectQuery);
            if (subjects.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    message: 'لا يوجد تطابق للمادة'
                });
            }
            
            if (!query.subjectId) query.subjectId = {};
            query.subjectId.$in = subjects.map(s => s._id);
        }

        // Fetch marks with populated data
        const marks = await Marks.find(query)
            .populate('studentId', 'firstName middleName lastName identifier academicYearId')
            .populate('subjectId', 'name semester classId') 
            .select('verbal homeworks activities quiz finalExam total finalTotal studentId subjectId result')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: marks,
            message: 'تم استدعاء العلامات بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch marks: ' + error.message
        });
    }
});

module.exports = router;
