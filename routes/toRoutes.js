// routes/toRoutes.js
const express = require('express');
const { base } = require('../controllers/toController');
const { addExamCompletedHandler } = require('../controllers/userController');
const ensureAuthenticated = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/ujian/:token/:kodekategori', ensureAuthenticated, base); 
router.get('/selesai/:token/:kodekategori', ensureAuthenticated, addExamCompletedHandler); 
module.exports = router;
