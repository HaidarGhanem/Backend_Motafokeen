const express = require('express')
const router = express.Router()
const Student = require('../models/students')
const Class = require('../models/classes')
const Subclass = require('../models/subclasses')
const AcademicYear = require('../models/year')
const crypto = require('crypto')

function generateIdentifier() {
    return crypto.randomInt(10000, 99999).toString()
}

router.get('/options', async (req, res) => {
    try {
        const classes = await Class.find({}, 'name');
        const academicYears = await AcademicYear.find({}, 'year');
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

router.get('/', async (req, res) => {
    try {
        const { classId, subclassId } = req.query;
        let query = {};

        // Get the active academic year
        const activeAcademicYear = await AcademicYear.findOne({ active: 1 });
        if (!activeAcademicYear) {
            return res.status(404).json({
                success: false,
                message: 'No active academic year found'
            });
        }

        // Always include academicYearId condition for active year
        query.academicYearId = activeAcademicYear._id;

        if (classId && subclassId) {
            const classInfo = await Class.findById(classId);
            const subclassInfo = await Subclass.findById(subclassId);
            if (!classInfo || !subclassInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Class or subclass not found'
                });
            }
            query.classId = classInfo._id;
            query.subclassId = subclassInfo._id;
        } else if (classId) {
            const classInfo = await Class.findById(classId);
            if (!classInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Class not found'
                });
            }
            query.classId = classInfo._id;
        }

        const students = await Student.find(query)
            .populate('classId', 'name')
            .populate('subclassId', 'name')
            .populate('academicYearId', 'year')
            .select('firstName middleName lastName email password identifier classId subclassId academicYearId gender nationality city birthDate father_name mother_name')
            .sort({ createdAt: -1 }) 
            .exec();
        
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

router.post('/', async (req, res) => {
    try {
        const {
            firstName, middleName, secondMiddleName, lastName, email,
            classId, subclassId, academicYearId,
            gender, nationality, city, birthDate,
            father_name, mother_name
        } = req.body;
        if (!firstName || !lastName || !classId || !subclassId || !academicYearId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        const studentCount = await Student.countDocuments({ subclassId });
        if (studentCount >= 35) {
            return res.status(400).json({
                success: false,
                message: 'Subclass is full'
            });
        }
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
        const finalNationality = nationality && nationality.trim() !== '' ? nationality : "عربي سوري";
        const finalEmail = email && email.trim() !== '' ? email : "motafokeen.school@gmail.com";
        const newStudent = new Student({
            firstName,
            middleName,
            secondMiddleName,
            lastName,
            email: finalEmail,
            password,
            classId,
            subclassId,
            academicYearId,
            identifier,
            gender,
            nationality: finalNationality,
            city,
            birthDate: birthDate ? new Date(birthDate) : undefined,
            father_name,
            mother_name,
            role: 'student'
        });
        await newStudent.save();
        res.status(201).json({
            success: true,
            data: {
                ...newStudent.toObject(),
                password 
            },
            message: 'تم إنشاء سجل الطالب بنجاح'
        });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في إنشاء سجل الطالب',
            error: error.message
        });
    } 
});

router.put('/:id', async (req, res) => {
    try {
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        )
        .populate('classId', 'name')
        .populate('subclassId', 'name')
        .populate('academicYearId', 'year')
        .select('firstName middleName lastName email password identifier classId subclassId academicYearId gender nationality city birthDate father_name mother_name');
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