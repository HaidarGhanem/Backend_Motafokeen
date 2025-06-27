const express = require('express')
const router = express.Router()
const Subclass = require('../models/academic/subclasses')
const Class = require('../models/academic/classes')
const authorize = require('../functions/authorize')

// Create
router.post('/', async (req, res) => {
    try {
        const className = await Class.findOne({name : req.body.class})
        const newSubclass = new Subclass({
            name: req.body.name,
            classId : className._id
        })
        await newSubclass.save()
        res.status(201).json({success: true , data: newSubclass , message: 'تم إنشاء الشعبة بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في إنشاء الشعبة'})
    }
})

// Read all subclasses
router.post('/all', async (req, res) => {
    try {
        const className = await Class.findOne({name : req.body.class})
        const subclasses = await Subclass.find({ classId: className._id }).populate('classId');
        res.status(200).json({success: true , data: subclasses , message: 'تم استدعاء جميع الشعب للصف بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في استدعاء جميع الشعب للصف'})
    }
})

// Read subclass for a class
router.get('/class', async (req, res) => {
    try {
        const className = await Class.findOne({name : req.body.class})
        const subclass = await Subclass.find({name: req.body.subclass , classId: className._id }).populate('classId');
        res.status(200).json({success: true , data: subclass , message: 'تم استدعاء الشعبة المحددة للصف المطلوب'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في استدعاء الشعبة المحددة'})
    }
})

// Update
router.put('/:name', async (req, res) => {
    try {
        const updatedSubclass = await Subclass.findOneAndUpdate({name: req.params.name}, req.body, { new: true })
        res.status(201).json({success: true , data: updatedSubclass , message: 'تم تعديل بيانات الشعبة بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في تعديل بيانات الشعبة'})
    }
})

// Delete
router.delete('/', async (req, res) => {
    try {
        await Subclass.findOneAndDelete({name: req.body.name})
        res.status(201).json({success: true , data: null , message: 'تم حذف الشعبة بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في حذف الشعبة'})
    }
    
})

module.exports = router