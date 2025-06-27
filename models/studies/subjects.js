const mongoose = require('mongoose')

const subjectSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    semester: { 
        type: Number, 
        required: true 
    },
    classId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', 
        required: true 
    
    },
    marks: { 
        type: [{
            marks: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'Marks' 
            }
        }], 
        default: [] 
    }
})



const Subject = mongoose.model('Subject', subjectSchema)
module.exports = Subject
