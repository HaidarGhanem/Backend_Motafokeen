const mongoose = require ('mongoose')

const webSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String
    },
    image: {
        data: Buffer,
        contentType: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    writer: {
        type: String,
        default: 'الإدارة المدرسية'
    }
},{ timestamps: true })

const Web = mongoose.model('Web', webSchema)
module.exports = Web