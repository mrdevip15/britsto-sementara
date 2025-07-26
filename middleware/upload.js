const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, '../public/uploads');
        cb(null, uploadsDir); // Store files in the public/uploads directory
    },
    filename: (req, file, cb) => {
        const filePath = path.join(__dirname, '../public/uploads', file.originalname);
        // Check if the file already exists
        if (fs.existsSync(filePath)) {
            return cb(null, file.originalname); // Return the existing filename
        }
        cb(null, file.originalname); // Use the original filename
    },
});

// Validate file type and size
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
});

module.exports = upload;
