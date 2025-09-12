const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
    firstName: { 
        type: String, 
        required: true 
    },
    middleName: { 
        type: String, 
        required: true 
    },
    secondMiddleName: {
        type: String,
        required: true
    },
    lastName: { 
        type: String, 
        required: true 
    },
    picture: { 
        type: String,
        default: ''
    },
    email: { 
        type: String,
        required: false
    },
    password: { 
        type: String, 
        required: true 
    },
    classId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Class', required: true 
    },
    subclassId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Subclass', required: true 
    },
    identifier: { 
        type: String, 
        unique: true, 
        required: true 
    }, 
    academicYearId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'AcademicYear', required: true 
    },
    role: { 
        type: String, 
        required: true 
    },
    presence: {
        type: Number,
        default: 0
    },
    father_name: {
        type: String,
        default: '',
        required: false
    },
    mother_name: {
        type: String,
        default: '',
        required: false
    },
    absence: {
        type: Number,
        default: 0
    },
    nationality: {
        type: String,
        default: "عربي سوري"
    },
    gender: {
        type: String
    },
    birthDate: {
        type: Date
    },
    city: {
        type: String
    },
    certificates: [
        {
        name: String,
        data: Buffer,
        contentType: String,
        uploadedAt: { type: Date, default: Date.now }
        }
    ],
    average: {
        type: Number,
        default: 0
    },
    failedSubjects: {
        type: Number,
        default: 0
    },
    fcmToken: {
    type: String, 
    default: '' 
    }
} ,{ timestamps: true })

// Update average method
studentSchema.methods.updateAverage = async function() {
    const Marks = mongoose.model('Marks')
    this.average = await Marks.calculateStudentAverage(this._id)
    await this.save()
    return this.average
}

const Student = mongoose.model('Student', studentSchema)
module.exports = Student