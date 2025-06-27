const easynest = require('easynest')
const express = require('express')
const router = express.Router()
const Student = require('../models/users/students');
const Marks = require('../models/studies/marks');

router.get('/', async(req,res)=>{
    try {
        // First, find Haidar's student record
        const haidar = await easynest.from(Student)
        .find({ firstName: 'Haidar' })
        .select(['_id', 'firstName', 'lastName'])
        .one();

        if (!haidar) {
        return { error: "Student Haidar not found" };
        }

        // Then find his marks for علوم (Science)
        const scienceMarks = await easynest.from(Marks)
        .find({ 
            studentId: haidar._id,
            subjectName: 'علوم' 
        })
        .select(['score', 'date'])
        .many();

        res.json({
        student: haidar,
        scienceMarks: scienceMarks
        });
    } catch (error) {
        res.json(error.message)
    }
})

module.exports = router