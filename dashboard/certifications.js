// routes/certifications.js
const express = require('express');
const router = express.Router();
const Student = require('../models/students');
const multer = require('multer');

// ---------- Multer Config (PDF only, 50MB max) ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// ---------- Upload Certificate ----------
router.post('/upload', upload.single('certificate'), async (req, res) => {
  try {
    const { id } = req.body; // student identifier
    if (!id) return res.status(400).json({ success: false, message: 'Student ID is required' });

    const student = await Student.findOne({ identifier: id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (!req.file) return res.status(400).json({ success: false, message: 'No PDF file uploaded' });

    student.certificate = {
      name: req.file.originalname,
      data: req.file.buffer,
      contentType: req.file.mimetype,
      uploadedAt: new Date()
    };

    await student.save({ validateModifiedOnly: true });

    res.status(201).json({
      success: true,
      message: 'Certificate uploaded successfully',
      data: {
        name: student.certificate.name,
        uploadedAt: student.certificate.uploadedAt,
        url: `${req.protocol}://${req.get('host')}/certifications/${student.identifier}/certificate`
      }
    });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ success: false, message: 'Failed to upload certificate', error: err.message });
  }
});

// ---------- Get Certificate ----------
router.get('/:identifier/certificate', async (req, res) => {
  try {
    const student = await Student.findOne({ identifier: req.params.identifier });
    if (!student || !student.certificate || !student.certificate.data) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.set({
      'Content-Type': student.certificate.contentType,
      'Content-Disposition': `inline; filename="${student.certificate.name}"`
    });
    res.send(student.certificate.data);
  } catch (err) {
    console.error('Fetch Certificate Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch certificate', error: err.message });
  }
});

// ---------- Get Upload History for a Student ----------
router.get('/:identifier/history', async (req, res) => {
  try {
    const student = await Student.findOne({ identifier: req.params.identifier });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const history = student.certificate?.data
      ? [{
          studentId: student.identifier,
          fileName: student.certificate.name,
          uploadedAt: student.certificate.uploadedAt,
          previewUrl: `${req.protocol}://${req.get('host')}/certifications/${student.identifier}/certificate`
        }]
      : [];

    res.json({ success: true, data: history });
  } catch (err) {
    console.error('History Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch history', error: err.message });
  }
});

// ---------- Delete Certificate ----------
router.delete('/:identifier', async (req, res) => {
  try {
    const student = await Student.findOne({ identifier: req.params.identifier });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    if (!student.certificate || !student.certificate.data) {
      return res.status(404).json({ success: false, message: 'No certificate found for this student' });
    }

    student.certificate = undefined;
    await student.save({ validateModifiedOnly: true });

    res.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete certificate', error: err.message });
  }
});

// ---------- Get All Students with Certificates ----------
router.get('/history/all', async (req, res) => {
  try {
    const students = await Student.find(
      { "certificate.data": { $exists: true, $ne: null } },
      { identifier: 1, firstName: 1, lastName: 1, "certificate.name": 1, "certificate.uploadedAt": 1 }
    ).lean();

    const history = students.map(st => ({
      studentId: st.identifier,
      studentName: `${st.firstName} ${st.lastName}`,
      fileName: st.certificate.name,
      uploadedAt: st.certificate.uploadedAt,
      previewUrl: `${req.protocol}://${req.get('host')}/certifications/${st.identifier}/certificate`
    }));

    res.json({ success: true, data: history });
  } catch (err) {
    console.error('Fetch All History Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch history', error: err.message });
  }
});

module.exports = router;
