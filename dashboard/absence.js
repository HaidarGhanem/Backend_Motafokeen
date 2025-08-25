const express = require('express');
const router = express.Router();
const Student = require('../models/students.js');
const Subclass = require('../models/subclasses.js');
const Class = require('../models/classes.js');
const Absence = require('../models/absence.js');
const AcademicYear = require('../models/year.js');
const authorize = require('../functions/authorize');

router.post('/get-subclass-students', async (req, res) => {
    try {
        const { class: className, subclass: subclassName } = req.body;

        const activeAcademicYear = await AcademicYear.findOne({ active: 1 });
        if (!activeAcademicYear) {
            return res.status(404).json({
                success: false,
                message: 'No active academic year found'
            });
        }

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

        const students = await Student.find({
            subclassId: subclassInfo._id,
            academicYearId: activeAcademicYear._id
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

router.post('/mark-attendance', async (req, res) => {
    try {
        const { class: className, subclass, date = new Date(), absentStudentIds = [], description } = req.body;

        const activeAcademicYear = await AcademicYear.findOne({ active: 1 });
        if (!activeAcademicYear) {
            return res.status(404).json({
                success: false,
                message: 'No active academic year found'
            });
        }

        const classInfo = await Class.findOne({ name: className });
        const subclassInfo = await Subclass.findOne({ name: subclass, classId: classInfo._id });

        if (!classInfo || !subclassInfo) {
            return res.status(404).json({
                success: false,
                message: 'Class or subclass not found'
            });
        }

        const students = await Student.find({
            subclassId: subclassInfo._id,
            academicYearId: activeAcademicYear._id
        });

        const results = await Promise.all(students.map(async student => {
            const isAbsent = absentStudentIds.includes(student.identifier);

            if (isAbsent) {
                const absence = new Absence({
                    studentId: student._id,
                    date,
                    description,
                    verified: true
                });
                await absence.save();

                student.absence = (student.absence || 0) + 1;
            } else {
                student.presence = (student.presence || 0) + 1;
            }

            await student.save();

            return {
                studentId: student._id,
                identifier: student.identifier,
                name: `${student.firstName} ${student.lastName}`,
                status: isAbsent ? 'absent' : 'present'
            };
        }));

        res.status(200).json({
            success: true,
            message: 'تم تسجيل الحضور بنجاح',
            data: { results }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'فشل في تسجيل الحضور'
        });
    }
});

module.exports = router;
