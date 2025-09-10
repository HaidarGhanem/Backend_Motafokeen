const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
    verbal: { type: Number, default: 0 },
    homeworks: { type: Number, default: 0 },
    activities: { type: Number, default: 0 },
    quiz: { type: Number, default: 0 },
    finalExam: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    finalTotal: { type: Number, default: 0 },
    result: {
        type: String,
        enum: ['holding', 'passed', 'failed'],
        default: 'holding'
    },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
}, { timestamps: true });

// Calculate totals and result
marksSchema.methods.calculateTotals = function() {
    const verbal = Number(this.verbal || 0);
    const homeworks = Number(this.homeworks || 0);
    const activities = Number(this.activities || 0);
    const quiz = Number(this.quiz || 0);
    const finalExam = Number(this.finalExam || 0);

    const total = verbal * 0.1 + homeworks * 0.2 + activities * 0.2 + quiz * 0.2;
    const finalTotal = total + finalExam * 0.4;

    let result = 'holding';
    if (finalExam) {
        result = finalTotal >= 50 ? 'passed' : 'failed';
    }

    this.total = total;
    this.finalTotal = finalTotal;
    this.result = result;
};

// Pre-save hook
marksSchema.pre('save', function(next) {
    this.calculateTotals();
    next();
});

// Pre-update hook
marksSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();
    const docToUpdate = await this.model.findOne(this.getQuery());

    const updatedData = {
        verbal: Number(update.verbal ?? docToUpdate.verbal ?? 0),
        homeworks: Number(update.homeworks ?? docToUpdate.homeworks ?? 0),
        activities: Number(update.activities ?? docToUpdate.activities ?? 0),
        quiz: Number(update.quiz ?? docToUpdate.quiz ?? 0),
        finalExam: Number(update.finalExam ?? docToUpdate.finalExam ?? 0),
    };

    const total = updatedData.verbal * 0.1 + updatedData.homeworks * 0.2 + updatedData.activities * 0.2 + updatedData.quiz * 0.2;
    const finalTotal = total + updatedData.finalExam * 0.4;

    let result = 'holding';
    if (updatedData.finalExam) result = finalTotal >= 50 ? 'passed' : 'failed';

    this.set({ ...updatedData, total, finalTotal, result });
    next();
});

// Update student average & failedSubjects
async function updateStudentStats(studentId) {
    const Student = mongoose.model('Student');
    const Marks = mongoose.model('Marks');

    const student = await Student.findById(studentId);
    if (student) {
        // Update average
        const marks = await Marks.find({ studentId });
        const totalSum = marks.reduce((sum, mark) => sum + mark.finalTotal, 0);
        student.average = marks.length ? Math.round((totalSum / marks.length) * 100) / 100 : 0;

        // Update failedSubjects count
        student.failedSubjects = marks.filter(m => m.result === 'failed').length;

        await student.save();
    }
}

// Post hooks
marksSchema.post('save', async function(doc) { await updateStudentStats(doc.studentId); });
marksSchema.post('findOneAndUpdate', async function(doc) { if (doc) await updateStudentStats(doc.studentId); });
marksSchema.post('deleteOne', { document: true, query: false }, async function(doc) { if (doc) await updateStudentStats(doc.studentId); });

const Marks = mongoose.model('Marks', marksSchema);
module.exports = Marks;
