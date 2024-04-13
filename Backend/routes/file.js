const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs')

// Create Router
const router = express.Router();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/fileUploadDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Define schema for file model
const fileSchema = new mongoose.Schema({
    filename: String,
    contentType: String,
    data: Buffer,
    size: String,
    uniqueWordDict: Object,
});

const File = mongoose.model('File', fileSchema);

// Set up multer storage
const storage = multer.memoryStorage();
const upload = multer({ storage }).array('files', 10);

// Upload route
router.post('/upload', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }
        try {
            const files = req.files;
            const uploadPromises = files.map(async file => {
                const { originalname, mimetype, buffer, size, encoding } = file;
                let newFile = new File({
                    filename: originalname,
                    contentType: mimetype,
                    data: buffer,
                    size: size,
                    uniqueWordDict: {}
                });
                newFile = await analyzeFile(newFile);
                await newFile.save();
            });
            await Promise.all(uploadPromises);
            res.send('Files uploaded successfully');
        } catch (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
        }
    });
});

async function analyzeFile(file){
    // Convert the buffer to a string using appropriate encoding (e.g., 'utf-8')
    try {
        const fileString = file.data.toString('utf-8').split(' ');
        let wordCounts = new Object();
        for(let i=0; i<fileString.length; i++){
            wordCounts[fileString[i]] = (wordCounts[fileString[i]] ? wordCounts[fileString[i]] : 0)+1;
        }
        file.uniqueWordDict = wordCounts;
        return file;
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
    
}

module.exports = router;