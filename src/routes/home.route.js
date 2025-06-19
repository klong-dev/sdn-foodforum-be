const express = require('express');
const router = express.Router();
const homeController = require('../controllers/home');

// Home routes
router.get('/', homeController.getHomePage);
router.get('/about', homeController.getAboutPage);
router.get('/contact', homeController.getContactPage);
router.post('/subscribe', homeController.subscribeToNewsletter);

module.exports = router;