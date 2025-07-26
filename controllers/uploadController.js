const path = require('path');
const fs = require('fs');

// Upload Controller
const uploadImage = (req, res) => {
    try {
        // Ensure a file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        // Create the URL for the uploaded file
        const imageUrl = process.env.NODE_ENV === 'development' ? `/uploads/${req.file.filename}` : `https://geniusgate.id/uploads/${req.file.filename}`;

        // Respond with the image location
        res.json({ location: imageUrl });
    } catch (error) {
        console.error('Error handling image upload:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { uploadImage };
