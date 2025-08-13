const express = require('express')
const { Olympics } = require('../models/olympics')
const router = express.Router()

router.get('/all', async(req,res)=>{
    try {
        const result = await Olympics.find()
        res.status(200).send(result)
    } catch (error) {
        res.status(500).send({message: 'internal server error'})
    }
})

router.get('/', async(req,res)=>{
    try {
        const id = req.headers['id']
        const result = await Olympics.findById({_id : id})
        res.status(200).send(result)
    } catch (error) {
        res.status(500).send({message: 'internal server error'})
    }
})

module.exports = router