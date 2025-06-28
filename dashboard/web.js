const express = require('express');
const Web = require('../models/web');
const multer = require('multer');
const router = express.Router();

// Multer configuration for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB limit
  }
});

// Create new web post
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, content, writer } = req.body;
    
    const webData = {
      title,
      content,
      writer: writer || 'الإدارة المدرسية'
    };

    if (req.file) {
      webData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    const newWeb = new Web(webData);
    await newWeb.save();

    // Don't include image data in response
    const responseData = newWeb.toObject();
    delete responseData.image;

    res.status(201).json({
      success: true,
      data: responseData,
      message: 'Web post created successfully'
    });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create web post: ' + error.message
    });
  }
});

// Get all web posts
router.get('/', async (req, res) => {
  try {
    const webPosts = await Web.find({}, { 'image.data': 0 }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: webPosts,
      message: 'Web posts retrieved successfully'
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch web posts: ' + error.message
    });
  }
});

// Get web post image
router.get('/:id/image', async (req, res) => {
  try {
    const webPost = await Web.findById(req.params.id);
    
    if (!webPost) {
      return res.status(404).json({
        success: false,
        message: 'Web post not found'
      });
    }

    if (!webPost.image || !webPost.image.data) {
      return res.status(404).json({
        success: false,
        message: 'No image found for this web post'
      });
    }

    res.set('Content-Type', webPost.image.contentType);
    res.send(webPost.image.data);
  } catch (error) {
    console.error('Image fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch web post image: ' + error.message
    });
  }
});

// Update web post
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { title, content, writer } = req.body;
    const updates = {
      title,
      content,
      writer: writer || 'الإدارة المدرسية'
    };

    if (req.file) {
      updates.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    const updatedWeb = await Web.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedWeb) {
      return res.status(404).json({
        success: false,
        message: 'Web post not found'
      });
    }

    // Don't include image data in response
    const responseData = updatedWeb.toObject();
    delete responseData.image;

    res.status(200).json({
      success: true,
      data: responseData,
      message: 'Web post updated successfully'
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update web post: ' + error.message
    });
  }
});

// Delete web post
router.delete('/:id', async (req, res) => {
  try {
    const deletedWeb = await Web.findByIdAndDelete(req.params.id);
    
    if (!deletedWeb) {
      return res.status(404).json({
        success: false,
        message: 'Web post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Web post deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete web post: ' + error.message
    });
  }
});

module.exports = router;