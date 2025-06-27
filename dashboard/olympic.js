const express = require('express');
const router = express.Router()
const { Olympics } = require('../models/academic/olympics');

// Create (POST) - Add a new Olympics record
router.post('/', async (req, res) => {
    try {
        const { name, class: className, level, nextdate, teacher, achievements, skills } = req.body;
        
        const olympics = new Olympics({
            name,
            class: className,
            level,
            nextdate,
            teacher,
            achievements: achievements || [],
            skills: skills || []
        });

        const savedOlympics = await olympics.save();
        res.status(201).json(savedOlympics);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})

// Read (GET) - Get all Olympics records
router.get('/all' , async (req, res) => {
    try {
        const olympics = await Olympics.find();
        res.json(olympics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

// Read (GET) - Get a single Olympics record by ID
router.get('/', async (req, res) => {
    try {
        const olympics = await Olympics.findById(req.params.id);
        if (!olympics) {
            return res.status(404).json({ message: 'Olympics record not found' });
        }
        res.json(olympics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

// Update (PUT) - Update an Olympics record
router.put('/:id', async (req, res) => {
    try {
        const { name, class: className, level, nextdate, teacher, achievements, skills } = req.body;
        
        const updatedOlympics = await Olympics.findByIdAndUpdate(
            req.params.id,
            {
                name,
                class: className,
                level,
                nextdate,
                teacher,
                achievements: achievements || [],
                skills: skills || []
            },
            { new: true, runValidators: true }
        );

        if (!updatedOlympics) {
            return res.status(404).json({ message: 'Olympics record not found' });
        }
        res.json(updatedOlympics);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
})

// Delete (DELETE) - Delete an Olympics record
router.delete('/:id', async (req, res) => {
    try {
        const deletedOlympics = await Olympics.findByIdAndDelete(req.params.id);
        if (!deletedOlympics) {
            return res.status(404).json({ message: 'Olympics record not found' });
        }
        res.json({ message: 'Olympics record deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

module.exports = router;