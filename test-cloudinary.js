require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Test Cloudinary configuration
console.log('CLOUDINARY_URL from env:', process.env.CLOUDINARY_URL);

// Configure Cloudinary
cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
});

// Test the configuration
console.log('Cloudinary config:', cloudinary.config());

// Try to upload our test image
const uploadTest = async () => {
    try {
        const result = await cloudinary.uploader.upload('./test-image.png', {
            folder: 'foodforum-posts',
            public_id: 'test_upload_' + Date.now()
        });
        console.log('Upload successful:', result.secure_url);
    } catch (error) {
        console.error('Upload failed:', error.message);
    }
};

uploadTest();
