const express = require('express')
const router = express.Router()
const Student = require('../models/users/students')
const multer = require('multer')

// Multer configuration for PDF uploads (50MB max)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed!'), false)
    }
  }
})

router.post('/upload',  upload.single('certificate'), async (req, res) => {
      try {
        const { id } = req.body
        
        // 1. Validate student exists
        const student = await Student.findOne({identifier: id})
        if (!student) {
          return res.status(404).json({ error: 'Student not found' })
        }
  
        // 2. Check if file was uploaded
        if (!req.file) {
          return res.status(400).json({ error: 'No PDF file uploaded' })
        }
  
        // 3. Update only the certificate fields
        student.certificate = {
          name: req.file.originalname,
          data: req.file.buffer,
          contentType: req.file.mimetype
          // uploadedAt will be auto-set by schema default
        }
  
        // 4. Save only the certificate update
        await student.save({ validateModifiedOnly: true })
        
        res.status(201).json({ 
          success: true, data : { name: student.certificate.name, uploadedAt: student.certificate.uploadedAt } , message: 'تم رفع الملف بنجاح إلى سجل الطالب'
})
  
      } catch (error) {
        res.status(500).json({ 
          success: false , data: error.message , message:'مشكلة في رفع الملف'})
        }
    }
)

module.exports = router