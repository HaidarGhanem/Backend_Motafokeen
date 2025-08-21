const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Activity = require('../models/activity');
const easynest = require('easynest');

// List activities (unchanged)
router.get('/', async (req, res) => {
  try {
    const result = await easynest.from(Activity).many();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: 'خطأ في الخادم', error: error.message });
  }
});

// Student participation endpoint (fully rewritten)
router.put('/', async (req, res) => {
  try {
    const { phoneNumber, activityId } = req.body || {};
    const userIdRaw = req.headers['studentid'] || req.headers['student-id'];

    // Validate inputs
    if (!phoneNumber || !activityId || !userIdRaw) {
      return res.status(400).json({
        success: false,
        message: 'يجب إدخال رقم الموبايل ومعرف النشاط ومعرف الطالب'
      });
    }

    if (!mongoose.isValidObjectId(activityId)) {
      return res.status(400).json({ success: false, message: 'معرف النشاط غير صالح' });
    }
    if (!mongoose.isValidObjectId(userIdRaw)) {
      return res.status(400).json({ success: false, message: 'معرف الطالب غير صالح' });
    }

    const activityObjectId = new mongoose.Types.ObjectId(activityId);
    const studentObjectId  = new mongoose.Types.ObjectId(userIdRaw);

    // Ensure activity exists (clear 404 vs "already joined")
    const activityExists = await Activity.exists({ _id: activityObjectId });
    if (!activityExists) {
      return res.status(404).json({ success: false, message: 'النشاط غير موجود' });
    }

    const now = new Date();

    // Atomic add only if not already joined
    const updateResult = await Activity.updateOne(
      { _id: activityObjectId, 'members.students': { $ne: studentObjectId } },
      {
        $push: {
          members: {
            students: studentObjectId,
            phoneNumber,
            joinedAt: now
          }
        }
      }
    );

    if (updateResult.modifiedCount === 1) {
      // Success: fetch populated doc to return full info
      const updatedActivity = await Activity.findById(activityObjectId).populate({
        path: 'members.students',
        select: 'firstName middleName lastName identifier picture'
      });

      // Find the member we just added (handle both populated and ObjectId)
      const member = updatedActivity.members.find(m => {
        const s = m.students;
        const sid = s && (s._id ? s._id.toString() : s.toString());
        return sid === studentObjectId.toString();
      });

      return res.status(200).json({
        success: true,
        message: 'تمت المشاركة بنجاح',
        data: {
          activity: updatedActivity,
          member
        }
      });
    }

    // Not modified -> either already joined or race condition
    const alreadyJoined = await Activity.exists({
      _id: activityObjectId,
      'members.students': studentObjectId
    });

    if (alreadyJoined) {
      return res.status(400).json({ success: false, message: 'سبق المشاركة في هذا النشاط' });
    }

    // Fallback (shouldn’t happen since we checked exists)
    return res.status(404).json({ success: false, message: 'النشاط غير موجود' });

  } catch (error) {
    console.error('Error in activity participation:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في الخادم',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
