const express = require('express')
const router = express.Router()
const AcademicYear = require('../models/year')
const authorize = require('../functions/authorize')

// Create
router.post('/', async (req, res) => {
    try {
        const { year , database , startDate , endDate } = req.body
        const academicYear = new AcademicYear({ year , database , startDate , endDate })
        await academicYear.save()
        res.status(201).json({success: true , data: academicYear , message: 'تم إنشاء السنة الدراسية بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في إنشاء السنة الدراسية'})
    }
    
})

// Read All Years
router.get('/', async (req, res) => {
    try {
        const years = await AcademicYear.find()
        res.status(200).json({success: true , data: years , message: 'تم استدعاء بيانات السنوات الدراسية بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في استدعاء بيانات السنوات الدراسية'})
    }
})

// Update
router.put('/:year', async (req, res) => {
    try {
        const updatedYear = await AcademicYear.findOneAndUpdate({year: req.params.year}, req.body , { new: true })
        res.status(200).json({success: true , data: updatedYear , message: 'تم تعديل بيانات السنة الدراسية بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في تعديل بيانات السنة الدراسية'})
    }
})

// Delete
router.delete('/', async (req, res) => {
    try {
        await AcademicYear.findOneAndDelete({year: req.body.year})
        res.status(200).json({success: true , data: null , message: 'تم حذف السنة الدراسية بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في حذف السنة الدراسية'})
    }
})

// Active
router.put('active/:year', async (req, res) => {
    try {
        await AcademicYear.updateMany(
            { active: 1, year: { $ne: req.params.year } }, 
            { $set: { active: 0 } } 
        );
        const updatedYear = await AcademicYear.findOneAndUpdate({year: req.params.year}, {active: 1} , { new: true })
        res.status(200).json({success: true , data: updatedYear , message: 'تم تفعيل السنة الدراسية بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في تفعيل السنة الدراسية'})
    }
})

// Deactivate
router.put('deactivate/:year', async (req, res) => {
    try {
        const updatedYear = await AcademicYear.findOneAndUpdate({year: req.params.year}, {active: 0} , { new: true })
        res.status(200).json({success: true , data: updatedYear , message: 'تم إلغاء تفعيل السنة الدراسية بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: "مشكلة في إلغاء تفعيل السنة الدراسية"})
    }
})

module.exports = router