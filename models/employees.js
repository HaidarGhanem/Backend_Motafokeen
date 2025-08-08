const mongoose = require('mongoose')

const employeeSchema = new mongoose.Schema({
    first_name:{ 
        type: String, 
        required: true 
    },
    last_name:{ 
        type: String, 
        required: true 
    },
    salary:{
        type: Number
    },
    residence:{
        type: String
    },
    phone_number:{
        type: String
    },
    position:{
        type: String,
        required: true
    }
})

const Employee = mongoose.model('Employee', employeeSchema)
module.exports = Employee