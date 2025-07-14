const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'foodforum-posts',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            public_id: 'post_' + Date.now() + '_' + Math.round(Math.random() * 1E9),
            transformation: [
                { width: 1200, height: 800, crop: 'limit' },
                { quality: 'auto:good' }
            ]
        };
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

module.exports = {
    cloudinary,
    upload
};
