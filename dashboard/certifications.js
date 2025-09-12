const express = require('express');
const router = express.Router();
const Student = require('../models/students');
const multer = require('multer');

// Multer config (50MB max, only PDFs)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
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
    const { id } = req.body; // this is the student identifier

    const student = await Student.findOne({ identifier: id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
    }

    student.certificate = {
      name: req.file.originalname,
      data: req.file.buffer,
      contentType: req.file.mimetype,
      uploadedAt: new Date()
    };

    await student.save({ validateModifiedOnly: true });

    return res.status(201).json({
      success: true,
      message: 'تم رفع الملف بنجاح إلى سجل الطالب',
      data: {
        name: student.certificate.name,
        uploadedAt: student.certificate.uploadedAt,
        url: `${req.protocol}://${req.get('host')}/certifications/${student.identifier}/certificate`
      }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({
      success: false,
      message: 'مشكلة في رفع الملف',
      error: error.message
    });
  }
});

// ---------- Get Certificate by Student Identifier ----------
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
    return res.send(student.certificate.data);
  } catch (error) {
    console.error('Fetch Cert Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch certificate' });
  }
});

// Get all students who have certificates
router.get('/history', async (req, res) => {
  try {
    const students = await Student.find(
      { "certificate.data": { $exists: true, $ne: null } },
      { identifier: 1, "certificate.name": 1, "certificate.uploadedAt": 1 }
    ).lean();

    const history = students.map(st => ({
      studentId: st.identifier,
      fileName: st.certificate.name,
      uploadedAt: st.certificate.uploadedAt,
      previewUrl: `${req.protocol}://${req.get('host')}/certifications/${st.identifier}/certificate`
    }));

    res.json({ success: true, data: history });
  } catch (err) {
    console.error("Fetch History Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
});


module.exports = router;
