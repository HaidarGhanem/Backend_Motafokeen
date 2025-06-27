const express = require('express')
const Post = require('../models/blog/posts')
const authorize = require('../functions/authorize')
const multer = require('multer')

const router = express.Router()

// Multer Configuration
const storage = multer.memoryStorage() // Store files in memory as Buffer

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else {
        cb(new Error('Only image files are allowed!'), false)
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limit file size to 5MB
    }
})

// Update the POST route
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { title, content, writer } = req.body;
        
        const postData = {
            title,
            content,
            writer: writer || 'الإدارة المدرسية'
        };

        // Only add image if it exists
        if (req.file) {
            postData.image = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        const newPost = new Post(postData);
        await newPost.save();
        
        // Don't send image data in response to reduce payload
        const responsePost = newPost.toObject();
        delete responsePost.image;
        
        res.status(201).json({
            success: true,
            data: responsePost,
            message: 'تم نشر المنشور بنجاح'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'فشل في نشر المنشور: ' + error.message
        });
    }
});

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find({}, { 'image.data': 0 }) // Exclude image data by default
        
        res.status(200).json({
            success: true,
            data: posts,
            message: 'تم استدعاء جميع المنشورات بنجاح'
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'فشل في استدعاء المنشور'
        })
    }
})

// Get post with image by ID
router.get('/:id/image', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
        
        if (!post) {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'المنشور غير موجود'
            })
        }

        if (!post.image || !post.image.data) {
            return res.status(404).json({
                success: false,
                data: null,
                message: 'لا توجد صورة لهذا المنشور'
            })
        }

        res.set('Content-Type', post.image.contentType)
        res.send(post.image.data)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'فشل في استدعاء صورة المنشور'
        })
    }
})

// Get a specific post by writer
router.get('/writer', async (req, res) => {
    try {
        const post = await Post.findOne({writer: req.body.writer}, { 'image.data': 0 })
        
        res.status(200).json({
            success: true,
            data: post,
            message: 'تم استدعاء المنشور المحدد بواسطة الكاتب بنجاح'
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'فشل استدعاء المنشور بواسطة الكاتب المحدد'
        })
    }
})

// Update the PUT route similarly
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const postId = req.params.id;
        const { title, content, writer } = req.body;
        
        const updates = {
            title,
            content,
            writer
        };

        if (req.file) {
            updates.image = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        const updatedPost = await Post.findByIdAndUpdate(postId, updates, { new: true });
        
        // Don't send image data in response
        const responsePost = updatedPost.toObject();
        delete responsePost.image;
        
        res.status(200).json({
            success: true,
            data: responsePost,
            message: 'تم تعديل المنشور بنجاح'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'فشل في تعديل المنشور: ' + error.message
        });
    }})

// Delete a post by ID
router.delete('/:id',  async (req, res) => {
    try {
        const postId = req.params.id
        await Post.findByIdAndDelete(postId)
        
        res.status(200).json({
            success: true,
            data: null,
            message: 'تم حذف المنشور بنجاح'
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            data: error.message,
            message: 'فشل في حذف المنشور'
        })
    }
})

module.exports = router