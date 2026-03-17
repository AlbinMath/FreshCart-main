const express = require('express');
const router = express.Router();
const { upload } = require('../utils/cloudinary');

router.post('/', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Cloudinary returns the secure_url in `path` when using CloudinaryStorage
    res.json({ secure_url: req.file.path });
});

module.exports = router;
