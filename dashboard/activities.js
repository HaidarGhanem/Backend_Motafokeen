const express = require('express');
const router = express.Router();
const Activity = require('../models/blog/activity');
const authorize = require('../functions/authorize'); // Assuming you have authorization

// Get all activities
router.get('/', async (req, res) => {
    try {
        const activities = await Activity.find();
        res.status(200).json({
            success: true,
            data: activities,
            message: 'تم استدعاء جميع الأنشطة بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'فشل في استدعاء جميع الأنشطة'
        });
    }
});

// Get a single activity by ID
router.get('/:id', async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);
        res.status(200).json({
            success: true,
            data: activity,
            message: 'تم استدعاء النشاط بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'فشل في استدعاء النشاط'
        });
    }
});

// Create a new activity
router.post('/', async (req, res) => {
    try {
        const newActivity = new Activity(req.body);
        const savedActivity = await newActivity.save();
        res.status(201).json({
            success: true,
            data: savedActivity,
            message: 'تم إنشاء النشاط بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'فشل في إنشاء النشاط'
        });
    }
});

// Update an activity
router.put('/:id', async (req, res) => {
    try {
        const updatedActivity = await Activity.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('members.students');
        res.status(200).json({
            success: true,
            data: updatedActivity,
            message: 'تم تعديل النشاط بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'فشل في تعديل النشاط'
        });
    }
});

// Delete an activity
router.delete('/:id', async (req, res) => {
    try {
        await Activity.findByIdAndDelete(req.params.id);
        res.status(200).json({
            success: true,
            data: null,
            message: 'تم حذف النشاط بنجاح'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'فشل في حذف النشاط'
        });
    }
});

// Get activity members with full student details
router.get('/members/:id', async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id)
            .populate({
                path: 'members.students',
                select: 'firstName middleName lastName email identifier picture classId subclassId'
            })
            .lean();

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        // Format the members data
        const formattedMembers = activity.members.map(member => ({
            student: member.students ? {
                _id: member.students._id,
                fullName: `${member.students.firstName} ${member.students.middleName} ${member.students.lastName}`,
                email: member.students.email,
                identifier: member.students.identifier,
                picture: member.students.picture,
                classId: member.students.classId,
                subclassId: member.students.subclassId
            } : null,
            phoneNumber: member.phoneNumber,
            joinedAt: member.joinedAt
        }));

        res.status(200).json({
            success: true,
            data: {
                activityTitle: activity.title,
                members: formattedMembers.filter(m => m.student !== null) // Filter out null students
            },
            message: 'Members retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch members',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


module.exports = router;