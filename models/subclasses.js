const mongoose = require('mongoose')

const subclassSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    classId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', 
        required: true },
})

const Subclass = mongoose.model('Subclass', subclassSchema)
module.exports = Subclass

