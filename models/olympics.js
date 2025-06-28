const mongoose = require('mongoose');

const olympicsSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    class: {
        type: String, 
        required: true 
    },
    level: {
        type: String, 
    },
    nextdate: {
        type: Date,
    },
    teacher: {
        type: String,
    },
    achievements: [{type: String}],
    skills: [{type: String}]
});


const Olympics = mongoose.model('Olympics', olympicsSchema);

module.exports = { Olympics };