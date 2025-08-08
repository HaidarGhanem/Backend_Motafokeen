const express = require("express")
const router = express.Router()
const Teacher = require("../models/teachers")
const authorize = require("../functions/authorize")

// Create
router.post("/", async (req, res) => {
    try {
        const { name , subject , phone_number , nationality , city , certification , availability , salary , days_off } = req.body
        const teacher = new Teacher({ name , subject , phone_number , nationality , city , certification , availability , salary , days_off })
        await teacher.save()
        res.status(201).json({success: true , data: teacher , message: "تم إنشاء الأستاذ بنجاح"})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: "مشكلة في إنشاء الأستاذ"})
    }
    
})

// Read All Teachers
router.get("/", async (req, res) => {
    try {
        const teachers = await Teacher.find()
        res.status(200).json({success: true , data: teachers , message: "تم استدعاء بيانات الأساتذة بنجاح"})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: "مشكلة في استدعاء بيانات الأساتذة"})
    }
})

// Read One Teacher
router.get("/:id", async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
        res.status(200).json({success: true , data: teacher , message: "تم استدعاء بيانات الأستاذ بنجاح"})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: "مشكلة في استدعاء بيانات الأستاذ"})
    }
})

// Update
router.put("/:id", async (req, res) => {
    try {
        const updatedTeacher = await Teacher.findByIdAndUpdate(req.params.id, req.body , { new: true })
        res.status(200).json({success: true , data: updatedTeacher , message: "تم تعديل بيانات الأستاذ بنجاح"})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: "مشكلة في تعديل بيانات الأستاذ"})
    }
})

// Delete
router.delete("/:id", async (req, res) => {
    try {
        await Teacher.findByIdAndDelete(req.params.id)
        res.status(200).json({success: true , data: null , message: "تم حذف الأستاذ بنجاح"})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: "مشكلة في حذف الأستاذ"})
    }
})

// Active
router.put("active/:id", async (req, res) => {
    try {
        const updatedTeacher = await Teacher.findByIdAndUpdate(req.params.id, {availability: 1} , { new: true })
        res.status(200).json({success: true , data: updatedTeacher , message: "تم تفعيل الأستاذ بنجاح"})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: "مشكلة في تفعيل الأستاذ"})
    }
})

// Deactivate
router.put("deactivate/:id", async (req, res) => {
    try {
        const updatedTeacher = await Teacher.findByIdAndUpdate(req.params.id, {availability: 0} , { new: true })
        res.status(200).json({success: true , data: updatedTeacher , message: "تم إلغاء تفعيل الأستاذ بنجاح"})
    } catch (error) {
        res.status(500).json({success: false , data: error.message , message: "مشكلة في إلغاء تفعيل الأستاذ"})
    }
})

module.exports = router