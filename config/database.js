const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false)
    const conn = await mongoose.connect(
      'mongodb+srv://school:school@school.owekosq.mongodb.net/school',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    
    console.log(`Connected to MongoDB: ${conn.connection.host}`)
  } catch (error) {
    console.log('MongoDB connection error:', error.message)
  }
}

module.exports = { connectDB }
