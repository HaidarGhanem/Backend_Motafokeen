const mongoose = require('mongoose')

const marksSchema = new mongoose.Schema({
    verbal: { 
        type: Number, 
        default: 0 
    },
    homeworks: { 
        type: Number, 
        default: 0 
    },
    activities: { 
        type: Number, 
        default: 0 
    },
    quiz: {  
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
    finalTotal: { 
        type: Number, 
        default: 0 
    },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
})


marksSchema.pre('save', function(next) {
   
    const verbalWeighted     = this.verbal * 0.10
    const homeworksWeighted  = this.homeworks * 0.20
    const activitiesWeighted = this.activities * 0.20
    const quizWeighted       = this.quiz * 0.20

    this.total = verbalWeighted + homeworksWeighted + activitiesWeighted + quizWeighted

    this.finalTotal = (this.total) + (this.finalExam * 0.40)

    next()
})


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


async function updateStudentAverage(studentId) {
    const Student = mongoose.model('Student')
    const student = await Student.findById(studentId)
    
    if (student) {
        await student.updateAverage()
    }
}


marksSchema.statics.calculateStudentAverage = async function(studentId) {
    const marks = await this.find({ studentId })
    
    if (!marks || marks.length === 0) return 0
    
    const totalSum = marks.reduce((sum, mark) => sum + mark.finalTotal, 0)
    const average = totalSum / marks.length
    return Math.round(average * 100) / 100 
}


const Marks = mongoose.model('Marks', marksSchema)
module.exports = Marks
