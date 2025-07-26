const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/uploadController');
const upload = require('../middleware/upload');

// POST /uploadImageCMS
router.post('/uploadImageCMS', upload.single('image'), uploadImage);

module.exports = router;
