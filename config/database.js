const mongoose = require('mongoose')


const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false)
        const conn = await mongoose.connect('mongodb://localhost:27017/finaltest')
        console.log(`connected to : ${conn.connection.host}`)
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = { connectDB }