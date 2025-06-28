const express = require('express')
const router = express.Router()
const Activity = require('../models/activity')
const easynest = require('easynest')

router.get('/', async (req, res) => {
    try {
        const result = await easynest.from(Activity).many()
        res.status(200).json(result)
    } catch (error) {
        res.json({ error: error.message })
    }
})

// Student participation endpoint
router.put('/', async (req, res) => {
    try {
        const { phoneNumber, activityId} = req.body;
        const userId = req.session.user.id
        // Validate required fields
        if (!phoneNumber || !activityId ) {
            return res.status(400).json({ 
                success: false,
                message: 'يجب إدخال رقم الموبايل ومعرف النشاط ومعرف الطالب'
            });
        }

        // Verify activity exists
        const activityExists = await Activity.exists({ _id: activityId });
        if (!activityExists) {
            return res.status(404).json({ 
                success: false,
                message: 'النشاط غير موجود'
            });
        }
        // Check if already participated
        const alreadyParticipated = await Activity.findOne({
            _id: activityId,
            'members.students': userId
        });

        if (alreadyParticipated) {
            return res.status(400).json({ 
                success: false,
                message: 'سبق المشاركة في هذا النشاط'
            });
        }

        // Add student to activity
        const updatedActivity = await Activity.findByIdAndUpdate(
            activityId,
            {
                $push: {
                    members: {
                        students: userId,
                        phoneNumber,
                        joinedAt: new Date()
                    }
                }
            },
            { new: true }
        ).populate({
            path: 'members.students',
            select: 'firstName middleName lastName identifier picture'
        });

        return res.status(200).json({
            success: true,
            message: 'تمت المشاركة بنجاح',
            data: {
                activity: updatedActivity,
                member: {
                    student: updatedActivity.members.find(m => m.students._id.toString() === userId).students,
                    phoneNumber,
                    joinedAt: new Date()
                }
            }
        });

    } catch (error) {
        console.error('Error in activity participation:', error);
        return res.status(500).json({ 
            success: false,
            message: 'خطأ في الخادم',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router