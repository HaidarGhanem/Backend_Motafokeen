// absence.model.js
const mongoose = require('mongoose')

const absenceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    verified: {
        type: Boolean
    },
    description: {
        type: String
    }
}, { timestamps: true })

const Absence = mongoose.model('Absence', absenceSchema)
module.exports = Absence