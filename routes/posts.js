const express = require('express')
const router = express.Router()
const Post = require('../models/blog/posts')

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
        res.status(200).json(posts)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error fetching posts.' })
    }
})

// Get the last (most recent) post
router.get('/last', async (req, res) => {
    try {
        const lastPost = await Post.findOne()
            .sort({ createdAt: -1 })  // Sort by date in descending order
            .limit(1)            // Only return one document

        if (!lastPost) {
            return res.status(404).json({ message: 'No posts found.' })
        }

        res.status(200).json(lastPost)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error fetching the last post.' })
    }
})

module.exports = router