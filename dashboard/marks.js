const express = require('express');
const router = express.Router();
const Subject = require('../models/studies/subjects');
const Student = require('../models/users/students');
const Marks = require('../models/studies/marks');
const Class = require('../models/academic/classes');

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

module.exports = router;