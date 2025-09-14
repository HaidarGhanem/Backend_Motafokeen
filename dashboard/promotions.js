const express = require('express');
const router = express.Router();
const Student = require('../models/students'); 
const Class = require('../models/classes');     
const Marks = require('../models/marks');     
const AcademicYear = require('../models/years'); 

const classOrder = [
  "السابع",
  "الثامن",
  "التاسع",
  "العاشر",
  "الحادي عشر",
  "بكلوريا"
];

  // Promote all eligible students (failedSubjects < 3) to next class in classOrder
router.put('/promote', async (req, res) => {
  try {
    // Find the active academic year
    const activeYear = await AcademicYear.findOne({ active: 1 });
    if (!activeYear) {
      return res.status(400).json({ success: false, message: 'No active academic year found' });
    }

    // Only get students in the active academic year
    const students = await Student.find({ academicYearId: activeYear._id })
      .populate('classId')
      .lean();

    const classes = await Class.find().lean();
    const classMap = {};
    classes.forEach(c => {
      if (c && c.name) classMap[c.name.trim()] = c._id;
    });

    const bulkOps = [];
    const promoted = [];
    const skipped = [];

    for (const student of students) {
      const failedSubjects = Number(student.failedSubjects || 0);

      if (failedSubjects >= 3) {
        skipped.push({ id: student._id, reason: 'failedSubjects >= 3' });
        continue;
      }

      const className = student.classId?.name?.trim();
      if (!className) {
        skipped.push({ id: student._id, reason: 'no class assigned' });
        continue;
      }

      const currentIndex = classOrder.findIndex(name => name.trim() === className);
      if (currentIndex === -1) {
        skipped.push({ id: student._id, reason: 'class not in promotion order' });
        continue;
      }

      // Determine next class
      let nextClassName;
      if (currentIndex >= classOrder.length - 1) {
        // Already in last class "بكلوريا", stay there
        nextClassName = classOrder[classOrder.length - 1];
      } else {
        nextClassName = classOrder[currentIndex + 1];
      }

      const nextClassId = classMap[nextClassName];
      if (!nextClassId) {
        skipped.push({ id: student._id, reason: `next class "${nextClassName}" not found in DB` });
        continue;
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: student._id },
          update: { $set: { classId: nextClassId } }
        }
      });

      const fullName = [student.firstName, student.middleName, student.secondMiddleName, student.lastName]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      promoted.push({ id: student._id, name: fullName, from: className, to: nextClassName });
    }

    let bulkResult = null;
    if (bulkOps.length) {
      bulkResult = await Student.bulkWrite(bulkOps);
    }

    res.status(200).json({
      success: true,
      message: 'Promotion run completed',
      promotedCount: promoted.length,
      promoted,
      skippedCount: skipped.length,
      skipped,
      bulkResult
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset failedSubjects for everyone
router.put('/reset-failed', async (req, res) => {
  try {
    const result = await Student.updateMany({}, { $set: { failedSubjects: 0 } });
    const modifiedCount = result.modifiedCount ?? result.nModified ?? 0;
    res.status(200).json({ success: true, message: 'تم إعادة ضبط المواد الفاشلة لجميع الطلاب', modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Report: who is eligible for promotion and their current status
router.get('/report', async (req, res) => {
  try {
    const students = await Student.find().populate('classId').lean();
    const report = students.map(s => {
      const fullName = [s.firstName, s.middleName, s.secondMiddleName, s.lastName]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const currentClass = s.classId && s.classId.name ? s.classId.name.trim() : 'N/A';
      const failedSubjects = Number(s.failedSubjects || 0);
      const currentIndex = classOrder.findIndex(name => name.trim() === currentClass);

      const eligibleForPromotion = failedSubjects < 3 && currentIndex !== -1 && currentIndex < classOrder.length - 1;

      return {
        id: s._id,
        name: fullName,
        currentClass,
        failedSubjects,
        eligibleForPromotion
      };
    });

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;