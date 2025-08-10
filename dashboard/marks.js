const express = require('express');
const router = express.Router();
const Subject = require('../models/subjects');
const Student = require('../models/students');
const Marks = require('../models/marks');
const Class = require('../models/classes');

// Create new mark
router.post('/', async (req, res) => {
    try {
        const { id, class: className, subject, firstQuiz, secondQuiz, finalExam } = req.body;


        const studentInfo = await Student.findOne({ identifier: id });
        if (!studentInfo) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const classInfo = await Class.findOne({ name: className });
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        const subjectInfo = await Subject.findOne({ 
            name: subject,
            classId: classInfo._id
        });
        if (!subjectInfo) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found for this class'
            });
        }

        const newMark = new Marks({
            firstQuiz,
            secondQuiz,
            finalExam,
            studentId: studentInfo._id,
            subjectId: subjectInfo._id
        });

        await newMark.save();
        res.status(201).json({
            success: true,
            data: newMark,
            message: 'Mark created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create mark: ' + error.message
        });
    }
});

// Get marks by student ID
router.post('/student', async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }

        const studentInfo = await Student.findOne({ identifier: id });
        if (!studentInfo) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const marks = await Marks.find({ studentId: studentInfo._id })
            .populate('studentId', 'firstName lastName identifier')
            .populate('subjectId', 'name semester classId');

        res.status(200).json({
            success: true,
            data: marks,
            message: 'Marks retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch marks: ' + error.message
        });
    }
});


// Get marks by subject
router.post('/subject', async (req, res) => {
    try {
        const { class: className, semester, subject } = req.body;

        if (!className || !semester) {
            return res.status(400).json({
                success: false,
                message: 'Class and semester are required'
            });
        }

        const classInfo = await Class.findOne({ name: className });
        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        const query = { 
            classId: classInfo._id,
            semester 
        };

        if (subject) {
            query.name = subject;
        }

        const subjectInfo = await Subject.findOne(query);
        if (!subjectInfo) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found'
            });
        }

        const marks = await Marks.find({ subjectId: subjectInfo._id })
            .populate('studentId', 'firstName lastName identifier')
            .populate('subjectId', 'name semester classId');

        res.status(200).json({
            success: true,
            data: marks,
            message: 'Marks retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch marks: ' + error.message
        });
    }
});

// Update a mark
router.put('/:id', async (req, res) => {
    try {
        const markId = req.params.id;
        const { firstQuiz, secondQuiz, finalExam } = req.body;

        if (!markId || firstQuiz === undefined || secondQuiz === undefined || finalExam === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Mark ID and all marks are required'
            });
        }

        const updatedMark = await Marks.findByIdAndUpdate(markId, {
            firstQuiz,
            secondQuiz,
            finalExam
        }, {
            new: true,
            runValidators: true
        })
        .populate('studentId', 'firstName lastName identifier')
        .populate('subjectId', 'name semester classId');

        if (!updatedMark) {
            return res.status(404).json({
                success: false,
                message: 'Mark not found'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedMark,
            message: 'Mark updated successfully'
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
            message: 'Mark deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete mark: ' + error.message
        });
    }
});
// Get marks with flexible filters
router.post('/search', async (req, res) => {
    try {
        const { id, class: className, semester, subject } = req.body;

        let marksQuery = {};

        // If searching by Student ID
        if (id && id.trim() !== '') {
            const studentInfo = await Student.findOne({ identifier: id.trim() });
            if (!studentInfo) {
                return res.status(404).json({ success: false, message: 'Student not found' });
            }
            marksQuery.studentId = studentInfo._id;
        }

        // If filtering by Class + Semester (+ optional Subject)
        if (className && className.trim() !== '' && semester) {
            const classInfo = await Class.findOne({ name: className.trim() });
            if (!classInfo) {
                return res.status(404).json({ success: false, message: 'Class not found' });
            }

            // Get subjects in this class/semester
            let subjectFilter = { classId: classInfo._id, semester };
            if (subject && subject.trim() !== '') {
                subjectFilter.name = subject.trim();
            }

            const subjectDocs = await Subject.find(subjectFilter);
            if (!subjectDocs || subjectDocs.length === 0) {
                return res.status(404).json({ success: false, message: 'No subjects found matching criteria' });
            }

            // Filter marks by these subject IDs
            marksQuery.subjectId = { $in: subjectDocs.map(s => s._id) };
        }

        // Fetch marks (empty query means all marks)
        const marks = await Marks.find(marksQuery)
            .populate('studentId', 'firstName lastName identifier')
            .populate('subjectId', 'name semester classId');

        res.status(200).json({
            success: true,
            data: marks,
            message: 'Marks retrieved successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch marks: ' + error.message
        });
    }
});

module.exports = router;