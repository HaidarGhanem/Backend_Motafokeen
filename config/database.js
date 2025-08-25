const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false)
    const conn = await mongoose.connect(
      'mongodb+srv://haidar23ghanem:0934937147@school.iz8hbwi.mongodb.net/school',
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
