const express = require('express')
const router = express.Router()
const Teacher = require('../models/users/teachers')
const authorize = require('../functions/authorize')

// Create 
router.post('/',  async (req, res) => {
    try {
        const { name , subject} = req.body
        if(!subject){
            const teacher = new Teacher({ name })
            await teacher.save();
            res.status(201).json({success: true , data: teacher , message: 'تم إنشاء سجل المعلم بنجاح'})
        }else{
            const teacher = new Teacher({ name , subject })
            await teacher.save();
            res.status(201).json({success: true , data: teacher , message: 'تم إنشاء سجل المعلم بنجاح'})
        }
        
    } catch (error) {
        res.status(400).json({success: false , data: error.message , message: 'مشكلة في إنشاء سجل المعلم '})
    }
})

// Get all 
router.get('/', async (req, res) => {
    try {
        const teacher = await Teacher.find()
        res.status(200).json({success: true , data: teacher , message: 'تم استدعاء قائمة المعلم بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في استدعاء قائمة المعلم'})
    }
})

// Get by name
router.get('/teacher', async (req, res) => {
    try {
        const name = req.body
        const teacher = await Teacher.findOne({name})
        res.status(200).json({success: true , data: teacher , message: 'تم استدعاء قائمة المعلم بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في استدعاء قائمة المعلم'})
    }
})

// Update 
router.put('/', async (req, res) => {
    try {
        const teacher = await Teacher.findOneAndUpdate({name: req.body.name}, req.body , { new: true , runValidation: true})
        res.status(200).json({success: true , data: teacher , message: 'تم تعديل معلومات المعلم بنجاح'})
    } catch (error) {
        res.status(400).json({success: false , data: error.message , message: 'مشكلة في استدعاء قائمة المعلم'})
    }
})

// Delete 
router.delete('/', async (req, res) => {
    try {
        const {name} = req.body
        await Teacher.findOneAndDelete({name})
        res.status(200).json({success: true , data: null , message: 'تم حذف المعلم بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في حذف المعلم'})
    }
});

module.exports = router