const express = require('express');
const router = express.Router();
const Subject = require('../models/subjects');
const Student = require('../models/students');
const Marks = require('../models/marks');
const Class = require('../models/classes');

// Create new mark
router.post('/', async (req, res) => {
    try {
        const { id, class: className, subject, firstQuiz, secondQuiz, finalExam , semester} = req.body;

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
            semester: parseInt(semester),
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
        .populate('studentId', 'firstName middleName lastName identifier')
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
        const { id, firstName, middleName, lastName, class: className, semester, subject } = req.body;

        let query = {};

        // Build student query if any student filters are provided
        let studentQuery = {};
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
                    message: 'No marks found matching criteria'
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
                    message: 'Class not found' 
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
                    message: 'No subjects found matching criteria'
                });
            }
            
            // Add subject filter to main query
            if (!query.subjectId) query.subjectId = {};
            query.subjectId.$in = subjects.map(s => s._id);
        }

        // Fetch marks with populated data
       const marks = await Marks.find(query)
    .populate('studentId', 'firstName middleName lastName identifier')
    .populate('subjectId', 'name classId') // لا نحتاج semester من subject
    .select('firstQuiz secondQuiz secondQuiz finalExam semester studentId subjectId') // نتأكد semester يطلع
    .sort({ 'studentId.lastName': 1, 'subjectId.name': 1 });


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