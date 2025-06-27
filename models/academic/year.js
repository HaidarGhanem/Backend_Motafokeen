const mongoose =  require('mongoose')

const academicYearSchema = new mongoose.Schema({
    year: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true, 
        unique: true 
    },
    database: {
        type : String , 
        required: true
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { type: Date, required: true },
})

const AcademicYear = mongoose.model('AcademicYear', academicYearSchema)
module.exports = AcademicYear