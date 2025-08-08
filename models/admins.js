const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        required: true 
    },
    first_name:{ 
        type: String, 
        required: true 
    },
    last_name:{ 
        type: String, 
        required: true 
    },
    phone_number:{
        type: String
    },
    position:{
        type: String,
        required: true
    }
})

const Admin = mongoose.model('Admin', adminSchema)
module.exports = Admin