const express = require('express');
const Web = require('../models/web');
const multer = require('multer');
const router = express.Router();
const moment = require('moment');
require('moment/locale/ar'); // Load Arabic locale

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

// Improved date formatting function
function formatPostDate(date) {
  moment.locale('ar');
  const now = moment();
  const postDate = moment(date);
  
  const diffDays = now.diff(postDate, 'days');
  
  if (diffDays === 0) {
    return `اليوم ${postDate.format('h:mm a')}`;
  } else if (diffDays === 1) {
    return `الأمس ${postDate.format('h:mm a')}`;
  } else if (diffDays <= 7) {
    return `منذ ${diffDays} أيام`;
  } else {
    return postDate.format('D MMMM YYYY [في] h:mm a');
  }
}

// Get optimized posts for carousel display
// In your web.js routes file, modify the carousel endpoint:
router.get('/carousel', async (req, res) => {
  try {
    const webPosts = await Web.find({}, { 
      'image.data': 0,  // Exclude binary data from initial query
      createdAt: 0,
      updatedAt: 0,
      __v: 0
    })
    .sort({ createdAt: -1 })
    .lean();
    
    const formattedPosts = await Promise.all(webPosts.map(async (post) => {
      const hasImage = post.image && post.image.contentType;
      return {
        id: post._id.toString(),
        title: post.title,
        description: post.content,
        date: formatPostDate(post.createdAt || post.date),
        hasImage, // Flag indicating if image exists
        writer: post.writer || 'الإدارة المدرسية'
      };
    }));

    res.status(200).json({
      success: true,
      data: formattedPosts
    });

  } catch (error) {
    console.error('Carousel error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch carousel posts'
    });
  }
});

// Serve post image (unchanged)
router.get('/:id/image', async (req, res) => {
  try {
    const post = await Web.findById(req.params.id, { image: 1 });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.image?.data) {
      return res.status(404).json({
        success: false,
        message: 'No image available for this post'
      });
    }

    res.set('Content-Type', post.image.contentType);
    res.send(post.image.data);
  } catch (error) {
    console.error('Image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get image',
      error: error.message
    });
  }
});
// Get all web posts (admin view)
router.get('/', async (req, res) => {
  try {
    const posts = await Web.find({}, { 'image.data': 0 })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: posts,
      message: 'تم استدعاء المنشورات بنجاح'
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: error.message
    });
  }
});

// Create new web post
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title, content, writer } = req.body;
    
    const postData = {
      title,
      content,
      writer: writer || 'الإدارة المدرسية'
    };

    if (req.file) {
      postData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }

    const newPost = new Web(postData);
    await newPost.save();

    const responseData = newPost.toObject();
    delete responseData.image;

    res.status(201).json({
      success: true,
      data: responseData,
      message: 'تم إنشاء المنشور بنجاح'
    });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل إنشاء المنشور',
      error: error.message
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

    const updatedPost = await Web.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const responseData = updatedPost.toObject();
    delete responseData.image;

    res.status(200).json({
      success: true,
      data: responseData,
      message: 'تم تحديث المنشور بنجاح'
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل تحديث المنشور',
      error: error.message
    });
  }
});

// Delete web post
router.delete('/:id', async (req, res) => {
  try {
    const deletedPost = await Web.findByIdAndDelete(req.params.id);
    
    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم حذف المنشور بنجاح'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل حذف المنشور',
      error: error.message
    });
  }
});

module.exports = router;