const express = require('express')
const router = express.Router()
const Subject = require('../models/subjects')
const Class = require('../models/classes')
const authorize = require('../functions/authorize')

// Get all classes for dropdown
router.get('/classes', async (req, res) => {
    try {
        const classes = await Class.find({}, 'name');
        res.status(200).json({success: true, data: classes});
    } catch (error) {
        res.status(500).json({success: false, message: 'Failed to fetch classes'});
    }
});

// Create subject
router.post('/', async (req, res) => {
    try {
        const { name, semester, class: className } = req.body;
        const classInfo = await Class.findOne({name: className});
        
        if (!classInfo) {
            return res.status(400).json({success: false, message: 'Class not found'});
        }

        const newSubject = new Subject({
            name, 
            semester, 
            classId: classInfo._id
        });
        
        await newSubject.save();
        res.status(201).json({
            success: true, 
            data: newSubject, 
            message: 'Subject created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: 'Failed to create subject'
        });
    }
});

// Get all subjects (with optional class filter)
router.get('/', async (req, res) => {
    try {
        let query = {};
        if (req.query.class) {
            const classInfo = await Class.findOne({name: req.query.class});
            if (classInfo) {
                query.classId = classInfo._id;
            }
        }
        
        const subjects = await Subject.find(query).populate('classId', 'name');
        res.status(200).json({
            success: true, 
            data: subjects, 
            message: 'Subjects fetched successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: 'Failed to fetch subjects'
        });
    }
});

// Get subjects by class and semester
router.get('/by-class-semester', async (req, res) => {
    try {
        const { class: className, semester } = req.query;
        
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

        const subjects = await Subject.find({
            classId: classInfo._id,
            semester: parseInt(semester)
        }).populate('classId', 'name');

        res.status(200).json({
            success: true,
            data: subjects,
            message: 'Subjects fetched successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subjects'
        });
    }
});

// Update subject
router.put('/:id', async (req, res) => {
    try {
        const { name, semester, class: className } = req.body;
        let updateData = { name, semester };
        
        if (className) {
            const classInfo = await Class.findOne({name: className});
            if (classInfo) {
                updateData.classId = classInfo._id;
            }
        }
        
        const updatedSubject = await Subject.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('classId', 'name');
        
        res.status(200).json({
            success: true, 
            data: updatedSubject, 
            message: 'Subject updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: 'Failed to update subject'
        });
    }
});

// Delete subject
router.delete('/:id', async (req, res) => {
    try {
        await Subject.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true, 
            message: 'Subject deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: 'Failed to delete subject'
        });
    }
});

module.exports = router;