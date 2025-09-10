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
    result: {
        type: String,
        enum: ['holding', 'passed', 'failed'],
        default: 'holding'
    },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
}, { timestamps: true })

// Calculate totals and result before saving
marksSchema.pre('save', function(next) {
    const verbalWeighted     = this.verbal * 0.10
    const homeworksWeighted  = this.homeworks * 0.20
    const activitiesWeighted = this.activities * 0.20
    const quizWeighted       = this.quiz * 0.20

    this.total = verbalWeighted + homeworksWeighted + activitiesWeighted + quizWeighted
    this.finalTotal = this.total + (this.finalExam * 0.40)

    // Set result
    if (!this.finalExam || this.finalExam === 0) {
        this.result = 'holding'
    } else if (this.finalTotal >= 50) {
        this.result = 'passed'
    } else {
        this.result = 'failed'
    }

    next()
})

// Ensure result is updated on update
marksSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate()

    if (update.finalExam !== undefined) {
        const verbal = update.verbal ?? this._update.verbal ?? 0
        const homeworks = update.homeworks ?? this._update.homeworks ?? 0
        const activities = update.activities ?? this._update.activities ?? 0
        const quiz = update.quiz ?? this._update.quiz ?? 0
        const finalExam = update.finalExam ?? this._update.finalExam ?? 0

        const total = verbal * 0.10 + homeworks * 0.20 + activities * 0.20 + quiz * 0.20
        const finalTotal = total + (finalExam * 0.40)

        if (!finalExam || finalExam === 0) {
            update.result = 'holding'
        } else if (finalTotal >= 50) {
            update.result = 'passed'
        } else {
            update.result = 'failed'
        }

        update.total = total
        update.finalTotal = finalTotal
    }

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
