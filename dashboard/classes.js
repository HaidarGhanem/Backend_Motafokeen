const express = require('express')
const router = express.Router()
const Class = require('../models/academic/classes')
const authorize = require('../functions/authorize')

// Create
router.post('/', async (req, res) => {
    try {
        const newClass = new Class({name: req.body.name})
        await newClass.save()
        res.status(201).json({success: true , data: newClass , message: 'تم إنشاء الصف بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في إنشاء الصف'})
    }
})

// Read all classes
router.get('/', async (req, res) => {
    try {
        const classes = await Class.find()
        res.status(200).json({success: true , data: classes , message: 'تم استدعاء جميع الصفوف بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في استدعاء الصفوف'})
    }
})

// Update
router.put('/:class', async (req, res) => {
    try {
        const updatedClass = await Class.findOneAndUpdate({name : req.params.class}, req.body, { new: true })
        res.status(201).json({success: true , data: updatedClass , message: 'تم تعديل الصف بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في تعديل الصف'})
    }
})

// Delete
router.delete('/', async (req, res) => {
    try {
        await Class.findOneAndDelete({name : req.body.name})
        res.status(200).json({success: true , data: null , message:'تم حذف الصف بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في حذف الصف'})
    }
})

module.exports = router