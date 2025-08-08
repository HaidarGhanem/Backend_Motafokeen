const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
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
        default: Date.now()
    },
    writer: {
        type: String,
        default: 'الإدارة المدرسية'
    }
}, { timestamps: true })

const Post = mongoose.model('Post', postSchema)
module.exports = Post