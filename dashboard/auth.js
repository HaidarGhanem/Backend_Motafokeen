const express = require('express')
const router = express.Router()
const Admin = require('../models/users/admins')
const Owner = require('../models/users/owner')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.PRIVATE_KEY

router.post('/login' , async(req,res)=>{
    try 
    {
        const {name , password , role} = req.body

        let Model 
        if(role == 'admin'){
            Model = Admin
        }
        if(role == 'owner'){
            Model = Owner
        }

        //Serching for User
        const user = await Model.findOne({name})
        if(!user || password != user.password){
            res.json({message: 'رقم المعرف أو كلمة السر خاطئة'})
        }

        //Create JWT Token
        const token = jwt.sign({id: user._id , role: user.role }, JWT_SECRET , {expiresIn: '72h'})

        //Store User in Session
        req.session.user = {
            id: user._id,
            role: user.role,
            token: token,
            name: user.name
        }

        //Result
        res.status(200).json({
            message: 'تم تسجيل الدخول بنجاح',
            token: token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                name: user.name
            }
        })

    } catch (error) {
        console.log(error.message)
    }
})

router.post('/logout' , (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: 'خطأ بتسجيل الخروج' });
        res.clearCookie('connect.sid'); // optional: name may vary
        return res.json({ message: 'تم تسجيل الخروج بنجاح' });
    });
});

router.get('/session', (req, res) => {
    if (req.session.user) {
        return res.json({ user: req.session.user });
    }
    res.status(401).json({ message: 'Not authenticated' });
});

module.exports = router