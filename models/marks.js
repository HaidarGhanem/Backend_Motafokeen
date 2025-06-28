const mongoose = require('mongoose')

const marksSchema = new mongoose.Schema({
    firstQuiz: { 
        type: Number, 
        default: 0 
    },
    secondQuiz: { 
        type: Number, 
        default: 0 
    },
    finalExam: { 
        type: Number, 
        default: 0 
    },
    total: { 
        type: Number, 
        default: 0 
    },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
})


// Calculate total before saving
marksSchema.pre('save', function(next) {
    this.total = this.firstQuiz + this.secondQuiz + this.finalExam
    next()
})

// Update student average after saving or updating marks
marksSchema.post('save', async function(doc) {
    await updateStudentAverage(doc.studentId)
})

marksSchema.post('findOneAndUpdate', async function(doc) {
    if (doc) {
        await updateStudentAverage(doc.studentId)
    }
})

marksSchema.post('deleteOne', async function(doc) {
    if (doc) {
        await updateStudentAverage(doc.studentId)
    }
})

// Helper function to update student average
async function updateStudentAverage(studentId) {
    const Student = mongoose.model('Student')
    const student = await Student.findById(studentId)
    
    if (student) {
        await student.updateAverage()
    }
}

// Static method to calculate average
marksSchema.statics.calculateStudentAverage = async function(studentId) {
    const marks = await this.find({ studentId })
    
    if (!marks || marks.length === 0) return 0
    
    const totalSum = marks.reduce((sum, mark) => sum + mark.total, 0)
    const average = totalSum / marks.length
    return Math.round(average * 100) / 100 // Round to 2 decimal places
}


const Marks = mongoose.model('Marks' , marksSchema)
module.exports = Marks