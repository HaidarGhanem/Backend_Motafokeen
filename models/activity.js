const mongoose = require ('mongoose')

const activitySchema = new mongoose.Schema({
    icon: {
        type: String
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: false
    },
    type: {
        type: String
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    members: [
        {students: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, 
        phoneNumber: { type: String },
        joinedAt: { type: Date, default: Date.now }
        }
    ]
})

const Activity = mongoose.model('Activity', activitySchema)
module.exports = Activity