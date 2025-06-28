const express = require('express')
const crypto = require('crypto')
const path = require('path')
const { promisify } = require('util');
const jwt = require('jsonwebtoken')
const exec = promisify(require('child_process').exec);
const router = express.Router()
const Class = require('../models/classes')
const Subclass = require('../models/subclasses')
const Student = require('../models/students')
const JWT_SECRET = 'almotafokeen'

function generateCode(){
    return crypto.randomInt(10000,99999).toString()
}
function pythonPath(){
    return path.join(__dirname, '../functions/Email.py')
}
const getModelByRole = (role) => {
    const roleModelMap = {
        'admin': Admin,
        'owner': Owner,
        'student': Student
    };
    return roleModelMap[role];
};



router.post('/login' , async(req,res)=>{
        try 
        {
            const { identifier , password } = req.body
            const user = await Student.findOne({identifier})
            if(!user || password != user.password)
                {
                return ({message: 'رقم المعرف أو كلمة السر خاطئة'})
                }
    
            const token = jwt.sign({id: user._id , role: user.role }, JWT_SECRET , {expiresIn: '72h'})
            const className = await Class.findOne({_id: user.classId})
            const subclassName = await Subclass.findOne({_id: user.subclassId})
    
            req.session.user = {
                id: user._id,
                role: user.role,
                class: user.classId,
                subclass: user.subclassId,
                token: token,
                subclassName: subclassName.name,
                className: className.name,
                presence: user.presence,
                absence: user.absence,
                average: user.average
            }

            const result = ({
                token: token,
                user: {
                    id: user._id,
                    name: `${user.firstName} ${user.lastName}`,
                    role: user.role,
                    class: user.classId,
                    subclass: user.subclassId,
                    subclassName: subclassName.name,
                    className: className.name,
                    presence: user.presence,
                    absence: user.absence,
                    average: user.average
                },
            })
            res.status(200).send({success: true , data: result , message: 'تم تسجيل الدخول بنجاح'})
        } catch (error) {
            console.log(error.message)
            res.status(500).send({success: false , data: error.message , message: 'خطأ بتسجيل الدخول'})
        }
    }
)

router.post('/logout' , async(req,res)=>{
    req.session.destroy(err => {
        if(err){
            return res.status(500).json({success: false , data: err.message, message: 'خطأ بتسجيل الخروج'})
        }
        return res.status(200).json({success: true , data: null , message: 'تم تسجيل الخروج بنجاح'})
    })
})

router.post('/code/:id' , async(req,res)=>{
    try {
        const user = await Student.findOne({identifier: req.params.id})
        const userEmail = user.email
        
        const verificationCode = generateCode();
        const expiresAt = Date.now() + 15 * 60 * 1000;

        // if (!req.session.user || !req.session.user.token) {
        //     return res.status(401).json({ success: false, message: 'Unauthorized session' });
        // }

        req.session.verificationCode = req.session.verificationCode || {};
        req.session.verificationCode[userEmail] = {
            code: verificationCode,
            expiresAt
        };

        const pythonScriptPath = pythonPath();
        
        const { stdout, stderr } = await exec(`python ${pythonScriptPath} "${userEmail}" "${verificationCode}"`);
        
        if (stderr) {
            console.error('Python script error:', stderr);
            throw new Error('Failed to send verification code');
        }

        res.status(200).json({ success: true, message: 'تم إرسال كود التحقق إلى البريد الالكتروني' }) ;
    } catch (error) {
        console.error('SendVerificationCode error:', error);
        res.status(500).json({success: false, message:'فشل إرسال كود التحقق، يرجى المحاولة لاحقاً'});
    }
})

router.post('/verify/:id' , async(req,res)=>{
    try {
        const user = await Student.findOne({identifier: req.params.id})
        const userEmail = user.email
        const { code } = req.body
        if (!code) throw new Error('Verification code is required');

        const storedCode = req.session.verificationCode?.[userEmail];
        
        if (!storedCode || storedCode.expiresAt < Date.now()) {
            throw new Error('Invalid or expired verification code');
        }

        if (storedCode.code !== code) {
            throw new Error('Invalid verification code');
        }

        res.status(200).json({ success: true, message: 'تمت المصادقة' });
    } catch (error) {
        console.error('VerifyCode error:', error.message);
        res.status(500).json({success: false, message:'فشل في تحقق المصادقة'});
    }
})

router.post('/change/:id' , async(req,res)=>{
    try {   
            const { newPassword } = req.body
            if (!newPassword) {
                throw new Error('Password Invalid');
            }

            await Student.findOneAndUpdate(
                { identifier: req.params.id}, 
                { password: newPassword }
            );

            const user = await Student.findOne({identifier: req.params.id})
            const userEmail = user.email
    
            if (req.session.verificationCode?.[userEmail]) {
                delete req.session.verificationCode[userEmail];
            }
    
            res.status(200).json({ success: true, message: 'تم تغيير كلمة السر بنجاح' });
        } catch (error) {
            res.status(500).json({ success: false, message:'فشل في تغيير كلمة السر'})
        }
})

module.exports = router