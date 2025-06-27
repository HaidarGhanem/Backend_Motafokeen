const express = require('express')
const router = express.Router()
const AcademicYear = require('../models/academic/year')
const authorize = require('../functions/authorize')

// Create
router.post('/', async (req, res) => {
    try {
        const { year , database , startDate , endDate } = req.body
        const academicYear = new AcademicYear({ year , database , startDate , endDate })
        await academicYear.save()
        res.status(201).json({success: true , data: academicYear , message: 'تم إنشاء السنة الدراسية بنجاح'})
    } catch (error) {
        console.log({success: false , data: error.message , message: 'مشكلة في إنشاء السنة الدراسية'})
    }
    
})

// Read All Years
router.get('/', async (req, res) => {
    try {
        const years = await AcademicYear.find()
        res.status(200).json({success: true , data: years , message: 'تم استدعاء بيانات السنوات الدراسية بنجاح'})
    } catch (error) {
        console.log({success: false , data: error.message , message: 'مشكلة في استدعاء بيانات السنوات الدراسية'})
    }
})

// Update
router.put('/:year', async (req, res) => {
    try {
        const updatedYear = await AcademicYear.findOneAndUpdate({year: req.params.year}, req.body , { new: true })
        res.status(200).json({success: true , data: updatedYear , message: 'تم تعديل بيانات السنة الدراسية بنجاح'})
    } catch (error) {
        console.log({success: false , data: error.message , message: 'مشكلة في تعديل بيانات السنة الدراسية'})
    }
})

// Delete
router.delete('/', async (req, res) => {
    try {
        await AcademicYear.findOneAndDelete({year: req.body.year})
        res.status(200).json({success: true , data: null , message: 'تم حذف السنة الدراسية بنجاح'})
    } catch (error) {
        console.log({success: false , data: error.message , message: 'مشكلة في حذف السنة الدراسية'})
    }
})

module.exports = router