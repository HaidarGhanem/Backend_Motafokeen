const mongoose = require('mongoose')

const scheduleItemSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true
    },
    teacher: {
        type: String,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    }
})

const dailyScheduleSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true
    },
    items: [scheduleItemSchema]
})

const scheduleSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
        },
    subclassId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subclass',
        required: true
    },
    schedules: [dailyScheduleSchema]
    }, 
    { timestamps: true }
)

const Schedule = mongoose.model('Schedule', scheduleSchema)

module.exports = Schedule