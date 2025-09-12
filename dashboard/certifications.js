const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const Student = require('../models/students')

const router = express.Router()

// Multer storage (keep in memory so we save as Buffer in DB)
const storage = multer.memoryStorage()
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } })

// =========================
// Upload certificate (PDF)
// =========================
router.post('/:id/certificates', upload.single('certificate'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return res.status(404).json({ message: 'Student not found' })

    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files allowed' })
    }

    student.certificates.push({
      name: req.file.originalname,
      data: req.file.buffer,
      contentType: req.file.mimetype
    })

    await student.save()
    res.status(201).json({ message: 'Certificate uploaded successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// =========================
// Get all certificates meta
// =========================
router.get('/:id/certificates', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return res.status(404).json({ message: 'Student not found' })

    const certs = student.certificates.map((c, index) => ({
      index,
      name: c.name,
      uploadedAt: c.uploadedAt
    }))
    res.json(certs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// =========================
// Preview (download) a cert
// =========================
router.get('/:id/certificates/:index', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return res.status(404).json({ message: 'Student not found' })

    const cert = student.certificates[req.params.index]
    if (!cert) return res.status(404).json({ message: 'Certificate not found' })

    res.contentType(cert.contentType)
    res.send(cert.data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// =========================
// Delete a certificate
// =========================
router.delete('/:id/certificates/:index', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) return res.status(404).json({ message: 'Student not found' })

    if (!student.certificates[req.params.index]) {
      return res.status(404).json({ message: 'Certificate not found' })
    }

    student.certificates.splice(req.params.index, 1)
    await student.save()

    res.json({ message: 'Certificate deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
