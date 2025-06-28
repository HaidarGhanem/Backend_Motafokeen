const express = require('express')
const router = express.Router()
const Student = require('../models/students')
const Class = require('../models/classes')
const Subclass = require('../models/subclasses')
const AcademicYear = require('../models/year')
const authorize = require('../functions/authorize')
const crypto = require('crypto')

function generateIdentifier() {
    return crypto.randomInt(10000, 99999).toString()
}

// Get all classes with their subclasses and academic years for dropdowns
router.get('/options', async (req, res) => {
    try {
        const classes = await Class.find({}, 'name');
        const academicYears = await AcademicYear.find({}, 'year');
        
        // Get subclasses grouped by class
        const classesWithSubclasses = await Promise.all(classes.map(async (cls) => {
            const subclasses = await Subclass.find({ classId: cls._id }, 'name');
            return {
                ...cls.toObject(),
                subclasses
            };
        }));
        
        res.status(200).json({
            success: true,
            data: {
                classes: classesWithSubclasses,
                academicYears
            },
            message: 'Options fetched successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch options',
            error: error.message
        });
    }
});

// Get students with filters
router.get('/', async (req, res) => {
    try {
        const { classId, subclassId } = req.query;
        let query = {};

        if (classId && subclassId) {
            // Get students by class and subclass
            const classInfo = await Class.findById(classId);
            const subclassInfo = await Subclass.findById(subclassId);
            
            if (!classInfo || !subclassInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Class or subclass not found'
                });
            }

            query = { 
                classId: classInfo._id,
                subclassId: subclassInfo._id
            };
        } else if (classId) {
            // Get students by class only
            const classInfo = await Class.findById(classId);
            if (!classInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Class not found'
                });
            }
            query = { classId: classInfo._id };
        }
        // If no filters, get all students

        const students = await Student.find(query)
            .populate('classId', 'name')
            .populate('subclassId', 'name')
            .populate('academicYearId', 'year')
            .select('firstName middleName lastName email password identifier classId subclassId academicYearId');
            
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

// Create student
router.post('/', async (req, res) => {
    try {
        const { firstName, middleName, lastName, email, classId, subclassId, academicYearId } = req.body;

        // Generate unique identifier
        let identifier;
        let isUnique = false;
        
        while (!isUnique) {
            identifier = generateIdentifier();
            const existingStudent = await Student.findOne({ identifier });
            if (!existingStudent) {
                isUnique = true;
            }
        }

        const password = generateIdentifier();
        const newStudent = new Student({
            firstName,
            middleName,
            lastName,
            email,
            password,
            classId,
            subclassId,
            academicYearId,
            identifier,
            role: 'student'
        });

        await newStudent.save();
        
        res.status(201).json({
            success: true,
            data: {
                ...newStudent.toObject(),
                password // Include password in response
            },
            message: 'Student created successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create student',
            error: error.message
        });
    }
});

// Update student
router.put('/:id', async (req, res) => {
    try {
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('classId', 'name')
         .populate('subclassId', 'name')
         .populate('academicYearId', 'year')
         .select('firstName middleName lastName email password identifier classId subclassId academicYearId');
        
        if (!updatedStudent) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.status(200).json({
            success: true,
            data: updatedStudent,
            message: 'Student updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update student',
            error: error.message
        });
    }
});

// Delete student
router.delete('/:id', async (req, res) => {
    try {
        const deletedStudent = await Student.findByIdAndDelete(req.params.id);
        
        if (!deletedStudent) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete student',
            error: error.message
        });
    }
});

module.exports = router;