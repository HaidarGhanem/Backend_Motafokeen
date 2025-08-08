const express = require('express');
const router = express.Router();
const Employee = require('../models/employees'); // adjust path if needed

// Create Employee
router.post('/', async (req, res) => {
    try {
        const employee = new Employee(req.body);
        await employee.save();

        res.status(201).json({
            success: true,
            data: employee,
            message: 'تم إنشاء سجل الموظف بنجاح'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            data: error.message,
            message: 'مشكلة في إنشاء سجل الموظف'
        });
    }
});

// Get All Employees
router.get('/', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.status(200).json({
            success: true,
            data: employees,
            message: 'تم استدعاء قائمة الموظفين بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'مشكلة في استدعاء قائمة الموظفين'
        });
    }
});

// Get Employee by Name (?first_name=...&last_name=...)
router.get('/search', async (req, res) => {
    try {
        const { first_name, last_name } = req.query;

        if (!first_name && !last_name) {
            return res.status(400).json({
                success: false,
                message: 'يرجى إدخال الاسم الأول أو الاسم الأخير في الاستعلام'
            });
        }

        const query = {};
        if (first_name) query.first_name = first_name;
        if (last_name) query.last_name = last_name;

        const employee = await Employee.findOne(query);

        res.status(200).json({
            success: true,
            data: employee,
            message: 'تم استدعاء بيانات الموظف بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'مشكلة في استدعاء بيانات الموظف'
        });
    }
});

// Update Employee (by ID)
router.put('/:id', async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'الموظف غير موجود'
            });
        }

        res.status(200).json({
            success: true,
            data: employee,
            message: 'تم تعديل بيانات الموظف بنجاح'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            data: error.message,
            message: 'مشكلة في تعديل بيانات الموظف'
        });
    }
});

// Delete Employee (by ID)
router.delete('/:id', async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'الموظف غير موجود'
            });
        }

        res.status(200).json({
            success: true,
            data: null,
            message: 'تم حذف الموظف بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'مشكلة في حذف الموظف'
        });
    }
});

module.exports = router;
