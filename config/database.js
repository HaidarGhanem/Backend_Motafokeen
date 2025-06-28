const mongoose = require('mongoose')


const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false)
        const conn = await mongoose.connect('mongodb+srv://haidar:haidarhaidar@cluster0.n7hhyj4.mongodb.net/')
        console.log(`connected to : ${conn.connection.host}`)
    } catch (error) {
        console.log(error.message)
    }
}

module.exports = { connectDB }