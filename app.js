require('dotenv').config()

const express = require('express')
const cors = require('cors')
const session = require('express-session')
const {connectDB} = require('./config/database')

const app = express()
const PORT = process.env.PORT || 3000

//Database Connection
connectDB()

//Session Initialization
app.use(
  session({
    secret: process.env.PRIVATE_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: 'none', // allow cross-site cookies
    },
  })
);

//Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//Routes
app.use('/api/auth' , require('./routes/auth'))
app.use('/api/exams' , require('./routes/exams'))
app.use('/api/schedule' , require('./routes/schedule'))
app.use('/api/activity' , require('./routes/activity'))
app.use('/api/posts' , require('./routes/posts'))
app.use('/api/top' , require('./routes/top'))
app.use('/api/absence' , require('./routes/absence'))
app.use('/api/olympics' , require('./routes/olympics'))


//Dashboard
app.use('/dashboard/auth' , require('./dashboard/auth'))
app.use('/dashboard/admins' , require('./dashboard/owner'))
app.use('/dashboard/years' , require('./dashboard/years'))
app.use('/dashboard/schedule' , require('./dashboard/schedule'))
app.use('/dashboard/posts' , require('./dashboard/posts'))
app.use('/dashboard/students' , require('./dashboard/students'))
app.use('/dashboard/subjects' , require('./dashboard/subjects'))
app.use('/dashboard/subclasses' , require('./dashboard/subclasses'))
app.use('/dashboard/classes' , require('./dashboard/classes'))
app.use('/dashboard/activities' , require('./dashboard/activities'))
app.use('/dashboard/marks' , require('./dashboard/marks'))
app.use('/dashboard/absence' , require('./dashboard/absence'))
app.use('/dashboard/certifications' , require('./dashboard/certifications'))
app.use('/dashboard/teachers' , require('./dashboard/teachers'))
app.use('/dashboard/info' , require('./dashboard/info'))
app.use('/dashboard/olympics' , require('./dashboard/olympic'))
app.use('/dashboard/web' , require('./dashboard/web'))
app.use('/dashboard/owner' , require('./dashboard/owner'))
app.use('/dashboard/employees' , require('./dashboard/employees'))
app.use('/dashboard/promotions' , require('./dashboard/promotions'))

app.listen(PORT, () => {
    console.log(`Server is running on PORT : ${PORT}`)
})
