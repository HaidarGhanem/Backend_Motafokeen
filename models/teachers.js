const mongoose = require("mongoose")

const teacherSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        default: ''
    },
    phone_number: {
        type: String
    },
    nationality: {
        type: String,
        default: 'عربي سوري'
    },
    city: {
        type: String
    },
    certification: {
        type: String
    },
    availability: {
        type: Number,
        default: 1
    },
    salary: {
        type: Number,
    },
    days_off: {
        type: Number
    },
    classes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    subclasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subclass'
    }],
})

const Teacher = mongoose.model('Teacher', teacherSchema)
module.exports = Teacher
