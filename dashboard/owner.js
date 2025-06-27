const express = require('express')
const router = express.Router()
const Admin = require('../models/users/admins')
const authorize = require('../functions/authorize')

// Create Admin
router.post('/',  async (req, res) => {
    try {
        const { name , password } = req.body
        const admin = new Admin({ name , password, role : 'admin'})
        await admin.save();
        res.status(201).json({success: true , data: admin , message: 'تم إنشاء الآدمن بنجاح'})
    } catch (error) {
        res.status(400).json({success: false , data: error.message , message: 'مشكلة في إنشاء الآدمن '})
    }
})

// Get all Admins
router.get('/', async (req, res) => {
    try {
        const admins = await Admin.find()
        res.status(200).json({success: true , data: admins , message: 'تم استدعاء قائمة الآدمن بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في استدعاء قائمة الآدمن'})
    }
})

// Get Admin by name
router.get('/admin', async (req, res) => {
    try {
        const name = req.body
        const admin = await Admin.findOne({name})
        res.status(200).json({success: true , data: admin , message: 'تم استدعاء قائمة الآدمن بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في استدعاء قائمة الآدمن'})
    }
})

// Update Admin
router.put('/:name', async (req, res) => {
    try {
        const admin = await Admin.findOneAndUpdate({name: req.params.name}, req.body , { new: true , runValidation: true})
        res.status(200).json({success: true , data: admin , message: 'تم تعديل معلومات الآدمن بنجاح'})
    } catch (error) {
        res.status(400).json({success: false , data: error.message , message: 'مشكلة في استدعاء قائمة الآدمن'})
    }
})

// Delete Admin
router.delete('/', async (req, res) => {
    try {
        const {name} = req.body
        await Admin.findOneAndDelete({name})
        res.status(200).json({success: true , data: null , message: 'تم حذف الآدمن بنجاح'})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: 'مشكلة في حذف الآدمن'})
    }
});

module.exports = router